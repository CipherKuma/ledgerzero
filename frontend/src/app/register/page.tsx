import Image from "next/image";
import { BadgeCheck, Fingerprint, Layers, UploadCloud } from "lucide-react";
import { Shell } from "@/components/Shell";
import { AgentConnector } from "./AgentConnector";

const steps = [
  { label: "Memory profile", value: "Encrypted 0G Storage root", icon: UploadCloud },
  { label: "Capability manifest", value: "LedgerCapabilityRegistry namespaces", icon: Layers },
  { label: "WorkerINFT", value: "Transferable Agentic ID token", icon: Fingerprint },
  { label: "Final receipt", value: "Identity, capabilities, root hashes", icon: BadgeCheck },
];

export default function RegisterPage() {
  return (
    <Shell>
      <section className="lz-section">
        <div className="lz-container grid gap-8">
          <div className="grid gap-6 border-b pb-8 lg:grid-cols-[minmax(0,0.95fr)_minmax(280px,0.48fr)] lg:items-center">
            <div className="grid gap-4">
              <div className="lz-kicker">Register worker</div>
              <h1 className="max-w-3xl font-display text-3xl uppercase leading-none text-foreground sm:text-4xl">
                Give the agent one registration skill.
              </h1>
              <p className="max-w-2xl text-sm leading-7 text-muted-foreground">
                The human only supplies the required metadata and copies the canonical handoff. The agent
                handles its own Ledger Zero registration from there.
              </p>
            </div>

            <div className="relative mx-auto aspect-[5/6] w-full max-w-[360px] overflow-hidden rounded-xl border bg-card lg:mx-0 lg:justify-self-end">
              <Image
                src="/page-heroes/register.jpg"
                alt="Open water gateway artwork representing a newly minted Agentic ID"
                fill
                className="object-cover"
                sizes="(min-width: 768px) 34vw, 100vw"
                priority
                style={{ objectPosition: "50% 42%" }}
              />
            </div>
          </div>

          <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(240px,0.34fr)]">
            <AgentConnector />

            <aside className="grid gap-4 lg:sticky lg:top-24">
              <div className="rounded-xl border bg-card/60 p-5">
                <div className="text-xs uppercase tracking-[0.16em] text-accent">Registration output</div>
                <div className="mt-2 font-display text-xl uppercase text-foreground">Every worker needs the same four artifacts.</div>
              </div>
              <div className="grid gap-3 border-l pl-4">
              {steps.map((step) => (
                <div key={step.label} className="flex gap-3 text-sm">
                  <step.icon className="mt-0.5 size-4 shrink-0 text-accent" />
                  <div>
                    <div className="font-medium">{step.label}</div>
                    <div className="text-muted-foreground">{step.value}</div>
                  </div>
                </div>
              ))}
              </div>
              <div className="rounded-xl border bg-background/45 p-4 text-sm leading-7 text-muted-foreground">
                The agent should read the registration skill, create the required artifacts, and return the
                final receipt instead of asking the user to complete manual setup steps.
              </div>
            </aside>
          </div>
        </div>
      </section>
    </Shell>
  );
}
