"use client";

import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  Clock, PlayCircle, StopCircle, XCircle, Users, DoorOpen,
  Timer, RefreshCw, Zap, History, Search, ChevronRight,
  Coffee
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
import { InvoiceReceipt, SessionCloseSummary, printThermalInvoice } from "../../../components/InvoiceReceipt";
import clsx from "clsx";

/* ─── helpers ─────────────────────────────────────────────── */

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
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!startTime) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      setElapsed(0);
      return;
    }
    const start = new Date(startTime).getTime();
    const update = () => setElapsed(Math.floor((Date.now() - start) / 1000));
    update();
    // Clear any existing interval before creating new one
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    intervalRef.current = setInterval(update, 1000);
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
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
  const searchParams = useSearchParams();

  const [customerId, setCustomerId] = useState(() => searchParams.get("customerId") ?? "");
  const [sessionType, setSessionType] = useState("hourly");
  const [billingType, setBillingType] = useState("hourly_individual");
  const [roomId, setRoomId] = useState("");
  const [bookingId, setBookingId] = useState("");
  const [chargeAmount, setChargeAmount] = useState("");
  const [message, setMessage] = useState<{ text: string; ok: boolean } | null>(null);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  // معلومات الجلسة المقفولة للملخص (المدة + عدد أصناف البار)
  const [closedInfo, setClosedInfo] = useState<{ durationMinutes?: number | null } | null>(null);
  const [pendingSessionAction, setPendingSessionAction] = useState<{ id: string; action: "close" | "cancel"; customerName?: string; session?: Session } | null>(null);
  const [closeDiscount, setCloseDiscount] = useState("");
  const [payAmount, setPayAmount] = useState("");
  const [payMethod, setPayMethod] = useState("cash");
  const [payNotes, setPayNotes] = useState("");
  const [tableStatusFilter, setTableStatusFilter] = useState<"all" | "active" | "closed" | "cancelled">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [customerSearchQuery, setCustomerSearchQuery] = useState("");
  const [isCustomerDropdownOpen, setIsCustomerDropdownOpen] = useState(false);

  const [selectedCustomerObj, setSelectedCustomerObj] = useState<Customer | null>(null);

  /* queries */
  const sessionsQuery = useQuery({
    queryKey: ["sessions"],
    queryFn: async () => (await api.get("/sessions", { params: { page: 1, limit: 100 } })).data.data as Paginated<Session>,
    refetchInterval: 15_000,
  });
  const customersQuery = useQuery({
    queryKey: ["customers", "for-sessions", customerSearchQuery],
    queryFn: async () => {
      const params: Record<string, any> = { page: 1, limit: 100 };
      if (customerSearchQuery.trim()) {
        params.name = customerSearchQuery.trim();
      }
      const response = await api.get("/customers", { params });
      return response.data.data as Paginated<Customer>;
    },
  });
  const roomsQuery = useQuery({
    queryKey: ["rooms", "for-sessions"],
    queryFn: async () => (await api.get("/rooms", { params: { page: 1, limit: 50 } })).data.data as Paginated<Room>,
  });
  const bookingsQuery = useQuery({
    queryKey: ["bookings", "for-sessions"],
    queryFn: async () => (await api.get("/bookings", { params: { status: "confirmed", page: 1, limit: 50 } })).data.data as Paginated<any>,
  });
  const currentShiftQuery = useQuery({
    queryKey: ["shifts", "current"],
    queryFn: async () => {
      try {
        const response = await api.get("/shifts/current");
        return response.data || null;
      } catch {
        return null;
      }
    },
  });

  const availableBookings = useMemo(
    () => (bookingsQuery.data?.data ?? []).filter((b: any) => b.customerId === customerId),
    [bookingsQuery.data, customerId]
  );

  const selectedCustomer = useMemo(() => {
    if (!customerId) return null;
    return selectedCustomerObj || (customersQuery.data?.data ?? []).find((c) => c.id === customerId) || null;
  }, [customerId, selectedCustomerObj, customersQuery.data]);

  const filteredCustomers = useMemo(() => {
    return customersQuery.data?.data ?? [];
  }, [customersQuery.data]);

  /* mutations */
  const openMutation = useMutation({
    mutationFn: async () => api.post("/sessions", {
      customerId, sessionType, billingType,
      roomId: roomId || undefined,
      bookingId: bookingId || undefined,
      chargeAmount: chargeAmount ? Number(chargeAmount) : undefined,
    }),
    onSuccess: () => {
      setCustomerId(""); setSelectedCustomerObj(null); setSessionType("hourly"); setRoomId(""); setBookingId(""); setChargeAmount("");
      setMessage({ text: "تم فتح الجلسة بنجاح.", ok: true });
      queryClient.invalidateQueries({ queryKey: ["sessions"] });
      queryClient.invalidateQueries({ queryKey: ["bookings"] });
      setTimeout(() => setMessage(null), 3000);
    },
    onError: (err: unknown) => setMessage({ text: translateApiError((err as any)?.response?.data?.message), ok: false }),
  });

  const closeMutation = useMutation({
    mutationFn: async ({ sessionId, chargeOverride }: { sessionId: string; chargeOverride?: number }) =>
      (await api.post(`/sessions/${sessionId}/close`, {
        notes: "تم الإنهاء من شاشة الإدارة",
        ...(chargeOverride !== undefined ? { chargeAmount: chargeOverride } : {}),
      })).data,
    onSuccess: (data: any) => {
      setMessage({ text: "تم إنهاء الجلسة بنجاح.", ok: true });
      queryClient.invalidateQueries({ queryKey: ["sessions"] });
      queryClient.invalidateQueries({ queryKey: ["invoices"] });
      queryClient.invalidateQueries({ queryKey: ["bookings"] });
      if (data?.data?.invoice) setSelectedInvoice(data.data.invoice);
      setClosedInfo({ durationMinutes: data?.data?.durationMinutes ?? null });
      setCloseDiscount("");
      setTimeout(() => setMessage(null), 3000);
    },
    onError: (err: unknown) => setMessage({ text: translateApiError((err as any)?.response?.data?.message), ok: false }),
  });

  const cancelMutation = useMutation({
    mutationFn: async (sessionId: string) => api.post(`/sessions/${sessionId}/cancel`),
    onSuccess: () => {
      setMessage({ text: "تم إلغاء الجلسة.", ok: true });
      queryClient.invalidateQueries({ queryKey: ["sessions"] });
      queryClient.invalidateQueries({ queryKey: ["bookings"] });
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

  // النهاردة بالتاريخ المحلي (مش UTC) — للإحصائيات
  const isToday = (value?: string | null) => {
    if (!value) return false;
    const d = new Date(value);
    const now = new Date();
    return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth() && d.getDate() === now.getDate();
  };
  const closedToday = closed.filter((s) => isToday(s.endTime) || isToday(s.startTime));
  const startedToday = sessions.filter((s) => isToday(s.startTime));

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
        <StatCard label="مغلقة اليوم"  value={closedToday.length}    icon={<StopCircle size={16} />} />
        <StatCard label="إجمالي اليوم" value={startedToday.length}   icon={<Users size={16} />} />
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
                    onClose={(id) => setPendingSessionAction({ id, action: "close", customerName: s.customer?.fullName, session: s })}
                    onCancel={(id) => setPendingSessionAction({ id, action: "cancel", customerName: s.customer?.fullName })}
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
                              onClick={() => setPendingSessionAction({ id: session.id, action: "close", customerName: session.customer?.fullName, session })}
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
                {selectedCustomer ? (
                  <div className="relative rounded-xl border border-blue-200 bg-blue-50/20 p-3 flex items-center justify-between transition-all hover:bg-blue-50/40">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-slate-800">{selectedCustomer.fullName}</span>
                        <Badge tone={
                          selectedCustomer.customerType === "student" ? "info" :
                          selectedCustomer.customerType === "employee" ? "success" :
                          selectedCustomer.customerType === "trainer" ? "warn" : "default"
                        }>
                          {selectedCustomer.customerType === "student" ? "طالب" :
                           selectedCustomer.customerType === "employee" ? "موظف" :
                           selectedCustomer.customerType === "trainer" ? "مدرب" : "زائر"}
                        </Badge>
                      </div>
                      <div className="text-xs text-slate-500 flex items-center gap-1.5">
                        <span>{selectedCustomer.phoneNumber}</span>
                        {selectedCustomer.college && (
                          <>
                            <span className="h-1.5 w-1.5 rounded-full bg-slate-300 shrink-0" />
                            <span>{selectedCustomer.college}</span>
                          </>
                        )}
                        {selectedCustomer.employerName && (
                          <>
                            <span className="h-1.5 w-1.5 rounded-full bg-slate-300 shrink-0" />
                            <span>{selectedCustomer.employerName}</span>
                          </>
                        )}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setCustomerId("");
                        setCustomerSearchQuery("");
                      }}
                      className="rounded-lg bg-white border border-slate-200 px-2.5 py-1 text-xs font-bold text-slate-500 transition hover:border-red-200 hover:bg-red-50 hover:text-red-600"
                    >
                      تغيير
                    </button>
                  </div>
                ) : (
                  <div className="relative">
                    <div className="relative">
                      <Search size={15} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
                      <Input
                        type="text"
                        placeholder="ابحث بالاسم أو رقم الهاتف..."
                        value={customerSearchQuery}
                        onChange={(e) => {
                          setCustomerSearchQuery(e.target.value);
                          setIsCustomerDropdownOpen(true);
                        }}
                        onFocus={() => setIsCustomerDropdownOpen(true)}
                        className="pr-10"
                      />
                    </div>
                    
                    {isCustomerDropdownOpen && (
                      <>
                        <div 
                          className="fixed inset-0 z-40" 
                          onClick={() => setIsCustomerDropdownOpen(false)}
                        />
                        <div className="absolute right-0 top-full z-50 mt-1 max-h-60 w-full overflow-y-auto rounded-xl border border-slate-200 bg-white shadow-lg divide-y divide-slate-100">
                          {filteredCustomers.length === 0 ? (
                            <div className="p-3 text-center text-xs text-slate-400">
                              لا يوجد عملاء يطابقون البحث
                            </div>
                          ) : (
                            filteredCustomers.map((c) => (
                              <button
                                key={c.id}
                                type="button"
                                onClick={() => {
                                  setCustomerId(c.id);
                                  setSelectedCustomerObj(c);
                                  setIsCustomerDropdownOpen(false);
                                  setCustomerSearchQuery("");
                                }}
                                className="w-full text-right px-3 py-2 text-sm transition hover:bg-slate-50 flex items-center justify-between"
                              >
                                <div className="space-y-0.5">
                                  <div className="font-semibold text-slate-700">{c.fullName}</div>
                                  <div className="text-xs text-slate-400 flex items-center gap-1.5">
                                    <span>{c.phoneNumber}</span>
                                    {c.college && (
                                      <>
                                        <span className="h-1 w-1 rounded-full bg-slate-300" />
                                        <span>{c.college}</span>
                                      </>
                                    )}
                                  </div>
                                </div>
                                <Badge tone={
                                  c.customerType === "student" ? "info" :
                                  c.customerType === "employee" ? "success" :
                                  c.customerType === "trainer" ? "warn" : "default"
                                }>
                                  {c.customerType === "student" ? "طالب" :
                                   c.customerType === "employee" ? "موظف" :
                                   c.customerType === "trainer" ? "مدرب" : "زائر"}
                                </Badge>
                              </button>
                            ))
                          )}
                        </div>
                      </>
                    )}
                  </div>
                )}
              </FormField>

              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
                <FormField label="نمط المحاسبة والجلسة">
                  <Select 
                    value={billingType} 
                    onChange={(e) => {
                      setBillingType(e.target.value);
                      if (e.target.value === "daily") setSessionType("daily");
                      else if (e.target.value === "subscription_covered") setSessionType("package");
                      else setSessionType("hourly");
                    }}
                  >
                    <option value="hourly_individual">👤 فردي بالساعة</option>
                    <option value="hourly_room">🏢 غرفة بالكامل بالساعة (ميتنج/تدريب)</option>
                    <option value="flat_event">📌 سعر ثابت للمحاضرة / الحدث</option>
                    <option value="subscription_covered">💳 مشمولة بباقة العميل (يومي/أسبوعي/شهري)</option>
                    <option value="daily">☀️ يومي (Day Pass)</option>
                  </Select>
                </FormField>
                <FormField label="الغرفة (اختياري)">
                  <Select value={roomId} onChange={(e) => setRoomId(e.target.value)}>
                    <option value="">-- بدون غرفة (مساحة مشتركة) --</option>
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
                  type="text"
                  inputMode="decimal"
                  value={chargeAmount}
                  onChange={(e) => setChargeAmount(e.target.value)}
                  placeholder="0.00"
                />
              </FormField>

              <Btn 
                type="submit" 
                loading={openMutation.isPending} 
                loadingText="جاري الفتح..." 
                className="w-full" 
                disabled={!customerId}
                icon={<Zap size={14} />}
              >
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
            <SessionCloseSummary
              invoice={selectedInvoice}
              durationMinutes={closedInfo?.durationMinutes}
            />
            <InvoiceReceipt
              invoice={selectedInvoice}
              onPrint={printThermalInvoice}
              onDownload={() => downloadInvoiceSnapshot(selectedInvoice)}
            />

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
                        type="text"
                        inputMode="decimal"
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
                        <option value="cash">نقدي</option>
                        <option value="card">بطاقة</option>
                        <option value="bank_transfer">تحويل بنكي</option>
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

      {/* ── مودال تأكيد إنهاء/إلغاء الجلسة ── */}
      <Modal
        isOpen={Boolean(pendingSessionAction)}
        onClose={() => { setPendingSessionAction(null); setCloseDiscount(""); }}
        title={pendingSessionAction?.action === "close" ? "إنهاء الجلسة وإصدار الفاتورة" : "إلغاء الجلسة"}
        size="sm"
      >
        {(() => {
          if (!pendingSessionAction) return null;
          const sess = pendingSessionAction.session;
          const isClose = pendingSessionAction.action === "close";

          // Is this a meeting/lecture room billed at 200 EGP/hr?
          const MEETING_RATE = 200;
          const isMeetingOrLecture = isClose && sess?.room && (
            sess.billingType === "hourly_room" ||
            sess.room.name?.toLowerCase().includes("lecture") ||
            sess.room.name?.toLowerCase().includes("ميتنج") ||
            sess.room.name?.toLowerCase().includes("meeting")
          );

          // Live elapsed hours (from startTime to now)
          const elapsedMinutes = sess?.startTime
            ? Math.ceil((Date.now() - new Date(sess.startTime).getTime()) / 60000)
            : 0;
          const elapsedHours = Math.max(1, Math.ceil(elapsedMinutes / 60));
          const baseAmount = isMeetingOrLecture ? elapsedHours * MEETING_RATE : null;
          const discountVal = Number(closeDiscount) || 0;
          const finalAmount = baseAmount !== null ? Math.max(0, baseAmount - discountVal) : null;

          return (
            <div className="space-y-4">
              {isClose && !currentShiftQuery.data && (
                <Alert tone="danger">
                  تنبيه: لا يوجد وردية (Shift) مفتوحة حالياً. يجب فتح وردية أولاً لتتمكن من إغلاق الجلسة.
                  <br />
                  <Link href="/shifts" className="underline font-bold hover:text-red-800 transition-colors">افتح وردية جديدة</Link>
                </Alert>
              )}

              {/* Smart price breakdown for meeting/lecture rooms */}
              {isMeetingOrLecture && baseAmount !== null && (
                <div className="rounded-2xl border border-amber-200 bg-amber-50/60 p-4 space-y-3">
                  <p className="text-xs font-black text-amber-900 flex items-center gap-1.5">
                    <Coffee size={14} /> حساب الجلسة — {sess?.room?.name}
                  </p>
                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div className="rounded-xl bg-white border border-amber-100 p-2">
                      <p className="text-[10px] font-bold text-slate-500">المدة</p>
                      <p className="text-base font-black text-slate-900 font-mono">{elapsedHours} س</p>
                    </div>
                    <div className="rounded-xl bg-white border border-amber-100 p-2">
                      <p className="text-[10px] font-bold text-slate-500">السعر/ساعة</p>
                      <p className="text-base font-black text-amber-700 font-mono">{MEETING_RATE} ج</p>
                    </div>
                    <div className="rounded-xl bg-white border border-amber-100 p-2">
                      <p className="text-[10px] font-bold text-slate-500">الإجمالي</p>
                      <p className="text-base font-black text-emerald-700 font-mono">{baseAmount} ج</p>
                    </div>
                  </div>

                  {/* Discount field */}
                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-1">خصم (جنيه) — اختياري</label>
                    <input
                      type="text"
                      inputMode="decimal"
                      value={closeDiscount}
                      onChange={(e) => setCloseDiscount(e.target.value)}
                      placeholder="0"
                      className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-bold text-slate-900 outline-none focus:border-amber-500 font-mono"
                    />
                  </div>

                  {/* Final amount */}
                  <div className="flex items-center justify-between rounded-xl bg-emerald-600 text-white px-4 py-2.5">
                    <span className="text-xs font-black">المبلغ النهائي بعد الخصم</span>
                    <span className="text-lg font-black font-mono">{finalAmount} جنيه</span>
                  </div>
                </div>
              )}

              {/* Default message for non-meeting sessions */}
              {!isMeetingOrLecture && (
                <Alert tone={isClose ? "warn" : "danger"}>
                  {isClose
                    ? `سيتم إنهاء جلسة ${pendingSessionAction.customerName ?? "العميل"} وحساب المدة وإصدار الفاتورة.`
                    : `سيتم إلغاء جلسة ${pendingSessionAction?.customerName ?? "العميل"} بدون إصدار فاتورة. هل أنت متأكد؟`}
                </Alert>
              )}

              <div className="flex gap-2">
                <Btn
                  variant={isClose ? "warn" : "danger"}
                  loading={closeMutation.isPending || cancelMutation.isPending}
                  disabled={isClose && !currentShiftQuery.data}
                  onClick={() => {
                    if (!pendingSessionAction) return;
                    if (pendingSessionAction.action === "close") {
                      closeMutation.mutate(
                        {
                          sessionId: pendingSessionAction.id,
                          chargeOverride: finalAmount !== null ? finalAmount : undefined,
                        },
                        { onSuccess: () => setPendingSessionAction(null) }
                      );
                    } else {
                      cancelMutation.mutate(pendingSessionAction.id, {
                        onSuccess: () => setPendingSessionAction(null),
                      });
                    }
                  }}
                >
                  {isClose ? `إنهاء وإصدار الفاتورة${finalAmount !== null ? ` — ${finalAmount} ج` : ""}` : "تأكيد الإلغاء"}
                </Btn>
                <Btn variant="ghost" onClick={() => { setPendingSessionAction(null); setCloseDiscount(""); }}>رجوع</Btn>
              </div>
            </div>
          );
        })()}
      </Modal>
        </div>
      </div>
    </div>
  );
}
