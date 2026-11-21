import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { CalendarDays, MapPin, Users, HandHeart } from "lucide-react";
import { toast } from "sonner";
import { backend } from "@/integrations/api/client";
import { useI18n } from "@/lib/i18n";
import { qk } from "@/lib/queryKeys";
import { Button } from "@/components/ui/button";

type Mode = "sent" | "received";

/**
 * Volunteer service requests.
 * mode="sent": requests the user made to volunteers.
 * mode="received": requests addressed to the user as a volunteer.
 */
export function VolunteerRequestsPanel({ userId, mode }: { userId: string; mode: Mode }) {
  const { locale } = useI18n();
  const ar = locale === "ar";
  const qc = useQueryClient();
  const column = mode === "sent" ? "requester_id" : "volunteer_user_id";

  const { data: rows = [], isLoading } = useQuery({
    queryKey:
      mode === "sent"
        ? qk.volunteerServiceRequests.byRequester(userId)
        : qk.volunteerServiceRequests.byVolunteer(userId),
    queryFn: async () => {
      const { data, error } = await backend
        .resource("volunteer_service_requests")
        .select("*, volunteer:volunteer_requests(full_name, avatar_url)")
        .eq(column, userId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  const update = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { error } = await backend
        .resource("volunteer_service_requests")
        .update({ status })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qk.volunteerServiceRequests.all });
      toast.success(ar ? "تم تحديث الطلب" : "Request updated");
    },
    onError: (e) => toast.error((e as Error).message),
  });

  if (isLoading)
    return <div className="h-24 animate-pulse rounded-2xl border border-border bg-card" />;
  if (rows.length === 0) {
    return (
      <p className="rounded-2xl border border-dashed border-border bg-card/50 p-8 text-center text-sm text-muted-foreground">
        {mode === "sent"
          ? ar
            ? "لم ترسل أي طلبات تطوع بعد"
            : "You haven't requested a volunteer yet"
          : ar
            ? "لا توجد طلبات واردة"
            : "No incoming volunteer requests"}
      </p>
    );
  }

  return (
    <div className="space-y-3">
      {rows.map((r) => {
        const vol = (r as { volunteer?: { full_name?: string } | null }).volunteer;
        return (
          <div key={r.id} className="rounded-2xl border border-border bg-card p-4 shadow-card">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <p className="flex items-center gap-2 font-bold text-foreground">
                  <HandHeart className="h-4 w-4 text-primary" />
                  {mode === "sent"
                    ? (vol?.full_name ?? (ar ? "متطوع" : "Volunteer"))
                    : r.reason.slice(0, 60)}
                </p>
                <p className="mt-1 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <CalendarDays className="h-3 w-3" />
                    {r.requested_date}
                    {r.requested_time ? ` · ${r.requested_time}` : ""}
                  </span>
                  <span className="flex items-center gap-1">
                    <MapPin className="h-3 w-3" />
                    {r.location}
                  </span>
                  <span className="flex items-center gap-1">
                    <Users className="h-3 w-3" />
                    {r.people_count}
                  </span>
                </p>
              </div>
              <span
                className={`rounded-full px-3 py-1 text-xs font-bold capitalize ${
                  r.status === "accepted"
                    ? "bg-primary/10 text-primary"
                    : r.status === "declined" || r.status === "cancelled"
                      ? "bg-destructive/10 text-destructive"
                      : "bg-muted text-muted-foreground"
                }`}
              >
                {r.status}
              </span>
            </div>
            {mode === "received" && (
              <p className="mt-2 whitespace-pre-line text-sm text-muted-foreground">{r.reason}</p>
            )}
            {r.notes && <p className="mt-1 text-xs text-muted-foreground">{r.notes}</p>}

            <div className="mt-3 flex flex-wrap gap-2">
              {mode === "received" && r.status === "pending" && (
                <>
                  <Button size="sm" onClick={() => update.mutate({ id: r.id, status: "accepted" })}>
                    {ar ? "قبول" : "Accept"}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => update.mutate({ id: r.id, status: "declined" })}
                  >
                    {ar ? "رفض" : "Decline"}
                  </Button>
                </>
              )}
              {mode === "received" && r.status === "accepted" && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => update.mutate({ id: r.id, status: "completed" })}
                >
                  {ar ? "تم الإنجاز" : "Mark completed"}
                </Button>
              )}
              {mode === "sent" && (r.status === "pending" || r.status === "accepted") && (
                <Button
                  size="sm"
                  variant="ghost"
                  className="text-destructive"
                  onClick={() => update.mutate({ id: r.id, status: "cancelled" })}
                >
                  {ar ? "إلغاء" : "Cancel"}
                </Button>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
