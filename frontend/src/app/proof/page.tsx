import Link from "next/link";
import Image from "next/image";
import { ArrowUpRight, Blocks, Cpu, Database, RadioTower, ShieldCheck, WalletCards } from "lucide-react";
import { Shell } from "@/components/Shell";
import { StatusBadge } from "@/components/ledger-zero";
import { Badge } from "@/components/ui/badge";
import { getZeroGStatus } from "@/lib/0g/status";
import { readLatestAgentRegistration } from "@/lib/agents/register";
import { explorerAddress } from "@/lib/contracts";
import { readLatestDemoAttempt, readLatestDemoFlow } from "@/lib/demo-flow/run";
import { proofArtifacts } from "@/lib/ledger-zero";
import type { AgentRegistrationReceipt } from "@/lib/agents/types";
import type { DemoFlowAttempt, DemoFlowReceipt } from "@/lib/demo-flow/types";
import type { ProofArtifact, StatusKind } from "@/lib/ledger-zero";

export const dynamic = "force-dynamic";

function proofStatus(condition: boolean, fallback: StatusKind = "blocked"): StatusKind {
  return condition ? "live" : fallback;
}

function shortAddress(address: string) {
  return address ? `${address.slice(0, 6)}...${address.slice(-4)}` : "not configured";
}

function receiptStatus(receipt: DemoFlowReceipt): StatusKind {
  return receipt.status === "live" ? "live" : "fallback";
}

function latestReceiptArtifacts(receipt: DemoFlowReceipt): ProofArtifact[] {
  const status = receiptStatus(receipt);
  return [
    {
      layer: "0G Chain",
      artifact: "Worker ownership",
      value: `ownerOf(${receipt.tokenId}) -> ${shortAddress(receipt.accounts.newOwner)}`,
      status,
      note: `Fresh receipt task ${shortAddress(receipt.taskId)} routes worker ownership to the purchaser.`,
    },
    {
      layer: "LedgerEscrow",
      artifact: "Payout recipient",
      value: `payoutRecipient(${shortAddress(receipt.taskId)}) -> ${shortAddress(receipt.economics.payoutRecipientAfterTransfer)}`,
      status,
      note: "Buyer released escrow after transfer, so payout followed the current worker owner.",
    },
    {
      layer: "0G Storage",
      artifact: "TaskBrief",
      value: `0g://${receipt.storage.taskBriefRoot}`,
      status,
      note: receipt.task.title,
    },
    {
      layer: "0G Storage",
      artifact: "JobResult",
      value: `0g://${receipt.storage.jobResultRoot}`,
      status,
      note: "Result bundle uploaded during the latest full-flow run.",
    },
    {
      layer: "0G Compute",
      artifact: "Compute run",
      value: receipt.compute.proof ? `${receipt.compute.proof.model} / ${shortAddress(receipt.compute.proof.provider)}` : "compute skipped",
      status,
      note: receipt.compute.proof
        ? `Router chat ${receipt.compute.proof.chatID || "recorded without chat id"}`
        : "Chain and storage were live, but compute was intentionally skipped for this receipt.",
    },
    {
      layer: "Transfer receipt",
      artifact: "OwnershipTransferReceipt",
      value: `0g://${receipt.storage.transferReceiptRoot}`,
      status,
      note: "Worker sale and token transfer receipt for the latest purchaser.",
    },
    {
      layer: "ERC8004",
      artifact: "ReputationSnapshot",
      value: `0g://${receipt.storage.reputationSnapshotRoot}`,
      status,
      note: "Reputation snapshot after release for the current worker owner.",
    },
    {
      layer: "Demo receipt",
      artifact: "LedgerZeroFullDemoFlow",
      value: `0g://${receipt.storage.demoReceiptRoot}`,
      status,
      note: "Canonical receipt driving marketplace, wallet, job room, and proof views.",
    },
  ];
}

export default async function ProofPage() {
  const zeroG = await getZeroGStatus();
  const latestAgent = await readLatestAgentRegistration();
  const latestDemoFlow = await readLatestDemoFlow();
  const latestAttempt = await readLatestDemoAttempt();
  const effectiveAttempt =
    latestAttempt ??
    (latestDemoFlow
      ? ({
          kind: "LedgerZeroDemoFlowAttempt",
          runId: `receipt-${latestDemoFlow.tokenId}`,
          createdAt: latestDemoFlow.createdAt,
          status: "succeeded",
          receiptRoot: latestDemoFlow.storage.demoReceiptRoot,
        } satisfies DemoFlowAttempt)
      : null);
  const contractArtifacts: ProofArtifact[] = zeroG.contracts.map((contract) => ({
    layer: "0G Chain",
    artifact: contract.name,
    value: contract.address || "not configured",
    status: proofStatus(contract.deployed, contract.configured ? "blocked" : "fallback"),
    note: contract.deployed
      ? "Galileo bytecode verified from the configured deployment address."
      : contract.configured
        ? "Address configured, but bytecode was not readable from the RPC."
        : "Address is not configured in this environment.",
  }));
  const serviceArtifacts: ProofArtifact[] = [
    {
      layer: "0G RPC",
      artifact: "Galileo provider",
      value: zeroG.rpc,
      status: proofStatus(zeroG.contracts.some((contract) => contract.deployed)),
      note: "Used by the server wallet and deployed-contract checks.",
    },
    {
      layer: "0G Storage",
      artifact: "Indexer upload path",
      value: zeroG.indexer,
      status: proofStatus(zeroG.storageConfigured),
      note: zeroG.storageConfigured
        ? "Server API can upload proof bundles with the configured signer."
        : "Storage needs a signer and indexer before upload tests can run.",
    },
    {
      layer: "0G Compute",
      artifact: "Router execution path",
      value: zeroG.computeConfigured ? `model ${zeroG.computeModel}` : "router credentials unavailable",
      status: proofStatus(zeroG.computeConfigured),
      note: zeroG.computeConfigured
        ? "Server API can request worker execution through the 0G router."
        : "Compute will stay blocked until router credentials are configured.",
    },
    {
      layer: "Deployer wallet",
      artifact: "Server signer",
      value: zeroG.signer ? `${shortAddress(zeroG.signer.address)} / ${zeroG.signer.balance} 0G` : "unavailable",
      status: proofStatus(Boolean(zeroG.signer), "blocked"),
      note: "Used only for server-side deployment, storage, and proof API operations.",
    },
  ];
  const currentArtifacts = latestDemoFlow
    ? latestReceiptArtifacts(latestDemoFlow)
    : proofArtifacts.map((artifact) => ({
        ...artifact,
        status: artifact.status === "blocked" ? artifact.status : ("demo" as const),
        note: `Seeded demo fixture: ${artifact.note}`,
      }));
  const artifacts = [...contractArtifacts, ...serviceArtifacts, ...currentArtifacts];
  const liveCount = artifacts.filter((artifact) => artifact.status === "live").length;
  const blockedCount = artifacts.filter((artifact) => artifact.status === "blocked").length;

  return (
    <Shell>
      <section className="lz-section">
        <div className="lz-container grid gap-6">
          <div className="grid gap-5 border-b pb-6 lg:grid-cols-[minmax(0,1fr)_360px] lg:items-end">
            <div>
              <div className="lz-kicker">0G explorer</div>
              <h1 className="mt-3 font-display text-3xl uppercase leading-none sm:text-4xl">
                Artifact explorer
              </h1>
              <p className="mt-4 max-w-2xl text-sm leading-7 text-muted-foreground">
                Contract bytecode, storage roots, compute runs, transfer receipts, payout resolution, and
                reputation records with honest live/demo/blocked labels.
              </p>
            </div>
            <div className="grid gap-3">
              <div className="relative aspect-[16/10] overflow-hidden rounded-xl border bg-card">
                <Image
                  src="/page-heroes/proof.jpg"
                  alt="Blue proof spiral artwork representing inspectable 0G artifacts"
                  fill
                  className="object-cover"
                  sizes="(min-width: 1024px) 360px, 100vw"
                  priority
                />
              </div>
              <div className="lz-mono lz-artifact rounded-lg border bg-background/50 px-3 py-2 text-xs" aria-label="Current proof focus">
                {latestDemoFlow?.taskId ?? "seeded-demo-fixture"}
              </div>
              <div className="flex flex-wrap gap-2 text-xs uppercase tracking-[0.12em] text-muted-foreground">
                <Badge variant="secondary">{liveCount} live</Badge>
                <Badge variant="outline">{blockedCount} blocked</Badge>
                <Badge variant="outline">Galileo</Badge>
              </div>
            </div>
          </div>

          <div className="grid gap-3 md:grid-cols-4">
            <ExplorerStat icon={RadioTower} label="RPC" value="Galileo" />
            <ExplorerStat icon={Blocks} label="Contracts" value={String(zeroG.contracts.length)} />
            <ExplorerStat icon={Database} label="Storage" value={zeroG.storageConfigured ? "ready" : "blocked"} />
            <ExplorerStat icon={Cpu} label="Compute" value={zeroG.computeConfigured ? "ready" : "blocked"} />
          </div>

          <div className="grid gap-4 lg:grid-cols-[minmax(0,0.92fr)_minmax(320px,0.48fr)]">
            <section className="overflow-hidden rounded-xl border bg-card/70">
              <div className="grid grid-cols-[1.1fr_1fr_auto] gap-3 border-b px-4 py-3 text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                <span>Contract</span>
                <span>Address</span>
                <span>Status</span>
              </div>
              {zeroG.contracts.map((contract) => (
                <div
                  key={contract.name}
                  className="grid grid-cols-[1.1fr_1fr_auto] gap-3 border-b px-4 py-4 text-sm last:border-b-0"
                >
                  <div>
                    <div className="font-medium">{contract.name}</div>
                    <div className="mt-1 text-xs text-muted-foreground">0G Chain</div>
                  </div>
                  <div className="lz-mono lz-artifact text-xs">
                    {contract.address ? (
                      <a
                        className="inline-flex items-center gap-1 text-accent underline-offset-4 hover:underline"
                        href={explorerAddress(contract.address)}
                        target="_blank"
                        rel="noreferrer"
                      >
                        {contract.address}
                        <ArrowUpRight className="size-3" />
                      </a>
                    ) : (
                      "not configured"
                    )}
                  </div>
                  <StatusBadge status={proofStatus(contract.deployed, contract.configured ? "blocked" : "fallback")} />
                </div>
              ))}
            </section>

            <aside className="grid gap-4 content-start">
              <ExplorerCard title="Server signer" icon={WalletCards}>
                {zeroG.signer ? `${shortAddress(zeroG.signer.address)} / ${zeroG.signer.balance} 0G` : "unavailable"}
              </ExplorerCard>
              <ExplorerCard title="Payout rule" icon={ShieldCheck}>
                LedgerEscrow resolves payoutRecipient from ownerOf(workerTokenId), so transfer changes the
                next recipient.
              </ExplorerCard>
            </aside>
          </div>

          {latestAgent ? <LatestAgentReceipt receipt={latestAgent} /> : null}

          {effectiveAttempt ? <LatestAttempt attempt={effectiveAttempt} /> : null}

          {latestDemoFlow ? <LatestDemoFlowReceipt receipt={latestDemoFlow} /> : null}

          <section className="grid gap-3">
            <div className="flex items-center justify-between border-b pb-3">
              <h2 className="font-display text-2xl uppercase">Latest artifact rows</h2>
              <Link className="text-xs uppercase tracking-[0.14em] text-accent" href="/jobs/task-risk-brief">
                Open live job
              </Link>
            </div>
            {artifacts.map((artifact, index) => (
              <ArtifactRow key={`${artifact.layer}-${artifact.artifact}-${index}`} artifact={artifact} index={index} />
            ))}
          </section>
        </div>
      </section>
    </Shell>
  );
}

function LatestAttempt({ attempt }: { attempt: DemoFlowAttempt }) {
  const status: StatusKind =
    attempt.status === "succeeded" ? "live" : attempt.status === "failed" ? "blocked" : "fallback";
  return (
    <section className="grid gap-2 rounded-xl border bg-card/60 p-4" data-testid="latest-demo-attempt">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="lz-kicker">Latest run attempt</div>
          <div className="mt-1 font-medium">{attempt.runId}</div>
        </div>
        <StatusBadge status={status} />
      </div>
      <div className="text-sm text-muted-foreground">
        {attempt.status === "failed"
          ? attempt.error
          : attempt.status === "running"
            ? "A live demo run has started and has not written a final receipt yet."
            : `Succeeded with receipt ${attempt.receiptRoot ? `0g://${attempt.receiptRoot}` : "recorded"}.`}
      </div>
    </section>
  );
}

function LatestDemoFlowReceipt({ receipt }: { receipt: DemoFlowReceipt }) {
  return (
    <section className="grid gap-4 rounded-xl border border-primary/45 bg-card/65 p-4" data-testid="latest-demo-flow">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="lz-kicker">Latest end-to-end demo</div>
          <h2 className="mt-2 font-display text-2xl uppercase">{receipt.agentName}</h2>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            Buyer wallet posted escrow, worker owner accepted the token bid, the worker token transferred,
            and buyer release paid the new owner.
          </p>
        </div>
        <StatusBadge status={receiptStatus(receipt)} />
      </div>

      <div className="grid gap-3 md:grid-cols-4">
        <ExplorerCard title="Task" icon={Blocks}>
          <span className="lz-mono lz-artifact">{receipt.task.title}</span>
        </ExplorerCard>
        <ExplorerCard title="Buyer" icon={WalletCards}>
          <span className="lz-mono lz-artifact">{shortAddress(receipt.accounts.buyer)}</span>
        </ExplorerCard>
        <ExplorerCard title="New owner" icon={ShieldCheck}>
          <span className="lz-mono lz-artifact">{shortAddress(receipt.accounts.newOwner)}</span>
        </ExplorerCard>
        <ExplorerCard title="Revenue delta" icon={Database}>
          {receipt.economics.newOwnerBalanceBefore0G} -&gt; {receipt.economics.newOwnerBalanceAfter0G} 0G
        </ExplorerCard>
      </div>

      <div className="grid gap-3 lg:grid-cols-[0.8fr_1fr]">
        <div className="grid gap-2 rounded-lg border bg-background/35 p-3 text-sm">
          <ReceiptLine label="Payout before transfer" value={receipt.economics.payoutRecipientBeforeTransfer} />
          <ReceiptLine label="Payout after transfer" value={receipt.economics.payoutRecipientAfterTransfer} />
          <ReceiptLine label="Job result root" value={`0g://${receipt.storage.jobResultRoot}`} />
          <ReceiptLine label="Transfer receipt root" value={`0g://${receipt.storage.transferReceiptRoot}`} />
          <ReceiptLine label="Demo receipt root" value={`0g://${receipt.storage.demoReceiptRoot}`} />
        </div>
        <div className="grid gap-2">
          {receipt.chainTxs.map((tx) => (
            <div key={tx.hash} className="grid gap-2 rounded-lg border bg-background/35 p-3 text-sm md:grid-cols-[170px_1fr_auto]">
              <span className="font-medium">{tx.label}</span>
              <span className="lz-mono lz-artifact text-accent">{tx.hash}</span>
              <Badge variant="secondary">block {tx.block}</Badge>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function LatestAgentReceipt({ receipt }: { receipt: AgentRegistrationReceipt }) {
  return (
    <section className="grid gap-4 rounded-xl border border-accent/45 bg-card/60 p-4" data-testid="latest-agent-registration">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="lz-kicker">Latest connected agent</div>
          <h2 className="mt-2 font-display text-2xl uppercase">{receipt.agentName}</h2>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            {receipt.framework} worker registered from a Ledger Zero manifest. Future job revenue resolves
            through {receipt.listing.payoutRule}.
          </p>
        </div>
        <StatusBadge status={receipt.status === "live" ? "live" : "demo"} />
      </div>
      <div className="grid gap-3 md:grid-cols-3">
        <ExplorerCard title="WorkerINFT" icon={Blocks}>
          token #{receipt.tokenId ?? "storage-only"} / owner {shortAddress(receipt.ownerAddress)}
        </ExplorerCard>
        <ExplorerCard title="Memory root" icon={Database}>
          <span className="lz-mono lz-artifact">0g://{receipt.memoryRoot}</span>
        </ExplorerCard>
        <ExplorerCard title="Manifest root" icon={ShieldCheck}>
          <span className="lz-mono lz-artifact">0g://{receipt.manifestRoot}</span>
        </ExplorerCard>
      </div>
      <div className="grid gap-2">
        {receipt.chainTxs.map((tx) => (
          <div key={tx.hash} className="grid gap-2 rounded-lg border bg-background/35 p-3 text-sm md:grid-cols-[180px_1fr_auto]">
            <span className="font-medium">{tx.label}</span>
            <span className="lz-mono lz-artifact text-accent">{tx.hash}</span>
            <Badge variant="secondary">block {tx.block}</Badge>
          </div>
        ))}
      </div>
    </section>
  );
}

function ReceiptLine({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-[0.68rem] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
        {label}
      </div>
      <div className="lz-mono lz-artifact mt-1 break-all">{value}</div>
    </div>
  );
}

function ExplorerStat({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-xl border bg-card/60 p-4">
      <Icon className="mb-4 size-4 text-accent" />
      <div className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">{label}</div>
      <div className="mt-1 font-display text-2xl uppercase">{value}</div>
    </div>
  );
}

function ExplorerCard({
  title,
  icon: Icon,
  children,
}: {
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border bg-card/60 p-4 text-sm">
      <div className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-accent">
        <Icon className="size-4" />
        {title}
      </div>
      <div className="text-muted-foreground">{children}</div>
    </div>
  );
}

function ArtifactRow({ artifact, index }: { artifact: ProofArtifact; index: number }) {
  return (
    <div className="grid gap-3 rounded-xl border bg-card/55 p-4 text-sm md:grid-cols-[96px_1fr_auto] md:items-center">
      <div className="lz-mono text-xs text-muted-foreground">#{String(index + 1).padStart(4, "0")}</div>
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-medium">{artifact.artifact}</span>
          <Badge variant="outline">{artifact.layer}</Badge>
        </div>
        <div className="lz-mono lz-artifact mt-2 text-xs text-accent">{artifact.value}</div>
        <p className="mt-2 text-muted-foreground">{artifact.note}</p>
      </div>
      <StatusBadge status={artifact.status} />
    </div>
  );
}
