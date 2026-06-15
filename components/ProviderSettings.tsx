"use client";

import {
  CUSTOM_PROVIDER_CHAIRMAN_MODELS,
  CUSTOM_PROVIDER_DEFAULT_MODELS,
  CUSTOM_PROVIDER_LABELS,
  DEFAULT_PROVIDER_SETTINGS,
  GROQ_BASE_URL,
  type CustomProviderId,
  type ProviderSettings,
} from "@/lib/provider-config";
import {
  loadProviderSettings,
  saveProviderSettings,
} from "@/lib/client-provider-settings";
import { useCallback, useEffect, useState } from "react";

interface ProviderSettingsPanelProps {
  settings: ProviderSettings;
  onChange: (settings: ProviderSettings) => void;
  disabled?: boolean;
}

export function ProviderSettingsPanel({
  settings,
  onChange,
  disabled,
}: ProviderSettingsPanelProps) {
  const [open, setOpen] = useState(false);
  const [keyVisible, setKeyVisible] = useState(false);

  const updateSettings = (next: Partial<ProviderSettings>) => {
    onChange({
      ...settings,
      ...next,
      mode: "custom",
      customProvider: next.customProvider ?? settings.customProvider ?? "openai",
    });
  };

  const activeProvider = settings.customProvider || "openai";

  const apiKeyPlaceholder =
    activeProvider === "groq"
      ? "gsk_..."
      : `${CUSTOM_PROVIDER_LABELS[activeProvider]} API key`;

  const handleProviderChange = (id: CustomProviderId) => {
    updateSettings({
      customProvider: id,
      model: undefined,
      chairmanModel: undefined,
      baseUrl: id === "groq" ? GROQ_BASE_URL : id === "openai" ? settings.baseUrl : undefined,
    });
  };

  const activeLabel = CUSTOM_PROVIDER_LABELS[activeProvider];

  return (
    <div className="bg-council-surface border border-council-border rounded-2xl overflow-hidden">
      <div className="px-4 py-3 flex items-center justify-between gap-3 border-b border-council-border bg-council-bg/40">
        <div className="flex items-center gap-2 min-w-0">
          <span className="w-2 h-2 rounded-full shrink-0 bg-council-accent" />
          <span className="text-sm font-medium truncate">{activeLabel}</span>
          <span className="text-xs text-council-muted hidden sm:inline">
            Uses your API key
          </span>
        </div>
        <button
          type="button"
          onClick={() => setOpen(!open)}
          disabled={disabled}
          className="text-xs text-council-accent hover:text-council-accentHover shrink-0 disabled:opacity-40"
        >
          {open ? "Hide settings" : "LLM settings"}
        </button>
      </div>

      {open && (
        <div className="p-4 space-y-4">
          <div>
            <label className="text-xs text-council-muted block mb-1">Provider</label>
            <select
              value={activeProvider}
              disabled={disabled}
              onChange={(e) =>
                handleProviderChange(e.target.value as CustomProviderId)
              }
              className="w-full bg-council-bg border border-council-border rounded-lg px-3 py-2 text-sm
                         focus:outline-none focus:ring-2 focus:ring-council-accent/50"
            >
              {(Object.keys(CUSTOM_PROVIDER_LABELS) as CustomProviderId[]).map((id) => (
                <option key={id} value={id}>
                  {CUSTOM_PROVIDER_LABELS[id]}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-xs text-council-muted block mb-1">
              API key <span className="text-slate-600">(session only, never saved to disk)</span>
            </label>
            <div className="flex gap-2">
              <input
                type={keyVisible ? "text" : "password"}
                value={settings.apiKey || ""}
                disabled={disabled}
                onChange={(e) => updateSettings({ apiKey: e.target.value })}
                placeholder={apiKeyPlaceholder}
                className="flex-1 bg-council-bg border border-council-border rounded-lg px-3 py-2 text-sm
                           focus:outline-none focus:ring-2 focus:ring-council-accent/50"
              />
              <button
                type="button"
                onClick={() => setKeyVisible(!keyVisible)}
                className="px-3 text-xs text-council-muted border border-council-border rounded-lg hover:bg-council-bg"
              >
                {keyVisible ? "Hide" : "Show"}
              </button>
            </div>
          </div>

          {activeProvider === "groq" && (
            <p className="text-xs text-council-muted">
              Endpoint: {GROQ_BASE_URL}
            </p>
          )}

          {activeProvider === "openai" && (
            <div>
              <label className="text-xs text-council-muted block mb-1">
                Base URL <span className="text-slate-600">(optional, for compatible endpoints)</span>
              </label>
              <input
                type="url"
                value={settings.baseUrl || ""}
                disabled={disabled}
                onChange={(e) => updateSettings({ baseUrl: e.target.value })}
                placeholder="https://api.openai.com/v1"
                className="w-full bg-council-bg border border-council-border rounded-lg px-3 py-2 text-sm
                           focus:outline-none focus:ring-2 focus:ring-council-accent/50"
              />
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-council-muted block mb-1">Member model</label>
              <input
                type="text"
                value={settings.model || ""}
                disabled={disabled}
                onChange={(e) => updateSettings({ model: e.target.value })}
                placeholder={CUSTOM_PROVIDER_DEFAULT_MODELS[activeProvider]}
                className="w-full bg-council-bg border border-council-border rounded-lg px-3 py-2 text-sm
                           focus:outline-none focus:ring-2 focus:ring-council-accent/50"
              />
            </div>
            <div>
              <label className="text-xs text-council-muted block mb-1">Chairman model</label>
              <input
                type="text"
                value={settings.chairmanModel || ""}
                disabled={disabled}
                onChange={(e) => updateSettings({ chairmanModel: e.target.value })}
                placeholder={CUSTOM_PROVIDER_CHAIRMAN_MODELS[activeProvider]}
                className="w-full bg-council-bg border border-council-border rounded-lg px-3 py-2 text-sm
                           focus:outline-none focus:ring-2 focus:ring-council-accent/50"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/** Hook for parent components */
export function useProviderSettings() {
  const [settings, setSettings] = useState<ProviderSettings>(DEFAULT_PROVIDER_SETTINGS);

  useEffect(() => {
    setSettings(loadProviderSettings());
  }, []);

  const updateSettings = useCallback((next: ProviderSettings) => {
    saveProviderSettings(next);
    setSettings(next);
  }, []);

  return { settings, updateSettings };
}
