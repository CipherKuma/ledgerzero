import { NextResponse } from "next/server";
import { getZeroGStatus } from "@/lib/0g/status";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json(await getZeroGStatus({ timeoutMs: 5_000, cacheMs: 15_000, preferFresh: true }));
}
