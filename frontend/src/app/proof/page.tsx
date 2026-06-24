import Link from "next/link";
import Image from "next/image";
import { ArrowUpRight, Blocks, Cpu, Database, RadioTower, ShieldCheck, WalletCards } from "lucide-react";
import { Shell } from "@/components/Shell";
import { StatusBadge } from "@/components/ledger-zero";
import { Badge } from "@/components/ui/badge";
import { getZeroGStatus } from "@/lib/0g/status";
import { explorerAddress } from "@/lib/contracts";
import { getOnChainJobs, getOnChainWorkers } from "@/lib/onchain-data";
import type { ProofArtifact, StatusKind } from "@/lib/ledger-zero";

export const dynamic = "force-dynamic";

function proofStatus(condition: boolean, fallback: StatusKind = "blocked"): StatusKind {
  return condition ? "live" : fallback;
}

function shortAddress(address: string) {
  return address ? `${address.slice(0, 6)}...${address.slice(-4)}` : "not configured";
}

export default async function ProofPage() {
  const [zeroG, workers, jobs] = await Promise.all([
    getZeroGStatus({ timeoutMs: 1_800 }),
    getOnChainWorkers(),
    getOnChainJobs(),
  ]);
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
  const currentArtifacts = [
    ...workers.slice(0, 3).map((worker) => ({
      layer: "WorkerINFT",
      artifact: `Token #${worker.tokenId}`,
      value: `${worker.ownerShort} / ${worker.memoryRoot}`,
      status: worker.memoryStatus,
      note: "Current owner and memory pointer resolved from on-chain worker metadata.",
    })),
    ...jobs.slice(0, 3).map((job) => ({
      layer: "LedgerEscrow",
      artifact: shortAddress(job.id),
      value: `${job.status} / ${job.resultRoot}`,
      status: job.status === "released" ? ("live" as const) : ("fallback" as const),
      note: "Task state and result hash resolved from escrow storage and events.",
    })),
  ];
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
                {jobs[0]?.id ?? "no live task indexed"}
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

          <section className="grid gap-3">
            <div className="flex items-center justify-between border-b pb-3">
              <h2 className="font-display text-2xl uppercase">Latest artifact rows</h2>
              {jobs[0] ? (
                <Link className="text-xs uppercase tracking-[0.14em] text-accent" href={`/jobs/${jobs[0].id}`}>
                  Open live job
                </Link>
              ) : null}
            </div>
            {artifacts.length ? (
              artifacts.map((artifact, index) => (
                <ArtifactRow key={`${artifact.layer}-${artifact.artifact}-${index}`} artifact={artifact} index={index} />
              ))
            ) : (
              <div className="rounded-xl border border-dashed bg-card/45 p-5 text-sm text-muted-foreground">
                No live proof receipt has been recorded yet. Contract and service status are shown above, but
                no seeded artifact rows are rendered anymore.
              </div>
            )}
          </section>
        </div>
      </section>
    </Shell>
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
