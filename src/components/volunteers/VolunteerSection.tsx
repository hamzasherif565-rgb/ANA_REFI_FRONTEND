import { useMemo, useState } from "react";
import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { HandHeart, MapPin, Star, Search, Pencil } from "lucide-react";
import { backend } from "@/integrations/api/client";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { useI18n } from "@/lib/i18n";
import { qk } from "@/lib/queryKeys";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { UserAvatar } from "@/components/UserAvatar";
import { VolunteerApplyDialog, type VolunteerRow } from "./VolunteerApplyDialog";
import { RequestVolunteerDialog } from "./RequestVolunteerDialog";

/** Volunteer hub rendered inside the Community page. */
export function VolunteerSection() {
  const { user } = useCurrentUser();
  const { locale } = useI18n();
  const ar = locale === "ar";
  const [apply, setApply] = useState(false);
  const [editMine, setEditMine] = useState(false);
  const [request, setRequest] = useState<VolunteerRow | null>(null);
  const [q, setQ] = useState("");

  const { data: volunteers = [], isLoading } = useQuery({
    queryKey: qk.volunteers.approved,
    queryFn: async () => {
      const { data, error } = await backend
        .resource("volunteer_requests")
        .select("*")
        .eq("status", "approved")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  const { data: mine = null } = useQuery({
    queryKey: user ? qk.volunteers.byUser(user.id) : ["volunteer_requests", "anon"],
    queryFn: async () => {
      const { data } = await backend
        .resource("volunteer_requests")
        .select("*")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      return data ?? null;
    },
    enabled: !!user,
  });

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    if (!term) return volunteers;
    return volunteers.filter((v) =>
      [v.full_name, v.location, v.bio, ...(v.skills ?? []), ...(v.languages ?? [])]
        .filter(Boolean)
        .some((f) => String(f).toLowerCase().includes(term)),
    );
  }, [volunteers, q]);

  const statusLabel = (s: string) =>
    ar ? (s === "approved" ? "مقبول" : s === "rejected" ? "مرفوض" : "قيد المراجعة") : s;

  return (
    <section id="volunteers" className="mt-14">
      <div className="overflow-hidden rounded-3xl border border-border bg-gradient-hero p-6 text-primary-foreground shadow-elevated sm:p-10">
        <div className="max-w-2xl">
          <div className="mb-4 grid h-12 w-12 place-items-center rounded-2xl bg-white/20 backdrop-blur">
            <HandHeart className="h-6 w-6" />
          </div>
          <h2 className="text-2xl font-black sm:text-3xl">
            {ar ? "متطوعو ANA Refi" : "ANA Refi volunteers"}
          </h2>
          <p className="mt-2 text-primary-foreground/90">
            {ar
              ? "انضم لمجتمع المتطوعين أو اطلب مساعدة متطوع في رحلتك القادمة."
              : "Join the volunteer community, or request a volunteer to support your next trip."}
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            {!user ? (
              <Link to="/auth">
                <Button size="lg" className="rounded-xl bg-white text-primary hover:bg-white/90">
                  {ar ? "سجّل الدخول للتطوع" : "Sign in to volunteer"}
                </Button>
              </Link>
            ) : mine ? (
              <>
                <span className="inline-flex items-center rounded-xl bg-white/20 px-4 py-2 text-sm font-bold backdrop-blur">
                  {ar ? "حالة طلبك" : "Your application"}: {statusLabel(mine.status)}
                </span>
                {mine.status !== "approved" && (
                  <Button
                    size="lg"
                    variant="outline"
                    className="rounded-xl border-white/60 bg-transparent text-white hover:bg-white/10"
                    onClick={() => setEditMine(true)}
                  >
                    <Pencil className="me-2 h-4 w-4" />
                    {ar ? "تعديل الطلب" : "Edit application"}
                  </Button>
                )}
              </>
            ) : (
              <Button
                size="lg"
                className="rounded-xl bg-white text-primary hover:bg-white/90"
                onClick={() => setApply(true)}
              >
                <HandHeart className="me-2 h-5 w-5" />
                {ar ? "كن متطوعًا" : "Become a Volunteer"}
              </Button>
            )}
          </div>
        </div>
      </div>

      <div className="mt-8 flex flex-wrap items-center justify-between gap-3">
        <h3 className="text-xl font-black text-foreground">
          {ar ? "متطوعون معتمدون" : "Approved volunteers"}
        </h3>
        <div className="relative w-full sm:w-72">
          <Search className="pointer-events-none absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder={ar ? "ابحث بالاسم أو المهارة" : "Search name or skill"}
            className="ps-9"
          />
        </div>
      </div>

      {isLoading ? (
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-56 animate-pulse rounded-2xl border border-border bg-card" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <p className="mt-4 rounded-2xl border border-dashed border-border bg-card/50 p-10 text-center text-sm text-muted-foreground">
          {ar ? "لا يوجد متطوعون معتمدون بعد" : "No approved volunteers yet"}
        </p>
      ) : (
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((v) => (
            <article
              key={v.id}
              className="flex flex-col rounded-2xl border border-border bg-card p-5 shadow-card transition-shadow hover:shadow-elevated"
            >
              <div className="flex items-center gap-3">
                <UserAvatar name={v.full_name} src={v.avatar_url} size="lg" />
                <div className="min-w-0">
                  <p className="truncate font-black text-foreground">{v.full_name}</p>
                  {v.location && (
                    <p className="flex items-center gap-1 text-xs text-muted-foreground">
                      <MapPin className="h-3 w-3" />
                      {v.location}
                    </p>
                  )}
                  {v.rating != null && (
                    <p className="mt-0.5 flex items-center gap-1 text-xs font-bold text-warning">
                      <Star className="h-3 w-3 fill-current" />
                      {Number(v.rating).toFixed(1)}
                    </p>
                  )}
                </div>
              </div>
              {v.bio && <p className="mt-3 line-clamp-3 text-sm text-muted-foreground">{v.bio}</p>}
              {(v.skills ?? []).length > 0 && (
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {v.skills.slice(0, 5).map((s) => (
                    <span
                      key={s}
                      className="rounded-full bg-primary/10 px-2.5 py-1 text-[11px] font-semibold text-primary"
                    >
                      {s}
                    </span>
                  ))}
                </div>
              )}
              {(v.languages ?? []).length > 0 && (
                <p className="mt-2 text-xs text-muted-foreground">
                  {ar ? "اللغات" : "Languages"}: {v.languages.join(" · ")}
                </p>
              )}
              <div className="mt-auto pt-4">
                {user ? (
                  <Button
                    className="w-full rounded-xl"
                    disabled={v.user_id === user.id}
                    onClick={() => setRequest(v)}
                  >
                    <HandHeart className="me-2 h-4 w-4" />
                    {v.user_id === user.id
                      ? ar
                        ? "هذا أنت"
                        : "This is you"
                      : ar
                        ? "اطلب المتطوع"
                        : "Request Volunteer"}
                  </Button>
                ) : (
                  <Link to="/auth">
                    <Button variant="outline" className="w-full rounded-xl">
                      {ar ? "سجّل الدخول للطلب" : "Sign in to request"}
                    </Button>
                  </Link>
                )}
              </div>
            </article>
          ))}
        </div>
      )}

      {user && apply && (
        <VolunteerApplyDialog
          userId={user.id}
          userEmail={user.email ?? ""}
          onClose={() => setApply(false)}
        />
      )}
      {user && editMine && mine && (
        <VolunteerApplyDialog
          userId={user.id}
          userEmail={user.email ?? ""}
          existing={mine}
          onClose={() => setEditMine(false)}
        />
      )}
      {user && request && (
        <RequestVolunteerDialog
          volunteer={request}
          requesterId={user.id}
          onClose={() => setRequest(null)}
        />
      )}
    </section>
  );
}
