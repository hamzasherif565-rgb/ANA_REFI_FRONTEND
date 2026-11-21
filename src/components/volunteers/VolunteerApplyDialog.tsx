import { useState, type FormEvent, type ReactNode } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { CheckCircle2, Loader2, X } from "lucide-react";
import { toast } from "sonner";
import { backend } from "@/integrations/api/client";
import { uploadListingImage } from "@/lib/uploadImage";
import { useI18n } from "@/lib/i18n";
import { qk } from "@/lib/queryKeys";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { UserAvatar } from "@/components/UserAvatar";
import type { Tables } from "@/integrations/api/types";

export type VolunteerRow = Tables<"volunteer_requests">;

const INTERESTS = [
  "Community events",
  "Heritage & crafts",
  "Environment",
  "Tourism support",
  "Media & photography",
];

export function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div>
      <Label className="mb-1.5 block">{label}</Label>
      {children}
    </div>
  );
}

type FormState = {
  full_name: string;
  email: string;
  phone: string;
  age: string;
  avatar_url: string;
  bio: string;
  location: string;
  skills: string;
  languages: string;
  experience: string;
  motivation: string;
  availability: string;
  accessibility: string;
  interest_area: string;
};

function toForm(v?: VolunteerRow | null, email = ""): FormState {
  return {
    full_name: v?.full_name ?? "",
    email: v?.email ?? email,
    phone: v?.phone ?? "",
    age: v?.age ? String(v.age) : "",
    avatar_url: v?.avatar_url ?? "",
    bio: v?.bio ?? "",
    location: v?.location ?? "",
    skills: (v?.skills ?? []).join(", "),
    languages: (v?.languages ?? []).join(", "),
    experience: v?.experience ?? "",
    motivation: v?.motivation ?? "",
    availability: v?.availability ?? "",
    accessibility: v?.accessibility ?? "",
    interest_area: v?.interest_area ?? INTERESTS[0]!,
  };
}

const csv = (s: string) =>
  s
    .split(",")
    .map((x) => x.trim())
    .filter(Boolean);

/** Volunteer application form — used for both creating and editing an application. */
export function VolunteerApplyDialog({
  userId,
  userEmail,
  existing,
  onClose,
}: {
  userId: string;
  userEmail?: string;
  existing?: VolunteerRow | null;
  onClose: () => void;
}) {
  const { locale } = useI18n();
  const ar = locale === "ar";
  const qc = useQueryClient();
  const [form, setForm] = useState<FormState>(() => toForm(existing, userEmail));
  const [uploading, setUploading] = useState(false);
  const set = <K extends keyof FormState>(k: K, v: FormState[K]) =>
    setForm((f) => ({ ...f, [k]: v }));

  const save = useMutation({
    mutationFn: async () => {
      if (!/^01[0125]\d{8}$/.test(form.phone))
        throw new Error(ar ? "أدخل رقم هاتف مصري صحيح" : "Enter a valid Egyptian phone number");
      if (form.motivation.trim().length < 10)
        throw new Error(
          ar ? "اكتب سبب التطوع بتفصيل أكبر" : "Please tell us more about your motivation",
        );
      const age = form.age ? Number(form.age) : null;
      if (age !== null && (age < 16 || age > 100))
        throw new Error(ar ? "العمر يجب أن يكون بين 16 و 100" : "Age must be between 16 and 100");
      const payload = {
        user_id: userId,
        full_name: form.full_name.trim(),
        email: form.email.trim(),
        phone: form.phone.trim(),
        age,
        avatar_url: form.avatar_url || null,
        bio: form.bio.trim() || null,
        location: form.location.trim() || null,
        skills: csv(form.skills),
        languages: csv(form.languages),
        experience: form.experience.trim() || null,
        motivation: form.motivation.trim(),
        availability: form.availability.trim(),
        accessibility: form.accessibility.trim() || null,
        interest_area: form.interest_area,
      };
      if (existing) {
        const { error } = await backend
          .resource("volunteer_requests")
          .update(payload)
          .eq("id", existing.id);
        if (error) throw error;
      } else {
        const { error } = await backend.resource("volunteer_requests").insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qk.volunteers.all });
      toast.success(
        existing
          ? ar
            ? "تم تحديث الطلب"
            : "Application updated"
          : ar
            ? "تم إرسال طلب التطوع — بانتظار موافقة الإدارة"
            : "Application submitted — pending admin approval",
      );
      onClose();
    },
    onError: (e) => toast.error((e as Error).message),
  });

  async function pickAvatar(file?: File | null) {
    if (!file) return;
    setUploading(true);
    try {
      set("avatar_url", await uploadListingImage(file, userId));
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setUploading(false);
    }
  }

  function submit(e: FormEvent) {
    e.preventDefault();
    save.mutate();
  }

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-foreground/50 p-4">
      <div className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-3xl border border-border bg-card p-6 shadow-elevated">
        <div className="mb-5 flex items-start justify-between gap-3">
          <div>
            <h2 className="text-xl font-black">{ar ? "طلب تطوع" : "Volunteer application"}</h2>
            <p className="text-sm text-muted-foreground">
              {ar
                ? "أخبرنا عنك — سيراجع الفريق طلبك قبل نشره."
                : "Tell us about you — the team reviews every application before it goes live."}
            </p>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose} aria-label="Close">
            <X className="h-4 w-4" />
          </Button>
        </div>

        <form onSubmit={submit} className="space-y-4">
          <div className="flex items-center gap-4">
            <UserAvatar name={form.full_name} src={form.avatar_url} size="xl" />
            <div>
              <Label className="mb-1.5 block">{ar ? "الصورة الشخصية" : "Profile picture"}</Label>
              <Input
                type="file"
                accept="image/*"
                disabled={uploading}
                onChange={(e) => pickAvatar(e.target.files?.[0])}
              />
              {uploading && (
                <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                  <Loader2 className="h-3 w-3 animate-spin" />
                  {ar ? "جارٍ الرفع" : "Uploading"}
                </p>
              )}
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <Field label={ar ? "الاسم الكامل" : "Full name"}>
              <Input
                required
                maxLength={100}
                value={form.full_name}
                onChange={(e) => set("full_name", e.target.value)}
              />
            </Field>
            <Field label={ar ? "البريد الإلكتروني" : "Email"}>
              <Input
                required
                type="email"
                maxLength={255}
                value={form.email}
                onChange={(e) => set("email", e.target.value)}
              />
            </Field>
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            <Field label={ar ? "رقم الهاتف" : "Phone"}>
              <Input
                required
                inputMode="tel"
                placeholder="01XXXXXXXXX"
                value={form.phone}
                onChange={(e) => set("phone", e.target.value.replace(/\D/g, "").slice(0, 11))}
              />
            </Field>
            <Field label={ar ? "العمر" : "Age"}>
              <Input
                type="number"
                min={16}
                max={100}
                value={form.age}
                onChange={(e) => set("age", e.target.value)}
              />
            </Field>
            <Field label={ar ? "الموقع" : "Location"}>
              <Input
                maxLength={120}
                value={form.location}
                onChange={(e) => set("location", e.target.value)}
                placeholder={ar ? "الأقصر، مصر" : "Luxor, Egypt"}
              />
            </Field>
          </div>
          <Field label={ar ? "نبذة عنك" : "Bio"}>
            <Textarea
              rows={3}
              maxLength={600}
              value={form.bio}
              onChange={(e) => set("bio", e.target.value)}
              placeholder={ar ? "عرّف الناس بنفسك" : "Introduce yourself"}
            />
          </Field>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label={ar ? "المهارات (افصل بفاصلة)" : "Skills (comma separated)"}>
              <Input
                value={form.skills}
                onChange={(e) => set("skills", e.target.value)}
                placeholder={ar ? "إرشاد سياحي, تصوير" : "Guiding, Photography"}
              />
            </Field>
            <Field label={ar ? "اللغات (افصل بفاصلة)" : "Languages (comma separated)"}>
              <Input
                value={form.languages}
                onChange={(e) => set("languages", e.target.value)}
                placeholder={ar ? "العربية, الإنجليزية" : "Arabic, English"}
              />
            </Field>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label={ar ? "مجال الاهتمام" : "Area of interest"}>
              <select
                value={form.interest_area}
                onChange={(e) => set("interest_area", e.target.value)}
                className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
              >
                {INTERESTS.map((i) => (
                  <option key={i}>{i}</option>
                ))}
              </select>
            </Field>
            <Field label={ar ? "الأوقات المتاحة" : "Availability"}>
              <Input
                required
                maxLength={200}
                value={form.availability}
                onChange={(e) => set("availability", e.target.value)}
                placeholder={ar ? "مثال: الجمعة والسبت" : "e.g. Fridays and Saturdays"}
              />
            </Field>
          </div>
          <Field label={ar ? "الخبرة السابقة" : "Previous experience"}>
            <Textarea
              rows={3}
              maxLength={1000}
              value={form.experience}
              onChange={(e) => set("experience", e.target.value)}
            />
          </Field>
          <Field label={ar ? "لماذا تريد التطوع؟" : "Why do you want to volunteer?"}>
            <Textarea
              required
              minLength={10}
              maxLength={1500}
              rows={4}
              value={form.motivation}
              onChange={(e) => set("motivation", e.target.value)}
            />
          </Field>
          <Field
            label={ar ? "احتياجات الدعم (اختياري)" : "Accessibility / support needs (optional)"}
          >
            <Textarea
              rows={2}
              maxLength={500}
              value={form.accessibility}
              onChange={(e) => set("accessibility", e.target.value)}
            />
          </Field>

          <Button
            disabled={save.isPending || uploading}
            type="submit"
            size="lg"
            className="w-full rounded-xl"
          >
            {save.isPending ? (
              <Loader2 className="me-2 h-5 w-5 animate-spin" />
            ) : (
              <CheckCircle2 className="me-2 h-5 w-5" />
            )}
            {existing
              ? ar
                ? "حفظ التعديلات"
                : "Save changes"
              : ar
                ? "إرسال الطلب"
                : "Submit application"}
          </Button>
        </form>
      </div>
    </div>
  );
}
