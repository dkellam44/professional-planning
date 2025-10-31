import SlideFrame from "@/components/ui/SlideFrame";
import TitleCard from "@/components/slides/TitleCard";
import TextSlide from "@/components/slides/TextSlide";
import TableSlide from "@/components/slides/TableSlide";
import MetricsLoop from "@/components/slides/MetricsLoop";
import FitSlide from "@/components/slides/FitSlide";
import OfferCards from "@/components/slides/OfferCards";
import CTASection from "@/components/slides/CTASection";
import { loadSlides } from "@/lib/utils/loadSlides";
import ReactMarkdown from "react-markdown";

export default async function Page() {
  const slides = await loadSlides();

  return (
    <main className="px-4 py-8 md:py-12 space-y-8 md:space-y-10">
      {/* Slide 1 */}
      <SlideFrame>
        <TitleCard
          deckTitle={slides.title.deckTitle}
          subtitle={slides.title.subtitle}
          quote={slides.title.quote}
          quoteAttribution={slides.title.quoteAttribution}
          image={slides.title.image}
          blurb={slides.title.blurb}
          footer={slides.title.footer}
        />
      </SlideFrame>

      {/* Slide 2 */}
      <SlideFrame>
        <TextSlide
          h1={slides.alignment.h1}
          body={<ReactMarkdown>{slides.alignment.bodyMdx}</ReactMarkdown>}
          blurb={slides.alignment.blurb}
          quote={slides.alignment.quote}
          quoteAttribution={slides.alignment.quoteAttribution}
        />
      </SlideFrame>

      {/* Slide 3 */}
      <SlideFrame>
        <TableSlide h1={slides.help.h1} rows={slides.help.rows} blurb={slides.help.blurb} />
      </SlideFrame>

      {/* Slide 4 */}
      <SlideFrame>
        <MetricsLoop h1={slides.regenerative.h1} bullets={slides.regenerative.metrics} blurb={slides.regenerative.blurb} />
      </SlideFrame>

      {/* Slide 5 */}
      <SlideFrame>
        <FitSlide
          h1={slides.fit.h1}
          blurb={slides.fit.blurb}
          leftColumn={slides.fit.leftColumn!}
          rightColumn={slides.fit.rightColumn!}
          portrait={slides.fit.portrait!}
          portraitMode={slides.fit.portraitMode as "cover" | "contain"}
          testimonial={slides.fit.testimonial}
          profileIntroText={slides.fit.profileIntroText}
          profileLinkText={slides.fit.profileLinkText}
          profileLinkHref={slides.fit.profileLinkHref}
          caseStudiesNote={slides.fit.caseStudiesNote}
        />
      </SlideFrame>

      {/* Slide 6 */}
      <SlideFrame>
        <OfferCards h1={slides.engagement.h1} cards={slides.engagement.cards} note={slides.engagement.note} blurb={slides.engagement.blurb} />
      </SlideFrame>

      {/* Slide 7 */}
      <SlideFrame>
        <CTASection
          h1={slides.cta.h1}
          body={slides.cta.body}
          email={slides.cta.email}
          calendarUrl={slides.cta.calendarUrl}
          ctaIntroText={slides.cta.ctaIntroText}
          emailButtonText={slides.cta.emailButtonText}
          calendarButtonText={slides.cta.calendarButtonText}
          quote={slides.cta.quote}
          quoteAttribution={slides.cta.quoteAttribution}
        />
      </SlideFrame>
    </main>
  );
}
