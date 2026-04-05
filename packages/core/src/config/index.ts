/**
 * @file config/index.ts
 * @description Barrel export for the Volqan configuration system.
 *
 * @example
 * ```ts
 * import { loadConfig, getConfig, defineConfig } from '@volqan/core/config';
 *
 * await loadConfig();
 * const { database, auth } = getConfig();
 * ```
 */

// Types
export type {
  DatabaseProvider,
  DatabaseConfig,
  OAuthProviderConfig,
  AuthConfig,
  CorsConfig,
  ServerConfig,
  StorageProviderName,
  LocalStorageConfig,
  S3StorageConfig,
  StorageConfig,
  EmailConfig,
  ExtensionsConfig,
  ThemesConfig,
  VolqanConfig,
  PartialVolqanConfig,
} from './types.js';

// Defaults
export { DEFAULT_CONFIG } from './defaults.js';

// Loader
export {
  loadConfig,
  getConfig,
  resetConfig,
  defineConfig,
} from './loader.js';
