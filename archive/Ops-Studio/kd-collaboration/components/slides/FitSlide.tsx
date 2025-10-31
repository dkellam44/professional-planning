import Image from "next/image";
import ReactMarkdown from "react-markdown";

type Column = {
  heading: string;
  bullets: string[];
};

type Testimonial = {
  quote: string;
  attribution: string;
  title: string;
};

type Props = {
  h1: string;
  blurb?: string;
  leftColumn: Column;
  rightColumn: Column;
  portrait: string;
  portraitMode?: "cover" | "contain";
  testimonial?: Testimonial;
  profileIntroText?: string;
  profileLinkText?: string;
  profileLinkHref?: string;
  caseStudiesNote?: string;
};

export default function FitSlide({
  h1,
  blurb,
  leftColumn,
  rightColumn,
  portrait,
  portraitMode = "cover",
  testimonial,
  profileIntroText,
  profileLinkText,
  profileLinkHref,
  caseStudiesNote,
}: Props) {
  return (
    <section className="py-8 lg:py-12 px-6 lg:px-16 bg-plum">
      <div className="max-w-7xl mx-auto">
        {/* H1: Reduced size for better viewport fit */}
        <h1 className="text-5xl lg:text-6xl font-bold text-white leading-tight mb-6 text-center">
          {h1}
        </h1>

        {/* Blurb: Centered - white text */}
        {blurb && (
          <p className="text-base italic text-white/80 mb-6 text-center max-w-3xl mx-auto leading-relaxed">
            {blurb}
          </p>
        )}

        {/* Three-Column Grid: Domain Knowledge | Portrait | Operations Excellence */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8 items-center mb-6">
          {/* Left Column: Domain Knowledge */}
          <div className="space-y-2">
            <h3 className="text-2xl lg:text-3xl font-bold text-gold mb-3">{leftColumn.heading}</h3>
            <ul className="space-y-2">
              {leftColumn.bullets.map((bullet, i) => (
                <li key={i} className="text-xs text-white/90 leading-relaxed">
                  <ReactMarkdown
                    components={{
                      strong: ({ children }) => (
                        <span className="font-semibold text-gold">{children}</span>
                      ),
                      p: ({ children }) => <>{children}</>,
                    }}
                  >
                    {bullet}
                  </ReactMarkdown>
                </li>
              ))}
            </ul>
          </div>

          {/* Center: Portrait - Circular with gold border */}
          <div className="flex items-center justify-center">
            <div className="relative w-48 h-48 rounded-full overflow-hidden border-4 border-gold shadow-lg">
              <Image
                src={portrait}
                alt="David Kellam"
                fill
                className={`object-${portraitMode}`}
              />
            </div>
          </div>

          {/* Right Column: Operations Excellence */}
          <div className="space-y-2">
            <h3 className="text-2xl lg:text-3xl font-bold text-gold mb-3">{rightColumn.heading}</h3>
            <ul className="space-y-2">
              {rightColumn.bullets.map((bullet, i) => (
                <li key={i} className="text-xs text-white/90 leading-relaxed">
                  <ReactMarkdown
                    components={{
                      strong: ({ children }) => (
                        <span className="font-semibold text-gold">{children}</span>
                      ),
                      p: ({ children }) => <>{children}</>,
                    }}
                  >
                    {bullet}
                  </ReactMarkdown>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Testimonial: White card on dark background */}
        {testimonial && (
          <div className="bg-white border-l-4 border-gold p-4 rounded-lg max-w-3xl mx-auto mb-6">
            <blockquote className="text-base italic text-charcoal leading-snug mb-2">
              "{testimonial.quote}"
            </blockquote>
            <footer className="text-xs text-charcoal/70 not-italic">
              — {testimonial.attribution}
              {testimonial.title && <span className="text-xs">, {testimonial.title}</span>}
            </footer>
          </div>
        )}

        {/* Profile Link Section */}
        {profileIntroText && profileLinkText && profileLinkHref && (
          <div className="text-center max-w-2xl mx-auto">
            <p className="text-xs text-white/80 mb-3">{profileIntroText}</p>
            <a
              href={profileLinkHref}
              className="inline-block px-8 py-4 bg-gold text-charcoal rounded-full font-semibold text-base shadow-sm hover:shadow-md hover:scale-105 transition-all duration-150"
            >
              {profileLinkText}
            </a>
          </div>
        )}

        {/* Case Studies Note */}
        {caseStudiesNote && (
          <p className="text-xs text-white/60 text-center mt-6">{caseStudiesNote}</p>
        )}
      </div>
    </section>
  );
}
