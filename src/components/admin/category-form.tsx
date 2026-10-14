"use client";

import { useActionState, useState } from "react";
import { Plus, Save, Tags, WandSparkles } from "lucide-react";
import { saveEquipmentCategory } from "@/app/admin/actions";
import type { EquipmentCategory } from "@/types/catalog";

function slugify(value: string) {
  return value.normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
    .toLowerCase().trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function CategoryForm({ item }: { item?: EquipmentCategory }) {
  const [state, action, pending] = useActionState(
    saveEquipmentCategory.bind(null, item?.id ?? null),
    {},
  );
  const [nameVi, setNameVi] = useState(item?.name.vi ?? "");
  const [slug, setSlug] = useState(item?.slug ?? "");
  const [manualSlug, setManualSlug] = useState(Boolean(item));
  const editing = Boolean(item);

  return (
    <form action={action} className="oni-category-v2-form">
      <div className="oni-category-v2-form-grid">
        <label className="form-field">
          <span>Tên danh mục (VN)</span>
          <input
            name="name_vi"
            value={nameVi}
            onChange={(event) => {
              const next = event.target.value;
              setNameVi(next);
              if (!manualSlug) setSlug(slugify(next));
            }}
            required maxLength={120} placeholder="Ví dụ: Đèn LED"
          />
        </label>
        <label className="form-field">
          <span>Tên danh mục (EN)</span>
          <input name="name_en" defaultValue={item?.name.en ?? ""} required maxLength={120} placeholder="Continuous light" />
        </label>
        <div className="form-field oni-category-v2-slug">
          <span>Đường dẫn (slug)</span>
          <div className="oni-category-v2-slug-row">
            <input
              name="slug" value={slug}
              onChange={(event) => { setSlug(event.target.value); setManualSlug(true); }}
              pattern="[a-z0-9]+(-[a-z0-9]+)*"
              maxLength={120} required placeholder="den-led"
            />
            <button type="button" className="oni-category-v2-auto" onClick={() => { setSlug(slugify(nameVi)); setManualSlug(false); }} title="Tạo đường dẫn tự động">
              <WandSparkles size={16} aria-hidden="true" /> <span>Tạo lại</span>
            </button>
          </div>
          <small>Chữ thường không dấu, không chứa khoảng trắng.</small>
        </div>
      </div>
      {state.error && <p className="notice error" role="alert">{state.error}</p>}
      {state.success && <p className="notice success" role="status">{state.success}</p>}
      <div className="oni-category-v2-form-bottom">
        <span className="oni-category-v2-tip">
          <Tags size={15} aria-hidden="true" /> Thứ tự được hệ thống tự quản lý, không cần nhập số.
        </span>
        <button className="button oni-category-v2-primary" disabled={pending} type="submit">
          {editing ? <Save size={16} aria-hidden="true" /> : <Plus size={16} aria-hidden="true" />}
          {pending ? "Đang lưu..." : editing ? "Lưu thay đổi" : "Thêm danh mục"}
        </button>
      </div>
    </form>
  );
}
