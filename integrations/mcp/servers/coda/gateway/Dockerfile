FROM node:23-alpine

# Install Python for build tools
RUN apk add --no-cache python3 make g++

WORKDIR /app

# ===== BUILD GATEWAY =====
# Copy gateway files
COPY integrations/mcp/servers/coda/gateway/package.json ./
RUN corepack enable && pnpm install

# Copy gateway source
COPY integrations/mcp/servers/coda/gateway/src ./src
COPY integrations/mcp/servers/coda/gateway/tsconfig.json ./

# Build gateway
RUN pnpm run build

# ===== BUILD CODA STDIO MCP SERVER =====
# Create separate directory for MCP server
RUN mkdir -p /app/mcp

# Copy Coda MCP server files
COPY integrations/mcp/servers/coda/src/package.json integrations/mcp/servers/coda/src/pnpm-lock.yaml /app/mcp/
WORKDIR /app/mcp
RUN corepack enable && pnpm install --frozen-lockfile

# Copy Coda MCP server source
COPY integrations/mcp/servers/coda/src/src ./src
COPY integrations/mcp/servers/coda/src/tsconfig.json ./

# Build Coda MCP server
RUN pnpm run build

# ===== RUNTIME =====
WORKDIR /app

EXPOSE 8080

# Start gateway, which will spawn Coda MCP server as stdio subprocess
ENV MCP_COMMAND="node /app/mcp/dist/index.js"
CMD ["node", "dist/server.js"]
