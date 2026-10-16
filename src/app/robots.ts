import type { MetadataRoute } from "next";
export default function robots(): MetadataRoute.Robots {
  const base = "https://www.onistudio.vn";
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/admin", "/api/", "/en/admin", "/en/api/"],
    },
    ...(base ? { sitemap: `${base}/sitemap.xml` } : {}),
  };
}
