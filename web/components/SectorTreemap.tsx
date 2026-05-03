"use client";

import ReactECharts from "echarts-for-react";
import type { EChartsOption } from "echarts";

type Item = {
  name: string;
  mainNet: number;
  mainPct: number | null;
  pctChange: number | null;
  topStock: string | null;
};

export function SectorTreemap({
  items,
  height = 520,
}: {
  items: Item[];
  height?: number;
}) {
  const data = items
    .filter((i) => Math.abs(i.mainNet) > 0)
    .map((i) => ({
      name: i.name,
      value: Math.abs(i.mainNet) / 1e8,
      mainNet: i.mainNet / 1e8,
      mainPct: i.mainPct ?? 0,
      pctChange: i.pctChange ?? 0,
      topStock: i.topStock ?? "",
    }));

  const colorOf = (mainPct: number) => {
    const t = Math.max(-10, Math.min(10, mainPct)) / 10;
    if (t > 0) {
      const a = Math.min(1, 0.25 + t * 0.7);
      return `rgba(239, 68, 68, ${a})`;
    }
    if (t < 0) {
      const a = Math.min(1, 0.25 + -t * 0.7);
      return `rgba(16, 185, 129, ${a})`;
    }
    return "rgba(82, 82, 91, 0.4)";
  };

  const option: EChartsOption = {
    backgroundColor: "transparent",
    tooltip: {
      backgroundColor: "rgba(24, 24, 27, 0.95)",
      borderColor: "#3f3f46",
      textStyle: { color: "#e4e4e7" },
      formatter: (info) => {
        const d = (info as unknown as { data: typeof data[number] }).data;
        const sign = d.mainNet >= 0 ? "+" : "";
        const pctSign = d.pctChange >= 0 ? "+" : "";
        return `<b>${d.name}</b><br/>
          主力净流入: <b>${sign}${d.mainNet.toFixed(2)} 亿</b><br/>
          主力占比: ${d.mainPct.toFixed(2)}%<br/>
          板块涨跌: ${pctSign}${d.pctChange.toFixed(2)}%<br/>
          领涨股: ${d.topStock || "—"}`;
      },
    },
    series: [
      {
        type: "treemap",
        roam: false,
        nodeClick: false,
        breadcrumb: { show: false },
        width: "100%",
        height: "100%",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        data: data.map((d) => ({
          name: d.name,
          value: d.value,
          mainNet: d.mainNet,
          mainPct: d.mainPct,
          pctChange: d.pctChange,
          topStock: d.topStock,
          itemStyle: {
            color: colorOf(d.mainPct),
            borderColor: "#18181b",
            borderWidth: 1,
            gapWidth: 1,
          },
        })),
        label: {
          show: true,
          formatter: (info) => {
            const d = (info as unknown as { data: typeof data[number] }).data;
            const sign = d.mainNet >= 0 ? "+" : "";
            return `{name|${d.name}}\n{val|${sign}${d.mainNet.toFixed(1)}亿}`;
          },
          rich: {
            name: { fontSize: 13, fontWeight: 600, color: "#fafafa", lineHeight: 18 },
            val: { fontSize: 11, color: "#fafafa", opacity: 0.9, lineHeight: 14 },
          },
          overflow: "truncate",
        },
        upperLabel: { show: false },
        levels: [{ itemStyle: { borderWidth: 0, gapWidth: 1 } }],
        emphasis: {
          itemStyle: { borderColor: "#fafafa", borderWidth: 2 },
          label: { show: true },
        },
      },
    ],
  };

  return (
    <ReactECharts
      option={option}
      style={{ height, width: "100%" }}
      theme="dark"
      notMerge
    />
  );
}
