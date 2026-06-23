import { readLatestAgentRegistration } from "@/lib/agents/register";
import { getOnChainAccountActivity, type ChainAccountActivity } from "@/lib/0g/events";
import { readLatestDemoFlow } from "@/lib/demo-flow/run";
import { jobs, workers, type Job, type StatusKind, type Worker } from "@/lib/ledger-zero";

export type DirectorySource = "seeded-demo" | "latest-registration" | "latest-flow";
export type ListingStatus = "listed" | "sold" | "not-listed" | "blocked";

export type DirectoryWorker = Worker & {
  source: DirectorySource;
  ownerAddress: string;
  listingStatus: ListingStatus;
  listingSource: DirectorySource | "none";
  sellerAddress?: string;
  saleTx?: string;
};

export type AccountListing = {
  workerName: string;
  tokenId: string;
  price: string;
  status: ListingStatus;
  source: DirectorySource | "none";
  sellerAddress?: string;
  saleTx?: string;
};

export type AccountSnapshot = {
  address: string;
  ownedWorkers: DirectoryWorker[];
  postedJobs: Array<Job & { buyerAddress: string; source: DirectorySource }>;
  listings: AccountListing[];
  earnings0G: string;
  provenance: string;
  chain: ChainAccountActivity | null;
};

function short(address: string) {
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

function sameAddress(a?: string, b?: string) {
  return Boolean(a && b && a.toLowerCase() === b.toLowerCase());
}

function baseWorkers(): DirectoryWorker[] {
  return workers.map((worker) => ({
    ...worker,
    source: "seeded-demo",
    ownerAddress: worker.owner,
    listingStatus: worker.listed ? "listed" : "not-listed",
    listingSource: worker.listed ? "seeded-demo" : "none",
    sellerAddress: worker.listed ? worker.owner : undefined,
  }));
}

export async function buildWorkerDirectory() {
  const latestRegistration = await readLatestAgentRegistration();
  const latestFlow = await readLatestDemoFlow();
  const directory = baseWorkers();

  if (latestRegistration?.tokenId) {
    directory.push({
      slug: `registered-${latestRegistration.tokenId}`,
      name: latestRegistration.agentName,
      tokenId: latestRegistration.tokenId,
      image: {
        src: latestRegistration.framework === "openclaw" ? "/ledger-zero/requests/agent-1.jpg" : "/ledger-zero/requests/agent-2.jpg",
        alt: `${latestRegistration.framework} registered worker identity`,
      },
      owner: latestRegistration.ownerAddress,
      ownerShort: short(latestRegistration.ownerAddress),
      ownerAddress: latestRegistration.ownerAddress,
      capabilities: latestRegistration.capabilities,
      rating: 5,
      jobsCompleted: 0,
      earned: "0",
      memoryRoot: `0g://${latestRegistration.memoryRoot}`,
      memoryStatus: latestRegistration.status === "live" ? "live" : "demo",
      price: latestRegistration.listing.listed ? `${latestRegistration.listing.price0G} 0G` : "not listed",
      listed: latestRegistration.listing.listed,
      listingStatus: latestRegistration.listing.listed ? "listed" : "not-listed",
      listingSource: latestRegistration.listing.listed ? "latest-registration" : "none",
      sellerAddress: latestRegistration.listing.listed ? latestRegistration.ownerAddress : undefined,
      source: "latest-registration",
      summary: "Worker imported from a Ledger Zero agent manifest and stored as the latest registration receipt.",
    });
  }

  if (latestFlow) {
    const saleTx = latestFlow.chainTxs.find((tx) => tx.label === "purchase worker token")?.hash;
    directory.push({
      slug: `flow-${latestFlow.tokenId}`,
      name: latestFlow.agentName,
      tokenId: latestFlow.tokenId,
      image: {
        src: "/ledger-zero/requests/agent-3.jpg",
        alt: "Latest sold worker identity",
      },
      owner: latestFlow.accounts.newOwner,
      ownerShort: short(latestFlow.accounts.newOwner),
      ownerAddress: latestFlow.accounts.newOwner,
      capabilities: latestFlow.task.tags,
      rating: 5,
      jobsCompleted: 1,
      earned: latestFlow.economics.bidAmount0G,
      memoryRoot: `0g://${latestFlow.storage.memoryRoot}`,
      memoryStatus: latestFlow.status === "live" ? "live" : "fallback",
      price: `${latestFlow.economics.salePrice0G} 0G`,
      listed: false,
      listingStatus: "sold",
      listingSource: "latest-flow",
      sellerAddress: latestFlow.accounts.operator,
      saleTx,
      source: "latest-flow",
      summary: "Latest full-flow worker sale receipt. It is no longer listed because the token already transferred.",
    });
  }

  return directory;
}

export async function buildAccountSnapshot(address: string): Promise<AccountSnapshot> {
  const normalized = address.toLowerCase();
  const directory = await buildWorkerDirectory();
  const latestFlow = await readLatestDemoFlow();
  const ownedWorkers = directory.filter((worker) => sameAddress(worker.ownerAddress, normalized));
  const listings = directory
    .filter((worker) => sameAddress(worker.sellerAddress, normalized))
    .map((worker) => ({
      workerName: worker.name,
      tokenId: worker.tokenId,
      price: worker.price,
      status: worker.listingStatus,
      source: worker.listingSource,
      sellerAddress: worker.sellerAddress,
      saleTx: worker.saleTx,
    }));
  const postedJobs =
    latestFlow && sameAddress(latestFlow.accounts.buyer, normalized)
      ? [
          {
            ...jobs[0],
            id: latestFlow.taskId,
            title: latestFlow.task.title,
            category: latestFlow.task.category,
            payout: `${latestFlow.economics.taskPayment0G} 0G`,
            bond: `${latestFlow.economics.bondAmount0G} 0G`,
            status: "settled",
            acceptedWorker: latestFlow.agentName,
            resultRoot: `0g://${latestFlow.storage.jobResultRoot}`,
            buyerAddress: latestFlow.accounts.buyer,
            source: "latest-flow" as const,
          },
        ]
      : [];
  const earnings0G = latestFlow && sameAddress(latestFlow.accounts.newOwner, normalized) ? latestFlow.economics.bidAmount0G : "0";
  const chain = await getOnChainAccountActivity(address).catch(() => null);

  return {
    address,
    ownedWorkers,
    postedJobs,
    listings,
    earnings0G,
    provenance:
      "Account snapshot combines latest local proof receipts, seeded demo records, and direct Galileo log reads when contracts are configured.",
    chain,
  };
}

export function statusForListing(status: ListingStatus): StatusKind {
  if (status === "listed") return "live";
  if (status === "sold") return "demo";
  if (status === "blocked") return "blocked";
  return "fallback";
}
