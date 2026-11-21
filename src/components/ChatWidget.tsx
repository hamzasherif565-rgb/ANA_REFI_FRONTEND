import { useEffect, useRef, useState } from "react";
import { MessageCircle, Send, X, Sparkles } from "lucide-react";
import { useServerFn } from "@tanstack/react-start";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useI18n } from "@/lib/i18n";
import { chatWithAssistant } from "@/lib/ai-chat.functions";

type Msg = { role: "user" | "assistant"; content: string };

export function ChatWidget() {
  const { t, locale } = useI18n();
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Msg[]>([]);
  const [loading, setLoading] = useState(false);
  const chat = useServerFn(chatWithAssistant);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, open]);

  const greeting: Msg = {
    role: "assistant",
    content:
      locale === "ar"
        ? "أهلاً! أنا مساعد ANA Refi. اسألني عن أي إقامة أو تجربة أو منتج أو مسابقة."
        : "Hi! I'm the ANA Refi assistant. Ask me about any stay, experience, product, or competition.",
  };
  const list = messages.length ? messages : [greeting];

  async function send() {
    const text = input.trim();
    if (!text || loading) return;
    const next = [...messages, { role: "user" as const, content: text }];
    setMessages(next);
    setInput("");
    setLoading(true);
    try {
      const res = await chat({ data: { messages: next, locale } });
      setMessages([...next, { role: "assistant", content: res.content }]);
    } catch (e) {
      setMessages([
        ...next,
        {
          role: "assistant",
          content:
            locale === "ar" ? "حدث خطأ. حاول مجددًا." : "Something went wrong. Please try again.",
        },
      ]);
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label="Assistant"
        aria-expanded={open}
        aria-controls="ana-refi-assistant"
        className={cn(
          "fixed bottom-20 end-4 z-40 grid h-14 w-14 place-items-center rounded-full bg-gradient-primary text-primary-foreground shadow-elevated transition-transform hover:scale-105 md:bottom-6",
          open && "rotate-90",
        )}
      >
        {open ? <X className="h-6 w-6" /> : <MessageCircle className="h-6 w-6" />}
      </button>

      {open && (
        <section
          id="ana-refi-assistant"
          role="dialog"
          aria-label={t("chat.title")}
          className="fixed inset-x-4 bottom-36 z-40 flex max-h-[70vh] flex-col overflow-hidden rounded-3xl border border-border bg-card shadow-elevated md:inset-x-auto md:end-6 md:bottom-24 md:w-96"
        >
          <div className="flex items-center gap-2 bg-gradient-primary p-4 text-primary-foreground">
            <Sparkles className="h-5 w-5" />
            <div className="flex-1">
              <p className="text-sm font-bold">{t("chat.title")}</p>
              <p className="text-[11px] opacity-90">{t("chat.subtitle")}</p>
            </div>
          </div>

          <div
            ref={scrollRef}
            role="log"
            aria-live="polite"
            aria-relevant="additions text"
            className="flex-1 space-y-3 overflow-y-auto p-4"
          >
            {list.map((m, i) => (
              <div
                key={i}
                className={cn(
                  "max-w-[85%] rounded-2xl px-3 py-2 text-sm",
                  m.role === "user"
                    ? "ms-auto bg-primary text-primary-foreground"
                    : "bg-muted text-foreground",
                )}
              >
                {m.content}
              </div>
            ))}
            {loading && (
              <div className="max-w-[85%] rounded-2xl bg-muted px-3 py-2 text-sm text-muted-foreground">
                {t("chat.typing")}
              </div>
            )}
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              send();
            }}
            className="flex items-center gap-2 border-t border-border p-3"
          >
            <input
              type="text"
              aria-label={t("chat.placeholder")}
              maxLength={1000}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={t("chat.placeholder")}
              className="flex-1 rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
            />
            <Button
              type="submit"
              size="icon"
              className="rounded-xl"
              disabled={loading || !input.trim()}
            >
              <Send className="h-4 w-4" />
            </Button>
          </form>
        </section>
      )}
    </>
  );
}
