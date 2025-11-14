# Capacity Planning

Comprehensive capacity planning document for the infrastructure post-4GB droplet upgrade. This document provides current utilization metrics, growth projections, and upgrade decision criteria.

## Current Infrastructure Baseline

### Droplet Specifications
- **RAM**: 4GB (upgraded from 2GB on 2025-11-06)
- **Storage**: 80GB SSD (upgraded from ~20GB)
- **vCPUs**: 2 virtual CPUs
- **Cost**: $24/month (increased from $6/month)

### Current Utilization (Post-Upgrade)
- **Memory**: 3.1GB used / 3.8GB available (81% utilization)
- **Storage**: 37GB used / 77GB available (48% utilization)
- **Services**: 14 containers running
- **Network**: Dual-network architecture (proxy + backend)

## Resource Utilization Analysis

### Memory Usage Breakdown

| Category | Current Usage | % of Total | Services Included |
|----------|---------------|------------|-------------------|
| **Core Infrastructure** | 500MB | 13% | nginx-proxy, nginx-proxy-acme, cloudflared |
| **Application Layer** | 800MB | 21% | n8n, postgres |
| **Archon Stack** | 650MB | 17% | archon-server, archon-mcp, archon-ui |
| **MCP Services** | 250MB | 7% | coda-mcp, openweb |
| **Infisical Stack** | 350MB | 9% | infisical, infisical-db, infisical-redis |
| **Monitoring** | 200MB | 5% | dozzle, uptime-kuma |
| **Other Services** | 350MB | 9% | qdrant, buffer/cache |
| **Available Headroom** | 700MB | 19% | Growth capacity |

### Storage Usage Breakdown

| Category | Current Usage | % of Total | Description |
|----------|---------------|------------|-------------|
| **Docker System** | 5GB | 6% | Images, containers, volumes |
| **Container Data** | 25GB | 32% | Database files, application data |
| **Application Code** | 2GB | 3% | Source code and builds |
| **Logs/Temporary** | 5GB | 6% | Log files and temporary data |
| **Available Space** | 40GB | 52% | Growth runway |

## Growth Trends and Projections

### Historical Growth Pattern

**Pre-Upgrade (2GB era)**:
- Memory: 68% utilization (1.36GB / 2GB)
- Services: ~8 containers
- Constraint: Memory pressure causing service instability

**Post-Upgrade (4GB era)**:
- Memory: 81% utilization (3.1GB / 3.8GB)
- Services: 14 containers (+75% growth)
- Headroom: 700MB available for expansion

### Service Addition Impact

**Average Resource Consumption per New Service**:
- **Lightweight services** (monitoring, utilities): 100-150MB RAM
- **Application services** (APIs, UIs): 200-300MB RAM  
- **Database services**: 150-250MB RAM
- **Full-stack services**: 400-600MB RAM

**Current Addition Rate**: ~1-2 new services per month

## Upgrade Trigger Points

### Memory Upgrade Triggers

| Threshold | Utilization | Available RAM | Action Required |
|-----------|-------------|---------------|-----------------|
| **Green Zone** | <70% | >1.1GB | Normal operations |
| **Yellow Zone** | 70-85% | 0.6-1.1GB | Monitor closely |
| **Orange Zone** | 85-90% | 0.4-0.6GB | Plan upgrade |
| **Red Zone** | >90% | <0.4GB | **Upgrade immediately** |

**Current Status**: Orange Zone (81% utilization)

### Storage Upgrade Triggers

| Threshold | Utilization | Available Space | Action Required |
|-----------|-------------|-----------------|-----------------|
| **Green Zone** | <60% | >30GB | Normal operations |
| **Yellow Zone** | 60-75% | 20-30GB | Monitor growth |
| **Orange Zone** | 75-85% | 10-20GB | Plan cleanup/upgrade |
| **Red Zone** | >85% | <10GB | **Cleanup or upgrade** |

**Current Status**: Green Zone (48% utilization)

### Service Count Triggers

| Service Count | Resource Impact | Recommendation |
|---------------|-----------------|----------------|
| **14-16 services** | Current baseline | Normal operations |
| **17-20 services** | +400-800MB RAM | Monitor memory usage |
| **21-25 services** | +1.0-1.5GB RAM | **Plan memory upgrade** |
| **>25 services** | >2GB additional | **Requires upgrade** |

## Upgrade Decision Matrix

### Memory Upgrade Scenarios

**8GB Upgrade ($48/month)**:
- **Trigger**: Memory utilization >90% for 7+ days
- **Capacity**: 4GB additional RAM (100% increase)
- **Service Headroom**: 15-20 additional services
- **Timeline**: 6-12 months at current growth
- **ROI**: High - resolves immediate pressure

**16GB Upgrade ($96/month)**:
- **Trigger**: Memory utilization >85% with high growth rate
- **Capacity**: 12GB additional RAM (300% increase)
- **Service Headroom**: 30-40 additional services
- **Timeline**: 18-24 months at current growth
- **ROI**: Medium - significant over-provisioning

### Storage Upgrade Scenarios

**160GB Upgrade (+$12/month)**:
- **Trigger**: Storage utilization >75%
- **Capacity**: 80GB additional space
- **Timeline**: 12-18 months at current growth
- **ROI**: High - simple volume expansion

**320GB Upgrade (+$24/month)**:
- **Trigger**: Storage utilization >75% with high data growth
- **Capacity**: 240GB additional space
- **Timeline**: 24-36 months
- **ROI**: Medium - long-term capacity

## Cost-Benefit Analysis

### Current Costs
- **Droplet**: $24/month (4GB RAM, 80GB SSD)
- **Total Monthly**: $24
- **Annual**: $288

### Upgrade Costs
- **8GB RAM**: +$24/month (+$288/year)
- **160GB Storage**: +$12/month (+$144/year)
- **Combined**: +$36/month (+$432/year)

### Business Impact
- **Service Stability**: Eliminates memory pressure issues
- **Growth Capacity**: Supports 2x service expansion
- **Performance**: Reduces resource contention
- **Downtime Risk**: Minimizes upgrade frequency

## Monitoring and Alerting

### Key Metrics to Track

**Memory Metrics**:
- Total memory utilization percentage
- Available memory in MB
- Memory usage per service
- Memory growth rate per week

**Storage Metrics**:
- Total storage utilization percentage
- Available storage in GB
- Storage growth rate per month
- Log file accumulation rate

**Service Metrics**:
- Container health status
- Service restart frequency
- Resource usage trends
- Network traffic patterns

### Alert Thresholds

**Immediate Alerts**:
- Memory utilization >90%
- Storage utilization >85%
- Critical service failures
- Container restart loops

**Warning Alerts**:
- Memory utilization >80%
- Storage utilization >70%
- Service health check failures
- Unusual resource spikes

## Capacity Planning Recommendations

### Short-term (1-3 months)
1. **Monitor current utilization** closely
2. **Document baseline metrics** for comparison
3. **Plan for 2-3 additional services** (400-600MB RAM)
4. **Prepare 8GB upgrade** decision criteria

### Medium-term (3-6 months)
1. **Execute 8GB memory upgrade** if triggers met
2. **Implement automated monitoring** and alerting
3. **Optimize service resource allocation**
4. **Plan storage expansion** if needed

### Long-term (6-12 months)
1. **Evaluate 16GB upgrade** necessity
2. **Consider horizontal scaling** options
3. **Implement resource quotas** and limits
4. **Plan infrastructure architecture** evolution

## Emergency Procedures

### Memory Exhaustion Response
1. **Identify high-memory services** using `docker stats`
2. **Restart non-critical services** to free memory
3. **Scale down resource-intensive operations**
4. **Prepare emergency upgrade** if needed

### Storage Full Response
1. **Clean up Docker system** (`docker system prune`)
2. **Archive old log files** and data
3. **Identify large files** using `du` commands
4. **Emergency storage expansion** if critical

## Implementation Checklist

### Pre-Upgrade Planning
- [ ] Document current utilization baseline
- [ ] Identify services for optimization
- [ ] Plan upgrade timing (low-usage periods)
- [ ] Prepare rollback procedures
- [ ] Notify stakeholders of maintenance

### During Upgrade
- [ ] Create system snapshot/backup
- [ ] Execute upgrade via DigitalOcean console
- [ ] Verify service functionality post-upgrade
- [ ] Update documentation with new specs
- [ ] Monitor system stability

### Post-Upgrade
- [ ] Validate all services operational
- [ ] Update capacity planning documentation
- [ ] Adjust monitoring thresholds
- [ ] Review and optimize resource allocation
- [ ] Document lessons learned

---

**Document Version**: 1.0  
**Last Updated**: 2025-11-09  
**Next Review**: Monthly or when utilization >85%  
**Responsible Party**: Infrastructure Operations