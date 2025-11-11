# ADR: Template Instantiation Approach

- entity: decision
- level: policy
- zone: internal
- version: v01
- tags: [adr, templates, automation]
- source_path: /decisions/2025-10-17_template-instantiation-approach_v01.md
- date: 2025-10-17

## Status
**ACCEPTED**

## Context
When the builder creates new files (Offers, Engagements, Projects, etc.), it needs a strategy for populating content:
- **Option A**: Copy template → Fill metadata → Leave content empty with TODOs
- **Option B**: Copy template → Prompt user for values → Fully populate
- **Option C**: Create stub with just metadata → Populate content later on-demand

Each has trade-offs for automation, usability, and completeness.

## Decision

### Template Instantiation Rules

1. **If a matching template exists in `/templates/`:**
   - Use the rich template (e.g., `offer_brief_v01.md`, `engagement_brief_v01.md`)
   - Copy the template structure including all section headings
   - Fill in the **metadata header** with actual values:
     - `entity`, `level`, `zone`, `version`, `tags`
     - `source_path` (actual repo path)
     - `date` (current date)
   - Leave content sections **empty or with inline guidance comments**
   - Log instantiation mode as `template` in `/logs/context_actions.csv`

2. **If no matching template exists:**
   - Generate a thin placeholder using the pattern from `templates/placeholder_scaffold.md`
   - Include required metadata header
   - Add generic section headings (Key Facts, Open Questions, References, Acceptance Criteria)
   - Add comment: `<!-- Populate this file based on [entity] requirements -->`
   - Log instantiation mode as `placeholder` in `/logs/context_actions.csv`

3. **All Markdown files MUST include the standard metadata header:**
   ```
   - entity: <entity_name>
   - level: <level_name>
   - zone: <zone>
   - version: <version>
   - tags: [tag1, tag2]
   - source_path: <relative_path>
   - date: YYYY-MM-DD
   ```

### Logging Requirement
Every file creation action must be logged to `/logs/context_actions.csv` with:
```
ts, agent, action, entity, path, latency_ms, token_in, token_out, success, template|placeholder
```

The final `notes` field must contain either `template` or `placeholder` to track instantiation mode.

## Consequences

### Positive
- Consistent metadata across all files (enables retrieval)
- Rich templates provide structure and guidance
- Placeholder fallback prevents blocking on missing templates
- Logging creates audit trail and enables analytics
- Humans know exactly what to fill in
- Agents can validate completeness by checking for empty sections

### Negative
- Files are not immediately "complete" after generation
- Requires human follow-up to populate content
- No validation of populated content (only structure)

### Mitigations
- Templates include inline comments explaining what to fill
- Builder's summary report lists files needing population (`NEEDS_MORE_CONTEXT`)
- Future: add validation step to check for empty sections before promotion

## References
- Architecture spec: `/architecture-spec_v0.3.md` lines 85-86
- Placeholder scaffold: `/templates/placeholder_scaffold.md`
- Builder prompt: `/builder_prompt_v0.3.md` lines 26-28
