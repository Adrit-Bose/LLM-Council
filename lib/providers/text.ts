import type { ProviderSettings } from "../provider-config";
import { callAnthropicText } from "./text-anthropic";
import { callGeminiText } from "./text-gemini";
import { callOpenAIText } from "./text-openai";
import type { ProviderContext, TextCallOptions } from "./types";

function getCustomTextCall(settings: ProviderSettings) {
  switch (settings.customProvider) {
    case "anthropic":
      return callAnthropicText;
    case "gemini":
      return callGeminiText;
    case "groq":
    case "openai":
    default:
      return callOpenAIText;
  }
}

/** Plain-text LLM call for custom providers (no JSON parsing). */
export async function callTextLLM(
  options: TextCallOptions,
  settings: ProviderSettings
): Promise<string> {
  const context: ProviderContext = { settings };

  if (!settings.apiKey?.trim()) {
    throw new Error(
      "Custom provider requires an API key. Enter your key in Settings or switch back to Cursor default."
    );
  }

  const providerCall = getCustomTextCall(settings);
  return providerCall(options, context);
}

export type { TextCallOptions };
