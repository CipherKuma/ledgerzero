import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Clock3, Cpu, Database, ShieldCheck } from "lucide-react";
import { Shell } from "@/components/Shell";
import { StatusBadge } from "@/components/ledger-zero";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { jobs, type Job } from "@/lib/ledger-zero";

const lifecycle = [
  { label: "posted", icon: Clock3 },
  { label: "bidding", icon: ShieldCheck },
  { label: "compute", icon: Cpu },
  { label: "stored", icon: Database },
];

export default function JobsPage() {
  const activeJobs = jobs.filter((job) => job.status !== "settled");
  const bestBidCount = jobs.reduce((total, job) => total + job.bids.length, 0);

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

            <div className="grid gap-3 sm:grid-cols-3">
              <QueueMetric label="Active jobs" value={String(activeJobs.length)} />
              <QueueMetric label="Open bids" value={String(bestBidCount)} />
              <QueueMetric label="Settlement path" value="ownerOf(token)" />
            </div>

            <div className="grid gap-4">
              {jobs.map((job) => (
                <TaskPanel key={job.id} job={job} />
              ))}
            </div>
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

function QueueMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="border-t pt-3">
      <div className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">{label}</div>
      <div className="mt-1 font-display text-2xl uppercase">{value}</div>
    </div>
  );
}

function TaskPanel({ job }: { job: Job }) {
  const topBid = job.bids[0];

  return (
    <article className="group rounded-xl border bg-card/64 p-4 shadow-[0_24px_80px_color-mix(in_srgb,#020305_52%,transparent)] transition duration-300 hover:-translate-y-1 hover:border-accent/50">
      <div className="grid gap-5 md:grid-cols-[minmax(0,1fr)_220px]">
        <div className="grid gap-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <div className="text-xs font-semibold uppercase tracking-[0.14em] text-accent">{job.category}</div>
              <h2 className="mt-2 text-xl font-semibold text-foreground">{job.title}</h2>
            </div>
            <Badge variant="secondary">{job.status}</Badge>
          </div>
          <div className="grid gap-3 text-sm sm:grid-cols-3">
            <TaskFact label="Payout" value={job.payout} />
            <TaskFact label="Bond" value={job.bond} />
            <TaskFact label="Min rep" value={job.minReputation} />
          </div>
          <div className="rounded-lg border bg-background/42 p-3">
            <div className="mb-2 flex items-center justify-between gap-3 text-xs uppercase tracking-[0.14em] text-muted-foreground">
              <span>Bid field</span>
              <span>{job.bids.length} bids</span>
            </div>
            <div className="grid gap-2">
              {job.bids.map((bid) => (
                <div key={bid.worker} className="grid grid-cols-[1fr_auto_auto] gap-3 text-sm">
                  <span className="truncate">{bid.worker}</span>
                  <span className="lz-mono">{bid.amount}</span>
                  <span className="text-accent">{bid.score}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
        <div className="grid content-between gap-4 border-l pl-4">
          <div className="grid gap-3">
            <TaskFact label="Accepted worker" value={job.acceptedWorker} />
            <TaskFact label="Best bid" value={topBid ? `${topBid.amount} / ${topBid.score}` : "none"} />
            <div>
              <div className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                Result root
              </div>
              <div className="lz-mono lz-artifact mt-1 text-xs">{job.resultRoot}</div>
            </div>
          </div>
          <div className="flex items-center justify-between gap-3">
            <StatusBadge status={job.resultRoot.startsWith("0g://") ? "live" : "blocked"} />
            <Link className="inline-flex" href={`/jobs/${job.id}`}>
              <Button variant="outline" size="sm">
                Open
                <ArrowRight data-icon="inline-end" />
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </article>
  );
}

function TaskFact({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">{label}</div>
      <div className="mt-1 font-medium">{value}</div>
    </div>
  );
}
