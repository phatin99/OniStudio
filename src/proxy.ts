import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { isConfigured, supabaseConfig } from "@/lib/supabase/config";
function isStaleRefreshToken(error: unknown): boolean {
  if (!error || typeof error !== "object") return false;
  const failure = error as { code?: string; message?: string };
  return failure.code === "refresh_token_not_found" ||
    failure.code === "invalid_refresh_token" ||
    /invalid refresh token|refresh token not found/i.test(failure.message || "");
}

export async function proxy(request: NextRequest) {
  const path = request.nextUrl.pathname;
  const prefixed = path === "/en" || path.startsWith("/en/");
  // Preserve locale across an internal rewrite that re-enters proxy (e.g. local host normalization).
  // This header affects presentation only, never authentication or authorization.
  const english = prefixed || request.headers.get("x-oni-locale") === "en";
  const cleanPath = prefixed ? path.slice(3) || "/" : path;
  const headers = new Headers(request.headers);
  headers.set("x-oni-locale", english ? "en" : "vi");
  headers.set("x-oni-path", cleanPath);
  // Admin and API endpoints are not localized.
  if (
    english &&
    (cleanPath.startsWith("/admin") || cleanPath.startsWith("/api"))
  )
    return NextResponse.redirect(new URL(cleanPath, request.url));
  const url = request.nextUrl.clone();
  url.pathname = cleanPath;
  let response = prefixed
    ? NextResponse.rewrite(url, { request: { headers } })
    : NextResponse.next({ request: { headers } });
  // Authentication is already checked by API actions and by the protected layout.
  // Refresh session cookies only for protected admin pages, not for login/uploads.
  const protectedAdmin = cleanPath === "/admin" ||
    (cleanPath.startsWith("/admin/") && cleanPath !== "/admin/login");
  const hasAuthCookies = request.cookies.getAll().some(({ name }) =>
    /^sb-[a-z0-9-]+-auth-token(?:\.\d+)?$/i.test(name),
  );
  if (isConfigured() && protectedAdmin && hasAuthCookies) {
    const { url: dbUrl, key } = supabaseConfig();
    const authCookiePattern = /^sb-[a-z0-9-]+-auth-token(?:\.\d+)?$/i;

    // A failed refresh must be removed from both the downstream request and
    // browser response. Otherwise the protected layout can retry the same token.
    function clearInvalidSession() {
      const names = request.cookies.getAll()
        .filter(({ name }) => authCookiePattern.test(name))
        .map(({ name }) => name);

      for (const name of names) request.cookies.delete(name);
      headers.set("cookie", request.cookies.toString());
      response = NextResponse.next({ request: { headers } });
      for (const name of names) response.cookies.delete(name);
    }

    const db = createServerClient(dbUrl, key, {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll(values) {
          values.forEach(({ name, value }) => request.cookies.set(name, value));
          headers.set("cookie", request.cookies.toString());
          response = NextResponse.next({ request: { headers } });
          values.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options),
          );
        },
      },
    });

    try {
      const { error } = await db.auth.getClaims();
      if (error && isStaleRefreshToken(error)) clearInvalidSession();
    } catch (error) {
      if (!isStaleRefreshToken(error)) throw error;
      clearInvalidSession();
    }
    response.headers.set("Cache-Control", "private, no-store");
  }
  return response;
}
export const config = {
  matcher: ["/((?!_next|images|favicon|icon|robots.txt|sitemap.xml|.*\\.).*)"],
};