# KD Collaboration Project Context

**Last Updated:** 2025-10-15 (pitch email sent)
**Current Branch:** main
**Status:** Pitch deck deployed and sent to Kali Das, awaiting response

---

## Project Overview

**Goal:** Win KamalaDevi McClure's business for ops studio services

**Deliverable:** Professional pitch deck web application showcasing operations support services for creative professionals

**Tech Stack:**
- Next.js 15.5.4 (App Router with Server Components)
- React 18.3.1
- TypeScript 5.4.2 (strict mode)
- Tailwind CSS 3.4.5 with @tailwindcss/typography
- Zod 4.1.12 (runtime validation)
- react-markdown 10.1.0 + remark-gfm 4.0.1
- Framer Motion 11.0.0 (installed, not yet used)
- Deployed on Vercel

**Repository:** https://github.com/dkellam44/kd-collaboration.git
**Live Production URL:** https://kd-collaboration.vercel.app/
**Status:** Deployed and sent to client (2025-10-15)

---

## Current Architecture

### Directory Structure
```
/app                          # Next.js App Router
  page.tsx                    # Main pitch deck (7 slides)
  layout.tsx                  # Root layout with metadata
  globals.css                 # Global styles
  /appendix
    page.tsx                  # Appendix content (profile + trial sprint)
  /api
    /health
      route.ts                # Health check endpoint

/components
  /ui                         # Reusable UI components
    SlideFrame.tsx            # Card container for slides
  /slides                     # Slide-specific components
    TitleCard.tsx             # Hero slide with image
    TextSlide.tsx             # Simple heading + body
    TableSlide.tsx            # Jobs-to-be-done table
    MetricsLoop.tsx           # Regenerative systems visual
    OfferCards.tsx            # 3-tier pricing cards
    CTASection.tsx            # Contact CTA
  AppendixRenderer.tsx        # Markdown renderer for appendix
  NavBar.tsx                  # Slide navigation (needs improvement)
  LogoMark.tsx                # Logo component

/content
  /slides                     # Individual JSON files
    title.json                # Slide 1: Hero
    alignment.json            # Slide 2: Mission
    help.json                 # Slide 3: Services table
    regenerative.json         # Slide 4: Metrics
    fit.json                  # Slide 5: Qualifications
    engagement.json           # Slide 6: Pricing
    cta.json                  # Slide 7: Contact
  /appendix
    profile.mdx               # Personal profile (short)
    trial-sprint.mdx          # Trial sprint details
  /drafts                     # Staging for raw content
    /content-plan-v4          # Content revision v4.0 → v4.1 → v4.2
      content-plan-v4.md      # Initial v4 revision
      content-plan-v4.1.md    # Updated with worksheet responses
      content-feedback-v4.md  # Analysis of v4 improvements
      content-feedback-v4.1.md # Analysis + all suggestions (metrics, pricing, etc.)
      content-worksheet-v4.1.md # Final selections for v4.2 (completed)
    /archive                  # Older drafts (v1-v3)
    content-worksheet.md      # v3 working notes (archived)
    content-feedback.md       # v3 feedback (archived)
    David_Kellam_Resume_2025 copy.md # Resume source
  slides.json                 # (DEPRECATED - kept for reference)

/lib
  /utils
    loadSlides.ts             # Content loader with validation
  /hooks                      # (Empty - for future custom hooks)
  schemas.ts                  # Zod validation schemas
  mdx.ts                      # MDX file loader

/types
  slides.ts                   # TypeScript type definitions

/public
  /images
    kd_hero_4x5.jpg           # KamalaDevi photo
    david_headshot.jpg        # David's headshot

/styles
  prose.css                   # Typography styles

/.claude
  /commands
    coach.md                  # Teaching mode slash command
    context.md                # Update project context command
    learn.md                  # Log learning command
    content-review.md         # Content review command
    sop.md                    # Create SOP command
  project-context.md          # This file

/docs
  /context                    # Decision journal
    2025-10-12-refresh-and-blurbs.md
    2025-10-13-code-review.md (NEW!)
    2025-10-13-polish-decisions.md (NEW!)
  /agents                     # AI/human collaboration framework
    README.md
    /prompts
      executor.md
    /tasks
      2025-10-12_refresh-and-blurbs.yml
  /sops                       # Standard Operating Procedures
    README.md
    /development
      content-review.md
      content-updates.md
  learning-journal.md         # Personal development knowledge base
  content-review-context.md   # ICP and content guidelines

/.next                        # Next.js build output (gitignored)
/node_modules                 # Dependencies (gitignored)
```

---

## Key Technical Patterns

### Content Loading with Validation
```typescript
// lib/utils/loadSlides.ts
export async function loadSlides(): Promise<SlidesContent> {
  // Load 7 JSON files in parallel
  const [title, alignment, ...] = await Promise.all([...]);

  // Validate each with Zod schemas
  return {
    title: TitleSlideSchema.parse(title),
    alignment: TextSlideSchema.parse(alignment),
    // ...
  };
}

// app/page.tsx - Async Server Component
export default async function Page() {
  const slides = await loadSlides();  // Validated at runtime
  return <main>{/* render slides */}</main>;
}
```

**Why this pattern:**
- Runtime validation catches content errors before rendering
- Parallel loading (`Promise.all`) for performance
- Type-safe with Zod inference
- Server-side only (no client bundle impact)

---

### Styling Architecture

**Custom Color Palette:**
```typescript
// tailwind.config.ts
colors: {
  plum: "#812D6B",      // Primary brand color
  gold: "#D4B483",      // Accent/borders
  cream: "#FAF8F3",     // Background
  sage: "#9BA88C",      // Accent
  lavender: "#D8A7C4",  // Accent
  charcoal: "#2B2B2B"   // Text
}
```

**Font Families:**
- `font-display`: Playfair Display (serif) - headings
- `font-body`: Inter (sans-serif) - body text
- `font-quote`: Crimson Text (serif) - blockquotes

**Note:** Fonts not yet optimized with next/font (Phase 2 task)

---

### Component Patterns

**Slide components follow consistent interface:**
```typescript
// Heading + content pattern
type SlideProps = {
  h1: string;
  [content]: ContentType;
}

// All slides wrapped in SlideFrame for consistency
<SlideFrame>
  <SlideComponent {...slideData} />
</SlideFrame>
```

---

## Git Workflow

### Branch Strategy
```
main                          # Production (auto-deploys to Vercel)
  ↑ (via Pull Request)
develop                       # Integration branch (preview deployments)
  ↑ (via CLI merge)
feature/*                     # Feature branches
```

**Preferred workflow:**
- **feature → develop:** CLI merge (`git checkout develop && git merge feature/xyz`)
- **develop → main:** Pull Request on GitHub (professional history, final review)

**Rationale:**
- CLI for internal iteration (faster)
- PR for production (review step, preview links, professional history)

---

### Recent Commits

**2025-10-13: "fix: align TypeScript types with Zod schemas"**
- Fixed type misalignment between Zod schemas and TypeScript interfaces
- Added optional `blurb` field to all slide type interfaces
- Made TitleSlide fields optional (subtitle, quote, image) to match schemas
- Fixed SlidesContent import path (@/types/slides instead of @/lib/schemas)
- Removed deprecated footer prop from TitleCard usage

**2025-10-12: "chore: context refresh, blurbs opt-in, regenerative metrics, CTA & agents docs" (PR #2)**
- Added optional `blurb` field to all slide schemas via `WithBlurb` helper
- Updated pricing: $1,200–$1,500 (Sprint), $1,800–$2,800/mo (Retainer)
- Set CTA calendar link and finalized contact info
- Tuned regenerative metrics to operational flow benchmarks
- Refreshed appendix (profile.mdx, trial-sprint.mdx)
- Added docs/agents/ with executor prompt and task card
- Updated docs/context/ with refresh notes
- Enhanced slash commands (coach, content-review, context, learn, sop)

**2025-10-12: "Refactor: Organize code structure and implement content management system"**
- Created `lib/`, `types/`, `components/ui/`, `components/slides/` directories
- Moved components to logical locations
- Split `slides.json` into 7 individual files
- Added Zod validation schemas
- Created `loadSlides()` utility
- Made `app/page.tsx` async

**Benefits of recent work:**
- Content files can be edited independently
- Runtime validation prevents crashes
- Type-safe development with proper inference
- Scalable architecture with clear patterns
- Comprehensive documentation demonstrates operational maturity

---

## Content Structure

### Slide Breakdown
1. **Title** (`title.json`) - Hero with KD image, quote, contact footer
2. **Alignment** (`alignment.json`) - Mission statement
3. **Help** (`help.json`) - Jobs-to-be-done table (5 rows)
4. **Regenerative** (`regenerative.json`) - Systems metrics with visual loop
5. **Fit** (`fit.json`) - Qualifications (4 bullets + link to appendix)
6. **Engagement** (`engagement.json`) - 3 pricing tiers (Starter/Ongoing/Fractional)
7. **CTA** (`cta.json`) - Contact form with calendar link

### Appendix Pages
- `/appendix#appendix-profile` - Personal profile (Markdown)
- `/appendix#appendix-trial` - Two-week trial sprint details (Markdown)

---

## Code Review & Assessment (2025-10-13)

**Overall Rating:** ⭐⭐⭐⭐ (4/5 stars)
**Code Quality Score:** 4.1/5

### Strengths
- **Architecture (5/5):** Excellent separation of concerns, content-first validation, consistent patterns
- **Design System (5/5):** Colors and spacing embody "spaciousness through structure" concept
- **Documentation (5/5):** Comprehensive, demonstrates the operational maturity being pitched
- **Type Safety (5/5):** Full TypeScript + Zod validation prevents runtime errors
- **Alignment with Goals:** Codebase itself demonstrates systems thinking value proposition

### Critical Findings

**🔴 HIGH PRIORITY:**
1. **Blurbs not displayed (CRITICAL)** - Rich trust-building content exists in JSON but only TableSlide shows it
   - Missing from: TitleCard, TextSlide, MetricsLoop, OfferCards, CTASection
   - Especially critical: CTA blurb about Kali Das legacy
   - **Impact:** Reduces emotional resonance and differentiation
   - **Fix time:** 15 minutes

2. **NavBar non-functional** - Updates state but doesn't scroll, all slides visible
   - **Decision:** Remove entirely (simpler, cleaner, current UX works)
   - **Fix time:** 5 minutes

3. **TypeScript type misalignment** - ✅ FIXED (2025-10-13)

**🟡 MEDIUM PRIORITY:**
4. **Regenerative visual weak** - "Seed/Tend/Harvest/Compost" too agricultural, static circle boring
   - **Decision:** Redesign with infinity loop + ops-relevant language
   - **Fix time:** 1-2 hours

5. **Missing portrait** - Schema supports it, component doesn't render
   - **Decision:** Add to Fit slide with elegant styling
   - **Fix time:** 15 minutes

6. **No appendix navigation** - No clear path from slides to expanded content
   - **Decision:** Add smart links from Fit and CTA slides
   - **Fix time:** 30 minutes

7. **Font loading unoptimized** - Causes FOUT, contradicts "calm" messaging
   - **Plan:** Implement next/font
   - **Fix time:** 1 hour

**Full review:** `docs/context/2025-10-13-code-review.md`

---

## Known Issues & Technical Debt

**Note:** As of 2025-10-13, comprehensive code review completed. See section above for prioritized findings.

### 🔴 Critical (Before Merging PR #2)

**Blurbs Not Displayed**
- **Location:** All slide components except TableSlide
- **Issue:** Schema and JSON support blurbs, but components don't render them
- **Impact:** HIGH - Hides trust-building, tone-setting content (especially CTA/Kali Das reference)
- **Plan:** Add blurb display to all components (15 min)
- **Status:** TO DO

**Navigation Component**
- **Location:** `components/NavBar.tsx:5-28`
- **Issue:** Non-functional (maintains state but doesn't scroll)
- **Impact:** Broken UI undermines professional positioning
- **Plan:** DELETE component entirely (decision made 2025-10-13)
- **Status:** TO DO

### 🟡 Medium Priority (Before Sharing with KD)

**Regenerative Visual** ✅ COMPLETED
- **Location:** `components/slides/MetricsLoop.tsx`
- **Issue:** Agricultural labels (Seed/Tend/Harvest/Compost), static circle design
- **Solution:** Redesigned with three interlocking rings (Vision/Systems/Balanced Flow)
- **Implementation:** SVG-based, triangular formation, brand colors, proper centering
- **Status:** DONE (2025-10-13 evening, commit c6c7252)

**Missing Portrait Image**
- **Location:** Fit slide (uses TextSlide component)
- **Issue:** Schema supports portrait, component doesn't render
- **Impact:** Missed opportunity for personal connection
- **Plan:** Add portrait rendering with elegant styling (15 min)
- **Status:** TO DO

**No Appendix Navigation**
- **Issue:** No clear path from slides to expanded content
- **Impact:** Depth available but hidden
- **Plan:** Add smart links from Fit/CTA slides (30 min)
- **Status:** TO DO

**Performance Optimizations Needed**
- Fonts not using next/font (causes FOUT) - **Priority**
- Images missing explicit dimensions (layout shift)
- No lazy loading for below-fold content
- Framer Motion installed but unused
- **Plan:** Font optimization first (1 hr), rest in Phase 3

**Accessibility Gaps**
- Missing ARIA labels on some interactive elements
- No skip navigation links
- Limited keyboard navigation support
- Need to verify color contrast ratios
- **Plan:** Phase 3 - dedicated accessibility pass

**SEO Improvements**
- Basic metadata only
- Missing Open Graph tags
- No Twitter cards
- No structured data (JSON-LD)
- No sitemap.xml
- **Plan:** Phase 3 - SEO enhancement

### 🟢 Low Priority / Future

**Testing Infrastructure**
- No unit tests
- No integration tests
- No component tests
- **Plan:** Phase 3 - if time permits

**Analytics**
- No visitor tracking
- No engagement metrics
- **Plan:** Add Vercel Analytics before sharing with KD

---

## Development Workflow

### Local Development
```bash
# Start dev server (with hot reload)
npm run dev

# Production build test
npm run build

# TypeScript validation
npm run typecheck

# Lint
npm run lint
```

**Dev server:** http://localhost:3000

---

### Deployment Process

**Automatic via Vercel:**
- Push to `main` → Production deployment
- Push to `develop` → Preview deployment
- Push to `feature/*` → Preview deployment
- Open PR → Preview deployment (link in PR comments)

**Manual trigger:**
- Vercel Dashboard → Deployments → "Redeploy"

---

## Dependencies

### Core
- `next@15.5.4` - React framework
- `react@18.3.1` + `react-dom@18.3.1` - UI library
- `typescript@5.4.2` - Type safety

### Styling
- `tailwindcss@3.4.5` - Utility CSS
- `@tailwindcss/typography@0.5.10` - Prose styles
- `autoprefixer@10.4.18` + `postcss@8.4.35` - CSS processing

### Content & Validation
- `zod@4.1.12` - Runtime validation
- `react-markdown@10.1.0` - Markdown rendering
- `remark-gfm@4.0.1` - GitHub Flavored Markdown

### Animation (Not Yet Used)
- `framer-motion@11.0.0` - Animation library

### Development
- `@types/node@20.11.20` - Node types
- `@types/react@18.2.73` - React types
- `@types/react-dom@18.2.23` - React DOM types
- `eslint@8.56.0` + `eslint-config-next@15.5.4` - Linting

### Deprecated (Still in package.json)
- `next-mdx-remote@5.0.0` - Replaced with react-markdown (React version conflict)
- `@mdx-js/mdx@3.1.1` + `@mdx-js/react@3.1.1` - Not used

---

## Environment Setup

### Node/npm
- **Node Version:** v22.14.0 (managed via nvm)
- **npm Version:** 10.x
- **nvm initialized in:** `~/.zshrc`

### Editor
- VS Code (presumed - adjust if different)
- TypeScript language server
- ESLint integration

---

## Project Phases

### ✅ Phase 0: Initial Setup (Completed Previously)
- Next.js project initialization
- Basic slide components
- Tailwind configuration
- Git repository setup
- Vercel deployment

### ✅ Phase 1: Code Organization & Content Management (Completed 2025-10-12)
- Directory structure refactor
- Content file splitting
- Zod validation implementation
- Type definitions
- Documentation system setup

### ✅ Phase 1.5: Schema Extension & TypeScript Fixes (Completed 2025-10-13)
- Added optional `blurb` field to all slide schemas
- Fixed TypeScript type misalignment with Zod schemas
- Updated pricing and CTA information
- Comprehensive code review (4/5 stars)
- Documented polish decisions and implementation plan

### ⏳ Phase 2: Polish for Launch (In Progress - Started 2025-10-13)

**Current Focus:** Design enhancements → typography/contrast → Title slide prototypes

**Critical Fixes:**
- ✅ Display all blurbs in slide components - DONE (2025-10-13)
- ✅ Remove non-functional NavBar - DONE (2025-10-13)
- ✅ Create content/drafts/ staging system - DONE (2025-10-13)
- ✅ Update JSON files with v4.2 final content - DONE (2025-10-14)
- ✅ Build and preview on localhost - DONE (2025-10-14)
- ✅ Apply all worksheet v4.2 fixes - DONE (2025-10-14)

**Visual Enhancements (Before Sharing with KD):**
- ✅ Redesign regenerative visual (three interlocking rings) - DONE (2025-10-13)
- ✅ Add portrait to Fit slide - DONE (2025-10-13)
- ✅ Metrics as pills/badges - DONE (2025-10-14)
- [NEXT] Design phase: Typography hierarchy (larger headers, more variation)
- [NEXT] Color/contrast improvements (modern, glossy feel)
- [NEXT] Title slide prototypes (full-bleed + split-screen)
- [TO DO] Smart navigation to appendix/external profile
- [TO DO] Optimize fonts (next/font) - after design phase
- [TO DO] Apply final design direction across all slides

**Content Expansion:**
- ✅ Create content drafts templates (blurbs, profile-long, resume) - DONE
- ✅ Content revision v4.0 → v4.1 → v4.2 - DONE (2025-10-14)
- ✅ Gather assets (hero images, testimonials, quotes) - DONE (2025-10-14)
- ✅ Final content selections documented in worksheets - DONE (2025-10-14)
- ✅ All content implemented and tested - DONE (2025-10-14)
- [TO DO] Expand appendix structure (post-launch)
- [TO DO] Draft extended profile content (post-launch)

**Target:** Ship to KD within 24 hours (by 2025-10-15)

### 📋 Phase 3: Enhancements (Post-Launch Iteration)
- Accessibility improvements (ARIA, keyboard nav, skip links)
- Performance optimization (image lazy loading, bundle size)
- SEO enhancement (Open Graph, structured data)
- Animation refinement (subtle micro-interactions)
- Analytics integration
- A/B testing if needed

### 📋 Phase 4: Maintenance & Evolution (Ongoing)
- Content updates based on KD feedback
- Additional case studies or portfolio pieces
- Continuous improvement based on usage data

---

## Content Strategy

### Current Content Approach
- **Format:** JSON files per slide, MDX files for appendix
- **Validation:** Zod schemas with helpful error messages
- **Editing:** Direct file editing (safe with validation)

### Content Drafts Workflow (NEW - 2025-10-13)

**Purpose:** Stage raw content before committing to validated JSON/MDX files

**Location:** `/content/drafts/` (to be created)

**Structure:**
```
/content/drafts/
  blurbs.md           # Draft all blurb text (easy to edit/review)
  profile-long.md     # Expanded profile content
  resume.md           # Traditional resume content
  README.md           # Workflow instructions
```

**Workflow:**
1. **Draft** content in markdown (human-readable, easy to version control)
2. **Review/iterate** with AI or manually
3. **Copy** final content to JSON/MDX files
4. **Validate** via dev server (Zod catches errors)
5. **Delete or archive** drafts

**Benefits:**
- Separates drafting from implementation
- Easier collaboration (markdown more accessible than JSON)
- Safe experimentation without breaking validation
- AI can read/edit markdown naturally
- Git tracks content evolution

### Adding Content

**For new fields (requires schema update):**

1. Draft content in `/content/drafts/`
2. Update schema in `lib/schemas.ts`:
```typescript
export const TableSlideSchema = z.object({
  h1: z.string().min(1),
  blurb: z.string().optional(),
  newField: z.string().optional(),  // Add new field
  rows: z.array(TableRowSchema).min(1),
});
```
3. Update component to use new field
4. Add content to JSON file
5. Dev server validates automatically

**For existing fields (no schema change):**
1. Draft in `/content/drafts/` or edit JSON directly
2. Dev server reloads with validation
3. Check terminal for any errors

---

## Custom Slash Commands

### Available Commands

**`/coach`** - Activates detailed teaching mode
- Explains commands with flag meanings
- Provides context on dev practices
- Breaks work into digestible steps
- Balances teaching with productivity

**`/context`** - Updates this project context file
- Prompts for what changed
- Updates relevant sections
- Maintains consistent format

**`/learn`** - Logs learning to journal
- Prompts for what was learned
- Adds to appropriate section
- Includes examples and context

---

## Questions & Decisions for Next Session

### ✅ Decisions Made (2025-10-14 - Content v4.1)
- **Pronouns:** All content uses they/them for KamalaDevi (CRITICAL FIX)
- **Title slide:** Keep "Grounded Structure Serving Expansive Vision" deck title
- **Title blurb:** Variation of Option 3 (avoid repeating grounded/structure/expansive/vision)
- **Alignment body:** Version 3 (role-definition focused)
- **Alignment quote:** New quote about privacy/shame/sharing
- **Metrics:** Set B (4 outcome-focused, job-specific metrics)
- **Metrics styling:** Pills/badges (start simple, enhance in design)
- **Fit layout:** Three-column (Domain Knowledge | Operations Excellence | Portrait)
- **Fit testimonial:** Clayton Shelvin quote, inline on Fit slide
- **Engagement descriptions:** Alt 2 (Starter Sprint), Alt 1 (Ongoing), Alt 1 (COO)
- **Engagement pricing:** Keep current ranges
- **Engagement note:** Add monthly flexibility + risk reversal language
- **CTA heading:** "Gratitude & Invitation" (warmest, most actionable)
- **CTA body:** Version 3 (energy-focused ROE framing)
- **CTA "why now":** Add Option 2 (transition framing re: Kali Das)
- **CTA closing quote:** New quote about transparent communities
- **Design philosophy:** 60% impact, clean/uncluttered, amplify message
- **Title slide prototypes:** Test Prototype A (full-bleed) + B (split-screen)

### ✅ Previous Decisions (2025-10-13)
- **Navigation:** Remove NavBar entirely (non-functional, unnecessary) - DONE
- **Blurbs:** Display in all slide components with consistent styling - DONE
- **Regenerative visual:** Three interlocking rings (Vision/Systems/Balanced Flow) - DONE
- **Portrait:** Add to Fit slide with elegant styling - DONE
- **Appendix:** Expand structure (profile-long + resume), add smart navigation
- **Content workflow:** Create `/content/drafts/` for staging - DONE
- **Design direction:** Need more visual interest, contrast, modern feel

### 🎨 Design Prototyping (Next - Post-v4.2 Build)
- [ ] Create v4.2 with final content + assets
- [ ] Update JSON files with v4.2 content
- [ ] Build and preview on localhost
- [ ] Prototype Title slide: Full-bleed (A) + Split-screen (B)
- [ ] Test typography: serif vs sans headings (Playfair/Crimson vs Inter/Epilogue)
- [ ] Explore color expansion: jewel tones (plum, forest green, burnt amber)
- [ ] Apply metrics styling: pills/badges
- [ ] Card depth: add shadows/borders to Engagement cards
- [ ] Overall polish: 60% impact, maintain spaciousness

### 📝 Content Status
- ✅ Content revision v4.0 → v4.1 complete
- ✅ Assets gathered (images, testimonials, quotes)
- ✅ Final selections documented
- [ ] Create v4.2 (final content document)
- [ ] Profile-long expansion (post-launch)
- [ ] Resume creation (post-launch)

### 🔧 Technical Decisions
- [ ] Font optimization: After design prototypes (see impact before committing)
- [ ] Analytics: Add before sharing with KD (Vercel Analytics)
- [ ] Dark mode: Skip for MVP (low priority)
- [ ] PDF export: Yes (alongside web link for KD delivery)

---

## Success Criteria

### MVP (Current - Phase 1 Complete)
- ✅ Professional visual design
- ✅ All 7 slides render correctly
- ✅ Responsive layout (mobile + desktop)
- ✅ Type-safe with validation
- ✅ Deployed and accessible via URL
- ✅ Content easy to edit

### Launch Ready (Target)
- [ ] Expanded content with compelling copy
- [ ] Strong accessibility (keyboard nav, ARIA, semantic HTML)
- [ ] Optimized performance (fonts, images, Core Web Vitals)
- [ ] SEO metadata (Open Graph, structured data)
- [ ] Analytics integrated
- [ ] Navigation works as intended (or removed)
- [ ] Cross-browser tested
- [ ] Mobile experience polished

### Stretch Goals
- [ ] Subtle animations enhance UX
- [ ] Dark mode toggle
- [ ] Print stylesheet for PDF export
- [ ] Micro-interactions (hover states, transitions)
- [ ] Contact form with backend integration

---

## Resources & References

### Documentation
- Next.js 15 Docs: https://nextjs.org/docs
- Tailwind CSS: https://tailwindcss.com/docs
- Zod: https://zod.dev
- React Markdown: https://github.com/remarkjs/react-markdown

### Design Inspiration
- Color palette inspired by sacred/creative spaces
- Typography hierarchy: display → body → quote
- Spacious, breathable layout philosophy

---

## Notes for AI Assistants

### Communication Preferences
- Use coaching mode when requested (`/coach`)
- Break complex tasks into steps
- Explain "what" and "why" for learning
- Balance teaching with productivity
- Allow user to say "do that for me" to move faster

### Project Context
- Solo developer learning best practices
- Goal: Win real client business (KamalaDevi)
- Professional quality expected
- Learning journey is part of the value

### Workflow Preferences
- CLI merge for feature → develop (faster iteration)
- Pull Request for develop → main (professional history)
- Commit messages with HEREDOC for multi-line
- Always test preview deployments before production

### Git Workflow Reminders for AI Assistants

**IMPORTANT:** David is learning git/development - proactively suggest when to commit!

**When to remind David to commit:**
- ✅ After creating/completing a plan or worksheet document
- ✅ After completing a major task or decision point
- ✅ After browser testing with documented feedback
- ✅ Before starting risky experiments or major changes
- ✅ End of work session (suggest commit + session handoff note)
- ✅ After successful build/test of new feature
- ✅ When multiple related changes are ready (batch commit)
- ✅ After completing a phase of design prototyping

**When NOT to suggest commits:**
- ❌ In the middle of unfinished work
- ❌ When code doesn't build or has errors
- ❌ After every single tiny change (batch related changes)
- ❌ Before testing changes

**How to suggest commits:**

When suggesting a commit, provide:
1. Clear rationale (why now is a good commit point)
2. Exact git commands with proper formatting
3. Well-structured commit message following conventions
4. List of files being committed

Example suggestion format:
```bash
# Good commit point! You've just completed the design plan documents.
# Let's commit this milestone:

git add design/design-plan-v1.0.md design/design-worksheet-v1.0.md design/README.md
git commit -m "$(cat <<'EOF'
docs: create design plan v1.0 and decision worksheet

Design Planning System:
- Add design-plan-v1.0.md with comprehensive options
  - Color system alternatives (3 options)
  - Typography scale variations (3 scales)
  - Layout options for each slide (2-3 per slide)
  - Each option includes rationale, pros/cons, inspiration source

- Add design-worksheet-v1.0.md for decision tracking
  - Checkbox selections for all options
  - Priority ranking system
  - Open questions section
  - Notes fields for feedback

- Update design/README.md with workflow guide
  - Planning → Decision → Prototyping phases
  - Git strategy for design exploration
  - Variant system recommendation

Ready for review and selection process.

See: docs/sops/development/collaborative-design-process.md
EOF
)"
```

**Commit message conventions:**
- **docs:** Documentation changes (plans, worksheets, READMEs, SOPs)
- **feat:** New features or components
- **fix:** Bug fixes
- **chore:** Maintenance (dependencies, config, cleanup)
- **refactor:** Code restructuring without behavior change
- **style:** Visual/design changes

**Good commit message structure:**
```
type: brief summary (50 chars or less)

Detailed explanation:
- What changed
- Why it changed
- Impact or next steps

Optional references:
See: [file path]
Closes: [issue]
```

**Branch management reminders:**
- **ALWAYS proactively plan git branches** before starting implementation work
- Suggest creating feature branches for distinct tasks: `git checkout -b feature/description`
- For design prototypes: `git checkout -b design/component-name`
- Remind to merge feature → develop via CLI when done
- Suggest PR for develop → main when ready for production
- **Include branch creation in implementation plans** (e.g., "Step 1: Create design/title-prototypes branch")

**Session handoff reminders:**

At end of session, suggest:
1. Commit all work
2. Create brief handoff note in commit message or separate doc
3. Update project-context.md if significant progress made

---

---

## Recent Context Updates

**2025-10-15 (pitch email sent):**
- ✅ **Email sent to Kali Das** - Pitch deck delivery complete
  - Recipient: Kali Das (KamalaDevi's operations partner/previous assistant)
  - Subject: "Response to KamalaDevi's Operations role — David Kellam"
  - Tone: Warm, direct, confident (not apologetic)
  - Attachments: Profile PDF, Resume PDF, Presentation PDF
  - Live URL: https://kd-collaboration.vercel.app/
- **Email strategy:**
  - Positioned as continuing the work Kali Das built (respectful transition framing)
  - Emphasized 2-week trial sprint (low-risk entry point)
  - Calendar link included for easy booking
  - Reframed timing positively (thoughtful vs rushed)
- **Next steps:**
  - Awaiting response from Kali Das/KamalaDevi
  - Monitor email for discovery call booking
  - Be prepared to discuss current priorities and co-design approach
- **Learnings documented:** See docs/sops/communication/client-pitch-emails.md (NEW)

**2025-10-14 (evening - design prototypes):**
- ✅ **Design planning system complete** - Comprehensive workflow created
  - Created design-plan-v1.0.md (initial options)
  - Created design-worksheet-v1.0.md (decision template)
  - Completed visual analysis of all inspiration sources
  - David filled out worksheet with selections
  - Created design-plan-v1.1.md with locked-in specs
- ✅ **Prototypes implemented** - Title + Alignment slides on design/title-prototypes branch
  - Title: Full-bleed dramatic with 16:9 image, gradient overlay, 96px headlines
  - Alignment: Cream background, dramatic typography, lavender quote cards
  - Updated typography system: All Inter (sans-serif), Crimson Text for quotes only
  - Build successful, dev server running on localhost:3000
- **Design decisions locked in:**
  - O.school inspiration (bold, modern, handles text well)
  - Dramatic typography scale: 96px vs 18px (5.3x ratio)
  - All sans-serif headings (Inter), serif quotes (Crimson Text)
  - Color rhythm: Image → Cream → Plum → White → Cream → White → Black
  - Lavender/20 quote cards with 4px gold borders
  - Context-dependent buttons (plum on light, gold on dark)
  - No animations (instant load)
- **Branch:** design/title-prototypes (commit d13cd0c6)
- **Status:** Awaiting browser review before implementing remaining 5 slides
- **Next:** David reviews prototypes, provides feedback, decision to proceed or refine
- **Documentation:** SESSION-HANDOFF-2025-10-14.md for session continuity

**2025-10-14 (v4.2 implementation complete):**
- ✅ **Content v4.2 fully implemented** - All JSON files, schemas, and components updated
- ✅ **All worksheet v4.2 fixes applied** - Browser review → adjustments → testing complete
- **Content updates:**
  - CTA body shortened (removed middle sentence)
  - Fit bullets updated with domain-accurate phrasing (spiritually-literate, trauma-informed interventions)
  - All Fit bullet titles bolded with markdown
  - Help slide: "Author support" (prevents word repetition)
- **Component fixes:**
  - TitleCard: Footer visible, quote below blurb, proper quote/blurb styling
  - TextSlide: Quote support added, MDX bold rendering fixed
  - TableSlide: Horizontal scroll for mobile (min-width 600px)
  - MetricsLoop: Pills/badges display with checkmarks
  - CTASection: Quote visible (replaced Kali Das blurb), custom button text
- **Technical improvements:**
  - ReactMarkdown integration for Alignment body and Fit bullets
  - All new schema properties (quoteAttribution, footer, ctaIntroText, etc.) wired through
  - Fixed ReactMarkdown className error
  - Dev server running successfully, all pages rendering
- **Branch:** develop (merged from chore/context-refresh-and-blurbs)
- **Next:** Design phase - typography, contrast, Title slide prototypes

**2025-10-14 (content revision session):**
- ✅ Completed content revision cycle: v4.0 → v4.1 → worksheet complete
- **CRITICAL FIX:** All pronouns corrected to they/them for KamalaDevi (previously missed)
- Created comprehensive content plan v4.1 in `content/drafts/content-plan-v4/`:
  - `content-plan-v4.1.md` - Complete revised content with all alternatives
  - `content-feedback-v4.1.md` - Analysis with all requested suggestions (metrics, pricing, descriptions)
  - `content-worksheet-v4.1.md` - Final selection worksheet (completed by David)
  - `content-worksheet-v4.2.md` - Browser review notes (completed by David)
- **Assets gathered for v4.2:**
  - Hero images in 3 aspects (4:5, 16:9, 1:1) - paths specified
  - Testimonial from Clayton Shelvin (The Freight)
  - New KD quotes for Alignment and CTA slides
- **Pricing strategy analyzed:** Effective hourly rates calculated ($35-$65/hr range)
- **Content alternatives provided:**
  - Alignment body: 3 paraphrased versions (Version 3 selected)
  - Metrics: 3 complete sets (Set B selected: outcome-focused, job-specific)
  - Engagement descriptions: 3 alternatives per tier (all selected)
  - "Why now" urgency: 4 framing options
  - Risk reversal: 4 strategy options
- **Design preferences documented:** 60% impact, clean/uncluttered, 2-3 Title slide prototypes

**2025-10-13 (evening session):**
- ✅ Completed regenerative visual redesign (commit c6c7252)
- Replaced agricultural circle with three interlocking rings (Vision/Systems/Balanced Flow)
- SVG-based implementation with brand colors and proper centering
- Full-site review identified need for more visual interest and contrast
- Documented design exploration plans (shadows, typography, dark accents)
- Added content review to task list
- Branch status: 7 commits ahead of origin, ready for design exploration

**2025-10-13 (afternoon):**
- Completed comprehensive code review (4/5 stars)
- Identified critical gaps (blurbs not displayed, NavBar broken)
- Documented polish decisions and implementation plan
- Created content drafts workflow
- Updated project phases (now in Phase 2: Polish for Launch)

**2025-10-12:**
- PR #2 opened with schema extensions and content refresh
- Added optional blurb fields to all slides
- Updated pricing and CTA information
- Created agents framework and SOPs

---

**End of Project Context**
**Last Updated:** 2025-10-14
**Next Review:** After v4.2 build and design prototype phase
