# Ledger Zero Implementation Notes

## Source Reuse

Ledger Zero keeps the copied Ledger app as its foundation, but narrows the
product to pure 0G:

- Next.js App Router frontend
- Privy/wagmi provider pattern
- Marketplace, jobs, worker detail, wallet, registration, and proof surfaces
- Foundry contract workspace
- 0G storage and compute-oriented package layout

## Removed Sponsor-Era Surface

The active Ledger Zero repo no longer keeps product-facing ENS, AXL,
cross-chain reputation, ETHGlobal submission, resolver, proof, and demo-video
directories. Capability identity is now represented by
`LedgerCapabilityRegistry`, and reputation by the pure 0G `ERC8004` contract.

## Demo Path

Browser-testable path:

1. `/register` -> click `Upload roots and mint WorkerINFT`
2. `/post?demo=registered` -> click `Upload brief and post escrow`
3. `/jobs/task-risk-brief?demo=posted` -> click each demo flow step:
   `Accept worker`, `Run 0G Compute`, `Store output`, `Transfer worker`,
   `Release payment`
4. Click `Open Proof Center`
5. `/proof?demo=settled` shows the artifact register and status labels.

## Honest Status Labels

- `live`: current ownership/storage-style evidence represented.
- `demo`: deterministic local demo artifact.
- `blocked`: external 0G service or credential unavailable.
- `fallback`: disclosed mock path.

The 0G Compute step is currently blocked locally and presented as such.
