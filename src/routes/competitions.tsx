import { useMemo, useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMutation, useQueryClient, useSuspenseQuery, queryOptions } from "@tanstack/react-query";
import {
  Trophy,
  Search,
  Plus,
  SlidersHorizontal,
  MapPin,
  LayoutGrid,
  Rabbit,
  Sprout,
  Palette,
  Hand,
  ChefHat,
  Camera,
  Sparkles,
  MoreHorizontal,
  Award,
  Users,
  Heart,
  Leaf,
} from "lucide-react";
import { CompetitionCard } from "@/components/CompetitionCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useI18n } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { listCompetitions } from "@/lib/competitions.functions";
import { backend } from "@/integrations/api/client";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { toast } from "sonner";
import { qk } from "@/lib/queryKeys";
import type { Tables } from "@/integrations/api/types";

const competitionsQuery = queryOptions({
  queryKey: ["competitions", "list"],
  queryFn: () => listCompetitions(),
  staleTime: 60_000,
});

export const Route = createFileRoute("/competitions")({
  head: () => ({
    meta: [
      { title: "Competitions — ANA Refi" },
      { name: "description", content: "Discover rural competitions across Egypt: horse riding, agriculture, pottery, handicrafts, and more." },
      { property: "og:title", content: "Competitions — ANA Refi" },
      { property: "og:description", content: "Join rural competitions and compete for prizes across Egypt." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  loader: ({ context }) => context.queryClient.ensureQueryData(competitionsQuery),
  component: CompetitionsPage,
});

const CATEGORIES = [
  { key: "all", Icon: LayoutGrid },
  { key: "horse_riding", Icon: Rabbit },
  { key: "agriculture", Icon: Sprout },
  { key: "pottery", Icon: Palette },
  { key: "handicrafts", Icon: Hand },
  { key: "popular_cooking", Icon: ChefHat },
  { key: "photography", Icon: Camera },
  { key: "other", Icon: MoreHorizontal },
] as const;

const TABS = ["all", "mine", "favorites", "rentals"] as const;
type Tab = (typeof TABS)[number];

function CompetitionsPage() {
  const { t, locale } = useI18n();
  const { user } = useCurrentUser();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { data: competitions } = useSuspenseQuery(competitionsQuery);
  const [tab, setTab] = useState<Tab>("all");
  const [category, setCategory] = useState<string>("all");
  const [search, setSearch] = useState("");
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const bookingMutation = useMutation({
    mutationFn: async (competition: Tables<"competitions">) => {
      if (!user) throw new Error(locale === "ar" ? "سجل الدخول أولًا للاشتراك" : "Sign in first to join");
      const { data, error } = await backend.resource("bookings").insert({
        item_id: competition.id,
        item_type: "competition",
      }).select("id").single();
      if (error) throw error;
      if (!data) throw new Error("Booking response did not include an ID.");
      return data.id;
    },
    onSuccess: (bookingId) => {
      qc.invalidateQueries({ queryKey: qk.bookings.all });
      qc.invalidateQueries({ queryKey: qk.competitions.all });
      navigate({ to: "/payment/$bookingId", params: { bookingId } });
    },
    onError: (error) => toast.error(error.message.includes("unique") ? (locale === "ar" ? "أنت مشترك بالفعل في هذه المسابقة" : "You already joined this competition") : error.message),
  });

  const filtered = useMemo(() => {
    return competitions.filter((c) => {
      if (category !== "all" && c.category !== category) return false;
      if (search) {
        const q = search.toLowerCase();
        const hay = `${c.title} ${c.title_en ?? ""} ${c.location} ${c.category}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      if (tab === "favorites" && !favorites.has(c.id)) return false;
      return true;
    });
  }, [competitions, category, search, tab, favorites]);

  const toggleFav = (id: string) => {
    setFavorites((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  return (
    <div className="min-h-screen bg-background pb-20 md:pb-8">
      <div className="mx-auto max-w-7xl px-4 pt-6 sm:px-6 sm:pt-10">
        <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4 sm:flex sm:flex-wrap sm:justify-between">
          <div className="flex min-w-0 items-center gap-3">
            <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-gradient-primary text-primary-foreground shadow-soft">
              <Trophy className="h-6 w-6" />
            </div>
            <div className="min-w-0">
              <h1 className="truncate text-xl font-black text-foreground sm:text-3xl">{t("comp.title")}</h1>
              <p className="truncate text-xs text-muted-foreground sm:text-sm">{t("comp.subtitle")}</p>
            </div>
          </div>
          <Link to="/host">
            <Button size="lg" className="shrink-0 rounded-xl shadow-soft">
              <Plus className="h-4 w-4 me-1" />
              <span className="hidden sm:inline">{t("comp.create")}</span>
            </Button>
          </Link>
        </div>

        <div className="mt-6 border-b border-border">
          <div className="flex gap-6 overflow-x-auto">
            {TABS.map((k) => (
              <button
                key={k}
                onClick={() => setTab(k)}
                className={cn(
                  "relative shrink-0 px-1 py-3 text-sm font-semibold transition-colors",
                  tab === k ? "text-primary" : "text-muted-foreground hover:text-foreground",
                )}
              >
                {t(`comp.${k}`)}
                {tab === k && <span className="absolute inset-x-0 -bottom-px h-0.5 rounded-full bg-primary" />}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
          <div className="relative sm:col-span-2 lg:col-span-2">
            <Search className="pointer-events-none absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t("comp.search")}
              className="h-11 rounded-xl bg-card ps-9"
            />
          </div>
          <FilterPill Icon={LayoutGrid} label={t("comp.allCategories")} />
          <FilterPill Icon={MapPin} label={t("comp.allPlaces")} />
          <FilterPill Icon={SlidersHorizontal} label={t("comp.newest")} />
        </div>

        <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-[240px_1fr]">
          <aside className="space-y-4">
            <div className="rounded-2xl border border-border bg-card p-3 shadow-card">
              <h2 className="mb-2 px-2 text-sm font-bold text-foreground">{t("cat.all")}</h2>
              <ul className="space-y-1">
                {CATEGORIES.map(({ key, Icon }) => (
                  <li key={key}>
                    <button
                      onClick={() => setCategory(key)}
                      className={cn(
                        "flex w-full items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition-colors",
                        category === key
                          ? "bg-primary text-primary-foreground shadow-soft"
                          : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
                      )}
                    >
                      <Icon className="h-4 w-4" />
                      <span className="truncate">{t(`cat.${key}`)}</span>
                    </button>
                  </li>
                ))}
              </ul>
            </div>

            <div className="rounded-2xl border border-border bg-card p-4 shadow-card">
              <h2 className="mb-3 text-sm font-bold text-foreground">{t("comp.why")}</h2>
              <ul className="space-y-2.5 text-sm text-muted-foreground">
                <li className="flex items-center gap-2">
                  <Award className="h-4 w-4 shrink-0 text-primary" />
                  <span>{t("comp.why.prizes")}</span>
                </li>
                <li className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4 shrink-0 text-primary" />
                  <span>{t("comp.why.experience")}</span>
                </li>
                <li className="flex items-center gap-2">
                  <Users className="h-4 w-4 shrink-0 text-primary" />
                  <span>{t("comp.why.people")}</span>
                </li>
                <li className="flex items-center gap-2">
                  <Leaf className="h-4 w-4 shrink-0 text-primary" />
                  <span>{t("comp.why.heritage")}</span>
                </li>
              </ul>
            </div>
          </aside>

          {filtered.length === 0 ? (
            <div className="grid place-items-center rounded-2xl border border-dashed border-border bg-card/50 p-12 text-center">
              <Heart className="mb-3 h-10 w-10 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">{t("empty.competitions")}</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
              {filtered.map((c) => (
                <CompetitionCard
                  key={c.id}
                  c={c}
                  favorite={favorites.has(c.id)}
                  onToggleFavorite={toggleFav}
                  onBook={(competition) => bookingMutation.mutate(competition)}
                  booking={bookingMutation.isPending && bookingMutation.variables?.id === c.id}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function FilterPill({ Icon, label }: { Icon: React.ComponentType<{ className?: string }>; label: string }) {
  return (
    <button
      type="button"
      className="flex h-11 items-center justify-between gap-2 rounded-xl border border-border bg-card px-3 text-sm text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground"
    >
      <span className="flex items-center gap-2 truncate">
        <Icon className="h-4 w-4" />
        <span className="truncate">{label}</span>
      </span>
    </button>
  );
}
