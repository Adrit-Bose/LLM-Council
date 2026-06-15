import OpenAI from "openai";
import { resolveOpenAICompatibleBaseUrl } from "../provider-config";
import type { ProviderContext, TextCallOptions } from "./types";

export async function callOpenAIText(
  options: TextCallOptions,
  context: ProviderContext
): Promise<string> {
  const { model, systemPrompt, userPrompt } = options;
  const apiKey = context.settings.apiKey?.trim();

  if (!apiKey) {
    throw new Error("API key is required in Custom mode.");
  }

  const client = new OpenAI({
    apiKey,
    baseURL: resolveOpenAICompatibleBaseUrl(context.settings),
  });

  const response = await client.chat.completions.create({
    model,
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ],
    temperature: 0.7,
  });

  return response.choices[0]?.message?.content?.trim() ?? "";
}
