export const galileoExplorer = "https://chainscan-galileo.0g.ai";

export const contractAddresses = {
  erc8004: process.env.NEXT_PUBLIC_LEDGER_ZERO_ERC8004 ?? "",
  mockTEEOracle: process.env.NEXT_PUBLIC_LEDGER_ZERO_MOCK_TEE_ORACLE ?? "",
  workerINFT: process.env.NEXT_PUBLIC_LEDGER_ZERO_WORKER_INFT ?? "",
  capabilityRegistry: process.env.NEXT_PUBLIC_LEDGER_ZERO_CAPABILITY_REGISTRY ?? "",
  identityRegistry: process.env.NEXT_PUBLIC_LEDGER_ZERO_IDENTITY_REGISTRY ?? "",
  escrow: process.env.NEXT_PUBLIC_LEDGER_ZERO_ESCROW ?? "",
  marketplace: process.env.NEXT_PUBLIC_LEDGER_ZERO_MARKETPLACE ?? "",
  deployer: process.env.NEXT_PUBLIC_LEDGER_ZERO_DEPLOYER ?? "",
} as const;

export type ContractKey = keyof typeof contractAddresses;

export function hasContractAddress(key: ContractKey) {
  return /^0x[a-fA-F0-9]{40}$/.test(contractAddresses[key]);
}

export function explorerAddress(address: string) {
  return `${galileoExplorer}/address/${address}`;
}
