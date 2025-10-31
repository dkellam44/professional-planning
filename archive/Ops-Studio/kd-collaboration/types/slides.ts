// Slide content type definitions

export interface TitleSlide {
  deckTitle: string;
  subtitle?: string;
  quote?: string;
  quoteAttribution?: string;
  image?: string;
  footer?: string;
  blurb?: string;
}

export interface TextSlide {
  h1: string;
  bodyMdx: string;
  quote?: string;
  quoteAttribution?: string;
  blurb?: string;
}

export interface TableRow {
  area: string; // renamed from "job"
  solution: string;
  tools: string;
}

export interface TableSlide {
  h1: string;
  blurb?: string;
  rows: TableRow[];
}

export interface RegenerativeSlide {
  h1: string;
  metrics: string[];
  blurb?: string;
}

export interface FitSlide {
  h1: string;
  bullets?: string[]; // keep for backward compat
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
  profileLinkText: string;
  profileLinkHref: string;
  caseStudiesNote?: string;
  portrait: string;
  portraitMode?: string;
  blurb?: string;
}

export interface EngagementCard {
  icon: string;
  title: string;
  desc: string;
  price: string;
}

export interface EngagementSlide {
  h1: string;
  cards: EngagementCard[];
  note?: string;
  blurb?: string;
}

export interface CTASlide {
  h1: string;
  body: string;
  email: string;
  calendarUrl: string;
  ctaIntroText?: string;
  emailButtonText?: string;
  calendarButtonText?: string;
  quote?: string;
  quoteAttribution?: string;
  blurb?: string;
}

// Main slides collection interface
export interface SlidesContent {
  title: TitleSlide;
  alignment: TextSlide;
  help: TableSlide;
  regenerative: RegenerativeSlide;
  fit: FitSlide;
  engagement: EngagementSlide;
  cta: CTASlide;
}
