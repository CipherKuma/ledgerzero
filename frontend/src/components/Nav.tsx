"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCreateWallet, usePrivy, useWallets } from "@privy-io/react-auth";
import { useBalance, useChainId, useSwitchChain } from "wagmi";
import { formatUnits } from "viem";
import { Menu, Wallet } from "lucide-react";
import { galileo } from "@/lib/chains";
import { BrandLockup } from "@/components/BrandLogo";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

const links = [
  { label: "Marketplace", href: "/marketplace" },
  { label: "Workers", href: "/workers" },
  { label: "Jobs", href: "/jobs" },
  { label: "Post Task", href: "/post" },
  { label: "Register", href: "/register" },
  { label: "Profile", href: "/profile" },
  { label: "Proof", href: "/proof" },
];

function shortAddr(address?: string) {
  if (!address) return "";
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

export function Nav() {
  const pathname = usePathname();
  const privyEnabled = Boolean(process.env.NEXT_PUBLIC_PRIVY_APP_ID);
  const wallet = privyEnabled ? <WalletHooks /> : <Badge variant="secondary">wallet disabled</Badge>;

  return (
    <header className="lz-site-nav sticky top-0 z-40 border-b bg-background/80 backdrop-blur-xl">
      <div className="lz-container flex h-16 items-center justify-between gap-4">
        <Link href="/" className="group" aria-label="Ledger Zero 0G worker market">
          <BrandLockup />
        </Link>

        <nav className="hidden items-center gap-5 md:flex" aria-label="Primary">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="lz-nav-link"
              data-active={pathname === link.href || pathname.startsWith(`${link.href}/`)}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-2 md:flex">{wallet}</div>

        <div className="md:hidden">
          <Sheet>
            <SheetTrigger render={<Button variant="outline" size="icon" aria-label="Open navigation" />}>
              <Menu />
            </SheetTrigger>
            <SheetContent>
              <SheetHeader>
                <SheetTitle>
                  <BrandLockup compact subtitle={false} />
                </SheetTitle>
              </SheetHeader>
              <div className="flex flex-col gap-2 px-4">
                {links.map((link) => (
                  <Link key={link.href} href={link.href} className="rounded-md px-2 py-2 text-sm">
                    {link.label}
                  </Link>
                ))}
                <div className="mt-4 border-t pt-4">{wallet}</div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}

function WalletHooks() {
  const { ready, authenticated, login, logout, exportWallet, user } = usePrivy();
  const { createWallet } = useCreateWallet();
  const { wallets } = useWallets();
  const activeWallet = wallets[0];
  const address = (activeWallet?.address ?? user?.wallet?.address) as `0x${string}` | undefined;
  const walletCreateStarted = useRef(false);
  const chainId = useChainId();
  const { switchChain } = useSwitchChain();
  const onPrimary = chainId === galileo.id;
  const { data: balance } = useBalance({ address, chainId: galileo.id });
  const resolvingWallet = ready && authenticated && !address;

  useEffect(() => {
    if (!resolvingWallet || walletCreateStarted.current) return;
    walletCreateStarted.current = true;
    createWallet().catch(() => {
      walletCreateStarted.current = false;
    });
  }, [createWallet, resolvingWallet]);

  const balanceText = balance
    ? `${Number(formatUnits(balance.value, balance.decimals)).toFixed(3)} ${balance.symbol}`
    : address
      ? "... 0G"
      : "0G balance";

  return (
    <>
      {authenticated && !onPrimary ? (
        <Button variant="outline" onClick={() => switchChain({ chainId: galileo.id })}>
          Switch to 0G
        </Button>
      ) : null}
      <WalletControl
        ready={ready}
        authenticated={authenticated}
        resolvingWallet={resolvingWallet}
        address={address}
        balanceText={balanceText}
        login={login}
        logout={logout}
        exportWallet={exportWallet}
      />
    </>
  );
}

function WalletControl({
  ready,
  authenticated,
  resolvingWallet,
  address,
  balanceText,
  login,
  logout,
  exportWallet,
}: {
  ready: boolean;
  authenticated: boolean;
  resolvingWallet: boolean;
  address?: string;
  balanceText: string;
  login: () => void;
  logout: () => void;
  exportWallet: () => void;
}) {
  if (!ready) return <Badge variant="secondary">wallet loading</Badge>;
  if (!authenticated) return <Button onClick={login}>Connect Wallet</Button>;
  if (resolvingWallet) return <Badge variant="secondary">setting up wallet</Badge>;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger render={<Button variant="outline" data-testid="wallet-control" />}>
        <Wallet data-icon="inline-start" />
        {balanceText}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem disabled data-testid="wallet-address">
          {shortAddr(address)}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={exportWallet}>Manage Wallet</DropdownMenuItem>
        <DropdownMenuItem onClick={logout}>Disconnect</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
