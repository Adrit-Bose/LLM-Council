import OpenAI from "openai";
import { z } from "zod";
import { resolveOpenAICompatibleBaseUrl } from "../provider-config";
import type { LLMCallOptions, LLMCallResult, ProviderContext } from "./types";
import { extractJSON, sleep } from "./shared";

export async function callOpenAILLM<T extends z.ZodType>(
  schema: T,
  options: LLMCallOptions,
  context: ProviderContext
): Promise<LLMCallResult<z.infer<T>>> {
  const { model, systemPrompt, userPrompt, onChunk, maxRetries = 3 } = options;
  const apiKey = context.settings.apiKey?.trim();

  if (!apiKey) {
    throw new Error("API key is required in Custom mode.");
  }

  const baseURL = resolveOpenAICompatibleBaseUrl(context.settings);

  const client = new OpenAI({
    apiKey,
    baseURL,
  });

  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const stream = await client.chat.completions.create({
        model,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        stream: true,
        temperature: 0.7,
        response_format: { type: "json_object" },
      });

      let raw = "";
      for await (const chunk of stream) {
        const delta = chunk.choices[0]?.delta?.content ?? "";
        if (delta) {
          raw += delta;
          onChunk?.(delta);
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

  throw lastError ?? new Error("OpenAI call failed after retries");
}
