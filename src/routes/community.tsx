import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Users, MessageCircle } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { backend } from "@/integrations/api/client";
import type { Tables } from "@/integrations/api/types";
import { qk } from "@/lib/queryKeys";
import { VolunteerSection } from "@/components/volunteers/VolunteerSection";
import { UserAvatar } from "@/components/UserAvatar";

export const Route = createFileRoute("/community")({
  head: () => ({
    meta: [
      { title: "Community — ANA Refi" },
      {
        name: "description",
        content:
          "Meet the artisans, hosts, and travelers who make ANA Refi's rural Egypt come alive.",
      },
      { property: "og:title", content: "Community — ANA Refi" },
      {
        property: "og:description",
        content: "Meet the artisans, hosts, and travelers of rural Egypt.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: CommunityPage,
});

type PostWithAuthor = Tables<"community_posts"> & {
  author_name: string;
  author_avatar: string | null;
  author_email: string | null;
};

function CommunityPage() {
  const { t, locale } = useI18n();
  const {
    data: posts = [],
    isLoading: loading,
    error,
  } = useQuery({
    queryKey: qk.community.posts,
    queryFn: async (): Promise<PostWithAuthor[]> => {
      const { data, error } = await backend
        .resource("community_posts")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(60);
      if (error) throw error;
      const rows = data ?? [];
      const ids = Array.from(new Set(rows.map((r) => r.user_id)));
      const { data: profiles } = ids.length
        ? await backend
            .resource("profiles")
            .select("id, display_name, avatar_url, email")
            .in("id", ids)
        : {
            data: [] as {
              id: string;
              display_name: string | null;
              avatar_url: string | null;
              email: string | null;
            }[],
          };
      const map = new Map((profiles ?? []).map((p) => [p.id, p]));
      return rows.map((r) => ({
        ...r,
        author_name: map.get(r.user_id)?.display_name ?? "Guest",
        author_avatar: map.get(r.user_id)?.avatar_url ?? null,
        author_email: map.get(r.user_id)?.email ?? null,
      }));
    },
  });

  return (
    <div className="mx-auto max-w-7xl px-4 pt-8 pb-24 sm:px-6 md:pb-10">
      <header className="mb-8 flex items-center gap-3">
        <div className="grid h-12 w-12 place-items-center rounded-2xl bg-gradient-primary text-primary-foreground shadow-soft">
          <Users className="h-6 w-6" />
        </div>
        <div>
          <h1 className="text-2xl font-black text-foreground sm:text-3xl">
            {t("community.title")}
          </h1>
          <p className="text-sm text-muted-foreground">{t("community.subtitle")}</p>
        </div>
      </header>

      {loading ? (
        <div className="grid place-items-center rounded-2xl border border-dashed border-border bg-card/50 p-12 text-center text-sm text-muted-foreground">
          {t("common.loading")}
        </div>
      ) : error ? (
        <div className="grid place-items-center rounded-2xl border border-dashed border-destructive/40 bg-destructive/5 p-12 text-center text-sm text-destructive">
          {(error as Error).message}
        </div>
      ) : posts.length === 0 ? (
        <div className="grid place-items-center rounded-2xl border border-dashed border-border bg-card/50 p-12 text-center text-sm text-muted-foreground">
          <MessageCircle className="mb-3 h-10 w-10 text-muted-foreground" />
          {locale === "ar" ? "لا توجد منشورات بعد" : "No posts yet"}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {posts.map((p) => (
            <article
              key={p.id}
              className="overflow-hidden rounded-2xl border border-border bg-card shadow-card"
            >
              {p.image_url && (
                <div className="aspect-[4/3] overflow-hidden bg-muted">
                  <img
                    src={p.image_url}
                    alt=""
                    loading="lazy"
                    className="h-full w-full object-cover"
                  />
                </div>
              )}
              <div className="p-4">
                <div className="mb-3 flex items-center gap-2">
                  <UserAvatar name={p.author_name} src={p.author_avatar} size="md" />
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-foreground">{p.author_name}</p>
                    {p.author_email && (
                      <p className="truncate text-[11px] text-muted-foreground">{p.author_email}</p>
                    )}
                    <p className="text-[11px] text-muted-foreground">
                      {new Date(p.created_at).toLocaleDateString(
                        locale === "ar" ? "ar-EG" : "en-GB",
                      )}
                    </p>
                  </div>
                </div>
                {p.title && <h3 className="font-bold text-foreground">{p.title}</h3>}
                <p className="mt-1 whitespace-pre-line text-sm text-muted-foreground">{p.body}</p>
              </div>
            </article>
          ))}
        </div>
      )}

      <VolunteerSection />
    </div>
  );
}
