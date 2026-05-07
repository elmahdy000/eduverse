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
              <p className="text-[10px] text-slate-400 mt-2 font-medium">تشمل المشتريات والمصاريف الإدارية</p>
            </div>

            <div className="p-8 bg-slate-50/50">
              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1">صافي الربح</p>
              <div className="flex items-baseline gap-2">
                <span className={clsx("text-4xl font-black", (summary?.netProfit ?? 0) >= 0 ? "text-slate-900" : "text-rose-600")}>
                  {money(summary?.netProfit ?? 0)}
                </span>
                <DollarSign size={18} className="text-slate-400" />
              </div>
              <p className="text-[10px] text-slate-500 mt-2 font-semibold">المبلغ المتبقي بعد التصفية</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
            {/* Operational Efficiency: Shifts */}
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-bold uppercase tracking-tight text-slate-900">كفاءة الوردية والتشغيل</h2>
                <Timer size={14} className="text-slate-300" />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="p-5 rounded-xl border border-slate-200 bg-white">
                  <span className="text-2xl font-bold text-slate-900">{shifts?.closedCount ?? 0}</span>
                  <p className="text-xs text-slate-500 font-medium mt-1">ورديات مغلقة</p>
                </div>
                <div className="p-5 rounded-xl border border-slate-200 bg-white">
                  <span className="text-2xl font-bold text-slate-900">{money(shifts?.avgSalesPerShift ?? 0)}</span>
                  <p className="text-xs text-slate-500 font-medium mt-1">متوسط مبيعات الوردية</p>
                </div>
              </div>

              <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
                <table className="w-full text-xs text-right">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-slate-500">
                      <th className="px-4 py-3 font-bold uppercase tracking-tighter">الكاشير</th>
                      <th className="px-4 py-3 font-bold uppercase tracking-tighter text-left">المبيعات</th>
                      <th className="px-4 py-3 font-bold uppercase tracking-tighter text-left">عجز الكاش</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {shifts?.recentShifts.slice(0, 5).map((s) => (
                      <tr key={s.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="px-4 py-3 font-semibold text-slate-700">{s.cashier}</td>
                        <td className="px-4 py-3 font-bold text-slate-900 text-left">{money(s.totalSales)}</td>
                        <td className="px-4 py-3 text-left font-mono">
                          <VarianceIndicator value={s.variance} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Waste & Inventory Analysis */}
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-bold uppercase tracking-tight text-slate-900">تحليل الهالك والفاقد</h2>
                <Trash2 size={14} className="text-slate-300" />
              </div>

              <div className="p-6 rounded-xl border border-slate-200 bg-white flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">إجمالي تكلفة الفاقد</p>
                  <p className="text-2xl font-black text-rose-600">{money(waste?.totalEstimatedCost ?? 0)}</p>
                </div>
                <div className="text-left">
                  <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">عدد الإدخالات</p>
                  <p className="text-xl font-bold text-slate-900">{waste?.totalEntries ?? 0}</p>
                </div>
              </div>

              <div className="space-y-3">
                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">أكثر 5 أصناف هالكاً</p>
                {waste?.topWastedItems && waste.topWastedItems.length > 0 ? (
                  <div className="grid gap-2">
                    {waste.topWastedItems.map((item) => (
                      <div key={item.itemId} className="group flex items-center justify-between p-3 rounded-lg border border-slate-100 bg-slate-50/30 hover:border-slate-200 hover:bg-white transition-all">
                        <div className="flex items-center gap-3">
                          <div className="h-2 w-2 rounded-full bg-rose-400" />
                          <span className="text-xs font-bold text-slate-700">{item.name}</span>
                        </div>
                        <div className="text-left flex items-center gap-4">
                          <span className="text-xs font-medium text-slate-500">{item.totalQuantity} {item.unit}</span>
                          <span className="text-xs font-black text-slate-900">{money(item.estimatedCost ?? 0)}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="py-10 text-center rounded-xl border border-dashed border-slate-200 bg-slate-50/50">
                    <p className="text-xs text-slate-400 font-medium">لا توجد بيانات هالك مسجلة</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Booking Reports Section */}
          <div className="space-y-6 pt-10 border-t border-slate-100">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <h2 className="text-xl font-black text-slate-900">تقرير الحجوزات</h2>
                <p className="text-xs text-slate-500">تحليل الحجوزات المؤكدة، الملغية، والـ No-Show.</p>
              </div>
              <Activity size={20} className="text-slate-300" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <button 
                onClick={() => setSelectedStatus(selectedStatus === 'completed' ? null : 'completed')}
                className={clsx(
                  "p-5 rounded-2xl border text-right transition-all",
                  selectedStatus === 'completed' ? "border-emerald-500 bg-emerald-50 ring-2 ring-emerald-500/20" : "border-slate-200 bg-white hover:border-slate-300"
                )}
              >
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle2 size={14} className="text-emerald-500" />
                  <span className="text-[10px] font-black uppercase text-slate-400">حجوزات مكتملة</span>
                </div>
                <div className="text-2xl font-black text-slate-900">{bookings?.completedCount ?? 0}</div>
                <p className="text-[9px] text-slate-400 mt-1">اضغط لعرض التفاصيل</p>
              </button>

              <button 
                onClick={() => setSelectedStatus(selectedStatus === 'cancelled' ? null : 'cancelled')}
                className={clsx(
                  "p-5 rounded-2xl border text-right transition-all",
                  selectedStatus === 'cancelled' ? "border-rose-500 bg-rose-50 ring-2 ring-rose-500/20" : "border-slate-200 bg-white hover:border-slate-300"
                )}
              >
                <div className="flex items-center gap-2 mb-2">
                  <XCircle size={14} className="text-rose-500" />
                  <span className="text-[10px] font-black uppercase text-slate-400">حجوزات ملغية</span>
                </div>
                <div className="text-2xl font-black text-slate-900">{bookings?.cancelledCount ?? 0}</div>
                <p className="text-[9px] text-slate-400 mt-1">اضغط لعرض التفاصيل</p>
              </button>

              <button 
                onClick={() => setSelectedStatus(selectedStatus === 'no_show' ? null : 'no_show')}
                className={clsx(
                  "p-5 rounded-2xl border text-right transition-all",
                  selectedStatus === 'no_show' ? "border-amber-500 bg-amber-50 ring-2 ring-amber-500/20" : "border-slate-200 bg-white hover:border-slate-300"
                )}
              >
                <div className="flex items-center gap-2 mb-2">
                  <UserX size={14} className="text-amber-500" />
                  <span className="text-[10px] font-black uppercase text-slate-400">No-Show</span>
                </div>
                <div className="text-2xl font-black text-slate-900">{bookings?.noShowCount ?? 0}</div>
                <p className="text-[9px] text-slate-400 mt-1">اضغط لعرض التفاصيل</p>
              </button>

              <div className="p-5 rounded-2xl bg-slate-900 text-white shadow-lg shadow-slate-900/10">
                <div className="flex items-center gap-2 mb-2">
                  <AlertTriangle size={14} className="text-amber-400" />
                  <span className="text-[10px] font-black uppercase text-slate-500">خسائر محتملة</span>
                </div>
                <div className="text-2xl font-black">{money(bookings?.potentialLoss ?? 0)}</div>
                <p className="text-[9px] text-slate-400 mt-1">قيمة الحجوزات الضائعة</p>
              </div>
            </div>

            {/* Drill-down Table */}
            {selectedStatus && details && (
              <div className="animate-in slide-in-from-top-4 duration-300">
                <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-xl">
                  <div className="bg-slate-50 px-4 py-3 border-b border-slate-200 flex justify-between items-center">
                    <h3 className="text-xs font-black uppercase text-slate-900">تفاصيل الحجوزات ({selectedStatus})</h3>
                    <button onClick={() => setSelectedStatus(null)} className="text-[10px] font-bold text-slate-400 hover:text-slate-900 uppercase">إغلاق</button>
                  </div>
                  <table className="w-full text-xs text-right">
                    <thead>
                      <tr className="bg-slate-50/50 border-b border-slate-100 text-slate-500">
                        <th className="px-4 py-3 font-bold">العميل</th>
                        <th className="px-4 py-3 font-bold">الغرفة</th>
                        <th className="px-4 py-3 font-bold">الموعد</th>
                        <th className="px-4 py-3 font-bold">المبلغ</th>
                        <th className="px-4 py-3 font-bold">الملاحظات / سبب الإلغاء</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {details.length > 0 ? details.map((d: any) => (
                        <tr 
                          key={d.id} 
                          onClick={() => window.location.href = `/bookings?id=${d.id}`}
                          className="hover:bg-slate-50 cursor-pointer transition-colors group"
                        >
                          <td className="px-4 py-3">
                            <div className="font-bold text-slate-900 group-hover:text-blue-600 transition-colors">{d.customer?.fullName}</div>
                            <div className="text-[9px] text-slate-400">{d.customer?.phoneNumber}</div>
                          </td>
                          <td className="px-4 py-3 font-medium text-slate-600">{d.room?.name}</td>
                          <td className="px-4 py-3 text-slate-500">
                            {new Date(d.startTime).toLocaleDateString('ar-EG')} {new Date(d.startTime).toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })}
                          </td>
                          <td className="px-4 py-3 font-black text-slate-900">{money(d.totalAmount)}</td>
                          <td className="px-4 py-3 text-slate-500 italic truncate max-w-[200px]" title={d.notes || ""}>
                            {d.notes || "—"}
                          </td>
                        </tr>
                      )) : (
                        <tr>
                          <td colSpan={5} className="px-4 py-10 text-center text-slate-400">لا توجد بيانات متاحة لهذا الفلتر</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Completion Rate Bar */}
            <div className="p-6 rounded-2xl bg-slate-50 border border-slate-100">
              <div className="flex justify-between items-center mb-3">
                <span className="text-xs font-black text-slate-900 uppercase">معدل تنفيذ الحجوزات</span>
                <span className="text-xs font-black text-slate-900">
                  {bookings?.totalCount ? Math.round(((bookings.completedCount) / bookings.totalCount) * 100) : 0}%
                </span>
              </div>
              <div className="h-3 w-full bg-slate-200 rounded-full overflow-hidden flex">
                <div 
                  className="h-full bg-emerald-500" 
                  style={{ width: `${bookings?.totalCount ? (bookings.completedCount / bookings.totalCount) * 100 : 0}%` }}
                  title="مكتمل"
                />
                <div 
                  className="h-full bg-rose-500" 
                  style={{ width: `${bookings?.totalCount ? (bookings.cancelledCount / bookings.totalCount) * 100 : 0}%` }}
                  title="ملغي"
                />
                <div 
                  className="h-full bg-amber-500" 
                  style={{ width: `${bookings?.totalCount ? (bookings.noShowCount / bookings.totalCount) * 100 : 0}%` }}
                  title="No-Show"
                />
              </div>
              <div className="flex gap-4 mt-4">
                <div className="flex items-center gap-1.5">
                  <div className="h-2 w-2 rounded-full bg-emerald-500" />
                  <span className="text-[10px] font-bold text-slate-500">ناجح</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="h-2 w-2 rounded-full bg-rose-500" />
                  <span className="text-[10px] font-bold text-slate-500">ملغي</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="h-2 w-2 rounded-full bg-amber-500" />
                  <span className="text-[10px] font-bold text-slate-500">No-Show</span>
                </div>
              </div>
            </div>
          </div>

          <div className="pt-10 border-t border-slate-100">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-sm font-bold uppercase tracking-tight text-slate-900">توزيع المصروفات التشغيلية</h2>
              <PieChartIcon size={14} className="text-slate-300" />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-12 gap-y-6">
              {summary?.breakdown?.map((item) => {
                const percent = summary.expensesTotal > 0 ? (item.total / summary.expensesTotal) * 100 : 0;
                return (
                  <div key={item.categoryId} className="space-y-1.5">
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-bold text-slate-700">{item.categoryName}</span>
                      <span className="text-xs font-black text-slate-900">{money(item.total)}</span>
                    </div>
                    <div className="h-1 w-full bg-slate-100 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-slate-900 rounded-full" 
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                    <p className="text-[10px] text-slate-400 font-medium">{Math.round(percent)}% من الإجمالي</p>
                  </div>
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
