# Polish Decisions for Launch

**Date:** 2025-10-13
**Context:** Post code-review decisions for final polish before sharing with KD
**Related:** `2025-10-13-code-review.md`

---

## Decision Summary

Following comprehensive code review, these decisions finalize the implementation plan for polish phase.

---

## 1. Remove NavBar Component ✅

**Decision:** Delete `components/NavBar.tsx` and remove from `app/page.tsx`

**Rationale:**
- Component is non-functional (maintains state but doesn't scroll)
- Current "scroll through all" approach works better for this pitch
- Shows everything upfront, no hiding content
- Broken UI undermines "calm, dependable structure" positioning
- Simpler is better

**Alternative considered:** Fix the navigation with scroll-to-section
**Why rejected:** More complexity for unclear benefit. Deck works fine without it.

---

## 2. Display All Blurbs ✅

**Decision:** Add blurb rendering to every slide component

**Components to update:**
- TitleCard.tsx
- TextSlide.tsx (add blurb prop)
- MetricsLoop.tsx
- OfferCards.tsx
- CTASection.tsx ⭐ PRIORITY (Kali Das reference)

**Styling approach:**
- Subtle visual distinction (italic or lighter weight)
- Consistent placement (contextual - above or below main content)
- Optional: light background tint (cream/lavender) or left border (gold)
- Smaller text size than body (text-sm)
- Proper spacing (mb-4 or mt-4)

**Rationale:**
Rich, trust-building content exists in JSON but is hidden. Blurbs contain:
- Tone-setting language (warm, soul-aware)
- Trust signals (Kali Das legacy, understanding sacred work)
- Narrative depth that differentiates from generic VAs

**Especially critical:** CTA blurb about honoring Kali Das's legacy.

---

## 3. Redesign Regenerative Visual ✅

**Current state:**
- Static circle with "Seed/Tend/Harvest/Compost" labels
- Too agricultural for ops context
- Visually boring (static, monochrome)

**Decision:** Redesign with infinity loop concept

**Recommended approach:**
**Infinity loop (figure-8) visual:**
- Left loop: "Creative Freedom" or "Creative Work"
- Right loop: "Operational Calm" or "Systems Support"
- Center intersection: "Sustained Flow" or "Regenerative Rhythm"
- Subtle gradient (sage → plum)
- Optional: CSS animation (gentle pulsing or flow)

**Alternative concepts considered:**
1. Flow diagram: Plan → Execute → Measure → Refine
2. Concentric circles: Creative core surrounded by protective systems
3. Yin-yang adaptation: Creative/Operational balance

**Why infinity loop:**
- Visually elegant (more sophisticated than circle)
- Represents sustainable, regenerative cycles
- Shows symbiotic relationship (creativity ↔ operations feed each other)
- Aligns with "systems that learn" concept
- Easy to implement with SVG + Tailwind

**Implementation:**
- Update `components/slides/MetricsLoop.tsx`
- Use SVG for crisp rendering
- Leverage existing sage/plum/gold colors
- Keep metrics list on right (no change to that part)
- Optional: Add subtle Framer Motion animation

---

## 4. Add Portrait to Fit Slide ✅

**Decision:** Render portrait image on "Why I'm a Fit" slide

**Schema already supports:**
```json
{
  "portrait": "/images/david-headshot.jpg",
  "portraitMode": "contain"
}
```

**Component needs update:** `components/slides/TextSlide.tsx` (Fit slide uses TextSlide)

**Visual treatment:**
- Rounded or organic shape (not harsh rectangle)
- Positioned next to bullets or as visual anchor
- Ring border (gold) for polish
- Proper sizing (not too large, mobile-responsive)

**Rationale:**
- Adds personal connection and warmth
- Humanizes the pitch
- Shows face = builds trust
- Currently wasted schema capability

---

## 5. Content Drafts Workflow ✅

**Decision:** Create `/content/drafts/` directory for staging raw content

**Structure:**
```
/content/drafts/
  blurbs.md           # Draft all blurb text before JSON editing
  profile-long.md     # Expanded profile content
  resume.md           # Traditional resume content
  README.md           # Workflow instructions
```

**Workflow:**
1. Draft content in markdown (easy to edit, version control)
2. Review/iterate with AI
3. Copy final content to JSON/MDX files
4. Delete or archive drafts

**Rationale:**
- Separates drafting from implementation
- Easier to collaborate (markdown is readable)
- Safe to experiment without breaking validated JSON
- AI can read/edit markdown more naturally
- Version control tracks content evolution

---

## 6. Appendix Enhancement Plan ✅

**Current state:**
- `/appendix/profile.mdx` (short profile)
- `/appendix/trial-sprint.mdx` (sprint details)

**Decision:** Expand appendix structure

**New structure:**
```
/appendix/profile.mdx        # Short profile (summary)
/appendix/profile-long.mdx   # Expanded background/story
/appendix/resume.mdx         # Traditional credentials
```

**External profile option:**
- Host full PDF on Google Drive
- Link from Fit slide: "View Full Profile" (opens new tab)
- Link from CTA slide: "Download Resume" option
- Proper link attributes: `target="_blank" rel="noopener noreferrer"`

**Navigation strategy:**
- Fit slide: "Read more about my background" → `/appendix/profile-long`
- Fit slide: "View full profile (PDF)" → Google Drive link
- CTA slide: Mention full materials available
- Keep low-pressure (optional depth, not required)

**Rationale:**
- Provides depth for interested prospects
- Maintains clean main deck (not overwhelming)
- Shows thoroughness and preparation
- Traditional resume format for familiarity
- External link option for easy sharing

---

## 7. Style & Layout Refinement Principles

**Typography:**
- Consistent heading hierarchy (h1: 4xl, h2: 3xl, h3: xl)
- Body text line-height: 1.6-1.8 for readability
- Mobile-first responsive sizing

**Spacing:**
- "Spaciousness" should feel consistent across slides
- Padding: p-6 (mobile) → p-10 (desktop)
- Vertical spacing: space-y-8 (mobile) → space-y-10 (desktop)
- Never cramped, never excessive

**Color usage:**
- Plum for primary emphasis (headings, CTAs)
- Gold for accents and borders
- Cream for backgrounds and subtle highlights
- Sage for regenerative/natural concepts
- Ensure WCAG AA contrast minimums

---

## Implementation Phases

### Phase 1: Critical Fixes (30 min)
1. Remove NavBar
2. Display all blurbs
3. TypeScript fixes ✅ DONE

### Phase 2: Content System (15 min)
4. Create `/content/drafts/` with templates

### Phase 3: Appendix (45 min)
5. Expand appendix structure
6. Add smart navigation

### Phase 4: Visual Enhancement (1.5-2 hrs)
7. Add portrait to Fit slide
8. Redesign regenerative visual
9. Polish blurb styling
10. Emphasize CTA blurb

### Phase 5: Polish (1 hr)
11. Typography audit
12. Spacing consistency check
13. Color contrast verification

**Total time:** 4-5 hours over 2-3 sessions

---

## Success Criteria

**Ready to merge PR when:**
- ✅ TypeScript builds without errors
- ✅ All blurbs display correctly
- ✅ NavBar removed
- ✅ No broken UI elements
- ✅ Mobile layout clean and spacious

**Ready to share with KD when:**
- ✅ Portrait on Fit slide
- ✅ Regenerative visual redesigned (ops-relevant)
- ✅ Appendix expanded with navigation
- ✅ Content drafts system in place
- ✅ Fonts optimized (next/font)
- ✅ Preview deployment tested on mobile

---

## Open Questions

**Visual decisions to finalize:**
- [ ] Infinity loop color gradient: sage → plum or gold → plum?
- [ ] Portrait shape: perfect circle, rounded square, or organic blob?
- [ ] Blurb background: subtle tint or left border accent?
- [ ] Add animation to regenerative visual? (subtle vs none)

**Content decisions:**
- [ ] Where to host external profile PDF? (Google Drive vs GitHub)
- [ ] How much detail in profile-long.mdx? (2 pages? 3 pages?)
- [ ] Resume format: traditional chronological or skills-based?

---

## Next Actions

1. Execute Phase 1 (Critical Fixes)
2. Test build and preview
3. Create content drafts templates
4. Begin visual enhancements
5. Iterate based on preview testing

**Reference:** `docs/agents/tasks/2025-10-13_polish-for-launch.yml` for detailed task breakdown.
