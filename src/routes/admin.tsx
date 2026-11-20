import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Shield, Star, Ban, CheckCircle2, XCircle, BadgeDollarSign, ClipboardCheck } from "lucide-react";
import { backend } from "@/integrations/api/client";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import type { Tables } from "@/integrations/api/types";
import { qk } from "@/lib/queryKeys";
import { AdminVolunteers } from "@/components/volunteers/AdminVolunteers";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { Link } from "@tanstack/react-router";
import { SignOutButton } from "@/components/SignOutButton";


export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [
      { title: "Admin — ANA Refi" },
      { name: "description", content: "Admin controls: feature listings and moderate users." },
      { property: "og:title", content: "Admin — ANA Refi" },
      { property: "og:description", content: "ANA Refi admin controls." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AdminPage,
});

function AdminPage() {
  const qc = useQueryClient();
  const { user, loading: userLoading } = useCurrentUser();

  const { data: isAdmin, isLoading: rolesLoading } = useQuery({
    queryKey: ["admin-role", user?.id ?? "anon"],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await backend
        .resource("user_roles").select("role").eq("user_id", user!.id).eq("role", "admin").maybeSingle();
      if (error) throw error;
      return !!data;
    },
  });

  const gateLoading = userLoading || (!!user && rolesLoading);


  const { data: profiles = [] } = useQuery({
    queryKey: qk.profiles.all,
    queryFn: async () => {
      const { data, error } = await backend.resource("profiles").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  const { data: listings = [] } = useQuery({
    queryKey: qk.listings.all,
    queryFn: async () => {
      const { data, error } = await backend.resource("listings").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  const { data: competitions = [] } = useQuery({
    queryKey: ["admin", "competitions"],
    enabled: !!user && !!isAdmin,
    queryFn: async () => {
      const { data, error } = await backend.resource("competitions").select("*").order("starts_at", { ascending: true });
      if (error) throw error;
      return data ?? [];
    },
  });

  const { data: verifications = [] } = useQuery({
    queryKey: ["admin", "host-verifications"],
    enabled: !!user && !!isAdmin,
    queryFn: async () => {
      const { data, error } = await backend.resource("host_verifications").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  const moderationMutation = useMutation({
    mutationFn: async ({ table, id, status }: { table: "listings" | "host_verifications" | "competitions"; id: string; status: string }) => {
      const { error } = await backend.resource(table).update({ status }).eq("id", id);
      if (error) throw error;
      return table;
    },
    onSuccess: (table) => {
      toast.success("Status updated");
      qc.invalidateQueries({ queryKey: table === "listings" ? qk.listings.all : ["admin", table] });
    },
    onError: (e) => toast.error((e as Error).message),
  });

  const { data: phones = {} } = useQuery({
    queryKey: qk.userContacts.all,
    queryFn: async () => {
      const { data } = await backend.resource("user_contacts").select("user_id, phone");
      const map: Record<string, string> = {};
      (data ?? []).forEach((r) => { if (r.phone) map[r.user_id] = r.phone; });
      return map;
    },
  });

  const featureMutation = useMutation({
    mutationFn: async (l: Tables<"listings">) => {
      const featuredNow = listings.filter((x) => x.is_featured && x.type === "product").length;
      if (!l.is_featured && l.type === "product" && featuredNow >= 3) {
        throw new Error("Max 3 featured products");
      }
      const { error } = await backend.resource("listings").update({ is_featured: !l.is_featured }).eq("id", l.id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.listings.all }),
    onError: (e) => toast.error((e as Error).message),
  });

  const { data: requests = [] } = useQuery({
    queryKey: qk.featureRequests.all,
    queryFn: async () => {
      const { data, error } = await backend
        .resource("feature_requests").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  const decideMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: "approved" | "rejected" }) => {
      const { error } = await backend.resource("feature_requests").update({ status }).eq("id", id);
      if (error) throw error;
      return status;
    },
    onSuccess: (status) => {
      toast.success(status === "approved" ? "Approved — product is now featured" : "Rejected");
      qc.invalidateQueries({ queryKey: qk.featureRequests.all });
      qc.invalidateQueries({ queryKey: qk.listings.all });
    },
    onError: (e) => toast.error((e as Error).message),
  });

  const blockMutation = useMutation({
    mutationFn: async (p: Tables<"profiles">) => {
      const { error } = await backend.resource("profiles").update({ is_blocked: !p.is_blocked }).eq("id", p.id);
      if (error) throw error;
      return p.is_blocked;
    },
    onSuccess: (wasBlocked) => {
      toast.success(wasBlocked ? "Unblocked" : "Blocked");
      qc.invalidateQueries({ queryKey: qk.profiles.all });
    },
    onError: (e) => toast.error((e as Error).message),
  });

  const toggleFeatured = (l: Tables<"listings">) => featureMutation.mutate(l);
  const toggleBlock = (p: Tables<"profiles">) => blockMutation.mutate(p);

  const products = listings.filter((l) => l.type === "product");
  const listingById = new Map(listings.map((l) => [l.id, l]));
  const pendingRequests = requests.filter((r) => r.status === "pending");

  if (gateLoading) {
    return <div className="mx-auto max-w-7xl px-4 py-16 text-sm text-muted-foreground">Checking admin access…</div>;
  }

  if (!user || !isAdmin) {
    return (
      <div className="mx-auto max-w-md px-4 py-20 text-center">
        <Shield className="mx-auto mb-4 h-10 w-10 text-muted-foreground" />
        <h1 className="text-xl font-black text-foreground">Admin access required</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {user
            ? "This account doesn't have the admin role, so moderation actions (approve, reject, block, delete) are blocked by the database."
            : "Sign in with an admin account to manage volunteers, users and featured products."}
        </p>
        {!user && (
          <Link to="/auth" className="mt-6 inline-block">
            <Button className="rounded-xl">Sign in</Button>
          </Link>
        )}
      </div>
    );
  }

  return (

    <div className="mx-auto max-w-7xl px-4 pt-6 pb-24 sm:px-6 md:pb-10">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-black text-foreground sm:text-3xl">Admin dashboard</h1>
          <p className="text-sm text-muted-foreground">Feature top products & moderate users.</p>
        </div>
        <SignOutButton />
      </div>

      <section className="mt-8">
        <h2 className="mb-4 flex items-center gap-2 text-lg font-bold"><ClipboardCheck className="h-5 w-5 text-primary" /> Host verification</h2>
        <div className="grid gap-3">
          {verifications.length === 0 && <p className="text-sm text-muted-foreground">No host verification requests.</p>}
          {verifications.map((v) => (
            <div key={v.id} className="flex flex-wrap items-center gap-4 rounded-2xl border border-border bg-card p-3 shadow-card">
              <div className="min-w-0 flex-1">
                <p className="font-bold">{v.first_name} {v.last_name}</p>
                <p className="text-xs text-muted-foreground">National ID ending {v.national_id.slice(-4)} · {v.status}</p>
              </div>
              {v.status === "pending" ? <div className="flex gap-2">
                <Button size="sm" disabled={moderationMutation.isPending} onClick={() => moderationMutation.mutate({ table: "host_verifications", id: v.id, status: "approved" })}><CheckCircle2 className="me-1 h-4 w-4" />Approve</Button>
                <Button size="sm" variant="outline" disabled={moderationMutation.isPending} onClick={() => moderationMutation.mutate({ table: "host_verifications", id: v.id, status: "rejected" })}><XCircle className="me-1 h-4 w-4" />Reject</Button>
              </div> : <span className="text-xs font-bold">{v.status}</span>}
            </div>
          ))}
        </div>
      </section>

      <section className="mt-8">
        <h2 className="mb-4 flex items-center gap-2 text-lg font-bold"><ClipboardCheck className="h-5 w-5 text-primary" /> Listing review</h2>
        <div className="grid gap-3">
          {listings.filter((l) => l.status !== "active").length === 0 && <p className="text-sm text-muted-foreground">No listings waiting for review.</p>}
          {listings.filter((l) => l.status !== "active").map((l) => (
            <div key={l.id} className="flex flex-wrap items-center gap-4 rounded-2xl border border-border bg-card p-3 shadow-card">
              <img src={l.images?.[0] ?? "https://www.sfari.com/wp-content/uploads/2022/05/4-59-1024x683.jpg"} alt="" className="h-16 w-24 rounded-xl object-cover" />
              <div className="min-w-0 flex-1"><p className="truncate font-bold">{l.title}</p><p className="text-xs capitalize text-muted-foreground">{l.type} · {l.status}</p></div>
              <Button size="sm" disabled={moderationMutation.isPending} onClick={() => moderationMutation.mutate({ table: "listings", id: l.id, status: "active" })}><CheckCircle2 className="me-1 h-4 w-4" />Approve</Button>
              {l.status !== "blocked" && <Button size="sm" variant="outline" disabled={moderationMutation.isPending} onClick={() => moderationMutation.mutate({ table: "listings", id: l.id, status: "blocked" })}><XCircle className="me-1 h-4 w-4" />Reject</Button>}
            </div>
          ))}
        </div>
      </section>

      <section className="mt-8">
        <h2 className="mb-4 flex items-center gap-2 text-lg font-bold"><ClipboardCheck className="h-5 w-5 text-primary" /> Competition review</h2>
        <div className="grid gap-3">
          {competitions.filter((c) => c.status === "draft").length === 0 && <p className="text-sm text-muted-foreground">No competitions waiting for review.</p>}
          {competitions.filter((c) => c.status === "draft").map((c) => (
            <div key={c.id} className="flex flex-wrap items-center gap-4 rounded-2xl border border-border bg-card p-3 shadow-card">
              {c.image_url && <img src={c.image_url} alt="" className="h-16 w-24 rounded-xl object-cover" />}
              <div className="min-w-0 flex-1"><p className="truncate font-bold">{c.title}</p><p className="text-xs text-muted-foreground">{c.location} · {c.status}</p></div>
              <Button size="sm" disabled={moderationMutation.isPending} onClick={() => moderationMutation.mutate({ table: "competitions", id: c.id, status: "open" })}><CheckCircle2 className="me-1 h-4 w-4" />Approve</Button>
              <Button size="sm" variant="outline" disabled={moderationMutation.isPending} onClick={() => moderationMutation.mutate({ table: "competitions", id: c.id, status: "cancelled" })}><XCircle className="me-1 h-4 w-4" />Reject</Button>
            </div>
          ))}
        </div>
      </section>

      <section className="mt-8">
        <h2 className="mb-4 flex items-center gap-2 text-lg font-bold">
          <BadgeDollarSign className="h-5 w-5 text-primary" /> Featured product requests
          {pendingRequests.length > 0 && (
            <span className="rounded-full bg-primary px-2 py-0.5 text-xs font-bold text-primary-foreground">{pendingRequests.length} new</span>
          )}
        </h2>
        <div className="grid gap-3">
          {requests.length === 0 && <p className="text-sm text-muted-foreground">No requests yet.</p>}
          {requests.map((r) => {
            const l = listingById.get(r.listing_id);
            return (
              <div key={r.id} className="flex flex-wrap items-center gap-4 rounded-2xl border border-border bg-card p-3 shadow-card">
                <img src={l?.images?.[0] ?? "https://images.unsplash.com/photo-1587049352846-4a222e784d38?auto=format&fit=crop&w=200&q=70"} alt="" className="h-16 w-24 rounded-xl object-cover" />
                <div className="min-w-0 flex-1">
                  <p className="truncate font-bold text-foreground">{l?.title ?? "Deleted product"}</p>
                  <p className="text-xs text-muted-foreground">
                    Paid {Number(r.amount).toLocaleString()} EGP · {r.payment_method} · payment {r.payment_status} · {new Date(r.created_at).toLocaleDateString()}
                  </p>
                </div>
                {r.status === "pending" ? (
                  <div className="flex gap-2">
                    <Button size="sm" className="rounded-xl" disabled={decideMutation.isPending} onClick={() => decideMutation.mutate({ id: r.id, status: "approved" })}>
                      <CheckCircle2 className="me-1 h-4 w-4" />Approve
                    </Button>
                    <Button size="sm" variant="outline" className="rounded-xl text-destructive" disabled={decideMutation.isPending} onClick={() => decideMutation.mutate({ id: r.id, status: "rejected" })}>
                      <XCircle className="me-1 h-4 w-4" />Reject
                    </Button>
                  </div>
                ) : (
                  <span className={`rounded-full px-3 py-1 text-xs font-bold ${r.status === "approved" ? "bg-success/15 text-success" : "bg-destructive/15 text-destructive"}`}>
                    {r.status}
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </section>

      <section className="mt-8">
        <h2 className="mb-4 flex items-center gap-2 text-lg font-bold"><Star className="h-5 w-5 text-warning" /> Featured products (max 3)</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {products.length === 0 && <p className="text-sm text-muted-foreground">No products yet.</p>}
          {products.map((l) => (
            <div key={l.id} className="rounded-2xl border border-border bg-card p-3 shadow-card">
              <img src={l.images?.[0] ?? "https://images.unsplash.com/photo-1587049352846-4a222e784d38?auto=format&fit=crop&w=400&q=70"} alt="" className="h-32 w-full rounded-xl object-cover" />
              <p className="mt-2 truncate font-bold">{l.title}</p>
              <p className="text-xs text-muted-foreground">{Number(l.price).toLocaleString()} EGP</p>
              <Button size="sm" className="mt-2 w-full rounded-xl" variant={l.is_featured ? "default" : "outline"} onClick={() => toggleFeatured(l)}>
                <Star className={`me-1 h-4 w-4 ${l.is_featured ? "fill-current" : ""}`} />
                {l.is_featured ? "Featured" : "Feature"}
              </Button>
            </div>
          ))}
        </div>
      </section>

      <section className="mt-10">
        <h2 className="mb-4 flex items-center gap-2 text-lg font-bold"><Shield className="h-5 w-5" /> Users ({profiles.length})</h2>
        <div className="overflow-x-auto rounded-2xl border border-border bg-card">
          <table className="w-full text-sm">
            <thead className="bg-muted text-muted-foreground">
              <tr>
                <th className="p-3 text-start">Name</th>
                <th className="p-3 text-start">Phone</th>
                <th className="p-3 text-start">Type</th>
                <th className="p-3 text-start">Status</th>
                <th className="p-3 text-end">Action</th>
              </tr>
            </thead>
            <tbody>
              {profiles.map((p) => (
                <tr key={p.id} className="border-t border-border">
                  <td className="p-3 font-semibold">{p.display_name ?? "—"}</td>
                  <td className="p-3 text-muted-foreground">{phones[p.id] ?? "—"}</td>
                  <td className="p-3 capitalize text-muted-foreground">{p.account_type}</td>
                  <td className="p-3">
                    {p.is_blocked
                      ? <span className="rounded-full bg-destructive/15 px-2 py-1 text-xs font-bold text-destructive">Blocked</span>
                      : <span className="rounded-full bg-success/15 px-2 py-1 text-xs font-bold text-success">Active</span>}
                  </td>
                  <td className="p-3 text-end">
                    <Button size="sm" variant="outline" className="rounded-xl" onClick={() => toggleBlock(p)}>
                      {p.is_blocked ? <><CheckCircle2 className="me-1 h-4 w-4" />Unblock</> : <><Ban className="me-1 h-4 w-4" />Block</>}
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <AdminVolunteers />
    </div>
  );
}
