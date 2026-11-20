import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, ChevronLeft, ChevronRight, MapPin } from "lucide-react";
import { backend } from "@/integrations/api/client";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/lib/i18n";
import { cn } from "@/lib/utils";

const FALLBACK = [
  "https://images.unsplash.com/photo-1519821172144-4f87d85de2a4?auto=format&fit=crop&w=1600&q=70",
  "https://images.unsplash.com/photo-1509316785289-025f5b846b35?auto=format&fit=crop&w=1600&q=70",
  "https://images.unsplash.com/photo-1473448912268-2022ce9509d8?auto=format&fit=crop&w=1600&q=70",
];

type Slide = { id: string | null; image: string; title: string; location: string };

/** Auto-rotating hero carousel driven by live featured/active listings. */
export function HeroCarousel() {
  const { t, locale } = useI18n();
  const ar = locale === "ar";
  const [i, setI] = useState(0);

  const { data: slides = [] } = useQuery({
    queryKey: ["home", "hero-slides"],
    queryFn: async (): Promise<Slide[]> => {
      const { data } = await backend
        .resource("listings")
        .select("id,title,title_en,location,images,is_featured")
        .eq("status", "active")
        .order("is_featured", { ascending: false })
        .order("created_at", { ascending: false })
        .limit(6);
      return (data ?? [])
        .filter((r) => (r.images ?? []).length > 0)
        .map((r) => ({
          id: r.id,
          image: r.images[0]!,
          title: (locale === "en" ? r.title_en : null) ?? r.title,
          location: r.location ?? "Egypt",
        }));
    },
  });

  const list: Slide[] =
    slides.length > 0
      ? slides
      : FALLBACK.map((image) => ({ id: null, image, title: "ANA Refi", location: ar ? "ريف مصر" : "Rural Egypt" }));

  useEffect(() => {
    const id = setInterval(() => setI((v) => (v + 1) % list.length), 6000);
    return () => clearInterval(id);
  }, [list.length]);

  const current = list[i % list.length]!;

  return (
    <section className="relative isolate overflow-hidden">
      {list.map((s, idx) => (
        <img
          key={`${s.image}-${idx}`}
          src={s.image}
          alt=""
          aria-hidden={idx !== i}
          className={cn(
            "absolute inset-0 h-full w-full object-cover transition-opacity duration-1000",
            idx === i ? "opacity-100" : "opacity-0",
          )}
        />
      ))}
      <div className="absolute inset-0 bg-gradient-hero opacity-85" aria-hidden />

      <div className="relative mx-auto max-w-7xl px-6 py-24 text-center text-primary-foreground sm:py-32">
        <p className="animate-fade-up mx-auto inline-block rounded-full bg-white/20 px-4 py-1.5 text-xs font-semibold tracking-wide backdrop-blur">
          {t("app.tagline")}
        </p>
        <h1 className="animate-fade-up mt-6 text-4xl font-black leading-tight sm:text-6xl">{t("app.name")}</h1>
        <p className="animate-fade-up mx-auto mt-4 max-w-2xl text-base text-primary-foreground/90 sm:text-lg">
          {ar
            ? "منصة تربطك بأجمل ما في الريف المصري: إقامات، تجارب، منتجات ومسابقات."
            : "The platform that connects you with the beauty of rural Egypt — stays, experiences, products, and competitions."}
        </p>

        <div className="animate-fade-up mt-8 flex flex-wrap items-center justify-center gap-3">
          <Link to="/stays">
            <Button size="lg" className="rounded-full bg-white text-primary hover:bg-white/90">
              {ar ? "ابدأ الاستكشاف" : "Start exploring"}
              <ArrowRight className="ms-1 h-4 w-4 rtl:rotate-180" />
            </Button>
          </Link>
          <Link to="/competitions">
            <Button size="lg" variant="outline" className="rounded-full border-white/60 bg-transparent text-white hover:bg-white/10">
              {t("nav.competitions")}
            </Button>
          </Link>
        </div>

        {current.id && (
          <Link
            to="/listing/$id"
            params={{ id: current.id }}
            className="mt-10 inline-flex items-center gap-2 rounded-full bg-black/25 px-4 py-2 text-xs font-semibold backdrop-blur transition-colors hover:bg-black/40"
          >
            <MapPin className="h-3.5 w-3.5" />
            {current.title} · {current.location}
          </Link>
        )}

        <div className="mt-8 flex items-center justify-center gap-3">
          <button
            type="button"
            aria-label="Previous slide"
            onClick={() => setI((v) => (v - 1 + list.length) % list.length)}
            className="grid h-9 w-9 place-items-center rounded-full bg-white/20 backdrop-blur hover:bg-white/30"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <div className="flex gap-1.5">
            {list.map((_, idx) => (
              <button
                key={idx}
                type="button"
                aria-label={`Slide ${idx + 1}`}
                onClick={() => setI(idx)}
                className={cn("h-2 rounded-full transition-all", idx === i ? "w-6 bg-white" : "w-2 bg-white/50")}
              />
            ))}
          </div>
          <button
            type="button"
            aria-label="Next slide"
            onClick={() => setI((v) => (v + 1) % list.length)}
            className="grid h-9 w-9 place-items-center rounded-full bg-white/20 backdrop-blur hover:bg-white/30"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>
      </div>
    </section>
  );
}