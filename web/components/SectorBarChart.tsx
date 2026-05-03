"use client";

import ReactECharts from "echarts-for-react";
import type { EChartsOption } from "echarts";

type Item = { name: string; value: number };

export function SectorBarChart({
  items,
  height = 720,
}: {
  items: Item[];
  height?: number;
}) {
  const sorted = [...items].sort((a, b) => a.value - b.value);
  const names = sorted.map((d) => d.name);
  const values = sorted.map((d) => +(d.value / 1e8).toFixed(2));

  const option: EChartsOption = {
    grid: { left: 100, right: 60, top: 16, bottom: 30 },
    tooltip: {
      trigger: "axis",
      axisPointer: { type: "shadow" },
      valueFormatter: (v) => `${v} 亿`,
    },
    xAxis: {
      type: "value",
      axisLabel: { formatter: "{value}亿", color: "#a1a1aa" },
      splitLine: { lineStyle: { color: "#27272a" } },
    },
    yAxis: {
      type: "category",
      data: names,
      axisLabel: { color: "#d4d4d8", fontSize: 11 },
    },
    series: [
      {
        type: "bar",
        data: values.map((v) => ({
          value: v,
          itemStyle: { color: v >= 0 ? "#ef4444" : "#10b981" },
        })),
        label: {
          show: true,
          position: "right",
          color: "#a1a1aa",
          fontSize: 10,
          formatter: (p) => `${p.value}`,
        },
      },
    ],
    backgroundColor: "transparent",
  };

  return (
    <ReactECharts
      option={option}
      style={{ height, width: "100%" }}
      theme="dark"
    />
  );
}
