import Image from "next/image";

type Props = {
  deckTitle: string;
  subtitle: string;
  quote: string;
  image: string;
  footer: string;
};

export default function TitleCard({ deckTitle, subtitle, quote, image, footer }: Props) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-5 gap-6 items-center">
      <div className="md:col-span-2">
        <div className="relative w-full aspect-[4/5] overflow-hidden rounded-xl ring-1 ring-gold/50 bg-white">
          <Image src={image} alt="Kamala Devi presenting" fill className="object-cover" />
        </div>
      </div>
      <div className="md:col-span-3">
        <h1 className="font-display text-4xl md:text-6xl text-plum mb-2">{deckTitle}</h1>
        <p className="text-charcoal/90">{subtitle}</p>
        <div className="h-px my-6 bg-gold/80 w-24"></div>
        <blockquote className="font-quote italic text-plum text-xl">{quote}</blockquote>
        <div className="mt-6 text-xs text-charcoal/70">{footer}</div>
      </div>
    </div>
  );
}
