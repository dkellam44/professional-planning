# Content Plan v4.1 — KD Collaboration Pitch Deck

**Date:** 2025-10-14
**Status:** Draft for review (pre-build)
**Previous version:** See [`content-plan-v4.md`](content-plan-v4.md)

**CRITICAL:** KamalaDevi uses **they/them pronouns** throughout all content.

---

## Key Changes from v4.0 → v4.1

### Content Updates
- **Pronouns corrected:** All references to KD now use they/them
- **Title slide:** Quote now attributed to KamalaDevi McClure; blurb replaced with CTA-style intro
- **Alignment:** Fixed run-on sentences, reordered to positive framing ("to gently uphold, not to impose"), changed "desperately needed" → "essential"
- **Help:** Column renamed "Support Area"; "Author support" → "Revision/publishing"; "Weekly cadence" → "Regular cadence"
- **Regenerative:** Metrics informed by job description (bi-weekly meetings, newsletter, KDP, social scheduling)
- **Fit:** "Domain Expertise" → "Domain Knowledge"; profile link simplified; case studies note added
- **Engagement:** Descriptions refined; pricing strategy analyzed
- **CTA:** Button text updated ("Email me" / "Book a call"); KD quote added

### Next Phase (v4.2)
- New hero image aspects (ratios TBD)
- Testimonial quotes (Clayton Shelvin, Freight; internship reference)
- Additional KD quotes for slides
- Final content polish before build

---

## Slide 1: Title (TitleCard)

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

### deckTitle
> Grounded Structure Serving Expansive Vision

**Alternatives for consideration:**
1. Structure That Serves Vision
2. Grounded Support for Visionary Work
3. Steady Operations for Expansive Mission
4. Foundations for Creative Evolution
5. Structure as Sacred Support

### subtitle
> Operations support for KamalaDevi McClure

### quote
> Talking about your love life can actually lead to a social revolution.

### quoteAttribution
> KamalaDevi McClure

### image
> /images/kd_hero_4x5.jpg

**Note for v4.2:** Provide new hero images in multiple aspect ratios:
- **4:5 (portrait)** — current format (800×1000px or larger)
- **16:9 (landscape)** — for full-bleed option (1920×1080px or larger)
- **1:1 (square)** — alternative layout option (1080×1080px or larger)

### blurb (replaces removed blurb with CTA-style intro)

**Option 1:**
> Let's explore how we might fit — how our directions may align and how structure could serve your vision. Take a look.

**Option 2:**
> This deck explores alignment, fit, and rhythm. See how grounded operations could support your expansive work.

**Option 3:**
> An invitation to explore partnership — where your vision meets steady structure, where intention meets practice.

**Option 4:**
> Let's see how we might collaborate. This deck maps alignment, capability, and potential rhythm together.

**Option 5:**
> Explore how calm, competent operations support could expand your creative freedom and amplify your reach.

### footer
> David Kellam • Berkeley, CA • dkellam44@gmail.com

**Placement:** Bottom-right (subject to design refinement)

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

### bodyMdx (3 paraphrased versions)

**Version 1: Partnership-Focused**
> **Devotion Meets Discipline** — This partnership honors the sacred meeting of purpose and practice. I greatly admire visionaries like you who offer essential guidance back toward love and the soul. My mission is to serve that gift — to stand as a calm, dependable presence that expands your creative freedom and protects your temple of work. My intention is to gently uphold, not to impose — maintaining the steadiness that allows your next evolution to blossom. Together, we'll cultivate a rhythm that supports your energy and amplifies your reach.

**Version 2: Mission-Clarity Focused**
> **Devotion Meets Discipline** — I deeply respect those like you who offer themselves to the world, providing essential guidance back toward love and the soul. My mission is to serve that work by creating calm, dependable structure that expands your creative freedom and protects your temple of work. My intention is to gently uphold, not to impose — standing steady so your next evolution can unfold with grace. Together, we'll build a rhythm that honors your energy and amplifies your offerings to the world.

**Version 3: Role-Definition Focused**
> **Devotion Meets Discipline** — Those like you who offer essential guidance back toward love and the soul deserve to be resourced with care. My role is to provide calm, dependable structure that expands your creative freedom and protects your temple of work — so your offerings reach the world with clarity and grace. My intention is to gently uphold, not to impose — maintaining the steadiness that allows your vision to blossom. Together, we'll cultivate a rhythm that supports your energy and amplifies your impact.

**Recommended:** Version 3 (clearest flow: 1. Define their value → 2. My mission/role → 3. Intention → 4. Together outcome)

### quote
> I'm gonna be as bold as to say that transparent communities are essential to the evolution of humanity as a new nonviolent social structure.

**Note:** May move to CTA slide in v4.2 if a better alignment-specific quote is found.

### quoteAttribution
> KamalaDevi McClure

---

## Slide 3: How I Might Help (Grid/Table)

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

**Note:** Column header changed from "job" to "area" (or "Support Area" if space allows)

### h1
> How I Might Help

### blurb
> I treat systems like ecosystems — designed to learn, evolve, and nourish the people who live within them. Each activity is a practice, not just a task — a steady cadence that sustains clarity, connection, and flow. Here are some examples:

### rows

**1. Calendar & inbox calm**
- **Solution:** Scheduling rules, triage lanes, templates
- **Tools:** Google Calendar, Gmail, SOPs

**2. Publishing rhythm**
- **Solution:** Regular cadence with asset prep & approvals
- **Tools:** Asana/Notion, Mailchimp, n8n

**3. Systems memory**
- **Solution:** Single source of truth for agendas & decisions
- **Tools:** Drive, Asana/Notion

**4. Community engagement**
- **Solution:** Reply templates & gentle automations
- **Tools:** CRM basics, SOPs, n8n

**5. Revision/publishing support**
- **Solution:** Revision/publishing workflow scaffolding
- **Tools:** KDP/Amazon, Docs, lightweight checklists

**Note:** "Author support" changed to "Revision/publishing support" to clarify structural/workflow support (not content editing)

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

### metrics (current default, pending alternatives in feedback)

1. ≥90% of appointments confirmed at least 48 hours in advance
2. One weekly post/newsletter pre-scheduled and published
3. Single Source of Truth (Asana) updated for bi-weekly check-ins
4. Inbox processed to inbox-zero (or near-zero) daily

### Alternative metrics (from job description analysis)

**Set A: Job-Description Aligned**
1. Bi-weekly strategy meetings held on schedule with clear action items
2. Newsletter drafted, reviewed, and scheduled in Mailchimp by [day]
3. Social media posts queued 1 week in advance
4. KDP/Amazon author page updated monthly with current releases
5. Budget tracking sheet updated weekly; subscriptions reviewed quarterly
6. Travel/logistics coordinated at least 2 weeks before departure
7. Client invoicing completed within 48 hours of session
8. Asana project board reflects current priorities and deadlines

**Set B: Outcome-Focused (4 metrics)**
1. Bi-weekly meetings occur on rhythm with decisions logged in Asana
2. Weekly newsletter pre-scheduled; social posts queued 1 week ahead
3. Calendar confirmations sent 48+ hours in advance; no-show rate <5%
4. Publishing/KDP workflows tracked with clear next-action visibility

**Set C: Energy/Flow Focused (4 metrics)**
1. Creative time protected: ≥4 hours/week reclaimed from admin work
2. Communication calm: inbox under 20 items; responses within 24 hrs
3. Publishing rhythm steady: 1 newsletter + 3–5 social posts/week
4. Decision clarity: bi-weekly reviews with prioritized action list

**Recommendation:** Use Set B (job-aligned, concrete, 4 items) or Set C (energy-focused, aligns with "Return on Energy" framing)

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
  "profileLinkHref": "...",
  "profileIntroText": "...",
  "caseStudiesNote": "..."
}
```

### h1
> Why I'm a Fit

### blurb
> This work feels like the natural evolution of my path — blending creativity, intelligence, spirit, technology, and structure. I bring operational skill and care to help your next evolution unfold with ease.

### Layout: Three-column structure
**Full-width blurb** above, then three columns below:

**Left Column: Domain Knowledge**
*(Title changed from "Domain Expertise" — KD is the domain expert)*

- **Spirit-literate operations partner** — grounded in ISTA, Sacred Pleasure Consciousness, Sexological Bodywork lineages
- **Creative & nonprofit fluency** — performing arts degree, 7+ years in arts/nonprofit marketing & ops
- **Community-aware practice** — consent-based collaboration, trauma-informed communication, confidentiality as sacred

**Right Column: Operations Excellence**

- **Systems that breathe** — designed for learning & evolution, not rigidity (ecosystems not checklists)
- **Marketing & automation fluency** — Google Analytics, Looker Studio dashboards, n8n/Zapier workflows
- **Proven impact** — 25% engagement lift (Freight & Salvage), 50% membership increase (SVDP), $60K fundraising support

**Center/Right Column: Portrait**
> /images/david_headshot.jpg (cover mode)

**Note on layout:** Portrait can be symmetrical with columns OR larger/smaller depending on design impact. Test both approaches.

### profileIntroText (new property for CTA context)

**Option 1:**
> More detail in my personal profile — see full background, experience, and approach.

**Option 2:**
> For a deeper look at my background and philosophy, visit my personal profile.

**Option 3:**
> Curious about the path that led me here? See my full profile for details.

### profileLinkText (simplified from v4.0)
> View Full Profile

### profileLinkHref
> /appendix/profile

### caseStudiesNote
> Case studies in progress and available upon request

**Design note:** Make profile link a button (not just text link) with intro text above or beside it

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

**⚡ Starter Sprint**
- **Price:** $1,200–$1,500

**Description alternatives:**

*Current:* 2 weeks to establish foundational systems — calendar clarity, publishing templates, single source of truth setup

*Alt 1:* Two weeks of focused setup — calendar protocols, publishing templates, and decision hub. Quick relief with lasting structure.

*Alt 2:* 2-week sprint to create immediate calm — inbox/calendar systems, publishing rhythm, and a single source of truth for priorities.

*Alt 3:* Fast-start foundations — establish calendar rules, publishing cadence, and systems memory in two focused weeks.

---

**🌿 Ongoing Partnership**
- **Price:** $2,250–$2,800/mo

**Description alternatives:**

*Current:* 10–15 hrs/week of steady operational support — maintaining rhythm, iterating systems, freeing your creative energy

*Alt 1:* Steady rhythm at 10–15 hrs/week — keep systems humming, handle weekly publishing, reclaim 4–6 hours of your creative time monthly.

*Alt 2:* Sustained partnership (10–15 hrs/week) — maintain publishing cadence, evolve workflows, protect your temple of work from admin overwhelm.

*Alt 3:* Monthly retainer for ongoing support — bi-weekly meetings, publishing rhythm, inbox/calendar management, and continuous system refinement.

---

**🌈 Fractional COO**
- **Price:** Custom

**Description alternatives:**

*Current:* Strategic leadership for growth phases — full operational oversight, team coordination, systems architecture, and long-term planning

*Alt 1:* Strategic operational leadership — launch choreography, team coordination, dashboard design, and quarterly roadmap planning for expansion seasons.

*Alt 2:* Full operational partnership — oversee launches, coordinate vendors, build dashboards, and design systems that scale with your vision.

*Alt 3:* Executive-level support for growth — manage launches, streamline team workflows, create KPI visibility, and architect scalable operations.

### note
> All engagements begin with a short discovery call.

---

## Pricing Analysis (Internal Reference)

Based on `pricing_strategy_kd_collaboration_v_0.md`:

### Current pricing assessment

**Starter Sprint: $1,200–$1,500**
- Target in strategy doc: $1,200–$1,800
- Current range: **appropriate**, slightly conservative
- Effective rate: $600–$750/week for 2 weeks (assumes 8–10 hrs/week)
- **Recommendation:** Keep current range OR expand to $1,200–$1,800 to match strategy doc

**Ongoing Partnership: $2,250–$2,800/mo**
- Target in strategy doc: $1,800–$2,800/mo
- Current range: **tightened from v4.0** ($1,800–$2,800 → $2,250–$2,800)
- Effective rate at 10–15 hrs/week: $37.50–$70/hr
- At midpoint ($2,525/mo, 12.5 hrs/week): $50.50/hr
- **Recommendation:** Current range is good. Consider presenting single price ($2,400/mo or $2,500/mo) to reduce decision friction

**Fractional COO: Custom**
- Strategy doc suggests: $3,000–$5,000+/mo
- **Recommendation:** Keep "Custom" for deck; in conversation, anchor at "typically $3,500–$5,000/mo for growth seasons"

### Value anchoring (from strategy doc)
Frame investment around **Return on Energy (ROE)** and **Return on Clarity (ROC)**:
- Creative time reclaimed: 4–6 hrs/week (16–24 hrs/month)
- Publishing continuity: ≥1 pre-scheduled post/newsletter per week
- Inbox & calendar serenity: <20 unprocessed items/day; 48-hr confirmations ≥90%

> *"The value isn't how much I do; it's how much of your creative time we free up."*

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
  "ctaIntroText": "...",
  "emailButtonText": "...",
  "calendarButtonText": "...",
  "quote": "...",
  "quoteAttribution": "..."
}
```

### h1 alternatives

*Current:* Gratitude & Going Forward

*Alt 1:* Gratitude & Invitation

*Alt 2:* Honoring Legacy, Embracing Evolution

*Alt 3:* With Respect & Readiness

**Recommendation:** "Gratitude & Invitation" (warmer, more active than "Going Forward")

### blurb
> I hold deep respect for the foundation Kali Das has helped build and would be honored to continue supporting that legacy.

### body (3 alternatives informed by job description)

**Version 1: Comprehensive**
> I'd love to explore your current priorities and co-design what would serve you best. Whether it's maintaining your bi-weekly strategy meetings, establishing a steady newsletter rhythm, coordinating travel logistics, or managing your KDP author presence — let's find the right starting point together.

**Version 2: Focused on Key Priorities**
> Let's talk about what would serve you most right now — perhaps it's calendar calm and bi-weekly meeting rhythms, or steady publishing support for newsletters and social posts, or systems to track budgets and coordinate logistics. We'll co-design what fits.

**Version 3: Energy-Focused**
> I'd love to explore how we might reclaim 4–6 hours of your creative time each week. Whether that starts with calendar/inbox protocols, publishing rhythm, or bi-weekly strategy meetings with clear follow-through — we'll find the approach that serves your energy and vision.

**Recommendation:** Version 3 (aligns with "Return on Energy" framing from pricing strategy)

### email
> dkellam44@gmail.com

### calendarUrl
> https://supercal.com/davidkellam/60

### ctaIntroText
> To get started, reach out by email or book a discovery call — whichever feels right for you.

### emailButtonText
> Email Me

### calendarButtonText
> Book a Call

### quote (closing quote from KD)
> Talking about your love life can actually lead to a social revolution.

**Note for v4.2:** Replace with a better closing quote if available. This is placeholder (same as title quote).

### quoteAttribution
> KamalaDevi McClure

---

## Missing Elements & "Why Now" Suggestions

### Social proof strategies
1. **Testimonial from Clayton Shelvin** (Executive Director, The Freight) — to be added in v4.2
2. **Testimonial from internship supervisor** — to be added in v4.2
3. **Case studies note:** "Case studies in progress and available upon request" (already added to Fit slide)

### "Why Now" framing options

**Option 1: Seasonal Urgency**
> As you enter this next season of expansion, having steady operational support in place now means your creative energy stays focused on the work that only you can do.

**Option 2: Transition Opportunity**
> This transition moment — honoring what Kali Das built while stepping into your next evolution — is the ideal time to establish new rhythms and systems that reflect your vision.

**Option 3: Compounding Value**
> The sooner we establish calm systems, the more creative time compounds. Starting now means [X months] of reclaimed energy by [season/event].

**Where to add:**
- CTA slide body text (subtle version)
- OR Engagement Path blurb (framing urgency around starting)
- OR Alignment slide (transition/evolution framing)

**Recommendation:** Add subtle version to CTA body (Version 1 or 2 above)

### Risk reversal options

**Current (implicit):** Starter Sprint serves as low-commitment test ($1,200–$1,500 for 2 weeks)

**Explicit options to consider:**

1. **Sprint satisfaction clause:** "If sprint acceptance criteria aren't met, we'll include a make-good block or partial credit toward ongoing partnership."

2. **Monthly flexibility:** "Ongoing Partnership renews monthly with 30-day opt-out — no long-term commitment required."

3. **Diagnostic credit:** "Optional 3–5 day diagnostic ($300–$500) is fully credited toward Starter Sprint if commissioned within 14 days."

**Where to add:**
- Engagement Path card descriptions (brief version)
- OR Engagement Path note section (below cards)
- OR in discovery call conversation (not on deck)

**Recommendation:** Add to Engagement Path note section: "All partnerships renew monthly with flexible opt-out. Your investment is protected by clear acceptance criteria and make-good provisions."

---

## Design Enhancement Priorities (For v4.2+ Discussion)

### Typography exploration
- **Heading fonts:** Playfair, Crimson, Lora, Butler, Freight
- **Body fonts:** Inter, Epilogue, Satoshi, Work Sans
- **Scale:** Increase h1 from 32px to 48–72px for impact

### Color palette expansion
- **Base (from KD website):** cream, charcoal, gold, lavender
- **Expansion options:** deep plum, forest green, burnt amber
- **Strategy:** 60% impact, maintain clean/uncluttered feel

### Slide-specific treatments
- **Title:** Full-bleed image, dramatic overlay, artistic quote positioning
- **Alignment:** KD quote as pull quote (larger, indented, border)
- **Help:** Explore cards/bordered sections instead of plain table
- **Regenerative:** Style metrics as pills/badges (not plain list)
- **Fit:** Three-column layout with strong visual structure
- **Engagement:** Add depth to cards (shadows, borders, subtle gradients)

### Image requirements for v4.2
1. **Hero image** in multiple aspects:
   - 4:5 portrait (current: 800×1000px+)
   - 16:9 landscape (full-bleed option: 1920×1080px+)
   - 1:1 square (alternative: 1080×1080px+)

2. **Headshot** (already have: /images/david_headshot.jpg)

---

## Content Validation Checklist (Pre-Build)

### Pronoun usage ✅
- [ ] All references to KamalaDevi use they/them (corrected in v4.1)

### Language alignment ✅
- [ ] "Temple of work" validated against KD's actual content
- [ ] Metrics informed by job description
- [ ] "Revision/publishing support" clarified (not content editing)

### Voice consistency (to review after v4.1 build)
- [ ] Read entire deck aloud — does it sound like one person?
- [ ] Does it sound like David or like AI?
- [ ] Balance of grounded operations language + spiritual sensitivity

### Structural flow ✅
- [ ] Slide order: Title → Alignment → Help → Metrics → Fit → Engagement → CTA
- [ ] Each slide has clear purpose
- [ ] Redundancies minimized (ongoing refinement from v3)

---

## Next Steps: v4.1 → v4.2 → Build

### For v4.2 (Final content polish)
1. **New hero images** (3 aspect ratios)
2. **Testimonial quotes** (Clayton Shelvin + internship)
3. **Additional KD quotes** (better alignment quote, better CTA quote)
4. **Final metric selection** (choose Set B or C from alternatives)
5. **Final description selection** (Engagement Path cards)
6. **"Why now" + risk reversal** (decide placement)

### After v4.2 approval
1. **Update JSON files** with v4.2 content
2. **Build and preview** on localhost
3. **Content review** in rendered context
4. **Design prototype rounds** (2–3 visual directions)
5. **Final build** → commit → deploy

### Timeline
- v4.1 review: immediate
- v4.2 assets + revisions: within 24 hours
- Build + design rounds: 1–2 iterations
- **Target ship:** within 24–48 hours total

---

*This v4.1 plan incorporates all worksheet feedback and sets up clean handoff to v4.2 (final content) and design prototyping phase.*
