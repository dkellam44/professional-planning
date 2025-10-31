# Standard Operating Procedures (SOPs)

**Purpose:** Document repeatable workflows for consistent execution and knowledge transfer

**Last Updated:** 2025-10-12

---

## How to Use This Directory

1. **Find the SOP** you need from the index below
2. **Follow step-by-step** - SOPs are designed to be executed without guessing
3. **Update as you go** - If something changes, update the SOP
4. **Create new SOPs** - Use `/sop` command or copy the template

---

## SOP Index

### Development Workflows

| SOP | Purpose | Status |
|-----|---------|--------|
| [Content Review](development/content-review.md) | Get AI feedback on content before implementation | ✅ Active |
| [Content Updates](development/content-updates.md) | Add/edit slide content safely | ✅ Active |
| [Git Workflow](development/git-workflow.md) | Branch, commit, merge processes | 📝 Draft |
| [Feature Development](development/feature-development.md) | Build new features end-to-end | 🔜 Planned |
| [Deployment](development/deployment.md) | Deploy to production checklist | 🔜 Planned |
| [Troubleshooting](development/troubleshooting.md) | Common issues & solutions | 🔜 Planned |

### Ops Studio Processes

| SOP | Purpose | Status |
|-----|---------|--------|
| Client Onboarding | (Future - for real clients) | 🔜 Planned |
| Project Setup | (Future - new projects) | 🔜 Planned |

---

## SOP Template

When creating a new SOP, use this structure:

```markdown
# [SOP Name]

**Version:** 1.0
**Last Updated:** YYYY-MM-DD
**Author:** David Kellam
**Status:** Draft | Active | Deprecated

---

## Purpose
[One sentence: What does this SOP help you accomplish?]

## When to Use
[Specific scenarios when you'd follow this SOP]

## Prerequisites
- [ ] Requirement 1
- [ ] Requirement 2

## Tools Required
- Tool 1 (and why)
- Tool 2 (and why)

---

## Procedure

### Step 1: [Action]
**What:** [Describe what to do]
**How:**
```bash
# Commands or actions
```
**Expected Result:** [What success looks like]
**Troubleshooting:** [Common issues and fixes]

### Step 2: [Action]
[Repeat structure]

---

## Success Criteria
- [ ] Outcome 1 achieved
- [ ] Outcome 2 achieved

## Related SOPs
- [Link to related SOP]

## Revision History
| Date | Version | Changes |
|------|---------|---------|
| YYYY-MM-DD | 1.0 | Initial creation |
```

---

## Creating New SOPs

**Option 1: Use slash command**
```
/sop [topic-name]
```

**Option 2: Manual creation**
1. Copy template from above
2. Create file in appropriate directory
3. Fill out all sections
4. Add to index in this README

---

## SOP Maintenance

**When to update an SOP:**
- Process changes (new tools, different workflow)
- Common issue discovered
- Step unclear or confusing
- Better practice identified

**How to update:**
1. Edit the SOP file
2. Update "Last Updated" date
3. Increment version (1.0 → 1.1 for minor, 1.0 → 2.0 for major)
4. Add entry to "Revision History"
5. Commit: `git commit -m "docs: Update [SOP name] - [what changed]"`

---

## Benefits of SOPs

**For you:**
- ✅ Don't have to remember every detail
- ✅ Consistent execution every time
- ✅ Easy to delegate tasks later
- ✅ Faster onboarding for collaborators

**For clients (like KD):**
- ✅ Shows systems thinking
- ✅ Demonstrates operational maturity
- ✅ Proof of repeatable processes
- ✅ Confidence in your approach

**For AI assistants:**
- ✅ Clear context for helping you
- ✅ Can follow established procedures
- ✅ Understand your preferences

---

**End of SOP Index**
