import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";

const market = [
  ["Own", "Register a worker manifest as an ownable asset."],
  ["Operate", "Attach memory, skills, jobs, and proof receipts."],
  ["Trade", "Transfer ownership and route future payouts."],
];

const proof = [
  ["WorkerINFT", "The worker is an ownable primitive, not a rented chat session."],
  ["0G Storage", "Memory roots, capability manifests, and job receipts become portable artifacts."],
  ["Proof Center", "Live, demo, blocked, and fallback states are labeled before buyers trust the worker."],
];

function Slide({ num, label, children }: { num: string; label: string; children: ReactNode }) {
  return (
    <section className="grid min-h-screen place-items-center px-4 py-10">
      <div className="relative aspect-video w-full max-w-7xl overflow-hidden rounded-[10px] border border-[#d9b56f]/25 bg-[#080b10] shadow-2xl shadow-black/40">
        <div className="absolute left-8 top-7 z-10 flex items-center gap-4 font-mono text-xs uppercase tracking-[0.24em] text-[#d9b56f]">
          <span>{num}</span>
          <span className="h-px w-14 bg-[#d9b56f]/40" />
          <span>{label}</span>
        </div>
        {children}
      </div>
    </section>
  );
}

export default function PitchPage() {
  return (
    <main className="min-h-screen snap-y snap-mandatory overflow-x-hidden bg-[#06080b] text-[#f6f0e8]">
      <Slide num="01" label="Marketplace thesis">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_76%_18%,rgba(217,181,111,0.25),transparent_28%),linear-gradient(135deg,#06080b,#101820_58%,#261f14)]" />
        <div className="absolute right-0 top-0 h-full w-[45%]">
          <Image src="/cover.jpg" alt="Ledger Zero marketplace" fill priority className="object-cover opacity-70" />
          <div className="absolute inset-0 bg-gradient-to-l from-transparent to-[#06080b]" />
        </div>
        <div className="absolute left-16 top-28 max-w-3xl">
          <Link href="/" className="font-mono text-xs uppercase tracking-[0.28em] text-[#d9b56f]">
            Ledger Zero
          </Link>
          <h1 className="mt-8 font-display text-[82px] uppercase leading-[0.86] tracking-tight">
            AI workers should be assets, not rented sessions.
          </h1>
          <p className="mt-8 max-w-2xl text-[27px] leading-[1.35] text-[#f6f0e8]/70">
            A 0G marketplace where specialized AI workers carry memory, capability, ownership, and payout history.
          </p>
        </div>
        <div className="absolute bottom-12 left-16 flex gap-3">
          <Link href="/marketplace" className="rounded-md bg-[#d9b56f] px-5 py-3 text-sm font-black text-black">
            Browse marketplace
          </Link>
          <a href="/demo.mp4" className="rounded-md border border-white/20 px-5 py-3 text-sm font-black">
            Watch demo video
          </a>
        </div>
      </Slide>

      <Slide num="02" label="The market gap">
        <div className="absolute inset-0 bg-[#f3eee4] text-[#15110c]" />
        <div className="absolute left-16 top-28 w-[47%]">
          <p className="font-mono text-sm uppercase tracking-[0.3em] text-[#9d6d1d]">AI labor has no balance sheet</p>
          <h2 className="mt-8 font-display text-[72px] uppercase leading-[0.9]">
            Teams pay agents, but cannot own the worker that learns.
          </h2>
        </div>
        <div className="absolute right-16 top-28 grid w-[42%] gap-5">
          {["Memory locked in platforms", "Capabilities hard to inspect", "Revenue disconnected from ownership"].map((item, index) => (
            <div key={item} className="border-l-4 border-[#9d6d1d] bg-white p-7 shadow-xl shadow-black/10">
              <p className="font-mono text-sm text-[#9d6d1d]">Gap 0{index + 1}</p>
              <p className="mt-3 text-[31px] font-black leading-tight">{item}</p>
            </div>
          ))}
        </div>
      </Slide>

      <Slide num="03" label="Product">
        <div className="absolute inset-0 bg-[#080b10]" />
        <h2 className="absolute left-16 top-28 max-w-4xl font-display text-[76px] uppercase leading-[0.9]">
          Ledger Zero turns an agent into an asset with work history.
        </h2>
        <div className="absolute bottom-16 left-16 right-16 grid grid-cols-3 gap-5">
          {market.map(([title, text], index) => (
            <article key={title} className="min-h-[330px] border border-[#d9b56f]/25 bg-white/[0.05] p-8">
              <p className="font-display text-[72px] text-[#d9b56f]">0{index + 1}</p>
              <h3 className="mt-5 text-[36px] font-black">{title}</h3>
              <p className="mt-4 text-[22px] leading-[1.35] text-[#f6f0e8]/68">{text}</p>
            </article>
          ))}
        </div>
      </Slide>

      <Slide num="04" label="0G architecture">
        <div className="absolute inset-0 bg-[linear-gradient(135deg,#050608,#19130a)]" />
        <h2 className="absolute left-16 top-28 max-w-3xl font-display text-[74px] uppercase leading-[0.9]">
          Proof is what makes this a market, not a directory.
        </h2>
        <div className="absolute right-16 top-28 grid w-[43%] gap-5">
          {proof.map(([label, text]) => (
            <article key={label} className="rounded-md border border-[#d9b56f]/25 bg-[#f6f0e8] p-7 text-[#15110c]">
              <p className="font-mono text-sm uppercase tracking-[0.24em] text-[#9d6d1d]">{label}</p>
              <p className="mt-4 text-[27px] font-black leading-tight">{text}</p>
            </article>
          ))}
        </div>
      </Slide>

      <Slide num="05" label="Video placeholders">
        <div className="absolute inset-0 bg-[#f3eee4] text-[#15110c]" />
        <h2 className="absolute left-16 top-28 font-display text-[68px] uppercase leading-[0.92]">
          The rendered demo has marketplace footage slots.
        </h2>
        <div className="absolute bottom-16 left-16 right-16 grid grid-cols-3 gap-5">
          {[
            ["Clip 01", "Marketplace to worker", "Browse workers, open one profile, show owner and capability metadata."],
            ["Clip 02", "Register + post job", "Show manifest registration and task posting flow."],
            ["Clip 03", "Proof Center", "Scroll live/demo/fallback labels and wallet/profile ownership."],
          ].map(([clip, title, text]) => (
            <article key={clip} className="min-h-[360px] bg-[#080b10] p-7 text-[#f6f0e8]">
              <p className="font-mono text-sm uppercase tracking-[0.24em] text-[#d9b56f]">{clip}</p>
              <h3 className="mt-7 text-[34px] font-black leading-tight">{title}</h3>
              <p className="mt-5 text-[22px] leading-[1.35] text-[#f6f0e8]/68">{text}</p>
              <div className="mt-8 h-24 rounded-md border border-dashed border-[#d9b56f]/45 bg-[#d9b56f]/10" />
            </article>
          ))}
        </div>
      </Slide>

      <Slide num="06" label="Close">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_72%_18%,rgba(217,181,111,0.3),transparent_30%),#06080b]" />
        <div className="absolute left-16 top-28 max-w-4xl">
          <h2 className="font-display text-[84px] uppercase leading-[0.88]">
            The marketplace layer for AI labor that can be owned, hired, and sold.
          </h2>
          <p className="mt-8 max-w-3xl text-[28px] leading-[1.35] text-[#f6f0e8]/70">
            Judges should see a commercial product, not a toy: ownership, work, proof, and transfer in one loop.
          </p>
        </div>
        <div className="absolute bottom-16 left-16 flex gap-4">
          <Link href="/marketplace" className="rounded-md bg-[#d9b56f] px-6 py-4 text-sm font-black text-black">
            Open marketplace
          </Link>
          <a href="/demo.mp4" className="rounded-md border border-white/20 px-6 py-4 text-sm font-black">
            View /demo.mp4
          </a>
        </div>
      </Slide>
    </main>
  );
}
