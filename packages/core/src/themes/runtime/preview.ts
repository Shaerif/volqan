/**
 * @file themes/runtime/preview.ts
 * @description ThemePreview — temporarily applies a theme without persisting,
 * for live preview in the theme manager page.
 *
 * Preview mode:
 * 1. Applies the selected theme tokens to the document.
 * 2. Records the previous theme id.
 * 3. Provides a restore() method to revert to the previous theme.
 * 4. Automatically expires after a configurable timeout.
 */

import type { VolqanTheme } from '../types.js';
import { ThemeApplicator, flattenThemeTokens, tokensToCSS } from './applicator.js';
import { themeRegistry } from './registry.js';

// ---------------------------------------------------------------------------
// ThemePreview
// ---------------------------------------------------------------------------

export interface ThemePreviewOptions {
  /**
   * Auto-restore the previous theme after this many ms.
   * Set to 0 to disable auto-restore.
   * @default 0
   */
  autoRestoreMs?: number;

  /**
   * Callback invoked when the preview is restored.
   */
  onRestore?: (restoredThemeId: string | null) => void;
}

export class ThemePreview {
  private readonly applicator: ThemeApplicator;
  private previousThemeId: string | null = null;
  private isPreviewActive = false;
  private autoRestoreTimer: ReturnType<typeof setTimeout> | null = null;

  constructor() {
    this.applicator = new ThemeApplicator({ transitionDurationMs: 150 });
  }

  /**
   * Start a preview of the given theme.
   *
   * If a preview is already active, it is replaced with the new theme.
   * The previously active theme id is preserved for restore().
   *
   * @param theme - The VolqanTheme to preview.
   * @param options - Preview options.
   */
  start(theme: VolqanTheme, options: ThemePreviewOptions = {}): void {
    const { autoRestoreMs = 0, onRestore } = options;

    // Record the previous theme (only on first start, not replacement)
    if (!this.isPreviewActive) {
      this.previousThemeId = themeRegistry.getActiveId();
    }

    this.clearAutoRestore();

    // Apply the preview theme
    this.applicator.hotSwap(theme);
    this.isPreviewActive = true;

    console.debug(`[theme-preview] Previewing theme: ${theme.id}`);

    // Set up auto-restore if requested
    if (autoRestoreMs > 0) {
      this.autoRestoreTimer = setTimeout(() => {
        this.restore();
        onRestore?.(this.previousThemeId);
      }, autoRestoreMs);
    }
  }

  /**
   * Restore the previously active theme, ending the preview.
   *
   * @returns The id of the theme that was restored (or null if none).
   */
  restore(): string | null {
    this.clearAutoRestore();

    if (!this.isPreviewActive) {
      return null;
    }

    const prevId = this.previousThemeId;

    if (prevId) {
      const prevTheme = themeRegistry.get(prevId);
      if (prevTheme) {
        this.applicator.hotSwap(prevTheme);
        console.debug(`[theme-preview] Restored theme: ${prevId}`);
      } else {
        this.applicator.reset();
        console.warn(`[theme-preview] Previous theme "${prevId}" not found, resetting.`);
      }
    } else {
      this.applicator.reset();
    }

    this.isPreviewActive = false;
    this.previousThemeId = null;

    return prevId;
  }

  /**
   * Generate a static CSS string for a theme preview (for iframes or SSR).
   * Does not affect the live DOM.
   *
   * @param theme - The VolqanTheme to render as CSS.
   * @returns CSS string with custom property declarations.
   */
  generatePreviewCSS(theme: VolqanTheme): string {
    return ThemeApplicator.generateCSS(theme, ':root');
  }

  /**
   * Generate an object representing the visual diff between two themes.
   * Useful for highlighting changed tokens in the theme editor UI.
   *
   * @param from - The baseline theme.
   * @param to - The new theme to compare.
   * @returns Map of token keys to { from, to } value pairs.
   */
  static diff(
    from: VolqanTheme,
    to: VolqanTheme,
  ): Record<string, { from: string; to: string }> {
    const fromTokens = flattenThemeTokens(from);
    const toTokens = flattenThemeTokens(to);

    const changed: Record<string, { from: string; to: string }> = {};

    const allKeys = new Set([...Object.keys(fromTokens), ...Object.keys(toTokens)]);

    for (const key of allKeys) {
      const fromVal = fromTokens[key] ?? '';
      const toVal = toTokens[key] ?? '';
      if (fromVal !== toVal) {
        changed[key] = { from: fromVal, to: toVal };
      }
    }

    return changed;
  }

  /**
   * Whether a preview is currently active.
   */
  get active(): boolean {
    return this.isPreviewActive;
  }

  /**
   * The id of the theme being previewed (null if no preview is active).
   */
  get previewThemeId(): string | null {
    return this.isPreviewActive ? this.applicator.getActiveThemeId() : null;
  }

  // ---------------------------------------------------------------------------
  // Internal helpers
  // ---------------------------------------------------------------------------

  private clearAutoRestore(): void {
    if (this.autoRestoreTimer !== null) {
      clearTimeout(this.autoRestoreTimer);
      this.autoRestoreTimer = null;
    }
  }
}

// ---------------------------------------------------------------------------
// Singleton
// ---------------------------------------------------------------------------

export const themePreview = new ThemePreview();
