import Anthropic from "@anthropic-ai/sdk";
import { AGES, FORTUNE_NAMES, GENDERS, buildPrompt, cleanField } from "@/lib/omikuji";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MODEL = process.env.ANTHROPIC_MODEL || "claude-haiku-5-5";

/** Tells the page whether live AI is available. */
export function GET() {
  return Response.json({ ai: Boolean(process.env.ANTHROPIC_API_KEY), model: MODEL });
}

/**
 * Writes one omikuji. The page sends only the visitor's choices; the prompt is
 * built here, so the API key can't be used for anything but omikuji text.
 * Responds with the AI's text as a plain-text stream.
 */
export async function POST(req: Request) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return Response.json({ error: "not_configured" }, { status: 503 });

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "bad_request" }, { status: 400 });
  }

  const fortune = cleanField(body.fortune, 4);
  const gender = cleanField(body.gender, 6);
  const age = cleanField(body.age, 6);
  const dept = cleanField(body.dept, 20);
  const match = dept ? cleanField(body.match, 20) : "";
  if (!FORTUNE_NAMES.includes(fortune) || !(GENDERS as readonly string[]).includes(gender) || (age && !(AGES as readonly string[]).includes(age))) {
    return Response.json({ error: "bad_request" }, { status: 400 });
  }

  const client = new Anthropic({ apiKey });
  const stream = client.messages.stream({
    model: MODEL,
    max_tokens: 400,
    messages: [{ role: "user", content: buildPrompt({ fortune, age, gender, dept, match }) }],
  });

  const encoder = new TextEncoder();
  const out = new ReadableStream<Uint8Array>({
    async start(controller) {
      try {
        for await (const event of stream) {
          if (event.type === "content_block_delta" && event.delta.type === "text_delta") {
            controller.enqueue(encoder.encode(event.delta.text));
          }
        }
        controller.close();
      } catch (err) {
        console.error("omikuji generation failed", err);
        controller.error(err);
      }
    },
    cancel() {
      stream.abort();
    },
  });

  return new Response(out, {
    headers: { "content-type": "text/plain; charset=utf-8", "cache-control": "no-store" },
  });
}
