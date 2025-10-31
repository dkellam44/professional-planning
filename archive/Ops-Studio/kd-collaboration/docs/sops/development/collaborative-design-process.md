# Collaborative Design Process (Plan-Worksheet-Iterate)

**Version:** 1.0
**Last Updated:** 2025-10-14
**Author:** David Kellam
**Status:** Active

---

## Purpose

Establish a structured, iterative workflow for making complex design or content decisions collaboratively with AI assistance, using a plan-worksheet-iterate pattern that preserves context and enables thoughtful decision-making over multiple sessions.

---

## When to Use

Use this process when you need to:
- Make complex design decisions with multiple options to consider
- Revise content through multiple iterations based on feedback
- Work on a project over several discrete sessions (days/weeks apart)
- Collaborate with AI while maintaining decision authority
- Document decision rationale for future reference
- Balance exploration (many options) with execution (clear choices)

**Examples:**
- Website redesign with typography, color, and layout decisions
- Content strategy requiring tone, messaging, and format choices
- Feature planning with technical trade-offs to evaluate
- Brand identity development with multiple visual directions

---

## Prerequisites

- [ ] Project repository initialized with git
- [ ] Basic directory structure in place (`/docs/`, `/content/`, etc.)
- [ ] Clear project goals documented (what are you trying to achieve?)
- [ ] Understanding of who makes final decisions (you, client, team)
- [ ] Time set aside for thoughtful review (don't rush decisions)

---

## Tools Required

**Development Tools:**
- **Git** - Version control to track changes and preserve history
- **GitHub** (optional) - Remote backup and collaboration
- **Code editor** - VS Code or similar with git integration
- **Claude Code** - AI assistant for creating plans and iterating

**Claude Code Specific:**
- **Read tool** - For reviewing files and understanding context
- **Write tool** - For creating new plan/worksheet documents
- **Edit tool** - For refining based on feedback
- **Glob/Grep tools** - For finding related files and patterns

**Documentation:**
- Markdown files (`.md`) for all plans and worksheets
- Clear file naming convention (e.g., `design-plan-v1.0.md`)

---

## Procedure

### Step 1: Set Up Project Structure

**What:** Create a dedicated directory for the planning process with clear organization.

**How:**

```bash
# Create directory for the planning domain (e.g., design, content, features)
mkdir -p /path/to/project/design

# Or for content planning
mkdir -p /path/to/project/content/drafts/content-plan-v4

# Create a README to explain the directory
touch /path/to/project/design/README.md
```

**Directory naming conventions:**
- Use lowercase with hyphens (e.g., `content-plan-v4`, `design`)
- Create subdirectories for supporting assets (e.g., `/visuals/`, `/drafts/`)
- Keep planning separate from implementation (e.g., `/design/` vs `/components/`)

**Expected Result:** Clean directory structure that separates planning from implementation.

**Troubleshooting:**
- If directory already exists, check what's inside before proceeding
- If unsure where to put it, create in `/docs/` or a project-specific subfolder

---

### Step 2: Create Context Document (Session 0)

**What:** Establish baseline context that can be referenced in future sessions.

**How:**

Create a context document that includes:
1. **Project overview** - What you're building and why
2. **Current state** - Where things stand right now
3. **Goals for this planning phase** - What decisions need to be made
4. **Constraints** - Technical, budget, time, or other limitations
5. **Success criteria** - How you'll know the plan is good
6. **Inspiration sources** - Examples, references, competitors

**Template:**

```markdown
# [Domain] Planning Context

**Date Started:** [Date]
**Goal:** [One sentence goal]
**Timeline:** [When do you need decisions by?]

## Current State
- What exists now
- What's working/not working
- Previous decisions made

## Objectives
- Decision 1 to make
- Decision 2 to make
- Decision 3 to make

## Constraints
- Technical: [e.g., must work on mobile]
- Budget: [e.g., no custom illustrations]
- Timeline: [e.g., ship in 2 weeks]

## Inspiration
- Example 1: [link or file]
- Example 2: [link or file]

## Success Criteria
- [ ] Criterion 1
- [ ] Criterion 2
```

**Expected Result:** A single document AI can read to quickly understand project context.

**Claude Code Tip:** Save this as `context.md` or `README.md` in your planning directory. In future sessions, tell Claude to "read the context doc first."

---

### Step 3: Gather Inspiration & Analysis (Research Phase)

**What:** Collect and analyze examples, competitors, or references that inform decisions.

**How:**

1. **Collect assets:**
   ```bash
   # Create a visuals or references directory
   mkdir -p /path/to/project/design/visuals

   # Save screenshots, PDFs, or images
   # Name them descriptively: reference-competitor-homepage.png
   ```

2. **Document inspiration sources:**
   - Create `visual-inspiration.md` or `content-references.md`
   - Link to files and note what's good/bad about each
   - Include anti-examples (what NOT to do)

3. **Analyze with AI:**
   - Ask Claude Code to read and analyze each reference
   - Document observations in `analysis-notes.md`
   - Extract patterns, techniques, and principles

**Example prompt for Claude:**
> "Read the screenshot at /path/to/reference.png and analyze the typography, color palette, and layout. What design principles make this effective?"

**Expected Result:** Comprehensive analysis document with insights extracted from references.

**Claude Code Tools:**
- **Read tool** - Can read images (PNG, JPG), PDFs, and Jupyter notebooks
- **Glob tool** - Find all reference files: `glob pattern="**/*.png"`
- **WebFetch tool** - Analyze websites directly if given URL

---

### Step 4: Create Initial Plan (v1.0)

**What:** AI creates comprehensive plan with multiple options for each decision point.

**How:**

1. **Define scope for the plan:**
   - What decisions need options? (e.g., typography scale, color palette, layout)
   - How many alternatives per decision? (2-3 recommended)
   - What level of detail? (specs, rationale, pros/cons)

2. **Prompt Claude to create plan:**

**Example prompt:**
> "Based on the context document and visual analysis, create a comprehensive design plan (design-plan-v1.0.md) that includes:
> - Color palette options (3 alternatives)
> - Typography system options (3 scales)
> - Layout options for each page/slide (2-3 variations)
> - Component styling specifications
> - For each option, include rationale, pros/cons, and inspiration source
> - Implementation priorities and timeline"

3. **Plan document structure:**
   ```markdown
   # [Domain] Plan v1.0

   ## Overview
   [Summary of what this plan covers]

   ## Decision 1: [Name]

   ### Option A: [Name] (Recommended)
   **Description:** [What this option entails]
   **Rationale:** [Why this might work]
   **Pros:**
   - Pro 1
   - Pro 2
   **Cons:**
   - Con 1
   **Inspiration:** [Reference to analysis]

   ### Option B: [Name]
   [Same structure]

   ### Option C: [Name]
   [Same structure]

   ## Decision 2: [Name]
   [Repeat pattern]
   ```

4. **Review for completeness:**
   - Does each decision have 2-3 clear alternatives?
   - Is rationale provided for each option?
   - Are there enough details to make informed choice?
   - Are technical considerations mentioned?

**Expected Result:** Comprehensive plan document (30-100 pages depending on complexity) with clear options for every major decision.

**Claude Code Tips:**
- Use **Write tool** to create large plan documents in one go
- Ask Claude to structure with clear headings (makes it easier to navigate)
- Request markdown formatting for readability
- File naming: Always include version number (`v1.0`, `v1.1`, etc.)

**Git Best Practice:**
```bash
# After plan is created, commit it
git add design/design-plan-v1.0.md
git commit -m "docs: add initial design plan v1.0 with all options"
```

---

### Step 5: Create Decision Worksheet

**What:** Build a structured template for making selections from the plan.

**How:**

1. **Worksheet structure mirrors plan:**
   - One checkbox section per decision
   - Space for notes on each choice
   - Priority ranking section
   - Open questions area

2. **Prompt Claude:**
> "Create a decision worksheet (design-worksheet-v1.0.md) that corresponds to design-plan-v1.0.md. For each decision in the plan, provide:
> - Checkbox options for each alternative
> - Brief summary of each option (1-2 sentences)
> - Space for notes/feedback
> - Include sections for: priority ranking, additional preferences, open questions, final notes"

3. **Worksheet template example:**
   ```markdown
   # [Domain] Worksheet v1.0

   **Purpose:** Decision-making for [domain]-plan-v1.0.md
   **Instructions:** Review plan, check boxes, add notes

   ---

   ## Decision 1: [Name]

   **Question:** [Frame decision as question]

   - [ ] **Option A: [Name]** (Recommended)
     - [1-2 sentence summary]
     - Why it might work

   - [ ] **Option B: [Name]**
     - [1-2 sentence summary]

   - [ ] **Option C: [Name]**
     - [1-2 sentence summary]

   **Notes:**
   [Space for your thoughts]

   ---

   ## Priority Ranking
   Rank these in order (1 = highest priority):
   - [ ] ____ Decision 1
   - [ ] ____ Decision 2

   ---

   ## Open Questions
   [What's unclear? What concerns you?]

   ---

   **Completed:** __________ (Date)
   **Next Action:** [What happens after filling this out]
   ```

**Expected Result:** Worksheet that makes decision-making straightforward and captures rationale.

**Git Best Practice:**
```bash
git add design/design-worksheet-v1.0.md
git commit -m "docs: add decision worksheet v1.0 template"
```

---

### Step 6: Review & Fill Out Worksheet (Human Decision Time)

**What:** YOU (or your client/stakeholder) review the plan and make selections.

**How:**

1. **Set aside focused time:**
   - Don't rush this - complex decisions need thought
   - Review plan first, worksheet second
   - Take breaks if needed (decisions over multiple days is OK)

2. **Review process:**
   - Read each section of plan thoroughly
   - Look at visual references mentioned
   - Consider pros/cons of each option
   - Check boxes in worksheet as you go
   - Add notes explaining WHY you chose each option

3. **Capture rationale:**
   - For each major decision, write 1-2 sentences about WHY
   - Note any concerns or "yes, but..." thoughts
   - Identify where you're uncertain and need more info

4. **Mark completion:**
   ```markdown
   **Completed:** 2025-10-14 5:15pm
   **Next Action:** Share with Claude for v1.1 creation
   ```

**Expected Result:** Completed worksheet with checked boxes and notes explaining decisions.

**Tips:**
- If you're unsure between options, check both and note the conflict
- Use "Priority Ranking" section to identify what matters most
- "Open Questions" section is crucial - ask for what's unclear
- Save worksheet periodically (don't lose work!)

**Git Best Practice:**
```bash
# After completing worksheet
git add design/design-worksheet-v1.0.md
git commit -m "docs: complete design worksheet v1.0 with all selections"
```

---

### Step 7: Create Refined Plan (v1.1 or v1.2)

**What:** Based on worksheet selections, AI creates refined plan with fewer options and more detail.

**How:**

1. **Prompt Claude with completed worksheet:**
> "I've completed design-worksheet-v1.0.md. Based on my selections:
> - Create design-plan-v1.1.md incorporating chosen options
> - For decisions where I was uncertain (noted in worksheet), provide 2 refined alternatives
> - Add more implementation detail for selected approaches
> - Address open questions I raised
> - Include specific code/design specs for selected options"

2. **What v1.1 should include:**
   - Locked-in decisions (no longer presenting alternatives)
   - Refined alternatives for uncertain areas
   - More technical detail (colors codes, font sizes, spacing values)
   - Code snippets or examples where applicable
   - Updated implementation timeline based on selections

3. **Iteration cycle:**
   - v1.0 → worksheet v1.0 → v1.1
   - v1.1 → worksheet v1.1 → v1.2 (if needed)
   - v1.x → worksheet v1.x → FINAL

**Expected Result:** More focused plan document with decisions locked in and remaining choices refined.

**Claude Code Tips:**
- Claude can read both the original plan and your worksheet simultaneously
- Ask Claude to reference specific notes you made in worksheet
- Request explanations if selected options create conflicts

**Git Best Practice:**
```bash
git add design/design-plan-v1.1.md
git commit -m "docs: create design plan v1.1 based on worksheet selections"
```

---

### Step 8: Prototype (Optional but Recommended)

**What:** Build a working prototype of selected direction before finalizing all decisions.

**How:**

1. **Select key element to prototype:**
   - If design: Build 1-2 critical pages/components
   - If content: Draft 1-2 key sections fully
   - Focus on highest-impact or highest-risk elements

2. **Implement and preview:**
   ```bash
   # Start development server
   npm run dev
   # Preview at http://localhost:3000
   ```

3. **Browser review worksheet:**
   - Create `[domain]-worksheet-v1.2.md` for browser feedback
   - Note what works and what needs adjustment in live preview
   - Capture specific issues (colors, spacing, type sizes, etc.)

**Example browser review prompts:**
- "Does the headline size feel right at 96px (text-8xl)?"
- "Is the plum background too dark or just right?"
- "Can you read the table on mobile (test at 375px width)?"

4. **Iterate based on real feedback:**
   - Adjust colors, sizes, spacing in real implementation
   - Document changes in worksheet v1.2
   - Create plan v1.3 if major revisions needed

**Expected Result:** Working prototype validates (or invalidates) paper decisions. Real-world testing prevents costly rework later.

**Claude Code Tips:**
- Use **Bash tool** to run dev server: `npm run dev`
- Use **Read tool** to review current component code
- Use **Edit tool** to make adjustments based on browser feedback

**Git Best Practice:**
```bash
# Commit prototype separately from plan docs
git add components/TitleSlide.tsx
git commit -m "feat: prototype Title slide with design-plan v1.1 specs"

# Commit browser review worksheet
git add design/design-worksheet-v1.2.md
git commit -m "docs: browser review feedback for prototype"
```

---

### Step 9: Create Final Plan Document

**What:** Lock in all decisions in a `-FINAL` document ready for full implementation.

**How:**

1. **Consolidate final decisions:**
   - All alternatives resolved
   - Specific values locked in (color codes, font sizes, spacing)
   - Implementation order prioritized
   - Edge cases addressed
   - Browser-tested and validated

2. **Prompt Claude:**
> "Based on all iterations (v1.0, v1.1, v1.2) and browser testing feedback, create design-plan-v1.x-FINAL.md that:
> - Documents all final decisions
> - Provides exact specifications (no more options)
> - Includes implementation checklist
> - References why decisions were made (link back to worksheets)
> - Serves as single source of truth for implementation"

3. **Final plan structure:**
   ```markdown
   # [Domain] Plan v1.x - FINAL

   **Status:** Final - Ready for implementation
   **Decisions locked:** [Date]

   ## Final Specifications

   ### Color System (Locked)
   - Primary: #6B1F5C (deep plum)
   - Accent: #C9A961 (warm gold)
   - [No more alternatives - these are final]

   ### Typography (Locked)
   - H1: text-8xl (96px), Playfair Display, font-bold
   - [Exact values, no ranges]

   ## Implementation Checklist
   - [ ] Update tailwind.config.ts with final colors
   - [ ] Implement Title slide with final specs
   - [ ] [Step-by-step tasks]

   ## Decision Rationale
   [Link to worksheets and explain WHY]

   ## Next Steps
   [Clear path forward]
   ```

**Expected Result:** Single authoritative document that guides full implementation without ambiguity.

**Git Best Practice:**
```bash
git add design/design-plan-v1.3-FINAL.md
git commit -m "docs: finalize design plan v1.3 after browser testing

All decisions locked and ready for implementation:
- Color system finalized
- Typography scale tested and approved
- Layout patterns validated in browser
- Component specs detailed for development

See design-worksheet-v1.0, v1.1, v1.2 for decision history."
```

---

### Step 10: Maintain Context Across Sessions

**What:** Preserve knowledge and decisions when working over multiple days/weeks.

**How:**

**Before ending a session:**

1. **Commit all work:**
   ```bash
   # Check what's changed
   git status

   # Stage all plan/worksheet files
   git add design/

   # Commit with descriptive message
   git commit -m "docs: session end - completed design worksheet v1.0

   Decisions made:
   - Selected typography Option A (dramatic scale)
   - Selected color rhythm Option A (alternating backgrounds)
   - Still uncertain about Title slide layout (need prototypes)

   Next session: Create v1.1 plan and prototype Title slide"
   ```

2. **Create session handoff note:**
   ```markdown
   # Session Handoff - [Date]

   ## What was accomplished
   - Created design-plan-v1.0.md
   - Reviewed all options
   - Completed design-worksheet-v1.0.md

   ## Decisions made
   - Typography: Dramatic scale (Option A)
   - Colors: Alternating rhythm (Option A)

   ## Still uncertain
   - Title slide layout (need to see prototypes)

   ## Next session priorities
   1. Create design-plan-v1.1.md
   2. Prototype Title slide Options A & B
   3. Review in browser

   ## Files to reference next time
   - design/design-worksheet-v1.0.md (my selections)
   - design/visual-analysis-notes.md (inspiration context)
   - design/README.md (workflow guide)
   ```

3. **Update project context:**
   - Add session notes to `.claude/project-context.md`
   - Document where you are in the process
   - Note blockers or open questions

**Starting a new session:**

1. **Review context first:**
   ```bash
   # Check recent commits to see what happened last time
   git log --oneline -10

   # See what files changed recently
   git log --name-only -5
   ```

2. **Prompt Claude to read context:**
   > "Read these files to understand where we are:
   > - .claude/project-context.md (overall project status)
   > - design/README.md (workflow status)
   > - design/design-worksheet-v1.0.md (decisions I made last session)
   > - Session handoff note if it exists
   >
   > Then summarize: What decisions have been made? What's next?"

3. **Verify understanding:**
   - Ask Claude to summarize the current state
   - Confirm it understands previous decisions
   - Identify any gaps in context

**Expected Result:** Seamless continuation across sessions with no lost context or repeated work.

**Claude Code Context Tips:**
- **Use project-context.md** - Claude Code can read this automatically
- **Reference specific files** - Don't rely on memory, point to documents
- **Git history is your friend** - Commit messages tell the story
- **Handoff notes > memory** - Document don't rely on recall

---

## Success Criteria

- [ ] All major decisions documented with rationale
- [ ] Multiple iterations refined options to final specs
- [ ] Prototype tested in browser validated choices
- [ ] Final plan document serves as implementation guide
- [ ] Git history shows clear progression (v1.0 → v1.1 → FINAL)
- [ ] Context preserved - can resume easily after breaks
- [ ] Open questions addressed (or explicitly deferred)
- [ ] Implementation ready to proceed with confidence

---

## Related SOPs

- **Content Updates** (`development/content-updates.md`) - For implementing content from finalized plans
- **Content Review** (`development/content-review.md`) - For ICP alignment checking

---

## Tips & Best Practices

### Decision-Making

**Don't rush:**
- Complex decisions need time. Sleeping on it is valid.
- If uncertain between two options, prototype both (time well spent)
- Document WHY you chose something (helps future you)

**Embrace iteration:**
- v1.0 should have many options (exploration phase)
- v1.1+ narrows down (refinement phase)
- FINAL locks it in (execution phase)
- This is normal and healthy - not rework, it's process

**Use worksheets effectively:**
- Check boxes are just the start - notes are the value
- "I don't know yet" is a valid answer (surface uncertainty early)
- Priority ranking helps when you can't have everything
- Open questions section is critical - ask for what you need

### Git & Version Control

**Commit frequently:**
```bash
# After creating any plan or worksheet document
git add [file]
git commit -m "docs: descriptive message"

# After completing a worksheet
git commit -m "docs: completed worksheet v1.0 with selections"

# After major decisions
git commit -m "docs: locked in typography and color system"
```

**Write good commit messages:**
```
# Good
docs: complete design worksheet v1.0 with typography and color selections

Selected dramatic typography scale (Option A) and alternating color rhythm.
Still uncertain about Title slide layout - need prototypes.

# Bad
updated worksheet
```

**Branch strategy (optional):**
```bash
# For major planning phases, create a branch
git checkout -b design/iteration-v1

# Merge to main when FINAL plan is ready
git checkout main
git merge design/iteration-v1
```

### Working with Claude Code

**Start sessions with context:**
- Always tell Claude to "read [file]" for important context
- Reference worksheet decisions explicitly
- Point to inspiration sources analyzed previously

**Use tools strategically:**
- **Read** for understanding existing files
- **Write** for creating new large documents (plans)
- **Edit** for refinements based on feedback
- **Glob** for finding related files
- **Grep** for searching patterns across files

**Save conversation history:**
- Important Claude insights? Copy to a note file
- Design rationale from conversation? Add to plan document
- Don't rely on chat history - it may not persist

**Plan mode for research:**
- Use Plan Mode when gathering inspiration (read-only)
- Exit Plan Mode when ready to create documents
- Plan Mode helps you think through options before committing

### Context Preservation

**Document structure is memory:**
- Well-organized files = easy context retrieval
- File names with versions = clear progression
- README files = quick orientation

**Session handoff notes:**
- Create these even if you're the only person
- Future you is a different person - help them out
- Saves 15-30 minutes of "where was I?" every session

**Project context file:**
- Keep `.claude/project-context.md` updated
- This is your single source of truth
- Claude Code can read it automatically

**Git is your timeline:**
- Commit messages document decisions
- `git log` shows what happened when
- Diffs show what changed and why

### Common Pitfalls to Avoid

**❌ Skipping v1.0 and jumping to final:**
- You don't know all constraints upfront
- Exploration phase is valuable
- "Perfect is the enemy of good"

**❌ Too many options in v1.0:**
- 2-3 alternatives per decision is sweet spot
- More than that is overwhelming
- Can always add more in v1.1 if needed

**❌ Not prototyping before finalizing:**
- Paper decisions often fail in practice
- Browser testing reveals issues early
- Prototypes validate or invalidate theory

**❌ Forgetting to commit:**
- Lost work is devastating
- Commit after every significant document
- "Commit early, commit often"

**❌ Poor context handoff:**
- Future sessions waste time re-understanding
- Document where you are and what's next
- Session handoff notes are 5 minutes now, save 30 later

**❌ Making decisions in chat:**
- Conversations are ephemeral
- Lock decisions in worksheet/plan documents
- Chat is for discussion, docs are for decisions

---

## Workflow Summary (Quick Reference)

```
Session 1: Setup & Research
├─ Create project directory structure
├─ Write context document
├─ Gather inspiration/references
└─ AI analyzes references → analysis-notes.md

Session 2: Initial Planning
├─ AI creates comprehensive plan v1.0 (many options)
├─ AI creates worksheet v1.0 template
├─ Commit both
└─ [Break - review on your own time]

Session 3: Decision Making
├─ YOU fill out worksheet v1.0 (check boxes, add notes)
├─ Commit completed worksheet
└─ AI creates refined plan v1.1 (fewer options, more detail)

Session 4: Prototyping (Optional but Recommended)
├─ Build prototype of key elements
├─ Browser testing
├─ Create worksheet v1.2 with browser feedback
└─ AI adjusts to create plan v1.2 or v1.3

Session 5: Finalization
├─ AI creates plan-FINAL.md (all decisions locked)
├─ Implementation checklist ready
├─ Commit final plan
└─ Begin implementation

---

Each session:
├─ Start: Read context, review git log, orient yourself
├─ Work: Create/review/decide
└─ End: Commit work, write session handoff note
```

---

## Revision History

| Date | Version | Changes |
|------|---------|---------|
| 2025-10-14 | 1.0 | Initial creation based on content-plan and design-plan workflows |

---

## Appendix: Example File Structure

```
project/
├── .claude/
│   └── project-context.md (updated each session)
│
├── design/ (or content/, features/, etc.)
│   ├── README.md (workflow status, current phase)
│   ├── context.md (planning goals and constraints)
│   ├── visual-inspiration.md (reference sources)
│   ├── visual-analysis-notes.md (AI analysis of references)
│   ├── design-plan-v1.0.md (initial comprehensive plan)
│   ├── design-worksheet-v1.0.md (your selections)
│   ├── design-plan-v1.1.md (refined plan)
│   ├── design-worksheet-v1.1.md (additional selections)
│   ├── design-worksheet-v1.2.md (browser review feedback)
│   ├── design-plan-v1.3-FINAL.md (locked decisions)
│   ├── session-handoff-2025-10-14.md (session notes)
│   └── visuals/ (screenshots, PDFs, references)
│
└── [implementation files]
    └── (created based on FINAL plan)
```

---

## Appendix: Git Command Cheat Sheet

```bash
# Check status (what's changed?)
git status

# See recent commits (what happened?)
git log --oneline -10

# See what files changed recently
git log --name-only -5

# Stage specific file
git add path/to/file.md

# Stage all files in directory
git add design/

# Commit with message
git commit -m "docs: descriptive message"

# See what changed in a file
git diff path/to/file.md

# See what changed in last commit
git show

# Create a branch (optional, for major work)
git checkout -b design/iteration-v1

# Switch back to main branch
git checkout main

# Merge branch into main (after work is done)
git merge design/iteration-v1

# Push to GitHub (if using remote)
git push origin main
```

---

## Appendix: Claude Code Prompt Templates

**Starting a new session:**
```
Read the following files to understand context:
- .claude/project-context.md
- design/README.md
- design/design-worksheet-v1.0.md (my previous selections)

Summarize:
1. What decisions have been made?
2. What's still uncertain?
3. What should we work on this session?
```

**Creating initial plan:**
```
Based on:
- design/context.md (goals and constraints)
- design/visual-analysis-notes.md (inspiration analysis)

Create design-plan-v1.0.md with:
- [Decision 1] with 2-3 options
- [Decision 2] with 2-3 options
- For each option: description, rationale, pros/cons, inspiration source
- Implementation priorities
```

**Creating refined plan:**
```
I've completed design-worksheet-v1.0.md.

Based on my selections, create design-plan-v1.1.md that:
- Locks in decisions I made
- Provides 2 refined alternatives for uncertain areas (noted in worksheet)
- Adds implementation detail for selected approaches
- Addresses open questions I raised
```

**Creating final plan:**
```
Based on all iterations (v1.0, v1.1, v1.2) and browser feedback in worksheet v1.2:

Create design-plan-v1.3-FINAL.md with:
- All final specifications (exact values, no options)
- Implementation checklist
- Decision rationale (reference worksheets)
- Ready for development without ambiguity
```
