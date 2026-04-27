"use client";

import { useQuery } from "@tanstack/react-query";
import { Activity, BookOpen, Coffee, DoorOpen, AlertTriangle, RefreshCw, Users, Clock, ChefHat, LayoutGrid, CheckCircle2, Timer, Zap } from "lucide-react";
import { api } from "../../../../lib/api";
import { dateTime } from "../../../../lib/format";
import { translateBookingType, translateOperationalAlert, translateRoomType, translateStatus } from "../../../../lib/labels";
import { Alert, Badge, EmptyState, Panel, SectionTitle, StatCard, statusBadgeTone } from "../../../../components/ui";

interface OpsDashboard {
  activeSessions: Array<{ id: string; customer?: { fullName: string }; room?: { name: string }; startTime: string }>;
  roomOccupancy: Array<{ roomName: string; roomType: string; status: string; capacity?: number; activeSessions: number; isOccupied: boolean }>;
  roomStats: { total: number; available: number; occupied: number; offline: number };
  upcomingBookings: Array<{ id: string; bookingType: string; startTime: string; room?: { name: string }; customer?: { fullName: string } }>;
  pendingBarOrders: Array<{ id: string; status: string; createdAt: string; waitMinutes?: number; customer?: { fullName: string }; items: Array<{ product: { name: string }; quantity: number }> }>;
  urgentOrderMinutes: number | null;
  alerts: string[];
}

function minutesSince(isoTime: string) {
  return Math.round((Date.now() - new Date(isoTime).getTime()) / 60000);
}

export default function OperationsDashboardPage() {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["dashboard", "operations-manager"],
    queryFn: async () => { const r = await api.get("/dashboards/operations-manager"); return r.data.data as OpsDashboard; },
    refetchInterval: 20000,
  });

  if (isLoading) return (
    <div className="flex flex-col items-center justify-center gap-3 py-20">
      <RefreshCw size={28} className="animate-spin text-slate-400" />
      <p className="text-sm text-slate-500">بيجيب بيانات العمليات...</p>
    </div>
  );
  if (error || !data) return <div className="py-10"><Alert tone="danger">مشكلة في تحميل لوحة العمليات.</Alert></div>;

  const hasUrgentOrder = (data.urgentOrderMinutes ?? 0) > 15;

  return (
    <div className="space-y-6">
      <SectionTitle
        title="لوحة مدير العمليات"
        subtitle="متابعة لحظية — الجلسات والغرف والحجوزات وطلبات البار."
        icon={<Activity size={20} />}
        action={
          <button onClick={() => refetch()} className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 transition hover:bg-slate-50">
            <RefreshCw size={12} /> تحديث
          </button>
        }
      />

      {/* Alerts */}
      {data.alerts.length > 0 ? (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
          <div className="mb-2 flex items-center gap-2">
            <AlertTriangle size={16} className="text-amber-600" />
            <p className="text-sm font-bold text-amber-800">تنبيهات تشغيلية</p>
          </div>
          <ul className="space-y-1">
            {data.alerts.map((a, i) => <li key={i} className="text-sm text-amber-700">{translateOperationalAlert(a)}</li>)}
          </ul>
        </div>
      ) : (
        <div className="flex items-center gap-2 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3">
          <CheckCircle2 size={15} className="text-emerald-600" />
          <p className="text-sm font-medium text-emerald-700">كل حاجة تمام — مفيش تنبيهات حالياً.</p>
        </div>
      )}

      {/* Urgent bar order alert */}
      {hasUrgentOrder && (
        <div className="flex items-center gap-3 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3">
          <Timer size={16} className="shrink-0 text-rose-600" />
          <p className="text-sm font-semibold text-rose-700">
            ⚠️ في طلب بار مستني {data.urgentOrderMinutes} دقيقة — كلم الباريستا!
          </p>
        </div>
      )}

      {/* KPIs */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="جلسات شغالة" value={data.activeSessions.length} tone="info" icon={<Users size={18} />} sub="دلوقتي جوا" />
        <StatCard label="حجوزات القادمة (24h)" value={data.upcomingBookings.length} icon={<BookOpen size={18} />} />
        <StatCard label="طلبات بار معلقة" value={data.pendingBarOrders.length} tone={data.pendingBarOrders.length > 5 ? "warn" : "default"} icon={<Coffee size={18} />} />
        <StatCard label="الغرف المتاحة" value={`${data.roomStats?.available ?? 0} / ${data.roomStats?.total ?? 0}`} icon={<DoorOpen size={18} />} tone={data.roomStats?.available === 0 ? "danger" : "success"} />
      </div>

      {/* Room occupancy + sessions */}
      <div className="grid gap-4 lg:grid-cols-2">
        <Panel title="حالة الغرف" icon={<LayoutGrid size={15} />} action={
          <div className="flex gap-2 text-[10px]">
            <span className="rounded bg-emerald-100 px-1.5 py-0.5 font-bold text-emerald-700">{data.roomStats?.available ?? 0} فاضية</span>
            <span className="rounded bg-amber-100 px-1.5 py-0.5 font-bold text-amber-700">{data.roomStats?.occupied ?? 0} مشغولة</span>
            {(data.roomStats?.offline ?? 0) > 0 && <span className="rounded bg-rose-100 px-1.5 py-0.5 font-bold text-rose-700">{data.roomStats.offline} متعطلة</span>}
          </div>
        }>
          {data.roomOccupancy.length === 0 ? (
            <EmptyState icon={<DoorOpen size={32} />} title="مفيش غرف مسجلة" />
          ) : (
            <div className="grid gap-2 sm:grid-cols-2">
              {data.roomOccupancy.map((room) => {
                const isOff = room.status === "out_of_service";
                const isOcc = room.isOccupied;
                return (
                  <div key={room.roomName} className={`flex items-start gap-3 rounded-xl border p-3 ${isOff ? "border-rose-200 bg-rose-50" : isOcc ? "border-amber-200 bg-amber-50" : "border-emerald-200 bg-emerald-50"}`}>
                    <DoorOpen size={16} className={`mt-0.5 shrink-0 ${isOff ? "text-rose-400" : isOcc ? "text-amber-500" : "text-emerald-500"}`} />
                    <div className="min-w-0 flex-1 text-right">
                      <p className="text-xs font-bold text-slate-800">{room.roomName}</p>
                      <p className="text-[10px] text-slate-500">{translateRoomType(room.roomType)}{room.capacity ? ` · ${room.capacity} شخص` : ""}</p>
                      <div className="mt-1">
                        <Badge tone={statusBadgeTone(isOcc ? "occupied" : room.status)}>{isOcc ? `مشغولة — ${room.activeSessions} مدة` : translateStatus(room.status)}</Badge>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Panel>

        <Panel title="الجلسات الشغالة" icon={<Clock size={15} />} action={
          <span className="rounded-full bg-blue-100 px-2 py-0.5 text-xs font-bold text-blue-700">{data.activeSessions.length}</span>
        }>
          {data.activeSessions.length === 0 ? (
            <EmptyState icon={<Users size={32} />} title="مفيش جلسات نشطة" />
          ) : (
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {data.activeSessions.map((s) => {
                const mins = minutesSince(s.startTime);
                return (
                  <div key={s.id} className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
                    <div className="flex items-center gap-2">
                      <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${mins > 120 ? "bg-amber-100 text-amber-700" : "bg-slate-100 text-slate-600"}`}>
                        {mins >= 60 ? `${Math.floor(mins / 60)}س ${mins % 60}د` : `${mins}د`}
                      </span>
                    </div>
                    <div className="text-right">
                      <p className="text-xs font-semibold text-slate-800">{s.customer?.fullName ?? "—"}</p>
                      <p className="text-[10px] text-slate-500">{s.room?.name ?? "بدون غرفة"}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Panel>
      </div>

      {/* Bookings + Bar orders */}
      <div className="grid gap-4 lg:grid-cols-2">
        <Panel title="الحجوزات القادمة (24 ساعة)" icon={<BookOpen size={15} />}>
          {data.upcomingBookings.length === 0 ? (
            <EmptyState icon={<BookOpen size={32} />} title="مفيش حجوزات قادمة" />
          ) : (
            <div className="space-y-2">
              {data.upcomingBookings.map((b) => (
                <div key={b.id} className="flex items-center justify-between rounded-xl border border-slate-200 px-3 py-2.5">
                  <div className="flex items-center gap-2">
                    <Badge tone="info">{translateBookingType(b.bookingType)}</Badge>
                    <span className="text-xs text-slate-500">{dateTime(b.startTime)}</span>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-semibold text-slate-800">{b.customer?.fullName ?? "—"}</p>
                    <p className="text-[10px] text-slate-500">{b.room?.name ?? "—"}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Panel>

        <Panel title="طلبات البار المعلقة" icon={<ChefHat size={15} />}>
          {data.pendingBarOrders.length === 0 ? (
            <EmptyState icon={<Coffee size={32} />} title="مفيش طلبات معلقة" sub="كل الطلبات اتشالت 🎉" />
          ) : (
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {data.pendingBarOrders.map((order) => {
                const wait = order.waitMinutes ?? minutesSince(order.createdAt);
                const urgent = wait > 15;
                return (
                  <div key={order.id} className={`rounded-xl border px-3 py-2.5 ${urgent ? "border-rose-200 bg-rose-50" : "border-slate-200 bg-white"}`}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Badge tone={order.status === "in_preparation" ? "warn" : "info"}>{translateStatus(order.status)}</Badge>
                        <span className={`text-[10px] font-bold ${urgent ? "text-rose-600" : "text-slate-500"}`}>
                          {urgent ? "⚠️ " : ""}{wait}د انتظار
                        </span>
                      </div>
                      <div className="text-right">
                        <p className="text-xs font-semibold text-slate-800">{order.customer?.fullName ?? "بدون عميل"}</p>
                        <p className="text-[10px] text-slate-500">{order.items?.map(i => `${i.product.name}×${i.quantity}`).join(", ") ?? ""}</p>
                      </div>
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
