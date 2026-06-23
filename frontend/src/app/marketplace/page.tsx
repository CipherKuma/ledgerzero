import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Shell } from "@/components/Shell";
import { WorkerCard } from "@/components/ledger-zero";
import { Button } from "@/components/ui/button";
import { buildWorkerDirectory } from "@/lib/directory";
import { readLatestDemoFlow } from "@/lib/demo-flow/run";

export const dynamic = "force-dynamic";

function short(address: string) {
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

export default async function MarketplacePage() {
  const directory = await buildWorkerDirectory();
  const listedWorkers = directory.filter((worker) => worker.listingStatus === "listed");
  const totalEarned = listedWorkers.reduce((total, worker) => total + Number(worker.earned), 0);
  const latestDemo = await readLatestDemoFlow();
  const purchaseTx = latestDemo?.chainTxs.find((tx) => tx.label === "purchase worker token");
  const transferTx = latestDemo?.chainTxs.find((tx) => tx.label === "transfer worker token");

  return (
    <Shell>
      <section className="lz-section">
        <div className="lz-container grid gap-8">
          <div className="mx-auto grid w-full max-w-3xl justify-items-center gap-5 text-center">
            <div className="relative aspect-[5/6] w-full max-w-[260px] overflow-hidden rounded-xl border bg-card shadow-[0_0_70px_color-mix(in_srgb,var(--cobalt)_30%,transparent)]">
              <Image
                src="/page-heroes/workers.jpg"
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
              <p className="mt-4 max-w-2xl text-sm leading-7 text-muted-foreground">
                Only active listings appear here. Sold, inactive, and unlisted registered workers stay in
                the worker registry until a live marketplace listing exists.
              </p>
            </div>
            <div className="grid w-full gap-3 sm:grid-cols-3">
              <MarketFact label="Listed workers" value={String(listedWorkers.length)} />
              <MarketFact label="Total earned" value={`${totalEarned.toFixed(2)} 0G`} />
              <MarketFact label="Listing source" value="receipt / registry" />
            </div>
            <Link className="inline-flex" href="/post">
              <Button variant="outline">
                Post demand
                <ArrowRight data-icon="inline-end" />
              </Button>
            </Link>
          </div>

          <div className="lz-grid cols-3">
            {listedWorkers.map((worker) => (
              <WorkerCard key={worker.slug} worker={worker} />
            ))}
          </div>

          {latestDemo ? (
            <section
              id="latest-sale"
              className="grid gap-4 rounded-xl border border-accent/45 bg-card/65 p-4"
              data-testid="marketplace-latest-sale"
            >
              <div className="grid gap-4 lg:grid-cols-[minmax(0,0.8fr)_1fr] lg:items-start">
                <div>
                  <div className="lz-kicker">Latest full-flow sale receipt</div>
                  <h2 className="mt-2 font-display text-2xl uppercase">{latestDemo.agentName}</h2>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">
                    This receipt proves payment, transfer, and future payout routing. Canonical
                    marketplace listing buys use the LedgerMarketplace contract after redeploy.
                  </p>
                </div>
                <div className="grid gap-3 sm:grid-cols-3">
                  <MarketFact label="Token" value={`#${latestDemo.tokenId}`} />
                  <MarketFact label="Listed at" value={`${latestDemo.economics.salePrice0G} 0G`} />
                  <MarketFact label="Demo paid" value={`${latestDemo.economics.purchasePayment0G} 0G`} />
                </div>
              </div>
              <div className="grid gap-3 text-sm md:grid-cols-2">
                <SaleFact label="Seller/operator" value={latestDemo.accounts.operator} />
                <SaleFact label="Purchaser/new owner" value={latestDemo.accounts.newOwner} />
                <SaleFact label="Purchase tx" value={purchaseTx ? `${short(purchaseTx.hash)} / block ${purchaseTx.block}` : "pending"} />
                <SaleFact label="Transfer tx" value={transferTx ? `${short(transferTx.hash)} / block ${transferTx.block}` : "pending"} />
                <SaleFact label="Future payout owner" value={latestDemo.economics.payoutRecipientAfterTransfer} />
                <SaleFact label="Revenue rule" value="ownerOf(workerTokenId)" />
              </div>
            </section>
          ) : null}
        </div>
      </section>
    </Shell>
  );
}

function SaleFact({ label, value }: { label: string; value: string }) {
  return (
    <div className="border-t pt-3">
      <div className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">{label}</div>
      <div className="lz-mono lz-artifact mt-1 break-all">{value}</div>
    </div>
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
