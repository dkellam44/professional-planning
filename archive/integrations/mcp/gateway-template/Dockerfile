FROM node:23-alpine

# Install Python for build tools if needed
RUN apk add --no-cache python3 make g++

WORKDIR /app

# Copy gateway files
COPY gateway/package.json gateway/pnpm-lock.yaml* ./
RUN corepack enable && pnpm install --frozen-lockfile

# Copy gateway source
COPY gateway/src ./src
COPY gateway/tsconfig.json ./

# Build gateway
RUN pnpm run build

# The MCP server (stdio) will be passed as command-line argument
# Usage: docker run ... gateway <stdio-mcp-command> [args...]
# Example: docker run ... gateway node /app/mcp/dist/index.js

EXPOSE 8080

# Default: run gateway on port 8080 wrapping stdin/stdout MCP server
# This will be overridden in docker-compose with actual command
CMD ["node", "dist/server.js"]
