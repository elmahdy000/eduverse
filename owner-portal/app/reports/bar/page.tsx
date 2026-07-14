"use client";

import { useEffect, useState } from "react";
import { PortalShell } from "@/components/PortalShell";
import { DateRangePicker, DateRange } from "@/components/DateRangePicker";
import { reports } from "@/lib/api";
import { fmtMoney, fmtNumber, customerTypeLabel } from "@/lib/format";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
} from "recharts";

export default function BarPage() {
  const [range, setRange] = useState<DateRange>({ from: "", to: "" });
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!range.from || !range.to) return;
    setLoading(true);
    reports
      .bar(range.from, range.to)
      .then(setData)
      .finally(() => setLoading(false));
  }, [range.from, range.to]);

  return (
    <PortalShell>
      <div className="mb-6">
        <h1 className="text-3xl font-black text-amber-300 mb-2">تفاصيل البار</h1>
        <div className="text-slate-400 text-sm">
          مبيعات البار، هامش الربح، أعلى المنتجات والتصنيفات، وتوزيع حسب نوع العميل.
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
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="op-panel">
              <div className="op-card-title">دخل البار</div>
              <div className="op-card-value text-emerald-400">{fmtMoney(data.totals?.revenue)}</div>
            </div>
            <div className="op-panel">
              <div className="op-card-title">تكلفة (مقدَّرة)</div>
              <div className="op-card-value text-rose-400">{fmtMoney(data.totals?.cost)}</div>
            </div>
            <div className="op-panel">
              <div className="op-card-title">إجمالي الربح</div>
              <div className="op-card-value text-amber-300">{fmtMoney(data.totals?.grossProfit)}</div>
              {data.totals?.grossMargin !== null && (
                <div className="op-card-sub">هامش {data.totals.grossMargin}%</div>
              )}
            </div>
            <div className="op-panel">
              <div className="op-card-title">أصناف مباعة</div>
              <div className="op-card-value">{fmtNumber(data.totals?.itemsSold)}</div>
            </div>
          </div>

          <div className="op-panel mb-6">
            <div className="text-sm font-bold mb-4">اتجاه المبيعات اليومي</div>
            <div style={{ height: 280 }}>
              <ResponsiveContainer>
                <LineChart data={data.dailyTrend}>
                  <CartesianGrid stroke="#233" strokeDasharray="3 3" />
                  <XAxis dataKey="day" tick={{ fill: "#94a3b8", fontSize: 11 }} />
                  <YAxis yAxisId="l" tick={{ fill: "#94a3b8", fontSize: 11 }} />
                  <YAxis yAxisId="r" orientation="left" tick={{ fill: "#94a3b8", fontSize: 11 }} />
                  <Tooltip
                    contentStyle={{
                      background: "#111827",
                      border: "1px solid #2a3854",
                      borderRadius: 8,
                    }}
                  />
                  <Line yAxisId="l" dataKey="revenue" name="دخل" stroke="#34d399" strokeWidth={2.5} />
                  <Line yAxisId="r" dataKey="quantity" name="كمية" stroke="#d4af37" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            {/* Top categories */}
            <div className="op-panel">
              <div className="text-sm font-bold mb-4">أعلى التصنيفات</div>
              <div style={{ height: 260 }}>
                <ResponsiveContainer>
                  <BarChart data={data.categories.slice(0, 8)} layout="vertical">
                    <CartesianGrid stroke="#233" strokeDasharray="3 3" />
                    <XAxis type="number" tick={{ fill: "#94a3b8", fontSize: 11 }} />
                    <YAxis
                      type="category"
                      dataKey="category"
                      tick={{ fill: "#94a3b8", fontSize: 11 }}
                      width={90}
                    />
                    <Tooltip
                      contentStyle={{
                        background: "#111827",
                        border: "1px solid #2a3854",
                        borderRadius: 8,
                      }}
                    />
                    <Bar dataKey="revenue" fill="#d4af37" radius={[0, 6, 6, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Customer type breakdown */}
            <div className="op-panel">
              <div className="text-sm font-bold mb-4">حسب نوع العميل</div>
              <table className="op-table">
                <thead>
                  <tr>
                    <th>نوع العميل</th>
                    <th>عدد الأوردرات</th>
                    <th>الدخل</th>
                  </tr>
                </thead>
                <tbody>
                  {data.byCustomerType.map((t: any) => (
                    <tr key={t.type}>
                      <td className="font-semibold">{customerTypeLabel(t.type)}</td>
                      <td>{fmtNumber(t.ordersCount)}</td>
                      <td className="text-emerald-300 font-bold">{fmtMoney(t.revenue)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Products table */}
          <div className="op-panel">
            <div className="text-sm font-bold mb-4">تفاصيل المنتجات ({data.products.length})</div>
            <div className="overflow-x-auto">
              <table className="op-table">
                <thead>
                  <tr>
                    <th>المنتج</th>
                    <th>التصنيف</th>
                    <th>الكمية</th>
                    <th>الدخل</th>
                    <th>التكلفة</th>
                    <th>الربح</th>
                  </tr>
                </thead>
                <tbody>
                  {data.products.map((p: any) => (
                    <tr key={p.productId}>
                      <td className="font-semibold">{p.productName}</td>
                      <td className="text-xs text-slate-400">{p.category}</td>
                      <td>{fmtNumber(p.quantity)}</td>
                      <td className="text-emerald-300 font-bold">{fmtMoney(p.revenue)}</td>
                      <td className="text-rose-300">{fmtMoney(p.cost)}</td>
                      <td className="text-amber-300 font-bold">{fmtMoney(p.profit)}</td>
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
