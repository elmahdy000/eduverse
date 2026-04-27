"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Coffee, ChefHat, CheckCircle2, RefreshCw, PackageCheck, Timer, Flame, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { api } from "../../../../lib/api";
import { translateStatus } from "../../../../lib/labels";
import { Alert, Badge, EmptyState, Panel, SectionTitle, StatCard } from "../../../../components/ui";

interface BarOrderItem {
  id: string;
  quantity: number;
  product: { name: string };
}

interface BarOrder {
  id: string;
  status: string;
  createdAt: string;
  notes?: string;
  waitMinutes?: number;
  customer?: { fullName: string };
  items: BarOrderItem[];
}

interface BaristaData {
  newOrders: BarOrder[];
  inPreparationOrders: BarOrder[];
  readyOrders: BarOrder[];
  deliveredTodayCount: number;
  counts: { new: number; inPreparation: number; ready: number };
}

function WaitBadge({ minutes }: { minutes?: number }) {
  if (!minutes && minutes !== 0) return null;
  const urgent = minutes > 15;
  const warn = minutes > 8;
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold ${urgent ? "bg-rose-100 text-rose-700" : warn ? "bg-amber-100 text-amber-700" : "bg-slate-100 text-slate-600"}`}>
      <Timer size={9} />
      {minutes}د
    </span>
  );
}

function OrderCard({ order, onAdvance, advanceLabel, advanceTone }: {
  order: BarOrder;
  onAdvance?: () => void;
  advanceLabel?: string;
  advanceTone?: "amber" | "success" | "blue";
}) {
  const btnCls = advanceTone === "success" ? "bg-emerald-600 hover:bg-emerald-700 text-white"
    : advanceTone === "amber" ? "bg-amber-500 hover:bg-amber-600 text-white"
    : "bg-blue-600 hover:bg-blue-700 text-white";

  const urgent = (order.waitMinutes ?? 0) > 15;

  return (
    <div className={`rounded-xl border p-4 shadow-sm transition ${urgent ? "border-rose-200 bg-rose-50" : "border-slate-200 bg-white"}`}>
      <div className="mb-3 flex items-start justify-between gap-2">
        <div className="flex flex-col gap-1 text-right">
          <p className="text-sm font-bold text-slate-900">{order.customer?.fullName ?? "بدون عميل"}</p>
          <p className="font-mono text-[10px] text-slate-400">#{order.id.slice(0, 8)}</p>
        </div>
        <div className="flex flex-col items-end gap-1">
          <WaitBadge minutes={order.waitMinutes} />
          {urgent && <span className="text-[10px] font-bold text-rose-600">⚠️ عاجل!</span>}
        </div>
      </div>

      <ul className="mb-3 space-y-1 rounded-lg bg-slate-100 p-2">
        {order.items.map((item) => (
          <li key={item.id} className="flex items-center justify-between text-xs">
            <span className="font-bold text-slate-700">×{item.quantity}</span>
            <span className="text-slate-600">{item.product.name}</span>
          </li>
        ))}
      </ul>

      {order.notes && (
        <p className="mb-3 rounded-lg border border-amber-200 bg-amber-50 px-2 py-1.5 text-right text-xs text-amber-800">
          📝 {order.notes}
        </p>
      )}

      {onAdvance && advanceLabel && (
        <button onClick={onAdvance} className={`w-full rounded-xl py-2 text-xs font-bold transition ${btnCls}`}>
          {advanceLabel}
        </button>
      )}
    </div>
  );
}

export default function BaristaDashboardPage() {
  const qc = useQueryClient();

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["dashboard", "barista"],
    queryFn: async () => {
      const r = await api.get("/dashboards/barista");
      return r.data.data as BaristaData;
    },
    refetchInterval: 30000,
  });

  const advance = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      api.put(`/bar-orders/${id}/status`, { status }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["dashboard", "barista"] }),
  });

  if (isLoading) return (
    <div className="flex flex-col items-center justify-center gap-3 py-20">
      <RefreshCw size={28} className="animate-spin text-slate-400" />
      <p className="text-sm text-slate-500">بيجيب الطلبات...</p>
    </div>
  );
  if (error || !data) return <div className="py-10"><Alert tone="danger">مش قادرين يجيبوا الطلبات.</Alert></div>;

  const totalActive = data.counts.new + data.counts.inPreparation;
  const hasUrgent = [...data.newOrders, ...data.inPreparationOrders].some(o => (o.waitMinutes ?? 0) > 15);

  return (
    <div className="space-y-6">
      <SectionTitle
        title="لوحة الباريستا ☕"
        subtitle="الطلبات بالترتيب — شيل من هنا وحطه هناك، ومتخليش حاجة تتأخر."
        icon={<Coffee size={20} />}
        action={
          <div className="flex items-center gap-2">
            <Link
              href="/dashboard/barista/pos"
              className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 transition hover:bg-slate-50"
            >
              <ArrowLeft size={12} /> نقطة البيع
            </Link>
            <button onClick={() => refetch()} className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 transition hover:bg-slate-50">
              <RefreshCw size={12} /> تحديث
            </button>
          </div>
        }
      />

      {/* Alert strip */}
      {hasUrgent ? (
        <div className="flex items-center gap-3 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3">
          <Flame size={16} className="shrink-0 text-rose-600" />
          <p className="text-sm font-bold text-rose-700">في طلبات مستنياك أكتر من 15 دقيقة — بسرعة!</p>
        </div>
      ) : totalActive === 0 ? (
        <div className="flex items-center gap-2 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3">
          <CheckCircle2 size={15} className="text-emerald-600" />
          <p className="text-sm font-medium text-emerald-700">استنى الطلبات الجديدة — دلوقتي مفيش طلبات معلقة! 🎉</p>
        </div>
      ) : null}

      {/* Stats */}
      <div className="grid gap-3 sm:grid-cols-4">
        <StatCard label="جديدة" value={data.counts.new} tone="info" icon={<Coffee size={18} />} sub="تحتاج تحضير" />
        <StatCard label="بتتجهز" value={data.counts.inPreparation} tone="warn" icon={<ChefHat size={18} />} />
        <StatCard label="جاهزة" value={data.counts.ready} tone="success" icon={<PackageCheck size={18} />} sub="استنى التسليم" />
        <StatCard label="سلّمناها النهارده" value={data.deliveredTodayCount ?? 0} icon={<CheckCircle2 size={18} />} />
      </div>

      {/* New orders */}
      <Panel title="طلبات جديدة" icon={<Coffee size={15} />} action={
        <span className="rounded-full bg-blue-100 px-2 py-0.5 text-xs font-bold text-blue-700">{data.counts.new}</span>
      }>
        {data.newOrders.length === 0 ? (
          <EmptyState icon={<Coffee size={32} />} title="مفيش طلبات جديدة" sub="الطلبات الجديدة هتظهر هنا." />
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {data.newOrders.map((order) => (
              <OrderCard key={order.id} order={order}
                onAdvance={() => advance.mutate({ id: order.id, status: "in_preparation" })}
                advanceLabel="▶ ابدأ التحضير" advanceTone="amber" />
            ))}
          </div>
        )}
      </Panel>

      {/* In preparation */}
      <Panel title="بيتجهز دلوقتي" icon={<ChefHat size={15} />} action={
        <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-bold text-amber-700">{data.counts.inPreparation}</span>
      }>
        {data.inPreparationOrders.length === 0 ? (
          <EmptyState icon={<ChefHat size={32} />} title="مفيش حاجة بتتجهز" />
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {data.inPreparationOrders.map((order) => (
              <OrderCard key={order.id} order={order}
                onAdvance={() => advance.mutate({ id: order.id, status: "ready" })}
                advanceLabel="✓ جاهز للتسليم" advanceTone="success" />
            ))}
          </div>
        )}
      </Panel>

      {/* Ready */}
      <Panel title="جاهز — في انتظار التسليم" icon={<PackageCheck size={15} />} action={
        <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-bold text-emerald-700">{data.counts.ready}</span>
      }>
        {data.readyOrders.length === 0 ? (
          <EmptyState icon={<CheckCircle2 size={32} />} title="مفيش طلبات جاهزة" />
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {data.readyOrders.map((order) => (
              <OrderCard key={order.id} order={order}
                onAdvance={() => advance.mutate({ id: order.id, status: "delivered" })}
                advanceLabel="📦 تم التسليم للعميل" advanceTone="blue" />
            ))}
          </div>
        )}
      </Panel>
    </div>
  );
}
