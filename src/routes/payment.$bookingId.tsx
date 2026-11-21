import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Calendar, Users } from "lucide-react";
import { backend } from "@/integrations/api/client";
import { useI18n } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import { qk } from "@/lib/queryKeys";
import { api } from "@/integrations/api/client";
import { toast } from "sonner";

export const Route = createFileRoute("/payment/$bookingId")({
  head: () => ({
    meta: [
      { title: "Secure payment — ANA Refi" },
      {
        name: "description",
        content: "Review your booking summary and check its confirmation status.",
      },
      { property: "og:title", content: "Secure payment — ANA Refi" },
      { property: "og:description", content: "Review your ANA Refi booking status." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: PaymentPage,
});

function PaymentPage() {
  const { bookingId } = Route.useParams();
  const { locale } = useI18n();
  const ar = locale === "ar";
  const navigate = useNavigate();
  const qc = useQueryClient();

  const {
    data: booking,
    isLoading,
    isError: bookingError,
    error: bookingLoadError,
  } = useQuery({
    queryKey: ["booking", bookingId],
    queryFn: async () => {
      const { data, error } = await backend
        .resource("bookings")
        .select("*")
        .eq("id", bookingId)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  const { data: item } = useQuery({
    queryKey: qk.listings.byId(booking?.listing_id ?? booking?.item_id ?? "none"),
    enabled: !!booking,
    queryFn: async () => {
      const lid = booking?.listing_id ?? booking?.item_id;
      if (!lid) return null;
      if (booking?.item_type === "competition") {
        const { data } = await backend
          .resource("competitions")
          .select("id, title, title_en, image_url")
          .eq("id", lid)
          .maybeSingle();
        return data ? { ...data, images: data.image_url ? [data.image_url] : [] } : null;
      }
      const { data } = await backend
        .resource("listings")
        .select("id, title, title_en, images")
        .eq("id", lid)
        .maybeSingle();
      return data;
    },
  });

  const paymentQuery = useQuery({
    queryKey: ["booking-payment", bookingId],
    enabled: !!booking,
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
            booking_status: string;
            payment_status: string;
            attempt_status: string;
            amount_cents: number;
            currency: string;
            attempt_expires_at?: string;
            requires_review: boolean;
          };
        }>(`/bookings/${bookingId}/payment`)
        .then((r) => r.data),
  });

  const checkout = useMutation({
    mutationFn: () =>
      api.post<{ data: { checkout_url: string } }>(`/bookings/${bookingId}/payment-intentions`),
    onSuccess: (result) => {
      window.location.assign(result.data.checkout_url);
    },
    onError: (error) => toast.error(error instanceof Error ? error.message : String(error)),
  });

  if (isLoading)
    return (
      <div className="grid min-h-[60vh] place-items-center text-muted-foreground">
        {ar ? "جارٍ التحميل…" : "Loading…"}
      </div>
    );
  if (bookingError || !booking)
    return (
      <div className="mx-auto grid min-h-[60vh] max-w-md place-items-center px-4 text-center">
        <div>
          <p className="text-muted-foreground">
            {bookingError
              ? bookingLoadError instanceof Error
                ? bookingLoadError.message
                : ar
                  ? "تعذر تحميل الحجز. سجّل الدخول أو أعد المحاولة."
                  : "Could not load the booking. Sign in or try again."
              : ar
                ? "الحجز غير موجود"
                : "Booking not found"}
          </p>
          <Link to={bookingError ? "/auth" : "/dashboard"}>
            <Button className="mt-4 rounded-xl">
              {bookingError
                ? ar
                  ? "تسجيل الدخول"
                  : "Sign in"
                : ar
                  ? "لوحة التحكم"
                  : "Go to dashboard"}
            </Button>
          </Link>
        </div>
      </div>
    );

  const title = item
    ? locale === "en"
      ? (item.title_en ?? item.title)
      : item.title
    : ar
      ? "حجز"
      : "Booking";

  return (
    <div className="mx-auto max-w-5xl px-4 pt-6 pb-24 sm:px-6 md:pb-10">
      <h1 className="text-2xl font-black text-foreground sm:text-3xl">
        {ar ? "الدفع" : "Checkout"}
      </h1>
      <p className="text-sm text-muted-foreground">
        {ar ? "راجع تفاصيل حجزك ثم أكمل الدفع." : "Review your booking, then complete the payment."}
      </p>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_1.2fr]">
        {/* Summary */}
        <aside className="order-2 h-fit rounded-3xl border border-border bg-card p-5 shadow-card lg:order-1">
          <h2 className="text-lg font-black">{ar ? "ملخص الحجز" : "Booking summary"}</h2>
          {item?.images?.[0] && (
            <img
              src={item.images[0]}
              alt={title}
              className="mt-3 h-40 w-full rounded-2xl object-cover"
            />
          )}
          <div className="mt-4 space-y-2 text-sm">
            <Row label={ar ? "التجربة المختارة" : "Selected experience"} value={title} />
            <Row
              label={ar ? "التاريخ" : "Date"}
              value={
                booking.booking_date ? new Date(booking.booking_date).toLocaleDateString() : "—"
              }
              Icon={Calendar}
            />
            <Row
              label={ar ? "عدد الضيوف" : "Number of guests"}
              value={String(booking.guests)}
              Icon={Users}
            />
            <div className="my-2 h-px bg-border" />
            <div className="flex items-center justify-between">
              <span className="font-bold">{ar ? "الإجمالي" : "Total price"}</span>
              <span className="text-2xl font-black text-primary">
                {Number(booking.amount).toLocaleString()} EGP
              </span>
            </div>
          </div>
        </aside>

        {/* Payment */}
        <section className="order-1 rounded-3xl border border-border bg-card p-5 shadow-elevated lg:order-2">
          <h2 className="text-lg font-black">{ar ? "طريقة الدفع" : "Payment method"}</h2>
          <p className="mt-3 rounded-2xl border border-border bg-muted/40 p-4 text-sm text-muted-foreground">
            {ar ? "حالة الدفع:" : "Payment status:"}{" "}
            {paymentQuery.data?.payment_status ??
              (paymentQuery.isLoading
                ? ar
                  ? "جارٍ التحميل"
                  : "Loading"
                : ar
                  ? "غير مدفوع"
                  : "Unpaid")}
            <br />
            {ar ? "حالة الحجز:" : "Booking status:"}{" "}
            {paymentQuery.data?.booking_status ?? booking.status}
          </p>
          {paymentQuery.isError && (
            <p role="alert" className="mt-3 text-sm text-destructive">
              {paymentQuery.error instanceof Error
                ? paymentQuery.error.message
                : ar
                  ? "تعذر تحميل حالة الدفع. أعد المحاولة."
                  : "Could not load payment status. Please retry."}
              <Button
                variant="outline"
                size="sm"
                className="ms-2"
                onClick={() => void paymentQuery.refetch()}
              >
                {ar ? "إعادة المحاولة" : "Retry"}
              </Button>
            </p>
          )}
          {paymentQuery.data?.payment_status === "paid" &&
          !paymentQuery.data.requires_review &&
          paymentQuery.data.booking_status === "confirmed" ? (
            <p className="mt-4 rounded-2xl border border-success/30 bg-success/10 p-4 text-sm font-semibold text-success">
              {ar ? "تم التحقق من الدفع وتأكيد الحجز." : "Payment verified and booking confirmed."}
            </p>
          ) : paymentQuery.data?.payment_status === "paid" ? (
            <p className="mt-4 rounded-2xl border border-warning/30 bg-warning/10 p-4 text-sm font-semibold text-warning">
              {ar
                ? "أبلغت بوابة الدفع عن تحصيل المبلغ؛ نراجع حالة الحجز يدويًا. لا تُعد الدفع."
                : "The provider reported a charge; this booking needs manual review. Do not pay again."}
            </p>
          ) : paymentQuery.data?.payment_status === "pending" &&
            paymentQuery.data.attempt_expires_at &&
            new Date(paymentQuery.data.attempt_expires_at) > new Date() ? (
            <p className="mt-4 rounded-2xl border border-dashed border-border bg-muted/40 p-4 text-sm text-muted-foreground">
              {ar
                ? "عملية الدفع قيد الانتظار. ستتحدث الحالة تلقائيًا بعد تأكيد بوابة الدفع."
                : "Payment is pending. This status will refresh after the provider confirms it."}
            </p>
          ) : (
            <>
              <p className="mt-4 rounded-2xl border border-dashed border-border bg-muted/40 p-4 text-sm text-muted-foreground">
                {ar
                  ? "سيتم الدفع عبر صفحة Paymob الآمنة. لا تدخل بيانات بطاقتك في هذا الموقع. لن يتأكد الحجز إلا بعد تحقق الخادم من إشعار الدفع."
                  : "You will pay on Paymob’s secure checkout. Do not enter card details on this site. The booking is confirmed only after the server verifies the payment notification."}
              </p>
              <Button
                size="lg"
                disabled={checkout.isPending || !paymentQuery.data}
                className="mt-6 w-full rounded-xl"
                onClick={() => checkout.mutate()}
              >
                {checkout.isPending
                  ? ar
                    ? "جارٍ التحويل إلى الدفع…"
                    : "Opening secure checkout…"
                  : ar
                    ? `ادفع ${Number(booking.amount).toLocaleString()} جنيه`
                    : `Pay ${Number(booking.amount).toLocaleString()} EGP`}
              </Button>
            </>
          )}
          <Button
            size="lg"
            variant="outline"
            className="mt-3 w-full rounded-xl"
            onClick={() => navigate({ to: "/dashboard" })}
          >
            {ar ? "العودة إلى لوحة التحكم" : "Back to dashboard"}
          </Button>
        </section>
      </div>
    </div>
  );
}

function Row({ label, value, Icon }: { label: string; value: string; Icon?: typeof Calendar }) {
  return (
    <div className="flex items-center justify-between gap-3 py-1">
      <span className="flex items-center gap-1 text-muted-foreground">
        {Icon && <Icon className="h-4 w-4" />} {label}
      </span>
      <span className="truncate font-semibold text-foreground">{value}</span>
    </div>
  );
}
