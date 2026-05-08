"use client";

import { useState, FormEvent, useEffect, useMemo } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useSearchParams } from "next/navigation";
import { 
  ChevronLeft, ChevronRight, Calendar, Clock, User, MapPin, 
  Plus, RefreshCw, X, Search, Filter, LayoutGrid, List,
  CheckCircle2, AlertCircle, Ban, History, Users, Zap
} from "lucide-react";
import { api } from "../../../lib/api";
import { translateApiError } from "../../../lib/errors";
import { dateTime, money } from "../../../lib/format";
import { translateStatus } from "../../../lib/labels";
import type { Booking, Customer, Paginated, Room } from "../../../lib/types";
import { Alert, Badge, Btn, DataTable, DateTimeInput, EmptyState, Panel, SectionTitle, StatCard, statusBadgeTone } from "../../../components/ui";
import clsx from "clsx";

function toIso(datetimeLocal: string) {
  return new Date(datetimeLocal).toISOString();
}

export default function BookingsPage() {
  const queryClient = useQueryClient();

  const [customerId, setCustomerId] = useState("");
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
  const [selectedBookingId, setSelectedBookingId] = useState<string | null>(null);
  const searchParams = useSearchParams();

  useEffect(() => {
    const id = searchParams.get("id");
    if (id) {
      setSelectedBookingId(id);
    }
  }, [searchParams]);
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

  const customersQuery = useQuery({
    queryKey: ["customers", "for-bookings"],
    queryFn: async () => {
      const response = await api.get("/customers", { params: { page: 1, limit: 200 } });
      return response.data.data as Paginated<Customer>;
    },
  });

  const roomsQuery = useQuery({
    queryKey: ["rooms", "for-bookings"],
    retry: 0,
    queryFn: async () => {
      const response = await api.get("/rooms", { params: { page: 1, limit: 100 } });
      return response.data.data as Paginated<Room>;
    },
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
      setCustomerId(""); setRoomId(""); setBookingType("meeting"); setStartTime(""); setEndTime("");
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
    weekDates.forEach((date: Date) => map[date.toISOString().split('T')[0]] = []);
    bookings.forEach((b: Booking) => {
      const dateStr = new Date(b.startTime).toISOString().split('T')[0];
      if (map[dateStr]) map[dateStr].push(b);
    });
    return map;
  }, [weekDates, bookings]);

  const goToToday = () => {
    const now = new Date();
    const day = now.getDay();
    const diff = now.getDate() - day + (day === 0 ? -6 : 1);
    setCurrentWeekStart(new Date(now.setDate(diff)));
  };

  const arabicDays = ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];
  const arabicMonths = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];

  const getBookingStatusStyle = (status: string) => {
    switch (status) {
      case 'confirmed': return 'border-emerald-100 bg-emerald-50/50 text-emerald-700';
      case 'completed': return 'border-blue-100 bg-blue-50/50 text-blue-700';
      case 'cancelled': return 'border-rose-100 bg-rose-50/50 text-rose-700';
      case 'no_show': return 'border-amber-100 bg-amber-50/50 text-amber-700';
      default: return 'border-slate-100 bg-slate-50/50 text-slate-600';
    }
  };

  return (
    <div className="max-w-[1400px] mx-auto p-6 space-y-8" dir="rtl">
      {/* Header Section */}
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900">إدارة الحجوزات</h1>
          <p className="text-xs font-bold text-slate-400 mt-1 uppercase tracking-widest">Calendar & Booking Control</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex h-10 items-center gap-1 rounded-xl bg-slate-100 p-1">
            <button
              onClick={() => setViewMode("calendar")}
              className={clsx(
                "flex items-center gap-2 rounded-lg px-3 py-1.5 text-[10px] font-black uppercase transition",
                viewMode === "calendar" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"
              )}
            >
              <LayoutGrid size={14} /> التقويم
            </button>
            <button
              onClick={() => setViewMode("list")}
              className={clsx(
                "flex items-center gap-2 rounded-lg px-3 py-1.5 text-[10px] font-black uppercase transition",
                viewMode === "list" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"
              )}
            >
              <List size={14} /> القائمة
            </button>
          </div>
          <button 
            onClick={() => bookingsQuery.refetch()}
            className="flex h-10 w-10 items-center justify-center rounded-xl bg-white border border-slate-100 text-slate-400 transition hover:text-slate-900 hover:border-slate-200"
          >
            <RefreshCw size={16} className={bookingsQuery.isFetching ? "animate-spin" : ""} />
          </button>
        </div>
      </header>

      {message && (
        <div className={clsx(
          "flex items-center gap-3 rounded-xl border px-4 py-3 text-xs font-bold animate-in fade-in slide-in-from-top-2",
          message.ok ? "bg-emerald-50 border-emerald-100 text-emerald-700" : "bg-red-50 border-red-100 text-red-700"
        )}>
          {message.ok ? <CheckCircle2 size={14} /> : <AlertCircle size={14} />}
          {message.text}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Main Content Area (Now on the Left) */}
        <div className="lg:col-span-8 space-y-8 lg:order-2">
          
          {viewMode === "calendar" ? (
            <section className="space-y-4">
              <div className="flex items-center justify-between px-2">
                <div className="flex items-center gap-4">
                  <h2 className="text-sm font-black text-slate-900">
                    {arabicMonths[currentWeekStart.getMonth()]} {currentWeekStart.getFullYear()}
                  </h2>
                  <button onClick={goToToday} className="text-[10px] font-black uppercase text-slate-400 hover:text-slate-900 transition">اليوم</button>
                </div>
                <div className="flex gap-1">
                  <button onClick={() => {
                    const d = new Date(currentWeekStart);
                    d.setDate(d.getDate() - 7);
                    setCurrentWeekStart(d);
                  }} className="h-8 w-8 flex items-center justify-center rounded-lg border border-slate-100 hover:bg-slate-50 transition">
                    <ChevronRight size={16} />
                  </button>
                  <button onClick={() => {
                    const d = new Date(currentWeekStart);
                    d.setDate(d.getDate() + 7);
                    setCurrentWeekStart(d);
                  }} className="h-8 w-8 flex items-center justify-center rounded-lg border border-slate-100 hover:bg-slate-50 transition">
                    <ChevronLeft size={16} />
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-7 gap-px bg-slate-100 overflow-hidden rounded-2xl border border-slate-100">
                {weekDates.map((date: Date) => {
                  const dateStr = date.toISOString().split('T')[0];
                  const dayBookings = bookingsByDay[dateStr] || [];
                  const isToday = dateStr === new Date().toISOString().split('T')[0];
                  
                  return (
                    <div key={dateStr} className="min-h-[160px] bg-white p-2 flex flex-col gap-2">
                      <div className={clsx(
                        "flex flex-col items-center justify-center py-2 rounded-xl transition-colors",
                        isToday ? "bg-slate-900 text-white" : "text-slate-400"
                      )}>
                        <span className="text-[9px] font-black uppercase">{arabicDays[date.getDay()]}</span>
                        <span className="text-lg font-black leading-none mt-0.5">{date.getDate()}</span>
                      </div>
                      
                      <div className="flex-1 space-y-1">
                        {dayBookings.slice(0, 3).map((b: Booking) => (
                          <button
                            key={b.id}
                            onClick={() => setSelectedBookingId(b.id)}
                            className={clsx(
                              "w-full text-right p-1.5 rounded-lg border text-[9px] font-bold transition-all hover:shadow-sm hover:scale-[1.02]",
                              getBookingStatusStyle(b.status)
                            )}
                          >
                            <div className="flex items-center justify-between mb-0.5">
                              <span>{new Date(b.startTime).toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })}</span>
                              <div className="h-1 w-1 rounded-full bg-current opacity-30" />
                            </div>
                            <div className="truncate opacity-90">{b.customer?.fullName}</div>
                          </button>
                        ))}
                        {dayBookings.length > 3 && (
                          <button 
                            onClick={() => setSelectedDate(dateStr)}
                            className="w-full py-1 text-[8px] font-black text-slate-400 uppercase tracking-widest text-center hover:text-slate-900 transition"
                          >
                            + {dayBookings.length - 3} More
                          </button>
                        )}
                        {dayBookings.length === 0 && (
                          <div className="flex-1 flex items-center justify-center opacity-10">
                            <Calendar size={24} className="text-slate-200" />
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          ) : (
            <section className="rounded-2xl border border-slate-100 bg-white overflow-hidden">
              <div className="p-4 border-b border-slate-50 flex items-center justify-between">
                <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400">جميع الحجوزات</h3>
                <select 
                  value={statusFilter} 
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="h-8 rounded-lg bg-slate-100 border-none px-3 text-[10px] font-black outline-none"
                >
                  <option value="">كل الحالات</option>
                  <option value="confirmed">متأكد</option>
                  <option value="cancelled">ملغي</option>
                  <option value="no_show">No-Show</option>
                </select>
              </div>
              <DataTable 
                headers={["العميل", "الغرفة", "الموعد", "الحالة", "المبلغ", "ملاحظات"]} 
                rows={bookings.map(b => [
                  <div key="c">
                    <div className="font-bold text-slate-900">{b.customer?.fullName}</div>
                    <div className="text-[9px] text-slate-400 font-medium">{b.customer?.phoneNumber}</div>
                  </div>,
                  b.room?.name,
                  dateTime(b.startTime),
                  <Badge key="s" tone={statusBadgeTone(b.status)}>
                    {translateStatus(b.status)}
                  </Badge>,
                  money(b.totalAmount),
                  <div key="n" className="text-[10px] text-slate-500 italic max-w-[150px] truncate" title={b.notes || ""}>
                    {b.notes || "—"}
                  </div>
                ])} 
              />
            </section>
          )}

          {/* Action Panel for Selected Booking */}
          {selectedBookingId && (
            <section className="animate-in fade-in slide-in-from-bottom-4">
              {(() => {
                const b = bookings.find(x => x.id === selectedBookingId);
                if (!b) return null;
                return (
                  <div className="rounded-3xl border border-slate-900 bg-white p-6 shadow-2xl shadow-slate-900/10 relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-2">
                      <button onClick={() => setSelectedBookingId(null)} className="h-8 w-8 flex items-center justify-center rounded-full bg-slate-50 text-slate-400 hover:text-slate-900">
                        <X size={16} />
                      </button>
                    </div>
                    
                    <div className="flex flex-col md:flex-row gap-8">
                      <div className="flex-1 space-y-6">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <Badge tone="info" className="h-5 px-2 text-[9px] font-black uppercase">ID: {b.id.slice(0, 8)}</Badge>
                            <Badge tone={statusBadgeTone(b.status)} className="h-5 px-2 text-[9px] font-black uppercase">{translateStatus(b.status)}</Badge>
                          </div>
                          <h2 className="text-xl font-black text-slate-900">{b.customer?.fullName}</h2>
                          <div className="flex items-center gap-4 mt-2 text-[10px] font-bold text-slate-400">
                            <span className="flex items-center gap-1"><MapPin size={12} /> {b.room?.name}</span>
                            <span className="flex items-center gap-1"><Clock size={12} /> {new Date(b.startTime).toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })}</span>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100">
                            <div className="text-[9px] font-black uppercase text-slate-400 mb-1">المبلغ الإجمالي</div>
                            <div className="text-lg font-black text-slate-900">{money(b.totalAmount)}</div>
                          </div>
                          <div className="p-3 rounded-2xl bg-emerald-50 border border-emerald-100">
                            <div className="text-[9px] font-black uppercase text-emerald-600/50 mb-1">العربون المدفوع</div>
                            <div className="text-lg font-black text-emerald-700">{b.depositAmount ? money(b.depositAmount) : "0"}</div>
                          </div>
                        </div>


                        {b.notes && (
                          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
                            <div className="text-[9px] font-black uppercase text-slate-400 mb-2">ملاحظات / سبب الإلغاء</div>
                            <p className="text-xs font-bold text-slate-700 leading-relaxed italic">
                              "{b.notes}"
                            </p>
                          </div>
                        )}
                      </div>

                      <div className="md:w-64 flex flex-col gap-3 justify-start pt-2">
                        {b.status === 'confirmed' && (
                          <button 
                            onClick={() => startSessionMutation.mutate(b)}
                            disabled={startSessionMutation.isPending}
                            className="w-full h-12 rounded-xl bg-emerald-600 text-white shadow-lg shadow-emerald-600/20 flex items-center justify-center gap-2 hover:bg-emerald-700 transition transform hover:scale-[1.02] active:scale-[0.98] ring-4 ring-emerald-500/10"
                          >
                            <Zap size={18} fill="currentColor" />
                            <span className="text-xs font-black uppercase tracking-widest">بدء الجلسة الآن</span>
                          </button>
                        )}
                        
                        <div className="h-px bg-slate-100 my-1" />

                        {b.status === 'confirmed' && (
                          <>
                            <button 
                              onClick={() => bookingStatusMutation.mutate({ bookingId: b.id, action: "complete" })}
                              disabled={bookingStatusMutation.isPending}
                              className="w-full h-11 rounded-xl bg-slate-900 text-white text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-slate-800 transition"
                            >
                              <CheckCircle2 size={14} /> إنهاء بنجاح
                            </button>
                            <div className="grid grid-cols-2 gap-2">
                              <button 
                                onClick={() => bookingStatusMutation.mutate({ bookingId: b.id, action: "no-show" })}
                                disabled={bookingStatusMutation.isPending}
                                className="h-10 rounded-xl bg-amber-50 text-amber-700 border border-amber-100 text-[9px] font-black uppercase hover:bg-amber-100 transition"
                              >
                                No-Show
                              </button>
                              <button 
                                onClick={() => {
                                  const reason = prompt("برجاء إدخال سبب الإلغاء:");
                                  if (reason !== null) {
                                    bookingStatusMutation.mutate({ bookingId: b.id, action: "cancel", reason });
                                  }
                                }}
                                disabled={bookingStatusMutation.isPending}
                                className="h-10 rounded-xl bg-rose-50 text-rose-700 border border-rose-100 text-[9px] font-black uppercase hover:bg-rose-100 transition"
                              >
                                إلغاء
                              </button>
                            </div>
                          </>
                        )}
                        <div className="mt-4">
                          <label className="text-[9px] font-black uppercase text-slate-400 block mb-1.5 px-1">تغيير يدوي للحالة</label>
                          <select 
                            value={newStatus}
                            onChange={(e) => {
                              const s = e.target.value;
                              setNewStatus(s);
                              if(s) updateBookingMutation.mutate({ bookingId: b.id, status: s });
                            }}
                            className="w-full h-9 rounded-lg bg-slate-50 border border-slate-200 px-3 text-[10px] font-bold outline-none"
                          >
                            <option value="">اختار حالة...</option>
                            <option value="draft">مسودة</option>
                            <option value="confirmed">متأكد</option>
                            <option value="completed">مكتمل</option>
                            <option value="cancelled">ملغي</option>
                          </select>
                        </div>

                        {/* History Section */}
                        <div className="mt-6 space-y-3">
                          <h4 className="text-[10px] font-black uppercase text-slate-400 flex items-center gap-2">
                            <History size={12} /> سجل التغييرات
                          </h4>
                          <div className="space-y-2">
                            <div className="flex gap-2 text-[9px]">
                              <div className="h-4 w-px bg-emerald-200 mt-1" />
                              <div>
                                <p className="font-bold text-slate-900">إنشاء الحجز</p>
                                <p className="text-slate-400">{dateTime(b.createdAt)}</p>
                              </div>
                            </div>
                            {b.status === 'cancelled' && (
                              <div className="flex gap-2 text-[9px]">
                                <div className="h-4 w-px bg-rose-200 mt-1" />
                                <div>
                                  <p className="font-bold text-rose-600">تم الإلغاء</p>
                                  <p className="text-slate-400">راجع الملاحظات للسبب</p>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })()}
            </section>
          )}
        </div>

        {/* Right Column: New Booking Form (Now on the Right) */}
        <div className="lg:col-span-4 space-y-8 lg:order-1">
          <section className="rounded-3xl bg-slate-900 p-6 text-white shadow-xl shadow-slate-900/10">
            <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-2 mb-6">
              <Plus size={14} />
              حجز جديد
            </h3>
            
            <form className="space-y-5" onSubmit={onSubmit}>
              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 pr-1">العميل</label>
                <select 
                  value={customerId} onChange={(e) => setCustomerId(e.target.value)}
                  className="w-full h-11 rounded-xl bg-white/5 border border-white/10 px-4 text-xs font-bold text-white outline-none transition focus:border-white/20"
                  required
                >
                  <option value="" className="text-slate-900">اختار العميل...</option>
                  {customersQuery.data?.data?.map((c) => (
                    <option key={c.id} value={c.id} className="text-slate-900">{c.fullName}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 pr-1">الغرفة</label>
                  <select 
                    value={roomId} onChange={(e) => setRoomId(e.target.value)}
                    className="w-full h-11 rounded-xl bg-white/5 border border-white/10 px-4 text-xs font-bold text-white outline-none transition focus:border-white/20"
                    required
                  >
                    <option value="" className="text-slate-900">اختار غرفة...</option>
                    {roomsQuery.data?.data?.map((r) => (
                      <option key={r.id} value={r.id} className="text-slate-900">{r.name}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 pr-1">النوع</label>
                  <select 
                    value={bookingType} onChange={(e) => setBookingType(e.target.value)}
                    className="w-full h-11 rounded-xl bg-white/5 border border-white/10 px-4 text-xs font-bold text-white outline-none"
                  >
                    <option value="meeting" className="text-slate-900">اجتماع</option>
                    <option value="training" className="text-slate-900">تدريب</option>
                    <option value="event" className="text-slate-900">فعالية</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 pr-1">البداية</label>
                  <input 
                    type="datetime-local" value={startTime} onChange={(e) => setStartTime(e.target.value)}
                    className="w-full h-11 rounded-xl bg-white/5 border border-white/10 px-4 text-[10px] font-bold text-white outline-none"
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 pr-1">النهاية</label>
                  <input 
                    type="datetime-local" value={endTime} onChange={(e) => setEndTime(e.target.value)}
                    className="w-full h-11 rounded-xl bg-white/5 border border-white/10 px-4 text-[10px] font-bold text-white outline-none"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 pr-1">إجمالي المبلغ</label>
                  <input 
                    type="number" value={totalAmount} onChange={(e) => setTotalAmount(e.target.value)}
                    className="w-full h-11 rounded-xl bg-white/5 border border-white/10 px-4 text-xs font-bold text-white outline-none"
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 pr-1">العربون</label>
                  <input 
                    type="number" value={depositAmount} onChange={(e) => setDepositAmount(e.target.value)}
                    className="w-full h-11 rounded-xl bg-white/5 border border-white/10 px-4 text-xs font-bold text-white outline-none"
                  />
                </div>
              </div>

              <button 
                type="submit" 
                disabled={createMutation.isPending}
                className="w-full h-12 rounded-xl bg-emerald-500 text-slate-950 text-xs font-black uppercase tracking-widest transition hover:bg-emerald-400 flex items-center justify-center gap-2"
              >
                {createMutation.isPending ? <RefreshCw size={16} className="animate-spin" /> : <Zap size={16} />}
                تأكيد الحجز
              </button>
            </form>
          </section>

          {/* Quick Stats Summary */}
          <section className="space-y-4">
            <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-1">نظرة سريعة</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="rounded-2xl border border-slate-100 bg-white p-4">
                <div className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1">المؤكدة</div>
                <div className="text-xl font-black text-slate-900">{bookings.filter(b => b.status === 'confirmed').length}</div>
              </div>
              <div className="rounded-2xl border border-slate-100 bg-white p-4">
                <div className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1">اليوم</div>
                <div className="text-xl font-black text-slate-900">{bookingsByDay[new Date().toISOString().split('T')[0]]?.length || 0}</div>
              </div>
            </div>
          </section>
        </div>
      </div>

      {/* Day Details Modal */}
      {selectedDate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
          <div className="w-full max-w-2xl rounded-3xl bg-white shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-slate-50 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-black text-slate-900">{arabicDays[new Date(selectedDate).getDay()]}</h3>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{selectedDate}</p>
              </div>
              <button onClick={() => setSelectedDate(null)} className="h-10 w-10 flex items-center justify-center rounded-xl bg-slate-50 text-slate-400 hover:text-slate-900 transition">
                <X size={20} />
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
                      <p className="font-bold text-slate-900">{b.customer?.fullName ?? b.organizerName ?? "—"}</p>
                      <p className="text-xs text-slate-500">{b.room?.name ?? "—"} • {b.startTime ? new Date(b.startTime).toLocaleTimeString("ar-EG", { hour: "2-digit", minute: "2-digit" }) : "—"}</p>
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
