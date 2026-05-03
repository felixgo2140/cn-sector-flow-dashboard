import { Suspense } from "react";
import { QueryTabs } from "@/components/Tabs";
import { getStockFlow, type Period } from "@/lib/queries";
import { fmtPct, fmtYi, flowColor } from "@/lib/format";

export const dynamic = "force-dynamic";

const PERIODS: Period[] = ["今日", "5日", "10日"];

export default async function StocksPage({
  searchParams,
}: {
  searchParams: Promise<{ period?: string; dir?: string }>;
}) {
  const sp = await searchParams;
  const period: Period = (PERIODS as string[]).includes(sp.period ?? "")
    ? (sp.period as Period)
    : "今日";
  const direction: "in" | "out" = sp.dir === "out" ? "out" : "in";

  const rows = getStockFlow(period, undefined, 100, direction);
  const updated = rows[0]?.updated_at ?? "—";
  const tradeDate = rows[0]?.trade_date ?? "—";

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-center gap-3">
        <Suspense>
          <QueryTabs
            param="period"
            options={PERIODS.map((v) => ({ label: v, value: v }))}
          />
          <QueryTabs
            param="dir"
            options={[
              { label: "净流入", value: "in" },
              { label: "净流出", value: "out" },
            ]}
          />
        </Suspense>
        <div className="ml-auto text-xs text-zinc-500">
          交易日 <span className="text-zinc-300">{tradeDate}</span> · 更新于{" "}
          <span className="text-zinc-300">{updated.replace("T", " ")}</span>
        </div>
      </div>

      <section className="rounded-lg border border-zinc-800 bg-zinc-900/40 overflow-hidden">
        <h2 className="px-4 py-2 text-sm text-zinc-400 border-b border-zinc-800">
          个股主力{direction === "in" ? "净流入" : "净流出"} Top 100（{period}）
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-xs text-zinc-500">
              <tr className="border-b border-zinc-800">
                <th className="text-left px-3 py-2 w-12">#</th>
                <th className="text-left px-3 py-2">代码</th>
                <th className="text-left px-3 py-2">名称</th>
                <th className="text-right px-3 py-2">最新价</th>
                <th className="text-right px-3 py-2">涨跌幅</th>
                <th className="text-right px-3 py-2">主力净流入</th>
                <th className="text-right px-3 py-2">主力占比</th>
                <th className="text-right px-3 py-2">超大单</th>
                <th className="text-right px-3 py-2">大单</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r, i) => (
                <tr
                  key={r.code}
                  className="border-b border-zinc-900 hover:bg-zinc-900/60"
                >
                  <td className="px-3 py-1.5 text-zinc-500">{i + 1}</td>
                  <td className="px-3 py-1.5 text-zinc-400 tabular-nums">{r.code}</td>
                  <td className="px-3 py-1.5">{r.name}</td>
                  <td className="px-3 py-1.5 text-right tabular-nums">{r.price ?? "—"}</td>
                  <td className={`px-3 py-1.5 text-right ${flowColor(r.pct_change)}`}>
                    {fmtPct(r.pct_change)}
                  </td>
                  <td className={`px-3 py-1.5 text-right tabular-nums ${flowColor(r.main_net)}`}>
                    {fmtYi(r.main_net)} 亿
                  </td>
                  <td className={`px-3 py-1.5 text-right tabular-nums ${flowColor(r.main_pct)}`}>
                    {fmtPct(r.main_pct)}
                  </td>
                  <td className={`px-3 py-1.5 text-right tabular-nums ${flowColor(r.super_large_net)}`}>
                    {fmtYi(r.super_large_net)}
                  </td>
                  <td className={`px-3 py-1.5 text-right tabular-nums ${flowColor(r.large_net)}`}>
                    {fmtYi(r.large_net)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
