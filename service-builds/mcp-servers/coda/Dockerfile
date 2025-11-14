# Use official Node.js runtime as base image
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Install build dependencies for native modules
RUN apk add --no-cache python3 make g++

# Copy package.json (without package-lock.json for fresh install)
COPY package.json ./
COPY tsconfig.json ./

# Install dependencies
RUN npm install

# Copy source code
COPY src/ ./src/

# Build TypeScript
RUN npm run build

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S coda-mcp -u 1001 -G nodejs

# Change ownership of app directory
RUN chown -R coda-mcp:nodejs /app

# Switch to non-root user
USER coda-mcp

# Expose port
EXPOSE 8080

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:8080/health', (res) => { process.exit(res.statusCode === 200 ? 0 : 1) }).on('error', () => process.exit(1))"

# Start the application
CMD ["node", "dist/index.js"]

# Labels for nginx-proxy auto-discovery
LABEL com.nginx-proxy.virtual-host="coda.bestviable.com"
LABEL com.nginx-proxy.port="8080"
LABEL com.nginx-proxy.scheme="http"