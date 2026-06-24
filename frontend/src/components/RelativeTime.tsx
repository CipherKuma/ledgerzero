"use client";

import { useSyncExternalStore } from "react";
import { formatRelativeTime } from "@/lib/time";

function subscribe(callback: () => void) {
  const id = window.setInterval(callback, 60_000);
  return () => window.clearInterval(id);
}

function getSnapshot() {
  return Math.floor(Date.now() / 60_000);
}

function getServerSnapshot() {
  return null;
}

export function RelativeTime({
  value,
  verb,
  className,
}: {
  value?: string;
  verb: string;
  className?: string;
}) {
  const minute = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const text = minute === null ? `${verb} recently` : `${verb} ${formatRelativeTime(value, minute * 60_000)}`;

  return (
    <span className={className} suppressHydrationWarning>
      {text}
    </span>
  );
}
