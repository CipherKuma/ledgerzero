import { isAddress } from "ethers";

export type ZeroGAddresses = {
  workerINFT: `0x${string}`;
  ledgerEscrow: `0x${string}`;
  identityRegistry: `0x${string}`;
  erc8004Registry: `0x${string}`;
};

export type ZeroGIntegrationConfig = {
  rpcUrl: string;
  chainId: number;
  nativeToken: "0G";
  privateKey?: `0x${string}`;
  addresses: ZeroGAddresses;
};

export const DEFAULT_ZERO_G_ADDRESSES: ZeroGAddresses = {
  workerINFT: "0xd4d74E089DD9A09FF768be95d732081bd542E498",
  ledgerEscrow: "0x83dF0Ed0b4f3D1D057cB56494b8c7eE417265489",
  identityRegistry: "0x9581490E530Da772Af332EBCe3f35D27d5e8377F",
  erc8004Registry: "0x8004B663056A597Dffe9eCcC1965A193B7388713",
};

export function loadZeroGConfig(
  env: NodeJS.ProcessEnv = process.env,
): ZeroGIntegrationConfig {
  const privateKey = normalizePrivateKey(env.PRIVATE_KEY);
  const config: ZeroGIntegrationConfig = {
    rpcUrl: env.GALILEO_RPC ?? "https://evmrpc-testnet.0g.ai",
    chainId: Number(env.GALILEO_CHAIN_ID ?? 16602),
    nativeToken: "0G",
    privateKey,
    addresses: {
      workerINFT: addressFromEnv(
        env.WORKER_INFT_ADDR,
        DEFAULT_ZERO_G_ADDRESSES.workerINFT,
        "WORKER_INFT_ADDR",
      ),
      ledgerEscrow: addressFromEnv(
        env.LEDGER_ESCROW_ADDR,
        DEFAULT_ZERO_G_ADDRESSES.ledgerEscrow,
        "LEDGER_ESCROW_ADDR",
      ),
      identityRegistry: addressFromEnv(
        env.LEDGER_IDENTITY_REGISTRY_ADDR,
        DEFAULT_ZERO_G_ADDRESSES.identityRegistry,
        "LEDGER_IDENTITY_REGISTRY_ADDR",
      ),
      erc8004Registry: addressFromEnv(
        env.ERC8004_REGISTRY_ADDR,
        DEFAULT_ZERO_G_ADDRESSES.erc8004Registry,
        "ERC8004_REGISTRY_ADDR",
      ),
    },
  };

  if (config.chainId !== 16602)
    throw new Error(`0G Galileo chainId must be 16602, got ${config.chainId}`);
  return config;
}

export function requirePrivateKey(
  config: ZeroGIntegrationConfig,
): `0x${string}` {
  if (!config.privateKey)
    throw new Error("PRIVATE_KEY is required for live 0G write operations");
  return config.privateKey;
}

function normalizePrivateKey(
  value: string | undefined,
): `0x${string}` | undefined {
  if (!value) return undefined;
  const normalized = value.startsWith("0x") ? value : `0x${value}`;
  if (!/^0x[0-9a-fA-F]{64}$/.test(normalized))
    throw new Error("PRIVATE_KEY must be a 32-byte hex string");
  return normalized as `0x${string}`;
}

function addressFromEnv(
  value: string | undefined,
  fallback: `0x${string}`,
  name: string,
): `0x${string}` {
  const address = value ?? fallback;
  if (!isAddress(address))
    throw new Error(`${name} must be a valid EVM address`);
  return address as `0x${string}`;
}
