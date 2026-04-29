"use client";

import { FormEvent, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ChevronLeft, ChevronRight, Calendar, Clock, User, MapPin, Plus, RefreshCw, X } from "lucide-react";
import { api } from "../../../lib/api";
import { translateApiError } from "../../../lib/errors";
import { dateTime, money } from "../../../lib/format";
import { translateStatus } from "../../../lib/labels";
import type { Booking, Customer, Paginated, Room } from "../../../lib/types";
import { Alert, Badge, Btn, DataTable, DateTimeInput, EmptyState, Panel, SectionTitle, StatCard } from "../../../components/ui";

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
  const [message, setMessage] = useState<string | null>(null);
  const [selectedBookingId, setSelectedBookingId] = useState<string | null>(null);
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
        params: { page: 1, limit: 100, status: statusFilter || undefined },
      });
      return response.data.data as Paginated<Booking>;
    },
  });

  const customersQuery = useQuery({
    queryKey: ["customers", "for-bookings"],
    queryFn: async () => {
      const response = await api.get("/customers", { params: { page: 1, limit: 100 } });
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
      setCustomerId("");
      setRoomId("");
      setBookingType("meeting");
      setStartTime("");
      setEndTime("");
      setParticipantCount("");
      setTotalAmount("0");
      setDepositAmount("");
      setNotes("");
      setMessage("الحجز اتسجل بنجاح.");
      queryClient.invalidateQueries({ queryKey: ["bookings"] });
    },
    onError: (error: unknown) => {
      const apiMessage =
        (error as { response?: { data?: { message?: string | string[] } } })?.response?.data?.message;
      setMessage(translateApiError(apiMessage));
    },
  });

  const checkConflictMutation = useMutation({
    mutationFn: async () => {
      const response = await api.get("/bookings/conflicts", {
        params: { roomId, startTime: toIso(startTime), endTime: toIso(endTime) },
      });
      return response.data.data as { hasConflict: boolean };
    },
    onSuccess: (result) => {
      setMessage(result.hasConflict ? "ي تعارض على الغرة ي الميعاد ده." : "تمام، ميش تعارض.");
    },
    onError: (error: unknown) => {
      const apiMessage =
        (error as { response?: { data?: { message?: string | string[] } } })?.response?.data?.message;
      setMessage(translateApiError(apiMessage));
    },
  });

  const bookingStatusMutation = useMutation({
    mutationFn: async ({ bookingId, action }: { bookingId: string; action: "complete" | "cancel" }) => {
      if (action === "complete") {
        await api.post(`/bookings/${bookingId}/complete`);
        return;
      }
      await api.post(`/bookings/${bookingId}/cancel`, { reason: "إلغاء من الشاشة" });
    },
    onSuccess: () => {
      setMessage("تم تحديث حالة الحجز.");
      queryClient.invalidateQueries({ queryKey: ["bookings"] });
    },
    onError: (error: unknown) => {
      const apiMessage =
        (error as { response?: { data?: { message?: string | string[] } } })?.response?.data?.message;
      setMessage(translateApiError(apiMessage));
    },
  });

  const updateBookingMutation = useMutation({
    mutationFn: async ({ bookingId, status }: { bookingId: string; status: string }) => {
      await api.put(`/bookings/${bookingId}`, { status });
    },
    onSuccess: () => {
      setMessage("تم تحديث حالة الحجز بنجاح.");
      queryClient.invalidateQueries({ queryKey: ["bookings"] });
      setNewStatus("");
    },
    onError: (error: unknown) => {
      const apiMessage =
        (error as { response?: { data?: { message?: string | string[] } } })?.response?.data?.message;
      setMessage(translateApiError(apiMessage));
    },
  });

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage(null);
    createMutation.mutate();
  }

  const rows = useMemo(
    () =>
      bookingsQuery.data?.data?.map((booking) => [
        booking.id.slice(0, 8),
        booking.customer?.fullName ?? "-",
        booking.room?.name ?? "-",
        dateTime(booking.startTime),
        dateTime(booking.endTime),
        translateStatus(booking.status),
        booking.participantCount ?? "-",
        money(booking.totalAmount),
      ]) ?? [],
    [bookingsQuery.data?.data],
  );

  const bookings = bookingsQuery.data?.data ?? [];
  const totalBookings = bookings.length;
  const confirmedBookings = bookings.filter((b) => b.status === "confirmed").length;
  const draftBookings = bookings.filter((b) => b.status === "draft").length;
  const cancelledBookings = bookings.filter((b) => b.status === "cancelled").length;

  // Get week dates
  const weekDates = useMemo(() => {
    const dates = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date(currentWeekStart);
      date.setDate(date.getDate() + i);
      dates.push(date);
    }
    return dates;
  }, [currentWeekStart]);

  // Get bookings for each day
  const bookingsByDay = useMemo(() => {
    const bookings: Record<string, Booking[]> = {};
    weekDates.forEach((date) => {
      const dateStr = date.toISOString().split('T')[0];
      bookings[dateStr] = [];
    });

    bookingsQuery.data?.data?.forEach((booking) => {
      const bookingDate = new Date(booking.startTime).toISOString().split('T')[0];
      if (bookings[bookingDate]) {
        bookings[bookingDate].push(booking);
      }
    });

    return bookings;
  }, [weekDates, bookingsQuery.data?.data]);

  // Navigation functions
  const goToPreviousWeek = () => {
    const newDate = new Date(currentWeekStart);
    newDate.setDate(newDate.getDate() - 7);
    setCurrentWeekStart(newDate);
  };

  const goToNextWeek = () => {
    const newDate = new Date(currentWeekStart);
    newDate.setDate(newDate.getDate() + 7);
    setCurrentWeekStart(newDate);
  };

  const goToToday = () => {
    const now = new Date();
    const day = now.getDay();
    const diff = now.getDate() - day + (day === 0 ? -6 : 1);
    setCurrentWeekStart(new Date(now.setDate(diff)));
  };

  const arabicDays = ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];
  const arabicMonths = ['يناير', 'براير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نومبر', 'ديسمبر'];

  const getBookingColor = (status: string) => {
    switch (status) {
      case 'draft': return 'bg-gradient-to-br from-slate-50 to-slate-100 border-slate-300 text-slate-700 shadow-sm';
      case 'confirmed': return 'bg-gradient-to-br from-emerald-50 to-emerald-100 border-emerald-300 text-emerald-700 shadow-sm';
      case 'completed': return 'bg-gradient-to-br from-blue-50 to-blue-100 border-blue-300 text-blue-700 shadow-sm';
      case 'cancelled': return 'bg-gradient-to-br from-rose-50 to-rose-100 border-rose-300 text-rose-700 shadow-sm';
      default: return 'bg-gradient-to-br from-slate-50 to-slate-100 border-slate-300 text-slate-700 shadow-sm';
    }
  };

  const getDayColor = (dateStr: string) => {
    const today = new Date().toISOString().split('T')[0];
    if (dateStr === today) return 'border-slate-900 bg-gradient-to-br from-slate-50 to-slate-100';
    return 'border-slate-200 bg-gradient-to-br from-white to-slate-50 hover:border-slate-400';
  };

  return (
    <div className="space-y-5" dir="rtl">
      <SectionTitle
        title="الحجوزات"
        subtitle="إنشاء، متابعة، وتحديث الحجوزات من شاشة واحدة."
        icon={<Calendar size={20} />}
        action={
          <Btn size="sm" variant="secondary" icon={<RefreshCw size={12} />} onClick={() => bookingsQuery.refetch()}>
            تحديث
          </Btn>
        }
      />

      {message ? (
        <Alert tone={message.includes("نجاح") || message.includes("تمام") ? "success" : "danger"}>
          {message}
        </Alert>
      ) : null}

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="إجمالي الحجوزات" value={totalBookings} icon={<Calendar size={18} />} />
        <StatCard label="متأكدة" value={confirmedBookings} tone="success" icon={<Clock size={18} />} />
        <StatCard label="مسودات" value={draftBookings} tone="info" icon={<Plus size={18} />} />
        <StatCard label="ملغية" value={cancelledBookings} tone="danger" icon={<X size={18} />} />
      </div>

      {/* View Mode Toggle */}
      <div className="flex items-center justify-between">
        <div className="flex gap-2">
          <button
            onClick={() => setViewMode("calendar")}
            className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition ${
              viewMode === "calendar" ? "bg-slate-900 text-white" : "bg-white border border-slate-300 text-slate-700 hover:bg-slate-50"
            }`}
          >
            <Calendar size={16} />
            التقويم
          </button>
          <button
            onClick={() => setViewMode("list")}
            className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition ${
              viewMode === "list" ? "bg-slate-900 text-white" : "bg-white border border-slate-300 text-slate-700 hover:bg-slate-50"
            }`}
          >
            القائمة
          </button>
        </div>
      </div>

      {/* Calendar View */}
      {viewMode === "calendar" && (
        <Panel>
          {/* Week Navigation */}
          <div className="mb-4 flex items-center justify-between">
            <button
              onClick={goToPreviousWeek}
              className="rounded-lg border border-slate-300 bg-white p-2 hover:bg-slate-50"
            >
              <ChevronRight size={20} />
            </button>
            <div className="text-center">
              <h3 className="text-lg font-bold text-slate-900">
                {arabicMonths[currentWeekStart.getMonth()]} {currentWeekStart.getFullYear()}
              </h3>
              <button
                onClick={goToToday}
                className="mt-1 text-xs font-medium text-slate-600 hover:text-slate-900"
              >
                اليوم
              </button>
            </div>
            <button
              onClick={goToNextWeek}
              className="rounded-lg border border-slate-300 bg-white p-2 hover:bg-slate-50"
            >
              <ChevronLeft size={20} />
            </button>
          </div>

          {/* Calendar Grid */}
          <div className="grid grid-cols-7 gap-3">
            {weekDates.map((date) => {
              const dateStr = date.toISOString().split('T')[0];
              const dayBookings = bookingsByDay[dateStr] || [];
              const isToday = dateStr === new Date().toISOString().split('T')[0];

              return (
                <div
                  key={dateStr}
                  onClick={() => setSelectedDate(dateStr)}
                  className={`min-h-[140px] rounded-xl border-2 p-3 cursor-pointer transition-all duration-200 hover:shadow-lg hover:scale-[1.02] ${getDayColor(dateStr)}`}
                >
                  <div className="mb-3 text-center">
                    <p className="text-xs font-semibold text-slate-600">{arabicDays[date.getDay()]}</p>
                    <p className={`text-2xl font-bold ${isToday ? 'text-slate-900' : 'text-slate-700'}`}>
                      {date.getDate()}
                    </p>
                  </div>

                  <div className="space-y-2">
                    {dayBookings.slice(0, 3).map((booking) => (
                      <div
                        key={booking.id}
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedBookingId(booking.id);
                        }}
                        className={`rounded-lg border p-2 text-xs shadow-sm ${getBookingColor(booking.status)}`}
                      >
                        <div className="flex items-center gap-1.5 mb-1">
                          <Clock size={11} />
                          <span className="font-semibold">
                            {new Date(booking.startTime).toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        <div className="font-medium truncate">{booking.customer?.fullName}</div>
                        <div className="flex items-center gap-1 truncate text-[10px] opacity-75">
                          <MapPin size={9} />
                          {booking.room?.name}
                        </div>
                      </div>
                    ))}
                    {dayBookings.length > 3 && (
                      <div className="text-center text-[11px] font-semibold text-slate-600 bg-white/50 rounded-lg py-1">
                        +{dayBookings.length - 3} حجز آخر
                      </div>
                    )}
                    {dayBookings.length === 0 && (
                      <div className="text-center text-[10px] text-slate-400 py-2">
                        لا توجد حجوزات
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Legend */}
          <div className="mt-4 flex flex-wrap gap-3 text-xs">
            <div className="flex items-center gap-2">
              <div className="h-3 w-3 rounded bg-emerald-100 border border-emerald-300" />
              <span className="text-slate-600">متأكد</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-3 w-3 rounded bg-slate-100 border border-slate-300" />
              <span className="text-slate-600">مسودة</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-3 w-3 rounded bg-blue-100 border border-blue-300" />
              <span className="text-slate-600">مكتمل</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-3 w-3 rounded bg-rose-100 border border-rose-300" />
              <span className="text-slate-600">ملغي</span>
            </div>
          </div>
        </Panel>
      )}

      {/* List View */}
      {viewMode === "list" && (
        <Panel>
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <h3 className="text-sm font-semibold tracking-wide text-slate-600">قائمة الحجوزات</h3>
            <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm">
              <option value="">كل الحالات</option>
              <option value="draft">مسودة</option>
              <option value="confirmed">متأكد</option>
              <option value="completed">خلص</option>
              <option value="cancelled">اتلغى</option>
            </select>
          </div>
          <DataTable headers={["المعر", "العميل", "الغرة", "البداية", "النهاية", "الحالة", "العدد", "الإجمالي"]} rows={rows} />
        </Panel>
      )}

      <Panel>
        <h3 className="mb-3 text-sm font-semibold tracking-wide text-slate-600">حجز جديد</h3>
        <form className="grid gap-3 md:grid-cols-2 lg:grid-cols-4" onSubmit={onSubmit}>
          <select value={customerId} onChange={(event) => setCustomerId(event.target.value)} className="rounded-lg border border-slate-300 px-3 py-2" required>
            <option value="">اختار العميل</option>
            {customersQuery.data?.data?.map((customer) => (
              <option key={customer.id} value={customer.id}>
                {customer.fullName}
              </option>
            ))}
          </select>

          <select value={roomId} onChange={(event) => setRoomId(event.target.value)} className="rounded-lg border border-slate-300 px-3 py-2" required>
            <option value="">اختار الغرة</option>
            {roomsQuery.data?.data?.map((room) => (
              <option key={room.id} value={room.id}>
                {room.name}
              </option>
            ))}
          </select>

          <input value={roomId} onChange={(event) => setRoomId(event.target.value)} placeholder="أو اكتب Room ID يدوي" className="rounded-lg border border-slate-300 px-3 py-2" />

          <select value={bookingType} onChange={(event) => setBookingType(event.target.value)} className="rounded-lg border border-slate-300 px-3 py-2">
            <option value="meeting">اجتماع</option>
            <option value="training">تدريب</option>
            <option value="event">إينت</option>
            <option value="private">خاص</option>
          </select>

          <input type="number" min={0} step={0.01} value={totalAmount} onChange={(event) => setTotalAmount(event.target.value)} placeholder="إجمالي المبلغ" className="rounded-lg border border-slate-300 px-3 py-2" required />
          <DateTimeInput value={startTime} onChange={(event) => setStartTime(event.target.value)} required />
          <DateTimeInput value={endTime} onChange={(event) => setEndTime(event.target.value)} required />
          <input type="number" min={1} value={participantCount} onChange={(event) => setParticipantCount(event.target.value)} placeholder="عدد الحضور" className="rounded-lg border border-slate-300 px-3 py-2" />
          <input type="number" min={0} step={0.01} value={depositAmount} onChange={(event) => setDepositAmount(event.target.value)} placeholder="العربون" className="rounded-lg border border-slate-300 px-3 py-2" />
          <input value={notes} onChange={(event) => setNotes(event.target.value)} placeholder="ملاحظات (اختياري)" className="rounded-lg border border-slate-300 px-3 py-2 md:col-span-2 lg:col-span-3" />

          <div className="flex gap-2">
            <button type="button" onClick={() => checkConflictMutation.mutate()} className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium" disabled={!roomId || !startTime || !endTime || checkConflictMutation.isPending}>
              حص التعارض
            </button>
            <button type="submit" className="rounded-lg bg-slate-900 px-3 py-2 text-sm font-semibold text-white" disabled={createMutation.isPending}>
              {createMutation.isPending ? "بنسجل الحجز..." : "سجل الحجز"}
            </button>
          </div>
        </form>
      </Panel>

      {selectedBookingId ? (() => {
        const selectedBooking = bookingsQuery.data?.data?.find(b => b.id === selectedBookingId);
        if (!selectedBooking) return null;

        return (
          <div id="booking-actions-panel">
            <Panel>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-lg font-bold text-slate-900">إدارة الحجز #{selectedBookingId.slice(0, 8)}</h3>
                  <p className="text-sm text-slate-600">{selectedBooking.customer?.fullName} - {selectedBooking.room?.name}</p>
                </div>
                <button
                  onClick={() => {
                    setSelectedBookingId(null);
                    setNewStatus("");
                  }}
                  className="rounded-lg border border-slate-300 bg-white p-2 hover:bg-slate-50"
                >
                  <X size={16} />
                </button>
              </div>

              <div className="grid gap-4 md:grid-cols-2 mb-6">
                <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                  <p className="text-xs font-semibold text-slate-600 mb-2">معلومات الحجز</p>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span className="text-slate-600">الوقت:</span>
                      <span className="font-medium">
                        {new Date(selectedBooking.startTime).toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })}
                        {' - '}
                        {new Date(selectedBooking.endTime).toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-600">الغرة:</span>
                      <span className="font-medium">{selectedBooking.room?.name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-600">الحالة:</span>
                      <Badge tone={selectedBooking.status === 'confirmed' ? 'success' : selectedBooking.status === 'completed' ? 'info' : selectedBooking.status === 'cancelled' ? 'danger' : 'default'}>
                        {translateStatus(selectedBooking.status)}
                      </Badge>
                    </div>
                  </div>
                </div>

                <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                  <p className="text-xs font-semibold text-slate-600 mb-2">المبالغ</p>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span className="text-slate-600">الإجمالي:</span>
                      <span className="font-bold text-slate-900">{money(selectedBooking.totalAmount)}</span>
                    </div>
                    {selectedBooking.depositAmount && (
                      <div className="flex justify-between">
                        <span className="text-slate-600">العربون:</span>
                        <span className="font-medium">{money(selectedBooking.depositAmount)}</span>
                      </div>
                    )}
                    {selectedBooking.participantCount && (
                      <div className="flex justify-between">
                        <span className="text-slate-600">عدد الحضور:</span>
                        <span className="font-medium">{selectedBooking.participantCount}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-semibold text-slate-600 mb-2">تغيير حالة الحجز</label>
                <div className="flex gap-3">
                  <select
                    value={newStatus}
                    onChange={(e) => setNewStatus(e.target.value)}
                    className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm"
                  >
                    <option value="">اختر حالة جديدة</option>
                    <option value="draft" disabled={selectedBooking.status === 'draft'}>مسودة</option>
                    <option value="confirmed" disabled={selectedBooking.status === 'confirmed'}>متأكد</option>
                    <option value="completed" disabled={selectedBooking.status === 'completed'}>مكتمل</option>
                    <option value="cancelled" disabled={selectedBooking.status === 'cancelled'}>ملغي</option>
                  </select>
                  <button
                    onClick={() => {
                      if (newStatus) {
                        updateBookingMutation.mutate({ bookingId: selectedBookingId, status: newStatus });
                      }
                    }}
                    disabled={!newStatus || updateBookingMutation.isPending}
                    className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-700 disabled:opacity-50"
                  >
                    تحديث الحالة
                  </button>
                </div>
              </div>

              <div className="flex flex-wrap gap-3">
                {selectedBooking.status !== 'completed' && selectedBooking.status !== 'cancelled' && (
                  <>
                    <button
                      onClick={() => bookingStatusMutation.mutate({ bookingId: selectedBookingId, action: "complete" })}
                      disabled={bookingStatusMutation.isPending}
                      className="flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
                    >
                      إنهاء الحجز
                    </button>
                    <button
                      onClick={() => bookingStatusMutation.mutate({ bookingId: selectedBookingId, action: "cancel" })}
                      disabled={bookingStatusMutation.isPending}
                      className="flex items-center gap-2 rounded-lg bg-rose-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-rose-700 disabled:opacity-50"
                    >
                      إلغاء الحجز
                    </button>
                  </>
                )}
                {selectedBooking.status === 'completed' && (
                  <div className="flex items-center gap-2 rounded-lg bg-blue-50 border border-blue-200 px-4 py-2.5 text-sm font-semibold text-blue-700">
                    ✓ الحجز مكتمل
                  </div>
                )}
                {selectedBooking.status === 'cancelled' && (
                  <div className="flex items-center gap-2 rounded-lg bg-rose-50 border border-rose-200 px-4 py-2.5 text-sm font-semibold text-rose-700">
                    ✗ الحجز ملغي
                  </div>
                )}
              </div>
            </Panel>
          </div>
        );
      })() : null}

      {/* Day Detail Modal */}
      {selectedDate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-4xl rounded-2xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-200 p-6">
              <div>
                <h2 className="text-xl font-bold text-slate-900">
                  {arabicDays[new Date(selectedDate).getDay()]} - {new Date(selectedDate).getDate()} {arabicMonths[new Date(selectedDate).getMonth()]} {new Date(selectedDate).getFullYear()}
                </h2>
                <p className="text-sm text-slate-600">جميع الحجوزات ي هذا اليوم</p>
              </div>
              <button
                onClick={() => setSelectedDate(null)}
                className="rounded-lg border border-slate-300 bg-white p-2 hover:bg-slate-50"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-6 max-h-[60vh] overflow-y-auto">
              {bookingsByDay[selectedDate]?.length === 0 ? (
                <EmptyState icon={<Calendar size={40} />} title="لا توجد حجوزات ي اليوم ده" />
              ) : (
                <div className="space-y-4">
                  {bookingsByDay[selectedDate]?.map((booking) => (
                    <div
                      key={booking.id}
                      className={`rounded-xl border-2 p-5 shadow-sm ${getBookingColor(booking.status)}`}
                    >
                      <div className="flex flex-wrap items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-3">
                            <div className="flex items-center gap-2 bg-white/50 rounded-lg px-3 py-1.5">
                              <Clock size={16} />
                              <span className="font-bold text-sm">
                                {new Date(booking.startTime).toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })}
                              </span>
                              <span className="text-slate-400">-</span>
                              <span className="font-bold text-sm">
                                {new Date(booking.endTime).toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            </div>
                            <Badge tone={booking.status === 'confirmed' ? 'success' : booking.status === 'completed' ? 'info' : booking.status === 'cancelled' ? 'danger' : 'default'}>
                              {translateStatus(booking.status)}
                            </Badge>
                          </div>

                          <div className="space-y-2">
                            <div className="flex items-center gap-2">
                              <User size={16} />
                              <span className="font-semibold">{booking.customer?.fullName}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <MapPin size={16} />
                              <span className="text-slate-700">{booking.room?.name}</span>
                            </div>
                            {booking.bookingType && (
                              <div className="text-sm text-slate-600">
                                النوع: {booking.bookingType === 'meeting' ? 'اجتماع' : booking.bookingType === 'training' ? 'تدريب' : booking.bookingType === 'event' ? 'إينت' : 'خاص'}
                              </div>
                            )}
                            {booking.participantCount && (
                              <div className="text-sm text-slate-600">
                                عدد الحضور: {booking.participantCount}
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="text-right">
                          <div className="text-lg font-bold text-slate-900">
                            {money(booking.totalAmount)}
                          </div>
                          {booking.depositAmount && (
                            <div className="text-sm text-slate-600">
                              العربون: {money(booking.depositAmount)}
                            </div>
                          )}
                        </div>
                      </div>

                      {booking.notes && (
                        <div className="mt-3 pt-3 border-t border-slate-300/50">
                          <p className="text-sm text-slate-600">{booking.notes}</p>
                        </div>
                      )}

                      <div className="mt-4 flex gap-2">
                        <button
                          onClick={() => {
                            setSelectedBookingId(booking.id);
                            setSelectedDate(null);
                            setTimeout(() => {
                              const panel = document.getElementById('booking-actions-panel');
                              if (panel) {
                                panel.scrollIntoView({ behavior: 'smooth', block: 'center' });
                              }
                            }, 100);
                          }}
                          className="rounded-lg bg-slate-900 px-4 py-2 text-xs font-semibold text-white hover:bg-slate-700"
                        >
                          إدارة الحجز
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

