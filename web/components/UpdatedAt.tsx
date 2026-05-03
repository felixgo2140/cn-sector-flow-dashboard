"use client";

import { useEffect, useState } from "react";

function relative(ts: string): string {
  if (!ts) return "—";
  const t = new Date(ts).getTime();
  if (Number.isNaN(t)) return ts;
  const diff = Date.now() - t;
  const sec = Math.floor(diff / 1000);
  if (sec < 60) return `${sec}s 前`;
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min} 分钟前`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr} 小时前`;
  return `${Math.floor(hr / 24)} 天前`;
}

export function UpdatedAt({ ts }: { ts: string }) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 30_000);
    return () => clearInterval(id);
  }, []);
  void now;
  const fresh = ts && Date.now() - new Date(ts).getTime() < 10 * 60 * 1000;
  return (
    <span className="inline-flex items-center gap-1.5 text-xs text-zinc-400">
      <span
        className={`w-1.5 h-1.5 rounded-full ${
          fresh ? "bg-emerald-500" : "bg-zinc-600"
        }`}
        title={fresh ? "数据较新" : "数据可能陈旧"}
      />
      <span>{relative(ts)}</span>
    </span>
  );
}
