You are helping create a new Standard Operating Procedure (SOP).

Ask the user:

1. What workflow or process do you want to document?
2. What category? (development, ops-studio, or other)
3. What's the purpose in one sentence?

Then create a new SOP file in `docs/sops/[category]/[workflow-name].md` using this template:

```markdown
# [SOP Name]

**Version:** 1.0
**Last Updated:** [Today's date]
**Author:** David Kellam
**Status:** Draft

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
# Commands or detailed steps
```

**Expected Result:** [What success looks like]

**Troubleshooting:** [Common issues and fixes]

### Step 2: [Action]
[Continue with clear step-by-step instructions]

---

## Success Criteria
- [ ] Outcome 1 achieved
- [ ] Outcome 2 achieved

## Related SOPs
- [Link to related SOPs if applicable]

## Tips & Best Practices
[Helpful hints for executing this SOP effectively]

---

## Revision History

| Date | Version | Changes |
|------|---------|---------|
| [Today] | 1.0 | Initial creation |
```

After creating the SOP:
1. Add an entry to `docs/sops/README.md` in the appropriate table
2. Set initial status (📝 Draft, ✅ Active, or 🔜 Planned)
3. Remind user to fill out the template with specific details

Be helpful and thorough. SOPs should be clear enough for someone unfamiliar with the process to follow.
