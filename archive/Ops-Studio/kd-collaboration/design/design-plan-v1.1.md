# Design Plan v1.1

**Date:** 2025-10-14
**Status:** Refined specifications based on completed worksheet
**Previous:** design-plan-v1.0.md → design-worksheet-v1.0.md (completed)
**Next:** Prototype Title + Alignment slides

---

## Overview

This document locks in design decisions from the completed worksheet and provides detailed implementation specifications for prototyping.

**Design Direction Selected:**
- **Inspiration:** O.school (bold, modern, handles text well)
- **Color Rhythm:** Alternating drama (cream/white/plum/black backgrounds)
- **Typography:** Dramatic scale (8xl headlines), all sans-serif (Inter)
- **Visual Style:** Maximum contrast, clean, professional

**Priorities (Ranked by David):**
1. Title slide impact
2. Typography scale (headline sizes)
3. Mobile responsiveness
4. Color contrast/drama
5. Overall visual rhythm

---

## Locked-In Decisions

### Color System

**Final Palette:**

**Base:**
- **Cream** `#FAF8F3` - Primary background
- **White** `#FFFFFF` - Alternate sections
- **Charcoal** `#2B2B2B` - Primary text

**Accent:**
- **Deep Plum** `#6B1F5C` (current) - Section backgrounds, headers
- **Warm Gold** `#C9A961` (current) - CTAs, emphasis
- **Lavender** `#D8A7C4` (current) - Quote backgrounds
- **Sage** `#9BA88C` (current) - Regenerative elements

**Dramatic:**
- **Pure Black** `#000000` - CTA slide only
- **Pure White** - Text on dark backgrounds

**Color Rhythm (Slide Backgrounds):**
1. **Title:** Full-bleed KD image
2. **Alignment:** Cream `#FAF8F3`
3. **Help:** Deep plum `#6B1F5C`
4. **Regenerative:** White `#FFFFFF`
5. **Fit:** Cream `#FAF8F3`
6. **Engagement:** White `#FFFFFF`
7. **CTA:** Pure black `#000000`

**Button Colors (Context-Dependent for Max Contrast):**
- **On light backgrounds (cream/white):** Plum `#6B1F5C` with white text
- **On dark backgrounds (plum/black):** Gold `#C9A961` with charcoal text
- **Hover states:** Darken background 10%, scale 1.02

---

### Typography System

**Font Strategy:**
- **All headings:** Inter (sans-serif) - O.school inspired
- **Body text:** Inter (sans-serif)
- **Quotes:** Crimson Text (serif, italic) - warmth & distinction

**Font Loading:**
- Keep Google Fonts CDN for prototype speed
- Optimize with `next/font` after design finalized

**Size Scale (Dramatic):**

**Desktop (lg: 1024px+):**
- **H1:** `text-8xl` (96px), `font-bold`, `leading-tight`
- **H2:** `text-5xl` (48px), `font-semibold`, `leading-snug`
- **H3:** `text-3xl` (30px), `font-semibold`, `leading-normal`
- **Body:** `text-lg` (18px), `font-normal`, `leading-relaxed`
- **Small:** `text-sm` (14px), `font-normal`
- **Quote:** `text-3xl` (30px), `italic`, `leading-snug` (Crimson Text)

**Mobile (base < 1024px):**
- **H1:** `text-5xl` (48px), `font-bold`, `leading-tight`
- **H2:** `text-3xl` (30px), `font-semibold`, `leading-snug`
- **H3:** `text-2xl` (24px), `font-semibold`
- **Body:** `text-base` (16px), `font-normal`, `leading-relaxed`
- **Small:** `text-sm` (14px)
- **Quote:** `text-2xl` (24px), `italic`

**Ratio:** H1 is 5.3x body size (desktop), 3x body (mobile)

**Text Colors:**
- **On cream/white:** Charcoal `#2B2B2B` or Plum `#6B1F5C` (headings)
- **On plum/black:** Pure white `#FFFFFF`
- **Muted:** Charcoal/80 or White/80 for secondary text

---

### Component Styling

**Buttons (Rounded Bold):**
```
Padding: px-8 py-4
Border-radius: rounded-full
Font: Inter, font-semibold, text-base
Shadow: shadow-sm
Transition: all 150ms ease-in-out

Hover:
  - Background: Darken 10%
  - Shadow: shadow-md
  - Transform: scale(1.02)
```

**Quote Cards (Lavender Background):**
```
Background: Lavender #D8A7C4 at 20% opacity (bg-lavender/20)
Padding: p-6
Border-left: 4px solid gold (#C9A961)
Border-radius: rounded-lg
Font: Crimson Text, italic, text-2xl (mobile) → text-3xl (desktop)
Color: Charcoal #2B2B2B or White (if on dark slide)
Spacing: my-8
```

**Standard Card (Help, Engagement slides):**
```
Background: White or Cream
Padding: p-6 (mobile) → p-8 (desktop)
Border-radius: rounded-xl
Shadow: shadow-lg
Border: none (shadow provides depth)
Transition: all 150ms ease

Hover:
  - Transform: scale(1.02)
  - Shadow: shadow-xl
```

**Pills/Badges (Metrics):**
```
Background: Plum #6B1F5C at 10% opacity
Border: 1px solid plum at 30% opacity
Padding: px-4 py-2
Border-radius: rounded-full
Font: Inter, text-sm, charcoal
Icon: ✓ before text in gold
Display: inline-flex, gap-2, items-center
Spacing: Stack vertically, gap-3
```

**Circular Portrait:**
```
Aspect-ratio: 1:1
Border-radius: rounded-full
Border: 4px solid gold (#C9A961)
Object-fit: cover
Shadow: shadow-lg
Size: w-48 h-48 (Fit slide, desktop)
```

---

## Slide-by-Slide Implementation Specs

### Slide 1: Title (TitleCard)

**Layout:** Full-Bleed Dramatic

**Image:**
- File: `/images/KD_hero_1920x1080.jpeg`
- Aspect ratio: 16:9
- Object-fit: cover
- Position: Background, full viewport width/height

**Gradient Overlay:**
- Direction: Linear, left to right
- Start (60% from left): `rgba(0,0,0,0)` (transparent)
- End (100%): `rgba(0,0,0,0.85)` (nearly opaque black)
- Purpose: Create text contrast on right side

**Text Positioning:**
- Container: Right side, 40% width
- Alignment: Flex column, justify-center
- Padding: px-8 (mobile) → px-16 (desktop)
- Text color: White

**Elements:**

1. **H1:** "Grounded Structure Serving Expansive Vision"
   - Class: `text-5xl lg:text-8xl font-bold text-white leading-tight`
   - Max-width: `max-w-2xl`
   - Margin: `mb-4`

2. **Blurb:** (From title.json)
   - Container: Lavender/20 background + gold border (per quote card spec)
   - Class: `text-base lg:text-lg italic text-white/90 leading-relaxed`
   - Margin: `mb-6`

3. **Quote:** "Talking about your love life..."
   - Class: `text-xl lg:text-2xl italic text-white/80 leading-snug`
   - Font: Crimson Text
   - Max-width: `max-w-xl`
   - Margin: `mb-8`

4. **Footer:** Contact info
   - Class: `text-sm text-white/70`
   - Position: Absolute bottom-right
   - Padding: `p-8`

**Mobile Behavior:**
- Stack vertically: Image top, text below
- Remove gradient (text on solid cream background below image)
- Image height: `h-[50vh]`
- Text container: Full width, py-12

**Implementation Notes:**
- Use `relative` container with `absolute` positioned image + gradient
- Text in `relative` z-index above image
- Test gradient opacity for readability
- Ensure proper contrast ratio (WCAG AA: 4.5:1)

---

### Slide 2: Alignment (TextSlide)

**Layout:** Asymmetric Left-Aligned

**Background:**
- Color: Cream `#FAF8F3` (bg-cream)
- Padding: `py-12 lg:py-20 px-6 lg:px-16`

**Container:**
- Max-width: `max-w-6xl`
- Margin: `mx-auto`

**Elements:**

1. **Blurb:** (If exists in alignment.json)
   - Class: `text-base italic text-charcoal/80 mb-8`
   - Max-width: `max-w-3xl`

2. **H1:** "Alignment & Intention"
   - Class: `text-5xl lg:text-8xl font-bold text-plum leading-tight mb-8`

3. **Body:** "Devotion Meets Discipline..." (from alignment.json)
   - Renderer: `<ReactMarkdown>` for bold markdown (**phrase**)
   - Class: `text-base lg:text-lg text-charcoal leading-relaxed prose prose-lg`
   - Max-width: `max-w-3xl`
   - Margin: `mb-10`

4. **Quote:** "But, when the default is privacy..."
   - Container: Lavender/20 background card (per spec above)
   - Class: `text-2xl lg:text-3xl italic text-charcoal leading-snug`
   - Font: Crimson Text
   - Max-width: `max-w-2xl`

**Mobile Behavior:**
- All elements stack naturally
- Reduce H1 to text-5xl
- Reduce quote to text-2xl
- Maintain generous spacing (mb-6 to mb-8)

**Implementation Notes:**
- Use `ReactMarkdown` with `remark-gfm` for bold rendering
- Set prose class for proper markdown typography
- Quote card gets lavender background + gold left border
- Test line-height for readability (leading-relaxed = 1.625)

---

### Slide 3: Help (TableSlide → HelpCards)

**Layout:** Cards on Dark Background

**Background:**
- Color: Deep plum `#6B1F5C` (bg-plum)
- Padding: `py-12 lg:py-20 px-6 lg:px-16`

**Container:**
- Max-width: `max-w-5xl`
- Margin: `mx-auto`

**Elements:**

1. **H1:** "How I Might Help"
   - Class: `text-5xl lg:text-8xl font-bold text-white leading-tight mb-8 text-center`

2. **Blurb:** (If exists)
   - Class: `text-base lg:text-lg italic text-white/80 mb-12 max-w-3xl mx-auto text-center`

3. **Cards Grid:**
   - Container: `flex flex-col gap-4`
   - 5 cards total (one per table row)

**Card Design:**
- Background: White (bg-white)
- Padding: `p-6 lg:p-8`
- Border-radius: `rounded-xl`
- Shadow: `shadow-lg`
- Layout: Flex column

**Card Content (per row):**
1. **Area Title:** (e.g., "Publishing")
   - Class: `text-xl lg:text-2xl font-semibold text-plum mb-2`

2. **Solution:** (e.g., "Organize and refine...")
   - Class: `text-base text-charcoal leading-relaxed mb-2`

3. **Tools:** (e.g., "Notion, Coda...")
   - Class: `text-sm text-charcoal/70 italic`

**Mobile Behavior:**
- Cards stack vertically (already flex-col)
- Full width on mobile
- Maintain gap-4 spacing
- Reduce padding to p-6

**Implementation Notes:**
- Convert table rows to card components
- Dark plum background creates drama (Figma-inspired)
- White cards pop against dark background
- Easy to scan, mobile-friendly
- Test contrast: White on plum (WCAG AA)

---

### Slide 4: Regenerative (MetricsLoop)

**Layout:** Light Background, Visual + Metrics Side-by-Side

**Background:**
- Color: White `#FFFFFF` (bg-white)
- Padding: `py-12 lg:py-20 px-6 lg:px-16`

**Container:**
- Max-width: `max-w-6xl`
- Margin: `mx-auto`
- Layout: Grid 2 columns (desktop), stack (mobile)

**Elements:**

1. **H1:** "Measurements of Flow"
   - Class: `text-5xl lg:text-8xl font-bold text-plum leading-tight mb-8 text-center lg:col-span-2`

2. **Blurb:** (If exists)
   - Class: `text-base italic text-charcoal/80 mb-12 text-center lg:col-span-2 max-w-3xl mx-auto`

3. **Visual (Left 50%):**
   - Component: Three interlocking rings SVG (current)
   - File: `/images/interlocking_rings_with_labels_simple_spaced_v3.svg`
   - Container: Flex, items-center, justify-center
   - Max-width: `max-w-md mx-auto`

4. **Metrics (Right 50%):**
   - Container: Flex column, gap-3, justify-center
   - 4 metric pills (per spec above)

**Metric Pill Structure:**
```jsx
<div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-plum/10 border border-plum/30">
  <span className="text-gold">✓</span>
  <span className="text-sm text-charcoal">{metric text}</span>
</div>
```

**Metrics Content (from regenerative.json):**
1. "Clear project scopes and deliverables"
2. "Fewer rushed decisions and reactive fixes"
3. "Budget transparency and predictable costs"
4. "Sustainable workload, no burnout cycles"

**Mobile Behavior:**
- Stack: Visual top, metrics bottom
- Visual centered, full-width
- Metrics stack vertically, gap-3
- Each pill full-width on mobile

**Implementation Notes:**
- Pills currently implemented, refine styling
- Checkmark icon in gold (#C9A961)
- Light background keeps it clean (not dark like v1.0 Option B)
- Test pill contrast and readability

---

### Slide 5: Fit (TextSlide with Portrait)

**Layout:** Three-Column (Domain Knowledge | Portrait | Operations Excellence)

**Background:**
- Color: Cream `#FAF8F3` (bg-cream)
- Padding: `py-12 lg:py-20 px-6 lg:px-16`

**Container:**
- Max-width: `max-w-7xl`
- Margin: `mx-auto`

**Elements:**

1. **H1:** "Why I'm a Fit"
   - Class: `text-5xl lg:text-8xl font-bold text-plum leading-tight mb-12 text-center`

2. **Blurb:** (If exists)
   - Class: `text-base italic text-charcoal/80 mb-12 text-center max-w-3xl mx-auto`

3. **Three-Column Grid:**
   - Container: `grid grid-cols-1 lg:grid-cols-3 gap-8 lg:gap-12 items-center`

   **Column 1: Domain Knowledge**
   - Bullets from fit.json domainKnowledge array
   - Each bullet:
     - **Title:** `text-base font-semibold text-plum mb-1` (markdown bold)
     - **Description:** `text-sm text-charcoal leading-relaxed`
     - Spacing: `gap-4` between bullets
   - Use `<ReactMarkdown>` for bold rendering

   **Column 2: Portrait**
   - Image: `/images/david_headshot.jpg`
   - Size: `w-48 h-48` (desktop), `w-32 h-32` (mobile)
   - Class: `rounded-full border-4 border-gold shadow-lg mx-auto`
   - Object-fit: cover

   **Column 3: Operations Excellence**
   - Bullets from fit.json operationsExcellence array
   - Same styling as Column 1

4. **Testimonial:** (Below three-column grid)
   - Container: Lavender background card (per quote spec)
   - **Quote:** `text-lg italic text-charcoal leading-snug`
   - **Attribution:** `text-sm text-charcoal mt-2 not-italic`
   - **Title:** `text-xs text-charcoal/70 not-italic`
   - Max-width: `max-w-3xl mx-auto`
   - Margin: `mt-12`

5. **Profile Link:** (Below testimonial)
   - Container: Cream background card with plum border
   - Text: "More detail in my personal profile..."
   - Link: Plum button "View Full Profile"
   - Link target: `/appendix#appendix-profile`
   - Margin: `mt-8`

**Mobile Behavior:**
- Grid stacks: Portrait top, Domain below, Operations below
- Portrait centered, smaller (w-32 h-32)
- Bullets full-width
- Testimonial full-width below

**Implementation Notes:**
- TextSlide component needs portrait rendering logic
- ReactMarkdown for **bold** bullet titles
- Circular portrait with gold border (4px)
- Testimonial gets lavender card treatment
- Profile link subtle but clear

---

### Slide 6: Engagement (OfferCards)

**Layout:** Three Cards with Depth

**Background:**
- Color: White `#FFFFFF` (bg-white)
- Padding: `py-12 lg:py-20 px-6 lg:px-16`

**Container:**
- Max-width: `max-w-7xl`
- Margin: `mx-auto`

**Elements:**

1. **H1:** "Engagement Path"
   - Class: `text-5xl lg:text-8xl font-bold text-plum leading-tight mb-8 text-center`

2. **Blurb:** (If exists)
   - Class: `text-base italic text-charcoal/80 mb-12 text-center max-w-3xl mx-auto`

3. **Cards Grid:**
   - Container: `grid grid-cols-1 lg:grid-cols-3 gap-8`
   - 3 pricing tiers

**Card Design:**
```
Background: White (bg-white)
Padding: p-8
Border-radius: rounded-2xl
Shadow: shadow-lg
Border: 2px solid transparent
Transition: all 150ms ease

Featured Card (Ongoing Partnership):
  Border: 2px solid gold (#C9A961)
  Shadow: shadow-xl
  Badge: "Recommended" in gold at top

Hover (all cards):
  Transform: scale(1.02)
  Shadow: shadow-2xl
```

**Card Content:**
1. **Badge:** (Featured only)
   - Text: "Recommended"
   - Class: `text-xs font-semibold text-gold uppercase tracking-wide mb-2`

2. **Icon:** (Optional emoji/graphic)
   - Size: `text-4xl mb-4`

3. **Title:** (e.g., "Starter Sprint")
   - Class: `text-2xl font-semibold text-plum mb-4`

4. **Description:** (From engagement.json)
   - Class: `text-base text-charcoal leading-relaxed mb-6`

5. **Price:** (e.g., "$1,200–$1,500")
   - Class: `text-4xl font-bold text-plum mb-2`

6. **Per:** (e.g., "per sprint")
   - Class: `text-sm text-charcoal/70`

4. **Note Section:** (Below cards)
   - Text: Monthly flexibility + risk reversal language
   - Class: `text-sm italic text-charcoal/80 text-center max-w-2xl mx-auto mt-8`

**Mobile Behavior:**
- Cards stack vertically
- Full-width on mobile
- Featured card still has gold border
- Maintain shadow depth

**Implementation Notes:**
- Featured card: Ongoing Partnership (middle)
- Shadows create depth (Figma/Layla inspired)
- Hover lift effect (scale 1.02)
- Note text below for flexibility/risk reversal

---

### Slide 7: CTA (CTASection)

**Layout:** Full Black Dramatic

**Background:**
- Color: Pure black `#000000` (bg-black)
- Padding: `py-16 lg:py-24 px-6 lg:px-16`

**Container:**
- Max-width: `max-w-4xl`
- Margin: `mx-auto`
- Text alignment: Center

**Elements:**

1. **H1:** "Gratitude & Invitation"
   - Class: `text-5xl lg:text-7xl font-bold text-white leading-tight mb-6`

2. **Blurb:** "I hold deep respect for the foundation Kali Das has helped build..."
   - Class: `text-base lg:text-lg italic text-white/90 leading-relaxed mb-8 max-w-2xl mx-auto`

3. **Body:** "I'd love to explore how we might reclaim 4–6 hours..."
   - Class: `text-base lg:text-lg text-white/80 leading-relaxed mb-10 max-w-3xl mx-auto`

4. **CTA Intro:** "To get started, reach out by email or book a discovery call..."
   - Class: `text-base text-white/70 mb-6`

5. **Buttons:**
   - Container: `flex flex-col sm:flex-row gap-4 justify-center items-center`

   **Email Button:**
   - Background: Gold `#C9A961` (bg-gold)
   - Text: Charcoal `#2B2B2B` (text-charcoal)
   - Class: `px-8 py-4 rounded-full font-semibold text-base shadow-sm hover:shadow-md transition-all`
   - Text: "Email Me"
   - Link: `mailto:david@opsstudio.xyz`

   **Calendar Button:**
   - Background: Gold `#C9A961` (same as email for consistency on black)
   - Text: Charcoal `#2B2B2B`
   - Class: Same as email button
   - Text: "Book a Call"
   - Link: `https://calendly.com/...` (from cta.json)

6. **Quote:** "And I'm going to be as bold as to say..."
   - Container: `mt-12 max-w-2xl mx-auto`
   - Border-left: 4px solid gold
   - Padding: `pl-6`
   - Class: `text-xl lg:text-2xl italic text-white/70 leading-snug`
   - Font: Crimson Text

**Mobile Behavior:**
- Buttons stack vertically (flex-col)
- Full-width buttons on mobile (w-full sm:w-auto)
- Reduce H1 to text-5xl
- Maintain generous spacing

**Implementation Notes:**
- Pure black background for maximum drama
- Both buttons gold (context-dependent for dark bg)
- White text at varied opacities (90/80/70) for hierarchy
- Quote with gold border for visual interest
- Test contrast ratios (white on black = perfect)
- Memorable ending, impossible to miss CTAs

---

## Responsive Breakpoints

**Tailwind Defaults:**
- **Mobile:** < 640px (base styles)
- **sm:** 640px - 767px
- **md:** 768px - 1023px
- **lg:** 1024px+ (desktop)
- **xl:** 1280px+ (large desktop)

**Typography Responsive Pattern:**
```jsx
<h1 className="text-5xl lg:text-8xl font-bold">
  // Mobile: 48px, Desktop (lg): 96px
</h1>
```

**Layout Responsive Pattern:**
```jsx
<div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-8">
  // Mobile: stack, Desktop: 3 columns
</div>
```

**Spacing Responsive Pattern:**
```jsx
<section className="py-12 lg:py-20 px-6 lg:px-16">
  // Mobile: less padding, Desktop: generous padding
</section>
```

---

## Animation & Interaction

**Decision:** No page load animations (Option B selected)
- Instant load for speed
- Static but professional
- Simpler implementation
- User can add subtle fades later if desired

**Hover States (Still Active):**

**Buttons:**
```css
transition: all 150ms ease
hover:bg-opacity-90 hover:scale-105 hover:shadow-md
```

**Cards:**
```css
transition: all 150ms ease
hover:scale-102 hover:shadow-xl
```

**Links:**
```css
transition: color 100ms ease
hover:text-gold hover:underline
```

---

## Implementation Plan

### Step 1: Create Branch
```bash
git checkout develop
git checkout -b design/title-prototypes
```

### Step 2: Update Tailwind Config (If Needed)
Verify Inter is default font:
```js
// tailwind.config.ts
fontFamily: {
  sans: ['Inter', 'sans-serif'],  // Default
  display: ['Inter', 'sans-serif'], // Update from Playfair
  quote: ['Crimson Text', 'serif'],
}
```

### Step 3: Implement Title Slide
File: `components/slides/TitleCard.tsx`

**Changes:**
- Full-bleed image with gradient overlay
- Text on right side, white color
- Use `KD_hero_1920x1080.jpeg`
- Implement responsive stacking

**Test:**
- Gradient opacity for text readability
- Mobile stack behavior
- Footer positioning

### Step 4: Implement Alignment Slide
File: `components/slides/TextSlide.tsx`

**Changes:**
- Cream background
- Large Inter headlines (text-8xl)
- ReactMarkdown for body
- Lavender quote card with gold border

**Test:**
- Typography scale impact
- Quote card styling
- Mobile responsive

### Step 5: Start Dev Server
```bash
npm run dev
```

### Step 6: Browser Testing
**Desktop:**
- Title slide: Impact, readability, gradient
- Alignment slide: Typography scale, spacing, quote styling
- Color contrast check

**Mobile:**
- Title slide: Stack behavior, text readability
- Alignment slide: Typography scaling, touch targets

### Step 7: Document Feedback
Create: `design/prototype-feedback-v1.1.md`
- What works well
- What needs adjustment
- Questions/concerns
- Next iterations

### Step 8: Commit
```bash
git add components/slides/TitleCard.tsx components/slides/TextSlide.tsx
git commit -m "feat: design prototypes - Title (full-bleed) + Alignment (typography test)

Title Slide (Full-Bleed Dramatic):
- Use KD_hero_1920x1080.jpeg as full-bleed background
- Dark gradient overlay (60% transparent → 85% black)
- Text positioned right with white color
- Inter 8xl headline (96px desktop, 48px mobile)
- Lavender quote card with gold border
- Mobile: Stack image top, text below

Alignment Slide (Typography + Color Test):
- Cream background
- Inter 8xl headline in plum
- ReactMarkdown for body bold rendering
- Lavender quote card styling
- Mobile: Scale down to 5xl headline

Testing O.school-inspired bold sans-serif with dramatic scale.

See: design/design-plan-v1.1.md for full specs
"
```

---

## Success Criteria for Prototypes

**Title Slide:**
- ✅ Cinematic, impactful first impression
- ✅ Text readable over gradient
- ✅ Inter headline feels bold and modern
- ✅ Mobile stack works cleanly
- ✅ Image quality good at 1920x1080

**Alignment Slide:**
- ✅ Typography scale feels dramatic but readable
- ✅ Cream background creates spaciousness
- ✅ Quote card visually distinct with lavender/gold
- ✅ Body text readable with bold markdown
- ✅ Mobile responsive without issues

**Overall:**
- ✅ O.school-inspired modern professional feel
- ✅ High contrast effective
- ✅ Sans-serif headlines work for KD's brand
- ✅ Color rhythm starts strong (image → cream → plum → white → etc.)
- ✅ Ready to apply system to remaining 5 slides

---

## Next Steps After Prototypes

1. **Review prototypes in browser** - David feedback
2. **Create design-plan-v1.2.md** (if adjustments needed) OR proceed
3. **Implement remaining 5 slides** with locked-in system
4. **Full browser testing** - all 7 slides scroll-through
5. **Polish & refinements** - spacing, contrast, details
6. **Merge to develop** - Complete design implementation
7. **Build & deploy preview** - Share with KD

**Timeline Estimate:**
- Prototypes (Title + Alignment): 1-2 hours
- Review & feedback: 30 min
- Remaining slides: 3-4 hours
- Polish: 1-2 hours
- **Total: 6-9 hours to complete design**

---

**Status:** Ready to prototype
**Next:** Implement Title + Alignment slides on design/title-prototypes branch
**Goal:** Browser preview within 2 hours

