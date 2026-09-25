"use client";

import { useQuery } from "@tanstack/react-query";
import { resolveSponsors } from "@/data/sponsors";

type Sponsor = {
  id: string;
  name: string;
  logoUrl: string;
  websiteUrl: string | null;
  tier:
    | "TITLE"
    | "PLATINUM"
    | "GOLD"
    | "SILVER"
    | "PARTNER"
    | "SUPPORTER"
    | "CUSTOM";
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
  CUSTOM: "Departments",
};

export function Sponsors() {
  const { data, error } = useQuery<{ sponsors: Sponsor[] }>({
    queryKey: ["sponsors"],
    queryFn: async () => {
      const r = await fetch("/api/sponsors");

      if (!r.ok) {
        throw new Error("Failed to load sponsors");
      }

      return r.json();
    },
  });

  const sponsors: Sponsor[] = resolveSponsors(
    error ? null : data?.sponsors ?? undefined
  ) as Sponsor[];

  if (sponsors.length === 0) return null;

  /*
   * Separate sponsors from department logos.
   *
   * All normal sponsors go into one row.
   * CSE + AI&ML go into the department row below.
   */
  const departmentLogos = sponsors.filter(
    (s) => s.tier === "CUSTOM"
  );

  const normalSponsors = sponsors.filter(
    (s) => s.tier !== "CUSTOM"
  );

  return (
    <section
      id="sponsors"
      className="relative py-16 md:py-24 border-t border-white/5"
    >
      <div className="mx-auto max-w-7xl px-5 md:px-10">

        {/* ================= HEADER ================= */}
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

        {/* ===================================================== */}
        {/*                    NORMAL SPONSORS                     */}
        {/* ===================================================== */}

        {normalSponsors.length > 0 && (
          <div className="mb-14 md:mb-20">

            {/* Section title */}
            <div className="flex items-center gap-4 mb-8">
              <span className="mono text-[10px] uppercase tracking-widest text-[#A8A8A8] whitespace-nowrap">
                SPONSORS
              </span>

              <div className="h-px flex-1 bg-white/10" />
            </div>

            {/* 
              IMPORTANT:
              flex-nowrap keeps all sponsor logos in ONE ROW.
              overflow-x-auto prevents them from dropping below
              on smaller screens.
            */}
            <div className="flex flex-nowrap items-center justify-center gap-6 md:gap-10 overflow-x-auto pb-4">

              {normalSponsors.map((sponsor) => (
                <div
                  key={sponsor.id}
                  className="flex-shrink-0 flex items-center justify-center"
                >
                  <div className="flex items-center justify-center h-24 md:h-32 w-[220px] md:w-[280px]">
                    {sponsor.logoUrl ? (
                      <img
                        src={sponsor.logoUrl}
                        alt={`${sponsor.name} logo`}
                        loading="lazy"
                        className="max-h-full max-w-full object-contain"
                      />
                    ) : (
                      <span className="display text-lg font-bold text-[#A8A8A8]/40">
                        {sponsor.name}
                      </span>
                    )}
                  </div>
                </div>
              ))}

            </div>
          </div>
        )}

        {/* ===================================================== */}
        {/*                  CSE + AI&ML SECTION                   */}
        {/* ===================================================== */}

        {departmentLogos.length > 0 && (
          <div>

            {/* Section title */}
            <div className="flex items-center gap-4 mb-8">
              <span className="mono text-[10px] uppercase tracking-widest text-[#A8A8A8] whitespace-nowrap">
                DEPARTMENTS
              </span>

              <div className="h-px flex-1 bg-white/10" />
            </div>

            {/* 
              CSE + AI&ML stay below sponsors.
              They remain circular.
            */}
            <div className="flex flex-row items-center justify-center gap-8 md:gap-16">

              {departmentLogos.map((department) => (
                <div
                  key={department.id}
                  className="flex flex-col items-center justify-center"
                >

                  {/* Circular logo */}
                  <div className="h-28 w-28 md:h-36 md:w-36 rounded-full bg-white overflow-hidden flex items-center justify-center p-2">
                    {department.logoUrl ? (
                      <img
                        src={department.logoUrl}
                        alt={`${department.name} logo`}
                        loading="lazy"
                        className="h-full w-full object-contain rounded-full"
                      />
                    ) : (
                      <span className="text-center text-sm font-bold text-black">
                        {department.name}
                      </span>
                    )}
                  </div>

                  {/* Department name */}
                  <span className="mt-4 mono text-xs uppercase tracking-widest text-[#A8A8A8] text-center">
                    {department.name}
                  </span>

                </div>
              ))}

            </div>
          </div>
        )}

      </div>
    </section>
  );
}