import { Shell } from "@/components/Shell";
import { ArtifactCallout, PageHeader, StatusBadge } from "@/components/ledger-zero";
import { getWorker, proofArtifacts } from "@/lib/ledger-zero";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

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
              {["overview", "memory", "jobs", "proof"].map((tab) => (
                <TabsTrigger key={tab} value={tab}>
                  {tab}
                </TabsTrigger>
              ))}
            </TabsList>

            <TabsContent value="overview">
              <div className="grid gap-5">
                <section className="grid gap-4 rounded-xl border bg-card/55 p-5 lg:grid-cols-[minmax(0,0.9fr)_minmax(280px,0.42fr)]">
                  <div className="grid gap-4">
                    <div>
                      <div className="lz-kicker">Overview</div>
                      <h2 className="mt-2 font-display text-2xl uppercase text-foreground">
                        Capability, trust, and payout state in one view.
                      </h2>
                      <p className="mt-3 max-w-2xl text-sm leading-7 text-muted-foreground">
                        This worker page should read like a portfolio dossier. What it does, how it has
                        performed, who owns the upside, and what proofs back those claims all sit here.
                      </p>
                    </div>

                    <div className="grid gap-3 md:grid-cols-3">
                      <OverviewMetric label="Jobs completed" value={String(worker.jobsCompleted)} />
                      <OverviewMetric label="Reputation" value={`${worker.rating.toFixed(2)} / 5`} />
                      <OverviewMetric label="Earned" value={`${worker.earned} 0G`} />
                    </div>

                    <div className="grid gap-4 rounded-xl border bg-background/40 p-4">
                      <div className="font-display text-xl uppercase text-foreground">Capabilities</div>
                      <div className="flex flex-wrap gap-2">
                        {worker.capabilities.map((capability) => (
                          <Badge key={capability} variant="outline">
                            {capability}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="grid gap-4 rounded-xl border bg-background/40 p-5">
                    <div className="font-display text-xl uppercase text-foreground">Ownership and revenue</div>
                    <Fact label="Current owner" value={worker.owner} mono />
                    <Fact label="List price" value={worker.price} />
                    <Fact
                      label="Payout rule"
                      value="LedgerEscrow.payoutRecipient(taskId) resolves ownerOf(workerTokenId)"
                    />
                    <Fact label="Memory root status" value={worker.memoryStatus} />
                  </div>
                </section>

                <section className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(280px,0.42fr)]">
                  <Card>
                    <CardHeader>
                      <CardTitle>Recent work history</CardTitle>
                    </CardHeader>
                    <CardContent className="grid gap-3">
                      {worker.history.map((job) => (
                        <div key={job.id} className="rounded-xl border bg-background/35 p-4">
                          <div className="flex flex-wrap items-start justify-between gap-3">
                            <div className="grid gap-1">
                              <div className="font-medium text-foreground">{job.title}</div>
                              <div className="text-sm text-muted-foreground">
                                {job.category} · {job.completedAt} · {job.buyer}
                              </div>
                            </div>
                            <div className="flex flex-wrap gap-2">
                              <Badge variant="secondary">{job.status}</Badge>
                              <Badge variant="outline">{job.payout}</Badge>
                            </div>
                          </div>
                          <p className="mt-3 text-sm leading-7 text-muted-foreground">{job.result}</p>
                          <div className="mt-3 text-xs uppercase tracking-[0.14em] text-accent">
                            Proof root
                          </div>
                          <div className="lz-mono lz-artifact mt-1 text-sm text-foreground">{job.proof}</div>
                        </div>
                      ))}
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Reputation read</CardTitle>
                    </CardHeader>
                    <CardContent className="grid gap-4 text-sm">
                      <div className="font-display text-4xl uppercase text-foreground">
                        {worker.rating.toFixed(2)}
                      </div>
                      <p className="leading-7 text-muted-foreground">
                        ERC8004 reputation is live on Galileo. The current score reflects successful work,
                        clean releases, and the latest ownership-aware payout flow.
                      </p>
                      <div className="rounded-xl border bg-background/35 p-4">
                        <div className="text-xs uppercase tracking-[0.14em] text-muted-foreground">
                          Why this score exists
                        </div>
                        <ul className="mt-3 grid gap-2 text-sm text-muted-foreground">
                          <li>Released escrow receipts recorded against the worker token</li>
                          <li>Stored memory and result bundles preserved after delivery</li>
                          <li>Ownership transfer keeps future payout routing honest</li>
                        </ul>
                      </div>
                    </CardContent>
                  </Card>
                </section>
              </div>
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
                <CardHeader>
                  <CardTitle>Job history ledger</CardTitle>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Job</TableHead>
                        <TableHead>Category</TableHead>
                        <TableHead>Completed</TableHead>
                        <TableHead>Buyer</TableHead>
                        <TableHead>Payout</TableHead>
                        <TableHead>Proof</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {worker.history.map((job) => (
                        <TableRow key={job.id}>
                          <TableCell className="max-w-[280px] whitespace-normal">
                            <div className="grid gap-1">
                              <div className="font-medium text-foreground">{job.title}</div>
                              <div className="text-sm text-muted-foreground">{job.result}</div>
                            </div>
                          </TableCell>
                          <TableCell>{job.category}</TableCell>
                          <TableCell>{job.completedAt}</TableCell>
                          <TableCell>{job.buyer}</TableCell>
                          <TableCell>{job.payout}</TableCell>
                          <TableCell className="lz-mono max-w-[220px] truncate text-xs">{job.proof}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
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

function OverviewMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border bg-background/35 p-4">
      <div className="text-xs uppercase tracking-[0.14em] text-muted-foreground">{label}</div>
      <div className="mt-2 font-display text-2xl uppercase text-foreground">{value}</div>
    </div>
  );
}
