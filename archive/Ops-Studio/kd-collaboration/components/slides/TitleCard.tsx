import Image from "next/image";

type Props = {
  deckTitle: string;
  subtitle?: string;
  quote?: string;
  quoteAttribution?: string;
  image?: string | null;
  blurb?: string;
  footer?: string;
};

export default function TitleCard({ deckTitle, subtitle, quote, quoteAttribution, image, blurb, footer }: Props) {
  const hasImage = Boolean(image && image.trim().length > 0);

  // Full-bleed dramatic layout (design-plan-v1.1.md)
  if (hasImage) {
    return (
      <section className="relative w-full h-screen overflow-hidden">
        {/* Full-bleed background image */}
        <div className="absolute inset-0">
          <Image
            src={image as string}
            alt="KamalaDevi hero"
            fill
            className="object-cover"
            priority
          />
        </div>

        {/* Vertical gradient overlay (transparent top → dark bottom for text area) */}
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-black/40 to-black/90" />

        {/* Content anchored to bottom - no blurb, cleaner layout */}
        <div className="relative h-full flex flex-col justify-end px-8 lg:px-16 pb-12 lg:pb-20 max-w-7xl mx-auto">
          <div className="max-w-3xl lg:max-w-2xl">
            {/* H1: Deck title - constrained to prevent face coverage */}
            <h1 className="text-4xl lg:text-5xl font-bold text-white leading-tight mb-4 lg:mb-4">
              {deckTitle}
            </h1>

            {subtitle && (
              <p className="text-xl lg:text-xl text-white/90 font-normal mb-6 lg:mb-6">
                {subtitle}
              </p>
            )}

            {/* Quote - more prominent without blurb competition */}
            {quote && (
              <blockquote className="text-lg lg:text-lg italic text-white/90 leading-snug font-quote border-l-4 border-gold pl-6 lg:pl-6 mb-6 lg:mb-6">
                "{quote}"
                {quoteAttribution && (
                  <footer className="text-sm lg:text-sm text-white/70 mt-3 lg:mt-3 not-italic">
                    — {quoteAttribution}
                  </footer>
                )}
              </blockquote>
            )}

            {/* Footer in content flow */}
            {footer && (
              <div className="text-sm lg:text-base text-white/60 mt-4">
                {footer}
              </div>
            )}
          </div>
        </div>
      </section>
    );
  }

  // Fallback: No image layout (original grid layout for reference)
  return (
    <section className="py-12 lg:py-20 px-6 lg:px-16">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-5xl lg:text-8xl font-bold text-plum leading-tight mb-6">
          {deckTitle}
        </h1>
        {subtitle && (
          <p className="text-xl lg:text-2xl text-charcoal/80 mb-8">
            {subtitle}
          </p>
        )}
        {blurb && (
          <p className="text-base lg:text-lg text-charcoal/80 mb-8">
            {blurb}
          </p>
        )}
        {quote && (
          <blockquote className="text-2xl lg:text-3xl italic text-charcoal/80 border-l-4 border-gold pl-6">
            "{quote}"
            {quoteAttribution && (
              <footer className="text-sm text-charcoal/70 mt-2 not-italic">
                — {quoteAttribution}
              </footer>
            )}
          </blockquote>
        )}
        {footer && (
          <p className="text-sm text-charcoal/60 mt-8">
            {footer}
          </p>
        )}
      </div>
    </section>
  );
}
