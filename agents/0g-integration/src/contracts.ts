import { Contract, JsonRpcProvider, Wallet } from "ethers";
import {
  loadZeroGConfig,
  requirePrivateKey,
  type ZeroGIntegrationConfig,
} from "./config.js";

export type WorkerProfile = {
  tokenId: bigint;
  owner: `0x${string}`;
  agentName: string;
  sealedKey: `0x${string}`;
  memoryCID: string;
  initialReputationRef: string;
  updatedAt: bigint;
};

export const WORKER_INFT_ABI = [
  "function ownerOf(uint256 tokenId) view returns (address)",
  "function getMetadata(uint256 tokenId) view returns ((string agentName, bytes sealedKey, string memoryCID, string initialReputationRef, uint64 updatedAt))",
  "function mint(address to,string agentName,bytes sealedKey,string memoryCID,string initialReputationRef) returns (uint256)",
  "function transfer(address from,address to,uint256 tokenId,bytes sealedKey,bytes proof)",
  "function updateMemoryPointer(uint256 tokenId,string newCID)",
] as const;

export const LEDGER_ESCROW_ABI = [
  "function postTask(bytes32 taskId,uint256 payment,uint256 deadline,uint256 minReputation) payable",
  "function acceptBid(bytes32 taskId,address workerAddress,uint256 bidAmount,uint256 bondAmount) payable",
  "function releasePayment(bytes32 taskId,bytes32 resultHash)",
  "function tasks(bytes32 taskId) view returns (address buyer,address worker,uint256 payment,uint256 deadline,uint256 minReputation,uint256 bidAmount,uint256 bondAmount,bytes32 resultHash,uint8 status)",
] as const;

export function getProvider(
  config: ZeroGIntegrationConfig = loadZeroGConfig(),
): JsonRpcProvider {
  return new JsonRpcProvider(config.rpcUrl, config.chainId);
}

export function getSigner(
  config: ZeroGIntegrationConfig = loadZeroGConfig(),
): Wallet {
  return new Wallet(requirePrivateKey(config), getProvider(config));
}

export async function readWorkerProfile(
  tokenId: bigint | number,
  config: ZeroGIntegrationConfig = loadZeroGConfig(),
): Promise<WorkerProfile> {
  const provider = getProvider(config);
  const contract = new Contract(
    config.addresses.workerINFT,
    WORKER_INFT_ABI,
    provider,
  );
  const [owner, metadata] = await Promise.all([
    contract.ownerOf(tokenId),
    contract.getMetadata(tokenId),
  ]);
  return toWorkerProfile(BigInt(tokenId), owner, metadata);
}

export function toWorkerProfile(
  tokenId: bigint,
  owner: string,
  metadata: any,
): WorkerProfile {
  return {
    tokenId,
    owner: owner as `0x${string}`,
    agentName: metadata.agentName ?? metadata[0],
    sealedKey: (metadata.sealedKey ?? metadata[1]) as `0x${string}`,
    memoryCID: metadata.memoryCID ?? metadata[2],
    initialReputationRef: metadata.initialReputationRef ?? metadata[3],
    updatedAt: BigInt(metadata.updatedAt ?? metadata[4]),
  };
}

export async function mintWorkerINFT(input: {
  to: `0x${string}`;
  agentName: string;
  sealedKey: `0x${string}`;
  memoryCID: string;
  initialReputationRef: string;
  config?: ZeroGIntegrationConfig;
}): Promise<`0x${string}`> {
  const config = input.config ?? loadZeroGConfig();
  const contract = new Contract(
    config.addresses.workerINFT,
    WORKER_INFT_ABI,
    getSigner(config),
  );
  const tx = await contract.mint(
    input.to,
    input.agentName,
    input.sealedKey,
    input.memoryCID,
    input.initialReputationRef,
  );
  await tx.wait();
  return tx.hash;
}

export async function transferWorkerINFT(input: {
  from: `0x${string}`;
  to: `0x${string}`;
  tokenId: bigint | number;
  sealedKey: `0x${string}`;
  proof: `0x${string}`;
  config?: ZeroGIntegrationConfig;
}): Promise<`0x${string}`> {
  const config = input.config ?? loadZeroGConfig();
  const contract = new Contract(
    config.addresses.workerINFT,
    WORKER_INFT_ABI,
    getSigner(config),
  );
  const tx = await contract.transfer(
    input.from,
    input.to,
    input.tokenId,
    input.sealedKey,
    input.proof,
  );
  await tx.wait();
  return tx.hash;
}
