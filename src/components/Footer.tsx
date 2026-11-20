import { Link } from "@tanstack/react-router";
import { Logo } from "./Logo";
import { useI18n } from "@/lib/i18n";
import { Facebook, Instagram, Twitter, Mail } from "lucide-react";

export function Footer() {
  const { t, locale } = useI18n();
  return (
    <footer className="mt-16 border-t border-border bg-card/60">
      <div className="mx-auto grid max-w-7xl gap-8 px-6 py-12 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <Logo size="md" />
          <p className="mt-3 text-sm text-muted-foreground">{t("app.tagline")}</p>
          <div className="mt-4 flex gap-3 text-muted-foreground">
            <a href="#" aria-label="Facebook" className="hover:text-primary"><Facebook className="h-5 w-5" /></a>
            <a href="#" aria-label="Instagram" className="hover:text-primary"><Instagram className="h-5 w-5" /></a>
            <a href="#" aria-label="Twitter" className="hover:text-primary"><Twitter className="h-5 w-5" /></a>
            <a href="mailto:hello@anarefi.com" aria-label="Email" className="hover:text-primary"><Mail className="h-5 w-5" /></a>
          </div>
        </div>
        <div>
          <h4 className="mb-3 font-bold text-foreground">{locale === "ar" ? "استكشف" : "Explore"}</h4>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li><Link to="/stays" className="hover:text-primary">{t("nav.stays")}</Link></li>
            <li><Link to="/experiences" className="hover:text-primary">{t("nav.experiences")}</Link></li>
            <li><Link to="/products" className="hover:text-primary">{t("nav.products")}</Link></li>
            <li><Link to="/competitions" className="hover:text-primary">{t("nav.competitions")}</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="mb-3 font-bold text-foreground">{locale === "ar" ? "المنصة" : "Platform"}</h4>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li><Link to="/community" className="hover:text-primary">{t("nav.community")}</Link></li>
            <li><Link to="/volunteers" className="hover:text-primary">{t("nav.volunteers")}</Link></li>
            <li><Link to="/auth" className="hover:text-primary">{t("nav.signin")}</Link></li>
            <li><Link to="/dashboard" className="hover:text-primary">{t("nav.dashboard")}</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="mb-3 font-bold text-foreground">{locale === "ar" ? "تواصل" : "Contact"}</h4>
          <p className="text-sm text-muted-foreground">hello@anarefi.com</p>
          <p className="text-sm text-muted-foreground">Cairo, Egypt</p>
        </div>
      </div>
      <div className="border-t border-border py-4 text-center text-xs text-muted-foreground">
        © {new Date().getFullYear()} ANA Refi. {locale === "ar" ? "جميع الحقوق محفوظة." : "All rights reserved."}
      </div>
    </footer>
  );
}