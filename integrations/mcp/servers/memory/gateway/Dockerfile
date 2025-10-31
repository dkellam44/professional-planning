FROM node:23-alpine

# Install Python for build tools
RUN apk add --no-cache python3 make g++

WORKDIR /app

# ===== BUILD GATEWAY =====
COPY integrations/mcp/servers/memory/gateway/package.json ./
RUN corepack enable && pnpm install

COPY integrations/mcp/servers/memory/gateway/src ./src
COPY integrations/mcp/servers/memory/gateway/tsconfig.json ./

RUN pnpm run build

# ===== INSTALL MEMORY MCP =====
RUN npm install -g @modelcontextprotocol/server-memory

EXPOSE 8080

# Start gateway wrapping Memory MCP server via stdio
ENV MCP_COMMAND="npx @modelcontextprotocol/server-memory"
CMD ["node", "dist/server.js"]
