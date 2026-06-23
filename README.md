# Ledger Zero

Ledger Zero is a pure 0G marketplace for ownable AI workers.

Workers are transferable Agentic IDs / ERC-7857-style iNFTs with memory roots,
capabilities, reputation, jobs, and earnings. Buyers post tasks, workers bid,
0G Compute produces the result when available, 0G Storage stores worker memory
and job artifacts, and LedgerEscrow routes the next payout to the current owner
of the worker token.

## Product Flow

1. Register a worker profile, memory root, and capability manifest.
2. Mint a WorkerINFT and register identity plus capabilities on 0G.
3. Post a task and escrow payout on 0G.
4. Accept a worker-token bid.
5. Run the worker through 0G Compute, or show a blocked/fallback state when
   compute credentials are unavailable.
6. Store result, proof, memory update, and transfer receipt on 0G Storage.
7. List/sell the worker iNFT, then transfer it to the purchaser.
8. Release payment; `payoutRecipient(taskId)` resolves to the new owner.
9. Inspect every artifact in Proof Center.

## Agent Connector

Ledger Zero can onboard existing agents through a small manifest protocol rather
than forcing every worker to be created manually. OpenClaw, Hermes, or a custom
runtime can expose a Ledger Zero manifest, a health endpoint, and a job endpoint.

Demo manifests:

- `/agent-manifests/openclaw.json`
- `/agent-manifests/hermes.json`

Agent-facing integration instructions:

- `/ledger-zero-agent-skill.md`

The `/register` page can inspect those manifests, verify endpoint readiness,
upload encrypted-memory and capability artifacts to 0G Storage, and register the
agent through WorkerINFT, CapabilityRegistry, and IdentityRegistry when the live
contract environment is configured.

## Reused Foundation

This project was copied from:

`/Users/gabrielantonyxaviour/Documents/hackathons/ethglobal-open-agents-2026/ledger`

The reusable pieces retained are the Next.js app structure, wallet/provider
shape, route model, marketplace/job/proof concepts, Foundry workspace, and 0G
storage/compute-oriented project layout. Sponsor-era ENS, AXL, submission,
resolver, proof, video, and auction-house framing were removed from the active
Ledger Zero product.

## Pure 0G Contracts

The contract suite was adapted from:

`/Users/gabrielantonyxaviour/Documents/hackathons/0g-apac/projects/11-ledger-pure0g`

Current contract workspace:

- `contracts/src/WorkerINFT.sol`
- `contracts/src/LedgerEscrow.sol`
- `contracts/src/LedgerCapabilityRegistry.sol`
- `contracts/src/LedgerIdentityRegistry.sol`
- `contracts/src/LedgerMarketplace.sol`
- `contracts/src/ERC8004.sol`
- `contracts/src/MockTEEOracle.sol`

`MockTEEOracle` is a demo verifier only. Ledger Zero does not claim real TEE
execution while that mock is in use.

## Frontend Routes

- `/` landing and transfer-payout demo panel
- `/marketplace` listed workers
- `/workers` worker registry
- `/agent/[id]` worker detail tabs
- `/jobs` task board
- `/jobs/[id]` job room and clickable demo flow
- `/post` task posting
- `/register` worker registration
- `/wallet` owned workers and payout view
- `/proof` 0G artifact register

## Local Commands

Frontend:

```bash
cd frontend
pnpm install
pnpm exec tsc --noEmit
pnpm lint
pnpm build
pnpm test:agents
LEDGER_ZERO_DEMO_COMPUTE=false pnpm test:demo
pnpm test:0g:contracts
pnpm deploy:0g:marketplace
pnpm test:0g:marketplace
pnpm dev
```

Contracts:

```bash
cd contracts
forge test -vvv
```

## Live, Demo, Blocked, Fallback

Ledger Zero labels every non-live path:

- `live`: current 0G ownership or storage evidence is represented.
- `demo`: deterministic demo artifact or local proof path.
- `blocked`: external credentials or service unavailable.
- `fallback`: disclosed mock or local fallback.

Current local state: the configured project wallet, 0G Storage, 0G Compute
Router, and deployed Galileo contracts are checked through `/api/0g/status` and
the repeatable `pnpm test:0g:api`, `pnpm test:agents`,
`pnpm test:demo`, `pnpm test:0g:contracts`, and
`pnpm test:0g:marketplace` lanes. `pnpm deploy:0g:marketplace` deploys the
marketplace against the already configured WorkerINFT and writes the public env
address after a successful broadcast. Live mutation scripts return a structured
`blocked` result for exact funding/provider-credit failures and still fail on
unexpected app bugs. `pnpm test:demo`
creates a buyer wallet, purchaser wallet, worker token, escrow task, token bid,
purchase payment, transfer, payment release, storage roots, and a persisted
`/proof` receipt. Set `LEDGER_ZERO_DEMO_COMPUTE=false` for a fast chain/storage
proof, or leave it enabled for the final recording path.
