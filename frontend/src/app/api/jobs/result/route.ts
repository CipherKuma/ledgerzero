import { NextResponse } from "next/server";
import { uploadJson } from "@/lib/0g/storage";
import { publicIntegrationError } from "@/lib/server/errors";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function isBytes32(value: unknown) {
  return typeof value === "string" && /^0x[0-9a-fA-F]{64}$/.test(value);
}

function isAddress(value: unknown) {
  return typeof value === "string" && /^0x[0-9a-fA-F]{40}$/.test(value);
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    if (!isBytes32(body.taskId)) throw new Error("taskId must be bytes32");
    if (!isAddress(body.actorAddress)) throw new Error("actorAddress must be an EVM address");
    if (typeof body.summary !== "string" || body.summary.trim().length < 12) {
      throw new Error("result summary must be at least 12 characters");
    }
    if (typeof body.signature !== "string" || !body.signature.startsWith("0x")) {
      throw new Error("wallet signature is required");
    }

    const artifact = {
      kind: "LedgerZeroJobResult",
      createdAt: new Date().toISOString(),
      taskId: body.taskId,
      actorAddress: body.actorAddress,
      workerTokenId: typeof body.workerTokenId === "string" ? body.workerTokenId : null,
      summary: body.summary.trim(),
      evidence: typeof body.evidence === "string" ? body.evidence.trim() : "",
      signature: body.signature,
      storage: "0G Storage",
    };
    const upload = await uploadJson(artifact);
    return NextResponse.json({ ok: true, artifact, rootHash: upload.rootHash, txHash: upload.txHash });
  } catch (error) {
    const integrationError = publicIntegrationError("job result upload failed", error);
    return NextResponse.json(integrationError.body, { status: integrationError.status });
  }
}
