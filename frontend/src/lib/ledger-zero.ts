export type StatusKind = "live" | "demo" | "blocked" | "fallback";

export type Worker = {
  slug: string;
  name: string;
  tokenId: string;
  image: {
    src: string;
    alt: string;
  };
  owner: string;
  ownerShort: string;
  capabilities: string[];
  rating: number;
  jobsCompleted: number;
  earned: string;
  memoryRoot: string;
  memoryStatus: StatusKind;
  price: string;
  listed: boolean;
  registeredAt?: string;
  listedAt?: string;
  listingStatus?: "listed" | "sold" | "not-listed" | "blocked";
  listingSource?: string;
  summary: string;
  history: Array<{
    id: string;
    title: string;
    category: string;
    completedAt: string;
    payout: string;
    buyer: string;
    result: string;
    proof: string;
    status: "settled" | "delivered" | "released";
  }>;
};

export type Job = {
  id: string;
  title: string;
  category: string;
  payout: string;
  bond: string;
  minReputation: string;
  status: string;
  postedAt?: string;
  postedTx?: string;
  postedBlock?: number;
  buyerAddress?: string;
  deadline?: number;
  releaseTx?: string;
  workerAddress?: string;
  workerTokenId?: string;
  acceptedWorker: string;
  resultRoot: string;
  bids: Array<{ worker: string; amount: string; score: string }>;
};

export type ProofArtifact = {
  layer: string;
  artifact: string;
  value: string;
  status: StatusKind;
  note: string;
};
