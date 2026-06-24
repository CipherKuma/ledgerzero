import { getOnChainAccountActivity, type ChainAccountActivity } from "@/lib/0g/events";
import { getOnChainJobs, getOnChainWorkers } from "@/lib/onchain-data";
import type { Job, StatusKind, Worker } from "@/lib/ledger-zero";

export type DirectorySource = "on-chain";
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
  postedJobs: Array<Job & { buyerAddress: string; source: DirectorySource; workerTokenId?: string }>;
  listings: AccountListing[];
  earnings0G: string;
  provenance: string;
  chain: ChainAccountActivity | null;
};

function sameAddress(a?: string, b?: string) {
  return Boolean(a && b && a.toLowerCase() === b.toLowerCase());
}

export async function buildWorkerDirectory(): Promise<DirectoryWorker[]> {
  const workers = await getOnChainWorkers();
  return workers.map((worker) => ({
    ...worker,
    source: "on-chain",
    listingSource: worker.listingStatus === "listed" || worker.listingStatus === "sold" ? "on-chain" : "none",
  }));
}

export async function buildAccountSnapshot(address: string): Promise<AccountSnapshot> {
  const normalized = address.toLowerCase();
  const [directory, jobs, chain] = await Promise.all([
    buildWorkerDirectory(),
    getOnChainJobs(),
    getOnChainAccountActivity(address).catch(() => null),
  ]);
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
  const postedJobs = jobs
    .filter((job) => sameAddress(job.buyerAddress, normalized))
    .map((job) => ({ ...job, source: "on-chain" as const }));
  const earnings0G = ownedWorkers
    .reduce((sum, worker) => sum + Number.parseFloat(worker.earned || "0"), 0)
    .toFixed(4)
    .replace(/\.?0+$/, "");

  return {
    address,
    ownedWorkers,
    postedJobs,
    listings,
    earnings0G: earnings0G || "0",
    provenance: "Account snapshot uses direct Galileo contract reads and event logs only.",
    chain,
  };
}

export function statusForListing(status: ListingStatus): StatusKind {
  if (status === "listed") return "live";
  if (status === "sold") return "live";
  if (status === "blocked") return "blocked";
  return "fallback";
}
