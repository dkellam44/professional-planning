# Open WebUI Custom Functions Deployment Guide

## Overview

Custom functions enable Open WebUI to call external APIs (Planner API, Memory Gateway) directly from chat. These functions provide:

- **create_plan**: Generate structured plans from natural language intent
- **schedule_tasks**: Schedule plan tasks to Google Calendar
- **query_memory**: Retrieve contextual information from Memory Gateway
- **reflect_daily**: Generate daily reflections and insights

## Prerequisites

- Open WebUI running and accessible at `https://chat.bestviable.com`
- Admin access to Open WebUI
- Planner API deployed and running
- Memory Gateway deployed and running

## Function Files

```
/Users/davidkellam/workspace/portfolio/service-builds/open-webui/functions/
├── create_plan.py
├── schedule_tasks.py
├── query_memory.py
└── reflect_daily.py
```

## Installation Steps

### Step 1: Access Open WebUI Admin Panel

1. Navigate to: `https://chat.bestviable.com/admin`
2. Login with admin credentials
3. Click **Functions** in the left sidebar

### Step 2: Create Function - Create Plan

1. Click **+ Create Function** button
2. **Title**: `Create Plan`
3. **Upload file**: Select `create_plan.py`
4. Click **Save Function**

**Function Details:**
- **Endpoint**: `/api/v1/planner/plan`
- **Method**: POST
- **Input**: `intent` (string), optional `engagement_id` (int)
- **Output**: Plan ID, title, and SOP (Standard Operating Procedure)

**Example Usage in Chat:**
```
User: "Create a plan for client onboarding"
→ Function calls: create_plan(intent="Create a plan for client onboarding")
→ Returns: Plan with structured checklist
```

### Step 3: Create Function - Schedule Tasks

1. Click **+ Create Function** button
2. **Title**: `Schedule Tasks`
3. **Upload file**: Select `schedule_tasks.py`
4. Click **Save Function**

**Function Details:**
- **Endpoint**: `/api/v1/scheduler/schedule`
- **Method**: POST
- **Input**: `plan_id` (int), optional `start_date` (YYYY-MM-DD)
- **Output**: Schedule run ID and calendar events created

**Example Usage in Chat:**
```
User: "Schedule plan #42 to my calendar starting Monday"
→ Function calls: schedule_tasks(plan_id=42, start_date="2025-12-15")
→ Returns: 5 calendar events created
```

### Step 4: Create Function - Query Memory

1. Click **+ Create Function** button
2. **Title**: `Query Memory`
3. **Upload file**: Select `query_memory.py`
4. Click **Save Function**

**Function Details:**
- **Endpoint**: `/api/v1/memory/recall`
- **Method**: GET
- **Input**: `query` (string), optional `k` (int, default 10)
- **Output**: List of relevant memories with similarity scores

**Example Usage in Chat:**
```
User: "What are my scheduling preferences?"
→ Function calls: query_memory(query="scheduling preferences")
→ Returns: Memories about work hours, meeting preferences, etc.
```

### Step 5: Create Function - Reflect Daily

1. Click **+ Create Function** button
2. **Title**: `Reflect Daily`
3. **Upload file**: Select `reflect_daily.py`
4. Click **Save Function**

**Function Details:**
- **Endpoint**: `/api/v1/observer/reflect`
- **Method**: POST
- **Input**: None (uses current day data)
- **Output**: Daily reflection with insights and recommendations

**Example Usage in Chat:**
```
User: "Generate today's reflection"
→ Function calls: reflect_daily()
→ Returns: Summary of day's activities, key insights, recommendations
```

## Testing Functions

### Test 1: Create Plan

```bash
curl -X POST http://planner.bestviable.com/api/v1/planner/plan \
  -H "Content-Type: application/json" \
  -d '{
    "intent": "Plan client onboarding",
    "context": {"client_id": 1}
  }'
```

### Test 2: Query Memory

```bash
curl -X GET "http://memory.bestviable.com/api/v1/memory/recall?query=preferences&k=5"
```

### Test 3: Reflect Daily

```bash
curl -X POST "http://planner.bestviable.com/api/v1/observer/reflect?mode=daily"
```

## Troubleshooting

### Function Not Available in Chat

**Issue**: Function is uploaded but doesn't appear in chat suggestions

**Solution**:
1. Refresh browser: `Cmd+Shift+R` (Mac) or `Ctrl+Shift+R` (Windows)
2. Clear browser cache
3. Restart Open WebUI container: `docker-compose restart open-webui`

### Function Returns "Connection Error"

**Issue**: Function fails with "Failed to connect to Planner API"

**Solution**:
1. Verify Planner API is running: `ssh droplet "docker-compose -f /home/david/services/planner-api ps"`
2. Check network connectivity: `ssh droplet "docker network inspect portfolio-network"`
3. Verify Open WebUI can reach services: `docker exec open-webui curl http://planner-api:8091/health`

### Function Returns "Timeout"

**Issue**: Function times out after 30 seconds

**Solution**:
1. Check if Planner API is responsive: `curl http://localhost:8091/health`
2. Monitor LLM latency (OpenRouter calls can be slow)
3. Increase timeout in function code if needed

### Function Returns Empty Results

**Issue**: Query returns no results or null values

**Solution**:
1. Verify Memory Gateway is running: `docker-compose -f /home/david/services/memory-gateway ps`
2. Check for indexing issues in Qdrant/Postgres
3. Try query_memory() with different search terms

## Updating Functions

To update a function:

1. Edit the `.py` file locally
2. In Open WebUI admin, click the function
3. Click **Update** and select the updated file
4. Test the function in chat

## Security Considerations

1. **API Key Protection**: Functions use Docker internal networks (no API key exposure)
2. **Rate Limiting**: Consider adding rate limits if functions are heavily used
3. **Input Validation**: Functions validate inputs before sending to APIs
4. **Error Handling**: All functions include comprehensive error handling

## Performance Optimization

- **Caching**: Memory Gateway caches results for 1 hour (24 hours for events)
- **Connection Pooling**: Planner API uses connection pool for Postgres
- **Async Execution**: Functions are non-blocking and concurrent

## Monitoring

### Check Function Execution Logs

In Open WebUI Admin → Functions, click on a function to view:
- Last execution time
- Success/failure status
- Execution duration
- Error messages (if any)

### Monitor Backend Services

```bash
# Check Planner API health
curl http://planner.bestviable.com/health | jq .

# Check Memory Gateway health
curl http://memory.bestviable.com/health | jq .

# Monitor real-time logs
docker-compose -f /home/david/services/planner-api logs -f planner-api
docker-compose -f /home/david/services/memory-gateway logs -f memory-gateway
```

## Best Practices

1. **Use Descriptive Prompts**: Tell Claude what context you need
   - ✅ "Query memory about my client onboarding preferences"
   - ❌ "Query memory"

2. **Chain Functions**: Combine functions for complex workflows
   - Example: Query preferences → Create plan → Schedule tasks

3. **Review Results**: Check function responses in chat before acting on them
   - Functions may return errors or partial data

4. **Monitor Costs**: Each function call may incur LLM API costs
   - Track usage in Langfuse dashboard

## Support & Troubleshooting

- **Open WebUI Docs**: https://docs.openwebui.com/
- **Function API**: Open WebUI Admin → API Reference
- **Log Files**: `docker-compose logs open-webui | grep ERROR`

