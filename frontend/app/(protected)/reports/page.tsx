"use client";

import { useState, useEffect } from "react";
import { 
  BarChart3, 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Calendar as CalendarIcon,
  Filter,
  Download,
  PieChart as PieChartIcon,
  AlertTriangle
} from "lucide-react";
import { api } from "../../../lib/api";
import clsx from "clsx";

export default function ReportsPage() {
  const [summary, setSummary] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState({ 
    from: new Date().toISOString().split('T')[0], 
    to: new Date().toISOString().split('T')[0] 
  });

  useEffect(() => {
    fetchSummary();
  }, [dateRange]);

  const fetchSummary = async () => {
    setLoading(true);
    try {
      const res = await api.get("/expenses/financial-summary", {
        params: { fromDate: dateRange.from, toDate: dateRange.to }
      });
      setSummary(res.data);
    } catch (err) {
      console.error("Failed to fetch summary", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">التقارير المالية</h1>
          <p className="text-slate-500">تحليل الأداء المالي، الأرباح، والمصاريف.</p>
        </div>
        <div className="flex items-center gap-3">
           <div className="flex items-center gap-2 rounded-2xl bg-white border border-slate-200 p-1 shadow-sm">
              <input 
                type="date" 
                className="border-none bg-transparent text-xs font-bold text-slate-600 focus:ring-0"
                value={dateRange.from}
                onChange={(e) => setDateRange({ ...dateRange, from: e.target.value })}
              />
              <span className="text-slate-300">|</span>
              <input 
                type="date" 
                className="border-none bg-transparent text-xs font-bold text-slate-600 focus:ring-0"
                value={dateRange.to}
                onChange={(e) => setDateRange({ ...dateRange, to: e.target.value })}
              />
           </div>
           <button className="rounded-xl bg-slate-900 p-2.5 text-white shadow-lg hover:bg-slate-800 transition">
              <Download size={20} />
           </button>
        </div>
      </div>

      {loading ? (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {[1,2,3].map(i => <div key={i} className="h-32 rounded-3xl bg-slate-100 animate-pulse" />)}
        </div>
      ) : (
        <>
          {/* Main Stats */}
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            <div className="group relative overflow-hidden rounded-[2rem] bg-white p-6 shadow-sm border border-slate-100 transition-all hover:shadow-md">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-sm font-medium text-slate-500">إجمالي الإيرادات</p>
                  <p className="text-3xl font-black text-slate-900">{Number(summary?.revenueTotal || 0).toLocaleString()} ج.م</p>
                </div>
                <div className="rounded-2xl bg-emerald-50 p-3 text-emerald-600">
                  <TrendingUp size={24} />
                </div>
              </div>
              <div className="mt-4 text-xs font-bold text-emerald-600 bg-emerald-50/50 w-fit px-2 py-1 rounded-lg">
                دخل حقيقي من المدفوعات
              </div>
            </div>

            <div className="group relative overflow-hidden rounded-[2rem] bg-white p-6 shadow-sm border border-slate-100 transition-all hover:shadow-md">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-sm font-medium text-slate-500">إجمالي المصروفات</p>
                  <p className="text-3xl font-black text-rose-600">{Number(summary?.expensesTotal || 0).toLocaleString()} ج.م</p>
                </div>
                <div className="rounded-2xl bg-rose-50 p-3 text-rose-600">
                  <TrendingDown size={24} />
                </div>
              </div>
              <div className="mt-4 text-xs font-bold text-rose-600 bg-rose-50/50 w-fit px-2 py-1 rounded-lg">
                تشمل المشتريات والرواتب
              </div>
            </div>

            <div className="group relative overflow-hidden rounded-[2rem] bg-slate-900 p-6 shadow-2xl text-white">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-sm font-medium text-slate-400">صافي الربح</p>
                  <p className="text-3xl font-black text-white">{Number(summary?.netProfit || 0).toLocaleString()} ج.م</p>
                </div>
                <div className="rounded-2xl bg-white/10 p-3 text-white">
                  <DollarSign size={24} />
                </div>
              </div>
              <div className="mt-4 text-xs font-bold text-white/50 border border-white/10 w-fit px-2 py-1 rounded-lg">
                المبلغ المتبقي بعد التكاليف
              </div>
            </div>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            {/* Expenses Breakdown */}
            <div className="rounded-[2rem] bg-white p-8 border border-slate-100 shadow-sm">
              <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2 mb-6">
                <PieChartIcon size={20} className="text-slate-400" />
                تحليل المصروفات
              </h3>
              <div className="space-y-4">
                {summary?.breakdown?.map((item: any) => {
                  const percent = (item.total / summary.expensesTotal) * 100;
                  return (
                    <div key={item.categoryId} className="space-y-2">
                      <div className="flex justify-between text-sm font-bold">
                        <span className="text-slate-700">{item.categoryName}</span>
                        <span className="text-slate-900">{item.total.toLocaleString()} ج.م</span>
                      </div>
                      <div className="h-2 w-full bg-slate-50 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-slate-900 transition-all duration-1000" 
                          style={{ width: `${percent}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Shift Summary */}
            <div className="rounded-[2rem] bg-white p-8 border border-slate-100 shadow-sm">
              <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2 mb-6">
                <BarChart3 size={20} className="text-slate-400" />
                ملخص الورديات والهالك
              </h3>
              <div className="flex flex-col items-center justify-center h-48 text-center bg-slate-50 rounded-[1.5rem] border border-dashed border-slate-200">
                 <AlertTriangle size={32} className="text-slate-300 mb-2" />
                 <p className="text-sm text-slate-500 max-w-[200px]">قريباً: عرض تكلفة الهالك الإجمالية وتفاصيل عجز الورديات هنا.</p>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
