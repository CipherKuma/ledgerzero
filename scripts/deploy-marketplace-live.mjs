import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { createRequire } from "node:module";
import { readFrontendEnv, requireEnv } from "./env.mjs";

const requireFromFrontend = createRequire(new URL("../frontend/package.json", import.meta.url));
const { ethers } = requireFromFrontend("ethers");

const root = path.resolve(new URL("..", import.meta.url).pathname);
const envPath = path.join(root, "frontend", ".env.local");
const env = readFrontendEnv(root);
const provider = new ethers.JsonRpcProvider(requireEnv(env, "ZEROG_RPC"));
const privateKey = requireEnv(env, "ZEROG_PROJECT_TEST_PRIVATE_KEY");
const signer = new ethers.Wallet(privateKey, provider);
const expectedAddress = requireEnv(env, "ZEROG_PROJECT_TEST_WALLET_ADDRESS").toLowerCase();
const workerINFT = requireEnv(env, "NEXT_PUBLIC_LEDGER_ZERO_WORKER_INFT");

if (signer.address.toLowerCase() !== expectedAddress) {
  throw new Error("Project test private key does not match project test wallet address");
}

const balance = await provider.getBalance(signer.address);
if (balance < ethers.parseEther("0.005")) {
  throw new Error(`Project test wallet balance too low to deploy marketplace: ${ethers.formatEther(balance)} 0G`);
}

const result = spawnSync(
  "forge",
  [
    "script",
    "script/DeployMarketplace.s.sol",
    "--rpc-url",
    requireEnv(env, "ZEROG_RPC"),
    "--broadcast",
    "--priority-gas-price",
    "2000000000",
    "--with-gas-price",
    "3000000000",
  ],
  {
    cwd: path.join(root, "contracts"),
    env: {
      ...process.env,
      PRIVATE_KEY: privateKey,
      NEXT_PUBLIC_LEDGER_ZERO_WORKER_INFT: workerINFT,
    },
    encoding: "utf8",
  },
);

if (result.status !== 0) {
  process.stderr.write(result.stderr);
  process.stdout.write(result.stdout);
  process.exit(result.status ?? 1);
}

const match = result.stdout.match(/LedgerMarketplace deployed at:\s*(0x[a-fA-F0-9]{40})/);
if (!match) {
  process.stdout.write(result.stdout);
  throw new Error("Could not parse deployed LedgerMarketplace address from forge output");
}

const marketplaceAddress = match[1];
const current = fs.readFileSync(envPath, "utf8");
const next = current.includes("NEXT_PUBLIC_LEDGER_ZERO_MARKETPLACE=")
  ? current.replace(/^NEXT_PUBLIC_LEDGER_ZERO_MARKETPLACE=.*$/m, `NEXT_PUBLIC_LEDGER_ZERO_MARKETPLACE=${marketplaceAddress}`)
  : `${current.trimEnd()}\nNEXT_PUBLIC_LEDGER_ZERO_MARKETPLACE=${marketplaceAddress}\n`;

fs.writeFileSync(envPath, next);
console.log(
  JSON.stringify(
    {
      ok: true,
      marketplace: marketplaceAddress,
      workerINFT,
      signer: signer.address,
      envUpdated: "frontend/.env.local",
    },
    null,
    2,
  ),
);
