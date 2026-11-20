import { useState, type FormEvent } from "react";
import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Users, CalendarCheck, HandHeart, Home as HomeIcon, MapPin, Star, Quote, Mail, ArrowRight } from "lucide-react";
import { backend } from "@/integrations/api/client";
import { getPlatformStats } from "@/lib/stats.functions";
import { UserAvatar } from "@/components/UserAvatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useI18n } from "@/lib/i18n";
import { toast } from "sonner";

function SectionHeader({ title, subtitle, action }: { title: string; subtitle?: string; action?: React.ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h2 className="text-2xl font-black text-foreground sm:text-3xl">{title}</h2>
        {subtitle && <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

/* ------------------------------- Statistics ------------------------------ */

export function StatsStrip() {
  const { locale } = useI18n();
  const ar = locale === "ar";
  const fetchStats = useServerFn(getPlatformStats);
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["home", "stats"],
    queryFn: () => fetchStats(),
  });

  if (isError) {
    return (
      <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
        <div role="alert" className="rounded-3xl border border-border bg-card p-5 text-center text-sm text-muted-foreground">
          {ar ? "تعذر تحميل إحصائيات المنصة." : "Platform statistics could not be loaded."}
          <Button variant="outline" size="sm" className="ms-3 rounded-xl" onClick={() => void refetch()}>
            {ar ? "إعادة المحاولة" : "Retry"}
          </Button>
        </div>
      </section>
    );
  }

  const items = [
    { Icon: Users, value: data?.travelers ?? 0, label: ar ? "أعضاء المنصة" : "Community members" },
    { Icon: HomeIcon, value: data?.hosts ?? 0, label: ar ? "مضيفون" : "Hosts" },
    { Icon: CalendarCheck, value: data?.bookings ?? 0, label: ar ? "حجوزات" : "Bookings" },
    { Icon: HandHeart, value: data?.volunteers ?? 0, label: ar ? "متطوعون" : "Volunteers" },
  ];

  return (
    <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <div className="grid grid-cols-2 gap-3 rounded-3xl border border-border bg-card p-5 shadow-card sm:grid-cols-4 sm:p-7">
        {items.map(({ Icon, value, label }, i) => (
          <div key={label} className="animate-fade-up text-center" style={{ animationDelay: `${i * 70}ms` }}>
            <Icon className="mx-auto h-6 w-6 text-primary" />
            <p className="mt-2 text-3xl font-black text-foreground" aria-live="polite">
              {isLoading ? "—" : value.toLocaleString()}
            </p>
            <p className="text-xs text-muted-foreground">{label}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

/* ------------------------------ Destinations ----------------------------- */

export function DestinationsSection() {
  const { locale } = useI18n();
  const ar = locale === "ar";

  const { data: places = [] } = useQuery({
    queryKey: ["home", "destinations"],
    queryFn: async () => {
      const { data } = await backend.resource("listings").select("location,images").eq("status", "active").limit(300);
      const map = new Map<string, { name: string; count: number; image?: string }>();
      for (const row of data ?? []) {
        const name = (row.location ?? "").trim();
        if (!name) continue;
        const entry = map.get(name) ?? { name, count: 0, image: undefined };
        entry.count += 1;
        entry.image ??= row.images?.[0];
        map.set(name, entry);
      }
      return [...map.values()].sort((a, b) => b.count - a.count).slice(0, 6);
    },
  });

  if (places.length === 0) return null;

  return (
    <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      <SectionHeader
        title={ar ? "وجهات مميزة" : "Popular destinations"}
        subtitle={ar ? "أكثر القرى والمناطق التي يزورها المسافرون" : "The villages and regions travellers love most"}
      />
      <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
        {places.map((p, i) => (
          <Link
            key={p.name}
            to="/stays"
            className="animate-fade-up group relative aspect-[4/3] overflow-hidden rounded-2xl shadow-card"
            style={{ animationDelay: `${i * 60}ms` }}
          >
            <img
              src={p.image ?? "https://images.unsplash.com/photo-1502920917128-1aa500764cbd?auto=format&fit=crop&w=800&q=70"}
              alt={p.name}
              loading="lazy"
              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" aria-hidden />
            <div className="absolute inset-x-0 bottom-0 p-4 text-white">
              <p className="flex items-center gap-1 text-sm font-black"><MapPin className="h-4 w-4" />{p.name}</p>
              <p className="text-xs text-white/80">
                {p.count} {ar ? "عرض" : p.count === 1 ? "listing" : "listings"}
              </p>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}

/* -------------------------------- Top hosts ------------------------------ */

export function TopHostsSection() {
  const { locale } = useI18n();
  const ar = locale === "ar";

  const { data: hosts = [] } = useQuery({
    queryKey: ["home", "top-hosts"],
    queryFn: async () => {
      const { data } = await backend.resource("listings").select("host_id").eq("status", "active").limit(300);
      const counts = new Map<string, number>();
      for (const r of data ?? []) counts.set(r.host_id, (counts.get(r.host_id) ?? 0) + 1);
      const top = [...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 4);
      if (top.length === 0) return [];
      const { data: profiles } = await backend
        .resource("profiles")
        .select("id,display_name,avatar_url,location,bio")
        .in("id", top.map(([id]) => id));
      return top.map(([id, count]) => {
        const p = (profiles ?? []).find((x) => x.id === id);
        return {
          id,
          count,
          name: p?.display_name ?? (ar ? "مضيف" : "Host"),
          avatar: p?.avatar_url ?? null,
          location: p?.location ?? "",
          bio: p?.bio ?? "",
        };
      });
    },
  });

  if (hosts.length === 0) return null;

  return (
    <section className="bg-muted/40 py-10">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <SectionHeader
          title={ar ? "أفضل المضيفين" : "Top hosts"}
          subtitle={ar ? "أشخاص يفتحون بيوتهم وقراهم لك" : "People opening their homes and villages to you"}
        />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {hosts.map((h, i) => (
            <div
              key={h.id}
              className="animate-fade-up rounded-2xl border border-border bg-card p-5 text-center shadow-card"
              style={{ animationDelay: `${i * 60}ms` }}
            >
              <UserAvatar name={h.name} src={h.avatar} size="xl" className="mx-auto" />
              <p className="mt-3 font-black text-foreground">{h.name}</p>
              {h.location && <p className="text-xs text-muted-foreground">{h.location}</p>}
              <p className="mt-2 line-clamp-2 text-xs text-muted-foreground">{h.bio}</p>
              <p className="mt-3 inline-block rounded-full bg-primary/10 px-3 py-1 text-xs font-bold text-primary">
                {h.count} {ar ? "عرض" : "listings"}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ------------------------------ Testimonials ----------------------------- */

export function TestimonialsSection() {
  const { locale } = useI18n();
  const ar = locale === "ar";

  const { data: reviews = [] } = useQuery({
    queryKey: ["home", "testimonials"],
    queryFn: async () => {
      const { data } = await backend
        .resource("reviews")
        .select("id,rating,comment,user_id,created_at")
        .gte("rating", 4)
        .not("comment", "is", null)
        .order("created_at", { ascending: false })
        .limit(6);
      const list = (data ?? []).filter((r) => (r.comment ?? "").trim().length > 0).slice(0, 3);
      if (list.length === 0) return [];
      const { data: profiles } = await backend
        .resource("profiles")
        .select("id,display_name,avatar_url")
        .in("id", list.map((r) => r.user_id));
      return list.map((r) => {
        const p = (profiles ?? []).find((x) => x.id === r.user_id);
        return { ...r, name: p?.display_name ?? "Guest", avatar: p?.avatar_url ?? null };
      });
    },
  });

  if (reviews.length === 0) return null;

  return (
    <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      <SectionHeader
        title={ar ? "ماذا يقول المسافرون" : "What travellers say"}
        subtitle={ar ? "آراء حقيقية من ضيوف ANA Refi" : "Real reviews from ANA Refi guests"}
      />
      <div className="grid gap-4 md:grid-cols-3">
        {reviews.map((r, i) => (
          <figure
            key={r.id}
            className="animate-fade-up rounded-2xl border border-border bg-card p-5 shadow-card"
            style={{ animationDelay: `${i * 60}ms` }}
          >
            <Quote className="h-6 w-6 text-primary/40" />
            <blockquote className="mt-2 line-clamp-4 text-sm text-foreground/90">{r.comment}</blockquote>
            <figcaption className="mt-4 flex items-center gap-3">
              <UserAvatar name={r.name} src={r.avatar} size="sm" />
              <div>
                <p className="text-sm font-bold text-foreground">{r.name}</p>
                <p className="flex items-center gap-0.5 text-warning">
                  {Array.from({ length: r.rating }).map((_, k) => (
                    <Star key={k} className="h-3 w-3 fill-current" />
                  ))}
                </p>
              </div>
            </figcaption>
          </figure>
        ))}
      </div>
    </section>
  );
}

/* ---------------------------------- Map ---------------------------------- */

export function MapSection() {
  const { locale } = useI18n();
  const ar = locale === "ar";
  return (
    <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      <SectionHeader
        title={ar ? "اكتشف على الخريطة" : "Explore on the map"}
        subtitle={ar ? "قرى ومزارع وواحات من الدلتا إلى الصعيد" : "Villages, farms and oases from the Delta to Upper Egypt"}
      />
      <div className="overflow-hidden rounded-3xl border border-border shadow-card">
        <iframe
          title={ar ? "خريطة مصر" : "Map of Egypt"}
          loading="lazy"
          className="h-[360px] w-full border-0"
          referrerPolicy="no-referrer-when-downgrade"
          src="https://www.google.com/maps?q=Egypt&output=embed"
        />
      </div>
    </section>
  );
}

/* ------------------------------- Newsletter ------------------------------ */

export function NewsletterSection() {
  const { locale } = useI18n();
  const ar = locale === "ar";
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    const { error } = await backend.resource("contact_messages").insert({
      name: "Newsletter subscriber",
      email: email.trim(),
      message: "Newsletter subscription request",
    });
    setBusy(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    setEmail("");
    toast.success(ar ? "تم اشتراكك في النشرة البريدية" : "You're subscribed to our newsletter");
  }

  return (
    <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      <div className="relative overflow-hidden rounded-3xl bg-gradient-hero px-6 py-10 text-center text-primary-foreground shadow-elevated sm:px-10">
        <Mail className="mx-auto h-8 w-8" />
        <h2 className="mt-3 text-2xl font-black sm:text-3xl">{ar ? "ابقَ على تواصل" : "Stay in the loop"}</h2>
        <p className="mx-auto mt-2 max-w-xl text-sm text-primary-foreground/90">
          {ar
            ? "اشترك لتصلك أحدث الإقامات والتجارب والمسابقات من قرى مصر."
            : "Subscribe for the latest stays, experiences and competitions from Egypt's villages."}
        </p>
        <form onSubmit={submit} className="mx-auto mt-6 flex max-w-md flex-col gap-2 sm:flex-row">
          <Input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder={ar ? "بريدك الإلكتروني" : "Your email address"}
            className="rounded-xl border-white/40 bg-white/15 text-white placeholder:text-white/70"
          />
          <Button type="submit" disabled={busy} className="rounded-xl bg-white text-primary hover:bg-white/90">
            {ar ? "اشترك" : "Subscribe"}
            <ArrowRight className="ms-1 h-4 w-4 rtl:rotate-180" />
          </Button>
        </form>
      </div>
    </section>
  );
}
