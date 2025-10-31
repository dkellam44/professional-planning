'use client';
import Link from "next/link";
import { useState } from "react";

export default function NavBar({ total }: { total: number }) {
  const [idx, setIdx] = useState(0);

  return (
    <div className="no-print fixed bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-3 px-4 py-2 rounded-full bg-white/90 ring-1 ring-gold/50 shadow">
      <button
        className="px-3 py-1 text-sm"
        onClick={() => setIdx(Math.max(0, idx - 1))}
        aria-label="Previous slide"
      >
        ← Prev
      </button>
      <div className="text-xs text-charcoal/70">Slide {idx + 1} / {total}</div>
      <button
        className="px-3 py-1 text-sm"
        onClick={() => setIdx(Math.min(total - 1, idx + 1))}
        aria-label="Next slide"
      >
        Next →
      </button>
      <Link href="/appendix" className="ml-2 text-sm text-plum underline">Appendix</Link>
    </div>
  );
}
