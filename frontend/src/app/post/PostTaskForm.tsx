"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, X } from "lucide-react";
import { toast } from "sonner";
import { usePrivy, useWallets } from "@privy-io/react-auth";
import { useBalance, useChainId, useSwitchChain, useWaitForTransactionReceipt, useWriteContract } from "wagmi";
import { formatUnits, keccak256, parseEther, toBytes, type Hex } from "viem";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { galileo } from "@/lib/chains";
import { contractAddresses } from "@/lib/contracts";

const categories = ["Research", "Smart contracts", "Growth ops", "Data labeling", "Agent QA"];
const times = ["09:00 UTC", "12:00 UTC", "15:00 UTC", "18:00 UTC", "21:00 UTC"];
const escrowAbi = [
  {
    type: "function",
    name: "postTask",
    stateMutability: "payable",
    inputs: [
      { name: "taskId", type: "bytes32" },
      { name: "payment", type: "uint256" },
      { name: "deadline", type: "uint256" },
      { name: "minReputation", type: "uint256" },
    ],
    outputs: [],
  },
] as const;
const GAS_BUFFER = parseEther("0.0002");

export function PostTaskForm() {
  const router = useRouter();
  const { ready, authenticated, login } = usePrivy();
  const { wallets } = useWallets();
  const activeWallet = wallets[0];
  const address = activeWallet?.address as `0x${string}` | undefined;
  const chainId = useChainId();
  const { switchChainAsync } = useSwitchChain();
  const { writeContractAsync } = useWriteContract();
  const { data: balance } = useBalance({ address, chainId: galileo.id });
  const [tags, setTags] = React.useState(["risk", "citations"]);
  const [draftTag, setDraftTag] = React.useState("");
  const [title, setTitle] = React.useState("Produce a diligence memo for a 0G ecosystem partner");
  const [description, setDescription] = React.useState(
    "Scope the partner, cite risks, return next steps, confidence, and proof-backed output.",
  );
  const [category, setCategory] = React.useState("Research");
  const [payout, setPayout] = React.useState("0.0004");
  const [bond, setBond] = React.useState("0.0001");
  const [deadlineDate, setDeadlineDate] = React.useState("2026-06-24");
  const [deadlineTime, setDeadlineTime] = React.useState("18:00 UTC");
  const [minimumReputation, setMinimumReputation] = React.useState("0");
  const [running, setRunning] = React.useState(false);
  const [txHash, setTxHash] = React.useState<Hex | undefined>();
  const [error, setError] = React.useState("");
  const { isLoading: confirming, isSuccess: confirmed } = useWaitForTransactionReceipt({
    hash: txHash,
    chainId: galileo.id,
  });

  React.useEffect(() => {
    if (!confirmed || !txHash) return;
    toast.success("Escrow transaction confirmed");
    router.push(`/jobs/task-risk-brief?posted=${txHash}`);
  }, [confirmed, router, txHash]);

  function commitTag(raw: string) {
    const next = raw.trim().replace(/,$/, "");
    if (!next || tags.includes(next)) return;
    setTags((current) => [...current, next]);
  }

  function removeTag(tag: string) {
    setTags((current) => current.filter((item) => item !== tag));
  }

  function parseDeadline() {
    const time = deadlineTime.replace(" UTC", "");
    const deadlineMs = Date.parse(`${deadlineDate}T${time}:00.000Z`);
    if (!Number.isFinite(deadlineMs)) throw new Error("Choose a valid UTC deadline.");
    const deadline = Math.floor(deadlineMs / 1000);
    if (deadline <= Math.floor(Date.now() / 1000) + 300) {
      throw new Error("Deadline must be at least five minutes in the future.");
    }
    return BigInt(deadline);
  }

  function parseMinimumReputation() {
    if (!/^\d+$/.test(minimumReputation.trim())) throw new Error("Minimum reputation must be a whole number.");
    return BigInt(minimumReputation.trim());
  }

  function balanceText() {
    if (!balance) return "unknown";
    return `${Number(formatUnits(balance.value, balance.decimals)).toFixed(6)} ${balance.symbol}`;
  }

  async function submitTask(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!ready) return;
    if (!authenticated) {
      login();
      return;
    }
    if (!address) {
      setError("Wallet is still being created by Privy. Try again in a moment.");
      return;
    }
    if (!/^0x[a-fA-F0-9]{40}$/.test(contractAddresses.escrow)) {
      setError("LedgerEscrow contract is not configured.");
      return;
    }

    try {
      setRunning(true);
      setError("");
      setTxHash(undefined);
      const payment = parseEther(payout);
      const bondWei = parseEther(bond);
      if (payment <= 0n) throw new Error("Payout must be greater than zero.");
      if (bondWei >= payment) throw new Error("Bond must be smaller than payout.");
      if (!balance) throw new Error("Wallet balance is still loading. Try again in a moment.");
      const required = payment + GAS_BUFFER;
      if (balance.value < required) {
        throw new Error(
          `Connected wallet has ${balanceText()}; posting needs at least ${formatUnits(required, balance.decimals)} ${balance.symbol} including gas buffer.`,
        );
      }
      const deadline = parseDeadline();
      const taskId = keccak256(toBytes(`ledger-zero:${address}:${Date.now()}:${title}:${description}`));
      if (chainId !== galileo.id) {
        await switchChainAsync({ chainId: galileo.id });
      }
      const hash = await writeContractAsync({
        address: contractAddresses.escrow as `0x${string}`,
        abi: escrowAbi,
        functionName: "postTask",
        args: [taskId, payment, deadline, parseMinimumReputation()],
        value: payment,
        chainId: galileo.id,
      });
      setTxHash(hash);
      toast.success("Escrow transaction submitted");
    } catch (submitError) {
      const raw = (submitError as Error).message;
      const message = raw.includes("User rejected")
        ? "Transaction was rejected in the wallet."
        : raw.includes("insufficient funds")
          ? `Connected wallet has ${balanceText()}; add 0G testnet funds and try again.`
          : raw;
      setError(message);
      toast.error(message);
    } finally {
      setRunning(false);
    }
  }

  return (
    <form className="grid gap-6" aria-label="Task brief form" onSubmit={submitTask}>
      <RawField label="Task title">
        <Input value={title} onChange={(event) => setTitle(event.target.value)} />
      </RawField>
      <RawField label="Description">
        <Textarea
          className="min-h-32"
          value={description}
          onChange={(event) => setDescription(event.target.value)}
        />
      </RawField>
      <div className="grid gap-6 sm:grid-cols-2">
        <RawField label="Category">
          <Select value={category} onValueChange={(value) => value && setCategory(value)}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Choose task category" />
            </SelectTrigger>
            <SelectContent>
              {categories.map((category) => (
                <SelectItem key={category} value={category}>
                  {category}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </RawField>
        <RawField label="Tags">
          <div className="flex min-h-10 flex-wrap items-center gap-2 rounded-lg border border-input bg-background/70 px-2 py-1.5 focus-within:border-ring focus-within:ring-3 focus-within:ring-ring/30">
            {tags.map((tag) => (
              <Badge key={tag} variant="secondary" className="gap-1 pr-1">
                {tag}
                <button
                  type="button"
                  className="rounded-full p-0.5 text-muted-foreground hover:text-foreground"
                  aria-label={`Remove ${tag}`}
                  onClick={() => removeTag(tag)}
                >
                  <X className="size-3" />
                </button>
              </Badge>
            ))}
            <input
              className="min-w-28 flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
              value={draftTag}
              placeholder="type then space"
              onChange={(event) => setDraftTag(event.target.value)}
              onBlur={() => {
                commitTag(draftTag);
                setDraftTag("");
              }}
              onKeyDown={(event) => {
                if (event.key === " " || event.key === "Enter" || event.key === ",") {
                  event.preventDefault();
                  commitTag(draftTag);
                  setDraftTag("");
                }
              }}
            />
          </div>
        </RawField>
        <RawField label="Payout in 0G">
          <Input inputMode="decimal" value={payout} onChange={(event) => setPayout(event.target.value)} />
        </RawField>
        <RawField label="Bond in 0G">
          <Input inputMode="decimal" value={bond} onChange={(event) => setBond(event.target.value)} />
        </RawField>
        <RawField label="Deadline date">
          <Input inputMode="numeric" value={deadlineDate} onChange={(event) => setDeadlineDate(event.target.value)} />
        </RawField>
        <RawField label="Deadline time">
          <Select value={deadlineTime} onValueChange={(value) => value && setDeadlineTime(value)}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Choose time" />
            </SelectTrigger>
            <SelectContent>
              {times.map((time) => (
                <SelectItem key={time} value={time}>
                  {time}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </RawField>
        <RawField label="Minimum reputation">
          <Input
            inputMode="decimal"
            value={minimumReputation}
            onChange={(event) => setMinimumReputation(event.target.value)}
          />
        </RawField>
      </div>
      <div className="flex flex-wrap items-center gap-3 border-t pt-5">
        <Button type="submit" data-testid="post-demo-task" disabled={running || confirming}>
          {!authenticated
            ? "Connect wallet to post"
            : running
              ? "Open wallet to confirm..."
              : confirming
                ? "Confirming escrow..."
                : "Post escrow transaction"}
          <ArrowRight data-icon="inline-end" />
        </Button>
        <span className="text-xs uppercase tracking-[0.14em] text-muted-foreground">
          Uses the connected wallet. Requires payout plus gas on 0G Galileo.
        </span>
      </div>
      {txHash ? (
        <div className="rounded-lg border border-accent/40 bg-accent/10 p-3 text-sm text-accent">
          Transaction submitted: <span className="lz-mono break-all">{txHash}</span>
        </div>
      ) : null}
      {error ? (
        <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
          {error}
        </div>
      ) : null}
    </form>
  );
}

function RawField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="grid gap-2 border-t pt-4 text-sm">
      <span className="text-xs font-semibold uppercase tracking-[0.14em] text-accent">{label}</span>
      {children}
    </label>
  );
}
