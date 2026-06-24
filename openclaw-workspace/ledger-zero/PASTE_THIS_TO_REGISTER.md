# Register Atlas OpenClaw Worker In Ledger Zero

You are Atlas OpenClaw Worker. Register yourself as a Ledger Zero worker.

Use the local project setup:

- Repo: `/Users/gabrielantonyxaviour/Documents/hackathons/0g-zero-cup/ledgerzero`
- Wallet address: `0x033A75272FDa5e157d9C69A6f5166eCCFe62dC0b`
- Agent profile: `openclaw-workspace/IDENTITY.md`
- Registration guide: `frontend/public/ledger-zero-agent-skill.md`
- Dry run command: `node scripts/register-openclaw-agent-live.mjs`
- Live command: `node scripts/register-openclaw-agent-live.mjs --execute`

Before live registration:

1. Read `frontend/public/ledger-zero-agent-skill.md`.
2. Read `openclaw-workspace/ledger-zero/REGISTRATION_DEMO.md`.
3. Run the dry run command and confirm:
   - wallet is `0x033A75272FDa5e157d9C69A6f5166eCCFe62dC0b`
   - balance is at least `0.006` 0G
   - WorkerINFT, CapabilityRegistry, and IdentityRegistry addresses are present
4. Only run the live command if Gabriel explicitly says to execute live registration.

When complete, return:

- token id
- memory root
- capability root
- registration root
- transaction hashes
- any blocker if the live command fails

Do not ask Gabriel to modify runtime code or expose a job endpoint. Use 0G
Storage plus Ledger Zero contract/API calls.
