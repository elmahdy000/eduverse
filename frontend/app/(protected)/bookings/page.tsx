"use client";

import { useState, FormEvent, useMemo, useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useSearchParams } from "next/navigation";
import { 
  ChevronLeft, ChevronRight, Calendar, Clock, MapPin, 
  Plus, RefreshCw, X, Search, LayoutGrid, List,
  CheckCircle2, History, Zap, PlayCircle, Filter, DollarSign,
  AlertTriangle, Check, Layers
} from "lucide-react";
import { api } from "../../../lib/api";
import { translateApiError } from "../../../lib/errors";
import { dateTime, money } from "../../../lib/format";
import { translateStatus } from "../../../lib/labels";
import type { Booking, Customer, Paginated, Room } from "../../../lib/types";
import { 
  Alert, Badge, Btn, DateTimeInput, EmptyState, Modal, Panel, SectionTitle, StatCard, 
  statusBadgeTone, FormField, Input, Select, TableSkeleton
} from "../../../components/ui";
import { useAuthStore } from "../../../store/auth-store";
import clsx from "clsx";

function toIso(datetimeLocal: string) {
  return new Date(datetimeLocal).toISOString();
}

function localDateKey(date: Date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

const HOURS = Array.from({ length: 15 }, (_, i) => i + 9); // 9:00 AM to 11:00 PM

export default function BookingsPage() {
  const queryClient = useQueryClient();
  const searchParams = useSearchParams();

  // Role Security Check
  const { user } = useAuthStore();
  const roleName = user?.role?.name?.toLowerCase() ?? "";
  const ALLOWED_ROLES = ["owner", "operations manager", "receptionist", "reception"];
  const isAllowed = ALLOWED_ROLES.some((r) => roleName.includes(r));

  const unauthorizedView = !isAllowed ? (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4" dir="rtl">
        <div className="text-5xl">🚫</div>
        <h2 className="text-xl font-black text-slate-800">غير مصرح بالدخول</h2>
        <p className="text-sm text-slate-500 text-center max-w-xs">
          صفحة الحجوزات مخصصة لموظفي الاستقبال والإدارة فقط.
        </p>
      </div>
    ) : null;

  // State Management
  const [customerId, setCustomerId] = useState(() => searchParams.get("customerId") ?? "");
  const [roomId, setRoomId] = useState("");
  const [bookingType, setBookingType] = useState("meeting");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [bookingHours, setBookingHours] = useState("1");
  const [manualDiscount, setManualDiscount] = useState("0");
  const [participantCount, setParticipantCount] = useState("");
  const [totalAmount, setTotalAmount] = useState("0");
  const [depositAmount, setDepositAmount] = useState("");
  const [notes, setNotes] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [roomFilter, setRoomFilter] = useState("");
  const [message, setMessage] = useState<{ text: string; ok: boolean } | null>(null);
  const [selectedBookingId, setSelectedBookingId] = useState<string | null>(() => searchParams.get("id"));
  const [bookingAction, setBookingAction] = useState<{ bookingId: string; action: "complete" | "cancel" | "no-show" } | null>(null);
  const [bookingActionReason, setBookingActionReason] = useState("");
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  const [viewMode, setViewMode] = useState<"calendar" | "list" | "timeline">("timeline");
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [newStatus, setNewStatus] = useState<string>("");
  const [currentWeekStart, setCurrentWeekStart] = useState(() => {
    const now = new Date();
    const day = now.getDay();
    const diff = now.getDate() - day + (day === 0 ? -6 : 1);
    return new Date(now.setDate(diff));
  });
  const [timelineDate, setTimelineDate] = useState(() => localDateKey(new Date()));

  // Customer Search
  const [customerSearchQuery, setCustomerSearchQuery] = useState("");
  const [isCustomerDropdownOpen, setIsCustomerDropdownOpen] = useState(false);
  const [selectedCustomerObj, setSelectedCustomerObj] = useState<Customer | null>(null);

  // Queries
  const bookingsQuery = useQuery({
    queryKey: ["bookings", statusFilter],
    enabled: isAllowed,
    queryFn: async () => {
      const response = await api.get("/bookings", {
        params: { page: 1, limit: 200, status: statusFilter || undefined },
      });
      return response.data.data as Paginated<Booking>;
    },
  });

  const customersQuery = useQuery({
    queryKey: ["customers", "for-bookings-all"],
    enabled: isAllowed,
    queryFn: async () => {
      const response = await api.get("/customers", { params: { page: 1, limit: 500 } });
      return response.data.data as Paginated<Customer>;
    },
  });

  const roomsQuery = useQuery({
    queryKey: ["rooms", "for-bookings"],
    enabled: isAllowed,
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
    enabled: Boolean(isAllowed && roomId && startTime && endTime),
  });

  // Derived Data
  const selectedCustomer = useMemo(() => {
    if (!customerId) return null;
    return selectedCustomerObj || (customersQuery.data?.data ?? []).find((c) => c.id === customerId) || null;
  }, [customerId, selectedCustomerObj, customersQuery.data]);

  const FIXED_OWNER_NAMES = [
    "mahmoud elmahdy", "khaled salah", "mahmoud ezz", "mohamed abdelazim",
    "nada elbaz", "mahmoud abd rabou", "eng.mohamed", "eng mohamed", "elmahdy", "ezz", "abdelazim", "elbaz", "abd rabou"
  ];

  const filteredCustomers = useMemo(() => {
    const list = customersQuery.data?.data ?? [];
    const q = customerSearchQuery.trim().toLowerCase();

    // Arabic normalization helper (أ إ آ -> ا, ة -> ه, ى -> ي)
    const normalize = (text: string) => {
      return (text || "")
        .toLowerCase()
        .replace(/[أإآ]/g, "ا")
        .replace(/ة/g, "ه")
        .replace(/ى/g, "ي")
        .replace(/[\u064B-\u0652]/g, ""); // remove harakat
    };

    const isOwnerCustomer = (c: Customer) => {
      const name = (c.fullName || "").toLowerCase();
      const notes = (c.notes || "").toLowerCase();
      const type = (c.customerType || "").toLowerCase();
      return (
        FIXED_OWNER_NAMES.some((o) => name.includes(o)) ||
        type === "owner" ||
        type === "owner_discount" ||
        notes.includes("owner_discount") ||
        notes.includes("مالك")
      );
    };

    let results = list;

    if (q) {
      const qNorm = normalize(q);
      const tokens = qNorm.split(/\s+/).filter(Boolean);
      results = list.filter(c => {
        const fullName = normalize(c.fullName || "");
        const phone = normalize(c.phoneNumber || "");
        const phone2 = normalize(c.phoneNumberSecondary || "");
        const notes = normalize(c.notes || "");
        const combined = `${fullName} ${phone} ${phone2} ${notes}`;
        return tokens.every(token => combined.includes(token));
      });
    }

    // Sort: Owners first, then by matching relevance
    return [...results].sort((a, b) => {
      const aOwner = isOwnerCustomer(a) ? 1 : 0;
      const bOwner = isOwnerCustomer(b) ? 1 : 0;
      if (aOwner !== bOwner) return bOwner - aOwner;
      return a.fullName.localeCompare(b.fullName, "ar");
    });
  }, [customersQuery.data, customerSearchQuery]);

  const bookings = bookingsQuery.data?.data ?? [];
  const rooms = roomsQuery.data?.data ?? [];

  const isSelectedCustomerOwner = useMemo(() => {
    if (!selectedCustomer) return false;
    const nameLower = (selectedCustomer.fullName || "").toLowerCase();
    const notesLower = (selectedCustomer.notes || "").toLowerCase();
    const typeLower = (selectedCustomer.customerType || "").toLowerCase();
    return (
      FIXED_OWNER_NAMES.some((o) => nameLower.includes(o)) ||
      typeLower === "owner" ||
      typeLower === "owner_discount" ||
      notesLower.includes("owner_discount") ||
      notesLower.includes("مالك")
    );
  }, [selectedCustomer]);

  const recalculatePrice = (rId: string, hrsStr: string, discStr: string, isOwner: boolean) => {
    if (!rId) return;
    const selectedRoom = rooms.find((r) => r.id === rId);
    if (!selectedRoom) return;

    const isMeetingOrLecture =
      selectedRoom.name?.toLowerCase().includes("lecture") ||
      selectedRoom.name?.toLowerCase().includes("ميتنج") ||
      selectedRoom.name?.toLowerCase().includes("meeting") ||
      selectedRoom.roomType === "meeting";

    const hourlyRate = isMeetingOrLecture ? 200 : Number(selectedRoom.hourlyRate || 20);
    const hrs = Math.max(1, Number(hrsStr) || 1);
    let rawTotal = hrs * hourlyRate;

    if (isOwner) {
      rawTotal = rawTotal * 0.5; // 50% owner discount
    }

    const disc = Number(discStr) || 0;
    const finalTotal = Math.max(0, rawTotal - disc);
    setTotalAmount(String(finalTotal));
  };

  const filteredBookings = useMemo(() => {
    return bookings.filter(b => {
      if (roomFilter && b.room?.id !== roomFilter) return false;
      return true;
    });
  }, [bookings, roomFilter]);

  // Mutations
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
      setIsCreateModalOpen(false);
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
      setMessage({ text: "تم بدء الجلسة بنجاح. يتم الان الانتقال لشاشة الجلسات...", ok: true });
      setTimeout(() => {
        window.location.href = "/sessions";
      }, 1200);
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

  const todayBookingsCount = useMemo(() => {
    const todayStr = localDateKey(new Date());
    return bookings.filter(b => localDateKey(new Date(b.startTime)) === todayStr).length;
  }, [bookings]);

  if (unauthorizedView) return unauthorizedView;

  return (
    <div className="min-w-0 space-y-6 animate-in fade-in duration-500" dir="rtl">
      {/* Page Header */}
      <SectionTitle 
        title="إدارة وتخطيط الحجوزات" 
        subtitle="متابعة وتأكيد حجوزات الغرف والقاعات والعمل على تنظيم جدول التواجد."
        icon={<Calendar size={22} />}
        action={
          <div className="flex flex-wrap items-center gap-2">
            <Btn
              onClick={() => setIsCreateModalOpen(true)}
              icon={<Plus size={16} />}
              variant="primary"
              className="shadow-sm"
            >
              حجز جديد
            </Btn>
            <button 
              onClick={() => { queryClient.invalidateQueries({ queryKey: ["bookings"] }); }}
              className="flex items-center justify-center h-9 w-9 rounded-xl border border-slate-200 bg-white text-slate-500 hover:bg-slate-50 transition"
              title="تحديث البيانات"
            >
              <RefreshCw size={15} className={bookingsQuery.isFetching ? "animate-spin" : ""} />
            </button>
            
            {/* View Switcher */}
            <div className="flex rounded-xl bg-slate-100 p-1 border border-slate-200/60">
              <button 
                onClick={() => setViewMode("timeline")}
                className={clsx(
                  "flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition",
                  viewMode === "timeline" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-900"
                )}
              >
                <Layers size={14} /> الخط الزمني
              </button>
              <button 
                onClick={() => setViewMode("calendar")}
                className={clsx(
                  "flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition",
                  viewMode === "calendar" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-900"
                )}
              >
                <LayoutGrid size={14} /> التقويم
              </button>
              <button 
                onClick={() => setViewMode("list")}
                className={clsx(
                  "flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition",
                  viewMode === "list" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-900"
                )}
              >
                <List size={14} /> القائمة
              </button>
            </div>
          </div>
        }
      />

      {/* Global Alerts */}
      {message && <Alert tone={message.ok ? "success" : "danger"}>{message.text}</Alert>}

      {/* Top Metrics Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard 
          label="حجوزات اليوم" 
          value={todayBookingsCount}
          icon={<Calendar size={18} />} 
          sub="إجمالي المواعيد"
        />
        <StatCard 
          label="حجوزات مؤكدة" 
          value={bookings.filter(b => b.status === 'confirmed').length} 
          icon={<CheckCircle2 size={18} />} 
          tone="success"
        />
        <StatCard 
          label="إجمالي العربون المحصل" 
          value={money(bookings.filter(b => b.status === 'confirmed').reduce((sum, b) => sum + Number(b.depositAmount || 0), 0))} 
          icon={<DollarSign size={18} />} 
          tone="warn"
        />
        <StatCard 
          label="حجوزات بانتظار التثبيت" 
          value={bookings.filter(b => b.status === 'draft').length} 
          icon={<Clock size={18} />} 
          tone="neutral"
        />
      </div>

      {/* Booking Detail Modal / Drawer View */}
      {selectedBookingId && (
        <Panel 
          title="تفاصيل الحجز المختار" 
          icon={<Zap size={16} className="text-amber-500" />}
          action={
            <button onClick={() => setSelectedBookingId(null)} className="text-xs font-bold text-slate-400 hover:text-slate-700">إغلاق المعاينة</button>
          }
        >
          {(() => {
            const b = bookings.find(x => x.id === selectedBookingId);
            if (!b) return <p className="text-xs text-slate-400">الحجز غير موجود</p>;
            return (
              <div className="space-y-6">
                <div className="flex flex-col md:flex-row justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <Badge tone={statusBadgeTone(b.status)}>{translateStatus(b.status)}</Badge>
                      <span className="text-[10px] font-mono font-bold text-slate-400 uppercase">#{b.id.slice(0, 8)}</span>
                    </div>
                    <h2 className="text-xl font-black text-slate-900">{b.customer?.fullName ?? "عميل غير معروف"}</h2>
                    <div className="flex flex-wrap gap-4 mt-2 text-xs font-semibold text-slate-500">
                      <span className="flex items-center gap-1.5"><MapPin size={14} className="text-slate-400" /> {b.room?.name ?? "بدون غرفة"}</span>
                      <span className="flex items-center gap-1.5"><Clock size={14} className="text-slate-400" /> {dateTime(b.startTime)}</span>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2 self-start">
                    {b.status === 'confirmed' && (
                      <Btn 
                        onClick={() => startSessionMutation.mutate(b)}
                        loading={startSessionMutation.isPending}
                        icon={<PlayCircle size={15} />}
                        variant="success"
                      >
                        بدء الجلسة الآن
                      </Btn>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 rounded-2xl bg-slate-50 border border-slate-100 p-4">
                  <div>
                    <p className="text-[10px] font-black uppercase text-slate-400 mb-1">المبلغ الإجمالي</p>
                    <p className="text-base font-black text-slate-900">{money(b.totalAmount)}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-black uppercase text-slate-400 mb-1">العربون المدفوع</p>
                    <p className="text-base font-black text-emerald-600">{b.depositAmount ? money(b.depositAmount) : "0"}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-black uppercase text-slate-400 mb-1">المبلغ المتبقي</p>
                    <p className="text-base font-black text-slate-900">{money(Number(b.totalAmount) - Number(b.depositAmount || 0))}</p>
                  </div>
                </div>

                {b.notes && (
                  <div className="rounded-xl bg-amber-50/40 border border-amber-100/60 p-3 text-xs text-amber-900 italic">
                    "{b.notes}"
                  </div>
                )}

                <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-100">
                  <div className="flex flex-wrap items-center gap-2">
                    {b.status === 'confirmed' && (
                      <>
                        <button 
                          onClick={() => setBookingAction({ bookingId: b.id, action: "complete" })}
                          disabled={bookingStatusMutation.isPending}
                          className="rounded-xl bg-slate-900 px-3.5 py-1.5 text-xs font-bold text-white hover:bg-slate-800 transition"
                        >
                          إكمال الحجز
                        </button>
                        <button 
                          onClick={() => setBookingAction({ bookingId: b.id, action: "no-show" })}
                          disabled={bookingStatusMutation.isPending}
                          className="rounded-xl border border-amber-200 bg-amber-50 px-3.5 py-1.5 text-xs font-bold text-amber-800 hover:bg-amber-100 transition"
                        >
                          عدم حضور (No-Show)
                        </button>
                        <button 
                          onClick={() => { setBookingActionReason(""); setBookingAction({ bookingId: b.id, action: "cancel" }); }}
                          disabled={bookingStatusMutation.isPending}
                          className="rounded-xl border border-rose-200 bg-rose-50 px-3.5 py-1.5 text-xs font-bold text-rose-700 hover:bg-rose-100 transition"
                        >
                          إلغاء الحجز
                        </button>
                      </>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <Select 
                      value={newStatus}
                      onChange={(e) => {
                        const s = e.target.value;
                        setNewStatus(s);
                        if(s) updateBookingMutation.mutate({ bookingId: b.id, status: s });
                      }}
                      className="!py-1.5 !text-xs h-9 bg-white"
                    >
                      <option value="">تغيير الحالة يدويًا...</option>
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

      {/* VIEW MODE 1: TIMELINE (Interactive Hours Grid per Room) */}
      {viewMode === "timeline" && (
        <Panel 
          title="جدول المواعيد والغرف الشاغرة" 
          icon={<Layers size={16} />}
          action={
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <label className="text-xs font-bold text-slate-500">التاريخ:</label>
                <input 
                  type="date"
                  value={timelineDate}
                  onChange={(e) => setTimelineDate(e.target.value)}
                  className="rounded-xl border border-slate-200 bg-white px-3 py-1 text-xs font-bold text-slate-800 outline-none"
                />
              </div>
            </div>
          }
        >
          <div className="overflow-x-auto">
            <div className="min-w-[800px] space-y-4">
              {/* Timeline Header (Hours) */}
              <div className="grid grid-cols-[160px_1fr] gap-2 border-b border-slate-100 pb-2">
                <div className="text-xs font-black text-slate-400 pr-2">الغرفة / الفترات</div>
                <div className="grid grid-cols-15 gap-1 text-center">
                  {HOURS.map(h => (
                    <div key={h} className="text-[11px] font-mono font-bold text-slate-400">
                      {h > 12 ? `${h - 12}م` : `${h}ص`}
                    </div>
                  ))}
                </div>
              </div>

              {/* Rooms Rows */}
              {rooms.length === 0 ? (
                <EmptyState title="لا توجد غرف مضافة" sub="أضف غرفاً جديدة للتمكن من إدارة الحجوزات" />
              ) : (
                rooms.map(room => {
                  const roomBookings = filteredBookings.filter(b => 
                    b.room?.id === room.id && localDateKey(new Date(b.startTime)) === timelineDate
                  );

                  return (
                    <div key={room.id} className="grid grid-cols-[160px_1fr] gap-2 items-center border-b border-slate-50 pb-3">
                      <div className="pr-2 space-y-0.5">
                        <p className="text-xs font-black text-slate-800 truncate">{room.name}</p>
                        <p className="text-[10px] text-slate-400">سعة: {room.capacity} فرد</p>
                      </div>

                      {/* Timeline Slots */}
                      <div className="grid grid-cols-15 gap-1 relative h-11 bg-slate-50/80 rounded-xl p-1 border border-slate-100">
                        {HOURS.map(hour => {
                          const slotBooking = roomBookings.find(b => {
                            const startH = new Date(b.startTime).getHours();
                            const endH = new Date(b.endTime).getHours();
                            return hour >= startH && hour < endH;
                          });

                          return (
                            <div 
                              key={hour}
                              onClick={() => {
                                if (slotBooking) {
                                  setSelectedBookingId(slotBooking.id);
                                } else {
                                  setRoomId(room.id);
                                  const d = new Date(timelineDate);
                                  d.setHours(hour, 0, 0);
                                  const endD = new Date(d);
                                  endD.setHours(hour + 1, 0, 0);
                                  setStartTime(d.toISOString().slice(0, 16));
                                  setEndTime(endD.toISOString().slice(0, 16));
                                  setIsCreateModalOpen(true);
                                }
                              }}
                              className={clsx(
                                "h-full rounded-lg transition-all flex items-center justify-center cursor-pointer text-[9px] font-bold",
                                slotBooking
                                  ? slotBooking.status === 'confirmed' 
                                    ? "bg-emerald-500 text-white shadow-sm hover:bg-emerald-600"
                                    : "bg-amber-400 text-slate-900 hover:bg-amber-500"
                                  : "hover:bg-slate-200/60 text-transparent"
                              )}
                              title={slotBooking ? `حجز: ${slotBooking.customer?.fullName}` : `غرفة شاغرة الساعة ${hour}`}
                            >
                              {slotBooking ? slotBooking.customer?.fullName.split(' ')[0] : "+"}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </Panel>
      )}

      {/* VIEW MODE 2: CALENDAR VIEW */}
      {viewMode === "calendar" && (
        <Panel title="تقويم الحجوزات الأسبوعي" icon={<LayoutGrid size={16} />}>
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xs font-black text-slate-800">
              {currentWeekStart.toLocaleDateString('ar-EG', { month: 'long', year: 'numeric' })}
            </h3>
            <div className="flex rounded-xl border border-slate-200 bg-white p-0.5 shadow-sm">
              <button onClick={() => changeWeek(-1)} className="p-1.5 hover:bg-slate-50 rounded-lg text-slate-500 hover:text-slate-900"><ChevronRight size={15} /></button>
              <button onClick={() => setCurrentWeekStart(new Date())} className="px-3 text-xs font-bold text-slate-600 hover:text-slate-900">اليوم</button>
              <button onClick={() => changeWeek(1)} className="p-1.5 hover:bg-slate-50 rounded-lg text-slate-500 hover:text-slate-900"><ChevronLeft size={15} /></button>
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
                    "group min-h-[140px] flex flex-col rounded-2xl border p-2.5 transition-all cursor-pointer",
                    isToday ? "border-amber-300 bg-amber-50/30 shadow-sm" : "border-slate-100 bg-white hover:border-slate-300"
                  )}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className={clsx("text-[10px] font-black uppercase", isToday ? "text-amber-700" : "text-slate-400")}>
                      {arabicDays[day.getDay()]}
                    </span>
                    <span className={clsx(
                      "flex h-5 w-5 items-center justify-center rounded-lg text-xs font-black",
                      isToday ? "bg-amber-500 text-white" : "text-slate-800"
                    )}>
                      {day.getDate()}
                    </span>
                  </div>
                  
                  <div className="flex-1 space-y-1">
                    {dayBookings.slice(0, 3).map(b => (
                      <div 
                        key={b.id} 
                        className={clsx(
                          "truncate rounded-lg px-2 py-1 text-[9px] font-bold shadow-2xs",
                          b.status === 'confirmed' ? "bg-emerald-500 text-white" : "bg-slate-100 text-slate-700"
                        )}
                      >
                        {b.customer?.fullName.split(' ')[0]}
                      </div>
                    ))}
                    {dayBookings.length > 3 && (
                      <div className="text-center text-[9px] font-bold text-slate-400 py-0.5">
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

      {/* VIEW MODE 3: LIST VIEW */}
      {viewMode === "list" && (
        <Panel 
          title="جدول قائمة الحجوزات" 
          icon={<List size={16} />}
          action={
            <div className="flex flex-wrap items-center gap-3">
              <Select 
                value={roomFilter} 
                onChange={(e) => setRoomFilter(e.target.value)}
                className="!py-1 !text-xs h-8 bg-white"
              >
                <option value="">كل الغرف</option>
                {rooms.map(r => (
                  <option key={r.id} value={r.id}>{r.name}</option>
                ))}
              </Select>

              <div className="flex items-center gap-1 rounded-xl bg-slate-100 p-1">
                {["all", "draft", "confirmed", "completed", "cancelled"].map(t => (
                  <button 
                    key={t}
                    onClick={() => setStatusFilter(t === "all" ? "" : t)}
                    className={clsx(
                      "rounded-lg px-3 py-1 text-xs font-bold transition",
                      (statusFilter || "all") === t ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-900"
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
              <TableSkeleton rows={5} cols={6} />
            ) : (
              <table className="w-full text-right text-sm">
                <thead>
                  <tr className="border-b border-slate-100 text-[10px] font-black uppercase tracking-wider text-slate-400">
                    <th className="pb-3 pr-1">العميل</th>
                    <th className="pb-3 px-3">الغرفة</th>
                    <th className="pb-3 px-3">الموعد</th>
                    <th className="pb-3 px-3">الحالة</th>
                    <th className="pb-3 px-3">المبلغ الإجمالي</th>
                    <th className="pb-3 px-3">العربون</th>
                    <th className="pb-3" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {filteredBookings.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-xs text-slate-400">لا توجد حجوزات مسجلة</td>
                    </tr>
                  ) : (
                    filteredBookings.map((b: Booking) => (
                      <tr 
                        key={b.id} 
                        className="group transition-colors hover:bg-slate-50 cursor-pointer"
                        onClick={() => setSelectedBookingId(b.id)}
                      >
                        <td className="py-3 pr-1 font-semibold text-slate-800">
                          <div>{b.customer?.fullName ?? "—"}</div>
                          <div className="text-[10px] text-slate-400">{b.customer?.phoneNumber}</div>
                        </td>
                        <td className="py-3 px-3 text-xs text-slate-600">{b.room?.name ?? "—"}</td>
                        <td className="py-3 px-3 text-xs text-slate-500 whitespace-nowrap">{dateTime(b.startTime)}</td>
                        <td className="py-3 px-3">
                          <Badge tone={statusBadgeTone(b.status)}>{translateStatus(b.status)}</Badge>
                        </td>
                        <td className="py-3 px-3 font-bold text-slate-900">{money(b.totalAmount)}</td>
                        <td className="py-3 px-3 font-bold text-emerald-600">{b.depositAmount ? money(b.depositAmount) : "0"}</td>
                        <td className="py-3 text-slate-300 group-hover:text-slate-800 transition">
                          <ChevronLeft size={16} />
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

      {/* CREATE BOOKING MODAL */}
      <Modal 
        isOpen={isCreateModalOpen} 
        onClose={() => setIsCreateModalOpen(false)} 
        title="إضافة حجز جديد"
        size="lg"
      >
        <form className="space-y-4" onSubmit={onSubmit}>
          <FormField label="العميل صاحب الحجز">
            {/* Quick Owners Select Chips */}
            {!selectedCustomer && (
              <div className="mb-2 flex flex-wrap items-center gap-1.5">
                <span className="text-[10px] font-bold text-purple-700 ml-1">اختيار مالك فوري 👑:</span>
                {(customersQuery.data?.data ?? []).filter(c => {
                  const nameLower = (c.fullName || "").toLowerCase();
                  const notesLower = (c.notes || "").toLowerCase();
                  const typeLower = (c.customerType || "").toLowerCase();
                  return FIXED_OWNER_NAMES.some(o => nameLower.includes(o)) || typeLower === "owner" || typeLower === "owner_discount" || notesLower.includes("owner_discount") || notesLower.includes("مالك");
                }).slice(0, 7).map(owner => (
                  <button
                    key={owner.id}
                    type="button"
                    onClick={() => {
                      setCustomerId(owner.id);
                      setSelectedCustomerObj(owner);
                      setIsCustomerDropdownOpen(false);
                      setCustomerSearchQuery("");
                    }}
                    className="rounded-lg border border-purple-200 bg-purple-50 px-2 py-0.5 text-[11px] font-bold text-purple-900 transition hover:bg-purple-100 hover:scale-105 flex items-center gap-1 shadow-2xs"
                  >
                    👑 {owner.fullName.split(' ')[0]}
                  </button>
                ))}
              </div>
            )}

            {selectedCustomer ? (
              <div className="relative rounded-2xl border border-blue-200 bg-blue-50/30 p-3 flex items-center justify-between transition-all">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-slate-900">{selectedCustomer.fullName}</span>
                    <Badge tone={
                      selectedCustomer.customerType === "owner_discount" ? "warn" :
                      selectedCustomer.customerType === "student" ? "info" :
                      selectedCustomer.customerType === "employee" ? "success" : "default"
                    }>
                      {selectedCustomer.customerType === "owner_discount" ? "مالك المكان 👑" :
                       selectedCustomer.customerType === "student" ? "طالب" :
                       selectedCustomer.customerType === "employee" ? "موظف" : "عميل"}
                    </Badge>
                  </div>
                  <div className="text-xs text-slate-500 flex items-center gap-2">
                    <span>{selectedCustomer.phoneNumber}</span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setCustomerId("");
                    setSelectedCustomerObj(null);
                    setCustomerSearchQuery("");
                  }}
                  className="rounded-xl bg-white border border-slate-200 px-3 py-1 text-xs font-bold text-slate-600 transition hover:border-rose-200 hover:bg-rose-50 hover:text-rose-600"
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
                    placeholder="ابحث فوراً بالاسم أو رقم الهاتف..."
                    value={customerSearchQuery}
                    onChange={(e) => {
                      setCustomerSearchQuery(e.target.value);
                      setIsCustomerDropdownOpen(true);
                    }}
                    onFocus={() => setIsCustomerDropdownOpen(true)}
                    className="pr-10 bg-white font-bold"
                  />
                  {customerSearchQuery && (
                    <button 
                      type="button"
                      onClick={() => setCustomerSearchQuery("")}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 text-xs font-bold"
                    >
                      مسح
                    </button>
                  )}
                </div>
                
                {isCustomerDropdownOpen && (
                  <>
                    <div 
                      className="fixed inset-0 z-40" 
                      onClick={() => setIsCustomerDropdownOpen(false)}
                    />
                    <div className="absolute right-0 top-full z-50 mt-1 max-h-64 w-full overflow-y-auto rounded-2xl border border-slate-200 bg-white shadow-2xl divide-y divide-slate-100 animate-in fade-in zoom-in-95 duration-150">
                      <div className="bg-slate-50 px-3 py-1.5 text-[10px] font-bold text-slate-400 flex justify-between items-center">
                        <span>نتائج البحث ({filteredCustomers.length})</span>
                        {customerSearchQuery && <span>جارٍ الفلترة المباشرة...</span>}
                      </div>

                      {filteredCustomers.length === 0 ? (
                        <div className="p-4 text-center text-xs text-slate-400">
                          لا يوجد عملاء يطابقون "{customerSearchQuery}"
                        </div>
                      ) : (
                        filteredCustomers.map((c) => {
                          const nameLower = (c.fullName || "").toLowerCase();
                          const notesLower = (c.notes || "").toLowerCase();
                          const typeLower = (c.customerType || "").toLowerCase();
                          const isOwner = FIXED_OWNER_NAMES.some(o => nameLower.includes(o)) || typeLower === "owner" || typeLower === "owner_discount" || notesLower.includes("owner_discount") || notesLower.includes("مالك");

                          return (
                            <button
                              key={c.id}
                              type="button"
                              onClick={() => {
                                setCustomerId(c.id);
                                setSelectedCustomerObj(c);
                                setIsCustomerDropdownOpen(false);
                                setCustomerSearchQuery("");
                              }}
                              className={clsx(
                                "w-full text-right px-3.5 py-2.5 text-sm transition flex items-center justify-between",
                                isOwner ? "bg-purple-50/50 hover:bg-purple-100/60" : "hover:bg-slate-50"
                              )}
                            >
                              <div className="space-y-0.5">
                                <div className="font-bold text-slate-800 flex items-center gap-1.5">
                                  {c.fullName}
                                  {isOwner && <span className="text-xs">👑</span>}
                                </div>
                                <div className="text-xs text-slate-400">{c.phoneNumber || "بدون رقم"}</div>
                              </div>
                              <Badge tone={
                                isOwner ? "warn" :
                                c.customerType === "student" ? "info" :
                                c.customerType === "employee" ? "success" : "default"
                              }>
                                {isOwner ? "مالك المكان 👑" :
                                 c.customerType === "student" ? "طالب" :
                                 c.customerType === "employee" ? "موظف" :
                                 c.customerType === "trainer" ? "مدرب" : "عميل"}
                              </Badge>
                            </button>
                          );
                        })
                      )}
                    </div>
                  </>
                )}
              </div>
            )}
          </FormField>

          <div className="grid gap-3 sm:grid-cols-2">
            <FormField label="الغرفة المطلوبة">
              <Select 
                value={roomId} 
                onChange={(e) => {
                  const rId = e.target.value;
                  setRoomId(rId);
                  recalculatePrice(rId, bookingHours, manualDiscount, isSelectedCustomerOwner);
                }} 
                required 
                className="bg-white"
              >
                <option value="">-- اختر الغرفة --</option>
                {rooms.map((r) => (
                  <option key={r.id} value={r.id}>{r.name} (سعة {r.capacity})</option>
                ))}
              </Select>
            </FormField>
            <FormField label="نوع الحجز">
              <Select value={bookingType} onChange={(e) => setBookingType(e.target.value)} className="bg-white">
                <option value="meeting">اجتماع (Meeting)</option>
                <option value="training">تدريب (Training)</option>
                <option value="event">فعالية (Event)</option>
              </Select>
            </FormField>
          </div>

          {/* Check Owner Discount Status */}
          {isSelectedCustomerOwner && (
            <div className="rounded-2xl border border-purple-200 bg-purple-50/60 p-3 text-xs font-bold text-purple-900 flex items-center justify-between animate-in fade-in duration-300">
              <span className="flex items-center gap-1.5">
                👑 العميل من الإدارة / الملاك — يتم تطبيق **خصم 50%** تلقائياً
              </span>
              <Badge tone="warn">خصم 50%</Badge>
            </div>
          )}

          <div className="grid gap-3 sm:grid-cols-2">
            <FormField label="وقت البداية">
              <DateTimeInput 
                value={startTime} 
                onChange={(e) => {
                  const newStart = e.target.value;
                  setStartTime(newStart);
                  if (newStart && bookingHours) {
                    const dt = new Date(newStart);
                    dt.setHours(dt.getHours() + Number(bookingHours || 1));
                    setEndTime(dt.toISOString().slice(0, 16));
                  }
                }} 
                required 
              />
            </FormField>
            
            <FormField label="مدة الحجز (بالساعات)">
              <Input 
                type="text" 
                inputMode="numeric"
                value={bookingHours} 
                onChange={(e) => {
                  const hrs = e.target.value;
                  setBookingHours(hrs);
                  if (startTime && hrs) {
                    const dt = new Date(startTime);
                    dt.setHours(dt.getHours() + Number(hrs || 1));
                    setEndTime(dt.toISOString().slice(0, 16));
                  }
                  recalculatePrice(roomId, hrs, manualDiscount, isSelectedCustomerOwner);
                }} 
                placeholder="مثلاً: 2"
                className="bg-white font-mono font-bold"
              />
            </FormField>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <FormField label="وقت النهاية المحسوب تلقائياً">
              <DateTimeInput value={endTime} onChange={(e) => setEndTime(e.target.value)} required />
            </FormField>

            <FormField label="خصم مرن إضافي (جنيه)">
              <Input 
                type="text" 
                inputMode="decimal"
                value={manualDiscount} 
                onChange={(e) => {
                  const disc = e.target.value;
                  setManualDiscount(disc);
                  recalculatePrice(roomId, bookingHours, disc, isSelectedCustomerOwner);
                }} 
                placeholder="0"
                className="bg-white font-mono"
              />
            </FormField>
          </div>

          {conflictsQuery.data?.hasConflict && (
            <div className="rounded-2xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-800 flex items-center gap-2">
              <AlertTriangle size={16} className="text-rose-600 shrink-0" />
              <span>تنبيه: الغرفة محجوزة بالفعل في هذه الفترة أو تحتوي جلسة نشطة. اختر توقيتاً آخر.</span>
            </div>
          )}

          <div className="grid gap-3 sm:grid-cols-2">
            <FormField label="إجمالي مبلغ الحجز النهائي (جنيه)">
              <Input 
                type="text" 
                inputMode="decimal"
                value={totalAmount} 
                onChange={(e) => setTotalAmount(e.target.value)} 
                required 
                className="bg-white font-mono font-bold text-emerald-700"
              />
            </FormField>
            <FormField label="مبلغ العربون المدفوع (جنيه)">
              <Input 
                type="text" 
                inputMode="decimal"
                value={depositAmount} 
                onChange={(e) => setDepositAmount(e.target.value)} 
                placeholder="0"
                className="bg-white font-mono"
              />
            </FormField>
          </div>

          <FormField label="ملاحظات تفصيلية">
            <textarea 
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-white p-3 text-xs outline-none focus:border-slate-400"
              rows={2}
              placeholder="تفاصيل التجهيزات المرافقة للحجز..."
            />
          </FormField>

          <Btn 
            type="submit" 
            loading={createMutation.isPending} 
            loadingText="جاري تسجيل الحجز..." 
            disabled={!customerId || !roomId || conflictsQuery.isPending || conflictsQuery.isError || Boolean(conflictsQuery.data?.hasConflict)} 
            className="w-full shadow-md" 
            icon={<Check size={16} />}
          >
            تأكيد وتسجيل الحجز
          </Btn>
        </form>
      </Modal>

      {/* CONFIRMATION / REASON ACTION MODAL */}
      <Modal 
        isOpen={Boolean(bookingAction)} 
        onClose={() => setBookingAction(null)} 
        title={bookingAction?.action === "cancel" ? "إلغاء الحجز" : bookingAction?.action === "no-show" ? "تسجيل عدم حضور" : "إنهاء وإكمال الحجز"} 
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-xs text-slate-600 leading-relaxed">
            تأكيد الإجراء سيحدث حالة الحجز فوراً في السجل.
          </p>
          {bookingAction?.action === "cancel" && (
            <FormField label="سبب الإلغاء">
              <Input 
                value={bookingActionReason} 
                onChange={(e) => setBookingActionReason(e.target.value)} 
                placeholder="ادخل سبب الإلغاء..." 
                className="bg-white"
              />
            </FormField>
          )}
          <div className="flex gap-2 pt-2">
            <Btn 
              variant={bookingAction?.action === "cancel" ? "danger" : "warn"} 
              loading={bookingStatusMutation.isPending} 
              disabled={bookingAction?.action === "cancel" && !bookingActionReason.trim()} 
              onClick={() => {
                if (!bookingAction) return;
                bookingStatusMutation.mutate({ ...bookingAction, reason: bookingActionReason.trim() || undefined }, { onSuccess: () => setBookingAction(null) });
              }}
            >
              تأكيد الإجراء
            </Btn>
            <Btn variant="ghost" onClick={() => setBookingAction(null)}>رجوع</Btn>
          </div>
        </div>
      </Modal>

      {/* DAY DETAILS MODAL */}
      {selectedDate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
          <div className="w-full max-w-lg rounded-3xl bg-white shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="text-base font-black text-slate-900">{arabicDays[new Date(selectedDate).getDay()]}</h3>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{selectedDate}</p>
              </div>
              <button onClick={() => setSelectedDate(null)} className="h-8 w-8 flex items-center justify-center rounded-xl bg-slate-50 text-slate-400 hover:text-slate-900 transition">
                <X size={16} />
              </button>
            </div>
            <div className="p-5 max-h-[60vh] overflow-y-auto space-y-2.5">
              {bookingsByDay[selectedDate]?.map(b => (
                <button 
                  key={b.id} 
                  onClick={() => { setSelectedBookingId(b.id); setSelectedDate(null); }}
                  className="w-full text-right rounded-2xl border border-slate-100 bg-slate-50 p-3.5 hover:border-amber-300 hover:bg-amber-50/30 transition"
                >
                  <div className="flex items-center justify-between">
                    <Badge tone={statusBadgeTone(b.status)}>{translateStatus(b.status)}</Badge>
                    <div className="text-right">
                      <p className="font-bold text-slate-900 text-xs">{b.customer?.fullName ?? "—"}</p>
                      <p className="text-[10px] text-slate-500 mt-0.5">{b.room?.name ?? "—"} • {new Date(b.startTime).toLocaleTimeString("ar-EG", { hour: "2-digit", minute: "2-digit" })}</p>
                    </div>
                  </div>
                </button>
              ))}
              {(!bookingsByDay[selectedDate] || bookingsByDay[selectedDate].length === 0) && (
                <p className="py-8 text-center text-xs text-slate-400">لا توجد حجوزات في هذا اليوم</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
