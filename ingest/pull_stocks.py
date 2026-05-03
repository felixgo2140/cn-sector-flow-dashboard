"""Pull A-share individual stock fund-flow rankings from AKShare into SQLite."""
from __future__ import annotations

from datetime import datetime
import sys

import akshare as ak
import pandas as pd

from db import connect, init_schema

PERIODS = ["今日", "3日", "5日", "10日"]


NUMERIC_COLS_TEMPLATE = (
    "{p}涨跌幅",
    "{p}主力净流入-净额",
    "{p}主力净流入-净占比",
    "{p}超大单净流入-净额",
    "{p}大单净流入-净额",
    "{p}中单净流入-净额",
    "{p}小单净流入-净额",
)


def fetch(period: str) -> pd.DataFrame:
    df = ak.stock_individual_fund_flow_rank(indicator=period)
    cols = ["最新价"] + [t.format(p=period) for t in NUMERIC_COLS_TEMPLATE]
    for c in cols:
        if c in df.columns:
            df[c] = pd.to_numeric(df[c], errors="coerce")
    df = df.where(pd.notnull(df), None)
    return df


def upsert(df: pd.DataFrame, period: str, trade_date: str, ts: str) -> int:
    rows = []
    for _, r in df.iterrows():
        rows.append((
            trade_date,
            period,
            r.get("代码"),
            r.get("名称"),
            r.get("最新价"),
            r.get(f"{period}涨跌幅"),
            r.get(f"{period}主力净流入-净额"),
            r.get(f"{period}主力净流入-净占比"),
            r.get(f"{period}超大单净流入-净额"),
            r.get(f"{period}大单净流入-净额"),
            r.get(f"{period}中单净流入-净额"),
            r.get(f"{period}小单净流入-净额"),
            int(r["序号"]) if r.get("序号") is not None else None,
            ts,
        ))
    sql = """
    INSERT INTO stock_flow (
      trade_date, period, code, name, price, pct_change,
      main_net, main_pct, super_large_net, large_net, medium_net, small_net,
      rank, updated_at
    ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)
    ON CONFLICT(trade_date, period, code) DO UPDATE SET
      name=excluded.name,
      price=excluded.price,
      pct_change=excluded.pct_change,
      main_net=excluded.main_net,
      main_pct=excluded.main_pct,
      super_large_net=excluded.super_large_net,
      large_net=excluded.large_net,
      medium_net=excluded.medium_net,
      small_net=excluded.small_net,
      rank=excluded.rank,
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
    for period in PERIODS:
        try:
            df = fetch(period)
            n = upsert(df, period, trade_date, ts)
            print(f"[ok] stocks / {period}: {n} rows")
            total += n
        except Exception as e:
            print(f"[err] stocks / {period}: {e}", file=sys.stderr)
    print(f"total upserted: {total}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
