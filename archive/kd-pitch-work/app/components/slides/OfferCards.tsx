type Card = { icon: string; title: string; desc: string; price: string };

export default function OfferCards({ h1, cards, note }: { h1: string; cards: Card[]; note?: string }) {
  return (
    <div>
      <h2 className="font-display text-3xl md:text-4xl text-plum mb-6">{h1}</h2>
      <div className="grid md:grid-cols-3 gap-6">
        {cards.map((c, i) => (
          <div key={i} className="rounded-2xl bg-cream ring-2 ring-plum/60 p-6 flex flex-col">
            <div className="text-4xl mb-3">{c.icon}</div>
            <h3 className="font-display text-xl text-plum mb-2">{c.title}</h3>
            <p className="text-sm text-charcoal/80 mb-4 flex-1">{c.desc}</p>
            <div className="text-lg font-semibold text-gold">{c.price}</div>
          </div>
        ))}
      </div>
      {note ? <p className="text-xs text-charcoal/70 mt-4 italic">{note}</p> : null}
    </div>
  );
}
