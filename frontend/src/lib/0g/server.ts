import { ethers } from "ethers";

const RPC = process.env.ZEROG_RPC ?? process.env.NEXT_PUBLIC_GALILEO_RPC ?? "https://evmrpc-testnet.0g.ai";
const GALILEO_NETWORK = { name: "galileo", chainId: 16602 } as const;
let provider: ethers.JsonRpcProvider | null = null;

export const ZEROG_INDEXER =
  process.env.ZEROG_INDEXER ?? "https://indexer-storage-testnet-turbo.0g.ai";

export function getProvider() {
  provider ??= new ethers.JsonRpcProvider(RPC, GALILEO_NETWORK, { staticNetwork: true });
  return provider;
}

export function getWallet() {
  const privateKey = process.env.ZEROG_PRIVATE_KEY;
  if (!privateKey) throw new Error("ZEROG_PRIVATE_KEY not set");
  return new ethers.Wallet(privateKey, getProvider());
}

export async function getSignerBalance() {
  const wallet = getWallet();
  const balance = await wallet.provider!.getBalance(wallet.address);
  return {
    address: wallet.address,
    balance: ethers.formatEther(balance),
  };
}

export const ZEROG_RPC = RPC;
