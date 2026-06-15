import { runCouncil } from "@/lib/council-runner";
import {
  DEFAULT_PROVIDER_SETTINGS,
  type ProviderSettings,
} from "@/lib/provider-config";
import type { SSEEvent } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function formatSSE(event: SSEEvent): string {
  return `data: ${JSON.stringify(event)}\n\n`;
}

function parseProviderSettings(body: unknown): ProviderSettings {
  const raw = (body as { provider?: Partial<ProviderSettings> })?.provider;
  if (!raw) return DEFAULT_PROVIDER_SETTINGS;

  return {
    mode: raw.mode === "custom" ? "custom" : "cursor",
    customProvider: raw.customProvider,
    apiKey: raw.apiKey?.trim() || undefined,
    baseUrl: raw.baseUrl?.trim() || undefined,
    model: raw.model?.trim() || undefined,
    chairmanModel: raw.chairmanModel?.trim() || undefined,
  };
}

export async function POST(request: Request) {
  let body: {
    idea?: string;
    enableDebate?: boolean;
    provider?: Partial<ProviderSettings>;
  };
  try {
    body = await request.json();
  } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON body" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const idea = body.idea?.trim();
  if (!idea) {
    return new Response(JSON.stringify({ error: "Idea is required" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const enableDebate = body.enableDebate ?? false;
  const provider = parseProviderSettings(body);

  const stream = new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder();

      const emit = (event: SSEEvent) => {
        controller.enqueue(encoder.encode(formatSSE(event)));
      };

      try {
        await runCouncil({ idea, enableDebate, provider, emit });
      } catch (err) {
        const message = err instanceof Error ? err.message : "Council run failed";
        emit({ type: "chairman_error", data: { error: message } });
        emit({ type: "done" });
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}
