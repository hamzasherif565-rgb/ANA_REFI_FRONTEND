import { createFileRoute } from "@tanstack/react-router";
import { ListingGallery } from "@/components/ListingGallery";
import { useI18n } from "@/lib/i18n";

export const Route = createFileRoute("/experiences")({
  head: () => ({
    meta: [
      { title: "Experiences — ANA Refi" },
      {
        name: "description",
        content:
          "Hands-on rural experiences across Egypt: pottery, olive harvest, cooking, horse riding, and more.",
      },
      { property: "og:title", content: "Experiences — ANA Refi" },
      { property: "og:description", content: "Hands-on rural experiences across Egypt." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ExperiencesPage,
});

function ExperiencesPage() {
  const { t } = useI18n();
  return (
    <ListingGallery
      itemType="experience"
      title={t("experiences.title")}
      subtitle={t("experiences.subtitle")}
    />
  );
}
