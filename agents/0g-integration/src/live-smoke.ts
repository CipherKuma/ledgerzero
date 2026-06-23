import { assertMemoryRoundTrip, readDemoWorker, runWorkerReasoning } from "./workflow.js";
import { loadZeroGConfig } from "./config.js";

const config = loadZeroGConfig();
const profile = await readDemoWorker(config);
console.log("worker.owner", profile.owner);
console.log("worker.memoryCID", profile.memoryCID);

const localMemory = await assertMemoryRoundTrip({
  agentId: "worker-001",
  plaintext: Buffer.from("Ledger app integration smoke memory")
});
console.log("local.memory.byteEqual", localMemory.byteEqual);

if (process.env.LEDGER_LIVE_COMPUTE === "1") {
  const result = await runWorkerReasoning("Reply with exactly: Ledger app integration smoke passed.");
  console.log("compute.output", result.output.replace(/\s+/g, " ").trim());
  console.log("compute.attestationDigest", result.attestationDigest);
} else {
  console.log("compute.skipped", "set LEDGER_LIVE_COMPUTE=1 to run a paid live inference");
}

process.exit(0);
