import type { Metadata } from "next";
import { context } from "@/lib/i18n";
import "@/styles/globals.css";
import "@/styles/fonts.css";
import "@/styles/editorial.css";
import "@/styles/media.css";
export const metadata: Metadata = {
  metadataBase: new URL("https://www.onistudio.vn"),
  title: {
    default: "Oni Studio — Không gian cho sáng tạo",
    template: "%s | Oni Studio",
  },
  description:
    "Không gian studio, thiết bị và hỗ trợ ánh sáng tại Oni Studio, TP. Hồ Chí Minh.",
  icons: { icon: "/icon.svg" },
};
export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { locale } = await context();
  return (
    <html lang={locale}>
      <body>
        <a className="skip-link" href="#main">
          {locale === "vi" ? "Đến nội dung chính" : "Skip to content"}
        </a>
        {children}
      </body>
    </html>
  );
}
