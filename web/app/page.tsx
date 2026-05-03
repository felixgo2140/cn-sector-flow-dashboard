import { Suspense } from "react";
import Link from "next/link";
import { SectorTreemap } from "@/components/SectorTreemap";
import { RotationScatter } from "@/components/RotationScatter";
import { QueryTabs } from "@/components/Tabs";
import { UpdatedAt } from "@/components/UpdatedAt";
import { SignalBanner } from "@/components/SignalBanner";
import {
  getBenchmarks,
  getLevel1IndustryFlow,
  getSectorFlow,
  getSectorRotation,
  type Period,
  type SectorType,
} from "@/lib/queries";
import { computeInsights } from "@/lib/insights";
import { fmtPct, fmtYi, flowColor } from "@/lib/format";

export const dynamic = "force-dynamic";

const PERIODS: Period[] = ["今日", "5日", "10日"];
const SECTOR_TYPES: SectorType[] = ["行业资金流", "概念资金流"];

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ period?: string; type?: string }>;
}) {
  const sp = await searchParams;
  const period: Period = (PERIODS as string[]).includes(sp.period ?? "")
    ? (sp.period as Period)
    : "今日";
  const sectorType: SectorType = (SECTOR_TYPES as string[]).includes(sp.type ?? "")
    ? (sp.type as SectorType)
    : "行业资金流";

  // 当前 tab 的板块行情（用于 treemap / 表 / 三组名单 / 信号）
  const todaySectors =
    sectorType === "行业资金流"
      ? getLevel1IndustryFlow(period)
      : getSectorFlow(period, sectorType, undefined, 80);

  // 5 日数据用于"中期最强"和"可能转强"判定
  const midSectors =
    sectorType === "行业资金流"
      ? getLevel1IndustryFlow("5日")
      : getSectorFlow("5日", sectorType, undefined, 80);

  // 三大基准
  const benchmarks = getBenchmarks();

  // 当前看到的板块全量明细（轮动表 & 全量明细共用）
  const fullSectors = todaySectors;
  const updated = fullSectors[0]?.updated_at ?? "";
  const tradeDate = fullSectors[0]?.trade_date ?? "—";

  // 信号 / 叙述
  const insights = computeInsights(todaySectors, midSectors, benchmarks);

  // 三组名单
  const leadingShort = [...todaySectors]
    .filter((s) => s.main_net != null)
    .sort((a, b) => (b.main_net ?? 0) - (a.main_net ?? 0))
    .slice(0, 5);
  const leadingMid = [...midSectors]
    .filter((s) => s.main_net != null)
    .sort((a, b) => (b.main_net ?? 0) - (a.main_net ?? 0))
    .slice(0, 5);
  const lagging = [...todaySectors]
    .filter((s) => s.main_net != null)
    .sort((a, b) => (a.main_net ?? 0) - (b.main_net ?? 0))
    .slice(0, 5);

  // 轮动散点
  const rotation = getSectorRotation(sectorType);
  const rotationItems = rotation.map((d) => ({
    name: d.sector_name,
    todayRank: d.today_rank,
    fiveDayRank: d.five_day_rank,
    todayNetYi: (d.today_main_net ?? 0) / 1e8,
  }));

  // Treemap 用主力占比着色 + 主力净流入大小
  const heatItems = todaySectors.map((r) => ({
    name: r.sector_name,
    mainNet: r.main_net ?? 0,
    mainPct: r.main_pct,
    pctChange: r.pct_change,
    topStock: r.top_inflow_stock,
  }));

  // 是否盘中
  const isLive =
    !!updated && Date.now() - new Date(updated).getTime() < 30 * 60 * 1000;

  const hasData = todaySectors.length > 0;

  return (
    <div className="flex flex-col gap-5 max-w-[1400px] mx-auto">
      {/* 标题 + 状态条 */}
      <header className="flex flex-wrap items-end gap-4">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">
            A 股资金流向可视化{" "}
            <span className="text-zinc-500 font-normal">· CN Sector Flow</span>
          </h1>
          <p className="text-xs text-zinc-500 mt-1">
            A 股板块资金流向，先看主力今天在押注哪个方向。
          </p>
        </div>
        <div className="ml-auto flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-zinc-500">
          <span>
            交易日{" "}
            <span className="text-zinc-300 font-medium">{tradeDate}</span>
          </span>
          <span>
            状态{" "}
            <span
              className={
                isLive ? "text-emerald-400 font-medium" : "text-zinc-300 font-medium"
              }
            >
              {isLive ? "盘中" : "收盘"}
            </span>
          </span>
          <span>
            覆盖{" "}
            <span className="text-zinc-300 font-medium">
              {todaySectors.length}
            </span>{" "}
            个{sectorType === "行业资金流" ? "申万一级" : "概念"} ·{" "}
            <span className="text-zinc-300 font-medium">{benchmarks.length}</span>{" "}
            个基准
          </span>
          <UpdatedAt ts={updated} />
        </div>
      </header>

      {/* Tabs：板块类型 + 周期 */}
      <div className="flex flex-wrap items-center gap-3">
        <Suspense>
          <QueryTabs
            param="type"
            options={SECTOR_TYPES.map((v) => ({
              label: v.replace("资金流", ""),
              value: v,
            }))}
          />
          <QueryTabs
            param="period"
            options={PERIODS.map((v) => ({ label: v, value: v }))}
          />
        </Suspense>
      </div>

      {/* 信号 banner */}
      {hasData && <SignalBanner tone={insights.marketTone} text={insights.signal} />}

      {!hasData && (
        <div className="rounded-lg border border-amber-700/40 bg-amber-900/20 px-4 py-3 text-sm text-amber-200">
          暂无数据。请在仓库根目录执行{" "}
          <code className="bg-zinc-900 px-1.5 py-0.5 rounded">make pull</code>{" "}
          抓取板块 / 个股 / 基准。
        </div>
      )}

      {/* KPI：3 个基准 + 短期最强 */}
      <section className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {benchmarks.map((b) => (
          <KpiCard
            key={b.symbol}
            label={b.short}
            value={b.close.toFixed(2)}
            delta={fmtPct(b.pct_1d)}
            tone={(b.pct_1d ?? 0) >= 0 ? "up" : "down"}
            hint={`5D ${fmtPct(b.pct_5d)} · 20D ${fmtPct(b.pct_20d)}`}
          />
        ))}
        <KpiCard
          label="短期最强板块"
          value={insights.shortLeader?.sector_name ?? "—"}
          delta={`主力 ${fmtYi(insights.shortLeader?.main_net)} 亿`}
          tone={(insights.shortLeader?.main_net ?? 0) >= 0 ? "up" : "down"}
          hint={`涨跌 ${fmtPct(insights.shortLeader?.pct_change)}`}
        />
      </section>

      {/* 盘面解读 */}
      {hasData && insights.narrative.length > 0 && (
        <section className="rounded-lg border border-zinc-800 bg-zinc-900/40">
          <div className="px-4 py-2 flex items-center justify-between border-b border-zinc-800">
            <h2 className="text-sm text-zinc-300 font-medium">
              盘面解读 ·{" "}
              <span className="text-zinc-500">
                基于今日板块 + 三大基准自动生成
              </span>
            </h2>
            <span className="text-[11px] text-zinc-500">
              板块主力合计{" "}
              <span
                className={
                  insights.totalMainNetYi >= 0
                    ? "text-red-400"
                    : "text-emerald-400"
                }
              >
                {insights.totalMainNetYi >= 0 ? "+" : ""}
                {insights.totalMainNetYi.toFixed(0)} 亿
              </span>
            </span>
          </div>
          <div className="px-4 py-3 space-y-2 text-sm leading-relaxed text-zinc-300">
            {insights.narrative.map((p, i) => (
              <p key={i}>{p}</p>
            ))}
          </div>
        </section>
      )}

      {/* 三组名单 */}
      {hasData && (
        <section className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <ListPanel
            title="短期领先（今日）"
            subtitle="今日主力净流入最高的方向"
            accent="text-red-400"
            rows={leadingShort.map((s) => ({
              name: s.sector_name,
              sub: `涨跌 ${fmtPct(s.pct_change)}`,
              value: `${fmtYi(s.main_net)} 亿`,
              tone: (s.main_net ?? 0) >= 0 ? ("up" as const) : ("down" as const),
            }))}
          />
          <ListPanel
            title="可能转强（5 日）"
            subtitle="中期主线 · 调整即可能再起"
            accent="text-amber-400"
            rows={leadingMid.map((s) => ({
              name: s.sector_name,
              sub: `占比 ${fmtPct(s.main_pct)}`,
              value: `${fmtYi(s.main_net)} 亿`,
              tone: (s.main_net ?? 0) >= 0 ? ("up" as const) : ("down" as const),
            }))}
          />
          <ListPanel
            title="需要警惕（今日）"
            subtitle="今日主力净流出最多、警惕进一步杀跌"
            accent="text-emerald-400"
            rows={lagging.map((s) => ({
              name: s.sector_name,
              sub: `涨跌 ${fmtPct(s.pct_change)}`,
              value: `${fmtYi(s.main_net)} 亿`,
              tone: "down" as const,
            }))}
          />
        </section>
      )}

      {/* 板块热力图 */}
      <section className="rounded-lg border border-zinc-800 bg-zinc-900/40">
        <div className="px-4 py-2 flex items-center justify-between border-b border-zinc-800">
          <h2 className="text-sm text-zinc-300 font-medium">
            板块热力图 ·{" "}
            <span className="text-zinc-500">
              {sectorType === "行业资金流" ? "申万一级行业" : "概念板块"} ·{" "}
              {period}
            </span>
          </h2>
          <span className="text-[11px] text-zinc-500">
            块大小 = |主力净流入额| · 颜色 = 主力占比 ·{" "}
            <span className="text-red-400">红=吸金</span> /{" "}
            <span className="text-emerald-400">绿=失血</span>
          </span>
        </div>
        <div className="p-2">
          <SectorTreemap items={heatItems} height={460} />
        </div>
      </section>

      {/* 短中期轮动 */}
      <section className="rounded-lg border border-zinc-800 bg-zinc-900/40">
        <div className="px-4 py-2 flex items-center justify-between border-b border-zinc-800">
          <h2 className="text-sm text-zinc-300 font-medium">短中期轮动坐标</h2>
          <span className="text-[11px] text-zinc-500">
            横:5日排名 / 纵:今日排名 ·{" "}
            <span className="text-red-400">右下=持续强势</span> · 左下=新晋强势 ·{" "}
            <span className="text-emerald-400">左上=持续弱势</span> · 右上=动能衰减
          </span>
        </div>
        <div className="p-2">
          <RotationScatter
            items={rotationItems}
            totalSectors={rotationItems.length}
            height={420}
            labelTopN={14}
          />
        </div>
      </section>

      {/* 全量明细 */}
      <section className="rounded-lg border border-zinc-800 bg-zinc-900/40 overflow-hidden">
        <div className="px-4 py-2 flex items-center justify-between border-b border-zinc-800">
          <h2 className="text-sm text-zinc-300 font-medium">
            全量明细 · 按主力净流入排序
          </h2>
          <Link
            href="/stocks"
            className="text-[11px] text-zinc-400 hover:text-zinc-200"
          >
            查看个股 →
          </Link>
        </div>
        <div className="overflow-x-auto max-h-[480px] overflow-y-auto">
          <table className="w-full text-xs">
            <thead className="text-[10px] text-zinc-500 sticky top-0 bg-zinc-900">
              <tr className="border-b border-zinc-800">
                <th className="text-left px-3 py-1.5 w-10">#</th>
                <th className="text-left px-3 py-1.5">板块</th>
                <th className="text-right px-3 py-1.5">涨跌幅</th>
                <th className="text-right px-3 py-1.5">主力净流入</th>
                <th className="text-right px-3 py-1.5">主力占比</th>
                <th className="text-right px-3 py-1.5">超大单</th>
                <th className="text-right px-3 py-1.5">大单</th>
                <th className="text-left px-3 py-1.5">领涨股</th>
              </tr>
            </thead>
            <tbody>
              {fullSectors.map((r, i) => (
                <tr
                  key={r.sector_name}
                  className="border-b border-zinc-900 hover:bg-zinc-900/60"
                >
                  <td className="px-3 py-1 text-zinc-500 tabular-nums">{i + 1}</td>
                  <td className="px-3 py-1 text-zinc-200">{r.sector_name}</td>
                  <td
                    className={`px-3 py-1 text-right tabular-nums ${flowColor(r.pct_change)}`}
                  >
                    {fmtPct(r.pct_change)}
                  </td>
                  <td
                    className={`px-3 py-1 text-right tabular-nums font-medium ${flowColor(r.main_net)}`}
                  >
                    {fmtYi(r.main_net)} 亿
                  </td>
                  <td
                    className={`px-3 py-1 text-right tabular-nums ${flowColor(r.main_pct)}`}
                  >
                    {fmtPct(r.main_pct)}
                  </td>
                  <td
                    className={`px-3 py-1 text-right tabular-nums ${flowColor(r.super_large_net)}`}
                  >
                    {fmtYi(r.super_large_net)}
                  </td>
                  <td
                    className={`px-3 py-1 text-right tabular-nums ${flowColor(r.large_net)}`}
                  >
                    {fmtYi(r.large_net)}
                  </td>
                  <td className="px-3 py-1 text-zinc-300">
                    {r.top_inflow_stock ?? "—"}
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

function KpiCard({
  label,
  value,
  delta,
  tone,
  hint,
}: {
  label: string;
  value: string;
  delta?: string;
  tone: "up" | "down" | "neutral";
  hint?: string;
}) {
  const color =
    tone === "up"
      ? "text-red-400"
      : tone === "down"
        ? "text-emerald-400"
        : "text-zinc-200";
  return (
    <div className="rounded-lg border border-zinc-800 bg-zinc-900/40 px-4 py-3">
      <div className="text-[11px] text-zinc-500 uppercase tracking-wide">
        {label}
      </div>
      <div className="flex items-baseline gap-2 mt-0.5">
        <div className={`text-xl font-semibold tabular-nums truncate ${color}`}>
          {value}
        </div>
        {delta && (
          <div className={`text-xs tabular-nums ${color} opacity-90`}>
            {delta}
          </div>
        )}
      </div>
      {hint && (
        <div className="text-[11px] text-zinc-600 mt-0.5 truncate">{hint}</div>
      )}
    </div>
  );
}

function ListPanel({
  title,
  subtitle,
  accent,
  rows,
}: {
  title: string;
  subtitle?: string;
  accent: string;
  rows: { name: string; sub: string; value: string; tone: "up" | "down" }[];
}) {
  return (
    <div className="rounded-lg border border-zinc-800 bg-zinc-900/40">
      <div className="px-4 py-2 border-b border-zinc-800">
        <span className={`text-xs font-medium ${accent}`}>{title}</span>
        {subtitle && (
          <div className="text-[10px] text-zinc-500 mt-0.5">{subtitle}</div>
        )}
      </div>
      <ul className="divide-y divide-zinc-900">
        {rows.length === 0 && (
          <li className="px-4 py-3 text-xs text-zinc-500">—</li>
        )}
        {rows.map((r) => (
          <li
            key={r.name}
            className="px-4 py-2 flex items-center justify-between text-xs"
          >
            <div className="flex items-center gap-2 min-w-0">
              <span className="text-zinc-200 truncate">{r.name}</span>
              <span className="text-[10px] text-zinc-500 shrink-0">
                {r.sub}
              </span>
            </div>
            <span
              className={`tabular-nums font-medium ${
                r.tone === "up" ? "text-red-400" : "text-emerald-400"
              }`}
            >
              {r.value}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
