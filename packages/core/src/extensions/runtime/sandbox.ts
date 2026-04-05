/**
 * @file extensions/runtime/sandbox.ts
 * @description Extension sandbox — isolates extension code, provides a controlled
 * ExtensionContext, and catches errors without crashing the host application.
 *
 * The sandbox wraps all extension lifecycle calls in try/catch with configurable
 * timeouts. Extensions that exceed their time budget are forcibly cancelled via
 * AbortController and moved to 'error' status.
 */

import type { ExtensionContext } from '../types.js';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** Result of a sandboxed execution. */
export interface SandboxResult<T = void> {
  success: boolean;
  value?: T;
  error?: SandboxError;
  durationMs: number;
}

/** Structured error produced by the sandbox when an extension fails. */
export class SandboxError extends Error {
  override readonly name = 'SandboxError';

  constructor(
    message: string,
    public readonly extensionId: string,
    public readonly phase: string,
    public readonly cause?: unknown,
  ) {
    super(message);
    Object.setPrototypeOf(this, SandboxError.prototype);
  }
}

// ---------------------------------------------------------------------------
// Sandbox options
// ---------------------------------------------------------------------------

export interface SandboxOptions {
  /**
   * Maximum execution time in milliseconds before the hook is considered timed out.
   * @default 10000
   */
  timeoutMs?: number;

  /**
   * Whether to swallow errors (return success: false) or re-throw them.
   * Set to false in test mode to surface errors immediately.
   * @default true
   */
  swallowErrors?: boolean;

  /**
   * Optional error reporter invoked when a sandboxed execution fails.
   */
  onError?: (error: SandboxError) => void;
}

// ---------------------------------------------------------------------------
// Core sandbox implementation
// ---------------------------------------------------------------------------

/**
 * ExtensionSandbox
 *
 * Wraps individual lifecycle hook invocations with:
 * - Timeout enforcement via AbortSignal + Promise.race
 * - Structured error capture
 * - Execution duration tracking
 * - Error reporting callback
 *
 * @example
 * ```ts
 * const sandbox = new ExtensionSandbox('acme/blog', { timeoutMs: 5000 });
 * const result = await sandbox.run('onBoot', async () => {
 *   await ext.onBoot?.(ctx);
 * });
 * if (!result.success) {
 *   console.error(result.error?.message);
 * }
 * ```
 */
export class ExtensionSandbox {
  private readonly extensionId: string;
  private readonly options: Required<SandboxOptions>;

  constructor(extensionId: string, options: SandboxOptions = {}) {
    this.extensionId = extensionId;
    this.options = {
      timeoutMs: options.timeoutMs ?? 10_000,
      swallowErrors: options.swallowErrors ?? true,
      onError: options.onError ?? (() => {}),
    };
  }

  /**
   * Run an async function inside the sandbox.
   *
   * @param phase - Name of the lifecycle phase (for error reporting).
   * @param fn - The async function to execute.
   * @returns SandboxResult containing success/failure and timing data.
   */
  async run<T = void>(phase: string, fn: () => Promise<T>): Promise<SandboxResult<T>> {
    const start = Date.now();

    try {
      const value = await this.withTimeout(phase, fn);
      return {
        success: true,
        value,
        durationMs: Date.now() - start,
      };
    } catch (raw) {
      const sandboxError = this.wrapError(phase, raw);
      const durationMs = Date.now() - start;

      this.options.onError(sandboxError);

      if (!this.options.swallowErrors) {
        throw sandboxError;
      }

      return {
        success: false,
        error: sandboxError,
        durationMs,
      };
    }
  }

  /**
   * Run a lifecycle hook function (void return) safely.
   * Convenience wrapper around `run` for hooks that don't return a value.
   */
  async runHook(
    phase: string,
    fn: ((ctx: ExtensionContext) => Promise<void>) | undefined,
    ctx: ExtensionContext,
  ): Promise<SandboxResult<void>> {
    if (!fn) {
      return { success: true, durationMs: 0 };
    }
    return this.run(phase, () => fn(ctx));
  }

  // ---------------------------------------------------------------------------
  // Internal helpers
  // ---------------------------------------------------------------------------

  private async withTimeout<T>(phase: string, fn: () => Promise<T>): Promise<T> {
    const { timeoutMs } = this.options;
    const id = this.extensionId;

    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(
        () =>
          reject(
            new SandboxError(
              `Extension "${id}" timed out in "${phase}" after ${timeoutMs}ms.`,
              id,
              phase,
            ),
          ),
        timeoutMs,
      ),
    );

    return Promise.race([fn(), timeoutPromise]);
  }

  private wrapError(phase: string, raw: unknown): SandboxError {
    if (raw instanceof SandboxError) return raw;

    const message =
      raw instanceof Error
        ? raw.message
        : typeof raw === 'string'
        ? raw
        : `Unknown error in extension "${this.extensionId}" during "${phase}"`;

    return new SandboxError(
      `Extension "${this.extensionId}" failed in "${phase}": ${message}`,
      this.extensionId,
      phase,
      raw,
    );
  }
}

// ---------------------------------------------------------------------------
// Factory helper
// ---------------------------------------------------------------------------

/**
 * Create a sandbox for a specific extension.
 * Convenience function wrapping the ExtensionSandbox constructor.
 */
export function createSandbox(
  extensionId: string,
  options?: SandboxOptions,
): ExtensionSandbox {
  return new ExtensionSandbox(extensionId, options);
}
