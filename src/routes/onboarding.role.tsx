import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Bed, Trophy } from "lucide-react";
import { backend } from "@/integrations/api/client";
import { useProfile } from "@/hooks/useProfile";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/Logo";
import { useI18n } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export const Route = createFileRoute("/onboarding/role")({
  head: () => ({
    meta: [
      { title: "Choose your role — ANA Refi" },
      { name: "description", content: "Pick Traveler or Host to continue with ANA Refi." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: RolePickerPage,
});

function RolePickerPage() {
  const { locale } = useI18n();
  const { profile, loading, refresh, user } = useProfile();
  const navigate = useNavigate();
  const [choice, setChoice] = useState<"traveler" | "host" | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (loading) return;
    if (!user) {
      navigate({ to: "/auth", replace: true });
      return;
    }
    if (profile?.role_selected) {
      navigate({ to: profile.account_type === "host" ? "/host" : "/dashboard", replace: true });
    }
  }, [loading, user, profile, navigate]);

  async function save() {
    if (!choice || !user) return;
    setSaving(true);
    try {
      const { error } = await backend
        .resource("profiles")
        .update({ account_type: choice, role_selected: true })
        .eq("id", user.id);
      if (error) throw error;
      if (choice === "host") {
        await backend
          .resource("user_roles")
          .upsert(
            { user_id: user.id, role: "host" },
            { onConflict: "user_id,role", ignoreDuplicates: true },
          );
      }
      await refresh();
      await backend.auth.currentSession();
      toast.success(locale === "ar" ? "تم حفظ اختيارك" : "Role saved");
      navigate({ to: choice === "host" ? "/host" : "/dashboard", replace: true });
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setSaving(false);
    }
  }

  const OPTS = [
    {
      key: "traveler" as const,
      title: locale === "ar" ? "مسافر" : "Traveler",
      desc:
        locale === "ar"
          ? "احجز الإقامات والتجارب واشترِ المنتجات الريفية."
          : "Book stays, join experiences, and buy village products.",
      Icon: Bed,
    },
    {
      key: "host" as const,
      title: locale === "ar" ? "مضيف" : "Host",
      desc:
        locale === "ar"
          ? "أضف إقامات ومنتجات ومسابقات، وإدارة الحجوزات."
          : "List stays, products & competitions, and manage bookings.",
      Icon: Trophy,
    },
  ];

  return (
    <div className="mx-auto flex min-h-[calc(100vh-8rem)] max-w-2xl flex-col items-center justify-center px-4 py-10">
      <div className="mb-6">
        <Logo size="lg" />
      </div>
      <div className="w-full rounded-3xl border border-border bg-card p-6 shadow-elevated sm:p-8">
        <h1 className="text-center text-2xl font-black text-foreground">
          {locale === "ar" ? "اختر نوع حسابك" : "Choose your account type"}
        </h1>
        <p className="mt-1 text-center text-sm text-muted-foreground">
          {locale === "ar"
            ? "هذا الاختيار نهائي — يمكن للمسؤول فقط تغييره لاحقًا."
            : "This choice is permanent — only an Admin can change it later."}
        </p>

        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          {OPTS.map(({ key, title, desc, Icon }) => (
            <button
              key={key}
              type="button"
              onClick={() => setChoice(key)}
              className={cn(
                "flex flex-col items-start gap-2 rounded-2xl border-2 p-5 text-start transition-colors",
                choice === key
                  ? "border-primary bg-primary/10"
                  : "border-border hover:border-primary/40",
              )}
            >
              <Icon className="h-8 w-8 text-primary" />
              <div className="font-black text-foreground">{title}</div>
              <div className="text-xs text-muted-foreground">{desc}</div>
            </button>
          ))}
        </div>

        <Button
          onClick={save}
          disabled={!choice || saving}
          size="lg"
          className="mt-6 w-full rounded-xl"
        >
          {saving
            ? locale === "ar"
              ? "جارٍ الحفظ…"
              : "Saving…"
            : locale === "ar"
              ? "متابعة"
              : "Continue"}
        </Button>
      </div>
    </div>
  );
}
