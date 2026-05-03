"use client";

import ReactECharts from "echarts-for-react";
import type { EChartsOption } from "echarts";

type Item = {
  name: string;
  todayRank: number | null;
  fiveDayRank: number | null;
  todayNetYi: number;
};

export function RotationScatter({
  items,
  totalSectors,
  height = 560,
  labelTopN = 12,
}: {
  items: Item[];
  totalSectors: number;
  height?: number;
  labelTopN?: number;
}) {
  const filtered = items.filter(
    (i) => i.todayRank != null && i.fiveDayRank != null,
  );
  const labelSet = new Set(
    [...filtered]
      .sort((a, b) => Math.abs(b.todayNetYi) - Math.abs(a.todayNetYi))
      .slice(0, labelTopN)
      .map((i) => i.name),
  );
  const points = filtered.map((i) => ({
    name: i.name,
    value: [i.fiveDayRank as number, i.todayRank as number, i.todayNetYi],
    showLabel: labelSet.has(i.name),
  }));

  const mid = Math.round(totalSectors / 2);

  const option: EChartsOption = {
    grid: { left: 60, right: 40, top: 40, bottom: 50 },
    tooltip: {
      trigger: "item",
      formatter: (p) => {
        const param = p as { data: { name: string; value: number[] } };
        const [fr, tr, yi] = param.data.value;
        return `<b>${param.data.name}</b><br/>5日排名: ${fr}<br/>今日排名: ${tr}<br/>今日主力: ${yi.toFixed(2)} 亿`;
      },
    },
    xAxis: {
      type: "value",
      name: "5日排名（左=强）",
      nameLocation: "middle",
      nameGap: 30,
      inverse: true,
      min: 1,
      max: totalSectors,
      axisLabel: { color: "#a1a1aa" },
      splitLine: { lineStyle: { color: "#27272a" } },
    },
    yAxis: {
      type: "value",
      name: "今日排名（下=强）",
      nameLocation: "middle",
      nameGap: 40,
      inverse: true,
      min: 1,
      max: totalSectors,
      axisLabel: { color: "#a1a1aa" },
      splitLine: { lineStyle: { color: "#27272a" } },
    },
    series: [
      {
        type: "scatter",
        symbolSize: (val: number[]) =>
          Math.max(6, Math.min(40, Math.sqrt(Math.abs(val[2])) * 4)),
        data: points,
        itemStyle: {
          color: (p) => {
            const param = p as { data: { value: number[] } };
            return param.data.value[2] >= 0 ? "#ef4444" : "#10b981";
          },
          opacity: 0.75,
        },
        label: {
          show: true,
          formatter: (p) => {
            const param = p as unknown as { name: string; data: { showLabel: boolean } };
            return param.data.showLabel ? param.name : "";
          },
          position: "top",
          color: "#e4e4e7",
          fontSize: 11,
          fontWeight: 500,
        },
        labelLayout: { hideOverlap: true, moveOverlap: "shiftY" },
        markLine: {
          symbol: "none",
          silent: true,
          lineStyle: { color: "#52525b", type: "dashed" },
          data: [
            { xAxis: mid, name: "5日中位" },
            { yAxis: mid, name: "今日中位" },
          ],
          label: { color: "#71717a" },
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
