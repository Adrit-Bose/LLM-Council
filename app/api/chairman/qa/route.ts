import { resolveChairmanModel } from "@/lib/council-members";
import {
  buildChairmanQAUserPrompt,
  CHAIRMAN_QA_SYSTEM_PROMPT,
  isRateLimitError,
  RATE_LIMIT_MESSAGE,
  type ChairmanQAContext,
  type FollowUpMessage,
} from "@/lib/chairman-qa";
import { callTextLLM } from "@/lib/llm";
import {
  DEFAULT_PROVIDER_SETTINGS,
  type ProviderSettings,
} from "@/lib/provider-config";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

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
    context?: ChairmanQAContext;
    messages?: FollowUpMessage[];
    provider?: Partial<ProviderSettings>;
  };

  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const context = body.context;
  const messages = body.messages;

  if (!context || !messages?.length) {
    return Response.json(
      { error: "context and messages are required" },
      { status: 400 }
    );
  }

  const last = messages[messages.length - 1];
  if (last.role !== "user" || !last.content.trim()) {
    return Response.json(
      { error: "Last message must be a non-empty user message" },
      { status: 400 }
    );
  }

  const provider = parseProviderSettings(body);

  try {
    const reply = await callTextLLM(
      {
        model: resolveChairmanModel(provider),
        systemPrompt: CHAIRMAN_QA_SYSTEM_PROMPT,
        userPrompt: buildChairmanQAUserPrompt(context, messages),
      },
      provider
    );

    return Response.json({ reply });
  } catch (err) {
    if (isRateLimitError(err)) {
      return Response.json({ reply: RATE_LIMIT_MESSAGE, rateLimited: true });
    }

    const message = err instanceof Error ? err.message : "Follow-up failed";
    return Response.json({ error: message }, { status: 500 });
  }
}
