"use client";

import { useQuery } from "@tanstack/react-query";
import { SPONSORS } from "@/data/sponsors";

type Sponsor = {
  id: string;
  name: string;
  logoUrl: string;
  websiteUrl: string | null;
  tier: "TITLE" | "PLATINUM" | "GOLD" | "SILVER" | "PARTNER" | "CUSTOM";
  customTier: string | null;
  sortOrder: number;
};

const TIER_LABEL: Record<string, string> = {
  TITLE: "Title Sponsor",
  PLATINUM: "Platinum",
  GOLD: "Gold",
  SILVER: "Silver",
  PARTNER: "Partner",
  CUSTOM: "Partner",
};

const TIER_SIZE: Record<string, string> = {
  TITLE: "h-16 md:h-24",
  PLATINUM: "h-14 md:h-20",
  GOLD: "h-12 md:h-16",
  SILVER: "h-10 md:h-14",
  PARTNER: "h-10 md:h-12",
  CUSTOM: "h-10 md:h-12",
};

export function Sponsors() {
  const { data, error } = useQuery<{ sponsors: Sponsor[] }>({
    queryKey: ["sponsors"],
    queryFn: async () => {
      const r = await fetch("/api/sponsors");
      if (!r.ok) throw new Error("Failed to load sponsors");
      return r.json();
    },
  });

  const databaseSponsors = data?.sponsors ?? [];

  const sponsors: Sponsor[] =
    error
      ? []
      : databaseSponsors.length > 0
      ? databaseSponsors
      : SPONSORS.map((s, index) => ({
          id: `static-sponsor-${index}`,
          name: s.name,
          logoUrl: s.logo,
          websiteUrl: s.website,
          tier: s.tier as Sponsor["tier"],
          customTier: null,
          sortOrder: index,
        }));

  if (sponsors.length === 0) return null;

  // Group by tier
  const tierOrder = ["TITLE", "PLATINUM", "GOLD", "SILVER", "PARTNER", "CUSTOM"];
  const grouped = tierOrder
    .map((tier) => ({ tier, items: sponsors.filter((s) => s.tier === tier) }))
    .filter((g) => g.items.length > 0);

  return (
    <section id="sponsors" className="relative py-16 md:py-24 border-t border-white/5">
      <div className="mx-auto max-w-7xl px-5 md:px-10">
        <div className="mb-10 md:mb-16 text-center">
          <div className="mono text-xs uppercase tracking-[0.3em] text-[#B52A32] mb-4">
            / Partners
          </div>
          <h2 className="display text-3xl sm:text-5xl md:text-7xl font-bold tracking-tight text-white leading-[0.95]">
            BACKED BY
            <br />
            <span className="text-[#A8A8A8]">THE BEST.</span>
          </h2>
        </div>

        <div className="space-y-10 md:space-y-14">
          {grouped.map((group) => (
            <div key={group.tier}>
              <div className="flex items-center gap-4 mb-4">
                <span className="mono text-[10px] uppercase tracking-widest text-[#A8A8A8]">
                  {TIER_LABEL[group.tier]}
                  {group.tier === "CUSTOM" && group.items[0]?.customTier ? ` · ${group.items[0].customTier}` : ""}
                </span>
                <div className="h-px flex-1 bg-white/10" />
              </div>
              <div className={`grid gap-4 md:gap-6 ${
                group.tier === "TITLE" || group.tier === "PLATINUM"
                  ? "grid-cols-1 sm:grid-cols-2 md:grid-cols-3"
                  : "grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5"
              }`}>
                {group.items.map((s) => (
                  <a
                    key={s.id}
                    href={s.websiteUrl || "#"}
                    target={s.websiteUrl ? "_blank" : undefined}
                    rel="noreferrer"
                    className="group bg-[#151515] border border-white/10 rounded-lg p-5 md:p-6 flex flex-col items-center justify-center gap-3 transition-colors hover:border-[#B52A32]/40"
                  >
                    <div className={`${TIER_SIZE[group.tier]} w-full flex items-center justify-center overflow-hidden`}>
                      {s.logoUrl ? (
                        <img
                          src={s.logoUrl}
                          alt={`${s.name} logo`}
                          loading="lazy"
                          className="h-full w-full object-contain opacity-100"
                        />
                      ) : (
                        <span className="display text-lg font-bold text-[#A8A8A8]/40">{s.name}</span>
                      )}
                    </div>
                    <div className="text-xs text-white/70 group-hover:text-white transition-colors text-center">
                      {s.name}
                    </div>
                  </a>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
