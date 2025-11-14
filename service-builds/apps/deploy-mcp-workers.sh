#!/bin/bash
# MCP Workers Deployment Script
# This script guides through the deployment process for GitHub, Memory, and Context7 MCP workers

set -e

echo "🚀 MCP Workers Deployment Script"
echo "================================"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check prerequisites
echo "📋 Checking prerequisites..."
if ! command -v node &> /dev/null; then
    echo -e "${RED}❌ Node.js is not installed${NC}"
    exit 1
fi

if ! command -v npm &> /dev/null; then
    echo -e "${RED}❌ npm is not installed${NC}"
    exit 1
fi

if ! command -v infisical &> /dev/null; then
    echo -e "${RED}❌ Infisical CLI is not installed${NC}"
    exit 1
fi

echo -e "${GREEN}✅ All prerequisites met${NC}"

# Function to pause and wait for user input
pause() {
    echo ""
    read -p "Press Enter to continue..."
}

# Phase 1: GitHub OAuth Setup
echo ""
echo "🔐 Phase 1: GitHub OAuth Setup"
echo "=============================="
echo "1. Go to https://github.com/settings/developers"
echo "2. Click 'New OAuth App'"
echo "3. Fill in the details:"
echo "   - Application name: GitHub MCP Worker"
echo "   - Homepage URL: https://github.bestviable.com"
echo "   - Authorization callback URL: https://github.bestviable.com/oauth/callback"
echo "4. Note down the Client ID and Client Secret"
pause

# Phase 2: Infisical Setup
echo ""
echo "🔐 Phase 2: Infisical Setup"
echo "==========================="
echo "Setting up Infisical projects for secrets management..."

# Create Infisical projects
infisical project create --name github-mcp-worker || echo "Project already exists"
infisical project create --name memory-mcp-worker || echo "Project already exists"

echo ""
echo "Please enter your GitHub OAuth credentials:"
read -p "GitHub Client ID: " GITHUB_CLIENT_ID
read -s -p "GitHub Client Secret: " GITHUB_CLIENT_SECRET
echo ""

# Store secrets in Infisical
infisical secrets set GITHUB_CLIENT_ID="$GITHUB_CLIENT_ID" --project=github-mcp-worker --env=prod
infisical secrets set GITHUB_CLIENT_SECRET="$GITHUB_CLIENT_SECRET" --project=github-mcp-worker --env=prod

echo -e "${GREEN}✅ Secrets stored in Infisical${NC}"

# Phase 3: Deploy GitHub MCP Worker
echo ""
echo "🚀 Phase 3: Deploy GitHub MCP Worker"
echo "===================================="
cd workers/github-mcp-worker

echo "Installing dependencies..."
npm install

echo "Creating KV namespace..."
npx wrangler kv:namespace create OAUTH_KV || echo "KV namespace already exists"

echo "Deploying GitHub MCP Worker..."
npx wrangler deploy

echo -e "${GREEN}✅ GitHub MCP Worker deployed${NC}"

# Phase 4: Deploy Memory MCP Worker
echo ""
echo "🚀 Phase 4: Deploy Memory MCP Worker"
echo "===================================="
cd ../memory-mcp-worker

echo "Installing dependencies..."
npm install

echo "Deploying Memory MCP Worker..."
npx wrangler deploy

echo -e "${GREEN}✅ Memory MCP Worker deployed${NC}"

# Phase 5: Deploy Context7 MCP Worker
echo ""
echo "🚀 Phase 5: Deploy Context7 MCP Worker"
echo "======================================"
cd ../context7-mcp-worker

echo "Installing dependencies..."
npm install

echo "Deploying Context7 MCP Worker..."
npx wrangler deploy

echo -e "${GREEN}✅ Context7 MCP Worker deployed${NC}"

# Phase 6: Domain Configuration
echo ""
echo "🌐 Phase 6: Domain Configuration"
echo "================================"
echo "Next steps:"
echo "1. Go to Cloudflare dashboard"
echo "2. Navigate to Workers & Pages"
echo "3. For each worker:"
echo "   - Go to Settings > Triggers > Custom Domains"
echo "   - Add 'github.bestviable.com' for GitHub MCP"
echo "   - Add 'memory.bestviable.com' for Memory MCP"
echo "   - Add 'context7.bestviable.com' for Context7 MCP"
echo "4. Ensure SSL certificates are issued"
pause

# Phase 7: Testing
echo ""
echo "🧪 Phase 7: Testing"
echo "==================="
echo "Testing GitHub MCP Worker..."
curl -f https://github.bestviable.com/health || echo "Health check failed"

echo "Testing Memory MCP Worker..."
curl -f https://memory.bestviable.com/health || echo "Health check failed"

echo "Testing Context7 MCP Worker..."
curl -f https://context7.bestviable.com/health || echo "Health check failed"

echo ""
echo "Testing with MCP Inspector..."
echo "Run: npx @modelcontextprotocol/inspector https://github.bestviable.com/mcp"
echo "Run: npx @modelcontextprotocol/inspector https://memory.bestviable.com/mcp"
echo "Run: npx @modelcontextprotocol/inspector https://context7.bestviable.com/mcp"

# Phase 8: Claude Code Configuration
echo ""
echo "⚙️  Phase 8: Claude Code Configuration"
echo "====================================="
echo "Add to ~/.claude.json:"
echo ""
echo '{'
echo '  "mcpServers": {'
echo '    "github": {'
echo '      "url": "https://github.bestviable.com/mcp",'
echo '      "transport": "streamable-http"'
echo '    },'
echo '    "memory": {'
echo '      "url": "https://memory.bestviable.com/mcp",'
echo '      "transport": "streamable-http"'
echo '    },'
echo '    "context7": {'
echo '      "url": "https://context7.bestviable.com/mcp",'
echo '      "transport": "streamable-http"'
echo '    }'
echo '  }'
echo '}'

echo ""
echo -e "${GREEN}🎉 MCP Workers deployment completed!${NC}"
echo ""
echo "Next steps:"
echo "1. Configure custom domains in Cloudflare dashboard"
echo "2. Test with MCP Inspector"
echo "3. Configure Claude Code"
echo "4. Monitor usage in Cloudflare dashboard"