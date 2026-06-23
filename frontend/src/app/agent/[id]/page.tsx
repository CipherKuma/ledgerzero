import { Shell } from "@/components/Shell";
import { ArtifactCallout, PageHeader, StatusBadge } from "@/components/ledger-zero";
import { getWorker, proofArtifacts } from "@/lib/ledger-zero";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default async function WorkerPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const worker = getWorker(id);
  const proofRows = proofArtifacts.filter((artifact) =>
    ["0G Chain", "0G Storage", "Transfer receipt", "ERC8004"].includes(artifact.layer),
  );

  return (
    <Shell>
      <PageHeader
        kicker={`Worker token #${worker.tokenId}`}
        title={worker.name}
        image={{
          src: worker.image.src,
          alt: worker.image.alt,
        }}
      >
        {worker.summary}
      </PageHeader>
      <section className="lz-section">
        <div className="lz-container">
          <Tabs defaultValue="overview">
            <TabsList>
              {["overview", "capabilities", "memory", "jobs", "reputation", "ownership", "proof"].map((tab) => (
                <TabsTrigger key={tab} value={tab}>
                  {tab}
                </TabsTrigger>
              ))}
            </TabsList>
            <TabsContent value="overview">
              <Card>
                <CardHeader>
                  <CardTitle>Current worker state</CardTitle>
                </CardHeader>
                <CardContent className="grid gap-4 md:grid-cols-3">
                  <Fact label="Owner" value={worker.ownerShort} mono />
                  <Fact label="Earned" value={`${worker.earned} 0G`} />
                  <Fact label="List price" value={worker.price} />
                  <Fact label="Jobs completed" value={String(worker.jobsCompleted)} />
                  <Fact label="Rating" value={`${worker.rating.toFixed(2)} / 5`} />
                  <Fact label="Memory root status" value={worker.memoryStatus} />
                </CardContent>
              </Card>
            </TabsContent>
            <TabsContent value="capabilities">
              <Card>
                <CardHeader>
                  <CardTitle>LedgerCapabilityRegistry</CardTitle>
                </CardHeader>
                <CardContent className="flex flex-wrap gap-2">
                  {worker.capabilities.map((capability) => (
                    <Badge key={capability} variant="outline">
                      {capability}
                    </Badge>
                  ))}
                </CardContent>
              </Card>
            </TabsContent>
            <TabsContent value="memory">
              <ArtifactCallout>
                <span className="font-medium text-foreground">0G Storage memory root:</span>{" "}
                <span className="lz-mono">{worker.memoryRoot}</span>. The encrypted intelligence moves with
                the worker transfer receipt.
              </ArtifactCallout>
            </TabsContent>
            <TabsContent value="jobs">
              <Card>
                <CardContent className="pt-6 text-sm text-muted-foreground">
                  {worker.jobsCompleted} completed jobs are summarized for the demo. Live job history should be
                  read from LedgerEscrow events when a deployed pure-0G index is available.
                </CardContent>
              </Card>
            </TabsContent>
            <TabsContent value="reputation">
              <Card>
                <CardContent className="pt-6">
                  <div className="text-3xl font-semibold">{worker.rating.toFixed(2)} / 5</div>
                  <p className="mt-2 text-sm text-muted-foreground">
                    ERC8004 reputation is deployed on Galileo; the Proof tab shows the latest live project-wallet flow.
                  </p>
                </CardContent>
              </Card>
            </TabsContent>
            <TabsContent value="ownership">
              <Card>
                <CardHeader>
                  <CardTitle>Owner controls future payouts</CardTitle>
                </CardHeader>
                <CardContent className="flex flex-col gap-3 text-sm">
                  <Fact label="Current owner" value={worker.owner} mono />
                  <Fact label="Payout rule" value="LedgerEscrow.payoutRecipient(taskId) resolves ownerOf(workerTokenId)" />
                </CardContent>
              </Card>
            </TabsContent>
            <TabsContent value="proof">
              <div className="lz-grid">
                {proofRows.map((artifact) => (
                  <Card key={`${artifact.layer}-${artifact.artifact}`}>
                    <CardHeader>
                      <CardTitle>{artifact.artifact}</CardTitle>
                    </CardHeader>
                    <CardContent className="flex flex-col gap-2 text-sm">
                      <span className="lz-mono lz-artifact">{artifact.value}</span>
                      <StatusBadge status={artifact.status} />
                      <p className="text-muted-foreground">{artifact.note}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </section>
    </Shell>
  );
}

function Fact({ label, value, mono = false }: { label: string; value: string; mono?: boolean }) {
  return (
    <div>
      <div className="text-xs font-medium uppercase text-muted-foreground">{label}</div>
      <div className={mono ? "lz-mono lz-artifact mt-1" : "mt-1 font-medium"}>{value}</div>
    </div>
  );
}
