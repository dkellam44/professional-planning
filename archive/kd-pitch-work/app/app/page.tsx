import SlideFrame from "@/components/slides/SlideFrame";
import TitleCard from "@/components/slides/TitleCard";
import TextSlide from "@/components/slides/TextSlide";
import TableSlide from "@/components/slides/TableSlide";
import MetricsLoop from "@/components/slides/MetricsLoop";
import OfferCards from "@/components/slides/OfferCards";
import CTASection from "@/components/slides/CTASection";
import NavBar from "@/components/navigation/NavBar";
import slides from "@/content/slides.json";

export default function Page() {
  const footer = "David Kellam • dkellam44@gmail.com • linkedin.com/in/dkellam • Berkeley, CA";

  return (
    <main className="px-4 py-8 md:py-12 space-y-8 md:space-y-10">
      {/* Slide 1 */}
      <SlideFrame>
        <TitleCard
          deckTitle={slides.title.deckTitle}
          subtitle={slides.title.subtitle}
          quote={slides.title.quote}
          image={slides.title.image}
          footer={footer}
        />
      </SlideFrame>

      {/* Slide 2 */}
      <SlideFrame>
        <TextSlide
          h1={slides.alignment.h1}
          body={<p>{slides.alignment.bodyMdx}</p>}
        />
      </SlideFrame>

      {/* Slide 3 */}
      <SlideFrame>
        <TableSlide h1={slides.help.h1} rows={slides.help.rows} blurb={slides.help.blurb} />
      </SlideFrame>

      {/* Slide 4 */}
      <SlideFrame>
        <MetricsLoop h1={slides.regenerative.h1} bullets={slides.regenerative.metrics} />
      </SlideFrame>

      {/* Slide 5 */}
      <SlideFrame>
        <TextSlide
          h1={slides.fit.h1}
          body={<ul className="list-disc pl-6">{slides.fit.bullets.map((b: string, i: number) => <li key={i}>{b}</li>)}</ul>}
        />
        <div className="mt-4">
          <a href={slides.fit.profileLinkHref} className="underline text-plum">{slides.fit.profileLinkText}</a>
        </div>
      </SlideFrame>

      {/* Slide 6 */}
      <SlideFrame>
        <OfferCards h1={slides.engagement.h1} cards={slides.engagement.cards} note={slides.engagement.note} />
      </SlideFrame>

      {/* Slide 7 */}
      <SlideFrame>
        <CTASection h1={slides.cta.h1} body={slides.cta.body} email={slides.cta.email} calendarUrl={slides.cta.calendarUrl} />
      </SlideFrame>

      <NavBar total={7} />
    </main>
  );
}
