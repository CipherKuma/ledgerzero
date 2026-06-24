import { parseEther } from "viem";

export const workerAbi = [
  { type: "function", name: "ownerOf", stateMutability: "view", inputs: [{ name: "tokenId", type: "uint256" }], outputs: [{ name: "owner", type: "address" }] },
] as const;

export const escrowAbi = [
  {
    type: "function",
    name: "acceptTokenBid",
    stateMutability: "payable",
    inputs: [
      { name: "taskId", type: "bytes32" },
      { name: "workerTokenId", type: "uint256" },
      { name: "bidAmount", type: "uint256" },
      { name: "bondAmount", type: "uint256" },
    ],
    outputs: [],
  },
  {
    type: "function",
    name: "releasePayment",
    stateMutability: "nonpayable",
    inputs: [
      { name: "taskId", type: "bytes32" },
      { name: "resultHash", type: "bytes32" },
    ],
    outputs: [],
  },
] as const;

export const GAS_BUFFER = parseEther("0.00025");

export function sameAddress(a?: string, b?: string) {
  return Boolean(a && b && a.toLowerCase() === b.toLowerCase());
}

export function amount(value?: string) {
  return (value ?? "0").replace(/\s*0G$/i, "").trim();
}

export function formatTxError(error: unknown) {
  const message = error instanceof Error ? error.message : String(error);
  if (/User rejected|rejected/i.test(message)) return "Transaction was rejected in the wallet.";
  if (/insufficient funds/i.test(message)) return "Wallet does not have enough 0G for value plus gas.";
  if (/InvalidStatus/i.test(message)) return "This job is no longer in the required lifecycle state.";
  if (/NotBuyer/i.test(message)) return "Only the job buyer can release payment, and only the worker owner can accept token bids.";
  if (/InsufficientReputation/i.test(message)) return "This worker does not satisfy the minimum reputation gate.";
  return message;
}

export function localResultKey(taskId: string) {
  return `ledger-zero-job-result:${taskId}`;
}

export function localRatingKey(taskId: string) {
  return `ledger-zero-job-rating:${taskId}`;
}
