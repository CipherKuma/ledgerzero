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

export const workers: Worker[] = [
  {
    slug: "worker-001",
    name: "Atlas Research Worker",
    tokenId: "2",
    image: {
      src: "/ledger-zero/requests/agent-1.jpg",
      alt: "Atlas Research Worker cinematic agent identity portrait",
    },
    owner: "0x30ab6dF3279CeFD5dD0c78BcDd327cde7A6166fe",
    ownerShort: "0x30ab...66fe",
    capabilities: ["market research", "risk memo", "source audit"],
    rating: 4.82,
    jobsCompleted: 47,
    earned: "18.42",
    memoryRoot: "0g://0x276c5a0616d6172fcd7b16feafb0feb35efb2de9e1966fe7b74aea4204ed245c",
    memoryStatus: "live",
    price: "11.8 0G",
    listed: true,
    summary:
      "A research operator with stored memory, reputation history, and payout routing attached to the iNFT.",
    history: [
      {
        id: "atlas-047",
        title: "0G ecosystem risk brief",
        category: "Research",
        completedAt: "2026-06-24",
        payout: "2.4 0G",
        buyer: "Foundation strategy desk",
        result: "Delivered a cited risk memo with mitigation paths, confidence bands, and dependency map.",
        proof: "0g://0x276c5a0616d6172fcd7b16feafb0feb35efb2de9e1966fe7b74aea4204ed245c",
        status: "released",
      },
      {
        id: "atlas-046",
        title: "Compute router vendor audit",
        category: "Vendor diligence",
        completedAt: "2026-06-18",
        payout: "1.9 0G",
        buyer: "Infra operator",
        result: "Compared router reliability, model drift exposure, and failover posture across providers.",
        proof: "0g://atlas-router-audit-046",
        status: "settled",
      },
      {
        id: "atlas-045",
        title: "Token launch narrative review",
        category: "Narrative",
        completedAt: "2026-06-11",
        payout: "1.3 0G",
        buyer: "Growth team",
        result: "Restructured launch messaging into claims, evidence, and risk disclosures for public release.",
        proof: "0g://atlas-launch-review-045",
        status: "delivered",
      },
    ],
  },
  {
    slug: "worker-002",
    name: "Kite Growth Worker",
    tokenId: "4",
    image: {
      src: "/ledger-zero/requests/agent-2.jpg",
      alt: "Kite Growth Worker anatomical agent identity portrait",
    },
    owner: "0x9D1745d6B1b5164bd9C12A9f2140F2C0D7d68111",
    ownerShort: "0x9D17...8111",
    capabilities: ["lead scoring", "campaign QA", "CRM enrichment"],
    rating: 4.68,
    jobsCompleted: 31,
    earned: "9.75",
    memoryRoot: "0g://demo-growth-worker-root",
    memoryStatus: "demo",
    price: "7.4 0G",
    listed: true,
    summary:
      "A revenue worker tuned for pipeline cleanup and repeatable outbound analysis.",
    history: [
      {
        id: "kite-031",
        title: "Lead scoring cleanup sprint",
        category: "Growth ops",
        completedAt: "2026-06-20",
        payout: "1.1 0G",
        buyer: "RevOps desk",
        result: "Ranked pipeline by fit, disqualified stale leads, and generated next-contact sequences.",
        proof: "0g://kite-growth-031",
        status: "released",
      },
      {
        id: "kite-030",
        title: "Outbound QA sweep",
        category: "Campaign QA",
        completedAt: "2026-06-14",
        payout: "0.8 0G",
        buyer: "Growth team",
        result: "Flagged broken sequences, duplicate sends, and enrichment gaps across launch cohorts.",
        proof: "0g://kite-growth-030",
        status: "settled",
      },
    ],
  },
  {
    slug: "worker-003",
    name: "Forge Solidity Worker",
    tokenId: "3",
    image: {
      src: "/ledger-zero/requests/agent-3.jpg",
      alt: "Forge Solidity Worker surreal ocean agent identity portrait",
    },
    owner: "0x37C1A8a0a04615B741e2815b9E6a584e6BfF5C42",
    ownerShort: "0x37C1...5C42",
    capabilities: ["contract review", "test generation", "threat model"],
    rating: 4.91,
    jobsCompleted: 26,
    earned: "14.10",
    memoryRoot: "0g://demo-solidity-worker-root",
    memoryStatus: "fallback",
    price: "not listed",
    listed: false,
    summary:
      "A code-review worker whose proof bundle is present, while live compute routing is blocked locally.",
    history: [
      {
        id: "forge-026",
        title: "Escrow payout path review",
        category: "Contracts",
        completedAt: "2026-06-17",
        payout: "2.8 0G",
        buyer: "Protocol team",
        result: "Reviewed release logic, ownership resolution, and sale-path edge cases for payout safety.",
        proof: "0g://forge-solidity-026",
        status: "delivered",
      },
      {
        id: "forge-025",
        title: "Threat model for worker transfers",
        category: "Security",
        completedAt: "2026-06-08",
        payout: "2.2 0G",
        buyer: "Marketplace team",
        result: "Mapped spoofed listing, stale approval, and replay surfaces around ownership transfer.",
        proof: "0g://forge-solidity-025",
        status: "settled",
      },
    ],
  },
];

export const jobs: Job[] = [
  {
    id: "task-risk-brief",
    title: "Produce a 0G ecosystem risk brief",
    category: "Research",
    payout: "2.4 0G",
    bond: "0.18 0G",
    minReputation: "4.6",
    status: "running on 0G Compute",
    acceptedWorker: "Atlas Research Worker",
    resultRoot: "0g://0x276c5a0616d6172fcd7b16feafb0feb35efb2de9e1966fe7b74aea4204ed245c",
    bids: [
      { worker: "Atlas Research Worker", amount: "2.4 0G", score: "98" },
      { worker: "Kite Growth Worker", amount: "2.1 0G", score: "83" },
      { worker: "Forge Solidity Worker", amount: "2.9 0G", score: "77" },
    ],
  },
  {
    id: "task-audit-router",
    title: "Audit payout recipient logic",
    category: "Smart contracts",
    payout: "3.1 0G",
    bond: "0.25 0G",
    minReputation: "4.8",
    status: "posted",
    acceptedWorker: "Awaiting acceptance",
    resultRoot: "blocked until worker accepted",
    bids: [
      { worker: "Forge Solidity Worker", amount: "3.1 0G", score: "96" },
      { worker: "Atlas Research Worker", amount: "3.4 0G", score: "82" },
    ],
  },
];

export const transferDemo = {
  worker: workers[0],
  taskId: "0xb658dce1a91daf2a94adfad5d42add173fe476fa46ee58a1fcb0b915834999fc",
  ownerBefore: "0xFF8eF7B9EdD1Bf80A3454200CA2fb6AaCED3E120",
  ownerAfter: "0x30ab6dF3279CeFD5dD0c78BcDd327cde7A6166fe",
  payoutRecipientBefore: "0xFF8e...E120",
  payoutRecipientAfter: "0x30ab...66fe",
  releaseTx: "0x804f8387bf500712fd77e3bc1c2791237c65c65ce1fe78fedc12a4accf37d74e",
};

export const contracts = [
  {
    name: "WorkerINFT",
    role: "Ownable ERC-7857-style worker iNFT with encrypted memory root.",
    source: "11-ledger-pure0g/contracts/WorkerINFT.sol",
    status: "live" as StatusKind,
  },
  {
    name: "LedgerEscrow",
    role: "Posts tasks, accepts worker-token bids, resolves payoutRecipient(taskId).",
    source: "11-ledger-pure0g/contracts/LedgerEscrow.sol",
    status: "live" as StatusKind,
  },
  {
    name: "LedgerMarketplace",
    role: "Lists WorkerINFT assets, enforces exact-price buys, pays sellers, and clears stale listings.",
    source: "contracts/src/LedgerMarketplace.sol",
    status: "blocked" as StatusKind,
  },
  {
    name: "LedgerCapabilityRegistry",
    role: "Pure 0G capability namespace for worker skills and rates.",
    source: "11-ledger-pure0g/contracts/LedgerCapabilityRegistry.sol",
    status: "demo" as StatusKind,
  },
  {
    name: "LedgerIdentityRegistry",
    role: "Agent identity and worker naming on 0G.",
    source: "11-ledger-pure0g/contracts/LedgerIdentityRegistry.sol",
    status: "demo" as StatusKind,
  },
  {
    name: "ERC8004",
    role: "Reputation feedback registry deployed in the pure 0G contract set.",
    source: "11-ledger-pure0g/contracts/ERC8004.sol",
    status: "demo" as StatusKind,
  },
  {
    name: "MockTEEOracle",
    role: "Demo proof verifier only; not claimed as a real TEE.",
    source: "11-ledger-pure0g/contracts/MockTEEOracle.sol",
    status: "fallback" as StatusKind,
  },
];

export const proofArtifacts: ProofArtifact[] = [
  {
    layer: "0G Chain",
    artifact: "Worker ownership",
    value: "ownerOf(2) -> 0x30ab...66fe",
    status: "live",
    note: "Current owner controls future payouts.",
  },
  {
    layer: "LedgerEscrow",
    artifact: "Payout recipient",
    value: "payoutRecipient(0xb658...99fc) -> 0x30ab...66fe",
    status: "live",
    note: "Live Galileo escrow payout followed the funded project-wallet worker transfer.",
  },
  {
    layer: "0G Storage",
    artifact: "WorkerMemoryProfile",
    value: "0g://0x276c5a0616d6172fcd7b16feafb0feb35efb2de9e1966fe7b74aea4204ed245c",
    status: "live",
    note: "Encrypted intelligence root attached to worker token.",
  },
  {
    layer: "0G Storage",
    artifact: "JobResult",
    value: "tx 0xbe782bf4eea281fb694344f65df36dc95533dd2727990c902ae993ca6048c2ad",
    status: "live",
    note: "Structured result bundle uploaded through 0G Storage by the project wallet.",
  },
  {
    layer: "0G Compute",
    artifact: "Compute run",
    value: "qwen2.5-omni / 0xa48f...7836",
    status: "live",
    note: "Worker execution returned a routed 0G testnet Compute response.",
  },
  {
    layer: "CapabilityRegistry",
    artifact: "CapabilityManifest",
    value: "research.risk-memo.source-audit",
    status: "demo",
    note: "Pure 0G registry stores worker capability namespaces.",
  },
  {
    layer: "IdentityRegistry",
    artifact: "Agentic ID",
    value: "ledger-zero/worker-001",
    status: "demo",
    note: "Identity registration lives on 0G in the pure contract set.",
  },
  {
    layer: "ERC8004",
    artifact: "ReputationSnapshot",
    value: "token owner recorded 1 successful live job",
    status: "live",
    note: "Live contract flow recorded reputation for the post-transfer worker owner.",
  },
  {
    layer: "Transfer receipt",
    artifact: "OwnershipTransferReceipt",
    value: transferDemo.releaseTx,
    status: "live",
    note: "Live Galileo escrow release after worker transfer.",
  },
];

export function getWorker(slug: string) {
  return workers.find((worker) => worker.slug === slug) ?? workers[0];
}

export function getJob(id: string) {
  return jobs.find((job) => job.id === id) ?? jobs[0];
}
