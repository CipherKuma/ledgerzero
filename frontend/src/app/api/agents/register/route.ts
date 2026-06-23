import { NextResponse } from "next/server";
import { demoManifestUrl, inspectAgentManifest } from "@/lib/agents/manifest";
import { registerInspectedAgent } from "@/lib/agents/register";
import { publicIntegrationError } from "@/lib/server/errors";
import { assertLocalOrExplicitDemo } from "@/lib/server/guards";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 120;

export async function POST(req: Request) {
  try {
    assertLocalOrExplicitDemo(req);
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 403 });
  }

  const origin = new URL(req.url).origin;
  let manifestUrl = "";
  let commitOnChain = true;
  let listForSale = true;

  try {
    const body = await req.json();
    const preset = String(body?.preset ?? "").trim();
    manifestUrl = String(body?.manifestUrl ?? "").trim();
    commitOnChain = body?.commitOnChain !== false;
    listForSale = body?.listForSale !== false;
    if (!manifestUrl && (preset === "openclaw" || preset === "hermes")) {
      manifestUrl = demoManifestUrl(preset, origin);
    }
  } catch {
    return NextResponse.json({ error: "invalid body" }, { status: 400 });
  }

  if (!manifestUrl) return NextResponse.json({ error: "manifestUrl or preset required" }, { status: 400 });

  try {
    const inspection = await inspectAgentManifest(manifestUrl, origin);
    if (inspection.status !== "ready") {
      return NextResponse.json({ error: "agent is not ready", inspection }, { status: 422 });
    }
    return NextResponse.json(await registerInspectedAgent({ inspection, commitOnChain, listForSale }));
  } catch (error) {
    const integrationError = publicIntegrationError("agent registration failed", error);
    return NextResponse.json(integrationError.body, { status: integrationError.status });
  }
}
