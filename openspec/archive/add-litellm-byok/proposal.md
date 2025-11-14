# Change: Add LiteLLM as OpenRouter Alternative with BYOK Management

## Why

Current architecture depends on OpenRouter for LLM inference routing, which creates a single point of failure and limits flexibility for agent workflows. Adding LiteLLM provides:

1. **BYOK (Bring Your Own Key) Management**: Users can use their own API keys for different providers
2. **Cost Optimization**: Direct provider pricing vs OpenRouter markup
3. **Provider Flexibility**: Support for 100+ LLM providers beyond OpenRouter's selection
4. **Local Control**: Self-hosted routing eliminates external dependency
5. **Agent Autonomy**: Agents can dynamically select optimal models/providers based on task requirements

## What Changes

### 1. LiteLLM Service Deployment
- **New Service**: LiteLLM proxy server on droplet
- **Port**: 4000 (default LiteLLM port)
- **Integration**: Docker Compose addition alongside existing services
- **Configuration**: YAML-based provider and model configuration

### 2. BYOK Management System
- **Key Storage**: Encrypted environment variables via Infisical
- **Key Rotation**: Automated key validation and rotation workflows
- **Usage Tracking**: Per-key usage monitoring and cost attribution
- **Fallback Logic**: Automatic failover between providers/keys

### 3. Service Integration Updates
- **Open WebUI**: Configuration option for LiteLLM endpoint
- **Archon Agents**: Provider selection and key management integration
- **N8N Workflows**: New nodes for provider/key management
- **MCP Servers**: Optional LiteLLM integration for agent tool calls

### 4. Provider Support Matrix
**Primary Providers**:
- OpenAI (GPT-4, GPT-3.5)
- Anthropic (Claude 3.x series)
- Google (Gemini 1.5/2.0)
- Cohere (Command R+)
- Mistral (Large 2)

**Secondary Providers**:
- Perplexity
- Groq
- Together AI
- Anyscale
- Local models via Ollama

## Impact

### New Infrastructure
- **LiteLLM Service**: New Docker container (port 4000)
- **Configuration Volume**: Persistent config storage
- **Health Check**: `/health` endpoint for service monitoring
- **Memory Usage**: ~200-500MB additional RAM usage

### Affected Specifications
- **LLM Integration**: Current OpenRouter dependency
- **Agent Framework**: Provider selection logic
- **Configuration Management**: Secrets and environment handling
- **Cost Tracking**: Usage monitoring and billing

### Security Considerations
- **Key Encryption**: All API keys encrypted at rest
- **Access Control**: Service-to-service authentication
- **Audit Logging**: Key usage and access tracking
- **Rate Limiting**: Per-key and per-service rate limits

### Cost Impact
- **Before**: OpenRouter markup + provider costs
- **After**: Direct provider pricing + minimal LiteLLM overhead
- **Estimated Savings**: 10-30% reduction in LLM costs
- **Infrastructure**: $0 additional (runs on existing droplet)

### Breaking Changes
None. This is additive infrastructure. Existing OpenRouter integration remains as fallback.

## Related

### Architecture Documents
- [Architecture Spec v0.3](/docs/architecture/architecture-spec_v0.3.md) - Design principles
- [MCP Integration Hub](/docs/architecture/integrations/mcp/README.md) - Three-tier architecture
- [Service Deployment Guide](/infra/apps/SERVICE_DEPLOYMENT_GUIDE.md) - Deployment patterns

### Current State
- [Current State v1](/CURRENT_STATE_v1.md) - Deployed services
- [Deployment State v0.2](/sot/DEPLOYMENT_STATE_v0_2.md) - Phase tracking

### Implementation References
- [LiteLLM Documentation](https://docs.litellm.ai/)
- [LiteLLM Docker Setup](https://docs.litellm.ai/docs/proxy/deploy)
- [BYOK Best Practices](https://docs.litellm.ai/docs/proxy/virtual_keys)

## Dependencies

### Prerequisites
- Infisical secrets management integration (in progress)
- Docker Compose configuration updates
- Domain routing for litellm.bestviable.com (subdomain)

### Blocked By
- Phase 2A completion (Archon deployment unblocking)
- Infisical integration for secure key storage

### Blocks
- Advanced agent workflows requiring provider selection
- Cost optimization initiatives
- Multi-provider agent strategies

## Timeline

**Estimated Duration**: 1 week (8-12 hours total)

**Phases**:
1. **Documentation** (Phase 1): 1-2 hours
2. **Service Setup** (Phase 2): 2-3 hours
3. **Configuration** (Phase 3): 2-3 hours
4. **Integration** (Phase 4): 2-3 hours
5. **Testing** (Phase 5): 2-3 hours
6. **Documentation** (Phase 6): 1-2 hours

**Target Completion**: 2025-11-14

## Success Criteria

- [ ] LiteLLM service deployed and accessible at `https://litellm.bestviable.com`
- [ ] BYOK management system operational with encrypted key storage
- [ ] Open WebUI successfully connects to LiteLLM endpoint
- [ ] Archon agents can select providers and use BYOK keys
- [ ] Usage tracking and cost monitoring functional
- [ ] Fallback to OpenRouter works when LiteLLM unavailable
- [ ] No regressions to existing OpenRouter integration
- [ ] Documentation updated with BYOK setup instructions

---

**Proposal Status**: Draft
**Created**: 2025-11-06
**Author**: AI Agent
**Sponsor**: David Kellam