CREATE TABLE IF NOT EXISTS sector_flow (
  trade_date    TEXT NOT NULL,
  period        TEXT NOT NULL,
  sector_type   TEXT NOT NULL,
  sector_name   TEXT NOT NULL,
  rank          INTEGER,
  pct_change    REAL,
  main_net      REAL,
  main_pct      REAL,
  super_large_net REAL,
  large_net     REAL,
  medium_net    REAL,
  small_net     REAL,
  top_inflow_stock TEXT,
  updated_at    TEXT NOT NULL,
  PRIMARY KEY (trade_date, period, sector_type, sector_name)
);

CREATE INDEX IF NOT EXISTS idx_sector_flow_date_period
  ON sector_flow(trade_date, period);

CREATE TABLE IF NOT EXISTS stock_flow (
  trade_date    TEXT NOT NULL,
  period        TEXT NOT NULL,
  code          TEXT NOT NULL,
  name          TEXT,
  price         REAL,
  pct_change    REAL,
  main_net      REAL,
  main_pct      REAL,
  super_large_net REAL,
  large_net     REAL,
  medium_net    REAL,
  small_net     REAL,
  rank          INTEGER,
  updated_at    TEXT NOT NULL,
  PRIMARY KEY (trade_date, period, code)
);

CREATE INDEX IF NOT EXISTS idx_stock_flow_date_period
  ON stock_flow(trade_date, period);

CREATE INDEX IF NOT EXISTS idx_stock_flow_main_net
  ON stock_flow(trade_date, period, main_net);

-- 基准指数日线（沪深300 / 中证500 / 创业板指等）
CREATE TABLE IF NOT EXISTS index_daily (
  trade_date  TEXT NOT NULL,
  symbol      TEXT NOT NULL,             -- sh000300 / sh000905 / sz399006
  open        REAL,
  high        REAL,
  low         REAL,
  close       REAL NOT NULL,
  volume      REAL,
  updated_at  TEXT NOT NULL,
  PRIMARY KEY (trade_date, symbol)
);
CREATE INDEX IF NOT EXISTS idx_index_daily_symbol ON index_daily(symbol, trade_date);

-- 基准指数元数据
CREATE TABLE IF NOT EXISTS index_meta (
  symbol TEXT PRIMARY KEY,
  name   TEXT NOT NULL,
  short  TEXT NOT NULL                   -- 短名："沪深300" / "中证500" / "创业板指"
);
