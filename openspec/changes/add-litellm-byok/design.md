## Context

The current architecture relies exclusively on OpenRouter for LLM inference routing, creating a single point of failure and limiting cost optimization opportunities. As the system scales and supports more agent workflows, we need a more flexible and cost-effective approach to LLM provider management.

## Goals / Non-Goals

### Goals
- Provide self-hosted LLM routing alternative to OpenRouter
- Enable BYOK (Bring Your Own Key) management for cost optimization
- Support 100+ LLM providers with unified API interface
- Maintain backward compatibility with existing OpenRouter integration
- Provide usage tracking and cost attribution per API key

### Non-Goals
- Replace OpenRouter entirely (remains as fallback)
- Implement custom LLM models or training
- Provide real-time cost optimization (future enhancement)
- Support non-HTTP LLM providers (local GPU clusters, etc.)

## Decisions

### Decision: LiteLLM over Custom Proxy
**Choice**: Use LiteLLM proxy server instead of building custom routing solution
**Rationale**: 
- Mature open-source project with 100+ provider support
- Active community and regular updates
- Built-in features: retry logic, load balancing, cost tracking
- Docker-ready deployment
- **Alternative**: Custom proxy using individual provider SDKs
- **Trade-off**: Less control vs faster time-to-market

### Decision: Docker Deployment Pattern
**Choice**: Deploy LiteLLM as Docker container alongside existing services
**Rationale**:
- Consistent with existing infrastructure (Docker Compose)
- Easy resource management and monitoring
- Automatic restart and health checks
- **Alternative**: Cloudflare Workers deployment
- **Trade-off**: Droplet resource usage vs serverless scalability

### Decision: Infisical for Key Management
**Choice**: Use Infisical for encrypted API key storage and management
**Rationale**:
- Already planned for MCP Workers deployment (shared infrastructure)
- Built-in encryption at rest and in transit
- Fine-grained access control with service tokens
- Comprehensive audit logging for compliance
- Native Docker integration via environment injection
- **Alternative**: HashiCorp Vault or custom encryption
- **Trade-off**: External dependency vs self-hosted complexity

### Infisical Integration Architecture
**Service Token Pattern**:
- LiteLLM container receives read-only service token
- Token scoped to LLM provider keys only
- Automatic key rotation via Infisical workflows
- Zero-downtime key updates via container restart

**Key Organization**:
```
/llm-providers/
├── openai/
│   ├── api-key
│   └── organization-id
├── anthropic/
│   ├── api-key
│   └── base-url
├── google/
│   ├── api-key
│   └── project-id
└── shared/
    ├── litellm-master-key
    └── default-rate-limits
```

**Environment Injection**:
```yaml
# docker-compose.yml
services:
  litellm:
    environment:
      - INFISICAL_TOKEN=${INFISICAL_LITELLM_TOKEN}
      - INFISICAL_PROJECT_ID=${INFISICAL_PROJECT_ID}
      - INFISICAL_ENVIRONMENT=production
```

### Decision: Subdomain Routing
**Choice**: Use `litellm.bestviable.com` subdomain
**Rationale**:
- Consistent with existing service patterns (coda.bestviable.com, etc.)
- Clear service isolation
- Easy SSL certificate management via acme-companion
- **Alternative**: Path-based routing (bestviable.com/litellm)
- **Trade-off**: Additional subdomain vs simpler routing

### Decision: Gradual Migration Strategy
**Choice**: Implement as additive service with OpenRouter fallback
**Rationale**:
- Zero downtime migration
- Risk mitigation if LiteLLM has issues
- Allows gradual testing and validation
- **Alternative**: Hard cutover to LiteLLM
- **Trade-off**: Dual maintenance vs migration complexity

## Architecture

### Service Architecture
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Open WebUI    │    │   Archon Agents │    │   MCP Servers   │
└────────┬────────┘    └────────┬────────┘    └────────┬────────┘
         │                      │                       │
         └──────────────────────┼───────────────────────┘
                                │
                    ┌───────────┴───────────┐
                    │   LiteLLM Proxy       │
                    │   (Port 4000)         │
                    └───────────┬───────────┘
                                │
         ┌──────────────────────┼───────────────────────┐
         │                      │                       │
    ┌────┴────┐          ┌────┴────┐              ┌────┴────┐
    │ OpenAI  │          │Anthropic│              │ Google  │
    └─────────┘          └─────────┘              └─────────┘
```

### Data Flow
1. **Request Routing**: Client → nginx-proxy → LiteLLM → Provider
2. **Key Management**: Infisical → LiteLLM → Provider API
3. **Usage Tracking**: LiteLLM → Logging → Analytics
4. **Health Monitoring**: Health checks → Docker → nginx-proxy

### Configuration Structure
```yaml
# litellm_config.yaml
model_list:
  - model_name: gpt-4
    litellm_params:
      model: openai/gpt-4
      api_key: os.environ/OPENAI_API_KEY
  - model_name: claude-3-sonnet
    litellm_params:
      model: anthropic/claude-3-sonnet-20240229
      api_key: os.environ/ANTHROPIC_API_KEY

general_settings:
  master_key: os.environ/LITELLM_MASTER_KEY
  database_url: os.environ/DATABASE_URL
```

## Risks / Trade-offs

### Risks
- **Resource Contention**: Additional 200-500MB RAM usage on 2GB droplet
  - **Mitigation**: Monitor memory usage, consider droplet upgrade if needed
- **Provider API Changes**: LiteLLM may lag behind provider updates
  - **Mitigation**: Regular updates, fallback to OpenRouter
- **Key Security**: API keys stored in environment variables
  - **Mitigation**: Infisical encryption, access controls, audit logging

### Trade-offs
- **Complexity**: Additional service to maintain vs OpenRouter simplicity
- **Performance**: Slight latency increase for routing vs direct provider calls
- **Reliability**: Single droplet dependency vs OpenRouter's infrastructure

## Migration Plan

### Phase 1: Service Deployment
1. Deploy LiteLLM container with basic configuration
2. Configure nginx-proxy routing
3. Test health checks and SSL certificates

### Phase 2: Provider Configuration
1. Add primary providers (OpenAI, Anthropic, Google)
2. Configure Infisical integration
3. Test individual provider connectivity

### Phase 3: Integration Testing
1. Test Open WebUI integration
2. Test Archon agent provider selection
3. Validate cost tracking accuracy

### Phase 4: Gradual Rollout
1. Enable LiteLLM for specific agents/workflows
2. Monitor usage and costs
3. Expand to full system if successful

### Rollback Plan
- Immediate fallback to OpenRouter via configuration change
- Disable LiteLLM service in docker-compose
- No data migration required (stateless service)

## Open Questions

- Should we implement provider-specific rate limiting per user/agent?
- How to handle provider outages - automatic failover or manual intervention?
- Should we cache model responses for cost optimization?
- Integration with future Letta agents for persistent memory?
- Cost alerting thresholds and notification mechanisms?