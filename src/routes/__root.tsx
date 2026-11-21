import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
  type ErrorComponentProps,
  useNavigate,
} from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";

import appCss from "../styles.css?url";
import { reportLovableError } from "../lib/lovable-error-reporting";
import { I18nProvider } from "../lib/i18n";
import { ThemeProvider } from "../lib/theme";
import { AppNavbar } from "../components/AppNavbar";
import { ChatWidget } from "../components/ChatWidget";
import { Footer } from "../components/Footer";
import { RoleGate } from "../components/RoleGate";
import { Toaster } from "../components/ui/sonner";
import { backend } from "@/integrations/api/client";
import { toast } from "sonner";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-foreground">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-foreground">Page not found</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Go home
          </Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: ErrorComponentProps) {
  console.error(error);
  const router = useRouter();
  useEffect(() => {
    reportLovableError(error, { boundary: "tanstack_root_error_component" });
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold tracking-tight text-foreground">
          This page didn't load
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Something went wrong on our end. You can try refreshing or head back home.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Try again
          </button>
          <a
            href="/"
            className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent"
          >
            Go home
          </a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "ANA Refi — From Village to the World" },
      {
        name: "description",
        content: "Rural stays, experiences, products, and competitions across Egypt.",
      },
      { name: "author", content: "ANA Refi" },
      { property: "og:title", content: "ANA Refi — From Village to the World" },
      {
        property: "og:description",
        content: "Rural stays, experiences, products, and competitions across Egypt.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: "ANA Refi — From Village to the World" },
      {
        name: "twitter:description",
        content: "Rural stays, experiences, products, and competitions across Egypt.",
      },
      {
        property: "og:image",
        content:
          "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/0a9e133b-e55d-45c4-9b50-d2e956853dca/id-preview-a40ef4ff--bdd22332-46b2-48b2-8125-505727f48fd7.lovable.app-1784973139323.png",
      },
      {
        name: "twitter:image",
        content:
          "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/0a9e133b-e55d-45c4-9b50-d2e956853dca/id-preview-a40ef4ff--bdd22332-46b2-48b2-8125-505727f48fd7.lovable.app-1784973139323.png",
      },
    ],
    links: [
      {
        rel: "stylesheet",
        href: appCss,
      },
      { rel: "icon", href: "/favicon.png", type: "image/png" },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;800&family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap",
      },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="ar" dir="rtl">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  const navigate = useNavigate();

  useEffect(() => {
    const url = new URL(window.location.href);
    const oauthError = url.searchParams.get("oauth_error");
    if (oauthError) {
      url.searchParams.delete("oauth_error");
      window.history.replaceState(null, "", `${url.pathname}${url.search}${url.hash}`);
      const oauthErrorMessages: Record<string, string> = {
        cancelled: "Google sign-in was cancelled.",
        google_not_configured:
          "Google sign-in is not configured yet. Please use email and password.",
        unverified_email:
          "Google could not verify this email address. Please use a verified account.",
        account_blocked: "This account is blocked. Contact support if you think this is a mistake.",
        callback_failed: "Google sign-in could not be completed. Please try again.",
      };
      toast.error(
        oauthErrorMessages[oauthError] ??
          "Google sign-in could not be completed. Please try again.",
      );
      return;
    }

    const token = new URLSearchParams(url.hash.slice(1)).get("api_token");
    if (!token) return;
    url.hash = "";
    window.history.replaceState(null, "", `${url.pathname}${url.search}`);
    void backend.auth
      .acceptOAuthToken(token)
      .then((user) => {
        toast.success("Signed in with Google.");
        const profile = user.profile ?? {};
        const isAdmin = user.roles?.includes("admin") || profile.account_type === "admin";
        const destination = isAdmin
          ? "/admin"
          : profile.role_selected
            ? profile.account_type === "host"
              ? "/host"
              : "/dashboard"
            : "/onboarding/role";
        void navigate({ to: destination, replace: true });
      })
      .catch((error) => {
        toast.error(
          error instanceof Error ? error.message : "Google sign-in could not be completed.",
        );
      });
  }, [navigate]);

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <I18nProvider>
          <AppNavbar />
          <RoleGate />
          {/* Required: nested routes render here. Removing <Outlet /> breaks all child routes. */}
          <Outlet />
          <Footer />
          <ChatWidget />
          <Toaster />
        </I18nProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}
