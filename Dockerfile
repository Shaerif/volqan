# =============================================================================
# Volqan — Multi-stage Docker Build
# =============================================================================
# Stage 1 (deps):   Install Node.js + pnpm, install all workspace dependencies
# Stage 2 (build):  Copy source, run pnpm build, generate Prisma client
# Stage 3 (runner): Minimal production image with only the built artifacts
# =============================================================================

# ---------------------------------------------------------------------------
# Base image shared across stages
# ---------------------------------------------------------------------------
FROM node:22-alpine AS base

# Install pnpm via corepack
RUN corepack enable && corepack prepare pnpm@9.0.0 --activate

# Set working directory
WORKDIR /app

# ---------------------------------------------------------------------------
# Stage 1: Install dependencies
# ---------------------------------------------------------------------------
FROM base AS deps

# Copy workspace manifest files for dependency resolution
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml* ./

# Copy individual package manifests (pnpm needs these for workspace protocol resolution)
COPY packages/core/package.json ./packages/core/
COPY packages/admin/package.json ./packages/admin/
COPY packages/cli/package.json ./packages/cli/
COPY packages/cloud-bridge/package.json ./packages/cloud-bridge/
COPY packages/extension-sdk/package.json ./packages/extension-sdk/
COPY packages/theme-sdk/package.json ./packages/theme-sdk/

# Copy root tsconfig for build references
COPY tsconfig.json ./

# Install all dependencies (frozen lockfile for reproducible builds)
RUN pnpm install --frozen-lockfile || pnpm install --no-frozen-lockfile

# ---------------------------------------------------------------------------
# Stage 2: Build
# ---------------------------------------------------------------------------
FROM deps AS builder

# Copy all source files
COPY . .

# Generate Prisma client (if prisma schema is present)
RUN if [ -f "prisma/schema.prisma" ]; then \
      pnpm exec prisma generate; \
    fi

# Build all packages in dependency order
RUN pnpm run build

# Remove dev dependencies for a smaller image
RUN pnpm prune --prod

# ---------------------------------------------------------------------------
# Stage 3: Production runner
# ---------------------------------------------------------------------------
FROM node:22-alpine AS runner

# Install pnpm (needed for pnpm start scripts)
RUN corepack enable && corepack prepare pnpm@9.0.0 --activate

# Create non-root user for security
RUN addgroup --system --gid 1001 volqan && \
    adduser --system --uid 1001 --ingroup volqan volqan

WORKDIR /app

# Set production environment
ENV NODE_ENV=production
ENV PORT=3000
ENV ADMIN_PORT=3001

# Copy built artifacts from builder stage
COPY --from=builder --chown=volqan:volqan /app/node_modules ./node_modules
COPY --from=builder --chown=volqan:volqan /app/packages ./packages
COPY --from=builder --chown=volqan:volqan /app/package.json ./
COPY --from=builder --chown=volqan:volqan /app/pnpm-workspace.yaml ./

# Copy Prisma schema + generated client if present
COPY --from=builder --chown=volqan:volqan /app/prisma* ./prisma/

# Create upload directory
RUN mkdir -p /app/public/uploads && chown -R volqan:volqan /app/public

# Switch to non-root user
USER volqan

# Expose application ports
EXPOSE 3000
EXPOSE 3001

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=10s --retries=3 \
  CMD wget -qO- http://localhost:3000/api/health || exit 1

# Start the application
CMD ["node", "packages/core/dist/index.js"]
