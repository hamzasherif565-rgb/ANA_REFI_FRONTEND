import { createFileRoute } from "@tanstack/react-router";
import { ListingGallery } from "@/components/ListingGallery";
import { useI18n } from "@/lib/i18n";

export const Route = createFileRoute("/stays")({
  head: () => ({
    meta: [
      { title: "Stays — ANA Refi" },
      { name: "description", content: "Authentic countryside stays across rural Egypt — mud-brick homes, Nile farms, and desert cabins." },
      { property: "og:title", content: "Stays — ANA Refi" },
      { property: "og:description", content: "Authentic countryside stays across rural Egypt." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: StaysPage,
});

function StaysPage() {
  const { t } = useI18n();
  return <ListingGallery itemType="stay" title={t("stays.title")} subtitle={t("stays.subtitle")} />;
}