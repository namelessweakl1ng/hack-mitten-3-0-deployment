"use client";

import { useQuery } from "@tanstack/react-query";
import { resolveSponsors } from "@/data/sponsors";

type Sponsor = {
  id: string;
  name: string;
  logoUrl: string;
  websiteUrl: string | null;
  tier: "TITLE" | "PLATINUM" | "GOLD" | "SILVER" | "PARTNER" | "SUPPORTER" | "CUSTOM";
  customTier: string | null;
  sortOrder: number;
};

const TIER_LABEL: Record<string, string> = {
  TITLE: "Sponsors",
  PLATINUM: "Platinum",
  GOLD: "Gold",
  SILVER: "Silver",
  PARTNER: "Partner",
  SUPPORTER: "Supporters",
  CUSTOM: "Partner",
};

const TIER_SIZE: Record<string, string> = {
  TITLE: "h-20 md:h-28",
  PLATINUM: "h-20 md:h-24",
  GOLD: "h-16 md:h-20",
  SILVER: "h-14 md:h-18",
  PARTNER: "h-12 md:h-16",
  SUPPORTER: "h-12 md:h-16",
  CUSTOM: "h-12 md:h-16",
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

  const sponsors: Sponsor[] = resolveSponsors(error ? null : data?.sponsors ?? undefined) as Sponsor[];

  if (sponsors.length === 0) return null;

  // Group by tier
  const tierOrder = ["TITLE", "PLATINUM", "GOLD", "SILVER", "PARTNER", "SUPPORTER", "CUSTOM"];
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
                  <div
                    key={s.id}
                    className="group p-4 md:p-6 flex flex-col items-center justify-center gap-3"

                  >
                    <div
                      className={`${
                        group.tier === "SUPPORTER"
                          ? "aspect-square w-full max-w-[116px] md:max-w-[140px] rounded-full bg-white"
                          : `${TIER_SIZE[group.tier]} w-full`
                      } overflow-hidden flex items-center justify-center`}
                    >
                      {s.logoUrl ? (
                        <img
                          src={s.logoUrl}
                          alt={`${s.name} logo`}
                          loading="lazy"
                          className="h-full w-full object-contain"
                        />
                      ) : (
                        <span className="display text-lg font-bold text-[#A8A8A8]/40">{s.name}</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
