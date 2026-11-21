import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState, type FormEvent } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Plus,
  Pencil,
  Trash2,
  DollarSign,
  Users,
  Package,
  CalendarDays,
  ChefHat,
  Bed,
  Sparkles,
  ShoppingBag,
  Trophy,
  Star,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { backend } from "@/integrations/api/client";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { useProfile } from "@/hooks/useProfile";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ImageUploader } from "@/components/ImageUploader";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useI18n } from "@/lib/i18n";
import type { Tables } from "@/integrations/api/types";
import { qk } from "@/lib/queryKeys";
import { SignOutButton } from "@/components/SignOutButton";

export const Route = createFileRoute("/host")({
  head: () => ({
    meta: [
      { title: "Host dashboard — ANA Refi" },
      {
        name: "description",
        content: "Manage your stays, experiences, products, competitions and bookings.",
      },
      { property: "og:title", content: "Host dashboard — ANA Refi" },
      { property: "og:description", content: "Manage your listings and bookings on ANA Refi." },
    ],
  }),
  component: HostPage,
});

type Kind = "stay" | "experience" | "product" | "competition";
type Tab = "overview" | "stay" | "experience" | "product" | "competition" | "bookings";

const KIND_ICONS = {
  stay: Bed,
  experience: Sparkles,
  product: ShoppingBag,
  competition: Trophy,
} as const;

function HostPage() {
  const { locale } = useI18n();
  const { user, loading } = useCurrentUser();
  const { profile, loading: profileLoading } = useProfile();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [tab, setTab] = useState<Tab>("overview");
  const [editing, setEditing] = useState<{ kind: Kind; row?: Tables<"listings"> } | null>(null);
  const [editingComp, setEditingComp] = useState<{ row?: Tables<"competitions"> } | null>(null);
  const [selectedBookingDate, setSelectedBookingDate] = useState(() =>
    new Date().toISOString().slice(0, 10),
  );
  const [calendarMonth, setCalendarMonth] = useState(
    () => new Date(new Date().getFullYear(), new Date().getMonth(), 1),
  );

  useEffect(() => {
    if (!user) return;
    if (profile && profile.role_selected && profile.account_type === "traveler") {
      navigate({ to: "/dashboard", replace: true });
      return;
    }
  }, [user, profile, navigate]);

  const { data: roleData } = useQuery({
    queryKey: user ? qk.userRoles.byUser(user.id) : ["user_roles", "anon"],
    queryFn: async () => {
      const { data } = await backend.resource("user_roles").select("role").eq("user_id", user!.id);
      return (data ?? []).map((r) => r.role);
    },
    enabled: !!user,
  });
  const role: "none" | "host" | "admin" = roleData?.includes("admin")
    ? "admin"
    : roleData?.includes("host")
      ? "host"
      : "none";

  const { data: listings = [] } = useQuery({
    queryKey: user ? qk.listings.byHost(user.id) : ["listings", "anon"],
    queryFn: async () => {
      const { data, error } = await backend
        .resource("listings")
        .select("*")
        .eq("host_id", user!.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!user && role !== "none",
  });

  const { data: bookings = [] } = useQuery({
    queryKey: user ? qk.bookings.byHost(user.id) : ["bookings", "anon"],
    queryFn: async () => {
      const { data, error } = await backend
        .resource("bookings")
        .select("*")
        .eq("host_id", user!.id)
        .order("created_at", { ascending: false })
        .limit(100);
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!user && role !== "none",
  });

  const { data: competitions = [] } = useQuery({
    queryKey: user ? ["competitions", "host", user.id] : ["competitions", "anon"],
    queryFn: async () => {
      const { data, error } = await backend
        .resource("competitions")
        .select("*")
        .eq("host_id", user!.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!user && role !== "none",
  });

  const { data: featureRequests = [] } = useQuery({
    queryKey: user ? qk.featureRequests.byHost(user.id) : ["feature_requests", "anon"],
    queryFn: async () => {
      const { data, error } = await backend
        .resource("feature_requests")
        .select("*")
        .eq("host_id", user!.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!user && role !== "none",
  });

  const deleteCompetition = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await backend.resource("competitions").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Deleted");
      qc.invalidateQueries({ queryKey: qk.competitions.all });
    },
    onError: (e) => toast.error((e as Error).message),
  });

  const becomeHostMutation = useMutation({
    mutationFn: async () => {
      const { error } = await backend
        .resource("user_roles")
        .insert({ user_id: user!.id, role: "host" });
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.userRoles.all }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await backend.resource("listings").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Deleted");
      qc.invalidateQueries({ queryKey: qk.listings.all });
    },
    onError: (e) => toast.error((e as Error).message),
  });

  const stats = useMemo(() => {
    const revenue = bookings
      .filter((b) => b.status !== "cancelled")
      .reduce((s, b) => s + Number(b.amount), 0);
    const guests = new Set(bookings.map((b) => b.user_id)).size;
    return { revenue, guests, listings: listings.length, bookings: bookings.length };
  }, [bookings, listings]);

  if (loading || profileLoading)
    return (
      <div className="grid min-h-[60vh] place-items-center text-muted-foreground">Loading…</div>
    );
  if (!user)
    return (
      <div className="grid min-h-[60vh] place-items-center">
        <Link to="/auth">
          <Button>Sign in</Button>
        </Link>
      </div>
    );
  if (role === "none") {
    return (
      <div className="mx-auto grid min-h-[60vh] max-w-md place-items-center px-4 text-center">
        <div>
          <ChefHat className="mx-auto mb-3 h-10 w-10 text-primary" />
          <p className="text-sm text-muted-foreground">
            {locale === "ar"
              ? "أنت لست مضيفًا بعد. فعّل من لوحة التحكم."
              : "You're not a host yet. Enable from your dashboard."}
          </p>
          <Button className="mt-4 rounded-xl" onClick={() => becomeHostMutation.mutate()}>
            {locale === "ar" ? "كن مضيفًا" : "Become a host"}
          </Button>
        </div>
      </div>
    );
  }

  const kinds: Kind[] = ["stay", "experience", "product"];
  const tabs: { key: Tab; label: string }[] = [
    { key: "overview", label: locale === "ar" ? "نظرة عامة" : "Overview" },
    { key: "stay", label: locale === "ar" ? "الإقامات" : "Stays" },
    { key: "experience", label: locale === "ar" ? "التجارب" : "Experiences" },
    { key: "product", label: locale === "ar" ? "المنتجات" : "Products" },
    { key: "competition", label: locale === "ar" ? "المسابقات" : "Competitions" },
    { key: "bookings", label: locale === "ar" ? "الحجوزات" : "Bookings" },
  ];

  const filteredByKind = (k: Kind) => listings.filter((l) => l.type === k);

  return (
    <div className="mx-auto max-w-7xl px-4 pt-6 pb-24 sm:px-6 md:pb-10">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-black text-foreground sm:text-3xl">
            {locale === "ar" ? "لوحة المضيف" : "Host dashboard"}
          </h1>
          <p className="text-sm text-muted-foreground">
            {locale === "ar"
              ? "أدر عروضك وحجوزاتك في مكان واحد."
              : "Manage your listings and bookings in one place."}
          </p>
        </div>
        <SignOutButton />
      </div>

      <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard
          Icon={DollarSign}
          label={locale === "ar" ? "الإيرادات" : "Revenue"}
          value={`${stats.revenue.toLocaleString()} EGP`}
        />
        <StatCard Icon={Users} label={locale === "ar" ? "الضيوف" : "Guests"} value={stats.guests} />
        <StatCard
          Icon={Package}
          label={locale === "ar" ? "العروض" : "Listings"}
          value={stats.listings}
        />
        <StatCard
          Icon={CalendarDays}
          label={locale === "ar" ? "الحجوزات" : "Bookings"}
          value={stats.bookings}
        />
      </div>

      <div className="mt-6 flex flex-wrap gap-2 border-b border-border">
        {tabs.map((tb) => (
          <button
            key={tb.key}
            onClick={() => setTab(tb.key)}
            className={cn(
              "relative px-4 py-3 text-sm font-semibold transition-colors",
              tab === tb.key ? "text-primary" : "text-muted-foreground hover:text-foreground",
            )}
          >
            {tb.label}
            {tab === tb.key && (
              <span className="absolute inset-x-2 -bottom-px h-0.5 rounded-full bg-primary" />
            )}
          </button>
        ))}
      </div>

      {tab === "overview" && (
        <div className="mt-6 grid gap-4 md:grid-cols-2">
          {([...kinds, "competition"] as Kind[]).map((k) => {
            const Icon = KIND_ICONS[k];
            const count = k === "competition" ? competitions.length : filteredByKind(k).length;
            return (
              <div key={k} className="rounded-2xl border border-border bg-card p-5 shadow-card">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Icon className="h-5 w-5 text-primary" />
                    <h3 className="font-bold capitalize">{k}</h3>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    className="rounded-xl"
                    onClick={() => {
                      setTab(k);
                      if (k === "competition") setEditingComp({});
                      else setEditing({ kind: k });
                    }}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                <p className="mt-2 text-sm text-muted-foreground">
                  {count} {locale === "ar" ? "عرض" : "items"}
                </p>
              </div>
            );
          })}
        </div>
      )}

      {kinds.includes(tab as Kind) && (
        <div className="mt-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-bold text-foreground capitalize">{tab}s</h2>
            <Button className="rounded-xl" onClick={() => setEditing({ kind: tab as Kind })}>
              <Plus className="h-4 w-4 me-1" />
              {locale === "ar" ? "إضافة" : "Add new"}
            </Button>
          </div>
          <div className="grid gap-3">
            {filteredByKind(tab as Kind).length === 0 && (
              <div className="grid place-items-center rounded-2xl border border-dashed border-border p-10 text-sm text-muted-foreground">
                {locale === "ar"
                  ? "لا توجد عروض بعد. اضغط إضافة للبدء."
                  : "No listings yet. Click Add new to start."}
              </div>
            )}
            {filteredByKind(tab as Kind).map((l) => (
              <div
                key={l.id}
                className="flex flex-wrap items-center gap-4 rounded-2xl border border-border bg-card p-3 shadow-card"
              >
                <img
                  src={
                    l.images?.[0] ??
                    "https://www.sfari.com/wp-content/uploads/2022/05/4-59-1024x683.jpg"
                  }
                  alt=""
                  className="h-20 w-28 rounded-xl object-cover"
                />
                <div className="min-w-0 flex-1">
                  <p className="truncate font-bold text-foreground">{l.title}</p>
                  <p className="truncate text-xs text-muted-foreground">
                    {l.location} · {l.category}
                  </p>
                  <p className="mt-1 text-sm font-semibold text-primary">
                    {Number(l.price).toLocaleString()} EGP
                  </p>
                </div>
                <div className="flex gap-2">
                  <Link to="/listing/$id" params={{ id: l.id }}>
                    <Button size="sm" variant="outline" className="rounded-xl">
                      View
                    </Button>
                  </Link>
                  {l.type === "product" &&
                    (l.is_featured ? (
                      <span className="inline-flex items-center gap-1 rounded-xl bg-warning/15 px-3 text-xs font-bold text-warning">
                        <Star className="h-3 w-3 fill-current" />{" "}
                        {locale === "ar" ? "مميز" : "Featured"}
                      </span>
                    ) : featureRequests.some(
                        (r) => r.listing_id === l.id && r.status === "pending",
                      ) ? (
                      <span className="inline-flex items-center rounded-xl bg-muted px-3 text-xs font-semibold text-muted-foreground">
                        {locale === "ar" ? "بانتظار الإدارة" : "Pending review"}
                      </span>
                    ) : (
                      <Link
                        to="/feature/$listingId"
                        params={{ listingId: l.id }}
                        search={{ featureRequestId: undefined }}
                      >
                        <Button size="sm" variant="outline" className="rounded-xl">
                          <Star className="me-1 h-4 w-4" />
                          {locale === "ar" ? "تمييز" : "Feature"}
                        </Button>
                      </Link>
                    ))}
                  <Button
                    size="sm"
                    variant="outline"
                    className="rounded-xl"
                    onClick={() => setEditing({ kind: l.type as Kind, row: l })}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="rounded-xl text-destructive"
                    onClick={async () => {
                      if (!confirm("Delete?")) return;
                      deleteMutation.mutate(l.id);
                    }}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === "bookings" && (
        <div className="mt-6 grid gap-6 lg:grid-cols-[320px_1fr]">
          <BookingCalendar
            month={calendarMonth}
            selected={selectedBookingDate}
            bookings={bookings}
            onMonthChange={setCalendarMonth}
            onSelect={setSelectedBookingDate}
          />
          <div className="space-y-3">
            <div>
              <h2 className="font-black text-foreground">
                {locale === "ar" ? "حجوزات اليوم المحدد" : "Reservations for selected date"}
              </h2>
              <p className="text-sm text-muted-foreground">
                {new Date(`${selectedBookingDate}T12:00:00`).toLocaleDateString(
                  locale === "ar" ? "ar-EG" : "en-GB",
                  { dateStyle: "full" },
                )}
              </p>
            </div>
            {bookings.filter((b) => b.booking_date === selectedBookingDate).length === 0 ? (
              <div className="grid place-items-center rounded-2xl border border-dashed border-border p-10 text-sm text-muted-foreground">
                {locale === "ar" ? "لا توجد حجوزات في هذا اليوم." : "No reservations on this date."}
              </div>
            ) : (
              bookings
                .filter((b) => b.booking_date === selectedBookingDate)
                .map((b) => <BookingRow key={b.id} b={b} />)
            )}
          </div>
        </div>
      )}

      {tab === "competition" && (
        <div className="mt-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-bold text-foreground">
              {locale === "ar" ? "المسابقات" : "Competitions"}
            </h2>
            <Button className="rounded-xl" onClick={() => setEditingComp({})}>
              <Plus className="h-4 w-4 me-1" />
              {locale === "ar" ? "إضافة" : "Add new"}
            </Button>
          </div>
          <div className="grid gap-3">
            {competitions.length === 0 && (
              <div className="grid place-items-center rounded-2xl border border-dashed border-border p-10 text-sm text-muted-foreground">
                {locale === "ar"
                  ? "لا توجد مسابقات بعد."
                  : "No competitions yet. Click Add new to start."}
              </div>
            )}
            {competitions.map((c) => (
              <div
                key={c.id}
                className="flex flex-wrap items-center gap-4 rounded-2xl border border-border bg-card p-3 shadow-card"
              >
                <img
                  src={
                    c.image_url ??
                    "https://www.sfari.com/wp-content/uploads/2022/05/4-59-1024x683.jpg"
                  }
                  alt=""
                  className="h-20 w-28 rounded-xl object-cover"
                />
                <div className="min-w-0 flex-1">
                  <p className="truncate font-bold text-foreground">{c.title}</p>
                  <p className="truncate text-xs text-muted-foreground">
                    {c.location} · {c.category} · {c.status}
                  </p>
                  <p className="mt-1 text-sm font-semibold text-primary">
                    {locale === "ar" ? "الجائزة" : "Prize"}:{" "}
                    {Number(c.prize_amount).toLocaleString()} EGP
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    className="rounded-xl"
                    onClick={() => setEditingComp({ row: c })}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="rounded-xl text-destructive"
                    onClick={() => {
                      if (!confirm("Delete?")) return;
                      deleteCompetition.mutate(c.id);
                    }}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {editing && (
        <ListingFormModal
          kind={editing.kind}
          row={editing.row}
          userId={user.id}
          onClose={() => setEditing(null)}
          onSaved={() => {
            setEditing(null);
            qc.invalidateQueries({ queryKey: qk.listings.all });
          }}
        />
      )}

      {editingComp && (
        <CompetitionFormModal
          row={editingComp.row}
          userId={user.id}
          onClose={() => setEditingComp(null)}
          onSaved={() => {
            setEditingComp(null);
            qc.invalidateQueries({ queryKey: qk.competitions.all });
          }}
        />
      )}

      <button
        onClick={() => navigate({ to: "/dashboard" })}
        className="mt-8 text-sm text-primary underline"
      >
        {locale === "ar" ? "← لوحة المسافر" : "← Traveler dashboard"}
      </button>
    </div>
  );
}

function StatCard({
  Icon,
  label,
  value,
}: {
  Icon: typeof DollarSign;
  label: string;
  value: string | number;
}) {
  return (
    <div className="rounded-2xl border border-border bg-card p-4 shadow-card">
      <div className="flex items-center gap-2 text-muted-foreground">
        <Icon className="h-4 w-4" />
        <span className="text-xs uppercase tracking-wide">{label}</span>
      </div>
      <p className="mt-2 text-2xl font-black text-primary">{value}</p>
    </div>
  );
}

function BookingRow({ b }: { b: Tables<"bookings"> }) {
  const { locale } = useI18n();
  const qc = useQueryClient();
  const { data: guest } = useQuery({
    queryKey: ["booking-guest", b.user_id],
    queryFn: async () => {
      const [{ data: prof }, { data: contact }] = await Promise.all([
        backend.resource("profiles").select("display_name").eq("id", b.user_id).maybeSingle(),
        backend.resource("user_contacts").select("phone").eq("user_id", b.user_id).maybeSingle(),
      ]);
      return { display_name: prof?.display_name ?? null, phone: contact?.phone ?? null };
    },
  });
  const statusMutation = useMutation({
    mutationFn: async (status: Tables<"bookings">["status"]) => {
      const { error } = await backend.resource("bookings").update({ status }).eq("id", b.id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.bookings.all }),
    onError: (e) => toast.error((e as Error).message),
  });
  const deleteMutation = useMutation({
    mutationFn: async () => {
      const { error } = await backend.resource("bookings").delete().eq("id", b.id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qk.bookings.all });
      qc.invalidateQueries({ queryKey: qk.competitions.all });
      toast.success(locale === "ar" ? "تم حذف الحجز" : "Booking deleted");
    },
    onError: (e) => toast.error((e as Error).message),
  });
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border bg-card p-4 shadow-card">
      <div className="min-w-0">
        <p className="font-bold text-foreground">{guest?.display_name ?? "Guest"}</p>
        <p className="text-xs text-muted-foreground">{guest?.phone ?? ""}</p>
        <p className="mt-1 text-xs text-muted-foreground">
          {b.booking_date ?? "—"} · {b.guests} {locale === "ar" ? "شخص" : "guests"} · {b.item_type}
        </p>
      </div>
      <div className="flex items-center gap-3">
        <span className="text-lg font-black text-primary">
          {Number(b.amount).toLocaleString()} EGP
        </span>
        <select
          value={b.status}
          onChange={(e) => statusMutation.mutate(e.target.value as Tables<"bookings">["status"])}
          className="rounded-xl border border-input bg-card px-3 py-2 text-xs font-semibold"
        >
          <option value="pending">pending</option>
          <option value="confirmed">confirmed</option>
          <option value="completed">completed</option>
          <option value="cancelled">cancelled</option>
        </select>
        <Button
          variant="ghost"
          size="icon"
          disabled={deleteMutation.isPending}
          onClick={() => {
            if (confirm(locale === "ar" ? "حذف هذا الحجز؟" : "Delete this booking?"))
              deleteMutation.mutate();
          }}
          aria-label="Delete booking"
        >
          <Trash2 className="h-4 w-4 text-destructive" />
        </Button>
      </div>
    </div>
  );
}

function BookingCalendar({
  month,
  selected,
  bookings,
  onMonthChange,
  onSelect,
}: {
  month: Date;
  selected: string;
  bookings: Tables<"bookings">[];
  onMonthChange: (date: Date) => void;
  onSelect: (date: string) => void;
}) {
  const { locale } = useI18n();
  const firstDay = new Date(month.getFullYear(), month.getMonth(), 1).getDay();
  const days = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
  const dateKey = (day: number) =>
    `${month.getFullYear()}-${String(month.getMonth() + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
  const counts = bookings.reduce<Record<string, number>>((acc, booking) => {
    if (booking.booking_date) acc[booking.booking_date] = (acc[booking.booking_date] ?? 0) + 1;
    return acc;
  }, {});
  const weekday =
    locale === "ar" ? ["ح", "ن", "ث", "ر", "خ", "ج", "س"] : ["S", "M", "T", "W", "T", "F", "S"];
  return (
    <section
      className="h-fit rounded-lg border border-border bg-card p-4 shadow-card"
      aria-label="Booking calendar"
    >
      <div className="flex items-center justify-between">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => onMonthChange(new Date(month.getFullYear(), month.getMonth() - 1, 1))}
          aria-label="Previous month"
        >
          <ChevronLeft className="h-4 w-4 rtl:rotate-180" />
        </Button>
        <h2 className="font-black capitalize">
          {month.toLocaleDateString(locale === "ar" ? "ar-EG" : "en-GB", {
            month: "long",
            year: "numeric",
          })}
        </h2>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => onMonthChange(new Date(month.getFullYear(), month.getMonth() + 1, 1))}
          aria-label="Next month"
        >
          <ChevronRight className="h-4 w-4 rtl:rotate-180" />
        </Button>
      </div>
      <div className="mt-3 grid grid-cols-7 text-center text-xs font-bold text-muted-foreground">
        {weekday.map((day, index) => (
          <span key={`${day}-${index}`} className="py-2">
            {day}
          </span>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {Array.from({ length: firstDay }).map((_, index) => (
          <span key={`empty-${index}`} />
        ))}
        {Array.from({ length: days }).map((_, index) => {
          const day = index + 1;
          const key = dateKey(day);
          const count = counts[key] ?? 0;
          return (
            <Button
              key={key}
              type="button"
              variant={selected === key ? "default" : "ghost"}
              className="relative h-10 w-full rounded-md p-0"
              onClick={() => onSelect(key)}
              aria-label={`${key}, ${count} bookings`}
            >
              <span>{day}</span>
              {count > 0 && <span className="absolute bottom-1 h-1 w-1 rounded-full bg-warning" />}
            </Button>
          );
        })}
      </div>
    </section>
  );
}

function ListingFormModal({
  kind,
  row,
  userId,
  onClose,
  onSaved,
}: {
  kind: Kind;
  row?: Tables<"listings">;
  userId: string;
  onClose: () => void;
  onSaved: () => void;
}) {
  const { locale } = useI18n();
  const [title, setTitle] = useState(row?.title ?? "");
  const [titleEn, setTitleEn] = useState(row?.title_en ?? "");
  const [description, setDescription] = useState(row?.description ?? "");
  const [price, setPrice] = useState<number>(Number(row?.price ?? 0));
  const [discount, setDiscount] = useState<number>(Number(row?.discount ?? 0));
  const [capacity, setCapacity] = useState<number>(row?.capacity ?? 1);
  const [location, setLocation] = useState(row?.location ?? "");
  const [category, setCategory] = useState(row?.category ?? "");
  const [images, setImages] = useState<string[]>(row?.images ?? []);
  const [startsAt, setStartsAt] = useState<string>(row?.starts_at?.slice(0, 16) ?? "");
  const [endsAt, setEndsAt] = useState<string>(row?.ends_at?.slice(0, 16) ?? "");
  const [saving, setSaving] = useState(false);

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (images.length === 0) {
      toast.error(locale === "ar" ? "أضف صورة واحدة على الأقل" : "Add at least one image");
      return;
    }
    setSaving(true);
    const payload = {
      host_id: userId,
      type: kind,
      title,
      title_en: titleEn || null,
      description,
      price,
      discount,
      capacity,
      location,
      category,
      images,
      starts_at: kind === "competition" && startsAt ? new Date(startsAt).toISOString() : null,
      ends_at: kind === "competition" && endsAt ? new Date(endsAt).toISOString() : null,
      status: "active",
    };
    const q = row
      ? backend.resource("listings").update(payload).eq("id", row.id)
      : backend.resource("listings").insert(payload);
    const { error } = await q;
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success(locale === "ar" ? "تم الحفظ" : "Saved");
    onSaved();
  }

  const categoryOptions =
    kind === "competition"
      ? [
          "horse_riding",
          "agriculture",
          "pottery",
          "handicrafts",
          "popular_cooking",
          "photography",
          "other",
        ]
      : kind === "stay"
        ? ["ecolodge", "farm", "beach", "desert", "nubian", "family"]
        : kind === "experience"
          ? ["craft", "cooking", "farm", "photo", "horse", "river"]
          : ["food", "craft", "textile", "other"];

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/50 p-4">
      <div className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-3xl border border-border bg-card p-6 shadow-elevated">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-xl font-black text-foreground">
            {row ? (locale === "ar" ? "تعديل" : "Edit") : locale === "ar" ? "إضافة" : "Add"} —{" "}
            {kind}
          </h3>
          <Button variant="ghost" size="sm" onClick={onClose}>
            ✕
          </Button>
        </div>
        <form onSubmit={submit} className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <Label>{locale === "ar" ? "الاسم (عربي)" : "Title (Arabic)"}</Label>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                maxLength={120}
              />
            </div>
            <div>
              <Label>{locale === "ar" ? "الاسم (إنجليزي)" : "Title (English)"}</Label>
              <Input value={titleEn} onChange={(e) => setTitleEn(e.target.value)} maxLength={120} />
            </div>
          </div>
          <div>
            <Label>{locale === "ar" ? "الوصف" : "Description"}</Label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              maxLength={1000}
            />
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            <div>
              <Label>{locale === "ar" ? "السعر (جنيه)" : "Price (EGP)"}</Label>
              <Input
                type="number"
                min={0}
                value={price}
                onChange={(e) => setPrice(Number(e.target.value))}
                required
              />
            </div>
            <div>
              <Label>{locale === "ar" ? "خصم %" : "Discount %"}</Label>
              <Input
                type="number"
                min={0}
                max={100}
                value={discount}
                onChange={(e) => setDiscount(Number(e.target.value))}
              />
            </div>
            <div>
              <Label>
                {kind === "product"
                  ? locale === "ar"
                    ? "الكمية"
                    : "Stock"
                  : locale === "ar"
                    ? "عدد الأشخاص"
                    : "Capacity"}
              </Label>
              <Input
                type="number"
                min={1}
                value={capacity}
                onChange={(e) => setCapacity(Number(e.target.value))}
              />
            </div>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <Label>{locale === "ar" ? "الموقع" : "Location"}</Label>
              <Input value={location} onChange={(e) => setLocation(e.target.value)} required />
            </div>
            <div>
              <Label>{locale === "ar" ? "الفئة" : "Category"}</Label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="mt-2 h-10 w-full rounded-xl border border-input bg-card px-3 text-sm"
              >
                <option value="">—</option>
                {categoryOptions.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
          </div>
          {kind === "competition" && (
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <Label>{locale === "ar" ? "تاريخ البدء" : "Starts at"}</Label>
                <Input
                  type="datetime-local"
                  value={startsAt}
                  onChange={(e) => setStartsAt(e.target.value)}
                  required
                />
              </div>
              <div>
                <Label>{locale === "ar" ? "تاريخ النهاية" : "Ends at"}</Label>
                <Input
                  type="datetime-local"
                  value={endsAt}
                  onChange={(e) => setEndsAt(e.target.value)}
                  required
                />
              </div>
            </div>
          )}
          <div>
            <Label>{locale === "ar" ? "الصور" : "Images"}</Label>
            <div className="mt-2">
              <ImageUploader value={images} onChange={setImages} userId={userId} />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={onClose} className="rounded-xl">
              {locale === "ar" ? "إلغاء" : "Cancel"}
            </Button>
            <Button type="submit" disabled={saving} className="rounded-xl">
              {saving ? "…" : locale === "ar" ? "حفظ" : "Save"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
function CompetitionFormModal({
  row,
  userId,
  onClose,
  onSaved,
}: {
  row?: Tables<"competitions">;
  userId: string;
  onClose: () => void;
  onSaved: () => void;
}) {
  const { locale } = useI18n();
  const [title, setTitle] = useState(row?.title ?? "");
  const [titleEn, setTitleEn] = useState(row?.title_en ?? "");
  const [description, setDescription] = useState(row?.description ?? "");
  const [category, setCategory] = useState(row?.category ?? "horse_riding");
  const [location, setLocation] = useState(row?.location ?? "");
  const [prize, setPrize] = useState<number>(Number(row?.prize_amount ?? 0));
  const [fee, setFee] = useState<number>(Number(row?.entry_fee ?? 0));
  const [capacity, setCapacity] = useState<number>(Number(row?.capacity ?? 30));
  const [status, setStatus] = useState<Tables<"competitions">["status"]>(row?.status ?? "open");
  const [startsAt, setStartsAt] = useState(row?.starts_at?.slice(0, 16) ?? "");
  const [endsAt, setEndsAt] = useState(row?.ends_at?.slice(0, 16) ?? "");
  const [images, setImages] = useState<string[]>(row?.image_url ? [row.image_url] : []);
  const [saving, setSaving] = useState(false);

  const CATS = [
    "horse_riding",
    "agriculture",
    "pottery",
    "handicrafts",
    "popular_cooking",
    "photography",
    "other",
  ];

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (!startsAt || !endsAt)
      return toast.error(locale === "ar" ? "حدد التواريخ" : "Pick start and end dates");
    if (new Date(endsAt) <= new Date(startsAt))
      return toast.error(
        locale === "ar"
          ? "تاريخ النهاية يجب أن يكون بعد البداية"
          : "End date must be after the start date",
      );
    setSaving(true);
    const payload = {
      host_id: userId,
      title,
      title_en: titleEn || null,
      description: description || null,
      category,
      location,
      prize_amount: prize,
      entry_fee: fee,
      capacity,
      status,
      starts_at: new Date(startsAt).toISOString(),
      ends_at: new Date(endsAt).toISOString(),
      image_url: images[0] ?? null,
    };
    const { error } = row
      ? await backend.resource("competitions").update(payload).eq("id", row.id)
      : await backend.resource("competitions").insert(payload);
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success(locale === "ar" ? "تم الحفظ" : "Saved");
    onSaved();
  }

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/50 p-4">
      <div className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-3xl border border-border bg-card p-6 shadow-elevated">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-xl font-black text-foreground">
            {row
              ? locale === "ar"
                ? "تعديل مسابقة"
                : "Edit competition"
              : locale === "ar"
                ? "إضافة مسابقة"
                : "Add competition"}
          </h3>
          <Button variant="ghost" size="sm" onClick={onClose}>
            ✕
          </Button>
        </div>
        <form onSubmit={submit} className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <Label>{locale === "ar" ? "الاسم (عربي)" : "Title (Arabic)"}</Label>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                maxLength={120}
              />
            </div>
            <div>
              <Label>{locale === "ar" ? "الاسم (إنجليزي)" : "Title (English)"}</Label>
              <Input value={titleEn} onChange={(e) => setTitleEn(e.target.value)} maxLength={120} />
            </div>
          </div>
          <div>
            <Label>{locale === "ar" ? "الوصف" : "Description"}</Label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              maxLength={1000}
            />
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            <div>
              <Label>{locale === "ar" ? "الجائزة (جنيه)" : "Prize (EGP)"}</Label>
              <Input
                type="number"
                min={0}
                value={prize}
                onChange={(e) => setPrize(Number(e.target.value))}
                required
              />
            </div>
            <div>
              <Label>{locale === "ar" ? "رسوم الاشتراك" : "Entry fee (EGP)"}</Label>
              <Input
                type="number"
                min={0}
                value={fee}
                onChange={(e) => setFee(Number(e.target.value))}
              />
            </div>
            <div>
              <Label>{locale === "ar" ? "عدد المشاركين" : "Capacity"}</Label>
              <Input
                type="number"
                min={1}
                value={capacity}
                onChange={(e) => setCapacity(Number(e.target.value))}
              />
            </div>
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            <div>
              <Label>{locale === "ar" ? "الموقع" : "Location"}</Label>
              <Input value={location} onChange={(e) => setLocation(e.target.value)} required />
            </div>
            <div>
              <Label>{locale === "ar" ? "الفئة" : "Category"}</Label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="mt-2 h-10 w-full rounded-xl border border-input bg-card px-3 text-sm"
              >
                {CATS.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <Label>{locale === "ar" ? "الحالة" : "Status"}</Label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as Tables<"competitions">["status"])}
                className="mt-2 h-10 w-full rounded-xl border border-input bg-card px-3 text-sm"
              >
                {["draft", "upcoming", "open", "closed", "completed", "cancelled"].map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <Label>{locale === "ar" ? "تاريخ البدء" : "Starts at"}</Label>
              <Input
                type="datetime-local"
                value={startsAt}
                onChange={(e) => setStartsAt(e.target.value)}
                required
              />
            </div>
            <div>
              <Label>{locale === "ar" ? "تاريخ النهاية" : "Ends at"}</Label>
              <Input
                type="datetime-local"
                value={endsAt}
                onChange={(e) => setEndsAt(e.target.value)}
                required
              />
            </div>
          </div>
          <div>
            <Label>{locale === "ar" ? "الصورة" : "Image"}</Label>
            <div className="mt-2">
              <ImageUploader value={images} onChange={setImages} userId={userId} />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={onClose} className="rounded-xl">
              {locale === "ar" ? "إلغاء" : "Cancel"}
            </Button>
            <Button type="submit" disabled={saving} className="rounded-xl">
              {saving ? "…" : locale === "ar" ? "حفظ" : "Save"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
