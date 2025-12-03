# Coda Configuration - Source of Truth

**Purpose**: Central configuration for all Coda document references across the portfolio

**Last Updated**: 2025-12-02

---

## BestViable ERP

**Primary Personal ERP System**

### Coda Document
- **Doc ID**: `CxcSmXz318`
- **Doc Name**: BestViable ERP _(formerly "Founder HQ", "DK Enterprise OS")_
- **Purpose**: Personal ERP implementing Pattern Ontology (Patterns → Assets → Instances)
- **Tables**: 36 total (Pattern tables + Business tables)

### Documentation
- **Schema Reference**: `/ventures/bestviable-erp/coda-schema.md` (authoritative)
- **Pattern Ontology**: `/ventures/bestviable-erp/pattern-ontology.md` (design philosophy)
- **Table IDs**: `/ventures/bestviable-erp/coda_table_ids.txt` (API reference)
- **OpenSpec**: `openspec/specs/coda-schema/spec.md` (formal requirements)

### API Access
- **Environment Variable**: `CODA_API_TOKEN` (set in `.env`)
- **Lightweight Scripts**: `docs/system/scripts/coda-scripts/` (token-efficient Python scripts)
- **MCP Server** (future): Custom server with CIMD OAuth (Phase 2, 2-6 months)

---

## Naming Conventions

### In Code
**Always use Doc ID, not Doc Name**:
```python
# ✅ Correct - resilient to renames
CODA_ERP_DOC_ID = "CxcSmXz318"

# ❌ Wrong - breaks on rename
doc_name = "BestViable ERP"
doc_id = get_doc_id_by_name(doc_name)
```

### In Documentation
**Reference Pattern**:
- **Technical docs**: "Coda doc CxcSmXz318" or "BestViable ERP Coda doc (CxcSmXz318)"
- **User-facing docs**: "BestViable ERP"
- **Cross-references**: Link to this config file for details

**Example**:
```markdown
The BestViable ERP Coda doc (CxcSmXz318) contains 36 tables implementing the Pattern Ontology.

See [Coda Config](/config/coda-config.md) for schema documentation.
```

---

## Name History

**Product Name Evolution**:
- **2024**: "Founder HQ"
- **2025-Q1**: "DK Enterprise OS" (brief transition)
- **2025-12-02**: Renamed to **"BestViable ERP"**

**Why BestViable ERP**:
- Aligns with BestViable brand (Operations Studio parent venture)
- Generic "ERP" vs. specific "Founder HQ" (more scalable for multi-tenant SaaS)
- Consistent with `/ventures/bestviable-erp/` directory structure

---

## Update Protocol

**When Renaming Coda Doc**:
1. Update this config file (Doc Name field)
2. Update `/ventures/bestviable-erp/coda-schema.md` (header)
3. Find/replace in active documentation (OpenSpec changes, architecture docs)
4. Do NOT update archived docs (historical snapshots)

**When Adding Tables**:
1. Regenerate `/ventures/bestviable-erp/coda_table_ids.txt` (via list_tables script or API)
2. Update `/ventures/bestviable-erp/coda-schema.md` (table list)
3. Update `openspec/specs/coda-schema/spec.md` if new table type (e.g., new pattern table)

---

## Related Configuration

- **MCP Servers**: `docs/system/architecture/MCP_SERVER_CATALOG.md`
- **Service Inventory**: `docs/system/architecture/SERVICE_INVENTORY.md`
- **Scripts**: `docs/system/scripts/coda-scripts/README.md`

---

**Maintainer**: David Kellam
**Contact**: Use this file as SoT for all Coda doc references
