import { useEffect, useState, type FormEvent } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { Globe, Moon, Sun, Upload, User as UserIcon } from "lucide-react";
import { backend } from "@/integrations/api/client";
import { useProfile } from "@/hooks/useProfile";
import { useI18n } from "@/lib/i18n";
import { useTheme } from "@/lib/theme";
import { uploadListingImage } from "@/lib/uploadImage";
import { UserAvatar } from "@/components/UserAvatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export const Route = createFileRoute("/settings")({
  head: () => ({
    meta: [
      { title: "Settings — ANA Refi" },
      { name: "description", content: "Update your ANA Refi profile, photo, contact details, language and theme." },
      { property: "og:title", content: "Settings — ANA Refi" },
      { property: "og:description", content: "Manage your ANA Refi profile, language and appearance." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: SettingsPage,
});

function SettingsPage() {
  const { locale, setLocale } = useI18n();
  const ar = locale === "ar";
  const { theme, toggle: toggleTheme } = useTheme();
  const { profile, loading, refresh, user } = useProfile();
  const navigate = useNavigate();
  const qc = useQueryClient();

  const [name, setName] = useState("");
  const [age, setAge] = useState("");
  const [bio, setBio] = useState("");
  const [phone, setPhone] = useState("");
  const [location, setLocation] = useState("");
  const [avatar, setAvatar] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (loading) return;
    if (!user) { navigate({ to: "/auth", replace: true }); return; }
    if (profile) {
      setName(profile.display_name ?? "");
      setAge(profile.age ? String(profile.age) : "");
      setBio(profile.bio ?? "");
      setPhone(profile.phone ?? "");
      setLocation(profile.location ?? "");
      setAvatar(profile.avatar_url ?? null);
    }
  }, [loading, user, profile, navigate]);

  async function pickAvatar(file: File | undefined) {
    if (!file || !user) return;
    setUploading(true);
    try {
      const url = await uploadListingImage(file, user.id);
      setAvatar(url);
      toast.success(ar ? "تم رفع الصورة" : "Photo uploaded");
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setUploading(false);
    }
  }

  async function save(e: FormEvent) {
    e.preventDefault();
    if (!user) return;
    const parsedAge = age.trim() ? Number(age) : null;
    if (parsedAge !== null && (Number.isNaN(parsedAge) || parsedAge < 13 || parsedAge > 100)) {
      toast.error(ar ? "أدخل عمرًا صحيحًا بين 13 و100" : "Enter a valid age between 13 and 100");
      return;
    }
    setSaving(true);
    try {
      const { error } = await backend
        .resource("profiles")
        .update({
          display_name: name.trim() || null,
          age: parsedAge,
          bio: bio.trim() || null,
          phone: phone.trim() || null,
          location: location.trim() || null,
          avatar_url: avatar,
        })
        .eq("id", user.id);
      if (error) throw error;

      if (phone.trim()) {
        await backend.resource("user_contacts").upsert({ user_id: user.id, phone: phone.trim() }, { onConflict: "user_id" });
      }

      await refresh();
      await qc.invalidateQueries();
      toast.success(ar ? "تم حفظ الإعدادات" : "Settings saved");
    } catch (e2) {
      toast.error((e2 as Error).message);
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return <div className="grid min-h-[60vh] place-items-center text-muted-foreground">{ar ? "جاري التحميل..." : "Loading…"}</div>;
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 pb-24 sm:px-6 md:pb-10">
      <h1 className="text-2xl font-black text-foreground sm:text-3xl">{ar ? "الإعدادات" : "Settings"}</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        {ar ? "حدّث ملفك الشخصي واللغة ومظهر التطبيق." : "Update your profile, language and appearance."}
      </p>

      <form onSubmit={save} className="mt-6 space-y-4">
        <section className="rounded-3xl border border-border bg-card p-6 shadow-card">
          <h2 className="flex items-center gap-2 text-lg font-black text-foreground">
            <UserIcon className="h-5 w-5 text-primary" /> {ar ? "الملف الشخصي" : "Profile"}
          </h2>

          <div className="mt-4 flex items-center gap-4">
            <UserAvatar name={name} src={avatar} size="xl" />
            <div>
              <label className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-border px-3 py-2 text-sm font-semibold hover:bg-accent">
                <Upload className="h-4 w-4" />
                {uploading ? (ar ? "جارٍ الرفع…" : "Uploading…") : ar ? "تغيير الصورة" : "Change photo"}
                <input type="file" accept="image/*" className="hidden" onChange={(e) => pickAvatar(e.target.files?.[0])} />
              </label>
              {avatar && (
                <button type="button" onClick={() => setAvatar(null)} className="ms-3 text-xs text-muted-foreground underline">
                  {ar ? "إزالة" : "Remove"}
                </button>
              )}
            </div>
          </div>

          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <div>
              <Label htmlFor="s-name">{ar ? "الاسم" : "Full name"}</Label>
              <Input id="s-name" value={name} onChange={(e) => setName(e.target.value)} className="mt-1" />
            </div>
            <div>
              <Label htmlFor="s-age">{ar ? "العمر" : "Age"}</Label>
              <Input id="s-age" type="number" min={13} max={100} value={age} onChange={(e) => setAge(e.target.value)} className="mt-1" />
            </div>
            <div>
              <Label htmlFor="s-phone">{ar ? "رقم الموبايل" : "Phone number"}</Label>
              <Input id="s-phone" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="01xxxxxxxxx" className="mt-1" />
            </div>
            <div>
              <Label htmlFor="s-loc">{ar ? "الموقع" : "Location"}</Label>
              <Input id="s-loc" value={location} onChange={(e) => setLocation(e.target.value)} className="mt-1" />
            </div>
          </div>

          <div className="mt-3">
            <Label htmlFor="s-bio">{ar ? "نبذة عنك" : "Bio"}</Label>
            <Textarea id="s-bio" rows={4} value={bio} onChange={(e) => setBio(e.target.value)} className="mt-1" />
          </div>

          <p className="mt-3 text-xs text-muted-foreground">
            {ar ? "البريد الإلكتروني:" : "Email:"} {profile?.email ?? user?.email}
          </p>

          <Button type="submit" disabled={saving} size="lg" className="mt-4 w-full rounded-xl sm:w-auto">
            {saving ? (ar ? "جارٍ الحفظ…" : "Saving…") : ar ? "حفظ التغييرات" : "Save changes"}
          </Button>
        </section>
      </form>

      <section className="mt-4 rounded-3xl border border-border bg-card p-6 shadow-card">
        <h2 className="flex items-center gap-2 text-lg font-black text-foreground">
          <Globe className="h-5 w-5 text-primary" /> {ar ? "اللغة" : "Language"}
        </h2>
        <div className="mt-3 grid grid-cols-2 gap-2 sm:max-w-sm">
          {(["ar", "en"] as const).map((l) => (
            <button
              key={l}
              type="button"
              onClick={() => setLocale(l)}
              className={cn(
                "rounded-xl border-2 px-4 py-3 text-sm font-bold transition-colors",
                locale === l ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground hover:border-primary/40",
              )}
            >
              {l === "ar" ? "العربية" : "English"}
            </button>
          ))}
        </div>
      </section>

      <section className="mt-4 rounded-3xl border border-border bg-card p-6 shadow-card">
        <h2 className="flex items-center gap-2 text-lg font-black text-foreground">
          {theme === "dark" ? <Moon className="h-5 w-5 text-primary" /> : <Sun className="h-5 w-5 text-primary" />}
          {ar ? "المظهر" : "Appearance"}
        </h2>
        <div className="mt-3 flex items-center justify-between gap-4 sm:max-w-sm">
          <p className="text-sm text-muted-foreground">
            {theme === "dark" ? (ar ? "الوضع الليلي" : "Dark mode") : ar ? "الوضع النهاري" : "Light mode"}
          </p>
          <Button type="button" variant="outline" onClick={toggleTheme} className="rounded-xl">
            {theme === "dark" ? <Sun className="h-4 w-4 me-1" /> : <Moon className="h-4 w-4 me-1" />}
            {ar ? "تبديل" : "Toggle"}
          </Button>
        </div>
      </section>
    </div>
  );
}