"use client";

import { useQuery } from "@tanstack/react-query";

type Coordinator = {
  id: string;
  name: string;
  role: string;
  department: string | null;
  type: "STUDENT" | "FACULTY";
  phone: string | null;
  email: string | null;
  photoUrl: string | null;
  linkedinUrl: string | null;
  githubUrl: string | null;
  isLead: boolean;
};

export function Coordinators() {
  const { data } = useQuery<{ coordinators: Coordinator[] }>({
    queryKey: ["coordinators"],
    queryFn: async () => {
      const r = await fetch("/api/coordinators");
      return r.json();
    },
  });
  const coordinators = data?.coordinators ?? [];
  const students = coordinators.filter((c) => c.type === "STUDENT");
  const faculty = coordinators.filter((c) => c.type === "FACULTY");

  return (
    <section id="crew" className="relative section-pad mx-auto max-w-7xl">
      <div className="mb-12 md:mb-16">
        <div className="mono text-xs uppercase tracking-[0.3em] text-[#B52A32] mb-4">
          / Coordinators
        </div>
        <h2 className="display text-4xl sm:text-6xl md:text-7xl font-bold tracking-tight text-white leading-[0.95]">
          THE CREW
          <br />
          <span className="text-[#A8A8A8]">BEHIND THE MISSION.</span>
        </h2>
      </div>

      <CoordinatorGroup title="STUDENT COORDINATORS" coordinators={students} />
      <div className="h-16" />
      <CoordinatorGroup title="FACULTY COORDINATORS" coordinators={faculty} />
    </section>
  );
}

function CoordinatorGroup({
  title,
  coordinators,
}: {
  title: string;
  coordinators: Coordinator[];
}) {
  if (coordinators.length === 0) return null;
  return (
    <div>
      <div className="flex items-center gap-4 mb-6">
        <span className="mono text-[10px] uppercase tracking-[0.3em] text-[#A8A8A8]">{title}</span>
        <div className="h-px flex-1 bg-white/10" />
      </div>
      {/* Mobile: 4 per row, sm: 3 per row, md: 4 per row, lg: 4 per row (existing) */}
      <div className="grid grid-cols-4 sm:grid-cols-3 md:grid-cols-4 gap-2 sm:gap-3 md:gap-4 lg:gap-6">
        {coordinators.map((c) => (
          <CoordinatorCard key={c.id} c={c} />
        ))}
      </div>
    </div>
  );
}

function CoordinatorCard({ c }: { c: Coordinator }) {
  return (
    <article
      className={`group relative glass glass-hover rounded-lg overflow-hidden transition-all duration-300 ${
        c.isLead ? "md:col-span-2 md:row-span-1" : ""
      }`}
    >
      <div
        className={`relative overflow-hidden ${c.isLead ? "aspect-[16/10]" : "aspect-[4/5]"}`}
      >
        {c.photoUrl ? (
          <img
            src={c.photoUrl}
            alt={c.name}
            loading="lazy"
            className="absolute inset-0 h-full w-full object-cover transition-all duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="absolute inset-0 bg-[#151515] flex items-center justify-center">
            <span className="display text-2xl sm:text-3xl md:text-4xl font-bold text-[#252525]">
              {c.name.split(" ").map(n => n[0]).slice(0, 2).join("")}
            </span>
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-[#030303] via-transparent to-transparent" />
        {c.isLead && (
          <div className="absolute top-3 left-3 mono text-[10px] uppercase tracking-widest text-[#B52A32] border border-[#B52A32] px-2 py-0.5 bg-black/60 backdrop-blur">
            Lead
          </div>
        )}
      </div>

      <div className="p-2 sm:p-3 md:p-4 lg:p-5">
        <h3 className="display text-xs sm:text-sm md:text-base lg:text-lg font-semibold text-white tracking-tight leading-tight">
          {c.name}
        </h3>
        <div className="text-[10px] sm:text-xs text-[#B52A32] mt-0.5 truncate">{c.role}</div>
        {c.department && (
          <div className="mt-1 text-[9px] sm:text-[10px] md:text-[11px] text-[#A8A8A8] truncate">{c.department}</div>
        )}

        {/* Email & phone: hide on very small screens to keep cards compact at 4-per-row */}
        {(c.email || c.phone) && (
          <div className="hidden sm:block mt-3 pt-3 border-t border-white/5 space-y-1">
            {c.email && (
              <a
                href={`mailto:${c.email}`}
                className="block text-[11px] text-[#A8A8A8] hover:text-white truncate transition-colors"
              >
                {c.email}
              </a>
            )}
            {c.phone && (
              <a
                href={`tel:${c.phone}`}
                className="block text-[11px] text-[#A8A8A8] hover:text-white transition-colors"
              >
                {c.phone}
              </a>
            )}
          </div>
        )}
      </div>
    </article>
  );
}
