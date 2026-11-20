import { useEffect } from "react";
import { useNavigate, useRouterState } from "@tanstack/react-router";
import { useProfile } from "@/hooks/useProfile";

/**
 * Global gate: after login, if the user hasn't picked Traveler/Host yet
 * (Google first-time sign-in), send them to /onboarding/role.
 * Admins & already-picked users are untouched.
 */
export function RoleGate() {
  const { profile, loading } = useProfile();
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  useEffect(() => {
    if (loading || !profile) return;
    if (profile.role_selected) return;
    if (profile.account_type === "admin") return;
    // Allow these routes without picking
    const allow = ["/onboarding/role", "/auth", "/signup", "/admin"];
    if (allow.some((p) => pathname.startsWith(p))) return;
    navigate({ to: "/onboarding/role", replace: true });
  }, [profile, loading, pathname, navigate]);

  return null;
}