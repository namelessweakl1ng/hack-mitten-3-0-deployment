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

export function Sponsors() {
  const { data, error } = useQuery<{ sponsors: Sponsor[] }>({
    queryKey: ["sponsors"],
    queryFn: async () => {
      const response = await fetch("/api/sponsors");

      if (!response.ok) {
        throw new Error("Failed to load sponsors");
      }

      return response.json();
    },
  });

  const sponsors = resolveSponsors(
    error ? null : data?.sponsors ?? undefined
  ) as Sponsor[];

  if (sponsors.length === 0) {
    return null;
  }

  // CSE and AI&ML department logos
  const departmentLogos = sponsors.filter(
    (sponsor) => sponsor.tier === "CUSTOM"
  );

  // All actual sponsors
  const sponsorLogos = sponsors.filter(
    (sponsor) => sponsor.tier !== "CUSTOM"
  );

  return (
    <section
      id="sponsors"
      className="relative border-t border-white/5 py-16 md:py-24"
    >
      <div className="mx-auto max-w-7xl px-5 md:px-10">

        {/* ================= HEADER ================= */}

        <div className="mb-10 text-center md:mb-16">
          <div className="mono mb-4 text-xs uppercase tracking-[0.3em] text-[#B52A32]">
            / Partners
          </div>

          <h2 className="display text-3xl font-bold leading-[0.95] tracking-tight text-white sm:text-5xl md:text-7xl">
            BACKED BY
            <br />
            <span className="text-[#A8A8A8]">THE BEST.</span>
          </h2>
        </div>

        {/* ================================================== */}
        {/*                    SPONSORS                         */}
        {/* ================================================== */}

        {sponsorLogos.length > 0 && (
          <div className="mb-16 md:mb-24">

            {/* Sponsors heading */}
            <div className="mb-8 flex items-center gap-4">
              <span className="mono whitespace-nowrap text-[10px] uppercase tracking-widest text-[#A8A8A8]">
                SPONSORS
              </span>

              <div className="h-px flex-1 bg-white/10" />
            </div>

            {/* 
              ONE ROW
              No wrapping.
              On small screens the row can scroll horizontally.
            */}
            <div className="w-full overflow-x-auto">
              <div className="flex min-w-max flex-nowrap items-center justify-center gap-6 px-2 md:gap-10">

                {sponsorLogos.map((sponsor) => (
                  <div
                    key={sponsor.id}
                    className="flex h-28 w-[230px] shrink-0 items-center justify-center md:h-32 md:w-[270px]"
                  >
                    {sponsor.logoUrl ? (
                      <img
                        src={sponsor.logoUrl}
                        alt={`${sponsor.name} logo`}
                        loading="lazy"
                        className="max-h-full max-w-full object-contain"
                      />
                    ) : (
                      <span className="text-center text-lg font-bold text-[#A8A8A8]/40">
                        {sponsor.name}
                      </span>
                    )}
                  </div>
                ))}

              </div>
            </div>
          </div>
        )}

        {/* ================================================== */}
        {/*                  DEPARTMENTS                        */}
        {/* ================================================== */}

        {departmentLogos.length > 0 && (
          <div>

            {/* Departments heading */}
            <div className="mb-8 flex items-center gap-4">
              <span className="mono whitespace-nowrap text-[10px] uppercase tracking-widest text-[#A8A8A8]">
                DEPARTMENTS
              </span>

              <div className="h-px flex-1 bg-white/10" />
            </div>

            {/* CSE + AI&ML */}
            <div className="flex flex-row items-start justify-center gap-10 md:gap-20">

              {departmentLogos.map((department) => (
                <div
                  key={department.id}
                  className="flex w-32 shrink-0 flex-col items-center md:w-40"
                >

                  {/* Circular logo */}
                  <div className="flex h-28 w-28 items-center justify-center overflow-hidden rounded-full bg-white p-2 md:h-36 md:w-36">
                    {department.logoUrl ? (
                      <img
                        src={department.logoUrl}
                        alt={`${department.name} logo`}
                        loading="lazy"
                        className="h-full w-full rounded-full object-contain"
                      />
                    ) : (
                      <span className="text-center text-sm font-bold text-black">
                        {department.name}
                      </span>
                    )}
                  </div>

                  {/* Department name */}
                  <span className="mono mt-4 text-center text-xs uppercase tracking-widest text-[#A8A8A8]">
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