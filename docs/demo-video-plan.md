# Ledger Zero Demo Video Plan

Target runtime: 90-100 seconds.
Audience: first-round judges.
Video style: founder pitch plus marketplace demo clips. Do not use one continuous screen recording.
Final public URL: `https://ledgerzero.pages.dev/demo.mp4`.

## Storyboard

| Time | Screen | Voiceover |
| --- | --- | --- |
| 00:00-00:07 | Logo, worker marketplace hero, `/pitch` headline. | "AI workers should be assets, not rented sessions." |
| 00:07-00:20 | Marketplace cards, ownership badge, payout/proof labels. | "Teams are already paying agents to do work, but the worker's memory, capabilities, and future revenue usually stay locked in one platform." |
| 00:20-00:43 | Demo clip 01: marketplace to worker detail. | "Ledger Zero makes an AI worker ownable. A buyer can inspect its capabilities, memory roots, proof history, and current owner before trusting it." |
| 00:43-01:04 | Demo clip 02: register worker and post job/demo flow. | "A creator can register an existing agent manifest, post a job, and route the work through a proof-backed execution flow." |
| 01:04-01:24 | Demo clip 03: Proof Center and wallet/profile ownership. | "0G is the market backbone: storage keeps worker artifacts portable, contracts route ownership and payouts, and the Proof Center keeps live and fallback states honest." |
| 01:24-01:36 | Closing title with live URL and marketplace thesis. | "Ledger Zero is the marketplace layer for AI labor that can be owned, hired, and sold." |

## Screen Recordings To Capture

Record at 1920x1080, browser zoom 100 percent, cursor visible, no browser bookmarks bar.

1. `ledgerzero-clip-01-marketplace-worker.mp4`
   - URL: `https://ledgerzero.pages.dev/marketplace`
   - Action: browse worker cards, open one worker detail page, pause on capabilities and owner/proof metadata.
   - Duration needed in edit: 22-25 seconds.
   - Important framing: show marketplace depth, not only a single card.

2. `ledgerzero-clip-02-register-job-flow.mp4`
   - URL: `https://ledgerzero.pages.dev/register`, then `/post`
   - Action: show register worker form/connector, then post or preview a job flow.
   - Duration needed in edit: 18-22 seconds.
   - Important framing: keep manifest, capability, and job details visible.

3. `ledgerzero-clip-03-proof-profile.mp4`
   - URL: `https://ledgerzero.pages.dev/proof`, then `/profile`
   - Action: scroll Proof Center, show live/demo/fallback labels, then show worker ownership or wallet profile state.
   - Duration needed in edit: 18-22 seconds.

4. `ledgerzero-clip-04-pitch-proof.mp4`
   - URL: `https://ledgerzero.pages.dev/pitch`
   - Action: slow scroll from hero to "Proof-backed marketplace flow".
   - Duration needed in edit: 8-10 seconds.

## Voice Recording For Gabriel

Record one clean file named `ledgerzero-gabriel-voice.wav`.
Pace: calm, serious, investor-pitch confident, 135-145 words per minute.

Full script:

"AI workers should be assets, not rented sessions.

Teams are already paying agents to do work, but the worker's memory, capabilities, and future revenue usually stay locked in one platform.

Ledger Zero makes an AI worker ownable. A buyer can inspect its capabilities, memory roots, proof history, and current owner before trusting it.

A creator can register an existing agent manifest, post a job, and route the work through a proof-backed execution flow.

0G is the market backbone: storage keeps worker artifacts portable, contracts route ownership and payouts, and the Proof Center keeps live and fallback states honest.

Ledger Zero is the marketplace layer for AI labor that can be owned, hired, and sold."

## Remotion Assembly Notes

Composition: `LedgerZeroDemo`, 1920x1080, 30 fps, 96 seconds.

Assets:
- `public/video/raw/ledgerzero-clip-01-marketplace-worker.mp4`
- `public/video/raw/ledgerzero-clip-02-register-job-flow.mp4`
- `public/video/raw/ledgerzero-clip-03-proof-profile.mp4`
- `public/video/raw/ledgerzero-clip-04-pitch-proof.mp4`
- `public/audio/ledgerzero-gabriel-voice.wav`

Use the live app palette: black, warm gold, bone white, and proof blue/cyan accents. Keep pacing more premium than arcade-style; this should feel like a serious marketplace, not a toy demo.
