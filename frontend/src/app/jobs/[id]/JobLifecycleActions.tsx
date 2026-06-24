"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { usePrivy, useWallets } from "@privy-io/react-auth";
import { formatEther, parseEther, type Hex } from "viem";
import { useBalance, useChainId, usePublicClient, useSignMessage, useSwitchChain, useWriteContract } from "wagmi";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { galileo } from "@/lib/chains";
import { contractAddresses, hasContractAddress } from "@/lib/contracts";
import type { Job } from "@/lib/ledger-zero";
import {
  GAS_BUFFER,
  amount,
  escrowAbi,
  formatTxError,
  localRatingKey,
  localResultKey,
  sameAddress,
  workerAbi,
} from "./jobLifecycleUtils";

function readLocalRoot(key: string) {
  if (typeof window === "undefined") return "";
  try {
    const stored = window.localStorage.getItem(key);
    return stored ? JSON.parse(stored).rootHash ?? "" : "";
  } catch {
    return "";
  }
}

export function JobLifecycleActions({ job }: { job: Job }) {
  const router = useRouter();
  const { ready, authenticated, login, user } = usePrivy();
  const { wallets } = useWallets();
  const publicClient = usePublicClient({ chainId: galileo.id });
  const chainId = useChainId();
  const { switchChainAsync } = useSwitchChain();
  const { writeContractAsync } = useWriteContract();
  const { signMessageAsync } = useSignMessage();
  const address = (wallets[0]?.address ?? user?.wallet?.address) as `0x${string}` | undefined;
  const { data: balance } = useBalance({ address, chainId: galileo.id });
  const [workerTokenId, setWorkerTokenId] = React.useState(job.workerTokenId ?? "");
  const [bidAmount, setBidAmount] = React.useState(amount(job.payout));
  const [bondAmount, setBondAmount] = React.useState("0.0001");
  const [resultSummary, setResultSummary] = React.useState("Completed task with proof-backed output and memory update.");
  const [resultEvidence, setResultEvidence] = React.useState("");
  const [resultRoot, setResultRoot] = React.useState(() => readLocalRoot(localResultKey(job.id)));
  const [rating, setRating] = React.useState("5");
  const [ratingNote, setRatingNote] = React.useState("High quality result; accepted for payment release.");
  const [ratingRoot, setRatingRoot] = React.useState(() => readLocalRoot(localRatingKey(job.id)));
  const [running, setRunning] = React.useState("");
  const [error, setError] = React.useState("");

  const isBuyer = sameAddress(address, job.buyerAddress);
  const canAccept = job.status === "posted";
  const canPrepare = job.status === "accepted" || job.status === "released";
  const canRelease = job.status === "accepted" && isBuyer;
  const canRate = job.status === "released" && isBuyer;

  async function ensureWallet() {
    if (!ready) throw new Error("Wallet is still loading.");
    if (!authenticated) {
      login();
      throw new Error("Connect wallet to continue.");
    }
    if (!address) throw new Error("Wallet address is still being created.");
    if (!publicClient) throw new Error("0G client is unavailable.");
    if (chainId !== galileo.id) await switchChainAsync({ chainId: galileo.id });
    return address;
  }

  async function refresh() {
    await fetch("/api/onchain/refresh", { method: "POST" }).catch(() => null);
    router.refresh();
  }

  async function assertGas(requiredValue = 0n) {
    if (!address || !balance) throw new Error("Wallet balance is still loading.");
    const gasPrice = await publicClient!.getGasPrice();
    const gasBudget = 180000n * gasPrice + GAS_BUFFER + requiredValue;
    if (balance.value < gasBudget) {
      throw new Error(`Wallet needs about ${formatEther(gasBudget)} 0G available for this action.`);
    }
  }

  async function acceptJob() {
    try {
      setRunning("accept");
      setError("");
      const walletAddress = await ensureWallet();
      if (!hasContractAddress("workerINFT") || !hasContractAddress("escrow")) throw new Error("Contract addresses are not configured.");
      const tokenId = BigInt(workerTokenId);
      const bid = parseEther(bidAmount);
      const bond = parseEther(bondAmount);
      if (tokenId <= 0n) throw new Error("Enter a valid worker token id.");
      if (bid <= 0n || bond <= 0n) throw new Error("Bid and bond must be greater than zero.");
      if (bid > parseEther(amount(job.payout))) throw new Error("Bid cannot exceed the task payout.");
      const owner = await publicClient!.readContract({
        address: contractAddresses.workerINFT as `0x${string}`,
        abi: workerAbi,
        functionName: "ownerOf",
        args: [tokenId],
      });
      if (!sameAddress(owner, walletAddress)) throw new Error("Connected wallet must own this WorkerINFT to accept the job.");
      await assertGas(bond);
      const hash = await writeContractAsync({
        address: contractAddresses.escrow as `0x${string}`,
        abi: escrowAbi,
        functionName: "acceptTokenBid",
        args: [job.id as Hex, tokenId, bid, bond],
        value: bond,
        chainId: galileo.id,
      });
      toast.success("Worker bid submitted");
      await publicClient!.waitForTransactionReceipt({ hash });
      toast.success("Worker accepted the job");
      await refresh();
    } catch (err) {
      const message = formatTxError(err);
      setError(message);
      toast.error(message);
    } finally {
      setRunning("");
    }
  }

  async function prepareResult() {
    try {
      setRunning("result");
      setError("");
      const walletAddress = await ensureWallet();
      const message = JSON.stringify({
        kind: "LedgerZeroJobResultSignature",
        taskId: job.id,
        actorAddress: walletAddress,
        workerTokenId: job.workerTokenId ?? (workerTokenId || null),
        summary: resultSummary.trim(),
        evidence: resultEvidence.trim(),
      });
      const signature = await signMessageAsync({ message });
      const response = await fetch("/api/jobs/result", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ ...JSON.parse(message), signature }),
      });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error ?? "result upload failed");
      setResultRoot(body.rootHash);
      window.localStorage.setItem(localResultKey(job.id), JSON.stringify(body));
      toast.success("Result bundle stored on 0G");
    } catch (err) {
      const message = formatTxError(err);
      setError(message);
      toast.error(message);
    } finally {
      setRunning("");
    }
  }

  async function releasePayment() {
    try {
      setRunning("release");
      setError("");
      await ensureWallet();
      if (!isBuyer) throw new Error("Only the wallet that posted this job can release payment.");
      if (!/^0x[0-9a-fA-F]{64}$/.test(resultRoot)) throw new Error("Prepare a 0G result bundle before release.");
      await assertGas();
      const hash = await writeContractAsync({
        address: contractAddresses.escrow as `0x${string}`,
        abi: escrowAbi,
        functionName: "releasePayment",
        args: [job.id as Hex, resultRoot as Hex],
        chainId: galileo.id,
      });
      toast.success("Release transaction submitted");
      await publicClient!.waitForTransactionReceipt({ hash });
      toast.success("Payment released and ERC8004 reputation updated");
      await refresh();
    } catch (err) {
      const message = formatTxError(err);
      setError(message);
      toast.error(message);
    } finally {
      setRunning("");
    }
  }

  async function submitRating() {
    try {
      setRunning("rating");
      setError("");
      const walletAddress = await ensureWallet();
      if (!isBuyer) throw new Error("Only the buyer can rate this completed job.");
      const message = JSON.stringify({
        kind: "LedgerZeroBuyerRatingSignature",
        taskId: job.id,
        buyerAddress: walletAddress,
        workerAddress: job.workerAddress ?? null,
        workerTokenId: job.workerTokenId ?? null,
        rating: Number(rating),
        note: ratingNote.trim(),
      });
      const signature = await signMessageAsync({ message });
      const response = await fetch("/api/jobs/rating", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ ...JSON.parse(message), signature }),
      });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error ?? "rating upload failed");
      setRatingRoot(body.rootHash);
      window.localStorage.setItem(localRatingKey(job.id), JSON.stringify(body));
      toast.success("Buyer rating stored on 0G");
    } catch (err) {
      const message = formatTxError(err);
      setError(message);
      toast.error(message);
    } finally {
      setRunning("");
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Job execution controls</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-5">
        <div className="flex flex-wrap gap-2">
          <Badge variant={canAccept ? "default" : "outline"}>1. worker accepts</Badge>
          <Badge variant={canPrepare ? "default" : "outline"}>2. result stored</Badge>
          <Badge variant={canRelease ? "default" : "outline"}>3. buyer releases</Badge>
          <Badge variant={canRate ? "default" : "outline"}>4. buyer rates</Badge>
        </div>
        {error ? <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">{error}</div> : null}
        <div className="grid gap-3 rounded-lg border p-4">
          <div className="font-medium">Worker accepts the job</div>
          <div className="grid gap-3 sm:grid-cols-3">
            <Input value={workerTokenId} onChange={(event) => setWorkerTokenId(event.target.value)} placeholder="Worker token id" />
            <Input value={bidAmount} onChange={(event) => setBidAmount(event.target.value)} placeholder="Bid in 0G" />
            <Input value={bondAmount} onChange={(event) => setBondAmount(event.target.value)} placeholder="Bond in 0G" />
          </div>
          <Button disabled={!canAccept || running === "accept"} onClick={acceptJob}>{running === "accept" ? "Accepting..." : "Accept with WorkerINFT"}</Button>
        </div>
        <div className="grid gap-3 rounded-lg border p-4">
          <div className="font-medium">Worker completes the job</div>
          <Textarea value={resultSummary} onChange={(event) => setResultSummary(event.target.value)} />
          <Input value={resultEvidence} onChange={(event) => setResultEvidence(event.target.value)} placeholder="Evidence URL or notes" />
          <Button disabled={!canPrepare || running === "result"} onClick={prepareResult}>{running === "result" ? "Storing..." : "Store signed result on 0G"}</Button>
          {resultRoot ? <div className="lz-mono lz-artifact text-xs">resultRoot: {resultRoot}</div> : null}
        </div>
        <div className="grid gap-3 rounded-lg border p-4">
          <div className="font-medium">Buyer releases payment</div>
          <Button disabled={!canRelease || running === "release"} onClick={releasePayment}>{running === "release" ? "Releasing..." : "Release payment to worker owner"}</Button>
        </div>
        <div className="grid gap-3 rounded-lg border p-4">
          <div className="font-medium">Buyer rates quality</div>
          <Input type="number" min="1" max="5" value={rating} onChange={(event) => setRating(event.target.value)} />
          <Textarea value={ratingNote} onChange={(event) => setRatingNote(event.target.value)} />
          <Button disabled={!canRate || running === "rating"} onClick={submitRating}>{running === "rating" ? "Storing rating..." : "Store signed buyer rating"}</Button>
          {ratingRoot ? <div className="lz-mono lz-artifact text-xs">ratingRoot: {ratingRoot}</div> : null}
        </div>
      </CardContent>
    </Card>
  );
}
