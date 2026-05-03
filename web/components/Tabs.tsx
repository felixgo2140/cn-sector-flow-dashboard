"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";

export function QueryTabs({
  param,
  options,
}: {
  param: string;
  options: { label: string; value: string }[];
}) {
  const pathname = usePathname();
  const search = useSearchParams();
  const current = search.get(param) ?? options[0].value;

  return (
    <div className="inline-flex rounded-md border border-zinc-700 bg-zinc-900 p-0.5 text-sm">
      {options.map((o) => {
        const next = new URLSearchParams(search.toString());
        next.set(param, o.value);
        const active = current === o.value;
        return (
          <Link
            key={o.value}
            href={`${pathname}?${next.toString()}`}
            className={
              "rounded px-3 py-1 transition-colors " +
              (active
                ? "bg-zinc-700 text-zinc-50"
                : "text-zinc-400 hover:text-zinc-200")
            }
          >
            {o.label}
          </Link>
        );
      })}
    </div>
  );
}
