import { NextResponse } from "next/server";
import { incrementClick, isJobId } from "@/lib/counter";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// POST /api/click
// Body: the bare job id (sendBeacon sends text/plain).
// Non-POST requests are rejected with 403 — matching the reference site.
export async function POST(request: Request) {
  let body = "";
  try { body = (await request.text()).trim(); } catch { /* ignore */ }
  if (!isJobId(body)) {
    return NextResponse.json({ ok: false, error: "invalid id" }, { status: 400 });
  }
  incrementClick(body);
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
