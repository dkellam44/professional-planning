// lib/schemas.ts
import { z } from "zod";

// Helper — allow optional blurbs everywhere
const WithBlurb = z.object({ blurb: z.string().optional() });

// ===== Canonical schemas =====
export const TitleSlideSchema = z
  .object({
    deckTitle: z.string(),
    subtitle: z.string().optional(),
    quote: z.string().optional(),
    quoteAttribution: z.string().optional(),
    image: z.string().optional(),
    footer: z.string().optional(),
  })
  .merge(WithBlurb);

export const AlignmentSlideSchema = z
  .object({
    h1: z.string(),
    bodyMdx: z.string(),
    quote: z.string().optional(),
    quoteAttribution: z.string().optional(),
  })
  .merge(WithBlurb);

export const HelpSlideSchema = z
  .object({
    h1: z.string(),
    rows: z.array(
      z.object({
        area: z.string(), // renamed from "job"
        solution: z.string(),
        tools: z.string(),
      })
    ),
  })
  .merge(WithBlurb);

export const EngagementSlideSchema = z
  .object({
    h1: z.string(),
    cards: z.array(
      z.object({
        icon: z.string(),
        title: z.string(),
        desc: z.string(),
        price: z.string(), // keep string so ranges validate
      })
    ),
    note: z.string().optional(),
  })
  .merge(WithBlurb);

export const RegenerativeSlideSchema = z
  .object({
    h1: z.string(),
    metrics: z.array(z.string()),
  })
  .merge(WithBlurb);

export const FitSlideSchema = z
  .object({
    h1: z.string(),
    bullets: z.array(z.string()).optional(), // keep for backward compat
    leftColumn: z.object({
      heading: z.string(),
      bullets: z.array(z.string()),
    }).optional(),
    rightColumn: z.object({
      heading: z.string(),
      bullets: z.array(z.string()),
    }).optional(),
    testimonial: z.object({
      quote: z.string(),
      attribution: z.string(),
      title: z.string(),
    }).optional(),
    profileIntroText: z.string().optional(),
    profileLinkText: z.string(),
    profileLinkHref: z.string(),
    caseStudiesNote: z.string().optional(),
    portrait: z.string(),
    portraitMode: z.string().optional(),
  })
  .merge(WithBlurb);

export const CtaSlideSchema = z
  .object({
    h1: z.string(),
    body: z.string(),
    email: z.string().email(),
    calendarUrl: z.string().url(),
    ctaIntroText: z.string().optional(),
    emailButtonText: z.string().optional(),
    calendarButtonText: z.string().optional(),
    quote: z.string().optional(),
    quoteAttribution: z.string().optional(),
  })
  .merge(WithBlurb);

// ===== Legacy aliases expected by loadSlides.ts =====
// Do NOT add an "export { ... }" block at the bottom; these lines are enough.
export const TextSlideSchema = AlignmentSlideSchema; // for alignment
export const TableSlideSchema = HelpSlideSchema;     // for help
export const CTASlideSchema  = CtaSlideSchema;       // for cta
