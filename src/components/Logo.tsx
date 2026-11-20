import { Sprout } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { cn } from "@/lib/utils";

interface LogoProps {
  className?: string;
  showText?: boolean;
  size?: "sm" | "md" | "lg";
}

const sizes = {
  sm: { mark: "h-8 w-8", title: "text-sm", tag: "text-[10px]" },
  md: { mark: "h-10 w-10", title: "text-base", tag: "text-[11px]" },
  lg: { mark: "h-14 w-14", title: "text-xl", tag: "text-xs" },
};

export function Logo({ className, showText = true, size = "md" }: LogoProps) {
  const { t } = useI18n();
  const s = sizes[size];
  return (
    <div className={cn("flex items-center gap-2", className)}>
      <span
        aria-hidden="true"
        className={cn("grid shrink-0 place-items-center rounded-xl bg-primary/10 text-primary", s.mark)}
      >
        <Sprout className="h-3/5 w-3/5" strokeWidth={2.25} />
      </span>
      {showText && (
        <div className="flex min-w-0 flex-col leading-tight">
          <span className={cn("font-bold tracking-tight", s.title)}>
            <span className="text-foreground">ANA </span>
            <span className="text-primary">Refi</span>
          </span>
          <span className={cn("text-muted-foreground", s.tag)}>{t("app.tagline")}</span>
        </div>
      )}
    </div>
  );
}
