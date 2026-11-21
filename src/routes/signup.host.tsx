import { useEffect, useState, type FormEvent } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Home, Upload, CheckCircle2 } from "lucide-react";
import { backend } from "@/integrations/api/client";
import { redirectToGoogle } from "@/integrations/api/oauth";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { Logo } from "@/components/Logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { useI18n } from "@/lib/i18n";
import { validateSignup } from "@/lib/validation";
import { uploadIdentityDoc } from "@/lib/uploadIdentity";

export const Route = createFileRoute("/signup/host")({
  head: () => ({
    meta: [
      { title: "Host sign up — ANA Refi" },
      {
        name: "description",
        content:
          "Become an ANA Refi host: verify your national ID and list stays, experiences, products and competitions.",
      },
      { property: "og:title", content: "Host sign up — ANA Refi" },
      {
        property: "og:description",
        content: "Join ANA Refi as a verified host and welcome travellers to your village.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: HostSignupPage,
});

function HostSignupPage() {
  const { locale } = useI18n();
  const ar = locale === "ar";
  const navigate = useNavigate();
  const { user } = useCurrentUser();

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [nationalId, setNationalId] = useState("");
  const [front, setFront] = useState<File | null>(null);
  const [back, setBack] = useState<File | null>(null);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);

  // When the visitor signed up with Google first, keep the profile step only.
  useEffect(() => {
    if (user?.email) setEmail(user.email);
  }, [user?.email]);
  const googleMode = !!user;

  async function submit(e: FormEvent) {
    e.preventDefault();
    const err = validateSignup(
      {
        firstName,
        lastName,
        email,
        phone,
        password,
        confirm,
        nationalId,
        requirePassword: !googleMode,
      },
      ar,
    );
    if (err) return toast.error(err);
    if (!front || !back)
      return toast.error(
        ar ? "ارفع صورتي البطاقة (أمام وخلف)" : "Upload both sides of your national ID",
      );

    setLoading(true);
    try {
      let userId = user?.id ?? null;
      if (!googleMode) {
        const { error } = await backend.auth.register({
          email: email.trim(),
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/signup/host`,
            data: {
              display_name: `${firstName.trim()} ${lastName.trim()}`,
              phone: phone.trim(),
              account_type: "host",
              national_id: nationalId.trim(),
            },
          },
        });
        if (error) throw error;
        const { data: sess } = await backend.auth.currentSession();
        userId = sess.session?.user.id ?? null;
        if (!userId) {
          toast.success(
            ar
              ? "افحص بريدك لتفعيل الحساب ثم أعد رفع صور البطاقة من هذه الصفحة."
              : "Check your email to confirm your account, then return here to upload your ID images.",
          );
          return;
        }
      }

      const uid = userId!;
      const [frontPath, backPath] = await Promise.all([
        uploadIdentityDoc(front, uid, "front"),
        uploadIdentityDoc(back, uid, "back"),
      ]);

      const { error: vErr } = await backend.resource("host_verifications").upsert(
        {
          user_id: uid,
          first_name: firstName.trim(),
          last_name: lastName.trim(),
          national_id: nationalId.trim(),
          id_front_path: frontPath,
          id_back_path: backPath,
          status: "pending",
        },
        { onConflict: "user_id" },
      );
      if (vErr) throw vErr;

      await backend
        .resource("profiles")
        .update({
          display_name: `${firstName.trim()} ${lastName.trim()}`,
          account_type: "host",
          role_selected: true,
        })
        .eq("id", uid);
      await backend
        .resource("user_contacts")
        .upsert({ user_id: uid, phone: phone.trim() }, { onConflict: "user_id" });
      await backend
        .resource("user_roles")
        .upsert(
          { user_id: uid, role: "host" },
          { onConflict: "user_id,role", ignoreDuplicates: true },
        );

      await backend.auth.currentSession();
      toast.success(ar ? "تم إنشاء حساب المضيف" : "Host account created");
      navigate({ to: "/host", replace: true });
    } catch (e2) {
      toast.error((e2 as Error).message);
    } finally {
      setLoading(false);
    }
  }

  async function google() {
    setLoading(true);
    try {
      redirectToGoogle(`${window.location.origin}/signup/host`);
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setLoading(false);
    }
  }

  const FilePick = ({
    id,
    label,
    file,
    onPick,
  }: {
    id: string;
    label: string;
    file: File | null;
    onPick: (f: File | null) => void;
  }) => (
    <div>
      <Label htmlFor={id}>{label}</Label>
      <label
        htmlFor={id}
        className="mt-1 flex cursor-pointer items-center gap-2 rounded-xl border-2 border-dashed border-border bg-muted/40 px-3 py-3 text-sm text-muted-foreground transition-colors hover:border-primary/50"
      >
        {file ? <CheckCircle2 className="h-4 w-4 text-success" /> : <Upload className="h-4 w-4" />}
        <span className="truncate">{file ? file.name : ar ? "اختر صورة" : "Choose image"}</span>
      </label>
      <input
        id={id}
        type="file"
        accept="image/*"
        className="sr-only"
        onChange={(e) => onPick(e.target.files?.[0] ?? null)}
      />
    </div>
  );

  return (
    <div className="mx-auto flex min-h-[calc(100vh-8rem)] max-w-2xl flex-col items-center justify-center px-4 py-10">
      <div className="mb-6">
        <Logo size="lg" />
      </div>
      <div className="w-full rounded-3xl border border-border bg-card p-6 shadow-elevated sm:p-8">
        <div className="flex flex-col items-center">
          <div className="grid h-14 w-14 place-items-center rounded-2xl bg-primary/10 text-primary">
            <Home className="h-7 w-7" />
          </div>
          <h1 className="mt-3 text-center text-2xl font-black text-foreground">
            {ar ? "إنشاء حساب مضيف" : "Host sign up"}
          </h1>
          <p className="mt-1 text-center text-xs text-muted-foreground">
            {ar
              ? "نحتاج بياناتك ورقمك القومي للتحقق قبل نشر إعلاناتك."
              : "We verify your identity before your listings go live. Documents stay private."}
          </p>
        </div>

        <form onSubmit={submit} className="mt-6 space-y-3">
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <Label htmlFor="hfn">{ar ? "الاسم الأول" : "First name"}</Label>
              <Input
                id="hfn"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                required
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="hln">{ar ? "اسم العائلة" : "Last name"}</Label>
              <Input
                id="hln"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                required
                className="mt-1"
              />
            </div>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <Label htmlFor="hem">{ar ? "البريد الإلكتروني" : "Email address"}</Label>
              <Input
                id="hem"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={googleMode}
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="hph">{ar ? "رقم الموبايل" : "Mobile phone number"}</Label>
              <Input
                id="hph"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                required
                placeholder="01xxxxxxxxx"
                className="mt-1"
              />
            </div>
          </div>
          <div>
            <Label htmlFor="hnid">
              {ar ? "الرقم القومي (14 رقم)" : "National ID number (14 digits)"}
            </Label>
            <Input
              id="hnid"
              inputMode="numeric"
              maxLength={14}
              value={nationalId}
              onChange={(e) => setNationalId(e.target.value.replace(/\D/g, ""))}
              required
              className="mt-1"
            />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <FilePick
              id="hidf"
              label={ar ? "صورة البطاقة (الوجه الأمامي)" : "National ID — front side"}
              file={front}
              onPick={setFront}
            />
            <FilePick
              id="hidb"
              label={ar ? "صورة البطاقة (الوجه الخلفي)" : "National ID — back side"}
              file={back}
              onPick={setBack}
            />
          </div>
          {!googleMode && (
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <Label htmlFor="hpw">{ar ? "كلمة المرور" : "Password"}</Label>
                <Input
                  id="hpw"
                  type="password"
                  autoComplete="new-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={8}
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="hpw2">{ar ? "تأكيد كلمة المرور" : "Confirm password"}</Label>
                <Input
                  id="hpw2"
                  type="password"
                  autoComplete="new-password"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  required
                  minLength={8}
                  className="mt-1"
                />
              </div>
            </div>
          )}
          <Button type="submit" disabled={loading} size="lg" className="w-full rounded-xl">
            {loading ? "…" : ar ? "إنشاء حساب المضيف" : "Create host account"}
          </Button>
        </form>

        {!googleMode && (
          <>
            <div className="my-5 flex items-center gap-3 text-xs uppercase tracking-wide text-muted-foreground">
              <div className="h-px flex-1 bg-border" />
              <span>{ar ? "أو" : "or"}</span>
              <div className="h-px flex-1 bg-border" />
            </div>
            <Button
              variant="outline"
              onClick={google}
              disabled={loading}
              size="lg"
              className="w-full rounded-xl"
            >
              <svg className="me-2 h-4 w-4" viewBox="0 0 24 24" aria-hidden>
                <path
                  fill="#EA4335"
                  d="M12 10.2v3.9h5.5c-.2 1.5-1.6 4.3-5.5 4.3-3.3 0-6-2.7-6-6.1s2.7-6.1 6-6.1c1.9 0 3.1.8 3.8 1.5l2.6-2.5C16.9 3.6 14.7 2.6 12 2.6 6.8 2.6 2.6 6.8 2.6 12s4.2 9.4 9.4 9.4c5.4 0 9-3.8 9-9.2 0-.6 0-1.1-.1-1.6H12z"
                />
              </svg>
              {ar ? "المتابعة بجوجل" : "Sign up with Google"}
            </Button>
          </>
        )}

        <p className="mt-4 text-center text-xs text-muted-foreground">
          {ar ? "مسافر؟" : "Travelling instead?"}{" "}
          <Link to="/signup/traveler" className="text-primary underline">
            {ar ? "سجّل كمسافر" : "Traveler sign up"}
          </Link>
          {" · "}
          <Link to="/auth" className="text-primary underline">
            {ar ? "لدي حساب" : "I have an account"}
          </Link>
        </p>
      </div>
    </div>
  );
}
