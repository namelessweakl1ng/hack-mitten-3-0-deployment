"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { HACKMITTEN_EVENT } from "@/lib/event-config";

type EventConfig = {
  eventName: string;
  edition: string;
  footerText: string;
  collegeName: string;
  collegeLogoUrl: string;
  contactEmail: string;
  socialLinks: { instagram?: string; linkedin?: string };
};

export function Footer() {
  const { data } = useQuery<{ config: EventConfig }>({
    queryKey: ["config"],
    queryFn: async () => (await fetch("/api/config")).json(),
  });
  const cfg = data?.config;

  return (
    <footer
      className="relative mt-20 md:mt-32 pt-12 md:pt-20"
      style={{
        borderTop: "1px solid rgba(181, 42, 50, 0.2)",
        boxShadow: "0 -1px 20px -5px rgba(181, 42, 50, 0.15)",
      }}
    >
      {/* Subtle gradient transition band at the top of the footer */}
      <div
        className="absolute top-0 left-0 right-0 h-px pointer-events-none"
        style={{
          background: "linear-gradient(to right, transparent 0%, rgba(181, 42, 50, 0.4) 50%, transparent 100%)",
        }}
      />
      <div className="absolute inset-0 bg-gradient-to-b from-transparent to-[#000] pointer-events-none" />

      <div className="relative mx-auto max-w-7xl px-5 md:px-10 py-14 md:py-24">
        <div className="grid gap-10 md:gap-12 md:grid-cols-12">
          <div className="md:col-span-7">
            <h3 className="display text-3xl md:text-5xl font-bold tracking-tight text-white leading-[0.95]">
              {cfg?.footerText || "SEE YOU AT THE EVENT HORIZON."}
            </h3>
            <div className="mt-6 flex items-baseline gap-2">
              <span className="display text-xl md:text-2xl font-bold text-white">
                {cfg?.eventName || "HACKMITTEN"}
              </span>
              <span className="mono text-xs md:text-sm text-[#B52A32]">{cfg?.edition || "3.0"}</span>
            </div>
          </div>

          <div className="md:col-span-5 grid grid-cols-2 gap-6 text-sm">
            <div>
              <div className="mono text-[10px] uppercase tracking-widest text-[#A8A8A8] mb-3">
                Contact
              </div>
              {cfg?.contactEmail && (
                <a
                  href={`mailto:${cfg.contactEmail}`}
                  className="block text-white/80 hover:text-white break-words"
                >
                  {cfg.contactEmail}
                </a>
              )}
              {/* NO PHONE NUMBER per spec */}
            </div>

            <div>
              <div className="mono text-[10px] uppercase tracking-widest text-[#A8A8A8] mb-3">
                Venue
              </div>
              <div className="text-white/80 leading-snug">
                {cfg?.collegeName || "MAHARAJA INSTITUTE OF TECHNOLOGY THANDAVAPURA"}
              </div>
            </div>

            <div>
              <div className="mono text-[10px] uppercase tracking-widest text-[#A8A8A8] mb-3">
                Quick Links
              </div>
              <Link href="/" className="block text-white/80 hover:text-white">Home</Link>
              <Link href="/#about" className="block text-white/80 hover:text-white">About</Link>
              <Link href="/#gallery" className="block text-white/80 hover:text-white">Gallery</Link>
              <Link href="/#crew" className="block text-white/80 hover:text-white">Crew</Link>
            </div>

            <div>
              <div className="mono text-[10px] uppercase tracking-widest text-[#A8A8A8] mb-3">
                Social
              </div>
              {cfg?.socialLinks?.instagram && (
                <a href={cfg.socialLinks.instagram} target="_blank" rel="noreferrer" className="block text-white/80 hover:text-white">
                  Instagram
                </a>
              )}
              {cfg?.socialLinks?.linkedin && (
                <a href={cfg.socialLinks.linkedin} target="_blank" rel="noreferrer" className="block text-white/80 hover:text-white">
                  LinkedIn
                </a>
              )}
            </div>

            <div>
              <div className="mono text-[10px] uppercase tracking-widest text-[#A8A8A8] mb-3">
                Website Team
              </div>
              <div className="space-y-1 text-white/80">
                {HACKMITTEN_EVENT.websiteTeam.map((member) => (
                  <div key={member}>{member}</div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Bottom bar: copyright + college logo */}
        <div className="mt-12 md:mt-16 pt-6 md:pt-8 border-t border-white/5 flex flex-col md:flex-row md:items-end md:justify-between gap-6">
          <div>
            <div className="mono text-[10px] uppercase tracking-widest text-[#A8A8A8]">
              © {new Date().getFullYear()} {cfg?.eventName || "Hackmitten"} · All Rights Reserved
            </div>
            <div className="mono text-[10px] uppercase tracking-widest text-[#A8A8A8] mt-1">
              Black is the universe · White is information · Red is energy
            </div>
          </div>

          {/* College logo at the extreme bottom */}
          <div className="flex flex-col items-start md:items-end gap-2">
            <div className="mono text-[9px] uppercase tracking-widest text-[#A8A8A8]/60">
              {cfg?.collegeName || "MAHARAJA INSTITUTE OF TECHNOLOGY THANDAVAPURA"}
            </div>
            {cfg?.collegeLogoUrl ? (
               
              <img
                src={cfg.collegeLogoUrl}
                alt="College logo"
                className="h-10 md:h-12 w-auto object-contain opacity-60"
              />
            ) : (
              <div className="h-10 md:h-12 px-4 flex items-center justify-center rounded border border-white/10 bg-[#080808]">
                <span className="mono text-[10px] uppercase tracking-widest text-[#A8A8A8]">
                  MIT THANDAVAPURA
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    </footer>
  );
}
