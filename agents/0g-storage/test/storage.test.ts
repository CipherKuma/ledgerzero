import { describe, expect, it } from "vitest";
import { downloadAgentMemory, MemoryStorageAdapter, uploadAgentMemory, wrapKeyForOwner } from "../src/index.js";

describe("0G Storage memory wrapper", () => {
  it("uploads encrypted memory and downloads byte-equal plaintext", async () => {
    process.env.LEDGER_AGENT_ID = "worker-001";
    const adapter = new MemoryStorageAdapter();
    const input = Buffer.from("persistent worker memory: owner=A, strategy=yield scout");

    const { cid } = await uploadAgentMemory("worker-001", input, adapter);
    const output = await downloadAgentMemory(cid, adapter);

    expect(cid).toMatch(/^0g:\/\//);
    expect(output.equals(input)).toBe(true);
  });

  it("wraps a deterministic sealed key for an owner", async () => {
    const result = await wrapKeyForOwner(Buffer.from("master-key"), "0x0000000000000000000000000000000000000B0B");
    expect(result.sealedKey).toMatch(/^0x[0-9a-f]{64}$/);
  });
});
