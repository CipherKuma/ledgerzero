import { NextResponse } from "next/server";
import { generateWith0GCompute } from "@/lib/0g/compute";
import { publicIntegrationError } from "@/lib/server/errors";
import { assertLocalOrExplicitDemo } from "@/lib/server/guards";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function POST(req: Request) {
  try {
    assertLocalOrExplicitDemo(req);
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 403 });
  }

  let task = "";
  let worker = "";
  try {
    const body = await req.json();
    task = String(body?.task ?? "").trim();
    worker = String(body?.worker ?? "Atlas Research Worker").trim();
  } catch {
    return NextResponse.json({ error: "invalid body" }, { status: 400 });
  }

  if (!task) return NextResponse.json({ error: "task required" }, { status: 400 });

  try {
    const result = await generateWith0GCompute([
      {
        role: "system",
        content:
          "You are a Ledger Zero AI worker. Return concise JSON with summary, risks, nextSteps, and confidence.",
      },
      {
        role: "user",
        content: `Worker: ${worker}\nTask: ${task}`,
      },
    ]);
    return NextResponse.json(result);
  } catch (error) {
    const integrationError = publicIntegrationError("Compute failed", error);
    return NextResponse.json(integrationError.body, { status: integrationError.status });
  }
}
