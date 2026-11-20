import { createServerFn } from "@tanstack/react-start";

type Msg = { role: "system" | "user" | "assistant"; content: string };
const apiBase = (
  process.env.API_BASE_URL ||
  process.env.VITE_API_BASE_URL ||
  "https://ana-refi-backend.ethiodeploy.app/api/v1"
).replace(/\/$/, "");

async function buildCatalogue(): Promise<string> {
  try {
    const responses = await Promise.allSettled([
      fetch(`${apiBase}/listings?status=active&per_page=60`, {
        headers: { Accept: "application/json" },
      }),
      fetch(`${apiBase}/competitions?per_page=100`, { headers: { Accept: "application/json" } }),
      fetch(`${apiBase}/volunteers?per_page=15`, { headers: { Accept: "application/json" } }),
    ]);
    const jsonFor = async (index: number): Promise<{ data?: Record<string, unknown>[] }> => {
      const result = responses[index];
      if (result.status !== "fulfilled" || !result.value.ok) return {};
      return (await result.value.json()) as { data?: Record<string, unknown>[] };
    };
    const [lJson, cJson, vJson] = await Promise.all([jsonFor(0), jsonFor(1), jsonFor(2)]);
    const listings = lJson.data ?? [];
    const competitions = (cJson.data ?? []).filter((r) =>
      ["upcoming", "open"].includes(String(r.status)),
    );
    const volunteers = vJson.data ?? [];
    const l = listings
      .map(
        (r) =>
          `- [${r.type}] ${r.title}${r.title_en ? ` / ${r.title_en}` : ""} — ${r.location ?? "Egypt"} — ${r.price} EGP${r.discount ? ` (-${r.discount}%)` : ""} — link: /listing/${r.id}`,
      )
      .join("\n");
    const c = competitions
      .map((r) => {
        const startDate = new Date(String(r.starts_at));
        const startLabel = Number.isNaN(startDate.getTime())
          ? "date to be announced"
          : startDate.toISOString().slice(0, 10);
        return `- ${r.title}${r.title_en ? ` / ${r.title_en}` : ""} — ${r.location} — starts ${startLabel} — fee ${r.entry_fee} EGP — prize ${r.prize_amount} EGP — ${r.participants_count}/${r.capacity} joined — link: /competitions`;
      })
      .join("\n");
    const v = volunteers
      .map((r) => `- ${r.full_name} (${r.interest_area}) — ${r.location ?? ""}`)
      .join("\n");
    return [
      l ? `STAYS / EXPERIENCES / PRODUCTS:\n${l}` : "",
      c ? `COMPETITIONS:\n${c}` : "",
      v ? `VOLUNTEERS:\n${v}` : "",
    ]
      .filter(Boolean)
      .join("\n\n");
  } catch {
    return "";
  }
}

export const chatWithAssistant = createServerFn({ method: "POST" })
  .validator((data: { messages: Msg[]; locale?: "ar" | "en" }) => data)
  .handler(async ({ data }) => {
    const apiKey = process.env.LOVABLE_API_KEY;
    if (!apiKey) throw new Error("Missing LOVABLE_API_KEY");
    const catalogue = await buildCatalogue();
    const system: Msg = {
      role: "system",
      content:
        (data.locale === "ar"
          ? "أنت المساعد الذكي لمنصة ANA Refi. تساعد الزوار في اكتشاف الإقامات الريفية والتجارب والمنتجات والمسابقات في مصر. أجب بإيجاز وبنبرة ودودة بالعربية. عند الترشيح استخدم فقط العناصر الموجودة في قائمة البيانات أدناه، واذكر الاسم والسعر والمكان والرابط. إن لم يوجد ما يناسب فقل ذلك بوضوح ولا تخترع عناصر."
          : "You are the smart assistant for ANA Refi, a platform for rural Egyptian stays, experiences, products and competitions. Answer briefly and warmly. When recommending, use ONLY the live catalogue below, and mention the name, price, location and link. If nothing matches, say so — never invent items.") +
        (catalogue ? `\n\nLIVE CATALOGUE (real database records):\n${catalogue}` : ""),
    };
    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [system, ...data.messages],
      }),
    });
    if (!response.ok)
      throw new Error(
        `AI gateway error ${response.status}: ${(await response.text()).slice(0, 200)}`,
      );
    const json = (await response.json()) as { choices?: { message?: { content?: string } }[] };
    return { content: json.choices?.[0]?.message?.content ?? "" };
  });
