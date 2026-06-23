"use client";

import { useState } from "react";
import { ArrowRight, CheckCircle2, ExternalLink, Loader2, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { AgentInspection, AgentRegistrationReceipt } from "@/lib/agents/types";

type Preset = "openclaw" | "hermes";

async function postJson<T>(url: string, body: unknown): Promise<T> {
  const res = await fetch(url, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
  const json = await res.json().catch(() => null);
  if (!res.ok) throw new Error(json?.error ?? `${url} failed with ${res.status}`);
  return json as T;
}

export function AgentConnector() {
  const [manifestUrl, setManifestUrl] = useState("");
  const [inspection, setInspection] = useState<AgentInspection | null>(null);
  const [receipt, setReceipt] = useState<AgentRegistrationReceipt | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState("");

  async function inspectPreset(preset: Preset) {
    setBusy(`inspect-${preset}`);
    setError("");
    setReceipt(null);
    try {
      const result = await postJson<AgentInspection>("/api/agents/inspect", { preset });
      setInspection(result);
      setManifestUrl(result.manifestUrl);
      toast.success(`${result.manifest.name} manifest inspected`);
    } catch (nextError) {
      const message = (nextError as Error).message;
      setError(message);
      toast.error(message);
    } finally {
      setBusy(null);
    }
  }

  async function inspectCustom() {
    setBusy("inspect-custom");
    setError("");
    setReceipt(null);
    try {
      const result = await postJson<AgentInspection>("/api/agents/inspect", { manifestUrl });
      setInspection(result);
      toast.success(`${result.manifest.name} manifest inspected`);
    } catch (nextError) {
      const message = (nextError as Error).message;
      setError(message);
      toast.error(message);
    } finally {
      setBusy(null);
    }
  }

  async function registerConnectedAgent() {
    if (!inspection) return;
    setBusy("register");
    setError("");
    try {
      setReceipt(
        await postJson<AgentRegistrationReceipt>("/api/agents/register", {
          manifestUrl: inspection.manifestUrl,
          commitOnChain: true,
          listForSale: true,
        }),
      );
      toast.success("Worker registration receipt recorded");
    } catch (nextError) {
      const message = (nextError as Error).message;
      setError(message);
      toast.error(message);
    } finally {
      setBusy(null);
    }
  }

  return (
    <section className="grid gap-5 border-y py-6" aria-label="Connect existing agent">
      <div className="grid gap-3">
        <div className="lz-kicker">Connect existing agent</div>
        <h2 className="font-display text-2xl uppercase leading-none">OpenClaw, Hermes, or any manifest.</h2>
        <p className="max-w-2xl text-sm leading-7 text-muted-foreground">
          Import a live agent manifest, verify its endpoint and encrypted-memory policy, then register it
          as a Ledger Zero worker with 0G Storage roots and WorkerINFT-compatible ownership.
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          variant="outline"
          data-testid="inspect-openclaw-agent"
          onClick={() => inspectPreset("openclaw")}
          disabled={Boolean(busy)}
        >
          {busy === "inspect-openclaw" ? (
            <Loader2 className="animate-spin" data-icon="inline-start" />
          ) : (
            <ShieldCheck data-icon="inline-start" />
          )}
          Inspect OpenClaw demo
        </Button>
        <Button
          type="button"
          variant="outline"
          data-testid="inspect-hermes-agent"
          onClick={() => inspectPreset("hermes")}
          disabled={Boolean(busy)}
        >
          {busy === "inspect-hermes" ? (
            <Loader2 className="animate-spin" data-icon="inline-start" />
          ) : (
            <ShieldCheck data-icon="inline-start" />
          )}
          Inspect Hermes demo
        </Button>
      </div>

      <div className="grid gap-3 md:grid-cols-[1fr_auto]">
        <Input
          value={manifestUrl}
          onChange={(event) => setManifestUrl(event.target.value)}
          placeholder="https://agent.example.com/.well-known/ledger-zero-agent.json"
          aria-label="Ledger Zero agent manifest URL"
        />
        <Button type="button" onClick={inspectCustom} disabled={!manifestUrl || Boolean(busy)}>
          Inspect manifest
          <ArrowRight data-icon="inline-end" />
        </Button>
      </div>

      {error ? (
        <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
          {error}
        </div>
      ) : null}

      {inspection ? (
        <div className="grid gap-4 rounded-xl border bg-card/50 p-4" data-testid="agent-inspection-panel">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <div className="font-medium">{inspection.manifest.name}</div>
              <p className="mt-1 max-w-2xl text-sm leading-6 text-muted-foreground">
                {inspection.manifest.description}
              </p>
            </div>
            <Badge variant={inspection.status === "ready" ? "default" : "destructive"}>{inspection.status}</Badge>
          </div>

          <div className="grid gap-2 sm:grid-cols-2">
            {inspection.checks.map((check) => (
              <div key={check.label} className="rounded-lg border bg-background/35 p-3 text-sm">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="size-4 text-primary" />
                  <span className="font-medium">{check.label}</span>
                  <Badge variant={check.status === "blocked" ? "destructive" : "secondary"}>{check.status}</Badge>
                </div>
                <p className="mt-2 text-muted-foreground">{check.detail}</p>
              </div>
            ))}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Button
              type="button"
              data-testid="register-connected-agent"
              onClick={registerConnectedAgent}
              disabled={inspection.status !== "ready" || Boolean(busy)}
            >
              {busy === "register" ? <Loader2 className="animate-spin" data-icon="inline-start" /> : null}
              Register as WorkerINFT
              <ArrowRight data-icon="inline-end" />
            </Button>
            <a
              className="inline-flex items-center gap-1 text-xs uppercase tracking-[0.14em] text-accent"
              href="/ledger-zero-agent-skill.md"
              target="_blank"
              rel="noreferrer"
            >
              agent skill doc
              <ExternalLink className="size-3" />
            </a>
          </div>
        </div>
      ) : null}

      {receipt ? (
        <div className="grid gap-3 rounded-xl border border-accent/45 bg-background/50 p-4" data-testid="agent-registration-receipt">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="font-medium">{receipt.agentName}</div>
              <div className="text-sm text-muted-foreground">
                token #{receipt.tokenId ?? "storage-only"} / {receipt.framework}
              </div>
            </div>
            <Badge variant="secondary">{receipt.status}</Badge>
          </div>
          <ReceiptLine label="Memory root" value={`0g://${receipt.memoryRoot}`} />
          <ReceiptLine label="Manifest root" value={`0g://${receipt.manifestRoot}`} />
          <ReceiptLine label="Registration root" value={`0g://${receipt.registrationRoot}`} />
          <ReceiptLine label="Payout rule" value={receipt.listing.payoutRule} />
          <div className="grid gap-2">
            {receipt.chainTxs.map((tx) => (
              <ReceiptLine key={tx.hash} label={tx.label} value={tx.hash} />
            ))}
          </div>
        </div>
      ) : null}
    </section>
  );
}

function ReceiptLine({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid gap-1 text-sm sm:grid-cols-[160px_1fr]">
      <span className="text-muted-foreground">{label}</span>
      <span className="lz-mono lz-artifact text-accent">{value}</span>
    </div>
  );
}
