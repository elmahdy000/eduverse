"use client";

import { useEffect, useState } from "react";
import { PortalShell } from "@/components/PortalShell";
import { KpiCard } from "@/components/KpiCard";
import { DateRangePicker, DateRange } from "@/components/DateRangePicker";
import { reports } from "@/lib/api";
import { fmtMoney, fmtNumber, fmtDate } from "@/lib/format";

export default function DashboardPage() {
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
      .kpis(range.from, range.to)
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
        <h1 className="text-3xl font-black text-amber-300 mb-2">لوحة KPI</h1>
        <div className="text-slate-400 text-sm">
          نظرة سريعة على المؤشرات المالية والتشغيلية لفترة مختارة، ومقارنتها بالفترة السابقة.
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

      {!loading && data && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <KpiCard
              title="الدخل"
              value={fmtMoney(data.revenue?.value)}
              sub={`${fmtNumber(data.revenue?.transactionsCount)} عملية دفع`}
              change={data.revenue?.change}
              accent="revenue"
            />
            <KpiCard
              title="المصروفات"
              value={fmtMoney(data.expenses?.value)}
              sub={`${fmtNumber(data.expenses?.entriesCount)} قيد مصروف`}
              change={data.expenses?.change}
              inverse
              accent="expenses"
            />
            <KpiCard
              title="صافي الربح"
              value={fmtMoney(data.netProfit?.value)}
              sub={
                data.netProfit?.margin !== null
                  ? `هامش ${data.netProfit.margin}%`
                  : "—"
              }
              change={data.netProfit?.change}
              accent="profit"
            />
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="op-panel">
              <div className="op-card-title">فواتير الفترة</div>
              <div className="op-card-value">{fmtNumber(data.counts?.invoices)}</div>
            </div>
            <div className="op-panel">
              <div className="op-card-title">جلسات مغلقة</div>
              <div className="op-card-value">{fmtNumber(data.counts?.sessionsClosed)}</div>
            </div>
            <div className="op-panel">
              <div className="op-card-title">طلبات بار مُسلَّمة</div>
              <div className="op-card-value">{fmtNumber(data.counts?.barOrdersDelivered)}</div>
            </div>
            <div className="op-panel">
              <div className="op-card-title">عملاء جدد</div>
              <div className="op-card-value">{fmtNumber(data.counts?.newCustomers)}</div>
            </div>
          </div>

          <div className="op-panel">
            <div className="text-sm text-slate-400 mb-3">تفاصيل الفترة</div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-slate-500">من: </span>
                <span className="font-semibold">{fmtDate(data.range?.start)}</span>
              </div>
              <div>
                <span className="text-slate-500">إلى: </span>
                <span className="font-semibold">{fmtDate(data.range?.end)}</span>
              </div>
              <div>
                <span className="text-slate-500">دخل الفترة السابقة: </span>
                <span className="font-semibold">{fmtMoney(data.revenue?.previous)}</span>
              </div>
              <div>
                <span className="text-slate-500">مصروفات الفترة السابقة: </span>
                <span className="font-semibold">{fmtMoney(data.expenses?.previous)}</span>
              </div>
              <div>
                <span className="text-slate-500">صافي ربح الفترة السابقة: </span>
                <span className="font-semibold">{fmtMoney(data.netProfit?.previous)}</span>
              </div>
            </div>
          </div>
        </>
      )}
    </PortalShell>
  );
}
