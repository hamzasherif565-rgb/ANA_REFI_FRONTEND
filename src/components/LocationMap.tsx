import { MapPin } from "lucide-react";
import { useI18n } from "@/lib/i18n";

/** Responsive embedded map with a marker for the given place name / address. */
export function LocationMap({ location, title }: { location: string; title?: string }) {
  const { locale } = useI18n();
  if (!location?.trim()) return null;
  const q = encodeURIComponent(`${title ? `${title}, ` : ""}${location}, Egypt`);
  const src = `https://maps.google.com/maps?q=${q}&hl=${locale}&z=13&output=embed`;
  return (
    <section className="mt-8">
      <h2 className="mb-3 flex items-center gap-2 text-xl font-black">
        <MapPin className="h-5 w-5 text-primary" />
        {locale === "ar" ? "الموقع على الخريطة" : "Location"}
      </h2>
      <div className="overflow-hidden rounded-3xl border border-border shadow-card">
        <iframe
          title={locale === "ar" ? "خريطة الموقع" : "Location map"}
          src={src}
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
          className="h-64 w-full border-0 sm:h-80"
        />
      </div>
      <p className="mt-2 flex items-center gap-1 text-sm text-muted-foreground">
        <MapPin className="h-4 w-4 text-primary" /> {location}
      </p>
    </section>
  );
}
