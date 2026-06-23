import { NextResponse } from "next/server";
import { persistLatestDemoAttempt, runLedgerZeroDemoFlow } from "@/lib/demo-flow/run";
import { publicIntegrationError } from "@/lib/server/errors";
import { assertLocalOrExplicitDemo } from "@/lib/server/guards";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 180;

export async function POST(req: Request) {
  try {
    assertLocalOrExplicitDemo(req);
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 403 });
  }

  const origin = new URL(req.url).origin;
  let preset: "openclaw" | "hermes" = "hermes";
  let manifestUrl = "";
  let runCompute = true;
  let taskTitle = "";
  let taskDescription = "";
  let taskCategory = "";
  let taskTags: string[] = [];
  let taskPayment0G = "";
  let bondAmount0G = "";

  try {
    const body = await req.json().catch(() => ({}));
    if (body?.preset === "openclaw" || body?.preset === "hermes") preset = body.preset;
    manifestUrl = String(body?.manifestUrl ?? "").trim();
    runCompute = body?.runCompute !== false;
    taskTitle = String(body?.taskTitle ?? "").trim();
    taskDescription = String(body?.taskDescription ?? "").trim();
    taskCategory = String(body?.taskCategory ?? "").trim();
    taskTags = Array.isArray(body?.taskTags) ? body.taskTags.map((tag: unknown) => String(tag)) : [];
    taskPayment0G = String(body?.taskPayment0G ?? "").trim();
    bondAmount0G = String(body?.bondAmount0G ?? "").trim();
  } catch {
    return NextResponse.json({ error: "invalid body" }, { status: 400 });
  }

  const runId = `run-${Date.now().toString(36)}`;
  await persistLatestDemoAttempt({
    kind: "LedgerZeroDemoFlowAttempt",
    runId,
    createdAt: new Date().toISOString(),
    status: "running",
  });

  try {
    const receipt = await runLedgerZeroDemoFlow({
      origin,
      preset,
      manifestUrl: manifestUrl || undefined,
      runCompute,
      taskTitle,
      taskDescription,
      taskCategory,
      taskTags,
      taskPayment0G,
      bondAmount0G,
    });
    await persistLatestDemoAttempt({
      kind: "LedgerZeroDemoFlowAttempt",
      runId,
      createdAt: new Date().toISOString(),
      status: "succeeded",
      receiptRoot: receipt.storage.demoReceiptRoot,
    });
    return NextResponse.json(receipt);
  } catch (error) {
    await persistLatestDemoAttempt({
      kind: "LedgerZeroDemoFlowAttempt",
      runId,
      createdAt: new Date().toISOString(),
      status: "failed",
      error: (error as Error).message,
    });
    const integrationError = publicIntegrationError("full demo flow failed", error);
    return NextResponse.json(integrationError.body, { status: integrationError.status });
  }
}
