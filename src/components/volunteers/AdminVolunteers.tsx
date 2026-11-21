import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { HandHeart, Search, CheckCircle2, XCircle, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { backend } from "@/integrations/api/client";
import { qk } from "@/lib/queryKeys";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { UserAvatar } from "@/components/UserAvatar";
import type { VolunteerRow } from "./VolunteerApplyDialog";

const STATUSES = ["all", "pending", "approved", "rejected"] as const;

/** Admin moderation for volunteer applications. */
export function AdminVolunteers() {
  const qc = useQueryClient();
  const [status, setStatus] = useState<(typeof STATUSES)[number]>("pending");
  const [q, setQ] = useState("");
  const [openId, setOpenId] = useState<string | null>(null);

  const { data: rows = [], isLoading } = useQuery({
    queryKey: qk.volunteers.all,
    queryFn: async () => {
      const { data, error } = await backend
        .resource("volunteer_requests")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  const setStatusMutation = useMutation({
    mutationFn: async ({ id, next }: { id: string; next: string }) => {
      const { error } = await backend
        .resource("volunteer_requests")
        .update({ status: next })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qk.volunteers.all });
      toast.success("Volunteer application updated");
    },
    onError: (e) => toast.error((e as Error).message),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await backend.resource("volunteer_requests").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qk.volunteers.all });
      toast.success("Application deleted");
    },
    onError: (e) => toast.error((e as Error).message),
  });

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    return rows.filter((r: VolunteerRow) => {
      if (status !== "all" && r.status !== status) return false;
      if (!term) return true;
      return [r.full_name, r.email, r.phone, r.location, ...(r.skills ?? [])]
        .filter(Boolean)
        .some((f) => String(f).toLowerCase().includes(term));
    });
  }, [rows, status, q]);

  return (
    <section className="mt-10">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h2 className="flex items-center gap-2 text-xl font-black">
          <HandHeart className="h-5 w-5 text-primary" /> Volunteer management
        </h2>
        <div className="relative w-full sm:w-64">
          <Search className="pointer-events-none absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search volunteers"
            className="ps-9"
          />
        </div>
      </div>

      <div className="mb-4 flex flex-wrap gap-2">
        {STATUSES.map((s) => (
          <button
            key={s}
            onClick={() => setStatus(s)}
            className={`rounded-full px-4 py-1.5 text-sm font-bold capitalize transition-colors ${
              status === s
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground hover:bg-accent"
            }`}
          >
            {s} ({s === "all" ? rows.length : rows.filter((r) => r.status === s).length})
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="h-24 animate-pulse rounded-2xl border border-border bg-card" />
      ) : filtered.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-border bg-card/50 p-8 text-center text-sm text-muted-foreground">
          No volunteer applications here.
        </p>
      ) : (
        <div className="space-y-3">
          {filtered.map((v) => (
            <div key={v.id} className="rounded-2xl border border-border bg-card p-4 shadow-card">
              <div className="flex flex-wrap items-start gap-3">
                <UserAvatar name={v.full_name} src={v.avatar_url} size="lg" />
                <div className="min-w-0 flex-1">
                  <p className="font-black text-foreground">{v.full_name}</p>
                  <p className="text-xs text-muted-foreground">
                    {v.email} · {v.phone}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {[v.location, v.age ? `${v.age} yrs` : null, v.interest_area]
                      .filter(Boolean)
                      .join(" · ")}
                  </p>
                </div>
                <span
                  className={`rounded-full px-3 py-1 text-xs font-bold capitalize ${
                    v.status === "approved"
                      ? "bg-primary/10 text-primary"
                      : v.status === "rejected"
                        ? "bg-destructive/10 text-destructive"
                        : "bg-muted text-muted-foreground"
                  }`}
                >
                  {v.status}
                </span>
              </div>

              <button
                onClick={() => setOpenId(openId === v.id ? null : v.id)}
                className="mt-3 text-sm font-bold text-primary underline"
              >
                {openId === v.id ? "Hide details" : "View details"}
              </button>

              {openId === v.id && (
                <dl className="mt-3 grid gap-2 rounded-xl bg-muted/50 p-4 text-sm sm:grid-cols-2">
                  <Detail label="Bio" value={v.bio} />
                  <Detail label="Skills" value={(v.skills ?? []).join(", ")} />
                  <Detail label="Languages" value={(v.languages ?? []).join(", ")} />
                  <Detail label="Availability" value={v.availability} />
                  <Detail label="Experience" value={v.experience} />
                  <Detail label="Motivation" value={v.motivation} />
                  <Detail label="Support needs" value={v.accessibility} />
                  <Detail label="Applied" value={new Date(v.created_at).toLocaleString("en-GB")} />
                </dl>
              )}

              <div className="mt-3 flex flex-wrap gap-2">
                {v.status !== "approved" && (
                  <Button
                    size="sm"
                    onClick={() => setStatusMutation.mutate({ id: v.id, next: "approved" })}
                  >
                    <CheckCircle2 className="me-1.5 h-4 w-4" /> Approve
                  </Button>
                )}
                {v.status !== "rejected" && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setStatusMutation.mutate({ id: v.id, next: "rejected" })}
                  >
                    <XCircle className="me-1.5 h-4 w-4" /> Reject
                  </Button>
                )}
                {v.status !== "pending" && (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setStatusMutation.mutate({ id: v.id, next: "pending" })}
                  >
                    Move to pending
                  </Button>
                )}
                <Button
                  size="sm"
                  variant="ghost"
                  className="text-destructive"
                  onClick={() => remove.mutate(v.id)}
                >
                  <Trash2 className="me-1.5 h-4 w-4" /> Delete
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

function Detail({ label, value }: { label: string; value?: string | null }) {
  if (!value) return null;
  return (
    <div>
      <dt className="text-[11px] font-bold uppercase tracking-wide text-muted-foreground">
        {label}
      </dt>
      <dd className="whitespace-pre-line text-foreground">{value}</dd>
    </div>
  );
}
