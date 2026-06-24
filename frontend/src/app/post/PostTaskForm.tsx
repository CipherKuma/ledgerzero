"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, CalendarIcon } from "lucide-react";
import { toast } from "sonner";
import { usePrivy, useWallets } from "@privy-io/react-auth";
import { useBalance, useChainId, useSwitchChain, useWaitForTransactionReceipt, useWriteContract } from "wagmi";
import { formatUnits, keccak256, parseEther, toBytes, type Hex } from "viem";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
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
import { DeadlineTimePicker, splitDeadlineTime } from "./DeadlineTimePicker";
import { PostTaskSuccessDialog } from "./PostTaskSuccessDialog";
import { RawField } from "./RawField";
import { TaskTagsInput } from "./TaskTagsInput";
import {
  GAS_BUFFER,
  categories,
  dateFromDateString,
  dateStringFromDate,
  defaultDeadlineDate,
  escrowAbi,
  formatDeadlineDate,
  rememberTaskMetadata,
  startOfToday,
} from "./postTaskUtils";

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
  const [title, setTitle] = React.useState("Produce a diligence memo for a 0G ecosystem partner");
  const [description, setDescription] = React.useState(
    "Scope the partner, cite risks, return next steps, confidence, and proof-backed output.",
  );
  const [category, setCategory] = React.useState("Research");
  const [payout, setPayout] = React.useState("0.0004");
  const [bond, setBond] = React.useState("0.0001");
  const [deadlineDate, setDeadlineDate] = React.useState(defaultDeadlineDate);
  const [deadlineTime, setDeadlineTime] = React.useState("18:00");
  const [deadlineCalendarOpen, setDeadlineCalendarOpen] = React.useState(false);
  const [deadlineTimeOpen, setDeadlineTimeOpen] = React.useState(false);
  const [minimumReputation, setMinimumReputation] = React.useState("0");
  const [running, setRunning] = React.useState(false);
  const [txHash, setTxHash] = React.useState<Hex | undefined>();
  const [postedTaskId, setPostedTaskId] = React.useState<Hex | undefined>();
  const [acknowledgedTxHash, setAcknowledgedTxHash] = React.useState<Hex | undefined>();
  const [error, setError] = React.useState("");
  const successToastTx = React.useRef<Hex | undefined>(undefined);
  const { isLoading: confirming, isSuccess: confirmed } = useWaitForTransactionReceipt({
    hash: txHash,
    chainId: galileo.id,
  });
  const taskHref = postedTaskId ? `/jobs/${postedTaskId}` : `/jobs?posted=${txHash ?? ""}`;
  const confirmationOpen = Boolean(confirmed && txHash && acknowledgedTxHash !== txHash);

  React.useEffect(() => {
    if (!confirmed || !txHash) return;
    if (successToastTx.current === txHash) return;
    successToastTx.current = txHash;
    toast.success("Escrow transaction confirmed");
  }, [confirmed, txHash]);

  function acknowledgeAndOpenTask() {
    if (txHash) setAcknowledgedTxHash(txHash);
    router.push(taskHref);
  }

  function parseDeadline() {
    const deadlineMs = Date.parse(`${deadlineDate}T${deadlineTime}:00.000Z`);
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

  function setDeadlineTimePart(part: "hour" | "minute", value: string) {
    const current = splitDeadlineTime(deadlineTime);
    setDeadlineTime(part === "hour" ? `${value}:${current.minute}` : `${current.hour}:${value}`);
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
      setPostedTaskId(taskId);
      setTxHash(hash);
      try {
        rememberTaskMetadata({ id: taskId, txHash: hash, title, description, category, tags, createdAt: new Date().toISOString() });
      } catch {}
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
    <>
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
            <TaskTagsInput tags={tags} onTagsChange={setTags} />
          </RawField>
          <RawField label="Payout in 0G">
            <Input inputMode="decimal" value={payout} onChange={(event) => setPayout(event.target.value)} />
          </RawField>
          <RawField label="Bond in 0G">
            <Input inputMode="decimal" value={bond} onChange={(event) => setBond(event.target.value)} />
          </RawField>
          <RawField label="Deadline date">
            <Popover open={deadlineCalendarOpen} onOpenChange={setDeadlineCalendarOpen}>
              <PopoverTrigger
                render={
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full justify-start text-left"
                  />
                }
              >
                <CalendarIcon data-icon="inline-start" />
                {formatDeadlineDate(deadlineDate)}
              </PopoverTrigger>
              <PopoverContent align="start" className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={dateFromDateString(deadlineDate)}
                  defaultMonth={dateFromDateString(deadlineDate)}
                  disabled={(date) => date < startOfToday()}
                  onSelect={(date) => {
                    if (!date) return;
                    setDeadlineDate(dateStringFromDate(date));
                    setDeadlineCalendarOpen(false);
                  }}
                />
              </PopoverContent>
            </Popover>
          </RawField>
          <RawField label="Deadline time">
            <DeadlineTimePicker
              value={deadlineTime}
              open={deadlineTimeOpen}
              onOpenChange={setDeadlineTimeOpen}
              onValueChange={setDeadlineTime}
              onPartChange={setDeadlineTimePart}
            />
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

      <PostTaskSuccessDialog
        open={confirmationOpen}
        onOpenChange={(open) => {
          if (!open && txHash) setAcknowledgedTxHash(txHash);
        }}
        taskId={postedTaskId}
        txHash={txHash}
        onViewTask={acknowledgeAndOpenTask}
      />
    </>
  );
}
