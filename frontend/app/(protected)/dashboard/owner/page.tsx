"use client";

import { useQuery } from "@tanstack/react-query";
import { TrendingUp, TrendingDown, Users, DoorOpen, Calendar, Coffee, Receipt, Banknote, AlertTriangle, BarChart3, Crown, RefreshCw, UserPlus, Clock, Flame, Minus } from "lucide-react";
import { api } from "../../../../lib/api";
import { money } from "../../../../lib/format";
import { translateOperationalAlert } from "../../../../lib/labels";
import { Alert, Badge, EmptyState, Panel, SectionTitle, StatCard } from "../../../../components/ui";

interface OwnerData {
  activeCustomersNow: number;
  activeSessionsNow: number;
  occupiedRoomsNow: number;
  todayBookings: number;
  currentBarOrders: number;
  todayRevenue: number;
  invoicesToday: number;
  paymentsTodayAmount: number;
  yesterdayRevenue: number;
  weekRevenue: number;
  revenueTrend: number | null;
  avgSessionMinutes: number | null;
  dailyRevenue: Record<string, number>;
  totalCustomers: number;
  newCustomersToday: number;
  topProducts: Array<{ productName: string; quantity: number; revenue: number }>;
  operationalAlerts: string[];
}

function TrendChip({ pct }: { pct: number | null }) {
  if (pct === null) return <span className="text-xs text-slate-400">لا مقارنة</span>;
  const up = pct >= 0;
  return (
    <span className={`inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 text-[11px] font-semibold ${up ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-700"}`}>
      {pct === 0 ? <Minus size={10} /> : up ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
      {pct > 0 ? "+" : ""}{pct}% عن امبارح
    </span>
  );
}

export default function OwnerDashboardPage() {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["dashboard", "owner"],
    queryFn: async () => { const r = await api.get("/dashboards/owner"); return r.data.data as OwnerData; },
    refetchInterval: 60000,
  });

  const now = new Date();
  const greeting = now.getHours() < 12 ? "صباح الخير" : now.getHours() < 17 ? "النهارده إيه أخباره" : "مساء الخير";

  if (isLoading) return (
    <div className="flex flex-col items-center justify-center gap-3 py-20">
      <RefreshCw size={28} className="animate-spin text-slate-400" />
      <p className="text-sm text-slate-500">جاري تحميل اللوحة...</p>
    </div>
  );
  if (error || !data) return <div className="py-10"><Alert tone="danger">مش قادرين يجيبوا بيانات اللوحة.</Alert></div>;

  return (
    <div className="space-y-6">
      <SectionTitle
        title={`${greeting}، يا مالك 👑`}
        subtitle="ملخص تنفيذي لأداء النهارده وحالة التشغيل اللحظية."
        icon={<Crown size={20} />}
        action={
          <button onClick={() => refetch()} className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 transition hover:bg-slate-50">
            <RefreshCw size={12} /> تحديث
          </button>
        }
      />

      {/* Alerts */}
      {data.operationalAlerts.length > 0 && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
          <div className="mb-2 flex items-center gap-2">
            <AlertTriangle size={16} className="text-amber-600" />
            <p className="text-sm font-bold text-amber-800">تنبيهات تحتاج انتباهك</p>
          </div>
          <ul className="space-y-1.5">
            {data.operationalAlerts.map((a, i) => (
              <li key={i} className="text-sm text-amber-700">{translateOperationalAlert(a)}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Live pulse strip */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="داخل المكان دلوقتي" value={data.activeCustomersNow} icon={<Users size={18} />} tone="info" sub="عميل نشط" />
        <StatCard label="جلسات شغالة" value={data.activeSessionsNow} icon={<Clock size={18} />} tone="info" />
        <StatCard label="غرف مشغولة" value={data.occupiedRoomsNow} icon={<DoorOpen size={18} />} tone={data.occupiedRoomsNow > 0 ? "warn" : "default"} />
        <StatCard label="طلبات بار معلقة" value={data.currentBarOrders} icon={<Coffee size={18} />} tone={data.currentBarOrders > 10 ? "warn" : "default"} />
      </div>

      {/* Revenue row */}
      <div className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 shadow-sm">
          <div className="mb-2 flex items-center justify-between">
            <TrendChip pct={data.revenueTrend} />
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700">
              <TrendingUp size={18} />
            </div>
          </div>
          <p className="text-2xl font-bold text-emerald-800">{money(data.todayRevenue)}</p>
          <p className="mt-1 text-xs text-emerald-600">إيراد النهارده</p>
        </div>
        <StatCard label="إيراد امبارح" value={money(data.yesterdayRevenue)} icon={<Banknote size={18} />} />
        <StatCard label="إيراد الأسبوع" value={money(data.weekRevenue)} tone="success" icon={<Flame size={18} />} sub="آخر 7 أيام" />
      </div>

      {/* Secondary KPIs */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="فواتير النهارده" value={data.invoicesToday} icon={<Receipt size={18} />} />
        <StatCard label="حجوزات النهارده" value={data.todayBookings} icon={<Calendar size={18} />} />
        <StatCard label="عملاء جدد النهارده" value={data.newCustomersToday} tone="success" icon={<UserPlus size={18} />} />
        <StatCard label="متوسط مدة المدة" value={data.avgSessionMinutes != null ? `${data.avgSessionMinutes} د` : "—"} icon={<Clock size={18} />} sub="المدد المغلقة النهارده" />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {/* Financial summary */}
        <Panel title="المؤشرات المالية" icon={<Banknote size={16} />}>
          <dl className="divide-y divide-slate-100">
            {[
              { label: "المحصّل النهارده",    value: money(data.paymentsTodayAmount), color: "text-emerald-700 font-bold" },
              { label: "إيراد امبارح",         value: money(data.yesterdayRevenue),   color: "text-slate-900" },
              { label: "إيراد الأسبوع",         value: money(data.weekRevenue),        color: "text-slate-900" },
              { label: "فواتير صادرة النهارده", value: data.invoicesToday,             color: "text-slate-900" },
              { label: "إجمالي العملاء",         value: data.totalCustomers,            color: "text-blue-700 font-semibold" },
            ].map(({ label, value, color }) => (
              <div key={label} className="flex items-center justify-between py-2.5">
                <span className={`text-sm ${color}`}>{value}</span>
                <span className="text-sm text-slate-500">{label}</span>
              </div>
            ))}
          </dl>
        </Panel>

        {/* Top products */}
        <Panel title="الأكتر مبيعاً في البار" icon={<BarChart3 size={16} />}>
          {data.topProducts.length === 0 ? (
            <EmptyState icon={<BarChart3 size={36} />} title="مفيش مبيعات لحد دلوقتي" />
          ) : (
            <div className="space-y-3">
              {data.topProducts.map((item, i) => {
                const pct = Math.round((item.revenue / (data.topProducts[0]?.revenue ?? 1)) * 100);
                const colors = ["bg-amber-400", "bg-slate-400", "bg-orange-400", "bg-blue-400", "bg-emerald-400"];
                return (
                  <div key={item.productName}>
                    <div className="mb-1.5 flex items-center justify-between text-sm">
                      <span className="font-bold text-emerald-700">{money(item.revenue)}</span>
                      <div className="flex items-center gap-2 text-right">
                        <span className="text-xs text-slate-500">×{item.quantity} وحدة</span>
                        <span className="font-semibold text-slate-800">{item.productName}</span>
                        <span className={`flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold text-white ${colors[i] ?? "bg-slate-400"}`}>
                          {i + 1}
                        </span>
                      </div>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                      <div className={`h-full rounded-full transition-all ${colors[i] ?? "bg-slate-400"}`} style={{ width: `${pct}%` }} />
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
