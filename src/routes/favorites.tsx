import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Heart } from "lucide-react";
import { useFavorites } from "@/hooks/useFavorites";
import { ListingCard } from "@/components/ListingCard";
import { CompetitionCard } from "@/components/CompetitionCard";
import { mapListingRow } from "@/lib/listings";
import { useI18n } from "@/lib/i18n";
import { backend } from "@/integrations/api/client";
import { Button } from "@/components/ui/button";
import { qk } from "@/lib/queryKeys";

export const Route = createFileRoute("/favorites")({
  head: () => ({
    meta: [
      { title: "Favorites — ANA Refi" },
      { name: "description", content: "Your saved competitions, stays, experiences, and products on ANA Refi." },
      { property: "og:title", content: "Favorites — ANA Refi" },
      { property: "og:description", content: "Everything you saved on ANA Refi." },
    ],
  }),
  component: FavoritesPage,
});

function FavoritesPage() {
  const { t } = useI18n();
  const { rows, toggle, signedIn } = useFavorites();
  const compIds = rows.filter((r) => r.item_type === "competition").map((r) => r.item_id);
  const listingIds = rows.filter((r) => r.item_type !== "competition").map((r) => r.item_id);

  const { data: comps = [] } = useQuery({
    queryKey: qk.competitions.byIds(compIds),
    queryFn: async () => {
      if (!compIds.length) return [];
      const { data, error } = await backend.resource("competitions").select("*").in("id", compIds);
      if (error) throw error;
      return data ?? [];
    },
    enabled: compIds.length > 0,
  });

  const { data: listingRows = [] } = useQuery({
    queryKey: qk.listings.byIds(listingIds),
    queryFn: async () => {
      if (!listingIds.length) return [];
      const { data, error } = await backend.resource("listings").select("*").in("id", listingIds);
      if (error) throw error;
      return data ?? [];
    },
    enabled: listingIds.length > 0,
  });

  if (!signedIn) {
    return (
      <div className="mx-auto grid min-h-[60vh] max-w-md place-items-center px-4 text-center">
        <div>
          <Heart className="mx-auto mb-3 h-10 w-10 text-muted-foreground" />
          <p className="text-muted-foreground">{t("book.needSignIn")}</p>
          <Link to="/auth"><Button className="mt-4 rounded-xl">{t("nav.signin")}</Button></Link>
        </div>
      </div>
    );
  }

  const listings = listingRows.map((r) => ({ row: r, listing: mapListingRow(r) }));

  return (
    <div className="mx-auto max-w-7xl px-4 pt-8 pb-24 sm:px-6 md:pb-10">
      <h1 className="text-2xl font-black text-foreground sm:text-3xl">{t("dash.favorites")}</h1>

      {rows.length === 0 && (
        <div className="mt-8 grid place-items-center rounded-2xl border border-dashed border-border p-12 text-center text-sm text-muted-foreground">
          {t("dash.empty.favorites")}
        </div>
      )}

      {comps.length > 0 && (
        <section className="mt-6">
          <h2 className="mb-3 text-lg font-bold">{t("nav.competitions")}</h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {comps.map((c) => (
              <CompetitionCard key={c.id} c={c} favorite onToggleFavorite={() => toggle(c.id, "competition")} />
            ))}
          </div>
        </section>
      )}

      {listings.length > 0 && (
        <section className="mt-8">
          <h2 className="mb-3 text-lg font-bold">{t("nav.stays")} · {t("nav.experiences")} · {t("nav.products")}</h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {listings.map(({ row, listing }) => (
              <ListingCard
                key={row.id}
                l={listing}
                favorite
                onToggleFavorite={() => toggle(row.id, listing.kind)}
              />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}