import { getWallet } from "./server";

type ComputeMessage = { role: "system" | "user" | "assistant"; content: string };

export type ComputeProof = {
  provider: string;
  model: string;
  chatID: string;
  verified: boolean | null;
  requestHash?: string;
  responseHash?: string;
  signature?: string;
};

const ROUTER_URL = process.env.ZEROG_COMPUTE_ROUTER ?? "https://router-api-testnet.integratenetwork.work/v1";
export const ROUTER_MODEL = process.env.ZEROG_COMPUTE_MODEL ?? "qwen2.5-omni";

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

export async function generateWith0GCompute(messages: ComputeMessage[]) {
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
