import { NextResponse } from "next/server";
import { getZeroGStatus } from "@/lib/0g/status";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json(await getZeroGStatus());
}
