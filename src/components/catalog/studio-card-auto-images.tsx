"use client";

import Image from "next/image";
import { useEffect, useMemo, useRef, useState } from "react";

const ROTATE_MS = 3000;

export function StudioCardAutoImages({
  images,
  fallback = "/images/studio-concept.webp",
  alt,
  slug,
  autoRotate = false,
  priority = false,
}: {
  images: string[];
  fallback?: string;
  alt: string;
  slug: string;
  autoRotate?: boolean;
  priority?: boolean;
}) {
  const sources = useMemo(() => {
    const clean = Array.from(
      new Set(images.map((value) => value.trim()).filter(Boolean)),
    );

    return clean.length ? clean : [fallback];
  }, [fallback, images]);

  const [activeIndex, setActiveIndex] = useState(0);
  // oni-visible-slideshow-v1: never rotate or fetch the next image off screen.
  const slideshowRef = useRef<HTMLSpanElement>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    if (!autoRotate || sources.length < 2) return;
    const node = slideshowRef.current;
    if (!node) return;
    let withinView = false;
    const syncVisibility = () => {
      setVisible(withinView && !document.hidden);
    };
    const observer = new IntersectionObserver((entries) => {
      withinView = Boolean(entries[0]?.isIntersecting);
      syncVisibility();
    }, { rootMargin: "100px" });
    observer.observe(node);
    document.addEventListener("visibilitychange", syncVisibility);
    return () => {
      observer.disconnect();
      document.removeEventListener("visibilitychange", syncVisibility);
    };
  }, [autoRotate, sources.length]);
  const safeActiveIndex = activeIndex % sources.length;

  useEffect(() => {
    if (!autoRotate || !visible || sources.length < 2) return;

    const timeoutId = window.setTimeout(() => {
      setActiveIndex((current) => (current + 1) % sources.length);
    }, ROTATE_MS);

    return () => window.clearTimeout(timeoutId);
  }, [autoRotate, visible, safeActiveIndex, sources.length]);

  useEffect(() => {
    if (!autoRotate || !visible || sources.length < 2) return;

    const nextIndex = (safeActiveIndex + 1) % sources.length;
    const preload = new window.Image();
    preload.src = sources[nextIndex];
  }, [autoRotate, visible, safeActiveIndex, sources]);

  return (
    <span
      ref={slideshowRef}
      className="studio-card-slideshow-v25"
      data-image-count={sources.length}
      data-active-index={safeActiveIndex}
      data-auto-rotate={autoRotate ? "true" : "false"}
      aria-hidden="true"
    >
      {sources.map((src, index) => {
        const active = index === safeActiveIndex;

        return (
          <Image
            key={`${src}-${index}`}
            src={src}
            fill
            sizes="(max-width: 767px) 100vw, (max-width: 1100px) 50vw, 680px"
            alt={active ? alt : ""}
            priority={priority && index === 0}
            className={`room-image room-${slug} studio-card-slide-v25${
              active ? " is-active" : ""
            }`}
          />
        );
      })}

      {autoRotate && sources.length > 1 && (
        <span className="studio-card-progress-v25" aria-hidden="true">
          <span
            key={`progress-${safeActiveIndex}`}
            className="studio-card-progress-bar-v25"
          />
        </span>
      )}
    </span>
  );
}
