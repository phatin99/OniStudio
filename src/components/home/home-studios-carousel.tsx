"use client";

import { useEffect, useId, useRef, useState } from "react";
import type { ReactNode } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

type ScrollState = {
  previous: boolean;
  next: boolean;
  overflow: boolean;
};

export function HomeStudiosCarousel({
  children,
  count,
  locale,
}: {
  children: ReactNode;
  count: number;
  locale: "vi" | "en";
}) {
  const trackRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<{
    startX: number;
    originalScroll: number;
    active: boolean;
  } | null>(null);
  const cancelClickRef = useRef(false);
  const trackId = useId();
  const [scrollState, setScrollState] = useState<ScrollState>({
    previous: false,
    next: false,
    overflow: false,
  });

  useEffect(() => {
    const node = trackRef.current;
    if (!node) return;

    const update = () => {
      const hasOverflow = node.scrollWidth > node.clientWidth + 3;
      const previous = hasOverflow && node.scrollLeft > 3;
      const next = hasOverflow &&
        node.scrollLeft < node.scrollWidth - node.clientWidth - 3;
      setScrollState((current) =>
        current.previous === previous && current.next === next && current.overflow === hasOverflow
          ? current
          : { previous, next, overflow: hasOverflow },
      );
    };

    const frame = window.requestAnimationFrame(update);
    node.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);

    const observer = typeof ResizeObserver !== "undefined"
      ? new ResizeObserver(update)
      : null;
    observer?.observe(node);

    return () => {
      window.cancelAnimationFrame(frame);
      node.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
      observer?.disconnect();
    };
  }, [count]);

  function scroll(direction: -1 | 1) {
    const node = trackRef.current;
    if (!node) return;

    const firstCard = node.querySelector<HTMLElement>(".home-studios-slide-v1");
    if (!firstCard) return;
    const gap = Number.parseFloat(window.getComputedStyle(node).columnGap) || 0;
    node.scrollBy({
      left: direction * (firstCard.getBoundingClientRect().width + gap),
      behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches
        ? "instant"
        : "smooth",
    });
  }

  return (
    <div className="home-studios-carousel-v1">
      {count > 1 && scrollState.overflow && (
        <div className="home-studios-carousel-toolbar-v1">
          <span className="home-studios-carousel-help-v1">
            {locale === "vi" ? `${count} không gian · Vuốt để xem thêm` : `${count} spaces · Swipe to explore`}
          </span>
          <div className="home-studios-carousel-controls-v1">
            <button
              type="button"
              aria-label={locale === "vi" ? "Xem phòng trước" : "Previous space"}
              aria-controls={trackId}
              disabled={!scrollState.previous}
              onClick={() => scroll(-1)}
            >
              <ChevronLeft size={20} aria-hidden="true" />
            </button>
            <button
              type="button"
              aria-label={locale === "vi" ? "Xem phòng tiếp theo" : "Next space"}
              aria-controls={trackId}
              disabled={!scrollState.next}
              onClick={() => scroll(1)}
            >
              <ChevronRight size={20} aria-hidden="true" />
            </button>
          </div>
        </div>
      )}

      <div
        id={trackId}
        ref={trackRef}
        className="home-studios-carousel-track-v1"
        role="region"
        aria-roledescription="carousel"
        aria-label={locale === "vi" ? "Các phòng chụp nổi bật" : "Featured studio spaces"}
        tabIndex={0}
        onPointerDown={(event) => {
          if (event.pointerType !== "mouse" || event.button !== 0) return;
          dragRef.current = {
            startX: event.clientX,
            originalScroll: event.currentTarget.scrollLeft,
            active: false,
          };
          cancelClickRef.current = false;
        }}
        onPointerMove={(event) => {
          const drag = dragRef.current;
          if (!drag || event.pointerType !== "mouse") return;
          const delta = event.clientX - drag.startX;
          if (!drag.active && Math.abs(delta) > 7) {
            drag.active = true;
            event.currentTarget.setPointerCapture(event.pointerId);
          }
          if (drag.active) {
            event.currentTarget.scrollLeft = drag.originalScroll - delta;
          }
        }}
        onPointerUp={(event) => {
          const drag = dragRef.current;
          if (drag?.active) cancelClickRef.current = true;
          dragRef.current = null;
          if (event.currentTarget.hasPointerCapture(event.pointerId)) {
            event.currentTarget.releasePointerCapture(event.pointerId);
          }
        }}
        onPointerCancel={() => {
          dragRef.current = null;
        }}
        onClickCapture={(event) => {
          if (cancelClickRef.current) {
            event.preventDefault();
            event.stopPropagation();
            cancelClickRef.current = false;
          }
        }}
      >
        {children}
      </div>
    </div>
  );
}
