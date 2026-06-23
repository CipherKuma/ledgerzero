import { promises as fs } from "node:fs";
import path from "node:path";
import { ethers } from "ethers";
import { contractAddresses, hasContractAddress } from "@/lib/contracts";
import { getProvider, getWallet } from "@/lib/0g/server";
import { uploadJson } from "@/lib/0g/storage";
import type { AgentInspection, AgentRegistrationReceipt, LedgerZeroAgentManifest } from "./types";

const workerAbi = [
  "function nextTokenId() external view returns (uint256)",
  "function mint(address to,string agentName,bytes sealedKey,string memoryCID,string initialReputationRef) external returns (uint256)",
];

const capabilityAbi = [
  "function registerCapability(string agentName,bytes32 capabilityHash,string memoryCID,string[] skills,uint256 ratePerHour) external",
];

const identityAbi = [
  "function registerAgent(address agentAddress,string agentName,string capabilities,uint256 workerTokenId) external",
];

const MIN_REGISTER_BALANCE = ethers.parseEther("0.004");

async function sent(label: string, txPromise: Promise<ethers.ContractTransactionResponse>) {
  const tx = await txPromise;
  const receipt = await tx.wait();
  return { label, hash: tx.hash, block: receipt?.blockNumber ?? 0 };
}

async function assertRegistrationFunding(ownerAddress: string) {
  const balance = await getProvider().getBalance(ownerAddress);
  if (balance < MIN_REGISTER_BALANCE) {
    throw new Error(
      `project 0G signer balance too low for live worker registration: ${ethers.formatEther(
        balance,
      )} 0G, need at least ${ethers.formatEther(MIN_REGISTER_BALANCE)} 0G`,
    );
  }
}

function manifestSkills(manifest: LedgerZeroAgentManifest) {
  return manifest.capabilities.map((capability) => capability.id);
}

function memoryProfile(manifest: LedgerZeroAgentManifest, agentName: string, ownerAddress: string) {
  return {
    type: "WorkerMemoryProfile",
    encryption: manifest.memory.encryption,
    mode: manifest.memory.mode,
    ownerAddress,
    agentName,
    sourceAgentName: manifest.name,
    agentUrl: manifest.agentUrl,
    updatePolicy: manifest.memory.updatePolicy,
    portableContext:
      "Encrypted memory is intended to be resealed for the new WorkerINFT owner during transfer.",
  };
}

function capabilityManifest(manifest: LedgerZeroAgentManifest, agentName: string) {
  return {
    type: "CapabilityManifest",
    framework: manifest.framework,
    agentName,
    sourceAgentName: manifest.name,
    agentUrl: manifest.agentUrl,
    invokeUrl: manifest.invokeUrl,
    healthUrl: manifest.healthUrl,
    capabilities: manifest.capabilities,
    proofHooks: manifest.proofHooks,
    jobInterface: manifest.jobInterface,
    pricing: manifest.pricing,
  };
}

export async function persistLatestAgentRegistration(receipt: AgentRegistrationReceipt) {
  try {
    const output = path.join(process.cwd(), "public", "proof");
    await fs.mkdir(output, { recursive: true });
    await fs.writeFile(path.join(output, "latest-agent-registration.json"), JSON.stringify(receipt, null, 2));
  } catch {
    // Local proof persistence is best effort; the API response remains authoritative.
  }
}

export async function readLatestAgentRegistration() {
  try {
    const file = path.join(process.cwd(), "public", "proof", "latest-agent-registration.json");
    return JSON.parse(await fs.readFile(file, "utf8")) as AgentRegistrationReceipt;
  } catch {
    return null;
  }
}

export async function registerInspectedAgent({
  inspection,
  listForSale = true,
  commitOnChain = true,
}: {
  inspection: AgentInspection;
  listForSale?: boolean;
  commitOnChain?: boolean;
}) {
  const manifest = inspection.manifest;
  const wallet = getWallet();
  const ownerAddress = wallet.address;
  const createdAt = new Date().toISOString();
  const stamp = Date.now().toString(36);
  const safeFramework = manifest.framework.replace(/[^a-z0-9-]/gi, "-").toLowerCase();
  const agentName = `lz-${safeFramework}-${stamp}`;
  const canCommit =
    commitOnChain &&
    hasContractAddress("workerINFT") &&
    hasContractAddress("capabilityRegistry") &&
    hasContractAddress("identityRegistry");

  if (canCommit) {
    await assertRegistrationFunding(ownerAddress);
  }

  const memory = await uploadJson(memoryProfile(manifest, agentName, ownerAddress));
  const capabilityDoc = capabilityManifest(manifest, agentName);
  const capability = await uploadJson(capabilityDoc);
  const registrationBase = {
    kind: "LedgerZeroAgentRegistration" as const,
    type: "LedgerZeroAgentRegistration",
    createdAt,
    manifestUrl: inspection.manifestUrl,
    framework: manifest.framework,
    agentName,
    operatorAddress: manifest.operatorAddress,
    ownerAddress,
    capabilities: manifestSkills(manifest),
    memoryRoot: memory.rootHash,
    manifestRoot: capability.rootHash,
  };

  let tokenId: string | null = null;
  const chainTxs: AgentRegistrationReceipt["chainTxs"] = [];

  if (canCommit) {
    const worker = new ethers.Contract(contractAddresses.workerINFT, workerAbi, wallet);
    const registry = new ethers.Contract(contractAddresses.capabilityRegistry, capabilityAbi, wallet);
    const identity = new ethers.Contract(contractAddresses.identityRegistry, identityAbi, wallet);
    const nextTokenId = await worker.nextTokenId();
    tokenId = nextTokenId.toString();
    const skills = manifestSkills(manifest);
    const memoryCID = `0g://${memory.rootHash}`;
    const capabilityCID = `0g://${capability.rootHash}`;
    const capabilityHash = ethers.keccak256(ethers.toUtf8Bytes(JSON.stringify(capabilityDoc)));

    chainTxs.push(
      await sent(
        "mint WorkerINFT",
        worker.mint(
          ownerAddress,
          agentName,
          ethers.toUtf8Bytes(`sealed:${agentName}:${ownerAddress}`),
          memoryCID,
          `ledger-zero:${manifest.framework}`,
        ),
      ),
    );
    chainTxs.push(
      await sent(
        "register capability",
        registry.registerCapability(
          agentName,
          capabilityHash,
          capabilityCID,
          skills,
          ethers.parseEther(manifest.pricing.minPayout0G),
        ),
      ),
    );
    chainTxs.push(
      await sent(
        "register identity",
        identity.registerAgent(ownerAddress, agentName, skills.join(","), nextTokenId),
      ),
    );
  }

  const preliminaryReceipt = {
    ...registrationBase,
    tokenId,
    manifestRoot: capability.rootHash,
    registrationRoot: "",
    storageTxs: {
      memoryProfile: memory.txHash,
      capabilityManifest: capability.txHash,
      registrationReceipt: "",
    },
    chainTxs,
    contractAddresses: {
      workerINFT: contractAddresses.workerINFT,
      capabilityRegistry: contractAddresses.capabilityRegistry,
      identityRegistry: contractAddresses.identityRegistry,
    },
    status: canCommit ? "live" : "storage-only",
    listing: {
      listed: listForSale,
      price0G: manifest.pricing.salePrice0G,
      payoutRule: "ownerOf(workerTokenId)",
    },
    proofNotes: [
      "Manifest and encrypted-memory profile were uploaded to 0G Storage.",
      "Worker revenue resolves through ownerOf(workerTokenId), not a platform account.",
      "MockTEEOracle remains a demo verifier and is not represented as real TEE.",
    ],
  } satisfies AgentRegistrationReceipt;

  const registration = await uploadJson(preliminaryReceipt);
  const receipt = {
    ...preliminaryReceipt,
    registrationRoot: registration.rootHash,
    storageTxs: {
      ...preliminaryReceipt.storageTxs,
      registrationReceipt: registration.txHash,
    },
  } satisfies AgentRegistrationReceipt;

  await persistLatestAgentRegistration(receipt);
  return receipt;
}
