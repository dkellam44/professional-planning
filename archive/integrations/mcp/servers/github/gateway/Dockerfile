FROM node:23-alpine

# Install Python for build tools
RUN apk add --no-cache python3 make g++

WORKDIR /app

# ===== BUILD GATEWAY =====
COPY integrations/mcp/servers/github/gateway/package.json ./
RUN corepack enable && pnpm install

COPY integrations/mcp/servers/github/gateway/src ./src
COPY integrations/mcp/servers/github/gateway/tsconfig.json ./

RUN pnpm run build

# ===== INSTALL GITHUB MCP =====
RUN npm install -g @modelcontextprotocol/server-github

EXPOSE 8080

# Start gateway wrapping GitHub MCP server via stdio
ENV MCP_COMMAND="npx @modelcontextprotocol/server-github"
CMD ["node", "dist/server.js"]
