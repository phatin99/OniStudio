import Image from "next/image";
import Link from "@/components/ui/nav-link";
import {
  Aperture,
  ArrowUpRight,
  PackageCheck,
} from "lucide-react";
import { categoryLabel } from "@/lib/equipment";
import { href, formatMoney } from "@/lib/links";
import { equipmentImages } from "@/data/equipment-images";
import type {
  Equipment,
  EquipmentCategory,
  Locale,
} from "@/types/catalog";

export function EquipmentCard({
  item,
  allEquipment = [],
  categories,
  locale,
  compact = false,
}: {
  item: Equipment;
  allEquipment?: Equipment[];
  categories: EquipmentCategory[];
  locale: Locale;
  compact?: boolean;
}) {
  const { images, reference } = equipmentImages(item);
  const cover = images[0];
  const name = locale === "en" ? item.name_en : item.name;
  const category = categoryLabel(categories, item.category, locale);
  const description = item.description[locale];
  const detailHref = href(locale, `/equipment/${item.slug}`);
  const external = item.rental_source === "external";

  const resolvedFromCatalog = item.included_equipment_items ?? [];

  const resolvedFromVisibleEquipment = (item.included_equipment_ids ?? [])
    .map((id) => allEquipment.find((equipment) => equipment.id === id))
    .filter((equipment): equipment is Equipment => Boolean(equipment))
    .map((equipment) => ({
      id: equipment.id,
      name: equipment.name,
      name_en: equipment.name_en,
    }));

  const includedItems =
    resolvedFromCatalog.length > 0
      ? resolvedFromCatalog
      : resolvedFromVisibleEquipment;

  const includedCount =
    item.included_equipment_ids?.length ?? includedItems.length;

  return (
    <article className={`equipment-card equipment-card-v4${compact ? " equipment-card-compact-v1" : ""}`}>
      <Link className="equipment-image" href={detailHref}>
        {cover ? (
          <Image
            src={cover}
            alt={name}
            fill
            sizes="(max-width: 600px) 100vw, (max-width: 1024px) 50vw, 25vw"
          />
        ) : (
          <div className="equipment-placeholder">
            <Aperture size={54} strokeWidth={1} />
            <span>{category}</span>
          </div>
        )}

        {reference && (
          <span className="equipment-reference">
            {locale === "vi"
              ? "Ảnh sản phẩm từ hãng"
              : "Manufacturer reference"}
          </span>
        )}

        <span className="equipment-tag">{category}</span>
      </Link>

      <div className="card-body equipment-card-body-v4">
        {external && (
          <div className="equipment-card-source-row">
            <span className="equipment-source-badge external">
              {locale === "vi" ? "Thiết bị thuê ngoài" : "External rental"}
            </span>
          </div>
        )}

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
              "Miễn phí khi thuê phòng"
            ) : (
              "Included with room"
            )
          ) : item.price !== null ? (
            <>
              <strong>{formatMoney(item.price, locale)}</strong>
              <span> / {item.unit[locale]}</span>
            </>
          ) : locale === "vi" ? (
            "Liên hệ báo giá"
          ) : (
            "Contact for a quote"
          )}
        </p>

        {external && includedCount > 0 && (
          <div className="equipment-included-products">
            <div className="equipment-included-heading">
              <PackageCheck size={16} aria-hidden="true" />
              <span>
                {locale === "vi"
                  ? `Đi kèm ${includedCount} sản phẩm`
                  : `${includedCount} included items`}
              </span>
            </div>

            {includedItems.length > 0 ? (
              <div className="equipment-included-list">
                {includedItems.slice(0, 4).map((includedItem) => (
                  <span
                    className="equipment-included-chip"
                    key={includedItem.id}
                    title={
                      locale === "en"
                        ? includedItem.name_en
                        : includedItem.name
                    }
                  >
                    {locale === "en"
                      ? includedItem.name_en
                      : includedItem.name}
                  </span>
                ))}

                {includedItems.length > 4 && (
                  <span className="equipment-included-more">
                    +{includedItems.length - 4}
                  </span>
                )}
              </div>
            ) : (
              <p className="equipment-included-fallback">
                {locale === "vi"
                  ? "Phụ kiện đi kèm đã được cấu hình."
                  : "Included accessories are configured."}
              </p>
            )}
          </div>
        )}

        <p className="equipment-card-description">{description}</p>

        {!compact && (
          <Link className="equipment-card-view" href={detailHref}>
            {locale === "vi" ? "Xem hình ảnh" : "View images"}
            <ArrowUpRight size={16} aria-hidden="true" />
          </Link>
        )}
      </div>
    </article>
  );
}
