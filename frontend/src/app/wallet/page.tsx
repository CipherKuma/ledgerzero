import { Suspense } from "react";
import { Shell } from "@/components/Shell";
import { PageHeader, WorkerCard } from "@/components/ledger-zero";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { buildWorkerDirectory } from "@/lib/directory";
import { getOnChainJobs } from "@/lib/onchain-data";
import { Skeleton } from "@/components/ui/skeleton";

export const dynamic = "force-dynamic";

export default function WalletPage() {
  return (
    <Shell>
      <PageHeader
        kicker="On-chain wallet view"
        title="Live worker, payout, and release state from Galileo."
        image={{
          src: "/page-heroes/workers.jpg",
          alt: "Crystalline worker artwork representing owned AI workers and future payouts",
        }}
      >
        This view no longer uses local demo receipts. It only reflects what can be resolved from
        deployed contracts and emitted events.
      </PageHeader>
      <section className="lz-section">
        <div className="lz-container">
          <Suspense fallback={<WalletSummaryLoading />}>
            <WalletSummary />
          </Suspense>
        </div>
      </section>
      <section className="lz-section">
        <div className="lz-container">
          <Suspense fallback={<WalletBodyLoading />}>
            <WalletBody />
          </Suspense>
        </div>
      </section>
      <Suspense fallback={null}>
        <WalletReceipt />
      </Suspense>
    </Shell>
  );
}

async function WalletSummary() {
  const [workers, jobs] = await Promise.all([buildWorkerDirectory(), getOnChainJobs()]);
  const latestReleased = jobs.find((job) => job.releaseTx);
  return (
    <div className="lz-grid cols-3">
      <Summary label="Indexed worker tokens" value={String(workers.length)} />
      <Summary label="Latest released payout" value={latestReleased?.payout ?? "none"} />
      <Summary label="Latest payout owner" value={latestReleased?.acceptedWorker ?? "unassigned"} />
    </div>
  );
}

async function WalletBody() {
  const [workers, jobs] = await Promise.all([buildWorkerDirectory(), getOnChainJobs()]);
  const latestReleased = jobs.find((job) => job.releaseTx);
  const featuredWorker = workers[0];
  return (
    <div className="lz-grid cols-2">
      {featuredWorker ? <WorkerCard worker={featuredWorker} /> : <Card><CardContent className="p-6 text-sm text-muted-foreground">No worker tokens indexed on chain yet.</CardContent></Card>}
      <Card>
        <CardHeader>
          <CardTitle>Latest transfer proof</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 text-sm">
          <div className="lz-mono lz-artifact">task {latestReleased?.id ?? "none"}</div>
          <div className="lz-mono lz-artifact">worker {latestReleased?.acceptedWorker ?? "unassigned"}</div>
          <div>Next payout routes to {latestReleased?.acceptedWorker ?? "unassigned"}</div>
          <div>Active jobs: {jobs.filter((job) => !["released", "cancelled", "slashed"].includes(job.status)).length}</div>
        </CardContent>
      </Card>
    </div>
  );
}

async function WalletReceipt() {
  const latestReleased = (await getOnChainJobs()).find((job) => job.releaseTx);
  if (!latestReleased) return null;
  return (
    <section className="lz-section">
      <div className="lz-container">
        <Card data-testid="wallet-latest-demo-revenue">
          <CardHeader>
            <CardTitle>Latest release receipt</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 text-sm md:grid-cols-3">
            <RevenueFact label="Worker token" value={latestReleased.workerTokenId ? `#${latestReleased.workerTokenId}` : "not attached"} />
            <RevenueFact label="Task buyer" value={latestReleased.buyerAddress} />
            <RevenueFact label="Receipt owner" value={latestReleased.acceptedWorker} />
            <RevenueFact label="Status" value={latestReleased.status} />
            <RevenueFact label="Result hash" value={latestReleased.resultRoot} />
            <RevenueFact label="Revenue rule" value="ownerOf(workerTokenId)" />
          </CardContent>
        </Card>
      </div>
    </section>
  );
}

function WalletSummaryLoading() {
  return (
    <div className="lz-grid cols-3">
      {Array.from({ length: 3 }).map((_, index) => (
        <Card key={index}>
          <CardHeader>
            <Skeleton className="h-7 w-20" />
          </CardHeader>
          <CardContent><Skeleton className="h-4 w-28" /></CardContent>
        </Card>
      ))}
    </div>
  );
}

function WalletBodyLoading() {
  return (
    <div className="lz-grid cols-2">
      <div className="overflow-hidden rounded-xl border bg-card/55">
        <Skeleton className="aspect-[4/3] w-full" />
        <div className="grid gap-3 p-4">
          <Skeleton className="h-6 w-2/3" />
          <Skeleton className="h-16 w-full" />
        </div>
      </div>
      <Card>
        <CardHeader><Skeleton className="h-6 w-40" /></CardHeader>
        <CardContent className="grid gap-3">
          {Array.from({ length: 4 }).map((_, index) => <Skeleton key={index} className="h-4 w-full" />)}
        </CardContent>
      </Card>
    </div>
  );
}

function Summary({ label, value }: { label: string; value: string }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-3xl">{value}</CardTitle>
      </CardHeader>
      <CardContent className="text-sm text-muted-foreground">{label}</CardContent>
    </Card>
  );
}

function RevenueFact({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">{label}</div>
      <div className="lz-mono lz-artifact mt-1 break-all">{value}</div>
    </div>
  );
}
