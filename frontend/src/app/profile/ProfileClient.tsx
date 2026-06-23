"use client";

import { useEffect, useMemo, useState } from "react";
import { usePrivy, useWallets } from "@privy-io/react-auth";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { WorkerCard } from "@/components/ledger-zero";
import type { DemoFlowReceipt } from "@/lib/demo-flow/types";
import type { AccountSnapshot, DirectoryWorker } from "@/lib/directory";

function sameAddress(a?: string, b?: string) {
  return Boolean(a && b && a.toLowerCase() === b.toLowerCase());
}

function short(address: string) {
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

export function ProfileClient({
  workers,
  latestDemo,
}: {
  workers: DirectoryWorker[];
  latestDemo: DemoFlowReceipt | null;
}) {
  const { ready, authenticated, login, user } = usePrivy();
  const { wallets } = useWallets();
  const address = wallets[0]?.address ?? user?.wallet?.address ?? "";
  const [snapshot, setSnapshot] = useState<AccountSnapshot | null>(null);
  const [snapshotStatus, setSnapshotStatus] = useState<"idle" | "loading" | "ready" | "failed">("idle");

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
      status: worker.listingStatus,
      source: worker.listingSource,
      sellerAddress: worker.sellerAddress,
      saleTx: worker.saleTx,
    }));
    const postedJobs =
      latestDemo && sameAddress(latestDemo.accounts.buyer, address)
        ? [
            {
              id: latestDemo.taskId,
              title: latestDemo.task.title,
              status: "settled",
              payout: latestDemo.economics.taskPayment0G,
              worker: latestDemo.agentName,
              resultRoot: latestDemo.storage.jobResultRoot,
            },
          ]
        : [];
    const earnings0G =
      latestDemo && sameAddress(latestDemo.accounts.newOwner, address) ? latestDemo.economics.bidAmount0G : "0";
    return { ownedWorkers, listings, postedJobs, earnings0G };
  }, [address, latestDemo, snapshot, workers]);

  if (!ready) {
    return <ProfileShell title="Loading wallet state" subtitle="Checking Privy and Galileo wallet state." />;
  }

  if (!authenticated || !address) {
    return (
      <ProfileShell
        title="Connect to view your account"
        subtitle="This profile only shows workers, jobs, listings, and earnings that match the connected wallet address."
      >
        <Button onClick={login}>Connect Wallet</Button>
      </ProfileShell>
    );
  }

  return (
    <div className="grid gap-6" data-testid="connected-profile">
      <section className="grid gap-3 md:grid-cols-4">
        <Summary label="Wallet" value={short(address)} />
        <Summary label="Owned workers" value={String(account.ownedWorkers.length)} />
        <Summary label="Listings" value={String(account.listings.length)} />
        <Summary label="Recorded earnings" value={`${account.earnings0G} 0G`} />
      </section>

      <section className="rounded-xl border bg-card/55 p-4">
        <div className="flex flex-wrap items-start justify-between gap-3 border-b pb-3">
          <div>
            <div className="lz-kicker">Galileo account index</div>
            <h2 className="mt-1 font-display text-2xl uppercase">Direct chain reads</h2>
          </div>
          <Badge variant={snapshotStatus === "ready" ? "default" : "secondary"}>{snapshotStatus}</Badge>
        </div>
        {snapshot?.chain ? (
          <div className="grid gap-2 pt-4 text-sm md:grid-cols-4">
            <FactRow label="Owned token ids" value={snapshot.chain.ownedTokenIds.join(", ") || "none"} />
            <FactRow label="Task posts" value={`${snapshot.chain.postedTasks.length} events`} />
            <FactRow label="Marketplace" value={`${snapshot.chain.marketplace.length} events`} />
            <FactRow label="Releases" value={`${snapshot.chain.releases.length} events`} />
          </div>
        ) : (
          <EmptyState
            label={
              snapshotStatus === "failed"
                ? "Could not load on-chain account events; local receipt data is still shown below."
                : "Waiting for the connected wallet before querying WorkerINFT, Escrow, and Marketplace logs."
            }
            compact
          />
        )}
        {snapshot?.chain?.notes.length ? (
          <div className="mt-3 grid gap-2">
            {snapshot.chain.notes.map((note) => (
              <div key={note} className="rounded-lg border border-amber-400/30 bg-amber-400/10 p-3 text-sm text-amber-100">
                {note}
              </div>
            ))}
          </div>
        ) : null}
      </section>

      <section className="rounded-xl border bg-card/55 p-4">
        <div className="flex flex-wrap items-start justify-between gap-3 border-b pb-3">
          <div>
            <div className="lz-kicker">Owned workers</div>
            <h2 className="mt-1 font-display text-2xl uppercase">Current owner matches</h2>
          </div>
          <Badge variant="secondary">wallet scoped</Badge>
        </div>
        {account.ownedWorkers.length ? (
          <div className="lz-grid cols-3 pt-4">
            {account.ownedWorkers.map((worker) => (
              <WorkerCard key={`${worker.source}-${worker.tokenId}`} worker={worker} />
            ))}
          </div>
        ) : (
          <EmptyState label="No workers in the current local receipt/index match this wallet." />
        )}
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <ProfilePanel title="Posted jobs" count={account.postedJobs.length}>
          {account.postedJobs.length ? (
            account.postedJobs.map((job) => (
              <FactRow key={job.id} label={job.title} value={`${job.status} / ${job.payout} 0G / ${job.worker}`} />
            ))
          ) : (
            <EmptyState label="No posted jobs found for this wallet in the current receipt set." compact />
          )}
        </ProfilePanel>

        <ProfilePanel title="Listings" count={account.listings.length}>
          {account.listings.length ? (
            account.listings.map((listing) => (
              <FactRow
                key={`${listing.source}-${listing.tokenId}`}
                label={`${listing.workerName} #${listing.tokenId}`}
                value={`${listing.status} / ${listing.price} / ${listing.source}`}
              />
            ))
          ) : (
            <EmptyState label="No active, sold, or inactive listing records match this wallet." compact />
          )}
        </ProfilePanel>
      </section>

      <section className="rounded-xl border bg-card/55 p-4 text-sm leading-7 text-muted-foreground">
        This account view is wallet-scoped. It combines direct Galileo event reads with the latest proof
        receipts and seeded demo records, then labels missing live sources instead of hiding them.
      </section>
    </div>
  );
}

function ProfileShell({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children?: React.ReactNode;
}) {
  return (
    <section className="rounded-xl border bg-card/60 p-6" data-testid="profile-empty-state">
      <div className="lz-kicker">Connected profile</div>
      <h2 className="mt-2 font-display text-2xl uppercase">{title}</h2>
      <p className="mt-3 max-w-2xl text-sm leading-7 text-muted-foreground">{subtitle}</p>
      {children ? <div className="mt-4">{children}</div> : null}
    </section>
  );
}

function Summary({ label, value }: { label: string; value: string }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="break-all text-2xl">{value}</CardTitle>
      </CardHeader>
      <CardContent className="text-sm text-muted-foreground">{label}</CardContent>
    </Card>
  );
}

function ProfilePanel({ title, count, children }: { title: string; count: number; children: React.ReactNode }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <Badge variant="secondary">{count} records</Badge>
      </CardHeader>
      <CardContent className="grid gap-2">{children}</CardContent>
    </Card>
  );
}

function FactRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border bg-background/35 p-3 text-sm">
      <div className="font-medium">{label}</div>
      <div className="lz-mono lz-artifact mt-1 text-xs">{value}</div>
    </div>
  );
}

function EmptyState({ label, compact = false }: { label: string; compact?: boolean }) {
  return (
    <div className={`rounded-lg border border-dashed bg-background/25 text-sm text-muted-foreground ${compact ? "p-3" : "mt-4 p-5"}`}>
      {label}
    </div>
  );
}
