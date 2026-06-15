import { z } from "zod";
import type { ProviderSettings } from "../provider-config";
import { callAnthropicLLM } from "./anthropic";
import { callGeminiLLM } from "./gemini";
import { callOpenAILLM } from "./openai";
import type { LLMCallOptions, LLMCallResult, ProviderContext } from "./types";

export type { LLMCallOptions, LLMCallResult, ProviderContext };

function getCustomProviderCall(settings: ProviderSettings) {
  switch (settings.customProvider) {
    case "anthropic":
      return callAnthropicLLM;
    case "gemini":
      return callGeminiLLM;
    case "groq":
    case "openai":
    default:
      return callOpenAILLM;
  }
}

/** Route custom-provider LLM calls (not Cursor). */
export async function callLLM<T extends z.ZodType>(
  schema: T,
  options: LLMCallOptions,
  settings: ProviderSettings
): Promise<LLMCallResult<z.infer<T>>> {
  const context: ProviderContext = { settings };

  if (!settings.apiKey?.trim()) {
    throw new Error(
      "Custom provider requires an API key. Enter your key in LLM settings."
    );
  }

  const providerCall = getCustomProviderCall(settings);
  return providerCall(schema, options, context);
}
