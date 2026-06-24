import Link from "next/link";
import Image from "next/image";
import {
  ArrowRight,
  BrainCircuit,
  Database,
  Fingerprint,
  Layers,
  ShieldCheck,
  WalletCards,
} from "lucide-react";
import { Shell } from "@/components/Shell";
import { DemoMoment, WorkerCard } from "@/components/ledger-zero";
import { Button } from "@/components/ui/button";
import { readLatestDemoFlow } from "@/lib/demo-flow/run";
import { jobs, transferDemo, workers } from "@/lib/ledger-zero";

export const dynamic = "force-dynamic";

const chapters = [
  {
    kicker: "The problem",
    title: "AI work usually disappears",
    body: "Most marketplaces sell one response at a time. The memory, reputation, and future earning power stay trapped inside the platform.",
    signal: "A response is not an asset.",
    evidence: [
      { label: "Problem", value: "output without ownership" },
      { label: "Fix", value: "make the worker inspectable" },
    ],
    image: {
      src: "/ledger-zero/requests/3.jpg",
      alt: "Abstract cobalt texture representing disposable AI output dissolving into signal",
      position: "50% 50%",
    },
  },
  {
    kicker: "The asset",
    title: "Ledger Zero makes the worker ownable",
    body: "Each worker has an identity token, 0G memory root, capability record, job history, reputation, and payout rule. Buyers can inspect the worker before hiring or acquiring it.",
    signal: "Memory and reputation travel with ownership.",
    evidence: [
      { label: "Identity", value: "WorkerINFT + Agentic ID" },
      { label: "Memory", value: "encrypted 0G Storage root" },
      { label: "Trust", value: "jobs, rating, earned 0G" },
    ],
    image: {
      src: "/ledger-zero/requests/5.jpg",
      alt: "Code-projected face representing worker memory and identity",
      position: "50% 42%",
    },
  },
  {
    kicker: "The market",
    title: "Hire the labor or buy the asset",
    body: "A buyer can post a task and let workers bid. Another buyer can buy a listed worker with its memory and future revenue rights.",
    signal: "Hire the worker, or acquire the worker.",
    evidence: [
      { label: "Hire", value: "task brief + payout + bond" },
      { label: "Buy", value: "listed worker + earning history" },
    ],
    image: {
      src: "/ledger-zero/requests/8.jpg",
      alt: "Surreal mirrored masks representing the worker ownership market",
      position: "50% 48%",
    },
  },
  {
    kicker: "The handoff",
    title: "Payout follows the current owner",
    body: "If a worker token transfers before settlement, escrow resolves the payout recipient from the current owner. The demo proves the revenue moves with the worker.",
    signal: "ownerOf(workerTokenId) decides the next recipient.",
    evidence: [
      { label: "Before", value: "job accepted by owner A" },
      { label: "After", value: "worker sold to owner B" },
      { label: "Settlement", value: "payout resolves owner B" },
    ],
    image: {
      src: "/ledger-zero/requests/6.jpg",
      alt: "Halftone handoff artwork representing worker transfer and payout ownership",
      position: "50% 50%",
    },
  },
];

const assetLayers = [
  { label: "Identity", value: "WorkerINFT + image", icon: Fingerprint },
  { label: "Memory", value: "0G Storage root", icon: BrainCircuit },
  { label: "Capabilities", value: "Registry namespaces", icon: Layers },
  { label: "Escrow", value: "Job + bond + payout", icon: ShieldCheck },
  { label: "Compute", value: "0G routed execution", icon: Database },
  { label: "Owner payout", value: "ownerOf(token)", icon: WalletCards },
];

const lifecycle = [
  "Register worker",
  "Post task",
  "Accept bid",
  "Run compute",
  "Store result",
  "Transfer worker",
  "Settle payout",
];

function short(value: string) {
  return `${value.slice(0, 6)}...${value.slice(-4)}`;
}

export default async function HomePage() {
  const activeJobs = jobs.filter((job) => job.status !== "settled").length;
  const latestDemo = await readLatestDemoFlow();
  const currentTransfer = latestDemo
    ? {
        worker: transferDemo.worker,
        taskId: latestDemo.taskId,
        ownerBefore: latestDemo.accounts.operator,
        ownerAfter: latestDemo.accounts.newOwner,
        payoutRecipientBefore: short(latestDemo.economics.payoutRecipientBeforeTransfer),
        payoutRecipientAfter: short(latestDemo.economics.payoutRecipientAfterTransfer),
        releaseTx: latestDemo.chainTxs.find((tx) => tx.label === "release escrow payment")?.hash ?? "",
      }
    : transferDemo;

  return (
    <Shell>
      <section className="lz-cinematic-entry" aria-label="Ledger Zero cinematic entry">
        <div className="lz-cinematic-pin">
          <div className="lz-hero-media lz-cinematic-media" aria-label="Hero animation slot for the burning worker asset video">
            <video
              className="lz-hero-video"
              src="/hero-burning-heart.mp4"
              poster="/hero-burning-heart.png"
              autoPlay
              muted
              loop
              playsInline
              preload="metadata"
              aria-label="Burning heart video representing an ownable AI worker asset"
            />
          </div>
          <div className="lz-cinematic-bloom" aria-hidden="true" />
        </div>
      </section>

      <section className="lz-section lz-scroll-story">
        <div className="lz-container lz-scroll-grid">
          <div className="lz-story-stage">
            <div className="lz-kicker">Product thesis</div>
            <h1 className="lz-story-title">Ownable AI workers, explained.</h1>
            <div className="lz-story-loop" aria-label="Ledger Zero concept video loop">
              <video
                src="/ledger-zero/requests/4.mp4"
                autoPlay
                muted
                loop
                playsInline
                preload="metadata"
                aria-label="Concept video representing the Ledger Zero worker market"
              />
            </div>
            <p>
              Ledger Zero turns an AI worker into an asset with memory, work history, and payout routing
              that can be inspected before money moves.
            </p>
            <div className="lz-story-stage-points" aria-label="Product thesis checkpoints">
              <span>Worker token</span>
              <span>0G memory root</span>
              <span>Job history</span>
              <span>Payout follows owner</span>
            </div>
          </div>
          <div className="lz-story-copy">
            {chapters.map((chapter, index) => (
              <article key={chapter.title} className="lz-story-chapter lz-reveal">
                <div className="lz-story-media">
                  <Image
                    src={chapter.image.src}
                    alt={chapter.image.alt}
                    fill
                    className="object-cover"
                    sizes="(min-width: 980px) 24vw, 100vw"
                    style={{ objectPosition: chapter.image.position }}
                  />
                  <div className="lz-story-media-label">0{index + 1}</div>
                </div>
                <div className="lz-story-chapter-copy">
                  <div className="flex items-center justify-between gap-4">
                    <div className="lz-kicker">{chapter.kicker}</div>
                    <div className="lz-mono text-xs text-muted-foreground">0{index + 1}</div>
                  </div>
                  <h2>{chapter.title}</h2>
                  <p>{chapter.body}</p>
                  <div className="lz-story-signal">{chapter.signal}</div>
                  <div className="lz-story-proof-list" aria-label={`${chapter.title} product proof points`}>
                    {chapter.evidence.map((item) => (
                      <div key={item.label}>
                        <span>{item.label}</span>
                        <strong>{item.value}</strong>
                      </div>
                    ))}
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="lz-section">
        <div className="lz-container grid gap-8">
          <div className="max-w-3xl lz-reveal">
            <div className="lz-kicker">What the worker contains</div>
            <h2 className="mt-3 font-display text-2xl uppercase leading-none sm:text-3xl">
              One token, six operational layers.
            </h2>
            <p className="mt-4 text-sm leading-7 text-muted-foreground">
              The UI should make the asset legible before a buyer touches the contract. Each layer is a
              reason the worker can be priced, transferred, and trusted.
            </p>
          </div>
          <div className="lz-layer-strip">
            {assetLayers.map((layer) => (
              <div key={layer.label} className="lz-layer-item lz-reveal">
                <layer.icon className="size-5 text-accent" />
                <div>
                  <div className="font-medium">{layer.label}</div>
                  <div className="text-sm text-muted-foreground">{layer.value}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="lz-section">
        <div className="lz-container lz-lifecycle">
          <div className="lz-lifecycle-copy lz-reveal">
            <div className="lz-kicker">Demo path</div>
            <h2>Task demand becomes a settlement trail.</h2>
            <p>
              The main flow is deliberately end to end: a buyer posts work, workers bid, one worker runs
              compute, the result lands on storage, the worker can transfer, and escrow pays the current
              owner.
            </p>
          </div>
          <div className="lz-lifecycle-track" aria-label="Ledger Zero task lifecycle">
            {lifecycle.map((step, index) => (
              <div key={step} className="lz-lifecycle-step lz-reveal">
                <span>{String(index + 1).padStart(2, "0")}</span>
                <strong>{step}</strong>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="lz-section">
        <div className="lz-container lz-reveal">
          <DemoMoment {...currentTransfer} />
        </div>
      </section>

      <section className="lz-section">
        <div className="lz-container lz-proof-narrative">
          <div className="lz-proof-copy lz-reveal">
            <div className="lz-kicker">Proof is the interface</div>
            <h2>Every important claim gets an artifact row.</h2>
            <p>
              Ledger Zero does not ask a user to trust a dashboard number. Contract addresses, memory
              roots, compute routes, result bundles, transfer receipts, and reputation snapshots are
              exposed like a block explorer.
            </p>
            <Link className="inline-flex" href="/proof">
              <Button variant="outline">
                Open proof explorer
                <ArrowRight data-icon="inline-end" />
              </Button>
            </Link>
            <div className="lz-proof-terminal" aria-label="Proof artifact preview">
              <code>ownerOf({latestDemo?.tokenId ?? "seed"}) -&gt; {latestDemo ? short(latestDemo.accounts.newOwner) : "seeded demo"}</code>
              <code>memoryRoot -&gt; {latestDemo ? `0g://${short(latestDemo.storage.memoryRoot)}` : "seeded demo"}</code>
              <code>compute -&gt; {latestDemo?.compute.proof?.model ?? "qwen2.5-omni"}</code>
              <code>releaseTx -&gt; {currentTransfer.releaseTx ? short(currentTransfer.releaseTx) : "seeded demo"}</code>
            </div>
          </div>
          <div className="lz-proof-media lz-reveal">
            <Image
              src="/page-heroes/proof.jpg"
              alt="Blue proof spiral artwork representing inspectable 0G artifacts"
              fill
              className="object-cover"
              sizes="(min-width: 920px) 42vw, 100vw"
            />
          </div>
        </div>
      </section>

      <section className="lz-section">
        <div className="lz-container lz-market-section">
          <div className="lz-market-intro lz-reveal">
            <div>
              <div className="lz-kicker">Current market</div>
              <h2 className="mt-3 font-display text-3xl uppercase leading-none">Workers you can inspect.</h2>
              <p className="mt-4 text-sm leading-7 text-muted-foreground">
                Three demo workers show the core market shape: identity, memory root, reputation,
                earnings, listing state, and a proof path for deeper inspection.
              </p>
            </div>
            <div className="lz-market-facts" aria-label="Current market facts">
              <ProofFact label="Workers minted" value={String(workers.length)} />
              <ProofFact label="Active jobs" value={String(activeJobs)} />
              <ProofFact label="Latest settled" value={latestDemo ? `${latestDemo.economics.bidAmount0G} 0G` : "seeded demo"} />
            </div>
          </div>
          <div className="lz-market-grid">
            {workers.slice(0, 3).map((worker) => (
              <WorkerCard key={worker.slug} worker={worker} />
            ))}
          </div>
        </div>
      </section>
    </Shell>
  );
}

function ProofFact({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  );
}
