# SOP Quick Start Guide

**For creating SOPs manually without AI assistance**

---

## Creating a New SOP (Manual Process)

### 1. Copy the Template

```bash
# Navigate to project
cd ~/Projects/kd-collaboration

# Copy template to appropriate location
cp docs/sops/SOP-TEMPLATE.md docs/sops/[category]/[your-sop-name].md

# Example - development category:
cp docs/sops/SOP-TEMPLATE.md docs/sops/development/git-workflow.md

# Example - ops-studio category:
cp docs/sops/SOP-TEMPLATE.md docs/sops/ops-studio/client-onboarding.md
```

### 2. Edit the File

```bash
# Open in your editor
code docs/sops/[category]/[your-sop-name].md

# Or use any text editor
open -a "TextEdit" docs/sops/[category]/[your-sop-name].md
```

### 3. Fill Out Template

Replace ALL `[bracketed text]` with actual content:
- `[SOP Name]` → Descriptive title
- `YYYY-MM-DD` → Today's date
- `[Purpose]` → What it accomplishes
- `[Step details]` → Actual instructions

**Delete the "Instructions" section at bottom when done**

### 4. Add to Index

Edit `docs/sops/README.md`:

```markdown
| [Your SOP Name](category/your-sop-name.md) | Brief description | 📝 Draft |
```

Status options:
- `📝 Draft` - Still being written/tested
- `✅ Active` - Ready to use
- `🔜 Planned` - Future SOP
- `⚠️ Deprecated` - Outdated

### 5. Save and Commit

```bash
# Stage the new SOP
git add docs/sops/

# Commit
git commit -m "docs: Add SOP for [process name]"

# Push to remote
git push origin develop
```

---

## Using an Existing SOP

### Find the SOP

```bash
# View index
cat docs/sops/README.md

# Or open in browser/editor
code docs/sops/README.md
```

### Follow the SOP

1. Open the SOP file
2. Check **Prerequisites** - make sure you meet them
3. Gather **Tools Required**
4. Follow **Procedure** step-by-step
5. Verify **Success Criteria** when done

### Report Issues

If you find problems with an SOP:
1. Note what's unclear or doesn't work
2. Fix it immediately (if you can)
3. Update "Last Updated" date
4. Add to "Revision History"
5. Commit: `git commit -m "docs: Update [SOP name] - [what you fixed]"`

---

## Categories

**development/** - Software development workflows
- Git processes
- Feature development
- Deployment
- Troubleshooting

**ops-studio/** - Business operations processes
- Client workflows
- Project management
- Service delivery

**Create new category:**
```bash
mkdir docs/sops/[new-category]
```

Then update README.md with new section.

---

## SOP Writing Checklist

When creating a new SOP, ensure it has:

- [ ] Clear, descriptive title
- [ ] One-sentence purpose
- [ ] Specific "When to Use" scenarios
- [ ] Prerequisites listed
- [ ] Tools required with reasons
- [ ] Step-by-step procedure
- [ ] Expected results for each step
- [ ] Troubleshooting for common issues
- [ ] Success criteria checklist
- [ ] Tips & best practices
- [ ] Dated and versioned
- [ ] Added to README index
- [ ] Tested by following it yourself

---

## Quick Commands Reference

```bash
# List all SOPs
ls docs/sops/*/

# Search for SOP by keyword
grep -r "keyword" docs/sops/

# View SOP index
cat docs/sops/README.md

# Copy template
cp docs/sops/SOP-TEMPLATE.md docs/sops/[category]/[name].md

# Edit SOP
code docs/sops/[category]/[name].md

# Commit SOP
git add docs/sops/ && git commit -m "docs: [message]"
```

---

## Making SOPs Portable (Universal System)

**To use SOPs with other AI tools or share with clients:**

### Option 1: Keep in Project (Current)
- ✅ Version controlled
- ✅ Project-specific context
- ✅ Easy to reference during work

### Option 2: Universal SOP Repository
```bash
# Create universal SOP repo (future)
mkdir ~/Documents/SOPs/
cd ~/Documents/SOPs/
git init

# Copy SOPs from project
cp -r ~/Projects/kd-collaboration/docs/sops/* ~/Documents/SOPs/

# Now accessible to any AI tool or project
```

### Option 3: Notion/Coda Database
- Export SOPs from markdown to Notion
- Use Notion database with filters
- Link from multiple projects
- Share with clients/team

### Option 4: Obsidian Vault
- Create Obsidian vault for SOPs
- Markdown native
- Graph view shows connections
- Works offline

**Recommendation:** Start in-project (current approach), migrate to universal system later when you have 10+ SOPs.

---

## File to AI Assistant Context

**When working with ChatGPT, Claude web, or other AI:**

1. **Share SOP content:**
   ```
   "Here's my SOP for [process]. Please help me execute it:
   [paste SOP content]"
   ```

2. **Reference in prompt:**
   ```
   "Following my git-workflow SOP at docs/sops/development/git-workflow.md,
   help me create a feature branch for..."
   ```

3. **Update SOP with AI help:**
   ```
   "I'm updating my content-updates SOP. Based on today's session,
   what should I add to the troubleshooting section?"
   ```

**For Claude Code specifically:**
- SOPs are automatically in context (same repo)
- Can reference: "Follow the content-updates SOP"
- Use `/sop` command to create new ones

---

## Tips for Solo Use (No AI)

**Print-friendly version:**
```bash
# Generate PDF from markdown (requires pandoc)
pandoc docs/sops/development/content-updates.md -o content-updates.pdf

# Or open in browser and print
open docs/sops/development/content-updates.md  # Opens in default markdown viewer
```

**Keep a physical copy** of critical SOPs (deployment, troubleshooting) for when systems are down.

**Use checklists** - print just the Success Criteria section as a checklist for routine tasks.

---

## Maintenance Schedule

**Weekly:** Review SOPs you used - any updates needed?

**Monthly:** Check all Active SOPs - still accurate?

**Quarterly:** Review entire SOP system:
- Archive deprecated SOPs
- Create planned SOPs
- Improve most-used SOPs
- Consolidate similar processes

---

**Need help? Reference the full template at `docs/sops/SOP-TEMPLATE.md`**
