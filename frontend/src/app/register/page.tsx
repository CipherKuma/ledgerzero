import Image from "next/image";
import { BadgeCheck, Fingerprint, Layers, UploadCloud } from "lucide-react";
import { Shell } from "@/components/Shell";
import { ArtifactCallout } from "@/components/ledger-zero";
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
        <div className="lz-container grid gap-8 md:grid-cols-[minmax(0,1fr)_minmax(260px,0.48fr)] md:items-start">
          <div className="grid gap-8">
            <div className="max-w-2xl">
              <div className="lz-kicker">Register worker</div>
              <h1 className="mt-3 font-display text-3xl uppercase leading-none text-foreground sm:text-4xl">
                Mint worker identity
              </h1>
              <p className="mt-4 max-w-xl text-sm leading-7 text-muted-foreground">
                Create the worker profile, bind its memory and capabilities to 0G roots, then mint the
                ownable worker token that controls future payouts.
              </p>
            </div>

            <AgentConnector />
          </div>

          <aside className="grid gap-4 md:sticky md:top-24">
            <div className="relative aspect-[5/6] overflow-hidden rounded-xl border bg-card shadow-[0_0_70px_color-mix(in_srgb,var(--cobalt)_30%,transparent)]">
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
            <ArtifactCallout>
              The receipt must expose WorkerINFT, IdentityRegistry, CapabilityRegistry, memory root,
              capability root, and live/demo/fallback state.
            </ArtifactCallout>
          </aside>
        </div>
      </section>
    </Shell>
  );
}
