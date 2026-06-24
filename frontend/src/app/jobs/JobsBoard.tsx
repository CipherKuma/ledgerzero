"use client";

import { type ReactNode, useMemo, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { ArrowRight, RotateCcw } from "lucide-react";
import { RelativeTime } from "@/components/RelativeTime";
import { StatusBadge } from "@/components/ledger-zero";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger } from "@/components/ui/select";
import type { Job } from "@/lib/ledger-zero";

type JobFilter = "all" | "open" | "posted" | "accepted" | "released" | "with-bids";
type JobProofFilter = "all" | "with-result" | "awaiting-result" | "with-post-tx";
type JobPayoutFilter = "all" | "under-0005" | "under-001" | "above-001";
type JobSort = "newest" | "oldest" | "payout-high" | "payout-low" | "bids" | "deadline";
type StoredTaskMetadata = {
  id: string;
  txHash?: string;
  title?: string;
  description?: string;
  category?: string;
  tags?: string[];
};

function short(value?: string) {
  if (!value) return "none";
  return value.length > 14 ? `${value.slice(0, 6)}...${value.slice(-4)}` : value;
}

function payoutValue(job: Job) {
  const value = Number.parseFloat(job.payout);
  return Number.isFinite(value) ? value : 0;
}

function filterLabel(filter: JobFilter) {
  if (filter === "open") return "Open";
  if (filter === "posted") return "Posted";
  if (filter === "accepted") return "Accepted";
  if (filter === "released") return "Released";
  if (filter === "with-bids") return "With bids";
  return "All states";
}

function sortLabel(sort: JobSort) {
  if (sort === "oldest") return "Oldest";
  if (sort === "payout-high") return "Payout high";
  if (sort === "payout-low") return "Payout low";
  if (sort === "bids") return "Most bids";
  if (sort === "deadline") return "Deadline";
  return "Newest";
}

function isOpen(job: Job) {
  return !["released", "cancelled", "slashed"].includes(job.status);
}

function proofLabel(filter: JobProofFilter) {
  if (filter === "with-result") return "Has result/proof";
  if (filter === "awaiting-result") return "Awaiting result";
  if (filter === "with-post-tx") return "Has post tx";
  return "Any proof state";
}

function payoutLabel(filter: JobPayoutFilter) {
  if (filter === "under-0005") return "Under 0.0005 0G";
  if (filter === "under-001") return "Under 0.001 0G";
  if (filter === "above-001") return "0.001 0G and up";
  return "Any payout";
}

function hasResultProof(job: Job & { releaseTx?: string }) {
  return Boolean(job.releaseTx) || job.resultRoot.startsWith("0g://") || /^0x[0-9a-f]{64}$/i.test(job.resultRoot);
}

function payoutMatches(job: Job, filter: JobPayoutFilter) {
  const payout = payoutValue(job);
  if (filter === "under-0005") return payout > 0 && payout < 0.0005;
  if (filter === "under-001") return payout > 0 && payout < 0.001;
  if (filter === "above-001") return payout >= 0.001;
  return true;
}

function loadStoredMetadataSnapshot() {
  try {
    const index = JSON.parse(window.localStorage.getItem("ledger-zero-task-index") ?? "[]") as string[];
    return JSON.stringify(
      index.flatMap((id) => {
        const raw = window.localStorage.getItem(`ledger-zero-task:${id}`);
        if (!raw) return [];
        const parsed = JSON.parse(raw) as StoredTaskMetadata;
        return [[id, parsed] as const];
      }),
    );
  } catch {
    return "[]";
  }
}

function emptyMetadataSnapshot() {
  return "[]";
}

function subscribeToStoredMetadata(callback: () => void) {
  window.addEventListener("storage", callback);
  window.addEventListener("ledger-zero-task-metadata", callback);
  return () => {
    window.removeEventListener("storage", callback);
    window.removeEventListener("ledger-zero-task-metadata", callback);
  };
}

export function JobsBoard({ jobs }: { jobs: Job[] }) {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<JobFilter>("all");
  const [categoryFilter, setCategoryFilter] = useState("__all__");
  const [proofFilter, setProofFilter] = useState<JobProofFilter>("all");
  const [payoutFilter, setPayoutFilter] = useState<JobPayoutFilter>("all");
  const [sort, setSort] = useState<JobSort>("newest");
  const metadataSnapshot = useSyncExternalStore(
    subscribeToStoredMetadata,
    loadStoredMetadataSnapshot,
    emptyMetadataSnapshot,
  );
  const metadata = useMemo(
    () => new Map(JSON.parse(metadataSnapshot) as Array<[string, StoredTaskMetadata]>),
    [metadataSnapshot],
  );

  const enrichedJobs = useMemo(
    () =>
      jobs.map((job) => {
        const local = metadata.get(job.id);
        return {
          ...job,
          title: local?.title || job.title,
          category: local?.category || job.category,
          postedTx: job.postedTx || local?.txHash,
          localTags: local?.tags ?? [],
        };
      }),
    [jobs, metadata],
  );
  const categories = useMemo(
    () => [...new Set(enrichedJobs.map((job) => job.category).filter(Boolean))].sort((a, b) => a.localeCompare(b)),
    [enrichedJobs],
  );

  const visibleJobs = useMemo(() => {
    const lowered = query.trim().toLowerCase();
    let result = enrichedJobs.filter((job) => {
      if (filter === "open" && !isOpen(job)) return false;
      if (filter === "posted" && job.status !== "posted") return false;
      if (filter === "accepted" && job.status !== "accepted") return false;
      if (filter === "released" && job.status !== "released") return false;
      if (filter === "with-bids" && job.bids.length === 0) return false;
      if (categoryFilter !== "__all__" && job.category !== categoryFilter) return false;
      if (proofFilter === "with-result" && !hasResultProof(job)) return false;
      if (proofFilter === "awaiting-result" && hasResultProof(job)) return false;
      if (proofFilter === "with-post-tx" && !job.postedTx) return false;
      if (!payoutMatches(job, payoutFilter)) return false;
      if (!lowered) return true;
      return [
        job.id,
        job.title,
        job.category,
        job.status,
        job.payout,
        job.bond,
        job.acceptedWorker,
        job.resultRoot,
        job.postedTx,
        job.buyerAddress,
        ...job.localTags,
        ...job.bids.flatMap((bid) => [bid.worker, bid.amount, bid.score]),
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(lowered);
    });

    result = [...result].sort((a, b) => {
      if (sort === "payout-high") return payoutValue(b) - payoutValue(a);
      if (sort === "payout-low") return payoutValue(a) - payoutValue(b);
      if (sort === "bids") return b.bids.length - a.bids.length;
      if (sort === "deadline") return (a.deadline ?? Number.MAX_SAFE_INTEGER) - (b.deadline ?? Number.MAX_SAFE_INTEGER);
      if (sort === "oldest") return new Date(a.postedAt ?? 0).getTime() - new Date(b.postedAt ?? 0).getTime();
      return new Date(b.postedAt ?? 0).getTime() - new Date(a.postedAt ?? 0).getTime();
    });
    return result;
  }, [categoryFilter, enrichedJobs, filter, payoutFilter, proofFilter, query, sort]);

  const hasActiveFilters =
    Boolean(query.trim()) ||
    filter !== "all" ||
    categoryFilter !== "__all__" ||
    proofFilter !== "all" ||
    payoutFilter !== "all" ||
    sort !== "newest";

  function resetFilters() {
    setQuery("");
    setFilter("all");
    setCategoryFilter("__all__");
    setProofFilter("all");
    setPayoutFilter("all");
    setSort("newest");
  }

  return (
    <section className="grid gap-5" aria-label="On-chain jobs">
      <div className="grid gap-4 rounded-xl border bg-card/55 p-4">
        <div className="grid gap-3 xl:grid-cols-[minmax(220px,1.5fr)_repeat(5,minmax(145px,0.82fr))_auto] xl:items-end">
          <div className="grid gap-1.5">
            <label className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
              Search
            </label>
            <Input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search jobs, task ids, tx hashes, buyers, workers..."
              aria-label="Search jobs"
            />
          </div>

          <FilterSelect
            label="Status"
            value={filter}
            displayValue={filterLabel(filter)}
            onValueChange={(value) => setFilter(value as JobFilter)}
          >
            <SelectItem value="all">All states</SelectItem>
            <SelectItem value="open">Open action</SelectItem>
            <SelectItem value="posted">Posted</SelectItem>
            <SelectItem value="accepted">Accepted</SelectItem>
            <SelectItem value="released">Released</SelectItem>
            <SelectItem value="with-bids">With bids</SelectItem>
          </FilterSelect>

          <FilterSelect
            label="Category"
            value={categoryFilter}
            displayValue={categoryFilter === "__all__" ? "Any category" : categoryFilter}
            onValueChange={setCategoryFilter}
          >
            <SelectItem value="__all__">Any category</SelectItem>
            {categories.map((category) => (
              <SelectItem key={category} value={category}>
                {category}
              </SelectItem>
            ))}
          </FilterSelect>

          <FilterSelect
            label="Proof"
            value={proofFilter}
            displayValue={proofLabel(proofFilter)}
            onValueChange={(value) => setProofFilter(value as JobProofFilter)}
          >
            <SelectItem value="all">Any proof state</SelectItem>
            <SelectItem value="with-result">Has result/proof</SelectItem>
            <SelectItem value="awaiting-result">Awaiting result</SelectItem>
            <SelectItem value="with-post-tx">Has post tx</SelectItem>
          </FilterSelect>

          <FilterSelect
            label="Payout"
            value={payoutFilter}
            displayValue={payoutLabel(payoutFilter)}
            onValueChange={(value) => setPayoutFilter(value as JobPayoutFilter)}
          >
            <SelectItem value="all">Any payout</SelectItem>
            <SelectItem value="under-0005">Under 0.0005 0G</SelectItem>
            <SelectItem value="under-001">Under 0.001 0G</SelectItem>
            <SelectItem value="above-001">0.001 0G and up</SelectItem>
          </FilterSelect>

          <FilterSelect
            label="Sort"
            value={sort}
            displayValue={sortLabel(sort)}
            onValueChange={(value) => setSort(value as JobSort)}
          >
            <SelectItem value="newest">Newest</SelectItem>
            <SelectItem value="oldest">Oldest</SelectItem>
            <SelectItem value="deadline">Deadline</SelectItem>
            <SelectItem value="payout-high">Payout high</SelectItem>
            <SelectItem value="payout-low">Payout low</SelectItem>
            <SelectItem value="bids">Most bids</SelectItem>
          </FilterSelect>

          {hasActiveFilters ? (
            <Button type="button" variant="outline" onClick={resetFilters} aria-label="Reset job filters">
              <RotateCcw />
            </Button>
          ) : null}
        </div>
        <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
          <Badge variant="secondary">{visibleJobs.length} / {enrichedJobs.length} results</Badge>
          <Badge variant="outline">{filterLabel(filter)}</Badge>
          {categoryFilter !== "__all__" ? <Badge variant="outline">{categoryFilter}</Badge> : null}
          <Badge variant="outline">{proofLabel(proofFilter)}</Badge>
          <Badge variant="outline">{payoutLabel(payoutFilter)}</Badge>
          <Badge variant="outline">{sortLabel(sort)}</Badge>
        </div>
      </div>

      <div className="grid gap-4">
        {visibleJobs.length ? (
          visibleJobs.map((job) => <TaskPanel key={job.id} job={job} />)
        ) : (
          <div className="rounded-xl border border-dashed bg-card/45 p-6 text-sm text-muted-foreground">
            No jobs match the current search and filter.
          </div>
        )}
      </div>
    </section>
  );
}

function FilterSelect({
  label,
  value,
  displayValue,
  onValueChange,
  children,
}: {
  label: string;
  value: string;
  displayValue: string;
  onValueChange: (value: string) => void;
  children: ReactNode;
}) {
  return (
    <div className="grid gap-1.5">
      <label className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">{label}</label>
      <Select value={value} onValueChange={(next) => next && onValueChange(next)}>
        <SelectTrigger className="w-full">
          <span className="min-w-0 truncate text-left">{displayValue}</span>
        </SelectTrigger>
        <SelectContent>{children}</SelectContent>
      </Select>
    </div>
  );
}

function TaskPanel({ job }: { job: Job & { localTags?: string[]; releaseTx?: string; postedTx?: string; buyerAddress?: string } }) {
  const topBid = job.bids[0];
  const proofStatus = job.releaseTx || job.resultRoot.startsWith("0g://") ? "live" : "blocked";

  return (
    <article className="group rounded-xl border bg-card/64 p-4 shadow-[0_24px_80px_color-mix(in_srgb,#020305_52%,transparent)] transition duration-300 hover:-translate-y-1 hover:border-accent/50">
      <div className="grid gap-5 md:grid-cols-[minmax(0,1fr)_240px]">
        <div className="grid gap-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <div className="flex flex-wrap items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-accent">
                <span>{job.category}</span>
                {job.postedAt ? (
                  <span className="text-muted-foreground">
                    <RelativeTime value={job.postedAt} verb="posted" />
                  </span>
                ) : null}
              </div>
              <h2 className="mt-2 text-xl font-semibold text-foreground">{job.title}</h2>
            </div>
            <Badge variant="secondary">{job.status}</Badge>
          </div>
          {job.localTags?.length ? (
            <div className="flex flex-wrap gap-2">
              {job.localTags.map((tag) => (
                <Badge key={tag} variant="outline">
                  {tag}
                </Badge>
              ))}
            </div>
          ) : null}
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
              {job.bids.length ? (
                job.bids.map((bid) => (
                  <div key={`${bid.worker}-${bid.amount}`} className="grid grid-cols-[1fr_auto_auto] gap-3 text-sm">
                    <span className="truncate">{bid.worker}</span>
                    <span className="lz-mono">{bid.amount}</span>
                    <span className="text-accent">{bid.score}</span>
                  </div>
                ))
              ) : (
                <div className="text-sm text-muted-foreground">No worker has accepted this escrow yet.</div>
              )}
            </div>
          </div>
        </div>
        <div className="grid content-between gap-4 border-l pl-4">
          <div className="grid gap-3">
            <TaskFact label="Accepted worker" value={job.acceptedWorker} />
            <TaskFact label="Best bid" value={topBid ? `${topBid.amount} / ${topBid.score}` : "none"} />
            <TaskFact label="Buyer" value={short(job.buyerAddress)} mono />
            <TaskFact label="Post tx" value={short(job.postedTx)} mono />
          </div>
          <div className="flex items-center justify-between gap-3">
            <StatusBadge status={proofStatus} />
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

function TaskFact({ label, value, mono = false }: { label: string; value: string; mono?: boolean }) {
  return (
    <div>
      <div className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">{label}</div>
      <div className={mono ? "lz-mono lz-artifact mt-1 text-xs" : "mt-1 font-medium"}>{value}</div>
    </div>
  );
}
