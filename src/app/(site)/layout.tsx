import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { FloatingSocialLinks } from "@/components/layout/floating-social-links";

export default function SiteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="site-shell">
      <Header />
      <main id="main" className="site-main">
        {children}
      </main>
      <Footer />
      <FloatingSocialLinks />
    </div>
  );
}
