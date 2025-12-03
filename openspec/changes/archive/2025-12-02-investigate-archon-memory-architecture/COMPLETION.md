# Change Completion: investigate-archon-memory-architecture

**Status**: ARCHIVED WITHOUT IMPLEMENTATION
**Date**: 2025-12-02
**Archived By**: Decision to replace Archon with Planner & Memory Architecture

## Summary

This change was created to investigate the Archon memory/context architecture and evaluate alternatives (Letta, mem0, Google memory, hybrid solutions). The investigation was never started, and is now being archived because the strategic decision has been made to **replace Archon entirely** with a new purpose-built Planner & Memory Architecture.

## Why This Change Is No Longer Needed

1. **Decision Made Without Investigation**: The add-planner-memory-system OpenSpec change provides a comprehensive replacement for Archon's capabilities, making the investigation obsolete.

2. **Archon Being Deprecated**: Phase 1a of add-planner-memory-system explicitly deprecates the Archon stack:
   - Stops archon-server, archon-ui, archon-mcp containers
   - Frees 809MB RAM for new services
   - Archives configuration for reference

3. **Goals Already Achieved**: The investigation's goal was to "choose between Archon, Letta, mem0, Google memory, or hybrid" - this has been resolved through the design of the new architecture which uses:
   - mem0 (managed) for long-term memory
   - Valkey for short-term cache
   - Postgres for event/graph storage
   - Qdrant for vector embeddings
   - Custom FastAPI services for Memory Gateway, Planner Engine, Scheduler Engine, Observer Agent

4. **Investigation Worksheets Never Executed**: All files in this change (proposal.md, WORKSHEETS.md, tasks.md, design.md) are templates and planning documents. No actual investigation work was performed.

## What Was Learned

Despite not executing the full investigation, the process of creating this change helped surface important considerations:

1. **Memory Architecture Requirements**:
   - Short-term cache (24h TTL) for active context
   - Long-term memory for user preferences and patterns
   - Event logging for telemetry and pattern learning
   - Graph storage for business/pattern hierarchies
   - Vector search for semantic recall

2. **Integration Needs**:
   - Calendar integration (scheduling)
   - Coda integration (business data)
   - LLM integration (planning and reflection)
   - Observability (Langfuse tracing)

3. **Critical Gap Identified**: **Centralized UI for Agent Control** (see below)

## Critical UI Gap for Phase 3-4 Planning

While the new backend/middleware architecture surpasses Archon's capabilities, one key gap remains:

**Archon provided an integrated UI interface that centralized command of:**
- Memory/context management
- Model selection and configuration
- Prompt/system instruction editing
- Task/project management
- Knowledge base building and collection
- Inference credentials management
- Steering of CLI and chat LLM agents

**Future Work Needed (Phase 3-4)**:
The new architecture (Memory Gateway, Planner Engine, Scheduler Engine, Observer Agent) provides powerful APIs but lacks a unified control interface. Future phases should consider:

1. **UI Framework Options**:
   - Next.js dashboard (similar to Archon's approach)
   - Extend existing n8n UI with custom nodes
   - Standalone React/Vue app
   - CLI with rich TUI (Textual, Rich)

2. **Core UI Features**:
   - Memory browser: View/edit stored memories, events, patterns
   - Planning interface: Review/modify generated Process Templates before execution
   - Schedule visualization: Calendar view with task distribution, capacity analysis
   - Reflection dashboard: Daily/weekly Observer insights, pattern drift alerts
   - Prompt management: Edit/version prompt templates in Postgres
   - Model selection: Choose LLM for different operations (planning vs scheduling vs reflection)
   - Credential management: OAuth tokens, API keys, service health

3. **Integration Points**:
   - Memory Gateway: GET `/api/v1/memory/recall` for browsing, POST for manual entries
   - Planner Engine: GET `/api/v1/planner/plans` for review, POST for manual planning
   - Scheduler Engine: OAuth flow, calendar preview before commit
   - Observer Agent: Reflection history, metric trends
   - Coda MCP: Pattern table management, execution run analysis

**Recommendation**: Defer UI work to Phase 3-4, prioritize backend/API stability first. The current architecture provides full functionality through APIs accessible via curl/Postman/scripts. UI is a productivity enhancement, not a blocker.

## Related Changes

- **add-planner-memory-system** - Replacement architecture (active)
- **coda-pattern-tables-implementation** - Pattern Ontology in Coda (active)
- **coda-mcp-pattern-integration** - MCP tools for patterns (active)

## Files Archived

All files moved to `archive/2025-12-02-investigate-archon-memory-architecture/`:
- proposal.md (investigation plan)
- WORKSHEETS.md (task templates)
- tasks.md (100+ investigation tasks)
- design.md (decision skeleton, never populated)
- COMPLETION.md (this file)

## Action Items

- [x] Document completion rationale
- [x] Capture UI gap for future planning
- [ ] Move to archive directory
- [ ] Validate with `openspec validate --strict`

## Conclusion

This change served its purpose by forcing consideration of memory architecture requirements, even though the formal investigation was never executed. The decision to build a new architecture rather than patch Archon was the right strategic choice, and the UI gap has been documented for future phases.

**No migration needed**: Since Archon is being fully deprecated and replaced, there's no incremental migration path.

**No rollback needed**: This change was never implemented, so there's nothing to roll back.
