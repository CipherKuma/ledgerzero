import Link from "next/link";
import Image from "next/image";
import { ArrowRight, Database, ShieldCheck, WalletCards } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { Job, ProofArtifact, StatusKind, Worker } from "@/lib/ledger-zero";

export function StatusBadge({ status }: { status: StatusKind }) {
  const variant =
    status === "live" ? "default" : status === "blocked" ? "destructive" : "secondary";
  return <Badge variant={variant}>{status}</Badge>;
}

export function PageHeader({
  kicker,
  title,
  image,
  children,
}: {
  kicker: string;
  title: string;
  image?: {
    src: string;
    alt: string;
    position?: string;
  };
  children: React.ReactNode;
}) {
  return (
    <section className="lz-section lz-page-header">
      <div
        className={
          image
            ? "lz-container grid items-center gap-7 sm:grid-cols-[minmax(0,0.95fr)_minmax(180px,0.42fr)] lg:grid-cols-[minmax(0,0.95fr)_minmax(280px,0.42fr)]"
            : "lz-container flex flex-col gap-4"
        }
      >
        <div className="flex flex-col gap-4">
          <div className="lz-kicker">{kicker}</div>
          <h1 className="lz-page-title">{title}</h1>
          <div className="lz-subcopy">{children}</div>
        </div>
        {image ? (
          <div
            className="lz-page-hero-image relative aspect-[5/6] w-full max-w-[420px] justify-self-center overflow-hidden rounded-xl border bg-card sm:justify-self-end"
            style={{
              borderColor: "color-mix(in srgb, var(--accent) 20%, var(--cobalt) 46%)",
              boxShadow:
                "inset 0 0 0 1px color-mix(in srgb, white 8%, transparent), 0 0 70px color-mix(in srgb, var(--cobalt) 34%, transparent), 0 0 46px color-mix(in srgb, var(--primary) 12%, transparent)",
            }}
          >
            <Image
              src={image.src}
              alt={image.alt}
              fill
              className="object-cover contrast-[1.08] saturate-[1.08]"
              priority={false}
              sizes="(min-width: 1024px) 34vw, (min-width: 640px) 32vw, min(100vw - 32px, 420px)"
              style={{ objectPosition: image.position ?? "50% 50%" }}
            />
          </div>
        ) : null}
      </div>
    </section>
  );
}

export function MetricStrip({
  items,
}: {
  items: Array<{ label: string; value: string; status?: StatusKind }>;
}) {
  return (
    <section className="lz-section">
      <div className="lz-container lz-grid cols-3">
        {items.map((item) => (
          <Card key={item.label} size="sm">
            <CardHeader>
              <CardDescription>{item.label}</CardDescription>
              <CardTitle className="text-3xl">{item.value}</CardTitle>
              {item.status ? (
                <CardAction>
                  <StatusBadge status={item.status} />
                </CardAction>
              ) : null}
            </CardHeader>
          </Card>
        ))}
      </div>
    </section>
  );
}

export function WorkerCard({ worker }: { worker: Worker }) {
  const listingStatus = worker.listingStatus ?? (worker.listed ? "listed" : "not-listed");
  const listingSource = worker.listingSource ?? (worker.listed ? "seeded-demo" : "none");
  return (
    <Card className="group/card h-full overflow-hidden">
      <div className="relative aspect-[4/3] border-b border-border bg-card">
        <Image
          src={worker.image.src}
          alt={worker.image.alt}
          fill
          className="object-cover transition duration-500 group-hover/card:scale-[1.03]"
          sizes="(min-width: 900px) 31vw, (min-width: 640px) 48vw, 100vw"
        />
        <div className="absolute inset-0 bg-[linear-gradient(180deg,transparent_54%,color-mix(in_srgb,var(--background)_72%,transparent))]" />
        <div className="absolute bottom-3 left-3 rounded-md border bg-background/72 px-2 py-1 font-mono text-xs text-foreground backdrop-blur">
          TOKEN #{worker.tokenId}
        </div>
      </div>
      <CardHeader>
        <CardDescription>Agentic ID / token #{worker.tokenId}</CardDescription>
        <CardTitle>{worker.name}</CardTitle>
        <CardAction>
          <StatusBadge status={worker.memoryStatus} />
        </CardAction>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <p className="text-sm text-muted-foreground">{worker.summary}</p>
        <div className="flex flex-wrap gap-2">
          {worker.capabilities.map((capability) => (
            <Badge key={capability} variant="outline">
              {capability}
            </Badge>
          ))}
        </div>
        <dl className="grid grid-cols-2 gap-3 text-sm">
          <Stat label="Owner" value={worker.ownerShort} mono />
          <Stat label="Rating" value={`${worker.rating.toFixed(2)} / 5`} />
          <Stat label="Jobs" value={String(worker.jobsCompleted)} />
          <Stat label="Earned" value={`${worker.earned} 0G`} />
          <Stat label="Memory root" value={worker.memoryRoot} mono wide />
          <Stat label="Listing" value={`${listingStatus} / ${listingSource}`} wide />
          <Stat label="List price" value={worker.price} wide />
        </dl>
        <div className="flex flex-wrap gap-2 pt-1">
          <Link className="inline-flex" href={`/agent/${worker.slug}`}>
            <Button>
              View
              <ArrowRight data-icon="inline-end" />
            </Button>
          </Link>
          {listingStatus === "listed" ? (
            <Link className="inline-flex" href="/marketplace#latest-sale">
              <Button variant="secondary">Open listing proof</Button>
            </Link>
          ) : listingStatus === "sold" ? (
            <Link className="inline-flex" href="/proof">
              <Button variant="outline">Open sale receipt</Button>
            </Link>
          ) : (
            <Link className="inline-flex" href="/register">
              <Button variant="outline">Register worker</Button>
            </Link>
          )}
          <Link className="inline-flex" href="/jobs/task-risk-brief">
            <Button variant="outline">Open task flow</Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}

export function JobCard({ job }: { job: Job }) {
  return (
    <Card>
      <CardHeader>
        <CardDescription>{job.category}</CardDescription>
        <CardTitle>{job.title}</CardTitle>
        <CardAction>
          <Badge variant="secondary">{job.status}</Badge>
        </CardAction>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <dl className="grid grid-cols-2 gap-3 text-sm md:grid-cols-4">
          <Stat label="Payout" value={job.payout} />
          <Stat label="Bond" value={job.bond} />
          <Stat label="Minimum rep" value={job.minReputation} />
          <Stat label="Accepted worker" value={job.acceptedWorker} />
        </dl>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Worker</TableHead>
              <TableHead>Bid</TableHead>
              <TableHead>Score</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {job.bids.map((bid) => (
              <TableRow key={bid.worker}>
                <TableCell>{bid.worker}</TableCell>
                <TableCell>{bid.amount}</TableCell>
                <TableCell>{bid.score}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        <div className="flex justify-end">
          <Link className="inline-flex" href={`/jobs/${job.id}`}>
            <Button variant="outline">Open job room</Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}

export function ProofTable({ artifacts }: { artifacts: ProofArtifact[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>0G artifact register</CardTitle>
        <CardDescription>Every row is labeled live, demo, blocked, or fallback.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid gap-3 md:hidden">
          {artifacts.map((artifact) => (
            <div key={`${artifact.layer}-${artifact.artifact}`} className="rounded-lg border p-3">
              <div className="mb-2 flex items-start justify-between gap-3">
                <div>
                  <div className="text-xs font-medium uppercase text-muted-foreground">{artifact.layer}</div>
                  <div className="font-medium">{artifact.artifact}</div>
                </div>
                <StatusBadge status={artifact.status} />
              </div>
              <div className="lz-mono lz-artifact text-xs">{artifact.value}</div>
              <p className="mt-2 text-sm text-muted-foreground">{artifact.note}</p>
            </div>
          ))}
        </div>
        <Table className="hidden md:table">
          <TableHeader>
            <TableRow>
              <TableHead>Layer</TableHead>
              <TableHead>Artifact</TableHead>
              <TableHead>Value</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Note</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {artifacts.map((artifact) => (
              <TableRow key={`${artifact.layer}-${artifact.artifact}`}>
                <TableCell>{artifact.layer}</TableCell>
                <TableCell>{artifact.artifact}</TableCell>
                <TableCell className="lz-artifact lz-mono">{artifact.value}</TableCell>
                <TableCell>
                  <StatusBadge status={artifact.status} />
                </TableCell>
                <TableCell>{artifact.note}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

export function DemoMoment({
  ownerBefore,
  ownerAfter,
  taskId,
  payoutRecipientBefore,
  payoutRecipientAfter,
  releaseTx,
}: {
  ownerBefore: string;
  ownerAfter: string;
  taskId: string;
  payoutRecipientBefore: string;
  payoutRecipientAfter: string;
  releaseTx?: string;
}) {
  return (
    <Card className="lz-demo-card overflow-hidden">
      <CardHeader className="lz-demo-header">
        <div>
          <CardDescription>Signature demo</CardDescription>
          <CardTitle>Transfer changes the next payout.</CardTitle>
        </div>
        <div className="lz-demo-live" aria-label="Animated demo state">
          <span />
          Live settlement circuit
        </div>
      </CardHeader>

      <CardContent className="lz-demo-content">
        <div className="lz-demo-flow" aria-label="Worker transfer changes payout recipient">
          <OwnerBox
            step="01"
            title="Before transfer"
            label="Current owner"
            owner={ownerBefore}
            payout={payoutRecipientBefore}
          />

          <div className="lz-demo-transfer" aria-label="Worker token transfer animation">
            <div className="lz-demo-rail" />
            <div className="lz-demo-pulse">
              <WalletCards className="size-4" />
            </div>
            <div className="lz-demo-arrow">
              <ArrowRight className="size-5" />
              <span>worker token moves</span>
            </div>
          </div>

          <OwnerBox
            step="02"
            title="After transfer"
            label="New owner"
            owner={ownerAfter}
            payout={payoutRecipientAfter}
            active
          />
        </div>

        <div className="lz-demo-resolver">
          <div className="lz-demo-resolver-main">
            <div className="lz-kicker">Escrow resolver</div>
            <div className="lz-demo-resolver-title">Payout recipient resolves</div>
            <p>
              <code>payoutRecipient(taskId)</code> does not follow the original seller. It resolves through
              ownerOf(workerTokenId) at settlement time.
            </p>
          </div>
          <div className="lz-demo-output">
            <span>before</span>
            <strong>{payoutRecipientBefore}</strong>
            <span>after transfer</span>
            <strong className="text-accent">{payoutRecipientAfter}</strong>
          </div>
        </div>

        <div className="lz-demo-proof-row" aria-label="Signature demo proof artifacts">
          <div>
            <span>Task</span>
            <strong>{taskId}</strong>
          </div>
          <div>
            <span>Settlement</span>
            <strong>{releaseTx ? releaseTx : "seeded demo"}</strong>
          </div>
          <div>
            <span>Rule</span>
            <strong>ownerOf(workerTokenId)</strong>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function OwnerBox({
  step,
  title,
  label,
  owner,
  payout,
  active = false,
}: {
  step: string;
  title: string;
  label: string;
  owner: string;
  payout: string;
  active?: boolean;
}) {
  return (
    <div className={active ? "lz-demo-owner is-active" : "lz-demo-owner"}>
      <div className="lz-demo-owner-top">
        <span>{step}</span>
        <div>
          <div>{title}</div>
          <small>{label}</small>
        </div>
        <WalletCards className="size-4" />
      </div>
      <div className="lz-demo-address lz-mono lz-artifact">{owner}</div>
      <div className="lz-demo-payout">
        <ShieldCheck className="size-4" />
        <span>payoutRecipient</span>
        <strong>{payout}</strong>
      </div>
    </div>
  );
}

function Stat({
  label,
  value,
  mono = false,
  wide = false,
}: {
  label: string;
  value: string;
  mono?: boolean;
  wide?: boolean;
}) {
  return (
    <div className={wide ? "col-span-2" : ""}>
      <dt className="text-xs font-medium uppercase text-muted-foreground">{label}</dt>
      <dd className={mono ? "lz-mono lz-artifact mt-1" : "mt-1 font-medium"}>{value}</dd>
    </div>
  );
}

export function ArtifactCallout({ children }: { children: React.ReactNode }) {
  return (
    <div className="lz-panel flex items-start gap-3 rounded-lg p-4 text-sm text-muted-foreground">
      <Database className="mt-0.5 size-4 shrink-0 text-primary" />
      <div>{children}</div>
    </div>
  );
}
