"use client";

import dynamic from "next/dynamic";
import { useScrollProgress } from "@/components/three/use-scroll-progress";
import { PublicNav } from "@/components/public/nav";
import { Hero } from "@/components/sections/hero";
import { About } from "@/components/sections/about";
import { Timeline } from "@/components/sections/timeline";
import { Gallery } from "@/components/sections/gallery";
import { Coordinators } from "@/components/sections/coordinators";
import { Sponsors } from "@/components/sections/sponsors";
import { Venue } from "@/components/sections/venue";
import { Winners } from "@/components/sections/winners";
import { CTA } from "@/components/sections/cta";
import { Footer } from "@/components/sections/footer";
import { useQuery } from "@tanstack/react-query";

// Black hole 3D scene — loaded client-side only, with SSR disabled
const SpaceScene = dynamic(
  () => import("@/components/three/space-scene"),
  { ssr: false, loading: () => null },
);

export default function HomePage() {
  const { scrollProgress } = useScrollProgress();

  // Check if winners mode is enabled
  const { data: winnersData } = useQuery<{ visible: boolean }>({
    queryKey: ["winners"],
    queryFn: async () => (await fetch("/api/winners")).json(),
  });
  const winnersMode = winnersData?.visible === true;

  // Check hero visibility — when false, the Hero section is NOT rendered at all
  const { data: configData } = useQuery<{ config: { heroVisible: boolean } }>({
    queryKey: ["config"],
    queryFn: async () => (await fetch("/api/config")).json(),
  });
  const heroVisible = configData?.config?.heroVisible !== false; // default true while loading

  return (
    <main className="relative min-h-screen bg-[#030303] text-white overflow-x-hidden">
      {/* Cinematic 3D background — fixed, behind all content */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <SpaceScene scrollProgress={scrollProgress} />
      </div>

      {/* Subtle vignette overlay */}
      <div
        className="fixed inset-0 z-[1] pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse at center, transparent 40%, rgba(3,3,3,0.7) 100%)",
        }}
      />

      <div className="relative z-10">
        <PublicNav />
        {/* Hero is conditionally rendered — when heroVisible=false, the section
            is removed from the DOM entirely (not just hidden with CSS) */}
        {heroVisible && <Hero />}

        {winnersMode ? (
          <>
            <Winners />
          </>
        ) : (
          <>
            <About />
            <Timeline />
            <Gallery />
            <Coordinators />
            <Sponsors />
            <Venue />
            <Winners />
            <CTA />
          </>
        )}

        <Footer />
      </div>
    </main>
  );
}
