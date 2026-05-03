export function fmtYi(v: number | null | undefined): string {
  if (v == null) return "—";
  const yi = v / 1e8;
  if (Math.abs(yi) >= 100) return yi.toFixed(0);
  if (Math.abs(yi) >= 10) return yi.toFixed(1);
  return yi.toFixed(2);
}

export function fmtPct(v: number | null | undefined): string {
  if (v == null) return "—";
  const sign = v > 0 ? "+" : "";
  return `${sign}${v.toFixed(2)}%`;
}

export function flowColor(v: number | null | undefined): string {
  if (v == null || v === 0) return "text-zinc-400";
  return v > 0 ? "text-red-500" : "text-emerald-500";
}
