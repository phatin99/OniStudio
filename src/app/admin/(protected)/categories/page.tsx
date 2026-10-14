import { Layers3 } from "lucide-react";
import { requireAdminPage } from "@/lib/auth";
import { EquipmentCategoryCreateClient, EquipmentCategoryManagerClient } from "@/components/admin/category-client-panels-v4";
import type { EquipmentCategory } from "@/types/catalog";

export default async function CategoriesAdmin({ searchParams }: { searchParams: Promise<{ saved?: string }> }) {
  const [{ db }, query] = await Promise.all([requireAdminPage(), searchParams]);
  const { data, error } = await db.from("equipment_categories")
    .select("id,slug,name,sort_order,is_visible")
    .neq("slug", "backdrop")
    .order("sort_order")
    .order("id");

  if (error) {
    throw new Error("Không đọc được danh mục. Hãy chạy migration 150_equipment_category_visibility_order.sql trong Supabase trước khi dùng giao diện mới.");
  }

  const items = (data ?? []) as EquipmentCategory[];
  return (
    <div className="equipment-taxonomy-page oni-category-v2-page">
      <header className="equipment-taxonomy-hero">
        <div>
          <p className="eyebrow">EQUIPMENT TAXONOMY</p>
          <h1>Danh mục thiết bị</h1>
          <p>Sắp xếp vị trí danh mục và quyết định danh mục nào xuất hiện trong bộ lọc Thiết bị của khách.</p>
        </div>
        <div className="equipment-taxonomy-stat">
          <span className="equipment-taxonomy-stat-icon"><Layers3 size={18} aria-hidden="true" /></span>
          <span><small>Tổng danh mục</small><strong>{items.length}</strong></span>
        </div>
      </header>
      {query.saved && <p className="notice success">Đã thêm danh mục mới.</p>}
      <section className="oni-category-v2-section">
        <div className="oni-category-v2-section-head"><div><p className="eyebrow">CREATE</p><h2>Thêm danh mục thiết bị</h2><p>Nhập tên và đường dẫn; hệ thống tự xếp danh mục mới vào cuối.</p></div></div>
        <div className="oni-category-v2-create"><EquipmentCategoryCreateClient /></div>
      </section>
      <section className="oni-category-v2-section">
        <div className="oni-category-v2-section-head"><div><p className="eyebrow">MANAGE</p><h2>Thứ tự & hiển thị trên website</h2><p>Bật/tắt bộ lọc danh mục và đổi vị trí không cần nhập số thứ tự thủ công.</p></div></div>
        <EquipmentCategoryManagerClient items={items} />
      </section>
    </div>
  );
}
