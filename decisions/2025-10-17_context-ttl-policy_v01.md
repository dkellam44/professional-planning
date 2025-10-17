# ADR: Context TTL & Decay Policy (v01)

- **Date:** 2025-10-17
- **Status:** Accepted
- **Context:** As the corpus grows, precision drops without decay/TTL. We need operational forgetting and promotion rules.
- **Decision:**
  - Session notes TTL: 14–30 days; auto-archive unless promoted.
  - Project briefs TTL: project end + 90 days; promote key learnings to evergreen playbooks.
  - Evergreen playbooks: no TTL; versioned with ADRs.
- **Consequences:** Reduces retrieval noise; requires weekly housekeeping job and a promotion ritual.
