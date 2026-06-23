import { contractAddresses, hasContractAddress } from "@/lib/contracts";
import { ROUTER_MODEL } from "./compute";
import { getProvider, getSignerBalance, ZEROG_INDEXER, ZEROG_RPC } from "./server";

const liveContracts = [
  ["WorkerINFT", "workerINFT"],
  ["LedgerEscrow", "escrow"],
  ["LedgerMarketplace", "marketplace"],
  ["LedgerCapabilityRegistry", "capabilityRegistry"],
  ["LedgerIdentityRegistry", "identityRegistry"],
  ["ERC8004", "erc8004"],
  ["MockTEEOracle", "mockTEEOracle"],
] as const;

export async function getZeroGStatus() {
  const provider = getProvider();
  const contracts = await Promise.all(
    liveContracts.map(async ([name, key]) => {
      const address = contractAddresses[key];
      const configured = hasContractAddress(key);
      let deployed = false;
      if (configured) {
        try {
          deployed = (await provider.getCode(address)) !== "0x";
        } catch {
          deployed = false;
        }
      }
      return { name, key, address, configured, deployed };
    }),
  );

  let signer: { address: string; balance: string } | null = null;
  try {
    signer = await getSignerBalance();
  } catch {
    signer = null;
  }

  return {
    rpc: ZEROG_RPC,
    indexer: ZEROG_INDEXER,
    computeModel: ROUTER_MODEL,
    storageConfigured: Boolean(process.env.ZEROG_PRIVATE_KEY && ZEROG_INDEXER),
    computeConfigured: Boolean(process.env.ZEROG_ROUTER_API_KEY && process.env.ZEROG_COMPUTE_ROUTER),
    signer,
    contracts,
  };
}
