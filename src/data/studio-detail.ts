import type {
  Locale,
  Localized,
  Studio,
  StudioCardContent,
  StudioDetailContent,
} from "@/types/catalog";

const localized = (
  value: unknown,
  fallback: Localized,
): Localized => {
  if (!value || typeof value !== "object") return fallback;

  const candidate = value as Partial<Record<Locale, unknown>>;

  return {
    vi:
      typeof candidate.vi === "string" && candidate.vi.trim()
        ? candidate.vi
        : fallback.vi,
    en:
      typeof candidate.en === "string" && candidate.en.trim()
        ? candidate.en
        : fallback.en,
  };
};

function booleanValue(value: unknown, fallback: boolean) {
  return typeof value === "boolean" ? value : fallback;
}

export function defaultStudioCardContent(
  ledCount = 0,
): StudioCardContent {
  return {
    type_label: {
      vi: "Studio chụp ảnh",
      en: "Photo studio",
    },
    kicker: {
      vi: "Không gian studio",
      en: "Studio space",
    },
    availability_label: {
      vi: "Liên hệ lịch",
      en: "Check dates",
    },
    price_suffix: {
      vi: "/ giờ",
      en: "/ hour",
    },
    extra_fact: {
      vi: ledCount > 0 ? `${ledCount} đèn đi kèm` : "Thiết bị theo phòng",
      en:
        ledCount > 0
          ? `${ledCount} included light${ledCount > 1 ? "s" : ""}`
          : "Room equipment",
    },
    cta_label: {
      vi: "Xem chi tiết",
      en: "View details",
    },
    show_type: true,
    show_kicker: true,
    show_availability: true,
    show_price: true,
    show_description: true,
    show_area: true,
    show_dimensions: true,
    show_extra_fact: ledCount > 0,
    show_cta: true,
  };
}

export const DEFAULT_STUDIO_DETAIL_CONTENT: StudioDetailContent = {
  card: defaultStudioCardContent(1),
  minimum_booking: {
    vi: "Tối thiểu 2 giờ",
    en: "2-hour minimum",
  },
  intro_title: {
    vi: "Sẵn sàng cho buổi chụp",
    en: "Ready for your session",
  },
  intro_body: {
    vi: "Miễn phí đèn flash studio và đèn LED Nanlite 300B. Hỗ trợ setup ánh sáng theo layout mẫu. Xác nhận danh sách và số lượng thiết bị khi đặt phòng.",
    en: "Studio flashes and Nanlite 300B LED lighting are included. Reference-layout lighting assistance is available. Confirm the equipment list and quantities when reserving.",
  },
  amenities: {
    vi: [
      "Phông & bối cảnh | Tường trắng vô cực · Phông giấy 11 × 2.7m · Phông vải trơn và loang",
      "Phụ kiện trong phòng | Bàn chụp sản phẩm · Ghế / sofa tạo dáng · Bục trắng · Máy thổi gió · Bàn ủi hơi nước · Móc / sào treo quần áo",
      "Tạo hình ánh sáng | Beauty dish 40/60cm · Floppy · Chóa đèn, barndoor · Dù phản · Hắt sáng · Gel màu · Snoot · Ngàm Optical · C-stand",
      "Softbox | Parabolic P120L · Octagon 60/120/150cm · Stripbox 30 × 120cm, 35 × 160cm · Softbox 60 × 90cm · Nanlite Cầu 60",
    ].join("\n"),
    en: [
      "Backdrops & sets | White infinity wall · 11 × 2.7m paper backdrops · Plain and mottled fabric backdrops",
      "Studio accessories | Product table · Posing chairs / sofa · White plinths · Wind machine · Garment steamer · Clothing rack",
      "Light shaping | 40/60cm beauty dish · Floppy · Reflectors and barndoors · Umbrellas · Bounce · Gels · Snoot · Optical mount · C-stands",
      "Softboxes | Parabolic P120L · 60/120/150cm octagons · 30 × 120cm and 35 × 160cm strips · 60 × 90cm softbox · Nanlite lantern 60",
    ].join("\n"),
  },
  rules_title: {
    vi: "Quy định & lưu ý",
    en: "House rules & notes",
  },
  rules: {
    vi: [
      "Hỗ trợ makeup tối đa 1 giờ trước lịch, tại khu chung.",
      "Khu vực chờ: tối đa 4 người mỗi ê-kíp.",
      "Thêm người: 50.000đ/người; sau 22:00: +50.000đ/giờ.",
      "Đèn LED tổng công suất trên 500W: +50.000đ/giờ.",
    ].join("\n"),
    en: [
      "Up to one hour of early makeup in the shared area.",
      "Waiting area: up to four people per crew.",
      "Extra person: 50,000 VND/person; after 10 pm: +50,000 VND/hour.",
      "LED use over 500W total: +50,000 VND/hour.",
    ].join("\n"),
  },
  note: {
    vi: "Vui lòng trao đổi quy định đặt cọc, đổi/hủy lịch và hoàn tiền với Oni trước khi xác nhận.",
    en: "Confirm deposit, rescheduling, cancellation and refund terms with Oni before booking.",
  },
  inquiry_title: {
    vi: "Cùng lên lịch nhé?",
    en: "Plan your next shoot?",
  },
  inquiry_body: {
    vi: "Gửi ngày chụp, thời lượng và nhu cầu thiết bị cho Oni để kiểm tra lịch.",
    en: "Send Oni the date, duration and equipment needs to check availability.",
  },
};

export function normalizeStudioDetailContent(
  value: unknown,
  ledCount = 0,
): StudioDetailContent {
  const defaults = {
    ...DEFAULT_STUDIO_DETAIL_CONTENT,
    card: defaultStudioCardContent(ledCount),
  };

  if (!value || typeof value !== "object") {
    return defaults;
  }

  const candidate = value as Partial<StudioDetailContent>;
  const rawCard =
    candidate.card && typeof candidate.card === "object"
      ? candidate.card
      : undefined;
  const cardDefaults = defaults.card;

  return {
    card: {
      type_label: localized(rawCard?.type_label, cardDefaults.type_label),
      kicker: localized(rawCard?.kicker, cardDefaults.kicker),
      availability_label: localized(
        rawCard?.availability_label,
        cardDefaults.availability_label,
      ),
      price_suffix: localized(
        rawCard?.price_suffix,
        cardDefaults.price_suffix,
      ),
      extra_fact: localized(
        rawCard?.extra_fact,
        cardDefaults.extra_fact,
      ),
      cta_label: localized(
        rawCard?.cta_label,
        cardDefaults.cta_label,
      ),
      show_type: booleanValue(rawCard?.show_type, cardDefaults.show_type),
      show_kicker: booleanValue(
        rawCard?.show_kicker,
        cardDefaults.show_kicker,
      ),
      show_availability: booleanValue(
        rawCard?.show_availability,
        cardDefaults.show_availability,
      ),
      show_price: booleanValue(
        rawCard?.show_price,
        cardDefaults.show_price,
      ),
      show_description: booleanValue(
        rawCard?.show_description,
        cardDefaults.show_description,
      ),
      show_area: booleanValue(
        rawCard?.show_area,
        cardDefaults.show_area,
      ),
      show_dimensions: booleanValue(
        rawCard?.show_dimensions,
        cardDefaults.show_dimensions,
      ),
      show_extra_fact: booleanValue(
        rawCard?.show_extra_fact,
        cardDefaults.show_extra_fact,
      ),
      show_cta: booleanValue(
        rawCard?.show_cta,
        cardDefaults.show_cta,
      ),
    },
    minimum_booking: localized(
      candidate.minimum_booking,
      defaults.minimum_booking,
    ),
    intro_title: localized(
      candidate.intro_title,
      defaults.intro_title,
    ),
    intro_body: localized(
      candidate.intro_body,
      defaults.intro_body,
    ),
    amenities: localized(
      candidate.amenities,
      defaults.amenities,
    ),
    rules_title: localized(
      candidate.rules_title,
      defaults.rules_title,
    ),
    rules: localized(
      candidate.rules,
      defaults.rules,
    ),
    note: localized(
      candidate.note,
      defaults.note,
    ),
    inquiry_title: localized(
      candidate.inquiry_title,
      defaults.inquiry_title,
    ),
    inquiry_body: localized(
      candidate.inquiry_body,
      defaults.inquiry_body,
    ),
  };
}

export function renderStudioTemplate(
  text: string,
  studio: Pick<Studio, "name" | "led_count">,
) {
  return text
    .replaceAll("{room_name}", studio.name)
    .replaceAll("{led_count}", String(studio.led_count));
}

// oni-studio-amenity-parser-v1
// One titled line starts a group. Untitled legacy lines belong to that group.
// Literal "\\n" represents a line break within a group's content.
// oni-studio-detail-group-format-v2
// Each line with "|" begins a group; encoded "\\n" means a line break inside it.
// Older unlabelled lines are reattached to the previous group.
export function studioDetailBlocks(raw: string) {
  const groups: { title: string; body: string }[] = [];
  const decode = (text: string) => text.replace(/\\n/g, "\n");

  for (const sourceLine of raw.split(/\r?\n/)) {
    const line = sourceLine.trim();
    if (!line) continue;
    const separator = line.indexOf("|");

    if (separator !== -1) {
      groups.push({
        title: line.slice(0, separator).trim(),
        body: decode(line.slice(separator + 1).trim()),
      });
      continue;
    }

    const previous = groups[groups.length - 1];
    if (previous && previous.title) {
      previous.body = previous.body
        ? `${previous.body}\n${decode(line)}`
        : decode(line);
    } else {
      groups.push({ title: "", body: decode(line) });
    }
  }

  return groups;
}

export function studioDetailRules(raw: string) {
  return raw
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => line.replace(/\\n/g, "\n"));
}

function compactNumber(value: number) {
  return Number.isInteger(value)
    ? String(value)
    : value.toFixed(2).replace(/0+$/, "").replace(/\.$/, "");
}

export function studioDimensions(
  studio: Pick<
    Studio,
    "width_m" | "length_m" | "height_m" | "show_dimensions"
  >,
  locale: Locale,
) {
  if (!studio.show_dimensions) return null;

  const values = [
    studio.length_m
      ? `${locale === "vi" ? "Dài" : "L"} ${compactNumber(studio.length_m)}m`
      : null,
    studio.width_m
      ? `${locale === "vi" ? "Rộng" : "W"} ${compactNumber(studio.width_m)}m`
      : null,
    studio.height_m
      ? `${locale === "vi" ? "Cao" : "H"} ${compactNumber(studio.height_m)}m`
      : null,
  ].filter((value): value is string => Boolean(value));

  return values.length ? values.join(" · ") : null;
}
