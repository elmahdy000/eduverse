"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Coffee, ChefHat, CheckCircle2, RefreshCw, PackageCheck, Timer, Flame, ArrowLeft, Wifi, WifiOff, MessageCircle, Send, X, Bell, Undo2, Ban, Pencil, Plus, Minus, Trash2 } from "lucide-react";

import Link from "next/link";
import { api } from "../../../../lib/api";
import { useBarOrderSocket } from "../../../../lib/useBarOrderSocket";
import { translateProductName } from "../../../../lib/labels";
import { Alert, Badge, EmptyState, Panel, SectionTitle, StatCard, CardSkeleton } from "../../../../components/ui";

interface BarOrderItem {
  id: string;
  quantity: number;
  productId?: string;
  product: { id?: string; name: string };
}

interface BarOrder {
  id: string;
  status: string;
  createdAt: string;
  notes?: string;
  waitMinutes?: number;
  guestCode?: string;
  customer?: { fullName: string };
  session?: { room?: { name: string } };
  items: BarOrderItem[];
}

interface BaristaData {
  newOrders: BarOrder[];
  inPreparationOrders: BarOrder[];
  readyOrders: BarOrder[];
  deliveredTodayCount: number;
  deliveredTodayOrders?: BarOrder[];
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

function OrderCard({ order, onAdvance, advanceLabel, advanceTone, onChat, unreadCount, onMoveBack, moveBackLabel, onCancel, onEditItems }: {
  order: BarOrder;
  onAdvance?: () => void;
  advanceLabel?: string;
  advanceTone?: "amber" | "success" | "blue";
  onChat?: () => void;
  unreadCount?: number;
  onMoveBack?: () => void;
  moveBackLabel?: string;
  onCancel?: () => void;
  onEditItems?: () => void;
}) {
  const btnCls = advanceTone === "success" ? "bg-emerald-600 hover:bg-emerald-700 text-white"
    : advanceTone === "amber" ? "bg-amber-500 hover:bg-amber-600 text-white"
    : "bg-blue-600 hover:bg-blue-700 text-white";

  const urgent = (order.waitMinutes ?? 0) > 15;

  const handleCancel = () => {
    if (!onCancel) return;
    if (window.confirm("متأكد إنك عايز تلغي الطلب ده؟")) onCancel();
  };

  return (
    <div className={`rounded-xl border p-4 shadow-sm transition ${urgent ? "border-rose-200 bg-rose-50" : "border-slate-200 bg-white"}`}>
      <div className="mb-3 flex items-start justify-between gap-2">
        <div className="flex flex-col gap-1 text-right">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="text-sm font-bold text-slate-900">{order.customer?.fullName ?? "بدون عميل"}</p>
            {order.guestCode && <Badge tone="info">كود: {order.guestCode}</Badge>}
            {order.session?.room?.name && (
              <span className="inline-flex items-center gap-1 rounded bg-purple-50 px-1.5 py-0.5 text-[10px] font-bold text-purple-700 border border-purple-150">
                {order.session.room.name}
              </span>
            )}
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
            <span className="text-slate-600">{translateProductName(item.product.name)}</span>
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

      {/* صف الإجراءات الثانوية: تعديل + رجوع خطوة + إلغاء */}
      {(onMoveBack || onCancel || onEditItems) && (
        <div className="mt-2 flex gap-2 border-t border-slate-100 pt-2">
          {onEditItems && (
            <button
              onClick={onEditItems}
              className="flex flex-1 items-center justify-center gap-1 rounded-lg py-1.5 text-[11px] font-bold text-blue-600 transition hover:bg-blue-50"
              title="تعديل الأصناف"
            >
              <Pencil size={12} /> تعديل
            </button>
          )}
          {onMoveBack && (
            <button
              onClick={onMoveBack}
              className="flex flex-1 items-center justify-center gap-1 rounded-lg py-1.5 text-[11px] font-bold text-slate-500 transition hover:bg-slate-100"
              title={moveBackLabel || "رجوع خطوة"}
            >
              <Undo2 size={12} /> {moveBackLabel || "رجوع خطوة"}
            </button>
          )}
          {onCancel && (
            <button
              onClick={handleCancel}
              className="flex flex-1 items-center justify-center gap-1 rounded-lg py-1.5 text-[11px] font-bold text-rose-500 transition hover:bg-rose-50"
              title="إلغاء الطلب"
            >
              <Ban size={12} /> إلغاء
            </button>
          )}
        </div>
      )}
    </div>
  );
}

export default function BaristaDashboardPage() {
  const queryClient = useQueryClient();
  const [isSocketLive, setIsSocketLive] = useState(false);
  const [newOrderFlash, setNewOrderFlash] = useState(false);
  const [notifPermission, setNotifPermission] = useState<NotificationPermission | "unknown">("unknown");
  const audioCtxRef = useRef<AudioContext | null>(null);

  // Request browser notification permission on mount
  useEffect(() => {
    if (typeof window !== "undefined" && "Notification" in window) {
      setNotifPermission(Notification.permission);
      if (Notification.permission === "default") {
        Notification.requestPermission().then((p) => setNotifPermission(p));
      }
    }
  }, []);

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

  // ── تعديل بنود الطلب ──
  const [editingOrder, setEditingOrder] = useState<BarOrder | null>(null);
  const [editItems, setEditItems] = useState<{ productId: string; name: string; quantity: number }[]>([]);
  const [addProductId, setAddProductId] = useState("");

  // قائمة المنتجات المتاحة (لإضافة صنف جديد أثناء التعديل)
  const productsListQuery = useQuery({
    queryKey: ["products", "barista-edit"],
    enabled: !!editingOrder,
    queryFn: async () => {
      const r = await api.get("/products", { params: { page: 1, limit: 200, active: true } });
      return r.data.data.data as { id: string; name: string; availability?: boolean }[];
    },
  });

  const openEditItems = (order: BarOrder) => {
    setEditingOrder(order);
    setEditItems(
      order.items.map((it) => ({
        productId: it.product?.id || it.productId || "",
        name: it.product?.name || "",
        quantity: it.quantity,
      })),
    );
    setAddProductId("");
  };

  const editItemsMutation = useMutation({
    mutationFn: () => {
      if (!editingOrder) throw new Error("no order");
      const items = editItems
        .filter((i) => i.productId && i.quantity > 0)
        .map((i) => ({ productId: i.productId, quantity: i.quantity }));
      return api.put(`/bar-orders/${editingOrder.id}/items`, { items });
    },
    onSuccess: () => {
      setEditingOrder(null);
      queryClient.invalidateQueries({ queryKey: ["dashboard", "barista"] });
    },
  });

  const changeEditQty = (productId: string, delta: number) => {
    setEditItems((prev) =>
      prev
        .map((i) => (i.productId === productId ? { ...i, quantity: Math.max(0, i.quantity + delta) } : i))
        .filter((i) => i.quantity > 0),
    );
  };

  const addEditItem = () => {
    if (!addProductId) return;
    const prod = productsListQuery.data?.find((p) => p.id === addProductId);
    if (!prod) return;
    setEditItems((prev) => {
      const existing = prev.find((i) => i.productId === addProductId);
      if (existing) {
        return prev.map((i) => (i.productId === addProductId ? { ...i, quantity: i.quantity + 1 } : i));
      }
      return [...prev, { productId: prod.id, name: prod.name, quantity: 1 }];
    });
    setAddProductId("");
  };

  // Auto-resume AudioContext on first user interaction to satisfy browser autoplay policies
  useEffect(() => {
    const handleGesture = () => {
      if (typeof window !== "undefined") {
        if (!audioCtxRef.current) {
          const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
          if (AudioContextClass) {
            audioCtxRef.current = new AudioContextClass();
          }
        }
        if (audioCtxRef.current && audioCtxRef.current.state === "suspended") {
          audioCtxRef.current.resume().catch(() => {});
        }
      }
    };
    window.addEventListener("click", handleGesture, { capture: true, passive: true });
    window.addEventListener("touchstart", handleGesture, { capture: true, passive: true });
    return () => {
      window.removeEventListener("click", handleGesture);
      window.removeEventListener("touchstart", handleGesture);
    };
  }, []);

  const playNotificationSound = useCallback(() => {
    // 1. Web Audio API beep (always works, no CDN needed)
    try {
      if (!audioCtxRef.current) {
        const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
        if (AudioContextClass) {
          audioCtxRef.current = new AudioContextClass();
        }
      }
      const ctx = audioCtxRef.current;
      if (ctx) {
        if (ctx.state === "suspended") {
          ctx.resume().catch(() => {});
        }
        const playBeep = (freq: number, start: number, duration: number) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.type = "sine";
          osc.frequency.setValueAtTime(freq, ctx.currentTime + start);
          gain.gain.setValueAtTime(0.4, ctx.currentTime + start);
          gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + start + duration);
          osc.start(ctx.currentTime + start);
          osc.stop(ctx.currentTime + start + duration);
        };
        // Triple chime: 880 → 1046 → 1318 Hz
        playBeep(880, 0.0, 0.25);
        playBeep(1046, 0.3, 0.25);
        playBeep(1318, 0.6, 0.4);
      } else {
        throw new Error("AudioContext class not supported");
      }
    } catch (e) {
      // 2. External CDN fallback
      try {
        const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');
        audio.play().catch(() => {});
      } catch {}
    }

    // 3. Visual flash
    setNewOrderFlash(true);
    setTimeout(() => setNewOrderFlash(false), 1200);

    // 4. Browser Push Notification
    if (typeof window !== "undefined" && "Notification" in window && Notification.permission === "granted") {
      new Notification("طلب جديد وصل!", {
        body: "في طلب جديد ينتظر التحضير — شوف لوحة الباريستا.",
        icon: "/favicon.ico",
        tag: "new-bar-order",
        requireInteraction: false,
      });
    }
  }, []);

  const [chatMessages, setChatMessages] = useState<any[]>([]);
  const [selectedGuestCode, setSelectedGuestCode] = useState<string | null>(null);
  const [chatInput, setChatInput] = useState("");
  const [unreadsByCode, setUnreadsByCode] = useState<Record<string, number>>({});

  // Real-time WebSocket connection — uses queryClient.invalidateQueries for instant, race-condition-free updates
  const { sendMessage, getChatHistory, joinChat } = useBarOrderSocket({
    onConnect: () => {
      setIsSocketLive(true);
    },
    onDisconnect: () => {
      setIsSocketLive(false);
    },
    onNewOrder: () => {
      queryClient.invalidateQueries({ queryKey: ["dashboard", "barista"] });
      playNotificationSound();
      setIsSocketLive(true);
    },
    onStatusUpdate: () => {
      queryClient.invalidateQueries({ queryKey: ["dashboard", "barista"] });
      setIsSocketLive(true);
    },
    onDashboardRefresh: () => {
      queryClient.invalidateQueries({ queryKey: ["dashboard", "barista"] });
      setIsSocketLive(true);
    },
    onChatMessage: (msg) => {
      console.log("[Socket.IO] 💬 Barista received chat:", msg);
      setChatMessages(prev => {
        if (prev.some(m => m.id === msg.id)) return prev;
        return [...prev, msg];
      });
      
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
    },
    onChatHistory: (history) => {
      console.log("[Socket.IO] 💬 Barista received history:", history);
      setChatMessages(prev => {
        const filtered = prev.filter(m => !history.some(h => h.id === m.id));
        return [...filtered, ...history].sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
      });
    }
  });

  useEffect(() => {
    console.log("[Chat] Selected guest changed to:", selectedGuestCode);
    if (selectedGuestCode) {
      setUnreadsByCode(prev => ({ ...prev, [selectedGuestCode]: 0 }));
      getChatHistory(selectedGuestCode);
    }
  }, [selectedGuestCode]);

  // الانضمام لغرف كل الطلبات النشطة اللي ليها كود عميل — عشان نستقبل رسايلها
  // لحظياً وعدّاد غير المقروء يشتغل حتى لو الشات مقفول.
  useEffect(() => {
    if (!data) return;
    const codes = new Set<string>();
    [...data.newOrders, ...data.inPreparationOrders, ...data.readyOrders].forEach((o) => {
      if (o.guestCode) codes.add(o.guestCode);
    });
    codes.forEach((code) => joinChat(code));
  }, [data]);

  const handleSendChat = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!chatInput.trim() || !selectedGuestCode) return;
    sendMessage(selectedGuestCode, "الباريستا", chatInput);
    setChatInput("");
  };

  // Polling fallback notification — only fires when WebSocket is NOT live
  // When socket is live, sound is already played via onNewOrder handler
  useEffect(() => {
    if (data && prevNewCount !== null && data.counts.new > prevNewCount && !isSocketLive) {
      playNotificationSound();
    }
    if (data) setPrevNewCount(data.counts.new);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data?.counts.new]);

  const advance = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      api.put(`/bar-orders/${id}/status`, { status }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["dashboard", "barista"] }),
  });

  // رجوع حالة الطلب خطوة للخلف (لو الباريستا دوس بالغلط)
  const moveBack = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      api.put(`/bar-orders/${id}/status`, { status }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["dashboard", "barista"] }),
  });

  // إلغاء الطلب من اللوحة مباشرة
  const cancelOrder = useMutation({
    mutationFn: ({ id }: { id: string }) => api.put(`/bar-orders/${id}/cancel`, {}),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["dashboard", "barista"] }),
  });


  if (isLoading) return (
    <div className="space-y-6 animate-pulse">
      <div className="h-8 bg-slate-100 rounded-lg w-1/3" />
      <div className="grid gap-3 sm:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <CardSkeleton key={i} />
        ))}
      </div>
      <div className="border border-slate-200 bg-white rounded-2xl p-5 shadow-sm space-y-4">
        <div className="h-4 bg-slate-200 rounded w-1/4" />
        <div className="grid gap-3 sm:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-32 bg-slate-100 rounded-xl" />
          ))}
        </div>
      </div>
    </div>
  );
  if (error || !data) return <div className="py-10"><Alert tone="danger">مش قادرين يجيبوا الطلبات.</Alert></div>;

  const totalActive = data.counts.new + data.counts.inPreparation;
  const hasUrgent = [...data.newOrders, ...data.inPreparationOrders].some(o => (o.waitMinutes ?? 0) > 15);

  return (
    <div className={`space-y-6 transition-all duration-300 ${newOrderFlash ? 'ring-4 ring-amber-400/60 rounded-2xl' : ''}`}>
      {/* Browser notification prompt */}
      {notifPermission === "default" && (
        <div className="flex items-center justify-between gap-3 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3">
          <div className="flex items-center gap-2">
            <Bell size={15} className="text-amber-600" />
            <p className="text-xs font-bold text-amber-700">فعّل إشعارات المتصفح عشان تتنبه بالطلبات الجديدة حتى لو النافذة مش في المقدمة.</p>
          </div>
          <button
            onClick={() => Notification.requestPermission().then((p) => setNotifPermission(p))}
            className="shrink-0 rounded-xl bg-amber-500 px-3 py-1.5 text-[11px] font-black text-white hover:bg-amber-600 transition"
          >
            تفعيل
          </button>
        </div>
      )}
      <SectionTitle
        title="لوحة الباريستا"
        subtitle="الطلبات بالترتيب — شيل من هنا وحطه هناك، ومتخليش حاجة تتأخر."
        icon={<Coffee size={20} />}
        action={
          <div className="flex items-center gap-2">
            <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-bold ${isSocketLive ? "bg-emerald-50 text-emerald-700 border border-emerald-200" : "bg-slate-50 text-slate-400 border border-slate-200"}`}>
              {isSocketLive ? <Wifi size={10} /> : <WifiOff size={10} />}
              {isSocketLive ? "مباشر" : "polling"}
            </span>
            <button 
              onClick={() => playNotificationSound()} 
              className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 transition hover:bg-slate-50"
              title="تجربة صوت التنبيه وتنشيط جرس المتصفح"
            >
              <Bell size={12} className="text-amber-500 animate-pulse" /> تجربة الجرس
            </button>
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
          <p className="text-sm font-bold text-rose-700">⚠ في طلبات مستنياك أكتر من 15 دقيقة — بسرعة!</p>
        </div>
      ) : totalActive === 0 ? (
        <div className="flex items-center gap-2 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3">
          <CheckCircle2 size={15} className="text-emerald-600" />
          <p className="text-sm font-medium text-emerald-700">استنى الطلبات الجديدة — دلوقتي لا توجد طلبات معلقة!</p>
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
                advanceLabel="▶ ابدأ التحضير" advanceTone="amber"
                onChat={() => setSelectedGuestCode(order.guestCode || null)}
                unreadCount={unreadsByCode[order.guestCode || '']}
                onEditItems={() => openEditItems(order)}
                onCancel={() => cancelOrder.mutate({ id: order.id })}
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
          <EmptyState icon={<ChefHat size={32} />} title="مفيش حاجة بتتجهز" />
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {data.inPreparationOrders.map((order) => (
              <OrderCard key={order.id} order={order}
                onAdvance={() => advance.mutate({ id: order.id, status: "ready" })}
                advanceLabel="✓ جاهز للتسليم" advanceTone="success"
                onChat={() => setSelectedGuestCode(order.guestCode || null)}
                unreadCount={unreadsByCode[order.guestCode || '']}
                onMoveBack={() => moveBack.mutate({ id: order.id, status: "new" })}
                moveBackLabel="رجوع لجديد"
                onEditItems={() => openEditItems(order)}
                onCancel={() => cancelOrder.mutate({ id: order.id })}
              />
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
                advanceLabel="📦 تم التسليم للعميل" advanceTone="blue"
                onChat={() => setSelectedGuestCode(order.guestCode || null)}
                unreadCount={unreadsByCode[order.guestCode || '']}
                onMoveBack={() => moveBack.mutate({ id: order.id, status: "in_preparation" })}
                moveBackLabel="رجوع للتحضير"
              />
            ))}
          </div>
        )}
      </Panel>

      {/* Delivered Today / Completed */}
      <Panel title="طلبات تم تسليمها اليوم (منتهية)" icon={<CheckCircle2 size={15} />} action={
        <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-bold text-slate-700">{data.deliveredTodayCount}</span>
      }>
        {(!data.deliveredTodayOrders || data.deliveredTodayOrders.length === 0) ? (
          <EmptyState icon={<CheckCircle2 size={32} />} title="لا توجد طلبات مسلّمة اليوم" />
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 opacity-80">
            {data.deliveredTodayOrders.map((order) => (
              <OrderCard key={order.id} order={order}
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
               <button type="submit" disabled={!chatInput.trim()} className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-600 text-white shadow-lg transition hover:bg-blue-700 disabled:opacity-40">
                 <Send size={18} />
               </button>
              </form>
            </div>
          </div>
        )}

      {/* ══ Modal تعديل بنود الطلب ══ */}
      {editingOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm" dir="rtl">
          <div className="flex max-h-[85vh] w-full max-w-md flex-col overflow-hidden rounded-3xl bg-white shadow-2xl border border-slate-200">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50 px-6 py-4">
              <div className="flex items-center gap-2">
                <Pencil size={16} className="text-blue-600" />
                <h3 className="text-sm font-black text-slate-900">تعديل أصناف الطلب</h3>
              </div>
              <button onClick={() => setEditingOrder(null)} className="flex h-9 w-9 items-center justify-center rounded-xl text-slate-400 hover:bg-white hover:text-slate-600 transition">
                <X size={18} />
              </button>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto p-5 space-y-4">
              {/* الأصناف الحالية */}
              <div className="space-y-2">
                {editItems.length === 0 ? (
                  <p className="rounded-xl bg-amber-50 border border-amber-200 px-3 py-2 text-center text-xs font-bold text-amber-700">
                    مفيش أصناف — ضيف صنف واحد على الأقل أو الغِ الطلب.
                  </p>
                ) : (
                  editItems.map((it) => (
                    <div key={it.productId} className="flex items-center justify-between gap-2 rounded-xl border border-slate-200 bg-white p-2.5">
                      <span className="flex-1 truncate text-xs font-bold text-slate-800">{translateProductName(it.name)}</span>
                      <div className="flex items-center gap-2">
                        <button onClick={() => changeEditQty(it.productId, -1)} className="h-7 w-7 rounded-lg bg-slate-100 flex items-center justify-center hover:bg-slate-200 transition">
                          <Minus size={12} className="text-slate-500" />
                        </button>
                        <span className="w-6 text-center text-xs font-black text-slate-900">{it.quantity}</span>
                        <button onClick={() => changeEditQty(it.productId, 1)} className="h-7 w-7 rounded-lg bg-slate-900 text-white flex items-center justify-center hover:bg-slate-800 transition">
                          <Plus size={12} />
                        </button>
                        <button onClick={() => changeEditQty(it.productId, -it.quantity)} className="h-7 w-7 rounded-lg text-rose-400 hover:bg-rose-50 flex items-center justify-center transition" title="حذف الصنف">
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* إضافة صنف جديد */}
              <div className="flex items-end gap-2 border-t border-slate-100 pt-4">
                <div className="flex-1">
                  <label className="mb-1 block text-[10px] font-black text-slate-400">إضافة صنف</label>
                  <select
                    value={addProductId}
                    onChange={(e) => setAddProductId(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-right text-xs outline-none focus:border-slate-900"
                  >
                    <option value="">اختر منتج...</option>
                    {(productsListQuery.data ?? [])
                      .filter((p) => p.availability !== false)
                      .map((p) => (
                        <option key={p.id} value={p.id}>{translateProductName(p.name)}</option>
                      ))}
                  </select>
                </div>
                <button onClick={addEditItem} disabled={!addProductId} className="flex items-center gap-1 rounded-xl bg-blue-600 px-3 py-2.5 text-xs font-bold text-white hover:bg-blue-700 disabled:opacity-40 transition">
                  <Plus size={14} /> ضيف
                </button>
              </div>
            </div>

            {/* Footer */}
            <div className="flex gap-2 border-t border-slate-100 p-4">
              <button
                onClick={() => editItemsMutation.mutate()}
                disabled={editItemsMutation.isPending || editItems.length === 0}
                className="flex flex-[2] items-center justify-center gap-2 rounded-xl bg-slate-900 py-3 text-sm font-black text-white hover:bg-slate-800 disabled:opacity-40 transition"
              >
                {editItemsMutation.isPending ? <RefreshCw size={16} className="animate-spin" /> : <CheckCircle2 size={16} />}
                حفظ التعديلات
              </button>
              <button onClick={() => setEditingOrder(null)} className="flex-1 rounded-xl border border-slate-200 py-3 text-sm font-bold text-slate-600 hover:bg-slate-50 transition">
                إلغاء
              </button>
            </div>
          </div>
        </div>
      )}
      </div>
    );
}
