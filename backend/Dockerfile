# ── Stage 1: Build ────────────────────────────────────────────────────────────
FROM node:20-slim AS builder

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

# Build shared then backend
RUN npm run build --workspace=@claake/shared 2>/dev/null || true
RUN npm run build --workspace=@claake/backend

# ── Stage 2: Runtime ──────────────────────────────────────────────────────────
FROM node:20-slim AS runtime

WORKDIR /app

RUN apt-get update -y && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*

ENV NODE_ENV=production

# Copy workspace manifests
COPY package.json package-lock.json ./
COPY shared/package.json ./shared/
COPY backend/package.json ./backend/

# Install production deps only
RUN npm ci --workspace=shared --workspace=backend --include-workspace-root --omit=dev

# Copy shared source (needed at runtime via workspace resolution)
COPY shared/ ./shared/

# Copy backend build output
COPY --from=builder /app/backend/dist ./backend/dist

# Copy Prisma schema + generated client
COPY --from=builder /app/backend/prisma ./backend/prisma
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma

EXPOSE 3001

WORKDIR /app/backend

CMD ["node", "dist/main.js"]
