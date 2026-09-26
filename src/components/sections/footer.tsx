"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";

type EventConfig = {
  eventName: string;
  edition: string;
  footerText: string;
  collegeName: string;
  collegeLogoUrl: string;
  contactEmail: string;
  socialLinks: {
    instagram?: string;
    linkedin?: string;
  };
};

export function Footer() {
  const { data } = useQuery<{ config: EventConfig }>({
    queryKey: ["config"],
    queryFn: async () => (await fetch("/api/config")).json(),
  });

  const cfg = data?.config;

  return (
    <footer
      className="relative mt-20 pt-12 md:mt-32 md:pt-20"
      style={{
        borderTop: "1px solid rgba(181, 42, 50, 0.2)",
        boxShadow: "0 -1px 20px -5px rgba(181, 42, 50, 0.15)",
      }}
    >
      {/* Subtle gradient transition band at the top of the footer */}
      <div
        className="pointer-events-none absolute top-0 left-0 right-0 h-px"
        style={{
          background:
            "linear-gradient(to right, transparent 0%, rgba(181, 42, 50, 0.4) 50%, transparent 100%)",
        }}
      />

      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-transparent to-[#000]" />

      <div className="relative mx-auto max-w-7xl px-5 py-14 md:px-10 md:py-24">
        <div className="grid gap-10 md:grid-cols-12 md:gap-12">

          {/* ================= LEFT SECTION ================= */}
          <div className="md:col-span-7">
            <h3 className="display text-3xl font-bold leading-[0.95] tracking-tight text-white md:text-5xl">
              {cfg?.footerText || "SEE YOU AT THE EVENT HORIZON."}
            </h3>

            <div className="mt-6 flex items-baseline gap-2">
              <span className="display text-xl font-bold text-white md:text-2xl">
                {cfg?.eventName || "HACKMITTEN"}
              </span>

              <span className="mono text-xs text-[#B52A32] md:text-sm">
                {cfg?.edition || "3.0"}
              </span>
            </div>
          </div>

          {/* ================= RIGHT SECTION ================= */}
          <div className="grid grid-cols-2 gap-6 text-sm md:col-span-5">

            {/* Contact */}
            <div>
              <div className="mono mb-3 text-[10px] uppercase tracking-widest text-[#A8A8A8]">
                Contact
              </div>

              {cfg?.contactEmail && (
                <a
                  href={`mailto:${cfg.contactEmail}`}
                  className="block break-words text-white/80 transition-colors hover:text-white"
                >
                  {cfg.contactEmail}
                </a>
              )}
            </div>

            {/* Venue */}
            <div>
              <div className="mono mb-3 text-[10px] uppercase tracking-widest text-[#A8A8A8]">
                Venue
              </div>

              <div className="leading-snug text-white/80">
                {cfg?.collegeName ||
                  "MAHARAJA INSTITUTE OF TECHNOLOGY THANDAVAPURA"}
              </div>
            </div>

            {/* Quick Links */}
            <div>
              <div className="mono mb-3 text-[10px] uppercase tracking-widest text-[#A8A8A8]">
                Quick Links
              </div>

              <Link
                href="/"
                className="block text-white/80 transition-colors hover:text-white"
              >
                Home
              </Link>

              <Link
                href="/#about"
                className="block text-white/80 transition-colors hover:text-white"
              >
                About
              </Link>

              <Link
                href="/#gallery"
                className="block text-white/80 transition-colors hover:text-white"
              >
                Gallery
              </Link>

              <Link
                href="/#crew"
                className="block text-white/80 transition-colors hover:text-white"
              >
                Crew
              </Link>
            </div>

            {/* Social */}
            <div>
              <div className="mono mb-3 text-[10px] uppercase tracking-widest text-[#A8A8A8]">
                Social
              </div>

              {cfg?.socialLinks?.instagram && (
                <a
                  href={cfg.socialLinks.instagram}
                  target="_blank"
                  rel="noreferrer"
                  className="block text-white/80 transition-colors hover:text-white"
                >
                  Instagram
                </a>
              )}

              {cfg?.socialLinks?.linkedin && (
                <a
                  href={cfg.socialLinks.linkedin}
                  target="_blank"
                  rel="noreferrer"
                  className="block text-white/80 transition-colors hover:text-white"
                >
                  LinkedIn
                </a>
              )}
            </div>

          </div>
        </div>

        {/* ================= BOTTOM BAR ================= */}
        <div className="mt-12 flex flex-col gap-6 border-t border-white/5 pt-6 md:mt-16 md:flex-row md:items-end md:justify-between md:pt-8">

          {/* Copyright */}
          <div>
            <div className="mono text-[10px] uppercase tracking-widest text-[#A8A8A8]">
              © {new Date().getFullYear()}{" "}
              {cfg?.eventName || "Hackmitten"} · All Rights Reserved
            </div>

            <div className="mono mt-1 text-[10px] uppercase tracking-widest text-[#A8A8A8]">
              Black is the universe · White is information · Red is energy
            </div>
          </div>

          {/* College Logo */}
          <div className="flex flex-col items-start gap-2 md:items-end">
            <div className="mono text-[9px] uppercase tracking-widest text-[#A8A8A8]/60">
              {cfg?.collegeName ||
                "MAHARAJA INSTITUTE OF TECHNOLOGY THANDAVAPURA"}
            </div>

            <img
              src={
                cfg?.collegeLogoUrl ||
                "/images/branding/mitt-logo.png"
              }
              alt="MIT Thandavapura logo"
              className="h-10 w-auto object-contain opacity-100 md:h-12"
            />
          </div>

        </div>
      </div>
    </footer>
  );
}