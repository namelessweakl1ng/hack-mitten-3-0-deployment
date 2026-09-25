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
  TITLE: "Title Sponsor",
  PLATINUM: "Platinum",
  GOLD: "Gold",
  SILVER: "Silver",
  PARTNER: "Partner",
  SUPPORTER: "Supporters",
  CUSTOM: "Partner",
};

// aspect ratio per tier — bigger tiers get a wider landscape card
const TIER_ASPECT: Record<string, string> = {
  TITLE: "aspect-[16/9]",
  PLATINUM: "aspect-[16/9]",
  GOLD: "aspect-[4/3]",
  SILVER: "aspect-[4/3]",
  PARTNER: "aspect-square",
  SUPPORTER: "aspect-square",
  CUSTOM: "aspect-square",
};

// grid columns per tier
const TIER_GRID: Record<string, string> = {
  TITLE: "grid-cols-1 sm:grid-cols-2",
  PLATINUM: "grid-cols-1 sm:grid-cols-2 md:grid-cols-3",
  GOLD: "grid-cols-2 sm:grid-cols-3 md:grid-cols-4",
  SILVER: "grid-cols-2 sm:grid-cols-3 md:grid-cols-4",
  PARTNER: "grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5",
  SUPPORTER: "grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5",
  CUSTOM: "grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5",
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
              {/* Tier label row */}
              <div className="flex items-center gap-4 mb-5">
                <span className="mono text-[10px] uppercase tracking-widest text-[#A8A8A8]">
                  {TIER_LABEL[group.tier]}
                  {group.tier === "CUSTOM" && group.items[0]?.customTier
                    ? ` · ${group.items[0].customTier}`
                    : ""}
                </span>
                <div className="h-px flex-1 bg-white/10" />
              </div>

              <div className={`grid gap-4 md:gap-6 ${TIER_GRID[group.tier]}`}>
                {group.items.map((s) => (
<<<<<<< HEAD
                  <SponsorCard key={s.id} sponsor={s} aspect={TIER_ASPECT[s.tier]} />
=======
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
>>>>>>> 377f9d4205af61c9ac4bbeca891c833d70c9b3a7
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function SponsorCard({ sponsor, aspect }: { sponsor: Sponsor; aspect: string }) {
  const inner = (
    <div className="group relative glass rounded-lg overflow-hidden border border-white/10 hover:border-[#B52A32]/50 transition-all duration-300 hover:shadow-[0_0_24px_2px_rgba(181,42,50,0.15)]">
      {/* Image area */}
      <div className={`relative ${aspect} w-full bg-[#0e0e0e] overflow-hidden`}>
        {sponsor.logoUrl ? (
          <>
            <img
              src={sponsor.logoUrl}
              alt={`${sponsor.name} logo`}
              loading="lazy"
              className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
            {/* Dark overlay so logo reads against the site bg */}
            <div className="absolute inset-0 bg-gradient-to-t from-[#030303]/70 via-[#030303]/10 to-transparent pointer-events-none" />
            {/* Subtle red tint top-left — matches site palette */}
            <div className="absolute inset-0 bg-gradient-to-br from-[#8B1E24]/10 via-transparent to-transparent pointer-events-none" />
          </>
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="display text-2xl font-bold text-[#252525]">{sponsor.name[0]}</span>
          </div>
        )}
      </div>

      {/* Name strip */}
      <div className="px-4 py-3 border-t border-white/5 bg-[#0a0a0a]">
        <p className="display text-sm font-semibold text-white tracking-tight truncate">
          {sponsor.name}
        </p>
        <p className="mono text-[10px] uppercase tracking-widest text-[#B52A32] mt-0.5">
          {TIER_LABEL[sponsor.tier]}
        </p>
      </div>
    </div>
  );

  return sponsor.websiteUrl ? (
    <a href={sponsor.websiteUrl} target="_blank" rel="noopener noreferrer" className="block">
      {inner}
    </a>
  ) : (
    <div>{inner}</div>
  );
}
