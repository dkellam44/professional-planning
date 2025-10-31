FROM node:23-alpine

# Install Python for build tools
RUN apk add --no-cache python3 make g++ curl

WORKDIR /app

# ===== BUILD GATEWAY =====
COPY integrations/mcp/servers/firecrawl/gateway/package.json ./
RUN corepack enable && pnpm install

COPY integrations/mcp/servers/firecrawl/gateway/src ./src
COPY integrations/mcp/servers/firecrawl/gateway/tsconfig.json ./

RUN pnpm run build

# ===== INSTALL FIRECRAWL MCP =====
RUN npm install -g firecrawl-mcp

EXPOSE 8080

# Start gateway wrapping Firecrawl MCP server via stdio
ENV MCP_COMMAND="npx firecrawl-mcp"
CMD ["node", "dist/server.js"]
