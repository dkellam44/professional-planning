# Content Plan v4.2 — FINAL (Ready for Build)

**Date:** 2025-10-14
**Status:** Final content — ready for JSON implementation
**Previous version:** content-plan-v4.1.md + content-worksheet-v4.1.md (completed)

**CRITICAL:** KamalaDevi uses **they/them pronouns** throughout all content ✅

---

## Overview

This is the **final content document** incorporating all selections from worksheet v4.1. This content is ready to be implemented in JSON files and built.

**Next steps after this document:**
1. Quick sanity check review
2. Update JSON files in `/content/slides/`
3. Build and preview on localhost
4. Content review in rendered form
5. Design prototypes
6. Ship to KD

---

## Assets Ready for Implementation

### Hero Images

**File paths specified (to be added to `/public/images/`):**
- **4:5 portrait:** `/images/KD_hero_1200x1500.jpeg` (replaces `/images/kd_hero_4x5.jpg`)
- **16:9 landscape:** `/images/KD_hero_1920x1080.jpeg` (new, for full-bleed option)
- **1:1 square:** `/images/KD_hero_1500x1500.jpeg` (new, for alternative layout)

**Implementation note:** Start with 4:5 portrait in JSON, test other aspects in design phase

### Testimonial

**Source:** Clayton Shelvin, Executive Director, The Freight

**Quote:**
> "David always sees a few steps ahead. I can't wait to see what he comes up with next so he can catch the rest of us up. He's going to thrive!"

**Placement:** Fit slide (inline credibility, after bullets or in new property)

### KD Quotes

**Alignment slide (new):**
> "But, when the default is privacy and we don't have the choice to actually share ourselves, then we shut down in shame."
>
> — KamalaDevi McClure

**CTA slide closing (new):**
> "And I'm going to be as bold as to say that transparent communities are essential to the evolution of humanity as a new non-violent social structure."
>
> — KamalaDevi McClure

**Title slide (current):**
> "Talking about your love life can actually lead to a social revolution."
>
> — KamalaDevi McClure

---

## Slide-by-Slide Final Content

### Slide 1: Title (TitleCard)

**JSON file:** `content/slides/title.json`

**Property mapping:**
```json
{
  "deckTitle": "...",
  "subtitle": "...",
  "quote": "...",
  "quoteAttribution": "...",
  "image": "...",
  "blurb": "...",
  "footer": "..."
}
```

#### Final Content

**deckTitle:**
```
Grounded Structure Serving Expansive Vision
```

**subtitle:**
```
Operations support for KamalaDevi McClure
```

**quote:**
```
Talking about your love life can actually lead to a social revolution.
```

**quoteAttribution:**
```
KamalaDevi McClure
```

**image:**
```
/images/KD_hero_1200x1500.jpeg
```
*(or keep current `/images/kd_hero_4x5.jpg` if new file not yet added)*

**blurb (NEW - variation of Option 3):**
```
An invitation to explore partnership — where intention meets practice, where your creative work meets calm operational support.
```
*Note: Avoids repeating "grounded," "structure," "expansive," "vision" from deck title*

**footer:**
```
David Kellam • Berkeley, CA • dkellam44@gmail.com
```

**Footer placement:** Bottom-right

---

### Slide 2: Alignment & Intention (TextSlide)

**JSON file:** `content/slides/alignment.json`

**Property mapping:**
```json
{
  "h1": "...",
  "bodyMdx": "...",
  "quote": "...",
  "quoteAttribution": "..."
}
```

#### Final Content

**h1:**
```
Alignment & Intention
```

**bodyMdx (Version 3 - Role-Definition Focused):**
```
**Devotion Meets Discipline** — Those like you who offer essential guidance back toward love and the soul deserve to be resourced with care. My role is to provide calm, dependable structure that expands your creative freedom and protects your temple of work — so your offerings reach the world with clarity and grace. My intention is to gently uphold, not to impose — maintaining the steadiness that allows your vision to blossom. Together, we'll cultivate a rhythm that supports your energy and amplifies your impact.
```

**quote (NEW):**
```
But, when the default is privacy and we don't have the choice to actually share ourselves, then we shut down in shame.
```

**quoteAttribution:**
```
KamalaDevi McClure
```

---

### Slide 3: How I Might Help (TableSlide / Grid)

**JSON file:** `content/slides/help.json`

**Property mapping:**
```json
{
  "h1": "...",
  "blurb": "...",
  "rows": [
    { "area": "...", "solution": "...", "tools": "..." }
  ]
}
```

**Note:** Column header changed from "job" to "area"

#### Final Content

**h1:**
```
How I Might Help
```

**blurb:**
```
I treat systems like ecosystems — designed to learn, evolve, and nourish the people who live within them. Each activity is a practice, not just a task — a steady cadence that sustains clarity, connection, and flow. Here are some examples:
```

**rows:**

```json
[
  {
    "area": "Calendar & inbox calm",
    "solution": "Scheduling rules, triage lanes, templates",
    "tools": "Google Calendar, Gmail, SOPs"
  },
  {
    "area": "Publishing rhythm",
    "solution": "Regular cadence with asset prep & approvals",
    "tools": "Asana/Notion, Mailchimp, n8n"
  },
  {
    "area": "Systems memory",
    "solution": "Single source of truth for agendas & decisions",
    "tools": "Drive, Asana/Notion"
  },
  {
    "area": "Community engagement",
    "solution": "Reply templates & gentle automations",
    "tools": "CRM basics, SOPs, n8n"
  },
  {
    "area": "Revision/publishing support",
    "solution": "Revision/publishing workflow scaffolding",
    "tools": "KDP/Amazon, Docs, lightweight checklists"
  }
]
```

---

### Slide 4: Measurements of Flow (MetricsLoop)

**JSON file:** `content/slides/regenerative.json`

**Property mapping:**
```json
{
  "h1": "...",
  "blurb": "...",
  "metrics": ["...", "...", "...", "..."]
}
```

#### Final Content

**h1:**
```
Measurements of Flow
```

**blurb:**
```
Measurements like these act as signposts that signal our current is strong. I can keep the details quiet in the background so the creative work can breathe. We'll tune thresholds to your comfort and cadence.
```

**metrics (Set B - 4 outcome-focused):**

```json
[
  "Bi-weekly meetings occur on rhythm with decisions logged in Asana",
  "Weekly newsletter pre-scheduled; social posts queued 1 week ahead",
  "Calendar confirmations sent 48+ hours in advance; no-show rate <5%",
  "Publishing/KDP workflows tracked with clear next-action visibility"
]
```

**Styling note:** Design as pills/badges (clean, modern, easy to implement)

---

### Slide 5: Why I'm a Fit (TextSlide with Portrait)

**JSON file:** `content/slides/fit.json`

**Property mapping (needs schema update for 3-column layout):**
```json
{
  "h1": "...",
  "blurb": "...",
  "leftColumn": {
    "heading": "...",
    "bullets": ["...", "...", "..."]
  },
  "rightColumn": {
    "heading": "...",
    "bullets": ["...", "...", "..."]
  },
  "portrait": "...",
  "portraitMode": "...",
  "testimonial": {
    "quote": "...",
    "attribution": "...",
    "title": "..."
  },
  "profileIntroText": "...",
  "profileLinkText": "...",
  "profileLinkHref": "...",
  "caseStudiesNote": "..."
}
```

#### Final Content

**h1:**
```
Why I'm a Fit
```

**blurb:**
```
This work feels like the natural evolution of my path — blending creativity, intelligence, spirit, technology, and structure. I bring operational skill and care to help your next evolution unfold with ease.
```

**leftColumn:**

**heading:**
```
Domain Knowledge
```

**bullets:**
```json
[
  "Spirit-literate operations partner — grounded in ISTA, Sacred Pleasure Consciousness, Sexological Bodywork lineages",
  "Creative & nonprofit fluency — performing arts degree, 7+ years in arts/nonprofit marketing & ops",
  "Community-aware practice — consent-based collaboration, trauma-informed communication, confidentiality as sacred"
]
```

**rightColumn:**

**heading:**
```
Operations Excellence
```

**bullets:**
```json
[
  "Systems that breathe — designed for learning & evolution, not rigidity (ecosystems not checklists)",
  "Marketing & automation fluency — Google Analytics, Looker Studio dashboards, n8n/Zapier workflows",
  "Proven impact — 25% engagement lift (Freight & Salvage), 50% membership increase (SVDP), $60K fundraising support"
]
```

**portrait:**
```
/images/david_headshot.jpg
```

**portraitMode:**
```
cover
```
*Note: Portrait symmetrical with columns (not larger/smaller)*

**testimonial (NEW):**

```json
{
  "quote": "David always sees a few steps ahead. I can't wait to see what he comes up with next so he can catch the rest of us up. He's going to thrive!",
  "attribution": "Clayton Shelvin",
  "title": "Executive Director, The Freight"
}
```

**profileIntroText:**
```
More detail in my personal profile — see full background, experience, and approach.
```

**profileLinkText:**
```
View Full Profile
```

**profileLinkHref:**
```
/appendix/profile
```

**caseStudiesNote:**
```
Case studies in progress and available upon request
```

**Design note:** Profile link as card/callout treatment (visually distinct)

---

### Slide 6: Engagement Path (OfferCards)

**JSON file:** `content/slides/engagement.json`

**Property mapping:**
```json
{
  "h1": "...",
  "blurb": "...",
  "cards": [
    { "icon": "...", "title": "...", "desc": "...", "price": "..." }
  ],
  "note": "..."
}
```

#### Final Content

**h1:**
```
Engagement Path
```

**blurb:**
```
Every collaboration finds its own rhythm. These options reflect shapes that tend to work beautifully — from short sprints to sustained partnerships. Choose what feels right for your pace, or we can co-design a form that evolves with your needs.
```

**cards:**

```json
[
  {
    "icon": "⚡",
    "title": "Starter Sprint",
    "desc": "2-week sprint to create immediate calm — inbox/calendar systems, publishing rhythm, and a single source of truth for priorities.",
    "price": "$1,200–$1,500"
  },
  {
    "icon": "🌿",
    "title": "Ongoing Partnership",
    "desc": "Steady rhythm at 10–15 hrs/week — keep systems humming, handle weekly publishing, reclaim 4–6 hours of your creative time monthly.",
    "price": "$2,250–$2,800/mo"
  },
  {
    "icon": "🌈",
    "title": "Fractional COO",
    "desc": "Strategic operational leadership — launch choreography, team coordination, dashboard design, and quarterly roadmap planning for expansion seasons.",
    "price": "Custom"
  }
]
```

**note (UPDATED with risk reversal):**
```
All engagements begin with a short discovery call. Ongoing partnerships renew monthly with flexible opt-out — your investment is protected by clear deliverables and make-good provisions.
```

**Design note:** Add depth to cards (shadows, borders, subtle gradients)

---

### Slide 7: Gratitude & Invitation (CTASection)

**JSON file:** `content/slides/cta.json`

**Property mapping:**
```json
{
  "h1": "...",
  "blurb": "...",
  "body": "...",
  "email": "...",
  "calendarUrl": "...",
  "ctaIntroText": "...",
  "emailButtonText": "...",
  "calendarButtonText": "...",
  "quote": "...",
  "quoteAttribution": "..."
}
```

#### Final Content

**h1 (UPDATED):**
```
Gratitude & Invitation
```

**blurb:**
```
I hold deep respect for the foundation Kali Das has helped build and would be honored to continue supporting that legacy.
```

**body (Version 3 - Energy-Focused ROE framing + "why now" addition):**
```
I'd love to explore how we might reclaim 4–6 hours of your creative time each week. Whether that starts with calendar/inbox protocols, publishing rhythm, or bi-weekly strategy meetings with clear follow-through — we'll find the approach that serves your energy and vision. This transition moment — honoring what Kali Das built while stepping into your next evolution — is an ideal time to establish rhythms that reflect your unique vision.
```

**email:**
```
dkellam44@gmail.com
```

**calendarUrl:**
```
https://supercal.com/davidkellam/60
```

**ctaIntroText:**
```
To get started, reach out by email or book a discovery call — whichever feels right for you.
```

**emailButtonText:**
```
Email Me
```

**calendarButtonText:**
```
Book a Call
```

**quote (NEW - closing quote):**
```
And I'm going to be as bold as to say that transparent communities are essential to the evolution of humanity as a new non-violent social structure.
```

**quoteAttribution:**
```
KamalaDevi McClure
```

---

## Schema Updates Needed

### Fit Slide (fit.json)

**Current schema supports:**
- `h1`, `bullets`, `profileLinkText`, `profileLinkHref`, `portrait`, `portraitMode`, `blurb`

**Need to add:**
```typescript
leftColumn?: {
  heading: string;
  bullets: string[];
};
rightColumn?: {
  heading: string;
  bullets: string[];
};
testimonial?: {
  quote: string;
  attribution: string;
  title: string;
};
profileIntroText?: string;
caseStudiesNote?: string;
```

**Backward compatibility:** Keep `bullets` as fallback for simpler layout

---

### Help Slide (help.json)

**Current schema:**
```typescript
rows: Array<{
  job: string;
  solution: string;
  tools: string;
}>;
```

**Update to:**
```typescript
rows: Array<{
  area: string;  // renamed from "job"
  solution: string;
  tools: string;
}>;
```

**Note:** This is a breaking change; update component to use `area` instead of `job`

---

### CTA Slide (cta.json)

**Need to add:**
```typescript
ctaIntroText?: string;
emailButtonText?: string;
calendarButtonText?: string;
quote?: string;
quoteAttribution?: string;
```

---

### Alignment Slide (alignment.json)

**Need to add:**
```typescript
quote?: string;
quoteAttribution?: string;
```

**Note:** TextSlide component may need update to render quote if present

---

## Design Specifications

### Typography (to prototype)
- **Test serif headings:** Playfair Display, Crimson Text, Lora
- **Test sans headings:** Inter, Epilogue, Satoshi
- **Current:** Playfair (display), Inter (body), Crimson (quote)

### Color Palette
- **Base (keep):** cream (#FAF8F3), charcoal (#2B2B2B), gold (#D4B483), lavender (#D8A7C4)
- **Expand with:** More contrast/drama throughout
- **Optional jewel tones:** deep plum, forest green, burnt amber (test in prototypes)

### Title Slide Prototypes
1. **Prototype A:** Full-bleed dramatic (16:9 landscape, large overlay, bold type)
2. **Prototype B:** Portrait split-screen (image left 40%, text right 60%)
3. *(Prototype C skipped per worksheet)*

### Metrics Styling
- Pills/badges (inline, clean, modern)
- Start simple, enhance in design phase if needed

### Engagement Cards
- Add depth: shadows, borders, subtle gradients
- Make visually distinct from current flat design

### Overall Design Philosophy
- **60% impact** (bold but not overwhelming)
- Clean, uncluttered
- Amplify message, don't distract
- Spaciousness with strategic bold moments

---

## Implementation Checklist

### Before Building

- [ ] Verify all hero images added to `/public/images/`
  - [ ] KD_hero_1200x1500.jpeg
  - [ ] KD_hero_1920x1080.jpeg
  - [ ] KD_hero_1500x1500.jpeg

- [ ] Update Zod schemas in `lib/schemas.ts`:
  - [ ] FitSlide: add leftColumn, rightColumn, testimonial, profileIntroText, caseStudiesNote
  - [ ] TableSlide: rename "job" → "area"
  - [ ] CTASection: add ctaIntroText, emailButtonText, calendarButtonText, quote, quoteAttribution
  - [ ] TextSlide: add quote, quoteAttribution (optional)

- [ ] Update TypeScript types in `types/slides.ts`:
  - [ ] Match all schema updates

- [ ] Update components:
  - [ ] `components/slides/TableSlide.tsx`: use `row.area` instead of `row.job`
  - [ ] `components/slides/TextSlide.tsx`: render quote if present
  - [ ] `components/slides/CTASection.tsx`: add quote, button text, intro text
  - [ ] `components/slides/TitleCard.tsx` or create new `FitSlide.tsx`: 3-column layout + testimonial

---

### JSON File Updates

Update each file in `/content/slides/` with final content from this document:

1. **title.json** ✅
   - Update blurb (new variation)
   - Update quoteAttribution (add "KamalaDevi McClure")
   - Update image path (if new file added)

2. **alignment.json** ✅
   - Update bodyMdx (Version 3)
   - Add quote (new)
   - Add quoteAttribution

3. **help.json** ✅
   - Update blurb (add "Here are some examples:")
   - Rename "job" → "area" in all rows
   - Update tools (n8n, Asana)
   - Update "Author support" → "Revision/publishing support"

4. **regenerative.json** ✅
   - Update metrics (Set B - 4 metrics)
   - Keep blurb as-is

5. **fit.json** ✅
   - Add leftColumn, rightColumn (3-column layout)
   - Add testimonial (Clayton Shelvin)
   - Add profileIntroText, caseStudiesNote
   - Update portrait (already exists)

6. **engagement.json** ✅
   - Update all 3 card descriptions (Alt 2, Alt 1, Alt 1)
   - Update note (add risk reversal language)
   - Keep pricing as-is

7. **cta.json** ✅
   - Update h1 ("Gratitude & Invitation")
   - Update body (Version 3 + "why now" paragraph)
   - Add ctaIntroText, emailButtonText, calendarButtonText
   - Add closing quote + attribution

---

### After JSON Updates

- [ ] Run `npm run dev` and check terminal for Zod validation errors
- [ ] Fix any schema mismatches
- [ ] Preview all 7 slides in browser
- [ ] Check responsive layout (mobile + desktop)
- [ ] Read all content aloud for flow
- [ ] Verify all links work (/appendix/profile, calendar, email)

---

## Quick Sanity Check Questions

Before implementing, confirm:

1. **Pronouns:** All content uses they/them for KamalaDevi? ✅
2. **Quotes:** All 3 KD quotes have attribution? ✅
3. **Blurb:** Title blurb avoids repeating deck title words? ✅
4. **Testimonial:** Clayton quote formatted correctly? ✅
5. **Metrics:** Set B (4 metrics) matches job description? ✅
6. **Engagement:** All 3 descriptions outcome-focused? ✅
7. **CTA:** "Why now" language added subtly? ✅
8. **Images:** Hero image paths specified? ✅

---

## Next Steps (Immediate)

1. **Quick review** of this document (5 min)
2. **Update schemas** in `lib/schemas.ts` (15 min)
3. **Update types** in `types/slides.ts` (5 min)
4. **Update JSON files** (30 min)
5. **Update components** as needed (30 min)
6. **Build and preview** (`npm run dev`) (5 min)
7. **Content review** in browser (15 min)
8. **Fix any issues** (varies)
9. **Design prototypes** (Title slide first) (1-2 hours)
10. **Final polish** → commit → ship (1-2 hours)

**Total estimated time:** 4–6 hours to ship-ready

---

## Notes for Design Phase

**From worksheet:**
- Prototype together first
- Generate prompts/specs for design-specific AI tools
- Want inspiration options (not necessarily full build from AI)

**Delivery method:**
- Email + link (web version)
- PDF export capability desired

---

**End of v4.2 Final Content Plan**

*This document is ready for implementation. All content decisions finalized. Proceed to build phase.*
