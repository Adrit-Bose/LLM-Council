"use client";

import { COUNT_UP_MS } from "@/lib/animation/constants";
import { useEffect, useState } from "react";

interface ScoreBarProps {
  label: string;
  value: number;
  invertColor?: boolean;
  animate?: boolean;
  animationDelay?: number;
}

function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3);
}

export function ScoreBar({
  label,
  value,
  invertColor = false,
  animate = false,
  animationDelay = 0,
}: ScoreBarProps) {
  const clamped = Math.max(0, Math.min(100, value));
  const [displayValue, setDisplayValue] = useState(animate ? 0 : clamped);
  const [barWidth, setBarWidth] = useState(animate ? 0 : clamped);

  const getColor = (v: number) => {
    const effective = invertColor ? 100 - v : v;
    if (effective >= 70) return "bg-green-500";
    if (effective >= 40) return "bg-amber-500";
    return "bg-red-500";
  };

  useEffect(() => {
    if (!animate) {
      setDisplayValue(clamped);
      setBarWidth(clamped);
      return;
    }

    let frame: number;
    const startAt = performance.now() + animationDelay;

    const tick = (now: number) => {
      if (now < startAt) {
        frame = requestAnimationFrame(tick);
        return;
      }
      const elapsed = now - startAt;
      const progress = Math.min(elapsed / COUNT_UP_MS, 1);
      const eased = easeOutCubic(progress);
      const current = Math.round(eased * clamped);
      setDisplayValue(current);
      setBarWidth(eased * clamped);
      if (progress < 1) frame = requestAnimationFrame(tick);
    };

    setDisplayValue(0);
    setBarWidth(0);
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [animate, clamped, animationDelay]);

  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs">
        <span className="text-council-muted">{label}</span>
        <span className="font-mono font-medium text-slate-300">{displayValue}</span>
      </div>
      <div className="h-2 bg-council-bg rounded-full overflow-hidden border border-council-border">
        <div
          className={`h-full rounded-full ${getColor(clamped)}`}
          style={{
            width: `${barWidth}%`,
            transition: animate ? "none" : `width ${COUNT_UP_MS}ms ease-out`,
          }}
        />
      </div>
    </div>
  );
}
