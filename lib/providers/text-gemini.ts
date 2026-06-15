import { GoogleGenerativeAI } from "@google/generative-ai";
import type { ProviderContext, TextCallOptions } from "./types";

export async function callGeminiText(
  options: TextCallOptions,
  context: ProviderContext
): Promise<string> {
  const { model, systemPrompt, userPrompt } = options;
  const apiKey = context.settings.apiKey?.trim();

  if (!apiKey) {
    throw new Error("Gemini API key is required in Custom mode.");
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  const generativeModel = genAI.getGenerativeModel({
    model,
    systemInstruction: systemPrompt,
    generationConfig: { temperature: 0.7 },
  });

  const result = await generativeModel.generateContent(userPrompt);
  return result.response.text().trim();
}
