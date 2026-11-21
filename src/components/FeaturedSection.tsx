import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { backend } from "@/integrations/api/client";
import type { Tables } from "@/integrations/api/types";
import { useI18n } from "@/lib/i18n";
import { Star, MapPin, Sparkles } from "lucide-react";

export function FeaturedSection() {
  const { locale, t } = useI18n();
  const [items, setItems] = useState<Tables<"listings">[]>([]);

  useEffect(() => {
    backend
      .resource("listings")
      .select("*")
      .eq("is_featured", true)
      .eq("status", "active")
      .order("updated_at", { ascending: false })
      .limit(3)
      .then(({ data }) => setItems(data ?? []));
  }, []);

  if (items.length === 0) return null;

  return (
    <section className="mx-auto max-w-7xl px-4 py-14 sm:px-6">
      <div className="mb-8 flex items-end justify-between gap-4">
        <div>
          <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-3 py-1 text-xs font-bold text-primary">
            <Sparkles className="h-3 w-3" /> {locale === "ar" ? "مميز" : "Featured"}
          </span>
          <h2 className="mt-3 text-2xl font-black text-foreground sm:text-3xl">
            {locale === "ar" ? "أفضل ثلاث عروض مختارة" : "Top three curated picks"}
          </h2>
        </div>
      </div>
      <div className="grid gap-6 md:grid-cols-3">
        {items.map((l) => {
          const title = locale === "en" ? (l.title_en ?? l.title) : l.title;
          const image =
            l.images?.[0] ?? "https://www.sfari.com/wp-content/uploads/2022/05/4-59-1024x683.jpg";
          return (
            <Link
              key={l.id}
              to="/listing/$id"
              params={{ id: l.id }}
              className="group overflow-hidden rounded-3xl border border-border bg-card shadow-elevated transition-transform hover:-translate-y-1"
            >
              <div className="relative aspect-[4/3] overflow-hidden">
                <img
                  src={image}
                  alt={title}
                  loading="lazy"
                  onError={(event) => {
                    event.currentTarget.onerror = null;
                    event.currentTarget.src =
                      "https://www.sfari.com/wp-content/uploads/2022/05/4-59-1024x683.jpg";
                  }}
                  className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
                <span className="absolute top-3 start-3 inline-flex items-center gap-1 rounded-full bg-warning/90 px-2.5 py-1 text-xs font-bold text-white shadow-soft">
                  <Star className="h-3 w-3 fill-current" /> {locale === "ar" ? "مميز" : "Featured"}
                </span>
              </div>
              <div className="p-5">
                <h3 className="line-clamp-1 text-lg font-bold text-foreground">{title}</h3>
                {l.location && (
                  <p className="mt-1 flex items-center gap-1 text-sm text-muted-foreground">
                    <MapPin className="h-3 w-3" /> {l.location}
                  </p>
                )}
                <p className="mt-3 text-xl font-black text-primary">
                  {Number(l.price).toLocaleString(locale === "ar" ? "ar-EG" : "en-US")}{" "}
                  {t("comp.egp")}
                </p>
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
