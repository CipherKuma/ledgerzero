import type { ReactNode } from "react";

export function RawField({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="grid gap-2 border-t pt-4 text-sm">
      <span className="text-xs font-semibold uppercase tracking-[0.14em] text-accent">{label}</span>
      {children}
    </label>
  );
}
