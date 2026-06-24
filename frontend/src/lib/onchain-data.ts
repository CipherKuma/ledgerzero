import { ethers } from "ethers";
import { contractAddresses, hasContractAddress } from "@/lib/contracts";
import { getProvider } from "@/lib/0g/server";
import { type Job, type StatusKind, type Worker } from "@/lib/ledger-zero";

type ListingStatus = "listed" | "sold" | "not-listed" | "blocked";

type Reputation = {
  score: bigint;
  totalJobs: bigint;
  successfulJobs: bigint;
  failedJobs: bigint;
  lastUpdated: bigint;
};

type WorkerSnapshot = Worker & {
  ownerAddress: string;
  listingStatus: ListingStatus;
  listingSource: "on-chain" | "none";
  sellerAddress?: string;
  saleTx?: string;
  agentAddress?: string;
};

export type JobSnapshot = Job & {
  buyerAddress: string;
  workerAddress?: string;
  workerTokenId?: string;
  deadline?: number;
  postedBlock?: number;
  releaseTx?: string;
};

type LedgerSnapshot = {
  workers: WorkerSnapshot[];
  jobs: JobSnapshot[];
};

const transferInterface = new ethers.Interface([
  "event Transfer(address indexed from,address indexed to,uint256 indexed tokenId)",
]);
const escrowInterface = new ethers.Interface([
  "event TaskPosted(bytes32 indexed taskId,address indexed buyer,uint256 payment,uint256 deadline,uint256 minReputation)",
  "event BidAccepted(bytes32 indexed taskId,address indexed worker,uint256 bidAmount,uint256 bondAmount)",
  "event WorkerTokenAttached(bytes32 indexed taskId,uint256 indexed tokenId,address indexed owner)",
  "event PaymentReleased(bytes32 indexed taskId,address indexed worker,bytes32 resultHash)",
]);
const marketplaceInterface = new ethers.Interface([
  "event WorkerListed(uint256 indexed tokenId,address indexed seller,uint256 price)",
  "event WorkerListingCancelled(uint256 indexed tokenId,address indexed seller)",
  "event WorkerPurchased(uint256 indexed tokenId,address indexed seller,address indexed buyer,uint256 price)",
]);

const workerAbi = [
  "function ownerOf(uint256 tokenId) view returns (address)",
  "function getMetadata(uint256 tokenId) view returns ((string agentName,bytes sealedKey,string memoryCID,string initialReputationRef,uint64 updatedAt))",
] as const;
const identityAbi = [
  "function resolveByToken(uint256 tokenId) view returns ((address agentAddress,string agentName,string capabilities,uint256 workerTokenId,uint64 registeredAt))",
] as const;
const capabilityAbi = [
  "function resolveByAddress(address agent) view returns ((address agentAddress,string agentName,bytes32 capabilityHash,string memoryCID,uint256 ratePerHour,bool available,uint64 registeredAt,uint64 updatedAt))",
  "function getSkills(address agent) view returns (string[])",
] as const;
const marketplaceAbi = [
  "function listings(uint256 tokenId) view returns (address seller,uint256 price,bool active,uint64 listedAt)",
] as const;
const reputationAbi = [
  "function getReputation(address agent) view returns (uint256 score,uint256 totalJobs,uint256 successfulJobs,uint256 failedJobs,uint256 lastUpdated)",
] as const;
const escrowAbi = [
  "function tasks(bytes32 taskId) view returns (address buyer,address worker,uint256 payment,uint256 deadline,uint256 minReputation,uint256 bidAmount,uint256 bondAmount,bytes32 resultHash,uint8 status)",
  "function taskWorkerTokenIds(bytes32 taskId) view returns (uint256)",
] as const;

const CACHE_MS = 20_000;
let cachedSnapshot: { expiresAt: number; value: LedgerSnapshot } | null = null;
let inflightSnapshot: Promise<LedgerSnapshot> | null = null;

export function invalidateLedgerSnapshot() {
  cachedSnapshot = null;
  inflightSnapshot = null;
}

function eventFromBlock() {
  const parsed = Number(process.env.LEDGER_ZERO_INDEX_FROM_BLOCK ?? process.env.NEXT_PUBLIC_LEDGER_ZERO_INDEX_FROM_BLOCK ?? "0");
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : 0;
}

function short(address: string) {
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

function format0g(value: bigint) {
  return ethers.formatEther(value);
}

function formatDate(secondsOrMs: bigint | number) {
  const raw = typeof secondsOrMs === "bigint" ? Number(secondsOrMs) : secondsOrMs;
  const millis = raw > 1_000_000_000_000 ? raw : raw * 1000;
  return new Date(millis).toISOString();
}

function parseCapabilities(value: string) {
  return value
    .split(",")
    .map((entry) => entry.trim())
    .filter(Boolean);
}

function toDataUrl(svg: string) {
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

function buildWorkerImage(seed: string, label: string) {
  const hex = ethers.keccak256(ethers.toUtf8Bytes(seed)).slice(2);
  const colors = [`#${hex.slice(0, 6)}`, `#${hex.slice(6, 12)}`, `#${hex.slice(12, 18)}`, `#${hex.slice(18, 24)}`];
  const monogram = label.trim().slice(0, 2).toUpperCase() || "W";
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 480 480">
<defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
<stop offset="0%" stop-color="${colors[0]}"/><stop offset="50%" stop-color="${colors[1]}"/><stop offset="100%" stop-color="${colors[2]}"/></linearGradient></defs>
<rect width="480" height="480" rx="44" fill="#050816"/>
<circle cx="240" cy="240" r="164" fill="url(#g)" opacity="0.92"/>
<path d="M120 340C166 238 280 164 372 126" stroke="${colors[3]}" stroke-width="18" stroke-linecap="round" opacity="0.75"/>
<text x="240" y="272" text-anchor="middle" font-size="118" font-family="Arial, Helvetica, sans-serif" font-weight="700" fill="#f7f0e4">${monogram}</text>
</svg>`;
  return {
    src: toDataUrl(svg),
    alt: `On-chain generated identicon for worker ${label}`,
  };
}

function taskStatusName(status: number) {
  return ["none", "posted", "accepted", "released", "slashed", "cancelled"][status] ?? "unknown";
}

async function getLogs(address: string, topics: Array<string | string[] | null>) {
  return getProvider().getLogs({ address, fromBlock: eventFromBlock(), toBlock: "latest", topics });
}

export async function getLedgerSnapshot(): Promise<LedgerSnapshot> {
  if (cachedSnapshot && cachedSnapshot.expiresAt > Date.now()) return cachedSnapshot.value;
  if (inflightSnapshot) return inflightSnapshot;

  inflightSnapshot = readLedgerSnapshot().finally(() => {
    inflightSnapshot = null;
  });

  return inflightSnapshot;
}

export function clearLedgerSnapshotCache() {
  cachedSnapshot = null;
  inflightSnapshot = null;
}

async function readLedgerSnapshot(): Promise<LedgerSnapshot> {
  if (cachedSnapshot && cachedSnapshot.expiresAt > Date.now()) return cachedSnapshot.value;

  const provider = getProvider();
  if (!hasContractAddress("workerINFT")) {
    const empty = { workers: [], jobs: [] };
    cachedSnapshot = { value: empty, expiresAt: Date.now() + CACHE_MS };
    return empty;
  }

  const workerContract = new ethers.Contract(contractAddresses.workerINFT, workerAbi, provider);
  const identityContract = hasContractAddress("identityRegistry")
    ? new ethers.Contract(contractAddresses.identityRegistry, identityAbi, provider)
    : null;
  const capabilityContract = hasContractAddress("capabilityRegistry")
    ? new ethers.Contract(contractAddresses.capabilityRegistry, capabilityAbi, provider)
    : null;
  const reputationContract = hasContractAddress("erc8004")
    ? new ethers.Contract(contractAddresses.erc8004, reputationAbi, provider)
    : null;
  const marketplaceContract = hasContractAddress("marketplace")
    ? new ethers.Contract(contractAddresses.marketplace, marketplaceAbi, provider)
    : null;
  const escrowContract = hasContractAddress("escrow")
    ? new ethers.Contract(contractAddresses.escrow, escrowAbi, provider)
    : null;

  const [transferLogs, marketplaceLogs, taskPostedLogs, bidAcceptedLogs, tokenAttachedLogs, paymentReleasedLogs] =
    await Promise.all([
      getLogs(contractAddresses.workerINFT, [transferInterface.getEvent("Transfer")!.topicHash]),
      hasContractAddress("marketplace")
        ? getLogs(contractAddresses.marketplace, [[
            marketplaceInterface.getEvent("WorkerListed")!.topicHash,
            marketplaceInterface.getEvent("WorkerListingCancelled")!.topicHash,
            marketplaceInterface.getEvent("WorkerPurchased")!.topicHash,
          ]])
        : Promise.resolve([]),
      hasContractAddress("escrow")
        ? getLogs(contractAddresses.escrow, [escrowInterface.getEvent("TaskPosted")!.topicHash])
        : Promise.resolve([]),
      hasContractAddress("escrow")
        ? getLogs(contractAddresses.escrow, [escrowInterface.getEvent("BidAccepted")!.topicHash])
        : Promise.resolve([]),
      hasContractAddress("escrow")
        ? getLogs(contractAddresses.escrow, [escrowInterface.getEvent("WorkerTokenAttached")!.topicHash])
        : Promise.resolve([]),
      hasContractAddress("escrow")
        ? getLogs(contractAddresses.escrow, [escrowInterface.getEvent("PaymentReleased")!.topicHash])
        : Promise.resolve([]),
    ]);

  const latestTransferByToken = new Map<string, { owner: string; blockNumber: number }>();
  const mintedAtByToken = new Map<string, number>();
  for (const log of transferLogs.sort((a, b) => a.blockNumber - b.blockNumber || a.index - b.index)) {
    const parsed = transferInterface.parseLog(log);
    if (!parsed) continue;
    const tokenId = parsed.args.tokenId.toString();
    latestTransferByToken.set(tokenId, { owner: String(parsed.args.to), blockNumber: log.blockNumber });
    if (String(parsed.args.from) === ethers.ZeroAddress && !mintedAtByToken.has(tokenId)) {
      mintedAtByToken.set(tokenId, log.blockNumber);
    }
  }

  const latestMarketplaceByToken = new Map<string, { status: ListingStatus; seller?: string; price?: bigint; listedAt?: number; txHash?: string }>();
  for (const log of marketplaceLogs.sort((a, b) => a.blockNumber - b.blockNumber || a.index - b.index)) {
    const parsed = marketplaceInterface.parseLog(log);
    if (!parsed) continue;
    const tokenId = parsed.args.tokenId.toString();
    if (parsed.name === "WorkerListed") {
      latestMarketplaceByToken.set(tokenId, {
        status: "listed",
        seller: String(parsed.args.seller),
        price: parsed.args.price,
        listedAt: log.blockNumber,
        txHash: log.transactionHash,
      });
    } else if (parsed.name === "WorkerListingCancelled") {
      latestMarketplaceByToken.set(tokenId, {
        status: "not-listed",
        seller: String(parsed.args.seller),
        txHash: log.transactionHash,
      });
    } else if (parsed.name === "WorkerPurchased") {
      latestMarketplaceByToken.set(tokenId, {
        status: "sold",
        seller: String(parsed.args.seller),
        price: parsed.args.price,
        txHash: log.transactionHash,
      });
    }
  }

  const postedBlockTimestamps = new Map(
    await Promise.all(
      [...new Set(taskPostedLogs.map((log) => log.blockNumber))].map(async (blockNumber) => {
        const block = await provider.getBlock(blockNumber).catch(() => null);
        return [blockNumber, block?.timestamp ?? 0] as const;
      }),
    ),
  );

  const taskPostedById = new Map<
    string,
    {
      buyer: string;
      payment: bigint;
      deadline: bigint;
      minReputation: bigint;
      txHash: string;
      blockNumber: number;
      timestamp: number;
    }
  >();
  for (const log of taskPostedLogs) {
    const parsed = escrowInterface.parseLog(log);
    if (!parsed) continue;
    taskPostedById.set(parsed.args.taskId, {
      buyer: String(parsed.args.buyer),
      payment: parsed.args.payment,
      deadline: parsed.args.deadline,
      minReputation: parsed.args.minReputation,
      txHash: log.transactionHash,
      blockNumber: log.blockNumber,
      timestamp: postedBlockTimestamps.get(log.blockNumber) ?? 0,
    });
  }

  const acceptedBidByTask = new Map<string, { worker: string; bidAmount: bigint; bondAmount: bigint }>();
  for (const log of bidAcceptedLogs) {
    const parsed = escrowInterface.parseLog(log);
    if (!parsed) continue;
    acceptedBidByTask.set(parsed.args.taskId, {
      worker: String(parsed.args.worker),
      bidAmount: parsed.args.bidAmount,
      bondAmount: parsed.args.bondAmount,
    });
  }

  const tokenByTask = new Map<string, string>();
  for (const log of tokenAttachedLogs) {
    const parsed = escrowInterface.parseLog(log);
    if (!parsed) continue;
    tokenByTask.set(parsed.args.taskId, parsed.args.tokenId.toString());
  }

  const releasedByTask = new Map<string, { worker: string; resultHash: string; txHash: string }>();
  for (const log of paymentReleasedLogs) {
    const parsed = escrowInterface.parseLog(log);
    if (!parsed) continue;
    releasedByTask.set(parsed.args.taskId, {
      worker: String(parsed.args.worker),
      resultHash: parsed.args.resultHash,
      txHash: log.transactionHash,
    });
  }

  const jobs: JobSnapshot[] = [];
  for (const [taskId, posted] of [...taskPostedById.entries()].sort((a, b) => b[1].blockNumber - a[1].blockNumber)) {
    const task = escrowContract ? await escrowContract.tasks(taskId).catch(() => null) : null;
    const bid = acceptedBidByTask.get(taskId);
    const attachedTokenId = tokenByTask.get(taskId);
    const released = releasedByTask.get(taskId);
    const acceptedWorker =
      attachedTokenId ? `Worker token #${attachedTokenId}` : bid?.worker ? short(bid.worker) : "Awaiting acceptance";

    jobs.push({
      id: taskId,
      title: `Escrow task ${short(taskId)}`,
      category: "On-chain escrow",
      payout: format0g(task?.payment ?? posted.payment) + " 0G",
      bond: format0g(task?.bondAmount ?? bid?.bondAmount ?? 0n) + " 0G",
      minReputation: String(task?.minReputation ?? posted.minReputation),
      status: task ? taskStatusName(Number(task.status)) : "posted",
      postedAt: posted.timestamp ? formatDate(posted.timestamp) : formatDate((task?.deadline ?? posted.deadline) - 86400n),
      acceptedWorker,
      resultRoot: released ? String(released.resultHash) : "not released",
      bids: bid
        ? [{ worker: short(bid.worker), amount: `${format0g(bid.bidAmount)} 0G`, score: "accepted" }]
        : [],
      buyerAddress: posted.buyer,
      postedTx: posted.txHash,
      workerAddress: bid?.worker,
      workerTokenId: attachedTokenId,
      deadline: Number(task?.deadline ?? posted.deadline),
      postedBlock: posted.blockNumber,
      releaseTx: released?.txHash,
    });
  }

  const jobsByToken = new Map<string, WorkerSnapshot["history"]>();
  for (const job of jobs) {
    if (!job.workerTokenId) continue;
    const row = {
      id: job.id,
      title: job.title,
      category: job.category,
      completedAt: job.postedAt ? job.postedAt.slice(0, 10) : "unknown",
      payout: job.payout,
      buyer: short(job.buyerAddress),
      result: `Status ${job.status}. Result hash ${job.resultRoot}.`,
      proof: job.resultRoot,
      status: job.status === "released" ? "released" : job.status === "accepted" ? "delivered" : "settled",
    } as const;
    jobsByToken.set(job.workerTokenId, [...(jobsByToken.get(job.workerTokenId) ?? []), row]);
  }

  const tokenIds = [...latestTransferByToken.keys()].sort((a, b) => Number(b) - Number(a));
  const workers: WorkerSnapshot[] = await Promise.all(tokenIds.map(async (tokenId) => {
    const owner = await workerContract.ownerOf(tokenId).catch(() => latestTransferByToken.get(tokenId)?.owner ?? ethers.ZeroAddress);
    const metadata = await workerContract.getMetadata(tokenId).catch(() => null);
    const identity = identityContract ? await identityContract.resolveByToken(tokenId).catch(() => null) : null;
    const agentAddress = identity?.agentAddress && identity.agentAddress !== ethers.ZeroAddress ? String(identity.agentAddress) : owner;
    const [skills, capability] = capabilityContract
      ? await Promise.all([
          capabilityContract.getSkills(agentAddress).catch(() => []),
          capabilityContract.resolveByAddress(agentAddress).catch(() => null),
        ])
      : [[], null];
    const reputation: Reputation | null = reputationContract ? await reputationContract.getReputation(owner).catch(() => null) : null;
    const listing = marketplaceContract ? await marketplaceContract.listings(tokenId).catch(() => null) : null;
    const latestMarket = latestMarketplaceByToken.get(tokenId);

    const name =
      (identity?.agentName && String(identity.agentName).trim()) ||
      (metadata?.agentName && String(metadata.agentName).trim()) ||
      `Worker #${tokenId}`;
    const capabilities = [
      ...new Set([
        ...skills.map(String),
        ...parseCapabilities(identity?.capabilities ? String(identity.capabilities) : ""),
      ]),
    ];
    const listed = Boolean(listing?.active && String(listing.seller).toLowerCase() === String(owner).toLowerCase());
    const listingStatus: ListingStatus = listed ? "listed" : latestMarket?.status ?? "not-listed";
    const price = listed && listing ? `${format0g(listing.price)} 0G` : latestMarket?.price ? `${format0g(latestMarket.price)} 0G` : "not listed";
    const history = jobsByToken.get(tokenId) ?? [];
    const successfulJobs = Number(reputation?.successfulJobs ?? BigInt(history.filter((entry) => entry.status === "released").length));
    const earned = history.reduce((sum, entry) => sum + Number.parseFloat(entry.payout.replace(" 0G", "")), 0);
    const metadataMemoryCID = metadata?.memoryCID ? String(metadata.memoryCID).trim() : "";
    const capabilityMemoryCID = capability?.memoryCID ? String(capability.memoryCID).trim() : "";
    const memoryRoot =
      [metadataMemoryCID, capabilityMemoryCID].find((value) => value && value.toLowerCase() !== "unavailable") ??
      "unavailable";
    const memoryStatus: StatusKind = memoryRoot !== "unavailable" ? "live" : "blocked";

    return {
      slug: `token-${tokenId}`,
      name,
      tokenId,
      image: buildWorkerImage(`${tokenId}:${owner}:${name}`, name),
      owner,
      ownerShort: short(owner),
      ownerAddress: owner,
      capabilities,
      rating: reputation ? Number(reputation.score) / 100 : 0,
      jobsCompleted: successfulJobs,
      earned: earned.toFixed(4).replace(/\.?0+$/, ""),
      memoryRoot,
      memoryStatus,
      price,
      listed,
      registeredAt: identity?.registeredAt ? formatDate(identity.registeredAt) : mintedAtByToken.get(tokenId) ? undefined : undefined,
      listedAt: listed && listing?.listedAt ? formatDate(Number(listing.listedAt)) : undefined,
      listingStatus,
      listingSource: listed || latestMarket ? "on-chain" : "none",
      sellerAddress: listing?.seller ? String(listing.seller) : latestMarket?.seller,
      saleTx: latestMarket?.status === "sold" ? latestMarket.txHash : undefined,
      summary: [
        `Owner ${short(owner)}`,
        memoryRoot !== "unavailable" ? `memory ${memoryRoot}` : "memory pointer unavailable",
        capabilities.length ? `${capabilities.length} registered capabilities` : "no capability tags on-chain",
      ].join(" · "),
      history,
      agentAddress,
    };
  }));

  const snapshot = { workers, jobs };
  cachedSnapshot = { value: snapshot, expiresAt: Date.now() + CACHE_MS };
  return snapshot;
}

export async function getOnChainWorkers() {
  return (await getLedgerSnapshot()).workers;
}

export async function getOnChainWorker(routeId: string) {
  const workers = await getOnChainWorkers();
  return workers.find((worker) => worker.slug === routeId || worker.tokenId === routeId) ?? null;
}

export async function getOnChainJobs() {
  return (await getLedgerSnapshot()).jobs;
}

export async function getOnChainJob(id: string) {
  const jobs = await getOnChainJobs();
  return jobs.find((job) => job.id === id) ?? null;
}
