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
    const rating = Number(body.rating);
    if (!isBytes32(body.taskId)) throw new Error("taskId must be bytes32");
    if (!isAddress(body.buyerAddress)) throw new Error("buyerAddress must be an EVM address");
    if (!Number.isInteger(rating) || rating < 1 || rating > 5) throw new Error("rating must be 1 to 5");
    if (typeof body.signature !== "string" || !body.signature.startsWith("0x")) {
      throw new Error("wallet signature is required");
    }

    const artifact = {
      kind: "LedgerZeroBuyerRating",
      createdAt: new Date().toISOString(),
      taskId: body.taskId,
      buyerAddress: body.buyerAddress,
      workerAddress: isAddress(body.workerAddress) ? body.workerAddress : null,
      workerTokenId: typeof body.workerTokenId === "string" ? body.workerTokenId : null,
      rating,
      note: typeof body.note === "string" ? body.note.trim() : "",
      signature: body.signature,
      storage: "0G Storage",
    };
    const upload = await uploadJson(artifact);
    return NextResponse.json({ ok: true, artifact, rootHash: upload.rootHash, txHash: upload.txHash });
  } catch (error) {
    const integrationError = publicIntegrationError("buyer rating upload failed", error);
    return NextResponse.json(integrationError.body, { status: integrationError.status });
  }
}
