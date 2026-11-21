import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Bell, Check } from "lucide-react";
import { backend } from "@/integrations/api/client";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { useI18n } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { qk } from "@/lib/queryKeys";

export const Route = createFileRoute("/notifications")({
  head: () => ({
    meta: [
      { title: "Notifications — ANA Refi" },
      {
        name: "description",
        content: "Booking updates, competition news, and messages on ANA Refi.",
      },
      { property: "og:title", content: "Notifications — ANA Refi" },
      { property: "og:description", content: "Booking updates, competition news, and messages." },
    ],
  }),
  component: NotificationsPage,
});

function NotificationsPage() {
  const { t, locale } = useI18n();
  const { user } = useCurrentUser();
  const qc = useQueryClient();

  const { data: rows = [] } = useQuery({
    queryKey: user ? qk.notifications.byUser(user.id) : ["notifications", "anon"],
    queryFn: async () => {
      const { data, error } = await backend
        .resource("notifications")
        .select("*")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!user,
  });

  const markAllMutation = useMutation({
    mutationFn: async () => {
      if (!user) return;
      const { error } = await backend
        .resource("notifications")
        .update({ read: true })
        .eq("user_id", user.id)
        .eq("read", false);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.notifications.all }),
  });
  const markAll = () => markAllMutation.mutate();

  if (!user) {
    return (
      <div className="mx-auto grid min-h-[60vh] max-w-md place-items-center px-4 text-center">
        <div>
          <Bell className="mx-auto mb-3 h-10 w-10 text-muted-foreground" />
          <p className="text-muted-foreground">{t("book.needSignIn")}</p>
          <Link to="/auth">
            <Button className="mt-4 rounded-xl">{t("nav.signin")}</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-4 pt-8 pb-24 sm:px-6 md:pb-10">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-black text-foreground sm:text-3xl">
          {t("dash.notifications")}
        </h1>
        {rows.some((r) => !r.read) && (
          <Button variant="outline" size="sm" onClick={markAll} className="rounded-xl">
            <Check className="me-1 h-4 w-4" />
            {t("notif.markAllRead")}
          </Button>
        )}
      </div>

      {rows.length === 0 ? (
        <div className="grid place-items-center rounded-2xl border border-dashed border-border p-12 text-center text-sm text-muted-foreground">
          {t("dash.empty.notifications")}
        </div>
      ) : (
        <ul className="space-y-3">
          {rows.map((n) => (
            <li
              key={n.id}
              className={cn(
                "rounded-2xl border border-border p-4 shadow-card",
                n.read ? "bg-card" : "bg-primary/5 border-primary/30",
              )}
            >
              <div className="flex items-start gap-3">
                <div
                  className={cn(
                    "mt-1 grid h-9 w-9 shrink-0 place-items-center rounded-xl",
                    n.read
                      ? "bg-muted text-muted-foreground"
                      : "bg-primary text-primary-foreground",
                  )}
                >
                  <Bell className="h-4 w-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-foreground">{n.title}</p>
                  {n.body && <p className="mt-1 text-sm text-muted-foreground">{n.body}</p>}
                  <p className="mt-1 text-xs text-muted-foreground">
                    {new Date(n.created_at).toLocaleString(locale === "ar" ? "ar-EG" : "en-GB")}
                  </p>
                </div>
                {!n.read && (
                  <span className="rounded-full bg-primary px-2 py-0.5 text-[10px] font-bold text-primary-foreground">
                    {t("notif.unread")}
                  </span>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
