# Team

Four of us, working remote. This file is the quick "who does what" so a new
collaborator (or a coding agent) can route a question to the right person and
read commits in the right voice.

## Roster

| Person           | Role                                                                                                                |
| ---------------- | ------------------------------------------------------------------------------------------------------------------- |
| **Gabriel**      | Project lead. Architecture, contracts, ENS resolver, integration plumbing, the buck.                                |
| **Joel**         | Backend engineering. Agent runtime, AXL mesh, gossipsub, contracts plumbing, deploy ops.                            |
| **Joanna**       | Research & docs. Sponsor research, doc QA, submission prep, README polish, things that need a careful pair of eyes. |
| **DarthStormer** | Brand & motion. Identity system, Higgsfield, demo-video edit, sound, anything visual.                               |

## Submission contact

Gabriel is the lead contact for ETHGlobal and sponsor follow-up.

| Channel  | Handle                                          |
| -------- | ----------------------------------------------- |
| Telegram | `@gabrielaxyy`                                  |
| X        | [`@gabrielaxyeth`](https://x.com/gabrielaxyeth) |

## How we write commit subjects

We're loose about format but the prefix tends to track who's writing. Skim
`git log` and you'll see the pattern.

| Prefix             | Usually written by | Used for                                                          |
| ------------------ | ------------------ | ----------------------------------------------------------------- |
| `notes:` / `todo:` | Gabriel            | Lead-level decisions, architecture call-outs, project-state notes |
| `wip:`             | Joel               | In-progress engineering — agent runtime, AXL, contracts, deploys  |
| `research:`        | Joanna             | Sponsor research, doc passes, submission ops                      |
| `creative:`        | DarthStormer       | Brand assets, visual decisions, demo-video work                   |
| `scratchpad:`      | (anyone)           | End-of-day captures, working notes                                |

These aren't strict — if Joel wants to leave a `notes:` thought he can — but
keeping the rough split makes the history easier to read at a glance.

## Where work gets coordinated

- **Specs:** `docs/` (numbered: `00_MASTER_BRIEF.md`, `01_PRD.md`, …)
- **Council deliberations:** `tools/council/` and `tools/council_alt/`
- **Builder briefings:** `tools/builder_briefings/` (one per work-stream)
- **Live work-in-progress notes:** `.claude/state/CURRENT_SPEC.md`
- **Day-of submission ops:** `docs/SUBMISSION.md`

Async, written-first. If a thread doesn't fit any of the above, it goes into a
fresh markdown file in `tools/` and gets linked from `docs/INDEX.md`.

## Repository

Working repo: `DarthStormerXII/ledger` (lead has push). A second remote at
`CipherKuma/ledger` mirrors it for Vercel auto-deploys. The lead's local
`origin` has both URLs as pushurls so a single `git push` keeps them in sync.
If you fork, you only need the working repo.
