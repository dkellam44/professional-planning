# ============================================================================
# Stage 1: Build
# ============================================================================
FROM node:23-alpine AS builder

ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable

WORKDIR /build

COPY package.json pnpm-lock.yaml ./
RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install --frozen-lockfile

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

WORKDIR /app

# Copy built application from builder stage
COPY --from=builder /build/package.json /build/pnpm-lock.yaml ./
RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install --frozen-lockfile --production

COPY --from=builder /build/dist ./dist

# Health check
HEALTHCHECK --interval=30s --timeout=5s --retries=3 --start-period=10s \
  CMD node -e "require('http').get('http://localhost:8080/health', (r) => {if (r.statusCode !== 200) throw new Error(r.statusCode)})"

# Run HTTP-native server
CMD ["node", "dist/http-server.js"]
