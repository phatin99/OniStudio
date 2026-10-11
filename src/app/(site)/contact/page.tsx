import {
  ArrowRight,
  MessageSquareText,
  UserRound,
  CircleCheck,
  ArrowUpRight,
  Mail,
  MapPin,
  Phone,
} from "lucide-react";
import { ContactMessengerIcon } from "@/components/contact/messenger-icon";
import Image from "next/image";
import { ContactMotion } from "@/components/contact/contact-motion";
import { context } from "@/lib/i18n";
import { site } from "@/data/site";
import { pageMetadata } from "@/lib/metadata";

export function generateMetadata() {
  return pageMetadata(
    { vi: "Liên hệ & địa chỉ", en: "Contact & visit" },
    {
      vi: "Liên hệ Oni Studio, xem địa chỉ, bản đồ và các kênh nhắn tin để chuẩn bị buổi chụp.",
      en: "Contact Oni Studio, find the address, map and messaging channels to prepare your shoot.",
    },
    "/contact",
  );
}

export default async function Contact() {
  const { locale } = await context();
  const vi = locale === "vi";

  return (
    <main className="contact-page-v3 contact-refresh oni-contact-v5">
      <ContactMotion />
      <section className="oni-contact-v5-hero" aria-labelledby="oni-contact-v5-title">
        <div className="container oni-contact-v5-hero-grid">
          <div className="oni-contact-v5-hero-title">
            <p className="oni-contact-v5-kicker">ONI STUDIO · CONTACT</p>
            <h1 id="oni-contact-v5-title">
              {vi
                ? "Cùng lên kế hoạch cho buổi chụp của bạn."
                : "Let's plan your next shoot together."}
            </h1>
          </div>
          <div className="oni-contact-v5-hero-side">
            <p className="oni-contact-v5-intro">
              {vi
                ? "Cho ONI biết bạn đang chuẩn bị concept gì, dự kiến chụp khi nào và cần những thiết bị nào. Chúng tôi sẽ cùng bạn tìm phương án phù hợp."
                : "Tell ONI about your idea, preferred date and equipment needs. We'll help you find the right setup for your shoot."}
            </p>
            <div className="oni-contact-v5-actions">
              <a href={site.messenger} target="_blank" rel="noopener noreferrer" className="oni-contact-v5-button oni-contact-v5-button-primary">
                <ContactMessengerIcon size={19} />
                {vi ? "Nhắn ONI Studio" : "Message ONI Studio"}
                <ArrowUpRight size={16} aria-hidden="true" />
              </a>
              <a href={`tel:${site.phoneHref}`} className="oni-contact-v5-button oni-contact-v5-button-outline">
                <Phone size={18} aria-hidden="true" />
                {vi ? `Gọi ${site.phone}` : `Call ${site.phone}`}
              </a>
            </div>
            <p className="oni-contact-v5-hero-note">
              {vi
                ? "Bạn chưa có concept hoàn chỉnh? Không sao, hãy bắt đầu từ những ý tưởng đầu tiên của bạn."
                : "Still shaping your concept? Start by telling us what you have in mind."}
            </p>
          </div>
        </div>
      </section>

      <section className="oni-contact-v5-section oni-contact-v5-preparation" aria-labelledby="oni-contact-v5-preparation-title">
        <div className="container oni-contact-v5-preparation-grid">
          <div className="oni-contact-v5-section-heading">
            <span className="oni-contact-v5-index">01 / 03</span>
            <h2 id="oni-contact-v5-preparation-title">
              {vi ? "Thông tin giúp ONI tư vấn tốt hơn" : "A few details to get started"}
            </h2>
            <p>
              {vi
                ? "Bạn không cần chuẩn bị mọi thứ thật hoàn hảo. Chỉ cần ba thông tin cơ bản dưới đây."
                : "You don't need a fully finished plan. These three details are enough to get started."}
            </p>
          </div>
          <ol className="oni-contact-v5-preparation-list">
            <li>
              <span className="oni-contact-v5-preparation-number">01</span>
              <div>
                <h3>Concept / Moodboard</h3>
                <p>
                  {vi
                    ? "Phong cách hình ảnh, sản phẩm hoặc nội dung dự kiến thực hiện. Bạn có thể gửi hình tham khảo nếu đã có."
                    : "Tell us about the visual style, product or shoot concept. Reference images are welcome, but not required."}
                </p>
              </div>
            </li>
            <li>
              <span className="oni-contact-v5-preparation-number">02</span>
              <div>
                <h3>{vi ? "Ngày chụp & thời lượng" : "Shoot date & duration"}</h3>
                <p>
                  {vi
                    ? "Ngày dự kiến, khung giờ bắt đầu – kết thúc và thời gian cần sử dụng studio."
                    : "Share your preferred date, start and end times, and the time you need in the studio."}
                </p>
              </div>
            </li>
            <li>
              <span className="oni-contact-v5-preparation-number">03</span>
              <div>
                <h3>{vi ? "Nhu cầu thiết bị & setup" : "Equipment & setup"}</h3>
                <p>
                  {vi
                    ? "Đèn, chân đèn, phông nền, máy khói, thiết bị thuê ngoài hoặc yêu cầu hỗ trợ khác."
                    : "Let us know about lighting, backdrops, smoke machines, external rentals or other support."}
                </p>
              </div>
            </li>
          </ol>
        </div>
      </section>

      <section className="oni-contact-v5-section oni-contact-v5-process" aria-labelledby="oni-contact-v5-process-title">
        <div className="container">
          <div className="oni-contact-v5-section-heading oni-contact-v5-wide-heading">
            <span className="oni-contact-v5-index">02 / 03</span>
            <h2 id="oni-contact-v5-process-title">
              {vi ? "Từ yêu cầu đến buổi chụp" : "From idea to shoot day"}
            </h2>
            <p>
              {vi
                ? "Quy trình trao đổi đơn giản, nhanh chóng và rõ ràng."
                : "A simple and clear process to prepare for your session."}
            </p>
          </div>
          <ol className="oni-contact-v5-process-list">
            <li>
              <div className="oni-contact-v6-step-heading">
                <span className="oni-contact-v5-step">1</span>
                <MessageSquareText size={30} strokeWidth={1.6} className="oni-contact-v6-step-icon" aria-hidden="true" />
                <ArrowRight size={19} strokeWidth={1.5} className="oni-contact-v6-step-arrow" aria-hidden="true" />
              </div>
              <h3>{vi ? "Gửi thông tin" : "Share your details"}</h3>
              <p>{vi ? "Chia sẻ concept, thời gian và nhu cầu sử dụng." : "Tell us your concept, timing and requirements."}</p>
            </li>
            <li>
              <div className="oni-contact-v6-step-heading">
                <span className="oni-contact-v5-step">2</span>
                <UserRound size={30} strokeWidth={1.6} className="oni-contact-v6-step-icon" aria-hidden="true" />
                <ArrowRight size={19} strokeWidth={1.5} className="oni-contact-v6-step-arrow" aria-hidden="true" />
              </div>
              <h3>{vi ? "Nhận tư vấn" : "Get advice"}</h3>
              <p>
                {vi
                  ? "ONI trao đổi về không gian, thiết bị, thời lượng và chi phí dự kiến."
                  : "ONI discusses your space, equipment, duration and estimated costs."}
              </p>
            </li>
            <li>
              <div className="oni-contact-v6-step-heading">
                <span className="oni-contact-v5-step">3</span>
                <CircleCheck size={30} strokeWidth={1.6} className="oni-contact-v6-step-icon" aria-hidden="true" />
              </div>
              <h3>{vi ? "Xác nhận lịch chụp" : "Confirm your shoot"}</h3>
              <p>
                {vi
                  ? "Hai bên thống nhất lịch, dịch vụ và các điều khoản liên quan trước khi đến."
                  : "Together we confirm the schedule, services and applicable terms."}
              </p>
            </li>
          </ol>
        </div>
      </section>

      <section className="oni-contact-v5-section oni-contact-v5-reach" aria-labelledby="oni-contact-v5-reach-title">
        <div className="container">
          <div className="oni-contact-v5-section-heading oni-contact-v5-wide-heading">
            <span className="oni-contact-v5-index">03 / 03</span>
            <h2 id="oni-contact-v5-reach-title">
              {vi ? "Liên hệ với ONI Studio" : "Get in touch with ONI Studio"}
            </h2>
            <p>
              {vi
                ? "Dù bạn đã có kế hoạch chi tiết hay chỉ mới bắt đầu lên ý tưởng, hãy liên hệ để cùng tìm phương án phù hợp."
                : "Whether you've planned every detail or are just starting, we'd love to hear from you."}
            </p>
          </div>
          <div className="oni-contact-v5-reach-grid">
            <a href={site.messenger} target="_blank" rel="noopener noreferrer" className="oni-contact-v5-reach-card">
              <ContactMessengerIcon size={27} />
              <div>
                <h3>Messenger</h3>
                <p>{vi ? "Trao đổi nhanh về lịch trống và nhu cầu chụp." : "Ask about availability and your shoot."}</p>
              </div>
              <ArrowUpRight size={18} className="oni-contact-v5-link-arrow" aria-hidden="true" />
            </a>
            <a href={`tel:${site.phoneHref}`} className="oni-contact-v5-reach-card">
              <Phone size={24} aria-hidden="true" />
              <div>
                <h3>{site.phone}</h3>
                <p>{vi ? "Liên hệ trực tiếp với ONI Studio." : "Call ONI Studio directly."}</p>
              </div>
              <ArrowUpRight size={18} className="oni-contact-v5-link-arrow" aria-hidden="true" />
            </a>
            <a href={`mailto:${site.email}`} className="oni-contact-v5-reach-card">
              <Mail size={24} aria-hidden="true" />
              <div>
                <h3>{site.email}</h3>
                <p>{vi ? "Gửi brief, moodboard hoặc yêu cầu chi tiết." : "Send your brief, moodboard or specific requests."}</p>
              </div>
              <ArrowUpRight size={18} className="oni-contact-v5-link-arrow" aria-hidden="true" />
            </a>
          </div>
          <a className="oni-contact-v5-address" href={site.map} target="_blank" rel="noopener noreferrer">
            <MapPin size={17} aria-hidden="true" />
            <span>{site.address[locale]}</span>
            <ArrowUpRight size={16} aria-hidden="true" />
          </a>
        </div>
      </section>

      <section className="container contact-v3-map-section">
        <div className="contact-v3-map-head">
          <div>
            <p className="eyebrow">{vi ? "GHÉ ONI" : "VISIT ONI"}</p>
            <h2>
              {vi
                ? "Tìm đường đến studio."
                : "Find your way to the studio."}
            </h2>
          </div>

          <a
            className="contact-v3-map-link"
            href={site.map}
            target="_blank"
            rel="noopener noreferrer"
          >
            Google Maps
            <ArrowUpRight size={16} aria-hidden="true" />
          </a>
        </div>

        <div className="contact-v3-map-layout">
          <div className="contact-v3-map-frame">
            <iframe
              title={vi ? "Bản đồ đến Oni Studio" : "Directions to Oni Studio"}
              src={site.mapEmbed}
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              allowFullScreen
            />
          </div>

          <aside className="contact-v3-map-aside">
            <div className="contact-refresh-logo-wrap">
              <Image src="/images/oni-contact-logo.webp" alt="Oni Studio" width={164} height={164} className="contact-refresh-logo" />
              <svg className="contact-refresh-orbit" viewBox="0 0 220 220" role="img" aria-label={vi ? "Nét trang trí chuyển động quanh logo" : "Decorative line around the logo"}><circle cx="110" cy="110" r="101" fill="none" stroke="currentColor" strokeWidth="1" strokeDasharray="3 10" /><path d="M 10 110 A 100 100 0 0 1 110 10" fill="none" stroke="currentColor" strokeWidth="2" /></svg>
            </div>
            <div className="contact-refresh-aside-bottom">
            <p className="contact-v3-small-label">
              {vi ? "TRƯỚC KHI DI CHUYỂN" : "BEFORE YOU TRAVEL"}
            </p>

            <h3>
              {vi
                ? "Xác nhận lịch trước khi đến."
                : "Confirm your booking before arrival."}
            </h3>

            <p>
              {vi
                ? "Oni sẽ xác nhận lại phòng, thời lượng và nhu cầu thiết bị trước buổi chụp."
                : "Oni will confirm the room, duration and equipment requirements before your session."}
            </p>

            <a
              href={site.messenger}
              target="_blank"
              rel="noopener noreferrer"
              className="contact-v3-aside-link"
            >
              {vi ? "Nhắn Oni để xác nhận" : "Message Oni to confirm"}
              <ArrowRight size={16} aria-hidden="true" />
            </a>
            </div>
          </aside>
        </div>
      </section>
    </main>
  );
}
