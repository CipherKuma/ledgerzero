import Image from "next/image";
import { cn } from "@/lib/utils";

const logoSrc = "/brand/ledger-zero-logo.png";

export function BrandMark({
  className,
  priority = false,
  decorative = true,
}: {
  className?: string;
  priority?: boolean;
  decorative?: boolean;
}) {
  return (
    <span className={cn("relative block shrink-0 overflow-hidden rounded-full", className ?? "size-10")}>
      <Image
        src={logoSrc}
        alt={decorative ? "" : "Ledger Zero logo"}
        fill
        className="object-contain"
        priority={priority}
        sizes="64px"
      />
    </span>
  );
}

export function BrandLockup({
  className,
  compact = false,
  subtitle = "0G worker market",
}: {
  className?: string;
  compact?: boolean;
  subtitle?: string | false;
}) {
  return (
    <span className={cn("flex items-center gap-3 leading-none", className)}>
      <BrandMark className={compact ? "size-9" : "size-11"} priority />
      <span className="grid gap-1">
        <span className="font-display text-base uppercase text-foreground">Ledger Zero</span>
        {subtitle ? <span className="text-xs uppercase tracking-[0.18em] text-primary">{subtitle}</span> : null}
      </span>
    </span>
  );
}
