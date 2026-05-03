type Tone = "risk-on" | "risk-off" | "mixed" | "quiet";

const styleByTone: Record<
  Tone,
  { border: string; bg: string; chip: string; chipText: string; chipLabel: string }
> = {
  "risk-on": {
    border: "border-red-700/40",
    bg: "bg-red-950/30",
    chip: "bg-red-500/20",
    chipText: "text-red-300",
    chipLabel: "RISK ON",
  },
  "risk-off": {
    border: "border-emerald-700/40",
    bg: "bg-emerald-950/30",
    chip: "bg-emerald-500/20",
    chipText: "text-emerald-300",
    chipLabel: "RISK OFF",
  },
  mixed: {
    border: "border-amber-700/40",
    bg: "bg-amber-950/20",
    chip: "bg-amber-500/20",
    chipText: "text-amber-300",
    chipLabel: "MIXED",
  },
  quiet: {
    border: "border-zinc-700/60",
    bg: "bg-zinc-900/40",
    chip: "bg-zinc-500/20",
    chipText: "text-zinc-300",
    chipLabel: "QUIET",
  },
};

export function SignalBanner({
  tone,
  text,
}: {
  tone: Tone;
  text: string;
}) {
  const s = styleByTone[tone];
  return (
    <div
      className={`rounded-lg border ${s.border} ${s.bg} px-4 py-3 flex items-center gap-3`}
    >
      <span
        className={`shrink-0 text-[10px] font-mono font-semibold tracking-wider px-2 py-0.5 rounded ${s.chip} ${s.chipText}`}
      >
        {s.chipLabel}
      </span>
      <span className="text-sm text-zinc-100 leading-snug">{text}</span>
    </div>
  );
}
