import { readFrontendEnv } from "./env.mjs";

const baseUrl = process.env.LEDGER_ZERO_BASE_URL ?? "http://localhost:3023";
const runCompute = process.env.LEDGER_ZERO_DEMO_COMPUTE !== "false";
const expectedComputeModel = readFrontendEnv(new URL("..", import.meta.url).pathname).ZEROG_COMPUTE_MODEL ?? "qwen2.5-omni";

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

const res = await fetch(`${baseUrl}/api/demo/full-flow`, {
  method: "POST",
  headers: { "content-type": "application/json" },
  body: JSON.stringify({ preset: "hermes", runCompute }),
});

const body = await res.json().catch(() => null);
if (res.status === 402 && /funding|credits|balance/i.test(`${body?.error ?? ""} ${body?.detail ?? ""}`)) {
  console.log(
    JSON.stringify(
      {
        ok: true,
        status: "blocked",
        baseUrl,
        runCompute,
        blocker: body.detail ?? body.error,
      },
      null,
      2,
    ),
  );
  process.exit(0);
}

assert(res.status === 200, `full demo flow returned ${res.status}: ${body?.error}`);
assert(body?.kind === "LedgerZeroFullDemoFlow", "unexpected receipt kind");
assert(body.framework === "hermes", "framework mismatch");
assert(body.tokenId, "token id missing");
assert(/^0x[a-fA-F0-9]{64}$/.test(body.taskId), "task id missing");
assert(/^0x[a-fA-F0-9]{64}$/.test(body.storage.taskBriefRoot), "task brief root missing");
assert(/^0x[a-fA-F0-9]{64}$/.test(body.storage.jobResultRoot), "job result root missing");
assert(/^0x[a-fA-F0-9]{64}$/.test(body.storage.transferReceiptRoot), "transfer receipt root missing");
assert(/^0x[a-fA-F0-9]{64}$/.test(body.storage.demoReceiptRoot), "demo receipt root missing");
assert(body.chainTxs.length >= 10, "expected mint/register/fund/post/bid/purchase/transfer/release transactions");
assert(body.chainTxs.some((tx) => tx.label === "purchase worker token"), "purchase tx missing");
assert(body.chainTxs.some((tx) => tx.label === "transfer worker token"), "transfer tx missing");
assert(body.chainTxs.some((tx) => tx.label === "release escrow payment"), "release tx missing");
assert(
  body.economics.payoutRecipientAfterTransfer.toLowerCase() === body.accounts.newOwner.toLowerCase(),
  "payout recipient did not follow new owner",
);
assert(
  Number(body.economics.newOwnerBalanceAfter0G) > Number(body.economics.newOwnerBalanceBefore0G),
  "new owner balance did not increase after release",
);
if (runCompute) {
  assert(body.compute.ran === true, "compute did not run");
  assert(body.compute.proof?.model === expectedComputeModel, "compute model mismatch");
}

console.log(
  JSON.stringify(
    {
      ok: true,
      baseUrl,
      runCompute,
      agentName: body.agentName,
      tokenId: body.tokenId,
      taskId: body.taskId,
      buyer: body.accounts.buyer,
      newOwner: body.accounts.newOwner,
      payoutAfter: body.economics.payoutRecipientAfterTransfer,
      jobResultRoot: body.storage.jobResultRoot,
      demoReceiptRoot: body.storage.demoReceiptRoot,
      txs: body.chainTxs.map((tx) => ({ label: tx.label, hash: tx.hash, block: tx.block })),
    },
    null,
    2,
  ),
);
