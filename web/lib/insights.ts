// 自动生成"信号 banner"和"盘面解读"叙述（A 股版）。
// 关键差异：A 股有真实的"主力净流入"数据，比港股更精确。
import type { SectorRow, BenchmarkRow } from "./queries";

type Sector = SectorRow;

export type Insights = {
  signal: string;
  marketTone: "risk-on" | "risk-off" | "mixed" | "quiet";
  benchTone: "up" | "down" | "flat";
  flowTone: "in" | "out" | "flat";
  narrative: string[];
  shortLeader: Sector | null;
  midLeader: Sector | null;
  riskWatch: Sector | null;
  emerging: Sector | null;
  fadingMomentum: Sector | null;
  totalMainNetYi: number; // 板块主力净流入合计（亿）
  benchAvgPct: number; // 三大基准平均涨跌幅
};

function pickShortLeader(sectors: Sector[]): Sector | null {
  // 短期最强 = 当日（period=今日 已在外层筛选）主力净流入最大
  const list = sectors.filter((s) => s.main_net != null);
  if (!list.length) return null;
  return [...list].sort((a, b) => (b.main_net ?? 0) - (a.main_net ?? 0))[0];
}
function pickMidLeader(midSectors: Sector[]): Sector | null {
  // 5 日主力净流入最大
  const list = midSectors.filter((s) => s.main_net != null);
  if (!list.length) return null;
  return [...list].sort((a, b) => (b.main_net ?? 0) - (a.main_net ?? 0))[0];
}
function pickRisk(sectors: Sector[]): Sector | null {
  const list = sectors.filter((s) => s.main_net != null);
  if (!list.length) return null;
  return [...list].sort((a, b) => (a.main_net ?? 0) - (b.main_net ?? 0))[0];
}
function pickEmerging(today: Sector[], mid: Sector[]): Sector | null {
  // 5 日资金净流入 > 0 但今日转为净流出 → 中期主线遇调整
  const midMap = new Map(mid.map((s) => [s.sector_name, s]));
  const cands = today.filter((s) => {
    const m = midMap.get(s.sector_name);
    return (
      s.main_net != null &&
      m?.main_net != null &&
      (m.main_net ?? 0) > 0 &&
      (s.main_net ?? 0) < 0
    );
  });
  if (!cands.length) return null;
  return [...cands].sort((a, b) => {
    const am = midMap.get(a.sector_name)?.main_net ?? 0;
    const bm = midMap.get(b.sector_name)?.main_net ?? 0;
    return bm - am;
  })[0];
}
function pickFading(today: Sector[], mid: Sector[]): Sector | null {
  // 5 日仍正、今日跌幅靠前
  const midMap = new Map(mid.map((s) => [s.sector_name, s]));
  const cands = today.filter((s) => {
    const m = midMap.get(s.sector_name);
    return (
      s.pct_change != null &&
      m?.main_net != null &&
      (m.main_net ?? 0) > 0 &&
      (s.pct_change ?? 0) < -1.5
    );
  });
  if (!cands.length) return null;
  return [...cands].sort(
    (a, b) => (a.pct_change ?? 0) - (b.pct_change ?? 0),
  )[0];
}

function pctSign(n: number | null | undefined): string {
  if (n == null) return "—";
  return (n > 0 ? "+" : "") + n.toFixed(2) + "%";
}
function yiSign(n: number | null | undefined): string {
  if (n == null) return "—";
  const yi = n / 1e8;
  return (yi > 0 ? "+" : "") + yi.toFixed(1) + " 亿";
}

export function computeInsights(
  todaySectors: Sector[],
  midSectors: Sector[],
  benchmarks: BenchmarkRow[],
): Insights {
  const shortLeader = pickShortLeader(todaySectors);
  const midLeader = pickMidLeader(midSectors);
  const riskWatch = pickRisk(todaySectors);
  const emerging = pickEmerging(todaySectors, midSectors);
  const fadingMomentum = pickFading(todaySectors, midSectors);

  const totalMainNet = todaySectors.reduce(
    (s, x) => s + (x.main_net ?? 0),
    0,
  );
  const totalMainNetYi = totalMainNet / 1e8;

  const benchPcts = benchmarks
    .map((b) => b.pct_1d)
    .filter((x): x is number => x != null);
  const benchAvgPct = benchPcts.length
    ? benchPcts.reduce((s, x) => s + x, 0) / benchPcts.length
    : 0;

  const benchTone: Insights["benchTone"] =
    benchAvgPct > 0.3 ? "up" : benchAvgPct < -0.3 ? "down" : "flat";
  const flowTone: Insights["flowTone"] =
    totalMainNetYi > 50
      ? "in"
      : totalMainNetYi < -50
        ? "out"
        : "flat";

  // 板块离散度（主力净流入最大 vs 最小 的差，单位亿）
  const netList = todaySectors
    .map((s) => (s.main_net ?? 0) / 1e8)
    .filter((x) => x !== 0);
  const dispYi =
    netList.length >= 2 ? Math.max(...netList) - Math.min(...netList) : 0;

  let marketTone: Insights["marketTone"];
  if (dispYi < 10 && Math.abs(totalMainNetYi) < 30) marketTone = "quiet";
  else if (benchTone === "up" && flowTone !== "out") marketTone = "risk-on";
  else if (benchTone === "down" && flowTone === "out") marketTone = "risk-off";
  else marketTone = "mixed";

  const toneTag: Record<Insights["marketTone"], string> = {
    "risk-on": "风险偏好回升",
    "risk-off": "风险偏好转弱",
    mixed: "结构在分化",
    quiet: "整体平淡",
  };

  // ── Signal banner（一行）──
  const head = toneTag[marketTone];
  const leaderPart = shortLeader
    ? `最强短线锚是 ${shortLeader.sector_name}（主力 ${yiSign(shortLeader.main_net)}）`
    : "暂无明显领涨";
  const riskPart = riskWatch
    ? `需要警惕的是 ${riskWatch.sector_name}（主力 ${yiSign(riskWatch.main_net)}）`
    : "";
  const signal = riskPart
    ? `${head}。${leaderPart}；${riskPart}。`
    : `${head}。${leaderPart}。`;

  // ── 盘面解读 ──
  const narrative: string[] = [];

  // 第 1 段：基准 + 资金面
  const benchText = benchmarks
    .map((b) => `${b.short} ${pctSign(b.pct_1d)}`)
    .join("、");
  const flowText =
    flowTone === "in"
      ? `板块主力合计净流入约 ${totalMainNetYi.toFixed(0)} 亿，资金面偏多`
      : flowTone === "out"
        ? `板块主力合计净流出约 ${Math.abs(totalMainNetYi).toFixed(0)} 亿，资金面承压`
        : `板块主力合计接近平衡（${yiSign(totalMainNet)}）`;
  narrative.push(`大盘表现：${benchText}。${flowText}。`);

  // 第 2 段：板块结构
  if (shortLeader) {
    const dispText =
      dispYi >= 30
        ? "板块主力分布高度集中"
        : dispYi >= 10
          ? "板块主力分布中等"
          : "板块主力分布平均，结构性机会有限";
    let leaderLine = `今日 ${shortLeader.sector_name}（涨跌 ${pctSign(shortLeader.pct_change)}、主力 ${yiSign(shortLeader.main_net)}）是当日最强信号`;
    if (
      midLeader &&
      midLeader.sector_name !== shortLeader.sector_name
    ) {
      leaderLine += `；中期主线仍是 ${midLeader.sector_name}（5 日主力 ${yiSign(midLeader.main_net)}），短中期出现错位`;
    }
    narrative.push(`${dispText}。${leaderLine}。`);
  }

  // 第 3 段：风险 / 转强 / 衰减
  const tail: string[] = [];
  if (riskWatch && (riskWatch.main_net ?? 0) < -3e8) {
    tail.push(
      `${riskWatch.sector_name} 当日主力 ${yiSign(riskWatch.main_net)}，是最弱方向`,
    );
  }
  if (emerging) {
    tail.push(
      `${emerging.sector_name} 中期资金仍在流入但今日回撤，可能是低吸窗口`,
    );
  }
  if (
    fadingMomentum &&
    fadingMomentum.sector_name !== (riskWatch?.sector_name ?? "")
  ) {
    tail.push(
      `${fadingMomentum.sector_name} 5 日资金仍正但今日跌 ${pctSign(fadingMomentum.pct_change)}，动能可能开始衰减`,
    );
  }
  if (tail.length) narrative.push(tail.join("；") + "。");

  return {
    signal,
    marketTone,
    benchTone,
    flowTone,
    narrative,
    shortLeader,
    midLeader,
    riskWatch,
    emerging,
    fadingMomentum,
    totalMainNetYi,
    benchAvgPct,
  };
}
