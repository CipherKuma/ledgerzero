import { Indexer, MemData } from "@0gfoundation/0g-storage-ts-sdk";
import { ethers } from "ethers";
import { getWallet, ZEROG_INDEXER, ZEROG_RPC } from "./server";

function isRetryableUploadError(error: unknown) {
  const message = String(error instanceof Error ? error.message : error).toLowerCase();
  return (
    message.includes("replacement fee too low") ||
    message.includes("replacement transaction underpriced") ||
    message.includes("nonce too low") ||
    message.includes("socket") ||
    message.includes("timeout")
  );
}

function wait(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function uploadAttempt(indexer: Indexer, data: MemData, signer: ReturnType<typeof getWallet>) {
  return Promise.race([
    indexer.upload(data, ZEROG_RPC, signer),
    wait(60000).then(() => [null, new Error("0G Storage upload timed out after 60s")] as const),
  ]);
}

export async function uploadJson(obj: unknown): Promise<{ rootHash: string; txHash: string }> {
  const signer = getWallet();
  const balance = await signer.provider?.getBalance(signer.address);
  if (balance !== undefined && balance < ethers.parseEther("0.001")) {
    throw new Error(`project 0G signer balance too low for storage upload: ${ethers.formatEther(balance)} 0G`);
  }
  const indexer = new Indexer(ZEROG_INDEXER);
  const bytes = new TextEncoder().encode(JSON.stringify(obj));
  const data = new MemData(bytes);

  const [tree, treeErr] = await data.merkleTree();
  if (treeErr !== null) throw new Error(`merkle: ${treeErr}`);
  const computedRoot = tree?.rootHash() ?? "";

  let tx: unknown;
  let lastError: unknown = null;
  for (let attempt = 0; attempt < 3; attempt += 1) {
    const [uploadTx, uploadErr] = await uploadAttempt(indexer, data, signer);
    if (uploadErr === null) {
      tx = uploadTx;
      lastError = null;
      break;
    }
    lastError = uploadErr;
    if (!isRetryableUploadError(uploadErr) || attempt === 2) break;
    await wait(1200 * (attempt + 1));
  }
  if (lastError !== null) throw new Error(`upload: ${lastError}`);

  return {
    rootHash: (tx as { rootHash?: string })?.rootHash ?? computedRoot,
    txHash: (tx as { txHash?: string })?.txHash ?? "",
  };
}

export async function storageReachable(rootHash: string) {
  try {
    const res = await fetch(`${ZEROG_INDEXER}/file?root=${rootHash}`, { method: "HEAD" });
    return res.ok;
  } catch {
    return false;
  }
}
