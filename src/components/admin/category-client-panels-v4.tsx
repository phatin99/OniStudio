"use client";

import dynamic from "next/dynamic";
import type { EquipmentCategory } from "@/types/catalog";

const CategoryCreate = dynamic(
  () => import("./category-form").then((module) => module.CategoryForm),
  {
    ssr: false,
    loading: () => (
      <div className="notice" role="status">
        Äang táº£i biá»ƒu máº«u danh má»¥c...
      </div>
    ),
  },
);

const CategoryManager = dynamic(
  () => import("./category-manager-v2").then((module) => module.EquipmentCategoryManagerV2),
  {
    ssr: false,
    loading: () => (
      <div className="notice" role="status">
        Äang táº£i danh sÃ¡ch danh má»¥c...
      </div>
    ),
  },
);

export function EquipmentCategoryCreateClient() {
  return <CategoryCreate />;
}

export function EquipmentCategoryManagerClient({
  items,
}: {
  items: EquipmentCategory[];
}) {
  return <CategoryManager items={items} />;
}