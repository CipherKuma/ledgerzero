import { readFrontendEnv } from "./env.mjs";

const baseUrl = process.env.LEDGER_ZERO_BASE_URL ?? "http://localhost:3023";
const env = readFrontendEnv(new URL("..", import.meta.url).pathname);
const expectedSigner = env.ZEROG_PROJECT_TEST_WALLET_ADDRESS?.toLowerCase();
const expectedComputeModel = env.ZEROG_COMPUTE_MODEL ?? "qwen2.5-omni";

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

const status = await json("/api/0g/status");
assert(status.res.status === 200, `status route returned ${status.res.status}`);
assert(status.body.signer?.address?.toLowerCase() === expectedSigner, "status signer is not the project test wallet");
assert(status.body.storageConfigured === true, "storage is not configured");
assert(status.body.computeConfigured === true, "compute is not configured");
assert(status.body.computeModel === expectedComputeModel, "unexpected compute model");
assert(status.body.contracts?.length === 7, "expected seven configured contract slots");
const coreContracts = status.body.contracts.filter((contract) => contract.name !== "LedgerMarketplace");
assert(coreContracts.every((contract) => contract.configured && contract.deployed), "not all core contracts are deployed");
const marketplace = status.body.contracts.find((contract) => contract.name === "LedgerMarketplace");
assert(marketplace, "marketplace contract slot missing");

const invalidStore = await json("/api/0g/store", {
  method: "POST",
  headers: { "content-type": "application/json" },
  body: JSON.stringify({}),
});
assert(invalidStore.res.status === 400, "store route should reject missing artifact");

const storage = await json("/api/0g/store", {
  method: "POST",
  headers: { "content-type": "application/json" },
  body: JSON.stringify({
    artifact: {
      type: "LedgerZeroApiE2E",
      createdAt: new Date().toISOString(),
      signer: env.ZEROG_PROJECT_TEST_WALLET_ADDRESS,
      note: "API route 0G Storage integration test",
    },
  }),
});
const storageBlocked = fundingBlocked(storage);
if (!storageBlocked) {
  assert(storage.res.status === 200, `storage route returned ${storage.res.status}`);
  assert(/^0x[a-fA-F0-9]{64}$/.test(storage.body.rootHash ?? ""), "storage rootHash missing");
  assert(/^0x[a-fA-F0-9]{64}$/.test(storage.body.txHash ?? ""), "storage txHash missing");
}

const invalidCompute = await json("/api/0g/compute", {
  method: "POST",
  headers: { "content-type": "application/json" },
  body: JSON.stringify({}),
});
assert(invalidCompute.res.status === 400, "compute route should reject missing task");

const compute = await json("/api/0g/compute", {
  method: "POST",
  headers: { "content-type": "application/json" },
  body: JSON.stringify({
    worker: "Atlas Research Worker",
    task: "Return concise JSON proving the Ledger Zero API E2E route can reach 0G Compute.",
  }),
});
const computeBlocked = fundingBlocked(compute);
if (!computeBlocked) {
  assert(compute.res.status === 200, `compute route returned ${compute.res.status}`);
  assert(typeof compute.body.content === "string" && compute.body.content.length > 10, "compute content missing");
  assert(compute.body.proof?.model === expectedComputeModel, "compute proof model mismatch");
  assert(/^0x[a-fA-F0-9]{40}$/.test(compute.body.proof?.provider ?? ""), "compute provider missing");
}

console.log(
  JSON.stringify(
    {
      ok: true,
      status: storageBlocked || computeBlocked ? "blocked" : "live",
      baseUrl,
      signer: status.body.signer.address,
      signerBalance0G: status.body.signer.balance,
      storageRoot: storageBlocked ? null : storage.body.rootHash,
      storageTx: storageBlocked ? null : storage.body.txHash,
      storageBlocker: storageBlocked ? storage.body.detail ?? storage.body.error : null,
      computeProvider: computeBlocked ? null : compute.body.proof.provider,
      computeChatID: computeBlocked ? null : compute.body.proof.chatID,
      computeBlocker: computeBlocked ? compute.body.detail ?? compute.body.error : null,
    },
    null,
    2,
  ),
);
