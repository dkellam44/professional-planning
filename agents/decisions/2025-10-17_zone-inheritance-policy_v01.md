# ADR: Zone Inheritance Policy

- entity: decision
- level: policy
- zone: internal
- version: v01
- tags: [adr, security, zones, privacy]
- source_path: /decisions/2025-10-17_zone-inheritance-policy_v01.md
- date: 2025-10-17

## Status
**ACCEPTED**

## Context
The context architecture uses zone-based security to control information sensitivity:
- `public` - Can be shared externally (blog posts, open-source docs)
- `internal` - Business operations, internal playbooks
- `private` - Personal notes, sensitive client details
- `restricted` - PII, credentials, confidential client data

Questions arise:
- What's the default zone for new files?
- Can a Task have a different zone than its parent Project?
- What happens when merging/deriving content from multiple sources?
- How do we prevent accidental leaks (e.g., private data in public doc)?

## Decision

### Default Zone
All new files default to **`internal`** unless explicitly specified.

### Inheritance Rules

1. **Children may NOT downgrade sensitivity**
   - If a Project is `private`, all Tasks/Sprints/Deliverables must be `private` or `restricted`
   - Cannot create a `public` Task under a `private` Project
   - Cannot create an `internal` Deliverable under a `restricted` Engagement

2. **Effective zone is the MAXIMUM across ancestors**
   ```
   Sensitivity hierarchy: public < internal < private < restricted

   Example:
   Venture: internal
   ├── Engagement: private
   │   └── Project: internal  ❌ INVALID (cannot downgrade from private)
   │   └── Project: private   ✅ VALID
   │   └── Project: restricted ✅ VALID (upgrade allowed)
   ```

3. **Derived artifacts inherit the HIGHEST input zone**
   - Report combining `internal` Project + `private` notes → `private`
   - Template combining `public` playbook + `internal` client data → `internal`
   - Dashboard aggregating `internal` metrics + `restricted` PII → `restricted`

4. **Only files marked `public` may be published externally**
   - Public blog posts, open-source docs, marketing content
   - Requires explicit review and approval before zone downgrade to `public`
   - Downgrade requires ADR + PR + reviewer sign-off

### Enforcement

1. **Validation at creation time**
   - Builder must check parent zone before creating child files
   - Reject or warn if attempting to downgrade sensitivity

2. **Redaction before publishing**
   - Any content moving from higher zone to `public` requires:
     - Explicit redaction pass (remove PII, client names, sensitive data)
     - Reviewer approval
     - ADR documenting the redaction decision

3. **Retrieval filtering**
   - When context is retrieved for external use (public demos, docs), filter by zone
   - Only include files matching the target zone or lower sensitivity

### Zone Override (Exceptional Cases)
To downgrade a file's zone (e.g., `internal` → `public`):
1. Create ADR documenting rationale and redaction performed
2. Submit PR with redacted version
3. Get explicit reviewer sign-off
4. Update file metadata: add comment `<!-- Downgraded from [original_zone] via ADR [adr_id] -->`

## Consequences

### Positive
- Clear, automatic sensitivity escalation (safe by default)
- Prevents accidental leaks through zone enforcement
- Explicit process for publishing internal content
- Audit trail via ADRs for all sensitivity changes
- Easy to implement (just compare zone hierarchy)

### Negative
- No automatic downgrade path (requires manual process)
- May create "orphaned" public content when parent is upgraded
- Requires zone tracking in all file metadata

### Mitigations
- Document zone changes in file history (git log)
- Builder warns when detecting zone mismatches
- Quarterly review of zone assignments (automation flags anomalies)

## Examples

### Valid Structures
```
Venture: internal
├── Offer: public (productized service, marketing site)
├── Engagement: private (client contract)
│   └── Project: private
│       └── Task: private
│       └── Deliverable: restricted (contains PII)
└── Program: internal
```

### Invalid Structures (will be rejected)
```
Engagement: private
└── Project: internal  ❌ Cannot downgrade from private to internal

Project: restricted
└── Deliverable: public  ❌ Cannot publish restricted content without redaction ADR
```

## References
- Architecture spec: `/architecture-spec_v0.3.md` lines 88-89, 114-118
- SoT schema: `/sot/context_schemas_v02.yaml` line 4, 19
