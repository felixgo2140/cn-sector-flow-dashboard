# A 股资金流向看板 · CN Sector Flow Dashboard

A 股板块资金流向可视化 —— 参考 [US Sector Flow Dashboard](https://us-sector-flow-dashboard.vercel.app/) 的版面设计，
覆盖申万一级行业 + 概念板块、主力净流入、板块轮动、热门个股 4 个维度。

## 看板特性

- **顶部诊断 banner**：基于今日板块主力 + 三大基准 自动给出 RISK ON / RISK OFF / MIXED / QUIET 标签
- **盘面解读**：2-3 段自动叙述，覆盖大盘 / 资金面 / 板块结构 / 转强 / 衰减
- **3 大基准并列 KPI**：沪深300 / 中证500 / 创业板指 + 短期最强板块
- **行业 / 概念 双 tab 切换**，周期 今日 / 5日 / 10日
- **板块热力图**（按主力占比着色，红=吸金 绿=失血）
- **短中期轮动散点**（横:5日排名 / 纵:今日排名）
- **板块全量明细 + 个股资金流榜**

## 技术栈

- **数据**：AKShare 板块/个股资金流接口 + 三大基准指数
- **抓数**：Python（`ingest/`）→ SQLite（`web/db/data.db`）
- **前端**：Next.js 16 (App Router) + better-sqlite3 + ECharts + Tailwind 4
- **部署**：Vercel + GitHub Action 每日 cron

## 数据源

| 维度        | AKShare 接口                                              |
| ----------- | --------------------------------------------------------- |
| 行业资金流  | `stock_sector_fund_flow_rank(indicator, sector_type=行业资金流)` |
| 概念资金流  | `stock_sector_fund_flow_rank(indicator, sector_type=概念资金流)` |
| 个股资金流  | `stock_individual_fund_flow_rank(indicator)`              |
| 基准指数    | `stock_zh_index_daily(symbol)` × 3                        |

## 使用

```bash
make install            # 装 Python 依赖
make pull               # 抓全部数据
cd web && npm install   # 装前端依赖
make dev                # http://localhost:3000
```

每日定时刷新由 `.github/workflows/refresh-data.yml` 自动完成。

## 目录

```
fund-rotation/
├── db/schema.sql                   # SQLite schema
├── ingest/                         # Python 抓数
│   ├── pull_sectors.py             # 板块资金流（行业 + 概念）
│   ├── pull_stocks.py              # 个股资金流
│   └── pull_benchmarks.py          # 三大基准指数
├── web/                            # Next.js 前端
│   ├── db/data.db                  # SQLite 文件（committed）
│   ├── app/                        # /, /rotation, /stocks
│   ├── components/                 # SignalBanner / SectorTreemap / ...
│   └── lib/                        # db / queries / insights / format
└── .github/workflows/refresh-data.yml
```
