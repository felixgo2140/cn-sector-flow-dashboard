import { fmtPct, fmtYi, flowColor } from "@/lib/format";
import type { StockRow } from "@/lib/queries";

function StockList({
  rows,
  title,
}: {
  rows: StockRow[];
  title: string;
}) {
  return (
    <div className="rounded-lg border border-zinc-800 bg-zinc-900/40 overflow-hidden">
      <h3 className="px-4 py-2 text-sm text-zinc-400 border-b border-zinc-800">
        {title}
      </h3>
      <div className="overflow-y-auto max-h-[480px]">
        <table className="w-full text-xs">
          <thead className="text-[10px] text-zinc-500 sticky top-0 bg-zinc-900">
            <tr className="border-b border-zinc-800">
              <th className="text-left px-2 py-1.5 w-7">#</th>
              <th className="text-left px-2 py-1.5">名称</th>
              <th className="text-right px-2 py-1.5">涨跌</th>
              <th className="text-right px-2 py-1.5">主力</th>
              <th className="text-right px-2 py-1.5">占比</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr
                key={r.code}
                className="border-b border-zinc-900 hover:bg-zinc-900/60"
              >
                <td className="px-2 py-1 text-zinc-500 tabular-nums">{i + 1}</td>
                <td className="px-2 py-1">
                  <div className="flex flex-col leading-tight">
                    <span className="text-zinc-200">{r.name}</span>
                    <span className="text-[10px] text-zinc-500 tabular-nums">
                      {r.code}
                    </span>
                  </div>
                </td>
                <td className={`px-2 py-1 text-right tabular-nums ${flowColor(r.pct_change)}`}>
                  {fmtPct(r.pct_change)}
                </td>
                <td className={`px-2 py-1 text-right tabular-nums font-medium ${flowColor(r.main_net)}`}>
                  {fmtYi(r.main_net)}
                </td>
                <td className={`px-2 py-1 text-right tabular-nums ${flowColor(r.main_pct)}`}>
                  {fmtPct(r.main_pct)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function StockSplit({
  inflow,
  outflow,
  period,
}: {
  inflow: StockRow[];
  outflow: StockRow[];
  period: string;
}) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
      <StockList rows={inflow} title={`个股主力净流入 Top 25 · ${period}`} />
      <StockList rows={outflow} title={`个股主力净流出 Top 25 · ${period}`} />
    </div>
  );
}
