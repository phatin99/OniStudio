import Image from "next/image";
import Link from "@/components/ui/nav-link";
import {
  ImageIcon,
  Images,
} from "lucide-react";
import { formatMoney, href } from "@/lib/links";
import type {
  Backdrop,
  Locale,
  PropItem,
} from "@/types/catalog";

type RentalAsset = Backdrop | PropItem;

function getImages(item: RentalAsset) {
  return Array.from(
    new Set(
      [
        ...(item.images || []),
        ...(item.image_url ? [item.image_url] : []),
      ].filter(Boolean),
    ),
  );
}

function assetKind(
  item: RentalAsset,
  locale: Locale,
  type: "backdrop" | "prop",
) {
  if (type === "prop") {
    return locale === "vi" ? "Đạo cụ" : "Prop";
  }

  if ("kind" in item && item.kind === "effect") {
    return locale === "vi"
      ? "Phông màu hiệu ứng"
      : "Effect backdrop";
  }

  return locale === "vi" ? "Phông màu" : "Color backdrop";
}

function detailPath(
  item: RentalAsset,
  type: "backdrop" | "prop",
) {
  if (type === "prop") return `/props/${item.slug}`;

  if ("kind" in item && item.kind === "effect") {
    return `/effect-backdrops/${item.slug}`;
  }

  return `/backdrops/${item.slug}`;
}

export function RentalAssetCard({
  item,
  locale,
  type,
}: {
  item: RentalAsset;
  locale: Locale;
  type: "backdrop" | "prop";
}) {
  const images = getImages(item);
  const cover = images[0] || null;
  const name = locale === "en" ? item.name_en : item.name;
  const description = item.description?.[locale] || "";
  const kind = assetKind(item, locale, type);
  const detailHref = href(locale, detailPath(item, type));

  return (
    <article className="equipment-card equipment-card-v4 rental-equipment-card">
      <Link
        className="equipment-image rental-equipment-image"
        href={detailHref}
        aria-label={
          locale === "vi"
            ? `Xem hình ảnh ${name}`
            : `View images of ${name}`
        }
      >
        {cover ? (
          <Image
            src={cover}
            alt={name}
            fill
            sizes="(max-width: 600px) 100vw, (max-width: 1024px) 50vw, 25vw"
          />
        ) : (
          <div className="equipment-placeholder">
            <ImageIcon size={48} strokeWidth={1.15} />
            <span>
              {locale === "vi"
                ? "Đang cập nhật ảnh"
                : "Image coming soon"}
            </span>
          </div>
        )}

        <span className="equipment-tag">{kind}</span>

        {images.length > 0 && (
          <span className="rental-equipment-image-count">
            <Images size={14} aria-hidden="true" />
            {images.length}
          </span>
        )}
      </Link>

      <div className="card-body equipment-card-body-v4 rental-equipment-card-body">
        <h3>
          <Link href={detailHref}>{name}</Link>
        </h3>

        <p
          className={`equipment-price ${
            item.included ? "is-free" : ""
          }`}
        >
          {item.included ? (
            locale === "vi" ? (
              "Miễn phí"
            ) : (
              "Free"
            )
          ) : item.price !== null ? (
            <strong>{formatMoney(item.price, locale)}</strong>
          ) : locale === "vi" ? (
            "Liên hệ"
          ) : (
            "Contact"
          )}
        </p>

        {description && (
          <p className="equipment-card-description">
            {description}
          </p>
        )}

      </div>
    </article>
  );
}

export function RentalAssetGrid({
  items,
  locale,
  type,
}: {
  items: RentalAsset[];
  locale: Locale;
  type: "backdrop" | "prop";
}) {
  if (!items.length) {
    return (
      <div className="empty-state rental-asset-empty">
        <h2>
          {locale === "vi"
            ? "Danh sách đang được cập nhật"
            : "This collection is being updated"}
        </h2>
        <p>
          {locale === "vi"
            ? "Liên hệ Oni Studio nếu bạn cần kiểm tra lựa chọn hiện có."
            : "Contact Oni Studio if you need to check current availability."}
        </p>
      </div>
    );
  }

  return (
    <div className="equipment-grid rental-equipment-grid">
      {items.map((item) => (
        <RentalAssetCard
          item={item}
          locale={locale}
          type={type}
          key={item.id}
        />
      ))}
    </div>
  );
}
