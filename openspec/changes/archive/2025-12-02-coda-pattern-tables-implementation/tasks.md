# Coda Pattern Tables Implementation - Tasks

## Phase 1: Create New Tables (2-3 hours)

### 1.1 Service Blueprints Table
- [ ] 1.1.1 Create table `service_blueprints`
- [ ] 1.1.2 Add columns:
  - `blueprint_id` (Row ID, auto-generated)
  - `name` (Text)
  - `description` (Text, long)
  - `customer_actions` (Text, long)
  - `frontstage` (Text, long)
  - `backstage` (Text, long)
  - `support_processes` (Text, long)
  - `evidence` (Text, long)
  - `version` (Text, default "v1")
  - `status` (Select: Draft, Active, Deprecated)
  - `owner` (Person)
  - `created_at` (Created Time)
  - `updated_at` (Modified Time)
- [ ] 1.1.3 Create view: "Active Blueprints" (filter status = Active)
- [ ] 1.1.4 Test: Create sample blueprint "Marketing Ops Sprint"

### 1.2 Workflows Table
- [ ] 1.2.1 Create table `workflows`
- [ ] 1.2.2 Add columns:
  - `workflow_id` (Row ID)
  - `name` (Text)
  - `description` (Text)
  - `service_blueprint` (Relation → service_blueprints)
  - `steps` (Text, long - JSON or structured list)
  - `estimated_hours` (Number)
  - `automation_status` (Select: Manual, Semi-automated, Automated)
  - `version` (Text)
  - `status` (Select: Draft, Active, Deprecated)
  - `owner` (Person)
  - `created_at` (Created Time)
  - `updated_at` (Modified Time)
- [ ] 1.2.3 Create view: "Active Workflows" (filter status = Active)
- [ ] 1.2.4 Test: Create sample workflow "Client Onboarding"

### 1.3 Process Templates Table
- [ ] 1.3.1 Create table `process_templates`
- [ ] 1.3.2 Add columns:
  - `process_template_id` (Row ID)
  - `name` (Text)
  - `workflow` (Relation → workflows, nullable)
  - `template_type` (Select: Operational, Communication)
  - `checklist` (Text, long - structured steps)
  - `version` (Text)
  - `status` (Select: Draft, Active, Deprecated)
  - `owner` (Person)
  - `created_at` (Created Time)
  - `updated_at` (Modified Time)
- [ ] 1.3.3 Create view: "Operational Templates" (filter template_type = Operational)
- [ ] 1.3.4 Test: Create sample "Acme Corp Onboarding Checklist"

### 1.4 Resource Templates Table
- [ ] 1.4.1 Create table `resource_templates`
- [ ] 1.4.2 Add columns:
  - `resource_template_id` (Row ID)
  - `name` (Text)
  - `template_type` (Select: Document, Communication, Media)
  - `storage_url` (URL)
  - `version` (Text)
  - `status` (Select: Draft, Active, Deprecated)
  - `owner` (Person)
  - `created_at` (Created Time)
  - `updated_at` (Modified Time)
- [ ] 1.4.3 Create views: "Document Templates", "Communication Templates", "Media Templates"
- [ ] 1.4.4 Test: Create sample "Audit Report Template" (type: Document)

### 1.5 Execution Runs Table
- [ ] 1.5.1 Create table `execution_runs`
- [ ] 1.5.2 Add columns:
  - `run_id` (Row ID)
  - `run_type` (Select: Process, Touchpoint)
  - `workflow` (Relation → workflows, nullable)
  - `process_template` (Relation → process_templates, nullable)
  - `task` (Relation → tasks, nullable)
  - `project` (Relation → projects, nullable)
  - `engagement` (Relation → engagements, nullable)
  - `executed_by` (Person)
  - `started_at` (Date & Time)
  - `ended_at` (Date & Time)
  - `actual_hours` (Number, formula: (ended_at - started_at) in hours)
  - `outcome_notes` (Text)
  - `created_at` (Created Time)
- [ ] 1.5.3 Create view: "Recent Runs" (sort by started_at DESC, limit 50)
- [ ] 1.5.4 Test: Create sample execution run for test task

---

## Phase 2: Add Relationships (2-3 hours)

### 2.1 Update Offers Table
- [ ] 2.1.1 Add column: `service_blueprint` (Relation → service_blueprints)
- [ ] 2.1.2 Create formula column: `blueprint_name` = `service_blueprint.name`
- [ ] 2.1.3 Update existing offers to link to sample blueprints
- [ ] 2.1.4 Validate: All active offers have blueprint linked

### 2.2 Update Projects Table
- [ ] 2.2.1 Add column: `process_template` (Relation → process_templates)
- [ ] 2.2.2 Create formula column: `template_name` = `process_template.name`
- [ ] 2.2.3 Test: Link sample project to process template
- [ ] 2.2.4 Validate: Process template link appears in project view

### 2.3 Update Tasks Table
- [ ] 2.3.1 Add column: `execution_run` (Relation → execution_runs, nullable)
- [ ] 2.3.2 Add column: `scheduled_start_date` (Date)
- [ ] 2.3.3 Add column: `scheduled_end_date` (Date)
- [ ] 2.3.4 Create formula column: `estimated_hours_from_template` (lookup from process_template if applicable)
- [ ] 2.3.5 Test: Create task with scheduled_start_date in current week
- [ ] 2.3.6 Validate: Task appears in Sprint (computed relationship)

### 2.4 Update Sprints Table
- [ ] 2.4.1 Add column: `start_date` (Date, formula: Monday of sprint week)
- [ ] 2.4.2 Add column: `end_date` (Date, formula: Sunday of sprint week)
- [ ] 2.4.3 Update formula: `tasks` = `tasks.Filter(scheduled_start_date >= thisRow.start_date AND scheduled_start_date <= thisRow.end_date)`
- [ ] 2.4.4 Update formula: `planned_billable_hrs` = `tasks.Filter(project.billable = true).Sum(estimated_hours)`
- [ ] 2.4.5 Test: Create Sprint for current week, verify tasks auto-populate
- [ ] 2.4.6 Validate: Sprint capacity calculations update automatically

### 2.5 Workflow Performance Tracking
- [ ] 2.5.1 In `workflows` table, add formula column: `execution_runs_count` = `execution_runs.Count()`
- [ ] 2.5.2 Add formula: `avg_actual_hours` = `execution_runs.Average(actual_hours)`
- [ ] 2.5.3 Add formula: `variance_pct` = `(avg_actual_hours - estimated_hours) / estimated_hours * 100`
- [ ] 2.5.4 Create view: "Workflows with Drift" (filter abs(variance_pct) > 30%)
- [ ] 2.5.5 Test: Create 3 execution runs for workflow, verify avg calculates

---

## Phase 3: Data Migration (1-2 hours)

### 3.1 Migrate Existing Templates
- [ ] 3.1.1 Audit existing "DB Templates" table
- [ ] 3.1.2 Identify process templates (checklists, SOPs) vs resource templates (documents, emails)
- [ ] 3.1.3 Copy process templates to `process_templates` table
- [ ] 3.1.4 Copy resource templates to `resource_templates` table
- [ ] 3.1.5 Validate: All templates migrated, none missing
- [ ] 3.1.6 Mark old "DB Templates" table as deprecated

### 3.2 Create Initial Service Blueprints
- [ ] 3.2.1 Document existing offers (Marketing Ops Sprint, Diagnostic, etc.)
- [ ] 3.2.2 For each offer, create Service Blueprint with 5 layers
- [ ] 3.2.3 Link offers to blueprints
- [ ] 3.2.4 Validate: All active offers have blueprints

### 3.3 Document Existing Workflows
- [ ] 3.3.1 Identify common workflows (Client Onboarding, Marketing Audit, Campaign Launch)
- [ ] 3.3.2 For each workflow, create record with steps and estimated_hours
- [ ] 3.3.3 Link workflows to service blueprints
- [ ] 3.3.4 Validate: All blueprints have at least 1 workflow

### 3.4 Migrate Sprint Assignments
- [ ] 3.4.1 For each task with existing sprint assignment, set scheduled_start_date = sprint.start_date
- [ ] 3.4.2 Remove task.sprint column (replaced by computed relationship)
- [ ] 3.4.3 Validate: All tasks still appear in correct Sprint views

---

## Phase 4: Validation and Documentation (1 hour)

### 4.1 End-to-End Validation
- [ ] 4.1.1 Test full flow: Offer → Blueprint → Workflow → Process Template → Task → Execution Run
- [ ] 4.1.2 Verify all relationships work (FK lookups, formulas)
- [ ] 4.1.3 Verify Sprint auto-population works
- [ ] 4.1.4 Verify workflow variance tracking works

### 4.2 Documentation
- [ ] 4.2.1 Document table relationships in Founder HQ schema doc
- [ ] 4.2.2 Document Sprint computed relationship formula
- [ ] 4.2.3 Document execution_runs → workflow variance tracking
- [ ] 4.2.4 Create user guide: "How to create a new Service Blueprint"
- [ ] 4.2.5 Create user guide: "How to adapt a Workflow into Process Template"

### 4.3 Performance Testing
- [ ] 4.3.1 Create 100 test execution runs
- [ ] 4.3.2 Verify workflow variance calculations complete in < 5 seconds
- [ ] 4.3.3 Verify Sprint task filters complete in < 2 seconds
- [ ] 4.3.4 Document any performance bottlenecks

---

## Completion Checklist

- [ ] All 5 new tables created with correct schemas
- [ ] All relationships established (offers → blueprints, projects → templates, tasks → runs)
- [ ] Sprint computed relationship working (tasks auto-populate based on scheduled_start_date)
- [ ] Existing templates migrated to new structure
- [ ] Initial Service Blueprints and Workflows documented
- [ ] Workflow performance tracking formulas working
- [ ] End-to-end validation passed
- [ ] Documentation updated
- [ ] Ready for coda-mcp-pattern-integration to expose via API
