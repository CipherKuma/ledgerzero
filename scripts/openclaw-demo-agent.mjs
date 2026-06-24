import http from "node:http";

const port = Number(process.env.OPENCLAW_AGENT_PORT ?? "3031");
const host = process.env.OPENCLAW_AGENT_HOST ?? "127.0.0.1";
const ledgerZeroUrl = process.env.LEDGER_ZERO_URL ?? "http://localhost:3023";
const openClawUrl = process.env.OPENCLAW_GATEWAY_URL ?? "http://127.0.0.1:18789";
const operatorAddress =
  process.env.OPENCLAW_AGENT_OPERATOR ??
  process.env.NEXT_PUBLIC_LEDGER_ZERO_TEST_WALLET ??
  "0xFF8eF7B9EdD1Bf80A3454200CA2fb6AaCED3E120";

function origin() {
  return `http://localhost:${port}`;
}

function manifest() {
  return {
    protocol: "ledger-zero-agent",
    protocolVersion: "0.1",
    framework: "openclaw",
    name: "Native OpenClaw Gateway Worker",
    description:
      "A Ledger Zero adapter for a real OpenClaw Gateway. The operator UI is the native OpenClaw Control UI; this adapter only exposes Ledger Zero manifest, health, and job bridge metadata.",
    operatorAddress,
    agentUrl: openClawUrl,
    healthUrl: `${origin()}/health`,
    invokeUrl: `${origin()}/jobs`,
    iconUrl: `${ledgerZeroUrl}/brand/ledger-zero-logo.png`,
    capabilities: [
      {
        id: "openclaw.gateway-control",
        label: "OpenClaw Gateway",
        description: "Operates through the native OpenClaw Gateway and Control UI.",
      },
      {
        id: "openclaw.agent-session",
        label: "Agent sessions",
        description: "Accepts Ledger Zero work into OpenClaw agent sessions and returns proof-ready receipts.",
      },
      {
        id: "ledger-zero.memory-bridge",
        label: "0G memory bridge",
        description: "Declares encrypted owner-transferable memory updates for Ledger Zero registration.",
      },
    ],
    memory: {
      mode: "encrypted-owner-transferable",
      storage: "0G Storage",
      encryption: "OpenClaw workspace state plus Ledger Zero sealed-memory envelope for the current WorkerINFT owner",
      updatePolicy: "append job summaries in OpenClaw and persist owner-transferable memory roots during Ledger Zero registration",
    },
    pricing: {
      minPayout0G: "0.0005",
      bidBond0G: "0.0001",
      salePrice0G: "8.4",
    },
    automation: {
      mode: "polling",
      jobsUrl: `${ledgerZeroUrl}/api/onchain/jobs`,
      pollSeconds: 15,
      bidPolicy: {
        autoBid: false,
        requiresOwnerSigner: true,
        minPayout0G: "0.0005",
        bidBond0G: "0.0001",
        keywords: ["openclaw", "research", "proof", "ops", "browser"],
      },
    },
    proofHooks: ["computeProof", "jobResult", "memoryUpdate", "ownershipTransferReceipt"],
    jobInterface: {
      accepts: ["TaskBrief", "CapabilityMatch", "OwnerPolicy"],
      returns: ["JobResult", "ComputeProof", "MemoryUpdate"],
    },
    openclaw: {
      controlUiUrl: openClawUrl,
      healthUrl: `${openClawUrl}/health`,
      configUrl: `${openClawUrl}/control-ui-config.json`,
      profile: "ledgerzero",
    },
  };
}

function sendJson(res, status, body) {
  res.writeHead(status, {
    "content-type": "application/json; charset=utf-8",
    "access-control-allow-origin": ledgerZeroUrl,
    "access-control-allow-methods": "GET,POST,OPTIONS",
    "access-control-allow-headers": "content-type",
  });
  res.end(JSON.stringify(body, null, 2));
}

function redirect(res, location) {
  res.writeHead(302, { location });
  res.end();
}

async function readBody(req) {
  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  if (!chunks.length) return {};
  return JSON.parse(Buffer.concat(chunks).toString("utf8"));
}

async function fetchOpenClawHealth() {
  const response = await fetch(`${openClawUrl}/health`, { signal: AbortSignal.timeout(5000) });
  const body = await response.json().catch(() => ({}));
  return {
    ok: response.ok && body?.ok !== false,
    status: response.status,
    body,
  };
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url ?? "/", origin());

  if (req.method === "OPTIONS") return sendJson(res, 200, { ok: true });

  if (req.method === "GET" && url.pathname === "/") {
    return redirect(res, openClawUrl);
  }

  if (req.method === "GET" && ["/ledger-zero-agent.json", "/.well-known/ledger-zero-agent.json"].includes(url.pathname)) {
    return sendJson(res, 200, manifest());
  }

  if (req.method === "GET" && url.pathname === "/health") {
    try {
      const openclaw = await fetchOpenClawHealth();
      return sendJson(res, openclaw.ok ? 200 : 503, {
        ok: openclaw.ok,
        framework: "openclaw",
        adapter: "ledger-zero",
        status: openclaw.ok ? "ready" : "blocked",
        manifestUrl: `${origin()}/ledger-zero-agent.json`,
        openClawControlUi: openClawUrl,
        openClawHealth: openclaw.body,
      });
    } catch (error) {
      return sendJson(res, 503, {
        ok: false,
        framework: "openclaw",
        adapter: "ledger-zero",
        status: "blocked",
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  if (req.method === "POST" && url.pathname === "/jobs") {
    try {
      const body = await readBody(req);
      const taskId = String(body.taskId ?? `job-${Date.now().toString(36)}`);
      const task = String(body.task ?? body.description ?? "No task supplied.");
      const openclaw = await fetchOpenClawHealth();
      return sendJson(res, openclaw.ok ? 200 : 503, {
        taskId,
        createdAt: new Date().toISOString(),
        framework: "openclaw",
        status: openclaw.ok ? "accepted" : "blocked",
        summary: openclaw.ok
          ? `Ledger Zero accepted the task for native OpenClaw Gateway handling: ${task.slice(0, 180)}`
          : "Native OpenClaw Gateway health check failed.",
        openClawControlUi: openClawUrl,
        proofHooks: ["computeProof", "jobResult", "memoryUpdate"],
        memoryUpdate: `sealed-openclaw-memory:${taskId}`,
      });
    } catch (error) {
      return sendJson(res, 400, { error: error instanceof Error ? error.message : String(error) });
    }
  }

  return sendJson(res, 404, { error: "not found" });
});

server.listen(port, host, () => {
  console.log(`Ledger Zero OpenClaw adapter: http://localhost:${port}/ledger-zero-agent.json`);
  console.log(`Native OpenClaw Control UI: ${openClawUrl}`);
});
