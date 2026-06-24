import { isIP } from "node:net";

const localHosts = new Set(["localhost", "127.0.0.1", "::1", "[::1]"]);

function isLocalHost(hostname: string) {
  return localHosts.has(hostname) || hostname.endsWith(".localhost");
}

export function assertLocalOrExplicitDemo(req: Request) {
  const url = new URL(req.url);
  const isLocal = isLocalHost(url.hostname);
  const enabled = process.env.LEDGER_ZERO_ENABLE_PUBLIC_DEMO === "true";
  const token = process.env.LEDGER_ZERO_PUBLIC_DEMO_TOKEN;
  const requestToken = req.headers.get("x-ledger-zero-demo-token");

  if (isLocal) return;
  if (enabled && token && requestToken === token) return;

  throw new Error("live demo mutations require localhost or an explicit demo token");
}

export function isPrivateHostname(hostname: string) {
  if (isLocalHost(hostname)) return true;
  const ipVersion = isIP(hostname);
  if (ipVersion === 4) {
    const [a, b] = hostname.split(".").map((part) => Number(part));
    return (
      a === 10 ||
      a === 127 ||
      (a === 169 && b === 254) ||
      (a === 172 && b >= 16 && b <= 31) ||
      (a === 192 && b === 168)
    );
  }
  if (ipVersion === 6) {
    const lower = hostname.toLowerCase();
    return lower === "::1" || lower.startsWith("fc") || lower.startsWith("fd") || lower.startsWith("fe80");
  }
  return false;
}

export function assertSafeAgentUrl(url: URL, origin: string) {
  const originUrl = new URL(origin);
  if (url.origin === originUrl.origin) return;
  if (isLocalHost(originUrl.hostname) && isLocalHost(url.hostname)) return;
  if (url.protocol !== "https:") throw new Error("custom agent URLs must use https");
  if (isPrivateHostname(url.hostname)) throw new Error("custom agent URLs cannot target private hosts");
}

export async function fetchJsonWithLimit(url: URL, origin: string, init?: RequestInit) {
  assertSafeAgentUrl(url, origin);
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 10000);
  try {
    const res = await fetch(url, {
      ...init,
      cache: "no-store",
      redirect: "error",
      signal: controller.signal,
    });
    if (!res.ok) throw new Error(`${url.pathname || url.href} returned ${res.status}`);
    const text = await res.text();
    if (text.length > 128_000) throw new Error("response is too large");
    return JSON.parse(text);
  } finally {
    clearTimeout(timer);
  }
}

export async function fetchReachable(url: URL, origin: string) {
  assertSafeAgentUrl(url, origin);
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 10000);
  try {
    const res = await fetch(url, {
      cache: "no-store",
      redirect: "error",
      signal: controller.signal,
    });
    return res.ok ? { ok: true, status: res.status } : { ok: false, status: res.status };
  } finally {
    clearTimeout(timer);
  }
}
