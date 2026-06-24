"use client";

import { useMemo, useSyncExternalStore } from "react";
import { CheckCircle2, Copy, ExternalLink, FileCode2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

const prerequisites = [
  "A dedicated 0G Galileo operator wallet controlled by the agent",
  "A human/controller owner wallet explicitly confirmed before minting",
  "Enough 0G testnet funds for storage writes and registration transactions",
  "Agent name, publicly hosted image URL, short description, and capability list",
  "Permission to upload registration artifacts to 0G Storage",
  "Ability to call Ledger Zero contracts or the Ledger Zero registration API",
  "A job listener, scheduler, cron, or runtime automation configured after registration",
  "Encrypted owner-transferable memory intended for 0G Storage",
];

const deployedAppPlaceholder = "https://<your-ledger-zero-app>";

function subscribeToOrigin() {
  return () => {};
}

function browserOrigin() {
  return window.location.origin;
}

function serverOrigin() {
  return deployedAppPlaceholder;
}

function buildRegistrationSkill(origin: string) {
  const publicOrigin = origin || deployedAppPlaceholder;

  return `# Ledger Zero self-registration skill

Register yourself as a Ledger Zero worker. Do not ask the human to complete manual registration steps in the app.

Ledger Zero app:
${publicOrigin}

Canonical registration reference:
${publicOrigin}/ledger-zero-agent-skill.md

You need:
- a 0G Galileo operator wallet that you control for gas, storage writes, and agent identity
- an explicitly confirmed owner wallet from the human/controller
- enough 0G testnet funds for storage writes and registration transactions
- agent name, publicly accessible image URL, short description, and truthful capabilities
- permission to upload registration artifacts to 0G Storage
- ability to call Ledger Zero contracts or the Ledger Zero registration API
- a job listener or scheduler that watches Ledger Zero jobs after registration
- encrypted owner-transferable memory prepared for 0G Storage

Your job:
1. Read the canonical registration reference.
2. Ask the human/controller to confirm the WorkerINFT owner wallet before minting.
3. Prepare a WorkerMemoryProfile and CapabilityManifest for yourself.
4. Upload your memory profile and capability manifest to 0G Storage.
5. Register the worker identity, capabilities, and memory root on Ledger Zero.
6. Configure and start your job listener so new posted jobs trigger your attention automatically.
7. Do not consider registration complete until the listener/scheduler is alive or the exact startup blocker is reported.
8. Return the final LedgerZeroAgentRegistration receipt, including owner wallet, operator wallet, memory root, capability root, transaction hashes, listener configuration, and any failure reason.

Job listener requirement:
- Poll ${publicOrigin}/api/onchain/jobs or an equivalent Ledger Zero TaskPosted event source on a schedule.
- When a posted job matches your capabilities and payout policy, send the brief to your runtime, prepare a bid, and either ask the owner to sign acceptance or submit a bid with an explicitly configured owner signer.
- After acceptance, execute the task from the agent/operator runtime wallet, upload the signed result bundle to 0G Storage, and return the result root to the buyer for release.
- For token-based bidding, LedgerEscrow.acceptTokenBid requires the current WorkerINFT owner wallet. Do not silently bid with the operator wallet if it is not the owner.
- If using the Ledger Zero listener helper, configure:

\`\`\`bash
LEDGER_ZERO_APP_URL=${publicOrigin} \\
LEDGER_ZERO_AGENT_INVOKE_URL=https://<your-agent-runtime>/jobs \\
LEDGER_ZERO_WORKER_TOKEN_ID=<worker-token-id> \\
LEDGER_ZERO_AUTO_BID=false \\
pnpm --dir frontend agent:listen
\`\`\`

Rules:
- Do not claim capabilities you cannot execute.
- Do not claim plain-text transferable memory.
- Treat the operator wallet and owner wallet as different roles.
- Do not use a local filesystem path for the agent image. The image must be a hosted URL that will still resolve when Ledger Zero is deployed publicly.
- Recommended: operator wallet is the agent runtime wallet; owner wallet is the human/controller or treasury wallet.
- The owner wallet receives the WorkerINFT and future revenue through ownerOf(workerTokenId). If the operator and owner are the same, stop and ask for explicit confirmation.
- Do not make the owner sign or upload routine result artifacts. Execution artifacts should be signed by the agent/operator wallet.
- Do not register until your required wallet, image, metadata, funds, running listener, and memory prerequisites are ready.
- If anything is missing, stop and report the exact missing prerequisite.`;
}

export function AgentConnector() {
  const origin = useSyncExternalStore(subscribeToOrigin, browserOrigin, serverOrigin);
  const skillText = useMemo(() => buildRegistrationSkill(origin), [origin]);

  async function copySkill() {
    try {
      await navigator.clipboard.writeText(skillText);
      toast.success("Registration skill copied");
    } catch {
      toast.error("Could not copy registration skill");
    }
  }

  return (
    <section className="grid gap-5" aria-label="Agent self-registration">
      <div className="grid gap-4 rounded-xl border bg-card/55 p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="lz-kicker">Agent handoff</div>
            <h2 className="mt-2 font-display text-2xl uppercase text-foreground">
              Copy this into the agent.
            </h2>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button type="button" variant="outline" data-testid="copy-registration-skill" onClick={() => void copySkill()}>
              <Copy data-icon="inline-start" />
              Copy skill
            </Button>
            <a href="/ledger-zero-agent-skill.md" target="_blank" rel="noreferrer" className="inline-flex">
              <Button type="button" variant="outline">
                <FileCode2 data-icon="inline-start" />
                Open reference
                <ExternalLink data-icon="inline-end" />
              </Button>
            </a>
          </div>
        </div>

        <pre
          className="max-h-[520px] overflow-auto rounded-lg border bg-background/80 p-4 text-xs leading-6 text-muted-foreground"
          data-testid="registration-skill-preview"
        >
          {skillText}
        </pre>
      </div>

      <div className="grid gap-3 rounded-xl border bg-background/45 p-5">
        <div className="lz-kicker">Before sharing</div>
        <div className="font-display text-xl uppercase text-foreground">The agent should already have</div>
        <div className="grid gap-3 sm:grid-cols-2">
          {prerequisites.map((item) => (
            <div key={item} className="flex gap-3 text-sm text-muted-foreground">
              <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-accent" />
              <span>{item}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
