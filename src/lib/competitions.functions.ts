import { createServerFn } from "@tanstack/react-start";
import type { Tables } from "@/integrations/api/types";

const apiBase = (process.env.API_BASE_URL || process.env.VITE_API_BASE_URL || "https://ana-refi-backend.ethiodeploy.app/api/v1").replace(/\/$/, "");

export const listCompetitions = createServerFn({ method: "GET" }).handler(async () => {
  const response = await fetch(`${apiBase}/competitions?per_page=100`, { headers: { Accept: "application/json" } });
  if (!response.ok) throw new Error(`Could not load competitions (${response.status})`);
  const result = await response.json() as { data?: Tables<"competitions">[] };
  return result.data ?? [];
});
