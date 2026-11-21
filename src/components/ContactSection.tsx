import { useState, type FormEvent } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useI18n } from "@/lib/i18n";
import { backend } from "@/integrations/api/client";
import { Mail } from "lucide-react";

export function ContactSection() {
  const { locale } = useI18n();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    const { error } = await backend.resource("contact_messages").insert({ name, email, message });
    setLoading(false);
    if (error) return toast.error(error.message);
    toast.success(locale === "ar" ? "تم إرسال رسالتك، شكرًا لك!" : "Message sent — thank you!");
    setName("");
    setEmail("");
    setMessage("");
  }

  return (
    <section id="contact" className="mx-auto max-w-4xl px-4 py-16 sm:px-6">
      <div className="rounded-3xl border border-border bg-card p-8 shadow-card sm:p-12">
        <div className="mb-6 flex items-center gap-3">
          <div className="grid h-12 w-12 place-items-center rounded-2xl bg-gradient-primary text-primary-foreground shadow-soft">
            <Mail className="h-6 w-6" />
          </div>
          <div>
            <h2 className="text-2xl font-black text-foreground">
              {locale === "ar" ? "تواصل معنا" : "Contact us"}
            </h2>
            <p className="text-sm text-muted-foreground">
              {locale === "ar" ? "نسعد بسماع أفكارك واقتراحاتك." : "We'd love to hear from you."}
            </p>
          </div>
        </div>
        <form onSubmit={onSubmit} className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label htmlFor="c-name">{locale === "ar" ? "الاسم" : "Name"}</Label>
            <Input
              id="c-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              maxLength={100}
              className="mt-1"
            />
          </div>
          <div>
            <Label htmlFor="c-email">{locale === "ar" ? "البريد" : "Email"}</Label>
            <Input
              id="c-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              maxLength={255}
              className="mt-1"
            />
          </div>
          <div className="sm:col-span-2">
            <Label htmlFor="c-msg">{locale === "ar" ? "الرسالة" : "Message"}</Label>
            <Textarea
              id="c-msg"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              required
              maxLength={1000}
              rows={4}
              className="mt-1"
            />
          </div>
          <div className="sm:col-span-2">
            <Button
              type="submit"
              disabled={loading}
              size="lg"
              className="w-full rounded-xl sm:w-auto"
            >
              {loading ? "..." : locale === "ar" ? "إرسال" : "Send message"}
            </Button>
          </div>
        </form>
      </div>
    </section>
  );
}
