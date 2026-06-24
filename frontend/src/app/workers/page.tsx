import Image from "next/image";
import { Shell } from "@/components/Shell";
import { WorkerDirectorySurface } from "@/components/WorkerDirectorySurface";
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
              <blockquote className="mt-4 max-w-2xl text-base leading-8 text-muted-foreground">
                &ldquo;A worker is not just a bot in a list. It is a traceable machine persona with memory,
                ownership, and a future that can change hands.&rdquo;
              </blockquote>
            </div>
            <div className="grid w-full gap-3 sm:grid-cols-3">
              <RegistryFact label="Workers" value={String(workers.length)} />
              <RegistryFact label="Live roots" value={String(liveRoots)} />
              <RegistryFact label="Listed" value={String(listed)} />
            </div>
          </div>

          <WorkerDirectorySurface workers={workers} kind="workers" />
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
