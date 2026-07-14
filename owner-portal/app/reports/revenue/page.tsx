"use client";

import { useEffect, useState } from "react";
import { PortalShell } from "@/components/PortalShell";
import { DateRangePicker, DateRange } from "@/components/DateRangePicker";
import { reports } from "@/lib/api";
import { fmtMoney, fmtNumber, fmtDate, paymentMethodLabel, customerTypeLabel } from "@/lib/format";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
} from "recharts";

export default function RevenuePage() {
  const [range, setRange] = useState<DateRange>({ from: "", to: "" });
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!range.from || !range.to) return;
    setLoading(true);
    reports
      .revenue(range.from, range.to)
      .then(setData)
      .finally(() => setLoading(false));
  }, [range.from, range.to]);

  return (
    <PortalShell>
      <div className="mb-6">
        <h1 className="text-3xl font-black text-amber-300 mb-2">تقرير الدخل</h1>
        <div className="text-slate-400 text-sm">
          كل الفواتير، المدفوعات، الطرق، والفواتير المعلّقة داخل الفترة.
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
            <StatBox title="المُحصَّل" value={fmtMoney(data.totals?.collected)} tint="revenue" />
            <StatBox title="مرتجعات" value={fmtMoney(data.totals?.refunded)} tint="expenses" />
            <StatBox title="صافي المُحصَّل" value={fmtMoney(data.totals?.net)} tint="profit" />
            <StatBox
              title="فواتير معلّقة"
              value={fmtMoney(data.totals?.outstandingInvoices)}
              tint="neutral"
              sub={`${fmtNumber(data.counts?.unpaidInvoices)} فاتورة`}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div className="op-panel">
              <div className="text-sm text-slate-400 mb-3">دخل الجلسات</div>
              <div className="op-card-value">{fmtMoney(data.totals?.sessionCharges)}</div>
              <div className="op-card-sub mt-1">من إغلاق جلسات الفترة</div>
            </div>
            <div className="op-panel">
              <div className="text-sm text-slate-400 mb-3">مبيعات البار</div>
              <div className="op-card-value">{fmtMoney(data.totals?.barOrders)}</div>
              <div className="op-card-sub mt-1">من طلبات مُسلَّمة داخل الفترة</div>
            </div>
          </div>

          {/* Trend chart */}
          <div className="op-panel mb-6">
            <div className="text-sm font-bold mb-4">اتجاه الدخل اليومي</div>
            <div style={{ height: 280 }}>
              <ResponsiveContainer>
                <LineChart data={data.dailyTrend}>
                  <CartesianGrid stroke="#233" strokeDasharray="3 3" />
                  <XAxis dataKey="day" tick={{ fill: "#94a3b8", fontSize: 11 }} />
                  <YAxis tick={{ fill: "#94a3b8", fontSize: 11 }} />
                  <Tooltip
                    contentStyle={{
                      background: "#111827",
                      border: "1px solid #2a3854",
                      borderRadius: 8,
                    }}
                    labelStyle={{ color: "#f1f5f9" }}
                  />
                  <Line type="monotone" dataKey="revenue" stroke="#34d399" strokeWidth={2.5} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Payment methods breakdown */}
          <div className="op-panel mb-6">
            <div className="text-sm font-bold mb-4">توزيع الدخل حسب طريقة الدفع</div>
            <div style={{ height: 240 }}>
              <ResponsiveContainer>
                <BarChart data={data.byMethod.map((m: any) => ({ ...m, methodLabel: paymentMethodLabel(m.method) }))}>
                  <CartesianGrid stroke="#233" strokeDasharray="3 3" />
                  <XAxis dataKey="methodLabel" tick={{ fill: "#94a3b8", fontSize: 12 }} />
                  <YAxis tick={{ fill: "#94a3b8", fontSize: 11 }} />
                  <Tooltip
                    contentStyle={{
                      background: "#111827",
                      border: "1px solid #2a3854",
                      borderRadius: 8,
                    }}
                    labelStyle={{ color: "#f1f5f9" }}
                  />
                  <Bar dataKey="total" fill="#d4af37" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Unpaid invoices */}
          {data.unpaidInvoices?.length > 0 && (
            <div className="op-panel mb-6">
              <div className="text-sm font-bold mb-4">فواتير معلّقة ({data.unpaidInvoices.length})</div>
              <div className="overflow-x-auto">
                <table className="op-table">
                  <thead>
                    <tr>
                      <th>رقم الفاتورة</th>
                      <th>العميل</th>
                      <th>الإجمالي</th>
                      <th>المدفوع</th>
                      <th>المتبقي</th>
                      <th>الحالة</th>
                      <th>التاريخ</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.unpaidInvoices.map((i: any) => (
                      <tr key={i.id}>
                        <td className="font-mono text-xs">{i.invoiceNumber}</td>
                        <td>{i.customerName || "—"}</td>
                        <td>{fmtMoney(i.totalAmount)}</td>
                        <td>{fmtMoney(i.amountPaid)}</td>
                        <td className="font-bold">{fmtMoney(i.remainingAmount)}</td>
                        <td>
                          <span className={`op-badge ${i.paymentStatus === "partially_paid" ? "partial" : "unpaid"}`}>
                            {i.paymentStatus === "partially_paid" ? "جزئي" : "غير مدفوع"}
                          </span>
                        </td>
                        <td className="text-xs">{fmtDate(i.issuedAt)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Recent payments */}
          <div className="op-panel">
            <div className="text-sm font-bold mb-4">أحدث ١٠٠ عملية دفع</div>
            <div className="overflow-x-auto">
              <table className="op-table">
                <thead>
                  <tr>
                    <th>التاريخ</th>
                    <th>رقم الفاتورة</th>
                    <th>العميل</th>
                    <th>الطريقة</th>
                    <th>المبلغ</th>
                  </tr>
                </thead>
                <tbody>
                  {data.payments.map((p: any) => (
                    <tr key={p.id}>
                      <td className="text-xs">{fmtDate(p.paidAt)}</td>
                      <td className="font-mono text-xs">{p.invoiceNumber || "—"}</td>
                      <td>
                        {p.customerName || "—"}{" "}
                        {p.customerType && (
                          <span className="text-xs text-slate-500">({customerTypeLabel(p.customerType)})</span>
                        )}
                      </td>
                      <td>{paymentMethodLabel(p.method)}</td>
                      <td className={p.amount < 0 ? "text-rose-400 font-bold" : "text-emerald-400 font-bold"}>
                        {fmtMoney(p.amount)}
                      </td>
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

function StatBox({
  title,
  value,
  sub,
  tint,
}: {
  title: string;
  value: string;
  sub?: string;
  tint: "revenue" | "expenses" | "profit" | "neutral";
}) {
  const color =
    tint === "revenue" ? "text-emerald-400" : tint === "expenses" ? "text-rose-400" : tint === "profit" ? "text-amber-300" : "text-slate-300";
  return (
    <div className="op-panel">
      <div className="op-card-title">{title}</div>
      <div className={`op-card-value ${color}`}>{value}</div>
      {sub && <div className="op-card-sub">{sub}</div>}
    </div>
  );
}
