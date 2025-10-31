"use client";

import { useState } from "react";

type Card = { icon: string; title: string; desc: string; price: string };

export default function OfferCards({ h1, cards, note, blurb }: { h1: string; cards: Card[]; note?: string; blurb?: string }) {
  // Middle card (index 1) is featured "Ongoing Partnership"
  const featuredIndex = 1;

  // Track which cards are expanded
  const [expandedCards, setExpandedCards] = useState<{ [key: number]: boolean }>({});

  const toggleCard = (index: number) => {
    setExpandedCards(prev => ({ ...prev, [index]: !prev[index] }));
  };

  return (
    <section className="py-8 lg:py-12 px-6 lg:px-16 bg-white">
      <div className="max-w-7xl mx-auto">
        {/* H1: Centered, dramatic scale */}
        <h1 className="text-5xl lg:text-7xl font-bold text-plum leading-tight mb-8 text-center">
          {h1}
        </h1>

        {/* Blurb: Centered */}
        {blurb && (
          <p className="text-base italic text-charcoal/80 mb-8 text-center max-w-3xl mx-auto leading-relaxed">
            {blurb}
          </p>
        )}

        {/* Cards Grid: Three columns - stretch to equal height */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch">
          {cards.map((card, i) => {
            const isFeatured = i === featuredIndex;
            return (
              <div
                key={i}
                className={`
                  bg-white p-6 lg:p-8 rounded-2xl shadow-lg
                  border-2 border-gold
                  ${isFeatured ? 'shadow-xl' : ''}
                  transition-all duration-150 ease-in-out
                  hover:scale-[1.02] hover:shadow-2xl
                  flex flex-col
                `}
              >
                {/* Icon */}
                <div className="text-4xl mb-4">{card.icon}</div>

                {/* Title */}
                <h3 className="text-xl lg:text-2xl font-semibold text-plum mb-3">{card.title}</h3>

                {/* Price - moved up, more prominent */}
                <div className="text-2xl lg:text-3xl font-bold text-plum mb-4">{card.price}</div>

                {/* Accordion toggle button */}
                <button
                  onClick={() => toggleCard(i)}
                  className="text-sm text-plum font-semibold hover:text-plum/80 transition-colors flex items-center gap-2 mb-2"
                  aria-expanded={expandedCards[i]}
                >
                  {expandedCards[i] ? "Hide details" : "Show details"}
                  <span className="text-xs">{expandedCards[i] ? "▲" : "▼"}</span>
                </button>

                {/* Description - accordion content */}
                {expandedCards[i] && (
                  <p className="text-sm lg:text-base text-charcoal leading-relaxed">
                    {card.desc}
                  </p>
                )}
              </div>
            );
          })}
        </div>

        {/* Note: Flexibility and risk reversal */}
        {note && (
          <p className="text-sm italic text-charcoal/80 text-center max-w-2xl mx-auto mt-8 leading-relaxed">
            {note}
          </p>
        )}
      </div>
    </section>
  );
}
