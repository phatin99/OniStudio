"use client";

import Image from "next/image";
import {
  ArrowUpRight,
  Check,
  Eye,
  Lightbulb,
  Maximize2,
  Monitor,
  Smartphone,
  X,
} from "lucide-react";
import {
  useRef,
  useState,
} from "react";
import type {
  Locale,
  StudioCardContent,
} from "@/types/catalog";

type PreviewSnapshot = {
  name: string;
  price: number;
  description: Record<Locale, string>;
  area: number;
  length: number | null;
  width: number | null;
  height: number | null;
  showDimensionsGlobal: boolean;
  card: StudioCardContent;
  images: string[];
};

function field(form: FormData, name: string) {
  return String(form.get(name) || "").trim();
}

function numberField(form: FormData, name: string) {
  const value = Number(field(form, name));
  return Number.isFinite(value) ? value : 0;
}

function checked(form: FormData, name: string) {
  return form.get(name) === "on";
}

function formatPrice(value: number, locale: Locale) {
  return `${new Intl.NumberFormat(
    locale === "vi" ? "vi-VN" : "en-US",
    { maximumFractionDigits: 0 },
  ).format(value)} ${locale === "vi" ? "VNĐ" : "VND"}`;
}

function compact(value: number) {
  return Number.isInteger(value)
    ? String(value)
    : value.toFixed(2).replace(/0+$/, "").replace(/\.$/, "");
}

function dimensions(snapshot: PreviewSnapshot, locale: Locale) {
  if (!snapshot.showDimensionsGlobal || !snapshot.card.show_dimensions) {
    return "";
  }

  return [
    snapshot.length
      ? `${locale === "vi" ? "Dài" : "L"} ${compact(snapshot.length)}m`
      : "",
    snapshot.width
      ? `${locale === "vi" ? "Rộng" : "W"} ${compact(snapshot.width)}m`
      : "",
    snapshot.height
      ? `${locale === "vi" ? "Cao" : "H"} ${compact(snapshot.height)}m`
      : "",
  ]
    .filter(Boolean)
    .join(" · ");
}

export function StudioCardEditor({
  initial,
  images,
  pending,
  mediaBlocked,
}: {
  initial: StudioCardContent;
  images: string[];
  pending: boolean;
  mediaBlocked: boolean;
}) {
  const rootRef = useRef<HTMLElement>(null);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [locale, setLocale] = useState<Locale>("vi");
  const [viewport, setViewport] = useState<"desktop" | "mobile">("desktop");
  const [snapshot, setSnapshot] = useState<PreviewSnapshot | null>(null);

  function buildSnapshot() {
    const form = rootRef.current?.closest("form");
    if (!form) return null;

    const data = new FormData(form);

    const value: PreviewSnapshot = {
      name: field(data, "name") || "Room",
      price: numberField(data, "price"),
      description: {
        vi: field(data, "description_vi"),
        en: field(data, "description_en"),
      },
      area: numberField(data, "area"),
      length: numberField(data, "length_m") || null,
      width: numberField(data, "width_m") || null,
      height: numberField(data, "height_m") || null,
      showDimensionsGlobal: checked(data, "show_dimensions"),
      card: {
        type_label: {
          vi: field(data, "card_type_vi"),
          en: field(data, "card_type_en"),
        },
        kicker: {
          vi: field(data, "card_kicker_vi"),
          en: field(data, "card_kicker_en"),
        },
        availability_label: {
          vi: field(data, "card_availability_vi"),
          en: field(data, "card_availability_en"),
        },
        price_suffix: {
          vi: field(data, "card_price_suffix_vi"),
          en: field(data, "card_price_suffix_en"),
        },
        extra_fact: {
          vi: field(data, "card_extra_fact_vi"),
          en: field(data, "card_extra_fact_en"),
        },
        cta_label: {
          vi: field(data, "card_cta_vi"),
          en: field(data, "card_cta_en"),
        },
        show_type: checked(data, "card_show_type"),
        show_kicker: checked(data, "card_show_kicker"),
        show_availability: checked(data, "card_show_availability"),
        show_price: checked(data, "card_show_price"),
        show_description: checked(data, "card_show_description"),
        show_area: checked(data, "card_show_area"),
        show_dimensions: checked(data, "card_show_dimensions"),
        show_extra_fact: checked(data, "card_show_extra_fact"),
        show_cta: checked(data, "card_show_cta"),
      },
      images,
    };

    setSnapshot(value);
    return value;
  }

  function openPreview() {
    // Surface missing/invalid required fields before opening the preview.
    const form = rootRef.current?.closest("form");
    if (!form || !form.reportValidity()) return;

    const next = buildSnapshot();
    if (!next) return;
    dialogRef.current?.showModal();
  }

  const previewDimensions =
    snapshot ? dimensions(snapshot, locale) : "";

  return (
    <section ref={rootRef} className="studio-card-editor-v5">
      <div className="studio-card-editor-heading">
        <div>
          <p className="eyebrow">CLIENT CARD</p>
          <h3>Thiết lập Card phòng</h3>
          <p>
            Tên phòng, giá, mô tả, diện tích và ảnh bìa lấy từ thông tin phía
            trên. Tại đây bạn chỉnh toàn bộ nhãn và chọn phần nào được hiển thị.
          </p>
        </div>
      </div>

      <div className="studio-card-editor-language-grid">
        {(["vi", "en"] as const).map((value) => (
          <div className="studio-card-editor-language" key={value}>
            <div className="studio-card-editor-language-head">
              <strong>{value === "vi" ? "Tiếng Việt" : "English"}</strong>
              <span>{value.toUpperCase()}</span>
            </div>

            <label className="form-field">
              <span>Nhãn trên ảnh</span>
              <input
                name={`card_type_${value}`}
                maxLength={80}
                defaultValue={initial.type_label[value]}
              />
            </label>

            <label className="form-field">
              <span>Nhãn phía trên tên phòng</span>
              <input
                name={`card_kicker_${value}`}
                maxLength={80}
                defaultValue={initial.kicker[value]}
              />
            </label>

            <label className="form-field">
              <span>Nhãn lịch</span>
              <input
                name={`card_availability_${value}`}
                maxLength={80}
                defaultValue={initial.availability_label[value]}
              />
            </label>

            <label className="form-field">
              <span>Đơn vị sau giá</span>
              <input
                name={`card_price_suffix_${value}`}
                maxLength={40}
                defaultValue={initial.price_suffix[value]}
              />
            </label>

            <label className="form-field">
              <span>Dòng thông tin bổ sung</span>
              <input
                name={`card_extra_fact_${value}`}
                maxLength={120}
                defaultValue={initial.extra_fact[value]}
                placeholder={
                  value === "vi"
                    ? "Ví dụ: 1 đèn đi kèm"
                    : "Example: 1 included light"
                }
              />
            </label>

            <label className="form-field">
              <span>Nút xem chi tiết</span>
              <input
                name={`card_cta_${value}`}
                maxLength={80}
                defaultValue={initial.cta_label[value]}
              />
            </label>
          </div>
        ))}
      </div>

      <fieldset className="studio-card-editor-visibility">
        <legend>Hiển thị trên Card</legend>

        <div className="studio-card-editor-toggle-grid">
          {[
            ["card_show_type", "Nhãn trên ảnh", initial.show_type],
            ["card_show_kicker", "Nhãn loại phòng", initial.show_kicker],
            [
              "card_show_availability",
              "Nhãn liên hệ lịch",
              initial.show_availability,
            ],
            ["card_show_price", "Giá thuê", initial.show_price],
            ["card_show_description", "Mô tả", initial.show_description],
            ["card_show_area", "Diện tích", initial.show_area],
            [
              "card_show_dimensions",
              "Dài / rộng / cao",
              initial.show_dimensions,
            ],
            [
              "card_show_extra_fact",
              "Thông tin bổ sung",
              initial.show_extra_fact,
            ],
            ["card_show_cta", "Nút xem chi tiết", initial.show_cta],
          ].map(([name, label, defaultChecked]) => (
            <label className="check-field studio-card-editor-toggle" key={String(name)}>
              <input
                type="checkbox"
                name={String(name)}
                defaultChecked={Boolean(defaultChecked)}
              />
              <span>{String(label)}</span>
            </label>
          ))}
        </div>
      </fieldset>

      <div className="studio-card-preview-gate">
        <div>
          <strong>Xem thử trước khi cập nhật Client</strong>
          <span>
            Nút xác nhận chỉ nằm trong màn hình xem trước để tránh cập nhật nhầm.
          </span>
        </div>

        <button
          className="button studio-card-preview-button"
          type="button"
          disabled={pending || mediaBlocked}
          onClick={openPreview}
        >
          <Eye size={17} aria-hidden="true" />
          {mediaBlocked ? "Chờ ảnh tải xong" : "Xem trước & lưu"}
        </button>
      </div>

      <dialog ref={dialogRef} className="studio-card-preview-dialog">
        <div className="studio-card-preview-shell">
          <header className="studio-card-preview-toolbar">
            <div>
              <p className="eyebrow">PREVIEW — CHƯA CẬP NHẬT CLIENT</p>
              <strong>Kiểm tra Card trước khi xác nhận</strong>
            </div>

            <button
              className="icon-button"
              type="button"
              aria-label="Đóng xem trước"
              onClick={() => dialogRef.current?.close()}
            >
              <X size={20} aria-hidden="true" />
            </button>
          </header>

          <div className="studio-card-preview-controls">
            <div className="studio-detail-language-tabs">
              {(["vi", "en"] as const).map((value) => (
                <button
                  key={value}
                  type="button"
                  className={
                    locale === value
                      ? "studio-detail-language-tab is-active"
                      : "studio-detail-language-tab"
                  }
                  onClick={() => setLocale(value)}
                >
                  {value === "vi" ? "Tiếng Việt" : "English"}
                </button>
              ))}
            </div>

            <div className="studio-card-preview-device">
              <button
                type="button"
                className={viewport === "desktop" ? "is-active" : ""}
                onClick={() => setViewport("desktop")}
              >
                <Monitor size={16} aria-hidden="true" />
                Desktop
              </button>
              <button
                type="button"
                className={viewport === "mobile" ? "is-active" : ""}
                onClick={() => setViewport("mobile")}
              >
                <Smartphone size={16} aria-hidden="true" />
                Mobile
              </button>
            </div>
          </div>

          <div
            className={`studio-card-preview-stage is-${viewport}`}
          >
            {snapshot && (
              <article className="studio-card studio-card-v2 studio-card-admin-preview">
                <div className="room-visual studio-card-media">
                  <Image
                    src={
                      snapshot.images[0] ||
                      "/images/studio-concept.webp"
                    }
                    fill
                    unoptimized
                    sizes={
                      viewport === "mobile"
                        ? "390px"
                        : "680px"
                    }
                    alt=""
                    className="room-image"
                  />

                  <div
                    className="studio-card-media-shade"
                    aria-hidden="true"
                  />

                  <div className="studio-card-media-top">
                    <span className="studio-card-index">01</span>

                    {snapshot.card.show_type && (
                      <span className="studio-card-type">
                        {snapshot.card.type_label[locale]}
                      </span>
                    )}
                  </div>

                  <div className="studio-card-media-bottom">
                    <span>{snapshot.name}</span>
                    <ArrowUpRight size={22} aria-hidden="true" />
                  </div>
                </div>

                <div className="studio-card-content">
                  <div className="studio-card-title-row">
                    <div>
                      {snapshot.card.show_kicker && (
                        <p className="studio-card-kicker">
                          {snapshot.card.kicker[locale]}
                        </p>
                      )}

                      <h3>{snapshot.name}</h3>
                    </div>

                    {snapshot.card.show_availability && (
                      <span className="studio-card-availability">
                        {snapshot.card.availability_label[locale]}
                      </span>
                    )}
                  </div>

                  {snapshot.card.show_price && (
                    <div className="studio-card-price-inline">
                      <strong>
                        {formatPrice(snapshot.price, locale)}
                      </strong>
                      <span>
                        {snapshot.card.price_suffix[locale]}
                      </span>
                    </div>
                  )}

                  {snapshot.card.show_description &&
                    snapshot.description[locale] && (
                      <p className="studio-card-description">
                        {snapshot.description[locale]}
                      </p>
                    )}

                  {(snapshot.card.show_area ||
                    Boolean(previewDimensions) ||
                    (snapshot.card.show_extra_fact &&
                      snapshot.card.extra_fact[locale])) && (
                    <div className="studio-card-facts">
                      {snapshot.card.show_area && (
                        <span>
                          <Maximize2 size={17} aria-hidden="true" />
                          <strong>{snapshot.area}</strong> m²
                        </span>
                      )}

                      {previewDimensions && (
                        <span>
                          <Maximize2 size={17} aria-hidden="true" />
                          {previewDimensions}
                        </span>
                      )}

                      {snapshot.card.show_extra_fact &&
                        snapshot.card.extra_fact[locale] && (
                          <span>
                            <Lightbulb size={18} aria-hidden="true" />
                            {snapshot.card.extra_fact[locale]}
                          </span>
                        )}
                    </div>
                  )}

                  {snapshot.card.show_cta && (
                    <div className="studio-card-footer studio-card-footer-action-only">
                      <span className="studio-explore-button">
                        <span>{snapshot.card.cta_label[locale]}</span>
                        <ArrowUpRight size={18} aria-hidden="true" />
                      </span>
                    </div>
                  )}
                </div>
              </article>
            )}
          </div>

          <footer className="studio-card-preview-actions">
            <button
              type="button"
              className="button button-outline"
              onClick={() => dialogRef.current?.close()}
            >
              Quay lại chỉnh sửa
            </button>

            <button
              type="submit"
              name="card_preview_confirmed"
              value="1"
              className="button studio-card-confirm-button"
              disabled={pending || mediaBlocked}
            >
              <Check size={17} aria-hidden="true" />
              {pending
                ? "Đang cập nhật..."
                : "Xác nhận & cập nhật Client"}
            </button>
          </footer>
        </div>
      </dialog>
    </section>
  );
}
