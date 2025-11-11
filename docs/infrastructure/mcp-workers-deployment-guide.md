# MCP Workers Deployment Guide

This guide provides step-by-step instructions for deploying GitHub and Memory MCP workers on Cloudflare Workers with Infisical secrets management.

## Prerequisites

- Node.js 18+ installed
- Cloudflare account with Workers enabled
- Infisical CLI installed (`brew install infisical`)
- GitHub account for OAuth app creation

## Phase 1: Environment Setup

### 1.1 Install Dependencies

```bash
# Install Node.js dependencies for both workers
cd workers/github-mcp-worker
npm install

cd ../memory-mcp-worker
npm install
```

### 1.2 Configure Infisical

```bash
# Login to Infisical
infisical login

# Create projects for MCP workers
infisical project create --name github-mcp-worker
infisical project create --name memory-mcp-worker
```

## Phase 2: GitHub MCP Worker Setup

### 2.1 Create GitHub OAuth App

1. Go to [GitHub Settings > Developer settings > OAuth Apps](https://github.com/settings/developers)
2. Click "New OAuth App"
3. Fill in the details:
   - **Application name**: GitHub MCP Worker
   - **Homepage URL**: https://github.bestviable.com
   - **Authorization callback URL**: https://github.bestviable.com/oauth/callback
4. Note the **Client ID** and **Client Secret**

### 2.2 Configure Secrets

```bash
# Set up GitHub MCP secrets in Infisical
cd workers/github-mcp-worker

# Create environment file from example
cp .env.example .env

# Add secrets to Infisical
infisical secrets set GITHUB_CLIENT_ID=your_client_id --project=github-mcp-worker --env=prod
infisical secrets set GITHUB_CLIENT_SECRET=your_client_secret --project=github-mcp-worker --env=prod

# Sync secrets to Wrangler
./../../infra/infisical/import_from_dotenv.sh .env github-mcp-worker prod
```

### 2.3 Deploy GitHub MCP Worker

```bash
# Deploy to Cloudflare Workers
wrangler deploy

# Create KV namespace for OAuth state
wrangler kv:namespace create OAUTH_KV
wrangler kv:namespace create OAUTH_KV --preview

# Update wrangler.toml with KV namespace IDs
```

### 2.4 Configure Custom Domain

1. Go to Cloudflare dashboard
2. Navigate to Workers & Pages > github-mcp-worker
3. Go to Settings > Triggers > Custom Domains
4. Add `github.bestviable.com`
5. Ensure SSL certificate is issued

## Phase 3: Memory MCP Worker Setup

### 3.1 Configure Secrets

```bash
# Set up Memory MCP secrets in Infisical
cd workers/memory-mcp-worker

# Create environment file from example
cp .env.example .env

# Add secrets to Infisical (optional - for external embeddings)
infisical secrets set OPENAI_API_KEY=your_openai_key --project=memory-mcp-worker --env=prod
infisical secrets set WORKERS_AI_API_KEY=your_workers_ai_key --project=memory-mcp-worker --env=prod

# Sync secrets to Wrangler
./../../infra/infisical/import_from_dotenv.sh .env memory-mcp-worker prod
```

### 3.2 Deploy Memory MCP Worker

```bash
# Deploy to Cloudflare Workers
wrangler deploy

# Durable Objects will be created automatically
```

### 3.3 Configure Custom Domain

1. Go to Cloudflare dashboard
2. Navigate to Workers & Pages > memory-mcp-worker
3. Go to Settings > Triggers > Custom Domains
4. Add `memory.bestviable.com`
5. Ensure SSL certificate is issued

## Phase 4: Testing

### 4.1 Local Testing

```bash
# Test GitHub MCP locally
cd workers/github-mcp-worker
wrangler dev

# In another terminal
npx @modelcontextprotocol/inspector http://localhost:8787/mcp

# Test Memory MCP locally
cd workers/memory-mcp-worker
wrangler dev

# In another terminal
npx @modelcontextprotocol/inspector http://localhost:8787/mcp
```

### 4.2 Production Testing

```bash
# Test GitHub MCP in production
npx @modelcontextprotocol/inspector https://github.bestviable.com/mcp

# Test Memory MCP in production
npx @modelcontextprotocol/inspector https://memory.bestviable.com/mcp

# Test health endpoints
curl https://github.bestviable.com/health
curl https://memory.bestviable.com/health
```

## Phase 5: Claude Code Integration

### 5.1 Configure Claude Code

Create or update `~/.claude.json`:

```json
{
  "mcpServers": {
    "github": {
      "url": "https://github.bestviable.com/mcp",
      "transport": "streamable-http"
    },
    "memory": {
      "url": "https://memory.bestviable.com/mcp",
      "transport": "streamable-http"
    }
  }
}
```

### 5.2 Test Integration

```bash
# Test GitHub tools
claude "Search for repositories about machine learning"

# Test Memory tools
claude "Create an entity called 'Project Alpha' of type 'software project'"
claude "Add observation to Project Alpha: Uses React and TypeScript"
claude "Search knowledge graph for 'project'"
```

## Environment Variables Reference

### GitHub MCP Worker
- `GITHUB_CLIENT_ID`: GitHub OAuth app client ID
- `GITHUB_CLIENT_SECRET`: GitHub OAuth app client secret

### Memory MCP Worker
- `OPENAI_API_KEY`: OpenAI API key for embeddings (optional)
- `WORKERS_AI_API_KEY`: Cloudflare Workers AI key (optional)

## Troubleshooting

### Common Issues

1. **401 Unauthorized**: Check GitHub OAuth credentials
2. **404 Not Found**: Verify custom domain configuration
3. **500 Internal Server Error**: Check Cloudflare Workers logs
4. **CORS Issues**: Ensure proper headers in responses

### Debug Commands

```bash
# Check Wrangler logs
wrangler tail

# Check KV storage
wrangler kv:key list --binding OAUTH_KV

# Check Durable Objects
wrangler durable-object list
```

## Security Considerations

- Never commit secrets to Git
- Use Infisical for secrets management
- Rotate OAuth tokens regularly
- Monitor API usage and rate limits

## Monitoring

- **Cloudflare Analytics**: Monitor request patterns and errors
- **GitHub API**: Track API usage and rate limits
- **Workers KV**: Monitor storage usage
- **Durable Objects**: Track storage and request metrics

## Rollback Procedure

If issues arise:

1. **Immediate rollback**:
   ```bash
   wrangler delete github-mcp-worker
   wrangler delete memory-mcp-worker
   ```

2. **Remove DNS records**:
   - Delete `github.bestviable.com` DNS record
   - Delete `memory.bestviable.com` DNS record

3. **Clean up OAuth**:
   - Delete GitHub OAuth app if needed
   - Remove MCP servers from Claude Code config