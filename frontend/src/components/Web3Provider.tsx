"use client";

import { PrivyProvider } from "@privy-io/react-auth";
import { WagmiProvider, createConfig } from "@privy-io/wagmi";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { http } from "viem";
import { galileo } from "@/lib/chains";

// Privy's price oracle calls a CoinGecko-style endpoint to render USD
// equivalents next to native balances. Galileo (chainId 16602) isn't on
// any price feed, so Privy logs `console.error("Unable to fetch token
// price for chain with id 16602")` on every wallet open. Next.js 16's dev
// overlay then surfaces it as a red error box, even though it's a
// non-fatal warning that doesn't affect transactions. Filter only that
// exact string — keep all other console.error output intact.
if (typeof window !== "undefined") {
  const PRIVY_PRICE_NOISE =
    /Unable to fetch token price for chain with id 16602/;
  const originalError = console.error;
  console.error = (...args: unknown[]) => {
    const msg = args.map((a) => (typeof a === "string" ? a : "")).join(" ");
    if (PRIVY_PRICE_NOISE.test(msg)) return;
    originalError(...args);
  };
}

const queryClient = new QueryClient();

// Galileo's RPC is sometimes slow to surface a receipt right after submit
// (the read replica lags the sequencer by 5–15s). With viem's defaults
// (~30s timeout, ~4s polling, 3 retries) the receipt-poll can time out
// while the tx is mining successfully — Privy then surfaces that as
// "Transaction receipt could not be found" and offers Retry, which
// resubmits the same calldata and reverts via the contract's idempotency
// guard. Stretch the polling envelope so the receipt arrives in-window.
const wagmiConfig = createConfig({
  chains: [galileo],
  pollingInterval: 2_000,
  transports: {
    [galileo.id]: http(
      process.env.NEXT_PUBLIC_GALILEO_RPC ?? "https://evmrpc-testnet.0g.ai",
      { retryCount: 8, retryDelay: 1_500, timeout: 90_000 },
    ),
  },
});

export function Web3Provider({ children }: { children: React.ReactNode }) {
  const appId = process.env.NEXT_PUBLIC_PRIVY_APP_ID;

  if (!appId) {
    return <>{children}</>;
  }

  return (
    <PrivyProvider
      appId={appId}
      config={{
        appearance: {
          theme: "light",
          accentColor: "#0f766e",
          showWalletLoginFirst: false,
        },
        legal: {
          termsAndConditionsUrl: "https://ledgerzero.local/terms",
          privacyPolicyUrl: "https://ledgerzero.local/privacy",
        },
        loginMethods: ["wallet", "email", "google"],
        embeddedWallets: {
          ethereum: {
            createOnLogin: "users-without-wallets",
          },
        },
        defaultChain: galileo,
        supportedChains: [galileo],
      }}
    >
      <QueryClientProvider client={queryClient}>
        <WagmiProvider config={wagmiConfig}>{children}</WagmiProvider>
      </QueryClientProvider>
    </PrivyProvider>
  );
}
