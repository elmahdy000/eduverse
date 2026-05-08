"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { 
  Clock, PlayCircle, StopCircle, XCircle, Users, DoorOpen, 
  Timer, RefreshCw, Zap, History, CreditCard, Banknote, Search,
  ChevronRight, MoreHorizontal, UserPlus
} from "lucide-react";
import { api } from "../../../lib/api";
import { translateApiError } from "../../../lib/errors";
import { dateTime, money } from "../../../lib/format";
import { translateSessionType, translateStatus } from "../../../lib/labels";
import type { Customer, Paginated, Room, Session, Invoice } from "../../../lib/types";
import { Alert, Badge, Btn, DataTable, EmptyState, FormField, Panel, SectionTitle, Select, StatCard, statusBadgeTone, Modal, Input } from "../../../components/ui";
import { InvoiceReceipt } from "../../../components/InvoiceReceipt";
import clsx from "clsx";

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
        <style>
          body { margin: 0; padding: 0; background: white; }
          * { box-sizing: border-box; }
        </style>
      </head>
      <body>
        ${node.outerHTML}
        <script>
          setTimeout(() => {
            window.print();
            window.close();
          }, 250);
        </script>
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
    formatted: `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}` 
  };
}

function ActiveSessionCard({
  session,
  onClose,
  onCancel,
  isClosing,
  isCancelling,
}: {
  session: Session;
  onClose: (id: string) => void;
  onCancel: (id: string) => void;
  isClosing: boolean;
  isCancelling: boolean;
}) {
  const timer = useSessionTimer(session.startTime);
  
  return (
    <div className="group relative flex items-center justify-between rounded-xl border border-slate-100 bg-white p-3 transition-all hover:border-slate-200 hover:shadow-sm">
      <div className="flex items-center gap-4">
        <div className={clsx(
          "flex h-10 w-10 items-center justify-center rounded-xl transition-colors",
          timer.hours >= 3 ? "bg-amber-50 text-amber-600" : "bg-slate-50 text-slate-400"
        )}>
          <Timer size={18} className={timer.hours >= 3 ? "animate-pulse" : ""} />
        </div>
        
        <div className="space-y-0.5">
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold text-slate-900">
              {session.customer?.fullName ?? session.customerId.slice(0, 8)}
            </span>
            <Badge tone="info" className="h-4 px-1.5 text-[9px] uppercase tracking-tighter">
              {session.guestCode ?? "No Code"}
            </Badge>
          </div>
          <div className="flex items-center gap-3 text-[10px] font-medium text-slate-500">
            <span className="flex items-center gap-1">
              <DoorOpen size={10} />
              {session.room?.name ?? "المنطقة العامة"}
            </span>
            <span className="h-1 w-1 rounded-full bg-slate-300" />
            <span>{translateSessionType(session.sessionType)}</span>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-6">
        <div className="text-left">
          <div className={clsx(
            "font-mono text-sm font-bold",
            timer.hours >= 3 ? "text-amber-600" : "text-slate-900"
          )}>
            {timer.formatted}
          </div>
          <div className="text-[10px] font-bold text-slate-400">
            {session.chargeAmount ? money(session.chargeAmount) : "يحسب لاحقاً"}
          </div>
        </div>

        <div className="flex gap-1.5 opacity-0 transition-opacity group-hover:opacity-100">
          <button
            onClick={() => onClose(session.id)}
            disabled={isClosing}
            className="flex h-8 items-center gap-1.5 rounded-lg bg-slate-900 px-3 text-[10px] font-bold text-white transition hover:bg-slate-800 disabled:opacity-50"
          >
            {isClosing ? <RefreshCw size={12} className="animate-spin" /> : <StopCircle size={12} />}
            إنهاء
          </button>
          <button
            onClick={() => onCancel(session.id)}
            disabled={isCancelling}
            className="flex h-8 items-center justify-center rounded-lg bg-slate-50 px-2 text-slate-400 transition hover:bg-red-50 hover:text-red-600 disabled:opacity-50"
          >
            <XCircle size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}

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

  const availableBookings = useMemo(() => {
    if (!customerId) return [];
    return (bookingsQuery.data?.data ?? []).filter(b => b.customerId === customerId);
  }, [bookingsQuery.data, customerId]);

  const openMutation = useMutation({
    mutationFn: async () => api.post("/sessions", { 
      customerId, 
      sessionType, 
      roomId: roomId || undefined, 
      bookingId: bookingId || undefined,
      chargeAmount: chargeAmount ? Number(chargeAmount) : undefined 
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
      const closedSession = data?.data;
      queryClient.invalidateQueries({ queryKey: ["sessions"] });
      queryClient.invalidateQueries({ queryKey: ["invoices"] });
      if (closedSession?.invoice) setSelectedInvoice(closedSession.invoice);
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

  const sessions = sessionsQuery.data?.data ?? [];
  const active = sessions.filter((s) => s.status === "active");
  const closed = sessions.filter((s) => s.status === "closed");

  const filteredHistory = useMemo(() => {
    let result = sessions;
    if (tableStatusFilter !== "all") {
      result = result.filter(s => s.status === tableStatusFilter);
    }
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(s => 
        s.customer?.fullName?.toLowerCase().includes(q) || 
        s.guestCode?.toLowerCase().includes(q)
      );
    }
    return result;
  }, [sessions, tableStatusFilter, searchQuery]);

  return (
    <div className="max-w-[1400px] mx-auto p-6 space-y-8" dir="rtl">
      {/* Header Section */}
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900">الجلسات الحية</h1>
          <p className="text-xs font-bold text-slate-400 mt-1 uppercase tracking-widest">Real-time Session Management</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex h-10 items-center gap-3 rounded-xl bg-white border border-slate-100 px-4">
            <div className="flex items-center gap-1.5">
              <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[10px] font-bold text-slate-600 uppercase tracking-tight">{active.length} Active</span>
            </div>
          </div>
          <button 
            onClick={() => sessionsQuery.refetch()}
            className="flex h-10 w-10 items-center justify-center rounded-xl bg-white border border-slate-100 text-slate-400 transition hover:text-slate-900 hover:border-slate-200"
          >
            <RefreshCw size={16} className={sessionsQuery.isFetching ? "animate-spin" : ""} />
          </button>
        </div>
      </header>

      {message && (
        <div className={clsx(
          "flex items-center gap-3 rounded-xl border px-4 py-3 text-xs font-bold transition-all animate-in fade-in slide-in-from-top-2",
          message.ok ? "bg-emerald-50 border-emerald-100 text-emerald-700" : "bg-red-50 border-red-100 text-red-700"
        )}>
          {message.ok ? <Zap size={14} /> : <XCircle size={14} />}
          {message.text}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Opening & Active */}
        <div className="lg:col-span-8 space-y-8">
          
          {/* Active Sessions Grid */}
          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
                <Timer size={14} />
                الجلسات النشطة الآن
              </h3>
            </div>
            
            {active.length === 0 ? (
              <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-slate-50/50 p-12 text-center">
                <div className="h-12 w-12 rounded-full bg-white flex items-center justify-center text-slate-300 shadow-sm mb-4">
                  <DoorOpen size={24} />
                </div>
                <h4 className="text-sm font-bold text-slate-600">لا توجد جلسات نشطة</h4>
                <p className="text-[10px] font-medium text-slate-400 mt-1">ابدأ بفتح جلسة جديدة للعملاء</p>
              </div>
            ) : (
              <div className="grid gap-2">
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
          </section>

          {/* History / Filtered Table */}
          <section className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
                <History size={14} />
                سجل العمليات
              </h3>
              
              <div className="flex items-center gap-2">
                <div className="relative">
                  <Search size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input 
                    type="text"
                    placeholder="بحث سريع..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="h-9 w-48 rounded-lg border-none bg-slate-100 pr-9 pl-3 text-[10px] font-bold text-slate-900 outline-none transition focus:ring-2 focus:ring-slate-900/5"
                  />
                </div>
                <div className="flex h-9 items-center gap-1 rounded-lg bg-slate-100 p-1">
                  {(["all", "active", "closed", "cancelled"] as const).map((t) => (
                    <button
                      key={t}
                      onClick={() => setTableStatusFilter(t)}
                      className={clsx(
                        "rounded-md px-3 py-1 text-[10px] font-bold transition",
                        tableStatusFilter === t ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"
                      )}
                    >
                      {t === "all" ? "الكل" : translateStatus(t)}
                    </button>
                  ))}
                </div>
              </div>

              {/* Sessions Table */}
              <div className="overflow-x-auto rounded-2xl border border-slate-200">
                <table className="w-full text-right text-sm">
                  <thead className="border-b border-slate-100 bg-slate-50">
                    <tr>
                      <th className="px-4 py-3.5 text-xs font-black uppercase tracking-wider text-slate-500">العميل</th>
                      <th className="px-4 py-3.5 text-xs font-black uppercase tracking-wider text-slate-500">النوع</th>
                      <th className="px-4 py-3.5 text-xs font-black uppercase tracking-wider text-slate-500">الحالة</th>
                      <th className="px-4 py-3.5 text-xs font-black uppercase tracking-wider text-slate-500">البداية</th>
                      <th className="px-4 py-3.5 text-xs font-black uppercase tracking-wider text-slate-500">الغرفة</th>
                      <th className="px-4 py-3.5"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {allSessions.filter(s => {
                      if (tableStatusFilter === "all") return true;
                      return s.status === tableStatusFilter;
                    }).length === 0 ? (
                      <tr>
                        <td colSpan={6} className="py-14 text-center text-sm text-slate-400">
                          لا توجد جلسات
                        </td>
                      </tr>
                    ) : (
                      allSessions.filter(s => {
                        if (tableStatusFilter === "all") return true;
                        return s.status === tableStatusFilter;
                      }).map((session) => (
                        <tr key={session.id} className="transition-colors hover:bg-amber-50/40">
                          <td className="px-4 py-3.5 font-semibold text-slate-800">
                            {session.customer?.fullName ?? "—"}
                          </td>
                          <td className="px-4 py-3.5 text-slate-600 text-xs">
                            {translateSessionType(session.sessionType)}
                          </td>
                          <td className="px-4 py-3.5">
                            <Badge tone={statusBadgeTone(session.status)}>
                              {translateStatus(session.status)}
                            </Badge>
                          </td>
                          <td className="px-4 py-3.5 text-xs text-slate-500">
                            {dateTime(session.startTime)}
                          </td>
                          <td className="px-4 py-3.5 text-xs text-slate-500">
                            {session.room?.name ?? "—"}
                          </td>
                          <td className="px-4 py-3.5">
                            {session.status === "active" && (
                              <div className="flex gap-1.5">
                                <button
                                  onClick={() => closeSession(session.id)}
                                  disabled={closingSessionId === session.id}
                                  className="rounded-lg border border-slate-200 px-2.5 py-1 text-[10px] font-bold text-slate-600 hover:border-amber-300 hover:bg-amber-50 hover:text-amber-700 transition disabled:opacity-50"
                                >
                                  إغلاق
                                </button>
                              </div>
                            )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
