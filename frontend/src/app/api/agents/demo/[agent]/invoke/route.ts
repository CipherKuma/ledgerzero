import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request, { params }: { params: Promise<unknown> }) {
  const { agent } = (await params) as { agent?: string };
  if (agent !== "openclaw" && agent !== "hermes") {
    return NextResponse.json({ error: "unknown demo agent" }, { status: 404 });
  }

  const body = await req.json().catch(() => ({}));
  const task = String(body?.task ?? "Ledger Zero demo task");

  return NextResponse.json({
    agent,
    task,
    summary:
      agent === "openclaw"
        ? "OpenClaw-compatible gateway worker completed the requested operational task."
        : "Hermes-compatible self-improving worker completed the requested research task.",
    resultHashSeed: `${agent}:${task}`,
    memoryUpdate: "sealed update ready for 0G Storage",
    proofHooks: ["computeProof", "jobResult", "memoryUpdate"],
  });
}
