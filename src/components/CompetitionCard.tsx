import { Heart, MapPin, Calendar, Trophy, Users, Loader2 } from "lucide-react";
import type { Tables } from "@/integrations/api/types";
import { useI18n } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type Competition = Tables<"competitions">;

function formatCountdown(startsAt: string, locale: string) {
  const diff = new Date(startsAt).getTime() - Date.now();
  if (diff <= 0) return locale === "ar" ? "بدأت" : "Started";
  const days = Math.floor(diff / 86_400_000);
  const hours = Math.floor((diff % 86_400_000) / 3_600_000);
  const mins = Math.floor((diff % 3_600_000) / 60_000);
  if (locale === "ar")
    return `${String(days).padStart(2, "0")} أيام ${String(hours).padStart(2, "0")} ساعة ${String(mins).padStart(2, "0")} دقيقة`;
  return `${days}d ${hours}h ${mins}m`;
}

function formatDateRange(startsAt: string, endsAt: string, locale: string) {
  const opts: Intl.DateTimeFormatOptions = { day: "2-digit", month: "short", year: "numeric" };
  const s = new Date(startsAt).toLocaleDateString(locale === "ar" ? "ar-EG" : "en-GB", opts);
  const e = new Date(endsAt).toLocaleDateString(locale === "ar" ? "ar-EG" : "en-GB", opts);
  return `${s} — ${e}`;
}

export function CompetitionCard({
  c,
  favorite,
  onToggleFavorite,
  onBook,
  booking,
}: {
  c: Competition;
  favorite?: boolean;
  onToggleFavorite?: (id: string) => void;
  onBook?: (competition: Competition) => void;
  booking?: boolean;
}) {
  const { t, locale } = useI18n();
  const title = locale === "en" && c.title_en ? c.title_en : c.title;
  const description = locale === "en" && c.description_en ? c.description_en : c.description;
  const closed = c.status === "closed" || c.status === "cancelled" || c.status === "completed";

  return (
    <article className="group flex flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-card transition-all hover:-translate-y-1 hover:shadow-elevated">
      <div className="relative aspect-[4/3] overflow-hidden bg-muted">
        {c.image_url && (
          <img
            src={c.image_url}
            alt={title}
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        )}
        <div className="absolute inset-x-0 top-0 flex items-start justify-between p-3">
          {c.featured && !closed && (
            <span className="rounded-full bg-primary px-3 py-1 text-xs font-semibold text-primary-foreground shadow-soft">
              {t("comp.featured")}
            </span>
          )}
          {c.coming_soon && !c.featured && !closed && (
            <span className="rounded-full bg-warning px-3 py-1 text-xs font-semibold text-white shadow-soft">
              {t("comp.comingSoon")}
            </span>
          )}
          {closed && (
            <span className="rounded-full bg-destructive px-3 py-1 text-xs font-semibold text-destructive-foreground shadow-soft">
              {t("comp.registrationClosed")}
            </span>
          )}
          <button
            type="button"
            onClick={() => onToggleFavorite?.(c.id)}
            aria-label="favorite"
            className={cn(
              "ms-auto grid h-9 w-9 place-items-center rounded-full bg-background/90 backdrop-blur transition-colors",
              favorite ? "text-destructive" : "text-foreground hover:text-destructive",
            )}
          >
            <Heart className={cn("h-4 w-4", favorite && "fill-current")} />
          </button>
        </div>
        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-3">
          <p className="text-center text-xs font-semibold text-white">
            {formatCountdown(c.starts_at, locale)}
          </p>
        </div>
      </div>

      <div className="flex flex-1 flex-col gap-3 p-4">
        <div>
          <h3 className="line-clamp-1 text-lg font-bold text-foreground">{title}</h3>
          {description && (
            <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{description}</p>
          )}
        </div>

        <ul className="space-y-1.5 text-sm text-muted-foreground">
          <li className="flex items-center gap-2">
            <MapPin className="h-4 w-4 shrink-0 text-primary" />
            <span className="truncate">{c.location}</span>
          </li>
          <li className="flex items-center gap-2">
            <Calendar className="h-4 w-4 shrink-0 text-primary" />
            <span className="truncate">{formatDateRange(c.starts_at, c.ends_at, locale)}</span>
          </li>
          <li className="flex items-center gap-2">
            <Trophy className="h-4 w-4 shrink-0 text-primary" />
            <span>
              {t("comp.prize")}: {c.prize_amount.toLocaleString(locale === "ar" ? "ar-EG" : "en-US")} {t("comp.egp")}
            </span>
          </li>
          <li className="flex items-center gap-2">
            <Users className="h-4 w-4 shrink-0 text-primary" />
            <span>
              {t("comp.participants")}: {c.participants_count}/{c.capacity}
            </span>
          </li>
        </ul>

        {closed ? (
          <Button variant="outline" disabled className="mt-auto w-full rounded-xl border-destructive/40 text-destructive">
            {t("comp.registrationClosed")}
          </Button>
        ) : (
          <div className="mt-auto flex items-center gap-2">
            <div className="flex-1 rounded-xl border border-border bg-secondary/60 px-3 py-2 text-center">
              <p className="text-[10px] uppercase tracking-wide text-muted-foreground">{t("comp.fee")}</p>
              <p className="text-sm font-bold text-foreground">
                {c.entry_fee === 0
                  ? t("comp.free")
                  : `${c.entry_fee.toLocaleString(locale === "ar" ? "ar-EG" : "en-US")} ${t("comp.egp")}`}
              </p>
            </div>
            <Button disabled={booking} onClick={() => onBook?.(c)} className="flex-1 rounded-xl bg-primary font-semibold text-primary-foreground hover:bg-primary/90">
              {booking && <Loader2 className="me-1 h-4 w-4 animate-spin" />}
              {t("comp.subscribe")}
            </Button>
          </div>
        )}
      </div>
    </article>
  );
}