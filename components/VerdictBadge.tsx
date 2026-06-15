const VERDICT_STYLES: Record<string, string> = {
  Go: "bg-green-500/15 text-green-400 border-green-500/30",
  "No-Go": "bg-red-500/15 text-red-400 border-red-500/30",
  Pivot: "bg-amber-500/15 text-amber-400 border-amber-500/30",
  Uncertain: "bg-slate-500/15 text-slate-400 border-slate-500/30",
};

interface VerdictBadgeProps {
  verdict: string;
  className?: string;
}

export function VerdictBadge({ verdict, className = "" }: VerdictBadgeProps) {
  const style = VERDICT_STYLES[verdict] ?? VERDICT_STYLES.Uncertain;

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${style} ${className}`}
    >
      {verdict}
    </span>
  );
}
