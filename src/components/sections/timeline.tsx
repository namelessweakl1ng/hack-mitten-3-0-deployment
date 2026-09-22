"use client";

import { useQuery } from "@tanstack/react-query";

type Phase = {
  id: string;
  name: string;
  description: string | null;
  startDate: string;
  startTime: string;
  endDate: string | null;
  endTime: string | null;
  sortOrder: number;
};

function phaseState(p: Phase): "completed" | "active" | "upcoming" {
  const now = Date.now();
  const start = new Date(`${p.startDate}T${p.startTime || "00:00"}:00`).getTime();
  const end = p.endDate ? new Date(`${p.endDate}T${p.endTime || "23:59"}:00`).getTime() : start + 3600000;
  if (now < start) return "upcoming";
  if (now > end) return "completed";
  return "active";
}

export function Timeline() {
  const { data } = useQuery<{ phases: Phase[] }>({
    queryKey: ["phases"],
    queryFn: async () => (await fetch("/api/phases")).json(),
  });
  const phases: Phase[] = data?.phases ?? [];
  if (phases.length === 0) return null;

  const activePhase = phases.find((p) => phaseState(p) === "active");
  const nextPhase = phases.find((p) => phaseState(p) === "upcoming");

  return (
    <section id="timeline" className="relative section-pad mx-auto max-w-7xl">
      <div className="mb-10 md:mb-16">
        <div className="mono text-xs uppercase tracking-[0.3em] text-[#B52A32] mb-4">
          / Timeline
        </div>
        <h2 className="display text-4xl sm:text-6xl md:text-7xl font-bold tracking-tight text-white leading-[0.95]">
          THE MISSION
          <br />
          <span className="text-[#A8A8A8]">PROTOCOL.</span>
        </h2>
      </div>

      {/* Live phase banner */}
      {(activePhase || nextPhase) && (
        <div className="glass rounded-lg p-5 md:p-6 mb-10 md:mb-12">
          {activePhase ? (
            <div className="flex flex-col md:flex-row md:items-center gap-3 md:gap-6">
              <div className="flex items-center gap-3">
                <span className="relative flex h-2.5 w-2.5">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#D83A43] opacity-75" />
                  <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-[#B52A32]" />
                </span>
                <span className="mono text-[10px] uppercase tracking-widest text-[#B52A32]">Live Now</span>
              </div>
              <div className="flex-1">
                <div className="display text-xl md:text-2xl font-bold text-white">{activePhase.name}</div>
                {activePhase.description && (
                  <div className="text-sm text-[#A8A8A8] mt-1">{activePhase.description}</div>
                )}
              </div>
            </div>
          ) : nextPhase ? (
            <div className="flex flex-col md:flex-row md:items-center gap-3 md:gap-6">
              <span className="mono text-[10px] uppercase tracking-widest text-[#A8A8A8]">Next Phase</span>
              <div className="flex-1">
                <div className="display text-xl md:text-2xl font-bold text-white">{nextPhase.name}</div>
                {nextPhase.description && (
                  <div className="text-sm text-[#A8A8A8] mt-1">{nextPhase.description}</div>
                )}
              </div>
              <div className="text-right">
                <div className="mono text-[10px] uppercase tracking-widest text-[#A8A8A8]">Starts at</div>
                <div className="mono text-sm text-[#B52A32] mt-0.5">{nextPhase.startTime}</div>
              </div>
            </div>
          ) : null}
        </div>
      )}

      {/* Phase grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 md:gap-4">
        {phases.map((p, i) => {
          const state = phaseState(p);
          const num = String(i + 1).padStart(2, "0");
          return (
            <div
              key={p.id}
              className={`relative rounded-lg p-4 md:p-5 border transition-all ${
                state === "active"
                  ? "border-[#B52A32] bg-[#B52A32]/10 red-glow"
                  : state === "completed"
                    ? "border-white/10 bg-[#080808] opacity-60"
                    : "border-white/5 bg-[#0a0a0a]"
              }`}
            >
              <div className={`mono text-xs mb-3 ${state === "active" ? "text-[#D83A43]" : "text-[#A8A8A8]"}`}>
                {num}
              </div>
              <div className={`display text-base md:text-lg font-bold leading-tight ${
                state === "active" ? "text-white" : state === "completed" ? "text-[#A8A8A8]" : "text-white/80"
              }`}>
                {p.name}
              </div>
              <div className="mono text-[10px] text-[#A8A8A8] mt-2">
                {p.startTime}
                {p.endTime && p.endTime !== p.startTime ? `—${p.endTime}` : ""}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
