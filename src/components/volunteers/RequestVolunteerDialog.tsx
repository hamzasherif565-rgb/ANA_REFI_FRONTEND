import { useState, type FormEvent } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2, Send, X } from "lucide-react";
import { toast } from "sonner";
import { backend } from "@/integrations/api/client";
import { useI18n } from "@/lib/i18n";
import { qk } from "@/lib/queryKeys";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Field, type VolunteerRow } from "./VolunteerApplyDialog";

export function RequestVolunteerDialog({
  volunteer,
  requesterId,
  onClose,
}: {
  volunteer: VolunteerRow;
  requesterId: string;
  onClose: () => void;
}) {
  const { locale } = useI18n();
  const ar = locale === "ar";
  const qc = useQueryClient();
  const [form, setForm] = useState({
    requested_date: "",
    requested_time: "",
    location: "",
    reason: "",
    people_count: "1",
    notes: "",
  });
  const set = (k: keyof typeof form, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const send = useMutation({
    mutationFn: async () => {
      if (volunteer.user_id === requesterId)
        throw new Error(ar ? "لا يمكنك طلب نفسك" : "You cannot request yourself");
      const people = Number(form.people_count) || 1;
      if (people < 1 || people > 100)
        throw new Error(
          ar ? "عدد الأشخاص يجب أن يكون بين 1 و100" : "Number of people must be between 1 and 100",
        );
      const { error } = await backend.resource("volunteer_service_requests").insert({
        requester_id: requesterId,
        volunteer_id: volunteer.id,
        volunteer_user_id: volunteer.user_id,
        requested_date: form.requested_date,
        requested_time: form.requested_time || null,
        location: form.location.trim(),
        reason: form.reason.trim(),
        people_count: people,
        notes: form.notes.trim() || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qk.volunteerServiceRequests.all });
      toast.success(ar ? "تم إرسال الطلب للمتطوع" : "Request sent to the volunteer");
      onClose();
    },
    onError: (e) => toast.error((e as Error).message),
  });

  function submit(e: FormEvent) {
    e.preventDefault();
    send.mutate();
  }

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-foreground/50 p-4">
      <div className="max-h-[92vh] w-full max-w-lg overflow-y-auto rounded-3xl border border-border bg-card p-6 shadow-elevated">
        <div className="mb-5 flex items-start justify-between gap-3">
          <div>
            <h2 className="text-xl font-black">{ar ? "طلب متطوع" : "Request volunteer"}</h2>
            <p className="text-sm text-muted-foreground">{volunteer.full_name}</p>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose} aria-label="Close">
            <X className="h-4 w-4" />
          </Button>
        </div>
        <form onSubmit={submit} className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label={ar ? "التاريخ" : "Date"}>
              <Input
                required
                type="date"
                value={form.requested_date}
                onChange={(e) => set("requested_date", e.target.value)}
              />
            </Field>
            <Field label={ar ? "الوقت" : "Time"}>
              <Input
                type="time"
                value={form.requested_time}
                onChange={(e) => set("requested_time", e.target.value)}
              />
            </Field>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label={ar ? "الموقع" : "Location"}>
              <Input
                required
                maxLength={160}
                value={form.location}
                onChange={(e) => set("location", e.target.value)}
              />
            </Field>
            <Field label={ar ? "عدد الأشخاص" : "Number of people"}>
              <Input
                required
                type="number"
                min={1}
                max={100}
                value={form.people_count}
                onChange={(e) => set("people_count", e.target.value)}
              />
            </Field>
          </div>
          <Field label={ar ? "السبب / النشاط" : "Reason / activity"}>
            <Textarea
              required
              rows={3}
              maxLength={800}
              value={form.reason}
              onChange={(e) => set("reason", e.target.value)}
            />
          </Field>
          <Field label={ar ? "ملاحظات إضافية" : "Additional notes"}>
            <Textarea
              rows={2}
              maxLength={500}
              value={form.notes}
              onChange={(e) => set("notes", e.target.value)}
            />
          </Field>
          <Button type="submit" size="lg" disabled={send.isPending} className="w-full rounded-xl">
            {send.isPending ? (
              <Loader2 className="me-2 h-5 w-5 animate-spin" />
            ) : (
              <Send className="me-2 h-5 w-5" />
            )}
            {ar ? "إرسال الطلب" : "Send request"}
          </Button>
        </form>
      </div>
    </div>
  );
}
