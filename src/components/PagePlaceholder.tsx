import { type LucideIcon } from "lucide-react";

export function PagePlaceholder({
  Icon,
  title,
  description,
}: {
  Icon: LucideIcon;
  title: string;
  description: string;
}) {
  return (
    <div className="mx-auto grid min-h-[70vh] max-w-2xl place-items-center px-6 text-center">
      <div>
        <div className="mx-auto mb-6 grid h-20 w-20 place-items-center rounded-3xl bg-gradient-primary text-primary-foreground shadow-elevated">
          <Icon className="h-10 w-10" />
        </div>
        <h1 className="text-3xl font-black text-foreground">{title}</h1>
        <p className="mt-3 text-muted-foreground">{description}</p>
      </div>
    </div>
  );
}
