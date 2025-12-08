# n8n Observer Workflow Update Guide

## Overview

After deploying the Planner API service, n8n workflows need updates to:
1. Redirect observer calls from individual services to unified Planner API
2. Eliminate Coda MCP calls and Coda sync workflows
3. Configure new fact extraction pipeline
4. Update trigger schedules for daily/weekly reflections

## Current State (Pre-Update)

### Active Workflows
- ✅ `event-logger` - Logs events to Postgres
- ✅ `daily-observer-trigger` - Cron: 6 PM daily (calls old observer endpoint)
- ✅ `weekly-observer-trigger` - Cron: 6 PM Friday (calls old observer endpoint)
- ❌ `coda-to-calendar-sync` - DEPRECATED (Coda dual-storage eliminated)
- ❌ `calendar-to-coda-sync` - DEPRECATED (Coda dual-storage eliminated)

### Deprecated Workflows (TO DEACTIVATE)
- `coda-pattern-tables-sync` - Coda pattern ontology sync
- `coda-memory-export` - Coda memory export (moved to Postgres)

## Phase 1: Disable Coda Sync Workflows

### Steps

**In n8n UI** (`https://n8n.bestviable.com`):

1. **Navigate to Workflows**
2. **Find and Deactivate These Workflows**:
   - `coda-to-calendar-sync`
     - Click workflow → Click "Deactivate" button
     - Confirm deactivation
   - `calendar-to-coda-sync`
     - Click workflow → Click "Deactivate" button
     - Confirm deactivation
   - `coda-pattern-tables-sync` (if exists)
     - Click workflow → Click "Deactivate" button
   - `coda-memory-export` (if exists)
     - Click workflow → Click "Deactivate" button

3. **Verify Deactivation**:
   - Workflows should show "Inactive" status
   - No new Coda sync calls should be made

### Why?
- **Coda MCP is deprecated**: Postgres is now the single source of truth
- **Pattern ontology tables** are in Postgres: `service_blueprints`, `workflows`, `process_templates`, `execution_runs`
- **Memory export** is handled by Memory Gateway: Zep Cloud integration

## Phase 2: Update Observer Trigger Workflows

### Update: daily-observer-trigger

**Current Configuration**:
- Trigger: Cron `0 18 * * *` (6 PM daily)
- Endpoint: Old observer service (deprecated)

**New Configuration**:

1. **In n8n UI**, find and open `daily-observer-trigger` workflow
2. **Update HTTP Request Node**:
   - **URL**: `http://planner-api:8091/api/v1/observer/reflect?mode=daily`
   - **Method**: POST
   - **Headers**:
     ```
     Content-Type: application/json
     ```
   - **Body** (JSON):
     ```json
     {
       "client_id": 1,
       "include_variance_analysis": true
     }
     ```

3. **Update Cron Trigger** (if needed):
   - **Current**: `0 18 * * *` (6 PM UTC daily)
   - **Recommended**: Keep same (18:00 UTC = 10 AM Pacific)
   - To change: Click trigger node → Edit cron expression

4. **Add Response Handling**:
   - After HTTP Request node, add Set node:
     ```
     Set: {{ $json }}
     ```
   - Add Logger node:
     ```
     Log: "Daily reflection generated: {{ $json.reflection }}"
     ```

5. **Save and Test**:
   - Click "Save" button
   - Click "Test workflow" to verify
   - Should return reflection summary, insights, recommendations

### Update: weekly-observer-trigger

**Current Configuration**:
- Trigger: Cron `0 18 * * 5` (6 PM Friday)
- Endpoint: Old observer service (deprecated)

**New Configuration**:

1. **In n8n UI**, find and open `weekly-observer-trigger` workflow
2. **Update HTTP Request Node**:
   - **URL**: `http://planner-api:8091/api/v1/observer/reflect?mode=weekly`
   - **Method**: POST
   - **Headers**:
     ```
     Content-Type: application/json
     ```
   - **Body** (JSON):
     ```json
     {
       "client_id": 1,
       "include_variance_analysis": true
     }
     ```

3. **Update Cron Trigger** (if needed):
   - **Current**: `0 18 * * 5` (6 PM UTC Friday)
   - **Recommended**: Keep same
   - To change: Click trigger node → Edit cron expression

4. **Add Response Handling**:
   - After HTTP Request node, add Set node:
     ```
     Set: {{ $json }}
     ```
   - Add Logger node:
     ```
     Log: "Weekly reflection generated: {{ $json.reflection }}"
     ```

5. **Save and Test**:
   - Click "Save" button
   - Click "Test workflow" to verify
   - Should return reflection summary, weekly insights, recommendations

## Phase 3: Add Fact Extraction Workflow (Optional - Phase 2)

### New Workflow: automatic-fact-extraction

This workflow automatically extracts durable facts from high-salience events.

**Create New Workflow**:

1. **In n8n UI**, click "New Workflow"
2. **Name**: `automatic-fact-extraction`
3. **Trigger**: Webhook (triggered by Planner API on high-salience events)
   - **Node**: Webhook
   - **Method**: POST
   - **Path**: `/fact-extraction-trigger`

4. **HTTP Request Node**:
   - **URL**: `http://planner-api:8091/api/v1/observer/extract-facts`
   - **Method**: POST
   - **Body**: Pass webhook payload through

5. **Database Node** (optional):
   - Insert extracted facts into Postgres `facts` table
   - Set temporal validity (valid_from = NOW, valid_to = NULL)

6. **Save and Test**:
   - Click "Save" button
   - Test with sample high-salience event

## Phase 4: Environment Configuration

### Verify n8n Environment Variables

Check that n8n service has access to:
- `PLANNER_API_URL`: `http://planner-api:8091`
- `MEMORY_GATEWAY_URL`: `http://memory-gateway:8090`

**On droplet**, verify in docker-compose:
```bash
ssh droplet "grep -A 5 'PLANNER_API_URL\|MEMORY_GATEWAY_URL' /home/david/services/n8n/docker-compose.yml"
```

If missing, add environment variables:
```yaml
environment:
  - PLANNER_API_URL=http://planner-api:8091
  - MEMORY_GATEWAY_URL=http://memory-gateway:8090
```

## Phase 5: Testing & Validation

### Test 1: Manual Trigger

1. **In n8n UI**, open `daily-observer-trigger` workflow
2. Click **"Execute workflow"** button
3. **Expected Result**:
   - Workflow runs successfully
   - HTTP Request returns 200 status
   - Response contains `reflection`, `insights`, `recommendations`
   - Execution time: 10-30 seconds

### Test 2: Scheduled Execution

1. **Activate workflow** (ensure toggle is ON)
2. **Wait for scheduled time** (6 PM UTC)
3. **Verify execution**:
   - Check n8n executions log
   - Verify Postgres `events` table has new reflection entry
   - Verify Memory Gateway stored reflection

### Test 3: Error Handling

Simulate failures:
1. **Stop Planner API**: `ssh droplet "docker-compose -f /home/david/services/planner-api pause planner-api"`
2. **Trigger workflow manually**
3. **Expected**: Workflow logs error gracefully (not crashes)
4. **Resume service**: `ssh droplet "docker-compose -f /home/david/services/planner-api unpause planner-api"`

## Migration Checklist

- [ ] Phase 1: Deactivate Coda sync workflows
  - [ ] `coda-to-calendar-sync` deactivated
  - [ ] `calendar-to-coda-sync` deactivated
  - [ ] `coda-pattern-tables-sync` deactivated
  - [ ] `coda-memory-export` deactivated

- [ ] Phase 2: Update observer workflows
  - [ ] `daily-observer-trigger` updated to Planner API
  - [ ] `weekly-observer-trigger` updated to Planner API
  - [ ] Both workflows tested manually
  - [ ] Both workflows scheduled to auto-run

- [ ] Phase 3: Fact extraction (optional)
  - [ ] New workflow created (if implementing)
  - [ ] Webhook integration tested

- [ ] Phase 4: Environment config
  - [ ] PLANNER_API_URL configured
  - [ ] MEMORY_GATEWAY_URL configured

- [ ] Phase 5: Testing complete
  - [ ] Manual execution tests passed
  - [ ] Scheduled execution verified
  - [ ] Error handling validated

## Rollback Plan

If issues occur:

1. **Restore Coda Sync Workflows**:
   - Reactivate `coda-to-calendar-sync`
   - Reactivate `calendar-to-coda-sync`
   - Redeploy Coda MCP service

2. **Restore Old Observer Workflows**:
   - Revert workflow definitions from n8n history
   - Change HTTP endpoints back to old services

3. **Keep Planner API Running**:
   - Can run both old and new systems in parallel
   - Gradually migrate data to new architecture

## Monitoring & Maintenance

### Daily Monitoring

```bash
# Check n8n workflow execution logs
ssh droplet "docker exec n8n n8n -u n8n -d n8ndb list-executions"

# Check Planner API health
curl http://planner.bestviable.com/health | jq .

# Monitor logs
ssh droplet "docker-compose -f /home/david/services/n8n logs -f n8n"
```

### Weekly Checks

1. **Verify reflection generation**:
   - Check that daily/weekly reflections are generated on schedule
   - Verify they're stored in Memory Gateway
   - Check Postgres `events` table for reflection entries

2. **Check fact extraction** (if implemented):
   - Verify facts are being extracted from high-salience events
   - Check temporal validity (valid_from, valid_to)
   - Monitor Zep Cloud graph updates

3. **Monitor performance**:
   - Track Planner API response times
   - Monitor n8n workflow execution duration
   - Check for timeout errors

## Support

- **n8n Docs**: https://docs.n8n.io/
- **Workflow Debugging**: n8n UI → Executions tab → Click on failed execution
- **API Docs**: Planner API at `http://planner.bestviable.com/docs`

