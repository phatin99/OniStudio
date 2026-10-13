"use client";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, Maximize2, X } from "lucide-react";
import type { Locale } from "@/types/catalog";

// oni-room-gallery-speed-v1: helpers
const ROOM_MAIN_SIZES = "(max-width: 800px) 100vw, (max-width: 1400px) 90vw, 1120px";
const ROOM_PRELOAD_WIDTHS = [640, 750, 828, 1080, 1200, 1920];

function isStudioCloudinaryImage(src: string) {
  return /^https:\/\/res\.cloudinary\.com\/[^/]+\/image\/upload\//i.test(src);
}

function studioCloudinaryLoader({
  src,
  width,
  quality,
}: {
  src: string;
  width: number;
  quality?: number;
}) {
  if (!isStudioCloudinaryImage(src)) return src;
  const thumbnail = quality !== undefined && quality < 70;
  const optimizedWidth = Math.min(Math.max(1, Math.round(width)), thumbnail ? 256 : 1920);
  const autoQuality = thumbnail ? "q_auto:eco" : "q_auto:good";
  return src.replace(
    "/image/upload/",
    `/image/upload/f_auto,${autoQuality},c_limit,w_${optimizedWidth}/`,
  );
}
// oni-room-gallery-speed-v1: helpers end
export function ProductGallery({
  images,
  name,
  locale,
  fit = "contain",
  caption,
  fastStudioImages = false,
  adaptiveAspectRatio = false,
}: {
  images: string[];
  name: string;
  locale: Locale;
  fit?: "contain" | "cover";
  caption?: string;
  fastStudioImages?: boolean;
  adaptiveAspectRatio?: boolean;
}) {
  const [selected, setSelected] = useState(0);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [aspectRatios, setAspectRatios] = useState<Record<string, number>>({});
  const dialog = useRef<HTMLDialogElement>(null);
  const start = useRef<{ x: number; y: number } | null>(null);
  function step(delta: number) {
    setSelected((i) => (i + delta + images.length) % images.length);
  }
  const label = locale === "vi" ? "ảnh" : "image";
  const current = Math.min(selected, images.length - 1);
  const prefetchedRoomPhotos = useRef<Set<string>>(new Set());
  const pendingRoomPhoto = useRef<HTMLImageElement | null>(null);
  useEffect(() => {
    if (!fastStudioImages || images.length < 2) return;
    const upcoming = images[(current + 1) % images.length];
    if (!upcoming || !isStudioCloudinaryImage(upcoming) || prefetchedRoomPhotos.current.has(upcoming)) return;

    // Let the visible image start loading first; then warm the next image cache.
    const preloadTimer = window.setTimeout(() => {
      if (prefetchedRoomPhotos.current.has(upcoming)) return;
      prefetchedRoomPhotos.current.add(upcoming);
      const photo = new window.Image();
      photo.decoding = "async";
      photo.sizes = ROOM_MAIN_SIZES;
      photo.srcset = ROOM_PRELOAD_WIDTHS.map(
        (width) => `${studioCloudinaryLoader({ src: upcoming, width, quality: 82 })} ${width}w`,
      ).join(", ");
      photo.src = studioCloudinaryLoader({ src: upcoming, width: 1200, quality: 82 });
      pendingRoomPhoto.current = photo;
    }, 450);
    return () => window.clearTimeout(preloadTimer);
  }, [current, fastStudioImages, images]);
  if (!images.length) return null;
  return (
    <div
      className={`product-gallery gallery-fit-${fit}`}
      onKeyDown={(e) => {
        if (e.key === "ArrowLeft") {
          e.preventDefault();
          step(-1);
        }
        if (e.key === "ArrowRight") {
          e.preventDefault();
          step(1);
        }
      }}
    >
      <div
        className="gallery-stage"
        style={
          adaptiveAspectRatio
            ? { aspectRatio: aspectRatios[images[current]] ?? 16 / 10 }
            : undefined
        }
        onTouchStart={(e) => {
          start.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
        }}
        onTouchEnd={(e) => {
          if (
            start.current !== null &&
            Math.abs(e.changedTouches[0].clientX - start.current.x) > 55 &&
            Math.abs(e.changedTouches[0].clientX - start.current.x) >
              Math.abs(e.changedTouches[0].clientY - start.current.y)
          )
            step(e.changedTouches[0].clientX < start.current.x ? 1 : -1);
          start.current = null;
        }}
      >
        <Image
          key={images[current]}
          src={images[current]}
          loader={fastStudioImages && isStudioCloudinaryImage(images[current]) ? studioCloudinaryLoader : undefined}
          quality={fastStudioImages ? 82 : undefined}
          alt={`${name} — ${label} ${current + 1}`}
          fill
          sizes={fastStudioImages ? ROOM_MAIN_SIZES : adaptiveAspectRatio ? "(max-width: 800px) 100vw, (max-width: 1400px) 90vw, 1600px" : "(max-width: 800px) 100vw, 60vw"}
          priority={current === 0}
          onLoad={(event) => {
            if (!adaptiveAspectRatio) return;
            const { naturalWidth, naturalHeight } = event.currentTarget;
            if (naturalWidth <= 0 || naturalHeight <= 0) return;
            const ratio = naturalWidth / naturalHeight;
            const imageSrc = images[current];
            setAspectRatios((previous) =>
              previous[imageSrc] === ratio
                ? previous
                : { ...previous, [imageSrc]: ratio },
            );
          }}
        />
        <button
          className="icon-button gallery-expand"
          aria-label={locale === "vi" ? "Phóng to ảnh" : "Enlarge image"}
          onClick={() => {
            setIsDialogOpen(true);
            dialog.current?.showModal();
          }}
        >
          <Maximize2 size={18} />
        </button>
        {caption && <span className="image-caption">{caption}</span>}
      </div>
      <div className="gallery-pagination">
        <span aria-live="polite">
          {String(current + 1).padStart(2, "0")} /{" "}
          {String(images.length).padStart(2, "0")}
        </span>
        <div>
          <button
            className="icon-button"
            disabled={images.length < 2}
            aria-label={locale === "vi" ? "Ảnh trước" : "Previous image"}
            onClick={() => step(-1)}
          >
            <ChevronLeft size={18} />
          </button>
          <button
            className="icon-button"
            disabled={images.length < 2}
            aria-label={locale === "vi" ? "Ảnh tiếp" : "Next image"}
            onClick={() => step(1)}
          >
            <ChevronRight size={18} />
          </button>
        </div>
      </div>
      {images.length > 1 && (
        <div className="gallery-thumbnails">
          {images.map((src, index) => (
            <button
              key={`${src}-${index}`}
              aria-label={`${locale === "vi" ? "Xem ảnh" : "View image"} ${index + 1}`}
              aria-pressed={current === index}
              onClick={() => setSelected(index)}
            >
              <Image
                src={src}
                alt=""
                fill
                sizes="90px"
                loading="lazy"
                loader={fastStudioImages && isStudioCloudinaryImage(src) ? studioCloudinaryLoader : undefined}
                quality={fastStudioImages ? 60 : undefined}
              />
            </button>
          ))}
        </div>
      )}
      <dialog
        ref={dialog}
        onClose={() => setIsDialogOpen(false)}
        className="lightbox product-lightbox"
        aria-label={`${name} — ${locale === "vi" ? "Xem ảnh lớn" : "Image viewer"}`}
        onClick={(e) => {
          if (e.target === e.currentTarget) dialog.current?.close();
        }}
      >
        <button
          className="icon-button lightbox-close"
          aria-label={locale === "vi" ? "Đóng ảnh" : "Close image"}
          onClick={() => dialog.current?.close()}
        >
          <X />
        </button>
        <div className="lightbox-image">
          {(!fastStudioImages || isDialogOpen) && (
          <Image
            src={images[current]}
            alt={`${name} — ${label} ${current + 1}`}
            fill
            sizes={fastStudioImages ? "100vw" : "95vw"}
            loader={fastStudioImages && isStudioCloudinaryImage(images[current]) ? studioCloudinaryLoader : undefined}
            quality={fastStudioImages ? 82 : undefined}
          />
          )}
        </div>
        {images.length > 1 && (
          <div className="lightbox-controls">
            <button
              className="icon-button"
              aria-label={locale === "vi" ? "Ảnh trước" : "Previous image"}
              onClick={() => step(-1)}
            >
              <ChevronLeft />
            </button>
            <span aria-live="polite">
              {current + 1} / {images.length}
            </span>
            <button
              className="icon-button"
              aria-label={locale === "vi" ? "Ảnh tiếp" : "Next image"}
              onClick={() => step(1)}
            >
              <ChevronRight />
            </button>
          </div>
        )}
      </dialog>
    </div>
  );
}
