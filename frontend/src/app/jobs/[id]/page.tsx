import { Shell } from "@/components/Shell";
import { DemoMoment, JobCard, PageHeader } from "@/components/ledger-zero";
import { readLatestDemoFlow } from "@/lib/demo-flow/run";
import { getJob, transferDemo } from "@/lib/ledger-zero";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { DemoFlowClient } from "./DemoFlowClient";

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
  const job = getJob(id);
  const latestDemo = await readLatestDemoFlow();
  const displayJob = latestDemo
    ? {
        ...job,
        title: latestDemo.task.title,
        category: latestDemo.task.category,
        payout: `${latestDemo.economics.taskPayment0G} 0G`,
        bond: `${latestDemo.economics.bondAmount0G} 0G`,
        minReputation: "demo configured",
        status: "settled",
        acceptedWorker: latestDemo.agentName,
        resultRoot: `0g://${latestDemo.storage.jobResultRoot}`,
        bids: [{ worker: latestDemo.agentName, amount: `${latestDemo.economics.bidAmount0G} 0G`, score: "live" }],
      }
    : job;

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
        Bids, accepted worker, compute state, result root, release payment action, and transfer impact
        are shown together so the buyer can make the settlement decision.
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
          <DemoFlowClient job={displayJob} latestDemo={latestDemo} />
          <DemoMoment {...transferDemo} />
        </div>
      </section>
    </Shell>
  );
}
