"use client";

import { useQuery } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";

type Winner = {
  id: string;
  position: number;
  positionLabel: string;
  teamName: string;
  prize: string | null;
  description: string | null;
  imageUrl: string | null;
  sortOrder: number;
};

export function Winners() {
  const { data } = useQuery<{ winners: Winner[]; visible: boolean; heading: string; subheading: string }>({
    queryKey: ["winners"],
    queryFn: async () => (await fetch("/api/winners")).json(),
  });

  // Only render if winners are enabled and there are visible winners
  if (!data?.visible || !data.winners || data.winners.length === 0) return null;
  const winners = data.winners;
  const heading = data.heading || "THE MISSION IS COMPLETE.";
  const subheading = data.subheading || "MEET THE WINNERS.";

  return (
    <section id="winners" className="relative py-20 md:py-32 border-t border-white/5">
      <div className="mx-auto max-w-7xl px-5 md:px-10">
        <div className="mb-12 md:mb-16 text-center">
          <div className="mono text-xs uppercase tracking-[0.3em] text-[#B52A32] mb-4">
            / Winners
          </div>
          <h2 className="display text-4xl sm:text-6xl md:text-8xl font-bold tracking-tight text-white leading-[0.9]">
            {heading}
            <br />
            <span className="text-[#B52A32] text-glow-red">{subheading}</span>
          </h2>
        </div>

        <div className="grid gap-5 md:gap-6 md:grid-cols-2 lg:grid-cols-3">
          {winners.map((w) => (
            <WinnerCard key={w.id} winner={w} featured={w.position === 1} />
          ))}
        </div>
      </div>
    </section>
  );
}

function WinnerCard({ winner, featured }: { winner: Winner; featured: boolean }) {
  const ref = useRef<HTMLDivElement>(null);
  const [focused, setFocused] = useState(false);

  // Auto-focus the 1st place card on view
  useEffect(() => {
    if (!featured) return;
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => entry.isIntersecting && setFocused(true),
      { threshold: 0.6 },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [featured]);

  const isFocus = featured && focused;
  const grayscale = isFocus ? 0 : featured ? 0.3 : 0.7;
  const redAccent = isFocus ? "inset 0 0 0 1px rgba(216,58,67,0.5), 0 0 40px -10px rgba(216,58,67,0.6)" : "none";

  return (
    <article
      ref={ref}
      onMouseEnter={() => setFocused(true)}
      onMouseLeave={() => !featured && setFocused(false)}
      className={`group relative glass rounded-lg overflow-hidden transition-all duration-700 ${
        featured ? "lg:col-span-1 lg:row-span-1" : ""
      }`}
      style={{ boxShadow: redAccent }}
    >
      <div className="relative aspect-[4/5] overflow-hidden bg-[#080808]">
        {winner.imageUrl ? (
           
          <img
            src={winner.imageUrl}
            alt={winner.teamName}
            loading="lazy"
            className="absolute inset-0 h-full w-full object-cover transition-all duration-1000"
            style={{ filter: `grayscale(${grayscale}) brightness(${isFocus ? 1 : 0.7})` }}
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-[#A8A8A8]">
            <span className="display text-6xl font-bold opacity-30">{winner.position}</span>
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-[#030303] via-[#030303]/40 to-transparent" />

        {/* Position badge */}
        <div className="absolute top-3 left-3">
          <div className={`mono text-[10px] uppercase tracking-widest px-2 py-1 rounded backdrop-blur ${
            isFocus
              ? "bg-[#B52A32] text-white"
              : "bg-black/60 text-[#B52A32] border border-[#B52A32]/40"
          }`}>
            {winner.positionLabel}
          </div>
        </div>
      </div>

      <div className="p-5 md:p-6">
        <h3 className="display text-2xl md:text-3xl font-bold text-white tracking-tight">
          {winner.teamName}
        </h3>
        {winner.prize && (
          <div className="mono text-sm text-[#B52A32] mt-1">{winner.prize}</div>
        )}
        {winner.description && (
          <p className="text-sm text-[#A8A8A8] mt-3 leading-relaxed">{winner.description}</p>
        )}
      </div>
    </article>
  );
}
