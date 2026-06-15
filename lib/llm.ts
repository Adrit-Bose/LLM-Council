import { callLLM as routeCustomLLM, type LLMCallOptions, type LLMCallResult } from "./providers";
import { callTextLLM as routeCustomTextLLM, type TextCallOptions } from "./providers/text";
import type { ProviderSettings } from "./provider-config";

export type { LLMCallOptions, LLMCallResult, TextCallOptions };

/**
 * Route LLM calls — Cursor default uses dynamic import to avoid bundling @cursor/sdk.
 */
export async function callLLM<T extends import("zod").ZodType>(
  schema: T,
  options: LLMCallOptions,
  settings: ProviderSettings
): Promise<LLMCallResult<import("zod").infer<T>>> {
  if (settings.mode === "cursor") {
    const { callCursorLLM } = await import("./providers/cursor");
    return callCursorLLM(schema, options, { settings });
  }
  return routeCustomLLM(schema, options, settings);
}

/** Plain-text LLM call — used for Chairman Q&A follow-up chat. */
export async function callTextLLM(
  options: TextCallOptions,
  settings: ProviderSettings
): Promise<string> {
  if (settings.mode === "cursor") {
    const { callCursorText } = await import("./providers/text-cursor");
    return callCursorText(options, { settings });
  }
  return routeCustomTextLLM(options, settings);
}
