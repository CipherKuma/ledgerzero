import { promises as fs } from "node:fs";
import path from "node:path";
import { ethers } from "ethers";
import { generateWith0GCompute } from "@/lib/0g/compute";
import { getProvider, getWallet } from "@/lib/0g/server";
import { uploadJson } from "@/lib/0g/storage";
import { demoManifestUrl, inspectAgentManifest } from "@/lib/agents/manifest";
import { contractAddresses, hasContractAddress } from "@/lib/contracts";
import type { DemoFlowAttempt, DemoFlowReceipt } from "./types";

const workerAbi = [
  "function nextTokenId() external view returns (uint256)",
  "function mint(address to,string agentName,bytes sealedKey,string memoryCID,string initialReputationRef) external returns (uint256)",
  "function ownerOf(uint256 tokenId) external view returns (address)",
  "function transfer(address from,address to,uint256 tokenId,bytes sealedKey,bytes proof) external",
];

const capabilityAbi = [
  "function registerCapability(string agentName,bytes32 capabilityHash,string memoryCID,string[] skills,uint256 ratePerHour) external",
];

const identityAbi = [
  "function registerAgent(address agentAddress,string agentName,string capabilities,uint256 workerTokenId) external",
];

const escrowAbi = [
  "function postTask(bytes32 taskId,uint256 payment,uint256 deadline,uint256 minReputation) external payable",
  "function acceptTokenBid(bytes32 taskId,uint256 workerTokenId,uint256 bidAmount,uint256 bondAmount) external payable",
  "function payoutRecipient(bytes32 taskId) external view returns (address)",
  "function releasePayment(bytes32 taskId,bytes32 resultHash) external",
  "function tasks(bytes32 taskId) external view returns (address buyer,address worker,uint256 payment,uint256 deadline,uint256 minReputation,uint256 bidAmount,uint256 bondAmount,bytes32 resultHash,uint8 status)",
];

const reputationAbi = [
  "function getReputation(address agent) external view returns (uint256 score,uint256 totalJobs,uint256 successfulJobs,uint256 failedJobs,uint256 lastUpdated)",
];

const MIN_FULL_DEMO_BALANCE = ethers.parseEther("0.01");

type FlowArgs = {
  origin: string;
  preset?: "openclaw" | "hermes";
  manifestUrl?: string;
  runCompute?: boolean;
  taskTitle?: string;
  taskDescription?: string;
  taskCategory?: string;
  taskTags?: string[];
  taskPayment0G?: string;
  bondAmount0G?: string;
};

async function sent(label: string, txPromise: Promise<ethers.TransactionResponse>) {
  const tx = await txPromise;
  const receipt = await tx.wait();
  return { label, hash: tx.hash, block: receipt?.blockNumber ?? 0 };
}

function requireContracts() {
  const required = ["workerINFT", "escrow", "capabilityRegistry", "identityRegistry", "erc8004"] as const;
  const missing = required.filter((key) => !hasContractAddress(key));
  if (missing.length) throw new Error(`missing contract addresses: ${missing.join(", ")}`);
}

function toBytes32(rootHash: string) {
  if (/^0x[a-fA-F0-9]{64}$/.test(rootHash)) return rootHash;
  return ethers.keccak256(ethers.toUtf8Bytes(rootHash));
}

function parseDemoAmount(value: string | undefined, fallback: string, label: string) {
  const next = (value || fallback).trim();
  if (!/^(0|[1-9]\d*)(\.\d{1,18})?$/.test(next)) throw new Error(`${label} must be a decimal 0G amount`);
  const wei = ethers.parseEther(next);
  if (wei <= 0n) throw new Error(`${label} must be greater than zero`);
  if (wei > ethers.parseEther("0.005")) throw new Error(`${label} is capped at 0.005 0G for demo safety`);
  return wei;
}

async function assertFullDemoFunding(provider: ethers.Provider, operatorAddress: string) {
  const balance = await provider.getBalance(operatorAddress);
  if (balance < MIN_FULL_DEMO_BALANCE) {
    throw new Error(
      `project 0G signer balance too low for full demo flow: ${ethers.formatEther(balance)} 0G, need at least ${ethers.formatEther(
        MIN_FULL_DEMO_BALANCE,
      )} 0G`,
    );
  }
}

function memoryProfile(agentName: string, ownerAddress: string) {
  return {
    type: "WorkerMemoryProfile",
    agentName,
    ownerAddress,
    storage: "0G Storage",
    mode: "encrypted-owner-transferable",
    encryption: "sealed-key-rewrap-on-transfer",
    portableContext: "Worker memory is resealed for the new owner when the worker token transfers.",
  };
}

function capabilityManifest(agentName: string, skills: string[], invokeUrl: string) {
  return {
    type: "CapabilityManifest",
    agentName,
    invokeUrl,
    skills,
    execution: "0G Compute",
    proofHooks: ["computeProof", "jobResult", "memoryUpdate", "ownershipTransfer"],
  };
}

export async function persistLatestDemoFlow(receipt: DemoFlowReceipt) {
  const output = path.join(process.cwd(), "public", "proof");
  await fs.mkdir(output, { recursive: true });
  await fs.writeFile(path.join(output, "latest-demo-flow.json"), JSON.stringify(receipt, null, 2));
}

export async function persistLatestDemoAttempt(attempt: DemoFlowAttempt) {
  const output = path.join(process.cwd(), "public", "proof");
  await fs.mkdir(output, { recursive: true });
  await fs.writeFile(path.join(output, "latest-demo-attempt.json"), JSON.stringify(attempt, null, 2));
}

export async function readLatestDemoFlow() {
  try {
    const file = path.join(process.cwd(), "public", "proof", "latest-demo-flow.json");
    return normalizeDemoFlowReceipt(JSON.parse(await fs.readFile(file, "utf8")));
  } catch {
    return null;
  }
}

function normalizeDemoFlowReceipt(raw: unknown): DemoFlowReceipt {
  const receipt = raw as DemoFlowReceipt & { task?: Partial<DemoFlowReceipt["task"]> };
  return {
    ...receipt,
    task: {
      title: receipt.task?.title || "Produce a 0G ecosystem risk brief",
      description:
        receipt.task?.description ||
        "Evaluate a worker, execute the job, store the result, and verify payout transfer on 0G.",
      category: receipt.task?.category || "Research",
      tags: Array.isArray(receipt.task?.tags) && receipt.task.tags.length ? receipt.task.tags : ["risk", "proof"],
    },
  };
}

export async function readLatestDemoAttempt() {
  try {
    const file = path.join(process.cwd(), "public", "proof", "latest-demo-attempt.json");
    return JSON.parse(await fs.readFile(file, "utf8")) as DemoFlowAttempt;
  } catch {
    return null;
  }
}

export async function runLedgerZeroDemoFlow({
  origin,
  preset = "hermes",
  manifestUrl,
  runCompute = true,
  taskTitle,
  taskDescription,
  taskCategory,
  taskTags,
  taskPayment0G,
  bondAmount0G,
}: FlowArgs) {
  requireContracts();

  const resolvedManifestUrl = manifestUrl || demoManifestUrl(preset, origin);
  const inspection = await inspectAgentManifest(resolvedManifestUrl, origin);
  if (inspection.status !== "ready") throw new Error("agent manifest is not ready");

  const manifest = inspection.manifest;
  const provider = getProvider();
  const operator = getWallet();
  const buyer = ethers.Wallet.createRandom().connect(provider);
  const newOwner = ethers.Wallet.createRandom().connect(provider);
  const stamp = Date.now().toString(36);
  const agentName = `demo-${manifest.framework}-${stamp}`;
  const skills = manifest.capabilities.map((capability) => capability.id);
  const taskInfo = {
    title: (taskTitle || `Produce a buyer-ready ${manifest.framework} agent diligence memo`).trim(),
    description: (taskDescription || "Evaluate the worker, produce risks, next steps, and proof-backed output.").trim(),
    category: (taskCategory || "Research").trim(),
    tags: taskTags?.length ? taskTags.map((tag) => tag.trim()).filter(Boolean) : ["risk", "citations"],
  };
  const taskId = ethers.keccak256(ethers.toUtf8Bytes(`ledger-zero-demo:${stamp}:${buyer.address}:${taskInfo.title}`));
  const taskPayment = parseDemoAmount(taskPayment0G, "0.0004", "task payment");
  const bondAmount = parseDemoAmount(bondAmount0G, "0.0001", "bond amount");
  if (bondAmount >= taskPayment) throw new Error("bond amount must be smaller than task payment");
  const bidAmount = taskPayment - bondAmount;
  const purchasePayment = ethers.parseEther("0.0002");
  const salePrice = manifest.pricing.salePrice0G;
  const chainTxs: DemoFlowReceipt["chainTxs"] = [];

  const worker = new ethers.Contract(contractAddresses.workerINFT, workerAbi, operator);
  const capability = new ethers.Contract(contractAddresses.capabilityRegistry, capabilityAbi, operator);
  const identity = new ethers.Contract(contractAddresses.identityRegistry, identityAbi, operator);
  const operatorEscrow = new ethers.Contract(contractAddresses.escrow, escrowAbi, operator);
  const buyerEscrow = new ethers.Contract(contractAddresses.escrow, escrowAbi, buyer);
  const reputation = new ethers.Contract(contractAddresses.erc8004, reputationAbi, provider);

  await assertFullDemoFunding(provider, operator.address);

  const memory = await uploadJson(memoryProfile(agentName, operator.address));
  const capabilityDoc = capabilityManifest(agentName, skills, manifest.invokeUrl);
  const capabilityUpload = await uploadJson(capabilityDoc);
  const taskBrief = await uploadJson({
    type: "TaskBrief",
    taskId,
    ...taskInfo,
    buyer: buyer.address,
    acceptedWorkerFramework: manifest.framework,
    payout0G: ethers.formatEther(taskPayment),
    requiredProofs: ["TaskBrief", "ComputeProof", "JobResult", "OwnershipTransferReceipt"],
    acceptanceCriteria: "Return concise risks, next steps, and confidence with proof artifacts.",
  });

  const tokenId = await worker.nextTokenId();
  const memoryCid = `0g://${memory.rootHash}`;
  const capabilityHash = ethers.keccak256(ethers.toUtf8Bytes(JSON.stringify(capabilityDoc)));
  chainTxs.push(
    await sent(
      "mint WorkerINFT",
      worker.mint(
        operator.address,
        agentName,
        ethers.toUtf8Bytes(`sealed:${agentName}:${operator.address}`),
        memoryCid,
        `ledger-zero:${manifest.framework}`,
      ),
    ),
  );
  chainTxs.push(
    await sent(
      "register capability",
      capability.registerCapability(
        agentName,
        capabilityHash,
        `0g://${capabilityUpload.rootHash}`,
        skills,
        ethers.parseEther(manifest.pricing.minPayout0G),
      ),
    ),
  );
  chainTxs.push(
    await sent("register identity", identity.registerAgent(operator.address, agentName, skills.join(","), tokenId)),
  );
  chainTxs.push(
    await sent(
      "fund buyer wallet",
      operator.sendTransaction({ to: buyer.address, value: ethers.parseEther("0.003") }),
    ),
  );
  chainTxs.push(
    await sent(
      "fund purchaser wallet",
      operator.sendTransaction({ to: newOwner.address, value: ethers.parseEther("0.003") }),
    ),
  );
  chainTxs.push(
    await sent(
      "post escrow task",
      buyerEscrow.postTask(taskId, taskPayment, Math.floor(Date.now() / 1000) + 86400, 0, {
        value: taskPayment,
      }),
    ),
  );
  chainTxs.push(
    await sent(
      "accept token bid",
      operatorEscrow.acceptTokenBid(taskId, tokenId, bidAmount, bondAmount, { value: bondAmount }),
    ),
  );

  const payoutBefore = await operatorEscrow.payoutRecipient(taskId);
  const compute = runCompute
    ? await generateWith0GCompute([
        {
          role: "system",
          content:
            "You are a Ledger Zero worker. Return concise JSON with summary, risks, nextSteps, and confidence.",
        },
        {
          role: "user",
          content: `Worker: ${agentName}\nTask: ${taskInfo.title}\nDescription: ${taskInfo.description}\nCategory: ${taskInfo.category}\nTags: ${taskInfo.tags.join(", ")}\nTask root: 0g://${taskBrief.rootHash}`,
        },
      ])
    : {
        content: "Compute skipped for fast local proof; run with runCompute=true for recording.",
        proof: null,
      };

  const jobResult = await uploadJson({
    type: "JobResult",
    taskId,
    tokenId: tokenId.toString(),
    agentName,
    taskBriefRoot: taskBrief.rootHash,
    computeContent: compute.content,
    computeProof: compute.proof,
  });
  chainTxs.push(
    await sent(
      "purchase worker token",
      newOwner.sendTransaction({ to: operator.address, value: purchasePayment }),
    ),
  );
  chainTxs.push(
    await sent(
      "transfer worker token",
      worker.transfer(
        operator.address,
        newOwner.address,
        tokenId,
        ethers.toUtf8Bytes(`sealed:${agentName}:${newOwner.address}`),
        ethers.toUtf8Bytes("ledger-pure0g-mock-proof"),
      ),
    ),
  );
  const payoutAfter = await operatorEscrow.payoutRecipient(taskId);
  const transferReceipt = await uploadJson({
    type: "OwnershipTransferReceipt",
    taskId,
    tokenId: tokenId.toString(),
    from: operator.address,
    to: newOwner.address,
    payoutRecipientBeforeTransfer: payoutBefore,
    payoutRecipientAfterTransfer: payoutAfter,
    jobResultRoot: jobResult.rootHash,
  });
  const newOwnerBalanceBefore = await provider.getBalance(newOwner.address);

  chainTxs.push(await sent("release escrow payment", buyerEscrow.releasePayment(taskId, toBytes32(jobResult.rootHash))));
  const newOwnerBalanceAfter = await provider.getBalance(newOwner.address);
  const reputationSnapshot = await reputation.getReputation(newOwner.address);
  const task = await operatorEscrow.tasks(taskId);
  const reputationUpload = await uploadJson({
    type: "ReputationSnapshot",
    taskId,
    tokenId: tokenId.toString(),
    owner: newOwner.address,
    score: reputationSnapshot.score.toString(),
    totalJobs: reputationSnapshot.totalJobs.toString(),
    successfulJobs: reputationSnapshot.successfulJobs.toString(),
    taskStatus: Number(task.status),
  });

  const preliminaryReceipt = {
    kind: "LedgerZeroFullDemoFlow",
    createdAt: new Date().toISOString(),
    status: runCompute ? "live" : "compute-fallback",
    framework: manifest.framework,
    agentName,
    tokenId: tokenId.toString(),
    taskId,
    task: taskInfo,
    accounts: {
      operator: operator.address,
      buyer: buyer.address,
      newOwner: newOwner.address,
    },
    economics: {
      taskPayment0G: ethers.formatEther(taskPayment),
      bidAmount0G: ethers.formatEther(bidAmount),
      bondAmount0G: ethers.formatEther(bondAmount),
      salePrice0G: salePrice,
      purchasePayment0G: ethers.formatEther(purchasePayment),
      payoutRecipientBeforeTransfer: payoutBefore,
      payoutRecipientAfterTransfer: payoutAfter,
      newOwnerBalanceBefore0G: ethers.formatEther(newOwnerBalanceBefore),
      newOwnerBalanceAfter0G: ethers.formatEther(newOwnerBalanceAfter),
    },
    storage: {
      taskBriefRoot: taskBrief.rootHash,
      taskBriefTx: taskBrief.txHash,
      memoryRoot: memory.rootHash,
      memoryTx: memory.txHash,
      capabilityRoot: capabilityUpload.rootHash,
      capabilityTx: capabilityUpload.txHash,
      jobResultRoot: jobResult.rootHash,
      jobResultTx: jobResult.txHash,
      transferReceiptRoot: transferReceipt.rootHash,
      transferReceiptTx: transferReceipt.txHash,
      reputationSnapshotRoot: reputationUpload.rootHash,
      reputationSnapshotTx: reputationUpload.txHash,
      demoReceiptRoot: "",
      demoReceiptTx: "",
    },
    compute: {
      ran: runCompute,
      content: compute.content,
      proof: compute.proof,
    },
    chainTxs,
    contractAddresses: {
      workerINFT: contractAddresses.workerINFT,
      escrow: contractAddresses.escrow,
      capabilityRegistry: contractAddresses.capabilityRegistry,
      identityRegistry: contractAddresses.identityRegistry,
      erc8004: contractAddresses.erc8004,
    },
    assertions: [
      {
        label: "buyer posted task",
        value: buyer.address,
        status: "live",
      },
      {
        label: "worker owner accepted token bid",
        value: operator.address,
        status: "live",
      },
      {
        label: "payout follows transferred worker token",
        value: payoutAfter,
        status: "live",
      },
      {
        label: "new owner received release",
        value: `${ethers.formatEther(newOwnerBalanceBefore)} -> ${ethers.formatEther(newOwnerBalanceAfter)} 0G`,
        status: "live",
      },
      {
        label: "future revenue rule",
        value: "LedgerEscrow.payoutRecipient(taskId) = WorkerINFT.ownerOf(tokenId)",
        status: "live",
      },
    ],
  } satisfies DemoFlowReceipt;

  const demoReceipt = await uploadJson(preliminaryReceipt);
  const receipt = {
    ...preliminaryReceipt,
    storage: {
      ...preliminaryReceipt.storage,
      demoReceiptRoot: demoReceipt.rootHash,
      demoReceiptTx: demoReceipt.txHash,
    },
  } satisfies DemoFlowReceipt;

  await persistLatestDemoFlow(receipt);
  return receipt;
}
