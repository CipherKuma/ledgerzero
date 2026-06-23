"use client";

import { useState } from "react";
import Link from "next/link";
import { CheckCircle2, UploadCloud } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { Job } from "@/lib/ledger-zero";
import type { DemoFlowReceipt } from "@/lib/demo-flow/types";

const expectedSteps = [
  "mint WorkerINFT",
  "register capability",
  "register identity",
  "post escrow task",
  "accept token bid",
  "purchase worker token",
  "transfer worker token",
  "release escrow payment",
];

export function DemoFlowClient({ job, latestDemo }: { job: Job; latestDemo: DemoFlowReceipt | null }) {
  const [receipt, setReceipt] = useState<DemoFlowReceipt | null>(latestDemo);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState("");

  async function runLiveFlow() {
    setRunning(true);
    setError("");
    try {
      const res = await fetch("/api/demo/full-flow", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ preset: "hermes", runCompute: true }),
      });
      const body = (await res.json()) as DemoFlowReceipt | { error?: string };
      if (!res.ok) throw new Error("error" in body ? body.error : `request failed: ${res.status}`);
      setReceipt(body as DemoFlowReceipt);
      toast.success("Live 0G flow settled");
    } catch (runError) {
      const message = (runError as Error).message;
      setError(message);
      toast.error(message);
    } finally {
      setRunning(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Live 0G execution path</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <div className="text-sm font-medium">{job.title}</div>
            <div className="text-sm text-muted-foreground">
              {receipt ? `taskId: ${receipt.taskId}` : "No live receipt yet"}
            </div>
          </div>
          <Badge variant={receipt ? "default" : "secondary"} data-testid="demo-flow-status">
            {receipt ? "settled" : "ready"}
          </Badge>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button variant="secondary" data-testid="run-live-demo-flow" disabled={running} onClick={runLiveFlow}>
            {running ? "Running live 0G flow..." : "Run live E2E flow"}
          </Button>
          <Link className="inline-flex" href="/proof?demo=settled">
            <Button variant="outline" data-testid="open-proof">Open Proof Center</Button>
          </Link>
        </div>

        {error ? (
          <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
            {error}
          </div>
        ) : null}

        <div className="grid gap-2 rounded-lg border bg-background/35 p-3" data-testid="demo-flow-steps">
          {expectedSteps.map((step, index) => {
            const tx = receipt?.chainTxs.find((item) => item.label === step);
            const state = tx ? "confirmed" : running && index === 0 ? "current" : "pending";
            return (
              <div key={step} className="grid gap-2 text-sm sm:grid-cols-[150px_1fr]">
                <Badge variant={state === "confirmed" ? "default" : state === "current" ? "secondary" : "outline"}>
                  {state}
                </Badge>
                <span>{step}</span>
              </div>
            );
          })}
        </div>

        {receipt ? (
          <div className="grid gap-3 rounded-lg border border-accent/45 bg-background/40 p-3" data-testid="latest-demo-flow-receipt">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <div className="font-medium">{receipt.agentName}</div>
                <div className="text-xs text-muted-foreground">
                  token #{receipt.tokenId} / {receipt.framework} / {receipt.status}
                </div>
              </div>
              <Badge variant={receipt.status === "live" ? "default" : "secondary"}>
                {receipt.status === "live" ? "live receipt" : "compute fallback receipt"}
              </Badge>
            </div>
            <div className="grid gap-2 text-xs sm:grid-cols-2">
              <ReceiptFact label="Buyer" value={receipt.accounts.buyer} />
              <ReceiptFact label="New owner" value={receipt.accounts.newOwner} />
              <ReceiptFact label="Task" value={receipt.taskId} />
              <ReceiptFact label="Job result" value={`0g://${receipt.storage.jobResultRoot}`} />
              <ReceiptFact label="Payout before" value={receipt.economics.payoutRecipientBeforeTransfer} />
              <ReceiptFact label="Payout after" value={receipt.economics.payoutRecipientAfterTransfer} />
            </div>
            <div className="grid gap-2">
              {receipt.chainTxs.map((tx) => (
                <div key={tx.hash} className="flex gap-3 rounded-lg border p-3 text-sm">
                  {tx.label.includes("Storage") ? (
                    <UploadCloud className="mt-0.5 size-4 text-primary" />
                  ) : (
                    <CheckCircle2 className="mt-0.5 size-4 text-primary" />
                  )}
                  <div>
                    <div className="font-medium">{tx.label}</div>
                    <div className="lz-mono lz-artifact mt-1 text-xs">{tx.hash}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}

function ReceiptFact({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-[0.68rem] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
        {label}
      </div>
      <div className="lz-mono lz-artifact mt-1 break-all">{value}</div>
    </div>
  );
}
