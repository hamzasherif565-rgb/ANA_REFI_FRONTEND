import { useCallback } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { backend } from "@/integrations/api/client";
import { useCurrentUser } from "./useCurrentUser";
import { qk } from "@/lib/queryKeys";
import type { Tables } from "@/integrations/api/types";

export type ItemType = Tables<"favorites">["item_type"];

export function useFavorites() {
  const { user } = useCurrentUser();
  const qc = useQueryClient();

  const {
    data: rows = [],
    isLoading: loading,
    refetch,
  } = useQuery({
    queryKey: user ? qk.favorites.byUser(user.id) : ["favorites", "anon"],
    queryFn: async () => {
      if (!user) return [] as Tables<"favorites">[];
      const { data, error } = await backend
        .resource("favorites")
        .select("*")
        .eq("user_id", user.id);
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!user,
  });

  const mutation = useMutation({
    mutationFn: async ({ itemId, itemType }: { itemId: string; itemType: ItemType }) => {
      if (!user) throw new Error("Not signed in");
      const existing = rows.find((r) => r.item_id === itemId && r.item_type === itemType);
      if (existing) {
        const { error } = await backend.resource("favorites").delete().eq("id", existing.id);
        if (error) throw error;
        return false;
      }
      const { error } = await backend
        .resource("favorites")
        .insert({ user_id: user.id, item_id: itemId, item_type: itemType });
      if (error) throw error;
      return true;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qk.favorites.all });
    },
  });

  const has = useCallback(
    (itemId: string, itemType: ItemType) =>
      rows.some((r) => r.item_id === itemId && r.item_type === itemType),
    [rows],
  );

  const toggle = useCallback(
    (itemId: string, itemType: ItemType) => mutation.mutateAsync({ itemId, itemType }),
    [mutation],
  );

  return { rows, has, toggle, refresh: refetch, loading, signedIn: !!user };
}
