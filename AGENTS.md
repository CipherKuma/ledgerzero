# Ledger Zero Project Notes

## Scope

Build Ledger Zero for 0G Zero Cup as a pure 0G worker marketplace. Reuse the
ETHGlobal Ledger foundation only where it advances the 0G product.

## Preferred Shell Patterns

- Frontend checks run from `frontend/`.
- Contract checks run from `contracts/`.
- Use `pnpm` for the Next.js app.
- Use `forge test -vvv` for the pure 0G contract suite.

## 0G Test Wallet

- Dedicated externally funded project test wallet:
  `0xFF8eF7B9EdD1Bf80A3454200CA2fb6AaCED3E120`
- Its private key is stored only in ignored local env as
  `frontend/.env.local` key `ZEROG_PROJECT_TEST_PRIVATE_KEY`.
- Use this wallet for Galileo contract integration tests, 0G Storage uploads,
  0G Compute ledger/provider tests, and funding browser-based Privy test wallets.
- `ZEROG_PRIVATE_KEY` currently points at this funded project test wallet for
  server-side test operations. If it is reset to another signer, switch test
  scripts or server-side probes back to `ZEROG_PROJECT_TEST_PRIVATE_KEY` when a
  clean project-owned signer is preferred.
- Never commit the private key. It is acceptable to share the public address
  above for faucet or manual funding.

## Things To Avoid

- Do not reintroduce ENS, AXL, Base Sepolia, Sepolia, Gensyn, or ETHGlobal
  sponsor framing into product UX.
- Do not bring back Fraunces, cursive, italic display branding, paper/oxblood
  auction-house styling, Catalogue/Pitch/How-it-works nav, or old sponsor docs.
- Do not claim real TEE while `MockTEEOracle` is used.
- Do not use an indexer or Cloudflare cache as the ownership or payout source of
  truth.

## Design

- Current direction: Cobalt Ember Cinema, from the burning-heart concept image.
- Palette: off-black grain, saturated cobalt blue, molten orange, hot yellow,
  glossy blood red.
- Typography: Archivo Black display, Manrope body/UI, JetBrains Mono artifacts.
- Hero: keep a right-side media bay using `frontend/public/hero-burning-heart.mp4`
  with `frontend/public/hero-burning-heart.png` as the poster fallback.

## Verification

Required before claiming completion:

- `cd frontend && pnpm exec tsc --noEmit`
- `cd frontend && pnpm lint`
- `cd frontend && pnpm build`
- `cd contracts && forge test -vvv`
- Local route smoke for `/`, `/marketplace`, `/workers`, `/agent/worker-001`,
  `/jobs`, `/jobs/task-risk-brief`, `/post`, `/register`, `/wallet`, `/proof`
- `cd frontend && pnpm test:0g:api`
- `cd frontend && pnpm test:agents`
- `cd frontend && pnpm test:demo`
- `cd frontend && pnpm test:0g:contracts`
- `cd frontend && pnpm test:e2e`
- Browser plugin smoke on `/proof` and the register -> post -> job -> proof flow
- Polish is skipped for the June 23, 2026 testing pass by explicit user
  instruction; restore screenshot/polish gates when visual finish is back in
  scope.
