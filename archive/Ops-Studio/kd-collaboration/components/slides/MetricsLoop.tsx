export default function MetricsLoop({ h1, bullets, blurb }: { h1: string; bullets: string[]; blurb?: string }) {
  return (
    <section className="py-8 lg:py-12 px-6 lg:px-16 bg-white">
      <div className="max-w-6xl mx-auto">
        {/* H1: Centered, dramatic scale */}
        <h1 className="text-5xl lg:text-7xl font-bold text-plum leading-tight mb-8 text-center">
          {h1}
        </h1>

        {/* Blurb: Centered */}
        {blurb && (
          <p className="text-base italic text-charcoal/80 mb-12 text-center max-w-3xl mx-auto leading-relaxed">
            {blurb}
          </p>
        )}

        {/* Two-column grid: Visual left, Metrics right */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center">
          {/* Visual: Three interlocking rings */}
          <div className="flex items-center justify-center">
            <div className="w-full max-w-md">
              <svg
                viewBox="0 0 200 200"
                className="w-full h-auto"
                xmlns="http://www.w3.org/2000/svg"
                preserveAspectRatio="xMidYMid meet"
              >
                {/* Interlocking rings */}
                <g fill="none" strokeLinecap="round" strokeLinejoin="round">
                  {/* Top-left (sage) */}
                  <circle cx="65" cy="75" r="44" stroke="#9BA88C" strokeWidth="14"/>
                  {/* Top-right (plum) */}
                  <circle cx="135" cy="75" r="44" stroke="#812D6B" strokeWidth="14"/>
                  {/* Bottom-center (gold) */}
                  <circle cx="100" cy="136" r="44" stroke="#D4B483" strokeWidth="14"/>
                </g>

                {/* Simplified labels */}
                <g fontFamily="system-ui, sans-serif" fontWeight="500" fontSize="11" textAnchor="middle">
                  <text x="45" y="18" fill="#9BA88C">Vision</text>
                  <text x="155" y="18" fill="#812D6B">Systems</text>
                  <text x="100" y="197" fill="#D4B483">Balanced Flow</text>
                </g>
              </svg>
            </div>
          </div>

          {/* Metrics: Pills stacked vertically */}
          <div className="flex flex-col gap-3 justify-center">
            {bullets.map((b, i) => (
              <div key={i} className="inline-flex items-center gap-2 rounded-full bg-plum/10 border border-plum/30 px-4 py-2 text-sm text-charcoal">
                <span className="text-gold">✓</span>
                <span>{b}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
