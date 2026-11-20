import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { User as UserIcon, CalendarCheck, Heart, Bell, LogOut, Plus, ChefHat, HandHeart } from "lucide-react";
import { backend } from "@/integrations/api/client";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { useProfile } from "@/hooks/useProfile";
import { useI18n } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { Tables } from "@/integrations/api/types";
import { toast } from "sonner";
import { qk } from "@/lib/queryKeys";
import { VolunteerRequestsPanel } from "@/components/volunteers/VolunteerRequestsPanel";

export const Route = createFileRoute("/dashboard")({
  head: () => ({
    meta: [
      { title: "Dashboard — ANA Refi" },
      { name: "description", content: "Your ANA Refi dashboard: bookings, favorites, notifications, and host tools." },
      { property: "og:title", content: "Dashboard — ANA Refi" },
      { property: "og:description", content: "Manage your ANA Refi bookings, favorites and host tools." },
    ],
  }),
  component: DashboardPage,
});

type Tab = "bookings" | "notifications" | "favorites" | "host" | "volunteering";

function DashboardPage() {
  const { t, locale } = useI18n();
  const { user, loading } = useCurrentUser();
  const { profile, loading: profileLoading } = useProfile();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [tab, setTab] = useState<Tab>("bookings");

  // Role lock: hosts belong on /host, admins on /admin.
  useEffect(() => {
    if (profileLoading || !profile) return;
    if (profile.account_type === "host") navigate({ to: "/host", replace: true });
    else if (profile.account_type === "admin") navigate({ to: "/admin", replace: true });
  }, [profile, profileLoading, navigate]);

  const { data: bookings = [] } = useQuery({
    queryKey: user ? qk.bookings.byUser(user.id) : ["bookings", "anon"],
    queryFn: async () => {
      const { data, error } = await backend
        .resource("bookings").select("*").eq("user_id", user!.id).order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!user,
  });

  const { data: notifications = [] } = useQuery({
    queryKey: user ? qk.notifications.byUser(user.id) : ["notifications", "anon"],
    queryFn: async () => {
      const { data, error } = await backend
        .resource("notifications").select("*").eq("user_id", user!.id).order("created_at", { ascending: false }).limit(20);
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!user,
  });

  const { data: favorites = [] } = useQuery({
    queryKey: user ? qk.favorites.byUser(user.id) : ["favorites", "anon"],
    queryFn: async () => {
      const { data, error } = await backend.resource("favorites").select("*").eq("user_id", user!.id);
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!user,
  });

  const { data: displayName = "" } = useQuery({
    queryKey: user ? qk.profiles.byId(user.id) : ["profiles", "anon"],
    queryFn: async () => {
      const { data } = await backend.resource("profiles").select("display_name").eq("id", user!.id).maybeSingle();
      return data?.display_name ?? "";
    },
    enabled: !!user,
  });

  const bookingIds = Array.from(new Set(bookings.map((b) => b.item_id)));
  const { data: titleMap = {} } = useQuery({
    queryKey: ["booking-titles", bookingIds.sort().join(",")],
    queryFn: async () => {
      if (!bookingIds.length) return {};
      const [{ data: listings }, { data: comps }] = await Promise.all([
        backend.resource("listings").select("id, title, title_en").in("id", bookingIds),
        backend.resource("competitions").select("id, title, title_en").in("id", bookingIds),
      ]);
      const map: Record<string, { ar: string; en: string }> = {};
      (listings ?? []).forEach((l) => { map[l.id] = { ar: l.title, en: l.title_en ?? l.title }; });
      (comps ?? []).forEach((c) => { map[c.id] = { ar: c.title, en: c.title_en ?? c.title }; });
      return map;
    },
    enabled: bookingIds.length > 0,
  });

  async function handleSignOut() {
    await backend.auth.logout();
    qc.clear();
    toast.success(locale === "ar" ? "تم تسجيل الخروج" : "Signed out");
    navigate({ to: "/" });
  }

  if (loading) return <div className="grid min-h-[60vh] place-items-center text-muted-foreground">{t("common.loading")}</div>;
  if (!user) {
    return (
      <div className="mx-auto grid min-h-[60vh] max-w-md place-items-center px-4 text-center">
        <div>
          <UserIcon className="mx-auto mb-3 h-10 w-10 text-muted-foreground" />
          <p className="text-muted-foreground">{t("book.needSignIn")}</p>
          <Link to="/auth"><Button className="mt-4 rounded-xl">{t("nav.signin")}</Button></Link>
        </div>
      </div>
    );
  }

  const tabs: { key: Tab; label: string; Icon: typeof CalendarCheck }[] = [
    { key: "bookings", label: t("dash.bookings"), Icon: CalendarCheck },
    { key: "favorites", label: t("dash.favorites"), Icon: Heart },
    { key: "notifications", label: t("dash.notifications"), Icon: Bell },
    { key: "volunteering", label: locale === "ar" ? "التطوع" : "Volunteering", Icon: HandHeart },
  ];

  const listingTitle = (row: Tables<"bookings">) => {
    const t = titleMap[row.item_id];
    if (!t) return row.item_id.slice(0, 8) + "…";
    return locale === "ar" ? t.ar : t.en;
  };

  return (
    <div className="mx-auto max-w-7xl px-4 pt-6 pb-24 sm:px-6 md:pb-10">
      <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4 sm:flex sm:flex-wrap sm:justify-between">
        <div className="flex min-w-0 items-center gap-3">
          <div className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-gradient-primary text-2xl font-black text-primary-foreground shadow-soft">
            {(displayName || user.email || "?")[0].toUpperCase()}
          </div>
          <div className="min-w-0">
            <h1 className="truncate text-xl font-black text-foreground sm:text-2xl">
              {displayName || (locale === "ar" ? "أهلًا بك" : "Welcome")}
            </h1>
            <p className="truncate text-xs text-muted-foreground sm:text-sm">{user.email}</p>
          </div>
        </div>
        <Button variant="outline" onClick={handleSignOut} className="shrink-0 rounded-xl">
          <LogOut className="me-1 h-4 w-4" />
          {t("dash.signOut")}
        </Button>
      </div>

      <div className="mt-6 grid grid-cols-4 gap-2 rounded-2xl border border-border bg-card p-1.5 shadow-card sm:inline-flex">
        {tabs.map(({ key, label, Icon }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={cn(
              "flex items-center justify-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold transition-colors sm:text-sm sm:px-4",
              tab === key ? "bg-primary text-primary-foreground shadow-soft" : "text-muted-foreground hover:bg-accent",
            )}
          >
            <Icon className="h-4 w-4" />
            <span className="hidden sm:inline">{label}</span>
          </button>
        ))}
      </div>

      <div className="mt-6">
        {tab === "bookings" && (
          bookings.length === 0 ? (
            <EmptyState text={t("dash.empty.bookings")} />
          ) : (
            <ul className="space-y-3">
              {bookings.map((b) => (
                <li key={b.id} className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border bg-card p-4 shadow-card">
                  <div>
                    <p className="text-xs uppercase tracking-wide text-muted-foreground">{b.item_type}</p>
                    <p className="font-bold text-foreground">{listingTitle(b)}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(b.created_at).toLocaleString(locale === "ar" ? "ar-EG" : "en-GB")}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-lg font-black text-primary">
                      {b.amount.toLocaleString(locale === "ar" ? "ar-EG" : "en-US")} {t("comp.egp")}
                    </span>
                    <span className={cn(
                      "rounded-full px-3 py-1 text-xs font-bold",
                      b.status === "confirmed" ? "bg-success/15 text-success" :
                      b.status === "cancelled" ? "bg-destructive/15 text-destructive" :
                      b.status === "completed" ? "bg-muted text-muted-foreground" :
                      "bg-warning/15 text-warning",
                    )}>
                      {t(`status.${b.status}`)}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          )
        )}

        {tab === "favorites" && (
          favorites.length === 0 ? <EmptyState text={t("dash.empty.favorites")} /> : (
            <div className="rounded-2xl border border-border bg-card p-6 text-center shadow-card">
              <p className="text-sm text-muted-foreground">
                {locale === "ar" ? `لديك ${favorites.length} مفضلة.` : `You have ${favorites.length} favorites.`}
              </p>
              <Link to="/favorites"><Button className="mt-4 rounded-xl">{t("dash.favorites")}</Button></Link>
            </div>
          )
        )}

        {tab === "notifications" && (
          notifications.length === 0 ? <EmptyState text={t("dash.empty.notifications")} /> : (
            <ul className="space-y-3">
              {notifications.map((n) => (
                <li key={n.id} className={cn("rounded-2xl border p-4", n.read ? "border-border bg-card" : "border-primary/40 bg-primary/5")}>
                  <p className="font-bold text-foreground">{n.title}</p>
                  {n.body && <p className="mt-1 text-sm text-muted-foreground">{n.body}</p>}
                  <p className="mt-1 text-xs text-muted-foreground">
                    {new Date(n.created_at).toLocaleString(locale === "ar" ? "ar-EG" : "en-GB")}
                  </p>
                </li>
              ))}
            </ul>
          )
        )}

        {tab === "volunteering" && (
          <div className="space-y-8">
            <section>
              <h2 className="mb-3 text-lg font-black text-foreground">
                {locale === "ar" ? "طلبات المتطوعين التي أرسلتها" : "Volunteer requests you sent"}
              </h2>
              <VolunteerRequestsPanel userId={user.id} mode="sent" />
            </section>
            <section>
              <h2 className="mb-3 text-lg font-black text-foreground">
                {locale === "ar" ? "طلبات واردة إليك كمتطوع" : "Requests received as a volunteer"}
              </h2>
              <VolunteerRequestsPanel userId={user.id} mode="received" />
            </section>
            <Link to="/community" hash="volunteers">
              <Button variant="outline" className="rounded-xl">
                {locale === "ar" ? "تصفح المتطوعين" : "Browse volunteers"}
              </Button>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}

function EmptyState({ text }: { text: string }) {
  return (
    <div className="grid place-items-center rounded-2xl border border-dashed border-border bg-card/50 p-12 text-center text-sm text-muted-foreground">
      {text}
    </div>
  );
}

