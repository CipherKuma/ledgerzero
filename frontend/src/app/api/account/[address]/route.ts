import { NextResponse } from "next/server";
import { ethers } from "ethers";
import { buildAccountSnapshot } from "@/lib/directory";
import { publicIntegrationError } from "@/lib/server/errors";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(_req: Request, { params }: { params: Promise<{ address: string }> }) {
  const { address } = await params;
  if (!ethers.isAddress(address)) {
    return NextResponse.json({ error: "valid account address required" }, { status: 400 });
  }

  try {
    return NextResponse.json(await buildAccountSnapshot(address));
  } catch (error) {
    const integrationError = publicIntegrationError("account snapshot failed", error);
    return NextResponse.json(integrationError.body, { status: integrationError.status });
  }
}
