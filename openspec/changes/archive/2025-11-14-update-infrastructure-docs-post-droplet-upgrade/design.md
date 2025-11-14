# Technical Design: Infrastructure Documentation Updates Post-Droplet Upgrade

**Change ID**: `update-infrastructure-docs-post-droplet-upgrade`
**Date**: 2025-11-09
**Author**: David Kellam

---

## Context

### Current State Analysis
Based on direct SSH inspection of the droplet (`tools-droplet-agents`), the infrastructure has evolved significantly:

**Resource Upgrade Impact**:
- **Memory**: Upgraded from 2GB (68% used, 83MB free) to 4GB (81% used, 189MB free)
- **Storage**: Increased from ~20GB to 80GB SSD (37GB used, 48% utilization)
- **Cost**: Increased from $6/month to $24/month (+$216/year)

**Service Inventory Discovery**:
- **14 containers** running (vs. ~8 documented)
- **3 unhealthy services**: Infisical, Qdrant, Uptime-Kuma
- **Authentication gap**: Coda MCP missing `CODA_API_TOKEN` environment variable

### Requirements
1. **Accurate Documentation**: Reflect current 4GB resource baseline
2. **Complete Service Inventory**: Document all 14 running containers
3. **Health Monitoring**: Identify and document service health issues
4. **Operational Procedures**: Create runbooks for maintenance and troubleshooting

### Stakeholders
- **Operations**: Need accurate service inventory and health procedures
- **Development**: Require current architecture patterns for new deployments
- **Planning**: Need capacity metrics for future scaling decisions

---

## Goals

### Primary Goals
1. ✅ Update all documentation to reflect 4GB droplet resources
2. ✅ Document complete service inventory with health status
3. ✅ Create operational runbooks for health checks and restarts
4. ✅ Identify and document current service issues

### Non-Goals
- ⚠️ Fix unhealthy services (separate maintenance task)
- ⚠️ Implement new monitoring tools (future enhancement)
- ⚠️ Change deployment architecture (documentation only)

---

## Architecture Analysis

### Current Deployment Pattern: SyncBricks
```
Internet → Cloudflare Tunnel → nginx-proxy → Docker Services
```

**Network Architecture**:
- **External Network**: `n8n_proxy` (Cloudflare → nginx-proxy)
- **Internal Network**: `n8n_syncbricks` (service-to-service)
- **SSL/TLS**: Let's Encrypt via acme-companion (automatic)

### Service Discovery Results

| Service | Status | Port | Network | Health | Issues |
|---------|--------|------|---------|--------|--------|
| nginx-proxy | ✅ Up | 80,443 | External | N/A | None |
| nginx-proxy-acme | ✅ Up | - | Internal | N/A | None |
| cloudflared | ✅ Up | - | External | N/A | None |
| n8n | ✅ Up | 5678 | Internal | N/A | None |
| postgres | ✅ Up | 5432 | Internal | ✅ Healthy | None |
| qdrant | ✅ Up | 6333 | Internal | ❌ Unhealthy | Needs investigation |
| archon-server | ✅ Up | 8181 | Internal | ✅ Healthy | None |
| archon-mcp | ✅ Up | 8051 | Internal | ✅ Healthy | None |
| archon-ui | ✅ Up | 3737 | Internal | ✅ Healthy | None |
| coda-mcp | ✅ Up | 8080 | External | ✅ Healthy | Missing auth token |
| openweb | ✅ Up | 8080 | Internal | ✅ Healthy | Disabled |
| infisical | ✅ Up | 3000 | Internal | ❌ Unhealthy | Needs investigation |
| infisical-db | ✅ Up | 5432 | Internal | ✅ Healthy | None |
| infisical-redis | ✅ Up | 6379 | Internal | N/A | None |
| dozzle | ✅ Up | 9999 | Internal | ❌ Unhealthy | Needs investigation |
| uptime-kuma | ❌ Restarting | - | Internal | N/A | Exit 137 (memory) |

### Resource Utilization Analysis

**Memory Breakdown** (3.1GB used / 3.8GB total):
- Container overhead: ~500MB
- Active services: ~2.2GB
- Buffer/cache: ~400MB
- **Headroom**: ~700MB available for growth

**Storage Breakdown** (37GB used / 77GB total):
- Docker system: ~5GB
- Container data: ~25GB
- Application code: ~2GB
- Logs/temp: ~5GB
- **Growth runway**: 6-8 months at current expansion rate

---

## Key Design Decisions

### 1. Documentation-First Approach (Not Infrastructure Changes)
**Decision**: Update documentation only, no infrastructure modifications

**Rationale**:
- ✅ Zero risk of service disruption
- ✅ Immediate value from accurate information
- ✅ Foundation for future infrastructure work
- ✅ Can be completed quickly (documentation-only)

**Trade-off**: Issues remain unfixed but are now documented

### 2. Comprehensive Service Inventory
**Decision**: Document all 14 containers regardless of health status

**Rationale**:
- ✅ Complete operational picture
- ✅ Identifies maintenance priorities
- ✅ Enables capacity planning
- ✅ Supports troubleshooting procedures

### 3. Health Status Documentation
**Decision**: Include current health status and known issues

**Rationale**:
- ✅ Transparency about system state
- ✅ Prioritizes maintenance work
- ✅ Enables proactive monitoring
- ✅ Supports operational decisions

---

## Implementation Strategy

### Phase 1: Service Inventory and Assessment (2 hours)
1. **Container Documentation**: Create complete service inventory
2. **Health Assessment**: Document current health status
3. **Resource Analysis**: Update capacity metrics
4. **Issue Identification**: Document functional problems

### Phase 2: Documentation Updates (4 hours)
1. **State Documentation**: Update CURRENT_STATE_v1.md
2. **Architecture Updates**: Revise architecture-spec_v0.3.md
3. **Operational Runbooks**: Create health check procedures
4. **Capacity Planning**: Document utilization trends

### Phase 3: Architecture Alignment (2 hours)
1. **Pattern Documentation**: Document SyncBricks deployment
2. **Network Architecture**: Explain dual-network design
3. **SSL/TLS Process**: Document Let's Encrypt automation
4. **Service Dependencies**: Map inter-service relationships

### Phase 4: Issue Documentation (2 hours)
1. **Problem Documentation**: Detail identified issues
2. **Recommendation Matrix**: Prioritize fixes by impact/effort
3. **Maintenance Schedule**: Suggest operational procedures
4. **Future Planning**: Identify capacity upgrade triggers

---

## Issues Identified & Recommendations

### Critical Issues (Immediate Attention)
1. **Coda MCP Authentication**: Missing `CODA_API_TOKEN` environment variable
   - **Impact**: MCP server returns 401, blocking tool access
   - **Fix**: Add token to docker-compose.yml (Phase 1 of MCP OAuth proposal)

2. **Uptime-Kuma Restarting**: Exit 137 (likely memory pressure)
   - **Impact**: No uptime monitoring available
   - **Fix**: Investigate memory limits or disable service

### Medium Priority Issues
3. **Infisical Unhealthy**: Container health check failing
   - **Impact**: Secrets management unreliable
   - **Fix**: Investigate health check configuration

4. **Qdrant Unhealthy**: Vector database health check failing
   - **Impact**: RAG/search functionality may be compromised
   - **Fix**: Check database connectivity and resources

5. **Dozzle Unhealthy**: Log viewer health check failing
   - **Impact**: Limited log visibility
   - **Fix**: Review container configuration

### Monitoring Gaps
6. **No Centralized Metrics**: No Prometheus/Grafana setup
   - **Impact**: Limited observability
   - **Fix**: Consider lightweight monitoring solution

7. **Manual Health Checks**: No automated alerting
   - **Impact**: Issues discovered manually
   - **Fix**: Implement health check automation

---

## Security Considerations

### Current Security Posture
- **Network Isolation**: Dual-network architecture properly implemented
- **Zero IP Exposure**: Cloudflare Tunnel working correctly
- **SSL/TLS**: Let's Encrypt certificates auto-renewing
- **Authentication**: Bearer token validation active on MCP endpoints

### Identified Gaps
- **Token Storage**: Environment variables visible in container inspect
- **Secret Rotation**: No documented rotation procedures
- **Audit Logging**: Limited security event logging
- **Access Controls**: Basic Bearer token auth only

---

## Testing Strategy

### Documentation Validation
1. **Accuracy Review**: Verify all service details correct
2. **Procedure Testing**: Test documented health check commands
3. **Runbook Validation**: Ensure restart procedures work
4. **Link Verification**: Check all documentation references

### Infrastructure Testing
1. **Health Check Execution**: Run all documented health commands
2. **Service Restart**: Test documented restart procedures
3. **Resource Monitoring**: Verify utilization metrics accurate
4. **Network Validation**: Confirm network architecture described

---

## Monitoring & Observability

### Current State
- **Docker Health Checks**: Basic container health monitoring
- **Dozzle**: Basic log aggregation (unhealthy)
- **Manual Checks**: SSH-based health validation

### Documentation Enhancements
- **Health Check Procedures**: Documented commands for each service
- **Resource Thresholds**: Defined upgrade trigger points
- **Troubleshooting Guides**: Step-by-step issue resolution
- **Performance Baselines**: Current utilization metrics

---

## Migration Path & Rollback

### Documentation Updates
- **Rollback**: Simply revert documentation changes via git
- **Validation**: Compare against SSH inspection results
- **Testing**: Verify procedures work as documented

### Infrastructure Issues
- **Coda MCP**: Address via separate MCP OAuth implementation
- **Unhealthy Services**: Documented for future maintenance
- **Monitoring Gaps**: Noted for future enhancement

---

## Future Considerations

### Capacity Planning
- **Memory Upgrade Trigger**: >3.5GB used (90% utilization)
- **Storage Upgrade Trigger**: >60GB used (75% utilization)
- **Service Addition**: Budget 200MB per new service

### Architecture Evolution
- **Monitoring Enhancement**: Add Prometheus/Grafana
- **Secret Management**: Migrate to Infisical when healthy
- **Health Automation**: Implement automated health checks
- **Log Aggregation**: Centralized logging solution

### Service Optimization
- **Resource Limits**: Set appropriate memory limits per service
- **Health Check Tuning**: Optimize check intervals and timeouts
- **Dependency Management**: Document service interdependencies
- **Backup Strategy**: Document data backup procedures

---

## Risks & Mitigations

| Risk | Severity | Mitigation |
|------|----------|------------|
| Documentation inaccuracies | Medium | SSH validation and procedure testing |
| Service health degradation | High | Documented health checks enable quick detection |
| Resource exhaustion | Medium | Defined upgrade triggers and monitoring |
| Security gaps | Medium | Documented for future security hardening |

---

## Code Organization

```
docs/
├── architecture/
│   └── architecture-spec_v0.3.md (updated)
├── infrastructure/
│   ├── SERVICE_INVENTORY.md (new)
│   ├── CAPACITY_PLANNING.md (new)
│   ├── TROUBLESHOOTING_GUIDE.md (new)
│   └── HEALTH_CHECK_PROCEDURES.md (new)
├── sops/
│   ├── SERVICE_DEPLOYMENT_GUIDE.md (enhanced)
│   └── SERVICE_UPDATE_WORKFLOW.md (enhanced)
└── CURRENT_STATE_v1.md (updated)

changes/update-infrastructure-docs-post-droplet-upgrade/
├── proposal.md
├── design.md
├── tasks.md
└── specs/
    └── infrastructure-documentation/
        └── spec.md

archive/
└── capacity-planning-2gb-era.md (moved from docs)
```

---

**Design Review**: [To be filled during approval]
**Architecture Approved**: [To be filled]