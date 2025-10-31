# Content Review SOP

**Version:** 1.0
**Last Updated:** 2025-10-12
**Author:** David Kellam
**Status:** Active

---

## Purpose
Get AI-powered feedback on pitch deck content to ensure it resonates with the target audience (KamalaDevi) before implementation

## When to Use
- After drafting new content in Notion/Coda
- Before implementing content in JSON files
- When unsure if messaging resonates
- For major content rewrites
- Before sharing pitch with KamalaDevi

## Prerequisites
- [ ] Content drafted in Notion/Coda
- [ ] ICP profile documented (in Founder HQ or project docs)
- [ ] Project goals clear
- [ ] Content review context file exists (`docs/content-review-context.md`)

## Tools Required
- **Claude Code** - AI review with project context
- **ChatGPT/Claude Web** - Alternative for review (requires copying context)
- **Notion/Coda** - Where draft content lives
- **Text editor** - To refine based on feedback

---

## Procedure

### Step 1: Prepare Content for Review

**What:** Organize your draft content for clear, focused feedback

**How:**

1. **In Notion/Coda, format your draft clearly:**

```markdown
# Content Review Request - [Date]

## Slide 2: Alignment & Intention

**Current version (if updating):**
[Paste current text from JSON file]

**New draft:**
[Your new content here]

**Specific questions:**
- Does this feel too corporate?
- Is "spaciousness" overused?
- Any suggestions to make it more specific?

---

## Slide 3: How I Might Help

**New draft:**
[Content]

**Concerns:**
[What you're unsure about]
```

2. **Decide scope:**
   - Single slide (focused, quick feedback)
   - Multiple slides (comprehensive review)
   - Full deck (big revision, longer review)

3. **Note specific concerns** for each piece

**Expected Result:**
- ✅ Content organized and ready to share
- ✅ Specific questions identified
- ✅ Clear what you want feedback on

**Troubleshooting:**
- Too much content? Break into multiple review sessions (slide-by-slide)
- Not sure what to ask? Request general feedback on all dimensions

---

### Step 2: Run AI Content Review

**What:** Get structured feedback using AI with proper context

**How:**

**Option A: Claude Code (Recommended - Has Full Context)**

1. **Use slash command:**
   ```
   /content-review
   ```

2. **When prompted, provide:**
   - Which slide(s): "Slide 2 and 3"
   - Your draft content: [Copy from Notion]
   - Specific concerns: "Worried slide 2 feels too vague"

3. **Claude Code will:**
   - Read `docs/content-review-context.md` automatically
   - Review against ICP (KamalaDevi)
   - Provide structured feedback
   - Suggest specific alternatives

**Option B: ChatGPT or Claude Web (When Away from Project)**

1. **Copy review context:**
   ```bash
   cat docs/content-review-context.md
   # Copy output
   ```

2. **Create prompt:**
   ```
   I need feedback on pitch deck content for a specific client.

   CONTEXT:
   [Paste entire content-review-context.md]

   CONTENT TO REVIEW:
   [Paste from Notion]

   Please review for:
   1. Alignment with ICP (KamalaDevi specifically)
   2. Tone (warm + professional, not corporate)
   3. Language (using her vocabulary)
   4. Specificity (concrete vs vague)
   5. Trust-building
   6. Overall resonance

   Provide:
   - What's working
   - What needs work
   - Specific suggestions
   - Overall impression (1-10)
   ```

3. **Paste into ChatGPT/Claude**

4. **Review feedback**

**Option C: Self-Review (No AI Available)**

1. **Open:** `docs/content-review-context.md`

2. **Use Content Review Checklist section**

3. **Go through each criterion:**
   - [ ] Alignment with ICP
   - [ ] Tone appropriateness
   - [ ] Specificity
   - [ ] Trust-building
   - [ ] Language & polish

4. **Read aloud** - does it sound authentic?

5. **Compare to examples** in context file (good vs problematic)

**Expected Result:**
- ✅ Structured feedback received
- ✅ Specific strengths identified
- ✅ Specific improvements suggested
- ✅ Overall impression clear (resonates or doesn't)

**Troubleshooting:**
- Feedback too vague? Ask for specific word/phrase suggestions
- Contradictory feedback? Request clarification with examples
- Overwhelmed by feedback? Prioritize: alignment > tone > polish

---

### Step 3: Refine Content Based on Feedback

**What:** Iterate on draft using AI suggestions and your judgment

**How:**

1. **In Notion/Coda, create refinement section:**

```markdown
## Slide 2 - Revision 2

**Feedback received:**
- ✅ "Spaciousness" language good
- ❌ Too vague in second sentence
- 💡 Suggestion: Add specific example

**Changes made:**
- Added: "...by tending the rhythms of calendar, communications, and publishing"
- Removed: Generic "better organization" phrase
- Kept: Opening value proposition

**Revised version:**
[New text incorporating feedback]
```

2. **Make changes based on feedback:**
   - **High priority:** Alignment and tone issues
   - **Medium priority:** Specificity and language
   - **Low priority:** Minor polish

3. **Don't over-edit:**
   - Keep your authentic voice
   - AI suggestions are guidance, not commands
   - Trust your instincts about KD

4. **Read aloud** after changes - does it still sound like you?

5. **If major changes, consider second review:**
   - Re-run `/content-review` on revised version
   - Or move forward if confident

**Expected Result:**
- ✅ Content refined with feedback incorporated
- ✅ Still authentic to your voice
- ✅ More aligned with KD's ICP
- ✅ Ready to implement in code

**Troubleshooting:**
- Lost your voice? Pull back, keep more original phrasing
- Still feels off? Get second opinion (trusted peer, not just AI)
- Stuck between options? A/B test - implement both, see which feels right

---

### Step 4: Document Review Results

**What:** Track what worked/didn't for future content

**How:**

1. **In Notion, add review summary:**

```markdown
## Review Summary - [Date]

**What worked well:**
- Slide 2 opening resonated strongly (9/10)
- "Tending rhythms" language felt aligned
- Specific metrics in Slide 4 built trust

**What needed work:**
- Slide 3 too generic initially
- Slide 6 pricing felt pushy
- Avoided "maximize" and corporate jargon

**Key learnings:**
- Use "tend" not "manage"
- Specificity builds trust
- Numbers + spaciousness language = sweet spot

**For next time:**
- Start with ICP checklist before drafting
- Read aloud earlier
- Less is more - cut filler
```

2. **Optional: Update content-review-context.md**
   - Add new examples (good/bad)
   - Refine voice guidelines
   - Note new insights about KD

3. **Optional: Log learning**
   ```
   /learn
   ```
   Add to learning journal: "Content writing for specific ICP"

**Expected Result:**
- ✅ Insights captured for future content
- ✅ Patterns identified
- ✅ Context file stays current

---

### Step 5: Proceed to Implementation

**What:** Move reviewed content into code following existing SOP

**How:**

**Now follow:** [Content Updates SOP](content-updates.md)

Starting at **Step 2: Set Up Development Environment**

Your content is now:
- ✅ Drafted in Notion
- ✅ Reviewed by AI
- ✅ Refined based on feedback
- ✅ Ready to implement in JSON files

**Expected Result:**
- Seamless transition to implementation workflow
- Confidence in content quality before coding

---

## Success Criteria

After completing this SOP:
- [ ] Content reviewed against ICP (KamalaDevi)
- [ ] Specific feedback received and considered
- [ ] Refinements made based on high-priority feedback
- [ ] Content still authentic to your voice
- [ ] Documented learnings for future content
- [ ] Ready to implement with confidence

---

## Review Dimensions Explained

### 1. Alignment with ICP
**What:** Does it speak to KamalaDevi specifically (not generic)?

**Good signs:**
- Uses her language (spaciousness, tending, regenerative)
- Addresses her specific pain points
- Demonstrates understanding of sacred entrepreneurship
- Values alignment clear

**Red flags:**
- Could apply to any entrepreneur
- Generic VA language
- Misses her unique context

---

### 2. Tone Appropriateness
**What:** Right emotional register for KD?

**Sweet spot:** Warm + professional + grounded

**Too corporate:** "Maximize operational efficiency to scale deliverables"
**Just right:** "Create spaciousness for your creative and teaching work"
**Too casual:** "Hey! Let me handle all that boring stuff for you!"

---

### 3. Specificity
**What:** Concrete outcomes vs vague promises?

**Vague:** "Better organization and productivity"
**Specific:** "90% of appointments confirmed ≥48h, inbox < 20 unprocessed items/day"

**When to be specific:**
- Outcomes/metrics (always)
- Pain points (relatable examples)
- Solutions (what specifically you'll do)

**When to be conceptual:**
- Values alignment
- Vision/philosophy
- Emotional benefits

---

### 4. Trust-Building
**What:** Shows you "get" her world?

**Trust signals:**
- Understanding of sacred work
- Systems thinking (not just tasks)
- Regenerative language
- Protective of creative energy
- Collaborative approach

**Trust killers:**
- Overpromising
- Hard sell tactics
- Misunderstanding her work
- Generic positioning

---

### 5. Language & Polish
**What:** Clean, clear, error-free?

**Check for:**
- Typos and grammar
- Flow when read aloud
- Consistency in terminology
- Active voice (mostly)
- Scannable formatting

---

## Common Feedback Patterns

### "This feels too corporate"
**Fix:**
- Replace: "execute," "maximize," "leverage," "scale"
- With: "tend," "create," "support," "grow"
- Add: Soul/values language
- Soften: Tone down intensity

### "Too vague - needs specificity"
**Fix:**
- Add: Numbers, examples, concrete outcomes
- Replace: "Better," "more," "improved"
- With: "90% confirmed," "<20 items," "weekly cadence"

### "Doesn't feel authentic to you"
**Fix:**
- Re-read your original
- What got lost in editing?
- Trust your voice
- Less polish, more real

### "Great! Minor tweaks only"
**Fix:**
- Make suggested tweaks
- Move to implementation
- Trust it's ready

---

## Integration with Content Updates Workflow

**Complete workflow:**

```
1. Draft (Notion) - Content Updates SOP Step 1
           ↓
2. Review (AI) - THIS SOP
           ↓
3. Refine (Notion) - THIS SOP
           ↓
4. Implement (Code) - Content Updates SOP Steps 2-8
           ↓
5. Deploy
```

**When to skip review:**
- Minor wording tweaks
- Correcting typos
- Updating dates/numbers
- You're very confident in content

**When review is essential:**
- First draft of new content
- Major messaging changes
- High-stakes pitch (like this!)
- Unsure about tone/resonance

---

## Related SOPs
- [Content Updates](content-updates.md) - Implementation after review
- Git Workflow (future) - Committing reviewed content
- Deployment (future) - Shipping reviewed content

---

## Tips & Best Practices

**Before Review:**
- ✅ Draft freely first - don't self-edit too early
- ✅ Sleep on it - review with fresh eyes
- ✅ Read aloud - catches awkward phrasing
- ✅ Check against ICP - reference context file

**During Review:**
- ✅ Be specific about concerns - better feedback
- ✅ Don't take it personally - it's your content, not you
- ✅ Ask "why" when feedback unclear
- ✅ Request alternatives, not just critique

**After Review:**
- ✅ Prioritize feedback - alignment > polish
- ✅ Keep your voice - don't over-edit
- ✅ Trust your gut - you know KD better than AI
- ✅ Iterate if needed - second review OK

**Working with AI:**
- ✅ Provide context (ICP, goals, tone)
- ✅ Ask for specific examples
- ✅ Request alternatives, not just problems
- ✅ Use AI as advisor, not decision-maker

**General:**
- ✅ Review early in process (before coding)
- ✅ Multiple short reviews > one marathon
- ✅ Document patterns for future content
- ✅ Build your own style guide over time

---

## Revision History

| Date | Version | Changes |
|------|---------|---------|
| 2025-10-12 | 1.0 | Initial SOP creation for content review workflow |
