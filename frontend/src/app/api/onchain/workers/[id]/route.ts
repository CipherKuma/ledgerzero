import { NextResponse } from "next/server";
import { getOnChainWorker } from "@/lib/onchain-data";
import { publicIntegrationError } from "@/lib/server/errors";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  try {
    const worker = await getOnChainWorker(id);
    if (!worker) {
      return NextResponse.json({ error: "worker not found" }, { status: 404 });
    }
    return NextResponse.json(worker);
  } catch (error) {
    const integrationError = publicIntegrationError("worker snapshot failed", error);
    return NextResponse.json(integrationError.body, { status: integrationError.status });
  }
}
