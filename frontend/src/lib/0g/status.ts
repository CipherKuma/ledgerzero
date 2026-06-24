import { contractAddresses, hasContractAddress } from "@/lib/contracts";
import { envNumber, withTimeout } from "@/lib/server/perf";
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

export type ZeroGStatus = {
  rpc: string;
  indexer: string;
  computeModel: string;
  storageConfigured: boolean;
  computeConfigured: boolean;
  signer: { address: string; balance: string } | null;
  contracts: Array<{
    name: string;
    key: string;
    address: string;
    configured: boolean;
    deployed: boolean;
  }>;
};

type StatusOptions = {
  timeoutMs?: number;
  cacheMs?: number;
  preferFresh?: boolean;
};

let statusCache: { value: ZeroGStatus; expiresAt: number } | null = null;
let statusInflight: Promise<ZeroGStatus> | null = null;

function fallbackStatus(): ZeroGStatus {
  return {
    rpc: ZEROG_RPC,
    indexer: ZEROG_INDEXER,
    computeModel: ROUTER_MODEL,
    storageConfigured: Boolean(process.env.ZEROG_PRIVATE_KEY && ZEROG_INDEXER),
    computeConfigured: Boolean(process.env.ZEROG_ROUTER_API_KEY && process.env.ZEROG_COMPUTE_ROUTER),
    signer: null,
    contracts: liveContracts.map(([name, key]) => ({
      name,
      key,
      address: contractAddresses[key],
      configured: hasContractAddress(key),
      deployed: false,
    })),
  };
}

async function readZeroGStatus(timeoutMs: number): Promise<ZeroGStatus> {
  const provider = getProvider();
  const rpcTimeout = Math.max(400, timeoutMs);
  const [contracts, signer] = await Promise.all([
    Promise.all(
    liveContracts.map(async ([name, key]) => {
      const address = contractAddresses[key];
      const configured = hasContractAddress(key);
      let deployed = false;
      if (configured) {
        deployed = await withTimeout(provider.getCode(address).then((code) => code !== "0x").catch(() => false), false, rpcTimeout);
      }
      return { name, key, address, configured, deployed };
    }),
    ),
    withTimeout(getSignerBalance().catch(() => null), null, rpcTimeout),
  ]);

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

export async function getZeroGStatus(options: StatusOptions = {}) {
  const timeoutMs = options.timeoutMs ?? envNumber("ZEROG_STATUS_TIMEOUT_MS", 1_200);
  const cacheMs = options.cacheMs ?? envNumber("ZEROG_STATUS_CACHE_MS", 30_000);
  const now = Date.now();

  if (!options.preferFresh && statusCache && statusCache.expiresAt > now) {
    return statusCache.value;
  }

  if (!statusInflight || options.preferFresh) {
    statusInflight = readZeroGStatus(timeoutMs)
      .then((value) => {
        statusCache = { value, expiresAt: Date.now() + cacheMs };
        return value;
      })
      .catch(() => statusCache?.value ?? fallbackStatus())
      .finally(() => {
        statusInflight = null;
      });
  }

  return withTimeout(statusInflight, statusCache?.value ?? fallbackStatus(), timeoutMs);
}
