/**
 * @file api/graphql/resolvers.ts
 * @description Auto-generated GraphQL resolvers for the Volqan CMS.
 *
 * All resolvers delegate to ContentRepository and SchemaBuilder, keeping
 * the resolver layer thin and the business logic in the core modules.
 *
 * ## Usage
 *
 * ```ts
 * import { buildResolvers } from '@volqan/core/api/graphql';
 *
 * const resolvers = buildResolvers({
 *   repository,
 *   schemaBuilder,
 *   mediaManager,
 *   contentTypes,
 *   authenticate,
 *   register,
 * });
 *
 * // Pass resolvers to your GraphQL server
 * ```
 *
 * The resolver map is compatible with graphql-js, Apollo Server, Yoga, and Pothos.
 */

import { ContentStatus } from '../../content/types.js';
import type { ContentRepository } from '../../content/repository.js';
import type { SchemaBuilder } from '../../content/schema-builder.js';
import type { ContentTypeDefinition } from '../../content/types.js';
import type { GraphQLContext, ResolverMap, ListQueryArgs, AuthPayload } from './types.js';

// ---------------------------------------------------------------------------
// Builder options
// ---------------------------------------------------------------------------

/** Services required to build the resolver map. */
export interface ResolverBuilderOptions {
  /** Content CRUD repository. */
  repository: ContentRepository;
  /** Schema builder for content type management. */
  schemaBuilder: SchemaBuilder;
  /**
   * Optional media manager. If omitted, media resolvers return null.
   * Type is `unknown` to avoid a hard import cycle; cast inside resolvers.
   */
  mediaManager?: unknown;
  /**
   * List of content types to generate resolvers for.
   * Should match the content types passed to SchemaGenerator.generateSchema.
   */
  contentTypes: ContentTypeDefinition[];
  /**
   * Authentication callback used by the `login` mutation.
   * Should return a JWT token and user object or throw on failure.
   */
  authenticate?: (email: string, password: string) => Promise<AuthPayload>;
  /**
   * Registration callback used by the `register` mutation.
   * Should create the user and return a JWT token and user object.
   */
  register?: (name: string, email: string, password: string) => Promise<AuthPayload>;
  /**
   * Logout callback used by the `logout` mutation.
   * May invalidate a refresh token or server-side session.
   */
  invalidateSession?: (userId: string) => Promise<void>;
}

// ---------------------------------------------------------------------------
// Name helpers (duplicated to avoid circular imports)
// ---------------------------------------------------------------------------

function toPascalCase(slug: string): string {
  return slug
    .split(/[-_\s]/)
    .map((p) => p.charAt(0).toUpperCase() + p.slice(1).toLowerCase())
    .join('');
}

function lowerFirst(s: string): string {
  return s.charAt(0).toLowerCase() + s.slice(1);
}

// ---------------------------------------------------------------------------
// Sort string parser (shared with REST)
// ---------------------------------------------------------------------------

function parseSortString(sort?: string) {
  if (!sort) return undefined;
  return sort.split(',').map((s) => {
    s = s.trim();
    if (s.startsWith('-')) return { field: s.slice(1), direction: 'desc' as const };
    return { field: s, direction: 'asc' as const };
  });
}

// ---------------------------------------------------------------------------
// Resolver builder
// ---------------------------------------------------------------------------

/**
 * Builds a complete GraphQL resolver map from the provided services.
 * The returned map can be passed to any graphql-js compatible server.
 *
 * @param options Configuration including repository, schema builder, and callbacks.
 * @returns A resolver map keyed by type name then field name.
 */
export function buildResolvers(options: ResolverBuilderOptions): ResolverMap {
  const { repository, schemaBuilder, mediaManager, contentTypes, authenticate, register, invalidateSession } = options;

  const resolvers: ResolverMap = {
    // -----------------------------------------------------------------------
    // Query
    // -----------------------------------------------------------------------
    Query: {
      // Content types
      listContentTypes: async (_parent, _args, _ctx: GraphQLContext) => {
        return schemaBuilder.listContentTypes();
      },

      getContentType: async (_parent, args: { slug: string }, _ctx: GraphQLContext) => {
        try {
          return await schemaBuilder.getContentType(args.slug);
        } catch {
          return null;
        }
      },

      // Auth
      me: async (_parent, _args, ctx: GraphQLContext) => {
        return ctx.user ?? null;
      },

      // Media
      listMedia: async (_parent, args: { folder?: string; mimeType?: string; page?: number; perPage?: number }, _ctx: GraphQLContext) => {
        if (!mediaManager) return { data: [], meta: { total: 0, page: 1, perPage: 20, totalPages: 0 } };
        const mm = mediaManager as { findMany: (opts: unknown) => Promise<{ data: unknown[]; meta: unknown }> };
        return mm.findMany({ folder: args.folder, mimeType: args.mimeType, page: args.page ?? 1, perPage: args.perPage ?? 20 });
      },

      getMedia: async (_parent, args: { id: string }, _ctx: GraphQLContext) => {
        if (!mediaManager) return null;
        const mm = mediaManager as { findById: (id: string) => Promise<unknown> };
        try {
          return await mm.findById(args.id);
        } catch {
          return null;
        }
      },
    },

    // -----------------------------------------------------------------------
    // Mutation
    // -----------------------------------------------------------------------
    Mutation: {
      // Auth
      login: async (_parent, args: { email: string; password: string }, _ctx: GraphQLContext) => {
        if (!authenticate) throw new Error('Authentication is not configured');
        return authenticate(args.email, args.password);
      },

      register: async (_parent, args: { name: string; email: string; password: string }, _ctx: GraphQLContext) => {
        if (!register) throw new Error('Registration is not configured');
        return register(args.name, args.email, args.password);
      },

      logout: async (_parent, _args, ctx: GraphQLContext) => {
        if (ctx.user && invalidateSession) {
          await invalidateSession(ctx.user.id);
        }
        return true;
      },

      // Media
      deleteMedia: async (_parent, args: { id: string }, _ctx: GraphQLContext) => {
        if (!mediaManager) return false;
        const mm = mediaManager as { delete: (id: string) => Promise<void> };
        await mm.delete(args.id);
        return true;
      },

      moveMedia: async (_parent, args: { id: string; folder: string }, _ctx: GraphQLContext) => {
        if (!mediaManager) throw new Error('Media manager is not configured');
        const mm = mediaManager as { moveToFolder: (id: string, folder: string) => Promise<unknown> };
        return mm.moveToFolder(args.id, args.folder);
      },

      // Content Types (admin)
      createContentType: async (_parent, args: Record<string, unknown>, ctx: GraphQLContext) => {
        requireAuth(ctx);
        requireRole(ctx, 'admin');
        return schemaBuilder.createContentType({
          name: args['name'] as string,
          slug: args['slug'] as string,
          description: args['description'] as string | undefined,
          fields: args['fields'] as ContentTypeDefinition['fields'],
          settings: (args['settings'] as ContentTypeDefinition['settings']) ?? {},
        });
      },

      updateContentType: async (_parent, args: Record<string, unknown>, ctx: GraphQLContext) => {
        requireAuth(ctx);
        requireRole(ctx, 'admin');
        return schemaBuilder.updateContentType(args['slug'] as string, {
          name: args['name'] as string | undefined,
          description: args['description'] as string | undefined,
          fields: args['fields'] as ContentTypeDefinition['fields'] | undefined,
          settings: args['settings'] as ContentTypeDefinition['settings'] | undefined,
        });
      },

      deleteContentType: async (_parent, args: { slug: string; deleteEntries?: boolean }, ctx: GraphQLContext) => {
        requireAuth(ctx);
        requireRole(ctx, 'admin');
        await schemaBuilder.deleteContentType(args.slug, args.deleteEntries ?? false);
        return true;
      },
    },
  };

  // -----------------------------------------------------------------------
  // Generated resolvers for each content type
  // -----------------------------------------------------------------------

  for (const ct of contentTypes) {
    const typeName = toPascalCase(ct.slug);
    const queryName = lowerFirst(typeName);

    // ---------------------------
    // Queries
    // ---------------------------
    resolvers['Query'][`list${typeName}`] = async (
      _parent: unknown,
      args: ListQueryArgs,
      _ctx: GraphQLContext,
    ) => {
      return repository.findMany(ct.slug, {
        where: args.filter as Record<string, unknown> | undefined,
        orderBy: parseSortString(args.sort),
        page: args.page ?? 1,
        perPage: args.perPage ?? 20,
        select: args.fields?.split(',').map((f) => f.trim()),
      });
    };

    resolvers['Query'][`get${typeName}`] = async (
      _parent: unknown,
      args: { id: string },
      _ctx: GraphQLContext,
    ) => {
      try {
        return await repository.findById(ct.slug, args.id);
      } catch {
        return null;
      }
    };

    const hasSlugField = ct.fields.some((f) => f.type === 'SLUG' || f.name === 'slug');
    if (hasSlugField) {
      resolvers['Query'][`get${typeName}BySlug`] = async (
        _parent: unknown,
        args: { slug: string },
        _ctx: GraphQLContext,
      ) => {
        try {
          return await repository.findBySlug(ct.slug, args.slug);
        } catch {
          return null;
        }
      };
    }

    // ---------------------------
    // Mutations
    // ---------------------------
    resolvers['Mutation'][`create${typeName}`] = async (
      _parent: unknown,
      args: { input: Record<string, unknown> },
      ctx: GraphQLContext,
    ) => {
      requireAuth(ctx);
      return repository.create(ct.slug, args.input, ctx.user?.id);
    };

    resolvers['Mutation'][`update${typeName}`] = async (
      _parent: unknown,
      args: { id: string; input: Record<string, unknown> },
      ctx: GraphQLContext,
    ) => {
      requireAuth(ctx);
      return repository.update(ct.slug, args.id, args.input);
    };

    resolvers['Mutation'][`delete${typeName}`] = async (
      _parent: unknown,
      args: { id: string },
      ctx: GraphQLContext,
    ) => {
      requireAuth(ctx);
      await repository.delete(ct.slug, args.id);
      return true;
    };

    if (ct.settings.draftable) {
      resolvers['Mutation'][`publish${typeName}`] = async (
        _parent: unknown,
        args: { id: string },
        ctx: GraphQLContext,
      ) => {
        requireAuth(ctx);
        return repository.publish(ct.slug, args.id);
      };

      resolvers['Mutation'][`unpublish${typeName}`] = async (
        _parent: unknown,
        args: { id: string },
        ctx: GraphQLContext,
      ) => {
        requireAuth(ctx);
        return repository.unpublish(ct.slug, args.id);
      };
    }

    // ---------------------------
    // Field-level resolver for `data` flattening
    // ---------------------------
    // If consumers want to access typed fields directly on the object type
    // (e.g. `post.title` instead of `post.data.title`), add a resolver
    // for each field that reads from `entry.data`.
    resolvers[typeName] = resolvers[typeName] ?? {};
    for (const field of ct.fields) {
      if (field.type === 'PASSWORD') continue; // Never expose passwords
      resolvers[typeName][field.name] = (parent: Record<string, unknown>) => {
        const data = parent['data'] as Record<string, unknown> | undefined;
        return data?.[field.name] ?? null;
      };
    }
  }

  return resolvers;
}

// ---------------------------------------------------------------------------
// Auth guard helpers
// ---------------------------------------------------------------------------

/**
 * Throws a GraphQL-compatible error if the user is not authenticated.
 */
function requireAuth(ctx: GraphQLContext): asserts ctx is GraphQLContext & { user: NonNullable<GraphQLContext['user']> } {
  if (!ctx.user) {
    throw new GraphQLAuthError('Authentication required');
  }
}

/**
 * Throws a GraphQL-compatible error if the user does not have the required role.
 */
function requireRole(ctx: GraphQLContext, role: string): void {
  if (ctx.user?.role !== role) {
    throw new GraphQLAuthError(`This operation requires the "${role}" role`);
  }
}

// ---------------------------------------------------------------------------
// GraphQL-compatible error classes
// ---------------------------------------------------------------------------

/**
 * A GraphQL error that sets the `extensions.code` field to a machine-readable code.
 * Compatible with Apollo Server, GraphQL Yoga, and raw graphql-js.
 */
export class GraphQLAuthError extends Error {
  extensions: { code: string };

  constructor(message: string) {
    super(message);
    this.name = 'GraphQLAuthError';
    this.extensions = { code: 'UNAUTHORIZED' };
  }
}

/**
 * A GraphQL error representing a "not found" condition.
 */
export class GraphQLNotFoundError extends Error {
  extensions: { code: string };

  constructor(message: string) {
    super(message);
    this.name = 'GraphQLNotFoundError';
    this.extensions = { code: 'NOT_FOUND' };
  }
}
