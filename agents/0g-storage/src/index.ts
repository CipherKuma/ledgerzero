import {
  createCipheriv,
  createDecipheriv,
  createHash,
  createHmac,
  randomBytes,
} from "node:crypto";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

export type UploadResult = { cid: string };
export type SealedKeyResult = { sealedKey: `0x${string}` };

export interface StorageAdapter {
  uploadFile(path: string): Promise<string>;
  downloadFile(cid: string, outputPath: string): Promise<void>;
}

const DEFAULT_INDEXER_RPC = "https://indexer-storage-testnet-turbo.0g.ai";
const DEFAULT_GALILEO_RPC = "https://evmrpc-testnet.0g.ai";

const memoryIndex = new Map<string, Buffer>();

export class MemoryStorageAdapter implements StorageAdapter {
  async uploadFile(path: string): Promise<string> {
    const data = await readFile(path);
    const cid = `0g://local-${createHash("sha256").update(data).digest("hex")}`;
    memoryIndex.set(cid, data);
    return cid;
  }

  async downloadFile(cid: string, outputPath: string): Promise<void> {
    const data = memoryIndex.get(cid);
    if (!data) throw new Error(`missing local 0G object: ${cid}`);
    await writeFile(outputPath, data);
  }
}

export async function createLiveStorageAdapter(): Promise<StorageAdapter> {
  const privateKey = process.env.PRIVATE_KEY;
  if (!privateKey)
    throw new Error(
      "PRIVATE_KEY is required for live 0G Storage uploadFile/downloadFile",
    );

  const storageSdk = await import("@0gfoundation/0g-storage-ts-sdk");
  const ethers = await import("ethers");
  const Indexer = (storageSdk as any).Indexer;
  const ZgFile = (storageSdk as any).ZgFile;
  if (!Indexer || !ZgFile)
    throw new Error("0G storage SDK exports Indexer and ZgFile are required");

  const indexer = new Indexer(
    process.env.ZG_STORAGE_INDEXER_RPC ?? DEFAULT_INDEXER_RPC,
  );
  const rpc = process.env.GALILEO_RPC ?? DEFAULT_GALILEO_RPC;
  const provider = new ethers.JsonRpcProvider(rpc);
  const signer = new ethers.Wallet(privateKey, provider);

  return {
    async uploadFile(path: string): Promise<string> {
      const file = await ZgFile.fromFilePath(path);
      try {
        if (typeof indexer.uploadFile === "function") {
          const result = await indexer.uploadFile(file, rpc, signer);
          return normalizeCid(result);
        }
        const [tx, err] = await indexer.upload(file, rpc, signer);
        if (err) throw err;
        const [tree, treeErr] = await file.merkleTree();
        if (treeErr) throw treeErr;
        return `0g://${tree.rootHash()}?tx=${tx}`;
      } finally {
        await file.close?.();
      }
    },
    async downloadFile(cid: string, outputPath: string): Promise<void> {
      const rootHash = cid.replace(/^0g:\/\//, "").split("?")[0];
      if (typeof indexer.downloadFile === "function") {
        await indexer.downloadFile(rootHash, outputPath, false);
        return;
      }
      const err = await indexer.download(rootHash, outputPath, false);
      if (err) throw err;
    },
  };
}

export async function uploadAgentMemory(
  agentId: string,
  plaintext: Buffer,
  adapter: StorageAdapter = new MemoryStorageAdapter(),
): Promise<UploadResult> {
  const { payload } = encryptMemory(agentId, plaintext);
  const dir = await mkdtemp(join(tmpdir(), "ledger-0g-memory-"));
  const path = join(dir, `${agentId}.memory.enc`);
  try {
    await writeFile(path, payload);
    return { cid: await adapter.uploadFile(path) };
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
}

export async function downloadAgentMemory(
  cid: string,
  adapter: StorageAdapter = new MemoryStorageAdapter(),
): Promise<Buffer> {
  const dir = await mkdtemp(join(tmpdir(), "ledger-0g-memory-"));
  const path = join(dir, "memory.enc");
  try {
    await adapter.downloadFile(cid, path);
    return decryptMemory(await readFile(path));
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
}

export async function wrapKeyForOwner(
  masterKey: Buffer,
  ownerAddr: string,
): Promise<SealedKeyResult> {
  const normalizedOwner = ownerAddr.toLowerCase();
  const sealedKey = createHmac("sha256", masterKey)
    .update(`ledger-owner:${normalizedOwner}`)
    .digest("hex");
  return { sealedKey: `0x${sealedKey}` };
}

function encryptMemory(
  agentId: string,
  plaintext: Buffer,
): { payload: Buffer } {
  const key = deriveAgentKey(agentId);
  const iv = randomBytes(16);
  const cipher = createCipheriv("aes-256-ctr", key, iv);
  const ciphertext = Buffer.concat([cipher.update(plaintext), cipher.final()]);
  return { payload: Buffer.concat([Buffer.from("LEDGER0G1"), iv, ciphertext]) };
}

function decryptMemory(payload: Buffer): Buffer {
  const magic = payload.subarray(0, 9).toString();
  if (magic !== "LEDGER0G1")
    throw new Error("invalid Ledger 0G memory envelope");
  const iv = payload.subarray(9, 25);
  const ciphertext = payload.subarray(25);
  const key = deriveAgentKey(process.env.LEDGER_AGENT_ID ?? "worker-001");
  const decipher = createDecipheriv("aes-256-ctr", key, iv);
  return Buffer.concat([decipher.update(ciphertext), decipher.final()]);
}

function deriveAgentKey(agentId: string): Buffer {
  const secret =
    process.env.LEDGER_MEMORY_SECRET ?? "ledger-hackathon-demo-memory-secret";
  return createHash("sha256").update(`${secret}:${agentId}`).digest();
}

function normalizeCid(result: unknown): string {
  if (typeof result === "string")
    return result.startsWith("0g://") ? result : `0g://${result}`;
  if (Array.isArray(result)) return normalizeCid(result[0]);
  if (result && typeof result === "object") {
    const object = result as Record<string, unknown>;
    return normalizeCid(
      object.rootHash ?? object.cid ?? object.hash ?? object.tx,
    );
  }
  throw new Error("0G uploadFile did not return a CID/root hash");
}
