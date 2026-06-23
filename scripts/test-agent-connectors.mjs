const baseUrl = process.env.LEDGER_ZERO_BASE_URL ?? "http://localhost:3023";
const commitOnChain = process.env.LEDGER_ZERO_AGENT_CHAIN !== "false";

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

async function json(path, init) {
  const res = await fetch(`${baseUrl}${path}`, init);
  const body = await res.json().catch(() => null);
  return { res, body };
}

function fundingBlocked(result) {
  return result.res.status === 402 && /funding|credits|balance/i.test(`${result.body?.error ?? ""} ${result.body?.detail ?? ""}`);
}

async function inspect(preset) {
  const result = await json("/api/agents/inspect", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ preset }),
  });
  assert(result.res.status === 200, `${preset} inspect returned ${result.res.status}: ${result.body?.error}`);
  assert(result.body.status === "ready", `${preset} agent is not ready`);
  assert(result.body.manifest.framework === preset, `${preset} framework mismatch`);
  assert(result.body.checks.every((check) => check.status !== "blocked"), `${preset} has blocked checks`);
  return result.body;
}

const openclaw = await inspect("openclaw");
const hermes = await inspect("hermes");

const registration = await json("/api/agents/register", {
  method: "POST",
  headers: { "content-type": "application/json" },
  body: JSON.stringify({
    manifestUrl: hermes.manifestUrl,
    commitOnChain,
    listForSale: true,
  }),
});

if (fundingBlocked(registration)) {
  console.log(
    JSON.stringify(
      {
        ok: true,
        status: "blocked",
        baseUrl,
        inspected: [openclaw.manifest.name, hermes.manifest.name],
        registrationBlocker: registration.body.detail ?? registration.body.error,
      },
      null,
      2,
    ),
  );
  process.exit(0);
}

assert(
  registration.res.status === 200,
  `Hermes registration returned ${registration.res.status}: ${registration.body?.error}`,
);
assert(registration.body.framework === "hermes", "registered framework mismatch");
assert(/^0x[a-fA-F0-9]{64}$/.test(registration.body.memoryRoot ?? ""), "memory root missing");
assert(/^0x[a-fA-F0-9]{64}$/.test(registration.body.manifestRoot ?? ""), "manifest root missing");
assert(/^0x[a-fA-F0-9]{64}$/.test(registration.body.registrationRoot ?? ""), "registration root missing");
if (commitOnChain) {
  assert(registration.body.status === "live", "expected live registration");
  assert(registration.body.tokenId, "token id missing");
  assert(registration.body.chainTxs?.length === 3, "expected mint/capability/identity transactions");
} else {
  assert(registration.body.status === "storage-only", "expected storage-only registration");
}

console.log(
  JSON.stringify(
    {
      ok: true,
      baseUrl,
      inspected: [openclaw.manifest.name, hermes.manifest.name],
      registered: registration.body.agentName,
      framework: registration.body.framework,
      tokenId: registration.body.tokenId,
      status: registration.body.status,
      memoryRoot: registration.body.memoryRoot,
      manifestRoot: registration.body.manifestRoot,
      registrationRoot: registration.body.registrationRoot,
      chainTxs: registration.body.chainTxs,
    },
    null,
    2,
  ),
);
