"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { resolveGalleryItems } from "@/data/gallery";

type GalleryItem = {
  id: string;
  title: string;
  caption: string | null;
  imageUrl: string;
  year: string;
};

export function Gallery() {
  const { data, error } = useQuery<{ items: GalleryItem[] }>({
    queryKey: ["gallery"],
    queryFn: async () => {
      const r = await fetch("/api/gallery");
      if (!r.ok) throw new Error("Failed to load gallery");
      return r.json();
    },
  });

  const items: GalleryItem[] = resolveGalleryItems(error ? null : data?.items ?? undefined);

  const [activeIdx, setActiveIdx] = useState(0);
  const [viewportWidth, setViewportWidth] = useState(0);
  const viewportRef = useRef<HTMLDivElement>(null);
  const touchStartX = useRef<number | null>(null);
  const pausedRef = useRef(false);

  useEffect(() => {
    if (items.length < 2 || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const timer = window.setInterval(() => {
      if (!pausedRef.current) setActiveIdx((i) => i + 1);
    }, 3200);
    return () => window.clearInterval(timer);
  }, [items.length]);

  useEffect(() => {
    if (items.length < 2) return;
    if (activeIdx >= items.length) {
      const timer = window.setTimeout(() => setActiveIdx((i) => i - items.length), 550);
      return () => window.clearTimeout(timer);
    }
    if (activeIdx < 0) {
      const timer = window.setTimeout(() => setActiveIdx((i) => i + items.length), 550);
      return () => window.clearTimeout(timer);
    }
  }, [activeIdx, items.length]);

  useEffect(() => {
    const el = viewportRef.current;
    if (!el) return;
    const measure = () => setViewportWidth(el.clientWidth);
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, [items.length]);

  const safeActiveIdx = items.length > 0
    ? ((activeIdx % items.length) + items.length) % items.length
    : 0;

  const goNext = useCallback(() => {
    pausedRef.current = true;
    setActiveIdx((i) => i + 1);
  }, [items.length]);
  const goPrev = useCallback(() => {
    pausedRef.current = true;
    setActiveIdx((i) => i - 1);
  }, []);

  const onTouchStart = (e: React.TouchEvent) => {
    pausedRef.current = true;
    touchStartX.current = e.touches[0].clientX;
  };
  const onTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null) return;
    const dx = e.changedTouches[0].clientX - touchStartX.current;
    if (Math.abs(dx) > 40) {
      if (dx < 0) goNext();
      else goPrev();
    }
    touchStartX.current = null;
    window.setTimeout(() => { pausedRef.current = false; }, 2400);
  };

  // ─── Responsive geometry ─────────────────────────────────────────────
  // Mobile: active image takes ~88% of viewport width, side previews are tiny slivers
  // Desktop: active image takes ~40% (max 480px), side previews ~20% each
  const isMobile = viewportWidth < 768;
  const activeWidth = isMobile ? viewportWidth * 0.88 : Math.min(viewportWidth * 0.4, 480);
  const slotWidth = activeWidth;
  const gap = isMobile ? 4 : 24;

  // Track offset to center the active item
  const trackOffset = viewportWidth > 0
    ? viewportWidth / 2 - ((activeIdx + items.length) * (slotWidth + gap) + slotWidth / 2)
    : 0;

  const loopedItems = [...items, ...items, ...items];
  const visualActiveIdx = activeIdx + items.length;

  // Mobile: no fixed viewport height — let the image aspect ratio define the height
  // Desktop: keep the cinematic fixed height
  const viewportHeight = isMobile ? "auto" : "70vh";
  const viewportMaxHeight = isMobile ? "none" : 640;

  return (
    <section id="gallery" className="relative py-12 md:py-24">
      <div className="mx-auto max-w-7xl px-4 md:px-10 mb-4 md:mb-12">
        <div className="flex items-end justify-between gap-4">
          <div>
            <div className="mono text-xs uppercase tracking-[0.3em] text-[#B52A32] mb-4">
              / Gallery
            </div>
            <h2 className="display text-4xl sm:text-6xl md:text-7xl font-bold tracking-tight text-white leading-[0.95]">
              PREVIOUS
              <br />
              <span className="text-[#A8A8A8]">MISSIONS.</span>
            </h2>
          </div>
          {items.length > 1 && (
            <div className="flex gap-2">
              <button
                onClick={goPrev}
                disabled={safeActiveIdx === 0}
                aria-label="Previous image"
                className="flex h-10 w-10 items-center justify-center rounded-full border border-white/15 text-white disabled:opacity-30 hover:border-[#B52A32] hover:bg-white/5 transition-all"
              >
                <ChevronLeft size={18} />
              </button>
              <button
                onClick={goNext}
                disabled={safeActiveIdx >= items.length - 1}
                aria-label="Next image"
                className="flex h-10 w-10 items-center justify-center rounded-full border border-white/15 text-white disabled:opacity-30 hover:border-[#B52A32] hover:bg-white/5 transition-all"
              >
                <ChevronRight size={18} />
              </button>
            </div>
          )}
        </div>
      </div>

      {items.length === 0 ? (
        <div className="mx-auto max-w-7xl px-4 md:px-10 py-20 text-center text-[#A8A8A8]">
          No gallery items yet.
        </div>
      ) : (
        <>
          {/* Gallery viewport — clips overflowing items */}
          <div
            ref={viewportRef}
            className="relative overflow-hidden select-none"
            style={{
              height: viewportHeight,
              maxHeight: viewportMaxHeight,
              touchAction: "pan-y",
              minHeight: isMobile ? 0 : "auto",
            }}
            onTouchStart={onTouchStart}
            onTouchEnd={onTouchEnd}
              onMouseEnter={() => { pausedRef.current = true; }}
              onMouseLeave={() => { pausedRef.current = false; }}
          >
            {/* Track */}
            <div
              className={isMobile ? "flex items-center transition-transform duration-500 ease-out" : "absolute top-0 left-0 flex items-center transition-transform duration-500 ease-out"}
              style={{
                transform: `translateX(${trackOffset}px)`,
                gap: `${gap}px`,
              }}
            >
              {loopedItems.map((item, i) => {
                const distance = Math.abs(i - visualActiveIdx);
                const isActive = distance === 0;
                const scale = isActive ? 1.0 : distance === 1 ? 0.72 : 0.55;
                const grayscale = isActive ? 0 : distance === 1 ? 0.5 : 0.85;
                const brightness = isActive ? 1 : 0.7;
                const opacity = isActive ? 1 : distance === 1 ? 0.5 : 0.25;
                const zIndex = isActive ? 10 : Math.max(1, 5 - distance);

                return (
                  <figure
                    key={`${item.id}-${i}`}
                    className="shrink-0 relative transition-all duration-500 ease-out cursor-pointer"
                    style={{
                      width: `${slotWidth}px`,
                      transform: `scale(${scale})`,
                      opacity,
                      zIndex,
                    }}
                    onClick={() => setActiveIdx(i - items.length)}
                  >
                    <div
                      className={`relative overflow-hidden bg-[#080808] border transition-colors ${
                        isActive ? "border-[#B52A32]/50" : "border-white/10"
                      }`}
                      style={{
                        aspectRatio: "4 / 3",
                        width: "100%",
                      }}
                    >
                      <img
                        src={item.imageUrl}
                        alt={item.title}
                        loading="lazy"
                        draggable={false}
                        className="absolute inset-0 h-full w-full object-cover transition-all duration-700"
                        style={{
                          filter: `grayscale(${Math.min(1, grayscale + 0.15)}) contrast(1.12) brightness(${brightness * 0.92})`,
                        }}
                      />
                      <div className="absolute inset-0 pointer-events-none bg-gradient-to-br from-[#8B1E24]/15 via-transparent to-black/35 mix-blend-multiply" />
                      {isActive && (
                        <div className="absolute inset-0 pointer-events-none ring-1 ring-[#B52A32]/50" />
                      )}
                    </div>
                  </figure>
                );
              })}
            </div>
          </div>

          {/* Caption — immediately below image, tight spacing */}
          <div className="mx-auto max-w-7xl px-4 md:px-10 mt-2 min-h-[44px]">
            {items[safeActiveIdx] && (
              <div className="transition-opacity duration-300">
                <div className="mono text-[10px] uppercase tracking-[0.25em] text-[#B52A32]">
                  {items[safeActiveIdx].year}
                </div>
                <div className="display mt-0.5 text-base md:text-lg font-semibold text-white">
                  {items[safeActiveIdx].title}
                </div>
                {items[safeActiveIdx].caption && (
                  <div className="mt-0.5 text-xs md:text-sm text-[#A8A8A8]">
                    {items[safeActiveIdx].caption}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Progress indicator */}
          {items.length > 1 && (
            <div className="mx-auto max-w-7xl px-4 md:px-10 mt-3 flex items-center gap-3">
              <span className="mono text-xs text-[#A8A8A8]">
                {String(safeActiveIdx + 1).padStart(2, "0")}
              </span>
              <div className="flex-1 h-px bg-white/10 relative overflow-hidden">
                <div
                  className="absolute top-0 left-0 h-full bg-[#B52A32] transition-all duration-500"
                  style={{ width: `${((safeActiveIdx + 1) / items.length) * 100}%` }}
                />
              </div>
              <span className="mono text-xs text-[#A8A8A8]">
                {String(items.length).padStart(2, "0")}
              </span>
            </div>
          )}
        </>
      )}
    </section>
  );
}
