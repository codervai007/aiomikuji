export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Checks the staff PIN (env STAFF_PIN, default "1234").
 * This keeps visitors out of the settings screen; it is not strong security.
 */
export async function POST(req: Request) {
  let pin = "";
  try {
    pin = String((await req.json()).pin ?? "");
  } catch {
    /* empty */
  }
  const ok = pin.length > 0 && pin === (process.env.STAFF_PIN || "1234");
  return Response.json({ ok }, { status: ok ? 200 : 401 });
}
