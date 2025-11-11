# Change: Upgrade Droplet to 4GB RAM

## Why

Phase 2A deployment (Archon services) is experiencing severe resource contention on the 2GB DigitalOcean droplet. Current memory utilization is 68% (1.3GB of 1.9GB), leaving only 83MB free. When deploying new services or performing docker compose operations, the system runs out of memory, triggering OOM kills and SSH timeouts. This blocks Phase 2A completion and creates operational fragility.

The 2GB was sized for Phase 1 (n8n foundation only), but Phase 2 adds Archon (archon-server, archon-mcp, archon-ui) which requires headroom for service startup operations, health checks, and concurrent operations.

## What Changes

- **DigitalOcean Droplet**: Resize from 2GB RAM to 4GB RAM (doubles capacity)
- **Droplet Tier**: Regular 2vCPU, 4GB RAM, 80GB SSD ($24/month)
- **Droplet Cost**: Increase from $6/month to $24/month
- **Storage Capacity**: 50GB → 80GB SSD (+30GB headroom for growth)
- **Downtime**: ~15-20 minutes during resize window
- **Year 1 Cost Impact**: +$216 annually ($18/month increase)

## Impact

**Affected Specs**:
- `infrastructure-hosting` - DigitalOcean droplet resource requirements

**Affected Code**:
- No code changes; infrastructure-only change

**Services**:
- All Phase 1 services (n8n, nginx-proxy, acme-companion, cloudflared, postgres, qdrant): temporarily stopped during resize
- Archon services (archon-server, archon-mcp, archon-ui): will start after resize with no memory pressure
- Optional services (openweb, uptime-kuma): can be re-enabled immediately post-upgrade

**Timeline**:
1. Skip Phase 2A pre-deployment on 2GB tier (resource-constrained validation not cost-effective)
2. Execute DigitalOcean droplet resize to 4GB Regular tier (~15 min downtime)
3. Verify all Phase 1 services restart cleanly post-upgrade
4. Execute Phase 2A nginx-proxy configuration switch
5. Verify Archon services deploy cleanly with memory headroom
6. Re-enable optional services (openweb, uptime-kuma)

## Storage & Scalability Analysis

**Current Usage**: 35GB of 50GB (70%)
- Qdrant vectors: 10-20GB (stable after knowledge base population)
- PostgreSQL n8n: 5-10GB (stable after workflow initialization)
- Docker system + logs: ~5GB
- Remaining services: <2GB

**With 4GB Regular Tier (80GB SSD)**:
- Headroom: 45GB (56% free)
- Growth runway: 6-8 months at moderate expansion
- Known growth driver: Letta Phase 2D (5-20GB depending on usage)

**Storage Decision**: Regular 4GB tier ($24/mo) sufficient for Phases 2A-2C + early Letta. Upgrade to Premium ($32/mo) or add Volume Storage only if monthly growth >5GB sustained.

## Cost-Benefit Analysis

| Factor | Value |
|--------|-------|
| Monthly Cost Increase | $18 ($6 → $24) |
| Annual Cost Increase | $216 |
| Storage Increase | 30GB (50GB → 80GB) |
| Memory Increase | 2x (2GB → 4GB) |
| Problem Severity | Critical (blocks Phase 2A) |
| Alternative (Premium 4GB) | $32/mo (+$8/mo more for 40GB extra storage) |
| Alternative (GPU droplet) | $25-48/mo (only if Ollama inference critical) |
| Expected ROI | Immediate (unblocks Phase 2A-2C deployment) |

## Decision

**Recommended**: Proceed with **Regular 4GB tier** ($24/month). This provides:
- Immediate unblocking of Phase 2A deployment
- Sufficient memory headroom for Phases 2A-2C + optional services
- 45GB storage headroom for Letta Phase 2D growth
- Cost-effective per-GB ratio vs. Premium tier ($8 premium for 40GB extra storage)
- No upfront GPU costs; can evaluate Ollama on CPU first

## Future Considerations

**Ollama + Local Inference** (Phase 2D decision point):
- Phase A (Post-4GB upgrade): Experiment with CPU embeddings (nomic-embed-text)
  - Cost: $0 (included in droplet)
  - Benefit: Replace OpenAI embeddings API, validate patterns
- Phase B (Phase 2D launch): Add LLM backbone for Letta (orca-mini-3b or neural-chat-7b on CPU)
  - Cost: $0 (CPU inference, slower but acceptable)
  - Decision point: If Letta inference unacceptably slow, proceed to Phase C
- Phase C (If performance critical): GPU droplet acceleration
  - Cost: +$25/mo for 1x A40 GPU
  - Only viable if volume >1000 inferences/month

**Storage upgrade decision** (At 70% utilization):
- If Letta usage moderate (5-10GB/month): Upgrade to Premium ($32/mo) or add 200GB Volume Storage ($20/mo)
- Timeline: Likely month 6-8 post-upgrade; reassess with actual Letta usage data
