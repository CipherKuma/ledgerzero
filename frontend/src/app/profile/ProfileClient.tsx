"use client";

import type { ReactNode } from "react";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { usePrivy, useWallets } from "@privy-io/react-auth";
import { useBalance } from "wagmi";
import { formatUnits } from "viem";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { WorkerCard } from "@/components/ledger-zero";
import { OwnedWorkerListingActions } from "@/components/marketplace/WorkerMarketActions";
import { galileo } from "@/lib/chains";
import type { AccountSnapshot, DirectoryWorker } from "@/lib/directory";

function sameAddress(a?: string, b?: string) {
  return Boolean(a && b && a.toLowerCase() === b.toLowerCase());
}

function short(value: string) {
  return `${value.slice(0, 6)}...${value.slice(-4)}`;
}

function displayBalance(balance?: { value: bigint; decimals: number; symbol: string }) {
  if (!balance) return "... 0G";
  const amount = Number(formatUnits(balance.value, balance.decimals));
  return `${amount.toLocaleString(undefined, { maximumFractionDigits: 5 })} ${balance.symbol}`;
}

export function ProfileClient({
  workers,
}: {
  workers: DirectoryWorker[];
}) {
  const { ready, authenticated, login, user } = usePrivy();
  const { wallets } = useWallets();
  const address = wallets[0]?.address ?? user?.wallet?.address ?? "";
  const typedAddress = address ? (address as `0x${string}`) : undefined;
  const { data: balance } = useBalance({ address: typedAddress, chainId: galileo.id });
  const [snapshot, setSnapshot] = useState<AccountSnapshot | null>(null);
  const [snapshotStatus, setSnapshotStatus] = useState<"idle" | "ready" | "failed">("idle");

  useEffect(() => {
    if (!address) return;

    const controller = new AbortController();
    fetch(`/api/account/${address}`, { signal: controller.signal })
      .then(async (response) => {
        if (!response.ok) throw new Error("account snapshot failed");
        return (await response.json()) as AccountSnapshot;
      })
      .then((next) => {
        setSnapshot(next);
        setSnapshotStatus("ready");
      })
      .catch((error) => {
        if (error.name === "AbortError") return;
        setSnapshot(null);
        setSnapshotStatus("failed");
      });

    return () => controller.abort();
  }, [address]);

  const account = useMemo(() => {
    if (snapshot && sameAddress(snapshot.address, address)) {
      return {
        ownedWorkers: snapshot.ownedWorkers,
        listings: snapshot.listings,
        postedJobs: snapshot.postedJobs.map((job) => ({
          id: job.id,
          title: job.title,
          status: job.status,
          payout: job.payout,
          worker: job.acceptedWorker,
          workerTokenId: job.workerTokenId,
          resultRoot: job.resultRoot,
        })),
        earnings0G: snapshot.earnings0G,
      };
    }

    const ownedWorkers = workers.filter((worker) => sameAddress(worker.ownerAddress, address));
    const listings = workers.filter((worker) => sameAddress(worker.sellerAddress, address)).map((worker) => ({
      workerName: worker.name,
      tokenId: worker.tokenId,
      price: worker.price,
      status: worker.listingStatus ?? "not-listed",
      source: worker.listingSource ?? "none",
      sellerAddress: worker.sellerAddress,
      saleTx: worker.saleTx,
    }));
    return { ownedWorkers, listings, postedJobs: [], earnings0G: "0" };
  }, [address, snapshot, workers]);

  if (!ready) {
    return <ConnectPanel title="Loading wallet state" subtitle="Checking Privy and Galileo wallet state." />;
  }

  if (!authenticated || !address) {
    return (
      <ConnectPanel
        title="Connect your wallet"
        subtitle="Open a wallet session to see owned workers, posted jobs, marketplace listings, and release receipts."
      >
        <Button onClick={login}>Connect wallet</Button>
      </ConnectPanel>
    );
  }

  const summaryItems = [
    { label: "Wallet", value: short(address), tone: "accent" },
    { label: "Balance", value: displayBalance(balance), tone: "default" },
    { label: "Workers", value: String(account.ownedWorkers.length), tone: "default" },
    { label: "Jobs", value: String(account.postedJobs.length), tone: "default" },
    { label: "Listings", value: String(account.listings.length), tone: "default" },
    { label: "Earnings", value: `${account.earnings0G} 0G`, tone: "default" },
  ] as const;
  const snapshotPending = snapshotStatus === "idle";
  const chainEventCount =
    (snapshot?.chain?.marketplace.length ?? 0) +
    (snapshot?.chain?.postedTasks.length ?? 0) +
    (snapshot?.chain?.releases.length ?? 0);
  const ownedWorkerByToken = new Map(account.ownedWorkers.map((ownedWorker) => [ownedWorker.tokenId, ownedWorker]));

  return (
    <div className="grid gap-6" data-testid="connected-profile">
      <section className="grid min-w-0 gap-4 rounded-xl border bg-card/55 p-5 md:grid-cols-2 xl:grid-cols-6">
        {summaryItems.map((item) => (
          <div key={item.label} className="min-w-0 overflow-hidden rounded-lg border bg-background/40 p-4">
            <div className="text-xs uppercase tracking-[0.16em] text-muted-foreground">{item.label}</div>
            <div
              className={
                item.tone === "accent"
                  ? "mt-3 break-words font-display text-[clamp(1.125rem,1.4vw,1.5rem)] uppercase leading-tight text-accent [overflow-wrap:anywhere]"
                  : "mt-3 break-words font-display text-[clamp(1.125rem,1.4vw,1.5rem)] uppercase leading-tight text-foreground [overflow-wrap:anywhere]"
              }
            >
              {item.value}
            </div>
          </div>
        ))}
      </section>

      <div className="flex justify-center">
        <Badge variant={snapshotStatus === "failed" ? "destructive" : "secondary"}>
          {snapshotStatus === "ready"
            ? "Chain snapshot ready"
            : snapshotStatus === "failed"
              ? "Snapshot unavailable"
              : "Syncing account"}
        </Badge>
      </div>

      <Tabs defaultValue="workers" className="gap-6">
        <TabsList className="mx-auto w-fit max-w-full justify-center">
          <TabsTrigger value="workers">Workers</TabsTrigger>
          <TabsTrigger value="jobs">Jobs</TabsTrigger>
          <TabsTrigger value="listings">Listings</TabsTrigger>
          <TabsTrigger value="earnings">Earnings</TabsTrigger>
          <TabsTrigger value="chain">Chain</TabsTrigger>
        </TabsList>

        <TabsContent value="workers">
          {snapshotPending ? (
            <WorkersLoadingGrid />
          ) : account.ownedWorkers.length ? (
            <div className="lz-grid cols-3">
              {account.ownedWorkers.map((worker) => (
                <div key={`${worker.source}-${worker.tokenId}`} className="grid gap-3">
                  <WorkerCard worker={worker} />
                  <section className="rounded-xl border bg-card/45 p-4">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div className="grid gap-1">
                        <div className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                          Marketplace control
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {worker.listingStatus === "listed"
                            ? `Live at ${worker.price}. You can cancel the listing if you want to keep the worker.`
                            : "List this worker for sale directly from your connected owner wallet."}
                        </div>
                      </div>
                      <OwnedWorkerListingActions worker={worker} />
                    </div>
                  </section>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState
              title="No owned workers yet"
              text="Workers that resolve to this connected wallet will appear here after registration or purchase."
            />
          )}
        </TabsContent>

        <TabsContent value="jobs">
          <DataSurface
            title="Posted jobs"
            subtitle="Escrow tasks created by this connected wallet."
            empty={!snapshotPending && !account.postedJobs.length}
            emptyTitle="No posted jobs"
            emptyText="Jobs posted by this wallet will appear here once task escrow is created."
          >
            {snapshotPending ? (
              <TableLoading rows={4} columns={5} />
            ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Job</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Payout</TableHead>
                  <TableHead>Worker</TableHead>
                  <TableHead>Result root</TableHead>
                </TableRow>
              </TableHeader>
                <TableBody>
                  {account.postedJobs.map((job) => (
                    <TableRow key={job.id}>
                      <TableCell className="font-medium">
                        <Link
                          href={`/jobs/${job.id}`}
                          className="text-foreground underline-offset-4 transition hover:text-accent hover:underline"
                        >
                          {job.title}
                        </Link>
                      </TableCell>
                      <TableCell>{job.status}</TableCell>
                      <TableCell>{job.payout}</TableCell>
                      <TableCell>
                        {job.workerTokenId ? (
                          <Link
                            href={`/agent/token-${job.workerTokenId}`}
                            className="text-foreground underline-offset-4 transition hover:text-accent hover:underline"
                          >
                            {job.worker}
                          </Link>
                        ) : (
                          job.worker
                        )}
                      </TableCell>
                      <TableCell className="lz-mono max-w-[280px] truncate text-xs">{job.resultRoot}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </DataSurface>
        </TabsContent>

        <TabsContent value="listings">
          <DataSurface
            title="Marketplace listings"
            subtitle="Listings posted by this wallet across active and historical states."
            empty={!snapshotPending && !account.listings.length}
            emptyTitle="No listings"
            emptyText="Listings created by this wallet will appear here after a worker is listed for sale."
          >
            {snapshotPending ? (
              <TableLoading rows={4} columns={5} />
            ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Worker</TableHead>
                  <TableHead>Token</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead>Source</TableHead>
                  <TableHead>Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {account.listings.map((listing) => (
                  <TableRow key={`${listing.source}-${listing.tokenId}`}>
                    <TableCell className="font-medium">
                      <Link
                        href={`/agent/token-${listing.tokenId}`}
                        className="text-foreground underline-offset-4 transition hover:text-accent hover:underline"
                      >
                        {listing.workerName}
                      </Link>
                    </TableCell>
                    <TableCell>
                      <Link
                        href={`/agent/token-${listing.tokenId}`}
                        className="underline-offset-4 transition hover:text-accent hover:underline"
                      >
                        #{listing.tokenId}
                      </Link>
                    </TableCell>
                    <TableCell>
                      <Link
                        href={listing.status === "listed" ? "/marketplace" : listing.saleTx ? "/proof" : `/agent/token-${listing.tokenId}`}
                        className="underline-offset-4 transition hover:text-accent hover:underline"
                      >
                        {listing.status}
                      </Link>
                    </TableCell>
                    <TableCell>{listing.price}</TableCell>
                    <TableCell>{listing.source}</TableCell>
                    <TableCell>
                      {ownedWorkerByToken.get(listing.tokenId) ? (
                        <OwnedWorkerListingActions worker={ownedWorkerByToken.get(listing.tokenId)!} />
                      ) : (
                        <span className="text-sm text-muted-foreground">Worker no longer owned by this wallet.</span>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            )}
          </DataSurface>
        </TabsContent>

        <TabsContent value="earnings">
          <section className="grid gap-4 md:grid-cols-3">
            {snapshotPending ? (
              <>
                <MetricLoading />
                <MetricLoading />
                <MetricLoading />
              </>
            ) : (
              <>
                <MetricTile label="Recorded earnings" value={`${account.earnings0G} 0G`} />
                <MetricTile label="Release events" value={String(snapshot?.chain?.releases.length ?? 0)} />
                <MetricTile label="Payout rule" value="ownerOf(workerTokenId)" />
              </>
            )}
          </section>
        </TabsContent>

        <TabsContent value="chain">
          <div className="grid gap-4">
            <section className="grid gap-4 md:grid-cols-4">
              {snapshotPending ? (
                <>
                  <MetricLoading />
                  <MetricLoading />
                  <MetricLoading />
                  <MetricLoading />
                </>
              ) : (
                <>
                  <MetricTile label="Owned token ids" value={snapshot?.chain?.ownedTokenIds.join(", ") || "none"} />
                  <MetricTile label="Task posts" value={String(snapshot?.chain?.postedTasks.length ?? 0)} />
                  <MetricTile label="Marketplace" value={String(snapshot?.chain?.marketplace.length ?? 0)} />
                  <MetricTile label="Releases" value={String(snapshot?.chain?.releases.length ?? 0)} />
                </>
              )}
            </section>

            <DataSurface
              title="Galileo event feed"
              subtitle="Direct account-scoped reads for marketplace, job, and release activity."
              empty={!snapshotPending && (!snapshot?.chain || chainEventCount === 0)}
              emptyTitle={snapshot?.chain ? "No chain activity yet" : "Chain snapshot unavailable"}
              emptyText={
                snapshot?.chain
                  ? "Marketplace events, task posts, and release receipts for this wallet will appear here once the chain has matching activity."
                  : "Reconnect or retry once the account snapshot endpoint responds again."
              }
            >
              {snapshotPending ? (
                <TableLoading rows={6} columns={4} />
              ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Type</TableHead>
                    <TableHead>Token / task</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Tx</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {snapshot?.chain?.marketplace.slice(0, 8).map((event) => (
                    <TableRow key={`${event.txHash}-${event.tokenId}-${event.status}`}>
                      <TableCell>Marketplace</TableCell>
                      <TableCell>#{event.tokenId}</TableCell>
                      <TableCell>{event.status}</TableCell>
                      <TableCell className="lz-mono max-w-[280px] truncate text-xs">{event.txHash}</TableCell>
                    </TableRow>
                  ))}
                  {snapshot?.chain?.postedTasks.slice(0, 8).map((event) => (
                    <TableRow key={event.txHash}>
                      <TableCell>Task</TableCell>
                      <TableCell>{event.taskId}</TableCell>
                      <TableCell>posted</TableCell>
                      <TableCell className="lz-mono max-w-[280px] truncate text-xs">{event.txHash}</TableCell>
                    </TableRow>
                  ))}
                  {snapshot?.chain?.releases.slice(0, 8).map((event) => (
                    <TableRow key={event.txHash}>
                      <TableCell>Release</TableCell>
                      <TableCell>{event.taskId}</TableCell>
                      <TableCell>paid</TableCell>
                      <TableCell className="lz-mono max-w-[280px] truncate text-xs">{event.txHash}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              )}
            </DataSurface>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function WorkersLoadingGrid() {
  return (
    <div className="lz-grid cols-3">
      {Array.from({ length: 3 }).map((_, index) => (
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
  );
}

function TableLoading({ rows, columns }: { rows: number; columns: number }) {
  return (
    <div className="grid gap-3">
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <div key={rowIndex} className="grid gap-3 rounded-xl border bg-background/35 p-4" style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}>
          {Array.from({ length: columns }).map((__, colIndex) => (
            <Skeleton key={colIndex} className="h-4 w-full" />
          ))}
        </div>
      ))}
    </div>
  );
}

function MetricLoading() {
  return (
    <div className="rounded-xl border bg-card/55 p-4">
      <Skeleton className="h-3 w-24" />
      <Skeleton className="mt-3 h-7 w-20" />
    </div>
  );
}

function ConnectPanel({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children?: ReactNode;
}) {
  return (
    <section className="rounded-xl border bg-card/55 p-8 text-center">
      <div className="mx-auto grid max-w-xl gap-4">
        <div className="font-display text-3xl uppercase text-foreground">{title}</div>
        <p className="text-sm leading-7 text-muted-foreground">{subtitle}</p>
        {children ? <div className="flex justify-center">{children}</div> : null}
      </div>
    </section>
  );
}

function EmptyState({ title, text }: { title: string; text: string }) {
  return (
    <div className="rounded-xl border border-dashed bg-background/30 p-8 text-center">
      <div className="font-display text-2xl uppercase text-foreground">{title}</div>
      <p className="mx-auto mt-3 max-w-2xl text-sm leading-7 text-muted-foreground">{text}</p>
    </div>
  );
}

function DataSurface({
  title,
  subtitle,
  empty,
  emptyTitle,
  emptyText,
  children,
}: {
  title: string;
  subtitle: string;
  empty: boolean;
  emptyTitle: string;
  emptyText: string;
  children: ReactNode;
}) {
  return (
    <section className="rounded-xl border bg-card/55 p-5">
      <div className="mb-5 grid gap-2">
        <div className="font-display text-2xl uppercase text-foreground">{title}</div>
        <div className="text-sm text-muted-foreground">{subtitle}</div>
      </div>
      {empty ? <EmptyState title={emptyTitle} text={emptyText} /> : children}
    </section>
  );
}

function MetricTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0 overflow-hidden rounded-xl border bg-card/55 p-5">
      <div className="text-xs uppercase tracking-[0.16em] text-muted-foreground">{label}</div>
      <div className="mt-3 break-words font-display text-[clamp(1.125rem,2vw,1.5rem)] uppercase leading-tight text-foreground [overflow-wrap:anywhere]">
        {value}
      </div>
    </div>
  );
}
