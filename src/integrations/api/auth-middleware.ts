import { createMiddleware } from "@tanstack/react-start";
import { backend } from "./client";

export const attachApiAuth = createMiddleware({ type: "function" }).client(async ({ next }) => {
  const { data } = await backend.auth.currentSession();
  const token = data.session?.access_token;
  return next({ headers: token ? { Authorization: `Bearer ${token}` } : {} });
});
