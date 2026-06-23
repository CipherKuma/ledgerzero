# Ledger 0G Integration Kit

Framework-neutral TypeScript helpers for wiring the app to the live 0G sponsor slice.

## What This Package Gives The App

- Canonical Galileo config and deployed contract addresses.
- Read helpers for the live `WorkerINFT` token profile.
- Write helpers for future mint, transfer, and memory-pointer updates.
- App workflow helpers for encrypted memory preparation, byte-equality checks, and live 0G Compute reasoning.
- A smoke script that defaults to read-only/live-safe behavior.

## Imports

```ts
import {
  assertMemoryRoundTrip,
  prepareWorkerMemory,
  readDemoWorker,
  runWorkerReasoning
} from "../agents/0g-integration/src/index.js";
```

## Local App-Safe Check

```bash
cd agents/0g-integration
pnpm test
pnpm typecheck
pnpm run smoke:live
```

The default smoke reads the live deployed token and verifies local encrypted-memory behavior. It does not broadcast transactions and does not call paid compute.

## Optional Live Compute Check

```bash
cd agents/0g-integration
set -a; source ../../.env.local; set +a
export PRIVATE_KEY="0x${PRIVATE_KEY#0x}"
LEDGER_LIVE_COMPUTE=1 pnpm run smoke:live
```

This runs a paid live 0G Compute inference using the existing provider sub-account. Do not run it repeatedly without checking the remaining testing budget.

## Current Live Defaults

- `WorkerINFT`: `0xd4d74E089DD9A09FF768be95d732081bd542E498`
- `LedgerEscrow`: `0x83dF0Ed0b4f3D1D057cB56494b8c7eE417265489`
- `LedgerIdentityRegistry`: `0x9581490E530Da772Af332EBCe3f35D27d5e8377F`
- ERC-8004 registry reference: `0x8004B663056A597Dffe9eCcC1965A193B7388713`
- Demo token ID: `1`
- Demo memory CID: `0g://0xd8fb3ad312ca5e9002f7bdd47d93839b9a6dcd83d396bb74a44a9f65344982c4`

## Budget Rule

The reserve wallet holds `7.0` OG and must not be used unless Gabriel explicitly authorizes it.
