import { ethers } from "ethers";
import { contractAddresses, hasContractAddress } from "@/lib/contracts";
import { envNumber, withTimeout } from "@/lib/server/perf";
import { getProvider } from "./server";

const transferInterface = new ethers.Interface([
  "event Transfer(address indexed from,address indexed to,uint256 indexed tokenId)",
]);

const activityCache = new Map<string, { value: ChainAccountActivity; expiresAt: number }>();

const marketplaceInterface = new ethers.Interface([
  "event WorkerListed(uint256 indexed tokenId,address indexed seller,uint256 price)",
  "event WorkerListingCancelled(uint256 indexed tokenId,address indexed seller)",
  "event WorkerPurchased(uint256 indexed tokenId,address indexed seller,address indexed buyer,uint256 price)",
]);

const escrowInterface = new ethers.Interface([
  "event TaskPosted(bytes32 indexed taskId,address indexed buyer,uint256 payment,uint256 deadline,uint256 minReputation)",
  "event PaymentReleased(bytes32 indexed taskId,address indexed worker,bytes32 resultHash)",
]);

export type ChainAccountActivity = {
  enabled: boolean;
  fromBlock: number;
  ownedTokenIds: string[];
  postedTasks: Array<{ taskId: string; payment0G: string; txHash: string; blockNumber: number }>;
  marketplace: Array<{
    tokenId: string;
    status: "listed" | "cancelled" | "sold" | "purchased";
    price0G?: string;
    counterparty?: string;
    txHash: string;
    blockNumber: number;
  }>;
  releases: Array<{ taskId: string; resultHash: string; txHash: string; blockNumber: number }>;
  notes: string[];
};

function eventFromBlock() {
  const parsed = Number(process.env.LEDGER_ZERO_INDEX_FROM_BLOCK ?? process.env.NEXT_PUBLIC_LEDGER_ZERO_INDEX_FROM_BLOCK ?? "0");
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : 0;
}

function topicAddress(address: string) {
  return ethers.zeroPadValue(address, 32);
}

async function getLogs(address: string, topics: Array<string | string[] | null>, fromBlock: number) {
  try {
    const timeoutMs = envNumber("LEDGER_ZERO_LOG_TIMEOUT_MS", 1_200);
    return await withTimeout(getProvider().getLogs({ address, fromBlock, toBlock: "latest", topics }), [], timeoutMs);
  } catch {
    return [];
  }
}

export async function getOnChainAccountActivity(address: string): Promise<ChainAccountActivity> {
  const account = ethers.getAddress(address);
  const cacheKey = `${account}:${eventFromBlock()}`;
  const cached = activityCache.get(cacheKey);
  if (cached && cached.expiresAt > Date.now()) return cached.value;

  const fromBlock = eventFromBlock();
  const notes: string[] = [];
  const activity: ChainAccountActivity = {
    enabled: true,
    fromBlock,
    ownedTokenIds: [],
    postedTasks: [],
    marketplace: [],
    releases: [],
    notes,
  };

  if (!hasContractAddress("workerINFT")) notes.push("WorkerINFT address is not configured.");
  if (!hasContractAddress("escrow")) notes.push("LedgerEscrow address is not configured.");
  if (!hasContractAddress("marketplace")) notes.push("LedgerMarketplace address is not configured.");
  if (notes.length) activity.enabled = false;

  if (hasContractAddress("workerINFT")) {
    const transferTopic = transferInterface.getEvent("Transfer")!.topicHash;
    const incoming = await getLogs(contractAddresses.workerINFT, [transferTopic, null, topicAddress(account)], fromBlock);
    const outgoing = await getLogs(contractAddresses.workerINFT, [transferTopic, topicAddress(account)], fromBlock);
    const latestByToken = new Map<string, { to: string; blockNumber: number; logIndex: number }>();

    for (const log of [...incoming, ...outgoing].sort((a, b) => a.blockNumber - b.blockNumber || a.index - b.index)) {
      const parsed = transferInterface.parseLog(log);
      if (!parsed) continue;
      latestByToken.set(parsed.args.tokenId.toString(), {
        to: String(parsed.args.to),
        blockNumber: log.blockNumber,
        logIndex: log.index,
      });
    }

    activity.ownedTokenIds = [...latestByToken.entries()]
      .filter(([, transfer]) => transfer.to.toLowerCase() === account.toLowerCase())
      .map(([tokenId]) => tokenId);
  }

  if (hasContractAddress("marketplace")) {
    const listedTopic = marketplaceInterface.getEvent("WorkerListed")!.topicHash;
    const cancelledTopic = marketplaceInterface.getEvent("WorkerListingCancelled")!.topicHash;
    const purchasedTopic = marketplaceInterface.getEvent("WorkerPurchased")!.topicHash;
    const [listed, cancelled, sold, purchased] = await Promise.all([
      getLogs(contractAddresses.marketplace, [listedTopic, null, topicAddress(account)], fromBlock),
      getLogs(contractAddresses.marketplace, [cancelledTopic, null, topicAddress(account)], fromBlock),
      getLogs(contractAddresses.marketplace, [purchasedTopic, null, topicAddress(account)], fromBlock),
      getLogs(contractAddresses.marketplace, [purchasedTopic, null, null, topicAddress(account)], fromBlock),
    ]);

    for (const log of listed) {
      const parsed = marketplaceInterface.parseLog(log);
      if (!parsed) continue;
      activity.marketplace.push({
        tokenId: parsed.args.tokenId.toString(),
        status: "listed",
        price0G: ethers.formatEther(parsed.args.price),
        txHash: log.transactionHash,
        blockNumber: log.blockNumber,
      });
    }
    for (const log of cancelled) {
      const parsed = marketplaceInterface.parseLog(log);
      if (!parsed) continue;
      activity.marketplace.push({
        tokenId: parsed.args.tokenId.toString(),
        status: "cancelled",
        txHash: log.transactionHash,
        blockNumber: log.blockNumber,
      });
    }
    for (const log of sold) {
      const parsed = marketplaceInterface.parseLog(log);
      if (!parsed) continue;
      activity.marketplace.push({
        tokenId: parsed.args.tokenId.toString(),
        status: "sold",
        price0G: ethers.formatEther(parsed.args.price),
        counterparty: String(parsed.args.buyer),
        txHash: log.transactionHash,
        blockNumber: log.blockNumber,
      });
    }
    for (const log of purchased) {
      const parsed = marketplaceInterface.parseLog(log);
      if (!parsed) continue;
      activity.marketplace.push({
        tokenId: parsed.args.tokenId.toString(),
        status: "purchased",
        price0G: ethers.formatEther(parsed.args.price),
        counterparty: String(parsed.args.seller),
        txHash: log.transactionHash,
        blockNumber: log.blockNumber,
      });
    }
  }

  if (hasContractAddress("escrow")) {
    const postedTopic = escrowInterface.getEvent("TaskPosted")!.topicHash;
    const releasedTopic = escrowInterface.getEvent("PaymentReleased")!.topicHash;
    const [posted, releases] = await Promise.all([
      getLogs(contractAddresses.escrow, [postedTopic, null, topicAddress(account)], fromBlock),
      getLogs(contractAddresses.escrow, [releasedTopic, null, topicAddress(account)], fromBlock),
    ]);

    for (const log of posted) {
      const parsed = escrowInterface.parseLog(log);
      if (!parsed) continue;
      activity.postedTasks.push({
        taskId: parsed.args.taskId,
        payment0G: ethers.formatEther(parsed.args.payment),
        txHash: log.transactionHash,
        blockNumber: log.blockNumber,
      });
    }
    for (const log of releases) {
      const parsed = escrowInterface.parseLog(log);
      if (!parsed) continue;
      activity.releases.push({
        taskId: parsed.args.taskId,
        resultHash: parsed.args.resultHash,
        txHash: log.transactionHash,
        blockNumber: log.blockNumber,
      });
    }
  }

  activity.marketplace.sort((a, b) => b.blockNumber - a.blockNumber);
  activity.postedTasks.sort((a, b) => b.blockNumber - a.blockNumber);
  activity.releases.sort((a, b) => b.blockNumber - a.blockNumber);
  activityCache.set(cacheKey, {
    value: activity,
    expiresAt: Date.now() + envNumber("LEDGER_ZERO_ACTIVITY_CACHE_MS", 30_000),
  });
  return activity;
}
