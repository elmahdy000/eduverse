"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Clock, PlayCircle, StopCircle, XCircle, Users, DoorOpen,
  Timer, RefreshCw, Zap, History, Search, ChevronRight
} from "lucide-react";
import { api } from "../../../lib/api";
import { translateApiError } from "../../../lib/errors";
import { dateTime, money } from "../../../lib/format";
import { translateSessionType, translateStatus } from "../../../lib/labels";
import type { Customer, Paginated, Room, Session, Invoice } from "../../../lib/types";
import {
  Alert, Badge, Btn, EmptyState, FormField, Input, Modal, Panel,
  SectionTitle, Select, StatCard, statusBadgeTone
} from "../../../components/ui";
import { InvoiceReceipt } from "../../../components/InvoiceReceipt";
import clsx from "clsx";

/* ─── helpers ─────────────────────────────────────────────── */
function printInvoiceOnly() {
  const node = document.getElementById("printable-invoice");
  if (!node) return window.print();
  const w = window.open("", "_blank", "width=400,height=600");
  if (!w) return window.print();
  w.document.write(`
    <html dir="rtl">
      <head>
        <meta charset="utf-8" />
        <title>طباعة فاتورة</title>
        <style>body { margin: 0; padding: 0; background: white; } * { box-sizing: border-box; }</style>
      </head>
      <body>
        ${node.outerHTML}
        <script>setTimeout(() => { window.print(); window.close(); }, 250);</script>
      </body>
    </html>
  `);
  w.document.close();
}

function downloadInvoiceSnapshot(invoice: Invoice) {
  const payload = { type: "invoice_snapshot", exportedAt: new Date().toISOString(), invoice };
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${invoice.invoiceNumber || invoice.id}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

/* ─── live timer ───────────────────────────────────────────── */
function useSessionTimer(startTime: string | null) {
  const [elapsed, setElapsed] = useState(0);
  useEffect(() => {
    if (!startTime) return;
    const start = new Date(startTime).getTime();
    const update = () => setElapsed(Math.floor((Date.now() - start) / 1000));
    update();
    const i = setInterval(update, 1000);
    return () => clearInterval(i);
  }, [startTime]);

  const h = Math.floor(elapsed / 3600);
  const m = Math.floor((elapsed % 3600) / 60);
  const s = elapsed % 60;
  return {
    hours: h,
    formatted: `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`,
  };
}

/* ─── active session card ──────────────────────────────────── */
function ActiveSessionCard({
  session, onClose, onCancel, isClosing, isCancelling,
}: {
  session: Session;
  onClose: (id: string) => void;
  onCancel: (id: string) => void;
  isClosing: boolean;
  isCancelling: boolean;
}) {
  const timer = useSessionTimer(session.startTime);
  const urgent = timer.hours >= 3;

  return (
    <div className={clsx(
      "group flex items-center justify-between rounded-xl border p-3 transition-all hover:shadow-sm",
      urgent ? "border-amber-200 bg-amber-50/50" : "border-slate-100 bg-white hover:border-slate-200"
    )}>
      <div className="flex items-center gap-3">
        <div className={clsx(
          "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl",
          urgent ? "bg-amber-100 text-amber-600" : "bg-slate-50 text-slate-400"
        )}>
          <Timer size={18} className={urgent ? "animate-pulse" : ""} />
        </div>
        <div className="space-y-0.5 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-bold text-slate-900 truncate">
              {session.customer?.fullName ?? session.customerId.slice(0, 8)}
            </span>
            <span className="shrink-0 rounded-full bg-blue-100 px-2 py-0.5 text-[9px] font-bold text-blue-700 uppercase tracking-tight">
              {session.guestCode ?? "—"}
            </span>
          </div>
          <div className="flex items-center gap-2 text-[10px] font-medium text-slate-400 flex-wrap">
            <span className="flex items-center gap-1">
              <DoorOpen size={10} />
              {session.room?.name ?? "المنطقة العامة"}
            </span>
            <span className="h-1 w-1 rounded-full bg-slate-300" />
            <span>{translateSessionType(session.sessionType)}</span>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-4 shrink-0">
        <div className="text-left hidden sm:block">
          <div className={clsx("font-mono text-sm font-bold", urgent ? "text-amber-600" : "text-slate-900")}>
            {timer.formatted}
          </div>
          <div className="text-[10px] font-bold text-slate-400">
            {session.chargeAmount ? money(session.chargeAmount) : "يحسب لاحقاً"}
          </div>
        </div>

        <div className="flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={() => onClose(session.id)}
            disabled={isClosing}
            className="flex h-8 items-center gap-1.5 rounded-lg bg-slate-900 px-3 text-[10px] font-bold text-white transition hover:bg-slate-700 disabled:opacity-50"
          >
            {isClosing ? <RefreshCw size={12} className="animate-spin" /> : <StopCircle size={12} />}
            إنهاء
          </button>
          <button
            onClick={() => onCancel(session.id)}
            disabled={isCancelling}
            className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 text-slate-400 transition hover:bg-red-50 hover:text-red-500 disabled:opacity-50"
          >
            <XCircle size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─── page ─────────────────────────────────────────────────── */
export default function SessionsPage() {
  const queryClient = useQueryClient();

  const [customerId, setCustomerId] = useState("");
  const [sessionType, setSessionType] = useState("hourly");
  const [roomId, setRoomId] = useState("");
  const [bookingId, setBookingId] = useState("");
  const [chargeAmount, setChargeAmount] = useState("");
  const [message, setMessage] = useState<{ text: string; ok: boolean } | null>(null);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [payAmount, setPayAmount] = useState("");
  const [payMethod, setPayMethod] = useState("cash");
  const [payNotes, setPayNotes] = useState("");
  const [tableStatusFilter, setTableStatusFilter] = useState<"all" | "active" | "closed" | "cancelled">("all");
  const [searchQuery, setSearchQuery] = useState("");

  /* queries */
  const sessionsQuery = useQuery({
    queryKey: ["sessions"],
    queryFn: async () => (await api.get("/sessions", { params: { page: 1, limit: 100 } })).data.data as Paginated<Session>,
    refetchInterval: 15_000,
  });
  const customersQuery = useQuery({
    queryKey: ["customers", "for-sessions"],
    queryFn: async () => (await api.get("/customers", { params: { page: 1, limit: 200 } })).data.data as Paginated<Customer>,
  });
  const roomsQuery = useQuery({
    queryKey: ["rooms", "for-sessions"],
    queryFn: async () => (await api.get("/rooms", { params: { page: 1, limit: 50 } })).data.data as Paginated<Room>,
  });
  const bookingsQuery = useQuery({
    queryKey: ["bookings", "active"],
    queryFn: async () => (await api.get("/bookings", { params: { status: "confirmed", page: 1, limit: 50 } })).data.data as Paginated<any>,
  });

  const availableBookings = useMemo(
    () => (bookingsQuery.data?.data ?? []).filter((b: any) => b.customerId === customerId),
    [bookingsQuery.data, customerId]
  );

  /* mutations */
  const openMutation = useMutation({
    mutationFn: async () => api.post("/sessions", {
      customerId, sessionType,
      roomId: roomId || undefined,
      bookingId: bookingId || undefined,
      chargeAmount: chargeAmount ? Number(chargeAmount) : undefined,
    }),
    onSuccess: () => {
      setCustomerId(""); setSessionType("hourly"); setRoomId(""); setBookingId(""); setChargeAmount("");
      setMessage({ text: "تم فتح الجلسة بنجاح.", ok: true });
      queryClient.invalidateQueries({ queryKey: ["sessions"] });
      queryClient.invalidateQueries({ queryKey: ["bookings"] });
      setTimeout(() => setMessage(null), 3000);
    },
    onError: (err: unknown) => setMessage({ text: translateApiError((err as any)?.response?.data?.message), ok: false }),
  });

  const closeMutation = useMutation({
    mutationFn: async (sessionId: string) => (await api.post(`/sessions/${sessionId}/close`, { notes: "تم الإنهاء من شاشة الإدارة" })).data,
    onSuccess: (data: any) => {
      setMessage({ text: "تم إنهاء الجلسة بنجاح.", ok: true });
      queryClient.invalidateQueries({ queryKey: ["sessions"] });
      queryClient.invalidateQueries({ queryKey: ["invoices"] });
      if (data?.data?.invoice) setSelectedInvoice(data.data.invoice);
      setTimeout(() => setMessage(null), 3000);
    },
    onError: (err: unknown) => setMessage({ text: translateApiError((err as any)?.response?.data?.message), ok: false }),
  });

  const cancelMutation = useMutation({
    mutationFn: async (sessionId: string) => api.post(`/sessions/${sessionId}/cancel`),
    onSuccess: () => {
      setMessage({ text: "تم إلغاء الجلسة.", ok: true });
      queryClient.invalidateQueries({ queryKey: ["sessions"] });
      setTimeout(() => setMessage(null), 3000);
    },
    onError: (err: unknown) => setMessage({ text: translateApiError((err as any)?.response?.data?.message), ok: false }),
  });

  const payMutation = useMutation({
    mutationFn: () => api.post("/payments", {
      invoiceId: selectedInvoice?.id,
      paymentMethod: payMethod,
      amount: Number(payAmount || selectedInvoice?.remainingAmount),
      notes: payNotes || undefined,
    }),
    onSuccess: (res) => {
      setPayAmount(""); setPayNotes("");
      setMessage({ text: "تم التحصيل بنجاح.", ok: true });
      setSelectedInvoice(res.data.data.invoice);
      queryClient.invalidateQueries({ queryKey: ["sessions"] });
      queryClient.invalidateQueries({ queryKey: ["invoices"] });
    },
    onError: (err: unknown) => setMessage({ text: translateApiError((err as any)?.response?.data?.message), ok: false }),
  });

  /* derived */
  const sessions = sessionsQuery.data?.data ?? [];
  const active = sessions.filter((s) => s.status === "active");
  const closed = sessions.filter((s) => s.status === "closed");

  const filteredHistory = useMemo(() => {
    let result = sessions;
    if (tableStatusFilter !== "all") result = result.filter((s) => s.status === tableStatusFilter);
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter((s) =>
        s.customer?.fullName?.toLowerCase().includes(q) || s.guestCode?.toLowerCase().includes(q)
      );
    }
    return result;
  }, [sessions, tableStatusFilter, searchQuery]);

  /* ─── render ─── */
  return (
    <div className="space-y-6" dir="rtl">
      {/* Header */}
      <SectionTitle
        title="الجلسات"
        subtitle="إدارة الجلسات النشطة والسجل الكامل للعمليات."
        icon={<Clock size={20} />}
        action={
          <button
            onClick={() => sessionsQuery.refetch()}
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-400 transition hover:border-slate-300 hover:text-slate-700"
          >
            <RefreshCw size={15} className={sessionsQuery.isFetching ? "animate-spin" : ""} />
          </button>
        }
      />

      {/* Alert */}
      {message && <Alert tone={message.ok ? "success" : "danger"}>{message.text}</Alert>}

      {/* Stats row */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard label="نشطة الآن"    value={active.length}         tone="success" icon={<PlayCircle size={16} />} />
        <StatCard label="مغلقة اليوم"  value={closed.length}         icon={<StopCircle size={16} />} />
        <StatCard label="إجمالي اليوم" value={sessions.length}       icon={<Users size={16} />} />
        <StatCard label="الغرف"        value={roomsQuery.data?.data?.length ?? 0} icon={<DoorOpen size={16} />} />
      </div>

      {/* Main grid */}
      <div className="grid gap-6 xl:grid-cols-[1fr_340px]">

        {/* ── Left column ──────────────────────────────── */}
        <div className="space-y-6 min-w-0">

          {/* Active sessions */}
          <Panel
            title={`الجلسات النشطة (${active.length})`}
            icon={<Timer size={15} />}
          >
            {active.length === 0 ? (
              <EmptyState
                title="لا توجد جلسات نشطة"
                sub="ابدأ بفتح جلسة جديدة للعملاء"
                icon={<DoorOpen size={24} className="text-slate-300" />}
              />
            ) : (
              <div className="space-y-2">
                {active.map((s) => (
                  <ActiveSessionCard
                    key={s.id}
                    session={s}
                    onClose={closeMutation.mutate}
                    onCancel={cancelMutation.mutate}
                    isClosing={closeMutation.isPending}
                    isCancelling={cancelMutation.isPending}
                  />
                ))}
              </div>
            )}
          </Panel>

          {/* History table */}
          <Panel
            title="سجل الجلسات"
            icon={<History size={15} />}
            action={
              <div className="flex items-center gap-2">
                {/* Search */}
                <div className="relative">
                  <Search size={13} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    placeholder="بحث..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="h-8 w-36 rounded-lg border border-slate-200 bg-white pr-8 pl-2 text-xs outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-900/5"
                  />
                </div>
                {/* Filter tabs */}
                <div className="flex h-8 items-center gap-0.5 rounded-lg border border-slate-200 bg-slate-50 p-0.5">
                  {(["all", "active", "closed", "cancelled"] as const).map((t) => (
                    <button
                      key={t}
                      onClick={() => setTableStatusFilter(t)}
                      className={clsx(
                        "rounded-md px-2.5 py-1 text-[10px] font-bold transition whitespace-nowrap",
                        tableStatusFilter === t ? "bg-white text-slate-900 shadow-sm" : "text-slate-400 hover:text-slate-700"
                      )}
                    >
                      {t === "all" ? "الكل" : translateStatus(t)}
                    </button>
                  ))}
                </div>
              </div>
            }
          >
            <div className="overflow-x-auto">
              <table className="w-full text-right text-sm">
                <thead>
                  <tr className="border-b border-slate-100 text-[10px] font-black uppercase tracking-wider text-slate-400">
                    <th className="pb-3 pr-1">العميل</th>
                    <th className="pb-3 px-3">النوع</th>
                    <th className="pb-3 px-3">الحالة</th>
                    <th className="pb-3 px-3">البداية</th>
                    <th className="pb-3 px-3">الغرفة</th>
                    <th className="pb-3" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {filteredHistory.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-sm text-slate-400">
                        لا توجد جلسات
                      </td>
                    </tr>
                  ) : (
                    filteredHistory.map((session: Session) => (
                      <tr key={session.id} className="group transition-colors hover:bg-slate-50">
                        <td className="py-3 pr-1 font-semibold text-slate-800">
                          {session.customer?.fullName ?? "—"}
                        </td>
                        <td className="py-3 px-3 text-xs text-slate-500">
                          {translateSessionType(session.sessionType)}
                        </td>
                        <td className="py-3 px-3">
                          <Badge tone={statusBadgeTone(session.status)}>
                            {translateStatus(session.status)}
                          </Badge>
                        </td>
                        <td className="py-3 px-3 text-xs text-slate-400 whitespace-nowrap">
                          {dateTime(session.startTime)}
                        </td>
                        <td className="py-3 px-3 text-xs text-slate-400">
                          {session.room?.name ?? "—"}
                        </td>
                        <td className="py-3">
                          {session.status === "active" && (
                            <button
                              onClick={() => closeMutation.mutate(session.id)}
                              disabled={closeMutation.isPending}
                              className="rounded-lg border border-slate-200 px-2.5 py-1 text-[10px] font-bold text-slate-600 opacity-0 transition hover:border-amber-300 hover:bg-amber-50 hover:text-amber-700 group-hover:opacity-100 disabled:opacity-50"
                            >
                              إغلاق
                            </button>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </Panel>
        </div>

        {/* ── Right column ─────────────────────────────── */}
        <div className="space-y-6">

          {/* Open new session form */}
          <Panel title="فتح جلسة جديدة" icon={<DoorOpen size={15} />}>
            <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); openMutation.mutate(); }}>
              <FormField label="العميل">
                <Select value={customerId} onChange={(e) => setCustomerId(e.target.value)} required>
                  <option value="">-- اختر العميل --</option>
                  {customersQuery.data?.data?.map((c) => (
                    <option key={c.id} value={c.id}>{c.fullName} ({c.phoneNumber})</option>
                  ))}
                </Select>
              </FormField>

              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
                <FormField label="نوع الجلسة">
                  <Select value={sessionType} onChange={(e) => setSessionType(e.target.value)}>
                    <option value="hourly">ساعة (أو جزء)</option>
                    <option value="room">غرفة (حجز)</option>
                    <option value="day_pass">يومي (Day Pass)</option>
                  </Select>
                </FormField>
                <FormField label="الغرفة (اختياري)">
                  <Select value={roomId} onChange={(e) => setRoomId(e.target.value)}>
                    <option value="">-- بدون غرفة --</option>
                    {roomsQuery.data?.data?.map((r) => (
                      <option key={r.id} value={r.id}>{r.name}</option>
                    ))}
                  </Select>
                </FormField>
              </div>

              {availableBookings.length > 0 && (
                <FormField label="ربط بحجز مؤكد">
                  <Select value={bookingId} onChange={(e) => setBookingId(e.target.value)}>
                    <option value="">-- اختر الحجز --</option>
                    {availableBookings.map((b: any) => (
                      <option key={b.id} value={b.id}>{dateTime(b.startTime)} — {b.room?.name}</option>
                    ))}
                  </Select>
                </FormField>
              )}

              <FormField label="مبلغ الخدمة (اختياري)">
                <Input
                  type="number"
                  value={chargeAmount}
                  onChange={(e) => setChargeAmount(e.target.value)}
                  placeholder="0.00"
                />
              </FormField>

              <Btn type="submit" loading={openMutation.isPending} loadingText="جاري الفتح..." className="w-full" icon={<Zap size={14} />}>
                فتح الجلسة الآن
              </Btn>
            </form>
          </Panel>

      {/* ── Invoice Modal ── */}
      <Modal
        isOpen={!!selectedInvoice}
        onClose={() => setSelectedInvoice(null)}
        size="lg"
        title="فاتورة العميل"
      >
        {selectedInvoice && (
          <div className="space-y-6">
            <div id="printable-invoice">
              <InvoiceReceipt
                invoice={selectedInvoice}
                onPrint={printInvoiceOnly}
                onDownload={() => downloadInvoiceSnapshot(selectedInvoice)}
              />
            </div>

            {Number(selectedInvoice.remainingAmount) > 0 && (
              <div className="rounded-3xl border border-amber-100 bg-amber-50/50 p-6">
                <form
                  className="space-y-4"
                  onSubmit={(e: FormEvent) => {
                    e.preventDefault();
                    payMutation.mutate();
                  }}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <div className="h-2 w-2 rounded-full bg-amber-500 animate-pulse" />
                    <p className="text-sm font-black text-amber-900">تحصيل المبلغ المتبقي</p>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <FormField label="المبلغ المستلم">
                      <Input
                        type="number"
                        min={0.01}
                        step={0.01}
                        value={payAmount}
                        onChange={(e) => setPayAmount(e.target.value)}
                        placeholder={String(selectedInvoice.remainingAmount)}
                        className="bg-white"
                      />
                    </FormField>
                    <FormField label="طريقة الدفع">
                      <Select
                        value={payMethod}
                        onChange={(e) => setPayMethod(e.target.value)}
                        className="bg-white"
                      >
                        <option value="cash">نقدي 💵</option>
                        <option value="card">بطاقة 💳</option>
                        <option value="bank_transfer">تحويل بنكي 🏦</option>
                      </Select>
                    </FormField>
                  </div>
                  <Btn
                    type="submit"
                    variant="primary"
                    loading={payMutation.isPending}
                    className="w-full shadow-lg shadow-amber-200"
                  >
                    تأكيد تحصيل {money(Number(payAmount) || 0)}
                  </Btn>
                </form>
              </div>
            )}

            <div className="flex justify-center pt-2">
              <button
                onClick={() => setSelectedInvoice(null)}
                className="text-xs font-bold text-slate-400 hover:text-slate-600 transition-colors"
              >
                إغلاق المعاينة
              </button>
            </div>
          </div>
        )}
      </Modal>
        </div>
      </div>
    </div>
  );
}
