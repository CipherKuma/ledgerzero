"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { usePrivy, useWallets } from "@privy-io/react-auth";
import { formatEther, parseEther, stringToHex, type Hex } from "viem";
import { useBalance, useChainId, usePublicClient, useSwitchChain, useWriteContract } from "wagmi";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { galileo } from "@/lib/chains";
import { contractAddresses, hasContractAddress } from "@/lib/contracts";
import type { DirectoryWorker } from "@/lib/directory";
import { MarketTransactionDialog } from "./MarketTransactionDialog";

const workerAbi = [
  { type: "function", name: "ownerOf", stateMutability: "view", inputs: [{ name: "tokenId", type: "uint256" }], outputs: [{ name: "owner", type: "address" }] },
  { type: "function", name: "approve", stateMutability: "nonpayable", inputs: [{ name: "to", type: "address" }, { name: "tokenId", type: "uint256" }], outputs: [] },
  { type: "function", name: "getApproved", stateMutability: "view", inputs: [{ name: "tokenId", type: "uint256" }], outputs: [{ name: "approved", type: "address" }] },
  { type: "function", name: "isApprovedForAll", stateMutability: "view", inputs: [{ name: "owner", type: "address" }, { name: "operator", type: "address" }], outputs: [{ name: "approved", type: "bool" }] },
] as const;

const marketplaceAbi = [
  { type: "function", name: "listWorker", stateMutability: "nonpayable", inputs: [{ name: "tokenId", type: "uint256" }, { name: "price", type: "uint256" }], outputs: [] },
  { type: "function", name: "cancelListing", stateMutability: "nonpayable", inputs: [{ name: "tokenId", type: "uint256" }], outputs: [] },
  { type: "function", name: "buyWorker", stateMutability: "payable", inputs: [{ name: "tokenId", type: "uint256" }, { name: "sealedKey", type: "bytes" }, { name: "proof", type: "bytes" }], outputs: [] },
  { type: "function", name: "activeListing", stateMutability: "view", inputs: [{ name: "tokenId", type: "uint256" }], outputs: [{ type: "tuple", components: [{ name: "seller", type: "address" }, { name: "price", type: "uint256" }, { name: "active", type: "bool" }, { name: "listedAt", type: "uint64" }] }] },
] as const;

const GAS_BUFFER = parseEther("0.0002");
const LIST_BUFFER = parseEther("0.00045");
const BUY_PROOF = stringToHex("ledger-pure0g-mock-proof");

type ListingAction = "listed" | "cancelled" | "purchased";
type MarketplaceListing = {
  seller: `0x${string}`;
  price: bigint;
  active: boolean;
  listedAt: bigint | number;
};

function sameAddress(a?: string, b?: string) {
  return Boolean(a && b && a.toLowerCase() === b.toLowerCase());
}

function trim0g(value: string) {
  return value.replace(/\s*0G$/i, "").trim();
}

function formatTxError(error: unknown, fallback: string) {
  const message = error instanceof Error ? error.message : String(error);
  if (/User rejected|rejected/i.test(message)) return "Transaction was rejected in the wallet.";
  if (/insufficient funds/i.test(message)) return "Wallet does not have enough 0G to cover the transaction and gas.";
  if (/NotApproved/i.test(message)) return "Marketplace approval is missing for this worker token.";
  if (/NotTokenOwner/i.test(message)) return "Only the current owner can list this worker.";
  if (/NotSeller/i.test(message)) return "Only the seller who listed this worker can cancel it.";
  if (/NotListed/i.test(message)) return "This listing is no longer active on chain.";
  if (/IncorrectPayment/i.test(message)) return "Listing price changed on chain. Refresh and try again.";
  if (/InvalidBuyer/i.test(message)) return "You already own this worker, so you cannot buy your own listing.";
  if (/StaleListing/i.test(message)) return "The listing is stale because ownership or approval changed.";
  if (/InvalidProof/i.test(message)) return "Marketplace transfer proof was rejected by the verifier.";
  return message || fallback;
}

async function refreshOnChainCache() {
  try {
    await fetch("/api/onchain/refresh", { method: "POST" });
  } catch {
    // Fresh route navigation still helps; cache invalidation is best effort.
  }
}

function listingArtifact(worker: DirectoryWorker, price?: string) {
  return `Worker #${worker.tokenId}${price ? ` at ${price}` : ""}`;
}

function normalizeListing(
  listing:
    | MarketplaceListing
    | readonly [`0x${string}`, bigint, boolean, bigint | number],
): MarketplaceListing {
  if ("seller" in listing) return listing;
  return {
    seller: listing[0],
    price: listing[1],
    active: listing[2],
    listedAt: listing[3],
  };
}

export function OwnedWorkerListingActions({ worker }: { worker: DirectoryWorker }) {
  const router = useRouter();
  const { ready, authenticated, login, user } = usePrivy();
  const { wallets } = useWallets();
  const publicClient = usePublicClient({ chainId: galileo.id });
  const { switchChainAsync } = useSwitchChain();
  const { writeContractAsync } = useWriteContract();
  const chainId = useChainId();
  const address = (wallets[0]?.address ?? user?.wallet?.address) as `0x${string}` | undefined;
  const { data: balance } = useBalance({ address, chainId: galileo.id });
  const [price, setPrice] = React.useState(trim0g(worker.price === "not listed" ? "0.0002" : worker.price));
  const [listOpen, setListOpen] = React.useState(false);
  const [running, setRunning] = React.useState<"idle" | "approving" | "listing" | "cancelling">("idle");
  const [error, setError] = React.useState("");
  const [txHash, setTxHash] = React.useState<Hex | undefined>();
  const [acknowledgedHash, setAcknowledgedHash] = React.useState<Hex | undefined>();
  const [completedAction, setCompletedAction] = React.useState<ListingAction | null>(null);

  const busy = running !== "idle";
  const ownsWorker = sameAddress(address, worker.ownerAddress);
  const successOpen = Boolean(txHash && completedAction && acknowledgedHash !== txHash);

  async function ensureReadyWallet() {
    if (!ready) throw new Error("Wallet is still loading.");
    if (!authenticated) {
      login();
      throw new Error("Connect wallet to continue.");
    }
    if (!address) throw new Error("Wallet address is still being created. Try again in a moment.");
    if (!publicClient) throw new Error("0G Galileo client is unavailable.");
    if (!hasContractAddress("workerINFT") || !hasContractAddress("marketplace")) {
      throw new Error("Marketplace contracts are not configured.");
    }
    if (chainId !== galileo.id) {
      await switchChainAsync({ chainId: galileo.id });
    }
    return address;
  }

  async function currentBalance(walletAddress: `0x${string}`) {
    return publicClient!.getBalance({ address: walletAddress });
  }

  async function listWorker() {
    try {
      setBusyState("approving");
      setError("");
      setCompletedAction(null);
      setTxHash(undefined);
      const walletAddress = await ensureReadyWallet();
      if (!ownsWorker) throw new Error("Only the current owner can list this worker.");
      const tokenId = BigInt(worker.tokenId);
      const salePrice = parseEther(price);
      if (salePrice <= 0n) throw new Error("Listing price must be greater than zero.");

      const owner = await publicClient!.readContract({
        address: contractAddresses.workerINFT as `0x${string}`,
        abi: workerAbi,
        functionName: "ownerOf",
        args: [tokenId],
      });
      if (!sameAddress(owner, walletAddress)) throw new Error("This wallet no longer owns the worker on chain.");

      const approved = await publicClient!.readContract({
        address: contractAddresses.workerINFT as `0x${string}`,
        abi: workerAbi,
        functionName: "getApproved",
        args: [tokenId],
      });
      const approvedForAll = await publicClient!.readContract({
        address: contractAddresses.workerINFT as `0x${string}`,
        abi: workerAbi,
        functionName: "isApprovedForAll",
        args: [walletAddress, contractAddresses.marketplace as `0x${string}`],
      });

      let liveBalance = await currentBalance(walletAddress);
      if (!approvedForAll && !sameAddress(approved, contractAddresses.marketplace)) {
        const gasPrice = await publicClient!.getGasPrice();
        const approveGas = await publicClient!.estimateContractGas({
          account: walletAddress,
          address: contractAddresses.workerINFT as `0x${string}`,
          abi: workerAbi,
          functionName: "approve",
          args: [contractAddresses.marketplace as `0x${string}`, tokenId],
        });
        const required = approveGas * gasPrice + LIST_BUFFER;
        if (liveBalance < required) {
          throw new Error(
            `Wallet balance is too low for approval plus listing gas. Keep at least ${formatEther(required)} 0G available before listing.`,
          );
        }

        const approvalHash = await writeContractAsync({
          address: contractAddresses.workerINFT as `0x${string}`,
          abi: workerAbi,
          functionName: "approve",
          args: [contractAddresses.marketplace as `0x${string}`, tokenId],
          chainId: galileo.id,
        });
        toast.success("Marketplace approval submitted");
        await publicClient!.waitForTransactionReceipt({ hash: approvalHash });
        toast.success("Marketplace approval confirmed");
        liveBalance = await currentBalance(walletAddress);
      }

      setBusyState("listing");
      const gasPrice = await publicClient!.getGasPrice();
      const listGas = await publicClient!.estimateContractGas({
        account: walletAddress,
        address: contractAddresses.marketplace as `0x${string}`,
        abi: marketplaceAbi,
        functionName: "listWorker",
        args: [tokenId, salePrice],
      });
      const required = listGas * gasPrice + GAS_BUFFER;
      if (liveBalance < required) {
        throw new Error("Wallet balance is too low for the listing transaction gas.");
      }

      const hash = await writeContractAsync({
        address: contractAddresses.marketplace as `0x${string}`,
        abi: marketplaceAbi,
        functionName: "listWorker",
        args: [tokenId, salePrice],
        chainId: galileo.id,
      });
      setTxHash(hash);
      toast.success("Listing transaction submitted");
      await publicClient!.waitForTransactionReceipt({ hash });
      await refreshOnChainCache();
      setCompletedAction("listed");
      setListOpen(false);
      toast.success("Worker listed on 0G");
    } catch (nextError) {
      const message = formatTxError(nextError, "Could not list worker.");
      setError(message);
      toast.error(message);
    } finally {
      setBusyState("idle");
    }
  }

  async function cancelListing() {
    try {
      setBusyState("cancelling");
      setError("");
      setCompletedAction(null);
      setTxHash(undefined);
      const walletAddress = await ensureReadyWallet();
      const tokenId = BigInt(worker.tokenId);
      const listing = normalizeListing(await publicClient!.readContract({
        address: contractAddresses.marketplace as `0x${string}`,
        abi: marketplaceAbi,
        functionName: "activeListing",
        args: [tokenId],
      }));
      if (!sameAddress(listing.seller, walletAddress)) {
        throw new Error("Only the wallet that listed this worker can cancel it.");
      }

      const gasPrice = await publicClient!.getGasPrice();
      const cancelGas = await publicClient!.estimateContractGas({
        account: walletAddress,
        address: contractAddresses.marketplace as `0x${string}`,
        abi: marketplaceAbi,
        functionName: "cancelListing",
        args: [tokenId],
      });
      const liveBalance = await currentBalance(walletAddress);
      const required = cancelGas * gasPrice + GAS_BUFFER;
      if (liveBalance < required) {
        throw new Error("Wallet balance is too low for the cancel-listing gas.");
      }

      const hash = await writeContractAsync({
        address: contractAddresses.marketplace as `0x${string}`,
        abi: marketplaceAbi,
        functionName: "cancelListing",
        args: [tokenId],
        chainId: galileo.id,
      });
      setTxHash(hash);
      toast.success("Cancel transaction submitted");
      await publicClient!.waitForTransactionReceipt({ hash });
      await refreshOnChainCache();
      setCompletedAction("cancelled");
      toast.success("Listing cancelled on 0G");
    } catch (nextError) {
      const message = formatTxError(nextError, "Could not cancel listing.");
      setError(message);
      toast.error(message);
    } finally {
      setBusyState("idle");
    }
  }

  function setBusyState(next: typeof running) {
    setRunning(next);
  }

  function acknowledge() {
    if (txHash) setAcknowledgedHash(txHash);
    if (completedAction === "listed") {
      router.push(`/marketplace?token=${worker.tokenId}`);
      return;
    }
    router.refresh();
  }

  return (
    <>
      <div className="grid gap-2">
        <div className="flex flex-wrap gap-2">
          {worker.listingStatus === "listed" ? (
            <Button type="button" variant="outline" disabled={busy || !ownsWorker} onClick={cancelListing}>
              {running === "cancelling" ? "Cancelling..." : "Cancel listing"}
            </Button>
          ) : (
            <Button type="button" disabled={busy || !ownsWorker} onClick={() => setListOpen(true)}>
              {running === "approving" || running === "listing" ? "Listing..." : "List for sale"}
            </Button>
          )}
        </div>
        {error ? <p className="text-sm text-destructive">{error}</p> : null}
        {!error && balance === undefined && ownsWorker ? (
          <p className="text-sm text-muted-foreground">Reading live 0G balance before listing.</p>
        ) : null}
        {!ownsWorker ? <p className="text-sm text-muted-foreground">Only the current owner can manage this listing.</p> : null}
      </div>

      <Dialog open={listOpen} onOpenChange={setListOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>List worker on marketplace</DialogTitle>
            <DialogDescription>
              Ledger Zero will approve the marketplace if needed, then post the live listing on Galileo.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4">
            <div className="rounded-lg border bg-background/50 p-3 text-sm">
              <div className="font-medium text-foreground">{worker.name}</div>
              <div className="mt-1 text-muted-foreground">Worker #{worker.tokenId}</div>
            </div>
            <div className="grid gap-2">
              <label className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                Sale price in 0G
              </label>
              <Input value={price} onChange={(event) => setPrice(event.target.value)} inputMode="decimal" />
            </div>
            {error ? <p className="text-sm text-destructive">{error}</p> : null}
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setListOpen(false)} disabled={busy}>
              Close
            </Button>
            <Button type="button" onClick={listWorker} disabled={busy}>
              {running === "approving"
                ? "Approving..."
                : running === "listing"
                  ? "Listing..."
                  : "Confirm listing"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <MarketTransactionDialog
        open={successOpen}
        title={
          completedAction === "listed"
            ? "Listing confirmed on 0G"
            : completedAction === "cancelled"
              ? "Listing cancelled on 0G"
              : "Marketplace action confirmed"
        }
        description={
          completedAction === "listed"
            ? "The listing is now live. Acknowledge to open the marketplace and review the indexed worker."
            : "The listing is no longer active. Acknowledge to refresh your profile."
        }
        txHash={txHash}
        artifactLabel="Worker"
        artifactValue={listingArtifact(worker, completedAction === "listed" ? `${price} 0G` : undefined)}
        acknowledgeLabel={completedAction === "listed" ? "Open marketplace" : "Refresh profile"}
        onOpenChange={() => {}}
        onAcknowledge={acknowledge}
      />
    </>
  );
}

export function BuyWorkerButton({ worker, compact = false }: { worker: DirectoryWorker; compact?: boolean }) {
  const router = useRouter();
  const { ready, authenticated, login, user } = usePrivy();
  const { wallets } = useWallets();
  const publicClient = usePublicClient({ chainId: galileo.id });
  const { switchChainAsync } = useSwitchChain();
  const { writeContractAsync } = useWriteContract();
  const chainId = useChainId();
  const address = (wallets[0]?.address ?? user?.wallet?.address) as `0x${string}` | undefined;
  const { data: balance } = useBalance({ address, chainId: galileo.id });
  const [running, setRunning] = React.useState(false);
  const [error, setError] = React.useState("");
  const [txHash, setTxHash] = React.useState<Hex | undefined>();
  const [acknowledgedHash, setAcknowledgedHash] = React.useState<Hex | undefined>();
  const successOpen = Boolean(txHash && acknowledgedHash !== txHash);

  async function buyWorker() {
    try {
      setRunning(true);
      setError("");
      if (!ready) throw new Error("Wallet is still loading.");
      if (!authenticated) {
        login();
        return;
      }
      if (!address) throw new Error("Wallet address is still being created. Try again in a moment.");
      if (!publicClient) throw new Error("0G Galileo client is unavailable.");
      if (!hasContractAddress("marketplace")) throw new Error("Marketplace contract is not configured.");
      if (chainId !== galileo.id) {
        await switchChainAsync({ chainId: galileo.id });
      }

      const tokenId = BigInt(worker.tokenId);
      const listing = normalizeListing(await publicClient.readContract({
        address: contractAddresses.marketplace as `0x${string}`,
        abi: marketplaceAbi,
        functionName: "activeListing",
        args: [tokenId],
      }));
      if (sameAddress(listing.seller, address)) {
        throw new Error("You already own this listing.");
      }

      const liveBalance = await publicClient.getBalance({ address });
      const gasPrice = await publicClient.getGasPrice();
      const sealedKey = stringToHex(`sealed-market-ui:${address}:${worker.tokenId}`);
      const buyGas = await publicClient.estimateContractGas({
        account: address,
        address: contractAddresses.marketplace as `0x${string}`,
        abi: marketplaceAbi,
        functionName: "buyWorker",
        args: [tokenId, sealedKey, BUY_PROOF],
        value: listing.price,
      });
      const required = listing.price + buyGas * gasPrice + GAS_BUFFER;
      if (liveBalance < required) {
        throw new Error("Wallet balance is too low to buy this worker and cover gas.");
      }

      const hash = await writeContractAsync({
        address: contractAddresses.marketplace as `0x${string}`,
        abi: marketplaceAbi,
        functionName: "buyWorker",
        args: [tokenId, sealedKey, BUY_PROOF],
        value: listing.price,
        chainId: galileo.id,
      });
      setTxHash(hash);
      toast.success("Purchase transaction submitted");
      await publicClient.waitForTransactionReceipt({ hash });
      await refreshOnChainCache();
      toast.success("Worker purchase confirmed on 0G");
    } catch (nextError) {
      const message = formatTxError(nextError, "Could not buy listing.");
      setError(message);
      toast.error(message);
    } finally {
      setRunning(false);
    }
  }

  function acknowledge() {
    if (txHash) setAcknowledgedHash(txHash);
    router.push(`/profile?purchased=${worker.tokenId}`);
  }

  const ownedByCurrentWallet = sameAddress(address, worker.ownerAddress) || sameAddress(address, worker.sellerAddress);
  const disabled = running || ownedByCurrentWallet || worker.listingStatus !== "listed";

  return (
    <>
      <div className="grid gap-2">
        <Button type="button" variant={compact ? "outline" : "default"} onClick={buyWorker} disabled={disabled}>
          {running ? "Buying..." : ownedByCurrentWallet ? "Owned by you" : "Buy worker"}
        </Button>
        {error ? <p className="text-sm text-destructive">{error}</p> : null}
        {!error && balance === undefined && authenticated ? (
          <p className="text-sm text-muted-foreground">Reading live 0G balance before purchase.</p>
        ) : null}
      </div>

      <MarketTransactionDialog
        open={successOpen}
        title="Purchase confirmed on 0G"
        description="Ownership transferred and seller settlement completed. Acknowledge to open your profile and confirm the worker now belongs to your wallet."
        txHash={txHash}
        artifactLabel="Worker"
        artifactValue={listingArtifact(worker, worker.price)}
        acknowledgeLabel="Open profile"
        onOpenChange={() => {}}
        onAcknowledge={acknowledge}
      />
    </>
  );
}
