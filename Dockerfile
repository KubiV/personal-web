# ==============================================================================
# Multi-stage Dockerfile for SvelteKit on Raspberry Pi 5 (ARM64 / AMD64)
# ==============================================================================

# --- Stage 1: Build Stage ---
FROM node:20-alpine AS builder

WORKDIR /app

# Install dependencies based on package-lock.json
COPY package*.json ./
RUN npm ci

# Copy project source files and build
COPY . .
RUN npm run build

# Remove development dependencies to keep production footprint minimal
RUN npm prune --production

# --- Stage 2: Production Runtime Stage ---
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000
ENV CONTENT_PATH=/data/content

# Copy built bundle and production dependencies from builder stage
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/build ./build

# Create mount point for content volume and set secure permissions
RUN mkdir -p /data/content && chown -R node:node /app /data/content

# Run container as unprivileged user
USER node

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://127.0.0.1:3000/ || exit 1

CMD ["node", "build/index.js"]
