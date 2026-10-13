import { ProductGallery } from "@/components/catalog/product-gallery";
import Link from "@/components/ui/nav-link";
import { notFound } from "next/navigation";
import {
  Check,
  Clock,
  Info,
  Maximize2,
} from "lucide-react";
import { getCatalog } from "@/lib/catalog";
import { context, href, money } from "@/lib/i18n";
import { pageMetadata } from "@/lib/metadata";
import {
  normalizeStudioDetailContent,
  renderStudioTemplate,
  studioDetailBlocks,
  studioDetailRules,
  studioDimensions,
} from "@/data/studio-detail";
import type { Locale } from "@/types/catalog";

type Props = { params: Promise<{ slug: string }> };

type AmenityGroup = {
  title: string;
  body: string;
};

function expandLegacyAmenityGroups(
  groups: AmenityGroup[],
  locale: Locale,
) {
  if (groups.length !== 1) return groups;

  const current = groups[0];
  const markers =
    locale === "vi"
      ? [
          "Phụ kiện trong phòng",
          "Tạo hình ánh sáng",
          "Softbox",
        ]
      : [
          "Studio accessories",
          "Light shaping",
          "Softboxes",
        ];

  let body = current.body;
  let title = current.title;
  const recovered: AmenityGroup[] = [];

  for (const marker of markers) {
    const token = `${marker} |`;
    const index = body.indexOf(token);

    if (index < 0) continue;

    const sectionBody = body.slice(0, index).trim();

    if (sectionBody) {
      recovered.push({
        title,
        body: sectionBody,
      });
    }

    title = marker;
    body = body.slice(index + token.length).trim();
  }

  if (body) {
    recovered.push({
      title,
      body,
    });
  }

  return recovered.length > 1 ? recovered : groups;
}

// oni-studio-amenity-items-v1
// oni-studio-detail-client-items-v2
// A newline in the Admin textarea becomes a separate item in the same card.
function splitAmenityItems(body: string) {
  const items = body
    .split(/\r?\n|\s*\u00b7\s*/)
    .map((item) => item.trim())
    .filter(Boolean);

  return items.length ? items : [body];
}

function expandLegacyRules(rules: string[]) {
  if (rules.length !== 1 || rules[0].length < 140 || rules[0].includes("\n")) return rules;

  const split = rules[0]
    .split(/\.\s+(?=[A-ZÀ-Ỹ])/u)
    .map((rule) => rule.trim())
    .filter(Boolean)
    .map((rule) => (rule.endsWith(".") ? rule : `${rule}.`));

  return split.length > 1 ? split : rules;
}

export async function generateMetadata({ params }: Props) {
  const { slug } = await params;
  const studio = (await getCatalog()).studios.find(
    (entry) => entry.slug === slug,
  );

  return pageMetadata(
    {
      vi: studio?.name || "Không tìm thấy phòng",
      en: studio?.name || "Room not found",
    },
    studio?.description || {
      vi: "Không gian Oni Studio",
      en: "Oni Studio space",
    },
    `/studios/${slug}`,
  );
}

export default async function StudioDetail({ params }: Props) {
  const [{ slug }, { locale }, { studios }] = await Promise.all([
    params,
    context(),
    getCatalog(),
  ]);

  const studio = studios.find((entry) => entry.slug === slug);
  if (!studio) notFound();

  const detail = normalizeStudioDetailContent(
    studio.detail_content,
    studio.led_count,
  );
  const dimensions = studioDimensions(studio, locale);
  const amenities = expandLegacyAmenityGroups(
    studioDetailBlocks(detail.amenities[locale]),
    locale,
  );
  const rules = expandLegacyRules(
    studioDetailRules(detail.rules[locale]),
  );

  return (
    <div className="container detail-page studio-detail-page-v3 studio-detail-page-v6">
      <Link className="text-link" href={href(locale, "/studios")}>
        {locale === "vi" ? "Tất cả không gian" : "All spaces"}
      </Link>

      <div className="detail-heading">
        <div>
          <p className="eyebrow">ONI STUDIO / THE SPACES</p>
          <h1>{studio.name}</h1>
          <p>{studio.description[locale]}</p>
        </div>

        <div className="detail-price">
          <strong>{money(studio.price, locale)}</strong>
        </div>
      </div>

      <ProductGallery
        fastStudioImages
        images={
          studio.images.length
            ? studio.images
            : ["/images/studio-concept.webp"]
        }
        name={studio.name}
        locale={locale}
        fit="contain"
        adaptiveAspectRatio
        caption={
          !studio.images.length
            ? locale === "vi"
              ? "Ảnh minh họa · Hình phòng thực tế sẽ được cập nhật"
              : "Illustration · Actual room photographs to follow"
            : undefined
        }
      />

      <div className="detail-grid studio-detail-layout-v6">
        <div className="studio-detail-main-v6">
          <div className="detail-facts studio-detail-facts-v3">
            <span>
              <Maximize2 />
              {studio.area} m²
            </span>

            {dimensions && (
              <span>
                <Maximize2 />
                {dimensions}
              </span>
            )}

            <span>
              <Clock />
              {detail.minimum_booking[locale]}
            </span>
          </div>

          <section className="studio-detail-intro-v6">
            <div className="studio-detail-section-kicker-v6">
              <span>01</span>
              <p>
                {locale === "vi"
                  ? "Thông tin phòng"
                  : "Room introduction"}
              </p>
            </div>

            <h2>{detail.intro_title[locale]}</h2>

            <p className="studio-detail-intro-copy-v6">
              {renderStudioTemplate(
                detail.intro_body[locale],
                studio,
              )}
            </p>
          </section>

          {amenities.length > 0 && (
            <section className="studio-detail-section-v6">
              <div className="studio-detail-section-heading-v6">
                <div className="studio-detail-section-kicker-v6">
                  <span>02</span>
                  <p>
                    {locale === "vi"
                      ? "Có sẵn trong phòng"
                      : "Included in the room"}
                  </p>
                </div>

                <h2>
                  {locale === "vi"
                    ? "Không gian & thiết bị"
                    : "Space & equipment"}
                </h2>

                <p>
                  {locale === "vi"
                    ? "Các hạng mục có sẵn để bạn chuẩn bị buổi chụp thuận tiện hơn."
                    : "What is available to help you prepare your shoot."}
                </p>
              </div>

              <div className="studio-detail-amenities-v6">
                {amenities.map((group, index) => (
                  <article
                    className="studio-detail-amenity-card-v6"
                    key={`${group.title}-${index}`}
                  >
                    <div className="studio-detail-amenity-title-v6">
                      <span>{String(index + 1).padStart(2, "0")}</span>
                      <h3>
                        {group.title ||
                          (locale === "vi"
                            ? "Tiện ích"
                            : "Amenity")}
                      </h3>
                    </div>

                    <ul>
                      {splitAmenityItems(group.body).map(
                        (item, itemIndex) => (
                          <li key={`${item}-${itemIndex}`}>
                            <span aria-hidden="true" />
                            <p>{item}</p>
                          </li>
                        ),
                      )}
                    </ul>
                  </article>
                ))}
              </div>
            </section>
          )}

          <section className="studio-detail-section-v6 studio-detail-rules-section-v6">
            <div className="studio-detail-section-heading-v6">
              <div className="studio-detail-section-kicker-v6">
                <span>03</span>
                <p>
                  {locale === "vi"
                    ? "Trước khi đặt lịch"
                    : "Before booking"}
                </p>
              </div>

              <h2>{detail.rules_title[locale]}</h2>

              <p>
                {locale === "vi"
                  ? "Một vài lưu ý để buổi chụp diễn ra thuận lợi và rõ ràng ngay từ đầu."
                  : "A few notes to keep your session smooth and clear from the start."}
              </p>
            </div>

            {rules.length > 0 && (
              <div className="studio-detail-rule-list-v6">
                {rules.map((rule, index) => (
                  <div
                    className="studio-detail-rule-row-v6"
                    key={`${rule}-${index}`}
                  >
                    <span className="studio-detail-rule-icon-v6">
                      <Check size={17} aria-hidden="true" />
                    </span>
                    <p>{rule}</p>
                  </div>
                ))}
              </div>
            )}

            {detail.note[locale] && (
              <div className="studio-detail-note-v6">
                <Info size={18} aria-hidden="true" />
                <p>
                  {renderStudioTemplate(
                    detail.note[locale],
                    studio,
                  )}
                </p>
              </div>
            )}
          </section>
        </div>

        <aside className="inquiry-card studio-detail-inquiry-v6">
          <p className="eyebrow">YOUR NEXT SHOOT</p>
          <h2>{detail.inquiry_title[locale]}</h2>
          <p>
            {renderStudioTemplate(
              detail.inquiry_body[locale],
              studio,
            )}
          </p>
          <p className="small muted">
            {locale === "vi"
              ? "Lịch được xác nhận trực tiếp với studio."
              : "Reservations are confirmed directly with the studio."}
          </p>
        </aside>
      </div>
    </div>
  );
}
