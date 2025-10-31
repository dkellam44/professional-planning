# Content Plan v4 — KD Collaboration Pitch Deck

**Date:** 2025-10-14
**Status:** Draft for review
**Previous version:** See [`../content-worksheet.md`](../content-worksheet.md) (v3)

**Key Changes from v3:**
- Stronger title positioning: "Grounded Structure Serving Expansive Vision"
- Alignment slide: removed redundant blurb, added KD quote, strengthened partnership language
- Help slide: updated tool names (n8n, Asana), refined category language
- Regenerative: reduced to 4 metrics, improved clarity
- Fit slide: expanded with two-column credibility structure from resume
- Engagement: sharpened outcome-focused descriptions, tightened price ranges
- CTA: moved "not to impose" language to Alignment, expanded body with specific next steps

---

## Slide 1: Title (TitleCard)

**Property mapping:**
```json
{
  "deckTitle": "...",
  "subtitle": "...",
  "quote": "...",
  "image": "...",
  "blurb": "...",
  "footer": "..."
}
```

### deckTitle
> Grounded Structure Serving Expansive Vision

### subtitle
> Operations support for KamalaDevi McClure

### quote
> Talking about your love life can actually lead to a social revolution.

### image
> /images/kd_hero_4x5.jpg

### blurb
*(Consider removing or repurposing this space for visual impact)*

### footer
> David Kellam • Berkeley, CA • dkellam44@gmail.com

### Design notes
- Make this slide more bold, impactful, styled introduction
- Consider full-size or larger image with text overlays
- Experiment with type options and layout for stronger visual presence
- Current design feels too bland for opening statement

---

## Slide 2: Alignment & Intention (TextSlide)

**Property mapping:**
```json
{
  "h1": "...",
  "bodyMdx": "...",
  "quote": "...",
  "quoteAttribution": "..."
}
```

### h1
> Alignment & Intention

### bodyMdx
> **Devotion Meets Discipline** — I greatly admire those like you who offer themselves to the world and provide the desperately needed guidance back toward love and the soul. My mission is to serve that gift by standing as a calm, dependable presence that expands your creative freedom and protects your temple of work — so your offerings can reach the world with clarity and grace. My intention is not to impose, but to gently uphold — maintaining the steadiness that allows your next evolution to blossom. Together, we'll cultivate a rhythm that supports your energy and amplifies your reach.

### quote
> I'm gonna be as bold as to say that transparent communities are essential to the evolution of humanity as a new nonviolent social structure.

### quoteAttribution
> KamalaDevi McClure

### Design notes
- Blurb removed (redundant with body text)
- KD quote adds powerful contextual anchor
- Moved "not to impose" language here from CTA (better positioning as values statement)

---

## Slide 3: How I Might Help (Grid/Table)

**Property mapping:**
```json
{
  "h1": "...",
  "blurb": "...",
  "rows": [
    { "job": "...", "solution": "...", "tools": "..." }
  ]
}
```

### h1
> How I Might Help

### blurb
> I treat systems like ecosystems — designed to learn, evolve, and nourish the people who live within them. Each activity is a practice, not just a task — a steady cadence that sustains clarity, connection, and flow.

### rows

**1. Calendar & inbox calm**
- **Solution:** Scheduling rules, triage lanes, templates
- **Tools:** Google Calendar, Gmail, SOPs

**2. Publishing rhythm**
- **Solution:** Weekly cadence with asset prep & approvals
- **Tools:** Asana/Notion, Mailchimp, n8n

**3. Systems memory**
- **Solution:** Single source of truth for agendas & decisions
- **Tools:** Drive, Asana/Notion

**4. Community engagement**
- **Solution:** Reply templates & gentle automations
- **Tools:** CRM basics, SOPs, n8n

**5. Author support**
- **Solution:** Manuscript/publishing workflow scaffolding
- **Tools:** KDP/Amazon, Docs, lightweight checklists

### Design notes
- Column header "Job" should be renamed to something more context-appropriate (Domain/Area/Focus)
- Consider if "Author support" is priority for KD — if not, consider replacing or removing

---

## Slide 4: Measurements of Flow (MetricsLoop)

**Property mapping:**
```json
{
  "h1": "...",
  "blurb": "...",
  "metrics": ["...", "...", "..."]
}
```

### h1
> Measurements of Flow

### blurb
> Measurements like these act as signposts that signal our current is strong. I can keep the details quiet in the background so the creative work can breathe. We'll tune thresholds to your comfort and cadence.

### metrics
1. ≥90% of appointments confirmed at least 48 hours in advance
2. One weekly post/newsletter pre-scheduled and published
3. Single Source of Truth (Asana) updated for bi-weekly check-ins
4. Inbox processed to inbox-zero (or near-zero) daily

### Design notes
- Reduced from 5 to 4 metrics (more memorable, less overwhelming)
- Removed vague "routine responses" metric
- Clarified "Single Source of Truth" as Asana
- Revised metric #2 for clarity (previously "inbox stays under 20" — now inbox-zero focused)
- Profile link should be enhanced with more visibility and context

---

## Slide 5: Why I'm a Fit (TextSlide with Portrait)

**Property mapping:**
```json
{
  "h1": "...",
  "blurb": "...",
  "leftColumn": { "heading": "...", "bullets": ["..."] },
  "rightColumn": { "heading": "...", "bullets": ["..."] },
  "portrait": "...",
  "portraitMode": "...",
  "profileLinkText": "...",
  "profileLinkHref": "..."
}
```

### h1
> Why I'm a Fit

### blurb
> This work feels like the natural evolution of my path — blending creativity, intelligence, spirit, technology, and structure. I bring operational skill and care to help your next evolution unfold with ease.

### Layout: Two-column structure

**Left Column: Domain Expertise**
- **Spirit-literate operations partner** — grounded in ISTA, Sacred Pleasure Consciousness, Sexological Bodywork lineages
- **Creative & nonprofit fluency** — performing arts degree, 7+ years in arts/nonprofit marketing & ops
- **Community-aware practice** — consent-based collaboration, trauma-informed communication, confidentiality as sacred

**Right Column: Operations Excellence**
- **Systems that breathe** — designed for learning & evolution, not rigidity (ecosystems not checklists)
- **Marketing & automation fluency** — Google Analytics, Looker Studio dashboards, n8n/Zapier workflows
- **Proven impact** — 25% engagement lift (Freight & Salvage), 50% membership increase (SVDP), $60K fundraising support

### portrait
> /images/david_headshot.jpg

### portraitMode
> cover

### profileLinkText
> Learn more about the experiences that led me to you

### profileLinkHref
> /appendix/profile

### Design notes
- **Potential alternative layout:**
  - Full-width blurb at top
  - Three-column structure beneath:
    1. Domain Expertise bullets
    2. Operations Excellence bullets
    3. Headshot image
  - Centered below: Profile button with intro text
- Note: Case studies in progress (can offer SVDP/Freight/Best Viable assets as follow-ups)

---

## Slide 6: Engagement Path (OfferCards)

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

### h1
> Engagement Path

### blurb
> Every collaboration finds its own rhythm. These options reflect shapes that tend to work beautifully — from short sprints to sustained partnerships. Choose what feels right for your pace, or we can co-design a form that evolves with your needs.

### cards

**Card 1: ⚡ Starter Sprint**
- **Description:** 2 weeks to establish foundational systems — calendar clarity, publishing templates, single source of truth setup
- **Price:** $1,200–$1,500

**Card 2: 🌿 Ongoing Partnership**
- **Description:** 10–15 hrs/week of steady operational support — maintaining rhythm, iterating systems, freeing your creative energy
- **Price:** $2,250–$2,800/mo

**Card 3: 🌈 Fractional COO**
- **Description:** Strategic leadership for growth phases — full operational oversight, team coordination, systems architecture, and long-term planning
- **Price:** Custom

### note
> All engagements begin with a short discovery call.

### Design notes
- **Starter Sprint:** Reframed from "quick relief" (pain-focused) to "foundational systems" (outcome-focused)
- **Ongoing Partnership:** Changed from vague "steady rhythm" to specific value outcomes
- **Fractional COO:** Added explainer (was previously too vague)
- Price range tightened on Ongoing Partnership (from $1,800–$2,800 to $2,250–$2,800)

---

## Slide 7: Gratitude & Next Steps (CTASection)

**Property mapping:**
```json
{
  "h1": "...",
  "blurb": "...",
  "body": "...",
  "email": "...",
  "calendarUrl": "...",
  "ctaText": "..."
}
```

### h1
> Gratitude & Going Forward

### blurb
> I hold deep respect for the foundation Kali Das has helped build and would be honored to continue supporting that legacy.

### body
> I'd love to explore your current priorities and co-design what would serve you best. Whether it's calendar calm, publishing rhythm, or strategic systems thinking — let's find the right starting point together.

### email
> dkellam44@gmail.com

### calendarUrl
> https://supercal.com/davidkellam/60

### ctaText
> To get started, please contact me anytime by email or calendar.

### Design notes
- Removed "My intention is not to impose..." sentence (moved to Alignment slide)
- Expanded body text to reference 2–3 specific starting points (addresses feedback about being too generic)
- Alternative heading considered: "Gratitude & Going Forward" (warmer than "Next Steps")
- CTA text added for button clarity

---

## Visual & Design Enhancement Notes (For Discussion)

### Priority improvements for "80% visual upgrade":

**1. Typography hierarchy**
- Experiment with bolder heading fonts
- Consider contrast typeface pairing (e.g., serif headings + sans body)
- Increase heading sizes for impact

**2. Color contrast & accents**
- Current palette feels safe — consider richer accent colors
- Gold border treatment works well, could be applied more strategically
- Lavender/plum treatment on CTA is effective — replicate pattern elsewhere

**3. Title slide impact**
- Currently too understated for opening
- Consider: full-bleed image, overlaid text with contrast treatment
- Larger, bolder type for deck title
- Footer contact info should be subtle but present

**4. Slide-specific enhancements**
- **Alignment:** Pull quote styling for KD quote (visual anchor)
- **Help:** Grid/table could use more visual separation (cards? borders? icons?)
- **Regenerative:** Visual/rings are good, metrics list could be styled as badges/pills
- **Fit:** Two/three-column layout needs strong visual structure
- **Engagement:** Cards work but could be more distinct (depth, shadows, hover states?)

**5. Overall spaciousness**
- Current design already feels spacious (on-brand)
- Challenge: add visual impact without sacrificing breathing room
- Consider: strategic use of bold elements within spacious layouts

---

## Appendix Structure (For Later)

**To be developed:**
- `/appendix/profile` — Full background profile (expand from resume)
- `/appendix/resume` — Formatted resume or link to PDF
- `/appendix/sprint-breakdown` — Optional 2-week sprint detailed breakdown
- Consider: Single bonus slide with links to PDF docs vs. hosting each as web slide

---

## Next Steps

1. **Review v4 content** — Check for voice consistency, accuracy, alignment with KD research
2. **Get feedback on v4** — Use content-feedback-v4.md as discussion document
3. **Make notes in content-worksheet-v4.md** — Track questions, revisions, and ideas
4. **Discuss design improvements** — Visual upgrade plan (typography, color, layout)
5. **Prototype design changes** — Once content is stable
6. **Build new version** — Update JSON files with approved v4 content

---

*This document serves as the source of truth for v4 content revisions. All content is organized by JSON property names for easy implementation.*
