"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Download,
  PieChart as PieChartIcon,
  Timer,
  AlertTriangle,
  RefreshCw,
  Trash2,
  Package,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
  CalendarDays,
  CheckCircle2,
  XCircle,
  UserX,
  Activity,
} from "lucide-react";
import { api } from "../../../lib/api";
import { money } from "../../../lib/format";
import { SectionTitle } from "../../../components/ui";
import clsx from "clsx";

interface FinancialSummary {
  revenueTotal: number;
  expensesTotal: number;
  netProfit: number;
  breakdown?: { categoryId: string; categoryName: string; total: number }[];
}

interface ShiftsSummary {
  closedCount: number;
  openCount: number;
  totalSales: number;
  totalExpenses: number;
  netSales: number;
  avgSalesPerShift: number;
  totalVariance: number;
  recentShifts: {
    id: string;
    startTime: string;
    endTime: string | null;
    cashier: string;
    totalSales: number;
    totalExpenses: number;
    netSales: number;
    variance: number | null;
  }[];
}

interface WasteSummary {
  totalEntries: number;
  totalQuantity: number;
  totalEstimatedCost: number;
  topWastedItems: {
    itemId: string;
    name: string;
    unit: string;
    totalQuantity: number;
    estimatedCost: number | null;
    entryCount: number;
  }[];
}

interface BookingSummary {
  totalCount: number;
  confirmedCount: number;
  completedCount: number;
  cancelledCount: number;
  noShowCount: number;
  totalRevenue: number;
  potentialLoss: number;
}

function VarianceIndicator({ value }: { value: number | null }) {
  if (value === null) return <span className="text-slate-300">—</span>;
  const abs = Math.round(Math.abs(value)).toLocaleString("ar-EG");
  if (value === 0) return <span className="text-slate-400 font-medium">0</span>;
  if (value > 0) return <span className="text-emerald-500 font-bold">+{abs}</span>;
  return <span className="text-rose-500 font-bold">-{abs}</span>;
}

export default function ReportsPage() {
  const today = new Date().toISOString().split("T")[0];
  const weekAgo = new Date(Date.now() - 7 * 86400000).toISOString().split("T")[0];

  const [dateRange, setDateRange] = useState({ from: weekAgo, to: today });

  const financialQuery = useQuery({
    queryKey: ["reports", "financial", dateRange.from, dateRange.to],
    queryFn: async () => {
      const r = await api.get("/expenses/financial-summary", {
        params: { fromDate: dateRange.from, toDate: dateRange.to },
      });
      return r.data as FinancialSummary;
    },
  });

  const shiftsQuery = useQuery({
    queryKey: ["reports", "shifts", dateRange.from, dateRange.to],
    queryFn: async () => {
      const r = await api.get("/shifts/summary", {
        params: { fromDate: dateRange.from, toDate: dateRange.to },
      });
      return r.data as ShiftsSummary;
    },
  });

  const wasteQuery = useQuery({
    queryKey: ["reports", "waste", dateRange.from, dateRange.to],
    queryFn: async () => {
      const r = await api.get("/inventory/waste-summary", {
        params: { fromDate: dateRange.from, toDate: dateRange.to },
      });
      return r.data as WasteSummary;
    },
  });

  const [selectedStatus, setSelectedStatus] = useState<string | null>(null);

  const bookingsSummaryQuery = useQuery({
    queryKey: ["reports", "bookings", dateRange.from, dateRange.to],
    queryFn: async () => {
      const r = await api.get("/bookings/summary", {
        params: { fromDate: dateRange.from, toDate: dateRange.to },
      });
      return r.data.data as BookingSummary;
    },
  });

  const detailedBookingsQuery = useQuery({
    queryKey: ["reports", "bookings-detail", dateRange.from, dateRange.to, selectedStatus],
    queryFn: async () => {
      if (!selectedStatus) return null;
      const r = await api.get("/bookings", {
        params: { 
          fromDate: dateRange.from, 
          toDate: dateRange.to, 
          status: selectedStatus,
          limit: 100 
        },
      });
      return r.data.data.data; // Paginated data
    },
    enabled: !!selectedStatus,
  });

  const summary = financialQuery.data;
  const shifts = shiftsQuery.data;
  const waste = wasteQuery.data;
  const bookings = bookingsSummaryQuery.data;
  const details = detailedBookingsQuery.data;
  const isLoading = financialQuery.isLoading || shiftsQuery.isLoading || wasteQuery.isLoading || bookingsSummaryQuery.isLoading;

  return (
    <div className="max-w-6xl mx-auto space-y-10 py-4 animate-in fade-in duration-500" dir="rtl">
      {/* Precision Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-slate-200">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">التحليل المالي</h1>
          <p className="text-slate-500 text-sm">مراجعة أداء المنشأة التشغيلي والمالي بدقة.</p>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="inline-flex items-center gap-2 px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-600 shadow-sm">
            <CalendarDays size={14} className="text-slate-400" />
            <input
              type="date"
              className="bg-transparent border-none p-0 focus:ring-0 w-28 cursor-pointer"
              value={dateRange.from}
              onChange={(e) => setDateRange((p) => ({ ...p, from: e.target.value }))}
            />
            <span className="text-slate-300">|</span>
            <input
              type="date"
              className="bg-transparent border-none p-0 focus:ring-0 w-28 cursor-pointer"
              value={dateRange.to}
              onChange={(e) => setDateRange((p) => ({ ...p, to: e.target.value }))}
            />
          </div>
          
          <button
            onClick={() => {
              financialQuery.refetch();
              shiftsQuery.refetch();
              wasteQuery.refetch();
              bookingsSummaryQuery.refetch();
            }}
            className="p-2 rounded-lg bg-white border border-slate-200 text-slate-400 hover:text-slate-900 hover:border-slate-300 transition-colors shadow-sm"
          >
            <RefreshCw size={16} className={isLoading ? "animate-spin" : ""} />
          </button>
          
          <button className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-lg text-xs font-bold hover:bg-slate-800 transition-colors shadow-sm">
            <Download size={14} />
            تصدير PDF
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="grid gap-8 sm:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-32 rounded-xl bg-slate-50 animate-pulse border border-slate-100" />
          ))}
        </div>
      ) : (
        <>
          {/* High-Impact Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-0 border border-slate-200 rounded-2xl bg-white overflow-hidden shadow-sm">
            <div className="p-8 border-l border-slate-100 last:border-l-0">
              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1">إجمالي الإيرادات</p>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-black text-slate-900">{money(summary?.revenueTotal ?? 0)}</span>
                <TrendingUp size={16} className="text-emerald-500" />
              </div>
              <p className="text-[10px] text-slate-400 mt-2 font-medium">صافي المحصل من المبيعات</p>
            </div>
            <div className="p-8 border-l border-slate-100 last:border-l-0">
              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1">إجمالي المصروفات</p>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-black text-slate-900">{money(summary?.expensesTotal ?? 0)}</span>
                <TrendingDown size={16} className="text-rose-400" />
              </div>
              <p className="text-[10px] text-slate-400 mt-2 font-medium">مصروفات التشغيل والمشتريات</p>
            </div>
            <div className="p-8">
              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1">صافي الربح</p>
              <div className="flex items-baseline gap-2">
                <span className={clsx("text-3xl font-black", (summary?.netProfit ?? 0) >= 0 ? "text-emerald-700" : "text-rose-700")}>
                  {money(summary?.netProfit ?? 0)}
                </span>
                {(summary?.netProfit ?? 0) >= 0
                  ? <ArrowUpRight size={16} className="text-emerald-500" />
                  : <ArrowDownRight size={16} className="text-rose-500" />}
              </div>
              <p className="text-[10px] text-slate-400 mt-2 font-medium">الإيرادات ناقص المصروفات</p>
            </div>
          </div>

          {/* Expense Breakdown */}
          {summary?.breakdown && summary.breakdown.length > 0 && (
            <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
              <div className="flex items-center gap-2.5 border-b border-slate-100 bg-slate-50 px-5 py-4">
                <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-500/10 text-amber-600">
                  <PieChartIcon size={14} />
                </span>
                <h3 className="text-sm font-bold text-slate-800">تفصيل المصروفات بالفئة</h3>
              </div>
              <div className="p-5 space-y-3">
                {summary.breakdown.map((cat) => {
                  const pct = summary.expensesTotal > 0 ? Math.round((cat.total / summary.expensesTotal) * 100) : 0;
                  return (
                    <div key={cat.categoryId}>
                      <div className="flex items-center justify-between mb-1 text-sm">
                        <span className="font-bold text-emerald-700">{money(cat.total)}</span>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-slate-400">{pct}%</span>
                          <span className="font-semibold text-slate-800">{cat.categoryName}</span>
                        </div>
                      </div>
                      <div className="h-1.5 rounded-full bg-slate-100 overflow-hidden">
                        <div className="h-full rounded-full bg-amber-400 transition-all duration-700" style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Shifts Summary */}
          {shifts && (
            <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
              <div className="flex items-center gap-2.5 border-b border-slate-100 bg-slate-50 px-5 py-4">
                <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-500/10 text-amber-600">
                  <Timer size={14} />
                </span>
                <h3 className="text-sm font-bold text-slate-800">ملخص الورديات</h3>
              </div>
              <div className="p-5 space-y-5">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {[
                    { label: "ورديات مغلقة", value: shifts.closedCount, color: "border-l-slate-400" },
                    { label: "ورديات مفتوحة", value: shifts.openCount, color: "border-l-amber-500" },
                    { label: "إجمالي المبيعات", value: money(shifts.totalSales), color: "border-l-emerald-500" },
                    { label: "متوسط وردية", value: money(shifts.avgSalesPerShift), color: "border-l-blue-500" },
                  ].map(({ label, value, color }) => (
                    <div key={label} className={clsx("rounded-xl border border-slate-200 border-l-4 bg-white p-4 shadow-sm", color)}>
                      <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">{label}</p>
                      <p className="text-2xl font-black text-slate-900">{value}</p>
                    </div>
                  ))}
                </div>

                {shifts.recentShifts.length > 0 && (
                  <div className="overflow-x-auto rounded-xl border border-slate-200">
                    <table className="w-full text-right text-xs">
                      <thead className="border-b border-slate-100 bg-slate-50">
                        <tr>
                          <th className="px-4 py-3 font-black uppercase tracking-wider text-slate-500">الكاشير</th>
                          <th className="px-4 py-3 font-black uppercase tracking-wider text-slate-500">المبيعات</th>
                          <th className="px-4 py-3 font-black uppercase tracking-wider text-slate-500">المصروفات</th>
                          <th className="px-4 py-3 font-black uppercase tracking-wider text-slate-500">الصافي</th>
                          <th className="px-4 py-3 font-black uppercase tracking-wider text-slate-500">الفارق</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {shifts.recentShifts.map((shift) => (
                          <tr key={shift.id} className="hover:bg-amber-50/40 transition-colors">
                            <td className="px-4 py-3 font-semibold text-slate-800">{shift.cashier}</td>
                            <td className="px-4 py-3 text-emerald-700 font-bold">{money(shift.totalSales)}</td>
                            <td className="px-4 py-3 text-rose-600">{money(shift.totalExpenses)}</td>
                            <td className="px-4 py-3 font-bold text-slate-900">{money(shift.netSales)}</td>
                            <td className="px-4 py-3">
                              <VarianceIndicator value={shift.variance} />
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Waste Summary */}
          {waste && (
            <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
              <div className="flex items-center gap-2.5 border-b border-slate-100 bg-slate-50 px-5 py-4">
                <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-rose-500/10 text-rose-600">
                  <Trash2 size={14} />
                </span>
                <h3 className="text-sm font-bold text-slate-800">ملخص الهالك</h3>
              </div>
              <div className="p-5 space-y-4">
                <div className="grid grid-cols-3 gap-3">
                  <div className="rounded-xl border border-slate-200 border-l-4 border-l-rose-400 bg-white p-4 shadow-sm">
                    <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">عدد الإدخالات</p>
                    <p className="text-2xl font-black text-slate-900">{waste.totalEntries}</p>
                  </div>
                  <div className="rounded-xl border border-slate-200 border-l-4 border-l-amber-400 bg-white p-4 shadow-sm">
                    <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">إجمالي الكميات</p>
                    <p className="text-2xl font-black text-slate-900">{waste.totalQuantity}</p>
                  </div>
                  <div className="rounded-xl border border-slate-200 border-l-4 border-l-slate-400 bg-white p-4 shadow-sm">
                    <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">التكلفة التقديرية</p>
                    <p className="text-2xl font-black text-rose-700">{money(waste.totalEstimatedCost)}</p>
                  </div>
                </div>

                {waste.topWastedItems.length > 0 && (
                  <div>
                    <p className="mb-2 text-xs font-black uppercase tracking-wider text-slate-500">أكثر المواد هالكاً</p>
                    <div className="space-y-2">
                      {waste.topWastedItems.map((item) => (
                        <div key={item.itemId} className="flex items-center justify-between rounded-xl bg-slate-50 border border-slate-100 px-4 py-2.5">
                          <div className="flex items-center gap-2">
                            {item.estimatedCost != null && (
                              <span className="text-xs font-bold text-rose-600">{money(item.estimatedCost)}</span>
                            )}
                          </div>
                          <div className="text-right">
                            <span className="text-sm font-bold text-slate-800">{item.name}</span>
                            <span className="mr-2 text-xs text-slate-400">
                              {item.totalQuantity} {item.unit}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Bookings Summary */}
          {bookings && (
            <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
              <div className="flex items-center gap-2.5 border-b border-slate-100 bg-slate-50 px-5 py-4">
                <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-500/10 text-blue-600">
                  <Activity size={14} />
                </span>
                <h3 className="text-sm font-bold text-slate-800">ملخص الحجوزات</h3>
              </div>
              <div className="p-5 space-y-4">
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {[
                    { label: "إجمالي الحجوزات", value: bookings.totalCount, icon: <Activity size={14} />, color: "border-l-blue-500" },
                    { label: "مؤكدة", value: bookings.confirmedCount, icon: <CheckCircle2 size={14} />, color: "border-l-emerald-500" },
                    { label: "مكتملة", value: bookings.completedCount, icon: <CheckCircle2 size={14} />, color: "border-l-green-500" },
                    { label: "ملغاة", value: bookings.cancelledCount, icon: <XCircle size={14} />, color: "border-l-rose-500" },
                    { label: "لم يحضر", value: bookings.noShowCount, icon: <UserX size={14} />, color: "border-l-amber-500" },
                    { label: "إيراد الحجوزات", value: money(bookings.totalRevenue), icon: <DollarSign size={14} />, color: "border-l-emerald-600" },
                  ].map(({ label, value, color }) => (
                    <div key={label} className={clsx("rounded-xl border border-slate-200 border-l-4 bg-white p-4 shadow-sm", color)}>
                      <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">{label}</p>
                      <p className="text-xl font-black text-slate-900">{value}</p>
                    </div>
                  ))}
                </div>

                {bookings.potentialLoss > 0 && (
                  <div className="flex items-center gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
                    <AlertTriangle size={16} className="shrink-0 text-amber-600" />
                    <p className="text-sm text-amber-800">
                      خسارة محتملة من الحجوزات الملغاة والغياب:{" "}
                      <span className="font-black">{money(bookings.potentialLoss)}</span>
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
