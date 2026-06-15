"use client";

import type { ProviderSettings } from "@/lib/provider-config";
import { DEFAULT_PROVIDER_SETTINGS } from "@/lib/provider-config";

const STORAGE_KEY = "llm-council-provider-settings";

export function loadProviderSettings(): ProviderSettings {
  if (typeof window === "undefined") return DEFAULT_PROVIDER_SETTINGS;
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_PROVIDER_SETTINGS;
    const parsed = JSON.parse(raw) as ProviderSettings;
    return { ...DEFAULT_PROVIDER_SETTINGS, ...parsed };
  } catch {
    return DEFAULT_PROVIDER_SETTINGS;
  }
}

export function saveProviderSettings(settings: ProviderSettings): void {
  sessionStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
}

export function clearCustomApiKey(): ProviderSettings {
  const current = loadProviderSettings();
  const updated: ProviderSettings = {
    ...current,
    mode: "cursor",
    apiKey: undefined,
  };
  saveProviderSettings(updated);
  return updated;
}
