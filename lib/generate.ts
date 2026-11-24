"use client";
import type { PromptInput } from "./omikuji";

/** Asks the server whether live AI is configured. */
export async function aiAvailable(): Promise<boolean> {
  try {
    const r = await fetch("/api/omikuji");
    return Boolean((await r.json()).ai);
  } catch {
    return false;
  }
}

/** Streams the AI's omikuji text from the API route. Returns "" when AI is unavailable or fails. */
export async function generate(input: PromptInput, onText: (t: string) => void): Promise<string> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 20000);
  try {
    const res = await fetch("/api/omikuji", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(input),
      signal: ctrl.signal,
    });
    if (!res.ok || !res.body) return "";
    const reader = res.body.getReader();
    const dec = new TextDecoder();
    let text = "";
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      text += dec.decode(value, { stream: true });
      onText(text);
    }
    return text;
  } catch {
    return "";
  } finally {
    clearTimeout(timer);
  }
}
