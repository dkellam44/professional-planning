import { ReactNode } from "react";

export default function SlideFrame({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <section
      className={`relative mx-auto w-full max-w-4xl rounded-2xl bg-cream shadow-xl ring-1 ring-gold/40 p-6 md:p-10 ${className}`}
    >
      {children}
    </section>
  );
}
