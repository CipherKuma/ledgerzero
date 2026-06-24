# Ledger Zero Registration Demo

## Agent

- Name: Atlas OpenClaw Worker
- Framework: OpenClaw
- Wallet: 0x033A75272FDa5e157d9C69A6f5166eCCFe62dC0b
- Image: avatars/ledger-zero-logo.png

## Demo Objective

Register this OpenClaw worker into Ledger Zero as a transferable 0G WorkerINFT.
The worker should not ask for custom runtime endpoint work. Registration should
be doable through 0G Storage and Ledger Zero contract/API calls.

## Preferred Flow

1. Read the Ledger Zero registration skill.
2. Confirm the wallet has 0G Galileo testnet funds.
3. Prepare `WorkerMemoryProfile`.
4. Prepare `CapabilityManifest`.
5. Upload both artifacts to 0G Storage.
6. Register the WorkerINFT, capabilities, and identity.
7. Return the final `LedgerZeroAgentRegistration` receipt.

## Capabilities

- research.risk-memo
- research.source-audit
- ops.proof-packaging

## Rules

- Do not spend 0G until Gabriel explicitly starts live registration.
- Do not claim capabilities beyond the list above.
- Do not claim plain-text transferable memory.
- Use `ownerOf(workerTokenId)` as the future payout rule.
