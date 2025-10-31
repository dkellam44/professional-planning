import Image from "next/image";

type Props = {
  h1: string;
  body: React.ReactNode;
  icon?: React.ReactNode;
  blurb?: string;
  quote?: string;
  quoteAttribution?: string;
  portrait?: string;
  portraitMode?: "cover" | "contain";
};

export default function TextSlide({ h1, body, icon, blurb, quote, quoteAttribution, portrait, portraitMode = "cover" }: Props) {
  const hasPortrait = Boolean(portrait && portrait.trim().length > 0);

  // Dramatic typography + cream background (design-plan-v1.1.md)
  return (
    <section className="bg-cream py-8 lg:py-12 px-6 lg:px-16">
      <div className="max-w-6xl mx-auto">
        {/* Blurb above heading if exists */}
        {blurb && (
          <p className="text-base italic text-charcoal/80 mb-8 max-w-3xl">
            {blurb}
          </p>
        )}

        {/* H1: Dramatic scale (5xl → 8xl), Inter bold, plum */}
        <h1 className="text-5xl lg:text-7xl font-bold text-plum leading-tight mb-8 flex items-center gap-4">
          {icon && <span className="text-4xl lg:text-6xl">{icon}</span>}
          {h1}
        </h1>

        {/* Body + Portrait Grid (if portrait exists) */}
        <div className={hasPortrait ? "grid lg:grid-cols-[1fr_auto] gap-8 items-start" : ""}>
          {/* Body text: ReactMarkdown prose */}
          <div className="prose prose-lg prose-neutral max-w-3xl">
            <div className="text-base lg:text-lg text-charcoal leading-relaxed">
              {body}
            </div>
          </div>

          {/* Portrait: Circular with gold border */}
          {hasPortrait && (
            <div className="relative w-48 h-48 rounded-full overflow-hidden border-4 border-gold shadow-lg shrink-0 mx-auto lg:mx-0">
              <Image
                src={portrait as string}
                alt="David Kellam"
                fill
                className={`object-${portraitMode}`}
              />
            </div>
          )}
        </div>

        {/* Quote: Lavender background card with gold border */}
        {quote && (
          <div className="mt-10 max-w-2xl">
            <blockquote className="bg-lavender/20 border-l-4 border-gold p-6 rounded-lg">
              <p className="text-2xl lg:text-3xl italic text-charcoal leading-snug font-quote">
                "{quote}"
              </p>
              {quoteAttribution && (
                <footer className="text-sm text-charcoal/70 mt-2 not-italic">
                  — {quoteAttribution}
                </footer>
              )}
            </blockquote>
          </div>
        )}
      </div>
    </section>
  );
}
