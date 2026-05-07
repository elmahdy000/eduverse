"use client";

import { useState, useEffect } from "react";
import { 
  Timer, 
  Play, 
  StopCircle, 
  Wallet, 
  ArrowUpRight, 
  ArrowDownRight, 
  History,
  Receipt,
  AlertCircle
} from "lucide-react";
import { api } from "../../../lib/api";
import clsx from "clsx";

export default function ShiftsPage() {
  const [currentShift, setCurrentShift] = useState<any>(null);
  const [pastShifts, setPastShifts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [startCash, setStartCash] = useState("");
  const [actualCash, setActualCash] = useState("");
  const [showStartModal, setShowStartModal] = useState(false);
  const [showCloseModal, setShowCloseModal] = useState(false);

  useEffect(() => {
    fetchShifts();
  }, []);

  const fetchShifts = async () => {
    try {
      const [currentRes, listRes] = await Promise.all([
        api.get("/shifts/current"),
        api.get("/shifts")
      ]);
      setCurrentShift(currentRes.data);
      setPastShifts(listRes.data.data || []);
    } catch (err) {
      console.error("Failed to fetch shifts", err);
    } finally {
      setLoading(false);
    }
  };

  const handleStartShift = async () => {
    try {
      await api.post("/shifts/start", { startCash: Number(startCash) });
      setShowStartModal(false);
      fetchShifts();
    } catch (err: any) {
      alert(err.response?.data?.message || "فشل فتح الوردية");
    }
  };

  const handleCloseShift = async () => {
    try {
      await api.put(`/shifts/${currentShift.id}/close`, { actualCash: Number(actualCash) });
      setShowCloseModal(false);
      fetchShifts();
    } catch (err: any) {
      alert(err.response?.data?.message || "فشل إغلاق الوردية");
    }
  };

  if (loading) return <div className="p-8 text-center">جاري التحميل...</div>;

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">الورديات</h1>
          <p className="text-slate-500">متابعة الورديات اليومية، المبيعات، والعجز النقدي.</p>
        </div>
        {!currentShift && (
          <button 
            onClick={() => setShowStartModal(true)}
            className="flex items-center gap-2 rounded-2xl bg-emerald-600 px-6 py-3 text-sm font-bold text-white shadow-lg transition hover:bg-emerald-700 active:scale-95"
          >
            <Play size={18} />
            بدء وردية جديدة
          </button>
        )}
      </div>

      {currentShift ? (
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Active Shift Card */}
          <div className="lg:col-span-2 space-y-6">
            <div className="relative overflow-hidden rounded-[2.5rem] bg-slate-900 p-8 text-white shadow-2xl">
              <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-emerald-500/10 blur-3xl" />
              <div className="relative flex flex-col justify-between md:flex-row">
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-500/20 text-emerald-400">
                      <Timer className="animate-pulse" size={20} />
                    </div>
                    <span className="text-sm font-bold uppercase tracking-wider text-emerald-400">وردية نشطة</span>
                  </div>
                  <h2 className="text-4xl font-black">
                    {new Date(currentShift.startTime).toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })}
                  </h2>
                  <p className="text-slate-400">بدأت في {new Date(currentShift.startTime).toLocaleDateString('ar-EG')}</p>
                </div>
                <div className="mt-6 flex flex-col items-end justify-center gap-2 md:mt-0">
                  <button 
                    onClick={() => setShowCloseModal(true)}
                    className="flex items-center gap-2 rounded-2xl bg-white px-6 py-3 text-sm font-bold text-slate-900 transition hover:bg-slate-100"
                  >
                    <StopCircle size={18} />
                    إنهاء الوردية
                  </button>
                </div>
              </div>

              <div className="mt-12 grid grid-cols-2 gap-4 border-t border-white/10 pt-8 md:grid-cols-3">
                <div className="space-y-1">
                  <p className="text-xs font-bold text-slate-500 uppercase">كاش البداية</p>
                  <p className="text-xl font-bold">{Number(currentShift.startCash).toLocaleString()} ج.م</p>
                </div>
                <div className="space-y-1 text-emerald-400">
                  <p className="text-xs font-bold uppercase">إجمالي المبيعات</p>
                  <p className="text-xl font-bold">+{Number(currentShift.stats?.totalSales || 0).toLocaleString()} ج.م</p>
                </div>
                <div className="space-y-1 text-rose-400">
                  <p className="text-xs font-bold uppercase">إجمالي المصاريف</p>
                  <p className="text-xl font-bold">-{Number(currentShift.stats?.totalExpenses || 0).toLocaleString()} ج.م</p>
                </div>
              </div>
            </div>

            {/* Live Financial Summary */}
            <div className="grid gap-4 sm:grid-cols-2">
               <div className="rounded-3xl bg-white p-6 border border-slate-100 shadow-sm">
                  <p className="text-sm font-medium text-slate-500">الكاش المتوقع حالياً</p>
                  <p className="mt-2 text-3xl font-black text-slate-900">
                    {(Number(currentShift.startCash) + Number(currentShift.stats?.totalSales || 0) - Number(currentShift.stats?.totalExpenses || 0)).toLocaleString()} ج.م
                  </p>
               </div>
               <div className="rounded-3xl bg-emerald-50 p-6 border border-emerald-100">
                  <p className="text-sm font-medium text-emerald-700">صافي ربح الوردية</p>
                  <p className="mt-2 text-3xl font-black text-emerald-900">
                    {(Number(currentShift.stats?.totalSales || 0) - Number(currentShift.stats?.totalExpenses || 0)).toLocaleString()} ج.م
                  </p>
               </div>
            </div>
          </div>

          {/* Right Sidebar - Recent Actions */}
          <div className="space-y-6">
            <div className="rounded-3xl bg-white p-6 border border-slate-100 shadow-sm h-full">
              <h3 className="font-bold text-slate-900 flex items-center gap-2">
                <History size={18} className="text-slate-400" />
                آخر الحركات
              </h3>
              <div className="mt-6 space-y-4">
                <p className="text-center text-sm text-slate-400 py-10 italic">سيتم عرض مبيعات ومصروفات الوردية الحالية هنا قريباً...</p>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center rounded-[3rem] border-2 border-dashed border-slate-200 bg-slate-50/50 p-20 text-center">
          <div className="mb-6 rounded-full bg-white p-6 shadow-xl">
            <Timer size={48} className="text-slate-300" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900">لا توجد وردية نشطة</h2>
          <p className="mt-2 max-w-xs text-slate-500">يجب بدء وردية جديدة لتتمكن من تسجيل المبيعات والمصروفات.</p>
          <button 
            onClick={() => setShowStartModal(true)}
            className="mt-8 rounded-2xl bg-slate-900 px-8 py-3 font-bold text-white shadow-lg transition hover:bg-slate-800"
          >
            ابدأ الآن
          </button>
        </div>
      )}

      {/* Start Shift Modal */}
      {showStartModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-[2.5rem] bg-white p-8 shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-3xl bg-emerald-50 text-emerald-600">
              <Wallet size={32} />
            </div>
            <h3 className="text-2xl font-bold text-slate-900">بدء وردية جديدة</h3>
            <p className="mt-2 text-slate-500">أدخل المبلغ النقدي المتوفر في الخزنة حالياً.</p>
            <div className="mt-8 space-y-4">
              <div className="space-y-1.5">
                <label className="text-sm font-bold text-slate-700">كاش البداية (ج.م)</label>
                <input 
                  type="number" 
                  autoFocus
                  placeholder="0.00"
                  className="w-full rounded-2xl border-slate-200 bg-slate-50 p-4 text-xl font-bold text-slate-900 focus:border-emerald-500 focus:ring-emerald-500"
                  value={startCash}
                  onChange={(e) => setStartCash(e.target.value)}
                />
              </div>
              <div className="flex gap-3 pt-4">
                <button 
                  onClick={() => setShowStartModal(false)}
                  className="flex-1 rounded-2xl bg-slate-100 py-4 font-bold text-slate-600 transition hover:bg-slate-200"
                >
                  إلغاء
                </button>
                <button 
                  onClick={handleStartShift}
                  disabled={!startCash}
                  className="flex-1 rounded-2xl bg-emerald-600 py-4 font-bold text-white shadow-lg transition hover:bg-emerald-700 disabled:opacity-50"
                >
                  تأكيد الفتح
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Close Shift Modal */}
      {showCloseModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-[2.5rem] bg-white p-8 shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-3xl bg-rose-50 text-rose-600">
              <StopCircle size={32} />
            </div>
            <h3 className="text-2xl font-bold text-slate-900">إنهاء الوردية</h3>
            <p className="mt-2 text-slate-500">أدخل المبلغ النقدي الفعلي الموجود في الخزنة حالياً للمطابقة.</p>
            <div className="mt-8 space-y-4">
              <div className="space-y-1.5">
                <label className="text-sm font-bold text-slate-700">الكاش الفعلي بالخزنة (ج.م)</label>
                <input 
                  type="number" 
                  autoFocus
                  placeholder="0.00"
                  className="w-full rounded-2xl border-slate-200 bg-slate-50 p-4 text-xl font-bold text-slate-900 focus:border-rose-500 focus:ring-rose-500"
                  value={actualCash}
                  onChange={(e) => setActualCash(e.target.value)}
                />
              </div>
              <div className="flex gap-3 pt-4">
                <button 
                  onClick={() => setShowCloseModal(false)}
                  className="flex-1 rounded-2xl bg-slate-100 py-4 font-bold text-slate-600 transition hover:bg-slate-200"
                >
                  إلغاء
                </button>
                <button 
                  onClick={handleCloseShift}
                  disabled={!actualCash}
                  className="flex-1 rounded-2xl bg-slate-900 py-4 font-bold text-white shadow-lg transition hover:bg-slate-800 disabled:opacity-50"
                >
                  إغلاق ومطابقة
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
