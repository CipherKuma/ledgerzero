import type { ComputeProof } from "@/lib/0g/compute";
import type { LedgerZeroAgentFramework } from "@/lib/agents/types";

export type DemoFlowReceipt = {
  kind: "LedgerZeroFullDemoFlow";
  createdAt: string;
  status: "live" | "compute-fallback";
  framework: LedgerZeroAgentFramework;
  agentName: string;
  tokenId: string;
  taskId: string;
  task: {
    title: string;
    description: string;
    category: string;
    tags: string[];
  };
  accounts: {
    operator: string;
    buyer: string;
    newOwner: string;
  };
  economics: {
    taskPayment0G: string;
    bidAmount0G: string;
    bondAmount0G: string;
    salePrice0G: string;
    purchasePayment0G: string;
    payoutRecipientBeforeTransfer: string;
    payoutRecipientAfterTransfer: string;
    newOwnerBalanceBefore0G: string;
    newOwnerBalanceAfter0G: string;
  };
  storage: {
    taskBriefRoot: string;
    taskBriefTx: string;
    memoryRoot: string;
    memoryTx: string;
    capabilityRoot: string;
    capabilityTx: string;
    jobResultRoot: string;
    jobResultTx: string;
    transferReceiptRoot: string;
    transferReceiptTx: string;
    reputationSnapshotRoot: string;
    reputationSnapshotTx: string;
    demoReceiptRoot: string;
    demoReceiptTx: string;
  };
  compute: {
    ran: boolean;
    content: string;
    proof: ComputeProof | null;
  };
  chainTxs: Array<{
    label: string;
    hash: string;
    block: number;
  }>;
  contractAddresses: {
    workerINFT: string;
    escrow: string;
    capabilityRegistry: string;
    identityRegistry: string;
    erc8004: string;
  };
  assertions: Array<{
    label: string;
    value: string;
    status: "live" | "demo";
  }>;
};

export type DemoFlowAttempt = {
  kind: "LedgerZeroDemoFlowAttempt";
  runId: string;
  createdAt: string;
  status: "running" | "succeeded" | "failed";
  error?: string;
  receiptRoot?: string;
};
