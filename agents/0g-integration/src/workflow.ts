import { randomBytes } from "node:crypto";
import {
  downloadAgentMemory,
  MemoryStorageAdapter,
  uploadAgentMemory,
  wrapKeyForOwner,
  type StorageAdapter,
} from "../../0g-storage/src/index.js";
import {
  runReasoning,
  type LedgerModel,
  type ReasoningResult,
} from "../../0g-compute/src/index.js";
import { readWorkerProfile, type WorkerProfile } from "./contracts.js";
import { loadZeroGConfig, type ZeroGIntegrationConfig } from "./config.js";

export type PreparedWorkerMemory = {
  cid: string;
  sealedKey: `0x${string}`;
};

export async function prepareWorkerMemory(input: {
  agentId: string;
  plaintext: Buffer;
  owner: `0x${string}`;
  masterKey?: Buffer;
  storage?: StorageAdapter;
}): Promise<PreparedWorkerMemory> {
  const storage = input.storage ?? new MemoryStorageAdapter();
  const [{ cid }, { sealedKey }] = await Promise.all([
    uploadAgentMemory(input.agentId, input.plaintext, storage),
    wrapKeyForOwner(input.masterKey ?? randomBytes(32), input.owner),
  ]);
  return { cid, sealedKey };
}

export async function assertMemoryRoundTrip(input: {
  agentId: string;
  plaintext: Buffer;
  storage?: StorageAdapter;
}): Promise<{ cid: string; byteEqual: true }> {
  process.env.LEDGER_AGENT_ID = input.agentId;
  const storage = input.storage ?? new MemoryStorageAdapter();
  const { cid } = await uploadAgentMemory(
    input.agentId,
    input.plaintext,
    storage,
  );
  const output = await downloadAgentMemory(cid, storage);
  if (!output.equals(input.plaintext))
    throw new Error("0G memory roundtrip failed byte equality");
  return { cid, byteEqual: true };
}

export async function runWorkerReasoning(
  prompt: string,
  model: LedgerModel = "0g-qwen3.6-plus",
): Promise<ReasoningResult> {
  return runReasoning(prompt, model);
}

export async function readDemoWorker(
  config: ZeroGIntegrationConfig = loadZeroGConfig(),
): Promise<WorkerProfile> {
  return readWorkerProfile(1n, config);
}
