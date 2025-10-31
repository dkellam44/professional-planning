type Props = {
  h1: string;
  body: string;
  email: string;
  calendarUrl: string;
  ctaIntroText?: string;
  emailButtonText?: string;
  calendarButtonText?: string;
  quote?: string;
  quoteAttribution?: string;
};

export default function CTASection({ h1, body, email, calendarUrl, ctaIntroText, emailButtonText, calendarButtonText, quote, quoteAttribution }: Props) {
  return (
    <section className="py-8 lg:py-12 px-6 lg:px-16 bg-black">
      <div className="max-w-4xl mx-auto text-center">
        {/* H1: Dramatic but slightly smaller than other slides */}
        <h1 className="text-5xl lg:text-7xl font-bold text-white leading-tight mb-6">
          {h1}
        </h1>

        {/* Body text */}
        <p className="text-base lg:text-lg text-white/80 leading-relaxed mb-10 max-w-3xl mx-auto">
          {body}
        </p>

        {/* CTA intro text */}
        {ctaIntroText && (
          <p className="text-base text-white/70 mb-6">{ctaIntroText}</p>
        )}

        {/* Buttons: Both gold on black background */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12">
          <a
            href={`mailto:${email}`}
            className="px-8 py-4 rounded-full bg-gold text-charcoal font-semibold text-base shadow-sm hover:shadow-md hover:scale-105 transition-all duration-150 w-full sm:w-auto"
          >
            {emailButtonText || "Email Me"}
          </a>
          <a
            href={calendarUrl}
            className="px-8 py-4 rounded-full bg-gold text-charcoal font-semibold text-base shadow-sm hover:shadow-md hover:scale-105 transition-all duration-150 w-full sm:w-auto"
          >
            {calendarButtonText || "Book a Call"}
          </a>
        </div>

        {/* Quote: Gold border for visual interest */}
        {quote && (
          <div className="max-w-2xl mx-auto">
            <blockquote className="border-l-4 border-gold pl-6">
              <p className="text-xl lg:text-2xl italic text-white/70 leading-snug font-quote">
                "{quote}"
              </p>
              {quoteAttribution && (
                <footer className="text-xs lg:text-sm text-white/70 mt-2 not-italic">
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
