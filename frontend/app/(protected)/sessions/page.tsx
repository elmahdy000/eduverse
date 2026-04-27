"use client";

import { FormEvent, useMemo, useState, useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Clock, PlayCircle, StopCircle, XCircle, Users, DoorOpen, Timer, RefreshCw, Zap } from "lucide-react";
import { api } from "../../../lib/api";
import { translateApiError } from "../../../lib/errors";
import { dateTime, money } from "../../../lib/format";
import { translateSessionType, translateStatus } from "../../../lib/labels";
import type { Customer, Paginated, Room, Session } from "../../../lib/types";
import { Alert, Badge, Btn, DataTable, EmptyState, FormField, Panel, SectionTitle, Select, StatCard, statusBadgeTone } from "../../../components/ui";
import clsx from "clsx";

function useSessionTimer(startTime: string | null) {
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    if (!startTime) return;
    const start = new Date(startTime).getTime();
    const update = () => setElapsed(Math.floor((Date.now() - start) / 1000));
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [startTime]);

  const hours = Math.floor(elapsed / 3600);
  const minutes = Math.floor((elapsed % 3600) / 60);
  const seconds = elapsed % 60;

  return {
    elapsed,
    formatted: `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`,
    hours,
  };
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
  const isLong = timer.hours >= 2;

  return (
    <tr className="border-b border-slate-100 hover:bg-slate-50 transition">
      <td className="py-2 pr-3 font-medium text-slate-900">{session.customer?.fullName ?? session.customerId.slice(0, 8)}</td>
      <td className="py-2 pr-3 text-xs text-slate-600">{translateSessionType(session.sessionType)}</td>
      <td className="py-2 pr-3 text-xs text-slate-600">{session.room?.name ?? <span className="text-slate-400">—</span>}</td>
      <td className="py-2 pr-3 text-xs text-slate-500">{dateTime(session.startTime)}</td>
      <td className="py-2 pr-3">
        <span className={clsx("font-mono text-xs font-bold", isLong ? "text-amber-600" : "text-emerald-600")}>
          <Timer size={12} className="inline mr-1" />
          {timer.formatted}
        </span>
      </td>
      <td className="py-2 pr-3 text-xs font-semibold text-emerald-700">
        {session.chargeAmount ? money(session.chargeAmount) : <span className="text-slate-400">—</span>}
      </td>
      <td className="py-2 pl-3">
        <div className="flex gap-1">
          <Btn size="sm" variant="success" onClick={() => onClose(session.id)} loading={isClosing} icon={<StopCircle size={12} />}>إغلاق</Btn>
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

  const sessionsQuery = useQuery({
    queryKey: ["sessions"],
    queryFn: async () => {
      const r = await api.get("/sessions", { params: { page: 1, limit: 50 } });
      return r.data.data as Paginated<Session>;
    },
    refetchInterval: 30_000,
  });

  const customersQuery = useQuery({
    queryKey: ["customers", "for-sessions"],
    queryFn: async () => {
      const r = await api.get("/customers", { params: { page: 1, limit: 100 } });
      return r.data.data as Paginated<Customer>;
    },
  });

  const roomsQuery = useQuery({
    queryKey: ["rooms", "for-sessions"],
    queryFn: async () => {
      const r = await api.get("/rooms", { params: { page: 1, limit: 100 } });
      return r.data.data as Paginated<Room>;
    },
  });

  const openMutation = useMutation({
    mutationFn: async () => {
      await api.post("/sessions", {
        customerId,
        sessionType,
        roomId: roomId || undefined,
        chargeAmount: chargeAmount ? Number(chargeAmount) : undefined,
      });
    },
    onSuccess: () => {
      setCustomerId(""); setSessionType("hourly"); setRoomId(""); setChargeAmount("");
      setMessage({ text: "تم فتح المدة بنجاح.", ok: true });
      queryClient.invalidateQueries({ queryKey: ["sessions"] });
    },
    onError: (err: unknown) => {
      const m = (err as { response?: { data?: { message?: string | string[] } } })?.response?.data?.message;
      setMessage({ text: translateApiError(m), ok: false });
    },
  });

  const closeMutation = useMutation({
    mutationFn: async (sessionId: string) => {
      await api.post(`/sessions/${sessionId}/close`, { notes: "أُغلقت من واجهة الاستقبال" });
      return sessionId;
    },
    onSuccess: async (sessionId: string) => {
      setMessage({ text: "تم إغلاق المدة وجاري إنشاء الفاتورة...", ok: true });
      queryClient.invalidateQueries({ queryKey: ["sessions"] });
      try {
        await api.post("/invoices", { sessionId });
        setMessage({ text: "تم إغلاق المدة وإنشاء الفاتورة بنجاح!", ok: true });
        queryClient.invalidateQueries({ queryKey: ["invoices"] });
      } catch {
        setMessage({ text: "تم إغلاق المدة (فشل إنشاء الفاتورة التلقائية)", ok: false });
      }
    },
    onError: (err: unknown) => {
      const m = (err as { response?: { data?: { message?: string | string[] } } })?.response?.data?.message;
      setMessage({ text: translateApiError(m), ok: false });
    },
  });

  const cancelMutation = useMutation({
    mutationFn: async (sessionId: string) => {
      await api.post(`/sessions/${sessionId}/cancel`);
    },
    onSuccess: () => {
      setMessage({ text: "تم إلغاء المدة.", ok: true });
      queryClient.invalidateQueries({ queryKey: ["sessions"] });
    },
    onError: (err: unknown) => {
      const m = (err as { response?: { data?: { message?: string | string[] } } })?.response?.data?.message;
      setMessage({ text: translateApiError(m), ok: false });
    },
  });

  function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setMessage(null);
    openMutation.mutate();
  }

  const sessions = sessionsQuery.data?.data ?? [];
  const active = sessions.filter((s) => s.status === "active");
  const closed = sessions.filter((s) => s.status === "closed");
  const cancelled = sessions.filter((s) => s.status === "cancelled");

  const allRows = useMemo(() =>
    sessions.map((s) => [
      s.customer?.fullName ?? "—",
      translateSessionType(s.sessionType),
      s.room?.name ?? "—",
      <Badge key="st" tone={statusBadgeTone(s.status)}>{translateStatus(s.status)}</Badge>,
      <span key="t" className="text-xs text-slate-500">{dateTime(s.startTime)}</span>,
    ]),
    [sessions],
  );

  return (
    <div className="space-y-6" dir="rtl">
      <SectionTitle
        title="الجلسات"
        subtitle="افتح مدة جديدة لأي عميل، وتحكم في المدد النشطة من مكان واحد."
        icon={<Clock size={20} />}
        action={
          <button onClick={() => sessionsQuery.refetch()} className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 transition hover:bg-slate-50">
            <RefreshCw size={12} /> تحديث
          </button>
        }
      />

      {message && <Alert tone={message.ok ? "success" : "danger"}>{message.text}</Alert>}

      <div className="grid gap-3 sm:grid-cols-3">
        <StatCard label="المدد النشطة" value={active.length} tone="info" icon={<Timer size={18} />} sub="داخل المكان الآن" />
        <StatCard label="المدد المغلقة" value={closed.length} icon={<StopCircle size={18} />} />
        <StatCard label="المدد الملغاة" value={cancelled.length} icon={<XCircle size={18} />} />
      </div>

      {/* Open Session Form */}
      <Panel title="فتح مدة جديدة" icon={<PlayCircle size={15} />}>
        <form className="grid gap-4 md:grid-cols-2 lg:grid-cols-4" onSubmit={onSubmit}>
          <FormField label="العميل">
            <Select value={customerId} onChange={(e) => setCustomerId(e.target.value)} required>
              <option value="">اختر العميل</option>
              {customersQuery.data?.data?.map((c) => (
                <option key={c.id} value={c.id}>{c.fullName} — {c.phoneNumber}</option>
              ))}
            </Select>
          </FormField>

          <FormField label="نوع المدة">
            <Select value={sessionType} onChange={(e) => setSessionType(e.target.value)}>
              <option value="hourly">بالساعة</option>
              <option value="daily">يومي</option>
              <option value="package">باقة</option>
              <option value="booking_linked">مرتبط بحجز</option>
            </Select>
          </FormField>

          <FormField label="الغرفة (اختياري)">
            {roomsQuery.isLoading ? (
              <p className="text-sm text-slate-500">جاري تحميل الغرف...</p>
            ) : roomsQuery.isError ? (
              <p className="text-sm text-rose-600">فشل تحميل الغرف</p>
            ) : (
              <Select value={roomId} onChange={(e) => setRoomId(e.target.value)}>
                <option value="">بدون غرفة</option>
                {roomsQuery.data?.data?.map((r) => (
                  <option key={r.id} value={r.id}>{r.name}</option>
                ))}
              </Select>
            )}
          </FormField>

          <FormField label="المبلغ (اختياري)">
            <input
              type="number" min={0} step={0.01}
              value={chargeAmount}
              onChange={(e) => setChargeAmount(e.target.value)}
              placeholder="0.00"
              className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-right text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-slate-900 focus:ring-2 focus:ring-slate-900/10"
            />
          </FormField>

          <div className="md:col-span-2 lg:col-span-4">
            <Btn type="submit" loading={openMutation.isPending} loadingText="جاري الفتح..." className="w-full" icon={<Zap size={14} />}>
              فتح المدة
            </Btn>
          </div>
        </form>
      </Panel>

      {/* Active Sessions Live Table */}
      {active.length > 0 && (
        <Panel
          title="المدد النشطة — إجراءات سريعة"
          icon={<Timer size={15} />}
          action={
            <span className="rounded-full bg-blue-100 px-2 py-0.5 text-xs font-bold text-blue-700">{active.length}</span>
          }
        >
          <div className="overflow-x-auto">
            <table className="w-full text-right text-sm">
              <thead>
                <tr className="border-b border-slate-100">
                  {["العميل", "النوع", "الغرفة", "من", "المدة", "المبلغ", "إجراء"].map((h) => (
                    <th key={h} className="py-2 pr-3 text-xs font-semibold text-slate-500 last:text-left">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {active.map((s) => (
                  <ActiveSessionRow
                    key={s.id}
                    session={s}
                    onClose={closeMutation.mutate}
                    onCancel={cancelMutation.mutate}
                    isClosing={closeMutation.isPending}
                    isCancelling={cancelMutation.isPending}
                  />
                ))}
              </tbody>
            </table>
          </div>
        </Panel>
      )}

      {active.length === 0 && !sessionsQuery.isLoading && (
        <Panel title="المدد النشطة" icon={<Users size={15} />}>
          <EmptyState icon={<DoorOpen size={36} />} title="مفيش حد جوه دلوقتي" sub="افتح مدة جديدة من الأعلى." />
        </Panel>
      )}

      {/* All Sessions */}
      <Panel title="كل المدد" icon={<Clock size={15} />}>
        {sessionsQuery.isLoading ? (
          <div className="flex justify-center py-10"><RefreshCw size={20} className="animate-spin text-slate-400" /></div>
        ) : sessions.length === 0 ? (
          <EmptyState icon={<Clock size={36} />} title="لا توجد مدد" sub="سيظهر هنا كل سجل المدد." />
        ) : (
          <DataTable
            headers={["العميل", "النوع", "الغرفة", "الحالة", "وقت البدء"]}
            rows={allRows}
            filterable
          />
        )}
      </Panel>
    </div>
  );
}
