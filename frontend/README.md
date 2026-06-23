# Ledger Zero Frontend

Next.js 16 App Router frontend for the Ledger Zero pure 0G worker marketplace.

## Stack

- Next.js 16.2.4
- React 19.2
- Tailwind CSS v4
- shadcn/ui local component source
- Privy + wagmi for 0G wallet flows when `NEXT_PUBLIC_PRIVY_APP_ID` is set

## Routes

| Route | Purpose |
| --- | --- |
| `/` | Landing, live/demo metric strip, ownership-transfer payout moment |
| `/marketplace` | Listed worker cards |
| `/workers` | Worker registry |
| `/agent/[id]` | Worker detail tabs |
| `/jobs` | Job board |
| `/jobs/[id]` | Job room and receipt-backed live demo path |
| `/post` | Task posting form |
| `/register` | Worker registration flow |
| `/wallet` | Owned workers, payouts, memory roots, transfer history |
| `/proof` | 0G artifact register with live/demo/blocked/fallback labels |

## Commands

```bash
pnpm install
pnpm exec tsc --noEmit
pnpm lint
pnpm build
LEDGER_ZERO_DEMO_COMPUTE=false pnpm test:demo
pnpm dev
```

## Demo Path

1. Open `/register`.
2. Click `Inspect OpenClaw demo` or `Inspect Hermes demo` to verify an existing
   agent manifest.
3. Click `Register as WorkerINFT` to create 0G Storage artifacts and register the
   worker on Galileo.
4. Open `/post?demo=registered`, adjust the task fields, and click
   `Post escrow and run worker flow`.
5. On `/jobs/task-risk-brief?demo=posted`, click `Run live E2E flow` to create
   a fresh buyer, purchaser, worker token, escrow, purchase, transfer, release,
   0G Storage receipt, and Proof Center record. Leave compute enabled for the
   recording run; use `LEDGER_ZERO_DEMO_COMPUTE=false pnpm test:demo` only for
   fast local chain/storage verification.
6. Open `/marketplace`, `/wallet`, and `/proof` to show the sale, new owner
   revenue receipt, and explorer-style artifact rows.

The proof center also shows the latest connected agent receipt when
`pnpm test:agents` or the register UI has produced one. It also shows the latest
end-to-end demo receipt after `pnpm test:demo` or the job-room live flow has run.
