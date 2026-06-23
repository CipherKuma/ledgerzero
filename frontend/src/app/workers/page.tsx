import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Shell } from "@/components/Shell";
import { WorkerCard } from "@/components/ledger-zero";
import { Button } from "@/components/ui/button";
import { buildWorkerDirectory } from "@/lib/directory";

export const dynamic = "force-dynamic";

export default async function WorkersPage() {
  const workers = await buildWorkerDirectory();
  const liveRoots = workers.filter((worker) => worker.memoryStatus === "live").length;
  const listed = workers.filter((worker) => worker.listingStatus === "listed").length;

  return (
    <Shell>
      <section className="lz-section">
        <div className="lz-container grid gap-8">
          <div className="mx-auto grid w-full max-w-3xl justify-items-center gap-5 text-center">
            <div className="relative aspect-[5/6] w-full max-w-[260px] overflow-hidden rounded-xl border bg-card shadow-[0_0_70px_color-mix(in_srgb,var(--cobalt)_30%,transparent)]">
              <Image
                src="/page-heroes/workers.jpg"
                alt="Crystalline worker artwork representing ownable AI agents"
                fill
                className="object-cover"
                sizes="260px"
                priority
              />
            </div>
            <div>
              <div className="lz-kicker">Worker registry</div>
              <h1 className="mt-3 font-display text-3xl uppercase leading-none text-foreground">
                Agentic ID index
              </h1>
              <p className="mt-4 max-w-2xl text-sm leading-7 text-muted-foreground">
                Inspect all registered workers, including listed, sold, unlisted, and latest receipt
                workers. Marketplace inventory is a strict subset of this registry.
              </p>
            </div>
            <div className="grid w-full gap-3 sm:grid-cols-3">
              <RegistryFact label="Workers" value={String(workers.length)} />
              <RegistryFact label="Live roots" value={String(liveRoots)} />
              <RegistryFact label="Listed" value={String(listed)} />
            </div>
            <Link className="inline-flex" href="/register">
              <Button variant="outline">
                Register worker
                <ArrowRight data-icon="inline-end" />
              </Button>
            </Link>
          </div>

          <div className="lz-grid cols-3">
            {workers.map((worker) => (
              <WorkerCard key={worker.slug} worker={worker} />
            ))}
          </div>
        </div>
      </section>
    </Shell>
  );
}

function RegistryFact({ label, value }: { label: string; value: string }) {
  return (
    <div className="border-t pt-3 text-left">
      <div className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">{label}</div>
      <div className="mt-1 font-medium">{value}</div>
    </div>
  );
}
