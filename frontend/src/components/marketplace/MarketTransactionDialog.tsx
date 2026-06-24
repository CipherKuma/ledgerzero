"use client";

import { ArrowRight, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { galileoExplorer } from "@/lib/contracts";

export function MarketTransactionDialog({
  open,
  title,
  description,
  txHash,
  artifactLabel,
  artifactValue,
  acknowledgeLabel,
  onOpenChange,
  onAcknowledge,
}: {
  open: boolean;
  title: string;
  description: string;
  txHash?: string;
  artifactLabel: string;
  artifactValue: string;
  acknowledgeLabel: string;
  onOpenChange: (open: boolean) => void;
  onAcknowledge: () => void;
}) {
  const explorerHref = txHash ? `${galileoExplorer}/tx/${txHash}` : galileoExplorer;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent showCloseButton={false}>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <div className="grid gap-3 rounded-lg border bg-background/60 p-3 text-sm">
          <div>
            <div className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
              {artifactLabel}
            </div>
            <div className="mt-1 font-medium text-foreground">{artifactValue}</div>
          </div>
          <div>
            <div className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
              Transaction
            </div>
            <div className="lz-mono lz-artifact mt-1 text-xs">{txHash}</div>
          </div>
        </div>
        <DialogFooter>
          <a href={explorerHref} target="_blank" rel="noreferrer" className="inline-flex">
            <Button type="button" variant="outline">
              Open transaction
              <ExternalLink data-icon="inline-end" />
            </Button>
          </a>
          <Button type="button" onClick={onAcknowledge}>
            {acknowledgeLabel}
            <ArrowRight data-icon="inline-end" />
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
