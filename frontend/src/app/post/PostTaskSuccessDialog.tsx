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

export function PostTaskSuccessDialog({
  open,
  txHash,
  taskId,
  onOpenChange,
  onViewTask,
}: {
  open: boolean;
  txHash?: string;
  taskId?: string;
  onOpenChange: (open: boolean) => void;
  onViewTask: () => void;
}) {
  const explorerHref = txHash ? `${galileoExplorer}/tx/${txHash}` : galileoExplorer;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent showCloseButton={false}>
        <DialogHeader>
          <DialogTitle>Escrow posted on 0G</DialogTitle>
          <DialogDescription>
            The task transaction is confirmed. Acknowledging this will open the indexed task route.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-3 rounded-lg border bg-background/60 p-3 text-sm">
          <div>
            <div className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">Task</div>
            <div className="lz-mono lz-artifact mt-1 text-xs">{taskId ?? "indexing task id"}</div>
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
          <Button type="button" onClick={onViewTask}>
            View task
            <ArrowRight data-icon="inline-end" />
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
