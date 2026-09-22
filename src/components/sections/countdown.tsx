"use client";

import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";

type EventConfig = {
  eventStartDate: string;
  eventStartTime: string;
  eventTimezone: string;
  eventEndDate: string;
  eventEndTime: string;
  eventDurationHours: number;
};

type Remaining = {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  isLive: boolean;
  isComplete: boolean;
};

function computeRemaining(startIso: string, endIso: string): Remaining {
  const now = Date.now();
  const start = new Date(startIso).getTime();
  const end = new Date(endIso).getTime();
  if (isNaN(start)) {
    return { days: 0, hours: 0, minutes: 0, seconds: 0, isLive: false, isComplete: false };
  }
  if (now < start) {
    const diff = start - now;
    return {
      days: Math.floor(diff / 86400000),
      hours: Math.floor((diff % 86400000) / 3600000),
      minutes: Math.floor((diff % 3600000) / 60000),
      seconds: Math.floor((diff % 60000) / 1000),
      isLive: false,
      isComplete: false,
    };
  }
  if (now >= start && (isNaN(end) || now < end)) {
    return { days: 0, hours: 0, minutes: 0, seconds: 0, isLive: true, isComplete: false };
  }
  return { days: 0, hours: 0, minutes: 0, seconds: 0, isLive: false, isComplete: true };
}

export function Countdown() {
  const { data } = useQuery<{ config: EventConfig }>({
    queryKey: ["config"],
    queryFn: async () => (await fetch("/api/config")).json(),
  });
  const cfg = data?.config;

  // Compose ISO datetime from date + time fields
  const startIso = cfg ? `${cfg.eventStartDate}T${cfg.eventStartTime || "00:00"}:00` : "";
  const endIso = cfg ? `${cfg.eventEndDate}T${cfg.eventEndTime || "00:00"}:00` : "";

  const [remaining, setRemaining] = useState<Remaining>({
    days: 0, hours: 0, minutes: 0, seconds: 0, isLive: false, isComplete: false,
  });

  useEffect(() => {
    if (!startIso) return;
    const tick = () => setRemaining(computeRemaining(startIso, endIso));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [startIso, endIso]);

  if (!cfg) {
    return (
      <div className="flex items-center justify-center gap-4 md:gap-8 mt-8">
        {[24, 13, 42, 9].map((_, i) => (
          <div key={i} className="h-16 w-16 md:h-20 md:w-20 rounded bg-white/5 animate-pulse" />
        ))}
      </div>
    );
  }

  if (remaining.isLive) {
    return (
      <div className="mt-8 flex items-center gap-3">
        <span className="relative flex h-2.5 w-2.5">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#D83A43] opacity-75" />
          <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-[#B52A32]" />
        </span>
        <span className="display text-base md:text-xl font-bold text-white tracking-tight">
          HACKATHON LIVE
        </span>
        <span className="mono text-xs text-[#A8A8A8]">· {cfg.eventDurationHours}H RUNNING</span>
      </div>
    );
  }

  if (remaining.isComplete) {
    return (
      <div className="mt-8 display text-base md:text-xl font-bold text-[#A8A8A8]">
        THE MISSION IS COMPLETE.
      </div>
    );
  }

  const units: { label: string; value: number }[] = [
    { label: "DAYS", value: remaining.days },
    { label: "HOURS", value: remaining.hours },
    { label: "MINUTES", value: remaining.minutes },
    { label: "SECONDS", value: remaining.seconds },
  ];

  return (
    <div className="mt-8 flex items-center justify-center gap-2 md:gap-4">
      {units.map((u, i) => (
        <div key={u.label} className="flex items-center gap-2 md:gap-4">
          <div className="flex flex-col items-center">
            <div className="display text-3xl md:text-5xl font-bold text-white tabular-nums min-w-[2.5ch] md:min-w-[3ch] text-center">
              {String(u.value).padStart(2, "0")}
            </div>
            <div className="mono text-[9px] md:text-[10px] uppercase tracking-widest text-[#A8A8A8] mt-1">
              {u.label}
            </div>
          </div>
          {i < units.length - 1 && (
            <span className="display text-2xl md:text-4xl text-[#B52A32] -mt-4">:</span>
          )}
        </div>
      ))}
    </div>
  );
}
