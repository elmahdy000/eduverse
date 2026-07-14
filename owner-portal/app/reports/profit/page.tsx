"use client";

import { useEffect, useState } from "react";
import { PortalShell } from "@/components/PortalShell";
import { DateRangePicker, DateRange } from "@/components/DateRangePicker";
import { ChangeIndicator } from "@/components/ChangeIndicator";
import { reports } from "@/lib/api";
import { fmtMoney } from "@/lib/format";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  Line,
  ComposedChart,
} from "recharts";

export default function ProfitPage() {
  const [range, setRange] = useState<DateRange>({ from: "", to: "" });
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!range.from || !range.to) return;
    setLoading(true);
    reports
      .profit(range.from, range.to)
      .then(setData)
      .finally(() => setLoading(false));
  }, [range.from, range.to]);

  return (
    <PortalShell>
      <div className="mb-6">
        <h1 className="text-3xl font-black text-amber-300 mb-2">صافي الربح</h1>
        <div className="text-slate-400 text-sm">
          دخل − مصروفات، مع مقارنة كاملة بالفترة السابقة.
        </div>
      </div>

      <div className="op-panel mb-6">
        <DateRangePicker value={range} onChange={setRange} />
      </div>

      {loading && (
        <div className="flex items-center justify-center py-16">
          <div className="op-spinner" />
        </div>
      )}

      {!loading && data && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <MetricCard
              title="الدخل"
              current={data.current?.revenue}
              previous={data.previous?.revenue}
              change={data.changes?.revenue}
              color="text-emerald-400"
            />
            <MetricCard
              title="المصروفات"
              current={data.current?.expenses}
              previous={data.previous?.expenses}
              change={data.changes?.expenses}
              color="text-rose-400"
              inverse
            />
            <MetricCard
              title="صافي الربح"
              current={data.current?.net}
              previous={data.previous?.net}
              change={data.changes?.net}
              color="text-amber-300"
              extra={data.current?.margin !== null ? `هامش ${data.current.margin}%` : undefined}
            />
          </div>

          <div className="op-panel mb-6">
            <div className="text-sm font-bold mb-4">اتجاه يومي: الدخل، المصروفات، وصافي الربح</div>
            <div style={{ height: 320 }}>
              <ResponsiveContainer>
                <ComposedChart data={data.dailyTrend}>
                  <CartesianGrid stroke="#233" strokeDasharray="3 3" />
                  <XAxis dataKey="day" tick={{ fill: "#94a3b8", fontSize: 11 }} />
                  <YAxis tick={{ fill: "#94a3b8", fontSize: 11 }} />
                  <Tooltip
                    contentStyle={{
                      background: "#111827",
                      border: "1px solid #2a3854",
                      borderRadius: 8,
                    }}
                  />
                  <Legend />
                  <Bar dataKey="revenue" name="دخل" fill="#10b981" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="expenses" name="مصروفات" fill="#ef4444" radius={[4, 4, 0, 0]} />
                  <Line type="monotone" dataKey="net" name="صافي" stroke="#d4af37" strokeWidth={2.5} />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="op-panel">
              <div className="text-sm font-bold mb-4">تفاصيل الفترة الحالية</div>
              <RowLine label="الدخل" value={fmtMoney(data.current?.revenue)} />
              <RowLine label="المصروفات" value={fmtMoney(data.current?.expenses)} />
              <RowLine label="صافي الربح" value={fmtMoney(data.current?.net)} bold />
              {data.current?.margin !== null && (
                <RowLine label="هامش الربح" value={`${data.current.margin}%`} />
              )}
            </div>
            <div className="op-panel">
              <div className="text-sm font-bold mb-4">تفاصيل الفترة السابقة (للمقارنة)</div>
              <RowLine label="الدخل" value={fmtMoney(data.previous?.revenue)} />
              <RowLine label="المصروفات" value={fmtMoney(data.previous?.expenses)} />
              <RowLine label="صافي الربح" value={fmtMoney(data.previous?.net)} bold />
            </div>
          </div>
        </>
      )}
    </PortalShell>
  );
}

function MetricCard({
  title,
  current,
  previous,
  change,
  color,
  inverse,
  extra,
}: {
  title: string;
  current: number;
  previous: number;
  change: number | null;
  color: string;
  inverse?: boolean;
  extra?: string;
}) {
  return (
    <div className="op-panel">
      <div className="op-card-title">{title}</div>
      <div className={`op-card-value ${color}`}>{fmtMoney(current)}</div>
      <div className="flex items-center justify-between mt-2">
        <div className="op-card-sub">سابقاً: {fmtMoney(previous)}</div>
        <ChangeIndicator value={change} inverse={inverse} />
      </div>
      {extra && <div className="op-card-sub mt-1">{extra}</div>}
    </div>
  );
}

function RowLine({ label, value, bold }: { label: string; value: string; bold?: boolean }) {
  return (
    <div className="flex items-center justify-between py-2 border-b border-slate-800/50">
      <div className="text-sm text-slate-400">{label}</div>
      <div className={`text-sm ${bold ? "font-black text-amber-300" : "font-semibold"}`}>{value}</div>
    </div>
  );
}
