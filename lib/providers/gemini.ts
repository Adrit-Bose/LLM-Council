import { GoogleGenerativeAI } from "@google/generative-ai";
import { z } from "zod";
import type { LLMCallOptions, LLMCallResult, ProviderContext } from "./types";
import { extractJSON, sleep } from "./shared";

export async function callGeminiLLM<T extends z.ZodType>(
  schema: T,
  options: LLMCallOptions,
  context: ProviderContext
): Promise<LLMCallResult<z.infer<T>>> {
  const { model, systemPrompt, userPrompt, onChunk, maxRetries = 3 } = options;
  const apiKey = context.settings.apiKey?.trim();

  if (!apiKey) {
    throw new Error("Gemini API key is required in Custom mode.");
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  const generativeModel = genAI.getGenerativeModel({
    model,
    systemInstruction: systemPrompt,
    generationConfig: {
      responseMimeType: "application/json",
      temperature: 0.7,
    },
  });

  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const result = await generativeModel.generateContentStream(userPrompt);
      let raw = "";

      for await (const chunk of result.stream) {
        const text = chunk.text();
        if (text) {
          raw += text;
          onChunk?.(text);
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

  throw lastError ?? new Error("Gemini call failed after retries");
}
