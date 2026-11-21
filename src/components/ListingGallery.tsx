import { useMemo, useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { Search, SlidersHorizontal } from "lucide-react";
import { Input } from "@/components/ui/input";
import { ListingCard } from "./ListingCard";
import { Pagination } from "./Pagination";
import { useI18n } from "@/lib/i18n";
import { useFavorites, type ItemType } from "@/hooks/useFavorites";
import { backend } from "@/integrations/api/client";
import { toast } from "sonner";
import { mapListingRow, type Listing } from "@/lib/listings";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import type { Tables } from "@/integrations/api/types";
import { qk } from "@/lib/queryKeys";

const PAGE_SIZE = 8;

type Sort = "newest" | "priceLow" | "priceHigh" | "rating";

export function ListingGallery({
  itemType,
  title,
  subtitle,
  actionLabel,
}: {
  itemType: ItemType;
  title: string;
  subtitle: string;
  actionLabel?: string;
}) {
  const { t, locale } = useI18n();
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<Sort>("newest");
  const { has, toggle, signedIn } = useFavorites();
  const { user } = useCurrentUser();
  const [page, setPage] = useState(1);

  const {
    data: dbItems = [],
    isLoading: loading,
    error,
  } = useQuery({
    queryKey: qk.listings.byType(itemType),
    queryFn: async () => {
      const { data, error } = await backend
        .resource("listings")
        .select("*")
        .eq("type", itemType)
        .eq("status", "active")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return ((data ?? []) as Tables<"listings">[]).map(mapListingRow) as Listing[];
    },
    enabled: itemType !== "competition",
  });

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    let out = dbItems.filter((l) => {
      if (!q) return true;
      const hay = `${l.title} ${l.title_en} ${l.location} ${l.location_en}`.toLowerCase();
      return hay.includes(q);
    });
    if (sort === "priceLow") out = [...out].sort((a, b) => a.price - b.price);
    if (sort === "priceHigh") out = [...out].sort((a, b) => b.price - a.price);
    if (sort === "rating") out = [...out].sort((a, b) => b.rating - a.rating);
    return out;
  }, [dbItems, search, sort]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  useEffect(() => {
    setPage(1);
  }, [search, sort, itemType]);

  async function handleAction(id: string) {
    if (!signedIn || !user) {
      toast.error(t("book.needSignIn"));
      navigate({ to: "/auth" });
      return;
    }
    const item = filtered.find((i) => i.id === id);
    if (!item) return;
    navigate({ to: "/listing/$id", params: { id } });
  }

  return (
    <div className="min-h-screen bg-background pb-24 md:pb-10">
      <div className="mx-auto max-w-7xl px-4 pt-6 sm:px-6 sm:pt-10">
        <header className="mb-6">
          <h1 className="text-2xl font-black text-foreground sm:text-4xl">{title}</h1>
          <p className="mt-1 text-sm text-muted-foreground sm:text-base">{subtitle}</p>
        </header>

        <div className="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-[1fr_220px]">
          <div className="relative">
            <Search className="pointer-events-none absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t("search.placeholder")}
              className="h-11 rounded-xl bg-card ps-9"
            />
          </div>
          <div className="relative">
            <SlidersHorizontal className="pointer-events-none absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value as Sort)}
              className="h-11 w-full rounded-xl border border-input bg-card ps-9 pe-3 text-sm text-foreground outline-none focus:border-primary"
            >
              <option value="newest">{t("sort.newest")}</option>
              <option value="rating">{t("sort.rating")}</option>
              <option value="priceLow">{t("sort.priceLow")}</option>
              <option value="priceHigh">{t("sort.priceHigh")}</option>
            </select>
          </div>
        </div>

        {loading ? (
          <div className="grid place-items-center rounded-2xl border border-dashed border-border bg-card/50 p-12 text-center text-sm text-muted-foreground">
            {t("common.loading")}
          </div>
        ) : error ? (
          <div className="grid place-items-center rounded-2xl border border-dashed border-destructive/40 bg-destructive/5 p-12 text-center text-sm text-destructive">
            {(error as Error).message}
          </div>
        ) : paginated.length === 0 ? (
          <div className="grid place-items-center rounded-2xl border border-dashed border-border bg-card/50 p-12 text-center text-sm text-muted-foreground">
            {locale === "ar" ? "لا نتائج" : "No results"}
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {paginated.map((l) => (
                <ListingCard
                  key={l.id}
                  l={l}
                  favorite={has(l.id, itemType)}
                  onToggleFavorite={() =>
                    signedIn ? toggle(l.id, itemType) : navigate({ to: "/auth" })
                  }
                  onAction={handleAction}
                  actionLabel={actionLabel}
                />
              ))}
            </div>
            <Pagination page={page} pageCount={pageCount} onChange={setPage} />
          </>
        )}
      </div>
    </div>
  );
}
