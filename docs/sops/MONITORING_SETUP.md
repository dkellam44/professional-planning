# Monitoring Setup - Phase 3 Go-Live

- entity: monitoring_setup
- level: operational
- zone: internal
- version: v01
- tags: [monitoring, uptime-kuma, dozzle, phase3, webhooks]
- source_path: /docs/MONITORING_SETUP.md
- date: 2025-11-05

---

## Overview

Once webhooks are live, we need to surface failures quickly. This guide configures:
1. **Uptime Kuma:** Health checks on memory webhooks & databases
2. **Dozzle:** Log aggregation & filtering for errors
3. **Alerts:** Webhooks that notify if something breaks

---

## Part 1: Uptime Kuma Webhook Monitors

**Access:** https://kuma.bestviable.com

### Monitor 1: memory/assemble Endpoint

**Create new monitor:**
```
Name: N8N Memory Assemble Webhook
Type: HTTP(s)
URL: https://n8n.bestviable.com/webhook/memory/assemble
Method: POST
Body: {"client_id": 1, "query": "test"}
Interval: 5 minutes
Timeout: 3 seconds
Success Criteria: Status 200 AND response time < 3000ms
```

**Setup Steps:**
1. Open https://kuma.bestviable.com
2. Click "Add Monitor"
3. Fill in above details
4. Enable "Notification" → Select alert channel (create if needed)

### Monitor 2: memory/writeback Endpoint

```
Name: N8N Memory Writeback Webhook
Type: HTTP(s)
URL: https://n8n.bestviable.com/webhook/memory/writeback
Method: POST
Body: {"client_id": 1, "conversation": [{"role": "user", "content": "test"}]}
Interval: 10 minutes
Timeout: 5 seconds
Success Criteria: Status 200 AND response time < 5000ms
```

### Monitor 3: Postgres Health Check

```
Name: N8N Postgres Connection
Type: TCP
Hostname: postgres
Port: 5432
Interval: 2 minutes
Timeout: 5 seconds
```

**Note:** Works because docker-compose uses service names as hostnames on the same network.

### Monitor 4: Qdrant Vector DB Health

```
Name: N8N Qdrant Health
Type: HTTP(s)
URL: http://qdrant:6333/health
Method: GET
Interval: 5 minutes
Timeout: 5 seconds
Success Criteria: Status 200
```

### Monitor 5: N8N Itself

```
Name: N8N Engine Health
Type: HTTP(s)
URL: https://n8n.bestviable.com/healthz
Method: GET
Interval: 2 minutes
Timeout: 5 seconds
Success Criteria: Status 200
```

---

## Part 2: Alert Channels (Notifications)

### Create Webhook Alert Channel

In Uptime Kuma:
1. Settings → Notifications
2. Click "Add Notification"
3. Select "Webhook"

**Configuration:**
```
Name: N8N Workflow Alerts
URL: https://n8n.bestviable.com/webhook/alerts
Method: POST
Content Type: application/json
Body (template):
{
  "event": "monitor_alert",
  "monitor_name": "$MONITOR_NAME",
  "status": "$STATUS",
  "response_time_ms": "$RESPONSE_TIME",
  "uptime": "$UPTIME",
  "timestamp": "$TIMESTAMP"
}
```

**Optional: Create N8N workflow to receive these alerts**
- Workflow name: `monitor-alert-handler`
- Endpoint: `/webhook/alerts`
- Actions: Log to database, send email, post to Slack

---

## Part 3: Dozzle Log Filtering

**Access:** https://logs.bestviable.com

### Create Filter Dashboard 1: N8N Workflow Errors

```
Container: n8n
Log Level: ERROR, WARN
Grep Pattern: workflow|execution|error
Time Range: Last 24 hours
Display: Most recent first
Max Lines: 100
```

**Steps:**
1. Go to https://logs.bestviable.com
2. Select container: "n8n"
3. Click filter icon
4. Enter above criteria
5. Bookmark the URL for quick access

### Create Filter Dashboard 2: Webhook Execution Logs

```
Container: n8n
Grep Pattern: webhook|memory-assemble|memory-writeback|assemble|writeback
Time Range: Last 24 hours
Display: Most recent first
Max Lines: 50
```

### Create Filter Dashboard 3: Database Connection Issues

```
Containers: postgres, n8n
Grep Pattern: connection|SQL|ERROR|failed|timeout|FATAL
Time Range: Last 24 hours
Display: Most recent first
Max Lines: 100
```

### Create Filter Dashboard 4: API Key Errors

```
Container: n8n
Grep Pattern: API|key|authentication|401|403|unauthorized
Time Range: Last 24 hours
Display: Most recent first
Max Lines: 50
```

**Bookmark these filtered views for quick troubleshooting.**

---

## Part 4: Dozzle Bookmark Setup

Add to browser bookmarks for quick access during incidents:

```
📊 Logs - Webhooks: https://logs.bestviable.com/?container=n8n&grep=webhook
🔴 Logs - Errors: https://logs.bestviable.com/?container=n8n&grep=ERROR
🟡 Logs - Warnings: https://logs.bestviable.com/?container=n8n&grep=WARN
📡 Logs - Database: https://logs.bestviable.com/?containers=postgres,n8n&grep=connection
```

---

## Part 5: Dashboard Overview (Optional)

Create a custom dashboard in Open WebUI to aggregate all monitoring:

**In Open WebUI Admin → Custom Integrations:**

1. **Add Uptime Kuma Widget**
   ```html
   <iframe src="https://kuma.bestviable.com/api/badge/5/status" width="200" height="50"></iframe>
   ```

2. **Add Dozzle Link**
   ```html
   <a href="https://logs.bestviable.com/?container=n8n&grep=webhook">
     View N8N Webhook Logs
   </a>
   ```

3. **Add Manual Health Check Button**
   ```html
   <button onclick="fetch('https://n8n.bestviable.com/healthz').then(r => alert('N8N Status: ' + r.status))">
     Check N8N Health
   </button>
   ```

---

## Part 6: Alerting Thresholds & Escalation

### Alert Rules

| Metric | Threshold | Action |
|--------|-----------|--------|
| Webhook response time | > 5 seconds | WARN (log) |
| Webhook response time | > 10 seconds | ERROR (alert) |
| Webhook downtime | > 5 minutes | CRITICAL (escalate) |
| Postgres connection | Can't connect | CRITICAL (page) |
| Qdrant vector search | Timeout | WARN (log) |

### Escalation Policy

**Level 1 (Auto-recovery expected):**
- Log to Dozzle
- N8N workflow retries automatically
- Monitor for 15 minutes

**Level 2 (Manual intervention may be needed):**
- Alert via Uptime Kuma notification
- Check Dozzle logs (workflow errors)
- Inspect n8n execution details

**Level 3 (Service down):**
- Database connection fails
- Webhook returning 5xx errors consistently
- Manual intervention: SSH to droplet, check Docker status

---

## Part 7: Testing the Monitoring

### Test Webhook Monitor

1. **Stop N8N temporarily:**
   ```bash
   ssh tools-droplet-agents "docker stop n8n"
   ```

2. **Wait 5 minutes** (Uptime Kuma polling interval)

3. **Check Uptime Kuma:**
   - Monitor should show RED (down)
   - Alert should be triggered

4. **Restart N8N:**
   ```bash
   ssh tools-droplet-agents "docker start n8n"
   ```

5. **Verify recovery:**
   - Monitor should show GREEN
   - Uptime percentage updates

### Test Log Filtering

1. **Generate test error in N8N:**
   ```bash
   # In N8N workflow, intentionally fail a node
   # Or via API:
   curl -X POST https://n8n.bestviable.com/webhook/test-error \
     -d '{"trigger": "test"}'
   ```

2. **Check Dozzle:**
   - https://logs.bestviable.com/?container=n8n&grep=test-error
   - Error should appear in logs

### Test Alert Webhook

1. **Trigger test alert from Uptime Kuma:**
   - Settings → Notifications → Test

2. **Check if N8N webhook-handler workflow was triggered:**
   - https://n8n.bestviable.com → Executions
   - Look for recent `monitor-alert-handler` execution

---

## Part 8: Post-Incident Review

After any incident, document:

1. **What failed:**
   - Time, service, error message

2. **Root cause:**
   - API rate limit exceeded?
   - Database timeout?
   - Network connectivity?

3. **Detection time:**
   - How long before we noticed?
   - Did Uptime Kuma catch it?

4. **Resolution:**
   - What fixed it?
   - Time to resolution?

5. **Prevention:**
   - How to prevent next time?
   - Threshold adjustment needed?

**Store in:** `/docs/incidents/YYYY-MM-DD_incident_name.md`

---

## Part 9: Monitoring Checklist

**Daily (automated):**
- ✅ Uptime Kuma runs health checks every 2-10 minutes
- ✅ Dozzle continuously collects logs
- ✅ Alerts triggered on thresholds

**Weekly (manual):**
- [ ] Check Uptime Kuma dashboard (all monitors GREEN?)
- [ ] Review Dozzle error logs (any new patterns?)
- [ ] Verify alert channels working (send test alert)

**Monthly:**
- [ ] Audit webhook performance (response times)
- [ ] Review incident log (any recurring issues?)
- [ ] Test alert routing (make sure notifications reach you)
- [ ] Update alerting thresholds if needed

---

## Quick Reference Commands

```bash
# Check n8n health
curl -s https://n8n.bestviable.com/healthz | jq .

# View recent n8n logs
ssh tools-droplet-agents "docker logs n8n --tail 50"

# Check postgres connectivity
ssh tools-droplet-agents "docker exec postgres psql -U n8n -d n8ndb -c 'SELECT 1;'"

# Check qdrant health
ssh tools-droplet-agents "curl -s http://localhost:6333/health | jq ."

# Trigger webhook monitor from CLI
curl -X POST https://n8n.bestviable.com/webhook/memory/assemble \
  -H "Content-Type: application/json" \
  -d '{"client_id": 1, "query": "test"}' | jq .
```

---

## Dashboard Access

| Tool | URL | Purpose |
|------|-----|---------|
| **N8N** | https://n8n.bestviable.com | Workflow management & execution logs |
| **Uptime Kuma** | https://kuma.bestviable.com | Health check dashboard |
| **Dozzle** | https://logs.bestviable.com | Real-time log aggregation |
| **Open WebUI** | https://openweb.bestviable.com | Chat client (for manual testing) |

---

**Version:** 1.0
**Status:** Ready for Phase 3 go-live
**Setup Time:** 30-45 minutes
**Maintenance:** 10 mins/week

