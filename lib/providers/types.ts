import type { ProviderSettings } from "../provider-config";
import type { z } from "zod";

export interface LLMCallOptions {
  model: string;
  systemPrompt: string;
  userPrompt: string;
  onChunk?: (chunk: string) => void;
  maxRetries?: number;
}

export interface LLMCallResult<T> {
  raw: string;
  parsed: T;
}

export interface ProviderContext {
  settings: ProviderSettings;
}

export interface TextCallOptions {
  model: string;
  systemPrompt: string;
  userPrompt: string;
}

export type LLMProvider = {
  callLLM<T extends z.ZodType>(
    schema: T,
    options: LLMCallOptions,
    context: ProviderContext
  ): Promise<LLMCallResult<z.infer<T>>>;
};
