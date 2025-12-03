# Observer Agent Specification Delta

## ADDED Requirements

### Requirement: Daily Reflection Generation
The system SHALL generate daily reflections by analyzing the past 24 hours of activity, including events, calendar completion, and task status, and post summaries to Coda Daily Thread.

#### Scenario: Generate daily reflection
- **WHEN** the Observer Agent is triggered at 6 PM daily (via n8n cron)
- **THEN** the system SHALL query Postgres `events` table for all events in the last 24 hours
- **AND** call Google Calendar API to fetch completion stats (events marked complete vs incomplete)
- **AND** call Coda MCP to fetch task status (tasks completed, in progress, blocked)
- **AND** aggregate the data into a structured summary
- **AND** call OpenRouter LLM with "daily_reflection" prompt template to generate a reflection
- **AND** post the reflection to Coda BestViable ERP Daily Thread via Coda MCP
- **AND** store the reflection in Memory Gateway with `memory_type: "episode"`
- **AND** return status 200 with `{reflection_id, content, posted_to_coda: true}`

#### Scenario: Daily reflection with high productivity
- **WHEN** generating a daily reflection
- **AND** the data shows 5 tasks completed, 8 hours of deep work logged, no context switching
- **THEN** the generated reflection SHALL highlight positive patterns
- **AND** include specific accomplishments: "Completed 5 tasks today (database schema, API design, testing)"
- **AND** provide encouragement: "Strong focus day with minimal context switching"

#### Scenario: Daily reflection with low productivity
- **WHEN** generating a daily reflection
- **AND** the data shows 0 tasks completed, 2 hours of calendar time used, many interruptions
- **THEN** the generated reflection SHALL identify potential issues without judgment
- **AND** suggest improvements: "Consider blocking focus time tomorrow morning for task completion"
- **AND** ask probing questions: "Were there unexpected blockers? What prevented task completion?"

---

### Requirement: Weekly Sprint Review
The system SHALL generate weekly sprint reviews by analyzing 7 days of activity, identifying patterns, calculating metrics, and providing strategic recommendations.

#### Scenario: Generate weekly sprint review
- **WHEN** the Observer Agent is triggered at 6 PM Friday (via n8n cron)
- **THEN** the system SHALL query Postgres `events` table for all events in the last 7 days
- **AND** aggregate data: total tasks completed, total hours scheduled vs completed, deep work hours, meeting hours
- **AND** call OpenRouter LLM with "weekly_review" prompt template to generate a review
- **AND** include metrics: `{tasks_completed: 12, deep_work_hours: 25, meeting_hours: 8, completion_rate: 0.85}`
- **AND** identify patterns: "Most productive days: Tuesday, Wednesday (mornings)"
- **AND** provide recommendations: "Consider moving meetings to afternoons to protect morning deep work"
- **AND** post the review to Coda BestViable ERP Sprint Review section
- **AND** store the review in Memory Gateway

#### Scenario: Weekly review identifies declining productivity trend
- **WHEN** generating a weekly review
- **AND** the data shows a 30% drop in task completion vs previous week
- **THEN** the review SHALL highlight this trend explicitly
- **AND** suggest potential causes: "Increased meeting load (12h vs 8h last week)"
- **AND** recommend corrective actions: "Review recurring meetings for necessity"

---

### Requirement: Coda Integration
The system SHALL post reflections and reviews to Coda BestViable ERP via the coda-mcp HTTP API, formatting content as markdown with metadata.

#### Scenario: Post daily reflection to Coda
- **WHEN** a daily reflection is generated
- **THEN** the system SHALL call POST `https://coda.bestviable.com/mcp` (coda-mcp endpoint)
- **AND** invoke the Coda API tool to create a new row in the "Daily Thread" table
- **AND** set row values: `{date: "2025-12-01", reflection: "<markdown content>", metrics: {...}}`
- **AND** verify the row was created (200 OK response)

#### Scenario: Coda API failure with retry
- **WHEN** posting a reflection to Coda
- **AND** coda-mcp returns 503 (service unavailable)
- **THEN** the system SHALL retry 3 times with exponential backoff (2s, 4s, 8s)
- **AND** if all retries fail, log the error and store the reflection locally in Postgres
- **AND** return status 207 with `{reflection_generated: true, posted_to_coda: false, stored_in_postgres: true}`

---

### Requirement: Event Aggregation
The system SHALL aggregate events from Postgres, computing statistics like total events, event types breakdown, and time-based distributions.

#### Scenario: Aggregate events for daily reflection
- **WHEN** querying events for the last 24 hours
- **THEN** the system SHALL execute query: `SELECT event_type, COUNT(*) FROM events WHERE created_at >= NOW() - INTERVAL '24 hours' GROUP BY event_type`
- **AND** compute totals: `{planning_events: 2, scheduling_events: 1, memory_events: 15, total: 18}`
- **AND** identify top event sources: `{planner: 5, scheduler: 3, user: 10}`

#### Scenario: No events in timeframe
- **WHEN** querying events for the last 24 hours
- **AND** no events exist in that timeframe
- **THEN** the system SHALL return empty statistics: `{total: 0, by_type: {}, by_source: {}}`
- **AND** the reflection SHALL note: "No system activity recorded in the last 24 hours"

---

### Requirement: Calendar Statistics
The system SHALL fetch Google Calendar completion statistics, analyzing scheduled vs actual time spent and task completion rates.

#### Scenario: Fetch calendar completion stats
- **WHEN** generating a daily reflection
- **THEN** the system SHALL call Google Calendar API to fetch events for the last 24 hours
- **AND** filter events with metadata `{task_id: "..."}`
- **AND** calculate statistics: `{scheduled_hours: 8, completed_hours: 6, completion_rate: 0.75, tasks_completed: 3, tasks_incomplete: 1}`
- **AND** include in reflection context

#### Scenario: Calendar event marked complete
- **WHEN** fetching calendar stats
- **AND** an event has extended property `{status: "completed"}`
- **THEN** the system SHALL count it toward completed_hours
- **AND** include the task in tasks_completed count

---

### Requirement: LLM Reflection Generation
The system SHALL use OpenRouter with specialized prompts to generate insightful, actionable reflections tailored to the user's work patterns.

#### Scenario: LLM generates daily reflection
- **WHEN** calling OpenRouter for daily reflection
- **THEN** the system SHALL use Claude 3.5 Sonnet
- **AND** load the "daily_reflection" prompt template from Postgres
- **AND** provide context: `{events_summary, calendar_stats, coda_task_status, date}`
- **AND** set temperature to 0.7 for creative yet consistent output
- **AND** request markdown-formatted output with sections: Summary, Highlights, Observations, Tomorrow's Focus

#### Scenario: LLM reflection includes actionable insights
- **WHEN** the LLM generates a reflection
- **THEN** the output SHALL include specific, actionable insights
- **AND** reference actual data: "Completed 'database schema design' in 3.5 hours (estimated 4 hours)"
- **AND** avoid generic advice: "Stay focused" ❌, prefer: "Consider batching similar tasks (like code reviews) to minimize context switching" ✅

---

### Requirement: Memory Storage
The system SHALL store all generated reflections in the Memory Gateway as episodic memories for future recall and pattern analysis.

#### Scenario: Store reflection in Memory Gateway
- **WHEN** a reflection is generated
- **THEN** the system SHALL call POST `https://memory.bestviable.com/api/v1/memory/remember`
- **AND** provide payload: `{client_id: 1, content: "<reflection markdown>", memory_type: "episode", metadata: {type: "daily_reflection", date: "2025-12-01"}}`
- **AND** verify successful storage (200 OK response)

#### Scenario: Retrieve past reflections for trend analysis
- **WHEN** generating a weekly review
- **THEN** the system SHALL call GET `https://memory.bestviable.com/api/v1/memory/recall?query=weekly productivity trends&client_id=1&k=4`
- **AND** retrieve the last 4 weekly reflections
- **AND** include historical trends in the current week's review: "Task completion improving: 60% → 70% → 80% → 85% over last 4 weeks"

---

### Requirement: Health Monitoring
The system SHALL expose health check endpoints and validate connectivity to dependencies (Postgres, Google Calendar, Coda MCP, Memory Gateway).

#### Scenario: Health check with all dependencies healthy
- **WHEN** a client calls GET `/health`
- **THEN** the system SHALL return status 200 with `{status: "healthy", dependencies: {postgres: "up", google_calendar: "up", coda_mcp: "up", memory_gateway: "up"}}`

#### Scenario: Health check with Coda MCP unreachable
- **WHEN** a client calls GET `/health`
- **AND** Coda MCP is unreachable
- **THEN** the system SHALL return status 200 with `{status: "degraded", dependencies: {coda_mcp: "down"}, warning: "Reflections will be generated but not posted to Coda"}`

---

### Requirement: Performance
The system SHALL complete reflection generation within 15 seconds (p95 latency) for daily reflections and 30 seconds for weekly reviews.

#### Scenario: Daily reflection within SLA
- **WHEN** the Observer Agent is triggered for a daily reflection
- **THEN** the entire operation (query events, fetch calendar stats, call Coda, generate reflection, post to Coda, store in Memory Gateway) SHALL complete within 15 seconds for 95% of requests

#### Scenario: Weekly review within SLA
- **WHEN** the Observer Agent is triggered for a weekly review
- **THEN** the entire operation SHALL complete within 30 seconds for 95% of requests
- **AND** handle larger data sets (7 days of events vs 1 day)

---

### Requirement: Error Handling
The system SHALL handle partial failures gracefully, ensuring reflections are generated even if posting to Coda fails.

#### Scenario: Reflection generated but Coda posting fails
- **WHEN** generating a daily reflection
- **AND** the reflection is successfully generated
- **AND** posting to Coda fails after all retries
- **THEN** the system SHALL store the reflection in Postgres `events` table with `{event_type: "reflection_pending_post"}`
- **AND** store in Memory Gateway successfully
- **AND** return status 207 with `{reflection_generated: true, posted_to_coda: false}`
- **AND** trigger a manual review alert (via n8n webhook to Slack)

#### Scenario: Critical failure (Memory Gateway unreachable)
- **WHEN** generating a reflection
- **AND** Memory Gateway is unreachable
- **THEN** the system SHALL still complete the reflection generation
- **AND** still post to Coda
- **AND** log the Memory Gateway failure
- **AND** return status 200 with warning: `{posted_to_coda: true, stored_in_memory: false, warning: "Memory Gateway unavailable"}`

---

### Requirement: Manual Reflection Trigger
The system SHALL support manual triggering of reflections for ad-hoc analysis or testing, bypassing the scheduled cron.

#### Scenario: Manual daily reflection trigger
- **WHEN** a client calls POST `/api/v1/observer/reflect?mode=daily`
- **THEN** the system SHALL immediately generate a daily reflection for the current date
- **AND** follow the same logic as the automated daily trigger
- **AND** return the reflection in the response

#### Scenario: Manual weekly reflection trigger
- **WHEN** a client calls POST `/api/v1/observer/reflect?mode=weekly`
- **THEN** the system SHALL immediately generate a weekly review for the past 7 days
- **AND** follow the same logic as the automated weekly trigger
- **AND** return the review in the response

---

### Requirement: Execution Run Performance Analysis
The system SHALL analyze execution_runs to identify workflows and templates performing above/below estimates, detect drift, and suggest improvements.

#### Scenario: Analyze workflow estimate drift
- **WHEN** generating weekly review
- **THEN** the system SHALL query execution_runs for past 7 days
- **AND** group by process_template_id
- **AND** calculate variance: (actual_hours - estimated_hours) / estimated_hours
- **AND** flag templates with variance > 30% across 3+ runs

#### Scenario: Weekly review includes pattern performance
- **WHEN** generating weekly review
- **THEN** the reflection SHALL include section "Pattern Performance"
- **AND** list workflows with significant estimate drift
- **AND** example: "Workflow 'Client Onboarding' consistently taking 30% longer than estimated (avg 12 hrs actual vs 8 hrs estimated)"
- **AND** suggest review: "Consider updating workflow estimate or investigating bottlenecks"

#### Scenario: Daily reflection with execution run context
- **WHEN** generating daily reflection
- **THEN** the system SHALL query execution_runs for today
- **AND** fetch associated process_template and workflow names from Coda MCP
- **AND** include in reflection: "Completed 'Client Audit' (Workflow: Marketing Ops Audit) in 2.5 hrs (estimated 2 hrs, +25% variance)"

#### Scenario: Detect consistently blocked patterns
- **WHEN** analyzing execution_runs
- **AND** outcome_notes contain "blocked" or "delayed" in 3+ runs for same process_template_id
- **THEN** the reflection SHALL flag: "Process Template X showing repeated blockers"
- **AND** include common blocker themes from outcome_notes

#### Scenario: Compare Sprint plan vs Execution Runs
- **WHEN** generating weekly review
- **THEN** the system SHALL query Coda Sprint for current week
- **AND** query execution_runs for tasks in that Sprint (by task_id)
- **AND** calculate: planned_billable_hrs vs actual_billable_hrs from execution_runs
- **AND** include in review: "Sprint: 36 hrs planned billable, 32 hrs actual (89% of plan)"
