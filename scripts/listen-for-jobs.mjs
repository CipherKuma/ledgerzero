import { createRequire } from "node:module";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";

const requireFromFrontend = createRequire(new URL("../frontend/package.json", import.meta.url));
const { ethers } = requireFromFrontend("ethers");

const projectRoot = path.resolve(new URL("..", import.meta.url).pathname);
const frontendRoot = path.join(projectRoot, "frontend");

const escrowAbi = [
  "function acceptTokenBid(bytes32 taskId,uint256 workerTokenId,uint256 bidAmount,uint256 bondAmount) external payable",
];

function readEnvFile(file) {
  if (!existsSync(file)) return;
  const body = readFileSync(file, "utf8");
  for (const line of body.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#") || !trimmed.includes("=")) continue;
    const index = trimmed.indexOf("=");
    const key = trimmed.slice(0, index).trim();
    const raw = trimmed.slice(index + 1).trim();
    if (!key || process.env[key] !== undefined) continue;
    process.env[key] = raw.replace(/^['"]|['"]$/g, "");
  }
}

readEnvFile(path.join(frontendRoot, ".env.local"));
readEnvFile(path.join(projectRoot, ".env.local"));

function argValue(name) {
  const prefix = `${name}=`;
  const match = process.argv.slice(2).find((arg) => arg.startsWith(prefix));
  return match ? match.slice(prefix.length) : undefined;
}

const args = new Set(process.argv.slice(2));
const once = args.has("--once");
const includeSeen = args.has("--include-seen");
const forcedDryRun = args.has("--dry-run");
const maxJobs = Number(argValue("--max-jobs") ?? process.env.LEDGER_ZERO_MAX_JOBS ?? "5");
const appUrl = (process.env.LEDGER_ZERO_APP_URL ?? "http://localhost:3023").replace(/\/$/, "");
const jobsUrl = process.env.LEDGER_ZERO_JOBS_URL ?? `${appUrl}/api/onchain/jobs`;
const invokeUrl = process.env.LEDGER_ZERO_AGENT_INVOKE_URL ?? "";
const statePath = path.resolve(
  projectRoot,
  process.env.LEDGER_ZERO_JOB_STATE_FILE ?? ".ledger-zero/job-listener-state.json",
);
const pollMs = Math.max(Number(process.env.LEDGER_ZERO_JOB_POLL_MS ?? "15000"), 5000);
const autoBid = process.env.LEDGER_ZERO_AUTO_BID === "true" && !forcedDryRun;
const privateKey = process.env.LEDGER_ZERO_BID_PRIVATE_KEY ?? "";
const workerTokenId = process.env.LEDGER_ZERO_WORKER_TOKEN_ID ?? "";
const rpcUrl =
  process.env.LEDGER_ZERO_RPC ??
  process.env.NEXT_PUBLIC_GALILEO_RPC ??
  process.env.NEXT_PUBLIC_0G_RPC_URL ??
  process.env.ZEROG_RPC ??
  "";
const escrowAddress = process.env.LEDGER_ZERO_ESCROW_ADDRESS ?? process.env.NEXT_PUBLIC_LEDGER_ZERO_ESCROW ?? "";
const bidAmount0G = process.env.LEDGER_ZERO_BID_AMOUNT_0G ?? "";
const bondAmount0G = process.env.LEDGER_ZERO_BOND_AMOUNT_0G ?? "0.0001";
const minPayout0G = Number(process.env.LEDGER_ZERO_MIN_PAYOUT_0G ?? "0");
const keywords = (process.env.LEDGER_ZERO_JOB_KEYWORDS ?? "")
  .split(",")
  .map((keyword) => keyword.trim().toLowerCase())
  .filter(Boolean);

function loadState() {
  if (!existsSync(statePath)) return { jobs: {} };
  try {
    const parsed = JSON.parse(readFileSync(statePath, "utf8"));
    return parsed && typeof parsed === "object" && parsed.jobs ? parsed : { jobs: {} };
  } catch {
    return { jobs: {} };
  }
}

function saveState(state) {
  mkdirSync(path.dirname(statePath), { recursive: true });
  writeFileSync(statePath, JSON.stringify(state, null, 2));
}

function parse0G(value) {
  if (typeof value !== "string") return 0;
  return Number(value.replace(/\s*0G\s*$/i, ""));
}

function jobText(job) {
  return [job.title, job.category, job.status, job.buyerAddress].filter(Boolean).join(" ").toLowerCase();
}

function isCandidate(job) {
  if (job.status !== "posted") return false;
  if (parse0G(job.payout) < minPayout0G) return false;
  if (keywords.length && !keywords.some((keyword) => jobText(job).includes(keyword))) return false;
  return true;
}

async function fetchJobs() {
  const response = await fetch(jobsUrl, { signal: AbortSignal.timeout(15000) });
  if (!response.ok) throw new Error(`jobs endpoint returned ${response.status}`);
  const body = await response.json();
  if (!Array.isArray(body)) throw new Error("jobs endpoint did not return an array");
  return body;
}

async function notifyAgent(job) {
  if (!invokeUrl) {
    return {
      status: "skipped",
      detail: "LEDGER_ZERO_AGENT_INVOKE_URL is not set; listener recorded the matching job only.",
    };
  }

  const response = await fetch(invokeUrl, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      source: "ledger-zero-job-listener",
      taskId: job.id,
      task: job.title,
      category: job.category,
      payout: job.payout,
      bond: job.bond,
      minReputation: job.minReputation,
      buyerAddress: job.buyerAddress,
      postedTx: job.postedTx,
      deadline: job.deadline,
      instructions:
        "Review this Ledger Zero job. If it fits your truthful capabilities and owner policy, prepare a bid receipt and, when configured, submit an on-chain bid.",
    }),
    signal: AbortSignal.timeout(15000),
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(`agent invoke returned ${response.status}: ${JSON.stringify(body)}`);
  return { status: "notified", detail: body };
}

async function submitBid(job) {
  if (!autoBid) return null;
  const missing = [];
  if (!privateKey) missing.push("LEDGER_ZERO_BID_PRIVATE_KEY");
  if (!workerTokenId) missing.push("LEDGER_ZERO_WORKER_TOKEN_ID");
  if (!rpcUrl) missing.push("LEDGER_ZERO_RPC");
  if (!escrowAddress) missing.push("LEDGER_ZERO_ESCROW_ADDRESS");
  if (missing.length) throw new Error(`auto-bid missing ${missing.join(", ")}`);

  const payout = ethers.parseEther(parse0G(job.payout).toString());
  const bidAmount = ethers.parseEther(bidAmount0G || parse0G(job.payout).toString());
  const bondAmount = ethers.parseEther(bondAmount0G);
  if (bidAmount > payout) throw new Error("bid amount cannot exceed task payout");

  const provider = new ethers.JsonRpcProvider(rpcUrl);
  const signer = new ethers.Wallet(privateKey, provider);
  const escrow = new ethers.Contract(escrowAddress, escrowAbi, signer);
  const tx = await escrow.acceptTokenBid(job.id, workerTokenId, bidAmount, bondAmount, { value: bondAmount });
  const receipt = await tx.wait();
  return { hash: tx.hash, blockNumber: receipt?.blockNumber ?? null };
}

async function processJob(state, job) {
  const seen = state.jobs[job.id];
  if (seen && !includeSeen) return "seen";

  const startedAt = new Date().toISOString();
  try {
    const notification = await notifyAgent(job);
    const bid = await submitBid(job);
    state.jobs[job.id] = {
      taskId: job.id,
      status: bid ? "bid-submitted" : notification.status,
      notifiedAt: startedAt,
      updatedAt: new Date().toISOString(),
      postedTx: job.postedTx,
      bidTx: bid?.hash ?? null,
      bidBlock: bid?.blockNumber ?? null,
    };
    saveState(state);
    process.stdout.write(
      `[ledger-zero-listener] ${job.id} ${state.jobs[job.id].status}${bid?.hash ? ` ${bid.hash}` : ""}\n`,
    );
    return state.jobs[job.id].status;
  } catch (error) {
    state.jobs[job.id] = {
      taskId: job.id,
      status: "error",
      notifiedAt: startedAt,
      updatedAt: new Date().toISOString(),
      postedTx: job.postedTx,
      error: error instanceof Error ? error.message : String(error),
    };
    saveState(state);
    throw error;
  }
}

async function tick() {
  const state = loadState();
  const jobs = await fetchJobs();
  const candidates = jobs.filter(isCandidate).slice(0, Number.isFinite(maxJobs) ? maxJobs : 5);
  if (!candidates.length) {
    process.stdout.write("[ledger-zero-listener] no matching open jobs\n");
    return;
  }

  for (const job of candidates) {
    await processJob(state, job);
  }
}

async function main() {
  process.stdout.write(
    `[ledger-zero-listener] watching ${jobsUrl}; auto-bid ${autoBid ? "enabled" : "disabled"}; poll ${pollMs}ms\n`,
  );
  await tick();
  if (once) return;
  setInterval(() => {
    tick().catch((error) => {
      process.stderr.write(`[ledger-zero-listener] ${error instanceof Error ? error.message : String(error)}\n`);
    });
  }, pollMs);
}

main().catch((error) => {
  process.stderr.write(`[ledger-zero-listener] ${error instanceof Error ? error.message : String(error)}\n`);
  process.exitCode = 1;
});
