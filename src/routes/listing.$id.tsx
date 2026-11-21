import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, type FormEvent } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { backend } from "@/integrations/api/client";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { useFavorites } from "@/hooks/useFavorites";
import { useI18n } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import {
  MapPin,
  Star,
  Users,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Share2,
  Heart,
} from "lucide-react";
import type { Tables } from "@/integrations/api/types";
import { uploadListingImage } from "@/lib/uploadImage";
import { cn } from "@/lib/utils";
import { qk } from "@/lib/queryKeys";
import { LocationMap } from "@/components/LocationMap";
import { UserAvatar } from "@/components/UserAvatar";

export const Route = createFileRoute("/listing/$id")({
  head: () => ({
    meta: [
      { title: "Listing — ANA Refi" },
      { name: "description", content: "Listing details, reviews and booking." },
      { property: "og:title", content: "Listing — ANA Refi" },
      { property: "og:description", content: "Listing details, reviews and booking on ANA Refi." },
    ],
  }),
  component: DetailPage,
});

function DetailPage() {
  const { id } = Route.useParams();
  const { locale, t } = useI18n();
  const { user } = useCurrentUser();
  const { has: isFavorite, toggle: toggleFavorite } = useFavorites();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const qcInvalidate = () => qc.invalidateQueries({ queryKey: qk.favorites.all });
  const qcCommunity = () => qc.invalidateQueries({ queryKey: qk.community.posts });
  const [idx, setIdx] = useState(0);

  useEffect(() => {
    setIdx(0);
  }, [id]);

  const { data: row = null, isLoading: loading } = useQuery({
    queryKey: qk.listings.byId(id),
    queryFn: async () => {
      const { data, error } = await backend
        .resource("listings")
        .select("*")
        .eq("id", id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  const { data: reviews = [] } = useQuery<ReviewRow[]>({
    queryKey: qk.reviews.byListing(id),
    queryFn: async (): Promise<ReviewRow[]> => {
      const { data } = await backend
        .resource("reviews")
        .select("*")
        .eq("listing_id", id)
        .order("created_at", { ascending: false });
      const list = data ?? [];
      if (list.length === 0) return [];
      const { data: profiles } = await backend
        .resource("profiles")
        .select("id,display_name,email,avatar_url")
        .in(
          "id",
          list.map((r) => r.user_id),
        );
      return list.map((r) => {
        const p = (profiles ?? []).find((x) => x.id === r.user_id);
        return {
          ...r,
          author: p?.display_name ?? "Guest",
          authorEmail: p?.email ?? null,
          authorAvatar: p?.avatar_url ?? null,
        };
      });
    },
  });

  const { data: dbList = [] } = useQuery({
    queryKey: qk.listings.ids("active"),
    queryFn: async () => {
      const { data } = await backend
        .resource("listings")
        .select("id")
        .eq("status", "active")
        .order("created_at");
      return data ?? [];
    },
  });

  if (loading) {
    return (
      <div className="grid min-h-[60vh] place-items-center text-muted-foreground">
        {t("common.loading")}
      </div>
    );
  }
  if (!row) {
    return (
      <div className="mx-auto grid min-h-[60vh] max-w-md place-items-center px-4 text-center">
        <div>
          <p className="text-muted-foreground">
            {locale === "ar" ? "العنصر غير موجود" : "Listing not found"}
          </p>
          <Link to="/">
            <Button className="mt-4 rounded-xl">{locale === "ar" ? "العودة" : "Go back"}</Button>
          </Link>
        </div>
      </div>
    );
  }

  const images = row.images?.length
    ? row.images
    : ["https://www.sfari.com/wp-content/uploads/2022/05/4-59-1024x683.jpg"];
  const title = locale === "en" ? (row.title_en ?? row.title) : row.title;
  const description = row.description ?? "";
  const location = row.location ?? "";
  const category = row.category ?? "";
  const price = Number(row.price);
  const discount = row.discount ?? 0;
  const finalPrice = discount > 0 ? Math.round(price * (1 - discount / 100)) : price;
  const kind = (row.type ?? "stay") as "stay" | "experience" | "product" | "competition";

  const pos = dbList.findIndex((x) => x.id === id);
  const prev = pos > 0 ? dbList[pos - 1]?.id : null;
  const next = pos >= 0 && pos < dbList.length - 1 ? dbList[pos + 1]?.id : null;

  return (
    <div className="mx-auto max-w-6xl px-4 pt-6 pb-24 sm:px-6 md:pb-10">
      <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <div>
          <div className="relative aspect-[4/3] overflow-hidden rounded-3xl bg-muted shadow-card">
            <img src={images[idx]} alt={title} className="h-full w-full object-cover" />
            {images.length > 1 && (
              <>
                <button
                  onClick={() => setIdx((i) => (i - 1 + images.length) % images.length)}
                  className="absolute start-3 top-1/2 grid h-10 w-10 -translate-y-1/2 place-items-center rounded-full bg-background/90 shadow-soft"
                >
                  <ChevronLeft className="h-5 w-5" />
                </button>
                <button
                  onClick={() => setIdx((i) => (i + 1) % images.length)}
                  className="absolute end-3 top-1/2 grid h-10 w-10 -translate-y-1/2 place-items-center rounded-full bg-background/90 shadow-soft"
                >
                  <ChevronRight className="h-5 w-5" />
                </button>
              </>
            )}
          </div>
          {images.length > 1 && (
            <div className="mt-3 flex gap-2 overflow-x-auto">
              {images.map((im, i) => (
                <button
                  key={i}
                  onClick={() => setIdx(i)}
                  className={cn(
                    "h-16 w-24 shrink-0 overflow-hidden rounded-xl border-2",
                    i === idx ? "border-primary" : "border-transparent",
                  )}
                >
                  <img src={im} alt="" className="h-full w-full object-cover" />
                </button>
              ))}
            </div>
          )}

          <div className="mt-6">
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-bold text-primary capitalize">
                {kind}
              </span>
              {category && (
                <span className="rounded-full bg-accent px-3 py-1 text-xs font-semibold text-accent-foreground">
                  {category}
                </span>
              )}
            </div>
            <h1 className="mt-3 text-2xl font-black text-foreground sm:text-3xl">{title}</h1>
            <p className="mt-1 flex items-center gap-1 text-sm text-muted-foreground">
              <MapPin className="h-4 w-4 text-primary" /> {location}
            </p>
            <p className="mt-4 whitespace-pre-line text-sm leading-6 text-foreground/90">
              {description}
            </p>
          </div>

          <LocationMap location={location} title={title} />

          <ReviewsSection listingId={id} reviews={reviews} userId={user?.id} />

          <div className="mt-6 flex justify-between">
            <Button
              variant="outline"
              disabled={!prev}
              onClick={() => prev && navigate({ to: "/listing/$id", params: { id: prev } })}
              className="rounded-xl"
            >
              <ChevronLeft className="h-4 w-4 me-1 rtl:hidden" />{" "}
              {locale === "ar" ? "السابق" : "Prev"}
            </Button>
            <Button
              variant="outline"
              disabled={!next}
              onClick={() => next && navigate({ to: "/listing/$id", params: { id: next } })}
              className="rounded-xl"
            >
              {locale === "ar" ? "التالي" : "Next"}{" "}
              <ChevronRight className="h-4 w-4 ms-1 rtl:hidden" />
            </Button>
          </div>
        </div>

        <aside className="space-y-4">
          <div className="rounded-3xl border border-border bg-card p-6 shadow-elevated">
            <div className="flex items-end justify-between">
              <div>
                {discount > 0 && (
                  <p className="text-sm text-muted-foreground line-through">
                    {price.toLocaleString()} EGP
                  </p>
                )}
                <p className="text-3xl font-black text-primary">
                  {finalPrice.toLocaleString()}{" "}
                  <span className="text-sm font-medium text-muted-foreground">{t("comp.egp")}</span>
                </p>
              </div>
              {discount > 0 && (
                <span className="rounded-full bg-warning/20 px-2 py-1 text-xs font-bold text-warning">
                  -{discount}%
                </span>
              )}
            </div>
            {kind !== "product" && kind !== "competition" ? (
              <BookingForm
                listingId={row?.id ?? null}
                itemId={id}
                itemType={kind}
                amount={finalPrice}
                userId={user?.id}
              />
            ) : kind === "product" ? (
              <ProductBuyForm
                listingId={row?.id ?? null}
                itemId={id}
                amount={finalPrice}
                userId={user?.id}
              />
            ) : (
              <CompetitionJoinForm
                listingId={row?.id ?? null}
                itemId={id}
                amount={finalPrice}
                userId={user?.id}
              />
            )}
          </div>

          <div className="flex gap-2">
            <Button
              variant="outline"
              className="flex-1 rounded-xl"
              onClick={async () => {
                if (!user) {
                  toast.error(t("book.needSignIn"));
                  return;
                }
                try {
                  const wasAdded = await toggleFavorite(id, kind);
                  toast.success(
                    wasAdded
                      ? locale === "ar"
                        ? "أضيف للمفضلة"
                        : "Added to favorites"
                      : locale === "ar"
                        ? "أزيل من المفضلة"
                        : "Removed from favorites",
                  );
                } catch (err) {
                  toast.error((err as Error).message);
                }
              }}
            >
              <Heart
                className={cn(
                  "h-4 w-4 me-1",
                  isFavorite(id, kind) && "fill-current text-destructive",
                )}
              />{" "}
              {locale === "ar" ? "مفضلة" : "Save"}
            </Button>
            <Button
              variant="outline"
              className="flex-1 rounded-xl"
              onClick={async () => {
                if (!user) {
                  toast.error(t("book.needSignIn"));
                  return;
                }
                const { error } = await backend.resource("community_posts").insert({
                  user_id: user.id,
                  listing_id: row?.id ?? null,
                  title,
                  body: `Check out ${title} in ${location}!`,
                });
                if (error) {
                  toast.error(error.message);
                  return;
                }
                qcCommunity();
                toast.success(locale === "ar" ? "تمت المشاركة" : "Shared to community");
              }}
            >
              <Share2 className="h-4 w-4 me-1" /> {locale === "ar" ? "شارك" : "Share"}
            </Button>
          </div>

          {!user && (
            <div className="rounded-2xl border border-dashed border-border bg-card/50 p-4 text-center text-sm text-muted-foreground">
              <Link to="/auth" className="text-primary underline">
                {t("nav.signin")}
              </Link>{" "}
              {locale === "ar" ? "للحجز والمراجعة" : "to book & review"}
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}

function BookingForm({
  listingId,
  itemId,
  itemType,
  amount,
  userId,
}: {
  listingId: string | null;
  itemId: string;
  itemType: "stay" | "experience";
  amount: number;
  userId: string | undefined;
}) {
  const { locale, t } = useI18n();
  const qc = useQueryClient();
  const navigate = useNavigate();
  const [date, setDate] = useState("");
  const [guests, setGuests] = useState(1);
  const [saving, setSaving] = useState(false);
  async function submit(e: FormEvent) {
    e.preventDefault();
    if (!userId) return toast.error(t("book.needSignIn"));
    setSaving(true);
    const { data, error } = await backend
      .resource("bookings")
      .insert({
        item_id: itemId,
        item_type: itemType,
        guests,
        booking_date: date,
      })
      .select("id")
      .single();
    setSaving(false);
    if (error) return toast.error(error.message);
    if (!data)
      return toast.error(
        locale === "ar" ? "تعذر استلام رقم الحجز" : "The API did not return a booking ID",
      );
    qc.invalidateQueries({ queryKey: qk.bookings.all });
    toast.success(
      locale === "ar" ? "أكمل الدفع لتأكيد الحجز" : "Complete payment to confirm your booking",
    );
    navigate({ to: "/payment/$bookingId", params: { bookingId: data.id } });
  }
  return (
    <form onSubmit={submit} className="mt-4 space-y-3">
      <div>
        <Label className="flex items-center gap-1">
          <Calendar className="h-4 w-4" /> {locale === "ar" ? "التاريخ" : "Date"}
        </Label>
        <Input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          required
          className="mt-1"
        />
      </div>
      <div>
        <Label className="flex items-center gap-1">
          <Users className="h-4 w-4" /> {locale === "ar" ? "عدد الأشخاص" : "Guests"}
        </Label>
        <Input
          type="number"
          min={1}
          value={guests}
          onChange={(e) => setGuests(Number(e.target.value))}
          required
          className="mt-1"
        />
      </div>
      <p className="text-sm text-muted-foreground">
        {locale === "ar" ? "الإجمالي" : "Total"}:{" "}
        <span className="font-bold text-foreground">{(amount * guests).toLocaleString()} EGP</span>
      </p>
      <Button type="submit" disabled={saving} className="w-full rounded-xl" size="lg">
        {saving ? "…" : t("listing.book")}
      </Button>
    </form>
  );
}

function ProductBuyForm({
  listingId,
  itemId,
  amount,
  userId,
}: {
  listingId: string | null;
  itemId: string;
  amount: number;
  userId: string | undefined;
}) {
  const { locale, t } = useI18n();
  const qc = useQueryClient();
  const navigate = useNavigate();
  const [qty, setQty] = useState(1);
  async function submit(e: FormEvent) {
    e.preventDefault();
    if (!userId) return toast.error(t("book.needSignIn"));
    const { data, error } = await backend
      .resource("bookings")
      .insert({
        item_id: itemId,
        item_type: "product",
        quantity: qty,
      })
      .select("id")
      .single();
    if (error) return toast.error(error.message);
    if (!data)
      return toast.error(
        locale === "ar" ? "تعذر استلام رقم الحجز" : "The API did not return a booking ID",
      );
    qc.invalidateQueries({ queryKey: qk.bookings.all });
    navigate({ to: "/payment/$bookingId", params: { bookingId: data.id } });
  }
  return (
    <form onSubmit={submit} className="mt-4 space-y-3">
      <div>
        <Label>{locale === "ar" ? "الكمية" : "Quantity"}</Label>
        <Input
          type="number"
          min={1}
          value={qty}
          onChange={(e) => setQty(Number(e.target.value))}
          className="mt-1"
        />
      </div>
      <p className="text-sm text-muted-foreground">
        {locale === "ar" ? "الإجمالي" : "Total"}:{" "}
        <span className="font-bold text-foreground">{(amount * qty).toLocaleString()} EGP</span>
      </p>
      <Button type="submit" className="w-full rounded-xl" size="lg">
        {t("listing.buy")}
      </Button>
    </form>
  );
}

function CompetitionJoinForm({
  listingId,
  itemId,
  amount,
  userId,
}: {
  listingId: string | null;
  itemId: string;
  amount: number;
  userId: string | undefined;
}) {
  const { locale, t } = useI18n();
  const qc = useQueryClient();
  const navigate = useNavigate();
  async function join() {
    if (!userId) return toast.error(t("book.needSignIn"));
    const { data, error } = await backend
      .resource("bookings")
      .insert({ item_id: itemId, item_type: "competition" })
      .select("id")
      .single();
    if (error) return toast.error(error.message);
    if (!data)
      return toast.error(
        locale === "ar" ? "تعذر استلام رقم الحجز" : "The API did not return a booking ID",
      );
    qc.invalidateQueries({ queryKey: qk.bookings.all });
    navigate({ to: "/payment/$bookingId", params: { bookingId: data.id } });
  }
  return (
    <div className="mt-4">
      <Button onClick={join} className="w-full rounded-xl" size="lg">
        {locale === "ar" ? "اشترك الآن" : "Join now"}
      </Button>
    </div>
  );
}

type ReviewRow = Tables<"reviews"> & {
  author?: string;
  authorEmail?: string | null;
  authorAvatar?: string | null;
};

function ReviewsSection({
  listingId,
  reviews,
  userId,
}: {
  listingId: string;
  reviews: ReviewRow[];
  userId?: string;
}) {
  const { locale, t } = useI18n();
  const qc = useQueryClient();
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [image, setImage] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (!userId) return toast.error(t("book.needSignIn"));
    setSaving(true);
    const { error } = await backend
      .resource("reviews")
      .insert({ user_id: userId, listing_id: listingId, rating, comment, image_url: image });
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success(locale === "ar" ? "تمت الإضافة" : "Review added");
    setComment("");
    setImage(null);
    setRating(5);
    qc.invalidateQueries({ queryKey: qk.reviews.byListing(listingId) });
  }

  return (
    <section className="mt-8">
      <h2 className="mb-3 text-xl font-black">
        {locale === "ar" ? "التقييمات والمراجعات" : "Reviews"}
      </h2>
      {userId && (
        <form
          onSubmit={submit}
          className="mb-4 rounded-2xl border border-border bg-card p-4 shadow-card"
        >
          <div className="flex gap-1">
            {[1, 2, 3, 4, 5].map((n) => (
              <button key={n} type="button" onClick={() => setRating(n)}>
                <Star
                  className={cn(
                    "h-6 w-6",
                    n <= rating ? "fill-warning text-warning" : "text-muted-foreground",
                  )}
                />
              </button>
            ))}
          </div>
          <Textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder={locale === "ar" ? "شارك تجربتك…" : "Share your experience…"}
            rows={2}
            maxLength={500}
            className="mt-3"
          />
          <div className="mt-3 flex items-center gap-3">
            <input
              type="file"
              accept="image/*"
              onChange={async (e) => {
                const f = e.target.files?.[0];
                if (!f) return;
                try {
                  const url = await uploadListingImage(f, userId);
                  setImage(url);
                  toast.success("Image added");
                } catch (err) {
                  toast.error((err as Error).message);
                }
              }}
            />
            {image && <img src={image} alt="" className="h-12 w-12 rounded object-cover" />}
          </div>
          <Button type="submit" disabled={saving} className="mt-3 rounded-xl">
            {saving ? "…" : locale === "ar" ? "أضف مراجعة" : "Post review"}
          </Button>
        </form>
      )}
      <div className="space-y-3">
        {reviews.length === 0 && (
          <p className="text-sm text-muted-foreground">
            {locale === "ar" ? "لا مراجعات بعد" : "No reviews yet"}
          </p>
        )}
        {reviews.map((r) => (
          <div key={r.id} className="rounded-2xl border border-border bg-card p-4 shadow-card">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <UserAvatar name={r.author} src={r.authorAvatar} size="md" />
                <div>
                  <p className="font-bold">{r.author}</p>
                  {r.authorEmail && (
                    <p className="text-xs text-muted-foreground">{r.authorEmail}</p>
                  )}
                </div>
              </div>
              <div className="flex">
                {Array.from({ length: r.rating }).map((_, i) => (
                  <Star key={i} className="h-4 w-4 fill-warning text-warning" />
                ))}
              </div>
            </div>
            {r.comment && <p className="mt-2 text-sm text-foreground/90">{r.comment}</p>}
            {r.image_url && (
              <img src={r.image_url} alt="" className="mt-2 max-h-48 rounded-xl object-cover" />
            )}
            <p className="mt-2 text-xs text-muted-foreground">
              {new Date(r.created_at).toLocaleDateString()}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}
