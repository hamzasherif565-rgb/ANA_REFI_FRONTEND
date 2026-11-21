import { createServerFn } from "@tanstack/react-start";

export type PlatformStats = {
  travelers: number;
  hosts: number;
  bookings: number;
  volunteers: number;
  listings: number;
  competitions: number;
};
const apiBase = (
  process.env.API_BASE_URL ||
  process.env.VITE_API_BASE_URL ||
  "https://ana-refi-backend.ethiodeploy.app/api/v1"
).replace(/\/$/, "");

export const getPlatformStats = createServerFn({ method: "GET" }).handler(
  async (): Promise<PlatformStats> => {
    const response = await fetch(`${apiBase}/stats`, { headers: { Accept: "application/json" } });
    if (!response.ok) throw new Error(`Could not load platform statistics (${response.status})`);
    const result = (await response.json()) as { data: PlatformStats };
    return result.data;
  },
);
