import { cn } from "@/lib/utils";

const SIZES = {
  sm: "h-8 w-8 text-xs",
  md: "h-10 w-10 text-sm",
  lg: "h-14 w-14 text-lg",
  xl: "h-20 w-20 text-2xl",
} as const;

/** Avatar that falls back to the first letter of the name, ANA Refi styled. */
export function UserAvatar({
  name,
  src,
  size = "md",
  className,
}: {
  name?: string | null;
  src?: string | null;
  size?: keyof typeof SIZES;
  className?: string;
}) {
  const letter = (name ?? "?").trim().charAt(0).toUpperCase() || "?";
  if (src) {
    return (
      <img
        src={src}
        alt={name ?? ""}
        loading="lazy"
        className={cn("shrink-0 rounded-full border border-border object-cover", SIZES[size], className)}
      />
    );
  }
  return (
    <div
      aria-hidden
      className={cn(
        "grid shrink-0 place-items-center rounded-full bg-gradient-primary font-black text-primary-foreground shadow-soft",
        SIZES[size],
        className,
      )}
    >
      {letter}
    </div>
  );
}