"use client";

import { fmtPercent } from "@/lib/format";

export function ChangeIndicator({
  value,
  inverse = false,
}: {
  value: number | null;
  inverse?: boolean; // للمصروفات: الزيادة سيئة
}) {
  if (value === null || value === undefined) return <span className="text-slate-400 text-xs">—</span>;
  const isUp = value > 0;
  const isGood = inverse ? !isUp : isUp;
  const cls = isUp === false && value === 0 ? "text-slate-400" : isGood ? "op-change-up" : "op-change-down";
  const arrow = value > 0 ? "▲" : value < 0 ? "▼" : "•";
  return (
    <span className={`text-xs ${cls}`}>
      {arrow} {fmtPercent(value)}
    </span>
  );
}
