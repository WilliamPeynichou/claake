# ── Stage 1: Build ────────────────────────────────────────────────────────────
FROM node:22-slim AS builder

WORKDIR /app

# Install OpenSSL for Prisma
RUN apt-get update -y && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*

# Copy workspace manifests first (layer cache)
COPY package.json package-lock.json ./
COPY shared/package.json ./shared/
COPY backend/package.json ./backend/

# Install all workspace deps from root
RUN npm ci --workspace=shared --workspace=backend --include-workspace-root

# Copy source
COPY shared/ ./shared/
COPY backend/ ./backend/

# Generate Prisma client
RUN npm run prisma:generate --workspace=@claake/backend

# Build backend, then remove development-only dependencies
RUN npm run build --workspace=@claake/backend
RUN npm prune --omit=dev --workspaces --include-workspace-root

# ── Stage 2: Runtime ──────────────────────────────────────────────────────────
FROM node:22-slim AS runtime

WORKDIR /app

RUN apt-get update -y && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*

ENV NODE_ENV=production

# Copy production dependencies from the tested build stage
COPY --from=builder /app/node_modules ./node_modules

# Copy shared source (needed at runtime via workspace resolution)
COPY shared/ ./shared/

# Copy backend build output
COPY --from=builder /app/backend/dist ./backend/dist

# Copy Prisma schema + generated client
COPY --from=builder /app/backend/prisma ./backend/prisma
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma

EXPOSE 3001

WORKDIR /app/backend

CMD ["node", "dist/src/main.js"]
