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

const workerAddress = requireEnv(env, "NEXT_PUBLIC_LEDGER_ZERO_WORKER_INFT");
const marketplaceAddress = env.NEXT_PUBLIC_LEDGER_ZERO_MARKETPLACE;
if (!marketplaceAddress) {
  console.log(
    JSON.stringify(
      {
        ok: true,
        status: "blocked",
        blocker: "NEXT_PUBLIC_LEDGER_ZERO_MARKETPLACE is not configured; run pnpm deploy:0g:marketplace after funding.",
      },
      null,
      2,
    ),
  );
  process.exit(0);
}

const workerCode = await provider.getCode(workerAddress);
const marketplaceCode = await provider.getCode(marketplaceAddress);

if (workerCode === "0x") throw new Error("WorkerINFT is not deployed at NEXT_PUBLIC_LEDGER_ZERO_WORKER_INFT");
if (marketplaceCode === "0x") {
  throw new Error("LedgerMarketplace is not deployed at NEXT_PUBLIC_LEDGER_ZERO_MARKETPLACE");
}

const workerINFT = new ethers.Contract(
  workerAddress,
  [
    "function nextTokenId() external view returns (uint256)",
    "function mint(address to,string agentName,bytes sealedKey,string memoryCID,string initialReputationRef) external returns (uint256)",
    "function approve(address to,uint256 tokenId) external",
    "function ownerOf(uint256 tokenId) external view returns (address)",
    "function getApproved(uint256 tokenId) external view returns (address)",
  ],
  signer,
);

const marketplace = new ethers.Contract(
  marketplaceAddress,
  [
    "function listWorker(uint256 tokenId,uint256 price) external",
    "function buyWorker(uint256 tokenId,bytes sealedKey,bytes proof) external payable",
    "function activeListing(uint256 tokenId) external view returns (address seller,uint256 price,bool active,uint64 listedAt)",
  ],
  signer,
);

async function sent(label, txPromise) {
  const tx = await txPromise;
  const receipt = await tx.wait();
  return { label, hash: tx.hash, block: receipt.blockNumber };
}

const balance = await provider.getBalance(signer.address);
if (balance < ethers.parseEther("0.015")) {
  console.log(
    JSON.stringify(
      {
        ok: true,
        status: "blocked",
        blocker: `Project test wallet balance too low for marketplace live test: ${ethers.formatEther(balance)} 0G`,
      },
      null,
      2,
    ),
  );
  process.exit(0);
}

const stamp = Date.now().toString(36);
const agentName = `market-${stamp}`;
const memoryRoot = "0g://0x276c5a0616d6172fcd7b16feafb0feb35efb2de9e1966fe7b74aea4204ed245c";
const proof = ethers.toUtf8Bytes("ledger-pure0g-mock-proof");
const salePrice = ethers.parseEther("0.0002");
const buyer = ethers.Wallet.createRandom().connect(provider);
const tokenId = await workerINFT.nextTokenId();
const sellerBalanceBeforeFlow = await provider.getBalance(signer.address);
const txs = [];

txs.push(
  await sent(
    "mint WorkerINFT",
    workerINFT.mint(signer.address, agentName, ethers.toUtf8Bytes("sealed-market-e2e"), memoryRoot, "erc8004:galileo"),
  ),
);
txs.push(await sent("approve marketplace", workerINFT.approve(marketplaceAddress, tokenId)));
txs.push(await sent("list worker", marketplace.listWorker(tokenId, salePrice)));

const approved = await workerINFT.getApproved(tokenId);
if (approved.toLowerCase() !== marketplaceAddress.toLowerCase()) {
  throw new Error("WorkerINFT approval did not point at LedgerMarketplace");
}

const listing = await marketplace.activeListing(tokenId);
if (listing.seller.toLowerCase() !== signer.address.toLowerCase()) throw new Error("listing seller mismatch");
if (listing.price !== salePrice || !listing.active) throw new Error("listing was not active at the expected price");

txs.push(await sent("fund buyer wallet", signer.sendTransaction({ to: buyer.address, value: ethers.parseEther("0.002") })));
const sellerBalanceBeforeBuy = await provider.getBalance(signer.address);
const buyerMarketplace = marketplace.connect(buyer);
txs.push(
  await sent(
    "buy worker",
    buyerMarketplace.buyWorker(tokenId, ethers.toUtf8Bytes(`sealed-market-e2e:${buyer.address}`), proof, {
      value: salePrice,
    }),
  ),
);

const ownerAfter = await workerINFT.ownerOf(tokenId);
const sellerBalanceAfter = await provider.getBalance(signer.address);

if (ownerAfter.toLowerCase() !== buyer.address.toLowerCase()) throw new Error("ownerOf token did not update to buyer");
if (sellerBalanceAfter < sellerBalanceBeforeBuy + salePrice) {
  throw new Error("seller balance did not reflect marketplace settlement");
}

console.log(
  JSON.stringify(
    {
      ok: true,
      signer: signer.address,
      buyer: buyer.address,
      marketplace: marketplaceAddress,
      tokenId: tokenId.toString(),
      salePrice0G: ethers.formatEther(salePrice),
      ownerAfter,
      sellerBalanceBeforeFlow0G: ethers.formatEther(sellerBalanceBeforeFlow),
      sellerBalanceBeforeBuy0G: ethers.formatEther(sellerBalanceBeforeBuy),
      sellerBalanceAfter0G: ethers.formatEther(sellerBalanceAfter),
      txs,
    },
    null,
    2,
  ),
);
