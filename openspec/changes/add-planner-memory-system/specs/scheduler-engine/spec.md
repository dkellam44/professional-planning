# Scheduler Engine Specification Delta

## ADDED Requirements

### Requirement: Task to Calendar Scheduling
The system SHALL transform task lists from generated plans into optimized Google Calendar time blocks, considering existing commitments, user preferences, and task constraints.

#### Scenario: Schedule tasks from plan
- **WHEN** a client calls POST `/api/v1/scheduler/schedule` with `{plan_id: 1, tasks: [{task_id: "t-1", title: "Design database schema", estimated_hours: 4, priority: "high"}], constraints: {start_date: "2025-12-02", end_date: "2025-12-20"}}`
- **THEN** the system SHALL fetch the plan from Postgres
- **AND** query Google Calendar API for existing events between start_date and end_date
- **AND** query Memory Gateway for scheduling preferences (e.g., "deep work in mornings", "no meetings after 3 PM")
- **AND** call OpenRouter LLM to generate optimal time blocks
- **AND** create calendar events via Google Calendar API with event metadata `{task_id, plan_id}`
- **AND** store the schedule in Postgres `scheduler_runs` table
- **AND** return status 201 with `{scheduler_run_id, schedule_blocks: [{event_id, task_id, start, end}]}`

#### Scenario: Schedule respects existing calendar commitments
- **WHEN** scheduling tasks
- **AND** Google Calendar shows existing events from 9-11 AM on 2025-12-03
- **THEN** the generated schedule SHALL NOT overlap with existing events
- **AND** SHALL find alternative time slots

#### Scenario: Schedule honors user preferences
- **WHEN** scheduling tasks
- **AND** Memory Gateway returns preference `{deep_work_hours: "9-12", no_context_switching: true}`
- **AND** tasks include high-priority deep work tasks
- **THEN** the schedule SHALL place deep work tasks in 9-12 AM slots
- **AND** batch similar tasks together to minimize context switching

#### Scenario: Schedule respects Sprint capacity constraints
- **WHEN** scheduling tasks for a specific week
- **THEN** the system SHALL query Coda Sprint table for that week's sprint
- **AND** if Sprint exists, respect capacity_hrs limit
- **AND** if Sprint has billable_pct constraint (>= 60% when runway < 12 weeks), prioritize billable tasks
- **AND** ensure total scheduled hours <= Sprint capacity_hrs
- **AND** tasks scheduled in that week will automatically appear in Sprint (computed by scheduled_start_date)

#### Scenario: Sprint auto-population via scheduling
- **WHEN** Scheduler Engine schedules tasks with scheduled_start_date in week "2025-W49"
- **THEN** Coda Sprint "2025-W49" SHALL automatically compute tasks where scheduled_start_date falls in that week
- **AND** Sprint.planned_billable_hrs SHALL automatically update based on scheduled billable tasks
- **AND** no manual sprint assignment needed (computed relationship)

---

### Requirement: Google Calendar OAuth Integration
The system SHALL implement OAuth 2.0 authorization code flow for Google Calendar access, with secure token storage and automatic refresh.

#### Scenario: OAuth authorization flow
- **WHEN** a user visits GET `/oauth/authorize`
- **THEN** the system SHALL redirect to Google's OAuth consent screen
- **AND** request scopes `https://www.googleapis.com/auth/calendar` and `https://www.googleapis.com/auth/calendar.events`
- **AND** include redirect_uri `https://scheduler.bestviable.com/oauth/callback`

#### Scenario: OAuth callback with authorization code
- **WHEN** Google redirects to GET `/oauth/callback?code=AUTH_CODE`
- **THEN** the system SHALL exchange the authorization code for access and refresh tokens
- **AND** store tokens encrypted in `/app/credentials/gcal.json`
- **AND** return status 200 with `{message: "Google Calendar authorized successfully", expires_in: 3600}`

#### Scenario: OAuth callback with error
- **WHEN** Google redirects to GET `/oauth/callback?error=access_denied`
- **THEN** the system SHALL return status 403 with `{error: "Google Calendar authorization denied"}`

---

### Requirement: Token Management
The system SHALL automatically refresh expired Google Calendar access tokens using stored refresh tokens, with failure alerting.

#### Scenario: Automatic token refresh
- **WHEN** the system attempts to call Google Calendar API
- **AND** the access token is expired (determined from `expires_at` timestamp)
- **THEN** the system SHALL use the refresh token to obtain a new access token
- **AND** update `/app/credentials/gcal.json` with the new token and expiry
- **AND** retry the original API call

#### Scenario: Refresh token invalid
- **WHEN** the system attempts to refresh an expired access token
- **AND** the refresh token is invalid or revoked
- **THEN** the system SHALL log an error with severity "CRITICAL"
- **AND** return status 401 with `{error: "Google Calendar authorization expired, please re-authorize at /oauth/authorize"}`
- **AND** trigger an email alert (via n8n webhook)

---

### Requirement: Calendar Event Creation
The system SHALL create Google Calendar events with task metadata, including task IDs, plan IDs, and deep links to Coda tasks.

#### Scenario: Create calendar event with metadata
- **WHEN** the system creates a calendar event for task `{task_id: "t-1", title: "Design database", start: "2025-12-03T09:00:00Z", end: "2025-12-03T13:00:00Z"}`
- **THEN** the system SHALL call Google Calendar API `events.insert`
- **AND** set event summary to "Design database"
- **AND** set event description to "Task ID: t-1\nPlan ID: 42\nCoda Task: https://coda.io/d/doc#task-t-1"
- **AND** set start/end times with timezone "America/Los_Angeles"
- **AND** return the created event_id

#### Scenario: Calendar event creation failure
- **WHEN** the system attempts to create a calendar event
- **AND** Google Calendar API returns 409 (conflict) due to overlapping events
- **THEN** the system SHALL retry with a different time slot
- **AND** if all retries fail, return status 422 with `{error: "Unable to find available time slots, please adjust constraints"}`

---

### Requirement: Schedule Optimization
The system SHALL use LLM-based optimization to arrange tasks considering priorities, dependencies, estimated durations, and user work patterns.

#### Scenario: LLM generates optimized schedule
- **WHEN** the system calls the LLM to optimize a schedule
- **AND** provides context: `{tasks: [...], existing_events: [...], preferences: {...}, constraints: {start_date, end_date}}`
- **THEN** the LLM SHALL return schedule blocks as JSON: `{schedule: [{task_id, start_iso, end_iso, rationale}]}`
- **AND** the system SHALL validate that all tasks are scheduled
- **AND** validate that no blocks overlap
- **AND** validate that all blocks are within constraints

#### Scenario: LLM optimization respects task dependencies
- **WHEN** tasks include dependency `{task_id: "t-2", depends_on: ["t-1"]}`
- **AND** the LLM generates a schedule
- **THEN** task "t-2" SHALL be scheduled after task "t-1" completes
- **AND** no calendar event for "t-2" SHALL start before "t-1" end time

---

### Requirement: Schedule Storage and Retrieval
The system SHALL store scheduling runs in Postgres for audit and retrieval, including the full schedule and metadata.

#### Scenario: Store schedule after creation
- **WHEN** calendar events are successfully created
- **THEN** the system SHALL insert a record into Postgres `scheduler_runs` table
- **AND** store schedule_blocks as JSONB: `[{event_id, task_id, start, end, calendar_link}]`
- **AND** set status to "scheduled"
- **AND** record client_id and plan_id

#### Scenario: Retrieve schedule by plan ID
- **WHEN** a client calls GET `/api/v1/scheduler/schedules?plan_id=1`
- **THEN** the system SHALL return all scheduler_runs for plan_id 1
- **AND** include `{id, plan_id, schedule_blocks, status, created_at}`
- **AND** order by created_at DESC

---

### Requirement: Health Monitoring
The system SHALL expose health check endpoints and validate Google Calendar API connectivity.

#### Scenario: Health check with Google Calendar accessible
- **WHEN** a client calls GET `/health`
- **AND** the system successfully calls Google Calendar API `calendarList.list`
- **THEN** the system SHALL return status 200 with `{status: "healthy", dependencies: {google_calendar: "up", postgres: "up", openrouter: "up"}}`

#### Scenario: Health check with Google Calendar unauthorized
- **WHEN** a client calls GET `/health`
- **AND** the OAuth tokens are invalid
- **THEN** the system SHALL return status 503 with `{status: "unhealthy", dependencies: {google_calendar: "unauthorized"}, action: "Re-authorize at /oauth/authorize"}`

---

### Requirement: Sprint Integration
The system SHALL integrate with Coda Sprint table for capacity-aware scheduling, respecting weekly capacity limits and billable percentage constraints.

#### Scenario: Query Sprint capacity before scheduling
- **WHEN** scheduling tasks for date range "2025-12-02" to "2025-12-08"
- **THEN** the system SHALL query Coda Sprint table for sprint with start_date "2025-12-02"
- **AND** retrieve capacity_hrs (e.g., 60 hours)
- **AND** retrieve billable_pct_target if runway < 12 weeks (e.g., 0.60)
- **AND** use as constraints for LLM scheduling optimization

#### Scenario: Enforce billable percentage constraint
- **WHEN** runway_weeks < 12 (from Coda finance_snapshot)
- **AND** scheduling tasks for current Sprint
- **THEN** the system SHALL ensure >= 60% of scheduled hours are billable tasks
- **AND** if constraint cannot be met, return warning: "Unable to schedule all tasks while maintaining 60% billable requirement"
- **AND** suggest: "Consider moving non-billable tasks to future weeks"

#### Scenario: Sprint financial health integration
- **WHEN** scheduling tasks
- **THEN** the system SHALL query Coda finance_snapshot for current runway_weeks
- **AND** if runway_weeks < 12, apply strict billable_pct >= 0.60 constraint
- **AND** if runway_weeks >= 12, relax constraint (billable_pct can be lower)
- **AND** log decision rationale in scheduling metadata

---

### Requirement: Performance
The system SHALL complete scheduling operations within 15 seconds (p95 latency) for plans with up to 20 tasks.

#### Scenario: Schedule generation within SLA
- **WHEN** a client submits a scheduling request with 10 tasks
- **THEN** the system SHALL complete the entire operation (LLM call, calendar API calls, database storage) within 15 seconds for 95% of requests

#### Scenario: Batch calendar event creation
- **WHEN** creating multiple calendar events (>5)
- **THEN** the system SHALL use Google Calendar batch API to create events in bulk
- **AND** reduce API calls from N to ceiling(N/100)
- **AND** improve performance by 3-5x vs sequential creation

---

### Requirement: Error Handling
The system SHALL handle Google Calendar API errors gracefully with retry logic and clear error messages.

#### Scenario: Google Calendar rate limit
- **WHEN** Google Calendar API returns 429 (rate limit exceeded)
- **THEN** the system SHALL extract the `Retry-After` header
- **AND** wait the specified duration before retrying
- **AND** if retries exhausted, return status 503 with `{error: "Google Calendar temporarily unavailable due to rate limits"}`

#### Scenario: Partial schedule creation failure
- **WHEN** creating 5 calendar events
- **AND** 3 succeed but 2 fail
- **THEN** the system SHALL rollback the 3 created events (delete them)
- **AND** return status 500 with `{error: "Schedule creation failed, no events created", failed_tasks: ["t-4", "t-5"]}`
- **AND** ensure atomicity (all or nothing)

---

### Requirement: Calendar Event Updates
The system SHALL support updating and deleting calendar events when schedules change.

#### Scenario: Update calendar event time
- **WHEN** a client calls PATCH `/api/v1/scheduler/events/{event_id}` with `{start: "2025-12-04T10:00:00Z", end: "2025-12-04T12:00:00Z"}`
- **THEN** the system SHALL call Google Calendar API `events.patch`
- **AND** update the event start/end times
- **AND** return status 200 with the updated event

#### Scenario: Delete calendar event
- **WHEN** a client calls DELETE `/api/v1/scheduler/events/{event_id}`
- **THEN** the system SHALL call Google Calendar API `events.delete`
- **AND** remove the event from the calendar
- **AND** update the scheduler_run in Postgres to mark the event as deleted
- **AND** return status 204
