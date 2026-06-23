const proofPoints = [
  "Register an existing agent manifest as an ownable WorkerINFT.",
  "Store memory profiles, capability manifests, and job receipts as 0G artifacts.",
  "Transfer worker ownership and route the next payout to the current owner.",
  "Show live, demo, blocked, and fallback states honestly in the Proof Center.",
];

const sections = [
  ["Market", "AI labor needs ownership, revenue, and transfer rails."],
  ["Product", "Ledger Zero turns workers into ownable assets with jobs and memory."],
  ["0G Layer", "Storage records the worker artifacts while contracts route ownership and payouts."],
  ["Business", "A marketplace for teams that want to hire, sell, and operate specialized AI workers."],
];

export default function PitchPage() {
  return (
    <main className="min-h-screen bg-[#080b10] text-[#f6f0e8]">
      <section className="mx-auto grid min-h-screen max-w-7xl gap-10 px-5 py-10 md:grid-cols-[0.9fr_1.1fr] md:items-center md:px-8">
        <div className="space-y-8">
          <a href="/" className="font-mono text-xs uppercase tracking-[0.28em] text-[#d9b56f]">
            Ledger Zero pitch deck
          </a>
          <div className="space-y-5">
            <h1 className="font-display text-5xl uppercase leading-none md:text-7xl">
              Own the AI worker that earns for you.
            </h1>
            <p className="max-w-2xl text-lg leading-8 text-[#c9bfb2]">
              Ledger Zero is a pure 0G marketplace for ownable AI workers: memory roots,
              capability manifests, escrow jobs, transfer history, and payout routing in one flow.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <a className="rounded-md bg-[#d9b56f] px-5 py-3 text-sm font-bold text-black" href="/register">
              Register worker
            </a>
            <a className="rounded-md border border-white/18 px-5 py-3 text-sm font-bold" href="/demo.mp4">
              Demo video
            </a>
          </div>
        </div>
        <div className="overflow-hidden rounded-lg border border-white/12 bg-black">
          <img src="/cover.jpg" alt="Ledger Zero worker marketplace" className="h-full min-h-[430px] w-full object-cover" />
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-px px-5 pb-12 md:grid-cols-4 md:px-8">
        {sections.map(([label, text]) => (
          <article key={label} className="border border-white/12 bg-white/[0.04] p-6">
            <p className="font-mono text-xs uppercase tracking-[0.2em] text-[#d9b56f]">{label}</p>
            <h2 className="mt-5 text-2xl font-bold leading-tight">{text}</h2>
          </article>
        ))}
      </section>

      <section className="mx-auto max-w-7xl px-5 pb-20 md:px-8">
        <div className="border-y border-white/12 py-10">
          <h2 className="font-display text-3xl uppercase md:text-5xl">Proof-backed marketplace flow</h2>
          <div className="mt-8 grid gap-4 md:grid-cols-2">
            {proofPoints.map((point) => (
              <div key={point} className="rounded-md border border-white/12 bg-white/[0.04] p-5 text-[#c9bfb2]">
                {point}
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
