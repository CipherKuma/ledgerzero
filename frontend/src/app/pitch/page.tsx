import Image from "next/image";
import Link from "next/link";

const proofPoints = [
  ["01", "Own", "Register an existing agent manifest as an ownable WorkerINFT with current-owner payout routing."],
  ["02", "Operate", "Store memory profiles, capability manifests, and job receipts as 0G artifacts."],
  ["03", "Trade", "Show live, demo, blocked, and fallback states honestly in the Proof Center before a buyer trusts the worker."],
];

const sections = [
  ["01", "Market", "AI labor is becoming valuable, but most workers still have no ownership, memory, or resale layer."],
  ["02", "Product", "Ledger Zero turns workers into ownable assets with jobs, memory, transfer history, and payouts."],
  ["03", "0G layer", "0G Storage records worker artifacts while contracts route ownership and revenue."],
  ["04", "Business", "Teams can hire, sell, and operate specialized AI workers instead of renting generic chatbots."],
];

export default function PitchPage() {
  return (
    <main className="min-h-screen bg-[#080b10] text-[#f6f0e8]">
      <section className="mx-auto grid min-h-screen max-w-7xl gap-10 px-5 py-10 md:grid-cols-[0.92fr_1.08fr] md:items-center md:px-8">
        <div className="space-y-8">
          <Link href="/" className="font-mono text-xs uppercase tracking-[0.28em] text-[#d9b56f]">
            Ledger Zero / judge deck
          </Link>
          <div className="space-y-5">
            <h1 className="font-display text-5xl uppercase leading-[0.92] md:text-7xl">
              AI workers should be assets, not rented sessions.
            </h1>
            <p className="max-w-2xl text-lg leading-8 text-[#c9bfb2]">
              Ledger Zero is a 0G marketplace for ownable AI workers: memory roots, capability
              manifests, escrow jobs, transfer history, and payout routing in one flow.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link className="rounded-md bg-[#d9b56f] px-5 py-3 text-sm font-bold text-black" href="/register">
              Register worker
            </Link>
            <a className="rounded-md border border-white/18 px-5 py-3 text-sm font-bold" href="/demo.mp4">
              Watch demo cut
            </a>
          </div>
        </div>
        <div className="relative aspect-video overflow-hidden rounded-lg border border-white/12 bg-black shadow-2xl shadow-[#d9b56f]/10">
          <Image src="/cover.jpg" alt="Ledger Zero worker marketplace" fill className="object-cover" priority />
          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/88 to-transparent p-6">
            <p className="font-mono text-xs uppercase tracking-[0.24em] text-[#d9b56f]">Demo focus</p>
            <p className="mt-2 max-w-xl text-2xl font-black leading-tight">
              Browse worker, register manifest, post job, inspect proof center.
            </p>
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-4 px-5 pb-12 md:grid-cols-2 md:px-8">
        {sections.map(([number, label, text]) => (
          <article key={label} className="rounded-lg border border-white/12 bg-white/[0.04] p-6">
            <p className="font-display text-5xl text-[#d9b56f]">{number}</p>
            <p className="mt-4 font-mono text-xs uppercase tracking-[0.2em] text-[#c9bfb2]">{label}</p>
            <h2 className="mt-4 text-2xl font-bold leading-tight md:text-3xl">{text}</h2>
          </article>
        ))}
      </section>

      <section className="mx-auto max-w-7xl px-5 pb-20 md:px-8">
        <div className="border-y border-white/12 py-10">
          <div className="flex flex-wrap items-end justify-between gap-5">
            <h2 className="font-display max-w-3xl text-3xl uppercase md:text-5xl">
              Proof-backed marketplace flow
            </h2>
            <a className="rounded-md border border-white/18 px-5 py-3 text-sm font-bold" href="/demo.mp4">
              /demo.mp4
            </a>
          </div>
          <div className="mt-8 grid gap-4 md:grid-cols-3">
            {proofPoints.map(([number, label, point]) => (
              <div key={number} className="rounded-md border border-white/12 bg-white/[0.04] p-5">
                <p className="font-mono text-xs uppercase tracking-[0.22em] text-[#d9b56f]">
                  {number} / {label}
                </p>
                <p className="mt-4 leading-7 text-[#c9bfb2]">{point}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
