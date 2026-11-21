import { useEffect, useState } from "react";
import { Link, useRouterState } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { qk } from "@/lib/queryKeys";
import {
  Home,
  Bed,
  Sparkles,
  ShoppingBag,
  Trophy,
  Users,
  Heart,
  Bell,
  Menu,
  X,
  Globe,
  LogIn,
  User as UserIcon,
  Moon,
  Sun,
  LayoutDashboard,
  Shield,
  HandHeart,
  Settings,
} from "lucide-react";
import { Logo } from "./Logo";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/lib/i18n";
import { useTheme } from "@/lib/theme";
import { cn } from "@/lib/utils";
import { backend } from "@/integrations/api/client";
import type { User } from "@/integrations/api/client";

function useNavItems() {
  const { t } = useI18n();
  return [
    { to: "/", label: t("nav.home"), Icon: Home },
    { to: "/stays", label: t("nav.stays"), Icon: Bed },
    { to: "/experiences", label: t("nav.experiences"), Icon: Sparkles },
    { to: "/products", label: t("nav.products"), Icon: ShoppingBag },
    { to: "/competitions", label: t("nav.competitions"), Icon: Trophy },
    { to: "/community", label: t("nav.community"), Icon: Users },
    { to: "/volunteers", label: t("nav.volunteers"), Icon: HandHeart },
  ] as const;
}

export function AppNavbar() {
  const { t, locale, toggleLocale } = useI18n();
  const { theme, toggle: toggleTheme } = useTheme();
  const items = useNavItems();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [mobileOpen, setMobileOpen] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [scrolled, setScrolled] = useState(false);

  const { data: roles = [] } = useQuery({
    queryKey: user ? qk.userRoles.byUser(user.id) : ["user_roles", "anon"],
    queryFn: async () => {
      if (!user) return [];
      const { data } = await backend.resource("user_roles").select("role").eq("user_id", user.id);
      return (data ?? []).map((r) => r.role as string);
    },
    enabled: !!user,
  });

  useEffect(() => {
    const { data: sub } = backend.auth.onChange((_e, session) => setUser(session?.user ?? null));
    backend.auth.currentSession().then(({ data }) => setUser(data.session?.user ?? null));
    return () => sub.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => setMobileOpen(false), [pathname]);

  const isActive = (to: string) => (to === "/" ? pathname === "/" : pathname.startsWith(to));

  return (
    <>
      <header
        className={cn(
          "sticky top-0 z-40 w-full transition-all",
          scrolled
            ? "border-b border-border/60 bg-background/85 backdrop-blur-md shadow-card"
            : "bg-background/60 backdrop-blur-sm",
        )}
      >
        <div className="mx-auto flex h-16 max-w-7xl items-center gap-2 px-3 sm:px-6">
          <Link to="/" className="shrink-0" aria-label="ANA Refi home">
            <Logo size="md" />
          </Link>

          <nav className="hidden flex-1 items-center justify-center gap-1 lg:flex">
            {items.map(({ to, label, Icon }) => (
              <Link
                key={to}
                to={to}
                className={cn(
                  "group relative flex items-center gap-2 rounded-full px-3 py-2 text-sm font-medium transition-colors",
                  isActive(to)
                    ? "text-primary"
                    : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
                )}
              >
                <Icon className="h-4 w-4" />
                <span>{label}</span>
                {isActive(to) && (
                  <span className="absolute inset-x-3 -bottom-1 h-0.5 rounded-full bg-primary" />
                )}
              </Link>
            ))}
          </nav>

          <div className="ms-auto flex shrink-0 items-center gap-0.5 sm:gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleLocale}
              className="rounded-full px-2 font-semibold sm:px-3"
              aria-label="Toggle language"
            >
              <Globe className="h-4 w-4" />
              <span className="ms-1 text-xs">{locale === "ar" ? "EN" : "ع"}</span>
            </Button>

            <Button
              variant="ghost"
              size="icon"
              onClick={toggleTheme}
              className="rounded-full"
              aria-label="Toggle theme"
            >
              {theme === "dark" ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            </Button>

            <Link to="/favorites" aria-label={t("nav.favorites")} className="hidden sm:block">
              <Button variant="ghost" size="icon" className="rounded-full">
                <Heart className="h-5 w-5" />
              </Button>
            </Link>

            <Link
              to="/notifications"
              aria-label={t("nav.notifications")}
              className="hidden sm:block"
            >
              <Button variant="ghost" size="icon" className="rounded-full relative">
                <Bell className="h-5 w-5" />
              </Button>
            </Link>

            {user ? (
              <div className="hidden items-center gap-1 sm:flex">
                {roles.includes("host") && (
                  <Link to="/host" aria-label="Host">
                    <Button variant="ghost" size="icon" className="rounded-full">
                      <LayoutDashboard className="h-5 w-5" />
                    </Button>
                  </Link>
                )}
                {roles.includes("admin") && (
                  <Link to="/admin" aria-label="Admin">
                    <Button variant="ghost" size="icon" className="rounded-full">
                      <Shield className="h-5 w-5 text-warning" />
                    </Button>
                  </Link>
                )}
                <Link to="/dashboard" aria-label={t("nav.dashboard")}>
                  <Button variant="ghost" size="icon" className="rounded-full">
                    <UserIcon className="h-5 w-5" />
                  </Button>
                </Link>
                <Link to="/settings" aria-label={locale === "ar" ? "الإعدادات" : "Settings"}>
                  <Button variant="ghost" size="icon" className="rounded-full">
                    <Settings className="h-5 w-5" />
                  </Button>
                </Link>
              </div>
            ) : (
              <Link to="/auth" className="hidden sm:block">
                <Button size="sm" className="rounded-full">
                  <LogIn className="h-4 w-4 me-1" />
                  {t("nav.signin")}
                </Button>
              </Link>
            )}

            <Button
              variant="ghost"
              size="icon"
              className="rounded-full lg:hidden"
              aria-label={mobileOpen ? "Close menu" : "Open menu"}
              aria-expanded={mobileOpen}
              onClick={() => setMobileOpen((v) => !v)}
            >
              {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          </div>
        </div>

        <div
          className={cn(
            "lg:hidden overflow-y-auto overscroll-contain border-t border-border/60 bg-background/95 backdrop-blur-md transition-[max-height,opacity] duration-300",
            mobileOpen ? "max-h-[75vh] opacity-100" : "max-h-0 opacity-0",
          )}
        >
          <nav className="mx-auto flex max-w-7xl flex-col gap-1 px-3 py-3">
            {items.map(({ to, label, Icon }) => (
              <Link
                key={to}
                to={to}
                className={cn(
                  "flex min-h-11 items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium transition-colors",
                  isActive(to)
                    ? "bg-accent text-accent-foreground"
                    : "text-muted-foreground hover:bg-accent",
                )}
              >
                <Icon className="h-5 w-5 shrink-0" />
                <span className="truncate">{label}</span>
              </Link>
            ))}

            <div className="my-1 h-px bg-border" />

            {(
              [
                { to: "/favorites", label: t("nav.favorites"), Icon: Heart, show: true },
                { to: "/notifications", label: t("nav.notifications"), Icon: Bell, show: true },
                {
                  to: "/host",
                  label: locale === "ar" ? "لوحة المضيف" : "Host dashboard",
                  Icon: LayoutDashboard,
                  show: !!user && roles.includes("host"),
                },
                {
                  to: "/admin",
                  label: locale === "ar" ? "لوحة الإدارة" : "Admin panel",
                  Icon: Shield,
                  show: !!user && roles.includes("admin"),
                },
                { to: "/dashboard", label: t("nav.dashboard"), Icon: UserIcon, show: !!user },
                {
                  to: "/settings",
                  label: locale === "ar" ? "الإعدادات" : "Settings",
                  Icon: Settings,
                  show: !!user,
                },
              ] as const
            )
              .filter((i) => i.show)
              .map(({ to, label, Icon }) => (
                <Link
                  key={to}
                  to={to}
                  className={cn(
                    "flex min-h-11 items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium transition-colors",
                    isActive(to)
                      ? "bg-accent text-accent-foreground"
                      : "text-muted-foreground hover:bg-accent",
                  )}
                >
                  <Icon className="h-5 w-5 shrink-0" />
                  <span className="truncate">{label}</span>
                </Link>
              ))}

            {!user && (
              <Link to="/auth" className="mt-2">
                <Button className="w-full rounded-xl" size="lg">
                  <LogIn className="h-4 w-4 me-1" />
                  {t("nav.signin")}
                </Button>
              </Link>
            )}
          </nav>
        </div>
      </header>

      <nav
        aria-label="Primary"
        className="fixed inset-x-0 bottom-0 z-30 border-t border-border/60 bg-background/95 backdrop-blur-md md:hidden"
      >
        <ul className="mx-auto grid max-w-7xl grid-cols-5">
          {items.slice(0, 5).map(({ to, label, Icon }) => (
            <li key={to}>
              <Link
                to={to}
                className={cn(
                  "flex flex-col items-center gap-0.5 py-2 text-[10px] font-medium transition-colors",
                  isActive(to) ? "text-primary" : "text-muted-foreground",
                )}
              >
                <Icon className="h-5 w-5" />
                <span className="truncate">{label}</span>
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </>
  );
}
