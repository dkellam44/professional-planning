# Planner API Deployment Guide

## Quick Start

### 1. Prerequisites

- Docker and Docker Compose installed
- Postgres database running (with existing `plans` table)
- Memory Gateway service running
- OpenRouter API key
- Google Cloud project with Calendar API enabled

### 2. Database Setup

Run the schema migration to create required tables:

```bash
# Connect to your Postgres database
psql -h localhost -U n8n -d n8n

# Run the schema file
\i /path/to/planner-api/schema.sql
```

Or using Docker:

```bash
docker exec -i postgres psql -U n8n -d n8n < schema.sql
```

### 3. Google Calendar Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Enable Google Calendar API
3. Create OAuth 2.0 credentials (Desktop app)
4. Download credentials JSON file
5. Save as `credentials/gcal.json`

```bash
# Place credentials file
mkdir -p credentials
mv ~/Downloads/client_secret_*.json credentials/gcal.json
```

### 4. Environment Configuration

```bash
# Copy example environment file
cp .env.example .env

# Edit with your values
vim .env
```

Required variables:
- `POSTGRES_PASSWORD` - Your Postgres password
- `OPENROUTER_API_KEY` - Your OpenRouter API key
- `LANGFUSE_PUBLIC_KEY` - Langfuse public key (optional)
- `LANGFUSE_SECRET_KEY` - Langfuse secret key (optional)

### 5. Build and Deploy

```bash
# Build the Docker image
docker build -t planner-api:0.2.0 .

# Start the service
docker-compose up -d

# Check logs
docker-compose logs -f planner-api
```

### 6. Verify Deployment

```bash
# Check health endpoint
curl http://localhost:8091/health

# Should return:
# {
#   "status": "healthy",
#   "version": "0.2.0",
#   "dependencies": [...]
# }
```

## Production Deployment

### Network Setup

The service expects to be on the `portfolio-network` Docker network:

```bash
# Create network if it doesn't exist
docker network create portfolio-network

# Connect existing services
docker network connect portfolio-network postgres
docker network connect portfolio-network memory-gateway
```

### Traefik Configuration

The service is configured with Traefik labels for automatic SSL:

- Domain: `planner.bestviable.com`
- SSL: Let's Encrypt (via Traefik)
- HTTP → HTTPS redirect enabled

Ensure your DNS points to the server and Traefik is running.

### Resource Limits

- Memory: 350M (configurable in docker-compose.yml)
- CPU: 0.5 cores
- Port: 8091 (exposed on localhost only, Traefik handles external)

## Testing Endpoints

### 1. Create a Plan

```bash
curl -X POST http://localhost:8091/api/v1/planner/plan \
  -H "Content-Type: application/json" \
  -d '{
    "intent": "Plan a team offsite retreat",
    "plan_title": "Q1 Team Retreat",
    "context": {
      "client_id": 1,
      "deadline": "2025-03-15"
    }
  }'
```

### 2. Schedule a Plan

```bash
curl -X POST http://localhost:8091/api/v1/scheduler/schedule \
  -H "Content-Type: application/json" \
  -d '{
    "plan_id": 1,
    "start_date": "2025-01-15",
    "client_id": 1
  }'
```

### 3. Generate Reflection

```bash
curl -X POST "http://localhost:8091/api/v1/observer/reflect?mode=daily&client_id=1"
```

## Troubleshooting

### Google Calendar Authentication Error

**Issue:** `google.auth.exceptions.RefreshError`

**Solution:**
1. Delete `credentials/gcal_token.json`
2. Restart service
3. Complete OAuth flow when prompted

**Note:** For production, use service account credentials instead of OAuth.

### Database Connection Error

**Issue:** `PostgresConnectionError`

**Solution:**
1. Verify Postgres is running: `docker ps | grep postgres`
2. Check connection settings in `.env`
3. Ensure service is on same network: `docker network inspect portfolio-network`

### Memory Gateway Unavailable

**Issue:** Health check shows memory-gateway as "down"

**Solution:**
1. Verify Memory Gateway is running
2. Check MEMORY_GATEWAY_URL in `.env`
3. Ensure both services on same Docker network

### LLM Rate Limiting

**Issue:** `503 Service Unavailable` from scheduler/observer

**Solution:**
1. Check OpenRouter account credits
2. Verify API key is correct
3. Review rate limits in Langfuse dashboard

## Monitoring

### Logs

```bash
# Follow logs
docker-compose logs -f planner-api

# Last 100 lines
docker-compose logs --tail=100 planner-api

# Filter for errors
docker-compose logs planner-api | grep ERROR
```

### Health Checks

The service includes built-in health checks:

```bash
# Docker health status
docker inspect planner-api --format='{{.State.Health.Status}}'

# Detailed health info
curl http://localhost:8091/health | jq
```

### Langfuse Observability

If Langfuse is configured, view LLM traces at:
- Dashboard: https://cloud.langfuse.com
- Trace every plan generation, scheduling, and reflection

## Backup and Recovery

### Database Backup

```bash
# Backup all planner tables
docker exec postgres pg_dump -U n8n -d n8n \
  -t plans -t scheduler_runs -t reflections -t facts \
  > planner_backup_$(date +%Y%m%d).sql
```

### Restore

```bash
docker exec -i postgres psql -U n8n -d n8n < planner_backup_20241207.sql
```

## Updating

### Update Application Code

```bash
# Pull latest code
git pull

# Rebuild image
docker build -t planner-api:0.2.1 .

# Update docker-compose.yml version
vim docker-compose.yml  # Change image version

# Restart service
docker-compose up -d

# Verify
docker-compose logs -f planner-api
```

### Database Migrations

For schema changes:
1. Create migration SQL file
2. Apply to database
3. Test with sample data
4. Update schema.sql for future deployments

## Security Considerations

1. **Google Calendar Credentials** - Store securely, never commit to git
2. **API Keys** - Use environment variables, rotate regularly
3. **Database Access** - Restrict to service network only
4. **HTTPS Only** - Traefik handles SSL, never expose port 8091 externally
5. **Rate Limiting** - Consider adding rate limiting middleware

## Performance Tuning

### Database Indexes

The schema.sql includes optimized indexes. Monitor query performance:

```sql
-- Check slow queries
SELECT query, mean_exec_time, calls
FROM pg_stat_statements
WHERE query LIKE '%plans%'
ORDER BY mean_exec_time DESC
LIMIT 10;
```

### Connection Pooling

Asyncpg pool settings (in postgres.py):
- Min connections: 2
- Max connections: 10
- Adjust based on load

### Memory Optimization

If hitting memory limits:
1. Reduce connection pool size
2. Decrease max_tokens in LLM calls
3. Increase container memory limit

## Support

For issues or questions:
1. Check logs: `docker-compose logs planner-api`
2. Verify health: `curl localhost:8091/health`
3. Review README.md for common issues
4. Check database schema matches schema.sql
