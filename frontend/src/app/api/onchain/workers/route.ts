import { NextResponse } from "next/server";
import { buildWorkerDirectory } from "@/lib/directory";
import { publicIntegrationError } from "@/lib/server/errors";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    return NextResponse.json(await buildWorkerDirectory());
  } catch (error) {
    const integrationError = publicIntegrationError("workers snapshot failed", error);
    return NextResponse.json(integrationError.body, { status: integrationError.status });
  }
}
