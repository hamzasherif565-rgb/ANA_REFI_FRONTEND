import type { Tables } from "@/integrations/api/types";

export type Listing = {
  id: string;
  kind: "stay" | "experience" | "product";
  title: string;
  title_en: string;
  description: string;
  description_en: string;
  location: string;
  location_en: string;
  price: number;
  unit: "night" | "person" | "item";
  image: string;
  rating: number;
  tags: string[];
};

const FALLBACK_IMAGE =
  "https://www.sfari.com/wp-content/uploads/2022/05/4-59-1024x683.jpg";

export function mapListingRow(r: Tables<"listings">): Listing {
  const kind = (r.type as Listing["kind"]) ?? "stay";
  return {
    id: r.id,
    kind,
    title: r.title,
    title_en: r.title_en ?? r.title,
    description: r.description ?? "",
    description_en: r.description_en ?? r.description ?? "",
    location: r.location ?? "",
    location_en: r.location ?? "",
    price: Number(r.price),
    unit: kind === "stay" ? "night" : kind === "experience" ? "person" : "item",
    image: r.images?.[0] ?? FALLBACK_IMAGE,
    rating: 4.8,
    tags: [],
  };
}