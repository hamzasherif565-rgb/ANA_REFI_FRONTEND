import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/lib/i18n";

export function Pagination({
  page,
  pageCount,
  onChange,
}: {
  page: number;
  pageCount: number;
  onChange: (p: number) => void;
}) {
  const { locale } = useI18n();
  if (pageCount <= 1) return null;
  return (
    <div className="mt-8 flex items-center justify-center gap-3">
      <Button variant="outline" size="sm" onClick={() => onChange(Math.max(1, page - 1))} disabled={page <= 1} className="rounded-xl">
        <ChevronLeft className="h-4 w-4 rtl:hidden" />
        <ChevronRight className="hidden h-4 w-4 rtl:inline" />
        {locale === "ar" ? "السابق" : "Prev"}
      </Button>
      <span className="text-sm font-semibold text-muted-foreground">
        {page} / {pageCount}
      </span>
      <Button variant="outline" size="sm" onClick={() => onChange(Math.min(pageCount, page + 1))} disabled={page >= pageCount} className="rounded-xl">
        {locale === "ar" ? "التالي" : "Next"}
        <ChevronRight className="h-4 w-4 rtl:hidden" />
        <ChevronLeft className="hidden h-4 w-4 rtl:inline" />
      </Button>
    </div>
  );
}