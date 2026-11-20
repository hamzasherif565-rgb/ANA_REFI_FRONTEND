import { useState, type FormEvent } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Plane } from "lucide-react";
import { backend } from "@/integrations/api/client";
import { redirectToGoogle } from "@/integrations/api/oauth";
import { Logo } from "@/components/Logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { useI18n } from "@/lib/i18n";
import { validateSignup } from "@/lib/validation";

export const Route = createFileRoute("/signup/traveler")({
  head: () => ({
    meta: [
      { title: "Traveler sign up — ANA Refi" },
      { name: "description", content: "Create a traveler account on ANA Refi to book village stays, experiences and products." },
      { property: "og:title", content: "Traveler sign up — ANA Refi" },
      { property: "og:description", content: "Join ANA Refi as a traveler and explore rural Egypt." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: TravelerSignupPage,
});

function TravelerSignupPage() {
  const { locale } = useI18n();
  const ar = locale === "ar";
  const navigate = useNavigate();
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(e: FormEvent) {
    e.preventDefault();
    const err = validateSignup({ firstName, lastName, email, phone, password, confirm, requirePassword: true }, ar);
    if (err) return toast.error(err);
    setLoading(true);
    try {
      const { error } = await backend.auth.register({
        email: email.trim(),
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/dashboard`,
          data: {
            display_name: `${firstName.trim()} ${lastName.trim()}`,
            phone: phone.trim(),
            account_type: "traveler",
          },
        },
      });
      if (error) throw error;
      const { data: sess } = await backend.auth.currentSession();
      if (sess.session) {
        toast.success(ar ? "تم إنشاء حسابك" : "Account created");
        navigate({ to: "/dashboard", replace: true });
      } else {
        toast.success(ar ? "افحص بريدك لتفعيل الحساب" : "Check your email to confirm your account");
      }
    } catch (e2) {
      toast.error((e2 as Error).message);
    } finally {
      setLoading(false);
    }
  }

  async function google() {
    setLoading(true);
    try {
      redirectToGoogle(`${window.location.origin}/signup/traveler`);
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto flex min-h-[calc(100vh-8rem)] max-w-lg flex-col items-center justify-center px-4 py-10">
      <div className="mb-6"><Logo size="lg" /></div>
      <div className="w-full rounded-3xl border border-border bg-card p-6 shadow-elevated sm:p-8">
        <div className="flex flex-col items-center">
          <div className="grid h-14 w-14 place-items-center rounded-2xl bg-primary/10 text-primary">
            <Plane className="h-7 w-7" />
          </div>
          <h1 className="mt-3 text-center text-2xl font-black text-foreground">
            {ar ? "إنشاء حساب مسافر" : "Traveler sign up"}
          </h1>
          <p className="mt-1 text-center text-xs text-muted-foreground">
            {ar ? "احجز الإقامات والتجارب واشترِ المنتجات الريفية." : "Book stays, join experiences and buy village products."}
          </p>
        </div>

        <form onSubmit={submit} className="mt-6 space-y-3">
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <Label htmlFor="tfn">{ar ? "الاسم الأول" : "First name"}</Label>
              <Input id="tfn" value={firstName} onChange={(e) => setFirstName(e.target.value)} required className="mt-1" />
            </div>
            <div>
              <Label htmlFor="tln">{ar ? "اسم العائلة" : "Last name"}</Label>
              <Input id="tln" value={lastName} onChange={(e) => setLastName(e.target.value)} required className="mt-1" />
            </div>
          </div>
          <div>
            <Label htmlFor="tem">{ar ? "البريد الإلكتروني" : "Email address"}</Label>
            <Input id="tem" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required className="mt-1" />
          </div>
          <div>
            <Label htmlFor="tph">{ar ? "رقم الموبايل" : "Mobile phone number"}</Label>
            <Input id="tph" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} required placeholder="01xxxxxxxxx" className="mt-1" />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <Label htmlFor="tpw">{ar ? "كلمة المرور" : "Password"}</Label>
              <Input id="tpw" type="password" autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={8} className="mt-1" />
            </div>
            <div>
              <Label htmlFor="tpw2">{ar ? "تأكيد كلمة المرور" : "Confirm password"}</Label>
              <Input id="tpw2" type="password" autoComplete="new-password" value={confirm} onChange={(e) => setConfirm(e.target.value)} required minLength={8} className="mt-1" />
            </div>
          </div>
          <Button type="submit" disabled={loading} size="lg" className="w-full rounded-xl">
            {loading ? "…" : ar ? "إنشاء الحساب" : "Create traveler account"}
          </Button>
        </form>

        <div className="my-5 flex items-center gap-3 text-xs uppercase tracking-wide text-muted-foreground">
          <div className="h-px flex-1 bg-border" /><span>{ar ? "أو" : "or"}</span><div className="h-px flex-1 bg-border" />
        </div>

        <Button variant="outline" onClick={google} disabled={loading} size="lg" className="w-full rounded-xl">
          <svg className="me-2 h-4 w-4" viewBox="0 0 24 24" aria-hidden>
            <path fill="#EA4335" d="M12 10.2v3.9h5.5c-.2 1.5-1.6 4.3-5.5 4.3-3.3 0-6-2.7-6-6.1s2.7-6.1 6-6.1c1.9 0 3.1.8 3.8 1.5l2.6-2.5C16.9 3.6 14.7 2.6 12 2.6 6.8 2.6 2.6 6.8 2.6 12s4.2 9.4 9.4 9.4c5.4 0 9-3.8 9-9.2 0-.6 0-1.1-.1-1.6H12z" />
          </svg>
          {ar ? "المتابعة بجوجل" : "Sign up with Google"}
        </Button>

        <p className="mt-4 text-center text-xs text-muted-foreground">
          {ar ? "هل أنت مضيف؟" : "Are you a host?"}{" "}
          <Link to="/signup/host" className="text-primary underline">{ar ? "سجّل كمضيف" : "Host sign up"}</Link>
          {" · "}
          <Link to="/auth" className="text-primary underline">{ar ? "لدي حساب" : "I have an account"}</Link>
        </p>
      </div>
    </div>
  );
}
