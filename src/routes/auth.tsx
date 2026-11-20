import { useState, type FormEvent } from "react";
import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { Plane, Home as HomeIcon, ArrowRight } from "lucide-react";
import { Logo } from "@/components/Logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { backend } from "@/integrations/api/client";
import { redirectToGoogle } from "@/integrations/api/oauth";
import { useI18n } from "@/lib/i18n";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Sign in — ANA Refi" },
      { name: "description", content: "Sign in or create your ANA Refi account to book stays, join competitions, and manage favorites." },
      { property: "og:title", content: "Sign in — ANA Refi" },
      { property: "og:description", content: "Sign in or create your ANA Refi account." },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const { t, locale } = useI18n();
  const navigate = useNavigate();
  const [tab, setTab] = useState<"in" | "up">("in");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleEmail(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const { error } = await backend.auth.login({ email, password });
      if (error) throw error;
      toast.success(t("auth.signedIn"));
      navigate({ to: "/dashboard" });
    } catch (err) {
      toast.error((err as Error).message || t("auth.error"));
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogle() {
    setLoading(true);
    try {
      redirectToGoogle(`${window.location.origin}/auth`);
    } catch (err) {
      toast.error((err as Error).message || t("auth.error"));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto flex min-h-[calc(100vh-8rem)] max-w-md flex-col items-center justify-center px-4 py-10">
      <div className="mb-6"><Logo size="lg" /></div>
      <div className="w-full rounded-3xl border border-border bg-card p-6 shadow-elevated">
        <h1 className="text-center text-2xl font-black text-foreground">{t("auth.welcome")}</h1>
        <p className="mt-1 text-center text-sm text-muted-foreground">{t("app.tagline")}</p>

        <div className="mt-6 grid grid-cols-2 rounded-xl bg-muted p-1">
          {(["in", "up"] as const).map((k) => (
            <button
              key={k}
              type="button"
              onClick={() => setTab(k)}
              className={cn(
                "rounded-lg py-2 text-sm font-semibold transition-colors",
                tab === k ? "bg-card text-primary shadow-soft" : "text-muted-foreground",
              )}
            >
              {k === "in" ? t("auth.signInTab") : t("auth.signUpTab")}
            </button>
          ))}
        </div>

        {tab === "up" ? (
          <div className="mt-5 space-y-3">
            <p className="text-center text-sm text-muted-foreground">
              {locale === "ar" ? "اختر نوع الحساب الذي تريد إنشاءه" : "Choose the type of account you want to create"}
            </p>
            <Link to="/signup/traveler" className="block">
              <button
                type="button"
                className="flex w-full items-center gap-4 rounded-2xl border-2 border-border p-4 text-start transition-colors hover:border-primary hover:bg-primary/5"
              >
                <span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
                  <Plane className="h-6 w-6" />
                </span>
                <span className="flex-1">
                  <span className="block font-black text-foreground">{locale === "ar" ? "مسافر" : "Traveler"}</span>
                  <span className="block text-xs text-muted-foreground">
                    {locale === "ar" ? "احجز إقامات وتجارب واشترِ منتجات" : "Book stays & experiences, buy products"}
                  </span>
                </span>
                <ArrowRight className="h-5 w-5 text-primary rtl:rotate-180" />
              </button>
            </Link>
            <Link to="/signup/host" className="block">
              <button
                type="button"
                className="flex w-full items-center gap-4 rounded-2xl border-2 border-border p-4 text-start transition-colors hover:border-primary hover:bg-primary/5"
              >
                <span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
                  <HomeIcon className="h-6 w-6" />
                </span>
                <span className="flex-1">
                  <span className="block font-black text-foreground">{locale === "ar" ? "مضيف" : "Host"}</span>
                  <span className="block text-xs text-muted-foreground">
                    {locale === "ar" ? "أضف إقامات ومنتجات ومسابقات وأدر حجوزاتك" : "List stays, products & competitions"}
                  </span>
                </span>
                <ArrowRight className="h-5 w-5 text-primary rtl:rotate-180" />
              </button>
            </Link>
          </div>
        ) : (
        <form onSubmit={handleEmail} className="mt-5 space-y-3">
          <div>
            <Label htmlFor="email">{t("auth.email")}</Label>
            <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required className="mt-1" />
          </div>
          <div>
            <Label htmlFor="password">{t("auth.password")}</Label>
            <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={8} className="mt-1" />
          </div>
          <Button type="submit" disabled={loading} className="w-full rounded-xl" size="lg">
            {t("auth.signIn")}
          </Button>
        </form>
        )}

        <div className="my-5 flex items-center gap-3 text-xs uppercase tracking-wide text-muted-foreground">
          <div className="h-px flex-1 bg-border" />
          <span>{t("auth.or")}</span>
          <div className="h-px flex-1 bg-border" />
        </div>

        <Button variant="outline" onClick={handleGoogle} disabled={loading} className="w-full rounded-xl" size="lg">
          <svg className="me-2 h-4 w-4" viewBox="0 0 24 24" aria-hidden>
            <path fill="#EA4335" d="M12 10.2v3.9h5.5c-.2 1.5-1.6 4.3-5.5 4.3-3.3 0-6-2.7-6-6.1s2.7-6.1 6-6.1c1.9 0 3.1.8 3.8 1.5l2.6-2.5C16.9 3.6 14.7 2.6 12 2.6 6.8 2.6 2.6 6.8 2.6 12s4.2 9.4 9.4 9.4c5.4 0 9-3.8 9-9.2 0-.6 0-1.1-.1-1.6H12z"/>
          </svg>
          {t("auth.google")}
        </Button>

        <p className="mt-4 text-center text-xs text-muted-foreground">
          {locale === "ar" ? "بمتابعتك أنت توافق على شروط الاستخدام." : "By continuing you agree to our terms of use."}
        </p>
      </div>
    </div>
  );
}
