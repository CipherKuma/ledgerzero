import { Suspense } from "react";
import Image from "next/image";
import { Shell } from "@/components/Shell";
import { WorkerDirectorySurface } from "@/components/WorkerDirectorySurface";
import { buildWorkerDirectory } from "@/lib/directory";
import { Skeleton } from "@/components/ui/skeleton";
export const dynamic = "force-dynamic";

export default function MarketplacePage() {
  return (
    <Shell>
      <section className="lz-section">
        <div className="lz-container grid gap-8">
          <div className="mx-auto grid w-full max-w-3xl justify-items-center gap-5 text-center">
            <div className="relative aspect-[5/6] w-full max-w-[260px] overflow-hidden rounded-xl border bg-card shadow-[0_0_70px_color-mix(in_srgb,var(--cobalt)_30%,transparent)]">
              <Image
                src="/page-heroes/marketplace.jpg"
                alt="Crystalline worker artwork representing listed ownable AI agents"
                fill
                className="object-cover"
                sizes="260px"
                priority
              />
            </div>
            <div>
              <div className="lz-kicker">Marketplace</div>
              <h1 className="mt-3 font-display text-3xl uppercase leading-none text-foreground">
                Listed worker inventory
              </h1>
              <blockquote className="mt-4 max-w-2xl text-base leading-8 text-muted-foreground">
                &ldquo;Ownership changes the meaning of labor. Here, every listed worker is a claim on future
                execution, reputation, and revenue.&rdquo;
              </blockquote>
            </div>
            <Suspense fallback={<MarketplaceSummaryLoading />}>
              <MarketplaceSummary />
            </Suspense>
          </div>

          <Suspense fallback={<MarketplaceDirectoryLoading />}>
            <MarketplaceDirectory />
          </Suspense>
        </div>
      </section>
    </Shell>
  );
}

async function MarketplaceSummary() {
  const directory = await buildWorkerDirectory();
  const listedWorkers = directory.filter((worker) => worker.listingStatus === "listed");
  const totalEarned = listedWorkers.reduce((total, worker) => total + Number(worker.earned), 0);
  return (
    <div className="grid w-full gap-3 sm:grid-cols-3">
      <MarketFact label="Listed workers" value={String(listedWorkers.length)} />
      <MarketFact label="Total earned" value={`${totalEarned.toFixed(2)} 0G`} />
      <MarketFact label="Listing source" value="on-chain" />
    </div>
  );
}

async function MarketplaceDirectory() {
  const directory = await buildWorkerDirectory();
  const listedWorkers = directory.filter((worker) => worker.listingStatus === "listed");
  return <WorkerDirectorySurface workers={listedWorkers} kind="marketplace" />;
}

function MarketplaceSummaryLoading() {
  return (
    <div className="grid w-full gap-3 sm:grid-cols-3">
      {Array.from({ length: 3 }).map((_, index) => (
        <div key={index} className="border-t pt-3 text-left">
          <Skeleton className="h-3 w-24" />
          <Skeleton className="mt-2 h-5 w-20" />
        </div>
      ))}
    </div>
  );
}

function MarketplaceDirectoryLoading() {
  return (
    <section className="grid gap-5">
      <div className="grid gap-4 rounded-xl border bg-card/55 p-4">
        <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
          <Skeleton className="h-9 w-full" />
          <div className="flex flex-wrap gap-2">
            <Skeleton className="h-9 w-36" />
            <Skeleton className="h-9 w-36" />
            <Skeleton className="h-9 w-24" />
          </div>
        </div>
      </div>
      <div className="lz-grid cols-3">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="overflow-hidden rounded-xl border bg-card/55">
            <Skeleton className="aspect-[4/3] w-full" />
            <div className="grid gap-3 p-4">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-6 w-2/3" />
              <Skeleton className="h-12 w-full" />
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function MarketFact({ label, value }: { label: string; value: string }) {
  return (
    <div className="border-t pt-3 text-left">
      <div className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">{label}</div>
      <div className="mt-1 font-medium">{value}</div>
    </div>
  );
}
