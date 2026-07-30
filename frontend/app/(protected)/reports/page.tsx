"use client";

import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  Wallet,
  Download,
  Printer,
  RefreshCw,
  Package,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
  Coffee,
  Receipt,
  Banknote,
  ChevronRight,
  ChevronLeft,
  CalendarDays,
} from "lucide-react";
import * as XLSX from "@e965/xlsx";
import { api } from "../../../lib/api";
import { money } from "../../../lib/format";
import { translateProductCategory, translateProductName } from "../../../lib/labels";
import { SectionTitle, CardSkeleton, Panel, Btn, Alert, EmptyState } from "../../../components/ui";
import clsx from "clsx";

type Period = "daily" | "weekly" | "monthly";

interface Analytics {
  period: Period;
  label: string;
  range: { start: string; end: string };
  current: { revenue: number; expenses: number; net: number; paymentsCount: number };
  previous: { revenue: number; expenses: number; net: number; paymentsCount: number };
  changes: { revenue: number | null; expenses: number | null; net: number | null };
  dailyTrend: { day: string; revenue: number; expenses: number; net: number }[];
  topProducts: { productName: string; quantity: number; revenue: number }[];
  topCategories: { category: string; quantity: number; revenue: number }[];
  expenseBreakdown: { categoryName: string; total: number }[];
}

const PERIOD_LABELS: Record<Period, string> = {
  daily: "يومي",
  weekly: "أسبوعي",
  monthly: "شهري",
};

// سهم التغيّر مقابل الفترة السابقة
function ChangeChip({ change, invert = false }: { change: number | null; invert?: boolean }) {
  if (change === null) {
    return <span className="text-[10px] font-bold text-slate-400">—</span>;
  }
  // للإيراد: الزيادة كويسة. للمصروف: الزيادة وحشة (invert=true)
  const good = invert ? change < 0 : change > 0;
  const flat = change === 0;
  const Icon = flat ? Minus : change > 0 ? ArrowUpRight : ArrowDownRight;
  return (
    <span
      className={clsx(
        "inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-[10px] font-black",
        flat ? "bg-slate-100 text-slate-500" : good ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-700",
      )}
    >
      <Icon size={10} />
      {Math.abs(change)}%
    </span>
  );
}

function shortDay(dayKey: string) {
  // dayKey = YYYY-MM-DD → نعرض اليوم/الشهر
  const parts = dayKey.split("-");
  return `${parts[2]}/${parts[1]}`;
}

function toDateInput(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export default function ReportsPage() {
  const [period, setPeriod] = useState<Period>("monthly");
  // التاريخ المرجعي للفترة. فاضي = النهاردة
  const [refDate, setRefDate] = useState<string>("");

  const analyticsQuery = useQuery({
    queryKey: ["reports", "analytics", period, refDate],
    placeholderData: (prev) => prev, // مايومضش عند التنقّل بين الفترات
    queryFn: async () => {
      const r = await api.get("/dashboards/analytics", {
        params: { period, date: refDate || undefined },
      });
      return r.data.data as Analytics;
    },
  });

  // التنقّل السريع للخلف/الأمام حسب الفترة المختارة
  function shiftPeriod(direction: -1 | 1) {
    const base = refDate ? new Date(refDate) : new Date();
    if (period === "monthly") base.setMonth(base.getMonth() + direction);
    else if (period === "weekly") base.setDate(base.getDate() + direction * 7);
    else base.setDate(base.getDate() + direction);
    setRefDate(toDateInput(base));
  }

  const isToday = !refDate;
  // نمنع التنقّل للمستقبل
  const canGoNext = !isToday;

  const data = analyticsQuery.data;

  const maxTrend = useMemo(() => {
    if (!data) return 1;
    return Math.max(
      1,
      ...data.dailyTrend.map((d) => Math.max(d.revenue, d.expenses)),
    );
  }, [data]);

  function exportExcel() {
    if (!data) return;
    const wb = XLSX.utils.book_new();

    // ورقة الملخص
    const summary = [
      ["تقرير", PERIOD_LABELS[period], data.label],
      [],
      ["البند", "الفترة الحالية", "الفترة السابقة", "التغيّر %"],
      ["الإيرادات", data.current.revenue, data.previous.revenue, data.changes.revenue ?? "—"],
      ["المصروفات", data.current.expenses, data.previous.expenses, data.changes.expenses ?? "—"],
      ["الصافي", data.current.net, data.previous.net, data.changes.net ?? "—"],
      ["عدد المدفوعات", data.current.paymentsCount, data.previous.paymentsCount, ""],
    ];
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(summary), "الملخص");

    // ورقة الاتجاه اليومي
    const trend = [["اليوم", "الإيرادات", "المصروفات", "الصافي"],
      ...data.dailyTrend.map((d) => [d.day, d.revenue, d.expenses, d.net])];
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(trend), "الاتجاه اليومي");

    // ورقة المنتجات
    const products = [["المنتج", "الكمية", "الإيراد"],
      ...data.topProducts.map((p) => [translateProductName(p.productName), p.quantity, p.revenue])];
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(products), "أكثر المنتجات");

    // ورقة التصنيفات
    const cats = [["التصنيف", "الكمية", "الإيراد"],
      ...data.topCategories.map((c) => [translateProductCategory(c.category), c.quantity, c.revenue])];
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(cats), "التصنيفات");

    XLSX.writeFile(wb, `تقرير-${PERIOD_LABELS[period]}-${data.label}.xlsx`);
  }

  const revenueMax = data ? Math.max(...data.topProducts.map((p) => p.revenue), 1) : 1;
  const catMax = data ? Math.max(...data.topCategories.map((c) => c.revenue), 1) : 1;

  return (
    <div className="space-y-6" dir="rtl">
      <SectionTitle
        title="التقارير المالية"
        subtitle="نظرة شاملة على الإيرادات والمصروفات والأرباح — يومي وأسبوعي وشهري مع المقارنة."
        icon={<BarChart3 size={20} />}
        action={
          <div className="flex flex-wrap items-center gap-2 no-print">
            <Btn size="sm" variant="secondary" icon={<RefreshCw size={12} />} onClick={() => analyticsQuery.refetch()}>
              تحديث
            </Btn>
            <Btn size="sm" variant="secondary" icon={<Download size={12} />} onClick={exportExcel} disabled={!data}>
              تصدير Excel
            </Btn>
            <Btn size="sm" icon={<Printer size={12} />} onClick={() => window.print()} disabled={!data}>
              طباعة
            </Btn>
          </div>
        }
      />

      {/* منتقي الفترة — أزرار النوع + تنقّل سريع */}
      <div className="flex flex-wrap items-center justify-between gap-3 no-print">
        <div className="flex rounded-2xl border border-slate-200 bg-white p-1 shadow-sm">
          {(Object.keys(PERIOD_LABELS) as Period[]).map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={clsx(
                "rounded-xl px-4 py-2 text-xs font-black transition-all",
                period === p ? "bg-slate-900 text-white shadow" : "text-slate-500 hover:bg-slate-50",
              )}
            >
              {PERIOD_LABELS[p]}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-1.5">
          {/* السابق */}
          <button
            onClick={() => shiftPeriod(-1)}
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 shadow-sm hover:bg-slate-50 transition"
            title="الفترة السابقة"
          >
            <ChevronRight size={16} />
          </button>
          {/* زر النهاردة */}
          <button
            onClick={() => setRefDate("")}
            disabled={isToday}
            className={clsx(
              "flex items-center gap-1.5 rounded-xl border px-3 py-2 text-xs font-black shadow-sm transition",
              isToday
                ? "border-slate-900 bg-slate-900 text-white cursor-default"
                : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50",
            )}
            title="ارجع للفترة الحالية"
          >
            <CalendarDays size={13} />
            {period === "monthly" ? "الشهر الحالي" : period === "weekly" ? "الأسبوع الحالي" : "النهاردة"}
          </button>
          {/* التالي */}
          <button
            onClick={() => canGoNext && shiftPeriod(1)}
            disabled={!canGoNext}
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 shadow-sm hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition"
            title="الفترة التالية"
          >
            <ChevronLeft size={16} />
          </button>
        </div>
      </div>

      {/* عنوان الفترة */}
      {data && (
        <div className="flex items-center justify-between rounded-2xl bg-slate-900 px-5 py-3 text-white">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">فترة التقرير</p>
            <p className="text-lg font-black">{data.label}</p>
          </div>
          {analyticsQuery.isFetching && (
            <RefreshCw size={16} className="animate-spin text-slate-400" />
          )}
        </div>
      )}

      {analyticsQuery.isLoading ? (
        <div className="grid gap-3 sm:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => <CardSkeleton key={i} />)}
        </div>
      ) : analyticsQuery.isError ? (
        <Alert tone="danger">تعذّر تحميل التقرير. حاول تحديث الصفحة.</Alert>
      ) : !data ? null : (
        <>
          {/* الكروت الرئيسية */}
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-2xl border border-emerald-100 bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600"><Banknote size={18} /></span>
                <ChangeChip change={data.changes.revenue} />
              </div>
              <p className="mt-3 text-[11px] font-black uppercase tracking-widest text-slate-400">الإيرادات</p>
              <p className="text-2xl font-black text-slate-900 tabular-nums">{money(data.current.revenue)}</p>
              <p className="mt-1 text-[10px] font-bold text-slate-400">السابق: {money(data.previous.revenue)}</p>
            </div>

            <div className="rounded-2xl border border-rose-100 bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-rose-50 text-rose-600"><Wallet size={18} /></span>
                <ChangeChip change={data.changes.expenses} invert />
              </div>
              <p className="mt-3 text-[11px] font-black uppercase tracking-widest text-slate-400">المصروفات</p>
              <p className="text-2xl font-black text-slate-900 tabular-nums">{money(data.current.expenses)}</p>
              <p className="mt-1 text-[10px] font-bold text-slate-400">السابق: {money(data.previous.expenses)}</p>
            </div>

            <div className={clsx("rounded-2xl border p-5 shadow-sm", data.current.net >= 0 ? "border-slate-900 bg-slate-900 text-white" : "border-rose-300 bg-rose-50")}>
              <div className="flex items-center justify-between">
                <span className={clsx("flex h-9 w-9 items-center justify-center rounded-xl", data.current.net >= 0 ? "bg-white/10 text-white" : "bg-rose-100 text-rose-600")}>
                  {data.current.net >= 0 ? <TrendingUp size={18} /> : <TrendingDown size={18} />}
                </span>
                <ChangeChip change={data.changes.net} />
              </div>
              <p className={clsx("mt-3 text-[11px] font-black uppercase tracking-widest", data.current.net >= 0 ? "text-slate-400" : "text-rose-400")}>صافي الربح</p>
              <p className="text-2xl font-black tabular-nums">{money(data.current.net)}</p>
              <p className={clsx("mt-1 text-[10px] font-bold", data.current.net >= 0 ? "text-slate-400" : "text-rose-400")}>السابق: {money(data.previous.net)}</p>
            </div>
          </div>

          {/* الاتجاه اليومي — أعمدة */}
          <Panel title="الاتجاه اليومي" icon={<BarChart3 size={15} />}>
            {data.dailyTrend.length === 0 ? (
              <EmptyState title="لا توجد بيانات" sub="لا توجد حركة مالية في هذه الفترة." />
            ) : (
              <div className="space-y-3">
                <div className="flex items-end gap-1 overflow-x-auto pb-2" style={{ minHeight: 160 }}>
                  {data.dailyTrend.map((d) => (
                    <div key={d.day} className="flex min-w-[26px] flex-1 flex-col items-center gap-1">
                      <div className="flex h-32 w-full items-end justify-center gap-0.5">
                        <div
                          className="w-1/2 rounded-t bg-emerald-500"
                          style={{ height: `${(d.revenue / maxTrend) * 100}%` }}
                          title={`إيراد: ${money(d.revenue)}`}
                        />
                        <div
                          className="w-1/2 rounded-t bg-rose-400"
                          style={{ height: `${(d.expenses / maxTrend) * 100}%` }}
                          title={`مصروف: ${money(d.expenses)}`}
                        />
                      </div>
                      <span className="text-[8px] font-bold text-slate-400 whitespace-nowrap">{shortDay(d.day)}</span>
                    </div>
                  ))}
                </div>
                <div className="flex items-center gap-4 text-[10px] font-bold">
                  <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-sm bg-emerald-500" /> إيرادات</span>
                  <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-sm bg-rose-400" /> مصروفات</span>
                </div>
              </div>
            )}
          </Panel>

          {/* المنتجات والتصنيفات */}
          <div className="grid gap-6 lg:grid-cols-2">
            <Panel title="أكثر المنتجات مبيعاً" icon={<Coffee size={15} />}>
              {data.topProducts.length === 0 ? (
                <EmptyState title="لا توجد مبيعات" sub="لم تُسلَّم طلبات في هذه الفترة." />
              ) : (
                <div className="space-y-2.5">
                  {data.topProducts.map((p, i) => (
                    <div key={i} className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-slate-700">{i + 1}. {translateProductName(p.productName)}</span>
                        <span className="font-black text-slate-900 tabular-nums">{money(p.revenue)} <span className="text-[10px] font-bold text-slate-400">({p.quantity})</span></span>
                      </div>
                      <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
                        <div className="h-full rounded-full bg-amber-500" style={{ width: `${(p.revenue / revenueMax) * 100}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Panel>

            <Panel title="المبيعات حسب التصنيف" icon={<Package size={15} />}>
              {data.topCategories.length === 0 ? (
                <EmptyState title="لا توجد مبيعات" sub="لم تُسلَّم طلبات في هذه الفترة." />
              ) : (
                <div className="space-y-2.5">
                  {data.topCategories.map((c, i) => (
                    <div key={i} className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-slate-700">{translateProductCategory(c.category)}</span>
                        <span className="font-black text-slate-900 tabular-nums">{money(c.revenue)} <span className="text-[10px] font-bold text-slate-400">({c.quantity})</span></span>
                      </div>
                      <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
                        <div className="h-full rounded-full bg-blue-500" style={{ width: `${(c.revenue / catMax) * 100}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Panel>
          </div>

          {/* تفصيل المصروفات */}
          <Panel title="تفصيل المصروفات حسب التصنيف" icon={<Receipt size={15} />}>
            {data.expenseBreakdown.length === 0 ? (
              <EmptyState title="لا توجد مصروفات" sub="لم تُسجَّل مصروفات في هذه الفترة." />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-right text-sm">
                  <thead>
                    <tr className="border-b border-slate-100 text-[10px] font-black uppercase text-slate-400">
                      <th className="pb-2">التصنيف</th>
                      <th className="pb-2 text-left">المبلغ</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {data.expenseBreakdown.map((e, i) => (
                      <tr key={i}>
                        <td className="py-2 font-bold text-slate-700">{e.categoryName}</td>
                        <td className="py-2 text-left font-black text-rose-600 tabular-nums">{money(e.total)}</td>
                      </tr>
                    ))}
                    <tr className="border-t-2 border-slate-200">
                      <td className="py-2 font-black text-slate-900">الإجمالي</td>
                      <td className="py-2 text-left font-black text-slate-900 tabular-nums">{money(data.current.expenses)}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            )}
          </Panel>
        </>
      )}
    </div>
  );
}
