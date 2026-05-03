.PHONY: help install pull pull-sectors pull-stocks pull-benchmarks dev build clean

help:
	@echo "make install         # 安装 Python 依赖"
	@echo "make pull            # 拉取板块 + 个股 + 基准指数"
	@echo "make pull-sectors    # 仅板块"
	@echo "make pull-stocks     # 仅个股"
	@echo "make pull-benchmarks # 仅基准指数（沪深300/中证500/创业板指）"
	@echo "make dev             # 启动 Next.js dev (http://localhost:3000)"
	@echo "make build           # 生产构建"

install:
	pip3 install -r ingest/requirements.txt

pull: pull-sectors pull-stocks pull-benchmarks

pull-sectors:
	cd ingest && python3 pull_sectors.py

pull-stocks:
	cd ingest && python3 pull_stocks.py

pull-benchmarks:
	cd ingest && python3 pull_benchmarks.py

dev:
	cd web && npm run dev

build:
	cd web && npm run build

clean:
	rm -f db/data.db db/data.db-wal db/data.db-shm
