import { useEffect, useState, useCallback } from "react";
import { backend } from "@/integrations/api/client";
import { useCurrentUser } from "./useCurrentUser";
import type { Tables } from "@/integrations/api/types";

export type Profile = Tables<"profiles">;

export function useProfile() {
  const { user, loading: authLoading } = useCurrentUser();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!user) {
      setProfile(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    const { data } = await backend
      .resource("profiles")
      .select("*")
      .eq("id", user.id)
      .maybeSingle();
    setProfile(data ?? null);
    setLoading(false);
  }, [user]);

  useEffect(() => {
    if (authLoading) return;
    void refresh();
  }, [authLoading, refresh]);

  return { profile, loading: loading || authLoading, refresh, user };
}