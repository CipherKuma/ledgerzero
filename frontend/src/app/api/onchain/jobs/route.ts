import { NextResponse } from "next/server";
import { getOnChainJobs } from "@/lib/onchain-data";
import { publicIntegrationError } from "@/lib/server/errors";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    return NextResponse.json(await getOnChainJobs());
  } catch (error) {
    const integrationError = publicIntegrationError("jobs snapshot failed", error);
    return NextResponse.json(integrationError.body, { status: integrationError.status });
  }
}
