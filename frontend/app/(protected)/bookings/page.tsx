"use client";

import { useState, FormEvent, useEffect, useMemo } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useSearchParams } from "next/navigation";
import { 
  ChevronLeft, ChevronRight, Calendar, Clock, User, MapPin, 
  Plus, RefreshCw, X, Search, Filter, LayoutGrid, List,
  CheckCircle2, AlertCircle, Ban, History, Users, Zap,
  PlayCircle, CheckCircle
} from "lucide-react";
import { api } from "../../../lib/api";
import { translateApiError } from "../../../lib/errors";
import { dateTime, money } from "../../../lib/format";
import { translateStatus } from "../../../lib/labels";
import type { Booking, Customer, Paginated, Room } from "../../../lib/types";
import { 
  Alert, Badge, Btn, DataTable, DateTimeInput, EmptyState, Modal, Panel, SectionTitle, StatCard, 
  statusBadgeTone, FormField, Input, Select, TableSkeleton, CardSkeleton 
} from "../../../components/ui";
import clsx from "clsx";

function toIso(datetimeLocal: string) {
  return new Date(datetimeLocal).toISOString();
}

// مفتاح تاريخ باليوم المحلي (مش UTC) — عشان الحجوزات المسائية ماتتنقلش لليوم الغلط
function localDateKey(date: Date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export default function BookingsPage() {
  const queryClient = useQueryClient();

  const searchParams = useSearchParams();
  const [customerId, setCustomerId] = useState(() => searchParams.get("customerId") ?? "");
  const [roomId, setRoomId] = useState("");
  const [bookingType, setBookingType] = useState("meeting");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [participantCount, setParticipantCount] = useState("");
  const [totalAmount, setTotalAmount] = useState("0");
  const [depositAmount, setDepositAmount] = useState("");
  const [notes, setNotes] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [message, setMessage] = useState<{ text: string; ok: boolean } | null>(null);
  const [selectedBookingId, setSelectedBookingId] = useState<string | null>(() => searchParams.get("id"));
  const [bookingAction, setBookingAction] = useState<{ bookingId: string; action: "complete" | "cancel" | "no-show" } | null>(null);
  const [bookingActionReason, setBookingActionReason] = useState("");

  const [viewMode, setViewMode] = useState<"calendar" | "list">("calendar");
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [newStatus, setNewStatus] = useState<string>("");
  const [currentWeekStart, setCurrentWeekStart] = useState(() => {
    const now = new Date();
    const day = now.getDay();
    const diff = now.getDate() - day + (day === 0 ? -6 : 1);
    return new Date(now.setDate(diff));
  });

  const bookingsQuery = useQuery({
    queryKey: ["bookings", statusFilter],
    queryFn: async () => {
      const response = await api.get("/bookings", {
        params: { page: 1, limit: 200, status: statusFilter || undefined },
      });
      return response.data.data as Paginated<Booking>;
    },
  });

  const [customerSearchQuery, setCustomerSearchQuery] = useState("");
  const [isCustomerDropdownOpen, setIsCustomerDropdownOpen] = useState(false);
  const [selectedCustomerObj, setSelectedCustomerObj] = useState<Customer | null>(null);

  const customersQuery = useQuery({
    queryKey: ["customers", "for-bookings", customerSearchQuery],
    queryFn: async () => {
      const params: Record<string, any> = { page: 1, limit: 100 };
      if (customerSearchQuery.trim()) {
        params.name = customerSearchQuery.trim();
      }
      const response = await api.get("/customers", { params });
      return response.data.data as Paginated<Customer>;
    },
  });

  const selectedCustomer = useMemo(() => {
    if (!customerId) return null;
    return selectedCustomerObj || (customersQuery.data?.data ?? []).find((c) => c.id === customerId) || null;
  }, [customerId, selectedCustomerObj, customersQuery.data]);

  const filteredCustomers = useMemo(() => {
    return customersQuery.data?.data ?? [];
  }, [customersQuery.data]);

  const roomsQuery = useQuery({
    queryKey: ["rooms", "for-bookings"],
    retry: 0,
    queryFn: async () => {
      const response = await api.get("/rooms", { params: { page: 1, limit: 100 } });
      return response.data.data as Paginated<Room>;
    },
  });

  const conflictsQuery = useQuery({
    queryKey: ["bookings", "conflicts", roomId, startTime, endTime],
    queryFn: async () => {
      if (!roomId || !startTime || !endTime) return null;
      try {
        const response = await api.get("/bookings/conflicts", {
          params: {
            roomId,
            startTime: toIso(startTime),
            endTime: toIso(endTime),
          },
        });
        return response.data.data;
      } catch (err) {
        console.error("Conflict check failed:", err);
        throw err;
      }
    },
    enabled: Boolean(roomId && startTime && endTime),
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      await api.post("/bookings", {
        customerId,
        roomId,
        bookingType,
        startTime: toIso(startTime),
        endTime: toIso(endTime),
        participantCount: participantCount ? Number(participantCount) : undefined,
        totalAmount: Number(totalAmount),
        depositAmount: depositAmount ? Number(depositAmount) : undefined,
        notes: notes || undefined,
      });
    },
    onSuccess: () => {
      setCustomerId(""); setSelectedCustomerObj(null); setRoomId(""); setBookingType("meeting"); setStartTime(""); setEndTime("");
      setParticipantCount(""); setTotalAmount("0"); setDepositAmount(""); setNotes("");
      setMessage({ text: "تم تسجيل الحجز بنجاح.", ok: true });
      queryClient.invalidateQueries({ queryKey: ["bookings"] });
      setTimeout(() => setMessage(null), 3000);
    },
    onError: (error: unknown) => {
      const apiMessage = (error as any)?.response?.data?.message;
      setMessage({ text: translateApiError(apiMessage), ok: false });
    },
  });

  const bookingStatusMutation = useMutation({
    mutationFn: async ({ bookingId, action, reason }: { bookingId: string; action: "complete" | "cancel" | "no-show"; reason?: string }) => {
      if (action === "complete") return api.post(`/bookings/${bookingId}/complete`);
      if (action === "no-show") return api.post(`/bookings/${bookingId}/no-show`);
      return api.post(`/bookings/${bookingId}/cancel`, { reason: reason || "تم الإلغاء من قبل الإدارة" });
    },
    onSuccess: () => {
      setMessage({ text: "تم تحديث حالة الحجز بنجاح.", ok: true });
      queryClient.invalidateQueries({ queryKey: ["bookings"] });
      setTimeout(() => setMessage(null), 3000);
    },
    onError: (error: unknown) => {
      setMessage({ text: translateApiError((error as any)?.response?.data?.message), ok: false });
    },
  });

  const updateBookingMutation = useMutation({
    mutationFn: async ({ bookingId, status }: { bookingId: string; status: string }) => {
      await api.put(`/bookings/${bookingId}`, { status });
    },
    onSuccess: () => {
      setMessage({ text: "تم تحديث الحالة بنجاح.", ok: true });
      queryClient.invalidateQueries({ queryKey: ["bookings"] });
      setNewStatus("");
      setTimeout(() => setMessage(null), 3000);
    },
    onError: (error: unknown) => {
      setMessage({ text: translateApiError((error as any)?.response?.data?.message), ok: false });
    },
  });

  const startSessionMutation = useMutation({
    mutationFn: async (booking: Booking) => {
      await api.post("/sessions", {
        customerId: booking.customer?.id,
        roomId: booking.room?.id,
        bookingId: booking.id,
        sessionType: "booking_linked",
      });
    },
    onSuccess: () => {
      setMessage({ text: "تم بدء الجلسة بنجاح. يتم الآن الانتقال لصفحة الجلسات...", ok: true });
      setTimeout(() => {
        window.location.href = "/sessions";
      }, 1500);
    },
    onError: (error: unknown) => {
      setMessage({ text: translateApiError((error as any)?.response?.data?.message), ok: false });
    },
  });

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (conflictsQuery.isPending || conflictsQuery.isError) {
      setMessage({ text: "تعذر التأكد من إتاحة الغرفة. راجع الاتصال ثم حاول مرة أخرى.", ok: false });
      return;
    }
    if (conflictsQuery.data?.hasConflict) {
      setMessage({ text: "لا يمكن تأكيد الحجز بسبب تعارض الموعد.", ok: false });
      return;
    }
    createMutation.mutate();
  };

  const bookings = bookingsQuery.data?.data ?? [];
  
  const weekDates = useMemo(() => {
    const dates = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date(currentWeekStart);
      date.setDate(date.getDate() + i);
      dates.push(date);
    }
    return dates;
  }, [currentWeekStart]);

  const bookingsByDay = useMemo(() => {
    const map: Record<string, Booking[]> = {};
    weekDates.forEach((date: Date) => map[localDateKey(date)] = []);
    bookings.forEach((b: Booking) => {
      const dateStr = localDateKey(new Date(b.startTime));
      if (map[dateStr]) map[dateStr].push(b);
    });
    return map;
  }, [weekDates, bookings]);

  const changeWeek = (weeks: number) => {
    const newStart = new Date(currentWeekStart);
    newStart.setDate(newStart.getDate() + (weeks * 7));
    setCurrentWeekStart(newStart);
  };

  const arabicDays = ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];

  return (
    <div className="min-w-0 space-y-8 overflow-x-hidden animate-in fade-in duration-700" dir="rtl">
      <SectionTitle 
        title="إدارة الحجوزات" 
        subtitle="تنظيم حجوزات القاعات والفعاليات القادمة."
        icon={<Calendar size={20} />}
        action={
          <div className="flex flex-wrap gap-2">
            <button 
              onClick={() => { queryClient.invalidateQueries({ queryKey: ["bookings"] }); }}
              className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50 transition"
            >
              <RefreshCw size={12} className={bookingsQuery.isFetching ? "animate-spin" : ""} /> تحديث
            </button>
            <div className="flex rounded-lg bg-slate-100 p-0.5">
              <button 
                onClick={() => setViewMode("calendar")}
                className={clsx(
                  "flex items-center gap-1.5 rounded-md px-2.5 py-1 text-[10px] font-bold transition",
                  viewMode === "calendar" ? "bg-white text-slate-900 shadow-sm" : "text-slate-400 hover:text-slate-700"
                )}
              >
                <LayoutGrid size={12} /> تقويم
              </button>
              <button 
                onClick={() => setViewMode("list")}
                className={clsx(
                  "flex items-center gap-1.5 rounded-md px-2.5 py-1 text-[10px] font-bold transition",
                  viewMode === "list" ? "bg-white text-slate-900 shadow-sm" : "text-slate-400 hover:text-slate-700"
                )}
              >
                <List size={12} /> قائمة
              </button>
            </div>
          </div>
        }
      />

      {message && <Alert tone={message.ok ? "success" : "danger"}>{message.text}</Alert>}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard 
          label="حجوزات اليوم" 
          value={bookingsByDay[localDateKey(new Date())]?.length || 0}
          icon={<Calendar size={20} />} 
          sub="نشط"
        />
        <StatCard 
          label="حجوزات مؤكدة" 
          value={bookings.filter(b => b.status === 'confirmed').length} 
          icon={<CheckCircle2 size={20} />} 
          tone="success"
        />
        <StatCard 
          label="إجمالي العربون" 
          value={money(bookings.filter(b => b.status === 'confirmed').reduce((sum, b) => sum + Number(b.depositAmount || 0), 0))} 
          icon={<Zap size={20} />} 
          tone="warn"
        />
        <StatCard 
          label="بانتظار التأكيد" 
          value={bookings.filter(b => b.status === 'draft').length} 
          icon={<Clock size={20} />} 
          tone="neutral"
        />
      </div>

      <div className="grid min-w-0 grid-cols-1 gap-8 lg:grid-cols-12">
        {/* ── Left Column: Views & Details ───────────────── */}
        <div className="lg:col-span-8 space-y-6">
          
          {/* Detail View (Selected Booking) */}
          {selectedBookingId && (
            <Panel 
              title="تفاصيل الحجز" 
              icon={<Zap size={15} />}
              action={
                <button onClick={() => setSelectedBookingId(null)} className="text-xs text-slate-400 hover:text-slate-700">إغلاق</button>
              }
            >
              {(() => {
                const b = bookings.find(x => x.id === selectedBookingId);
                if (!b) return null;
                return (
                  <div className="space-y-6">
                    <div className="flex flex-col md:flex-row justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <Badge tone={statusBadgeTone(b.status)}>{translateStatus(b.status)}</Badge>
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">#{b.id.slice(0, 8)}</span>
                        </div>
                        <h2 className="text-2xl font-black text-slate-900">{b.customer?.fullName}</h2>
                        <div className="flex flex-wrap gap-4 mt-2 text-xs font-bold text-slate-500">
                          <span className="flex items-center gap-1.5"><MapPin size={14} className="text-slate-300" /> {b.room?.name}</span>
                          <span className="flex items-center gap-1.5"><Clock size={14} className="text-slate-300" /> {dateTime(b.startTime)}</span>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2 self-start">
                        {b.status === 'confirmed' && (
                          <Btn 
                            onClick={() => startSessionMutation.mutate(b)}
                            loading={startSessionMutation.isPending}
                            icon={<PlayCircle size={14} />}
                            variant="success"
                          >
                            بدء الجلسة
                          </Btn>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 border-t border-slate-50 pt-6">
                      <div>
                        <p className="text-[10px] font-black uppercase text-slate-400 mb-1">المبلغ الإجمالي</p>
                        <p className="text-lg font-black text-slate-900">{money(b.totalAmount)}</p>
                      </div>
                      <div>
                        <p className="text-[10px] font-black uppercase text-slate-400 mb-1">العربون</p>
                        <p className="text-lg font-black text-emerald-600">{b.depositAmount ? money(b.depositAmount) : "0"}</p>
                      </div>
                      <div>
                        <p className="text-[10px] font-black uppercase text-slate-400 mb-1">المتبقي</p>
                        <p className="text-lg font-black text-slate-900">{money(Number(b.totalAmount) - Number(b.depositAmount || 0))}</p>
                      </div>
                    </div>

                    {b.notes && (
                      <div className="rounded-2xl bg-slate-50 p-4 text-xs text-slate-600 italic">
                        "{b.notes}"
                      </div>
                    )}

                    <div className="flex flex-wrap gap-2 pt-4 border-t border-slate-50">
                      {b.status === 'confirmed' && (
                        <>
                          <button 
                            onClick={() => setBookingAction({ bookingId: b.id, action: "complete" })}
                            disabled={bookingStatusMutation.isPending}
                            className="rounded-lg bg-slate-900 px-4 py-2 text-[10px] font-black uppercase text-white hover:bg-slate-800 transition"
                          >
                            إنهاء الحجز
                          </button>
                          <button 
                            onClick={() => setBookingAction({ bookingId: b.id, action: "no-show" })}
                            disabled={bookingStatusMutation.isPending}
                            className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-2 text-[10px] font-black uppercase text-amber-700 hover:bg-amber-100"
                          >
                            No-Show
                          </button>
                          <button 
                            onClick={() => { setBookingActionReason(""); setBookingAction({ bookingId: b.id, action: "cancel" }); }}
                            disabled={bookingStatusMutation.isPending}
                            className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-2 text-[10px] font-black uppercase text-rose-700 hover:bg-rose-100"
                          >
                            إلغاء
                          </button>
                        </>
                      )}
                      
                      <div className="mr-auto flex items-center gap-2">
                        <Select 
                          value={newStatus}
                          onChange={(e) => {
                            const s = e.target.value;
                            setNewStatus(s);
                            if(s) updateBookingMutation.mutate({ bookingId: b.id, status: s });
                          }}
                          className="!py-1 !text-[10px] h-8"
                        >
                          <option value="">تغيير الحالة...</option>
                          <option value="draft">مسودة</option>
                          <option value="confirmed">تأكيد</option>
                          <option value="completed">مكتمل</option>
                          <option value="cancelled">ملغي</option>
                        </Select>
                      </div>
                    </div>
                  </div>
                );
              })()}
            </Panel>
          )}

          {/* Calendar View */}
          {viewMode === "calendar" && (
            <Panel title="تقويم الحجوزات" icon={<LayoutGrid size={15} />}>
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-3">
                  <h3 className="text-sm font-black text-slate-800">
                    {currentWeekStart.toLocaleDateString('ar-EG', { month: 'long', year: 'numeric' })}
                  </h3>
                  <div className="flex rounded-lg border border-slate-200 bg-white p-0.5">
                    <button onClick={() => changeWeek(-1)} className="p-1 hover:bg-slate-50 rounded text-slate-400 hover:text-slate-900"><ChevronRight size={14} /></button>
                    <button onClick={() => setCurrentWeekStart(new Date())} className="px-2 text-[9px] font-black uppercase text-slate-400 hover:text-slate-900">اليوم</button>
                    <button onClick={() => changeWeek(1)} className="p-1 hover:bg-slate-50 rounded text-slate-400 hover:text-slate-900"><ChevronLeft size={14} /></button>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-2">
                {weekDates.map(day => {
                  const dateStr = localDateKey(day);
                  const dayBookings = bookingsByDay[dateStr] || [];
                  const isToday = dateStr === localDateKey(new Date());
                  
                  return (
                    <div 
                      key={dateStr} 
                      onClick={() => setSelectedDate(dateStr)}
                      className={clsx(
                        "group min-h-[140px] flex flex-col rounded-2xl border p-2 transition-all cursor-pointer",
                        isToday ? "border-amber-200 bg-amber-50/20" : "border-slate-100 bg-white hover:border-slate-300"
                      )}
                    >
                      <div className="flex items-center justify-between mb-2 px-1">
                        <span className={clsx("text-[9px] font-black uppercase", isToday ? "text-amber-600" : "text-slate-400")}>
                          {arabicDays[day.getDay()]}
                        </span>
                        <span className={clsx(
                          "flex h-5 w-5 items-center justify-center rounded-lg text-[10px] font-black",
                          isToday ? "bg-amber-500 text-white" : "text-slate-900"
                        )}>
                          {day.getDate()}
                        </span>
                      </div>
                      
                      <div className="flex-1 space-y-1">
                        {dayBookings.slice(0, 3).map(b => (
                          <div 
                            key={b.id} 
                            className={clsx(
                              "truncate rounded-lg px-2 py-1 text-[8px] font-bold shadow-sm",
                              b.status === 'confirmed' ? "bg-emerald-500 text-white" : "bg-slate-100 text-slate-600"
                            )}
                          >
                            {b.customer?.fullName.split(' ')[0]}
                          </div>
                        ))}
                        {dayBookings.length > 3 && (
                          <div className="text-center text-[8px] font-black text-slate-300 py-1">
                            +{dayBookings.length - 3} المزيد
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </Panel>
          )}

          {/* List View */}
          {viewMode === "list" && (
            <Panel 
              title="قائمة الحجوزات" 
              icon={<List size={15} />}
              action={
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2 rounded-lg bg-slate-100 p-0.5">
                    {["all", "draft", "confirmed", "completed", "cancelled"].map(t => (
                      <button 
                        key={t}
                        onClick={() => setStatusFilter(t === "all" ? "" : t)}
                        className={clsx(
                          "rounded-md px-2.5 py-1 text-[9px] font-bold transition",
                          (statusFilter || "all") === t ? "bg-white text-slate-900 shadow-sm" : "text-slate-400 hover:text-slate-700"
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
                {bookingsQuery.isPending ? (
                  <TableSkeleton rows={5} cols={5} />
                ) : (
                  <table className="w-full text-right text-sm">
                    <thead>
                      <tr className="border-b border-slate-100 text-[10px] font-black uppercase tracking-wider text-slate-400">
                        <th className="pb-3 pr-1">العميل</th>
                        <th className="pb-3 px-3">الغرفة</th>
                        <th className="pb-3 px-3">الموعد</th>
                        <th className="pb-3 px-3">الحالة</th>
                        <th className="pb-3 px-3">المبلغ</th>
                        <th className="pb-3" />
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {bookings.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="py-12 text-center text-sm text-slate-400">لا توجد حجوزات</td>
                        </tr>
                      ) : (
                        bookings.map((b: Booking) => (
                          <tr 
                            key={b.id} 
                            className="group transition-colors hover:bg-slate-50 cursor-pointer"
                            onClick={() => setSelectedBookingId(b.id)}
                          >
                            <td className="py-3 pr-1">
                              <div className="font-semibold text-slate-800">{b.customer?.fullName ?? "—"}</div>
                              <div className="text-[9px] text-slate-400">{b.customer?.phoneNumber}</div>
                            </td>
                            <td className="py-3 px-3 text-xs text-slate-500">{b.room?.name ?? "—"}</td>
                            <td className="py-3 px-3 text-xs text-slate-400 whitespace-nowrap">{dateTime(b.startTime)}</td>
                            <td className="py-3 px-3">
                              <Badge tone={statusBadgeTone(b.status)}>{translateStatus(b.status)}</Badge>
                            </td>
                            <td className="py-3 px-3 font-bold text-slate-700">{money(b.totalAmount)}</td>
                            <td className="py-3">
                              <button className="text-slate-300 group-hover:text-slate-900 transition"><ChevronLeft size={14} /></button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                )}
              </div>
            </Panel>
          )}
        </div>

        {/* ── Right Column: Form ────────────────────────── */}
        <div className="lg:col-span-4 space-y-6">
          <Panel title="حجز جديد" icon={<Plus size={15} />}>
            <form className="space-y-4" onSubmit={onSubmit}>
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
                        setSelectedCustomerObj(null);
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

              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
                <FormField label="الغرفة">
                  <Select value={roomId} onChange={(e) => setRoomId(e.target.value)} required>
                    <option value="">-- اختر الغرفة --</option>
                    {roomsQuery.data?.data?.map((r) => (
                      <option key={r.id} value={r.id}>{r.name}</option>
                    ))}
                  </Select>
                </FormField>
                <FormField label="نوع الحجز">
                  <Select value={bookingType} onChange={(e) => setBookingType(e.target.value)}>
                    <option value="meeting">اجتماع</option>
                    <option value="training">تدريب</option>
                    <option value="event">فعالية</option>
                  </Select>
                </FormField>
              </div>

              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
                <FormField label="وقت البداية">
                  <DateTimeInput value={startTime} onChange={(e) => setStartTime(e.target.value)} required />
                </FormField>
                <FormField label="وقت النهاية">
                  <DateTimeInput value={endTime} onChange={(e) => setEndTime(e.target.value)} required />
                </FormField>
              </div>

              {conflictsQuery.data?.hasConflict && (
                <div className="rounded-2xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-800 flex flex-col gap-1 animate-in fade-in duration-300">
                  <span className="font-bold">⚠️ تنبيه بتضارب المواعيد:</span>
                  <span>الغرفة محجوزة بالفعل في هذه الفترة الزمنية أو بها جلسة نشطة.</span>
                </div>
              )}

              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
                <FormField label="إجمالي المبلغ">
                  <Input 
                    type="number" 
                    value={totalAmount} 
                    onChange={(e) => setTotalAmount(e.target.value)} 
                    required 
                  />
                </FormField>
                <FormField label="العربون">
                  <Input 
                    type="number" 
                    value={depositAmount} 
                    onChange={(e) => setDepositAmount(e.target.value)} 
                  />
                </FormField>
              </div>

              <FormField label="ملاحظات">
                <textarea 
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs outline-none focus:border-slate-300"
                  rows={2}
                  placeholder="..."
                />
              </FormField>

              {(conflictsQuery.isPending || conflictsQuery.isError) && roomId && startTime && endTime && (
                <Alert tone={conflictsQuery.isError ? "danger" : "info"}>{conflictsQuery.isError ? "تعذر فحص إتاحة الغرفة؛ لن يتم الحجز حتى ينجح الفحص." : "جاري فحص إتاحة الغرفة..."}</Alert>
              )}

              <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs leading-6 text-amber-900">
                <strong>تنبيه مالي:</strong> قيمة العربون هنا للتوثيق داخل الحجز فقط، ولا تعني أنه تم تحصيله بالخزنة. سجّل التحصيل من الفاتورة عند إصدارها.
              </div>

              <Btn type="submit" loading={createMutation.isPending} loadingText="جاري الحجز..." disabled={!customerId || !roomId || conflictsQuery.isPending || conflictsQuery.isError || Boolean(conflictsQuery.data?.hasConflict)} className="w-full" icon={<Zap size={14} />}>
                تأكيد الحجز الآن
              </Btn>
            </form>
          </Panel>

          <div className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm">
            <h3 className="flex items-center gap-2 font-bold text-slate-900 mb-4">
              <History size={18} className="text-slate-400" />
              ملخص الحجوزات
            </h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center text-sm">
                <span className="text-slate-500">حجوزات هذا الأسبوع</span>
                <span className="font-bold">{bookings.length}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-slate-500">إجمالي العربون</span>
                <span className="font-bold text-emerald-600">
                  {money(bookings.reduce((sum, b) => sum + Number(b.depositAmount || 0), 0))}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <Modal isOpen={Boolean(bookingAction)} onClose={() => setBookingAction(null)} title={bookingAction?.action === "cancel" ? "إلغاء الحجز" : bookingAction?.action === "no-show" ? "تسجيل عدم حضور" : "إنهاء الحجز"} size="sm">
        <div className="space-y-4">
          <p className="text-sm text-slate-600">هذا الإجراء يغيّر حالة الحجز فورًا. راجع الاختيار قبل التأكيد.</p>
          {bookingAction?.action === "cancel" && <FormField label="سبب الإلغاء"><Input value={bookingActionReason} onChange={(e) => setBookingActionReason(e.target.value)} placeholder="اكتب سبب الإلغاء" /></FormField>}
          <div className="flex gap-2">
            <Btn variant={bookingAction?.action === "cancel" ? "danger" : "warn"} loading={bookingStatusMutation.isPending} disabled={bookingAction?.action === "cancel" && !bookingActionReason.trim()} onClick={() => {
              if (!bookingAction) return;
              bookingStatusMutation.mutate({ ...bookingAction, reason: bookingActionReason.trim() || undefined }, { onSuccess: () => setBookingAction(null) });
            }}>تأكيد الإجراء</Btn>
            <Btn variant="ghost" onClick={() => setBookingAction(null)}>رجوع</Btn>
          </div>
        </div>
      </Modal>

      {/* Day Details Modal */}
      {selectedDate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg rounded-3xl bg-white shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-slate-50 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-black text-slate-900">{arabicDays[new Date(selectedDate).getDay()]}</h3>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{selectedDate}</p>
              </div>
              <button onClick={() => setSelectedDate(null)} className="h-8 w-8 flex items-center justify-center rounded-xl bg-slate-50 text-slate-400 hover:text-slate-900 transition">
                <X size={18} />
              </button>
            </div>
            <div className="p-6 max-h-[60vh] overflow-y-auto space-y-3">
              {bookingsByDay[selectedDate]?.map(b => (
                <button 
                  key={b.id} 
                  onClick={() => { setSelectedBookingId(b.id); setSelectedDate(null); }}
                  className="w-full text-right rounded-2xl border border-slate-100 bg-slate-50 p-4 hover:border-amber-300 hover:bg-amber-50/40 transition"
                >
                  <div className="flex items-center justify-between">
                    <Badge tone={statusBadgeTone(b.status)}>{translateStatus(b.status)}</Badge>
                    <div className="text-right">
                      <p className="font-bold text-slate-900">{b.customer?.fullName ?? "—"}</p>
                      <p className="text-[10px] text-slate-500">{b.room?.name ?? "—"} • {new Date(b.startTime).toLocaleTimeString("ar-EG", { hour: "2-digit", minute: "2-digit" })}</p>
                    </div>
                  </div>
                </button>
              ))}
              {(!bookingsByDay[selectedDate] || bookingsByDay[selectedDate].length === 0) && (
                <p className="py-8 text-center text-sm text-slate-400">لا توجد حجوزات في هذا اليوم</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
