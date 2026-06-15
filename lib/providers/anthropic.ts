import Anthropic from "@anthropic-ai/sdk";
import { z } from "zod";
import type { LLMCallOptions, LLMCallResult, ProviderContext } from "./types";
import { extractJSON, sleep } from "./shared";

export async function callAnthropicLLM<T extends z.ZodType>(
  schema: T,
  options: LLMCallOptions,
  context: ProviderContext
): Promise<LLMCallResult<z.infer<T>>> {
  const { model, systemPrompt, userPrompt, onChunk, maxRetries = 3 } = options;
  const apiKey = context.settings.apiKey?.trim();

  if (!apiKey) {
    throw new Error("Anthropic API key is required in Custom mode.");
  }

  const client = new Anthropic({ apiKey });
  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const stream = await client.messages.stream({
        model,
        max_tokens: 4096,
        system: systemPrompt,
        messages: [{ role: "user", content: userPrompt }],
      });

      let raw = "";
      for await (const event of stream) {
        if (
          event.type === "content_block_delta" &&
          event.delta.type === "text_delta"
        ) {
          raw += event.delta.text;
          onChunk?.(event.delta.text);
        }
      }

      const jsonStr = extractJSON(raw);
      const parsed = schema.parse(JSON.parse(jsonStr));
      return { raw, parsed };
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err));
      if (attempt < maxRetries) await sleep(1000 * attempt);
    }
  }

  throw lastError ?? new Error("Anthropic call failed after retries");
}
