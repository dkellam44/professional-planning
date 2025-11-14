# LiteLLM Integration Guide

This guide covers integrating LiteLLM with existing services in the Personal AI Memory & Control Plane.

## Overview

LiteLLM provides a unified API interface for 100+ LLM providers with BYOK (Bring Your Own Key) management. This replaces OpenRouter as the primary LLM provider while maintaining OpenRouter as a fallback.

## Service URLs

- **LiteLLM Proxy**: `https://litellm.bestviable.com`
- **Health Check**: `https://litellm.bestviable.com/health`
- **Models**: `https://litellm.bestviable.com/models`
- **Chat Completions**: `https://litellm.bestviable.com/chat/completions`

## Quick Start

1. **Deploy LiteLLM**:
   ```bash
   cd infra/apps
   ./deploy-litellm.sh deploy
   ```

2. **Configure API Keys**:
   ```bash
   cp .env.litellm.example .env.litellm
   # Edit .env.litellm with your actual API keys
   ./deploy-litellm.sh restart
   ```

## Integration Instructions

### Open WebUI Configuration

Update the Open WebUI environment variables to use LiteLLM:

```bash
# In infra/apps/docker-compose.yml
openweb:
  environment:
    - OPENAI_API_BASE_URL=https://litellm.bestviable.com
    - OPENAI_API_KEY=${LITELLM_MASTER_KEY}
```

### Archon Agents Configuration

Update Archon agents to use LiteLLM endpoints:

```yaml
# In archon configuration
llm_provider: litellm
llm_endpoint: https://litellm.bestviable.com
llm_key: ${LITELLM_MASTER_KEY}
```

### N8N Workflows

Create N8N workflows for key management:

1. **Key Rotation Workflow**: Automated rotation of API keys
2. **Usage Monitoring**: Track costs per provider
3. **Alerting**: Notify when approaching budget limits

### MCP Servers

Configure MCP servers to use LiteLLM:

```json
{
  "mcpServers": {
    "litellm": {
      "command": "node",
      "args": ["mcp-server-litellm.js"],
      "env": {
        "LITELLM_ENDPOINT": "https://litellm.bestviable.com",
        "LITELLM_KEY": "${LITELLM_MASTER_KEY}"
      }
    }
  }
}
```

## Provider Configuration

### Supported Providers

| Provider | Model Names | Environment Variable |
|----------|-------------|---------------------|
| OpenAI | gpt-4, gpt-4-turbo, gpt-3.5-turbo | OPENAI_API_KEY |
| Anthropic | claude-3-5-sonnet, claude-3-5-haiku, claude-3-opus | ANTHROPIC_API_KEY |
| Google | gemini-1.5-pro, gemini-1.5-flash | GOOGLE_API_KEY |
| Cohere | command-r-plus, command-r | COHERE_API_KEY |
| Mistral | mistral-large, mistral-medium | MISTRAL_API_KEY |

### Adding New Providers

1. Add the API key to `.env.litellm`
2. Update `litellm-config.yaml` with new provider configuration
3. Restart the service: `./deploy-litellm.sh restart`

## Monitoring & Troubleshooting

### Health Checks

```bash
# Check service health
curl https://litellm.bestviable.com/health

# Check available models
curl https://litellm.bestviable.com/models

# Test chat completion
curl -X POST https://litellm.bestviable.com/chat/completions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $LITELLM_MASTER_KEY" \
  -d '{
    "model": "gpt-3.5-turbo",
    "messages": [{"role": "user", "content": "Hello!"}]
  }'
```

### Common Issues

| Issue | Solution |
|-------|----------|
| Service not starting | Check logs: `./deploy-litellm.sh logs` |
| API key errors | Verify keys in `.env.litellm` |
| Rate limiting | Check provider quotas |
| SSL certificate issues | Wait for acme-companion to provision |

### Logs & Debugging

```bash
# View service logs
./deploy-litellm.sh logs

# Check service status
./deploy-litellm.sh status

# Restart service
./deploy-litellm.sh restart
```

## Cost Management

### Usage Tracking

LiteLLM provides built-in usage tracking:

- **Per-model costs**: Track spending by model
- **Per-key costs**: Track spending by API key
- **Daily/Monthly budgets**: Set spending limits

### Budget Alerts

Configure budget alerts in `litellm-config.yaml`:

```yaml
budget_config:
  budget_duration: 30d
  soft_budget: 100.0
  hard_budget: 200.0
```

## Security Considerations

### API Key Management

- **Encrypted storage**: All keys stored in `.env.litellm`
- **Service isolation**: Each service gets scoped access
- **Audit logging**: All API calls logged
- **Key rotation**: Automated rotation via Infisical

### Access Control

- **Master key**: Unique key for LiteLLM access
- **Provider keys**: Individual keys per LLM provider
- **Rate limiting**: Configurable per provider

## Migration from OpenRouter

### Gradual Migration

1. **Phase 1**: Deploy LiteLLM alongside OpenRouter
2. **Phase 2**: Test with non-critical workflows
3. **Phase 3**: Migrate primary services
4. **Phase 4**: Remove OpenRouter dependency

### Fallback Configuration

Keep OpenRouter as fallback:

```yaml
# In service configuration
primary_provider: litellm
fallback_provider: openrouter
```

## Advanced Configuration

### Custom Models

Add custom models to `litellm-config.yaml`:

```yaml
model_list:
  - model_name: custom-model
    litellm_params:
      model: provider/model-name
      api_key: os.environ/CUSTOM_API_KEY
```

### Load Balancing

Configure load balancing across providers:

```yaml
router_settings:
  routing_strategy: latency-based
  model_group_alias:
    "fast-model": ["gpt-3.5-turbo", "claude-3-5-haiku"]
```

## Support

For issues or questions:
- Check service logs: `./deploy-litellm.sh logs`
- Review configuration: `litellm-config.yaml`
- Test connectivity: `./deploy-litellm.sh status`