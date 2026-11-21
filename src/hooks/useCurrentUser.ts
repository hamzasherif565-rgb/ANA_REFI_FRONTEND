import { useEffect, useState } from "react";
import type { User } from "@/integrations/api/client";
import { backend } from "@/integrations/api/client";

export function useCurrentUser() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    const { data: sub } = backend.auth.onChange((_e, s) => {
      setUser(s?.user ?? null);
      setLoading(false);
    });
    backend.auth.currentSession().then(({ data }) => {
      setUser(data.session?.user ?? null);
      setLoading(false);
    });
    return () => sub.subscription.unsubscribe();
  }, []);
  return { user, loading };
}
