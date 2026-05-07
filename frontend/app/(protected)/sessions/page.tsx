"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Clock, PlayCircle, StopCircle, XCircle, Users, DoorOpen, Timer, RefreshCw, Zap, History, CreditCard, Banknote } from "lucide-react";
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
  const w = window.open("", "_blank", "width=900,height=700");
  if (!w) return window.print();
  w.document.write(`<html dir="rtl"><head><meta charset="utf-8" /><title>فاتورة</title></head><body>${node.outerHTML}</body></html>`);
  w.document.close();
  w.focus();
  w.print();
  w.close();
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
  return { hours: h, formatted: `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}` };
}

function ActiveSessionRow({
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
    <tr className="border-b border-slate-100 hover:bg-slate-50 transition">
      <td className="py-2 pr-3 font-medium text-slate-900">{session.customer?.fullName ?? session.customerId.slice(0, 8)}</td>
      <td className="py-2 pr-3 text-xs text-slate-600">{translateSessionType(session.sessionType)}</td>
      <td className="py-2 pr-3 text-xs text-slate-600">{session.room?.name ?? <span className="text-slate-400">-</span>}</td>
      <td className="py-2 pr-3"><Badge tone="info">{session.guestCode ?? "-"}</Badge></td>
      <td className="py-2 pr-3 text-xs text-slate-500">{dateTime(session.startTime)}</td>
      <td className="py-2 pr-3">
        <span className={clsx("font-mono text-xs font-bold", timer.hours >= 2 ? "text-amber-600" : "text-emerald-600")}>
          <Timer size={12} className="inline mr-1" />
          {timer.formatted}
        </span>
      </td>
      <td className="py-2 pr-3 text-xs font-semibold text-emerald-700">{session.chargeAmount ? money(session.chargeAmount) : <span className="text-slate-400">-</span>}</td>
      <td className="py-2 pl-3">
        <div className="flex gap-1">
          <Btn size="sm" variant="success" onClick={() => onClose(session.id)} loading={isClosing} icon={<StopCircle size={12} />}>إنهاء</Btn>
          <Btn size="sm" variant="danger" onClick={() => onCancel(session.id)} loading={isCancelling} icon={<XCircle size={12} />}>إلغاء</Btn>
        </div>
      </td>
    </tr>
  );
}

export default function SessionsPage() {
  const queryClient = useQueryClient();
  const [customerId, setCustomerId] = useState("");
  const [sessionType, setSessionType] = useState("hourly");
  const [roomId, setRoomId] = useState("");
  const [chargeAmount, setChargeAmount] = useState("");
  const [message, setMessage] = useState<{ text: string; ok: boolean } | null>(null);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [payAmount, setPayAmount] = useState("");
  const [payMethod, setPayMethod] = useState("cash");
  const [payNotes, setPayNotes] = useState("");

  const sessionsQuery = useQuery({
    queryKey: ["sessions"],
    queryFn: async () => (await api.get("/sessions", { params: { page: 1, limit: 50 } })).data.data as Paginated<Session>,
    refetchInterval: 30_000,
  });
  const customersQuery = useQuery({
    queryKey: ["customers", "for-sessions"],
    queryFn: async () => (await api.get("/customers", { params: { page: 1, limit: 100 } })).data.data as Paginated<Customer>,
  });
  const roomsQuery = useQuery({
    queryKey: ["rooms", "for-sessions"],
    queryFn: async () => (await api.get("/rooms", { params: { page: 1, limit: 100 } })).data.data as Paginated<Room>,
  });

  const openMutation = useMutation({
    mutationFn: async () => api.post("/sessions", { customerId, sessionType, roomId: roomId || undefined, chargeAmount: chargeAmount ? Number(chargeAmount) : undefined }),
    onSuccess: () => {
      setCustomerId(""); setSessionType("hourly"); setRoomId(""); setChargeAmount("");
      setMessage({ text: "تم فتح الجلسة بنجاح.", ok: true });
      queryClient.invalidateQueries({ queryKey: ["sessions"] });
    },
    onError: (err: unknown) => setMessage({ text: translateApiError((err as any)?.response?.data?.message), ok: false }),
  });

  const closeMutation = useMutation({
    mutationFn: async (sessionId: string) => (await api.post(`/sessions/${sessionId}/close`, { notes: "اتقفلت من شاشة الجلسات" })).data,
    onSuccess: (data: any) => {
      setMessage({ text: "تم إنهاء الجلسة وإنشاء الفاتورة.", ok: true });
      const closedSession = data?.data;
      queryClient.setQueryData(["sessions"], (prev: any) => {
        if (!prev?.data || !closedSession?.id) return prev;
        return {
          ...prev,
          data: prev.data.map((s: any) => s.id === closedSession.id ? { ...s, status: "closed", endTime: closedSession.endTime, guestCode: null } : s),
        };
      });
      queryClient.invalidateQueries({ queryKey: ["sessions"] });
      queryClient.invalidateQueries({ queryKey: ["invoices"] });
      if (closedSession?.invoice) setSelectedInvoice(closedSession.invoice);
    },
    onError: (err: unknown) => setMessage({ text: translateApiError((err as any)?.response?.data?.message), ok: false }),
  });

  const cancelMutation = useMutation({
    mutationFn: async (sessionId: string) => api.post(`/sessions/${sessionId}/cancel`),
    onSuccess: () => {
      setMessage({ text: "تم إلغاء الجلسة.", ok: true });
      queryClient.invalidateQueries({ queryKey: ["sessions"] });
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
      setMessage({ text: "تم تسجيل الدفع بنجاح.", ok: true });
      setSelectedInvoice(res.data.data.invoice);
      queryClient.invalidateQueries({ queryKey: ["sessions"] });
      queryClient.invalidateQueries({ queryKey: ["invoices"] });
    },
    onError: (err: unknown) => setMessage({ text: translateApiError((err as any)?.response?.data?.message), ok: false }),
  });

  const onSubmit = (e: FormEvent<HTMLFormElement>) => { e.preventDefault(); setMessage(null); openMutation.mutate(); };

  const sessions = sessionsQuery.data?.data ?? [];
  const active = sessions.filter((s) => s.status === "active");
  const closed = sessions.filter((s) => s.status === "closed");
  const cancelled = sessions.filter((s) => s.status === "cancelled");

  const allRows = useMemo(() => sessions.map((s) => [
    s.customer?.fullName ?? "-",
    translateSessionType(s.sessionType),
    s.room?.name ?? "-",
    <Badge key="gc" tone="info">{s.guestCode ?? "-"}</Badge>,
    <Badge key="st" tone={statusBadgeTone(s.status)}>{translateStatus(s.status)}</Badge>,
    <span key="t" className="text-xs text-slate-500">{dateTime(s.startTime)}</span>,
  ]), [sessions]);

  return (
    <div className="space-y-6" dir="rtl">
      <SectionTitle
        title="الجلسات"
        subtitle="نشط هنا يعني الجلسة شغالة، مش حالة العميل نفسه."
        icon={<Clock size={20} />}
        action={<button onClick={() => sessionsQuery.refetch()} className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 transition hover:bg-slate-50"><RefreshCw size={12} /> تحديث</button>}
      />

      {message && <Alert tone={message.ok ? "success" : "danger"}>{message.text}</Alert>}

      <div className="grid gap-3 sm:grid-cols-3">
        <StatCard label="جلسات شغالة" value={active.length} tone="info" icon={<Timer size={18} />} sub="دي الجلسات اللي لسه مفتوحة" />
        <StatCard label="جلسات متقفلة" value={closed.length} icon={<StopCircle size={18} />} />
        <StatCard label="جلسات ملغية" value={cancelled.length} icon={<XCircle size={18} />} />
      </div>

      <Panel title="فتح جلسة جديدة" icon={<PlayCircle size={15} />}>
        <form className="grid gap-4 md:grid-cols-2 lg:grid-cols-4" onSubmit={onSubmit}>
          <FormField label="العميل">
            <Select value={customerId} onChange={(e) => setCustomerId(e.target.value)} required>
              <option value="">اختار العميل</option>
              {customersQuery.data?.data?.map((c) => <option key={c.id} value={c.id}>{c.fullName} - {c.phoneNumber}</option>)}
            </Select>
          </FormField>

          <FormField label="نوع الجلسة">
            <Select value={sessionType} onChange={(e) => setSessionType(e.target.value)}>
              <option value="hourly">بالساعة</option>
              <option value="daily">يومي</option>
              <option value="package">باقة</option>
              <option value="booking_linked">مرتبط بحجز</option>
            </Select>
          </FormField>

          <FormField label="الغرفة (اختياري)">
            {roomsQuery.isLoading ? <p className="text-sm text-slate-500">جاري تحميل الغرف...</p> : (
              <Select value={roomId} onChange={(e) => setRoomId(e.target.value)}>
                <option value="">بدون غرفة</option>
                {roomsQuery.data?.data?.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
              </Select>
            )}
          </FormField>

          <FormField label="المبلغ (اختياري)">
            <input type="number" min={0} step={0.01} value={chargeAmount} onChange={(e) => setChargeAmount(e.target.value)} placeholder="0.00" className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-right text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-slate-900 focus:ring-2 focus:ring-slate-900/10" />
          </FormField>

          <div className="md:col-span-2 lg:col-span-4">
            <Btn type="submit" loading={openMutation.isPending} loadingText="جاري الفتح..." className="w-full" icon={<Zap size={14} />}>فتح الجلسة</Btn>
          </div>
        </form>
      </Panel>

      {active.length > 0 && (
        <Panel title="الجلسات الشغالة - إجراءات سريعة" icon={<Timer size={15} />} action={<span className="rounded-full bg-blue-100 px-2 py-0.5 text-xs font-bold text-blue-700">{active.length}</span>}>
          <div className="overflow-x-auto">
            <table className="w-full text-right text-sm">
              <thead><tr className="border-b border-slate-100">{["العميل", "النوع", "الغرفة", "كود الطلب", "من", "المدة", "المبلغ", "إجراء"].map((h) => <th key={h} className="py-2 pr-3 text-xs font-semibold text-slate-500 last:text-left">{h}</th>)}</tr></thead>
              <tbody>{active.map((s) => <ActiveSessionRow key={s.id} session={s} onClose={closeMutation.mutate} onCancel={cancelMutation.mutate} isClosing={closeMutation.isPending} isCancelling={cancelMutation.isPending} />)}</tbody>
            </table>
          </div>
        </Panel>
      )}

      {active.length === 0 && !sessionsQuery.isLoading && (
        <Panel title="الجلسات الشغالة" icon={<Users size={15} />}>
          <EmptyState icon={<DoorOpen size={36} />} title="مفيش جلسات شغالة دلوقتي" sub="افتح جلسة جديدة من فوق." />
        </Panel>
      )}

      <Panel title="كل الجلسات" icon={<Clock size={15} />}>
        {sessionsQuery.isLoading ? <div className="flex justify-center py-10"><RefreshCw size={20} className="animate-spin text-slate-400" /></div> : sessions.length === 0 ? (
          <EmptyState icon={<Clock size={36} />} title="لا توجد جلسات" sub="هيظهر هنا سجل الجلسات." />
        ) : (
          <Panel title="سجل الجلسات" icon={<History size={16} />} className="overflow-hidden">
            <DataTable headers={["العميل", "النوع", "المكان", "كود الطلب", "الحالة", "وقت البداية"]} rows={allRows} />
          </Panel>
        )}
      </Panel>

      <Modal isOpen={!!selectedInvoice} onClose={() => setSelectedInvoice(null)} size="lg">
        {selectedInvoice && (
          <div className="space-y-6">
            <InvoiceReceipt invoice={selectedInvoice} onPrint={printInvoiceOnly} onDownload={() => downloadInvoiceSnapshot(selectedInvoice)} />

            {selectedInvoice.paymentStatus !== "paid" && (
              <Panel title="تحصيل سريع للمبلغ" icon={<CreditCard size={16} />} className="border-emerald-100 bg-emerald-50/10">
                <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); payMutation.mutate(); }}>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <FormField label="طريقة الدفع">
                      <Select value={payMethod} onChange={(e) => setPayMethod(e.target.value)}>
                        <option value="cash">نقدي (كاش)</option>
                        <option value="card">بطاقة بنكية</option>
                        <option value="bank_transfer">تحويل بنكي</option>
                      </Select>
                    </FormField>
                    <FormField label="المبلغ (جنيه)">
                      <Input type="number" min={0.01} step={0.01} value={payAmount || String(selectedInvoice.remainingAmount)} onChange={(e) => setPayAmount(e.target.value)} placeholder={String(selectedInvoice.remainingAmount)} required />
                    </FormField>
                  </div>
                  <FormField label="ملاحظات (اختياري)">
                    <Input value={payNotes} onChange={(e) => setPayNotes(e.target.value)} placeholder="أي ملاحظة على الدفع" />
                  </FormField>
                  <Btn type="submit" loading={payMutation.isPending} loadingText="جاري التحصيل..." icon={<Banknote size={16} />} className="w-full bg-emerald-600 hover:bg-emerald-700">
                    تأكيد تحصيل {money(payAmount || selectedInvoice.remainingAmount)}
                  </Btn>
                </form>
              </Panel>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}
