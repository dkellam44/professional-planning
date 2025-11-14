FROM node:23-alpine

# Install Python + mcp-proxy wrapper
RUN apk add --no-cache python3 py3-pip
RUN pip install --break-system-packages mcp-proxy

WORKDIR /app

# Copy package files first
COPY integrations/mcp/servers/coda/src/package.json ./
COPY integrations/mcp/servers/coda/src/pnpm-lock.yaml ./

# Install dependencies
RUN corepack enable && pnpm install --frozen-lockfile

# Copy rest of source files (excluding node_modules)
COPY integrations/mcp/servers/coda/src/src ./src
COPY integrations/mcp/servers/coda/src/tsconfig.json ./
COPY integrations/mcp/servers/coda/src/.eslintrc* ./
COPY integrations/mcp/servers/coda/src/prettier* ./
COPY integrations/mcp/servers/coda/src/openapi-ts.config.ts ./

# Build
RUN pnpm build

# Run via mcp-proxy (exposes stdio MCP as HTTP/SSE on port 8080)
CMD ["mcp-proxy", "--host", "0.0.0.0", "--port", "8080", "--", "node", "dist/index.js"]
