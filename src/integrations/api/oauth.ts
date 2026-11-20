import { apiBaseUrl } from "./client";

/** Start Google OAuth through Laravel; Google's client secret remains server-side. */
export function redirectToGoogle(redirectUri: string) {
  const url = new URL(`${apiBaseUrl}/auth/google/redirect`);
  url.searchParams.set("redirect_uri", redirectUri);
  window.location.assign(url.toString());
}
