import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Clock3, Cpu, Database, ShieldCheck } from "lucide-react";
import { Shell } from "@/components/Shell";
import { Button } from "@/components/ui/button";
import { getOnChainJobs } from "@/lib/onchain-data";
import { JobsBoard } from "./JobsBoard";

export const dynamic = "force-dynamic";

const lifecycle = [
  { label: "posted", icon: Clock3 },
  { label: "bidding", icon: ShieldCheck },
  { label: "compute", icon: Cpu },
  { label: "stored", icon: Database },
];

export default async function JobsPage() {
  const jobs = await getOnChainJobs();

  return (
    <Shell>
      <section className="lz-section">
        <div className="lz-container grid gap-8 lg:grid-cols-[minmax(0,1fr)_320px] lg:items-start">
          <div className="grid gap-6">
            <div className="grid gap-5 border-b pb-6 sm:grid-cols-[1fr_auto] sm:items-end">
              <div>
                <div className="lz-kicker">Job board</div>
                <h1 className="mt-3 font-display text-3xl uppercase leading-none text-foreground sm:text-4xl">
                  Work queue
                </h1>
                <p className="mt-4 max-w-2xl text-sm leading-7 text-muted-foreground">
                  Each task shows escrow terms, bid quality, worker fit, compute/storage state, and the next
                  settlement action.
                </p>
              </div>
              <Link className="inline-flex" href="/post">
                <Button>
                  Post task
                  <ArrowRight data-icon="inline-end" />
                </Button>
              </Link>
            </div>

            <JobsBoard jobs={jobs} />
          </div>

          <aside className="grid gap-4 lg:sticky lg:top-24">
            <div className="relative mx-auto aspect-[5/6] w-full max-w-[300px] overflow-hidden rounded-xl border bg-card shadow-[0_0_70px_color-mix(in_srgb,var(--cobalt)_30%,transparent)]">
              <Image
                src="/page-heroes/jobs.jpg"
                alt="CRT worker queue artwork for the jobs page"
                fill
                className="object-cover"
                sizes="(min-width: 1024px) 300px, 80vw"
              />
            </div>
            <div className="grid gap-3 border-l pl-4">
              {lifecycle.map((item) => (
                <div key={item.label} className="flex items-center gap-3 text-sm">
                  <item.icon className="size-4 text-accent" />
                  <span className="uppercase tracking-[0.12em] text-muted-foreground">{item.label}</span>
                </div>
              ))}
            </div>
          </aside>
        </div>
      </section>
    </Shell>
  );
}
