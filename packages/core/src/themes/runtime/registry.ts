/**
 * @file themes/runtime/registry.ts
 * @description Theme registry — scans themes directory, loads theme manifests,
 * and maintains the list of available themes (loaded and unloaded).
 */

import { readdir, readFile } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { existsSync } from 'node:fs';
import type { VolqanTheme } from '../types.js';

// ---------------------------------------------------------------------------
// Theme manifest (discovered but not yet loaded into memory)
// ---------------------------------------------------------------------------

export interface ThemeManifest {
  /** Theme ID (e.g. "volqan/default"). */
  id: string;

  /** Display name. */
  name: string;

  /** Absolute path to the theme directory. */
  directory: string;

  /** Absolute path to the theme entry point. */
  entryPath: string;

  /** Raw manifest data. */
  raw: Record<string, unknown>;
}

// ---------------------------------------------------------------------------
// ThemeRegistry
// ---------------------------------------------------------------------------

export class ThemeRegistry {
  /** Fully loaded themes by id. */
  private readonly themes = new Map<string, VolqanTheme>();

  /** Discovered manifests (may include themes not yet loaded). */
  private readonly manifests = new Map<string, ThemeManifest>();

  /** Currently active theme id. */
  private activeThemeId: string | null = null;

  // ---------------------------------------------------------------------------
  // Scanning
  // ---------------------------------------------------------------------------

  /**
   * Scan a themes directory for available theme packages.
   *
   * Theme packages must contain either:
   * - `volqan-theme.json` manifest file
   * - `package.json` with a `"volqanTheme"` key
   *
   * @param themesDir - Absolute path to the themes directory.
   */
  async scan(themesDir: string): Promise<ThemeManifest[]> {
    const absDir = resolve(themesDir);

    if (!existsSync(absDir)) {
      console.warn(`[theme-registry] Themes directory not found: ${absDir}`);
      return [];
    }

    let entries: string[];
    try {
      const dirents = await readdir(absDir, { withFileTypes: true });
      entries = dirents
        .filter((d) => d.isDirectory() || d.isSymbolicLink())
        .map((d) => d.name);
    } catch (err) {
      console.error(`[theme-registry] Failed to scan "${absDir}":`, err);
      return [];
    }

    const discovered: ThemeManifest[] = [];

    for (const entry of entries) {
      const dir = join(absDir, entry);
      const manifest = await this.readManifest(dir);
      if (manifest) {
        this.manifests.set(manifest.id, manifest);
        discovered.push(manifest);
      }
    }

    console.info(
      `[theme-registry] Scanned ${absDir}: found ${discovered.length} theme(s)`,
    );
    return discovered;
  }

  // ---------------------------------------------------------------------------
  // Registration
  // ---------------------------------------------------------------------------

  /**
   * Register a loaded VolqanTheme.
   *
   * @param theme - The theme object to register.
   */
  register(theme: VolqanTheme): void {
    this.themes.set(theme.id, theme);
    console.debug(`[theme-registry] Registered theme: ${theme.id}@${theme.version}`);
  }

  /**
   * Unregister a theme.
   *
   * @param themeId - The id of the theme to remove.
   */
  unregister(themeId: string): void {
    this.themes.delete(themeId);
    if (this.activeThemeId === themeId) {
      this.activeThemeId = null;
    }
  }

  // ---------------------------------------------------------------------------
  // Active theme management
  // ---------------------------------------------------------------------------

  /**
   * Set the active theme.
   *
   * @param themeId - The id of the theme to activate.
   * @throws {Error} if the theme is not registered.
   */
  setActive(themeId: string): void {
    if (!this.themes.has(themeId)) {
      throw new Error(
        `[theme-registry] Cannot activate theme "${themeId}" — it is not registered.`,
      );
    }
    this.activeThemeId = themeId;
    console.info(`[theme-registry] Activated theme: ${themeId}`);
  }

  /**
   * Get the currently active VolqanTheme object.
   * Returns null if no theme is active.
   */
  getActive(): VolqanTheme | null {
    if (!this.activeThemeId) return null;
    return this.themes.get(this.activeThemeId) ?? null;
  }

  /**
   * Get the active theme id.
   */
  getActiveId(): string | null {
    return this.activeThemeId;
  }

  // ---------------------------------------------------------------------------
  // Queries
  // ---------------------------------------------------------------------------

  /** Check whether a theme is registered. */
  has(themeId: string): boolean {
    return this.themes.has(themeId);
  }

  /** Get a registered theme by id. */
  get(themeId: string): VolqanTheme | undefined {
    return this.themes.get(themeId);
  }

  /** Get all registered themes. */
  all(): VolqanTheme[] {
    return Array.from(this.themes.values());
  }

  /** Get all discovered manifests (including unloaded themes). */
  getManifests(): ThemeManifest[] {
    return Array.from(this.manifests.values());
  }

  // ---------------------------------------------------------------------------
  // Internal helpers
  // ---------------------------------------------------------------------------

  private async readManifest(dir: string): Promise<ThemeManifest | null> {
    // 1. Try volqan-theme.json
    const volqanManifestPath = join(dir, 'volqan-theme.json');
    if (existsSync(volqanManifestPath)) {
      try {
        const raw = JSON.parse(
          await readFile(volqanManifestPath, 'utf-8'),
        ) as Record<string, unknown>;
        const id = raw['id'] as string | undefined;
        const name = (raw['name'] as string | undefined) ?? id ?? 'Unknown Theme';
        const main = (raw['main'] as string | undefined) ?? 'index.js';
        if (id) {
          return { id, name, directory: dir, entryPath: join(dir, main), raw };
        }
      } catch {
        // ignore
      }
    }

    // 2. Try package.json with "volqanTheme" key
    const pkgPath = join(dir, 'package.json');
    if (existsSync(pkgPath)) {
      try {
        const pkg = JSON.parse(
          await readFile(pkgPath, 'utf-8'),
        ) as Record<string, unknown>;
        if (pkg['volqanTheme'] && typeof pkg['volqanTheme'] === 'object') {
          const thm = pkg['volqanTheme'] as Record<string, unknown>;
          const id = (thm['id'] ?? pkg['name']) as string | undefined;
          const name = (thm['name'] as string | undefined) ?? 'Unknown Theme';
          const main = (pkg['main'] as string | undefined) ?? 'index.js';
          if (id) {
            return {
              id,
              name,
              directory: dir,
              entryPath: join(dir, main),
              raw: { ...thm, version: pkg['version'] },
            };
          }
        }
      } catch {
        // ignore
      }
    }

    return null;
  }
}

// ---------------------------------------------------------------------------
// Singleton
// ---------------------------------------------------------------------------

export const themeRegistry = new ThemeRegistry();
