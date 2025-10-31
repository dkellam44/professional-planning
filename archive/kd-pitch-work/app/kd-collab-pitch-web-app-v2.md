KD Collaboration Pitch — Web App (v2) Spec
Purpose

Mobile-first React web app that presents your KD pitch as a smooth, scrollable “slides” experience with a lightweight appendix (personal profile + trial sprint). Tone and palette match your existing v1.1 deck; copy pulls from v1.1 with your ordering changes.

Tech Choices

Framework: Next.js (App Router) + React + TailwindCSS

Styling: Tailwind + CSS variables for theme tokens

Animation: Framer Motion (gentle fade/slide)

Deploy: Vercel (no server functions needed)

Content source: Local JSON/MDX for easy AI editing

Images: /public/images (4:5 hero of KD, your headshot optional)

Information Architecture
Slide order (with your decisions)

Title Card — KD image left, text right, KD TED-quote

Alignment & Intention — framing blurb (+ optional icon)

How I Might Help — Problem/Solution table + (optional) leverage systems note

Regenerative Systems — metaphorical loop (no framework names) + metrics cards

Why I Fit — bullets (with optional portrait treatment) + link to profile

Engagement Path — offer cards with generous vertical spacing (mobile friendly)

Gratitude & CTA — email + calendar buttons (+ optional headshot)

Appendix (simple document formatting)

A. Personal Profile (draft) — readable text page

B. Trial Sprint (2 weeks) — scope/acceptance criteria in bullets

UX & Responsive Behavior

Desktop: 16:9 “slide frame” centered; KD image pinned left on Slide 1

Mobile: Each “slide” stacks vertically; sticky slide indicator; large tap targets

Nav: Prev/Next buttons + swipe (mobile) + dot progress

Export: Print-to-PDF (page break per slide + appendix sections)

Visual System

Palette: Plum #812D6B, Gold #D4B483, Cream #FAF8F3, Sage #9BA88C, Lavender #D8A7C4

Type: Playfair Display (H1), Inter (body), Crimson Text (quotes)

Iconography: Minimal emojis or Lucide icons (subtle, sparing)

Metaphor (Slide 4): “Systems that learn” garden loop (Measure → Tend → Harvest → Compost → Seed)

Component & Content Spec
Core components

SlideFrame: applies background, paddings, max-width, and consistent H1 style

TitleCard: KD image (left), title/subtitle, quote, footer

TextSlide: H1 + body (MDX) + optional icon

TableSlide: 3-column table (Jobs → Solutions → Tools)

MetricsLoop: loop diagram (SVG) + metric cards grid

OfferCards: 3 cards; responsive stack; price lines optional

CTASection: gratitude text + two buttons (mail, calendar)

Appendix: renders MDX docs with simple typographic styles

NavBar: Prev/Next + dots + “Appendix” link

ThemeProvider: Tailwind CSS variables for tokens

Data files (editable by AI)

/content/slides.json

{
  "title": {
    "deckTitle": "Creating Spaciousness Through Structure",
    "subtitle": "Operations Support for Kamala Devi McClure",
    "quote": "“<pull-quote from KD TED talk>”",
    "image": "/images/kd_hero_4x5.jpg"
  },
  "alignment": { "h1": "Alignment & Intention", "bodyMdx": "..." },
  "help": {
    "h1": "How I Might Help",
    "blurb": "...",
    "rows": [
      { "job": "Calendar & inbox calm", "solution": "Rules + triage lanes", "tools": "Gmail, SOPs" },
      { "job": "Publishing rhythm", "solution": "Weekly cadence + assets flow", "tools": "Notion/Coda, Zapier" },
      { "job": "Systems memory", "solution": "Single source of truth", "tools": "Drive, Coda" }
    ],
    "note": "Light illustration of leverage systems (optional)."
  },
  "regenerative": {
    "h1": "Systems that Learn",
    "metaphor": "Garden-like loop that protects creative energy.",
    "metrics": [
      "90% of appointments confirmed ≥48h",
      "Inbox < 20 unprocessed items/day",
      "Weekly publishing cadence automated",
      "Clear goal tracker and decisions log"
    ]
  },
  "fit": {
    "h1": "Why I Fit",
    "bullets": [
      "Bridges creative and operational worlds",
      "Systems with soul — structure that breathes",
      "Fluent in sacred & sex-positive spaces",
      "Feedback-driven, learning-oriented ops"
    ],
    "profileLinkText": "View my full profile →",
    "profileLinkHref": "#appendix-profile",
    "portrait": "/images/david_headshot.jpg",
    "portraitMode": "optional"
  },
  "engagement": {
    "h1": "Engagement Path",
    "cards": [
      { "icon": "⚡", "title": "Starter Sprint", "desc": "2 weeks, quick relief and setup", "price": "$1,200–$1,500" },
      { "icon": "🌿", "title": "Ongoing Partnership", "desc": "10–15 hrs/week, steady rhythm", "price": "$1,800–$2,200/mo" },
      { "icon": "🌈", "title": "Fractional COO", "desc": "Strategic growth & systems", "price": "Custom" }
    ],
    "note": "All engagements begin with a short discovery call."
  },
  "cta": {
    "h1": "Gratitude & Next Steps",
    "body": "I’d love to explore your current priorities and co-design what would serve best.",
    "email": "dkellam44@gmail.com",
    "calendarUrl": "https://cal.com/your-handle"
  }
}


/content/appendix/profile.mdx — Personal Profile (draft) in clean headings, short paragraphs, simple lists.

/content/appendix/trial-sprint.mdx — Two-week trial with bullets: focus, deliverables, acceptance criteria, cadence.

“Why I Fit” — portrait options (your Q2)

Option A (Clean text): No photo; focus on concise bullets → fastest, least biasing.

Option B (Subtle presence): Small circular headshot aligned right, 96–128px, 40–50% opacity background watermark; maintains text priority.

Option C (Split layout): Left bullets / right portrait card with one-line ethos; good on desktop, auto-stacks on mobile.

Repo File Map (ready for AI/dev)
kd-collaboration-pitch/
├─ app/
│  ├─ layout.tsx
│  ├─ globals.css
│  ├─ page.tsx                       # renders slides + nav
│  ├─ appendix/
│  │  └─ page.tsx                    # renders appendix index with anchors
│  └─ api/health/route.ts            # optional ping
├─ components/
│  ├─ SlideFrame.tsx
│  ├─ TitleCard.tsx
│  ├─ TextSlide.tsx
│  ├─ TableSlide.tsx
│  ├─ MetricsLoop.tsx                # loop SVG + metric cards
│  ├─ OfferCards.tsx
│  ├─ CTASection.tsx
│  ├─ AppendixRenderer.tsx           # MDX renderer with simple typography
│  ├─ NavBar.tsx
│  └─ LogoMark.tsx                   # tiny quill or glyph
├─ content/
│  ├─ slides.json
│  └─ appendix/
│     ├─ profile.mdx
│     └─ trial-sprint.mdx
├─ public/
│  └─ images/
│     ├─ kd_hero_4x5.jpg             # KD TED-style image (4:5)
│     ├─ david_headshot.jpg          # optional
│     └─ favicon.svg
├─ styles/
│  └─ prose.css                      # MDX prose tweaks (readable doc)
├─ lib/
│  ├─ mdx.ts                         # MDX loader (next-mdx-remote or MDX bundler)
│  └─ theme.ts                       # tokens, helpers
├─ .vscode/
│  └─ settings.json                  # format on save, tailwind intellisense
├─ .env.example                      # currently unused; placeholder
├─ package.json
├─ tsconfig.json
├─ next.config.js
├─ postcss.config.js
├─ tailwind.config.ts
├─ README.md                         # run/build/deploy steps
└─ LICENSE

Implementation Notes
Page composition

app/page.tsx orchestrates slides:

Pull slides.json, render in order with specific components.

Include NavBar with dots, Prev/Next, and “Appendix” link (anchors to /appendix#profile, /appendix#trial).

Appendix

app/appendix/page.tsx renders:

H1 “Appendix”

Section A (id=appendix-profile): renders profile.mdx with AppendixRenderer

Section B (id=appendix-trial): renders trial-sprint.mdx

MDX styles: readable line length, 18–19px base, 1.7 line-height, clear h2/h3 hierarchy, simple list bullets.

Animation

Each slide wrapped in motion.div with small opacity/translateY transitions.

Respect reduced-motion prefers-reduced-motion.

Print to PDF

@media print rules:

Force page-break after each slide container and before each appendix section.

Neutral backgrounds; ensure dark text contrast.

Hide NavBar and interactive elements.

Accessibility

ALT text for KD and headshot images.

Buttons are <a> with role="button"; visible focus styles.

Color contrast ≥ 4.5:1 for text.

Scripts & Tooling

package.json (scripts)

{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "typecheck": "tsc --noEmit"
  }
}


Tailwind config

Enable @tailwindcss/typography for appendix.

Add custom colors as CSS vars (so you can theme later).

Content Stubs (fast start)

/content/appendix/trial-sprint.mdx

## Two-Week Trial Sprint (Draft)
**Focus:** calendar cleanup, inbox protocol, shared hub, weekly publishing rhythm.

**Week 1**
- Clarify scheduling rules and blocks
- Inbox lanes + templates; zero to protocol
- Create simple “single source of truth” hub

**Week 2**
- Weekly content cadence skeleton
- Metrics snapshot (appointments, inbox, cadence)
- Retro + next-step options

**Acceptance Criteria**
- Calendar rules documented; 90% confirmations ≥48h
- Inbox under 20 unprocessed/day by end of week 2
- Hub live with agendas, decisions, and trackers


/content/appendix/profile.mdx

# David Kellam — Personal Profile (Draft)
**Focus:** Designing systems that make creative and spiritual work sustainable.

**Style & Values**
- Calm, collaborative, and systems-minded
- Structure that breathes; feedback-driven learning

**Competencies**
- Operations & admin: scheduling, SOPs, CRM hygiene
- Publishing cadence: newsletters, social, templates
- Analytics & dashboards; light automation (Zapier/Make)

**Sector Fluency**
- Arts & culture; nonprofits; sacred sexuality & queer spaces

**Contact**
dkellam44@gmail.com • Berkeley, CA • linkedin.com/in/dkellam

Deployment Steps (Vercel)

npm i (Next, React, Tailwind, Framer Motion, next-mdx-remote, @tailwindcss/typography)

npm run dev locally; drop KD image into /public/images/kd_hero_4x5.jpg

Push to GitHub → “Import Project” in Vercel → deploy

Set Build Command: next build and Output: .next

Verify print-to-PDF and mobile usability

QA Checklist

 Mobile layout: Slide 1 image left becomes top; spacing feels calm

 Buttons: calendar link opens; email mailto: works

 Appendix anchors work (from Slide 5 profile link and NavBar)

 Print: one page per slide/section; backgrounds readable

 Lighthouse: ≥ 90 on Performance/Best Practices/SEO; a11y errors = 0

Nice-to-Have (backlog)

Dark-mode token set

Slide thumbnails nav (sticky on desktop)

JSON schema for slides to enable programmatic generation