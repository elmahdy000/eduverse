"use client";

import { useMemo, useState, useEffect, useRef } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Timer, Play, StopCircle, Wallet, History, RefreshCw,
  TrendingUp, TrendingDown, CreditCard, DollarSign, CheckCircle2,
  AlertTriangle, HelpCircle, FileText, UserCheck
} from "lucide-react";
import { api } from "../../../lib/api";
import { translateApiError } from "../../../lib/errors";
import { dateTime, money, dateShort } from "../../../lib/format";
import {
  Alert, Badge, Btn, FormField, Input, Modal, Panel,
  SectionTitle, StatCard, DataTable, EmptyState, statusBadgeTone
} from "../../../components/ui";
import { useAuthStore } from "../../../store/auth-store";
import clsx from "clsx";

/* ── Live Shift Timer Component ── */
function LiveDuration({ startTime }: { startTime: string }) {
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  useEffect(() => {
    if (!startTime) return;
    const start = new Date(startTime).getTime();
    const update = () => setElapsedSeconds(Math.floor((Date.now() - start) / 1000));
    update();
    const timer = setInterval(update, 1000);
    return () => clearInterval(timer);
  }, [startTime]);

  const hrs = Math.floor(elapsedSeconds / 3600);
  const mins = Math.floor((elapsedSeconds % 3600) / 60);
  const secs = elapsedSeconds % 60;

  return (
    <span className="font-mono text-sm font-black text-amber-600 ltr-value">
      {String(hrs).padStart(2, "0")}:{String(mins).padStart(2, "0")}:{String(secs).padStart(2, "0")}
    </span>
  );
}

export default function ShiftsPage() {
  const qc = useQueryClient();
  const currentUser = useAuthStore((s) => s.user);
  const roleName = currentUser?.role?.name;
  const canViewAllShifts = roleName === "Owner" || roleName === "Operations Manager";

  const [startCash, setStartCash] = useState("");
  const [actualCash, setActualCash] = useState("");
  const [closeNotes, setCloseNotes] = useState("");
  const [showStartModal, setShowStartModal] = useState(false);
  const [showCloseModal, setShowCloseModal] = useState(false);
  const [lastCloseReport, setLastCloseReport] = useState<Record<string, any> | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  /* ── Current Active Shift ── */
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
    refetchInterval: 15000,
  });

  /* ── Past Shifts History ── */
  const pastShiftsQuery = useQuery({
    queryKey: ["shifts", "list"],
    enabled: canViewAllShifts,
    queryFn: async () => {
      const r = await api.get("/shifts");
      return (r.data.data ?? []) as Record<string, any>[];
    },
  });

  /* ── Mutations ── */
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
      const res = await api.put(`/shifts/${currentShift?.id}/close`, {
        actualCash: Number(actualCash),
        notes: closeNotes.trim() || undefined,
      });
      return res.data;
    },
    onSuccess: (data) => {
      setLastCloseReport(data?.report ?? null);
      setShowCloseModal(false);
      setActualCash("");
      setCloseNotes("");
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
  const isLoading = currentShiftQuery.isLoading || (canViewAllShifts && pastShiftsQuery.isLoading);

  /* ── Financial Calculations ── */
  const startAmount = Number(currentShift?.startCash ?? 0);
  const totalSales = Number(currentShift?.stats?.totalSales ?? 0);
  const totalExpenses = Number(currentShift?.stats?.totalExpenses ?? 0);
  const cashSales = Number(currentShift?.stats?.totalCashSales ?? 0);
  const cashExpenses = Number(currentShift?.stats?.totalCashExpenses ?? 0);
  const cardSales = Math.max(0, totalSales - cashSales);
  const expectedCash = startAmount + cashSales - cashExpenses;

  /* ── Live Variance calculation for Close Modal ── */
  const parsedActual = actualCash === "" ? null : Number(actualCash);
  const variance = parsedActual === null ? 0 : parsedActual - expectedCash;

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-3">
        <RefreshCw size={28} className="animate-spin text-amber-500" />
        <p className="text-sm font-semibold text-slate-500">جاري تحميل بيانات الوردية...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-300" dir="rtl">
      {/* ── Page Header ── */}
      <SectionTitle
        title="إدارة الورديات والصندوق"
        subtitle="تابع حركة الخزينة النقدية، سجل كاش البداية، واقفل الوردية بتقارير جرد دقيقة."
        icon={<Timer size={22} />}
        action={
          <div className="flex items-center gap-2">
            <Btn
              variant="secondary"
              size="sm"
              icon={<RefreshCw size={14} />}
              onClick={() => qc.invalidateQueries({ queryKey: ["shifts"] })}
            >
              تحديث
            </Btn>
            {!currentShift ? (
              <Btn
                variant="primary"
                size="md"
                icon={<Play size={16} />}
                onClick={() => { setErrorMsg(null); setShowStartModal(true); }}
              >
                بدء وردية جديدة
              </Btn>
            ) : (
              <Btn
                variant="danger"
                size="md"
                icon={<StopCircle size={16} />}
                onClick={() => { setErrorMsg(null); setShowCloseModal(true); }}
              >
                إنهاء الوردية والجرد
              </Btn>
            )}
          </div>
        }
      />

      {errorMsg && <Alert tone="danger">{errorMsg}</Alert>}

      {/* ── Last Close Summary Report Banner ── */}
      {lastCloseReport && (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50/90 p-5 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-emerald-900 font-black text-base">
              <CheckCircle2 size={20} className="text-emerald-600" />
              <span>تم إغلاق الوردية وتصفية الحسابات بنجاح</span>
            </div>
            <Btn size="sm" variant="ghost" onClick={() => setLastCloseReport(null)}>
              إغلاق التقرير
            </Btn>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-4 rounded-xl bg-white p-4 border border-emerald-100">
            <div>
              <span className="text-xs font-bold text-slate-500">كاش البداية</span>
              <p className="text-sm font-black text-slate-900 ltr-value">{money(lastCloseReport.startCash)}</p>
            </div>
            <div>
              <span className="text-xs font-bold text-slate-500">الكاش المتوقع بالدرج</span>
              <p className="text-sm font-black text-blue-700 ltr-value">{money(lastCloseReport.expectedCash)}</p>
            </div>
            <div>
              <span className="text-xs font-bold text-slate-500">الكاش الفعلي المسلم</span>
              <p className="text-sm font-black text-slate-900 ltr-value">{money(lastCloseReport.actualCash)}</p>
            </div>
            <div>
              <span className="text-xs font-bold text-slate-500">نتيجة الفروقات (العجز/الزيادة)</span>
              <p className={clsx(
                "text-sm font-black ltr-value",
                Number(lastCloseReport.variance) === 0 ? "text-emerald-600" : Number(lastCloseReport.variance) < 0 ? "text-rose-600" : "text-blue-600"
              )}>
                {Number(lastCloseReport.variance) === 0
                  ? "متطابق 100%"
                  : Number(lastCloseReport.variance) < 0
                  ? `عجز ${money(lastCloseReport.variance)}`
                  : `زيادة ${money(lastCloseReport.variance)}`}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ── Main Active Shift Content ── */}
      {currentShift ? (
        <div className="space-y-6">
          {/* Active Shift Header Status Card */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 pb-4">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-600">
                  <Timer size={24} className="animate-pulse" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-lg font-black text-slate-900">الوردية الحالية نشطة</h2>
                    <Badge tone="success" dot>شغالة الآن</Badge>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    المسؤول: <span className="font-bold text-slate-700">{currentShift.user?.fullName || currentUser?.firstName || "مستخدم الوردية"}</span>
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-4 bg-slate-50 rounded-xl px-4 py-2.5 border border-slate-100">
                <div className="text-right">
                  <span className="text-[11px] font-bold text-slate-400 uppercase block">تاريخ ووقت البداية</span>
                  <span className="text-xs font-bold text-slate-700 ltr-value">{dateTime(currentShift.startTime)}</span>
                </div>
                <div className="h-8 w-px bg-slate-200" />
                <div className="text-right">
                  <span className="text-[11px] font-bold text-slate-400 uppercase block">مدة الوردية الحالية</span>
                  <LiveDuration startTime={currentShift.startTime} />
                </div>
              </div>
            </div>

            {/* Financial StatCards Grid */}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <StatCard
                label="كاش البداية (درج النقدية)"
                value={<span className="ltr-value">{money(startAmount)}</span>}
                sub="المبلغ الأولي المودع في الخزينة"
                tone="default"
                icon={<Wallet size={20} />}
              />
              <StatCard
                label="إجمالي مبيعات الكاش"
                value={<span className="ltr-value">{money(cashSales)}</span>}
                sub="المدفوعات النقدية المحصلة"
                tone="success"
                icon={<DollarSign size={20} />}
              />
              <StatCard
                label="مبيعات الكارت / الشبكة"
                value={<span className="ltr-value">{money(cardSales)}</span>}
                sub="المدفوعات الإلكترونية غير النقدية"
                tone="info"
                icon={<CreditCard size={20} />}
              />
              <StatCard
                label="إجمالي المصروفات والسلف"
                value={<span className="ltr-value">{money(cashExpenses)}</span>}
                sub="المبالغ المدفوعة نقدياً من الدرج"
                tone="danger"
                icon={<TrendingDown size={20} />}
              />
            </div>

            {/* Total Expected Cash Primary Focus Banner */}
            <div className="rounded-xl bg-navy text-white p-5 flex flex-wrap items-center justify-between gap-4 shadow-md">
              <div className="space-y-1">
                <span className="text-xs font-bold text-amber-400 uppercase tracking-wide">الكاش المتوقع وجوده في الدرج الآن</span>
                <p className="text-xs text-slate-300">
                  معادلة المحاسبة: (كاش البداية {money(startAmount)}) + (مبيعات الكاش {money(cashSales)}) - (المصروفات النقدية {money(cashExpenses)})
                </p>
              </div>
              <div className="text-left bg-white/10 px-5 py-2.5 rounded-xl backdrop-blur-xs border border-white/15">
                <span className="text-2xl font-black text-amber-400 ltr-value">{money(expectedCash)}</span>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* Empty State — No Active Shift */
        <div className="surface-card py-16 flex flex-col items-center justify-center text-center space-y-4">
          <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-amber-50 text-amber-600 shadow-inner">
            <Timer size={40} />
          </div>
          <div className="max-w-md space-y-1">
            <h3 className="text-lg font-black text-slate-900">لا توجد وردية نشطة حالياً</h3>
            <p className="text-sm text-slate-500 leading-relaxed">
              قم بفتح وردية جديدة وتسجيل مبلغ كاش البداية للبدء في تحصيل مبيعات الكافيه والمساحة وإجراء العمليات المالية.
            </p>
          </div>
          <Btn
            variant="primary"
            size="lg"
            icon={<Play size={18} />}
            onClick={() => { setErrorMsg(null); setShowStartModal(true); }}
          >
            بدء وردية جديدة الآن
          </Btn>
        </div>
      )}

      {/* ── Past Shifts Log Section (Owner / Operations Manager) ── */}
      {canViewAllShifts && (
        <Panel
          title="سجل ورادي العمل السابقة والجرد"
          icon={<History size={18} />}
          action={
            <span className="text-xs font-semibold text-slate-400">
              إجمالي الورديات المسجلة: {pastShifts.length}
            </span>
          }
        >
          {pastShifts.length === 0 ? (
            <EmptyState
              icon={<FileText size={32} />}
              title="لا توجد ورديات سابقة"
              sub="سوف تظهر سجلات الإغلاق والتسوية هنا فور إنهاء أول وردية."
            />
          ) : (
            <DataTable
              headers={[
                "تاريخ ووقت البداية",
                "الموظف المسؤول",
                "كاش البداية",
                "إجمالي المبيعات",
                "المصروفات",
                "الكاش الفعلي",
                "الفروقات والتسوية",
                "حالة الوردية",
              ]}
              rows={pastShifts.map((s) => {
                const isOpened = s.status === "open";
                const v = Number(s.actualCash ?? 0) - Number(s.endCash ?? 0);

                return [
                  <span key="st" className="ltr-value text-xs font-bold">{dateTime(s.startTime)}</span>,
                  <span key="u" className="font-bold text-slate-800">{s.user?.fullName || "—"}</span>,
                  <span key="sc" className="ltr-value text-xs font-semibold">{money(s.startCash)}</span>,
                  <span key="ts" className="ltr-value text-xs font-semibold text-emerald-700">{money(s.totalSales)}</span>,
                  <span key="te" className="ltr-value text-xs font-semibold text-rose-700">{money(s.totalExpenses)}</span>,
                  <span key="ac" className="ltr-value text-xs font-bold text-slate-900">{money(s.actualCash)}</span>,
                  <div key="vr">
                    {isOpened ? (
                      <span className="text-slate-400 text-xs">—</span>
                    ) : v === 0 ? (
                      <Badge tone="success">متطابق 100%</Badge>
                    ) : v < 0 ? (
                      <Badge tone="danger">عجز {money(v)}</Badge>
                    ) : (
                      <Badge tone="info">زيادة {money(v)}</Badge>
                    )}
                  </div>,
                  <Badge key="stt" tone={isOpened ? "success" : "neutral"}>
                    {isOpened ? "جارية" : "مغلقة"}
                  </Badge>,
                ];
              })}
            />
          )}
        </Panel>
      )}

      {/* ════════════════ Start Shift Modal ════════════════ */}
      <Modal
        isOpen={showStartModal}
        onClose={() => setShowStartModal(false)}
        title="بدء وردية كاشير جديدة"
        size="md"
      >
        <div className="space-y-5">
          <div className="flex items-center gap-3 rounded-2xl bg-amber-50 p-4 border border-amber-200/60">
            <Wallet size={24} className="text-amber-600 shrink-0" />
            <p className="text-xs font-medium text-amber-900 leading-relaxed">
              قم بعد النقود الموجودة بالفعل في درج الكاشير وإدخالها بدقة ككاش البداية قبل بدء العمليات.
            </p>
          </div>

          <FormField label="كاش البداية بالدرج (ج.م) *">
            <Input
              type="text"
              inputMode="decimal"
              autoFocus
              placeholder="مثال: 500"
              value={startCash}
              onChange={(e) => setStartCash(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && startCash && startMutation.mutate()}
            />
          </FormField>

          <div className="flex gap-2 pt-2">
            <Btn
              variant="primary"
              className="flex-1"
              loading={startMutation.isPending}
              disabled={!startCash || Number(startCash) < 0}
              onClick={() => startMutation.mutate()}
            >
              تأكيد وبدء الوردية
            </Btn>
            <Btn variant="ghost" onClick={() => setShowStartModal(false)}>
              إلغاء
            </Btn>
          </div>
        </div>
      </Modal>

      {/* ════════════════ Close & Reconcile Shift Modal ════════════════ */}
      <Modal
        isOpen={showCloseModal}
        onClose={() => setShowCloseModal(false)}
        title="إنهاء الوردية وجرد الدرج النقدي"
        size="lg"
      >
        <div className="space-y-5">
          {/* Shift Financial Breakdown Table */}
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 space-y-3">
            <h4 className="text-xs font-bold uppercase text-slate-500 tracking-wider">ملخص حسابات الوردية (السيستم)</h4>
            <div className="grid gap-2 text-xs">
              <div className="flex justify-between py-1 border-b border-slate-200/70">
                <span className="text-slate-600">كاش البداية بالدرج:</span>
                <span className="font-bold text-slate-900 ltr-value">{money(startAmount)}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-200/70">
                <span className="text-slate-600">(+) مبيعات الكاش النقدية:</span>
                <span className="font-bold text-emerald-700 ltr-value">+{money(cashSales)}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-200/70">
                <span className="text-slate-600">(-) المصروفات والسلف النقدية:</span>
                <span className="font-bold text-rose-700 ltr-value">-{money(cashExpenses)}</span>
              </div>
              <div className="flex justify-between py-2 font-black text-sm text-slate-900 bg-white px-3 rounded-lg border border-slate-200">
                <span>(=) الكاش المتوقع توفره في الدرج:</span>
                <span className="text-amber-600 ltr-value">{money(expectedCash)}</span>
              </div>
            </div>
          </div>

          <FormField label="الكاش الفعلي الموجود في الدرج الآن (ج.م) *">
            <Input
              type="text"
              inputMode="decimal"
              autoFocus
              placeholder="قم بعد النقدية الفعلية بالدرج وأدخل المبلغ"
              value={actualCash}
              onChange={(e) => setActualCash(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && actualCash && closeMutation.mutate()}
            />
          </FormField>

          {/* Real-time Live Variance Calculation Display */}
          {parsedActual !== null && (
            <div className={clsx(
              "rounded-xl p-4 border flex items-center justify-between text-xs font-bold transition-all",
              variance === 0
                ? "bg-emerald-50 border-emerald-200 text-emerald-800"
                : variance < 0
                ? "bg-rose-50 border-rose-200 text-rose-800"
                : "bg-blue-50 border-blue-200 text-blue-800"
            )}>
              <div className="flex items-center gap-2">
                {variance === 0 ? (
                  <CheckCircle2 size={18} className="text-emerald-600" />
                ) : (
                  <AlertTriangle size={18} className={variance < 0 ? "text-rose-600" : "text-blue-600"} />
                )}
                <span>
                  {variance === 0
                    ? "الدرج متطابق 100% مع حسابات السيستم"
                    : variance < 0
                    ? "يوجد عجز في الخزينة النقدية بمقدار:"
                    : "يوجد زيادة في الخزينة النقدية بمقدار:"}
                </span>
              </div>
              <span className="font-black text-sm ltr-value">
                {money(Math.abs(variance))}
              </span>
            </div>
          )}

          <FormField label="ملاحظات التسوية / سبب الفرق (إن وجد)">
            <Input
              placeholder="أدخل أي ملاحظات إضافية بخصوص الجرد..."
              value={closeNotes}
              onChange={(e) => setCloseNotes(e.target.value)}
            />
          </FormField>

          <div className="flex gap-2 pt-2">
            <Btn
              variant="danger"
              className="flex-1"
              loading={closeMutation.isPending}
              disabled={actualCash === "" || Number(actualCash) < 0}
              onClick={() => closeMutation.mutate()}
            >
              تأكيد إغلاق الوردية وحفظ الجرد
            </Btn>
            <Btn variant="ghost" onClick={() => setShowCloseModal(false)}>
              إلغاء
            </Btn>
          </div>
        </div>
      </Modal>
    </div>
  );
}
