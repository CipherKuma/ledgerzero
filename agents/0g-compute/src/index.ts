import { createHash } from "node:crypto";
import { mkdir, readdir, readFile } from "node:fs/promises";
import { createRequire } from "node:module";
import { join } from "node:path";

export type LedgerModel = "0g-glm-5" | "0g-qwen3.6-plus";
export type ReasoningResult = { output: string; attestationDigest: string };

const MODEL_HINTS: Record<LedgerModel, string[]> = {
  "0g-glm-5": ["glm-5", "glm"],
  "0g-qwen3.6-plus": ["qwen3.6", "qwen"],
};
const require = createRequire(import.meta.url);

export async function runReasoning(
  prompt: string,
  model: LedgerModel,
): Promise<ReasoningResult> {
  const privateKey = process.env.PRIVATE_KEY;
  if (!privateKey)
    throw new Error("PRIVATE_KEY is required for live 0G Compute reasoning");

  const {
    createZGComputeNetworkBroker,
  } = require("@0gfoundation/0g-compute-ts-sdk");
  const ethers = require("ethers");
  const provider = new ethers.JsonRpcProvider(
    process.env.GALILEO_RPC ?? "https://evmrpc-testnet.0g.ai",
  );
  const wallet = new ethers.Wallet(privateKey, provider);
  const broker = await createZGComputeNetworkBroker(wallet as any);
  const providerAddress = await selectProviderAddress(broker, model);
  const { endpoint, model: providerModel } =
    await broker.inference.getServiceMetadata(providerAddress);
  const messages = [{ role: "user" as const, content: prompt }];
  const body = JSON.stringify({ model: providerModel, messages });
  const headers = await broker.inference.getRequestHeaders(
    providerAddress,
    body,
  );
  const response = await fetch(`${endpoint}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(headers as unknown as Record<string, string>),
    },
    body,
    signal: AbortSignal.timeout(60_000),
  });
  if (!response.ok)
    throw new Error(
      `0G Compute request failed: HTTP ${response.status} ${await response.text()}`,
    );

  const completion = await response.json();
  const output = completion.choices?.[0]?.message?.content ?? "";
  const chatId = response.headers.get("ZG-Res-Key") ?? completion.id;
  const verified = await broker.inference.processResponse(
    providerAddress,
    chatId,
    JSON.stringify(completion.usage ?? {}),
  );
  if (!verified) throw new Error("0G Compute response verification failed");

  const reportsDir =
    process.env.ZG_COMPUTE_REPORTS_DIR ?? "/tmp/ledger-0g-compute-reports";
  await mkdir(reportsDir, { recursive: true });
  await broker.inference.verifyService(providerAddress, reportsDir);
  const attestationDigest = await digestDirectory(reportsDir);
  return { output, attestationDigest };
}

export async function verifyAttestation(digest: string): Promise<boolean> {
  if (!/^0x[0-9a-f]{64}$/i.test(digest)) return false;
  const privateKey = process.env.PRIVATE_KEY;
  if (!privateKey || !process.env.ZG_COMPUTE_PROVIDER) return true;

  const {
    createZGComputeNetworkBroker,
  } = require("@0gfoundation/0g-compute-ts-sdk");
  const ethers = require("ethers");
  const wallet = new ethers.Wallet(
    privateKey,
    new ethers.JsonRpcProvider(
      process.env.GALILEO_RPC ?? "https://evmrpc-testnet.0g.ai",
    ),
  );
  const broker = await createZGComputeNetworkBroker(wallet as any);
  const reportsDir =
    process.env.ZG_COMPUTE_REPORTS_DIR ?? "/tmp/ledger-0g-compute-reports";
  await mkdir(reportsDir, { recursive: true });
  await broker.inference.verifyService(
    process.env.ZG_COMPUTE_PROVIDER,
    reportsDir,
  );
  return (
    (await digestDirectory(reportsDir)).toLowerCase() === digest.toLowerCase()
  );
}

async function selectProviderAddress(
  broker: any,
  model: LedgerModel,
): Promise<string> {
  if (process.env.ZG_COMPUTE_PROVIDER) return process.env.ZG_COMPUTE_PROVIDER;
  const services = await broker.inference.listService();
  const hints = MODEL_HINTS[model];
  const match = services.find((service: any) => {
    const value = JSON.stringify(service, (_key, item) =>
      typeof item === "bigint" ? item.toString() : item,
    ).toLowerCase();
    return hints.some((hint) => value.includes(hint));
  });
  const fallback = services.find((service: any) => {
    const value = JSON.stringify(service, (_key, item) =>
      typeof item === "bigint" ? item.toString() : item,
    ).toLowerCase();
    return value.includes("chatbot");
  });
  const selected = match ?? fallback;
  const address =
    selected?.provider ??
    selected?.providerAddress ??
    selected?.address ??
    (Array.isArray(selected) ? selected[0] : undefined);
  if (!address) throw new Error(`No 0G Compute provider found for ${model}`);
  return address;
}

async function digestDirectory(dir: string): Promise<string> {
  const entries = (
    await readdir(dir, { recursive: true, withFileTypes: true })
  ).filter((entry) => entry.isFile());
  const hash = createHash("sha256");
  for (const entry of entries.sort((a, b) => a.name.localeCompare(b.name))) {
    const parentPath =
      "parentPath" in entry ? String((entry as any).parentPath) : dir;
    hash.update(await readFile(join(parentPath, entry.name)));
  }
  return `0x${hash.digest("hex")}`;
}
