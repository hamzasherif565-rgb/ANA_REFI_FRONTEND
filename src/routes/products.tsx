import { createFileRoute } from "@tanstack/react-router";
import { ListingGallery } from "@/components/ListingGallery";
import { useI18n } from "@/lib/i18n";

export const Route = createFileRoute("/products")({
  head: () => ({
    meta: [
      { title: "Products — ANA Refi" },
      {
        name: "description",
        content:
          "Handmade rural products from Egyptian villages: honey, pottery, textiles, olive oil.",
      },
      { property: "og:title", content: "Products — ANA Refi" },
      { property: "og:description", content: "Handmade rural products from Egyptian villages." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ProductsPage,
});

function ProductsPage() {
  const { t } = useI18n();
  return (
    <ListingGallery
      itemType="product"
      title={t("products.title")}
      subtitle={t("products.subtitle")}
      actionLabel={t("listing.buy")}
    />
  );
}
