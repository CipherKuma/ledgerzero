import { expect, test } from "@playwright/test";

const routes: Array<{ path: string; heading: string | RegExp; text: string }> = [
  { path: "/", heading: "Ownable AI workers, explained.", text: "output without ownership" },
  { path: "/marketplace", heading: "Listed worker inventory", text: "Atlas Research Worker" },
  { path: "/workers", heading: "Agentic ID index", text: "Forge Solidity Worker" },
  { path: "/agent/worker-001", heading: "Atlas Research Worker", text: "Capability, trust, and payout state in one view." },
  { path: "/jobs", heading: "Work queue", text: "Produce a 0G ecosystem risk brief" },
  { path: "/jobs/task-risk-brief", heading: /Produce/, text: "Live 0G execution path" },
  { path: "/post", heading: "Job escrow composer", text: "Connect wallet to post" },
  { path: "/register", heading: "Give the agent one registration skill.", text: "Copy this into the agent." },
  { path: "/profile", heading: "Connected wallet profile", text: "Connect your wallet" },
  {
    path: "/wallet",
    heading: "Latest receipt state for workers, payouts, and memory roots.",
    text: "Latest transfer proof",
  },
  { path: "/proof", heading: "Artifact explorer", text: "Latest artifact rows" },
];

test.describe("Ledger Zero route matrix", () => {
  for (const route of routes) {
    test(`${route.path} renders the expected product surface`, async ({ page }) => {
      await page.goto(route.path);
      await expect(page.getByRole("heading", { name: route.heading })).toBeVisible();
      await expect(page.getByText(route.text).first()).toBeVisible();
      await expect(page.getByRole("link", { name: "Ledger Zero 0G worker market" })).toBeVisible();
    });
  }
});

test("register page exposes one universal agent handoff flow", async ({ page }) => {
  await page.goto("/register");
  await expect(page.getByTestId("external-agent-inspector")).toHaveCount(0);
  await expect(page.getByTestId("inspect-external-agent")).toHaveCount(0);
  await expect(page.getByTestId("copy-registration-skill")).toBeVisible();
  await expect(page.getByRole("link", { name: /open reference/i })).toHaveAttribute(
    "href",
    "/ledger-zero-agent-skill.md",
  );
  await expect(page.getByTestId("registration-skill-preview")).toContainText("Ledger Zero self-registration skill");
  await expect(page.getByTestId("registration-skill-preview")).toContainText("Canonical registration reference");
  await expect(page.getByText("The agent should already have")).toBeVisible();
  await expect(page.getByTestId("registration-payload-preview")).toHaveCount(0);
});

test("register, post, job room, and proof expose only real receipt-producing controls", async ({ page }) => {
  await page.goto("/register");
  await expect(page.getByTestId("copy-registration-skill")).toBeVisible();
  await expect(page.getByTestId("register-connected-agent")).toHaveCount(0);
  await expect(page.getByText("Copy this into the agent.").first()).toBeVisible();

  await page.goto("/post");
  await expect(page.getByTestId("post-demo-task")).toContainText("Connect wallet to post");

  await page.goto("/jobs/task-risk-brief");
  await expect(page.getByTestId("demo-next-step")).toHaveCount(0);
  await expect(page.getByTestId("run-live-demo-flow")).toBeVisible();
  await expect(page.getByTestId("demo-flow-status")).toContainText("settled");
  await expect(page.getByTestId("demo-flow-steps")).toContainText("release escrow payment");

  await page.getByTestId("open-proof").click();
  await expect(page).toHaveURL(/\/proof\?demo=settled$/);
  await expect(page.getByRole("heading", { name: "Artifact explorer" })).toBeVisible();
  await expect(page.getByTestId("latest-demo-flow")).toContainText("Latest end-to-end demo");
});

test("live demo receipt is visible across job room, marketplace, wallet, and proof", async ({ page }) => {
  await page.goto("/jobs/task-risk-brief");
  await expect(page.getByTestId("run-live-demo-flow")).toBeVisible();

  await page.goto("/marketplace");
  await expect(page.getByTestId("marketplace-latest-sale")).toContainText("Latest full-flow sale receipt");
  await expect(page.getByTestId("marketplace-latest-sale")).toContainText("Future payout owner");

  await page.goto("/wallet");
  await expect(page.getByTestId("wallet-latest-demo-revenue")).toContainText("New owner revenue receipt");
  await expect(page.getByTestId("wallet-latest-demo-revenue")).toContainText("ownerOf(workerTokenId)");

  await page.goto("/proof");
  await expect(page.getByTestId("latest-demo-flow")).toContainText("Latest end-to-end demo");
  await expect(page.getByTestId("latest-demo-flow")).toContainText("release escrow payment");
  await expect(page.getByTestId("latest-demo-attempt")).toBeVisible();
});

test("marketplace shows only listed workers while workers shows all registered workers", async ({ page }) => {
  await page.goto("/marketplace");
  await expect(page.getByRole("heading", { name: "Listed worker inventory" })).toBeVisible();
  await expect(page.getByText("Atlas Research Worker")).toBeVisible();
  await expect(page.getByText("Kite Growth Worker")).toBeVisible();
  await expect(page.getByText("Forge Solidity Worker")).toHaveCount(0);

  await page.goto("/workers");
  await expect(page.getByText("Forge Solidity Worker")).toBeVisible();
  await expect(page.getByText("not-listed / none")).toBeVisible();
});

test("worker detail exposes capability, memory, reputation, ownership, and proof tabs", async ({ page }) => {
  await page.goto("/agent/worker-001");
  await expect(page.getByRole("heading", { name: "Atlas Research Worker" })).toBeVisible();

  await page.getByRole("tab", { name: "overview" }).click();
  await expect(page.getByText("Capability, trust, and payout state in one view.")).toBeVisible();
  await expect(page.getByText("source audit")).toBeVisible();
  await expect(page.getByText("ERC8004 reputation is live on Galileo.")).toBeVisible();
  await expect(page.getByText("LedgerEscrow.payoutRecipient(taskId) resolves ownerOf(workerTokenId)")).toBeVisible();

  await page.getByRole("tab", { name: "memory" }).click();
  await expect(page.getByText("0G Storage memory root:")).toBeVisible();
  await expect(page.getByText("0g://0x276c5a0616d6172fcd7b16feafb0feb35efb2de9e1966fe7b74aea4204ed245c")).toBeVisible();

  await page.getByRole("tab", { name: "jobs" }).click();
  await expect(page.getByText("Job history ledger")).toBeVisible();
  await expect(page.getByText("0G ecosystem risk brief")).toBeVisible();
  await expect(page.getByText("Foundation strategy desk")).toBeVisible();

  await page.getByRole("tab", { name: "proof" }).click();
  await expect(page.getByText("Worker ownership")).toBeVisible();
});

test("proof center exposes deployed contracts and live project-wallet artifacts", async ({ page }) => {
  await page.goto("/proof");
  await expect(page.getByRole("link", { name: "0x125942cb1E23E07DA5f80A5c05Bde3fF6e7322F9" })).toBeVisible();
  await expect(page.getByRole("link", { name: "0xebF3d73aD8Eba1786Aa4A6c9c76d112F44e81725" })).toBeVisible();
  await expect(page.getByTestId("latest-demo-flow")).toContainText("Job result root");
  await expect(page.getByTestId("latest-demo-flow")).toContainText("Transfer receipt root");
  await expect(page.getByText(/model (qwen2\.5-omni|0gm-1\.0-35b-a3b)/)).toBeVisible();
});
