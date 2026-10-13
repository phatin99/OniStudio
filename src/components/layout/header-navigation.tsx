"use client";
import Link from "@/components/ui/nav-link";
import { usePathname, useRouter } from "next/navigation";
import { useRef } from "react";
import { navigation } from "@/data/site";
import { href } from "@/lib/links";
import type { Locale } from "@/types/catalog";
import { MobileMenu } from "./mobile-menu";
export function HeaderNavigation({ locale }: { locale: Locale }) {
  const pathname = usePathname();
  // oni-route-intent-prefetch-v1: prefetch only routes the visitor is approaching.
  const router = useRouter();
  const preparedRoutes = useRef<Set<string>>(new Set());
  function prepareRoute(target: string) {
    if (target === pathname || preparedRoutes.current.has(target)) return;
    preparedRoutes.current.add(target);
    router.prefetch(target);
  }
  const path = pathname.replace(/^\/en(?=\/|$)/, "") || "/";
  return <>
    <nav className="desktop-nav client-rental-nav" aria-label={locale === "vi" ? "Điều hướng chính" : "Main navigation"}>
      {navigation.map((n) => {
        const destination = href(locale, n.path);
        return (
          <Link
            key={n.path}
            href={destination}
            prefetch={false}
            aria-current={path.startsWith(n.path) ? "page" : undefined}
            onMouseEnter={() => prepareRoute(destination)}
            onFocus={() => prepareRoute(destination)}
            onTouchStart={() => prepareRoute(destination)}
          >
            {n.label[locale]}
          </Link>
        );
      })}
    </nav>
    <div className="header-actions">
      <div className="language-switch" aria-label="Language">
        <a href={href("vi", path)} lang="vi" aria-current={locale === "vi" ? "true" : undefined}>VN</a><span>/</span>
        <a href={href("en", path)} lang="en" aria-current={locale === "en" ? "true" : undefined}>EN</a>
      </div>
      <MobileMenu locale={locale} path={path} />
    </div>
  </>;
}
