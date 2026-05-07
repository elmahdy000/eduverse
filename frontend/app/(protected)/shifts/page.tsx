"use client";

import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Timer,
  Play,
  StopCircle,
  Wallet,
  History,
  RefreshCw,
  FileBarChart2,
  AlertTriangle,
} from "lucide-react";
import { api } from "../../../lib/api";
import { translateApiError } from "../../../lib/errors";
import { Alert, SectionTitle } from "../../../components/ui";

export default function ShiftsPage() {
  const qc = useQueryClient();

  const [startCash, setStartCash] = useState("");
  const [actualCash, setActualCash] = useState("");
  const [showStartModal, setShowStartModal] = useState(false);
  const [showCloseModal, setShowCloseModal] = useState(false);
  const [lastCloseReport, setLastCloseReport] = useState<Record<string, unknown> | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const currentShiftQuery = useQuery({
    queryKey: ["shifts", "current"],
    queryFn: async () => {
      try {
        const r = await api.get("/shifts/current");
        return r.data ?? null;
      } catch {
        return null;
      }
    },
    refetchInterval: 30000,
  });

  const pastShiftsQuery = useQuery({
    queryKey: ["shifts", "list"],
    queryFn: async () => {
      const r = await api.get("/shifts");
      return (r.data.data ?? []) as Record<string, unknown>[];
    },
  });

  const startMutation = useMutation({
    mutationFn: () => api.post("/shifts/start", { startCash: Number(startCash) }),
    onSuccess: () => {
      setShowStartModal(false);
      setStartCash("");
      setErrorMsg(null);
      qc.invalidateQueries({ queryKey: ["shifts"] });
    },
    onError: (err: unknown) => {
      const m = (err as { response?: { data?: { message?: string | string[] } } })?.response?.data?.message;
      setErrorMsg(translateApiError(m));
    },
  });

  const closeMutation = useMutation({
    mutationFn: async () => {
      const res = await api.put(`/shifts/${currentShift?.id}/close`, { actualCash: Number(actualCash) });
      return res.data;
    },
    onSuccess: (data) => {
      setLastCloseReport(data?.report ?? null);
      setShowCloseModal(false);
      setActualCash("");
      setErrorMsg(null);
      qc.invalidateQueries({ queryKey: ["shifts"] });
    },
    onError: (err: unknown) => {
      const m = (err as { response?: { data?: { message?: string | string[] } } })?.response?.data?.message;
      setErrorMsg(translateApiError(m));
    },
  });

  const currentShift = currentShiftQuery.data;
  const pastShifts = pastShiftsQuery.data ?? [];
  const isLoading = currentShiftQuery.isLoading && pastShiftsQuery.isLoading;

  const expectedCash = useMemo(() => {
    if (!currentShift) return 0;
    return (
      Number((currentShift as Record<string, unknown>).startCash ?? 0) +
      Number((currentShift as Record<string, unknown> & { stats?: Record<string, unknown> }).stats?.totalSales ?? 0) -
      Number((currentShift as Record<string, unknown> & { stats?: Record<string, unknown> }).stats?.totalExpenses ?? 0)
    );
  }, [currentShift]);

  if (isLoading) return (
    <div className="flex items-center justify-center py-20">
      <RefreshCw size={24} className="animate-spin text-slate-400" />
    </div>
  );

  const cs = currentShift as Record<string, unknown> & { stats?: Record<string, unknown> } | null;

  return (
    <div className="space-y-8 animate-in fade-in duration-700" dir="rtl">
      <SectionTitle
        title="الورديات"
        subtitle="تابع ورديتك لحظة بلحظة، واقفلها بتقرير مالي واضح."
        icon={<Timer size={20} />}
        action={
          <div className="flex gap-2">
            <button
              onClick={() => { qc.invalidateQueries({ queryKey: ["shifts"] }); }}
              className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50"
            >
              <RefreshCw size={12} /> تحديث
            </button>
            {!cs && (
              <button
                onClick={() => { setErrorMsg(null); setShowStartModal(true); }}
                className="flex items-center gap-2 rounded-2xl bg-emerald-600 px-5 py-2 text-sm font-bold text-white shadow-lg transition hover:bg-emerald-700 active:scale-95"
              >
                <Play size={16} />
                بدء وردية
              </button>
            )}
          </div>
        }
      />

      {errorMsg && <Alert tone="danger">{errorMsg}</Alert>}

      {lastCloseReport && (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
          <h3 className="text-sm font-bold text-emerald-900">✓ تقرير إغلاق الوردية</h3>
          <div className="mt-2 grid gap-2 text-sm text-emerald-900 sm:grid-cols-3">
            <p>الكاش المتوقع: <strong>{Number(lastCloseReport.expectedCash ?? 0).toLocaleString("ar-EG")} ج.م</strong></p>
            <p>الكاش الفعلي: <strong>{Number(lastCloseReport.actualCash ?? 0).toLocaleString("ar-EG")} ج.م</strong></p>
            <p className={Number(lastCloseReport.variance ?? 0) < 0 ? "text-rose-700" : "text-emerald-900"}>
              الفرق: <strong>{Number(lastCloseReport.variance ?? 0).toLocaleString("ar-EG")} ج.م</strong>
            </p>
          </div>
        </div>
      )}

      {cs ? (
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="space-y-6 lg:col-span-2">
            <div className="relative overflow-hidden rounded-[2.5rem] bg-slate-900 p-8 text-white shadow-2xl">
              <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-emerald-500/10 blur-3xl" />
              <div className="relative flex flex-col justify-between md:flex-row">
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-500/20 text-emerald-400">
                      <Timer className="animate-pulse" size={20} />
                    </div>
                    <span className="text-sm font-bold uppercase tracking-wider text-emerald-400">وردية شغالة</span>
                  </div>
                  <h2 className="text-4xl font-black">
                    {new Date(cs.startTime as string).toLocaleTimeString("ar-EG", { hour: "2-digit", minute: "2-digit" })}
                  </h2>
                  <p className="text-slate-400">بدأت في {new Date(cs.startTime as string).toLocaleDateString("ar-EG")}</p>
                </div>
                <div className="mt-6 flex flex-col items-end justify-center gap-2 md:mt-0">
                  <button
                    onClick={() => { setErrorMsg(null); setShowCloseModal(true); }}
                    className="flex items-center gap-2 rounded-2xl bg-white px-6 py-3 text-sm font-bold text-slate-900 transition hover:bg-slate-100"
                  >
                    <StopCircle size={18} />
                    إنهاء الوردية
                  </button>
                </div>
              </div>

              <div className="mt-12 grid grid-cols-2 gap-4 border-t border-white/10 pt-8 md:grid-cols-4">
                <div className="space-y-1">
                  <p className="text-xs font-bold uppercase text-slate-500">كاش البداية</p>
                  <p className="text-xl font-bold">{Number(cs.startCash ?? 0).toLocaleString("ar-EG")} ج.م</p>
                </div>
                <div className="space-y-1 text-emerald-400">
                  <p className="text-xs font-bold uppercase">إجمالي المبيعات</p>
                  <p className="text-xl font-bold">+{Number(cs.stats?.totalSales ?? 0).toLocaleString("ar-EG")} ج.م</p>
                </div>
                <div className="space-y-1 text-rose-400">
                  <p className="text-xs font-bold uppercase">إجمالي المصاريف</p>
                  <p className="text-xl font-bold">-{Number(cs.stats?.totalExpenses ?? 0).toLocaleString("ar-EG")} ج.م</p>
                </div>
                <div className="space-y-1 text-blue-300">
                  <p className="text-xs font-bold uppercase">الكاش المتوقع</p>
                  <p className="text-xl font-bold">{expectedCash.toLocaleString("ar-EG")} ج.م</p>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="h-full rounded-3xl border border-slate-100 bg-white p-6 shadow-sm">
              <h3 className="flex items-center gap-2 font-bold text-slate-900">
                <History size={18} className="text-slate-400" />
                آخر الورديات
              </h3>
              <div className="mt-4 space-y-3">
                {pastShifts.slice(0, 6).map((s) => {
                  const shift = s as Record<string, unknown>;
                  return (
                    <div key={shift.id as string} className="rounded-xl border border-slate-100 p-3 text-sm">
                      <p className="font-bold text-slate-800">{new Date(shift.startTime as string).toLocaleDateString("ar-EG")}</p>
                      <div className="mt-1 flex justify-between text-xs text-slate-500">
                        <span className="text-emerald-600">+{Number(shift.totalSales ?? 0).toLocaleString("ar-EG")} ج.م</span>
                        <span className="text-rose-600">-{Number(shift.totalExpenses ?? 0).toLocaleString("ar-EG")} ج.م</span>
                      </div>
                    </div>
                  );
                })}
                {pastShifts.length === 0 && <p className="py-6 text-center text-sm text-slate-400">مفيش ورديات سابقة</p>}
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center rounded-[3rem] border-2 border-dashed border-slate-200 bg-slate-50/50 p-20 text-center">
          <div className="mb-6 rounded-full bg-white p-6 shadow-xl">
            <Timer size={48} className="text-slate-300" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900">مفيش وردية شغالة</h2>
          <p className="mt-2 max-w-xs text-slate-500">ابدأ وردية جديدة علشان تتابع البيع والمصاريف بشكل مظبوط.</p>
          <button
            onClick={() => { setErrorMsg(null); setShowStartModal(true); }}
            className="mt-8 rounded-2xl bg-slate-900 px-8 py-3 font-bold text-white shadow-lg transition hover:bg-slate-800"
          >
            ابدأ دلوقتي
          </button>
        </div>
      )}

      {showStartModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-[2.5rem] bg-white p-8 shadow-2xl">
            <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-3xl bg-emerald-50 text-emerald-600">
              <Wallet size={32} />
            </div>
            <h3 className="text-2xl font-bold text-slate-900">بدء وردية جديدة</h3>
            <p className="mt-2 text-slate-500">اكتب كاش البداية الفعلي في الدرج.</p>
            {errorMsg && <Alert tone="danger">{errorMsg}</Alert>}
            <div className="mt-8 space-y-4">
              <div className="space-y-1.5">
                <label className="text-sm font-bold text-slate-700">كاش البداية (ج.م)</label>
                <input
                  type="number"
                  autoFocus
                  placeholder="0.00"
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 p-4 text-xl font-bold text-slate-900 focus:border-emerald-500 focus:outline-none"
                  value={startCash}
                  onChange={(e) => setStartCash(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && startCash && startMutation.mutate()}
                />
              </div>
              <div className="flex gap-3 pt-4">
                <button onClick={() => setShowStartModal(false)} className="flex-1 rounded-2xl bg-slate-100 py-4 font-bold text-slate-600 hover:bg-slate-200">إلغاء</button>
                <button
                  onClick={() => startMutation.mutate()}
                  disabled={!startCash || startMutation.isPending}
                  className="flex-1 rounded-2xl bg-emerald-600 py-4 font-bold text-white shadow-lg hover:bg-emerald-700 disabled:opacity-50"
                >
                  {startMutation.isPending ? "جاري الفتح..." : "تأكيد الفتح"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showCloseModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-[2.5rem] bg-white p-8 shadow-2xl">
            <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-3xl bg-rose-50 text-rose-600">
              <StopCircle size={32} />
            </div>
            <h3 className="text-2xl font-bold text-slate-900">إنهاء الوردية</h3>
            <p className="mt-2 text-slate-500">اكتب الكاش الفعلي في الدرج، والنظام هيحسبلك الفرق تلقائي.</p>

            {errorMsg && <Alert tone="danger">{errorMsg}</Alert>}

            <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
              <div className="flex items-center gap-2 font-bold"><AlertTriangle size={14} /> الكاش المتوقع حالياً</div>
              <p className="mt-1 text-lg font-black">{expectedCash.toLocaleString("ar-EG")} ج.م</p>
            </div>

            <div className="mt-6 space-y-4">
              <div className="space-y-1.5">
                <label className="text-sm font-bold text-slate-700">الكاش الفعلي (ج.م)</label>
                <input
                  type="number"
                  autoFocus
                  placeholder="0.00"
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 p-4 text-xl font-bold text-slate-900 focus:border-rose-500 focus:outline-none"
                  value={actualCash}
                  onChange={(e) => setActualCash(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && actualCash && closeMutation.mutate()}
                />
              </div>
              <div className="flex gap-3 pt-4">
                <button onClick={() => setShowCloseModal(false)} className="flex-1 rounded-2xl bg-slate-100 py-4 font-bold text-slate-600 hover:bg-slate-200">إلغاء</button>
                <button
                  onClick={() => closeMutation.mutate()}
                  disabled={!actualCash || closeMutation.isPending}
                  className="flex-1 rounded-2xl bg-slate-900 py-4 font-bold text-white shadow-lg hover:bg-slate-800 disabled:opacity-50"
                >
                  <span className="inline-flex items-center gap-2">
                    <FileBarChart2 size={16} />
                    {closeMutation.isPending ? "جاري الإغلاق..." : "إغلاق + تقرير"}
                  </span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
