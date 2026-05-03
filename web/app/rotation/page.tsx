import { Suspense } from "react";
import { RotationScatter } from "@/components/RotationScatter";
import { QueryTabs } from "@/components/Tabs";
import { getSectorRotation, type SectorType } from "@/lib/queries";

export const dynamic = "force-dynamic";

const SECTOR_TYPES: SectorType[] = ["行业资金流", "概念资金流"];

export default async function RotationPage({
  searchParams,
}: {
  searchParams: Promise<{ type?: string }>;
}) {
  const sp = await searchParams;
  const sectorType: SectorType = (SECTOR_TYPES as string[]).includes(
    sp.type ?? "",
  )
    ? (sp.type as SectorType)
    : "行业资金流";

  const data = getSectorRotation(sectorType);
  const total = data.length;
  const items = data.map((d) => ({
    name: d.sector_name,
    todayRank: d.today_rank,
    fiveDayRank: d.five_day_rank,
    todayNetYi: (d.today_main_net ?? 0) / 1e8,
  }));

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-center gap-3">
        <Suspense>
          <QueryTabs
            param="type"
            options={SECTOR_TYPES.map((v) => ({
              label: v.replace("资金流", ""),
              value: v,
            }))}
          />
        </Suspense>
        <div className="text-xs text-zinc-500">
          散点位置 = (5日排名, 今日排名)。<span className="text-red-400">右下</span>=持续强势，
          <span className="text-emerald-400">左上</span>=持续弱势，
          左下=新晋强势（5日弱→今日强），右上=动能衰减
        </div>
      </div>

      <section className="rounded-lg border border-zinc-800 bg-zinc-900/40 p-2">
        <RotationScatter items={items} totalSectors={total} />
      </section>
    </div>
  );
}
