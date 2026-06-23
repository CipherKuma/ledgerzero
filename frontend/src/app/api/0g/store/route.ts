import { NextResponse } from "next/server";
import { uploadJson } from "@/lib/0g/storage";
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

  let artifact: unknown;
  try {
    artifact = (await req.json())?.artifact;
  } catch {
    return NextResponse.json({ error: "invalid body" }, { status: 400 });
  }

  if (!artifact) return NextResponse.json({ error: "artifact required" }, { status: 400 });

  try {
    const result = await uploadJson(artifact);
    return NextResponse.json(result);
  } catch (error) {
    const integrationError = publicIntegrationError("0G Storage failed", error);
    return NextResponse.json(integrationError.body, { status: integrationError.status });
  }
}
