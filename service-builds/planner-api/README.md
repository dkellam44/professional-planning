# Planner API

**Consolidated Planner API service** combining Planner + Scheduler + Observer functionality.

## Overview

The Planner API is a comprehensive service that handles the complete lifecycle of planning and execution:
1. **Planner** - Converts natural language intents into structured SOPs (Standard Operating Procedures)
2. **Scheduler** - Transforms SOPs into optimized calendar schedules with Google Calendar integration
3. **Observer** - Generates reflections from events and execution data, extracting high-salience insights

## Architecture

```
planner-api/
├── app/
│   ├── main.py              # FastAPI entrypoint
│   ├── config.py            # Configuration settings
│   ├── models.py            # Pydantic models
│   ├── routes/
│   │   ├── health.py        # Health check endpoint
│   │   ├── planner.py       # Plan generation endpoint
│   │   ├── scheduler.py     # Schedule creation endpoint
│   │   └── observer.py      # Reflection generation endpoint
│   └── services/
│       ├── postgres.py      # Postgres database client
│       ├── memory.py        # Memory Gateway client
│       ├── llm.py          # LLM integration (OpenRouter)
│       ├── gcal.py         # Google Calendar integration
│       └── fact_extractor.py # Fact extraction service
├── Dockerfile
├── docker-compose.yml
└── requirements.txt
```

## Key Endpoints

### 1. Planner - `/api/v1/planner/plan`
Convert natural language intent into structured SOP.

**Request:**
```json
{
  "intent": "Build a marketing campaign for product launch",
  "plan_title": "Q1 Product Launch Campaign",
  "context": {
    "client_id": 1,
    "deadline": "2024-03-31"
  }
}
```

**Response:**
```json
{
  "plan_id": 123,
  "plan_title": "Q1 Product Launch Campaign",
  "status": "draft",
  "client_id": 1,
  "sop": {
    "name": "Q1 Product Launch Campaign",
    "summary": "Comprehensive marketing campaign...",
    "checklist": [...]
  }
}
```

### 2. Scheduler - `/api/v1/scheduler/schedule`
Convert a plan into calendar events.

**Request:**
```json
{
  "plan_id": 123,
  "start_date": "2024-12-08",
  "client_id": 1
}
```

**Response:**
```json
{
  "scheduler_run_id": 456,
  "plan_id": 123,
  "events_created": 5,
  "calendar_events": [
    {
      "event_id": "gcal_abc123",
      "title": "Campaign Planning Session",
      "start_time": "2024-12-08T09:00:00-08:00",
      "end_time": "2024-12-08T11:00:00-08:00"
    }
  ],
  "status": "completed"
}
```

### 3. Observer - `/api/v1/observer/reflect?mode=daily|weekly`
Generate reflections from recent events.

**Request:**
```
POST /api/v1/observer/reflect?mode=daily&client_id=1
```

**Response:**
```json
{
  "reflection_id": 789,
  "mode": "daily",
  "client_id": 1,
  "reflection_text": "Today you completed 3 tasks...",
  "facts_extracted": 2,
  "status": "completed",
  "metadata": {
    "events_analyzed": 5,
    "key_insights": [
      "Time estimates are consistently 20% under actual"
    ]
  }
}
```

### 4. Health Check - `/health`
Service health and dependency status.

**Response:**
```json
{
  "status": "healthy",
  "version": "0.2.0",
  "dependencies": [
    {"name": "postgres", "status": "up"},
    {"name": "memory-gateway", "status": "up"},
    {"name": "openrouter", "status": "up"},
    {"name": "google-calendar", "status": "up"}
  ]
}
```

## Configuration

### Environment Variables

```bash
# Networking
PORT=8091
SERVICE_DOMAIN=planner.bestviable.com
LOG_LEVEL=INFO

# Postgres
POSTGRES_HOST=postgres
POSTGRES_PORT=5432
POSTGRES_DB=n8n
POSTGRES_USER=n8n
POSTGRES_PASSWORD=your_password

# Memory Gateway
MEMORY_GATEWAY_URL=http://memory-gateway:8090

# LLM (OpenRouter)
OPENROUTER_API_KEY=your_api_key
OPENROUTER_MODEL=anthropic/claude-3.5-sonnet

# Langfuse (optional observability)
LANGFUSE_PUBLIC_KEY=your_public_key
LANGFUSE_SECRET_KEY=your_secret_key
LANGFUSE_ENABLED=true

# Google Calendar
GCAL_CREDENTIALS_PATH=/app/credentials/gcal.json
GCAL_TIMEZONE=America/Los_Angeles

# Client
CLIENT_ID=1
```

### Google Calendar Setup

1. **Create Google Cloud Project**
   - Go to [Google Cloud Console](https://console.cloud.google.com)
   - Create a new project or select an existing one

2. **Enable Google Calendar API**
   - Navigate to "APIs & Services" > "Library"
   - Search for "Google Calendar API"
   - Click "Enable"

3. **Create OAuth 2.0 Credentials**
   - Go to "APIs & Services" > "Credentials"
   - Click "Create Credentials" > "OAuth client ID"
   - Choose "Desktop app" as application type
   - Download the JSON file

4. **Mount Credentials**
   - Save the downloaded JSON as `credentials/gcal.json`
   - This directory is mounted into the Docker container

## Deployment

### Local Development

```bash
# Install dependencies
pip install -r requirements.txt

# Run locally
uvicorn app.main:app --host 0.0.0.0 --port 8091 --reload
```

### Docker Deployment

```bash
# Build image
docker build -t planner-api:0.2.0 .

# Run with docker-compose
docker-compose up -d

# View logs
docker-compose logs -f planner-api
```

### Production Deployment

The service is configured for deployment with:
- **Traefik** for SSL termination and routing
- **Domain:** planner.bestviable.com
- **Port:** 8091
- **Network:** portfolio-network
- **Memory Limit:** 350M

## Dependencies

- **FastAPI** - Web framework
- **Postgres** - Data persistence (plans, reflections, facts)
- **Memory Gateway** - Memory retrieval and storage (Zep Cloud)
- **OpenRouter** - LLM inference (Claude 3.5 Sonnet)
- **Google Calendar API** - Calendar event management
- **Langfuse** - LLM observability (optional)

## Data Models

### Plans
- Stored in `plans` table
- Contains: intent, SOP, client_id, status, metadata

### Scheduler Runs
- Stored in `scheduler_runs` table (to be created)
- Contains: plan_id, events_created, schedule_data, metadata

### Reflections
- Stored in `reflections` table (to be created)
- Contains: mode, reflection_text, client_id, metadata

### Facts
- Stored in `facts` table (to be created)
- Contains: fact_text, category, salience, tags, client_id

## Database Schema (Required)

You will need to create these additional tables:

```sql
-- Scheduler runs
CREATE TABLE scheduler_runs (
    id SERIAL PRIMARY KEY,
    plan_id INTEGER REFERENCES plans(id),
    client_id INTEGER NOT NULL,
    events_created INTEGER,
    schedule_data JSONB,
    status VARCHAR(50),
    metadata JSONB,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Reflections
CREATE TABLE reflections (
    id SERIAL PRIMARY KEY,
    client_id INTEGER NOT NULL,
    mode VARCHAR(20) NOT NULL,
    reflection_text TEXT,
    reflection_data JSONB,
    facts_extracted INTEGER DEFAULT 0,
    status VARCHAR(50),
    metadata JSONB,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Facts
CREATE TABLE facts (
    id SERIAL PRIMARY KEY,
    client_id INTEGER NOT NULL,
    fact_text TEXT NOT NULL,
    category VARCHAR(50),
    salience FLOAT,
    tags TEXT[],
    source_type VARCHAR(50),
    source_id INTEGER,
    metadata JSONB,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_facts_client_id ON facts(client_id);
CREATE INDEX idx_facts_category ON facts(category);
CREATE INDEX idx_facts_salience ON facts(salience);
```

## Issues and Limitations

### Known Issues
1. **Google Calendar Authentication** - Currently uses OAuth flow which requires manual intervention. Consider using service account credentials for production.
2. **Database Tables** - Scheduler runs, reflections, and facts tables need to be created manually.
3. **Memory Gateway Integration** - Fact syncing to Memory Gateway is placeholder code and needs implementation.
4. **Event Querying** - Event and execution_runs queries return placeholder data and need real implementations.

### Future Enhancements
- Implement service account authentication for Google Calendar
- Add database migrations for new tables
- Complete Memory Gateway integration for fact storage
- Add event tracking system
- Implement execution variance tracking
- Add batch scheduling capabilities
- Support for multiple calendars

## Ready for Deployment?

**Partial** - The service code is complete but requires:
1. Google Calendar credentials setup
2. Database schema creation (new tables)
3. Memory Gateway fact storage endpoint implementation
4. Testing with real data

The core functionality (Planner, Scheduler, Observer) is implemented and ready for testing in development environment.

## Version History

- **0.2.0** - Consolidated Planner API (Planner + Scheduler + Observer)
- **0.1.0** - Original Planner Engine (Planner only)
