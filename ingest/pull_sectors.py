"""Pull A-share sector fund-flow rankings from AKShare into SQLite.

Periods: 今日 / 5日 / 10日
Sector types: 行业资金流 / 概念资金流
"""
from __future__ import annotations

from datetime import datetime
import sys

import akshare as ak
import pandas as pd

from db import connect, init_schema

PERIODS = ["今日", "5日", "10日"]
SECTOR_TYPES = ["行业资金流", "概念资金流"]


def _col(df: pd.DataFrame, period: str, suffix: str) -> str | None:
    candidates = [f"{period}{suffix}", suffix.lstrip("-")]
    for c in candidates:
        if c in df.columns:
            return c
    return None


NUMERIC_COLS_TEMPLATE = (
    "{p}涨跌幅",
    "{p}主力净流入-净额",
    "{p}主力净流入-净占比",
    "{p}超大单净流入-净额",
    "{p}大单净流入-净额",
    "{p}中单净流入-净额",
    "{p}小单净流入-净额",
)


def fetch(period: str, sector_type: str) -> pd.DataFrame:
    df = ak.stock_sector_fund_flow_rank(indicator=period, sector_type=sector_type)
    for tpl in NUMERIC_COLS_TEMPLATE:
        c = tpl.format(p=period)
        if c in df.columns:
            df[c] = pd.to_numeric(df[c], errors="coerce")
    df = df.where(pd.notnull(df), None)
    return df


def upsert(df: pd.DataFrame, period: str, sector_type: str, trade_date: str, ts: str) -> int:
    rows = []
    for _, r in df.iterrows():
        rows.append((
            trade_date,
            period,
            sector_type,
            r.get("名称"),
            int(r["序号"]) if r.get("序号") is not None else None,
            r.get(f"{period}涨跌幅"),
            r.get(f"{period}主力净流入-净额"),
            r.get(f"{period}主力净流入-净占比"),
            r.get(f"{period}超大单净流入-净额"),
            r.get(f"{period}大单净流入-净额"),
            r.get(f"{period}中单净流入-净额"),
            r.get(f"{period}小单净流入-净额"),
            r.get(f"{period}主力净流入最大股"),
            ts,
        ))
    sql = """
    INSERT INTO sector_flow (
      trade_date, period, sector_type, sector_name, rank, pct_change,
      main_net, main_pct, super_large_net, large_net, medium_net, small_net,
      top_inflow_stock, updated_at
    ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)
    ON CONFLICT(trade_date, period, sector_type, sector_name) DO UPDATE SET
      rank=excluded.rank,
      pct_change=excluded.pct_change,
      main_net=excluded.main_net,
      main_pct=excluded.main_pct,
      super_large_net=excluded.super_large_net,
      large_net=excluded.large_net,
      medium_net=excluded.medium_net,
      small_net=excluded.small_net,
      top_inflow_stock=excluded.top_inflow_stock,
      updated_at=excluded.updated_at
    """
    with connect() as conn:
        conn.executemany(sql, rows)
    return len(rows)


def main() -> int:
    init_schema()
    now = datetime.now()
    ts = now.isoformat(timespec="seconds")
    trade_date = now.strftime("%Y-%m-%d")

    total = 0
    for sector_type in SECTOR_TYPES:
        for period in PERIODS:
            try:
                df = fetch(period, sector_type)
                n = upsert(df, period, sector_type, trade_date, ts)
                print(f"[ok] {sector_type} / {period}: {n} rows")
                total += n
            except Exception as e:
                print(f"[err] {sector_type} / {period}: {e}", file=sys.stderr)
    print(f"total upserted: {total}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
