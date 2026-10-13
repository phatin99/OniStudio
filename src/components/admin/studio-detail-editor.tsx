"use client";
// oni-detail-editor-redesign-v2

import { useEffect, useRef, useState, useTransition } from "react";
import {
  AlertCircle,
  BookOpenText,
  CheckCircle2,
  Clock3,
  FileText,
  LayoutList,
  MessageCircle,
  Plus,
  Save,
  Trash2,
} from "lucide-react";
import { saveStudioDetailContent } from "@/app/admin/actions";
import { studioDetailBlocks, studioDetailRules } from "@/data/studio-detail";
import type { Locale, StudioDetailContent } from "@/types/catalog";

type GroupItem = { id: string; title: string; body: string };
type RuleItem = { id: string; text: string };
type Snackbar = { kind: "success" | "error"; message: string };

type LocalizedList<T> = Record<Locale, T[]>;

const languages: { code: Locale; label: string }[] = [
  { code: "vi", label: "Tiếng Việt" },
  { code: "en", label: "English" },
];

const sectionLinks = [
  { id: "quick", vi: "Thông tin nhanh", en: "Quick info", icon: Clock3 },
  { id: "intro", vi: "Giới thiệu", en: "Introduction", icon: BookOpenText },
  { id: "amenities", vi: "Không gian & thiết bị", en: "Space & equipment", icon: LayoutList },
  { id: "rules", vi: "Quy định & lưu ý", en: "Rules & notes", icon: FileText },
  { id: "contact", vi: "Liên hệ", en: "Contact", icon: MessageCircle },
];

function cleanLegacyText(value: string, locale: Locale) {
  let next = value || "";

  if (locale === "vi") {
    next = next
      .replace(
        "Gửi tên {room_name}, ngày chụp, thời lượng và nhu cầu thiết bị cho Oni để kiểm tra lịch.",
        "Gửi ngày chụp, thời lượng và nhu cầu thiết bị cho Oni để kiểm tra lịch.",
      )
      .replace("{led_count} đèn LED Nanlite 300B", "đèn LED Nanlite 300B")
      .replaceAll("{room_name}", "phòng")
      .replaceAll("{led_count}", "");
  } else {
    next = next
      .replace(
        "Send Oni the room name ({room_name}), date, duration and equipment needs to check availability.",
        "Send Oni the date, duration and equipment needs to check availability.",
      )
      .replace("{led_count} Nanlite 300B LED light(s)", "Nanlite 300B LED lighting")
      .replaceAll("{room_name}", "the room")
      .replaceAll("{led_count}", "");
  }

  // Keep real newline characters from textarea input.
  return next.replace(/[ \t]{2,}/g, " ").trim();
}

function parseGroups(raw: string, locale: Locale): GroupItem[] {
  const groups = studioDetailBlocks(cleanLegacyText(raw, locale)).map((group, index) => ({
    id: `${locale}-group-${index}`,
    title: group.title,
    body: group.body,
  }));

  return groups.length ? groups : [{ id: `${locale}-group-0`, title: "", body: "" }];
}

function serializeGroups(items: GroupItem[]) {
  return items
    .map((item) => {
      const title = item.title.trim().replace(/[\r\n|]+/g, " ");
      const body = item.body.replace(/\r\n?/g, "\n").trim().replace(/\n/g, "\\n");
      if (!title && !body) return "";
      return `${title} | ${body}`;
    })
    .filter(Boolean)
    .join("\n");
}

function parseRules(raw: string, locale: Locale): RuleItem[] {
  const values = studioDetailRules(cleanLegacyText(raw, locale));
  return values.length
    ? values.map((text, index) => ({ id: `${locale}-rule-${index}`, text }))
    : [{ id: `${locale}-rule-0`, text: "" }];
}

function serializeRules(items: RuleItem[]) {
  return items
    .map((item) => item.text.replace(/\r\n?/g, "\n").trim().replace(/\n/g, "\\n"))
    .filter(Boolean)
    .join("\n");
}

function previewItems(body: string) {
  return body
    .split(/\r?\n|\s*\u00b7\s*/)
    .map((line) => line.trim())
    .filter(Boolean);
}

function newItemId(prefix: string) {
  return `${prefix}-${Math.random().toString(36).slice(2, 11)}`;
}

export function StudioDetailEditor({
  detail,
  studioId,
}: {
  detail: StudioDetailContent;
  studioId?: string;
}) {
  const rootRef = useRef<HTMLElement>(null);
  const [locale, setLocale] = useState<Locale>("vi");
  const [dirty, setDirty] = useState(false);
  const [pending, startSaving] = useTransition();
  const [snackbar, setSnackbar] = useState<Snackbar | null>(null);
  const [amenities, setAmenities] = useState<LocalizedList<GroupItem>>(() => ({
    vi: parseGroups(detail.amenities.vi, "vi"),
    en: parseGroups(detail.amenities.en, "en"),
  }));
  const [rules, setRules] = useState<LocalizedList<RuleItem>>(() => ({
    vi: parseRules(detail.rules.vi, "vi"),
    en: parseRules(detail.rules.en, "en"),
  }));

  useEffect(() => {
    if (!snackbar) return;
    const timeout = window.setTimeout(() => setSnackbar(null), 5000);
    return () => window.clearTimeout(timeout);
  }, [snackbar]);

  useEffect(() => {
    if (!dirty) return;
    function confirmClose(event: BeforeUnloadEvent) {
      event.preventDefault();
    }
    window.addEventListener("beforeunload", confirmClose);
    return () => window.removeEventListener("beforeunload", confirmClose);
  }, [dirty]);

  function updateGroup(language: Locale, id: string, field: "title" | "body", value: string) {
    setAmenities((current) => ({
      ...current,
      [language]: current[language].map((item) =>
        item.id === id ? { ...item, [field]: value } : item,
      ),
    }));
    setDirty(true);
  }

  function addGroup(language: Locale) {
    setAmenities((current) => ({
      ...current,
      [language]: [...current[language], { id: newItemId(`${language}-group`), title: "", body: "" }],
    }));
    setDirty(true);
  }

  function removeGroup(language: Locale, id: string) {
    setAmenities((current) => {
      const remaining = current[language].filter((item) => item.id !== id);
      return {
        ...current,
        [language]: remaining.length
          ? remaining
          : [{ id: newItemId(`${language}-group`), title: "", body: "" }],
      };
    });
    setDirty(true);
  }

  function updateRule(language: Locale, id: string, text: string) {
    setRules((current) => ({
      ...current,
      [language]: current[language].map((item) =>
        item.id === id ? { ...item, text } : item,
      ),
    }));
    setDirty(true);
  }

  function addRule(language: Locale) {
    setRules((current) => ({
      ...current,
      [language]: [...current[language], { id: newItemId(`${language}-rule`), text: "" }],
    }));
    setDirty(true);
  }

  function removeRule(language: Locale, id: string) {
    setRules((current) => {
      const remaining = current[language].filter((item) => item.id !== id);
      return {
        ...current,
        [language]: remaining.length
          ? remaining
          : [{ id: newItemId(`${language}-rule`), text: "" }],
      };
    });
    setDirty(true);
  }

  function saveDetail() {
    if (pending) return;
    if (!studioId) {
      setSnackbar({ kind: "error", message: "Hãy tạo phòng trước khi lưu nội dung chi tiết." });
      return;
    }

    for (const language of languages) {
      const incompleteGroup = amenities[language.code].find(
        (item) => item.body.trim() && !item.title.trim(),
      );
      if (incompleteGroup) {
        setLocale(language.code);
        setSnackbar({
          kind: "error",
          message: `Hãy nhập tên nhóm cho nội dung ${language.label} trước khi lưu.`,
        });
        return;
      }
    }

    const form = rootRef.current?.closest("form");
    if (!form) {
      setSnackbar({ kind: "error", message: "Không tìm thấy biểu mẫu chỉnh sửa phòng." });
      return;
    }

    const data = new FormData(form);
    setSnackbar(null);

    startSaving(async () => {
      try {
        const result = await saveStudioDetailContent(studioId, data);
        if (result.error) {
          setSnackbar({ kind: "error", message: result.error });
          return;
        }
        setDirty(false);
        setSnackbar({
          kind: "success",
          message: result.success || "Đã lưu nội dung của cả hai ngôn ngữ.",
        });
      } catch {
        setSnackbar({ kind: "error", message: "Không lưu được. Vui lòng thử lại." });
      }
    });
  }

  return (
    <section
      className="oni-detail-editor-v2 studio-detail-editor-v3"
      ref={rootRef}
      onChangeCapture={() => setDirty(true)}
    >
      <div className="oni-detail-editor-toolbar-v2">
        <div className="oni-detail-editor-title-v2">
          <p className="eyebrow">ROOM CONTENT MANAGER</p>
          <h2>Chỉnh nội dung trang phòng</h2>
          <p>Mọi thay đổi được đồng bộ vào trang khách hàng sau khi lưu. Nhập mỗi thiết bị trên một dòng.</p>
        </div>
        <div className="oni-detail-editor-toolbar-actions-v2">
          <div className="studio-detail-language-tabs" role="tablist" aria-label="Ngôn ngữ chỉnh sửa">
            {languages.map((language) => (
              <button
                key={language.code}
                type="button"
                role="tab"
                className={`studio-detail-language-tab${locale === language.code ? " is-active" : ""}`}
                aria-selected={locale === language.code}
                onClick={() => setLocale(language.code)}
              >
                {language.label}
              </button>
            ))}
          </div>
          <span className={`oni-detail-editor-status-v2${dirty ? " is-dirty" : ""}`} role="status">
            {dirty ? <AlertCircle size={16} aria-hidden="true" /> : <CheckCircle2 size={16} aria-hidden="true" />}
            {dirty ? "Có thay đổi chưa lưu" : "Chưa có thay đổi"}
          </span>
        </div>
      </div>

      {languages.map((language) => {
        const lang = language.code;
        const vi = lang === "vi";
        const sectionId = (part: string) => `oni-editor-${lang}-${part}`;

        return (
          <div
            key={lang}
            className="studio-detail-language-panel oni-detail-editor-panel-v2"
            role="tabpanel"
            hidden={locale !== lang}
          >
            <nav className="oni-detail-editor-nav-v2" aria-label={vi ? "Chuyển nhanh đến mục" : "Jump to section"}>
              <p>{vi ? "MỤC CHỈNH SỬA" : "SECTIONS"}</p>
              {sectionLinks.map((section, index) => {
                const Icon = section.icon;
                return (
                  <a key={section.id} href={`#${sectionId(section.id)}`}>
                    <span className="oni-detail-editor-nav-number-v2">{String(index + 1).padStart(2, "0")}</span>
                    <Icon size={16} aria-hidden="true" />
                    <span>{section[lang]}</span>
                  </a>
                );
              })}
            </nav>

            <div className="oni-detail-editor-sections-v2">
              <section className="studio-detail-content-card oni-detail-editor-section-v2" id={sectionId("quick")}>
                <div className="studio-detail-content-card-head">
                  <div>
                    <span className="oni-detail-editor-kicker-v2">01 / {vi ? "THÔNG TIN" : "INFO"}</span>
                    <strong>{vi ? "Thông tin nhanh" : "Quick information"}</strong>
                    <span>{vi ? "Hiển thị gần diện tích và thông số của phòng." : "Shown alongside the room specifications."}</span>
                  </div>
                  <Clock3 size={22} aria-hidden="true" />
                </div>
                <label className="form-field">
                  <span>{vi ? "Thời gian thuê tối thiểu" : "Minimum booking"}</span>
                  <input
                    name={`detail_minimum_booking_${lang}`}
                    maxLength={120}
                    defaultValue={cleanLegacyText(detail.minimum_booking[lang], lang)}
                    placeholder={vi ? "Ví dụ: Tối thiểu 2 giờ" : "Example: 2-hour minimum"}
                  />
                </label>
              </section>

              <section className="studio-detail-content-card oni-detail-editor-section-v2" id={sectionId("intro")}>
                <div className="studio-detail-content-card-head">
                  <div>
                    <span className="oni-detail-editor-kicker-v2">02 / {vi ? "GIỚI THIỆU" : "INTRO"}</span>
                    <strong>{vi ? "Giới thiệu phòng" : "Room introduction"}</strong>
                    <span>{vi ? "Có thể xuống dòng để chia ý rõ ràng." : "Use line breaks to separate paragraphs."}</span>
                  </div>
                  <BookOpenText size={22} aria-hidden="true" />
                </div>
                <div className="oni-detail-editor-field-stack-v2">
                  <label className="form-field">
                    <span>{vi ? "Tiêu đề" : "Title"}</span>
                    <input
                      name={`detail_intro_title_${lang}`}
                      maxLength={180}
                      defaultValue={cleanLegacyText(detail.intro_title[lang], lang)}
                    />
                  </label>
                  <label className="form-field">
                    <span>{vi ? "Nội dung giới thiệu" : "Introduction text"}</span>
                    <textarea
                      name={`detail_intro_body_${lang}`}
                      rows={5}
                      maxLength={5000}
                      defaultValue={cleanLegacyText(detail.intro_body[lang], lang)}
                    />
                  </label>
                </div>
              </section>

              <section className="studio-detail-content-card oni-detail-editor-section-v2" id={sectionId("amenities")}>
                <div className="studio-detail-content-card-head">
                  <div>
                    <span className="oni-detail-editor-kicker-v2">03 / {vi ? "THIẾT BỊ" : "EQUIPMENT"}</span>
                    <strong>{vi ? "Không gian & thiết bị" : "Space & equipment"}</strong>
                    <span>{vi ? "Mỗi nhóm tạo đúng một thẻ trên website." : "Each group becomes exactly one card on the website."}</span>
                  </div>
                  <button type="button" className="button button-outline studio-detail-add-button" onClick={() => addGroup(lang)}>
                    <Plus size={16} aria-hidden="true" />
                    {vi ? "Thêm nhóm" : "Add group"}
                  </button>
                </div>
                <p className="oni-detail-editor-hint-v2">
                  <LayoutList size={17} aria-hidden="true" />
                  {vi
                    ? "Nhấn Enter để thêm một dòng thiết bị. Dòng mới vẫn thuộc cùng nhóm — không tạo thêm thẻ."
                    : "Press Enter for another equipment item. New lines stay in the same group."}
                </p>
                <input type="hidden" name={`detail_amenities_${lang}`} value={serializeGroups(amenities[lang])} readOnly />
                <div className="studio-detail-repeat-list oni-detail-editor-group-list-v2">
                  {amenities[lang].map((group, index) => {
                    const entries = previewItems(group.body);
                    return (
                      <div className="studio-detail-repeat-card oni-detail-editor-group-v2" key={group.id}>
                        <div className="oni-detail-editor-group-heading-v2">
                          <div>
                            <span className="oni-detail-editor-group-index-v2">{String(index + 1).padStart(2, "0")}</span>
                            <strong>{group.title.trim() || (vi ? "Nhóm chưa đặt tên" : "Untitled group")}</strong>
                            <span>{entries.length} {vi ? "dòng nội dung" : "items"}</span>
                          </div>
                          <button
                            type="button"
                            className="studio-detail-remove-button"
                            aria-label={vi ? `Xóa nhóm ${index + 1}` : `Remove group ${index + 1}`}
                            onClick={() => removeGroup(lang, group.id)}
                          >
                            <Trash2 size={16} aria-hidden="true" />
                          </button>
                        </div>
                        <div className="oni-detail-editor-group-fields-v2">
                          <label className="form-field">
                            <span>{vi ? "Tên nhóm" : "Group name"}</span>
                            <input
                              value={group.title}
                              onChange={(event) => updateGroup(lang, group.id, "title", event.target.value)}
                              placeholder={vi ? "Ví dụ: Đèn chụp" : "Example: Studio lighting"}
                            />
                          </label>
                          <label className="form-field">
                            <span>{vi ? "Danh sách thiết bị (mỗi dòng một mục)" : "Equipment list (one item per line)"}</span>
                            <textarea
                              rows={Math.min(10, Math.max(5, group.body.split("\n").length + 2))}
                              value={group.body}
                              onChange={(event) => updateGroup(lang, group.id, "body", event.target.value)}
                              placeholder={vi ? "Godox QS400\nGodox DP400\nNanlite FS300B" : "Godox QS400\nGodox DP400\nNanlite FS300B"}
                            />
                          </label>
                        </div>
                        <div className="oni-detail-editor-preview-v2">
                          <div className="oni-detail-editor-preview-heading-v2">
                            <CheckCircle2 size={16} aria-hidden="true" />
                            <span>{vi ? "XEM TRƯỚC CÁCH HIỂN THỊ" : "LIVE PREVIEW"}</span>
                          </div>
                          {entries.length ? (
                            <ul>{entries.map((entry, itemIndex) => <li key={`${group.id}-${itemIndex}`}>{entry}</li>)}</ul>
                          ) : (
                            <p>{vi ? "Nhập danh sách để xem trước từng dòng tại đây." : "Enter items to preview them here."}</p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>

              <section className="studio-detail-content-card oni-detail-editor-section-v2" id={sectionId("rules")}>
                <div className="studio-detail-content-card-head">
                  <div>
                    <span className="oni-detail-editor-kicker-v2">04 / {vi ? "QUY ĐỊNH" : "RULES"}</span>
                    <strong>{vi ? "Quy định & lưu ý" : "Rules & notes"}</strong>
                    <span>{vi ? "Mỗi quy định là một mục; có thể xuống dòng bên trong mỗi mục." : "Each rule is separate and supports line breaks."}</span>
                  </div>
                  <button type="button" className="button button-outline studio-detail-add-button" onClick={() => addRule(lang)}>
                    <Plus size={16} aria-hidden="true" />
                    {vi ? "Thêm quy định" : "Add rule"}
                  </button>
                </div>
                <label className="form-field">
                  <span>{vi ? "Tiêu đề phần" : "Section title"}</span>
                  <input
                    name={`detail_rules_title_${lang}`}
                    maxLength={180}
                    defaultValue={cleanLegacyText(detail.rules_title[lang], lang)}
                  />
                </label>
                <input type="hidden" name={`detail_rules_${lang}`} value={serializeRules(rules[lang])} readOnly />
                <div className="studio-detail-rule-list oni-detail-editor-rules-v2">
                  {rules[lang].map((rule, index) => (
                    <div className="studio-detail-rule-row oni-detail-editor-rule-v2" key={rule.id}>
                      <span className="studio-detail-rule-number">{index + 1}</span>
                      <textarea
                        rows={3}
                        value={rule.text}
                        onChange={(event) => updateRule(lang, rule.id, event.target.value)}
                        aria-label={vi ? `Quy định ${index + 1}` : `Rule ${index + 1}`}
                      />
                      <button type="button" className="studio-detail-remove-button" onClick={() => removeRule(lang, rule.id)} aria-label={vi ? "Xóa quy định" : "Remove rule"}>
                        <Trash2 size={16} aria-hidden="true" />
                      </button>
                    </div>
                  ))}
                </div>
                <label className="form-field">
                  <span>{vi ? "Ghi chú cuối" : "Closing note"}</span>
                  <textarea name={`detail_note_${lang}`} rows={4} maxLength={3000} defaultValue={cleanLegacyText(detail.note[lang], lang)} />
                </label>
              </section>

              <section className="studio-detail-content-card oni-detail-editor-section-v2" id={sectionId("contact")}>
                <div className="studio-detail-content-card-head">
                  <div>
                    <span className="oni-detail-editor-kicker-v2">05 / {vi ? "LIÊN HỆ" : "CONTACT"}</span>
                    <strong>{vi ? "Liên hệ & tư vấn" : "Contact & inquiries"}</strong>
                    <span>{vi ? "Nội dung giới thiệu khách liên hệ với studio." : "Invitation to contact the studio."}</span>
                  </div>
                  <MessageCircle size={22} aria-hidden="true" />
                </div>
                <div className="oni-detail-editor-field-stack-v2">
                  <label className="form-field">
                    <span>{vi ? "Tiêu đề" : "Title"}</span>
                    <input name={`detail_inquiry_title_${lang}`} maxLength={180} defaultValue={cleanLegacyText(detail.inquiry_title[lang], lang)} />
                  </label>
                  <label className="form-field">
                    <span>{vi ? "Nội dung" : "Message"}</span>
                    <textarea name={`detail_inquiry_body_${lang}`} rows={5} maxLength={3000} defaultValue={cleanLegacyText(detail.inquiry_body[lang], lang)} />
                  </label>
                </div>
              </section>
            </div>
          </div>
        );
      })}

      <div className="oni-detail-editor-savebar-v2">
        <div>
          <span className={`oni-detail-editor-dot-v2${dirty ? " is-dirty" : ""}`} />
          <p>{dirty ? "Có thay đổi chưa lưu" : "Nội dung đang hiển thị đã được tải"}</p>
        </div>
        <button type="button" className="button studio-detail-save-button oni-detail-editor-save-v2" disabled={pending || !studioId} onClick={saveDetail}>
          <Save size={17} aria-hidden="true" />
          {pending ? "Đang lưu..." : "Lưu thay đổi"}
        </button>
      </div>

      {snackbar && (
        <div className={`oni-detail-editor-toast-v2 ${snackbar.kind}`} role={snackbar.kind === "error" ? "alert" : "status"}>
          {snackbar.kind === "error" ? <AlertCircle size={18} aria-hidden="true" /> : <CheckCircle2 size={18} aria-hidden="true" />}
          <span>{snackbar.message}</span>
        </div>
      )}
    </section>
  );
}
