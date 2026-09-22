"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { Countdown } from "./countdown";
import { useEventState } from "@/components/auth/use-event-state";

type EventConfig = {
  heroHeading: string;
  heroEdition: string;
  heroSubtitle: string;
  heroDescription: string;
  heroCtaText: string;
  heroCtaLink: string;
  heroVisible: boolean;
  eventDurationHours: number;
};

export function Hero() {
  const { data } = useQuery<{ config: EventConfig }>({
    queryKey: ["config"],
    queryFn: async () => (await fetch("/api/config")).json(),
  });
  const cfg = data?.config;
  const eventState = useEventState();
  const regOpen = eventState.data?.registrationOpen ?? true; // default open while loading
  // Registration is "full" when state is REGISTRATION_OPEN (deadline not passed) but either
  // the manual toggle is off (registrationsOpen=false) OR capacity has been reached.
  const isFull =
    !!eventState.data &&
    eventState.data.registrationOpen &&
    (!eventState.data.registrationsOpen ||
      (eventState.data.registrationCapacity > 0 &&
        eventState.data.currentCount >= eventState.data.registrationCapacity));

  const heading = cfg?.heroHeading || "HACKMITTEN";
  const edition = cfg?.heroEdition || "3.0";
  const subtitle = cfg?.heroSubtitle || "IDEAS BEYOND THE HORIZON";
  const subtitleLines = subtitle.split("|").map((s) => s.trim()).filter(Boolean);
  const description = cfg?.heroDescription || `${cfg?.eventDurationHours ?? 24} hours. Real problems. Limitless possibilities.`;
  const ctaText = cfg?.heroCtaText || "REGISTER NOW";
  const ctaLink = cfg?.heroCtaLink || "/register";

  return (
    <section
      id="home"
      className="relative flex min-h-[100svh] flex-col items-center justify-center px-5 pt-24 md:pt-28 text-center"
    >
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-[#030303] pointer-events-none" />

      <div className="relative z-10 flex flex-col items-center w-full max-w-4xl">
        <div className="mb-6 flex items-center gap-3 flex-wrap justify-center">
          <span className="h-px w-8 md:w-10 bg-[#B52A32]" />
          <span className="mono text-[10px] md:text-xs uppercase tracking-[0.3em] text-[#A8A8A8] text-center">
            {cfg?.eventDurationHours ?? 24} Hours · Real Problems
          </span>
          <span className="h-px w-8 md:w-10 bg-[#B52A32]" />
        </div>

        <h1 className="display text-[16vw] sm:text-[14vw] leading-[0.85] font-bold tracking-tight text-white md:text-[12vw] lg:text-[10rem]">
          <span className="block">{heading}</span>
          <span className="block text-[#B52A32] text-glow-red">{edition}</span>
        </h1>

        <p className="display mt-6 text-xl md:text-3xl font-light tracking-tight text-white/90">
          {subtitleLines.length > 1 ? (
            <>
              {subtitleLines[0]}
              <br />
              <span className="text-[#A8A8A8] text-lg md:text-2xl">{subtitleLines[1]}</span>
            </>
          ) : (
            subtitle
          )}
        </p>

        <p className="mt-6 max-w-md text-sm md:text-base text-[#A8A8A8]">
          {description}
        </p>

        <Countdown />

        <div className="mt-10 flex flex-col sm:flex-row gap-3">
          {regOpen && !isFull ? (
            <Link
              href={ctaLink}
              className="group flex items-center justify-center gap-2 rounded-full bg-[#B52A32] px-6 md:px-8 py-3.5 text-sm font-semibold tracking-wide text-white transition-all hover:bg-[#D83A43] hover:shadow-[0_0_40px_-8px_rgba(216,58,67,0.8)] min-h-[44px]"
            >
              {ctaText}
              <span className="transition-transform duration-200 group-hover:translate-x-1">→</span>
            </Link>
          ) : isFull ? (
            <div className="flex items-center justify-center gap-2 rounded-full border border-[#B52A32]/40 bg-[#B52A32]/10 px-6 md:px-8 py-3.5 text-sm font-semibold tracking-wide text-[#D83A43] min-h-[44px]">
              REGISTRATIONS FULL
            </div>
          ) : (
            <div className="flex items-center justify-center gap-2 rounded-full border border-white/15 px-6 md:px-8 py-3.5 text-sm font-semibold tracking-wide text-[#A8A8A8] min-h-[44px]">
              REGISTRATION CLOSED
            </div>
          )}
          <Link
            href="#about"
            className="flex items-center justify-center gap-2 rounded-full border border-white/15 px-6 md:px-8 py-3.5 text-sm font-semibold tracking-wide text-white transition-all hover:border-white/40 hover:bg-white/5 min-h-[44px]"
          >
            EXPLORE
          </Link>
        </div>
      </div>

      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-10 flex flex-col items-center gap-2">
        <span className="mono text-[10px] uppercase tracking-widest text-[#A8A8A8]/60">Scroll</span>
        <div className="h-8 w-px bg-gradient-to-b from-[#B52A32]/80 to-transparent" />
      </div>
    </section>
  );
}
