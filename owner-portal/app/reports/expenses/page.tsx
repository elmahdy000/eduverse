"use client";

import { useEffect, useState } from "react";
import { PortalShell } from "@/components/PortalShell";
import { DateRangePicker, DateRange } from "@/components/DateRangePicker";
import { reports } from "@/lib/api";
import { fmtMoney, fmtNumber, fmtDate, paymentMethodLabel } from "@/lib/format";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";

const CATEGORY_COLORS = ["#d4af37", "#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899", "#14b8a6"];

export default function ExpensesPage() {
  const [range, setRange] = useState<DateRange>({ from: "", to: "" });
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!range.from || !range.to) return;
    let cancelled = false;
    setLoading(true);
    setError(null);
    reports
      .expenses(range.from, range.to)
      .then((d) => {
        if (!cancelled) setData(d);
      })
      .catch((e) => {
        if (!cancelled) setError(e?.message || "خطأ في تحميل البيانات");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [range.from, range.to]);

  return (
    <PortalShell>
      <div className="mb-6">
        <h1 className="text-3xl font-black text-amber-300 mb-2">تقرير المصروفات</h1>
        <div className="text-slate-400 text-sm">
          تفصيل كامل بالتصنيف، المورد، الطريقة، والرواتب/العهد.
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

      {error && (
        <div className="op-panel text-rose-300 text-sm">خطأ: {error}</div>
      )}

      {!loading && !error && data && (
        <>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
            <div className="op-panel">
              <div className="op-card-title">إجمالي المصروفات</div>
              <div className="op-card-value text-rose-400">{fmtMoney(data.totals?.total)}</div>
            </div>
            <div className="op-panel">
              <div className="op-card-title">رواتب وعهد</div>
              <div className="op-card-value">{fmtMoney(data.totals?.salariesAndAdvances)}</div>
            </div>
            <div className="op-panel">
              <div className="op-card-title">عدد القيود</div>
              <div className="op-card-value">{fmtNumber(data.totals?.entriesCount)}</div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div className="op-panel">
              <div className="text-sm font-bold mb-4">توزيع حسب التصنيف</div>
              <div style={{ height: 280 }}>
                <ResponsiveContainer>
                  <PieChart>
                    <Pie
                      data={data.byCategory}
                      dataKey="total"
                      nameKey="categoryName"
                      cx="50%"
                      cy="50%"
                      outerRadius={90}
                      label={(entry: any) => `${entry.categoryName}: ${entry.percent}%`}
                    >
                      {data.byCategory.map((_: any, i: number) => (
                        <Cell key={i} fill={CATEGORY_COLORS[i % CATEGORY_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        background: "#111827",
                        border: "1px solid #2a3854",
                        borderRadius: 8,
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="op-panel">
              <div className="text-sm font-bold mb-4">أعلى ٥ تصنيفات مصروفات</div>
              <div className="flex flex-col gap-3">
                {data.byCategory.slice(0, 5).map((c: any, i: number) => (
                  <div key={c.categoryId} className="flex items-center gap-3">
                    <div
                      style={{ width: 12, height: 12, borderRadius: 4, background: CATEGORY_COLORS[i % CATEGORY_COLORS.length] }}
                    />
                    <div className="flex-1">
                      <div className="text-sm font-semibold">{c.categoryName}</div>
                      <div className="text-xs text-slate-500">
                        {c.count} قيد • {c.percent}%
                      </div>
                    </div>
                    <div className="text-sm font-bold">{fmtMoney(c.total)}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="op-panel mb-6">
            <div className="text-sm font-bold mb-4">اتجاه المصروفات اليومي</div>
            <div style={{ height: 260 }}>
              <ResponsiveContainer>
                <BarChart data={data.dailyTrend}>
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
                  <Bar dataKey="total" fill="#ef4444" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Vendors */}
          {data.byVendor?.length > 0 && (
            <div className="op-panel mb-6">
              <div className="text-sm font-bold mb-4">أعلى الموردين</div>
              <div className="overflow-x-auto">
                <table className="op-table">
                  <thead>
                    <tr>
                      <th>المورد</th>
                      <th>عدد القيود</th>
                      <th>الإجمالي</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.byVendor.slice(0, 20).map((v: any) => (
                      <tr key={v.vendorId}>
                        <td className="font-semibold">{v.vendorName}</td>
                        <td>{fmtNumber(v.count)}</td>
                        <td className="text-rose-300 font-bold">{fmtMoney(v.total)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Entries */}
          <div className="op-panel">
            <div className="text-sm font-bold mb-4">قيود المصروفات ({data.entries.length})</div>
            <div className="overflow-x-auto">
              <table className="op-table">
                <thead>
                  <tr>
                    <th>التاريخ</th>
                    <th>الوصف</th>
                    <th>التصنيف</th>
                    <th>المورد</th>
                    <th>الطريقة</th>
                    <th>سُجّل بواسطة</th>
                    <th>المبلغ</th>
                  </tr>
                </thead>
                <tbody>
                  {data.entries.map((e: any) => (
                    <tr key={e.id}>
                      <td className="text-xs">{fmtDate(e.date)}</td>
                      <td>{e.description}</td>
                      <td>{e.categoryName || "—"}</td>
                      <td>{e.vendorName || "—"}</td>
                      <td>{paymentMethodLabel(e.paymentMethod)}</td>
                      <td className="text-xs">{e.recordedBy || "—"}</td>
                      <td className="text-rose-300 font-bold">{fmtMoney(e.amount)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </PortalShell>
  );
}
