import { createFileRoute, Link } from "@tanstack/react-router";
import { Trophy, Bed, Sparkles, ShoppingBag, ArrowRight } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { FeaturedSection } from "@/components/FeaturedSection";
import { ContactSection } from "@/components/ContactSection";
import { HeroCarousel } from "@/components/home/HeroCarousel";
import {
  StatsStrip,
  DestinationsSection,
  TopHostsSection,
  TestimonialsSection,
  MapSection,
  NewsletterSection,
} from "@/components/home/HomeSections";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "ANA Refi — From Village to the World" },
      { name: "description", content: "Rural stays, experiences, products, and competitions across Egypt." },
      { property: "og:title", content: "ANA Refi — From Village to the World" },
      { property: "og:description", content: "Rural stays, experiences, products, and competitions across Egypt." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: HomePage,
});

function HomePage() {
  const { t, locale } = useI18n();
  const tiles = [
    { to: "/stays" as const, label: t("nav.stays"), Icon: Bed, hint: locale === "ar" ? "بيوت ريفية أصيلة" : "Authentic countryside stays" },
    { to: "/experiences" as const, label: t("nav.experiences"), Icon: Sparkles, hint: locale === "ar" ? "تجارب مع أهل القرية" : "Immersive local workshops" },
    { to: "/products" as const, label: t("nav.products"), Icon: ShoppingBag, hint: locale === "ar" ? "منتجات يدوية أصيلة" : "Handmade village products" },
    { to: "/competitions" as const, label: t("nav.competitions"), Icon: Trophy, hint: locale === "ar" ? "نافس على جوائز" : "Compete for real prizes" },
  ];
  return (
    <div className="min-h-screen bg-background pb-20 md:pb-8">
      <HeroCarousel />

      <StatsStrip />

      <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-14">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {tiles.map(({ to, label, Icon, hint }) => (
            <Link
              key={to}
              to={to}
              className="group rounded-2xl border border-border bg-card p-6 shadow-card transition-all hover:-translate-y-1 hover:shadow-elevated"
            >
              <div className="mb-4 grid h-12 w-12 place-items-center rounded-xl bg-gradient-primary text-primary-foreground shadow-soft">
                <Icon className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-bold text-foreground">{label}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{hint}</p>
              <span className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-primary">
                {locale === "ar" ? "استكشف" : "Explore"}
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1 rtl:rotate-180 rtl:group-hover:-translate-x-1" />
              </span>
            </Link>
          ))}
        </div>
      </section>

      <FeaturedSection />

      <DestinationsSection />

      <TopHostsSection />

      <TestimonialsSection />

      <MapSection />

      <NewsletterSection />

      <ContactSection />
    </div>
  );
}
