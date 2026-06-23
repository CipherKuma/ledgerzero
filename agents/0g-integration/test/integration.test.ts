import { describe, expect, it } from "vitest";
import { MemoryStorageAdapter } from "../../0g-storage/src/index.js";
import { assertMemoryRoundTrip, prepareWorkerMemory } from "../src/workflow.js";
import { loadZeroGConfig } from "../src/config.js";
import { toWorkerProfile } from "../src/contracts.js";

describe("0G app integration kit", () => {
  it("loads canonical Galileo config with deployed addresses", () => {
    const config = loadZeroGConfig({ GALILEO_CHAIN_ID: "16602" });
    expect(config.chainId).toBe(16602);
    expect(config.nativeToken).toBe("0G");
    expect(config.addresses.workerINFT).toBe("0xd4d74E089DD9A09FF768be95d732081bd542E498");
  });

  it("rejects non-Galileo chain IDs", () => {
    expect(() => loadZeroGConfig({ GALILEO_CHAIN_ID: "16601" })).toThrow(/16602/);
  });

  it("prepares encrypted worker memory and verifies local byte equality", async () => {
    const storage = new MemoryStorageAdapter();
    const plaintext = Buffer.from("future app can call this without copying demo scripts");

    const prepared = await prepareWorkerMemory({
      agentId: "worker-001",
      plaintext,
      owner: "0x0000000000000000000000000000000000000B0B",
      masterKey: Buffer.from("master-key"),
      storage
    });
    const roundTrip = await assertMemoryRoundTrip({ agentId: "worker-001", plaintext, storage });

    expect(prepared.cid).toMatch(/^0g:\/\//);
    expect(prepared.sealedKey).toMatch(/^0x[0-9a-f]{64}$/);
    expect(roundTrip.byteEqual).toBe(true);
  });

  it("shapes contract metadata into an app-facing worker profile", () => {
    const profile = toWorkerProfile(1n, "0x6641221B1cb66Dc9f890350058A7341eF0eD600b", {
      agentName: "worker-001",
      sealedKey: "0x1234",
      memoryCID: "0g://abc",
      initialReputationRef: "erc8004:0x8004B663056A597Dffe9eCcC1965A193B7388713",
      updatedAt: 1777739286n
    });

    expect(profile.owner).toBe("0x6641221B1cb66Dc9f890350058A7341eF0eD600b");
    expect(profile.memoryCID).toBe("0g://abc");
    expect(profile.initialReputationRef).toContain("erc8004:");
  });
});
