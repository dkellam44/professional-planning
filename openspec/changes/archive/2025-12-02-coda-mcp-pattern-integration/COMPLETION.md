# Change Completion: coda-mcp-pattern-integration

**Status**: ARCHIVED - NOT NEEDED FOR PERSONAL USE
**Date**: 2025-12-02
**Decision**: Pattern-specific MCP tools are over-engineered for single-user scenarios

## Summary

This change was created to extend the Coda MCP server with 11 pattern-specific tools (e.g., `mcp__coda__get_service_blueprint`, `mcp__coda__create_process_template`) to provide type safety, relation expansion, and business logic validation for the Founder HQ Pattern Ontology.

Upon strategic review, it was determined that **pattern-specific tools are not needed for personal use** and should only be implemented if/when building a multi-tenant SaaS product (Phase 5).

## Why This Change Is Not Needed

### For Personal Use (Current Scenario)
- ❌ **Over-engineered**: Generic CRUD tools (list_rows, create_rows, update_row) are sufficient for single-user, single-doc scenarios
- ❌ **Rigidity**: Hard-coded table IDs (e.g., `grid-pgL9kxkhKI` for Service Blueprints) lock schema to specific Coda doc
- ❌ **Maintenance burden**: Every schema change requires tool definition updates
- ❌ **Token inefficiency**: MCP loads all 34+ tool schemas (~3,000 tokens) vs. lightweight scripts (20 tokens)
- 🤷 **Minor benefit**: Type safety and validation are less valuable when you control the schema

### Current Access Strategy (Hybrid Approach)
**Phase 1 (0-2 months)**: Lightweight code execution scripts
- ✅ 95-99% token savings (Anthropic research: 150,000 → 2,000 tokens)
- ✅ Works TODAY (no auth dependency)
- ✅ Local processing (pandas filtering, batch operations)
- ✅ Full control over implementation

**Phase 2 (2-6 months)**: Custom MCP server with **generic CRUD tools**
- Use community MCP baseline (34 tools: list_documents, get_table, list_rows, create_rows, etc.)
- Implement MCP 2025-11-25 spec (CIMD OAuth, Tasks API)
- Deploy for external clients (ChatGPT, Claude.ai web)
- **NOT pattern-specific** - generic tools work for all tables

**Phase 5 (6+ months)**: Evaluate pattern-specific tools for SaaS
- IF building multi-tenant Ops Studio product
- AND customers need validation/business logic enforcement
- THEN implement pattern-specific tools

## When Pattern-Specific Tools Would Be Valuable

**For Multi-Tenant SaaS** (Ops Studio customers):
- ✅ **Validation**: Prevent invalid data (e.g., `template_type` must be 'Operational' or 'Communication')
- ✅ **Relation expansion**: Auto-fetch linked records (`workflow.service_blueprint → {blueprint_id, name}`)
- ✅ **Deduplication**: Prevent duplicate execution runs (natural key check: `task_id + started_at`)
- ✅ **Business logic**: Enforce constraints (e.g., `billable_pct >= 60%` when runway < 12 weeks)
- ✅ **Consistent semantics**: All customers use same "create Process Template" operation

**Example Use Case**: If 100 Ops Studio customers each have their own Founder HQ Coda doc, pattern-specific tools ensure:
- All docs follow the same schema conventions
- Validation rules are enforced consistently
- Business logic is centralized (not duplicated in each customer's setup)
- API errors are meaningful (not generic "invalid data")

## What Was Learned

The creation of this OpenSpec change was valuable for:
1. **Design Patterns**: Documented when to use pattern-specific vs. generic tools
2. **Deduplication Logic**: Natural key patterns for execution runs (`task_id + started_at`)
3. **Error Handling**: Proper HTTP status codes (400 validation, 404 not found, 409 conflict, 429 rate limit)
4. **MCP Tool Design**: How to structure tools with relation expansion and type safety

The **specs/coda-mcp/spec.md** file serves as future reference if pattern-specific tools are needed for SaaS in Phase 5.

## Strategic Context (Coda Access Strategy)

This change was archived as part of a comprehensive Coda access strategy review (see `/Users/davidkellam/.claude/plans/coda-access-strategy.md`):

**Key Findings**:
1. **Current Coda MCP**: Community clone with 34 generic tools, broken auth (old DCR pattern)
2. **New MCP Spec (2025-11-25)**: CIMD OAuth, Tasks API, Authorization Extensions (simpler auth)
3. **Lightweight Scripts**: 95-99% token savings proven by Anthropic research
4. **Official Coda MCP**: Rumored but unconfirmed, timeline unknown
5. **Notion Alternative**: Evaluated, deferred to Phase 4-5 based on customer demand

**Recommendation**: Hybrid approach (scripts for CLI, generic MCP for web clients), defer pattern-specific tools to SaaS phase.

## Related Changes

- **add-planner-memory-system** - Uses generic Coda API access (active)
- **coda-pattern-tables-implementation** - Archived (tables already exist)
- **add-lightweight-coda-scripts** - Token-efficient alternative to MCP (active, Phase 1 priority)

## Migration Notes

**No migration needed**: This change was never implemented.

**No rollback needed**: No code was written.

**Future Implementation Path** (if needed for Phase 5 SaaS):
1. Start with generic MCP tools (baseline from community clone)
2. Add pattern-specific tools incrementally as validation needs arise
3. Use FastMCP Python framework (simpler than TypeScript MCP SDK)
4. Implement MCP 2025-11-25 spec (CIMD OAuth, Tasks API, Authorization Extensions)
5. Host `client.json` at `https://planner.bestviable.com/client.json` for CIMD OAuth

## Files Archived

All files moved to `archive/2025-12-02-coda-mcp-pattern-integration/`:
- proposal.md (justification for pattern-specific tools)
- tasks.md (58 implementation tasks)
- design.md (API design, error handling, security)
- specs/coda-mcp/spec.md (formal OpenSpec specification with 17 scenarios)
- COMPLETION.md (this file)

## Conclusion

This change served its purpose by forcing strategic thinking about Coda access patterns and tool granularity. The decision to defer pattern-specific tools to Phase 5 (multi-tenant SaaS) allows Phase 1 to focus on:
- Lightweight code execution scripts (token efficiency)
- Planner & Memory Architecture (core value)
- Generic MCP server (external client access)

**Lesson**: Don't over-engineer for hypothetical future needs. Start with generic tools, add specificity when actual validation/business logic requirements emerge from real usage.

**Key Decision**: For personal use (single user, single doc), **generic CRUD is sufficient**. Pattern-specific tools are a premature optimization.
