# ADR: Ollama Local Inference Strategy for Archon + Letta

**Date**: 2025-11-06
**Status**: APPROVED (Three-phase evaluation approach)
**Affected Systems**: Archon (Phase 2A+), Letta (Phase 2D), Infrastructure (Droplet)
**Decision Owner**: David Kellam

---

## Context

As Phase 2D (Letta agent framework integration) approaches, the system will require increased inference capacity for:
- Embedding generation (semantic search in Qdrant)
- LLM reasoning (Letta agent backbone, fallback completions)
- Real-time token streaming for interactive agent responses

Current approach delegates all inference to OpenAI API (Claude, GPT-4 for reasoning; embeddings API for vector generation). This is:
- **Cost-effective** for low-volume usage (~$0.50-2/month current embeddings cost)
- **Simple** to operate (no local model management)
- **Fast** for reasoning tasks (Claude API latency)

However, planned workload expansion raises questions:
- Will local embeddings reduce API costs significantly?
- Can CPU-based LLM inference provide acceptable performance for Letta?
- Should we invest in GPU infrastructure for production-grade inference?

---

## Decision

Adopt a **phased evaluation approach** with three decision gates based on actual usage patterns:

### Phase A: CPU Embeddings (Post-4GB Droplet Upgrade)
**Timeline**: After droplet upgrade completes (Week 1-2 post-upgrade)
**Cost**: $0 (included in existing $24/mo droplet)
**Implementation**:
- Deploy Ollama service to docker-compose
- Load `nomic-embed-text` model (274MB, high-quality open-source embeddings)
- Replace OpenAI embeddings API calls with Ollama HTTP endpoint
- Benchmark vs. OpenAI: latency, quality, cost

**Success Criteria**:
- Embeddings quality meets or exceeds OpenAI (cosine similarity scores in tests)
- Latency acceptable for batch operations (<500ms for 100 documents)
- Cost savings measurable (→ $0 vs. $0.02/1M tokens)

**Decision Gate**: If successful, embeddings become permanent. If quality degradation detected, revert to OpenAI.

### Phase B: CPU LLM Backbone for Letta (At Phase 2D Launch)
**Timeline**: When Letta services deploy (Phase 2D, ~month 3-4)
**Cost**: $0 (CPU inference, slower than GPU)
**Models to Evaluate**:
- `orca-mini-3b`: Small, fast, reasoning-capable
- `neural-chat-7b`: Optimized for dialogue
- `mistral-7b`: General-purpose, good quality

**Implementation**:
- Add model to Ollama alongside embeddings service
- Configure Letta to use Ollama as primary LLM backend
- Keep Claude API available for complex reasoning tasks
- Log inference latency and token/second metrics

**Success Criteria**:
- Inference speed ≥10 tokens/second on 4GB CPU (acceptable interactive latency)
- Quality acceptable for Letta agent reasoning (test with sample conversations)
- Memory utilization remains <80% during concurrent Letta + Archon operations

**Decision Gate**:
- If latency >3 seconds per response: Proceed to Phase C (GPU)
- If acceptable but slower than desired: Monitor; consider GPU in next cycle
- If acceptable and performant: Continue CPU inference indefinitely

### Phase C: GPU Acceleration (Performance-Driven)
**Timeline**: Only if Phase B latency insufficient (~month 4+)
**Cost**: +$25-48/mo for 1x GPU droplet (DigitalOcean A40 or A100)
**Implementation**:
- Provision separate GPU droplet with Ollama service
- Migrate inference workloads from main droplet to GPU instance
- Archon/Letta communicate via HTTP API to GPU droplet
- Benchmark: expect 50-100+ tokens/second with 7B model

**Justification Threshold**:
- Only economical if inference volume >1000 calls/day sustained
- Only pursue if Phase B response latency causes user experience issues
- Alternative: Use managed inference API (Together.ai, etc.) with pay-as-you-go pricing

---

## Rationale

### Why Not GPU Immediately?
1. **Unknown load**: Letta usage patterns undefined until Phase 2D launches
2. **Cost-benefit unclear**: $25-48/mo GPU may not be justified for 100 inferences/day
3. **CPU is sufficient**: 3-7B parameter models on modern CPUs provide acceptable latency for async tasks
4. **Hybrid approach works**: Use Ollama for embeddings + optional LLM, keep Claude for high-complexity reasoning

### Why Start with Embeddings?
- Lowest-risk experiment: Embeddings are deterministic, easy to validate quality
- Immediate cost validation: Can measure savings vs. OpenAI API
- No breaking changes: Falls back to OpenAI if issues detected
- Fast iteration: Leads to confidence for Phase B LLM experiments

### Why CPU First for LLM?
- Letta agent reasoning often async: Latency not as critical as throughput
- Modern CPUs competitive: 3-7B models run acceptably on CPU
- Preserves droplet resources: GPU would require separate infrastructure
- Deferrable decision: Can add GPU later without refactoring architecture

---

## Implementation Plan

### Phase A Checklist (Week 1-2):
- [ ] Add Ollama service to `/portfolio/infra/archon/docker-compose.yml`
- [ ] Deploy `nomic-embed-text` model via init script
- [ ] Update Archon embedding provider to Ollama endpoint
- [ ] Create benchmark script (compare vs. OpenAI on 100 sample docs)
- [ ] Document results in `/portfolio/CURRENT_STATE_v1.md`

### Phase B Checklist (Month 3-4):
- [ ] Select LLM model (recommend: `neural-chat-7b` for dialogue)
- [ ] Add model to Ollama docker-compose
- [ ] Configure Letta to use Ollama as backbone
- [ ] Create monitoring dashboard (tokens/second, latency, memory)
- [ ] Run 7-day production trial with real Letta conversations
- [ ] Document results; make GPU/continue decision

### Phase C Checklist (If Needed):
- [ ] Provision GPU droplet with Ollama
- [ ] Set up inter-droplet API communication (secure, no firewall)
- [ ] Migrate inference workloads
- [ ] Retire CPU inference for LLM (keep embeddings on main droplet)
- [ ] Update cost tracking

---

## Trade-offs & Risks

| Aspect | Trade-off | Mitigation |
|--------|-----------|-----------|
| **API Dependency** | Local inference reduces OpenAI dependency | Keep Claude API for fallback/complex tasks |
| **Operational Complexity** | More moving parts (model management) | Automated via docker-compose, simple monitoring |
| **Latency** | CPU inference slower than cloud API | Acceptable for async/batch workloads; GPU option if critical |
| **Model Quality** | Open-source models < Claude/GPT-4 | Use for routine tasks; keep proprietary for edge cases |
| **Storage** | Models consume 7-15GB (nomic + LLM) | Fits in 80GB SSD; monitor during Phase 2D |
| **VRAM Pressure** | 4GB droplet may be tight with concurrent inference | Phase B benchmarking will validate; GPU escalation path clear |

---

## Alternative Options Considered

### Option 1: Managed Inference (Together.ai, Replicate, etc.)
- **Cost**: $0.50-2/million tokens (variable pricing)
- **Benefit**: No ops overhead, fast GPU inference
- **Risk**: Vendor lock-in, pricing changes, API rate limits
- **Verdict**: Viable alternative for Phase C if GPU droplet untenable

### Option 2: GPU Droplet + Full Offload (Day 1)
- **Cost**: +$25-48/mo immediately
- **Benefit**: Maximum performance from start
- **Risk**: Unnecessary cost during low-utilization phases; complexity for batch workloads
- **Verdict**: Rejected; premature optimization. Evaluate after Phase B data.

### Option 3: Hybrid Cloud (AWS Lambda, Google Cloud Run)
- **Cost**: $0-5/month (serverless) + per-request fees
- **Benefit**: Auto-scaling, no infra management
- **Risk**: Cold start latency, vendor lock-in, harder to debug
- **Verdict**: Rejected; overkill for single user system. Revisit if multi-tenant.

---

## Monitoring & Decision Points

### Monthly Metrics to Track (Phase A+):
- Embedding latency: p50, p95, p99
- Embedding quality vs. OpenAI (cosine similarity on test set)
- API cost savings (embeddings API → $0)
- Model storage overhead
- Droplet memory utilization during peak load

### Phase B Decision Criteria (At month 3-4):
- LLM inference latency >3s per response = Escalate to GPU
- LLM inference latency 1-3s per response = Continue CPU, monitor
- LLM inference latency <1s per response = Confirm success, defer GPU indefinitely
- Memory utilization >85% during test = Consider droplet upgrade (memory, not size)
- Quality insufficient for Letta reasoning = Revert to Claude API backbone

### Phase C Trigger (If applicable):
- Sustained inference volume >1000 calls/day
- Average response latency >5 seconds (user-facing impact)
- GPU ROI calculation: $25/mo < (API cost savings + performance benefit)

---

## Success Criteria (End State)

**Phase A Success**:
- Ollama embeddings deployed and validated
- Cost savings documented ($0 vs. OpenAI)
- Confidence in local inference infrastructure established

**Phase B Success** (if LLM pursued):
- Letta agent backbone running on CPU with <3s latency
- Memory utilization remains <80%
- User experience acceptable for async conversations

**Phase C Success** (if GPU pursued):
- GPU droplet significantly improves inference performance
- Cost justified by volume or quality improvements
- Scalable architecture for future growth

---

## References

- Ollama: https://ollama.ai
- Model Options:
  - Embeddings: `nomic-embed-text` (274MB, state-of-the-art open-source)
  - LLM: `neural-chat-7b` (7GB, dialogue-optimized)
  - Fallback: `mistral-7b` (7GB, general-purpose)
- Related Change Proposals: `update-droplet-4gb` (infrastructure foundation)
- Related Phases: 2A (Archon), 2D (Letta), Phase 2C (MCP servers)

---

**Approval Path**:
- [ ] David Kellam: Approved (2025-11-06)
- [ ] Implementation: Pending droplet upgrade completion
- [ ] Phase A Completion: Expected week 2 of droplet operation
- [ ] Phase B Evaluation: Month 3-4 (Letta Phase 2D launch)

**Next Steps**:
1. Execute droplet upgrade (Regular 4GB)
2. After stabilization (week 1), begin Phase A implementation
3. Document embeddings benchmark results
4. Plan Phase B Letta evaluation
