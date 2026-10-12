"use client";

import { useState } from "react";
import {
  Search,
  SlidersHorizontal,
} from "lucide-react";
import { EquipmentCard } from "./equipment-card";
import type {
  Equipment,
  EquipmentCategory,
  Locale,
} from "@/types/catalog";

type SourceFilter = "internal" | "external";

function normalize(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .toLowerCase();
}


export function EquipmentExplorer({
  items,
  categories,
  locale,
}: {
  items: Equipment[];
  categories: EquipmentCategory[];
  locale: Locale;
}) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("all");
  const [source, setSource] = useState<SourceFilter>("internal");
  const [sort, setSort] = useState("default");

  const externalCount = items.filter(
    (item) => item.rental_source === "external",
  ).length;
  const internalCount = items.length - externalCount;

  const sourceItems = items.filter((item) => {
    const itemSource =
      item.rental_source === "external" ? "external" : "internal";
    return itemSource === source;
  });

  const filtered = sourceItems
    .filter(
      (item) =>
        (category === "all" || item.category === category) &&
        normalize(
          `${item.name} ${item.name_en} ${item.description[locale]}`,
        ).includes(normalize(query)),
    )
    .sort((a, b) => {
      if (sort === "low") {
        return (a.price ?? 0) - (b.price ?? 0);
      }

      if (sort === "high") {
        return (b.price ?? 0) - (a.price ?? 0);
      }


      return a.sort_order - b.sort_order || a.name.localeCompare(b.name);
    });

  const visibleCategories = categories.filter((entry) =>
    sourceItems.some((item) => item.category === entry.slug),
  );

  function chooseSource(next: SourceFilter) {
    setSource(next);
    setCategory("all");
  }

  const sourceLabel =
    source === "external"
      ? locale === "vi"
        ? "thiết bị cho thuê ngoài"
        : "external rental items"
      : locale === "vi"
        ? "thiết bị tại Studio"
        : "items in studio";

  return (
    <>
      <div className="equipment-catalog-controls-v4">
        <div className="equipment-controls-main">
          <div
            className="equipment-source-tabs-v4"
            role="group"
            aria-label={
              locale === "vi" ? "Nguồn thiết bị" : "Equipment source"
            }
          >

            <button
              type="button"
              aria-pressed={source === "internal"}
              onClick={() => chooseSource("internal")}
            >
              <span>{locale === "vi" ? "Studio" : "In Studio"}</span>
              <strong>{internalCount}</strong>
            </button>

            <button
              type="button"
              aria-pressed={source === "external"}
              onClick={() => chooseSource("external")}
            >
              <span>{locale === "vi" ? "Cho thuê ngoài" : "External rental"}</span>
              <strong>{externalCount}</strong>
            </button>
          </div>

          <div className="equipment-toolbar-v4">
            <label className="equipment-search-v4">
              <Search size={17} aria-hidden="true" />
              <span className="sr-only">
                {locale === "vi" ? "Tìm thiết bị" : "Search equipment"}
              </span>
              <input
                type="search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder={
                  locale === "vi"
                    ? "Tìm theo tên thiết bị..."
                    : "Search equipment..."
                }
              />
            </label>

            <label className="equipment-sort-v4">
              <SlidersHorizontal size={15} aria-hidden="true" />
              <span className="sr-only">
                {locale === "vi" ? "Sắp xếp" : "Sort"}
              </span>
              <select
                value={sort}
                onChange={(event) => setSort(event.target.value)}
              >
                <option value="default">
                  {locale === "vi" ? "Mặc định" : "Default"}
                </option>
                <option value="low">
                  {locale === "vi"
                    ? "Giá tăng dần"
                    : "Price: low to high"}
                </option>
                <option value="high">
                  {locale === "vi"
                    ? "Giá giảm dần"
                    : "Price: high to low"}
                </option>
              </select>
            </label>
          </div>
        </div>

        <div className="equipment-controls-categories">
          <span className="equipment-category-label">
            {locale === "vi" ? "Danh mục" : "Category"}
          </span>

          <div
            className="filter-chips equipment-category-chips-v4"
            aria-label={
              locale === "vi" ? "Loại thiết bị" : "Equipment category"
            }
          >
            <button
              className="chip"
              aria-pressed={category === "all"}
              onClick={() => setCategory("all")}
            >
              {locale === "vi" ? "Tất cả" : "All"}
            </button>

            {visibleCategories.map((entry) => (
              <button
                key={entry.id}
                className="chip"
                aria-pressed={category === entry.slug}
                onClick={() => setCategory(entry.slug)}
              >
                {entry.name[locale]}
              </button>
            ))}
          </div>

          <p className="equipment-result-count-v4" aria-live="polite">
            <strong>{filtered.length}</strong> {sourceLabel}
          </p>
        </div>
      </div>

      {filtered.length ? (
        <div className="equipment-grid">
          {filtered.map((item) => (
            <EquipmentCard
              compact
              key={item.id}
              item={item}
              allEquipment={items}
              categories={categories}
              locale={locale}
            />
          ))}
        </div>
      ) : (
        <div className="empty-state">
          <h2>
            {locale === "vi"
              ? "Chưa có thiết bị phù hợp"
              : "No matching equipment"}
          </h2>
          <p>
            {locale === "vi"
              ? source === "external"
                ? "Hiện chưa có thiết bị thuê ngoài phù hợp với bộ lọc này."
                : "Thử tên ngắn hơn hoặc thay đổi bộ lọc."
              : "Try a shorter name or change the filters."}
          </p>
          <button
            className="button button-outline"
            onClick={() => {
              setQuery("");
              setCategory("all");
              setSource("internal");
            }}
          >
            {locale === "vi" ? "Xóa bộ lọc" : "Clear filters"}
          </button>
        </div>
      )}
    </>
  );
}
