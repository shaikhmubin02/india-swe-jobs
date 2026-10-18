import { NextResponse } from "next/server";
import { incrementSave, isJobId } from "@/lib/counter";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// POST /api/save
// Body: "save:<id>" or "unsave:<id>" — the same wire format the reference site
// uses from its sendBeacon calls.
export async function POST(request: Request) {
  let body = "";
  try { body = (await request.text()).trim(); } catch { /* ignore */ }

  const m = body.match(/^(save|unsave):(.+)$/);
  if (!m || !isJobId(m[2])) {
    return NextResponse.json({ ok: false, error: "expected save:<id> or unsave:<id>" }, { status: 400 });
  }
  incrementSave(m[2].trim(), m[1] === "save");
  return new NextResponse(null, {
    status: 204,
    headers: { "cache-control": "no-store" },
  });
}

export async function GET() {
  return NextResponse.json({ ok: false, error: "method not allowed" }, { status: 403 });
}
export async function OPTIONS() {
  return NextResponse.json({ ok: false, error: "method not allowed" }, { status: 403 });
}
