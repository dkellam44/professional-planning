# Design Plan v1.0

**Date:** 2025-10-14
**Status:** Initial design specification - ready for review
**Related:** `visual-analysis-notes.md`, `content-plan-v4.2-FINAL.md`

---

## Overview

This document presents comprehensive design specifications for the KD Collaboration project, based on visual inspiration analysis and content requirements. Each section offers 2-3 alternatives where appropriate, allowing for iterative decision-making.

**Workflow:**
1. Review this plan
2. Fill out `design-worksheet-v1.0.md` with selections
3. I'll create `design-plan-v1.1.md` with refined options
4. Prototype selected direction
5. Browser review → adjustments
6. Final implementation

---

## Design Philosophy

**Core Principles:**
- **Warm but Bold**: Combine Layla Martin's warmth with Figma's contrast
- **Grounded but Impactful**: Spacious layouts with dramatic moments
- **Professional but Approachable**: Authority without coldness
- **Modern but Timeless**: Current trends without being trendy

**Avoid:**
- Woo-woo psychedelic aesthetics
- Corporate coldness
- Dated spiritual clichés
- Cramped, busy layouts

---

## Color System

### Proposed Palette

**Option A: Bold Contrast (Recommended)**

**Base:**
- **Cream** `#FAF8F3` - Primary background
- **White** `#FFFFFF` - Alternate sections
- **Charcoal** `#2B2B2B` - Primary text

**Accent:**
- **Deep Plum** `#6B1F5C` - Full section backgrounds (richer than current)
- **Warm Gold** `#C9A961` - CTAs, emphasis (more prominent)
- **Lavender** `#D8A7C4` - Subtle accents
- **Sage** `#9BA88C` - Regenerative elements

**Dramatic:**
- **Pure Black** `#000000` - CTA slide background
- **Pure White** - Text on dark backgrounds

**Option B: Softer Approach**

Keep current palette but:
- Increase plum saturation slightly
- Make gold more vibrant
- Add one black section (CTA only)

**Option C: Maximum Drama**

All of Option A plus:
- **Very Deep Plum** `#5B2149` - Even darker for title slide
- **Bright Gold** `#D4AF66` - Higher contrast CTAs
- Multiple black sections

### Color Usage Guidelines

**Backgrounds (Recommended Rhythm):**

**Option A: Alternating Drama**
1. Title: Full-bleed image (or deep plum)
2. Alignment: Cream
3. Help: Deep plum or charcoal
4. Regenerative: White
5. Fit: Cream
6. Engagement: White
7. CTA: Pure black

**Option B: Conservative**
1. Title: Image with gradient
2. All other slides: Cream/white only
3. CTA: Deep plum (not black)

**Option C: Bold Rhythm**
1. Title: Image with overlay
2. Alignment: Cream
3. Help: Deep plum
4. Regenerative: Black
5. Fit: Cream
6. Engagement: Deep plum
7. CTA: Black

### Text Color Rules

- **On cream/white**: Charcoal `#2B2B2B`
- **On plum/black**: Pure white `#FFFFFF`
- **Accents on light**: Deep plum for headers
- **Accents on dark**: Warm gold for emphasis

### CTA/Button Colors

**Option A: Gold Primary**
- Background: Warm gold `#C9A961`
- Text: Charcoal `#2B2B2B`
- Hover: Darker gold `#B39651`
- Works on: Light and dark backgrounds

**Option B: Plum Primary**
- Background: Deep plum `#6B1F5C`
- Text: White
- Hover: Lighter plum
- Gold for secondary CTAs

**Option C: Context-Dependent**
- On light backgrounds: Plum buttons
- On dark backgrounds: Gold buttons
- Maximum contrast approach

---

## Typography System

### Font Families

**Current:**
- **Display**: Playfair Display (serif)
- **Body**: Inter (sans-serif)
- **Quote**: Crimson Text (serif)

**Recommendation**: Keep current families, adjust sizes and usage

### Size Scale Options

**Option A: Dramatic Scale (Recommended)**

**Headings:**
- **H1**: `text-8xl` (96px) - Playfair Display, font-bold
- **H2**: `text-5xl` (48px) - Playfair Display, font-semibold
- **H3**: `text-3xl` (30px) - Inter, font-semibold

**Body:**
- **Body**: `text-lg` (18px) - Inter, font-normal, leading-relaxed
- **Small**: `text-sm` (14px) - Inter, font-normal

**Special:**
- **Quote**: `text-3xl` (30px) - Crimson Text, italic
- **Stats/Numbers**: `text-7xl` (72px) - Inter, font-bold

**Ratio**: H1 is 5.3x body size (dramatic)

**Option B: Moderate Scale**

**Headings:**
- **H1**: `text-7xl` (72px) - Playfair Display, font-bold
- **H2**: `text-4xl` (36px) - Playfair Display, font-semibold
- **H3**: `text-2xl` (24px) - Inter, font-semibold

**Body:**
- **Body**: `text-base` (16px) - Inter, font-normal
- **Small**: `text-sm` (14px) - Inter, font-normal

**Ratio**: H1 is 4.5x body size (less extreme)

**Option C: Maximum Drama**

**Headings:**
- **H1**: `text-9xl` (128px) - Playfair Display, font-bold
- **H2**: `text-5xl` (48px) - Playfair Display, font-semibold
- **H3**: `text-3xl` (30px) - Inter, font-semibold

**Body:**
- **Body**: `text-lg` (18px) - Inter, font-normal

**Ratio**: H1 is 7.1x body size (very dramatic)

### Heading Style Options

**Option A: Serif Headlines (Recommended)**
- H1 & H2: Playfair Display (warm, sophisticated)
- H3: Inter (clean hierarchy break)
- Maintains warmth and elegance

**Option B: All Sans**
- All headings: Inter
- Modern, clean, O.school-inspired
- May feel too corporate for KD

**Option C: Mixed**
- H1: Playfair Display (main impact)
- H2 & H3: Inter (clarity)
- Balance warmth and modernity

### Quote Styling

**Option A: Lavender Background Card**
- Background: Lavender `#D8A7C4` at 20% opacity
- Padding: p-6
- Border-left: 4px solid gold
- Font: Crimson Text, italic, text-2xl
- Creates visual distinction

**Option B: Gold Border Only**
- No background
- Border-left: 6px solid gold
- Padding-left: pl-6
- Font: Crimson Text, italic, text-3xl
- Cleaner, more minimal

**Option C: Large Centered**
- No background or border
- Centered text
- Font: Crimson Text, italic, text-4xl
- Maximum impact, gallery-like

### Button/CTA Styling

**Option A: Rounded Bold**
- Padding: px-8 py-4
- Border-radius: rounded-full
- Font: Inter, semibold, text-base
- Shadow: subtle drop shadow
- Transition: smooth hover (150ms)

**Option B: Pill Shape**
- Padding: px-10 py-3
- Border-radius: rounded-full (extreme)
- Font: Inter, semibold, uppercase, text-sm, tracking-wide
- No shadow
- Modern, clean

**Option C: Subtle Rounded**
- Padding: px-6 py-3
- Border-radius: rounded-lg
- Font: Inter, medium, text-base
- Border: 2px solid (same as bg color)
- Elegant, understated

---

## Slide-by-Slide Design Specifications

### Slide 1: Title (TitleCard)

**Layout Options:**

**Option A: Full-Bleed Dramatic (Recommended)**

**Structure:**
- Full-width KD hero image (16:9 landscape: 1920x1080)
- Dark gradient overlay on right 40%
- KD positioned left facing right
- Text on right over gradient

**Elements:**
- **H1**: "Grounded Structure Serving Expansive Vision"
  - text-8xl or text-9xl, Playfair, white, font-bold
  - Max-width for readability
- **Subtitle**: "Operations support for KamalaDevi McClure"
  - text-2xl, Inter, white/90, font-normal
  - mt-4
- **Quote**: "Talking about your love life..."
  - text-xl, Crimson, italic, white/80
  - mt-6, max-width
- **Footer**: Contact info
  - text-sm, Inter, white/70
  - Absolute bottom-right

**Gradient:**
- Linear gradient: transparent → rgba(0,0,0,0.8)
- Starts at 60% from left

**Pros:**
- Cinematic, impactful
- Establishes authority immediately
- Works beautifully with KD's professional photo
- Inspiration: Speaker hero + Layla Martin heroes

**Cons:**
- Complex responsive behavior
- Gradient must be tuned carefully

---

**Option B: Split-Screen Modern**

**Structure:**
- Left 40%: KD hero image (4:5 portrait: 1200x1500)
- Right 60%: Deep plum background `#6B1F5C`
- KD facing right (into content area)

**Elements:**
- **Image**: Rounded corners (rounded-r-3xl on left side only)
- **H1**: On plum background
  - text-8xl, Playfair, white, font-bold
  - Padding: px-12, py-16
- **Subtitle**: Below H1
  - text-2xl, Inter, white/90
- **Quote**: In lavender/cream callout box
  - Background: lavender `#D8A7C4` at 30%
  - Padding: p-6, rounded-xl
  - mt-8

**Pros:**
- Clean, modern composition
- Easier responsive (stacks on mobile)
- Bold plum creates impact
- Inspiration: Figma split layouts

**Cons:**
- Less cinematic than full-bleed
- Uses more color upfront

---

**Option C: Contained Gallery**

**Structure:**
- Cream background
- KD image in large rounded rectangle (not full-bleed)
- Text overlapping bottom of image OR beside image

**Elements:**
- **Image**: Large but contained, rounded-2xl
- **H1**: Could overlay image bottom OR beside on cream
  - If overlay: dark gradient behind text
  - If beside: charcoal text on cream
- **Spacious composition**: More breathing room

**Pros:**
- Gallery-like sophistication
- Most spacious option
- Unique, unexpected

**Cons:**
- Less immediate impact
- May feel too minimal for title slide

---

**Mobile Behavior:**
- **Option A**: Stack vertically, image top, text below (no gradient)
- **Option B**: Stack vertically, image full-width top, plum content below
- **Option C**: Stack naturally

**Recommendation**: Start with Option A or B prototypes, test impact

---

### Slide 2: Alignment & Intention (TextSlide)

**Layout Options:**

**Option A: Asymmetric Split**

**Structure:**
- Cream background
- Left 65%: Content
- Right 35%: Circular portrait (optional, could be decorative element)

**Elements:**
- **H1**: "Alignment & Intention"
  - text-7xl, Playfair, plum, font-bold
  - mb-8
- **Body**: "Devotion Meets Discipline..."
  - text-lg, Inter, charcoal, leading-relaxed
  - max-width for readability (prose class)
  - Bold phrase rendered with ReactMarkdown
- **Quote**: "But, when the default is privacy..."
  - Styled per quote option selected above
  - mt-8

**Pros:**
- Clean, readable
- Quote stands out
- Asymmetry creates visual interest

---

**Option B: Centered Elegance**

**Structure:**
- White background
- Centered content, max-width container

**Elements:**
- **H1**: Centered
  - text-7xl, Playfair, plum
- **Body**: Centered, narrower max-width
  - text-xl (larger than Option A)
  - More formal, gallery-like
- **Quote**: Centered below
  - text-3xl, Crimson, italic

**Pros:**
- Formal, elegant
- Maximum focus on words
- Breathing room

**Cons:**
- May feel too traditional

---

**Option C: Image Left, Text Right**

**Structure:**
- Split: 40% image / 60% text
- Image: Circular KD portrait or abstract visual
- Text: Cream background

**Elements:**
- Similar to Option A but with prominent image

**Pros:**
- Visual balance
- Personal connection (if portrait)

**Cons:**
- May feel redundant after title slide portrait

---

**Recommendation**: Option A (asymmetric) for dynamism, or Option B (centered) for elegance

---

### Slide 3: How I Might Help (TableSlide)

**Current**: Table with 3 columns (Area, Solution, Tools)

**Layout Options:**

**Option A: Cards on Dark Background (Recommended)**

**Structure:**
- Background: Deep plum `#6B1F5C` or charcoal
- 5 white/cream cards arranged vertically
- Each card contains one row from table

**Card Design:**
- **Background**: White or cream
- **Padding**: p-6
- **Border-radius**: rounded-xl
- **Shadow**: Subtle shadow for depth
- **Spacing**: gap-4 between cards

**Card Content:**
- **Area**: text-xl, Inter, semibold, plum
- **Solution**: text-base, Inter, charcoal, mt-2
- **Tools**: text-sm, Inter, charcoal/70, mt-1, italic

**Pros:**
- Breaks up table into scannable chunks
- Dark background creates drama (matches Figma inspiration)
- Mobile-friendly (cards stack)
- Inspiration: Figma services cards

**Cons:**
- More vertical space
- Different pattern from current

---

**Option B: Horizontal Scroll Table**

**Structure:**
- Keep table format
- Add horizontal scroll on mobile
- Min-width: 600px on table

**Table Design:**
- **Headers**: text-base, Inter, semibold, plum, uppercase, tracking-wide
- **Cells**: Generous padding (py-4 px-6)
- **Borders**: Light borders, rounded corners
- **Background**: Alternating row colors (white/cream)

**Pros:**
- Preserves current structure
- Fixes mobile readability (per worksheet v4.2)
- Familiar table pattern

**Cons:**
- Horizontal scroll can be awkward
- Less visually interesting than cards

---

**Option C: Three Columns of Cards**

**Structure:**
- Group by Area categories (if possible)
- 3 columns on desktop, stack on mobile
- Each column is a card with multiple items

**Pros:**
- Compact
- Grouped logically

**Cons:**
- May not fit content structure

---

**Blurb Placement:**
- Above cards/table
- text-base, italic, charcoal/80
- mb-8

**Recommendation**: Option A (cards on dark) for visual impact and mobile friendliness

---

### Slide 4: Measurements of Flow (MetricsLoop)

**Current**: Three interlocking rings visual + 4 metrics

**Layout Options:**

**Option A: Light Background, Visual Prominence**

**Structure:**
- Background: White or cream
- Layout: Visual left 50%, metrics right 50%
- Three rings graphic (current)

**Metrics Styling (Pills/Badges):**
- Each metric in a pill/badge
- **Background**: Plum `#6B1F5C` at 10% opacity
- **Border**: 1px solid plum at 30%
- **Padding**: px-4 py-2
- **Border-radius**: rounded-full
- **Icon**: Checkmark icon (✓) before text in gold
- **Text**: text-sm, Inter, charcoal
- **Spacing**: gap-3, stack vertically

**Visual:**
- Three interlocking rings (current SVG)
- Colors: Plum, gold, sage
- Centered in left 50%

**Pros:**
- Clean, modern
- Metrics easy to scan
- Light background maintains spaciousness

---

**Option B: Dark Background, Contained Card**

**Structure:**
- Background: Deep plum or charcoal
- Content in white rounded card (contained)
- Card contains visual + metrics

**Card Design:**
- Background: White
- Padding: p-10
- Border-radius: rounded-2xl
- Shadow: Large shadow
- Inspiration: Figma chart cards

**Metrics:**
- Same pills as Option A
- Inside white card

**Pros:**
- Dramatic background creates impact
- Card contains and focuses content
- Inspiration: Figma pattern

**Cons:**
- May feel too enclosed

---

**Option C: Visual Top, Metrics Bottom**

**Structure:**
- Stack vertically
- Visual full-width at top
- Metrics in 2x2 grid below

**Metrics as Large Cards:**
- Each metric in its own card
- Larger text
- Icon prominent

**Pros:**
- Gives metrics more prominence
- Symmetrical grid

**Cons:**
- Takes more vertical space
- Less cohesive with visual

---

**Blurb:**
- Above visual/metrics
- Same styling as other blurbs

**Recommendation**: Option A for clean modern look, or Option B for drama

---

### Slide 5: Why I'm a Fit (TextSlide with Portrait)

**Current Content**: Left column (Domain Knowledge), Right column (Operations Excellence), Portrait, Testimonial

**Layout Options:**

**Option A: Three-Column Layout**

**Structure:**
- White background
- Three equal columns (desktop)
- Left: Domain Knowledge bullets
- Center: Portrait (circular)
- Right: Operations Excellence bullets

**Portrait:**
- **Size**: Large circular image (w-48 h-48 or larger)
- **Border**: 4px solid gold
- **Centering**: Vertically centered with bullet columns

**Bullets:**
- **Title of each bullet**: text-base, Inter, font-semibold, plum
- **Description**: text-sm, Inter, charcoal, mt-1
- **Spacing**: gap-4 between bullets
- ReactMarkdown for bold rendering

**Testimonial:**
- Below three columns
- Callout box with lavender background
- **Quote**: text-lg, Crimson, italic
- **Attribution**: text-sm, Inter, charcoal, mt-2
- **Title**: text-xs, charcoal/70

**Profile Link:**
- Below testimonial
- Card/callout with cream background
- **Text**: "More detail in my personal profile..."
- **Link**: Plum button "View Full Profile"

**Pros:**
- Portrait prominent, personal connection
- Symmetrical, balanced
- Inspiration: Layla Martin about sections

**Cons:**
- Complex responsive (stacks on mobile)

---

**Option B: Portrait Left, Two Columns Right**

**Structure:**
- Left 30%: Large circular portrait
- Right 70%: Two columns of bullets

**Portrait:**
- Very large (w-64 h-64)
- Gold border
- Vertically centered

**Pros:**
- Portrait more prominent
- Text area larger

---

**Option C: Portrait as Hero**

**Structure:**
- Portrait at top, full-width section
- Bullets in two columns below

**Portrait:**
- Large but not full-bleed
- Centered
- Prominent

**Pros:**
- Maximum portrait prominence
- Clear hierarchy

---

**Mobile Behavior:**
- Portrait stacks on top
- Columns stack vertically
- Testimonial full-width at bottom

**Recommendation**: Option A (three-column) for balance and symmetry

---

### Slide 6: Engagement Path (OfferCards)

**Current**: 3 pricing tiers

**Layout Options:**

**Option A: Cards with Depth (Recommended)**

**Structure:**
- Background: Cream
- Three cards side-by-side (desktop)
- Stack on mobile

**Card Design:**
- **Background**: White
- **Padding**: p-8
- **Border-radius**: rounded-2xl
- **Shadow**: Medium shadow (shadow-lg)
- **Border**: 2px solid transparent
- **Hover**: Lift slightly (transform scale), shadow increases

**Featured Tier (Ongoing Partnership):**
- **Border**: 2px solid gold
- **Shadow**: Larger (shadow-xl)
- **Badge**: "Popular" or "Recommended" at top in gold

**Card Content:**
- **Icon**: Large emoji or simple graphic at top
- **Title**: text-2xl, Playfair, plum, font-semibold
- **Description**: text-base, Inter, charcoal, mt-4, leading-relaxed
- **Price**: text-4xl, Inter, font-bold, plum, mt-6
- **Per**: text-sm, charcoal/70 (if applicable)

**Pros:**
- Modern, professional
- Depth creates visual interest
- Featured tier stands out
- Inspiration: Figma + Layla Martin cards

---

**Option B: Minimal Borders**

**Structure:**
- Same layout as Option A
- Cards with light borders instead of shadows
- Flatter, cleaner aesthetic

**Card Design:**
- **Border**: 2px solid plum at 20%
- **No shadow**
- **Hover**: Border becomes solid plum

**Pros:**
- Cleaner, more minimal
- Less visual weight

**Cons:**
- Less depth, may feel flat

---

**Option C: Colored Backgrounds**

**Structure:**
- Each card has different subtle background color
- Card 1: Lavender tint
- Card 2: Gold tint (featured)
- Card 3: Sage tint

**Pros:**
- Colorful, differentiated
- Visual variety

**Cons:**
- May feel too playful
- Harder to maintain professional tone

---

**Note Section:**
- Below cards
- text-sm, italic, charcoal/80
- Centered
- Max-width

**Recommendation**: Option A (depth with shadows) for modern professional look

---

### Slide 7: Gratitude & Invitation (CTASection)

**Layout Options:**

**Option A: Full Black Dramatic (Recommended)**

**Structure:**
- Background: Pure black `#000000`
- Content centered, max-width
- High contrast

**Elements:**
- **H1**: "Gratitude & Invitation"
  - text-7xl, Playfair, white, font-bold
  - mb-6
- **Blurb**: "I hold deep respect for the foundation Kali Das has helped build..."
  - text-lg, Inter, white/90, italic
  - max-width, mb-8
- **Body**: "I'd love to explore how we might reclaim 4–6 hours..."
  - text-lg, Inter, white/80, leading-relaxed
  - max-width, mb-8
- **CTA Intro**: "To get started, reach out by email or book a discovery call..."
  - text-base, white/70, mb-6
- **Buttons**: Side-by-side
  - Email button: Gold background `#C9A961`, charcoal text
  - Calendar button: Plum background `#6B1F5C`, white text (or both gold)
  - px-8 py-4, rounded-full, font-semibold
  - gap-4
- **Quote**: "And I'm going to be as bold as to say..."
  - text-2xl, Crimson, italic, white/70
  - mt-12, max-width
  - Gold left border

**Pros:**
- Maximum drama and impact
- Memorable ending
- Buttons impossible to miss
- Inspiration: Layla Martin dark sections

**Cons:**
- Very bold (may feel too dark)

---

**Option B: Deep Plum Background**

**Structure:**
- Background: Deep plum `#6B1F5C`
- Otherwise same as Option A

**Pros:**
- Dramatic but slightly softer than black
- Brand color consistency

**Cons:**
- Less contrast than pure black

---

**Option C: Lavender Gradient**

**Structure:**
- Background: Gradient from lavender to cream
- Text in charcoal
- Softer, warmer ending

**Elements:**
- Same layout as Option A
- Text colors adjusted for gradient background

**Pros:**
- Warm, inviting
- Gentle ending

**Cons:**
- Less dramatic impact
- May feel too soft for CTA

---

**Recommendation**: Option A (pure black) for maximum memorable impact

---

## Responsive Design Strategy

### Breakpoints

**Tailwind Default:**
- **sm**: 640px
- **md**: 768px
- **lg**: 1024px
- **xl**: 1280px

**Usage:**
- **Mobile**: Base styles
- **Tablet (md)**: 2-column layouts, larger type
- **Desktop (lg)**: Full layouts, maximum type sizes

### Typography Scaling

**Option A: Moderate Mobile Reduction**
- H1: text-5xl (mobile) → text-8xl (lg)
- H2: text-3xl (mobile) → text-5xl (lg)
- Body: text-base (mobile) → text-lg (lg)

**Option B: Aggressive Mobile Reduction**
- H1: text-4xl (mobile) → text-9xl (lg)
- Keep body same size
- Maximize contrast on desktop

**Recommendation**: Option A for balance

### Layout Patterns

**Mobile:**
- All columns stack vertically
- Cards full-width
- Images full-width or circular and centered
- Generous spacing maintained

**Desktop:**
- Multi-column layouts
- Side-by-side cards
- Split-screen compositions

---

## Component Styling Details

### Cards

**Standard Card:**
```
- Background: white or cream
- Padding: p-6 (mobile) → p-8 (desktop)
- Border-radius: rounded-xl
- Shadow: shadow-md or shadow-lg
- Transition: hover effects (150ms ease)
```

### Buttons

**Primary Button (Gold):**
```
- Background: #C9A961
- Text: #2B2B2B, font-semibold
- Padding: px-6 py-3 (mobile) → px-8 py-4 (desktop)
- Border-radius: rounded-full
- Shadow: shadow-sm
- Hover: bg darker, shadow-md, transform scale(1.02)
```

**Secondary Button (Plum):**
```
- Background: #6B1F5C
- Text: white, font-semibold
- Otherwise same as primary
```

### Images

**Circular Portrait:**
```
- Aspect-ratio: 1:1
- Border-radius: rounded-full
- Border: 4px solid gold
- Object-fit: cover
- Shadow: shadow-lg (optional)
```

**Hero Image:**
```
- Object-fit: cover
- Aspect-ratio: 16:9 (landscape) or 4:5 (portrait)
- Border-radius: rounded-2xl (if contained) or 0 (if full-bleed)
```

### Spacing

**Section Spacing:**
```
- Padding: py-12 (mobile) → py-20 (desktop)
- Max-width: max-w-7xl
- Margin: mx-auto
```

**Content Spacing:**
```
- Between elements: mb-6 or mb-8
- Between sections: mb-12 or mb-16
- Generous breathing room
```

---

## Animation & Interaction

### Hover States

**Cards:**
- Transform: scale(1.02)
- Shadow: Increase
- Transition: 150ms ease-in-out

**Buttons:**
- Background: Darken slightly
- Transform: scale(1.05)
- Shadow: Increase
- Transition: 150ms ease

**Links:**
- Color: Shift to gold (from plum)
- Underline: Fade in
- Transition: 100ms ease

### Page Load

**Option A: Subtle Fade-In**
- Elements fade in on scroll
- Stagger slightly (100ms between elements)
- Subtle, professional

**Option B: No Animation**
- Instant load
- Faster, simpler
- May feel static

**Option C: Slide-In**
- Elements slide in from bottom
- More dramatic
- May feel too much

**Recommendation**: Option A (subtle fade) or Option B (none) for professionalism

---

## Accessibility Considerations

### Contrast

**Minimum Requirements:**
- Normal text (18px): 4.5:1 contrast ratio
- Large text (24px+): 3:1 contrast ratio

**Test All Combinations:**
- Charcoal on cream: ✓ (high contrast)
- White on plum: Test and adjust if needed
- White on black: ✓ (maximum contrast)
- Charcoal on gold: Test (may need darker gold)

### Focus States

**All Interactive Elements:**
- Focus ring: 2px solid plum
- Offset: 2px
- Rounded to match element
- Visible keyboard navigation

### Semantic HTML

- Proper heading hierarchy (h1 → h2 → h3)
- ARIA labels for icons
- Alt text for all images
- Semantic nav, main, section elements

### Screen Reader Support

- Skip links to main content
- Proper form labels
- Descriptive link text (avoid "click here")

---

## Performance Optimization

### Images

**Optimization:**
- Use next/image for automatic optimization
- Provide width/height to prevent layout shift
- Use srcset for responsive images
- WebP format with JPEG fallback
- Lazy loading for below-fold images

**Sizes:**
- Hero images: Max 200KB
- Portrait: Max 100KB
- Icons: SVG when possible

### Fonts

**Optimization:**
- Use next/font for Playfair, Inter, Crimson
- Subset fonts (Latin only)
- Display: swap (prevent FOUT)
- Preload critical fonts

### CSS

- Tailwind purge in production
- Minimize custom CSS
- Critical CSS inline

---

## Implementation Priorities

### Phase 1: Foundation (Week 1)
1. **Color system**: Update Tailwind config with new palette
2. **Typography system**: Implement size scale, test headlines
3. **Component library**: Update SlideFrame, create Card, Button components

### Phase 2: Title Slide Prototypes (Week 1)
4. **Prototype A**: Full-bleed dramatic
5. **Prototype B**: Split-screen modern
6. **Review**: Select direction with David

### Phase 3: Slide Redesign (Week 2)
7. **Alignment slide**: Implement selected layout
8. **Help slide**: Cards or table with fixes
9. **Regenerative slide**: Metrics pills styling
10. **Fit slide**: Three-column with portrait
11. **Engagement slide**: Cards with depth
12. **CTA slide**: Black background drama

### Phase 4: Polish (Week 2)
13. **Responsive**: Test all breakpoints
14. **Accessibility**: Contrast, focus states, ARIA
15. **Performance**: Image optimization, font loading
16. **Animations**: Implement subtle interactions

### Phase 5: Browser Testing (Week 3)
17. **Desktop**: Chrome, Firefox, Safari
18. **Mobile**: iOS Safari, Android Chrome
19. **Tablet**: iPad, Android tablet
20. **Adjustments**: Fix any issues found

---

## Open Questions for Worksheet

### Critical Decisions

1. **Color Rhythm**: Option A, B, or C for slide backgrounds?
2. **Typography Scale**: Dramatic (A), Moderate (B), or Maximum (C)?
3. **Title Slide**: Full-bleed (A), Split-screen (B), or Contained (C)?
4. **Quote Styling**: Lavender background (A), Gold border (B), or Large centered (C)?
5. **Help Slide**: Cards on dark (A) or Horizontal scroll table (B)?
6. **Metrics**: Light background (A) or Dark with card (B)?
7. **Fit Slide**: Three-column (A), Portrait left (B), or Portrait hero (C)?
8. **CTA Background**: Pure black (A), Deep plum (B), or Lavender gradient (C)?

### Secondary Decisions

9. **Button Style**: Rounded bold (A), Pill shape (B), or Subtle (C)?
10. **Animations**: Subtle fade (A), None (B), or Slide-in (C)?
11. **H1 Font**: Serif (A), Sans (B), or Mixed (C)?
12. **CTA Buttons**: Both gold (A), Gold + plum (B), or Context-dependent (C)?

---

## Next Steps

1. **Review this document** - Read through all options
2. **Fill out design-worksheet-v1.0.md** - Select preferences for each option
3. **Add notes/feedback** - Any additional thoughts or concerns
4. **Schedule design review** - Discuss selections and create v1.1
5. **Prototype phase** - Build selected Title slide + one other slide for testing
6. **Iterate** - Refine based on browser preview

---

**Status:** Initial design plan complete
**Next:** design-worksheet-v1.0.md for decision-making
**Goal:** Finalize design direction and begin prototyping within 48 hours
