import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CheckCircle2, Lock, Star } from "lucide-react";
import { backend } from "@/integrations/api/client";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { useI18n } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { qk } from "@/lib/queryKeys";
import { api } from "@/integrations/api/client";

export const Route = createFileRoute("/feature/$listingId")({
  validateSearch: (search: Record<string, unknown>) => ({
    featureRequestId:
      typeof search.featureRequestId === "string" ? search.featureRequestId : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Feature your product — ANA Refi" },
      {
        name: "description",
        content:
          "Pay to request your product be featured in the Top 3 section on the ANA Refi home page.",
      },
      { property: "og:title", content: "Feature your product — ANA Refi" },
      {
        property: "og:description",
        content: "Promote your village product to the ANA Refi home page.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: FeaturePaymentPage,
});

function FeaturePaymentPage() {
  const { listingId } = Route.useParams();
  const { locale } = useI18n();
  const ar = locale === "ar";
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { user, loading } = useCurrentUser();
  const { featureRequestId } = Route.useSearch();
  const {
    data: featurePrice,
    isLoading: priceLoading,
    isError: priceError,
    error: priceLoadError,
    refetch: refetchPrice,
  } = useQuery({
    queryKey: ["feature-request-price"],
    queryFn: () =>
      api
        .get<{ data: { amount_egp: number; currency: string } }>("/feature-requests/price")
        .then((r) => r.data),
  });
  const displayPrice = featurePrice?.amount_egp;

  const { data: listing, isLoading } = useQuery({
    queryKey: qk.listings.byId(listingId),
    queryFn: async () => {
      const { data, error } = await backend
        .resource("listings")
        .select("*")
        .eq("id", listingId)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  const paymentStatus = useQuery({
    queryKey: ["feature-payment", featureRequestId],
    enabled: !!featureRequestId,
    refetchInterval: (query) => {
      const status = query.state.data;
      if (!status || status.payment_status === "paid" || status.attempt_status !== "pending")
        return false;
      if (status.attempt_expires_at && new Date(status.attempt_expires_at) <= new Date())
        return false;
      return 4000;
    },
    queryFn: () =>
      api
        .get<{
          data: {
            payment_status: string;
            request_status: string;
            attempt_status: string;
            attempt_expires_at?: string;
            amount_cents: number;
            requires_review: boolean;
          };
        }>(`/feature-requests/${featureRequestId}/payment`)
        .then((r) => r.data),
  });

  const pay = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error(ar ? "سجّل الدخول أولاً" : "Please sign in first");
      const featureRequest = featureRequestId
        ? { data: { id: featureRequestId } }
        : await api.post<{ data: { id: string } }>("/feature-requests", { listing_id: listingId });
      const intent = await api.post<{ data: { checkout_url: string } }>(
        `/feature-requests/${featureRequest.data.id}/payment-intentions`,
      );
      return intent.data.checkout_url;
    },
    onSuccess: (url) => window.location.assign(url),
    onError: (error) => toast.error(error instanceof Error ? error.message : String(error)),
  });

  if (loading || isLoading)
    return (
      <div className="grid min-h-[60vh] place-items-center text-muted-foreground">
        {ar ? "جارٍ التحميل…" : "Loading…"}
      </div>
    );
  if (!listing)
    return (
      <div className="mx-auto grid min-h-[60vh] max-w-md place-items-center px-4 text-center">
        <div>
          <p className="text-muted-foreground">{ar ? "المنتج غير موجود" : "Product not found"}</p>
          <Link to="/host">
            <Button className="mt-4 rounded-xl">{ar ? "لوحة المضيف" : "Host dashboard"}</Button>
          </Link>
        </div>
      </div>
    );

  const title = locale === "en" ? (listing.title_en ?? listing.title) : listing.title;

  if (paymentStatus.data?.payment_status === "paid") {
    return (
      <div className="mx-auto flex min-h-[70vh] max-w-md flex-col items-center justify-center px-4 py-10 text-center">
        <div className="grid h-20 w-20 place-items-center rounded-full bg-success/15 text-success">
          <CheckCircle2 className="h-11 w-11" />
        </div>
        <h1 className="mt-5 text-2xl font-black text-foreground">
          {ar ? "تم إرسال الطلب" : "Request submitted"}
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {ar
            ? paymentStatus.data.requires_review
              ? `تم تحصيل الدفع لكن الطلب يحتاج إلى مراجعة يدوية. لا تعاود الدفع. المنتج: "${title}".`
              : `تم التحقق من الدفع لتمييز "${title}". الطلب الآن لدى الإدارة للمراجعة.`
            : paymentStatus.data.requires_review
              ? `A charge was reported for "${title}" and needs manual review. Do not pay again.`
              : `Payment was verified for "${title}". The request is now awaiting admin review.`}
        </p>
        <Button
          size="lg"
          className="mt-6 w-full rounded-xl"
          onClick={() => navigate({ to: "/host" })}
        >
          {ar ? "عودة للوحة المضيف" : "Back to host dashboard"}
        </Button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-4 pt-6 pb-24 sm:px-6 md:pb-10">
      <h1 className="flex items-center gap-2 text-2xl font-black text-foreground sm:text-3xl">
        <Star className="h-6 w-6 text-warning" /> {ar ? "تمييز المنتج" : "Feature your product"}
      </h1>
      <p className="text-sm text-muted-foreground">
        {ar
          ? "ادفع لعرض منتجك ضمن أفضل 3 منتجات على الصفحة الرئيسية بعد موافقة الإدارة."
          : "Pay to request a Top 3 slot on the home page. An admin reviews and approves your request."}
      </p>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_1.2fr]">
        <aside className="order-2 h-fit rounded-3xl border border-border bg-card p-5 shadow-card lg:order-1">
          <h2 className="text-lg font-black">{ar ? "ملخص الطلب" : "Request summary"}</h2>
          {listing.images?.[0] && (
            <img
              src={listing.images[0]}
              alt={title}
              className="mt-3 h-40 w-full rounded-2xl object-cover"
            />
          )}
          <div className="mt-4 space-y-2 text-sm">
            <div className="flex items-center justify-between gap-3 py-1">
              <span className="text-muted-foreground">{ar ? "المنتج" : "Product"}</span>
              <span className="truncate font-semibold text-foreground">{title}</span>
            </div>
            <div className="flex items-center justify-between gap-3 py-1">
              <span className="text-muted-foreground">{ar ? "المدة" : "Placement"}</span>
              <span className="font-semibold text-foreground">
                {ar ? "أفضل 3 — 30 يومًا" : "Top 3 — 30 days"}
              </span>
            </div>
            <div className="my-2 h-px bg-border" />
            <div className="flex items-center justify-between">
              <span className="font-bold">{ar ? "الإجمالي" : "Total"}</span>
              <span className="text-2xl font-black text-primary">
                {priceLoading
                  ? ar
                    ? "جارٍ التحميل…"
                    : "Loading…"
                  : displayPrice !== undefined
                    ? `${displayPrice.toLocaleString()} ${featurePrice?.currency ?? "EGP"}`
                    : ar
                      ? "غير متاح"
                      : "Unavailable"}
              </span>
            </div>
            {priceError && (
              <p role="alert" className="mt-2 text-sm text-destructive">
                {priceLoadError instanceof Error
                  ? priceLoadError.message
                  : ar
                    ? "تعذر تحميل السعر"
                    : "Could not load the price"}
                <Button variant="outline" size="sm" className="ms-2" onClick={() => void refetchPrice()}>
                  {ar ? "إعادة المحاولة" : "Retry"}
                </Button>
              </p>
            )}
          </div>
        </aside>

        <section className="order-1 rounded-3xl border border-border bg-card p-5 shadow-elevated lg:order-2">
          <h2 className="text-lg font-black">{ar ? "طريقة الدفع" : "Payment method"}</h2>
          <p className="mt-4 rounded-2xl border border-dashed border-border bg-muted/40 p-4 text-sm text-muted-foreground">
            {paymentStatus.data?.attempt_status === "pending"
              ? ar
                ? "الدفع قيد الانتظار؛ ستتحدث الحالة بعد تأكيد بوابة الدفع."
                : "Payment is pending and will update when the provider confirms it."
              : ar
                ? "سيتم الدفع من خلال صفحة Paymob الآمنة. لن تُقبل بيانات البطاقة على هذا الموقع."
                : "Payment is handled on Paymob’s secure checkout. Card details are never entered on this site."}
          </p>
          {paymentStatus.data && (
            <p className="mt-3 text-sm text-muted-foreground">
              {ar ? "حالة الدفع:" : "Payment status:"} {paymentStatus.data.payment_status} ·{" "}
              {ar ? "حالة الطلب:" : "Request status:"} {paymentStatus.data.request_status}
            </p>
          )}
          {paymentStatus.isError && (
            <p role="alert" className="mt-3 text-sm text-destructive">
              {paymentStatus.error instanceof Error
                ? paymentStatus.error.message
                : ar
                  ? "تعذر تحميل حالة الدفع. أعد المحاولة."
                  : "Could not load payment status. Please retry."}
              <Button variant="outline" size="sm" className="ms-2" onClick={() => void paymentStatus.refetch()}>
                {ar ? "إعادة المحاولة" : "Retry"}
              </Button>
            </p>
          )}
          {(paymentStatus.data?.attempt_status !== "pending" ||
            (paymentStatus.data.attempt_expires_at &&
              new Date(paymentStatus.data.attempt_expires_at) < new Date())) && (
            <Button
              type="button"
              size="lg"
              disabled={pay.isPending || displayPrice === undefined}
              className="mt-6 w-full rounded-xl"
              onClick={() => pay.mutate()}
            >
              <Lock className="me-1 h-4 w-4" />
              {pay.isPending
                ? ar
                  ? "جارٍ فتح الدفع الآمن…"
                  : "Opening secure checkout…"
                : ar
                  ? displayPrice === undefined
                    ? "جارٍ تحميل السعر…"
                    : `ادفع ${displayPrice} جنيه واطلب التمييز`
                  : displayPrice === undefined
                    ? "Loading price…"
                    : `Pay ${displayPrice} ${featurePrice?.currency ?? "EGP"} & request feature`}
            </Button>
          )}
        </section>
      </div>
    </div>
  );
}
