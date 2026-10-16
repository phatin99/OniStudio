import type { MetadataRoute } from "next";
import { getCatalog } from "@/lib/catalog";
export const dynamic = "force-dynamic";
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = ("https://www.onistudio.vn").replace(/\/$/, "");
  const { studios, equipment } = await getCatalog();
  const paths = ["", "/equipment", "/studios", "/effect-backdrops", "/backdrops", "/props", "/gallery", "/contact", "/services", "/pricing", "/about", ...studios.map((s) => `/studios/${s.slug}`), ...equipment.map((e) => `/equipment/${e.slug}`)];
  return paths.flatMap((path) => ["", "/en"].map((prefix) => ({ url: base + prefix + path, alternates: { languages: { vi: base + path, en: base + "/en" + path } } })));
}
