export default function MetricsLoop({ h1, bullets }: { h1: string; bullets: string[] }) {
  return (
    <div>
      <h2 className="font-display text-3xl md:text-4xl text-plum mb-6">{h1}</h2>
      <div className="grid md:grid-cols-2 gap-6">
        <div className="rounded-xl ring-1 ring-gold/40 p-6 bg-white">
          <div className="text-center">
            {/* Simple metaphorical loop */}
            <div className="mx-auto w-56 h-56 rounded-full border-8 border-sage/60 relative">
              <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-cream px-2 text-xs">Seed</div>
              <div className="absolute top-1/2 -left-6 -translate-y-1/2 bg-cream px-2 text-xs">Tend</div>
              <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 bg-cream px-2 text-xs">Harvest</div>
              <div className="absolute top-1/2 -right-8 -translate-y-1/2 bg-cream px-2 text-xs">Compost</div>
            </div>
            <p className="mt-4 text-sm text-charcoal/70">Systems that learn protect creative energy.</p>
          </div>
        </div>
        <div className="grid gap-4">
          {bullets.map((b, i) => (
            <div key={i} className="rounded-lg bg-cream ring-1 ring-gold/40 p-4">{b}</div>
          ))}
        </div>
      </div>
    </div>
  );
}
