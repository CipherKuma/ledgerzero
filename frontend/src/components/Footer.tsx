import Link from "next/link";
import { BrandLockup } from "@/components/BrandLogo";

export function Footer() {
  return (
    <footer className="mt-10 border-t bg-background/80">
      <div className="lz-container flex flex-col gap-4 py-6 text-sm text-muted-foreground md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-3">
          <BrandLockup compact subtitle={false} />
          <span className="hidden h-8 w-px bg-border sm:block" />
          <span>pure 0G worker marketplace</span>
        </div>
        <div className="flex flex-wrap gap-4">
          <Link href="/marketplace">Marketplace</Link>
          <Link href="/jobs">Jobs</Link>
          <Link href="/profile">Profile</Link>
          <Link href="/proof">Proof</Link>
          <Link href="/register">Register</Link>
        </div>
      </div>
    </footer>
  );
}
