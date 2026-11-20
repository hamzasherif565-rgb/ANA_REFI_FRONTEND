import { Heart, MapPin, Star } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useI18n } from "@/lib/i18n";
import type { Listing } from "@/lib/listings";

export function ListingCard({
  l,
  favorite,
  onToggleFavorite,
  onAction,
  actionLabel,
}: {
  l: Listing;
  favorite?: boolean;
  onToggleFavorite?: (id: string) => void;
  onAction?: (id: string) => void;
  actionLabel?: string;
}) {
  const { t, locale } = useI18n();
  const title = locale === "en" ? l.title_en : l.title;
  const description = locale === "en" ? l.description_en : l.description;
  const location = locale === "en" ? l.location_en : l.location;
  const unitLabel =
    l.unit === "night" ? t("unit.night") : l.unit === "person" ? t("unit.person") : t("unit.item");

  return (
    <article className="group flex flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-card transition-all hover:-translate-y-1 hover:shadow-elevated">
      <Link to="/listing/$id" params={{ id: l.id }} className="relative block aspect-[4/3] overflow-hidden bg-muted">
        <img
          src={l.image}
          alt={title}
          loading="lazy"
          onError={(event) => { event.currentTarget.onerror = null; event.currentTarget.src = "https://www.sfari.com/wp-content/uploads/2022/05/4-59-1024x683.jpg"; }}
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
      </Link>
      <div className="relative -mt-9 flex justify-between px-3">
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); onToggleFavorite?.(l.id); }}
          aria-label="favorite"
          className={cn(
            "order-2 grid h-9 w-9 place-items-center rounded-full bg-background/90 shadow-soft backdrop-blur transition-colors",
            favorite ? "text-destructive" : "text-foreground hover:text-destructive",
          )}
        >
          <Heart className={cn("h-4 w-4", favorite && "fill-current")} />
        </button>
        <span className="order-1 flex items-center gap-1 rounded-full bg-background/90 px-2.5 py-1 text-xs font-semibold shadow-soft backdrop-blur">
          <Star className="h-3 w-3 fill-warning text-warning" />
          {l.rating.toFixed(1)}
        </span>
      </div>

      <div className="flex flex-1 flex-col gap-3 p-4 pt-2">
        <div>
          <Link to="/listing/$id" params={{ id: l.id }} className="line-clamp-1 text-base font-bold text-foreground hover:text-primary">{title}</Link>
          <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{description}</p>
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <MapPin className="h-4 w-4 shrink-0 text-primary" />
          <span className="truncate">{location}</span>
        </div>
        <div className="mt-auto flex items-end justify-between gap-2">
          <div>
            <p className="text-lg font-black text-foreground">
              {l.price.toLocaleString(locale === "ar" ? "ar-EG" : "en-US")}{" "}
              <span className="text-xs font-medium text-muted-foreground">{t("comp.egp")} / {unitLabel}</span>
            </p>
          </div>
          <Button size="sm" className="rounded-xl" onClick={() => onAction?.(l.id)}>
            {actionLabel ?? t("listing.book")}
          </Button>
        </div>
      </div>
    </article>
  );
}
