# Design Directory

**Purpose:** Visual design specifications and decision-making for KD Collaboration project

---

## Files

### Planning Documents

**`design-plan-v1.0.md`** - Initial comprehensive design specification
- Color system options
- Typography scale alternatives
- Slide-by-slide layout options (2-3 variations each)
- Component styling details
- Responsive strategy
- Accessibility guidelines
- Implementation roadmap

**`design-worksheet-v1.0.md`** - Decision-making template
- Checkbox selections for each design option
- Space for notes and feedback
- Priority ranking
- Open questions section
- **Action:** Fill out after reviewing design-plan-v1.0.md

### Analysis Documents

**`visual-analysis-notes.md`** - Detailed visual inspiration analysis
- O.school website breakdown
- Figma marketing presentation analysis
- Layla Martin website observations
- Stage speaker hero patterns
- Anti-example warnings (what to avoid)
- Synthesis and design direction recommendations

**`visual-inspiration.md`** - Quick reference to inspiration sources
- Links to visual assets
- Brief descriptions
- Located in `/content/drafts/visuals/` (asset files)

---

## Workflow

### Phase 1: Planning (Complete)
1. ✅ Visual inspiration review
2. ✅ Detailed analysis of all references
3. ✅ Design plan creation with options
4. ✅ Worksheet template creation

### Phase 2: Decision-Making (Next)
5. [ ] David reviews `design-plan-v1.0.md`
6. [ ] David fills out `design-worksheet-v1.0.md`
7. [ ] Design review discussion
8. [ ] Create `design-plan-v1.1.md` with refined options

### Phase 3: Prototyping
9. [ ] Build Title slide prototypes (2-3 variations)
10. [ ] Build one content slide (test approach)
11. [ ] Browser preview and feedback
12. [ ] Adjustments → `design-worksheet-v1.2.md`

### Phase 4: Implementation
13. [ ] Create `design-plan-v1.x-FINAL.md`
14. [ ] Implement all slides with selected design
15. [ ] Full browser testing
16. [ ] Final polish

---

## Key Design Principles (From Analysis)

**DO:**
- ✅ High contrast (Figma-inspired boldness)
- ✅ Huge headlines (6xl-9xl range)
- ✅ Generous white space (Layla-inspired spaciousness)
- ✅ Professional photography with warm lighting
- ✅ Bold accent colors used strategically
- ✅ Alternating section backgrounds for rhythm
- ✅ Rounded corners throughout
- ✅ Circular portraits for warmth
- ✅ Dark gradient overlays on hero images

**DON'T:**
- ❌ Psychedelic/overly saturated colors
- ❌ Mystical clichés (chakras, third eyes, cosmic imagery)
- ❌ Soft-focus cloudy backgrounds
- ❌ Text on busy backgrounds without contrast treatment
- ❌ Too many competing visual elements
- ❌ Overly decorative fonts that sacrifice readability
- ❌ Walls of text without hierarchy

---

## Color Palette (Proposed)

**Base:**
- Cream: `#FAF8F3`
- White: `#FFFFFF`
- Charcoal: `#2B2B2B`

**Accent:**
- Deep Plum: `#6B1F5C` (richer than current)
- Warm Gold: `#C9A961` (more prominent)
- Lavender: `#D8A7C4`
- Sage: `#9BA88C`

**Dramatic:**
- Pure Black: `#000000`
- Pure White text on dark backgrounds

---

## Typography System (Proposed)

**Headings:**
- H1: 7xl-9xl, Playfair Display (serif), bold
- H2: 4xl-5xl, Playfair Display, semibold
- H3: 2xl-3xl, Inter, semibold

**Body:**
- Body: base-lg (18px), Inter, regular, leading-relaxed
- Small: sm (14px), Inter, regular

**Special:**
- Quotes: 2xl-3xl, Crimson Text, italic
- Stats: 6xl-8xl, Inter, bold

---

## Inspiration Sources

**Best Overall:** O.school website
- Clean, modern, purple theme
- Handles text well, bold accents

**Contrast & Drama:** Figma marketing template
- Maximum contrast, huge type
- Alternating backgrounds, card-based

**Domain Expert:** Layla Martin website
- Warm earth tones, circular portraits
- Professional + intimate balance

**Title Card:** Stage speaker hero
- Full-bleed with gradient overlay
- Cinematic authority

**Anti-Examples:** Avoid woo-woo clichés
- No psychedelic colors
- No mystical symbols
- No cloudy backgrounds

---

## Git Strategy for Design Prototyping

### Recommended Approach: Variant System + Feature Branches

**For testing multiple design directions:**

```bash
# Create prototype branch from develop
git checkout develop
git checkout -b design/title-prototypes

# Build variant system (all layouts in one component)
# This lets you switch between prototypes by changing one prop
# Much easier than switching git branches

# Commit after building variants
git commit -m "feat: create Title slide variant system

Adds three layout options:
- fullbleed: Full-width image with gradient overlay
- splitscreen: Image left, plum background right
- contained: Gallery-style with rounded image

Switch via variant prop for easy comparison."

# Test each variant by changing prop
# Document findings in design-worksheet-v1.2.md

# Commit decision
git commit -m "feat: set Title slide default to fullbleed variant

Based on browser testing - most impactful option.
See design-worksheet-v1.2.md for rationale."

# Merge to develop
git checkout develop
git merge design/title-prototypes
```

### Branch Naming Convention

```
design/[component]-[what-testing]

Examples:
- design/title-prototypes
- design/typography-scale
- design/color-rhythm
- design/engagement-cards
```

### When to Commit

**DO commit:**
- ✅ After each working prototype variant
- ✅ After browser testing with notes
- ✅ Before trying risky experiments
- ✅ End of each work session

**DON'T commit:**
- ❌ Broken/non-working code
- ❌ After every tiny change (batch related)
- ❌ Without testing first

### Commit Message Pattern

```
feat: [component] [variant] prototype

Examples:
feat: Title slide full-bleed prototype with gradient
feat: Engagement cards with shadow depth (Option A)
feat: CTA slide black background variant
```

### Quick Reference Commands

```bash
# Create prototype branch
git checkout develop
git checkout -b design/prototype-name

# Save progress
git add .
git commit -m "feat: prototype description"

# Merge winner
git checkout develop
git merge design/prototype-name

# Delete rejected prototype
git branch -d design/rejected-prototype

# See all design branches
git branch | grep design/
```

### Variant System Example

```tsx
// components/TitleCard.tsx
type TitleCardVariant = 'fullbleed' | 'splitscreen' | 'contained';

export function TitleCard({ variant = 'fullbleed', ...props }) {
  if (variant === 'fullbleed') {
    return <FullBleedLayout {...props} />;
  }
  if (variant === 'splitscreen') {
    return <SplitScreenLayout {...props} />;
  }
  return <ContainedLayout {...props} />;
}

// app/page.tsx - switch between prototypes
<TitleCard variant="fullbleed" {...slides.title} />
// Change variant prop to test - no git switching needed!
```

**Benefits:**
- Preview all options without git branch switching
- Switch in seconds (change one prop)
- Easy to show all options
- Can keep variant system if useful

---

## Current Status

**Date:** 2025-10-14
**Phase:** Decision-making (waiting for worksheet completion)
**Next:** David fills out design-worksheet-v1.0.md
**Goal:** Begin prototyping within 48 hours

---

## Questions?

- Review `design-plan-v1.0.md` for full details on all options
- Use `design-worksheet-v1.0.md` for decision-making
- Refer to `visual-analysis-notes.md` for inspiration context
