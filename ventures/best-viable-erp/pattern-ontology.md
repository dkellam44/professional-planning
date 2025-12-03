# Founder HQ Pattern Ontology & Naming Conventions  
_Version: v0.1 • Date: 2025-12-02_

This brief defines the ontology and naming conventions for **patterns**, **assets**, and **instances** in the Founder HQ schema. It is intended as a reference for schema design, documentation, and automation work.

---

## 1. Core Ontology

Founder HQ treats all operations as combinations of three fundamental object types:

- **Patterns** – reusable **designs of work** (how things _should_ happen).
- **Assets** – reusable **materials** used in patterns (what is _sent, shown, or produced_).
- **Instances** – concrete **executions** of patterns in real contexts (what _actually happened_).

This ontology is applied consistently across service design, operations, and communications.

---

## 2. Pattern Layer

Patterns define reusable, canonical “ways of working.” They live in their own tables and are versioned.

### 2.1 Service Blueprints (Meta-SOP / Portfolio Level)

- **Type:** Pattern (strategic)
- **Table:** `service_blueprints`
- **Role:** End-to-end map of a service across the five layers:
  - customer_actions, frontstage, backstage, support_processes, evidence
- **Relationships:**
  - 1–many → `offers`
  - 1–many → `workflows` (each workflow implements part of the blueprint)

**Naming:**
- Primary key: `blueprint_id`
- Display/name: `name` (or `blueprint_name`)

---

### 2.2 Workflows (Core SOP)

- **Type:** Pattern (operational)
- **Table:** `workflows`
- **Role:** Canonical, step-by-step procedure for a capability (e.g., Client Onboarding, Campaign Launch).
- **Typical Fields:**
  - `workflow_id`
  - `name`
  - `blueprint_id` (FK → `service_blueprints`)
  - `steps` (structured list or separate `workflow_steps` table)
  - `estimated_hours`
  - `automation_status` (`Manual`, `Semi-automated`, `Automated`)
  - Governance: `owner`, `version`, `status` (`Draft`, `Active`, `Deprecated`)

**Naming convention:**
- Treat Workflows as **single source of truth SOPs** for a capability.
- One core workflow per capability; variations live as Process Templates.

---

### 2.3 Process Templates (Sub-SOP / Checklists)

- **Type:** Pattern (tactical)
- **Table:** `process_templates`
- **Role:** Ready-to-run checklists derived from a Workflow for a specific use case or context.
- **Examples:**
  - “Client Onboarding – Sprint”
  - “Client Onboarding – Retainer”
  - “3-Step Outbound Sequence” (when used as a communication pattern)

**Key Fields:**
- `process_template_id`
- `name`
- `workflow` (FK → `workflows`) — lineage to parent workflow
- `template_type` = `Operational` or `Communication`
- `checklist` (steps/tasks)
- `version`, `status`

**Pattern rule:**
- Service Blueprint → Workflow → Process Template  
- Blueprints define services, Workflows define methods, Process Templates define runnable checklists.

---

## 3. Asset Layer

Assets are reusable materials used inside patterns. In this schema, assets are modeled primarily as **Resource Templates**.

### 3.1 Resource Templates (Documents, Comms, Media)

- **Type:** Asset
- **Table:** `resource_templates`
- **Role:** Store reusable content and asset scaffolds (documents, communications, media) used by Workflows and Process Templates.

**Key Fields:**
- `resource_template_id`
- `name`
- `template_type`:
  - `Document` – docs, reports, contracts, proposals, SOP write-ups
  - `Communication` – emails, DMs, scripts, SMS templates
  - `Media` – decks, images, reusable creative assets
- `storage_url` or `file_ref`
- `version`
- `owner`
- `status` (`Draft`, `Active`, `Deprecated`)

**Naming:**
- “Resource Template” is the generic system term.
- In human-facing docs, you may say “Document Template”, “Communication Template”, etc., but the backend record remains `resource_templates`.

---

## 4. Instance Layer

Instances are concrete executions of patterns, often linked to specific Projects, Engagements, or Deliverables.

### 4.1 Execution Runs (Runtime Instances)

- **Type:** Instance
- **Table:** `execution_runs`
- **Role:** Runtime execution of a Process Template / Workflow in a specific context.

**Key Fields:**
- `run_id`
- `run_type` (`Process`, `Touchpoint`, etc.)
- `workflow` (optional FK → `workflows`)
- `process_template` (FK → `process_templates`)
- `communication_template` (FK → `resource_templates`, where `template_type="Communication"`)
- `project` (FK → `projects`)
- `engagement` (FK → `engagements`)
- `executed_by` (FK → `people`)
- Time & effort: `started_at`, `ended_at`, `actual_hours`
- Outcome: `outcome_notes`, `deliverable`, `results`

**Purpose:**
- Capture what actually happened.
- Enable measurement (cycle time, variance vs. estimate, success rates).
- Provide telemetry for improving Patterns and Assets.

---

### 4.2 Touchpoints (Communication Instances)

- **Type:** Instance (specialized communication)
- **Table:** `touchpoints` (or a view over `execution_runs` where `run_type="Touchpoint"`)
- **Role:** Concrete communication events: emails sent, calls made, DMs, meetings, etc.

**Key Fields (in addition to run-level fields):**
- `channel` (`Email`, `DM`, `Phone`, `Meeting`, `SMS`, `Other`)
- `direction` (`Outbound`, `Inbound`)
- `person`, `organization`
- `communication_pattern` (FK → `process_templates` where `template_type="Communication"`)
- `communication_template` (FK → `resource_templates` where `template_type="Communication"`)
- `reply_received`, `reply_at`, `conversion_flag`, etc.

These fields enable tracking:
- **Template performance** (open rate, reply rate, conversion rate).
- **Pattern performance** for communication sequences.

---

## 5. Naming Conventions Summary

### 5.1 Conceptual

- **Pattern objects**
  - `service_blueprints`
  - `workflows`
  - `process_templates` (with `template_type` to distinguish Operational vs Communication)

- **Asset objects**
  - `resource_templates` (with `template_type` to distinguish Document vs Communication vs Media)

- **Instance objects**
  - `execution_runs`
  - `touchpoints` (instance of communication work, often tied to a Communication Template and Pattern)

### 5.2 Shared fields / enums

- `template_type` (on `process_templates` and `resource_templates`):
  - For Process Templates: `Operational`, `Communication`
  - For Resource Templates: `Document`, `Communication`, `Media`

- `run_type` (on `execution_runs`):
  - `Process` – operational process runs
  - `Touchpoint` – communication runs

- `template_source`:
  - Generic relation field used by other tables (e.g., `projects`, `tasks`, `deliverables`) to record which template created or seeded a record.
  - Points to either a `process_template` or a `resource_template`, depending on context.

---

## 6. How It All Fits Together

High-level flow:

1. **Patterns**
   - Service Blueprint defines the **service**.
   - Workflows define the **capabilities / methods**.
   - Process Templates define **ready-to-run checklists** (Operational or Communication).

2. **Assets**
   - Resource Templates define **documents and communications** used inside those patterns.

3. **Instances**
   - Execution Runs capture **actual executions** of Process Templates and Workflows.
   - Touchpoints capture **actual communications** using Communication Templates.

In simple terms:

> **Blueprints** define the service.  
> **Workflows** define the method.  
> **Process Templates** define the checklist.  
> **Resource Templates** supply the materials.  
> **Execution Runs / Touchpoints** record what actually happened.

This ontology and naming scheme should be treated as canonical for future schema changes, documentation, and automation design in Founder HQ.

