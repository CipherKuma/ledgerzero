import type { AgentInspection, LedgerZeroAgentManifest } from "./types";
import { fetchJsonWithLimit, fetchReachable } from "@/lib/server/guards";

const frameworkLabels = new Set(["openclaw", "hermes", "custom"]);

export function isAddress(value: string) {
  return /^0x[a-fA-F0-9]{40}$/.test(value);
}

export function absoluteUrl(value: string, origin: string) {
  return new URL(value, origin).toString();
}

export function demoManifestUrl(kind: "openclaw" | "hermes", origin: string) {
  return absoluteUrl(`/agent-manifests/${kind}.json`, origin);
}

export function validateAgentManifest(input: unknown, manifestUrl: string, origin: string) {
  const manifest = input as Partial<LedgerZeroAgentManifest>;
  const errors: string[] = [];

  if (manifest.protocol !== "ledger-zero-agent") errors.push("protocol must be ledger-zero-agent");
  if (manifest.protocolVersion !== "0.1") errors.push("protocolVersion must be 0.1");
  if (!manifest.framework || !frameworkLabels.has(manifest.framework)) errors.push("framework is unsupported");
  if (!manifest.name) errors.push("name is required");
  if (!manifest.description) errors.push("description is required");
  if (!manifest.operatorAddress || !isAddress(manifest.operatorAddress)) errors.push("operatorAddress must be an EVM address");
  if (!manifest.agentUrl) errors.push("agentUrl is required");
  if (!manifest.healthUrl) errors.push("healthUrl is required");
  if (!manifest.invokeUrl) errors.push("invokeUrl is required");
  if (!Array.isArray(manifest.capabilities) || manifest.capabilities.length === 0) {
    errors.push("at least one capability is required");
  }
  if (manifest.memory?.mode !== "encrypted-owner-transferable") {
    errors.push("memory.mode must be encrypted-owner-transferable");
  }
  if (manifest.memory?.storage !== "0G Storage") errors.push("memory.storage must be 0G Storage");
  if (!manifest.pricing?.minPayout0G || !manifest.pricing?.bidBond0G || !manifest.pricing?.salePrice0G) {
    errors.push("pricing minPayout0G, bidBond0G, and salePrice0G are required");
  }
  if (!Array.isArray(manifest.proofHooks) || manifest.proofHooks.length < 3) {
    errors.push("proofHooks must include compute, storage, and memory proof hooks");
  }

  if (errors.length) return { manifest: null, errors };

  const normalized = manifest as LedgerZeroAgentManifest;
  normalized.manifestUrl = manifestUrl;
  normalized.agentUrl = absoluteUrl(normalized.agentUrl, origin);
  normalized.healthUrl = absoluteUrl(normalized.healthUrl, origin);
  normalized.invokeUrl = absoluteUrl(normalized.invokeUrl, origin);
  if (normalized.iconUrl) normalized.iconUrl = absoluteUrl(normalized.iconUrl, origin);

  return { manifest: normalized, errors };
}

export async function inspectAgentManifest(manifestUrl: string, origin: string): Promise<AgentInspection> {
  const url = absoluteUrl(manifestUrl, origin);
  const parsed = await fetchJsonWithLimit(new URL(url), origin);
  const { manifest, errors } = validateAgentManifest(parsed, url, origin);
  if (!manifest) throw new Error(errors.join("; "));

  let healthStatus: "live" | "blocked" = "blocked";
  let healthDetail = "Health endpoint did not respond.";
  try {
    const health = await fetchReachable(new URL(manifest.healthUrl), origin);
    healthStatus = health.ok ? "live" : "blocked";
    healthDetail = health.ok ? `${manifest.framework} health endpoint responded.` : `Health returned ${health.status}.`;
  } catch (error) {
    healthDetail = `Health failed: ${(error as Error).message}`;
  }

  const checks = [
    { label: "Manifest", status: "live" as const, detail: "Ledger Zero manifest is reachable and valid." },
    { label: "Agent health", status: healthStatus, detail: healthDetail },
    {
      label: "Encrypted memory",
      status: "declared" as const,
      detail: `${manifest.memory.encryption}; ${manifest.memory.updatePolicy}. Live root is created during registration.`,
    },
    {
      label: "Capabilities",
      status: "declared" as const,
      detail: `${manifest.capabilities.map((capability) => capability.id).join(", ")}. Live registry tx is created during registration.`,
    },
  ];

  return {
    manifestUrl: url,
    manifest,
    status: checks.some((check) => check.status === "blocked") ? "blocked" : "ready",
    checks,
  };
}
