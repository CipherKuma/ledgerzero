import { NextResponse } from "next/server";
import { clearLedgerSnapshotCache } from "@/lib/onchain-data";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST() {
  clearLedgerSnapshotCache();
  return NextResponse.json({ ok: true, refreshedAt: new Date().toISOString() });
}
