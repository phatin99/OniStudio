"use client";

import { useActionState, useMemo, useState } from "react";
import { ChevronDown, Trash2 } from "lucide-react";
import { deleteStudio, saveStudio } from "@/app/admin/actions";
import { studioSlugFromName } from "@/lib/studio-slug";
import {
  DEFAULT_STUDIO_DETAIL_CONTENT,
  normalizeStudioDetailContent,
} from "@/data/studio-detail";
import { ImageUpload } from "./image-upload";
import { DeleteForm } from "./delete-form";
import { StudioCardEditor } from "./studio-card-editor";
import { StudioDetailShortcut } from "./studio-detail-shortcut";
import { VndInput } from "./vnd-input";
import type { Studio } from "@/types/catalog";

export function StudioForm({
  item,
  canDelete = true,
}: {
  item?: Studio;
  canDelete?: boolean;
}) {
  const [state, action, pending] = useActionState(
    saveStudio.bind(null, item?.id ?? null),
    {},
  );
  const [mediaBlocked, setMediaBlocked] = useState(false);
  const [previewImages, setPreviewImages] = useState(
    item?.images ?? [],
  );
  const editing = Boolean(item);
  // oni-studio-auto-slug-v1: The preview follows the room name while creating.
  const [roomName, setRoomName] = useState(item?.name ?? "");

  const detail = useMemo(
    () =>
      item
        ? normalizeStudioDetailContent(
            item.detail_content,
            item.led_count,
          )
        : DEFAULT_STUDIO_DETAIL_CONTENT,
    [item],
  );

  const hasDimensions = Boolean(
    item?.width_m || item?.length_m || item?.height_m,
  );

  return (
    <div className="studio-admin-editor">
      <form className="form-panel studio-admin-form" action={action}>
        <div className="studio-admin-form-head">
          <div>
            <p className="eyebrow">{editing ? "EDIT ROOM" : "NEW ROOM"}</p>
            <h2>{editing ? item?.name : "Tạo phòng studio mới"}</h2>
            <p className="muted">
              Mọi thay đổi Card phải được xem trước trước khi cập nhật ra Client.
            </p>
          </div>
        </div>

        <div className="form-grid studio-admin-form-grid">
          <label className="form-field">
            <span>Tên phòng</span>
            <input
              name="name"
              required
              maxLength={160}
              value={roomName}
              onChange={(event) => setRoomName(event.target.value)}
              placeholder="Room D"
            />
          </label>

          <label className="form-field">
            <span>{editing ? "Slug" : "Slug tự động"}</span>
            <input
              name="slug"
              required
              maxLength={120}
              pattern="[a-z0-9]+(-[a-z0-9]+)*"
              defaultValue={editing ? item?.slug ?? "" : undefined}
              value={!editing ? (roomName.trim() ? studioSlugFromName(roomName) : "") : undefined}
              readOnly={!editing}
              placeholder={editing ? "room-d" : "Tự tạo khi nhập tên phòng"}
            />
            <small>
              {editing
                ? "Có thể sửa slug thủ công nếu thực sự cần đổi đường dẫn phòng."
                : "Tạo từ tên phòng; nếu trùng, hệ thống tự thêm -2, -3 khi lưu."}
            </small>
          </label>

          <label className="form-field">
            <span>Diện tích (m²)</span>
            <input
              name="area"
              type="number"
              min="1"
              step="1"
              max="100000"
              required
              defaultValue={item?.area ?? 80}
            />
          </label>

          <label className="form-field">
            <span>Giá mỗi giờ (VNĐ)</span>
            <VndInput
              name="price"
              defaultValue={item?.price}
              placeholder="300.000"
            />
            <small>Ví dụ: nhập 300000 sẽ hiển thị 300.000 VNĐ.</small>
          </label>

          <label className="form-field studio-admin-description">
            <span>Mô tả card / giới thiệu (VI)</span>
            <textarea
              name="description_vi"
              required
              maxLength={5000}
              defaultValue={item?.description.vi ?? ""}
              placeholder="Mô tả ngắn dùng trên card và phần đầu trang chi tiết."
            />
          </label>

          <label className="form-field studio-admin-description">
            <span>Mô tả card / giới thiệu (EN)</span>
            <textarea
              name="description_en"
              required
              maxLength={5000}
              defaultValue={item?.description.en ?? ""}
              placeholder="Short description used on the room card and detail page."
            />
          </label>

          <details
            className="studio-admin-advanced"
            open={Boolean(item?.show_dimensions || hasDimensions)}
          >
            <summary>
              <span>
                <strong>Thông số nâng cao</strong>
                <small>Chiều dài, chiều rộng, chiều cao</small>
              </span>
              <ChevronDown size={18} aria-hidden="true" />
            </summary>

            <div className="studio-admin-advanced-body">
              <label className="check-field studio-dimension-visibility">
                <input
                  type="checkbox"
                  name="show_dimensions"
                  defaultChecked={item?.show_dimensions ?? false}
                />
                Cho phép hiển thị kích thước nâng cao ngoài website
              </label>

              <div className="studio-dimension-grid">
                <label className="form-field">
                  <span>Chiều dài (m)</span>
                  <input
                    name="length_m"
                    type="number"
                    min="0.1"
                    max="1000"
                    step="0.1"
                    defaultValue={item?.length_m ?? ""}
                    placeholder="12"
                  />
                </label>

                <label className="form-field">
                  <span>Chiều rộng (m)</span>
                  <input
                    name="width_m"
                    type="number"
                    min="0.1"
                    max="1000"
                    step="0.1"
                    defaultValue={item?.width_m ?? ""}
                    placeholder="8"
                  />
                </label>

                <label className="form-field">
                  <span>Chiều cao (m)</span>
                  <input
                    name="height_m"
                    type="number"
                    min="0.1"
                    max="1000"
                    step="0.1"
                    defaultValue={item?.height_m ?? ""}
                    placeholder="4"
                  />
                </label>
              </div>
            </div>
          </details>

          <ImageUpload
            initialUrls={item?.images ?? []}
            onBlockedChange={setMediaBlocked}
            onUrlsChange={setPreviewImages}
          />

          <StudioCardEditor
            initial={detail.card}
            images={previewImages}
            pending={pending}
            mediaBlocked={mediaBlocked}
          />
          
          <div hidden aria-hidden="true">
            <input
              type="hidden"
              name="detail_minimum_booking_vi"
              value={detail.minimum_booking.vi}
              readOnly
            />
            <input
              type="hidden"
              name="detail_minimum_booking_en"
              value={detail.minimum_booking.en}
              readOnly
            />
            <input
              type="hidden"
              name="detail_intro_title_vi"
              value={detail.intro_title.vi}
              readOnly
            />
            <input
              type="hidden"
              name="detail_intro_title_en"
              value={detail.intro_title.en}
              readOnly
            />
            <input
              type="hidden"
              name="detail_intro_body_vi"
              value={detail.intro_body.vi}
              readOnly
            />
            <input
              type="hidden"
              name="detail_intro_body_en"
              value={detail.intro_body.en}
              readOnly
            />
            <input
              type="hidden"
              name="detail_amenities_vi"
              value={detail.amenities.vi}
              readOnly
            />
            <input
              type="hidden"
              name="detail_amenities_en"
              value={detail.amenities.en}
              readOnly
            />
            <input
              type="hidden"
              name="detail_rules_title_vi"
              value={detail.rules_title.vi}
              readOnly
            />
            <input
              type="hidden"
              name="detail_rules_title_en"
              value={detail.rules_title.en}
              readOnly
            />
            <input
              type="hidden"
              name="detail_rules_vi"
              value={detail.rules.vi}
              readOnly
            />
            <input
              type="hidden"
              name="detail_rules_en"
              value={detail.rules.en}
              readOnly
            />
            <input
              type="hidden"
              name="detail_note_vi"
              value={detail.note.vi}
              readOnly
            />
            <input
              type="hidden"
              name="detail_note_en"
              value={detail.note.en}
              readOnly
            />
            <input
              type="hidden"
              name="detail_inquiry_title_vi"
              value={detail.inquiry_title.vi}
              readOnly
            />
            <input
              type="hidden"
              name="detail_inquiry_title_en"
              value={detail.inquiry_title.en}
              readOnly
            />
            <input
              type="hidden"
              name="detail_inquiry_body_vi"
              value={detail.inquiry_body.vi}
              readOnly
            />
            <input
              type="hidden"
              name="detail_inquiry_body_en"
              value={detail.inquiry_body.en}
              readOnly
            />
          </div>

          <StudioDetailShortcut studioId={item?.id} />

          <label className="check-field studio-admin-publish">
            <input
              type="checkbox"
              name="published"
              defaultChecked={item?.published ?? true}
            />
            Hiển thị công khai
          </label>
        </div>

        {state.error && (
          <p role="alert" className="notice error">
            {state.error}
          </p>
        )}

        {state.success && (
          <p role="status" className="notice success">
            {state.success}
          </p>
        )}
      </form>

      {item && (
        <section
          className="studio-admin-danger-zone"
          aria-labelledby="studio-delete-heading"
        >
          <div>
            <p className="eyebrow">DANGER ZONE</p>
            <h3 id="studio-delete-heading">Xóa phòng</h3>
            <p className="muted">
              Hệ thống luôn giữ tối thiểu một phòng studio. Ảnh gốc trên
              Cloudinary không bị xóa khi xóa bản ghi phòng.
            </p>
          </div>

          {canDelete ? (
            <DeleteForm
              action={deleteStudio.bind(null, item.id)}
              label={`phòng "${item.name}"`}
            />
          ) : (
            <button className="button danger-button" type="button" disabled>
              <Trash2 size={17} aria-hidden="true" />
              <span>Không thể xóa phòng cuối cùng</span>
            </button>
          )}
        </section>
      )}
    </div>
  );
}
