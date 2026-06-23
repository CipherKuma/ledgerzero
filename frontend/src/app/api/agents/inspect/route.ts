import { NextResponse } from "next/server";
import { demoManifestUrl, inspectAgentManifest } from "@/lib/agents/manifest";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const origin = new URL(req.url).origin;
  let manifestUrl = "";

  try {
    const body = await req.json();
    const preset = String(body?.preset ?? "").trim();
    manifestUrl = String(body?.manifestUrl ?? "").trim();
    if (!manifestUrl && (preset === "openclaw" || preset === "hermes")) {
      manifestUrl = demoManifestUrl(preset, origin);
    }
  } catch {
    return NextResponse.json({ error: "invalid body" }, { status: 400 });
  }

  if (!manifestUrl) return NextResponse.json({ error: "manifestUrl or preset required" }, { status: 400 });

  try {
    return NextResponse.json(await inspectAgentManifest(manifestUrl, origin));
  } catch (error) {
    return NextResponse.json({ error: `agent inspect failed: ${(error as Error).message}` }, { status: 422 });
  }
}
