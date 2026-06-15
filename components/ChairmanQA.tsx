"use client";

import {
  buildChairmanQAContext,
  RATE_LIMIT_MESSAGE,
  type FollowUpMessage,
} from "@/lib/chairman-qa";
import type { ChairmanReport } from "@/lib/types";
import type { ProviderSettings } from "@/lib/provider-config";
import { useEffect, useRef, useState } from "react";

interface ChairmanQAProps {
  idea: string;
  report: ChairmanReport;
  providerSettings: ProviderSettings;
}

export function ChairmanQA({ idea, report, providerSettings }: ChairmanQAProps) {
  const [followUpMessages, setFollowUpMessages] = useState<FollowUpMessage[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const context = buildChairmanQAContext(idea, report);

  useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [followUpMessages, isLoading]);

  const handleSend = async () => {
    const question = input.trim();
    if (!question || isLoading) return;

    const optimistic: FollowUpMessage[] = [
      ...followUpMessages,
      { role: "user", content: question },
    ];

    setFollowUpMessages(optimistic);
    setInput("");
    setIsLoading(true);

    try {
      const response = await fetch("/api/chairman/qa", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          context,
          messages: optimistic,
          provider: providerSettings,
        }),
      });

      const data = await response.json();

      if (data.reply) {
        setFollowUpMessages((prev) => [
          ...prev,
          { role: "chairman", content: data.reply as string },
        ]);
        return;
      }

      setInput(question);
      setFollowUpMessages((prev) => [
        ...prev,
        {
          role: "chairman",
          content: (data.error as string) || "Something went wrong. Please try again.",
        },
      ]);
    } catch {
      setInput(question);
      setFollowUpMessages((prev) => [
        ...prev,
        {
          role: "chairman",
          content: "Connection failed — check your provider settings and try again.",
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <section className="animate-fade-in mt-6">
      <div className="flex items-center gap-2 mb-4">
        <span className="text-xl">💬</span>
        <h2 className="font-display text-lg font-semibold">Chairman Q&amp;A</h2>
        <span className="text-xs text-council-muted">
          Ask follow-up questions about the report
        </span>
      </div>

      <div className="bg-council-surface border border-council-border rounded-2xl overflow-hidden shadow-xl flex flex-col">
        <div
          ref={scrollRef}
          className="flex-1 max-h-80 overflow-y-auto p-4 space-y-3 min-h-[120px]"
        >
          {followUpMessages.length === 0 && !isLoading && (
            <p className="text-sm text-council-muted text-center py-6">
              Ask the Chairman to clarify the verdict, scores, risks, or next steps.
            </p>
          )}

          {followUpMessages.map((msg, i) => (
            <div
              key={i}
              className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                  msg.role === "user"
                    ? "bg-council-accent text-white rounded-br-md"
                    : "bg-council-bg border border-council-border text-slate-300 rounded-bl-md"
                }`}
              >
                {msg.role === "chairman" && (
                  <span className="text-xs text-council-muted block mb-1">⚖️ Chairman</span>
                )}
                {msg.content === RATE_LIMIT_MESSAGE ? (
                  <span className="text-amber-300">{msg.content}</span>
                ) : (
                  msg.content
                )}
              </div>
            </div>
          ))}

          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-council-bg border border-council-border rounded-2xl rounded-bl-md px-4 py-3 flex items-center gap-2">
                <span className="w-3 h-3 border-2 border-council-accent/30 border-t-council-accent rounded-full animate-spin" />
                <span className="text-xs text-council-muted">Chairman is thinking…</span>
              </div>
            </div>
          )}
        </div>

        <div className="border-t border-council-border p-4 flex gap-2">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={isLoading}
            placeholder="e.g. What would make this a stronger Go verdict?"
            rows={2}
            className="flex-1 bg-council-bg border border-council-border rounded-xl px-4 py-2.5 text-sm
                       placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-council-accent/50
                       resize-none disabled:opacity-50"
          />
          <button
            type="button"
            onClick={handleSend}
            disabled={!input.trim() || isLoading}
            className="px-5 py-2.5 bg-council-accent hover:bg-council-accentHover text-white text-sm
                       font-medium rounded-xl transition disabled:opacity-40 disabled:cursor-not-allowed
                       self-end"
          >
            Send
          </button>
        </div>
      </div>
    </section>
  );
}
