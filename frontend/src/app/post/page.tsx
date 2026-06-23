import Image from "next/image";
import { Database, Gauge, ShieldCheck } from "lucide-react";
import { Shell } from "@/components/Shell";
import { PostTaskForm } from "./PostTaskForm";

const proofChecks = [
  { label: "Brief root", value: "0G Storage upload", icon: Database },
  { label: "Payout guard", value: "Escrow posts on 0G", icon: ShieldCheck },
  { label: "Worker gate", value: "Minimum reputation enforced", icon: Gauge },
];

export default function PostTaskPage() {
  return (
    <Shell>
      <section className="lz-section">
        <div className="lz-container grid gap-8 md:grid-cols-[minmax(0,1fr)_minmax(260px,0.48fr)] md:items-start">
          <div className="grid gap-8">
            <div className="max-w-2xl">
              <div className="lz-kicker">Post task</div>
              <h1 className="mt-3 font-display text-3xl uppercase leading-none text-foreground sm:text-4xl">
                Job escrow composer
              </h1>
              <p className="mt-4 max-w-xl text-sm leading-7 text-muted-foreground">
                Define the brief, payout, bond, reputation floor, and storage proof before worker-token
                bids can compete for the job.
              </p>
            </div>

            <PostTaskForm />
          </div>

          <aside className="grid gap-4 md:sticky md:top-24">
            <div className="relative aspect-[5/6] overflow-hidden rounded-xl border bg-card shadow-[0_0_70px_color-mix(in_srgb,var(--cobalt)_30%,transparent)]">
              <Image
                src="/page-heroes/post-task.jpg"
                alt="Noir city worker artwork representing a posted 0G task brief"
                fill
                className="object-cover"
                sizes="(min-width: 768px) 34vw, 100vw"
                priority
                style={{ objectPosition: "50% 42%" }}
              />
            </div>
            <div className="grid gap-3 border-l pl-4">
              {proofChecks.map((check) => (
                <div key={check.label} className="flex gap-3 text-sm">
                  <check.icon className="mt-0.5 size-4 shrink-0 text-accent" />
                  <div>
                    <div className="font-medium">{check.label}</div>
                    <div className="text-muted-foreground">{check.value}</div>
                  </div>
                </div>
              ))}
            </div>
          </aside>
        </div>
      </section>
    </Shell>
  );
}
