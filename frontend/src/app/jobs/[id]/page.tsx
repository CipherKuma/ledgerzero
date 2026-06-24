import { Shell } from "@/components/Shell";
import { DemoMoment, JobCard, PageHeader } from "@/components/ledger-zero";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { DemoFlowClient } from "./DemoFlowClient";
import { JobLifecycleActions } from "./JobLifecycleActions";
import { getOnChainJob } from "@/lib/onchain-data";

const lifecycle = [
  "posted",
  "bidding",
  "accepted",
  "running on 0G Compute",
  "output stored",
  "settled",
  "reputation updated",
];

export default async function JobPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const displayJob = await getOnChainJob(id);
  if (!displayJob) {
    return (
      <Shell>
        <section className="lz-section">
          <div className="lz-container">
            <div className="rounded-xl border border-dashed bg-card/40 p-8 text-center">
              <div className="font-display text-2xl uppercase">Job not found on chain</div>
              <p className="mt-3 text-sm leading-7 text-muted-foreground">
                This page now renders only escrow tasks that can be resolved from Galileo state.
              </p>
            </div>
          </div>
        </section>
      </Shell>
    );
  }

  return (
    <Shell>
      <PageHeader
        kicker="Job room"
        title={displayJob.title}
        image={{
          src: "/page-heroes/jobs.jpg",
          alt: "CRT worker queue artwork representing the 0G task lifecycle",
        }}
      >
        This room is sourced from on-chain escrow data only. If title, category, or bid history were never
        committed to chain, the UI stays sparse rather than inventing it.
      </PageHeader>
      <section className="lz-section">
        <div className="lz-container lz-grid">
          <JobCard job={displayJob} />
          <Card>
            <CardHeader>
              <CardTitle>Lifecycle</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              <Progress value={58} />
              <div className="flex flex-wrap gap-2">
                {lifecycle.map((step) => (
                  <Badge key={step} variant={step === displayJob.status ? "default" : "outline"}>
                    {step}
                  </Badge>
                ))}
              </div>
              <div className="lz-panel rounded-lg p-4 text-sm">
                <div className="font-medium">Result root</div>
                <div className="lz-mono lz-artifact mt-1">{displayJob.resultRoot}</div>
              </div>
            </CardContent>
          </Card>
          <JobLifecycleActions job={displayJob} />
          <DemoFlowClient job={displayJob} latestDemo={null} />
          <DemoMoment
            ownerBefore={displayJob.workerAddress ?? "unassigned"}
            ownerAfter={displayJob.workerAddress ?? "unassigned"}
            taskId={displayJob.id}
            payoutRecipientBefore={displayJob.acceptedWorker}
            payoutRecipientAfter={displayJob.acceptedWorker}
            releaseTx={displayJob.releaseTx}
          />
        </div>
      </section>
    </Shell>
  );
}
