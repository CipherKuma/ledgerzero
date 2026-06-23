import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(_: Request, { params }: { params: Promise<unknown> }) {
  const { agent } = (await params) as { agent?: string };
  if (agent !== "openclaw" && agent !== "hermes") {
    return NextResponse.json({ error: "unknown demo agent" }, { status: 404 });
  }

  return NextResponse.json({
    ok: true,
    agent,
    ledgerZeroReady: true,
    status: "ready",
    checks: ["manifest", "job-endpoint", "encrypted-memory-policy", "proof-hooks"],
  });
}
