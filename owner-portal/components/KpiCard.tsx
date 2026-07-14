"use client";

import { ChangeIndicator } from "./ChangeIndicator";

export function KpiCard({
  title,
  value,
  sub,
  change,
  inverse = false,
  accent,
}: {
  title: string;
  value: string;
  sub?: string;
  change?: number | null;
  inverse?: boolean;
  accent?: "revenue" | "expenses" | "profit" | "neutral";
}) {
  const accentBar =
    accent === "revenue"
      ? "bg-emerald-500"
      : accent === "expenses"
      ? "bg-rose-500"
      : accent === "profit"
      ? "bg-amber-400"
      : "bg-slate-500";

  return (
    <div className="op-card relative overflow-hidden">
      <div className={`absolute right-0 top-0 h-full w-1 ${accentBar} opacity-70`} />
      <div className="op-card-title">{title}</div>
      <div className="op-card-value">{value}</div>
      <div className="flex items-center justify-between mt-2">
        {sub && <div className="op-card-sub">{sub}</div>}
        {change !== undefined && <ChangeIndicator value={change ?? null} inverse={inverse} />}
      </div>
    </div>
  );
}
