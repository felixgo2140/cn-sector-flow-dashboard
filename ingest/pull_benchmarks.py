"""拉取 A 股三大基准指数（沪深300 / 中证500 / 创业板指）日线，写入 SQLite。

数据源：akshare.stock_zh_index_daily(symbol)，sina 后端，全历史。
"""
from __future__ import annotations

from datetime import datetime
import sys
import time

import akshare as ak
import pandas as pd

from db import connect, init_schema

INDICES: list[tuple[str, str, str]] = [
    # (symbol, full name, short)
    ("sh000300", "沪深300指数", "沪深300"),
    ("sh000905", "中证500指数", "中证500"),
    ("sz399006", "创业板指数", "创业板指"),
]


def upsert_meta() -> None:
    rows = [(s, n, sh) for s, n, sh in INDICES]
    sql = """
    INSERT INTO index_meta (symbol, name, short)
    VALUES (?,?,?)
    ON CONFLICT(symbol) DO UPDATE SET
      name=excluded.name, short=excluded.short
    """
    with connect() as conn:
        conn.executemany(sql, rows)


def fetch(symbol: str) -> pd.DataFrame:
    df = ak.stock_zh_index_daily(symbol=symbol)
    for c in ["open", "high", "low", "close", "volume"]:
        if c in df.columns:
            df[c] = pd.to_numeric(df[c], errors="coerce")
    df["date"] = df["date"].astype(str)
    df = df.where(pd.notnull(df), None)
    return df


def upsert(df: pd.DataFrame, symbol: str, ts: str, tail_days: int = 250) -> int:
    if tail_days and len(df) > tail_days:
        df = df.tail(tail_days)
    rows = []
    for _, r in df.iterrows():
        rows.append((
            r.get("date"), symbol,
            r.get("open"), r.get("high"), r.get("low"), r.get("close"),
            r.get("volume"), ts,
        ))
    sql = """
    INSERT INTO index_daily (
      trade_date, symbol, open, high, low, close, volume, updated_at
    ) VALUES (?,?,?,?,?,?,?,?)
    ON CONFLICT(trade_date, symbol) DO UPDATE SET
      open=excluded.open, high=excluded.high, low=excluded.low,
      close=excluded.close, volume=excluded.volume, updated_at=excluded.updated_at
    """
    with connect() as conn:
        conn.executemany(sql, rows)
    return len(rows)


def main() -> int:
    init_schema()
    upsert_meta()
    ts = datetime.now().isoformat(timespec="seconds")
    total = 0
    for symbol, name, _short in INDICES:
        try:
            df = fetch(symbol)
            n = upsert(df, symbol, ts)
            print(f"[ok] {symbol} {name}: {n} rows")
            total += n
            time.sleep(0.3)
        except Exception as e:
            print(f"[err] {symbol} {name}: {e}", file=sys.stderr)
    print(f"total upserted: {total}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
