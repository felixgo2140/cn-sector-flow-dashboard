import { getDb } from "./db";

export type SectorRow = {
  trade_date: string;
  period: string;
  sector_type: string;
  sector_name: string;
  rank: number | null;
  pct_change: number | null;
  main_net: number | null;
  main_pct: number | null;
  super_large_net: number | null;
  large_net: number | null;
  medium_net: number | null;
  small_net: number | null;
  top_inflow_stock: string | null;
  updated_at: string;
};

export type StockRow = {
  trade_date: string;
  period: string;
  code: string;
  name: string | null;
  price: number | null;
  pct_change: number | null;
  main_net: number | null;
  main_pct: number | null;
  super_large_net: number | null;
  large_net: number | null;
  medium_net: number | null;
  small_net: number | null;
  rank: number | null;
  updated_at: string;
};

export type Period = "今日" | "5日" | "10日";
export type SectorType = "行业资金流" | "概念资金流";

export function latestSectorTradeDate(): string | null {
  const row = getDb()
    .prepare(`SELECT MAX(trade_date) AS d FROM sector_flow`)
    .get() as { d: string | null };
  return row.d;
}

export function latestStockTradeDate(): string | null {
  const row = getDb()
    .prepare(`SELECT MAX(trade_date) AS d FROM stock_flow`)
    .get() as { d: string | null };
  return row.d;
}

export function getSectorFlow(
  period: Period,
  sectorType: SectorType,
  tradeDate?: string,
  limit = 200,
): SectorRow[] {
  const date = tradeDate ?? latestSectorTradeDate();
  if (!date) return [];
  return getDb()
    .prepare(
      `SELECT * FROM sector_flow
       WHERE trade_date = ? AND period = ? AND sector_type = ?
       ORDER BY main_net DESC NULLS LAST
       LIMIT ?`,
    )
    .all(date, period, sectorType, limit) as SectorRow[];
}

import { SW_LEVEL1 } from "./industry";

export function getLevel1IndustryFlow(
  period: Period,
  tradeDate?: string,
): SectorRow[] {
  const date = tradeDate ?? latestSectorTradeDate();
  if (!date) return [];
  const placeholders = Array.from(SW_LEVEL1, () => "?").join(",");
  return getDb()
    .prepare(
      `SELECT * FROM sector_flow
       WHERE trade_date = ? AND period = ? AND sector_type = '行业资金流'
         AND sector_name IN (${placeholders})
       ORDER BY main_net DESC NULLS LAST`,
    )
    .all(date, period, ...Array.from(SW_LEVEL1)) as SectorRow[];
}

export function getStockFlow(
  period: Period,
  tradeDate?: string,
  limit = 100,
  direction: "in" | "out" = "in",
): StockRow[] {
  const date = tradeDate ?? latestStockTradeDate();
  if (!date) return [];
  const order = direction === "in" ? "DESC" : "ASC";
  return getDb()
    .prepare(
      `SELECT * FROM stock_flow
       WHERE trade_date = ? AND period = ?
       ORDER BY main_net ${order} NULLS LAST
       LIMIT ?`,
    )
    .all(date, period, limit) as StockRow[];
}

// ─────────────────────────────────────────────
// 基准指数（沪深300 / 中证500 / 创业板指）
// ─────────────────────────────────────────────

export type BenchmarkRow = {
  symbol: string;
  short: string;
  trade_date: string;
  close: number;
  pct_1d: number | null;
  pct_5d: number | null;
  pct_20d: number | null;
};

export function getBenchmarks(): BenchmarkRow[] {
  const sql = `
    WITH latest AS (
      SELECT symbol, MAX(trade_date) AS d FROM index_daily GROUP BY symbol
    ),
    history AS (
      SELECT i.symbol, i.trade_date, i.close,
             ROW_NUMBER() OVER (PARTITION BY i.symbol ORDER BY i.trade_date DESC) AS rn
        FROM index_daily i
        JOIN latest l ON l.symbol = i.symbol
       WHERE i.trade_date >= date(l.d, '-40 days')
    )
    SELECT
      m.symbol, m.short,
      cur.trade_date, cur.close,
      prev1.close AS close_1d,
      prev5.close AS close_5d,
      prev20.close AS close_20d
    FROM index_meta m
    JOIN history cur ON cur.symbol = m.symbol AND cur.rn = 1
    LEFT JOIN history prev1 ON prev1.symbol = m.symbol AND prev1.rn = 2
    LEFT JOIN history prev5 ON prev5.symbol = m.symbol AND prev5.rn = 6
    LEFT JOIN history prev20 ON prev20.symbol = m.symbol AND prev20.rn = 21
    ORDER BY m.symbol
  `;
  type Raw = {
    symbol: string;
    short: string;
    trade_date: string;
    close: number;
    close_1d: number | null;
    close_5d: number | null;
    close_20d: number | null;
  };
  const raw = getDb().prepare(sql).all() as Raw[];
  return raw.map((r) => ({
    symbol: r.symbol,
    short: r.short,
    trade_date: r.trade_date,
    close: r.close,
    pct_1d: r.close_1d ? ((r.close - r.close_1d) / r.close_1d) * 100 : null,
    pct_5d: r.close_5d ? ((r.close - r.close_5d) / r.close_5d) * 100 : null,
    pct_20d: r.close_20d ? ((r.close - r.close_20d) / r.close_20d) * 100 : null,
  }));
}

export function getSectorRotation(
  sectorType: SectorType,
  tradeDate?: string,
): Array<{
  sector_name: string;
  today_rank: number | null;
  five_day_rank: number | null;
  ten_day_rank: number | null;
  today_main_net: number | null;
  five_day_main_net: number | null;
}> {
  const date = tradeDate ?? latestSectorTradeDate();
  if (!date) return [];
  return getDb()
    .prepare(
      `WITH t AS (
         SELECT sector_name, rank AS today_rank, main_net AS today_main_net
         FROM sector_flow
         WHERE trade_date = ? AND period = '今日' AND sector_type = ?
       ), f AS (
         SELECT sector_name, rank AS five_day_rank, main_net AS five_day_main_net
         FROM sector_flow
         WHERE trade_date = ? AND period = '5日' AND sector_type = ?
       ), d AS (
         SELECT sector_name, rank AS ten_day_rank
         FROM sector_flow
         WHERE trade_date = ? AND period = '10日' AND sector_type = ?
       )
       SELECT t.sector_name,
              t.today_rank, f.five_day_rank, d.ten_day_rank,
              t.today_main_net, f.five_day_main_net
       FROM t
       LEFT JOIN f USING (sector_name)
       LEFT JOIN d USING (sector_name)
       ORDER BY t.today_main_net DESC NULLS LAST`,
    )
    .all(date, sectorType, date, sectorType, date, sectorType) as Array<{
    sector_name: string;
    today_rank: number | null;
    five_day_rank: number | null;
    ten_day_rank: number | null;
    today_main_net: number | null;
    five_day_main_net: number | null;
  }>;
}
