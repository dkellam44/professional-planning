# Spec: Planner API Capability

**Capability ID**: `planner-api`
**Status**: NEW (consolidates planner-engine, scheduler-engine, observer-agent)
**Change ID**: `add-planner-memory-system`

## Overview

The Planner API is a consolidated FastAPI service combining three domain capabilities:
1. **Planner**: Intent → SOP → Tasks transformation (LLM-powered)
2. **Scheduler**: Tasks → Google Calendar blocks optimization
3. **Observer**: Daily/weekly reflections and fact extraction

Single deployment for planning domain with shared business logic and reduced inter-service HTTP calls.

---

## NEW Requirements

### Requirement: Intent → SOP Transformation

The Planner API SHALL transform natural language planning intents into structured SOPs (Standard Operating Procedures).

#### Scenario: Generate SOP from user intent
- **WHEN** POST /api/v1/planner/plan with { intent: "client onboarding for Project Acme", context: {...} }
- **THEN** service calls Memory Gateway recall(query="client onboarding preferences", client_id=1)
- **AND** retrieves scheduling preferences and past onboarding patterns
- **AND** calls LLM (OpenRouter) with sop_generator prompt template
- **AND** LLM returns structured SOP JSON with checklist
- **AND** SOP inserted into Postgres plans table
- **AND** response includes plan_id, plan_title, sop, status="draft"

#### Scenario: SOP includes estimated hours from past execution_runs
- **WHEN** SOP generation includes workflow_id reference
- **THEN** service queries execution_runs where process_template_id matches
- **AND** calculates average actual_hours across completed runs
- **AND** uses actual_hours as estimated_hours for future plans (learning loop)
- **AND** includes variance_pct as risk indicator

#### Scenario: Plan fails to generate (LLM error)
- **WHEN** OpenRouter returns error or timeout
- **THEN** request returns 500 with error_code: "llm_error"
- **AND** partial plan (if any) NOT saved
- **AND** error logged to Postgres events table with salience_score=0.9 (high priority)

### Requirement: Schedule Tasks to Google Calendar

The Planner API SHALL optimize task placement in Google Calendar based on preferences and availability.

#### Scenario: Schedule plan tasks
- **WHEN** POST /api/v1/scheduler/schedule with { plan_id: 42, start_date: "2025-12-10" }
- **THEN** service fetches plan from Postgres plans table
- **AND** queries Google Calendar for existing events (next 14 days)
- **AND** calls Memory Gateway recall(query="scheduling preferences work hours")
- **AND** LLM generates optimized schedule with schedule_optimizer prompt
- **AND** for each task block, calls Google Calendar API to create event
- **AND** returns { scheduler_run_id, events_created, calendar_events: [...] }

#### Scenario: Scheduler respects deep work preferences
- **WHEN** memory includes fact: "Prefer deep work 9-11 AM"
- **THEN** scheduler avoids meetings before 10 AM
- **AND** blocks 2-hour chunks for focus work
- **AND** schedules research/writing during deep work windows

#### Scenario: Scheduler handles timezone correctly
- **WHEN** Google Calendar events created
- **THEN** dateTime fields include timezone: "America/Los_Angeles"
- **AND** respects daylight saving time transitions
- **AND** user sees correct local times in calendar UI

### Requirement: Daily and Weekly Reflections

The Planner API SHALL generate reflections on planning and execution for continuous improvement.

#### Scenario: Generate daily reflection
- **WHEN** POST /api/v1/observer/reflect?mode=daily
- **THEN** queries Postgres events where created_at > NOW() - 24h
- **AND** queries execution_runs where ended_at > NOW() - 24h
- **AND** analyzes variance_pct to identify patterns
- **AND** calls LLM with daily_reflection prompt
- **AND** LLM returns { summary, insights: [], recommendations: [] }
- **AND** stores reflection in Memory Gateway via remember()
- **AND** high-salience insights (>= 0.7) trigger fact extraction

#### Scenario: Variance analysis from execution runs
- **WHEN** execution_runs with completed status exist
- **THEN** service groups by process_template_id
- **AND** calculates variance_pct: (actual - estimated) / estimated * 100
- **AND** if variance > 30%, flags as high-variance (learning opportunity)
- **AND** includes in reflection: "Client onboarding consistently takes 35% longer"

#### Scenario: Extract facts from reflection insights
- **WHEN** reflection includes high-salience insights (>= 0.7)
- **THEN** async task: fact_extractor.extract_facts_from_event(event_id)
- **AND** calls LLM to extract durable facts from reflection
- **AND** inserts facts into Postgres facts table
- **AND** syncs facts to Zep Cloud graph
- **AND** temporal pattern: close old fact, insert new fact with valid_from=NOW()

#### Scenario: Weekly review
- **WHEN** POST /api/v1/observer/reflect?mode=weekly
- **THEN** queries events/runs from last 7 days
- **AND** aggregates daily insights
- **AND** highlights key patterns and blockers
- **AND** provides recommendations for next week

---

## API Contract

### /api/v1/planner/plan (POST)

Request body:
```json
{
  "intent": "client onboarding for Project Acme",
  "engagement_id": 123,
  "context": { "client_id": 1 }
}
```

Response 201:
```json
{
  "plan_id": 42,
  "plan_title": "Project Acme Onboarding",
  "intent": "client onboarding for Project Acme",
  "sop": {
    "checklist": [
      { "step": 1, "title": "Send welcome kit", "estimated_hrs": 0.5 },
      { "step": 2, "title": "Record Loom video", "estimated_hrs": 1.0 }
    ]
  },
  "status": "draft",
  "created_at": "2025-12-07T..."
}
```

### /api/v1/scheduler/schedule (POST)

Request body:
```json
{
  "plan_id": 42,
  "start_date": "2025-12-10"
}
```

Response 201:
```json
{
  "scheduler_run_id": 7,
  "plan_id": 42,
  "events_created": 5,
  "calendar_events": [
    {
      "id": "gcal_event_id",
      "summary": "Send welcome kit",
      "start": "2025-12-10T14:00:00-08:00",
      "end": "2025-12-10T14:30:00-08:00"
    }
  ]
}
```

### /api/v1/observer/reflect (POST)

Query params: `mode=daily|weekly`

Response 200:
```json
{
  "mode": "daily",
  "reflection": {
    "summary": "Productive day with 2 completed workflows...",
    "insights": [
      "Client onboarding consistently 35% longer than estimate",
      "Sprint planning is well-calibrated"
    ],
    "recommendations": [
      "Update onboarding estimate from 2.6h → 3.5h",
      "Add buffer time for async communication"
    ]
  },
  "events_analyzed": 47,
  "runs_analyzed": 2,
  "facts_extracted": 2
}
```

---

## Internal Service Dependencies

- **Memory Gateway** for context recall (preferences, past patterns)
- **Postgres** for plans, execution_runs, prompt_templates
- **Google Calendar API** for scheduling
- **OpenRouter LLM** for planning and reflection generation
- **Zep Cloud** (via Memory Gateway) for fact storage and graphs

---

## Success Criteria

- Planner generates SOPs within 10 seconds
- Scheduler creates calendar events successfully (0 failures)
- Reflections generated on daily/weekly schedule (n8n cron triggers)
- Fact extraction: high-salience insights automatically promoted
- Variance analysis identifies planning estimation issues
- Zero data loss: all operations logged to Postgres audit trail
