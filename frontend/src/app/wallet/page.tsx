import { Shell } from "@/components/Shell";
import { PageHeader, WorkerCard } from "@/components/ledger-zero";
import { readLatestDemoFlow } from "@/lib/demo-flow/run";
import { jobs, transferDemo, workers } from "@/lib/ledger-zero";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const dynamic = "force-dynamic";

function short(address: string) {
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

export default async function WalletPage() {
  const latestDemo = await readLatestDemoFlow();
  const displayedOwner = latestDemo?.accounts.newOwner ?? transferDemo.ownerAfter;
  const displayedPayout = latestDemo?.economics.payoutRecipientAfterTransfer ?? transferDemo.payoutRecipientAfter;

  return (
    <Shell>
      <PageHeader
        kicker="Demo wallet"
        title="Latest receipt state for workers, payouts, and memory roots."
        image={{
          src: "/page-heroes/workers.jpg",
          alt: "Crystalline worker artwork representing owned AI workers and future payouts",
        }}
      >
        This view is backed by the latest Ledger Zero demo receipt. It shows the worker token,
        transfer path, escrow release, payout owner, and memory artifacts recorded by the project
        test wallet rather than pretending a browser wallet owns this state.
      </PageHeader>
      <section className="lz-section">
        <div className="lz-container lz-grid cols-3">
          <Summary label="Receipt worker tokens" value="1" />
          <Summary label="Latest released payout" value={`${latestDemo?.economics.bidAmount0G ?? "2.4"} 0G`} />
          <Summary label="Latest receipt owner" value={short(displayedOwner)} />
        </div>
      </section>
      <section className="lz-section">
        <div className="lz-container lz-grid cols-2">
          <WorkerCard worker={workers[0]} />
          <Card>
            <CardHeader>
              <CardTitle>Latest transfer proof</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-3 text-sm">
              <div className="lz-mono lz-artifact">from {latestDemo?.accounts.operator ?? transferDemo.ownerBefore}</div>
              <div className="lz-mono lz-artifact">to {displayedOwner}</div>
              <div>Next payout routes to {displayedPayout}</div>
              <div>Active jobs: {jobs.length}</div>
            </CardContent>
          </Card>
        </div>
      </section>
      {latestDemo ? (
        <section className="lz-section">
          <div className="lz-container">
            <Card data-testid="wallet-latest-demo-revenue">
              <CardHeader>
                <CardTitle>New owner revenue receipt</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-4 text-sm md:grid-cols-3">
                <RevenueFact label="Worker token" value={`#${latestDemo.tokenId}`} />
                <RevenueFact label="Task buyer" value={latestDemo.accounts.buyer} />
                <RevenueFact label="Receipt owner" value={latestDemo.accounts.newOwner} />
                <RevenueFact label="Before release" value={`${latestDemo.economics.newOwnerBalanceBefore0G} 0G`} />
                <RevenueFact label="After release" value={`${latestDemo.economics.newOwnerBalanceAfter0G} 0G`} />
                <RevenueFact label="Revenue rule" value="ownerOf(workerTokenId)" />
              </CardContent>
            </Card>
          </div>
        </section>
      ) : null}
    </Shell>
  );
}

function Summary({ label, value }: { label: string; value: string }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-3xl">{value}</CardTitle>
      </CardHeader>
      <CardContent className="text-sm text-muted-foreground">{label}</CardContent>
    </Card>
  );
}

function RevenueFact({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">{label}</div>
      <div className="lz-mono lz-artifact mt-1 break-all">{value}</div>
    </div>
  );
}
