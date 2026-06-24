import { getWallet } from "./server";

type ComputeMessage = { role: "system" | "user" | "assistant"; content: string };

export type ComputeProof = {
  source: "0g" | "sarvam-fallback";
  provider: string;
  model: string;
  chatID: string;
  verified: boolean | null;
  requestHash?: string;
  responseHash?: string;
  signature?: string;
  fallbackReason?: string;
};

const ROUTER_URL = process.env.ZEROG_COMPUTE_ROUTER ?? "https://router-api-testnet.integratenetwork.work/v1";
export const ROUTER_MODEL = process.env.ZEROG_COMPUTE_MODEL ?? "qwen2.5-omni";
const SARVAM_URL = process.env.SARVAM_API_URL ?? "https://api.sarvam.ai/v1/chat/completions";
const SARVAM_MODEL = process.env.SARVAM_MODEL ?? "sarvam-30b";

let brokerPromise: Promise<unknown> | null = null;

async function broker() {
  if (!brokerPromise) {
    brokerPromise = (async () => {
      const { createZGComputeNetworkBroker } = await import("@0gfoundation/0g-compute-ts-sdk");
      return createZGComputeNetworkBroker(getWallet() as never);
    })();
  }
  return brokerPromise as Promise<{
    inference: {
      processResponse(provider: string, chatID: string): Promise<boolean>;
    };
  }>;
}

function errorMessage(error: unknown) {
  return error instanceof Error ? error.message : String(error);
}

function shouldFallbackToSarvam(message: string) {
  const lowered = message.toLowerCase();
  return (
    lowered.includes("router 429") ||
    lowered.includes("rate limit") ||
    lowered.includes("too many requests") ||
    lowered.includes("insufficient") ||
    lowered.includes("balance") ||
    lowered.includes("credits") ||
    lowered.includes("quota") ||
    lowered.includes("payment") ||
    lowered.includes("router 500") ||
    lowered.includes("router 502") ||
    lowered.includes("router 503") ||
    lowered.includes("router 504")
  );
}

function hasSarvamFallback() {
  return Boolean(process.env.SARVAM_API_KEY);
}

async function generateWithSarvam(messages: ComputeMessage[], fallbackReason: string) {
  const apiKey = process.env.SARVAM_API_KEY;
  if (!apiKey) throw new Error("SARVAM_API_KEY not set");

  const res = await fetch(SARVAM_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
      "api-subscription-key": apiKey,
    },
    body: JSON.stringify({ model: SARVAM_MODEL, messages, temperature: 0.2 }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`sarvam ${res.status}: ${body.slice(0, 200)}`);
  }

  const data = (await res.json()) as {
    id?: string;
    model?: string;
    choices?: Array<{ message?: { content?: string } }>;
  };

  return {
    content: data.choices?.[0]?.message?.content ?? "",
    proof: {
      source: "sarvam-fallback",
      provider: "sarvam",
      model: data.model ?? SARVAM_MODEL,
      chatID: data.id ?? "",
      verified: null,
      fallbackReason,
    } satisfies ComputeProof,
  };
}

async function generateWithRouter(messages: ComputeMessage[]) {
  const apiKey = process.env.ZEROG_ROUTER_API_KEY;
  if (!apiKey) throw new Error("ZEROG_ROUTER_API_KEY not set");

  const res = await fetch(`${ROUTER_URL}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({ model: ROUTER_MODEL, messages, temperature: 0.2 }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`router ${res.status}: ${body.slice(0, 200)}`);
  }

  const data = (await res.json()) as {
    id?: string;
    choices?: Array<{ message?: { content?: string } }>;
    x_0g_trace?: {
      provider?: string;
      request_hash?: string;
      response_hash?: string;
    };
  };
  const content = data.choices?.[0]?.message?.content ?? "";
  const provider = data.x_0g_trace?.provider ?? "";
  const chatID = res.headers.get("ZG-Res-Key") ?? data.id ?? "";
  let verified: boolean | null = null;

  if (provider && chatID) {
    try {
      const b = await broker();
      verified = await b.inference.processResponse(provider, chatID);
    } catch {
      verified = null;
    }
  }

  return {
    content,
    proof: {
      source: "0g",
      provider: provider || "0g-router",
      model: ROUTER_MODEL,
      chatID,
      verified,
      requestHash: data.x_0g_trace?.request_hash,
      responseHash: data.x_0g_trace?.response_hash,
      signature: res.headers.get("ZG-Res-Signature") ?? undefined,
    } satisfies ComputeProof,
  };
}

export async function generateWith0GCompute(messages: ComputeMessage[]) {
  try {
    return await generateWithRouter(messages);
  } catch (error) {
    const message = errorMessage(error);
    if (!hasSarvamFallback() || !shouldFallbackToSarvam(message)) throw error;
    return generateWithSarvam(messages, message);
  }
}
