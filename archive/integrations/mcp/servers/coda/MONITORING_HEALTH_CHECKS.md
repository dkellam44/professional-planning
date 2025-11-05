# Monitoring and Health Checks - Coda MCP HTTP-Native Server

This document describes monitoring strategies, health checks, and validation procedures for the Coda MCP HTTP-Native Server in production.

---

## Health Check Endpoint

### Basic Health Check

```bash
curl http://localhost:8080/health
```

Response:
```json
{
  "status": "ok",
  "service": "coda-mcp",
  "version": "1.0.0",
  "timestamp": "2025-11-01T21:00:00.000Z"
}
```

**Expected Status Code**: 200 OK

---

## Docker Health Checks

### Built-in Health Check

The Dockerfile includes a HEALTHCHECK instruction:

```dockerfile
HEALTHCHECK --interval=30s --timeout=5s --retries=3 --start-period=10s \
  CMD node -e "require('http').get('http://localhost:8080/health', (r) => {if (r.statusCode !== 200) throw new Error(r.statusCode)})"
```

**What this does**:
- **Interval**: Checks health every 30 seconds
- **Timeout**: Waits 5 seconds for response
- **Retries**: Marks unhealthy after 3 consecutive failures
- **Start Period**: Waits 10 seconds before first check (allows startup)

### Checking Container Health

```bash
# View container health status
docker ps --filter "name=coda-mcp"
# Shows STATUS like: Up 2 hours (healthy) or Up 2 hours (unhealthy)

# Detailed health information
docker inspect coda-mcp | jq '.[] | .State.Health'

# Check health logs
docker inspect coda-mcp | jq '.[] | .State.Health.Log[-5:]'
```

### Restarting on Health Failure

```yaml
# In docker-compose.yml
services:
  coda-mcp:
    restart: unless-stopped  # Auto-restart if container stops
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8080/health"]
      interval: 30s
      timeout: 5s
      retries: 3
```

When health checks fail 3 times, Docker will:
1. Mark container as "unhealthy"
2. Log the failure
3. (With `restart: unless-stopped`) restart the container

---

## Monitoring Strategy

### Three-Tier Monitoring

#### Tier 1: Container Health (Docker)
- **What**: Checks if process is alive and responding to /health
- **How**: Docker health check (built-in)
- **Frequency**: Every 30 seconds
- **Action**: Auto-restart container if unhealthy

#### Tier 2: Endpoint Validation (Uptime Robot)
- **What**: Validates OAuth endpoints and token validation
- **How**: External HTTP checks
- **Frequency**: Every 5 minutes
- **Action**: Alert if endpoints unavailable for 5+ minutes

#### Tier 3: Log Monitoring (Manual Review)
- **What**: Errors, warnings, and token estimation anomalies
- **How**: Review Docker logs
- **Frequency**: Daily or on alert
- **Action**: Investigate and fix underlying issues

---

## Uptime Robot Configuration

### Setup External Monitoring

Create uptime checks for:

1. **Health Endpoint**
   - URL: `https://coda.bestviable.com/health`
   - Type: HTTP
   - Method: GET
   - Interval: 5 minutes
   - Timeout: 10 seconds

2. **OAuth Discovery**
   - URL: `https://coda.bestviable.com/.well-known/oauth-authorization-server`
   - Type: HTTP
   - Method: GET
   - Interval: 15 minutes
   - Timeout: 10 seconds

3. **Token Validation**
   - URL: `https://coda.bestviable.com/oauth/validate-token`
   - Type: HTTP
   - Method: POST
   - Body: `{"token":"test"}`
   - Interval: 15 minutes
   - Timeout: 10 seconds

### Alert Configuration

```
Alert Type: Email + Slack
Notification Threshold: 1 failure (immediate alert)
Re-alert Interval: Every 15 minutes while down
Recipients: devops@bestviable.com, #incidents channel
```

---

## Log Monitoring

### View Server Logs

```bash
# Local development
node dist/http-server.js

# Docker
docker logs coda-mcp
docker logs -f coda-mcp  # Follow logs
docker logs --tail 100 coda-mcp  # Last 100 lines
docker logs --since 2025-11-01T20:00:00Z coda-mcp  # Since timestamp
```

### Log Levels and Patterns

| Pattern | Level | Meaning |
|---------|-------|---------|
| `[HTTP]` | INFO | Request/response logging |
| `[OAUTH]` | INFO | OAuth endpoint accessed |
| `[Auth]` | INFO | Bearer token configured |
| `[METRICS]` | INFO | Session metrics update |
| `[MCP]` | INFO | MCP protocol event |
| `[MEMORY]` | INFO | Memory hook invocation |
| `[CLOUDFLARE]` | INFO | Cloudflare Access request |
| `[WARN]` | WARN | Warning condition |
| `[ERROR]` | ERROR | Error condition |
| `[SECURITY]` | WARN | Security-relevant event |

### Key Metrics to Monitor

```bash
# Count errors by type
docker logs coda-mcp | grep ERROR | wc -l

# Watch for authentication failures
docker logs coda-mcp | grep "401\|Unauthorized"

# Monitor token estimation
docker logs coda-mcp | grep METRICS

# Check memory hook execution
docker logs coda-mcp | grep MEMORY

# Find slow requests
docker logs coda-mcp | grep "duration"
```

---

## Performance Monitoring

### Response Time Tracking

Every MCP request logs duration:

```
[MCP] POST /mcp handled {
  duration: "142ms",
  requestCount: 5,
  totalTokens: 2500
}
```

**Acceptable ranges**:
- Health check: < 10ms
- OAuth endpoints: < 50ms
- MCP requests: 100ms - 5000ms (depends on Coda API)

### Token Usage Tracking

Session metrics are logged at termination:

```
[MEMORY] onSessionEnd: 12 requests, 45000 tokens over 45s
```

**Key metrics**:
- Total tokens per session
- Requests per session
- Session duration
- Average tokens per request

---

## Validation Script

A comprehensive validation script is included: `validate-deployment.sh`

### Running Validation

```bash
# Validate local instance
./validate-deployment.sh

# Validate production
./validate-deployment.sh https://coda.bestviable.com

# Verbose output
VERBOSE=true ./validate-deployment.sh
```

### What Gets Tested

1. **Connectivity** - Server reachable
2. **Health endpoint** - Returns 200
3. **OAuth discovery** - Both metadata endpoints accessible
4. **Token validation** - Rejects missing tokens, accepts valid ones
5. **Authentication** - Bearer token required for /mcp
6. **CORS** - Proper headers on OPTIONS
7. **Cloudflare Access** - Headers supported
8. **Content type** - JSON handling
9. **Capabilities** - Server advertises features correctly
10. **Performance** - Response times acceptable

---

## Common Issues and Solutions

### Issue: Container keeps restarting

**Symptoms**:
```
docker ps shows: Up 10s (unhealthy) or restarting
```

**Causes**:
1. Health check endpoint failing
2. Server crashing on startup
3. Out of memory

**Solution**:
```bash
# Check logs
docker logs coda-mcp

# Check health manually
curl http://localhost:8080/health

# Check memory usage
docker stats coda-mcp

# Check for startup errors
docker run --rm coda-mcp:v1.0.0
```

### Issue: High error rate in logs

**Symptoms**:
```
Frequent [ERROR] messages
401 Unauthorized errors
```

**Causes**:
1. Invalid Bearer token
2. Coda API rate limiting
3. Network connectivity issues

**Solution**:
```bash
# Check token validity
curl -X POST http://localhost:8080/oauth/validate-token \
  -H "Content-Type: application/json" \
  -d '{"token":"your-token"}'

# Monitor specific errors
docker logs coda-mcp | grep ERROR

# Check Coda API status
# Visit https://coda.io/status
```

### Issue: Memory usage growing

**Symptoms**:
```
docker stats shows increasing memory
Session cleanup not happening
```

**Causes**:
1. Sessions not being deleted (no DELETE /mcp calls)
2. Memory hooks accumulating data
3. Large responses not being garbage collected

**Solution**:
```bash
# Monitor session count
docker logs coda-mcp | grep "Session initialized" | wc -l

# Ensure DELETE /mcp is called for cleanup
# Check example: examples/curl-mcp-request.sh

# Monitor memory usage over time
watch -n 5 'docker stats coda-mcp --no-stream'
```

---

## Alerting Strategy

### Email Alerts

Configure via Uptime Robot:
- Endpoint down for 5+ minutes
- Response time exceeds 10 seconds
- SSL certificate expiring

### Slack Integration

```
When: Container becomes unhealthy
Send: #incidents channel
Message: "coda-mcp is unhealthy, check logs: docker logs coda-mcp"

When: Uptime Robot fails
Send: #incidents channel
Message: "OAuth endpoint unreachable, investigate availability"
```

### Dashboard

Create monitoring dashboard showing:
- Last 24h uptime %
- Response time trend
- Error rate trend
- Last health check time
- Container restart count

---

## Maintenance Procedures

### Daily

1. Review error logs: `docker logs --since 24h coda-mcp | grep ERROR`
2. Check container health: `docker ps | grep coda-mcp`
3. Verify OAuth endpoints accessible

### Weekly

1. Run validation script: `./validate-deployment.sh https://coda.bestviable.com`
2. Review performance metrics (response times, token usage)
3. Check for memory leaks: `docker stats coda-mcp`

### Monthly

1. Review all logs for patterns
2. Update monitoring thresholds if needed
3. Test rollback procedure
4. Document any incidents

### On Every Deployment

1. Run validation immediately after deployment
2. Monitor for 30 minutes for any errors
3. Verify Uptime Robot shows healthy
4. Check Docker health status

---

## Metrics Collection

### Coda MCP Metrics

Track these metrics:

```
coda_mcp_health_check_latency_ms
coda_mcp_mcp_request_latency_ms
coda_mcp_session_count
coda_mcp_total_requests
coda_mcp_total_tokens_estimated
coda_mcp_auth_failures
coda_mcp_memory_bytes
coda_mcp_container_uptime
```

### Integration with Prometheus (Optional)

```typescript
// Future enhancement: expose /metrics endpoint
// For Prometheus scraping
app.get('/metrics', (req: Request, res: Response) => {
  res.set('Content-Type', 'text/plain');
  res.send(`
# HELP coda_mcp_health_check_latency_ms Health check response time
# TYPE coda_mcp_health_check_latency_ms gauge
coda_mcp_health_check_latency_ms ${lastHealthCheckMs}

# HELP coda_mcp_session_count Active session count
# TYPE coda_mcp_session_count gauge
coda_mcp_session_count ${Object.keys(sessions).length}

# HELP coda_mcp_total_requests Total requests processed
# TYPE coda_mcp_total_requests counter
coda_mcp_total_requests ${totalRequests}
  `);
});
```

---

## Deployment Checklist

Before deploying to production:

- [ ] Run `pnpm build` successfully
- [ ] Run `./test-oauth.sh` - all tests passing
- [ ] Run `./validate-deployment.sh` - all validations passing
- [ ] Docker build completes without warnings
- [ ] Image size < 200MB
- [ ] Dockerfile multi-stage build verified
- [ ] .dockerignore excludes all unnecessary files
- [ ] Environment variables set (NODE_ENV, PORT)
- [ ] Health check endpoint responds
- [ ] Bearer token validation working
- [ ] OAuth endpoints accessible
- [ ] Uptime Robot configured
- [ ] Logging verified
- [ ] Rollback plan documented

---

## Support and Runbooks

### Quick Troubleshooting Runbook

**Container unhealthy**
1. `docker logs coda-mcp | tail -50`
2. Check if server is listening: `curl http://localhost:8080/health`
3. Restart: `docker-compose restart coda-mcp`
4. If still failing: `docker-compose logs coda-mcp`

**Endpoint returns 401**
1. Verify token is valid: `curl /oauth/validate-token`
2. Check Bearer token format: `Authorization: Bearer <token>`
3. Ensure token is passed to all /mcp requests

**Performance degradation**
1. Check Docker stats: `docker stats coda-mcp`
2. Review logs for errors: `docker logs coda-mcp | grep ERROR`
3. Check Coda API status: https://coda.io/status
4. Consider rate limiting or caching

---

**Last Updated**: 2025-11-01
**Status**: Production-Ready
**Monitoring Level**: Tier 2 (Health checks + external monitoring)
