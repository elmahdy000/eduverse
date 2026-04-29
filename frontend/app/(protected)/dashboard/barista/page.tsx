"use client";

import { useState, useEffect, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Coffee, ChefHat, CheckCircle2, RefreshCw, PackageCheck, Timer, Flame, ArrowLeft, Wifi, WifiOff, MessageCircle, Send, X, Bell } from "lucide-react";

import Link from "next/link";
import { api } from "../../../../lib/api";
import { translateStatus } from "../../../../lib/labels";
import { useBarOrderSocket } from "../../../../lib/useBarOrderSocket";
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
  guestCode?: string;
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
  onChat?: () => void;
  unreadCount?: number;
}) {
  const btnCls = advanceTone === "success" ? "bg-emerald-600 hover:bg-emerald-700 text-white"
    : advanceTone === "amber" ? "bg-amber-500 hover:bg-amber-600 text-white"
    : "bg-blue-600 hover:bg-blue-700 text-white";

  const urgent = (order.waitMinutes ?? 0) > 15;

  return (
    <div className={`rounded-xl border p-4 shadow-sm transition ${urgent ? "border-rose-200 bg-rose-50" : "border-slate-200 bg-white"}`}>
      <div className="mb-3 flex items-start justify-between gap-2">
        <div className="flex flex-col gap-1 text-right">
          <div className="flex items-center gap-2">
            <p className="text-sm font-bold text-slate-900">{order.customer?.fullName ?? "بدون عميل"}</p>
            {order.guestCode && <Badge tone="info">كود: {order.guestCode}</Badge>}
          </div>
          <p className="font-mono text-[10px] text-slate-400">#{order.id.slice(0, 8)}</p>
        </div>
        <div className="flex flex-col items-end gap-1">
          <WaitBadge minutes={order.waitMinutes} />
          {urgent && <span className="text-[10px] font-bold text-rose-600">⚠ عاجل!</span>}
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
           {order.notes}
        </p>
      )}

      <div className="flex gap-2">
        {onAdvance && advanceLabel && (
          <button onClick={onAdvance} className={`flex-1 rounded-xl py-2 text-xs font-bold transition ${btnCls}`}>
            {advanceLabel}
          </button>
        )}
        {onChat && (
          <button onClick={onChat} className="relative h-9 w-12 rounded-xl bg-slate-100 text-slate-600 hover:bg-blue-50 hover:text-blue-600 flex items-center justify-center transition">
            <MessageCircle size={16} />
            {unreadCount ? (
              <span className="absolute -top-1 -right-1 h-4 w-4 bg-rose-500 text-white text-[8px] font-black rounded-full flex items-center justify-center animate-bounce border-2 border-white">
                {unreadCount}
              </span>
            ) : null}
          </button>
        )}
      </div>
    </div>
  );
}

export default function BaristaDashboardPage() {
  const qc = useQueryClient();
  const [isSocketLive, setIsSocketLive] = useState(false);

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["dashboard", "barista"],
    queryFn: async () => {
      const r = await api.get(`/dashboards/barista?t=${Date.now()}`);
      return r.data.data as BaristaData;
    },
    refetchInterval: 5000, // Fallback polling every 5s
    refetchIntervalInBackground: true,
    staleTime: 0,
  });

  const [prevNewCount, setPrevNewCount] = useState<number | null>(null);

  const playNotificationSound = useCallback(() => {
    try {
      const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');
      audio.play().catch(() => {});
    } catch {}
  }, []);

  const [chatMessages, setChatMessages] = useState<any[]>([]);
  const [selectedGuestCode, setSelectedGuestCode] = useState<string | null>(null);
  const [chatInput, setChatInput] = useState("");
  const [unreadsByCode, setUnreadsByCode] = useState<Record<string, number>>({});

  // Real-time WebSocket connection — uses refetch() directly for instant update
  const { sendMessage } = useBarOrderSocket({
    onConnect: () => {
      setIsSocketLive(true);
    },
    onNewOrder: () => {
      refetch();
      playNotificationSound();
      setIsSocketLive(true);
    },
    onStatusUpdate: () => {
      refetch();
      setIsSocketLive(true);
    },
    onDashboardRefresh: () => {
      refetch();
      setIsSocketLive(true);
    },
    onChatMessage: (msg) => {
      console.log("[Socket.IO] 💬 Barista received chat:", msg);
      setChatMessages(prev => [...prev, msg]);
      
      // Update unreads if chat window is not open for this guest
      if (selectedGuestCode !== msg.orderId) {
        setUnreadsByCode(prev => {
          const next = { ...prev, [msg.orderId]: (prev[msg.orderId] || 0) + 1 };
          console.log("[Chat] Unreads updated:", next);
          return next;
        });
      }
      // Play chat sound
      try { new Audio('https://assets.mixkit.co/active_storage/sfx/2357/2357-preview.mp3').play().catch(() => {}) } catch {}
    }
  });

  useEffect(() => {
    console.log("[Chat] Selected guest changed to:", selectedGuestCode);
    if (selectedGuestCode) {
      setUnreadsByCode(prev => ({ ...prev, [selectedGuestCode]: 0 }));
    }
  }, [selectedGuestCode]);

  const handleSendChat = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!chatInput.trim() || !selectedGuestCode) return;
    sendMessage(selectedGuestCode, "الباريستا", chatInput);
    setChatInput("");
  };

  // Legacy notification sound for polling fallback
  useEffect(() => {
    if (data && prevNewCount !== null && data.counts.new > prevNewCount) {
      playNotificationSound();
    }
    if (data) setPrevNewCount(data.counts.new);
  }, [data?.counts.new]);

  const advance = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      api.put(`/bar-orders/${id}/status`, { status }),
    onSuccess: () => refetch(),
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
            <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-bold ${isSocketLive ? "bg-emerald-50 text-emerald-700 border border-emerald-200" : "bg-slate-50 text-slate-400 border border-slate-200"}`}>
              {isSocketLive ? <Wifi size={10} /> : <WifiOff size={10} />}
              {isSocketLive ? "مباشر" : "polling"}
            </span>
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
          <p className="text-sm font-bold text-rose-700">ي طلبات مستنياك أكتر من 15 دقيقة — بسرعة!</p>
        </div>
      ) : totalActive === 0 ? (
        <div className="flex items-center gap-2 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3">
          <CheckCircle2 size={15} className="text-emerald-600" />
          <p className="text-sm font-medium text-emerald-700">استنى الطلبات الجديدة — دلوقتي ميش طلبات معلقة! 🎉</p>
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
          <EmptyState icon={<Coffee size={32} />} title="ميش طلبات جديدة" sub="الطلبات الجديدة هتظهر هنا." />
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {data.newOrders.map((order) => (
              <OrderCard key={order.id} order={order}
                onAdvance={() => advance.mutate({ id: order.id, status: "in_preparation" })}
                advanceLabel="▶ ابدأ التحضير" advanceTone="amber" 
                onChat={() => setSelectedGuestCode(order.guestCode || null)}
                unreadCount={unreadsByCode[order.guestCode || '']}
              />
            ))}
          </div>
        )}
      </Panel>

      {/* In preparation */}
      <Panel title="بيتجهز دلوقتي" icon={<ChefHat size={15} />} action={
        <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-bold text-amber-700">{data.counts.inPreparation}</span>
      }>
        {data.inPreparationOrders.length === 0 ? (
          <EmptyState icon={<ChefHat size={32} />} title="ميش حاجة بتتجهز" />
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {data.inPreparationOrders.map((order) => (
              <OrderCard key={order.id} order={order}
                onAdvance={() => advance.mutate({ id: order.id, status: "ready" })}
                advanceLabel="✓ جاهز للتسليم" advanceTone="success" 
                onChat={() => setSelectedGuestCode(order.guestCode || null)}
                unreadCount={unreadsByCode[order.guestCode || '']}
              />
            ))}
          </div>
        )}
      </Panel>

      {/* Ready */}
      <Panel title="جاهز — ي انتظار التسليم" icon={<PackageCheck size={15} />} action={
        <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-bold text-emerald-700">{data.counts.ready}</span>
      }>
        {data.readyOrders.length === 0 ? (
          <EmptyState icon={<CheckCircle2 size={32} />} title="ميش طلبات جاهزة" />
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {data.readyOrders.map((order) => (
              <OrderCard key={order.id} order={order}
                onAdvance={() => advance.mutate({ id: order.id, status: "delivered" })}
                advanceLabel="📦 تم التسليم للعميل" advanceTone="blue" 
                onChat={() => setSelectedGuestCode(order.guestCode || null)}
                unreadCount={unreadsByCode[order.guestCode || '']}
              />
            ))}
          </div>
        )}
      </Panel>
      {/* Barista Chat Window */}
      {selectedGuestCode && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm" dir="rtl">
           <div className="flex h-[600px] w-full max-w-lg flex-col overflow-hidden rounded-[2rem] bg-white shadow-2xl border border-slate-200">
             {/* Header */}
             <div className="flex items-center justify-between bg-slate-900 p-6 text-white">
               <div className="flex items-center gap-3">
                 <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600"><MessageCircle size={20} /></div>
                 <div>
                   <h3 className="text-sm font-black">دردشة مع طاولة {selectedGuestCode}</h3>
                   <p className="text-[10px] text-blue-300">مباشر • تواصل مع العميل</p>
                 </div>
               </div>
               <button onClick={() => setSelectedGuestCode(null)} className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 hover:bg-white/20 transition-colors">
                 <X size={20} />
               </button>
             </div>

             {/* Messages */}
             <div className="flex-1 overflow-y-auto bg-slate-50 p-6 space-y-4">
               {chatMessages.filter(m => m.orderId === selectedGuestCode).length === 0 ? (
                 <div className="flex h-full flex-col items-center justify-center text-center opacity-30">
                   <MessageCircle size={48} className="mb-4 text-slate-400" />
                   <p className="text-xs font-bold text-slate-500">لا توجد رسائل بعد لهذه الطاولة.</p>
                 </div>
               ) : (
                 chatMessages.filter(m => m.orderId === selectedGuestCode).map((msg, i) => (
                   <div key={i} className={`flex flex-col ${msg.sender === "الباريستا" ? "items-start" : "items-end"}`}>
                     <div className={`max-w-[80%] rounded-2xl p-3 text-xs font-bold ${msg.sender === "الباريستا" ? "bg-slate-900 text-white rounded-br-none" : "bg-white border border-slate-200 text-slate-800 rounded-bl-none"}`}>
                       {msg.text}
                     </div>
                     <span className="mt-1 px-2 text-[8px] text-slate-400">{msg.sender} • {new Date(msg.timestamp).toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })}</span>
                   </div>
                 ))
               )}
             </div>

             {/* Footer */}
             <form onSubmit={handleSendChat} className="flex items-center gap-2 border-t p-4">
               <input 
                 type="text" 
                 placeholder="اكتب ردك هنا..."
                 value={chatInput}
                 onChange={e => setChatInput(e.target.value)}
                 className="flex-1 rounded-xl bg-slate-100 px-4 py-3 text-xs font-bold outline-none focus:ring-2 focus:ring-blue-500/20"
               />
               <button type="submit" disabled={!chatInput.trim()} className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-600 text-white shadow-lg transition hover:bg-blue-700 disabled:opacity-50">
                 <Send size={18} className="rotate-180" />
               </button>
             </form>
           </div>
        </div>
      )}
    </div>
  );
}

