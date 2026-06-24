"use client";

import { type ReactNode, useMemo, useState } from "react";
import { LayoutGrid, RotateCcw, Rows3 } from "lucide-react";
import { WorkerCard } from "@/components/ledger-zero";
import { RelativeTime } from "@/components/RelativeTime";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { BuyWorkerButton } from "@/components/marketplace/WorkerMarketActions";
import { Select, SelectContent, SelectItem, SelectTrigger } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { DirectoryWorker, ListingStatus } from "@/lib/directory";

type DirectoryKind = "workers" | "marketplace";
type ViewMode = "grid" | "table";
type SortMode = "newest" | "token-asc" | "price-high" | "price-low" | "rating" | "jobs" | "earned";
type RegistrationFilter = "all" | "live" | "incomplete";
type ListingFilter = "all" | "listed" | "sold" | "not-listed";
type PriceFilter = "all" | "priced" | "under-0005" | "under-001" | "above-001";
const ALL_CAPABILITIES = "__all__";

function parsePrice(value: string) {
  const amount = Number.parseFloat(value);
  return Number.isFinite(amount) ? amount : 0;
}

function sortLabel(sort: SortMode) {
  if (sort === "newest") return "Newest";
  if (sort === "token-asc") return "Oldest token";
  if (sort === "price-high") return "Price high";
  if (sort === "price-low") return "Price low";
  if (sort === "rating") return "Top rated";
  if (sort === "jobs") return "Most jobs";
  if (sort === "earned") return "Most earned";
  return "Newest";
}

function registrationLabel(filter: RegistrationFilter) {
  if (filter === "live") return "Live only";
  if (filter === "incomplete") return "Needs registration";
  return "Any registration";
}

function listingLabel(filter: ListingFilter) {
  if (filter === "listed") return "Listed";
  if (filter === "sold") return "Sold";
  if (filter === "not-listed") return "Unlisted";
  return "Any listing state";
}

function priceLabel(filter: PriceFilter) {
  if (filter === "priced") return "Priced only";
  if (filter === "under-0005") return "Under 0.0005 0G";
  if (filter === "under-001") return "Under 0.001 0G";
  if (filter === "above-001") return "0.001 0G and up";
  return "Any price";
}

function timeSortValue(worker: DirectoryWorker, kind: DirectoryKind) {
  const value = kind === "marketplace" ? worker.listedAt ?? worker.registeredAt : worker.registeredAt;
  return new Date(value ?? 0).getTime();
}

function priceMatches(price: number, filter: PriceFilter) {
  if (filter === "priced") return price > 0;
  if (filter === "under-0005") return price > 0 && price < 0.0005;
  if (filter === "under-001") return price > 0 && price < 0.001;
  if (filter === "above-001") return price >= 0.001;
  return true;
}

export function WorkerDirectorySurface({
  workers,
  kind,
}: {
  workers: DirectoryWorker[];
  kind: DirectoryKind;
}) {
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<SortMode>("newest");
  const [registrationFilter, setRegistrationFilter] = useState<RegistrationFilter>(kind === "marketplace" ? "live" : "all");
  const [listingFilter, setListingFilter] = useState<ListingFilter>("all");
  const [priceFilter, setPriceFilter] = useState<PriceFilter>(kind === "marketplace" ? "priced" : "all");
  const [capabilityFilter, setCapabilityFilter] = useState(ALL_CAPABILITIES);
  const [view, setView] = useState<ViewMode>("grid");

  const capabilities = useMemo(
    () => [...new Set(workers.flatMap((worker) => worker.capabilities))].sort((a, b) => a.localeCompare(b)),
    [workers],
  );

  const filteredWorkers = useMemo(() => {
    const lowered = query.trim().toLowerCase();
    const result = workers.filter((worker) => {
      const searchable = [
        worker.name,
        worker.ownerShort,
        worker.ownerAddress,
        worker.sellerAddress,
        worker.summary,
        worker.tokenId,
        worker.memoryRoot,
        worker.price,
        worker.listingStatus,
        worker.memoryStatus,
        ...worker.capabilities,
      ]
        .join(" ")
        .toLowerCase()
        .includes(lowered);
      if (lowered && !searchable) return false;
      if (registrationFilter === "live" && !isProperlyRegistered(worker)) return false;
      if (registrationFilter === "incomplete" && isProperlyRegistered(worker)) return false;
      if (listingFilter !== "all" && (worker.listingStatus ?? "not-listed") !== listingFilter) return false;
      if (capabilityFilter !== ALL_CAPABILITIES && !worker.capabilities.includes(capabilityFilter)) return false;
      if (!priceMatches(parsePrice(worker.price), priceFilter)) return false;
      return true;
    });

    return [...result].sort((a, b) => {
      if (sort === "price-high") return parsePrice(b.price) - parsePrice(a.price);
      if (sort === "price-low") return parsePrice(a.price) - parsePrice(b.price);
      if (sort === "rating") return b.rating - a.rating;
      if (sort === "jobs") return b.jobsCompleted - a.jobsCompleted;
      if (sort === "earned") return Number.parseFloat(b.earned || "0") - Number.parseFloat(a.earned || "0");
      if (sort === "token-asc") return Number(a.tokenId) - Number(b.tokenId);
      if (sort === "newest") return timeSortValue(b, kind) - timeSortValue(a, kind) || Number(b.tokenId) - Number(a.tokenId);
      return Number(b.tokenId) - Number(a.tokenId);
    });
  }, [capabilityFilter, kind, listingFilter, priceFilter, query, registrationFilter, sort, workers]);

  const isEmpty = filteredWorkers.length === 0;
  const hasSourceData = workers.length > 0;
  const hasActiveFilters =
    Boolean(query.trim()) ||
    registrationFilter !== (kind === "marketplace" ? "live" : "all") ||
    listingFilter !== "all" ||
    priceFilter !== (kind === "marketplace" ? "priced" : "all") ||
    capabilityFilter !== ALL_CAPABILITIES ||
    sort !== "newest";

  function resetFilters() {
    setQuery("");
    setRegistrationFilter(kind === "marketplace" ? "live" : "all");
    setListingFilter("all");
    setPriceFilter(kind === "marketplace" ? "priced" : "all");
    setCapabilityFilter(ALL_CAPABILITIES);
    setSort("newest");
  }

  return (
    <section className="grid gap-5">
      <div className="grid gap-4 rounded-xl border bg-card/55 p-4">
        <div className="grid gap-3 xl:grid-cols-[minmax(220px,1.4fr)_repeat(4,minmax(150px,0.85fr))_auto] xl:items-end">
          <div className="grid gap-1.5">
            <label className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
              Search
            </label>
            <Input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder={
                kind === "marketplace"
                  ? "Search listed workers, capabilities, token ids..."
                  : "Search workers, capabilities, token ids..."
              }
              aria-label={kind === "marketplace" ? "Search marketplace workers" : "Search workers"}
            />
          </div>

          <FilterSelect
            label="Registration"
            value={registrationFilter}
            displayValue={registrationLabel(registrationFilter)}
            onValueChange={(value) => setRegistrationFilter(value as RegistrationFilter)}
          >
            <SelectItem value="all">Any registration</SelectItem>
            <SelectItem value="live">Live root</SelectItem>
            <SelectItem value="incomplete">Needs registration</SelectItem>
          </FilterSelect>

          {kind === "workers" ? (
            <FilterSelect
              label="Listing"
              value={listingFilter}
              displayValue={listingLabel(listingFilter)}
              onValueChange={(value) => setListingFilter(value as ListingFilter)}
            >
              <SelectItem value="all">Any listing state</SelectItem>
              <SelectItem value="listed">Listed</SelectItem>
              <SelectItem value="not-listed">Unlisted</SelectItem>
              <SelectItem value="sold">Sold</SelectItem>
            </FilterSelect>
          ) : (
            <FilterSelect
              label="Price"
              value={priceFilter}
              displayValue={priceLabel(priceFilter)}
              onValueChange={(value) => setPriceFilter(value as PriceFilter)}
            >
              <SelectItem value="priced">Priced only</SelectItem>
              <SelectItem value="under-0005">Under 0.0005 0G</SelectItem>
              <SelectItem value="under-001">Under 0.001 0G</SelectItem>
              <SelectItem value="above-001">0.001 0G and up</SelectItem>
              <SelectItem value="all">Any price</SelectItem>
            </FilterSelect>
          )}

          <FilterSelect
            label="Capability"
            value={capabilityFilter}
            displayValue={capabilityFilter === ALL_CAPABILITIES ? "Any capability" : capabilityFilter}
            onValueChange={setCapabilityFilter}
          >
            <SelectItem value={ALL_CAPABILITIES}>Any capability</SelectItem>
            {capabilities.map((capability) => (
              <SelectItem key={capability} value={capability}>
                {capability}
              </SelectItem>
            ))}
          </FilterSelect>

          <FilterSelect
            label="Sort"
            value={sort}
            displayValue={sortLabel(sort)}
            onValueChange={(value) => setSort(value as SortMode)}
          >
            <SelectItem value="newest">Newest</SelectItem>
            <SelectItem value="token-asc">Oldest token</SelectItem>
            <SelectItem value="rating">Top rated</SelectItem>
            <SelectItem value="jobs">Most jobs</SelectItem>
            <SelectItem value="earned">Most earned</SelectItem>
            <SelectItem value="price-low">Price low</SelectItem>
            <SelectItem value="price-high">Price high</SelectItem>
          </FilterSelect>

          <div className="flex gap-2">
            <div className="flex overflow-hidden rounded-lg border">
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
            {hasActiveFilters ? (
              <Button type="button" variant="outline" onClick={resetFilters} aria-label="Reset filters">
                <RotateCcw />
              </Button>
            ) : null}
          </div>
        </div>
        <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
          <Badge variant="secondary">{filteredWorkers.length} / {workers.length} results</Badge>
          <Badge variant="outline">{sortLabel(sort)}</Badge>
          <Badge variant="outline">{registrationLabel(registrationFilter)}</Badge>
          {kind === "workers" ? <Badge variant="outline">{listingLabel(listingFilter)}</Badge> : null}
          <Badge variant="outline">{priceLabel(priceFilter)}</Badge>
          {capabilityFilter !== ALL_CAPABILITIES ? <Badge variant="outline">{capabilityFilter}</Badge> : null}
        </div>
      </div>

      {isEmpty ? (
        <DirectoryEmptyState
          kind={kind}
          hasSourceData={hasSourceData}
          query={query}
          hasActiveFilters={hasActiveFilters}
        />
      ) : (
        view === "grid" ? (
          <div className="lz-grid cols-3">
            {filteredWorkers.map((worker) => (
              <div key={`${worker.source}-${worker.slug}`} className="grid gap-3">
                <WorkerCard worker={worker} timeMode={kind === "marketplace" ? "listed" : "joined"} />
                {kind === "marketplace" ? (
                  <section className="rounded-xl border bg-card/45 p-4">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div className="grid gap-1">
                        <div className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                          Purchase flow
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {worker.price === "not listed"
                            ? "Listing state is unavailable."
                            : `Buy at ${worker.price} and transfer future worker revenue to your wallet.`}
                        </div>
                      </div>
                      <BuyWorkerButton worker={worker} />
                    </div>
                  </section>
                ) : null}
              </div>
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
                <TableHead>{kind === "marketplace" ? "Listed" : "Joined"}</TableHead>
                <TableHead>Rating</TableHead>
                <TableHead>Jobs</TableHead>
                <TableHead>Earned</TableHead>
                <TableHead>Price</TableHead>
                {kind === "marketplace" ? <TableHead>Action</TableHead> : null}
              </TableRow>
            </TableHeader>
            <TableBody>
            {filteredWorkers.map((worker) => (
              <TableRow
                key={`${worker.source}-${worker.slug}`}
                className={isProperlyRegistered(worker) ? "" : "opacity-55 grayscale-[0.45]"}
                aria-disabled={!isProperlyRegistered(worker)}
              >
                  <TableCell className="max-w-[280px] whitespace-normal">
                    <div className="grid gap-1">
                      <div className="font-medium text-foreground">{worker.name}</div>
                      <div className="text-sm text-muted-foreground">{worker.capabilities.join(" • ")}</div>
                    </div>
                  </TableCell>
                  <TableCell>#{worker.tokenId}</TableCell>
                  <TableCell>{worker.ownerShort}</TableCell>
                  <TableCell>{stateLabel(worker.listingStatus ?? "not-listed", worker.memoryStatus)}</TableCell>
                  <TableCell>
                    <RelativeTime
                      value={kind === "marketplace" ? worker.listedAt ?? worker.registeredAt : worker.registeredAt}
                      verb={kind === "marketplace" ? "listed" : "joined"}
                    />
                  </TableCell>
                  <TableCell>{worker.rating.toFixed(2)}</TableCell>
                  <TableCell>{worker.jobsCompleted}</TableCell>
                  <TableCell>{worker.earned} 0G</TableCell>
                  <TableCell>{worker.price}</TableCell>
                  {kind === "marketplace" ? (
                    <TableCell>
                      <BuyWorkerButton worker={worker} compact />
                    </TableCell>
                  ) : null}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )
      )}
    </section>
  );
}

function DirectoryEmptyState({
  kind,
  hasSourceData,
  query,
  hasActiveFilters,
}: {
  kind: DirectoryKind;
  hasSourceData: boolean;
  query: string;
  hasActiveFilters: boolean;
}) {
  const isFiltered = Boolean(query.trim()) || hasActiveFilters;
  const title = kind === "marketplace"
    ? hasSourceData && isFiltered
      ? "No listings match this filter"
      : "No workers are listed right now"
    : hasSourceData && isFiltered
      ? "No workers match this filter"
      : "No workers have been indexed yet";
  const text = kind === "marketplace"
    ? hasSourceData && isFiltered
      ? "Try clearing the search or switching the listing filter to reveal other worker states."
      : "Marketplace inventory will appear here once a real worker listing is active on chain."
    : hasSourceData && isFiltered
      ? "Try broadening the search or returning to all states."
      : "Registered workers will appear here once Galileo contract state and event indexing return entries.";

  return (
    <div className="rounded-xl border border-dashed bg-card/45 p-8 text-center">
      <div className="font-display text-2xl uppercase text-foreground">{title}</div>
      <p className="mx-auto mt-3 max-w-2xl text-sm leading-7 text-muted-foreground">{text}</p>
    </div>
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

function stateLabel(listingStatus: ListingStatus, memoryStatus: DirectoryWorker["memoryStatus"]) {
  if (memoryStatus === "blocked") return "registration incomplete";
  if (listingStatus === "listed") return `listed / ${memoryStatus}`;
  if (listingStatus === "sold") return "sold";
  if (listingStatus === "blocked") return "blocked";
  return `registry / ${memoryStatus}`;
}

function isProperlyRegistered(worker: DirectoryWorker) {
  return (
    worker.memoryStatus !== "blocked" &&
    worker.capabilities.length > 0 &&
    Boolean(worker.owner) &&
    Boolean(worker.tokenId) &&
    !worker.memoryRoot.toLowerCase().includes("unavailable")
  );
}
