import { createRequire } from "node:module";
import { readFrontendEnv, requireEnv } from "./env.mjs";

const requireFromFrontend = createRequire(new URL("../frontend/package.json", import.meta.url));
const { ethers } = requireFromFrontend("ethers");

const env = readFrontendEnv(new URL("..", import.meta.url).pathname);
const provider = new ethers.JsonRpcProvider(requireEnv(env, "ZEROG_RPC"));
const signer = new ethers.Wallet(requireEnv(env, "ZEROG_PROJECT_TEST_PRIVATE_KEY"), provider);
const expectedAddress = requireEnv(env, "ZEROG_PROJECT_TEST_WALLET_ADDRESS").toLowerCase();

if (signer.address.toLowerCase() !== expectedAddress) {
  throw new Error("Project test private key does not match project test wallet address");
}

const workerINFT = new ethers.Contract(
  requireEnv(env, "NEXT_PUBLIC_LEDGER_ZERO_WORKER_INFT"),
  [
    "function nextTokenId() external view returns (uint256)",
    "function mint(address to,string agentName,bytes sealedKey,string memoryCID,string initialReputationRef) external returns (uint256)",
    "function ownerOf(uint256 tokenId) external view returns (address)",
    "function transfer(address from,address to,uint256 tokenId,bytes sealedKey,bytes proof) external",
  ],
  signer,
);
const capability = new ethers.Contract(
  requireEnv(env, "NEXT_PUBLIC_LEDGER_ZERO_CAPABILITY_REGISTRY"),
  ["function registerCapability(string agentName,bytes32 capabilityHash,string memoryCID,string[] skills,uint256 ratePerHour) external"],
  signer,
);
const identity = new ethers.Contract(
  requireEnv(env, "NEXT_PUBLIC_LEDGER_ZERO_IDENTITY_REGISTRY"),
  ["function registerAgent(address agentAddress,string agentName,string capabilities,uint256 workerTokenId) external"],
  signer,
);
const escrow = new ethers.Contract(
  requireEnv(env, "NEXT_PUBLIC_LEDGER_ZERO_ESCROW"),
  [
    "function postTask(bytes32 taskId,uint256 payment,uint256 deadline,uint256 minReputation) external payable",
    "function acceptTokenBid(bytes32 taskId,uint256 workerTokenId,uint256 bidAmount,uint256 bondAmount) external payable",
    "function payoutRecipient(bytes32 taskId) external view returns (address)",
    "function releasePayment(bytes32 taskId,bytes32 resultHash) external",
    "function tasks(bytes32 taskId) external view returns (address buyer,address worker,uint256 payment,uint256 deadline,uint256 minReputation,uint256 bidAmount,uint256 bondAmount,bytes32 resultHash,uint8 status)",
  ],
  signer,
);
const reputation = new ethers.Contract(
  requireEnv(env, "NEXT_PUBLIC_LEDGER_ZERO_ERC8004"),
  ["function getReputation(address agent) external view returns (uint256 score,uint256 totalJobs,uint256 successfulJobs,uint256 failedJobs,uint256 lastUpdated)"],
  signer,
);

async function sent(label, txPromise) {
  const tx = await txPromise;
  const receipt = await tx.wait();
  return { label, hash: tx.hash, block: receipt.blockNumber };
}

const balance = await provider.getBalance(signer.address);
if (balance < ethers.parseEther("0.01")) {
  console.log(
    JSON.stringify(
      {
        ok: true,
        status: "blocked",
        signer: signer.address,
        signerBalance0G: ethers.formatEther(balance),
        blocker: `Project test wallet balance too low: ${ethers.formatEther(balance)} 0G`,
      },
      null,
      2,
    ),
  );
  process.exit(0);
}

const stamp = Date.now().toString(36);
const agentName = `e2e-${stamp}`;
const taskId = ethers.keccak256(ethers.toUtf8Bytes(`ledger-zero-live-contract-${stamp}`));
const memoryRoot = "0g://0x276c5a0616d6172fcd7b16feafb0feb35efb2de9e1966fe7b74aea4204ed245c";
const newOwner = ethers.Wallet.createRandom().address;
const proof = ethers.toUtf8Bytes("ledger-pure0g-mock-proof");
const tokenId = await workerINFT.nextTokenId();
const txs = [];

txs.push(await sent("mint WorkerINFT", workerINFT.mint(signer.address, agentName, ethers.toUtf8Bytes("sealed-live-e2e"), memoryRoot, "erc8004:galileo")));
txs.push(await sent("register capability", capability.registerCapability(agentName, ethers.keccak256(ethers.toUtf8Bytes(`${agentName}:capabilities`)), memoryRoot, ["live-e2e", "compute", "storage"], ethers.parseEther("0.0005"))));
txs.push(await sent("register identity", identity.registerAgent(signer.address, agentName, "live-e2e,compute,storage", tokenId)));
txs.push(await sent("post escrow task", escrow.postTask(taskId, ethers.parseEther("0.0004"), Math.floor(Date.now() / 1000) + 86400, 0, { value: ethers.parseEther("0.0004") })));
txs.push(await sent("accept token bid", escrow.acceptTokenBid(taskId, tokenId, ethers.parseEther("0.0003"), ethers.parseEther("0.0001"), { value: ethers.parseEther("0.0001") })));

const payoutBefore = await escrow.payoutRecipient(taskId);
if (payoutBefore.toLowerCase() !== signer.address.toLowerCase()) {
  throw new Error("payout recipient before transfer was not project wallet");
}

txs.push(await sent("transfer worker token", workerINFT.transfer(signer.address, newOwner, tokenId, ethers.toUtf8Bytes("sealed-live-e2e-new-owner"), proof)));
const payoutAfter = await escrow.payoutRecipient(taskId);
if (payoutAfter.toLowerCase() !== newOwner.toLowerCase()) {
  throw new Error("payout recipient did not follow transferred worker token");
}

txs.push(await sent("release escrow payment", escrow.releasePayment(taskId, "0x276c5a0616d6172fcd7b16feafb0feb35efb2de9e1966fe7b74aea4204ed245c")));
const ownerAfter = await workerINFT.ownerOf(tokenId);
const task = await escrow.tasks(taskId);
const rep = await reputation.getReputation(newOwner);
const finalBalance = await provider.getBalance(signer.address);

if (ownerAfter.toLowerCase() !== newOwner.toLowerCase()) throw new Error("ownerOf token did not update");
if (Number(task.status) !== 3) throw new Error(`expected released status, got ${Number(task.status)}`);
if (rep.totalJobs < 1n || rep.successfulJobs < 1n) throw new Error("reputation was not recorded for new owner");

console.log(
  JSON.stringify(
    {
      ok: true,
      signer: signer.address,
      signerBalance0G: ethers.formatEther(finalBalance),
      agentName,
      tokenId: tokenId.toString(),
      taskId,
      newOwner,
      payoutBefore,
      payoutAfter,
      taskStatus: Number(task.status),
      reputation: {
        score: rep.score.toString(),
        totalJobs: rep.totalJobs.toString(),
        successfulJobs: rep.successfulJobs.toString(),
      },
      txs,
    },
    null,
    2,
  ),
);
