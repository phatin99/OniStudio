"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowDown, ArrowUp, Check, Eye, EyeOff, Pencil, X } from "lucide-react";
import {
  deleteEquipmentCategory,
  setEquipmentCategoryPosition,
  setEquipmentCategoryVisibility,
} from "@/app/admin/actions";
import { CategoryForm } from "./category-form";
import type { EquipmentCategory } from "@/types/catalog";

type Result = { error?: string; success?: string };

export function EquipmentCategoryManagerV2({ items }: { items: EquipmentCategory[] }) {
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);
  const [editing, setEditing] = useState<string | null>(null);
  const [message, setMessage] = useState<Result>({});

  async function perform(id: string, work: () => Promise<Result>) {
    if (busy) return;
    setBusy(id);
    setMessage({});
    try {
      const result = await work();
      setMessage(result);
      if (!result.error) router.refresh();
    } catch {
      setMessage({ error: "Kết nối bị gián đoạn. Vui lòng thử lại." });
    } finally {
      setBusy(null);
    }
  }

  const countShown = items.filter((item) => item.is_visible !== false).length;

  return (
    <div className="oni-category-v2-manager">
      <div className="oni-category-v2-manager-info">
        <p><strong>{items.length}</strong> danh mục · <strong>{countShown}</strong> đang hiển thị</p>
        <span>Chọn vị trí hoặc dùng mũi tên để thay đổi thứ tự trên website.</span>
      </div>
      {message.error && <p className="notice error" role="alert">{message.error}</p>}
      {message.success && <p className="notice success" role="status">{message.success}</p>}
      <div className="oni-category-v2-list">
        {items.map((item, index) => {
          const shown = item.is_visible !== false;
          const working = busy === item.id;
          const opened = editing === item.id;
          return (
            <article key={item.id} className={`oni-category-v2-row${shown ? "" : " is-hidden"}`}>
              <div className="oni-category-v2-row-main">
                <span className="oni-category-v2-index">{String(index + 1).padStart(2, "0")}</span>
                <div className="oni-category-v2-row-name">
                  <strong>{item.name.vi}</strong>
                  <small>{item.name.en} · /{item.slug}</small>
                </div>
                <div className="oni-category-v2-row-actions">
                  <button
                    type="button"
                    className={`oni-category-v2-status${shown ? " is-on" : ""}`}
                    aria-label={shown ? `Ẩn danh mục ${item.name.vi}` : `Hiện danh mục ${item.name.vi}`}
                    aria-pressed={shown}
                    disabled={Boolean(busy)}
                    onClick={() => void perform(item.id, () => setEquipmentCategoryVisibility(item.id, !shown))}
                  >
                    {shown ? <Eye size={16} aria-hidden="true" /> : <EyeOff size={16} aria-hidden="true" />}
                    <span>{shown ? "Đang hiển thị" : "Đang ẩn"}</span>
                  </button>
                  <label className="oni-category-v2-position">
                    <span className="sr-only">Vị trí của {item.name.vi}</span>
                    <select
                      value={index + 1}
                      disabled={Boolean(busy)}
                      onChange={(event) => void perform(item.id, () => setEquipmentCategoryPosition(item.id, Number(event.target.value)))}
                    >
                      {items.map((_, position) => <option key={position} value={position + 1}>Vị trí {position + 1}</option>)}
                    </select>
                  </label>
                  <div className="oni-category-v2-arrows">
                    <button type="button" disabled={Boolean(busy) || index === 0} aria-label={`Chuyển ${item.name.vi} lên`} title="Lên một vị trí" onClick={() => void perform(item.id, () => setEquipmentCategoryPosition(item.id, index))}>
                      <ArrowUp size={17} aria-hidden="true" />
                    </button>
                    <button type="button" disabled={Boolean(busy) || index === items.length - 1} aria-label={`Chuyển ${item.name.vi} xuống`} title="Xuống một vị trí" onClick={() => void perform(item.id, () => setEquipmentCategoryPosition(item.id, index + 2))}>
                      <ArrowDown size={17} aria-hidden="true" />
                    </button>
                  </div>
                  <button type="button" className="oni-category-v2-edit" aria-expanded={opened} aria-controls={`category-panel-${item.id}`} disabled={working} onClick={() => setEditing(opened ? null : item.id)}>
                    {opened ? <X size={16} aria-hidden="true" /> : <Pencil size={16} aria-hidden="true" />}
                    <span>{opened ? "Đóng" : "Sửa"}</span>
                  </button>
                </div>
              </div>
              {opened && (
                <div id={`category-panel-${item.id}`} className="oni-category-v2-panel">
                  <CategoryForm item={item} />
                  <div className="oni-category-v2-danger">
                    <div><strong>Xóa danh mục</strong><p>Chỉ xóa được khi không còn thiết bị thuộc danh mục này.</p></div>
                    <button
                      type="button" className="oni-category-v2-delete" disabled={Boolean(busy)}
                      onClick={() => {
                        if (!window.confirm(`Xóa danh mục “${item.name.vi}”?`)) return;
                        void perform(item.id, () => deleteEquipmentCategory(item.id, {}));
                      }}
                    >Xóa danh mục</button>
                  </div>
                </div>
              )}
              {working && <span className="oni-category-v2-working" role="status">Đang cập nhật…</span>}
            </article>
          );
        })}
      </div>
      {!items.length && <div className="notice">Chưa có danh mục thiết bị.</div>}
      <div className="oni-category-v2-key"><Check size={15} aria-hidden="true" /> Thay đổi thứ tự hoặc trạng thái hiển thị sẽ được lưu ngay.</div>
    </div>
  );
}
