type Row = { job: string; solution: string; tools: string; };

export default function TableSlide({ h1, rows, blurb }: { h1: string; rows: Row[]; blurb?: string }) {
  return (
    <div>
      <h2 className="font-display text-3xl md:text-4xl text-plum mb-6">{h1}</h2>
      {blurb ? <p className="mb-4 text-sm text-charcoal/80">{blurb}</p> : null}
      <div className="overflow-hidden rounded-xl ring-1 ring-gold/40">
        <table className="w-full text-sm">
          <thead className="bg-plum text-cream">
            <tr>
              <th className="text-left p-3">Jobs to be Done</th>
              <th className="text-left p-3">Solution</th>
              <th className="text-left p-3">Tools</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={i} className={i % 2 ? "bg-cream" : "bg-[#EAE2D7]"}>
                <td className="p-3 align-top">{r.job}</td>
                <td className="p-3 align-top">{r.solution}</td>
                <td className="p-3 align-top">{r.tools}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
