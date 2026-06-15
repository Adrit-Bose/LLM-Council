"use client";

import { COUNT_UP_MS } from "@/lib/animation/constants";
import { useEffect, useState } from "react";

interface CountUpProps {
  value: number;
  animate: boolean;
  className?: string;
  suffix?: string;
}

function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3);
}

export function CountUp({ value, animate, className = "", suffix = "" }: CountUpProps) {
  const [display, setDisplay] = useState(animate ? 0 : value);

  useEffect(() => {
    if (!animate) {
      setDisplay(value);
      return;
    }

    const start = performance.now();
    let frame: number;

    const tick = (now: number) => {
      const elapsed = now - start;
      const progress = Math.min(elapsed / COUNT_UP_MS, 1);
      setDisplay(Math.round(easeOutCubic(progress) * value));
      if (progress < 1) frame = requestAnimationFrame(tick);
    };

    setDisplay(0);
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [value, animate]);

  return (
    <span className={className}>
      {display}
      {suffix}
    </span>
  );
}
