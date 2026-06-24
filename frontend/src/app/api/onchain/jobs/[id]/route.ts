import { NextResponse } from "next/server";
import { getOnChainJob } from "@/lib/onchain-data";
import { publicIntegrationError } from "@/lib/server/errors";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  try {
    const job = await getOnChainJob(id);
    if (!job) {
      return NextResponse.json({ error: "job not found" }, { status: 404 });
    }
    return NextResponse.json(job);
  } catch (error) {
    const integrationError = publicIntegrationError("job snapshot failed", error);
    return NextResponse.json(integrationError.body, { status: integrationError.status });
  }
}
