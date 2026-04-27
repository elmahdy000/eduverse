"use client";

import { useQuery } from "@tanstack/react-query";
import { ConciergeBell, Users, Receipt, TrendingUp, Clock, RefreshCw, UserPlus, Timer, BookOpen, Coffee, X, Package, User, MapPin } from "lucide-react";
import { useState } from "react";
import { api } from "../../../../lib/api";
import { money } from "../../../../lib/format";
import { translateCustomerType } from "../../../../lib/labels";
import type { BarOrder } from "../../../../lib/types";
import { Alert, EmptyState, Panel, SectionTitle, StatCard, Badge } from "../../../../components/ui";

interface ReceptionDashboard {
  activeSessionCount: number;
  recentCustomers: Array<{ id: string; fullName: string; phoneNumber: string; customerType: string }>;
  todayInvoicesCount: number;
  todayRevenuePartial: number;
  todayBarOrders: number;
  activeSessions: Array<{ id: string; startTime: string; customer?: { fullName: string; customerType: string }; room?: { name: string } }>;
}

const ctypeColors: Record<string, string> = {
  student:  "bg-blue-100 text-blue-700",
  employee: "bg-violet-100 text-violet-700",
  trainer:  "bg-emerald-100 text-emerald-700",
  parent:   "bg-amber-100 text-amber-700",
  visitor:  "bg-slate-100 text-slate-600",
};

const ctypeIcons: Record<string, string> = {
  student: "🎓", employee: "💼", trainer: "🏋️", parent: "👨‍👧", visitor: "🚶",
};

function minutesSince(iso: string) {
  const m = Math.round((Date.now() - new Date(iso).getTime()) / 60000);
  if (m >= 60) return `${Math.floor(m / 60)}س ${m % 60}د`;
  return `${m}د`;
}

export default function ReceptionDashboardPage() {
  const [selectedBarOrder, setSelectedBarOrder] = useState<BarOrder | null>(null);

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["dashboard", "reception"],
    queryFn: async () => { const r = await api.get("/dashboards/reception"); return r.data.data as ReceptionDashboard; },
    refetchInterval: 20000,
  });

  const barOrdersQuery = useQuery({
    queryKey: ["bar-orders", "delivered"],
    queryFn: async () => {
      const response = await api.get("/bar-orders", {
        params: { status: "delivered", page: 1, limit: 20 }
      });
      return response.data.data as { data: BarOrder[] };
    },
  });

  if (isLoading) return (
    <div className="flex flex-col items-center justify-center gap-3 py-20">
      <RefreshCw size={28} className="animate-spin text-slate-400" />
      <p className="text-sm text-slate-500">بيجيب بيانات الاستقبال...</p>
    </div>
  );
  if (error || !data) return <div className="py-10"><Alert tone="danger">مش قادرين يجيبوا بيانات الاستقبال.</Alert></div>;

  return (
    <div className="space-y-6">
      <SectionTitle
        title="لوحة الاستقبال"
        subtitle="كل اللي محتاجه في دقيقة واحدة — الموجودين والداتا والاختصارات."
        icon={<ConciergeBell size={20} />}
        action={
          <button onClick={() => refetch()} className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 transition hover:bg-slate-50">
            <RefreshCw size={12} /> تحديث
          </button>
        }
      />

      {/* KPIs */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        <StatCard label="موجودين دلوقتي" value={data.activeSessionCount} tone="info" icon={<Timer size={18} />} sub="مدة نشطة" />
        <StatCard label="فواتير النهارده" value={data.todayInvoicesCount} icon={<Receipt size={18} />} />
        <StatCard label="محصّل النهارده" value={money(data.todayRevenuePartial)} tone="success" icon={<TrendingUp size={18} />} />
        <StatCard label="طلبات البار النهارده" value={data.todayBarOrders} icon={<Coffee size={18} />} />
        <StatCard label="آخر عملاء مسجلين" value={data.recentCustomers.length} icon={<UserPlus size={18} />} />
      </div>

      {/* Who's inside right now */}
      {data.activeSessions && data.activeSessions.length > 0 && (
        <Panel title="الموجودين جوا دلوقتي" icon={<Users size={15} />} action={
          <span className="rounded-full bg-blue-100 px-2 py-0.5 text-xs font-bold text-blue-700">{data.activeSessions.length} شخص</span>
        }>
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {data.activeSessions.map((s) => (
              <div key={s.id} className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3">
                <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-lg ${ctypeColors[s.customer?.customerType ?? "visitor"] ?? ctypeColors.visitor}`}>
                  {ctypeIcons[s.customer?.customerType ?? "visitor"] ?? "🚶"}
                </div>
                <div className="min-w-0 flex-1 text-right">
                  <p className="truncate text-sm font-semibold text-slate-900">{s.customer?.fullName ?? "—"}</p>
                  <p className="text-[10px] text-slate-500">{s.room?.name ?? "بدون غرفة"}</p>
                  <p className="text-[10px] font-medium text-blue-600">جوا من {minutesSince(s.startTime)}</p>
                </div>
              </div>
            ))}
          </div>
        </Panel>
      )}

      {/* Recent customers */}
      <Panel title="آخر العملاء المسجلين" icon={<Users size={15} />}>
        {data.recentCustomers.length === 0 ? (
          <EmptyState icon={<Users size={36} />} title="مفيش عملاء لحد دلوقتي" sub="سجّل أول عميل من صفحة العملاء." />
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {data.recentCustomers.map((c) => (
              <div key={c.id} className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
                <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-bold ${ctypeColors[c.customerType] ?? ctypeColors.visitor}`}>
                  {c.fullName[0]?.toUpperCase() ?? "?"}
                </div>
                <div className="min-w-0 flex-1 text-right">
                  <p className="truncate text-sm font-semibold text-slate-900">{c.fullName}</p>
                  <p className="truncate font-mono text-xs text-slate-500">{c.phoneNumber}</p>
                  <span className={`mt-1 inline-block rounded-full px-2 py-0.5 text-[10px] font-semibold ${ctypeColors[c.customerType] ?? ctypeColors.visitor}`}>
                    {ctypeIcons[c.customerType] ?? ""} {translateCustomerType(c.customerType)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </Panel>

      {/* Bar orders */}
      <Panel title="طلبات البار المنتهية" icon={<Coffee size={15} />}>
        {barOrdersQuery.data?.data?.length === 0 ? (
          <EmptyState icon={<Coffee size={36} />} title="مفيش طلبات بار منتهية" sub="الطلبات المنتهية هتظهر هنا." />
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {barOrdersQuery.data?.data?.map((order) => (
              <div
                key={order.id}
                onClick={() => setSelectedBarOrder(order)}
                className="cursor-pointer rounded-xl border border-slate-200 bg-gradient-to-br from-white to-slate-50 p-4 shadow-sm hover:shadow-md transition-all"
              >
                <div className="flex items-center justify-between mb-2">
                  <Badge tone="success">تم التسليم</Badge>
                  <span className="text-[10px] text-slate-500">
                    {new Date(order.createdAt).toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-sm font-semibold text-slate-900">
                    <User size={14} />
                    {order.customer?.fullName || "بدون عميل"}
                  </div>
                  {order.customer?.phoneNumber && (
                    <div className="text-xs text-slate-600">
                      {order.customer.phoneNumber}
                    </div>
                  )}
                  <div className="flex items-center justify-between pt-2 border-t border-slate-200">
                    <span className="text-xs text-slate-600">{order.items?.length || 0} صنف</span>
                    <span className="text-sm font-bold text-slate-900">{money(order.totalAmount)}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </Panel>

      {/* Quick actions */}
      <Panel title="اختصارات سريعة" icon={<ConciergeBell size={15} />}>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { label: "سجّل عميل جديد",  href: "/customers",  desc: "ضيف عميل للنظام",        color: "border-blue-200 bg-blue-50 hover:bg-blue-100 text-blue-700",    icon: "👤" },
            { label: "افتح مدة",        href: "/sessions",   desc: "ابدأ مدة لعميل موجود",  color: "border-emerald-200 bg-emerald-50 hover:bg-emerald-100 text-emerald-700", icon: "▶" },
            { label: "حجز جديد",         href: "/bookings",   desc: "سجّل حجز غرفة",          color: "border-violet-200 bg-violet-50 hover:bg-violet-100 text-violet-700", icon: "📅" },
            { label: "إصدار فاتورة",     href: "/billing",    desc: "اعمل فاتورة أو سجّل دفع", color: "border-amber-200 bg-amber-50 hover:bg-amber-100 text-amber-700",   icon: "🧾" },
          ].map((item) => (
            <a key={item.href} href={item.href} className={`block rounded-xl border p-4 text-right transition ${item.color}`}>
              <p className="text-xl mb-1">{item.icon}</p>
              <p className="text-sm font-bold">{item.label}</p>
              <p className="mt-0.5 text-xs opacity-75">{item.desc}</p>
            </a>
          ))}
        </div>
      </Panel>

      {/* Bar Order Details Modal */}
      {selectedBarOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-2xl rounded-2xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-200 p-6">
              <div>
                <h2 className="text-xl font-bold text-slate-900">تفاصيل طلب البار #{selectedBarOrder.id.slice(0, 8)}</h2>
                <p className="text-sm text-slate-600">{new Date(selectedBarOrder.createdAt).toLocaleString('ar-EG')}</p>
              </div>
              <button
                onClick={() => setSelectedBarOrder(null)}
                className="rounded-lg border border-slate-300 bg-white p-2 hover:bg-slate-50"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-6 max-h-[60vh] overflow-y-auto">
              <div className="space-y-4">
                {/* Customer Info */}
                <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                  <p className="text-xs font-semibold text-slate-600 mb-2">معلومات العميل</p>
                  <div className="space-y-1 text-sm">
                    <div className="flex items-center gap-2">
                      <User size={16} />
                      <span className="font-medium">{selectedBarOrder.customer?.fullName || "بدون عميل"}</span>
                    </div>
                    {selectedBarOrder.customer?.phoneNumber && (
                      <div className="text-xs text-slate-600">
                        {selectedBarOrder.customer.phoneNumber}
                      </div>
                    )}
                  </div>
                </div>

                {/* Order Items */}
                <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                  <p className="text-xs font-semibold text-slate-600 mb-2">الأصناف</p>
                  <div className="space-y-2">
                    {selectedBarOrder.items?.map((item, index) => (
                      <div key={index} className="flex items-center justify-between text-sm">
                        <div>
                          <p className="font-medium">{item.product?.name}</p>
                          <p className="text-xs text-slate-500">{item.quantity} × {money(item.unitPrice)}</p>
                        </div>
                        <span className="font-semibold">{money(item.total)}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Total */}
                <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold text-slate-600">الإجمالي</span>
                    <span className="text-xl font-bold text-slate-900">{money(selectedBarOrder.totalAmount)}</span>
                  </div>
                </div>

                {selectedBarOrder.notes && (
                  <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                    <p className="text-xs font-semibold text-slate-600 mb-2">ملاحظات</p>
                    <p className="text-sm text-slate-700">{selectedBarOrder.notes}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
