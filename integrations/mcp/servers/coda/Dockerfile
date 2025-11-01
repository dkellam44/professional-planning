# ============================================================================
# Stage 1: Build
# ============================================================================
FROM node:23-alpine AS builder

ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable

WORKDIR /build

COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

COPY . /build

RUN pnpm run build

# ============================================================================
# Stage 2: Runtime (minimal)
# ============================================================================
FROM node:23-alpine

LABEL maintainer="bestviable.com"
LABEL description="Coda MCP Server - HTTP-Native Implementation"

ENV NODE_ENV=production
ENV PORT=8080
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"

WORKDIR /app

# Enable pnpm in runtime stage
RUN corepack enable

# Copy built application from builder stage
COPY --from=builder /build/package.json /build/pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile --production

COPY --from=builder /build/dist ./dist

# Health check disabled in Dockerfile (service responds to manual health checks)
# Use external monitoring (Uptime Robot, Docker health, etc.) instead
# To test: curl http://127.0.0.1:8085/health

# Run HTTP-native server
CMD ["node", "dist/http-server.js"]
