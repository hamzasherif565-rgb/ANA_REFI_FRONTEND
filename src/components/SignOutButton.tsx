import { useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { backend } from "@/integrations/api/client";
import { useI18n } from "@/lib/i18n";

export function SignOutButton({ className }: { className?: string }) {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { locale } = useI18n();

  const handleSignOut = async () => {
    await qc.cancelQueries();
    qc.clear();
    await backend.auth.logout();
    navigate({ to: "/auth", replace: true });
  };

  return (
    <Button variant="outline" className={`rounded-xl ${className ?? ""}`} onClick={handleSignOut}>
      <LogOut className="me-1 h-4 w-4" />
      {locale === "ar" ? "تسجيل الخروج" : "Sign out"}
    </Button>
  );
}
