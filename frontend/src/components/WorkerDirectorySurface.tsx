"use client";

import { useMemo, useState } from "react";
import { ArrowDownUp, LayoutGrid, Rows3, SlidersHorizontal } from "lucide-react";
import { WorkerCard } from "@/components/ledger-zero";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { DirectoryWorker, ListingStatus } from "@/lib/directory";

type DirectoryKind = "workers" | "marketplace";
type ViewMode = "grid" | "table";
type SortMode = "featured" | "price-high" | "price-low" | "rating" | "jobs";
type FilterMode = "all" | "listed" | "live" | "sold" | "not-listed";

function parsePrice(value: string) {
  const amount = Number.parseFloat(value);
  return Number.isFinite(amount) ? amount : 0;
}

function sortLabel(sort: SortMode) {
  if (sort === "price-high") return "Price high";
  if (sort === "price-low") return "Price low";
  if (sort === "rating") return "Top rated";
  if (sort === "jobs") return "Most jobs";
  return "Featured";
}

function filterLabel(filter: FilterMode) {
  if (filter === "listed") return "Listed";
  if (filter === "live") return "Live roots";
  if (filter === "sold") return "Sold";
  if (filter === "not-listed") return "Unlisted";
  return "All states";
}

export function WorkerDirectorySurface({
  workers,
  kind,
}: {
  workers: DirectoryWorker[];
  kind: DirectoryKind;
}) {
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<SortMode>("featured");
  const [filter, setFilter] = useState<FilterMode>(kind === "marketplace" ? "listed" : "all");
  const [view, setView] = useState<ViewMode>("grid");

  const filteredWorkers = useMemo(() => {
    const lowered = query.trim().toLowerCase();
    let result = workers.filter((worker) => {
      if (!lowered) return true;
      return [
        worker.name,
        worker.ownerShort,
        worker.summary,
        worker.tokenId,
        ...worker.capabilities,
      ]
        .join(" ")
        .toLowerCase()
        .includes(lowered);
    });

    if (filter !== "all") {
      result = result.filter((worker) => {
        if (filter === "live") return worker.memoryStatus === "live";
        return (worker.listingStatus ?? "not-listed") === filter;
      });
    }

    return [...result].sort((a, b) => {
      if (sort === "price-high") return parsePrice(b.price) - parsePrice(a.price);
      if (sort === "price-low") return parsePrice(a.price) - parsePrice(b.price);
      if (sort === "rating") return b.rating - a.rating;
      if (sort === "jobs") return b.jobsCompleted - a.jobsCompleted;
      return Number(b.tokenId) - Number(a.tokenId);
    });
  }, [filter, query, sort, workers]);

  const filterSequence: FilterMode[] =
    kind === "marketplace" ? ["listed", "sold", "live", "all"] : ["all", "listed", "live", "sold", "not-listed"];
  const sortSequence: SortMode[] = ["featured", "rating", "jobs", "price-high", "price-low"];

  function cycleFilter() {
    const index = filterSequence.indexOf(filter);
    setFilter(filterSequence[(index + 1) % filterSequence.length] ?? filterSequence[0]);
  }

  function cycleSort() {
    const index = sortSequence.indexOf(sort);
    setSort(sortSequence[(index + 1) % sortSequence.length] ?? sortSequence[0]);
  }

  return (
    <section className="grid gap-5">
      <div className="grid gap-4 rounded-xl border bg-card/55 p-4">
        <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={kind === "marketplace" ? "Search listed workers, capabilities, token ids..." : "Search workers, capabilities, token ids..."}
            aria-label={kind === "marketplace" ? "Search marketplace workers" : "Search workers"}
          />
          <div className="flex flex-wrap gap-2">
            <Button type="button" variant="outline" onClick={cycleFilter}>
              <SlidersHorizontal data-icon="inline-start" />
              Filter: {filterLabel(filter)}
            </Button>
            <Button type="button" variant="outline" onClick={cycleSort}>
              <ArrowDownUp data-icon="inline-start" />
              Sort: {sortLabel(sort)}
            </Button>
            <div className="flex overflow-hidden rounded-md border">
              <Button
                type="button"
                variant={view === "grid" ? "default" : "ghost"}
                className="rounded-none border-0"
                onClick={() => setView("grid")}
                aria-label="Grid view"
              >
                <LayoutGrid />
              </Button>
              <Button
                type="button"
                variant={view === "table" ? "default" : "ghost"}
                className="rounded-none border-0"
                onClick={() => setView("table")}
                aria-label="Table view"
              >
                <Rows3 />
              </Button>
            </div>
          </div>
        </div>
        <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
          <Badge variant="secondary">{filteredWorkers.length} results</Badge>
          <Badge variant="outline">{sortLabel(sort)}</Badge>
          <Badge variant="outline">{filterLabel(filter)}</Badge>
        </div>
      </div>

      {view === "grid" ? (
        <div className="lz-grid cols-3">
          {filteredWorkers.map((worker) => (
            <WorkerCard key={`${worker.source}-${worker.slug}`} worker={worker} />
          ))}
        </div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Worker</TableHead>
              <TableHead>Token</TableHead>
              <TableHead>Owner</TableHead>
              <TableHead>State</TableHead>
              <TableHead>Rating</TableHead>
              <TableHead>Jobs</TableHead>
              <TableHead>Earned</TableHead>
              <TableHead>Price</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredWorkers.map((worker) => (
              <TableRow key={`${worker.source}-${worker.slug}`}>
                <TableCell className="max-w-[280px] whitespace-normal">
                  <div className="grid gap-1">
                    <div className="font-medium text-foreground">{worker.name}</div>
                    <div className="text-sm text-muted-foreground">{worker.capabilities.join(" • ")}</div>
                  </div>
                </TableCell>
                <TableCell>#{worker.tokenId}</TableCell>
                <TableCell>{worker.ownerShort}</TableCell>
                <TableCell>{stateLabel(worker.listingStatus ?? "not-listed", worker.memoryStatus)}</TableCell>
                <TableCell>{worker.rating.toFixed(2)}</TableCell>
                <TableCell>{worker.jobsCompleted}</TableCell>
                <TableCell>{worker.earned} 0G</TableCell>
                <TableCell>{worker.price}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </section>
  );
}

function stateLabel(listingStatus: ListingStatus, memoryStatus: DirectoryWorker["memoryStatus"]) {
  if (listingStatus === "listed") return `listed / ${memoryStatus}`;
  if (listingStatus === "sold") return "sold";
  if (listingStatus === "blocked") return "blocked";
  return `registry / ${memoryStatus}`;
}
