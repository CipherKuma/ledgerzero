# Ledger — Execution Plan

**Single source of truth for what to do next. Read top-to-bottom on every check-in.**

---

## Status snapshot

- **Today:** 2026-05-02 (Saturday) evening
- **Submission deadline:** 2026-05-03 (Sunday) **21:30 IST = 12:00 PM EDT** (hard, ETHGlobal-confirmed)
- **Hours remaining:** ~30 wall-hours (build + record + edit + submit)
- **Plan status:** v3, frozen post-council on May 2 16:30 IST. See `tools/council/STAGE3_CHAIRMAN.md` for rationale; `tools/council_alt/STAGE3_CHAIRMAN.md` for the ENS Slot-3 integration shape.
- **Documents:** all 11 planning docs updated against the canonical change list and moved to `docs/`. See `docs/INDEX.md` for navigation.

## What's locked

| Decision | Resolution | Source |
|---|---|---|
| 3 partner-prize sponsors | **0G + Gensyn AXL + ENS** | `tools/council/STAGE3_CHAIRMAN.md` §1 |
| Network for chain + storage + iNFT | **0G Galileo Testnet (ChainID 16602, native 0G token)** | `tools/research/0g.md` |
| Reputation contract | **Live audited ERC-8004 ReputationRegistry at `0x8004B663056A597Dffe9eCcC1965A193B7388713` on Base Sepolia** (we deploy nothing) | `tools/research/keeperhub-and-rules.md` Part 3 |
| ENS integration shape | **Path C — custom CCIP-Read offchain resolver with live `ownerOf()` cross-chain** | `tools/research/ens.md` + `tools/council_alt/STAGE3_CHAIRMAN.md` §3 |
| Hero demo punchline | **Live ENS resolution flip when iNFT transfers** + **split-screen wallet balances** | `tools/council_alt/STAGE3_CHAIRMAN.md` §5 |
| Higgsfield Shot 2 | **Cut entirely**; replace with profile UI in 96px Fraunces | `tools/council/STAGE3_CHAIRMAN.md` §3 Conflict 2 |
| Higgsfield Shot 3 | **Move to 3:48–4:00**, trim to 12s | `tools/council/STAGE3_CHAIRMAN.md` §3 |
| 47-job seeded reputation | **Keep + disclose** in README "How it's made" (one sentence) | `tools/council/STAGE3_CHAIRMAN.md` §3 Conflict 3 |
| Cross-chain "atomically" claim | **Strike**; replace with "two-phase commit, eventually consistent within ~10s" | `tools/council/STAGE3_CHAIRMAN.md` §2 Finding 4 |
| x402 | **Drop** from load-bearing scope | Architect's call |

## What's NOT yet decided (recording-day calls)

- **Cinematic-vs-inverted-hook for 0:00–0:15.** Decide via muted 5-second test with 2 uninformed viewers on recording day.
- **Whether to record solo or team-on-camera for the physical handoff scene.** Director's preference is two laptops + two hands in one shot. Fallback is single-laptop window-switch if team is not co-located.

---

## Team roster + ownership

(Adjust names to actual team. The 4-builder allocation below is from the alt-council's Stage 3 §4.)

| Role | Owner | Owns |
|---|---|---|
| **Lead** | Gabriel | Architecture decisions, demo direction, README, submission, sponsor Discord posts |
| **Builder A** (Resolver core) | TBD | CCIP-Read offchain resolver server, ENSIP-10 signed-response handler, label parser, deployment as stable HTTPS gateway |
| **Builder B** (Capability backends) | TBD | The 5 namespace handlers (`who`, `pay`, `tx`, `rep`, `mem`); HD-derivation for `pay`; JSON-RPC clients for 0G Galileo + Base Sepolia; 0G Storage retrieval; ENSIP-5 text-record encoding; reputation seeding |
| **Builder C** (On-chain) | TBD | Solidity contracts on 0G Galileo (LedgerEscrow, WorkerINFT, LedgerIdentityRegistry — NOT a custom reputation registry, we use the live audited ERC-8004); ENS parent name registration on Sepolia; ENSIP-25 text record; AXL nodes spin-up on 2 cloud VMs + local laptop |
| **Builder D** (Frontend + demo) | TBD | Capability Tree Viewer page, Settlement Status Strip component, ENS-name display on worker profiles, demo recording, video edit, Higgsfield generations, README polish |

**Rule:** if anything blocks you for >30 minutes, post in the team channel. Don't grind alone.

---

## The 22-step punch list

Ordered by start time. Each step lists who owns, what it produces, and the hour budget.

### Phase 1 — Tonight (May 2 evening, ~5h, 18:00–23:00 IST)

| # | Step | Owner | Hours | Produces |
|---|---|---|---|---|
| 1 | Verify all 11 docs updated against `STAGE3_CHAIRMAN.md` (4 parallel agents finished). Spot-check 2-3 docs. | Lead | 0.5h | Confirmed v3 plan |
| 2 | Register parent ENS name on Sepolia via `sepolia.app.ens.domains` (need Sepolia faucet ETH first) | Lead | 0.25h | `<team>.eth` on Sepolia |
| 3 | Deploy `LedgerEscrow.sol` + `WorkerINFT.sol` + `LedgerIdentityRegistry.sol` on **0G Galileo (16602)**. Verify on explorer. | Builder C | 1h | 3 contract addresses + verified source |
| 4 | Spin up 2 cloud VMs + local laptop running AXL nodes. Verify mesh formation: `/topology` returns 3 peers. Fork the `gossipsub` example from the AXL repo. | Builder A | 2h | 3 peer IDs + mesh up |
| 5 | CCIP-Read offchain resolver server skeleton: bare `who.*` namespace handler proxying `ownerOf()` from 0G Galileo. Deploy to Vercel/Cloudflare. | Builder B | 1.5h | Resolver gateway URL |
| 6 | Generate Higgsfield Shot 1 + Shot 3 start frames via multi-model comparison (Soul 2, Nano Banana Pro, Seedream, GPT Image, Cinema Studio image tab). Pick best per shot. | Builder D | 3h | 2 start-frame images |
| 7 | Run AI Council Prompt 7 (final demo polish prompt) **tonight**, not Day 9 | Lead | 0.5h | Last-mile critique |

### Phase 2 — May 3 morning (09:00–13:00 IST, ~4h)

| # | Step | Owner | Hours | Produces |
|---|---|---|---|---|
| 8 | Add remaining namespace handlers to resolver: `pay` (HD-derivation), `tx`, `rep`, `mem` | Builder B | 3h | All 5 namespaces resolving |
| 9 | Set ENSIP-25 `agent-registration` text record on parent name pointing to ERC-8004 deployment at `0x8004B663…` on Base Sepolia | Builder C | 0.5h | Verification text record live |
| 10 | Build Capability Tree Viewer page (custom UI at `/agent/<ens-name>`, since official ENS app may not render our text records nicely) | Builder D | 2h | Demo viewer surface |
| 11 | Wire Settlement Status Strip + AXL topology view + worker profile pages with ENS-name display | Builder A | 2h | Dashboard UI complete |
| 12 | Seed 47 employer-signed feedback records to ERC-8004 ReputationRegistry on Base Sepolia (script + 47 deterministic employer wallets) | Builder B | 0.5h | Hero worker has reputation |
| 13 | Sponsor Discord posts: 1-line update to 0G + Gensyn + ENS Discord channels with WIP repo link. *"Got X working, here are logs, any best-practice suggestions?"* | Lead | 0.5h | Sponsor visibility before judging |

### Phase 3 — May 3 afternoon (13:00–18:00 IST, ~5h)

| # | Step | Owner | Hours | Produces |
|---|---|---|---|---|
| 14 | Demo recording — 3+ takes minimum. Muted 5-second test on first take to decide cinematic-vs-inverted-hook. Pick best per scene, edit. | All | 3h | Raw demo footage |
| 15 | Voiceover via Eleven Labs, synced to picture | Lead | 1h | VO sync'd |
| 16 | Color grade, audio mix, hard-cut sponsor logo sequence (3 logos × 3 seconds each, hard cuts no crossfade) | Builder D | 1h | Final cut |

### Phase 4 — May 3 evening (18:00–21:30 IST, ~3.5h)

| # | Step | Owner | Hours | Produces |
|---|---|---|---|---|
| 17 | Build 30-second elevator cut alongside the 4-min cut (Director's call — judges sometimes only watch first 30s) | Lead | 0.5h | Short cut |
| 18 | README final pass: Proof Matrix populated with **real** artifacts (token IDs, CIDs, attestation digests, peer IDs, contract addresses, ENS names) | Lead | 1h | Production README |
| 19 | `/proofs/0g-proof.md`, `/proofs/axl-proof.md`, `/proofs/ens-proof.md` finalize. Each ≤1 screen, evidence inline | Lead | 0.5h | 3 sponsor proof files |
| 20 | Custom YouTube/Vimeo thumbnail composite (split-screen, two laptops, wallet→wallet, worker stat card). Director's call — nobody else's submission solves this. | Builder D | 0.5h | Custom thumbnail |
| 21 | Submission form filled. Partner prizes: **0G + Gensyn + ENS**. Submit by **20:30 IST** (1 hour buffer before deadline at 21:30 IST) | Lead | 0.5h | Submitted |
| 22 | Iterate README until cutoff at 21:30 IST | Lead | until cutoff | Polished submission |

---

## Gates (do NOT proceed past these without verification)

### Gate A — End of Phase 1 (May 2 ~23:00 IST)

Before going to sleep, confirm:

- [ ] 3 contracts deployed on 0G Galileo, addresses verified on explorer
- [ ] AXL `/topology` returns 3 distinct peer IDs from 3 hosts
- [ ] CCIP-Read resolver returns a valid response for `cast resolve who.<test>.eth` (even if test data)
- [ ] ENS parent name registered on Sepolia (transaction confirmed)
- [ ] 2 Higgsfield start frames in hand
- [ ] AI Council Prompt 7 findings addressed or noted

**If ANY of these fail, surface in team channel before anyone sleeps.**

### Gate B — End of Phase 2 (May 3 ~13:00 IST)

Before recording starts, confirm:

- [ ] All 5 ENS namespaces resolve correctly via `cast resolve` for `worker-001.<team>.eth`
- [ ] `who.worker-001.<team>.eth` returns the current `ownerOf(1)` from 0G Galileo (test by transferring iNFT and re-resolving — should flip live)
- [ ] `pay.worker-001.<team>.eth` returns different addresses on consecutive resolutions
- [ ] ERC-8004 ReputationRegistry on Base Sepolia shows 47 feedback records for our worker address
- [ ] Capability Tree Viewer page renders all 5 namespaces visibly
- [ ] AXL topology view shows 3 nodes with live packet flow
- [ ] Settlement Status Strip works in dashboard

**If anything is missing, prioritize the Inheritance demo path (steps 8, 9, 12, 14) — those are the hero beat.**

### Gate C — End of Phase 3 (May 3 ~18:00 IST)

Before submission prep starts, confirm:

- [ ] Final cut exists, plays end-to-end, audio synced
- [ ] At least one take has the muted-5-second test passing (judges autoplay videos muted)
- [ ] Inheritance moment (2:00–3:15) is legible at 1:1 playback at 1080p
- [ ] Color grade applied uniformly (warm shadow, cool highlight)

### Gate D — Submission (May 3 20:30 IST = 11:00 AM EDT)

- [ ] Repo public on GitHub, all commits dated April 24 or later
- [ ] README has Proof Matrix at top with real artifacts
- [ ] All 3 proof docs filed (`proofs/{0g,axl,ens}-proof.md`)
- [ ] Demo video uploaded, custom thumbnail set
- [ ] 30-second elevator cut available as separate link
- [ ] Architecture diagram exported as PNG, embedded in README
- [ ] Live deployment URL verified working in incognito browser
- [ ] All contract addresses listed in README, verified on explorers
- [ ] ENS parent + 1-2 demo workers' subnames resolve via `cast resolve` and via `app.ens.domains/sepolia/<name>`
- [ ] Submission form: partner prizes = **0G + Gensyn + ENS**
- [ ] Submitted ≥1h before 21:30 IST hard deadline

---

## Risks + mitigations

| Risk | Likelihood | Mitigation |
|---|---|---|
| 0G Galileo public RPC unreliable during demo | Medium | Builder C runs a private Galileo node OR resolver caches `ownerOf()` reads with 30s TTL during recording window |
| ENS app's official UI doesn't render `pay.*`/`tx.*` text records nicely | High | Builder D ships custom viewer page (`/agent/<ens-name>`); demo uses this surface, not the official app. README links to both. |
| `sepolia.app.ens.domains` registration friction | Low | Register parent name **first thing tonight (May 2 evening, step 2 above)** — should take 15 min with Sepolia faucet ETH. Don't leave for Day 9. |
| HD-derivation verification UI looks like a hex dump | Medium | Builder D's viewer renders rotation as `[address A · derived from master @ nonce 0] [address B · derived from master @ nonce 1] ...` with a "Verify derivation" button (client-side check via ethers.HDNodeWallet) |
| Demo recording fails / takes too long | Medium | Build buffer: 3+ takes, fall back to canonical pre-recorded run as B-roll for parts that don't land. Recording in afternoon (not evening) leaves 4h buffer. |
| AXL drops a node mid-take | Medium | Use 3 cloud VMs (drop residential laptop) if NAT acts up. Disclose topology change in README. |
| 0G Compute attestation surface is unstable | Low | Pre-cache one good attestation digest as a "canonical" sample; show it on screen with explorer link. If live attestation fails on demo day, use the cached one with disclosure. |
| Higgsfield Shot 3 doesn't iterate to acceptable quality | Low | Fall back to a still-image cross-fade with particle overlay in DaVinci Resolve. Stop iterating Shot 3 by EOD May 2 if it's not converging. |
| Submission form race condition at deadline minute | High (per ETHGlobal historical) | Submit at 20:30 IST (1h buffer). Iterate README until cutoff. |
| Sponsor Discord post reads as needy at this stage | Medium | Don't post unless you have specific evidence + a sharp implementation question. Skip if uncertain. |

---

## What this plan does NOT include

- Detailed Solidity / TypeScript / React code — see `docs/02_ARCHITECTURE.md` and the engineering scaffolding (created during Phase 1)
- The submission form's natural-language project description — drafted during Phase 4 step 21
- Final demo voiceover script — already in `docs/03_DEMO_SCRIPT.md` (apply final-cut adjustments during Phase 3)
- Brand assets (logo, font files, color palette) — already in `docs/09_BRAND_IDENTITY.md`

## When this plan changes

If a step's hour budget is consistently overrun by ≥50%, surface in team channel BEFORE sinking another hour. Cut the next-lowest-priority step from Phase 4. The submission form at 20:30 IST is non-negotiable; everything else can be reduced.

If a sponsor track integration becomes infeasible (e.g. ENS resolver gateway can't ship in time), demote to "future work" in README and recompose the demo around the 2 sponsors that did ship. **Never ship a fake / theatrical demo of a sponsor integration** — the redteam analysis showed that's the highest-fraud-smell behavior and disqualifies us cleanly.

---

## Reference

| Need | File |
|---|---|
| Why these 3 sponsors | `tools/council/STAGE3_CHAIRMAN.md` §1 |
| Per-doc rationale for May 2 changes | `tools/council/STAGE3_CHAIRMAN.md` §5 |
| ENS integration code shape | `tools/council_alt/STAGE3_CHAIRMAN.md` §3 |
| Sponsor research depth | `tools/research/{0g,gensyn-axl,keeperhub-and-rules,ens}.md` |
| Sponsor judges' own framing | `/tmp/yt-transcripts/sponsor-workshops/{0g,axl,ens,uniswap,keeperhub}.txt` |
| Per-document master plan | `docs/<NN>_<NAME>.md` (11 docs) |
| Sponsor proofs (populated during build) | `proofs/{0g,axl,ens}-proof.md` |

---

*Locked May 2, 2026, 17:00 IST. Update only via PR with rationale, not in-flight.*
