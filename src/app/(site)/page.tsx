import { Suspense } from "react";
import { ArrowUpRight } from "lucide-react";
import PageLoading from "@/components/ui/page-loading";
import { HomeHeroMotion } from "@/components/home/home-hero-motion";
import Link from "@/components/ui/nav-link";
import { StudioCard } from "@/components/catalog/studio-card";
import { HomeStudiosCarousel } from "@/components/home/home-studios-carousel";
import { EquipmentCard } from "@/components/catalog/equipment-card";
import { getCatalog } from "@/lib/catalog";
import { context, href } from "@/lib/i18n";
import { pageMetadata } from "@/lib/metadata";

export function generateMetadata() {
  return pageMetadata(
    { vi: "Oni Studio — Trang chủ", en: "Oni Studio — Home" },
    {
      vi: "Trang chủ tối giản để xem nhanh không gian chụp, thiết bị nổi bật và đi tới từng trang chi tiết.",
      en: "A minimal homepage to quickly browse studio spaces, featured equipment and dedicated detail pages.",
    },
    "/",
  );
}

async function HomeContent() {
  const [{ locale }, { studios, equipment, categories }] = await Promise.all([
    context(),
    getCatalog(),
  ]);

  const vi = locale === "vi";
  const featuredStudios = studios;
  const featuredEquipment = equipment.filter((item) => item.featured).slice(0, 4);
  const equipmentPreview =
    featuredEquipment.length > 0 ? featuredEquipment : equipment.slice(0, 4);
  const maxArea =
    studios.length > 0 ? Math.max(...studios.map((studio) => studio.area)) : null;



  return (
    <div className="home-clean-v3 home-clean-v33">
      <HomeHeroMotion
        locale={locale}
        spacesHref={href(locale, "/studios")}
        equipmentHref={href(locale, "/equipment")}
        studioCount={studios.length}
        equipmentCount={equipment.length}
        maxArea={maxArea}
      />

      <section className="home-clean-v3-section section">
        <div className="container">
          <div className="home-clean-v3-heading-row">
            <div>
              <p className="eyebrow">01 / SPACES</p>
              <h2>{vi ? "Không gian nổi bật." : "Featured Studio Spaces."}</h2>
              <p>
                {vi
                  ? "Khám phá các không gian chụp tại Oni Studio và lựa chọn phòng phù hợp với ý tưởng, quy mô ê-kíp và nhu cầu của buổi chụp."
                  : "Explore Oni Studio's shooting spaces and find the right room for your concept, crew, and shoot."}
              </p>
            </div>

            <Link
              className="home-clean-v3-text-link"
              href={href(locale, "/studios")}
            >
              {vi ? "Tất cả không gian" : "All spaces"}
              <ArrowUpRight size={16} />
            </Link>
          </div>

                    <HomeStudiosCarousel count={featuredStudios.length} locale={locale}>
            {featuredStudios.map((studio, index) => (
              <div className="home-studios-slide-v1" key={studio.id}>
                <StudioCard studio={studio} locale={locale} index={index + 1} />
              </div>
            ))}
          </HomeStudiosCarousel>
        </div>
      </section>

      <section className="home-clean-v3-section section section-soft">
        <div className="container">
          <div className="home-clean-v3-heading-row">
            <div>
              <p className="eyebrow">02 / EQUIPMENT</p>
              <h2>
                {vi
                  ? "Thiết bị nổi bật."
                  : "Featured Equipment."}
              </h2>
              <p>
                {vi
                  ? "Khám phá các thiết bị nổi bật tại Oni Studio để lựa chọn những gì phù hợp với ý tưởng và nhu cầu của buổi chụp."
                  : "Explore featured equipment at Oni Studio and find the right setup for your next shoot."}
              </p>
            </div>

            <Link
              className="home-clean-v3-text-link"
              href={href(locale, "/equipment")}
            >
              {vi ? "Mở danh mục thiết bị" : "Open equipment catalog"}
              <ArrowUpRight size={16} />
            </Link>
          </div>

          <div className="home-clean-v3-card-grid home-clean-v3-card-grid--four">
            {equipmentPreview.map((item) => (
              <EquipmentCard
                key={item.id}
                item={item}
                categories={categories}
                allEquipment={equipment}
                locale={locale}
              />
            ))}
          </div>
        </div>
      </section>

          </div>
  );
}

function HomeFallback() {
  return <PageLoading />;
}

export default function HomePage() {
  return (
    <Suspense fallback={<HomeFallback />}>
      <HomeContent />
    </Suspense>
  );
}
