import { ContactMessengerIcon } from "@/components/contact/messenger-icon";
import { site } from "@/data/site";
import { context } from "@/lib/i18n";

/**
 * Client-site-only fixed quick links. This is a Server Component: no JS needed.
 * NEXT_PUBLIC_ZALO_URL wins; the phone URL is a fallback, not a verified Zalo account.
 */
export async function FloatingSocialLinks() {
  const { locale } = await context();
  const vi = locale === "vi";
  const zaloLink = site.zalo || "https://zalo.me/0707271407";

  return (
    <nav
      className="oni-floating-social-v1"
      aria-label={vi ? "Liên hệ nhanh với Oni Studio" : "Contact Oni Studio"}
    >
      <a
        className="oni-floating-social-link-v1"
        href={site.messenger}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={vi ? "Nhắn Oni Studio qua Messenger" : "Message Oni Studio on Messenger"}
        title="Messenger"
      >
        <ContactMessengerIcon size={30} />
      </a>
      <a
        className="oni-floating-social-link-v1"
        href={site.instagram}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={vi ? "Mở Instagram của Oni Studio" : "Open Oni Studio Instagram"}
        title="Instagram"
      >
        <svg viewBox="0 0 36 36" width="30" height="30" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false">
          <defs>
            <linearGradient id="oni-floating-instagram-grad-v1" x1="4" y1="33" x2="34" y2="2" gradientUnits="userSpaceOnUse">
              <stop stopColor="#FEDA75" />
              <stop offset="0.3" stopColor="#FA7E1E" />
              <stop offset="0.57" stopColor="#D62976" />
              <stop offset="0.79" stopColor="#962FBF" />
              <stop offset="1" stopColor="#4F5BD5" />
            </linearGradient>
          </defs>
          <rect x="2" y="2" width="32" height="32" rx="10" fill="url(#oni-floating-instagram-grad-v1)" />
          <rect x="9.5" y="9.5" width="17" height="17" rx="5.5" stroke="#fff" strokeWidth="2.4" />
          <circle cx="18" cy="18" r="4" stroke="#fff" strokeWidth="2.4" />
          <circle cx="26.6" cy="9.9" r="1.6" fill="#fff" />
        </svg>
      </a>
      <a
        className="oni-floating-social-link-v1"
        href={zaloLink}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={vi ? "Liên hệ Oni Studio qua Zalo" : "Contact Oni Studio on Zalo"}
        title="Zalo"
      >
        <svg viewBox="0 0 40 40" width="32" height="32" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false">
          <rect x="2" y="2" width="36" height="36" rx="11" fill="#0068FF" />
          <path d="M10 10h20c2.4 0 4 1.6 4 4v11c0 4.5-3.5 8-8 8H14l-5 3v-7.8C7.1 26.4 6 24.4 6 22V14c0-2.4 1.6-4 4-4Z" fill="#fff" />
          <text x="20" y="25" textAnchor="middle" fill="#0068FF" fontFamily="Arial, sans-serif" fontSize="12" fontWeight="800" letterSpacing="-0.6">Zalo</text>
        </svg>
      </a>
    </nav>
  );
}
