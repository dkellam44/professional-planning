type Row = { area: string; solution: string; tools: string; };

export default function TableSlide({ h1, rows, blurb }: { h1: string; rows: Row[]; blurb?: string }) {
  return (
    <section className="py-8 lg:py-12 px-6 lg:px-16 bg-plum">
      <div className="max-w-5xl mx-auto">
        {/* H1: Centered on dark background */}
        <h1 className="text-5xl lg:text-7xl font-bold text-white leading-tight mb-6 text-center">
          {h1}
        </h1>

        {/* Blurb: Centered, light text */}
        {blurb && (
          <p className="text-base lg:text-lg italic text-white/80 mb-6 max-w-3xl mx-auto text-center leading-relaxed">
            {blurb}
          </p>
        )}

        {/* Cards Grid: Stack vertically with gap */}
        <div className="flex flex-col gap-2">
          {rows.map((row, i) => (
            <div
              key={i}
              className="bg-white p-4 lg:p-5 rounded-xl shadow-lg transition-all duration-150 ease-in-out hover:scale-[1.02] hover:shadow-xl"
            >
              {/* Area Title */}
              <h3 className="text-lg lg:text-xl font-semibold text-plum mb-1">
                {row.area}
              </h3>

              {/* Solution Description */}
              <p className="text-sm text-charcoal leading-relaxed mb-1">
                {row.solution}
              </p>

              {/* Tools: Italic, muted */}
              <p className="text-xs text-charcoal/70 italic">
                {row.tools}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
