"use client";

import { useQuery } from "@tanstack/react-query";
import { ChevronDown } from "lucide-react";
import { useState } from "react";
import { COORDINATORS } from "@/data/coordinators";
import { DEVELOPING_TEAM } from "@/data/developing-team";

type Coordinator = {
  id: string;
  name: string;
  role: string;
  department: string | null;
  qualification: string | null;
  type: "STUDENT" | "FACULTY";
  phone: string | null;
  email: string | null;
  photoUrl: string | null;
  linkedinUrl: string | null;
  githubUrl: string | null;
  isLead: boolean;
};

export function Coordinators() {
  const { data, error } = useQuery<{ coordinators: Coordinator[] }>({
    queryKey: ["coordinators"],
    queryFn: async () => {
      const response = await fetch("/api/coordinators");

      if (!response.ok) {
        throw new Error("Failed to load coordinators");
      }

      return response.json();
    },
  });

  const databaseCoordinators = data?.coordinators ?? [];

  const coordinators: Coordinator[] = error
    ? []
    : databaseCoordinators.length > 0
      ? databaseCoordinators
      : COORDINATORS.map((c, index) => ({
          id: `static-coordinator-${index}`,
          name: c.name,
          role: c.role,
          department: c.department,
          qualification: c.qualification ?? null,
          type: c.type,
          phone: c.phone,
          email: c.email,
          photoUrl: c.image,
          linkedinUrl: null,
          githubUrl: null,
          isLead: c.isLead ?? false,
        }));

  /*
   * ============================================================
   * FACULTY
   * ============================================================
   */

  const faculty = coordinators.filter(
    (coordinator) => coordinator.type === "FACULTY"
  );

  /*
   * ============================================================
   * STUDENTS
   * ============================================================
   */

  const students = coordinators
    .filter((coordinator) => coordinator.type === "STUDENT")
    .sort((a, b) => {
      const aOrder = normalizeRole(a.role);
      const bOrder = normalizeRole(b.role);

      if (aOrder !== bOrder) {
        return aOrder - bOrder;
      }

      return 0;
    });

  /*
   * Don't hide the section if only the developing team exists.
   */

  if (coordinators.length === 0 && DEVELOPING_TEAM.length === 0) {
    return null;
  }

  return (
    <section
      id="crew"
      className="relative section-pad mx-auto max-w-7xl"
    >
      {/* ===================================================== */}
      {/* HEADER                                                 */}
      {/* ===================================================== */}

      <div className="mb-12 md:mb-16">
        <div className="mono mb-4 text-xs uppercase tracking-[0.3em] text-[#B52A32]">
          / Coordinators
        </div>

        <h2 className="display text-4xl font-bold leading-[0.95] tracking-tight text-white sm:text-6xl md:text-7xl">
          THE CREW
          <br />
          <span className="text-[#A8A8A8]">
            BEHIND THE MISSION.
          </span>
        </h2>
      </div>

      {/* ===================================================== */}
      {/* 1. FACULTY COORDINATORS                               */}
      {/* ===================================================== */}

      <CoordinatorGroup
        title="FACULTY COORDINATORS"
        coordinators={faculty}
      />

      <div className="h-16 md:h-20" />

      {/* ===================================================== */}
      {/* 2. STUDENT COORDINATORS                               */}
      {/* ===================================================== */}

      <CoordinatorGroup
        title="STUDENT COORDINATORS"
        coordinators={students}
      />

      <div className="h-16 md:h-20" />

      {/* ===================================================== */}
      {/* 3. DEVELOPING & DESIGN TEAM                           */}
      {/* ===================================================== */}

      <DevelopingTeam />
    </section>
  );
}

/* ============================================================ */
/* ROLE ORDER                                                    */
/* ============================================================ */

function normalizeRole(role: string): number {
  const normalized = role.trim().toLowerCase();

  if (normalized === "president") return 1;
  if (normalized === "vice president") return 2;
  if (normalized === "secretary") return 3;
  if (normalized === "joint secretary") return 4;

  return 99;
}

/* ============================================================ */
/* COORDINATOR GROUP                                             */
/* ============================================================ */

function CoordinatorGroup({
  title,
  coordinators,
}: {
  title: string;
  coordinators: Coordinator[];
}) {
  if (coordinators.length === 0) {
    return null;
  }

  return (
    <div>
      {/* Group heading */}
      <div className="mb-6 flex items-center gap-4">
        <span className="mono whitespace-nowrap text-[10px] uppercase tracking-[0.3em] text-[#A8A8A8]">
          {title}
        </span>

        <div className="h-px flex-1 bg-white/10" />
      </div>

      {/* Coordinator cards */}
      <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-3 sm:gap-3 md:grid-cols-4 md:gap-4 lg:gap-6">
        {coordinators.map((coordinator) => (
          <CoordinatorCard
            key={coordinator.id}
            c={coordinator}
          />
        ))}
      </div>
    </div>
  );
}

/* ============================================================ */
/* COORDINATOR CARD                                              */
/* ============================================================ */

function CoordinatorCard({ c }: { c: Coordinator }) {
  const [expanded, setExpanded] = useState(false);

  const hasContact = Boolean(c.email || c.phone);

  return (
    <article
      className={`group relative overflow-hidden rounded-lg glass glass-hover transition-all duration-300 ${
        c.isLead ? "md:col-span-2 md:row-span-1" : ""
      } ${
        expanded
          ? "ring-1 ring-[#B52A32]/50 sm:ring-0"
          : ""
      }`}
    >
      <button
        type="button"
        onClick={() => {
          if (
            hasContact &&
            window.matchMedia("(max-width: 639px)").matches
          ) {
            setExpanded((isExpanded) => !isExpanded);
          }
        }}
        aria-expanded={
          hasContact ? expanded : undefined
        }
        aria-controls={
          hasContact
            ? `coordinator-contact-${c.id}`
            : undefined
        }
        aria-label={
          hasContact
            ? `${expanded ? "Hide" : "Show"} contact details for ${c.name}`
            : c.name
        }
        className="block w-full text-left"
      >
        {/* Photo */}
        <div
          className={`relative overflow-hidden ${
            c.isLead
              ? "aspect-[16/10]"
              : "aspect-[4/5]"
          }`}
        >
          {c.photoUrl ? (
            <img
              src={c.photoUrl}
              alt={c.name}
              loading="lazy"
              className="absolute inset-0 h-full w-full object-cover transition-all duration-500 group-hover:scale-105"
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center bg-[#151515]">
              <span className="display text-2xl font-bold text-[#252525] sm:text-3xl md:text-4xl">
                {c.name
                  .split(" ")
                  .map((name) => name[0])
                  .slice(0, 2)
                  .join("")}
              </span>
            </div>
          )}

          {/* Gradient */}
          <div className="absolute inset-0 bg-gradient-to-t from-[#030303] via-transparent to-transparent" />

          {/* Lead badge */}
          {c.isLead && (
            <div className="absolute left-3 top-3 border border-[#B52A32] bg-black/60 px-2 py-0.5 font-mono text-[10px] uppercase tracking-widest text-[#B52A32] backdrop-blur">
              Lead
            </div>
          )}
        </div>

        {/* Details */}
        <div className="p-1.5 sm:p-3 md:p-4 lg:p-5">
          <h3 className="display break-words text-[10px] font-semibold leading-tight tracking-tight text-white sm:text-sm md:text-base lg:text-lg">
            {c.name}
          </h3>

          <div className="mt-1 break-words text-[8px] leading-tight text-[#B52A32] sm:text-xs">
            {c.role}
          </div>

          {c.type === "FACULTY" && c.qualification && (
            <div className="mt-1 break-words text-[9px] leading-tight text-[#A8A8A8] sm:text-[10px] md:text-[11px]">
              {c.qualification}
            </div>
          )}

          {c.department && (
            <div className="mt-1 break-words text-[9px] leading-tight text-[#A8A8A8] sm:text-[10px] md:text-[11px]">
              {c.department}
            </div>
          )}

          {hasContact && (
            <div className="mt-2 flex items-center gap-1 font-mono text-[8px] uppercase tracking-widest text-[#B52A32] sm:hidden">
              Contact

              <ChevronDown
                size={11}
                className={`transition-transform ${
                  expanded ? "rotate-180" : ""
                }`}
              />
            </div>
          )}
        </div>
      </button>

      {/* Contact information */}
      {hasContact && (
        <div
          id={`coordinator-contact-${c.id}`}
          className={`${
            expanded ? "block" : "hidden"
          } mt-3 space-y-1 border-t border-white/5 px-1.5 pt-3 sm:-mt-2 sm:mx-3 sm:block sm:px-0 md:mx-4 lg:mx-5`}
        >
          {c.email && (
            <a
              href={`mailto:${c.email}`}
              className="block max-w-full break-words text-[10px] text-[#A8A8A8] transition-colors hover:text-white sm:text-[11px]"
            >
              {c.email}
            </a>
          )}

          {c.phone && (
            <a
              href={`tel:${c.phone}`}
              className="block text-[10px] text-[#A8A8A8] transition-colors hover:text-white sm:text-[11px]"
            >
              {c.phone}
            </a>
          )}
        </div>
      )}
    </article>
  );
}

/* ============================================================ */
/* DEVELOPING & DESIGN TEAM                                      */
/* ============================================================ */

function DevelopingTeam() {
  if (!DEVELOPING_TEAM || DEVELOPING_TEAM.length === 0) {
    return null;
  }

  return (
    <div>
      {/* Heading */}
      <div className="mb-6 flex items-center gap-4">
        <span className="mono whitespace-nowrap text-[10px] uppercase tracking-[0.3em] text-[#A8A8A8]">
          DEVELOPING & DESIGN TEAM
        </span>

        <div className="h-px flex-1 bg-white/10" />
      </div>

      {/* Team cards */}
      <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-3 sm:gap-3 md:grid-cols-4 md:gap-4 lg:gap-6">
        {DEVELOPING_TEAM.map((member) => (
          <article
            key={member.id}
            className="group relative overflow-hidden rounded-lg glass glass-hover transition-all duration-300"
          >
            {/* Team photo */}
            <div className="relative aspect-[4/5] overflow-hidden">
              {member.image ? (
                <img
                  src={member.image}
                  alt={`${member.name} - ${member.role}`}
                  loading="lazy"
                  className="absolute inset-0 h-full w-full object-cover transition-all duration-500 group-hover:scale-105"
                />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center bg-[#151515]">
                  <span className="display text-2xl font-bold text-[#252525] sm:text-3xl md:text-4xl">
                    {member.name
                      .split(" ")
                      .map((name) => name[0])
                      .slice(0, 2)
                      .join("")}
                  </span>
                </div>
              )}

              <div className="absolute inset-0 bg-gradient-to-t from-[#030303] via-transparent to-transparent" />
            </div>

            {/* Team details */}
            <div className="p-1.5 sm:p-3 md:p-4 lg:p-5">
              <h3 className="display break-words text-[10px] font-semibold leading-tight tracking-tight text-white sm:text-sm md:text-base lg:text-lg">
                {member.name}
              </h3>

              <div className="mt-1 break-words text-[8px] uppercase leading-tight tracking-wide text-[#B52A32] sm:text-xs">
                {member.role}
              </div>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}