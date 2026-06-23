export type LedgerZeroAgentFramework = "openclaw" | "hermes" | "custom";

export type LedgerZeroCapability = {
  id: string;
  label: string;
  description: string;
  inputSchema?: Record<string, unknown>;
  outputSchema?: Record<string, unknown>;
};

export type LedgerZeroAgentManifest = {
  protocol: "ledger-zero-agent";
  protocolVersion: "0.1";
  framework: LedgerZeroAgentFramework;
  name: string;
  description: string;
  operatorAddress: string;
  agentUrl: string;
  manifestUrl?: string;
  healthUrl: string;
  invokeUrl: string;
  iconUrl?: string;
  capabilities: LedgerZeroCapability[];
  memory: {
    mode: "encrypted-owner-transferable";
    storage: "0G Storage";
    encryption: string;
    updatePolicy: string;
  };
  pricing: {
    minPayout0G: string;
    bidBond0G: string;
    salePrice0G: string;
  };
  proofHooks: string[];
  jobInterface: {
    accepts: string[];
    returns: string[];
  };
};

export type AgentInspection = {
  manifestUrl: string;
  manifest: LedgerZeroAgentManifest;
  status: "ready" | "blocked";
  checks: Array<{
    label: string;
    status: "live" | "declared" | "blocked";
    detail: string;
  }>;
};

export type AgentRegistrationReceipt = {
  kind: "LedgerZeroAgentRegistration";
  createdAt: string;
  manifestUrl: string;
  framework: LedgerZeroAgentFramework;
  agentName: string;
  operatorAddress: string;
  ownerAddress: string;
  tokenId: string | null;
  memoryRoot: string;
  manifestRoot: string;
  registrationRoot: string;
  storageTxs: {
    memoryProfile: string;
    capabilityManifest: string;
    registrationReceipt: string;
  };
  chainTxs: Array<{
    label: string;
    hash: string;
    block: number;
  }>;
  contractAddresses: {
    workerINFT: string;
    capabilityRegistry: string;
    identityRegistry: string;
  };
  capabilities: string[];
  status: "live" | "storage-only";
  listing: {
    listed: boolean;
    price0G: string;
    payoutRule: "ownerOf(workerTokenId)";
  };
  proofNotes: string[];
};
