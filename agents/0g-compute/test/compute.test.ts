import { describe, expect, it } from "vitest";
import { verifyAttestation } from "../src/index.js";

describe("0G Compute attestation helpers", () => {
  it("validates attestation digest shape", async () => {
    const digest = `0x${"a".repeat(64)}`;
    await expect(verifyAttestation(digest)).resolves.toBe(true);
    await expect(verifyAttestation("not-a-digest")).resolves.toBe(false);
  });
});
