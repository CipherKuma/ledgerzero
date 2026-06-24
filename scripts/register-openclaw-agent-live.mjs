import { createRequire } from "node:module";
import { readFileSync } from "node:fs";

const requireFromFrontend = createRequire(new URL("../frontend/package.json", import.meta.url));
const { ethers } = requireFromFrontend("ethers");
const { Indexer, MemData } = requireFromFrontend("@0gfoundation/0g-storage-ts-sdk");

function readEnvFile(path) {
  const out = {};
  for (const line of readFileSync(path, "utf8").split(/\r?\n/)) {
    const match = line.match(/^([A-Z0-9_]+)=(.*)$/);
    if (!match) continue;
    out[match[1]] = match[2].replace(/^"|"$/g, "");
  }
  return out;
}

function requireEnv(env, key) {
  const value = env[key];
  if (!value) throw new Error(`${key} is required`);
  return value;
}

function normalizeAddress(value, label) {
  if (!value) return "";
  try {
    return ethers.getAddress(value);
  } catch {
    throw new Error(`${label} must be a valid EVM address: ${value}`);
  }
}

function hasFlag(flag) {
  return process.argv.includes(flag);
}

function getArgValue(prefix) {
  const arg = process.argv.find((value) => value.startsWith(prefix));
  return arg ? arg.slice(prefix.length) : "";
}

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function retry(label, fn, attempts = 3) {
  let lastError;
  for (let index = 0; index < attempts; index += 1) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      if (index < attempts - 1) await wait(1200 * (index + 1));
    }
  }
  throw new Error(`${label} failed after ${attempts} attempts: ${lastError instanceof Error ? lastError.message : String(lastError)}`);
}

async function uploadJson({ indexer, rpc, wallet, obj }) {
  const bytes = new TextEncoder().encode(JSON.stringify(obj));
  const data = new MemData(bytes);
  const [tree, treeErr] = await data.merkleTree();
  if (treeErr !== null) throw new Error(`merkle: ${treeErr}`);
  const computedRoot = tree?.rootHash() ?? "";
  const [tx, uploadErr] = await indexer.upload(data, rpc, wallet);
  if (uploadErr !== null) throw new Error(`upload: ${uploadErr}`);
  return {
    rootHash: tx?.rootHash ?? computedRoot,
    txHash: tx?.txHash ?? "",
  };
}

async function sent(label, txPromise) {
  const tx = await txPromise;
  const receipt = await tx.wait();
  return { label, hash: tx.hash, block: receipt?.blockNumber ?? 0 };
}

const repoRoot = new URL("..", import.meta.url).pathname;
const frontendEnv = { ...readEnvFile(new URL("../frontend/.env.local", import.meta.url)), ...process.env };
const agentEnv = { ...readEnvFile(new URL("../.env.agent.local", import.meta.url)), ...process.env };
const execute = hasFlag("--execute");
const rpc = requireEnv(frontendEnv, "ZEROG_RPC");
const indexerUrl = frontendEnv.ZEROG_INDEXER ?? "https://indexer-storage-testnet-turbo.0g.ai";
const provider = new ethers.JsonRpcProvider(rpc, { name: "galileo", chainId: 16602 }, { staticNetwork: true });
const wallet = new ethers.Wallet(requireEnv(agentEnv, "LEDGER_ZERO_AGENT_PRIVATE_KEY"), provider);
const expectedAddress = requireEnv(agentEnv, "LEDGER_ZERO_AGENT_WALLET_ADDRESS");

if (wallet.address.toLowerCase() !== expectedAddress.toLowerCase()) {
  throw new Error("agent private key does not match LEDGER_ZERO_AGENT_WALLET_ADDRESS");
}

const agentName = requireEnv(agentEnv, "LEDGER_ZERO_AGENT_NAME");
const framework = requireEnv(agentEnv, "LEDGER_ZERO_AGENT_FRAMEWORK");
const description = requireEnv(agentEnv, "LEDGER_ZERO_AGENT_DESCRIPTION");
const imageUrl = requireEnv(agentEnv, "LEDGER_ZERO_AGENT_IMAGE_URL");
if (!/^https?:\/\//i.test(imageUrl)) {
  throw new Error("LEDGER_ZERO_AGENT_IMAGE_URL must be a publicly reachable http(s) URL");
}
const ownerAddressRaw = agentEnv.LEDGER_ZERO_AGENT_OWNER_ADDRESS ?? "";
const ownerAddress = normalizeAddress(ownerAddressRaw, "LEDGER_ZERO_AGENT_OWNER_ADDRESS");
const confirmOwnerRaw = getArgValue("--confirm-owner=");
const confirmedOwnerAddress = normalizeAddress(confirmOwnerRaw, "--confirm-owner");
const sameOwnerOperator = Boolean(ownerAddress && ownerAddress.toLowerCase() === wallet.address.toLowerCase());
const skills = ["research.risk-memo", "research.source-audit", "ops.proof-packaging"];
const createdAt = new Date().toISOString();
const ledgerZeroAppUrl = (agentEnv.LEDGER_ZERO_APP_URL ?? "http://localhost:3023").replace(/\/$/, "");
const automation = {
  mode: "polling",
  jobsUrl: `${ledgerZeroAppUrl}/api/onchain/jobs`,
  pollSeconds: Number(agentEnv.LEDGER_ZERO_JOB_POLL_SECONDS ?? "15"),
  bidPolicy: {
    autoBid: agentEnv.LEDGER_ZERO_AUTO_BID === "true",
    requiresOwnerSigner: true,
    minPayout0G: "0.0005",
    bidBond0G: "0.0001",
    keywords: ["research", "proof", "source", "ops"],
  },
};
const memoryProfile = {
  type: "WorkerMemoryProfile",
  createdAt,
  agentName,
  framework,
  operatorAddress: wallet.address,
  ownerAddress: ownerAddress || "OWNER_ADDRESS_REQUIRED_BEFORE_EXECUTE",
  mode: "encrypted-owner-transferable",
  storage: "0G Storage",
  encryption: "sealed-key envelope for current WorkerINFT owner",
  updatePolicy: "append encrypted job summaries and reseal memory on ownership transfer",
  portableContext:
    "OpenClaw workspace memory and Ledger Zero receipts are bound to the WorkerINFT owner; agent operations are signed by the operator wallet.",
};
const capabilityManifest = {
  type: "CapabilityManifest",
  createdAt,
  framework,
  agentName,
  description,
  imageUrl,
  capabilities: skills.map((id) => ({
    id,
    label: id
      .split(".")
      .at(-1)
      .replace(/-/g, " ")
      .replace(/\b\w/g, (char) => char.toUpperCase()),
    description: `Atlas can execute ${id} work and return proof-ready artifacts.`,
  })),
  pricing: {
    minPayout0G: "0.0005",
    bidBond0G: "0.0001",
    salePrice0G: "8.4",
  },
  automation,
  payoutRule: "ownerOf(workerTokenId)",
};

const workerINFT = new ethers.Contract(
  requireEnv(frontendEnv, "NEXT_PUBLIC_LEDGER_ZERO_WORKER_INFT"),
  [
    "function nextTokenId() external view returns (uint256)",
    "function mint(address to,string agentName,bytes sealedKey,string memoryCID,string initialReputationRef) external returns (uint256)",
  ],
  wallet,
);
const capability = new ethers.Contract(
  requireEnv(frontendEnv, "NEXT_PUBLIC_LEDGER_ZERO_CAPABILITY_REGISTRY"),
  ["function registerCapability(string agentName,bytes32 capabilityHash,string memoryCID,string[] skills,uint256 ratePerHour) external"],
  wallet,
);
const identity = new ethers.Contract(
  requireEnv(frontendEnv, "NEXT_PUBLIC_LEDGER_ZERO_IDENTITY_REGISTRY"),
  ["function registerAgent(address agentAddress,string agentName,string capabilities,uint256 workerTokenId) external"],
  wallet,
);
const balance = await retry("agent balance read", () => provider.getBalance(wallet.address));

if (!execute) {
  console.log(
    JSON.stringify(
      {
        ok: true,
        mode: "dry-run",
        message: "Add --execute to upload to 0G Storage and send registration transactions.",
        repoRoot,
        agentName,
        framework,
        wallet: wallet.address,
        ownerAddress: ownerAddress || null,
        sameOwnerOperator,
        ownerConfirmationRequired: true,
        executeRequirement:
          "Set LEDGER_ZERO_AGENT_OWNER_ADDRESS and LEDGER_ZERO_AGENT_IMAGE_URL, then rerun with --execute --confirm-owner=<owner address>. Add --allow-same-owner-operator only if same-wallet setup is intentional.",
        balance0G: ethers.formatEther(balance),
        capabilities: skills,
        automation,
        contracts: {
          workerINFT: await workerINFT.getAddress(),
          capabilityRegistry: await capability.getAddress(),
          identityRegistry: await identity.getAddress(),
        },
      },
      null,
      2,
    ),
  );
  process.exit(0);
}

if (!ownerAddress) {
  throw new Error("LEDGER_ZERO_AGENT_OWNER_ADDRESS is required before live registration");
}

if (confirmedOwnerAddress.toLowerCase() !== ownerAddress.toLowerCase()) {
  throw new Error(`Owner confirmation required. Rerun with --confirm-owner=${ownerAddress}`);
}

if (sameOwnerOperator && !hasFlag("--allow-same-owner-operator")) {
  throw new Error(
    "Owner wallet and operator wallet are the same. This is allowed only with explicit acknowledgement; rerun with --allow-same-owner-operator if intentional.",
  );
}

if (balance < ethers.parseEther("0.006")) {
  throw new Error(`agent wallet balance too low: ${ethers.formatEther(balance)} 0G`);
}

const indexer = new Indexer(indexerUrl);
const memory = await uploadJson({ indexer, rpc, wallet, obj: memoryProfile });
const capabilityDoc = await uploadJson({ indexer, rpc, wallet, obj: capabilityManifest });
const nextTokenId = await retry("next token id read", () => workerINFT.nextTokenId());
const tokenId = nextTokenId.toString();
const memoryCID = `0g://${memory.rootHash}`;
const capabilityCID = `0g://${capabilityDoc.rootHash}`;
const capabilityHash = ethers.keccak256(ethers.toUtf8Bytes(JSON.stringify(capabilityManifest)));
const txs = [];

txs.push(
  await sent(
    "mint WorkerINFT",
    workerINFT.mint(
      ownerAddress,
      agentName,
      ethers.toUtf8Bytes(`sealed:${agentName}:${ownerAddress}`),
      memoryCID,
      `ledger-zero:${framework}`,
    ),
  ),
);
txs.push(
  await sent(
    "register capability",
    capability.registerCapability(agentName, capabilityHash, capabilityCID, skills, ethers.parseEther("0.0005")),
  ),
);
txs.push(await sent("register identity", identity.registerAgent(wallet.address, agentName, skills.join(","), nextTokenId)));

const preliminaryReceipt = {
  kind: "LedgerZeroAgentRegistration",
  type: "LedgerZeroAgentRegistration",
  createdAt,
  framework,
  agentName,
  operatorAddress: wallet.address,
  ownerAddress,
  tokenId,
  capabilities: skills,
  memoryRoot: memory.rootHash,
  capabilityRoot: capabilityDoc.rootHash,
  registrationRoot: "",
  storageTxs: {
    memoryProfile: memory.txHash,
    capabilityManifest: capabilityDoc.txHash,
    registrationReceipt: "",
  },
  automation: {
    mode: automation.mode,
    jobsUrl: automation.jobsUrl,
    pollSeconds: automation.pollSeconds,
    autoBid: automation.bidPolicy.autoBid,
    requiresOwnerSigner: automation.bidPolicy.requiresOwnerSigner,
  },
  chainTxs: txs,
  payoutRule: "ownerOf(workerTokenId)",
};
const registration = await uploadJson({ indexer, rpc, wallet, obj: preliminaryReceipt });
const receipt = {
  ...preliminaryReceipt,
  registrationRoot: registration.rootHash,
  storageTxs: {
    ...preliminaryReceipt.storageTxs,
    registrationReceipt: registration.txHash,
  },
};

console.log(JSON.stringify({ ok: true, mode: "executed", receipt }, null, 2));
