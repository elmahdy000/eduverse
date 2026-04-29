"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import {
  Activity,
  AlertTriangle,
  BookOpen,
  CalendarClock,
  CheckCircle2,
  ChevronLeft,
  Clock,
  Coffee,
  DoorOpen,
  Flame,
  LayoutGrid,
  RefreshCw,
  Users,
  Zap,
} from "lucide-react";
import { api } from "../../../../lib/api";
import { dateTime } from "../../../../lib/format";
import {
  translateBookingType,
  translateOperationalAlert,
  translateRoomType,
  translateStatus,
} from "../../../../lib/labels";
import {
  Alert,
  Badge,
  Btn,
  EmptyState,
  Panel,
  SectionTitle,
  StatCard,
  statusBadgeTone,
} from "../../../../components/ui";

interface OpsDashboard {
  activeSessions: Array<{
    id: string;
    customer?: { fullName: string };
    room?: { name: string };
    startTime: string;
  }>;
  roomOccupancy: Array<{
    roomName: string;
    roomType: string;
    status: string;
    capacity?: number;
    activeSessions: number;
    isOccupied: boolean;
  }>;
  roomStats: { total: number; available: number; occupied: number; offline: number };
  upcomingBookings: Array<{
    id: string;
    bookingType: string;
    startTime: string;
    room?: { name: string };
    customer?: { fullName: string };
  }>;
  pendingBarOrders: Array<{
    id: string;
    status: string;
    createdAt: string;
    waitMinutes?: number;
    customer?: { fullName: string };
    items: Array<{ product: { name: string }; quantity: number }>;
  }>;
  urgentOrderMinutes: number | null;
  alerts: string[];
}

function minutesSince(isoTime: string) {
  return Math.max(0, Math.round((Date.now() - new Date(isoTime).getTime()) / 60000));
}

function minutesTo(isoTime: string) {
  return Math.round((new Date(isoTime).getTime() - Date.now()) / 60000);
}

export default function OperationsDashboardPage() {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["dashboard", "operations-manager"],
    queryFn: async () => {
      const r = await api.get("/dashboards/operations-manager");
      return r.data.data as OpsDashboard;
    },
    refetchInterval: 20000,
  });

  const nextBooking = data?.upcomingBookings?.length
    ? [...data.upcomingBookings].sort((a, b) => +new Date(a.startTime) - +new Date(b.startTime))[0]
    : null;

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-20">
        <RefreshCw size={28} className="animate-spin text-slate-400" />
        <p className="text-sm text-slate-500">جارٍ تحميل لوحة العمليات...</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="py-10">
        <Alert tone="danger">حصلت مشكلة أثناء تحميل لوحة مدير العمليات.</Alert>
      </div>
    );
  }

  const hasUrgentOrder = (data.urgentOrderMinutes ?? 0) > 15;

  return (
    <div className="space-y-6">
      <SectionTitle
        title="لوحة مدير العمليات"
        subtitle="متابعة سريعة للحركة اليومية: الغرف، الجلسات، الحجوزات، وطلبات البار."
        icon={<Activity size={20} />}
        action={
          <div className="flex items-center gap-2">
            <Link href="/rooms">
              <Btn variant="secondary" size="sm" icon={<DoorOpen size={12} />}>إدارة الغرف</Btn>
            </Link>
            <button
              onClick={() => refetch()}
              className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 transition hover:bg-slate-50"
            >
              <RefreshCw size={12} /> تحديث
            </button>
          </div>
        }
      />

      {data.alerts.length > 0 ? (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
          <div className="mb-2 flex items-center gap-2">
            <AlertTriangle size={16} className="text-amber-600" />
            <p className="text-sm font-bold text-amber-800">تنبيهات تشغيلية</p>
          </div>
          <ul className="space-y-1">
            {data.alerts.map((a, i) => (
              <li key={i} className="text-sm text-amber-700">{translateOperationalAlert(a)}</li>
            ))}
          </ul>
        </div>
      ) : (
        <div className="flex items-center gap-2 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3">
          <CheckCircle2 size={15} className="text-emerald-600" />
          <p className="text-sm font-medium text-emerald-700">الوضع مستقر حاليًا، لا يوجد تنبيهات حرجة.</p>
        </div>
      )}

      {hasUrgentOrder && (
        <div className="flex items-center justify-between gap-3 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3">
          <div className="flex items-center gap-3">
            <Flame size={16} className="shrink-0 text-rose-600" />
            <p className="text-sm font-semibold text-rose-700">في طلب بار منتظر أكثر من {data.urgentOrderMinutes} دقيقة.</p>
          </div>
          <Link href="/bar-orders" className="text-xs font-bold text-rose-700 hover:underline">متابعة الطلبات</Link>
        </div>
      )}

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        <StatCard label="جلسات نشطة" value={data.activeSessions.length} tone="info" icon={<Users size={18} />} sub="حاليًا داخل المكان" />
        <StatCard label="حجوزات 24 ساعة" value={data.upcomingBookings.length} icon={<BookOpen size={18} />} />
        <StatCard label="طلبات بار معلقة" value={data.pendingBarOrders.length} tone={data.pendingBarOrders.length > 5 ? "warn" : "default"} icon={<Coffee size={18} />} />
        <StatCard label="غرف متاحة" value={`${data.roomStats?.available ?? 0} / ${data.roomStats?.total ?? 0}`} icon={<DoorOpen size={18} />} tone={data.roomStats?.available === 0 ? "danger" : "success"} />
        <StatCard
          label="أقرب حجز"
          value={nextBooking ? `${Math.max(0, minutesTo(nextBooking.startTime))} د` : "-"}
          icon={<CalendarClock size={18} />}
          tone={nextBooking && minutesTo(nextBooking.startTime) <= 30 ? "warn" : "default"}
          sub={nextBooking ? `${nextBooking.customer?.fullName ?? "-"}` : "لا يوجد"}
        />
      </div>

      <Panel title="إجراءات سريعة" icon={<Zap size={15} />}>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Link href="/sessions" className="rounded-xl border border-blue-200 bg-blue-50 p-3 text-right transition hover:bg-blue-100">
            <p className="text-sm font-bold text-blue-800">متابعة الجلسات</p>
            <p className="mt-1 text-xs text-blue-700">فتح/غلق الجلسات النشطة</p>
          </Link>
          <Link href="/bookings" className="rounded-xl border border-violet-200 bg-violet-50 p-3 text-right transition hover:bg-violet-100">
            <p className="text-sm font-bold text-violet-800">إدارة الحجوزات</p>
            <p className="mt-1 text-xs text-violet-700">تأكيد وتعديل الحجوزات</p>
          </Link>
          <Link href="/bar-orders" className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-right transition hover:bg-amber-100">
            <p className="text-sm font-bold text-amber-800">طابور طلبات البار</p>
            <p className="mt-1 text-xs text-amber-700">متابعة التأخير والحالة</p>
          </Link>
          <Link href="/rooms" className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-right transition hover:bg-emerald-100">
            <p className="text-sm font-bold text-emerald-800">حالة الغرف</p>
            <p className="mt-1 text-xs text-emerald-700">تفعيل وإيقاف الغرف</p>
          </Link>
        </div>
      </Panel>

      <div className="grid gap-4 lg:grid-cols-2">
        <Panel
          title="حالة الغرف"
          icon={<LayoutGrid size={15} />}
          action={
            <div className="flex gap-2 text-[10px]">
              <span className="rounded bg-emerald-100 px-1.5 py-0.5 font-bold text-emerald-700">{data.roomStats?.available ?? 0} متاحة</span>
              <span className="rounded bg-amber-100 px-1.5 py-0.5 font-bold text-amber-700">{data.roomStats?.occupied ?? 0} مشغولة</span>
              {(data.roomStats?.offline ?? 0) > 0 && <span className="rounded bg-rose-100 px-1.5 py-0.5 font-bold text-rose-700">{data.roomStats.offline} خارج الخدمة</span>}
            </div>
          }
        >
          {data.roomOccupancy.length === 0 ? (
            <EmptyState icon={<DoorOpen size={32} />} title="لا توجد غرف مسجلة" />
          ) : (
            <div className="grid gap-2 sm:grid-cols-2">
              {data.roomOccupancy.map((room) => {
                const isOff = room.status === "out_of_service";
                const isOcc = room.isOccupied;
                return (
                  <div
                    key={room.roomName}
                    className={`flex items-start gap-3 rounded-xl border p-3 ${isOff ? "border-rose-200 bg-rose-50" : isOcc ? "border-amber-200 bg-amber-50" : "border-emerald-200 bg-emerald-50"}`}
                  >
                    <DoorOpen size={16} className={`mt-0.5 shrink-0 ${isOff ? "text-rose-400" : isOcc ? "text-amber-500" : "text-emerald-500"}`} />
                    <div className="min-w-0 flex-1 text-right">
                      <p className="text-xs font-bold text-slate-800">{room.roomName}</p>
                      <p className="text-[10px] text-slate-500">
                        {translateRoomType(room.roomType)}
                        {room.capacity ? ` · ${room.capacity} شخص` : ""}
                      </p>
                      <div className="mt-1">
                        <Badge tone={statusBadgeTone(isOcc ? "occupied" : room.status)}>
                          {isOcc ? `مشغولة - ${room.activeSessions} جلسة` : translateStatus(room.status)}
                        </Badge>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Panel>

        <Panel
          title="الجلسات النشطة"
          icon={<Clock size={15} />}
          action={<span className="rounded-full bg-blue-100 px-2 py-0.5 text-xs font-bold text-blue-700">{data.activeSessions.length}</span>}
        >
          {data.activeSessions.length === 0 ? (
            <EmptyState icon={<Users size={32} />} title="لا توجد جلسات نشطة" />
          ) : (
            <div className="space-y-2 max-h-72 overflow-y-auto">
              {data.activeSessions.map((s) => {
                const mins = minutesSince(s.startTime);
                return (
                  <div key={s.id} className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
                    <Badge tone={mins > 120 ? "warn" : "default"}>{mins >= 60 ? `${Math.floor(mins / 60)}س ${mins % 60}د` : `${mins}د`}</Badge>
                    <div className="text-right">
                      <p className="text-xs font-semibold text-slate-800">{s.customer?.fullName ?? "-"}</p>
                      <p className="text-[10px] text-slate-500">{s.room?.name ?? "بدون غرفة"}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Panel>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Panel
          title="الحجوزات القادمة (24 ساعة)"
          icon={<BookOpen size={15} />}
          action={<Link href="/bookings" className="text-xs font-semibold text-slate-600 hover:text-slate-900">عرض الكل</Link>}
        >
          {data.upcomingBookings.length === 0 ? (
            <EmptyState icon={<BookOpen size={32} />} title="لا توجد حجوزات قادمة" />
          ) : (
            <div className="space-y-2">
              {data.upcomingBookings.slice(0, 8).map((b) => {
                const eta = minutesTo(b.startTime);
                return (
                  <div key={b.id} className="flex items-center justify-between rounded-xl border border-slate-200 px-3 py-2.5">
                    <div className="flex items-center gap-2">
                      <Badge tone="info">{translateBookingType(b.bookingType)}</Badge>
                      <span className="text-xs text-slate-500">{dateTime(b.startTime)}</span>
                    </div>
                    <div className="text-right">
                      <p className="text-xs font-semibold text-slate-800">{b.customer?.fullName ?? "-"}</p>
                      <p className="text-[10px] text-slate-500">{b.room?.name ?? "-"}</p>
                      <p className={`text-[10px] font-medium ${eta <= 30 ? "text-amber-600" : "text-slate-500"}`}>
                        {eta <= 0 ? "بدأ أو متأخر" : `بعد ${eta} دقيقة`}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Panel>

        <Panel
          title="طلبات البار المعلقة"
          icon={<Coffee size={15} />}
          action={<Link href="/bar-orders" className="text-xs font-semibold text-slate-600 hover:text-slate-900">فتح الطابور</Link>}
        >
          {data.pendingBarOrders.length === 0 ? (
            <EmptyState icon={<Coffee size={32} />} title="لا توجد طلبات معلقة" sub="كل الطلبات محدثة" />
          ) : (
            <div className="space-y-2 max-h-72 overflow-y-auto">
              {data.pendingBarOrders.map((order) => {
                const wait = order.waitMinutes ?? minutesSince(order.createdAt);
                const urgent = wait > 15;
                return (
                  <div key={order.id} className={`rounded-xl border px-3 py-2.5 ${urgent ? "border-rose-200 bg-rose-50" : "border-slate-200 bg-white"}`}>
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <Badge tone={order.status === "in_preparation" ? "warn" : "info"}>{translateStatus(order.status)}</Badge>
                        <span className={`text-[10px] font-bold ${urgent ? "text-rose-600" : "text-slate-500"}`}>
                          {urgent ? "متأخر - " : ""}{wait}د
                        </span>
                      </div>
                      <div className="text-right">
                        <p className="text-xs font-semibold text-slate-800">{order.customer?.fullName ?? "بدون عميل"}</p>
                        <p className="text-[10px] text-slate-500">{order.items?.slice(0, 2).map((i) => `${i.product.name}×${i.quantity}`).join("، ") || "-"}</p>
                      </div>
                    </div>
                    <div className="mt-2 flex justify-end">
                      <Link href="/bar-orders" className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-600 hover:text-slate-900">
                        متابعة الطلب <ChevronLeft size={12} />
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Panel>
      </div>
    </div>
  );
}
