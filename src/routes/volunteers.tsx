import { createFileRoute, redirect } from "@tanstack/react-router";

/** Volunteers now live inside the Community page. */
export const Route = createFileRoute("/volunteers")({
  beforeLoad: () => {
    throw redirect({ to: "/community", hash: "volunteers", replace: true });
  },
});
