/**
 * @file database/index.ts
 * @description Barrel export for the Volqan database layer.
 *
 * @example
 * ```ts
 * import { db, runMigrations, seed } from '@volqan/core/database';
 * ```
 */

// Prisma client singleton
export { db, connectDb, disconnectDb } from './client.js';
export { default as prisma } from './client.js';

// Migration utilities
export {
  runMigrations,
  getMigrationStatus,
  generateClient,
  resetDatabase,
  MigrationError,
} from './migrations.js';
export type { MigrationStatus } from './migrations.js';

// Seed utilities
export { seed } from './seed.js';

// Re-export Prisma types for convenience so consumers don't need to
// import directly from @prisma/client
export type {
  User,
  Account,
  Session,
  ContentType,
  ContentEntry,
  Media,
  Extension,
  Theme,
  Setting,
  ApiKey,
  AuditLog,
  Installation,
  UserRole,
  AuthProvider,
  ContentStatus,
  StorageProvider,
  Prisma,
} from '@prisma/client';
