"use client";
import Image from "next/image";
import { useRef, useState } from "react";
import { ChevronLeft, ChevronRight, Maximize2, X } from "lucide-react";
import type { Locale } from "@/types/catalog";
export function ProductGallery({
  images,
  name,
  locale,
  fit = "contain",
  caption,
  adaptiveAspectRatio = false,
}: {
  images: string[];
  name: string;
  locale: Locale;
  fit?: "contain" | "cover";
  caption?: string;
  adaptiveAspectRatio?: boolean;
}) {
  const [selected, setSelected] = useState(0);
  const [aspectRatios, setAspectRatios] = useState<Record<string, number>>({});
  const dialog = useRef<HTMLDialogElement>(null);
  const start = useRef<{ x: number; y: number } | null>(null);
  function step(delta: number) {
    setSelected((i) => (i + delta + images.length) % images.length);
  }
  const label = locale === "vi" ? "ảnh" : "image";
  const current = Math.min(selected, images.length - 1);
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
          alt={`${name} — ${label} ${current + 1}`}
          fill
          sizes={adaptiveAspectRatio ? "(max-width: 800px) 100vw, (max-width: 1400px) 90vw, 1600px" : "(max-width: 800px) 100vw, 60vw"}
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
          onClick={() => dialog.current?.showModal()}
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
              <Image src={src} alt="" fill sizes="90px" />
            </button>
          ))}
        </div>
      )}
      <dialog
        ref={dialog}
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
          <Image
            src={images[current]}
            alt={`${name} — ${label} ${current + 1}`}
            fill
            sizes="95vw"
          />
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
