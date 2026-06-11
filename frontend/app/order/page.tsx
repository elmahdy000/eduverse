"use client";

import React, { useState, useEffect, useMemo } from "react";
import { 
  Coffee, ShoppingCart, CheckCircle2, 
  Search, Plus, Minus, Send, History,
  LogOut, MessageCircle, X, Info, Utensils,
  GlassWater, IceCream, Soup, Pizza, Sandwich, Bell,
  ChevronDown, ChevronUp, LayoutGrid, Heart, Leaf,
  Flame, Snowflake, Wine, Milk, Apple, Package,
  Droplets, Sparkles, Trash2, ArrowLeft, RefreshCw
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { api } from "../../lib/api";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { io, Socket } from "socket.io-client";
import { Input, Btn, Sheet, SheetHeader, SheetTitle, ScrollArea, Modal } from "@/components/ui";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { translateProductCategory, translateProductName, normalizeCategoryKey } from "@/lib/labels";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// --- Types ---
interface Product {
  id: string;
  name: string;
  price: number;
  category: string;
  description?: string;
  imageUrl?: string;
}

interface OrderItem {
  id: string;
  quantity: number;
  subtotal: number;
  product: Product;
}

interface Order {
  id: string;
  status: "new" | "in_preparation" | "ready" | "delivered" | "cancelled" | "completed";
  totalAmount: number;
  createdAt: string;
  items: OrderItem[];
}

type CategoryMeta = {
  icon: React.ElementType;
  iconColor: string;
  bgColor: string;
};

const categoryConfig: Record<string, CategoryMeta> = {
  all: { icon: LayoutGrid, iconColor: "text-slate-600", bgColor: "bg-slate-100" },
  coffee: { icon: Coffee, iconColor: "text-amber-600", bgColor: "bg-amber-50" },
  tea: { icon: Leaf, iconColor: "text-emerald-600", bgColor: "bg-emerald-50" },
  frappe: { icon: GlassWater, iconColor: "text-cyan-600", bgColor: "bg-cyan-50" },
  "cold-coffee": { icon: Snowflake, iconColor: "text-blue-600", bgColor: "bg-blue-50" },
  "hot-drinks": { icon: Flame, iconColor: "text-amber-600", bgColor: "bg-amber-50" },
  frappuccino: { icon: GlassWater, iconColor: "text-violet-600", bgColor: "bg-violet-50" },
  "milk-shake": { icon: Milk, iconColor: "text-pink-600", bgColor: "bg-pink-50" },
  smoothies: { icon: Apple, iconColor: "text-lime-600", bgColor: "bg-lime-50" },
  yougert: { icon: Droplets, iconColor: "text-teal-600", bgColor: "bg-teal-50" },
  cans: { icon: Package, iconColor: "text-slate-500", bgColor: "bg-slate-50" },
  mocktails: { icon: Wine, iconColor: "text-rose-600", bgColor: "bg-rose-50" },
  indomy: { icon: Utensils, iconColor: "text-red-600", bgColor: "bg-red-50" },
  "boba-drinks": { icon: Sparkles, iconColor: "text-purple-600", bgColor: "bg-purple-50" },
  additions: { icon: Plus, iconColor: "text-slate-500", bgColor: "bg-slate-100" },
};

function getCategoryMeta(cat: string): CategoryMeta {
  return categoryConfig[normalizeCategoryKey(cat)] ?? { icon: Utensils, iconColor: "text-amber-600", bgColor: "bg-amber-50" };
}

const getProductImage = (product: Product) => {
  if (product.imageUrl && product.imageUrl.trim() !== "" && product.imageUrl !== "null") {
    return product.imageUrl;
  }
  return ""; 
};

const money = (v: number) => new Intl.NumberFormat('ar-EG', { style: 'currency', currency: 'EGP' }).format(v);

// --- Components ---
const ProductImage = ({ product, className }: { product: Product, className?: string }) => {
  const [error, setError] = useState(false);
  const src = getProductImage(product);
  const meta = getCategoryMeta(product.category);
  const IconComp = meta.icon;

  if (!src || error) {
    return (
      <div className={cn("flex items-center justify-center border border-slate-100 transition-colors", meta.bgColor, meta.iconColor, className)}>
        <IconComp size={24} />
      </div>
    );
  }

  return (
    <img 
      src={src} 
      alt={product.name} 
      className={cn("object-cover border border-slate-100", className)} 
      onError={() => setError(true)} 
    />
  );
};

const CompactProgress = ({ status }: { status: string }) => {
  const steps = [
    { id: "new", label: "مستلم" },
    { id: "in_preparation", label: "يُحضر" },
    { id: "ready", label: "جاهز" },
    { id: "delivered", label: "مكتمل" },
  ];
  
  const normalizedStatus = status === "completed" ? "delivered" : status;
  const currentIndex = steps.findIndex(s => s.id === normalizedStatus);
  const isCancelled = status === "cancelled";

  if (isCancelled) {
    return (
      <div className="mt-3 text-xs font-bold text-rose-600 bg-rose-50 border border-rose-100 px-3 py-1.5 rounded-xl inline-flex items-center gap-1.5">
        <X size={14} /> تم إلغاء الطلب
      </div>
    );
  }

  return (
    <div className="mt-4 px-2">
      <div className="relative">
        {/* Background Track */}
        <div className="absolute top-[6px] left-0 right-0 h-1 bg-slate-100 rounded-full" />
        
        {/* Active Fill Track */}
        <div 
          className="absolute top-[6px] right-0 h-1 bg-amber-500 rounded-full transition-all duration-700 ease-out"
          style={{ width: currentIndex >= 0 ? `${(currentIndex / (steps.length - 1)) * 100}%` : '0%' }}
        />
        
        {/* Step Indicators */}
        <div className="relative z-10 flex justify-between">
          {steps.map((step, i) => {
            const isActive = currentIndex >= i;
            const isCurrent = currentIndex === i;
            
            return (
              <div key={step.id} className="flex flex-col items-center gap-2">
                <div 
                  className={cn(
                    "h-4 w-4 rounded-full border-[3px] transition-all duration-500 flex items-center justify-center bg-white",
                    isActive ? "border-amber-500" : "border-slate-200",
                    isCurrent ? "scale-125 shadow-sm" : "scale-100"
                  )} 
                >
                  {isActive && <div className={cn("rounded-full bg-amber-500 transition-all", isCurrent ? "h-1.5 w-1.5" : "h-0 w-0")} />}
                </div>
                <span className={cn(
                  "text-[10px] font-bold transition-colors whitespace-nowrap",
                  isActive ? "text-slate-800" : "text-slate-400"
                )}>
                  {step.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

const CancellationTimer = ({ orderId, createdAt, onCancel }: { orderId: string, createdAt: string, onCancel: (id: string) => void }) => {
  const [timeLeft, setTimeLeft] = useState(10);
  
  useEffect(() => {
    const start = new Date(createdAt).getTime();
    const tick = () => {
      const now = Date.now();
      const diff = Math.max(0, 10 - Math.floor((now - start) / 1000));
      setTimeLeft(diff);
    };
    
    tick();
    const timer = setInterval(tick, 1000);
    return () => clearInterval(timer);
  }, [createdAt]);

  if (timeLeft <= 0) return null;

  return (
    <button 
      onClick={() => onCancel(orderId)}
      className="mt-2 text-[10px] font-bold text-rose-600 bg-rose-50 border border-rose-100 px-3 py-1.5 rounded-lg hover:bg-rose-100 transition-colors flex items-center justify-center gap-1.5 w-full"
    >
      <X size={12} /> إلغاء الطلب ({timeLeft}ث)
    </button>
  );
};

export default function GuestOrderPage() {
  const [guestCode, setGuestCode] = useState("");
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [activeTab, setActiveTab] = useState<"menu" | "history">("menu");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [cart, setCart] = useState<Record<string, number>>({});
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isReviewOpen, setIsReviewOpen] = useState(false);
  const [orderNotes, setOrderNotes] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [message, setMessage] = useState<{ text: string; ok: boolean } | null>(null);
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);

  const [chatMessages, setChatMessages] = useState<any[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [socket, setSocket] = useState<Socket | null>(null);

  const queryClient = useQueryClient();

  const audioCtxRef = React.useRef<AudioContext | null>(null);

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

  const playBellSound = () => {
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
        const playTone = (freq: number, start: number, duration: number) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.type = "sine";
          osc.frequency.setValueAtTime(freq, ctx.currentTime + start);
          gain.gain.setValueAtTime(0.3, ctx.currentTime + start);
          gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + start + duration);
          osc.start(ctx.currentTime + start);
          osc.stop(ctx.currentTime + start + duration);
        };
        // Sweet double chime: 523Hz (C5) -> 659Hz (E5)
        playTone(523, 0, 0.3);
        playTone(659, 0.15, 0.4);
      }
    } catch (e) {
      console.error("Failed to play bell sound:", e);
    }
  };

  const validateCodeMutation = useMutation({
    mutationFn: async (code: string) => {
      const r = await api.get(`/public/orders/validate/${code}`);
      return r.data.data.isValid as boolean;
    },
    onSuccess: (isValid, code) => {
      if (isValid) {
        setGuestCode(code);
        localStorage.setItem("eduverse_guest_code", code);
        setIsAuthorized(true);
        setMessage(null);
      } else {
        setMessage({ text: "الكود غير صالح أو انتهت صلاحية الجلسة.", ok: false });
        handleLogout();
      }
    },
    onError: () => {
      setMessage({ text: "حدث خطأ أثناء التحقق من الكود.", ok: false });
    }
  });

  useEffect(() => {
    const savedCode = localStorage.getItem("eduverse_guest_code");
    if (savedCode) {
      validateCodeMutation.mutate(savedCode);
    }
  }, []);

  const handleLogin = () => {
    if (guestCode.trim()) {
      const upperCode = guestCode.trim().toUpperCase();
      validateCodeMutation.mutate(upperCode);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("eduverse_guest_code");
    setIsAuthorized(false);
    setGuestCode("");
    setCart({});
  };

  // Periodic check to ensure session is still active
  useQuery({
    queryKey: ["validate-guest", guestCode],
    queryFn: async () => {
      const r = await api.get(`/public/orders/validate/${guestCode}`);
      if (!r.data.data.isValid) {
        handleLogout();
        setMessage({ text: "انتهت الجلسة. شكراً لزيارتك!", ok: true });
      }
      return r.data.data.isValid;
    },
    enabled: isAuthorized && Boolean(guestCode),
    refetchInterval: 30000,
  });

  useEffect(() => {
    if (isAuthorized && guestCode) {
      const getBaseUrl = () => {
        if (typeof window !== "undefined") {
          const envBase = process.env.NEXT_PUBLIC_API_URL;
          if (envBase) return envBase;

          const origin = window.location.origin;
          if (origin.includes(":3000")) {
            return origin.replace(":3000", ":3001");
          }
          return origin;
        }
        return "http://localhost:3001";
      };

      const RAW_BASE = getBaseUrl();
      const SOCKET_BASE = RAW_BASE.replace(/\/api\/?$/, "");
      const SOCKET_URL = SOCKET_BASE + "/bar-orders";

      const s = io(SOCKET_URL, {
        transports: ["websocket", "polling"],
        autoConnect: true,
        reconnection: true,
        reconnectionAttempts: Infinity,
        reconnectionDelay: 500,
        reconnectionDelayMax: 3000,
        timeout: 10000,
      });

      setSocket(s);

      s.on("connect", () => {
        console.log("[Socket.IO] Connected to bar-orders as guest:", guestCode);
        s.emit("chat:ping");
      });

      s.on("order:status-updated", (order) => {
        console.log("[Socket.IO] order:status-updated received:", order);
        if (order.guestCode === guestCode && (order.status === "ready" || order.status === "delivered" || order.status === "completed")) {
          playBellSound();
        }
        queryClient.invalidateQueries({ queryKey: ["guest-orders"] });
      });

      s.on("chat:message", (msg) => {
        console.log("[Socket.IO] chat:message received by guest:", msg);
        if (msg.orderId === guestCode) {
          setChatMessages(prev => {
            if (prev.some(m => m.id === msg.id)) return prev;
            return [...prev, msg];
          });
        }
      });

      return () => {
        s.disconnect();
      };
    }
  }, [isAuthorized, guestCode, queryClient]);

  const productsQuery = useQuery({
    queryKey: ["public-products"],
    queryFn: async () => {
      const r = await api.get("/public/orders/products");
      return r.data.data as Product[];
    },
    enabled: isAuthorized,
  });

  const ordersQuery = useQuery({
    queryKey: ["guest-orders", guestCode],
    queryFn: async () => {
      const r = await api.get(`/public/orders/status/${guestCode}`);
      return r.data.data as Order[];
    },
    enabled: isAuthorized && Boolean(guestCode),
    refetchInterval: 10000,
  });

  const createOrderMutation = useMutation({
    mutationFn: async (items: any[]) => {
      return api.post("/public/orders", { guestCode, items, notes: orderNotes });
    },
    onSuccess: () => {
      setCart({});
      setOrderNotes("");
      setIsReviewOpen(false);
      setIsCartOpen(false);
      setMessage({ text: "تم إرسال طلبك بنجاح!", ok: true });
      queryClient.invalidateQueries({ queryKey: ["guest-orders"] });
      setActiveTab("history");
      setTimeout(() => setMessage(null), 4000);
    },
    onError: (err: any) => {
      const errMsg = err.response?.data?.message || "عذراً، فشل إرسال الطلب.";
      setMessage({ text: errMsg, ok: false });
    },
  });

  const cancelOrderMutation = useMutation({
    mutationFn: async (orderId: string) => {
      return api.post(`/public/orders/${orderId}/cancel`, { guestCode });
    },
    onSuccess: () => {
      setMessage({ text: "تم إلغاء الطلب بنجاح.", ok: true });
      queryClient.invalidateQueries({ queryKey: ["guest-orders"] });
      setTimeout(() => setMessage(null), 3000);
    },
    onError: (err: any) => {
      setMessage({ text: err.response?.data?.message || "فشل إلغاء الطلب.", ok: false });
    }
  });

  const addToCart = (id: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setCart(prev => ({ ...prev, [id]: (prev[id] || 0) + 1 }));
  };
  
  const removeFromCart = (id: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setCart(prev => {
      const next = { ...prev };
      if (next[id] > 1) next[id] -= 1;
      else delete next[id];
      return next;
    });
  };

  const cartItems = useMemo(() => {
    return Object.entries(cart).map(([id, qty]) => {
      const product = productsQuery.data?.find(p => p.id === id);
      return { id, qty, product };
    }).filter(item => item.product) as { id: string, qty: number, product: Product }[];
  }, [cart, productsQuery.data]);

  const grandTotal = useMemo(() => {
    return cartItems.reduce((acc, item) => acc + (item.product.price) * item.qty, 0);
  }, [cartItems]);

  if (!isAuthorized) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 overflow-x-hidden" dir="rtl">
        <motion.div 
          initial={{ opacity: 0, y: 20 }} 
          animate={{ opacity: 1, y: 0 }} 
          className="w-full max-w-sm bg-white rounded-[2.5rem] shadow-xl border border-slate-100 p-8 text-center"
        >
          <div className="h-16 w-16 bg-amber-500 text-white rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-lg shadow-amber-500/20">
            <Utensils size={32} />
          </div>
          <h1 className="text-2xl font-black text-slate-900 mb-2">إديوفيرس كافيه ☕</h1>
          <p className="text-xs font-bold text-slate-400 mb-8">أدخل الكود لتصفح القائمة والطلب مباشرة</p>
          
          <div className="space-y-5 text-right">
            <div className="space-y-2">
              <label className="block text-xs font-black text-slate-500 pr-1">كود الطاولة</label>
              <Input 
                value={guestCode} 
                onChange={(e: any) => setGuestCode(e.target.value)} 
                placeholder="مثال: T3" 
                className="h-12 text-center font-black text-lg rounded-2xl bg-slate-50 border-slate-200 focus:border-amber-500 focus:ring-amber-500/15"
                onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
              />
            </div>
            <Btn 
              onClick={handleLogin} 
              variant="primary"
              loading={validateCodeMutation.isPending}
              className="w-full h-12 rounded-2xl bg-amber-500 hover:bg-amber-600 text-white font-black text-sm shadow-md shadow-amber-500/10"
            >
              تصفح القائمة
            </Btn>
          </div>
        </motion.div>
      </div>
    );
  }

  const activeOrders = ordersQuery.data?.filter(o => ["new", "in_preparation", "ready"].includes(o.status)) || [];

  return (
    <div className="min-h-screen bg-slate-50/50 pb-24 lg:pb-8 text-slate-800 font-sans" dir="rtl">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-slate-200/60 shadow-sm">
        <div className="max-w-[1400px] mx-auto px-4 lg:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3 min-w-0">
            <div className="h-10 w-10 bg-amber-500 rounded-xl flex items-center justify-center text-white font-black text-lg shrink-0 shadow-md shadow-amber-500/15">
              ☕
            </div>
            <div className="min-w-0 text-right">
              <h2 className="text-base font-black leading-tight text-slate-900">إديوفيرس كافيه</h2>
              <span className="inline-flex items-center gap-1 mt-0.5 rounded-full bg-amber-50 px-2 py-0.5 text-[9px] font-black text-amber-700 border border-amber-200/50">
                طاولة {guestCode}
              </span>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <button 
              onClick={() => queryClient.invalidateQueries({ queryKey: ["public-products"] })}
              className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-xl transition-colors shrink-0"
              title="تحديث القائمة"
            >
              <RefreshCw size={16} className={productsQuery.isFetching ? "animate-spin text-amber-500" : ""} />
            </button>
            <button 
              onClick={handleLogout} 
              className="p-2 text-rose-500 hover:bg-rose-50 rounded-xl transition-colors shrink-0"
              title="تسجيل الخروج"
            >
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-[1400px] mx-auto px-4 lg:px-6 py-6">
        {/* POS 3-Column Layout: categories, products grid, cart summary */}
        <div className="grid w-full grid-cols-1 gap-6 lg:grid-cols-[180px_1fr_320px]">
          
          {/* Column 1: Category Sidebar (Desktop Only) */}
          <aside className="hidden lg:flex flex-col gap-1.5 shrink-0 select-none">
            <div className="text-right px-2 mb-2">
              <p className="text-[10px] font-black tracking-widest uppercase text-slate-400">تصنيفات المنيو</p>
            </div>
            
            <button 
              onClick={() => setSelectedCategory("all")} 
              className={cn(
                "w-full flex items-center gap-3 px-3 py-2.5 rounded-2xl transition-all text-right font-bold text-xs border border-transparent",
                selectedCategory === "all" 
                  ? "bg-slate-900 text-white shadow-md" 
                  : "bg-white text-slate-600 border-slate-200/50 hover:bg-slate-50"
              )}
            >
              <div className={cn("h-7 w-7 rounded-lg flex items-center justify-center shrink-0", selectedCategory === "all" ? "bg-white/20" : "bg-slate-100 text-slate-500")}>
                <LayoutGrid size={15} />
              </div>
              <span className="truncate">كل القائمة</span>
            </button>

            {Array.from(new Set(productsQuery.data?.map(p => p.category) || [])).map(cat => {
              const meta = getCategoryMeta(cat);
              const IconComp = meta.icon;
              const isActive = selectedCategory === cat;
              
              return (
                <button 
                  key={cat} 
                  onClick={() => setSelectedCategory(cat)} 
                  className={cn(
                    "w-full flex items-center gap-3 px-3 py-2.5 rounded-2xl transition-all text-right font-bold text-xs border border-transparent",
                    isActive 
                      ? "bg-slate-900 text-white shadow-md" 
                      : "bg-white text-slate-600 border-slate-200/50 hover:bg-slate-50"
                  )}
                >
                  <div className={cn("h-7 w-7 rounded-lg flex items-center justify-center shrink-0", isActive ? "bg-white/20" : `${meta.bgColor} ${meta.iconColor}`)}>
                    <IconComp size={15} />
                  </div>
                  <span className="truncate">{translateProductCategory(cat)}</span>
                </button>
              );
            })}
          </aside>

          {/* Column 2: Products Grid & Search */}
          <section className="min-w-0 space-y-6">
            
            {/* Active Orders Tracker */}
            {activeOrders.length > 0 && (
              <div className="space-y-3">
                <h3 className="text-xs font-black text-slate-700 flex items-center gap-2">
                  <Bell size={14} className="text-amber-500" /> طلباتك الحالية
                </h3>
                <div className="grid gap-3 sm:grid-cols-2">
                  {activeOrders.map(order => (
                    <div key={order.id} className="bg-white rounded-2xl p-4 border border-slate-200/60 shadow-sm min-w-0">
                      <div className="flex justify-between items-start mb-2">
                        <div className="min-w-0 text-right">
                          <span className="text-[10px] font-black text-slate-400">طلب #{order.id.slice(-4)}</span>
                          <div className="text-sm font-black text-slate-900 mt-0.5">{money(order.totalAmount)}</div>
                        </div>
                      </div>
                      <CompactProgress status={order.status} />
                      {order.status === "new" && (
                        <CancellationTimer 
                          orderId={order.id} 
                          createdAt={order.createdAt} 
                          onCancel={(id) => cancelOrderMutation.mutate(id)} 
                        />
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Navigation Tabs & Search bar (Mobile categories scroll) */}
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row gap-3 min-w-0">
                <div className="flex bg-slate-200/50 p-1 rounded-xl shrink-0">
                  <button 
                    onClick={() => setActiveTab("menu")} 
                    className={cn("px-5 py-2 text-xs font-black rounded-lg transition-all", activeTab === "menu" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700")}
                  >
                    منيو البار ☕
                  </button>
                  <button 
                    onClick={() => setActiveTab("history")} 
                    className={cn("px-5 py-2 text-xs font-black rounded-lg transition-all", activeTab === "history" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700")}
                  >
                    سجل طلباتك 📜
                  </button>
                </div>
                
                <div className="relative flex-1 min-w-0">
                  <Search size={14} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input 
                    type="text"
                    placeholder="ابحث عن مشروب أو حلوى..."
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    className="w-full h-10 bg-white border border-slate-200/80 rounded-xl pr-10 pl-4 text-xs font-bold focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/15 transition-all"
                  />
                </div>
              </div>

              {/* Mobile Category Horizontal Scroll (Shown only on mobile) */}
              <div className="lg:hidden flex items-center gap-2 overflow-x-auto no-scrollbar pb-1 pt-1 shrink-0">
                <button 
                  onClick={() => setSelectedCategory("all")} 
                  className={cn(
                    "whitespace-nowrap px-4 py-2 rounded-xl text-xs font-black transition-all border", 
                    selectedCategory === "all" 
                      ? "bg-slate-900 border-slate-900 text-white shadow-sm" 
                      : "bg-white border-slate-200/60 text-slate-600 hover:bg-slate-50"
                  )}
                >
                  الكل
                </button>
                {Array.from(new Set(productsQuery.data?.map(p => p.category) || [])).map(cat => {
                  const meta = getCategoryMeta(cat);
                  const IconComp = meta.icon;
                  const isActive = selectedCategory === cat;

                  return (
                    <button 
                      key={cat} 
                      onClick={() => setSelectedCategory(cat)} 
                      className={cn(
                        "whitespace-nowrap px-4 py-2 rounded-xl text-xs font-black transition-all border flex items-center gap-1.5", 
                        isActive 
                          ? "bg-slate-900 border-slate-900 text-white shadow-sm" 
                          : "bg-white border-slate-200/60 text-slate-600 hover:bg-slate-50"
                      )}
                    >
                      <span className={isActive ? "text-white" : meta.iconColor}><IconComp size={13} /></span>
                      <span>{translateProductCategory(cat)}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Menu View */}
            {activeTab === "menu" && (
              <div className="space-y-6 min-w-0">
                {productsQuery.isLoading ? (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {[1, 2, 3, 4, 5, 6].map(i => <div key={i} className="h-32 rounded-2xl bg-white border border-slate-100 animate-pulse" />)}
                  </div>
                ) : (
                  <div className="space-y-8 min-w-0">
                    {Array.from(new Set(productsQuery.data?.map(p => p.category) || []))
                      .filter(cat => selectedCategory === "all" || selectedCategory === cat)
                      .map(category => {
                        const prods = productsQuery.data?.filter(p => 
                          p.category === category && p.name.toLowerCase().includes(searchTerm.toLowerCase())
                        );
                        if (!prods?.length) return null;
                        
                        const catMeta = getCategoryMeta(category);
                        const CatIcon = catMeta.icon;

                        return (
                          <div key={category} className="space-y-4 min-w-0">
                            <div className="flex items-center gap-2 mb-3">
                              <div className={cn("h-7 w-7 rounded-lg flex items-center justify-center shrink-0", catMeta.bgColor, catMeta.iconColor)}>
                                <CatIcon size={14} />
                              </div>
                              <h3 className="text-base font-black text-slate-800">{translateProductCategory(category)}</h3>
                              <span className="text-[10px] font-black text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">{prods.length}</span>
                              <div className="flex-grow h-px bg-slate-100 mr-2" />
                            </div>
                            
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                              {prods.map(product => {
                                const qty = cart[product.id] || 0;
                                return (
                                  <div 
                                    key={product.id} 
                                    onClick={() => addToCart(product.id)}
                                    className={cn(
                                      "relative flex flex-col p-3 bg-white rounded-2xl border transition-all cursor-pointer select-none active:scale-95 text-right",
                                      qty > 0 
                                        ? "border-amber-500 bg-white shadow-md ring-1 ring-amber-500/20" 
                                        : "border-slate-100 hover:border-slate-300 hover:shadow-md"
                                    )}
                                  >
                                    {qty > 0 && (
                                      <div className="absolute -top-1.5 -right-1.5 h-6 w-6 bg-slate-900 text-white rounded-full flex items-center justify-center text-[10px] font-black shadow-md border-2 border-white">
                                        {qty}
                                      </div>
                                    )}

                                    <ProductImage product={product} className="h-24 w-full rounded-xl shrink-0 object-cover mb-3" />
                                    
                                    <div className="flex-1 flex flex-col justify-between">
                                      <div>
                                        <h4 className="text-xs font-black text-slate-950 truncate leading-snug">{translateProductName(product.name)}</h4>
                                        <p className="text-[10px] text-slate-400 font-bold line-clamp-1 mt-0.5">{product.description || translateProductCategory(product.category)}</p>
                                      </div>
                                      
                                      <div className="flex items-center justify-between mt-3 gap-1.5">
                                        <span className="text-xs font-black text-slate-900">{money(product.price)}</span>
                                        
                                        {qty > 0 ? (
                                          <div className="flex items-center bg-slate-50 rounded-lg border border-slate-200/60 p-0.5 shrink-0" onClick={e => e.stopPropagation()}>
                                            <button onClick={(e) => removeFromCart(product.id, e)} className="text-slate-500 hover:text-slate-800 p-1 rounded transition-colors"><Minus size={10} /></button>
                                            <span className="text-[10px] font-black w-3 text-center">{qty}</span>
                                            <button onClick={(e) => addToCart(product.id, e)} className="text-slate-500 hover:text-slate-800 p-1 rounded transition-colors"><Plus size={10} /></button>
                                          </div>
                                        ) : (
                                          <div className="h-6 w-6 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center transition-colors hover:bg-amber-100 shrink-0">
                                            <Plus size={12} />
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        );
                      })}
                  </div>
                )}
              </div>
            )}

            {/* History View */}
            {activeTab === "history" && (
              <div className="space-y-3 min-w-0">
                {ordersQuery.data?.length === 0 ? (
                  <div className="py-16 text-center border border-dashed border-slate-200 bg-white rounded-2xl">
                    <History size={36} className="mx-auto text-slate-300 mb-3" />
                    <p className="text-xs font-bold text-slate-500">لا يوجد سجل طلبات سابق لهذه الطاولة.</p>
                  </div>
                ) : (
                  ordersQuery.data?.slice().reverse().map(order => (
                    <div key={order.id} className="bg-white rounded-2xl p-0 border border-slate-200/60 shadow-sm min-w-0 overflow-hidden">
                      <button 
                        onClick={() => setExpandedOrderId(expandedOrderId === order.id ? null : order.id)}
                        className="w-full flex justify-between items-center p-4 text-right transition-colors hover:bg-slate-50 focus:outline-none"
                      >
                        <div className="min-w-0">
                          <p className="text-[10px] text-slate-400 font-black">{new Date(order.createdAt).toLocaleDateString('ar-EG', { hour: '2-digit', minute: '2-digit' })}</p>
                          <p className="text-xs font-black text-slate-800 mt-1">طلب #{order.id.slice(-4)}</p>
                        </div>
                        <div className="flex items-center gap-4 shrink-0">
                          <div className="text-left">
                            <p className="text-sm font-black text-slate-900">{money(order.totalAmount)}</p>
                            <span className={cn(
                              "inline-flex items-center rounded-full px-2 py-0.5 text-[9px] font-black mt-1",
                              order.status === "completed" || order.status === "delivered" 
                                ? "bg-emerald-50 text-emerald-700" 
                                : order.status === "cancelled" 
                                ? "bg-rose-50 text-rose-700" 
                                : "bg-blue-50 text-blue-700"
                            )}>
                              {order.status === "completed" || order.status === "delivered" ? "مكتمل ✓" : order.status === "cancelled" ? "ملغي" : "جاري التحضير..."}
                            </span>
                          </div>
                          {expandedOrderId === order.id ? <ChevronUp size={16} className="text-slate-400" /> : <ChevronDown size={16} className="text-slate-400" />}
                        </div>
                      </button>
                      <AnimatePresence>
                        {expandedOrderId === order.id && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="border-t border-slate-100 overflow-hidden"
                          >
                            <div className="p-4 bg-slate-50/50 space-y-1.5 min-w-0">
                              <p className="text-[10px] font-black text-slate-400 mb-2 uppercase tracking-wider">الأصناف المطلوبة</p>
                              {order.items?.map(item => (
                                <div key={item.id} className="flex justify-between items-center text-[11px] text-slate-700 bg-white p-2.5 rounded-xl border border-slate-100 shadow-sm">
                                  <span className="truncate font-bold">{item.quantity} × {item.product ? translateProductName(item.product.name) : "صنف محذوف"}</span>
                                  <span className="font-black shrink-0 ml-2">{money(item.subtotal)}</span>
                                </div>
                              ))}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  ))
                )}
              </div>
            )}
          </section>

          {/* Column 3: Cart Sidebar (Desktop Only) */}
          <aside className="hidden lg:block min-w-0 select-none">
            <div className="bg-white rounded-[2rem] border border-slate-200/60 shadow-sm p-5 sticky top-24 max-h-[calc(100vh-8rem)] flex flex-col">
              <h3 className="text-sm font-black text-slate-900 mb-4 flex items-center gap-2">
                <ShoppingCart size={18} className="text-amber-500" /> سلة الطلبات ({cartItems.length})
              </h3>
              
              {cartItems.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center text-slate-300 py-16 text-center">
                  <ShoppingCart size={44} strokeWidth={1.5} className="mb-3 text-slate-200" />
                  <p className="text-xs font-bold">السلة فارغة.</p>
                  <p className="text-[10px] text-slate-400 mt-1 max-w-[180px] leading-relaxed">اختر بعض المشروبات اللذيذة من القائمة للبدء.</p>
                </div>
              ) : (
                <>
                  <ScrollArea className="flex-1 -mx-2 px-2">
                    <div className="space-y-3.5 pr-1">
                      {cartItems.map(item => (
                        <div key={item.id} className="flex items-start justify-between gap-3 text-xs min-w-0">
                          <div className="flex-1 min-w-0 text-right">
                            <p className="font-black text-slate-800 leading-snug truncate">{translateProductName(item.product.name)}</p>
                            <p className="text-[10px] text-slate-400 font-bold mt-0.5">{money(item.product.price)}</p>
                          </div>
                          <div className="flex flex-col items-end gap-1.5 shrink-0">
                            <span className="text-xs font-black text-slate-900">{money(item.product.price * item.qty)}</span>
                            <div className="flex items-center gap-2 bg-slate-50 rounded-lg p-0.5 border border-slate-200/60">
                              <button onClick={(e) => removeFromCart(item.id, e)} className="p-1 text-slate-400 hover:text-slate-700 rounded"><Minus size={10} /></button>
                              <span className="text-[10px] font-black w-3 text-center">{item.qty}</span>
                              <button onClick={(e) => addToCart(item.id, e)} className="p-1 text-slate-400 hover:text-slate-700 rounded"><Plus size={10} /></button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                  
                  <div className="pt-4 border-t border-slate-100 mt-4 shrink-0 bg-white">
                    <div className="flex justify-between items-end mb-4">
                      <span className="text-xs font-black text-slate-400">الإجمالي النهائي</span>
                      <span className="text-xl font-black text-slate-950">{money(grandTotal)}</span>
                    </div>
                    <Btn 
                      onClick={() => setIsReviewOpen(true)} 
                      variant="primary"
                      className="w-full bg-amber-500 hover:bg-amber-600 text-white rounded-xl h-11 text-xs font-black border-none shadow-md shadow-amber-500/10"
                    >
                      مراجعة وإرسال الطلب
                    </Btn>
                  </div>
                </>
              )}
            </div>
          </aside>

        </div>
      </main>

      {/* Floating Bottom Cart Bar for Mobile Viewports */}
      <AnimatePresence>
        {cartItems.length > 0 && (
          <motion.div 
            initial={{ y: 100 }} animate={{ y: 0 }} exit={{ y: 100 }} 
            className="lg:hidden fixed bottom-0 left-0 right-0 z-40 p-4 bg-white border-t border-slate-200/60 shadow-xl overflow-x-hidden"
          >
            <div className="max-w-[1200px] mx-auto flex items-center justify-between gap-3 min-w-0">
              <div className="flex items-center gap-3 min-w-0">
                <div className="relative shrink-0">
                  <div className="h-11 w-11 bg-amber-50 text-amber-600 rounded-xl flex items-center justify-center border border-amber-100/50 shadow-sm">
                    <ShoppingCart size={18} />
                  </div>
                  <span className="absolute -top-1.5 -right-1.5 h-5 w-5 bg-slate-900 text-white rounded-full text-[9px] font-black flex items-center justify-center border-2 border-white">
                    {cartItems.reduce((acc, i) => acc + i.qty, 0)}
                  </span>
                </div>
                <div className="min-w-0 text-right">
                  <p className="text-[9px] text-slate-400 font-black">الإجمالي النهائي</p>
                  <p className="text-base font-black text-slate-900 mt-0.5 leading-none">{money(grandTotal)}</p>
                </div>
              </div>
              <Btn 
                onClick={() => setIsCartOpen(true)} 
                variant="primary"
                className="bg-amber-500 hover:bg-amber-600 text-white px-5 h-11 rounded-xl font-black border-none text-xs shrink-0 shadow-md shadow-amber-500/10"
              >
                عرض السلة والطلب
              </Btn>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Mobile Cart Bottom Sheet Drawer */}
      <Sheet open={isCartOpen} onOpenChange={setIsCartOpen}>
        <div className="flex flex-col h-[75vh] bg-white overflow-x-hidden text-right">
          <div className="w-10 h-1 bg-slate-200 rounded-full mx-auto my-3 shrink-0" />
          
          <div className="px-5 pb-3 border-b border-slate-100 flex justify-between items-center shrink-0">
            <h2 className="text-base font-black text-slate-900">سلة الطلبات ({cartItems.length})</h2>
            <button onClick={() => setIsCartOpen(false)} className="p-1.5 text-slate-400 hover:bg-slate-100 rounded-xl"><X size={18} /></button>
          </div>
          
          <ScrollArea className="flex-1 p-5">
            <div className="space-y-4">
              {cartItems.map(item => (
                <div key={item.id} className="flex gap-3 min-w-0 items-center justify-between border-b border-slate-50 pb-3">
                  <div className="flex gap-3 min-w-0 items-center flex-1">
                    <ProductImage product={item.product} className="h-12 w-12 rounded-xl shrink-0 object-cover" />
                    <div className="min-w-0 text-right">
                      <p className="text-xs font-black text-slate-900 truncate leading-snug">{translateProductName(item.product.name)}</p>
                      <p className="text-[10px] text-slate-400 font-bold mt-0.5">{money(item.product.price)} للقطعة</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3 shrink-0 ml-2">
                    <span className="text-xs font-black text-slate-900">{money(item.product.price * item.qty)}</span>
                    <div className="flex items-center bg-slate-50 rounded-lg p-0.5 border border-slate-200/60">
                      <button onClick={() => removeFromCart(item.id)} className="p-1.5 text-slate-400 rounded"><Minus size={10} /></button>
                      <span className="text-[10px] font-black w-4 text-center">{item.qty}</span>
                      <button onClick={() => addToCart(item.id)} className="p-1.5 text-slate-400 rounded"><Plus size={10} /></button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
          
          <div className="p-5 border-t border-slate-100 bg-slate-50 shrink-0">
            <div className="flex justify-between items-end mb-4">
              <span className="text-xs font-black text-slate-500">الإجمالي النهائي</span>
              <span className="text-xl font-black text-slate-950">{money(grandTotal)}</span>
            </div>
            <Btn 
              onClick={() => { setIsCartOpen(false); setIsReviewOpen(true); }} 
              variant="primary"
              className="w-full h-12 bg-amber-500 hover:bg-amber-600 text-white rounded-2xl font-black border-none text-sm shadow-md shadow-amber-500/10"
            >
              مراجعة الطلب
            </Btn>
          </div>
        </div>
      </Sheet>

      {/* Checkout Notes & Review Modal */}
      <Modal isOpen={isReviewOpen} onClose={() => setIsReviewOpen(false)} title="مراجعة وتأكيد الطلب" size="md">
        <div className="p-1 min-w-0 text-right">
          <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100 mb-4 min-w-0">
            <div className="space-y-3 max-h-[35vh] overflow-y-auto pr-1 custom-scrollbar min-w-0">
              {cartItems.map(item => (
                <div key={item.id} className="flex justify-between items-center text-xs min-w-0 border-b border-slate-200/40 pb-2 last:border-0 last:pb-0">
                  <div className="flex items-center gap-2 text-slate-700 min-w-0">
                    <span className="font-black text-slate-900 bg-white border border-slate-200 h-5 w-5 rounded flex items-center justify-center text-[10px] shrink-0">{item.qty}</span>
                    <span className="truncate">{translateProductName(item.product.name)}</span>
                  </div>
                  <span className="font-black text-slate-900 shrink-0 ml-2">{money(item.product.price * item.qty)}</span>
                </div>
              ))}
            </div>
            <div className="border-t border-slate-200/80 mt-3 pt-3 flex justify-between items-center">
              <span className="text-xs font-black text-slate-500">الإجمالي الإجمالي</span>
              <span className="text-base font-black text-amber-600">{money(grandTotal)}</span>
            </div>
          </div>
          
          <div className="mb-5 min-w-0">
            <label className="block text-[11px] font-black text-slate-500 mb-1.5">ملاحظات التحضير للباريستا (اختياري)</label>
            <textarea 
              value={orderNotes}
              onChange={e => setOrderNotes(e.target.value)}
              placeholder="مثال: بدون سكر، حليب خالي الدسم، ثلج إضافي..."
              className="w-full h-20 rounded-2xl border border-slate-200/80 p-3 text-xs font-semibold focus:border-amber-500 focus:ring-2 focus:ring-amber-500/15 outline-none resize-none bg-white transition-all placeholder:text-slate-350"
            />
          </div>

          <div className="flex gap-3 min-w-0">
            <Btn 
              onClick={() => setIsReviewOpen(false)} 
              variant="secondary"
              className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-600 border-none rounded-2xl h-12 text-xs font-black"
            >
              تعديل السلة
            </Btn>
            <Btn 
              onClick={() => createOrderMutation.mutate(cartItems.map(i => ({ productId: i.id, quantity: i.qty })))} 
              variant="primary"
              loading={createOrderMutation.isPending}
              disabled={cartItems.length === 0}
              className="flex-[2] bg-amber-500 hover:bg-amber-600 text-white border-none rounded-2xl h-12 text-xs font-black flex items-center justify-center gap-1.5 shadow-md shadow-amber-500/10"
            >
              <Send size={14} className="rotate-180" /> إرسال الطلب للباريستا
            </Btn>
          </div>
        </div>
      </Modal>

      {/* Floating Chat Button */}
      <button 
        onClick={() => setIsChatOpen(!isChatOpen)} 
        className="fixed bottom-20 lg:bottom-6 right-4 lg:right-6 z-30 h-11 w-11 bg-slate-950 shadow-lg shadow-slate-955/20 rounded-full flex items-center justify-center text-white hover:scale-105 transition-transform"
        title="تواصل مع الكافيه"
      >
        <MessageCircle size={20} />
      </button>

      {/* Real-time Chat Box */}
      <AnimatePresence>
        {isChatOpen && (
          <motion.div 
            initial={{ opacity: 0, y: 20, scale: 0.95 }} 
            animate={{ opacity: 1, y: 0, scale: 1 }} 
            exit={{ opacity: 0, y: 20, scale: 0.95 }} 
            className="fixed bottom-32 lg:bottom-20 right-4 lg:right-6 z-50 w-80 bg-white rounded-2xl shadow-[0_12px_40px_-10px_rgba(0,0,0,0.15)] border border-slate-200/80 overflow-hidden text-right"
          >
            <div className="bg-slate-900 p-4 text-white flex justify-between items-center shrink-0">
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-xs font-black">محادثة مباشرة مع الباريستا</span>
              </div>
              <button onClick={() => setIsChatOpen(false)} className="text-slate-400 hover:text-white transition-colors">
                <X size={16} />
              </button>
            </div>
            
            <ScrollArea className="h-60 p-4 bg-slate-50/50 space-y-3">
              {chatMessages.map((msg, i) => (
                <div key={i} className={cn("flex", msg.sender === "GUEST" ? "justify-end" : "justify-start")}>
                  <div className={cn(
                    "max-w-[85%] px-3 py-2 rounded-2xl text-[11px] font-bold shadow-sm leading-relaxed", 
                    msg.sender === "GUEST" 
                      ? "bg-amber-500 text-white rounded-tl-none" 
                      : "bg-white border border-slate-200/60 text-slate-800 rounded-tr-none"
                  )}>
                    {msg.text}
                  </div>
                </div>
              ))}
              {chatMessages.length === 0 && <p className="text-center text-[10px] text-slate-400 py-12 font-bold">اكتب استفسارك هنا وسيجيبك الباريستا فوراً!</p>}
            </ScrollArea>
            
            <div className="p-3 bg-white border-t border-slate-100 flex gap-2 shrink-0">
              <input 
                value={chatInput} 
                onChange={(e: any) => setChatInput(e.target.value)} 
                placeholder="اكتب رسالتك..." 
                className="h-9 text-[11px] rounded-xl border border-slate-200 px-3 flex-1 bg-slate-50 focus:bg-white focus:outline-none focus:border-amber-500 transition-all font-bold" 
                onKeyDown={e => e.key === 'Enter' && chatInput.trim() && socket && (() => { socket.emit("chat:send", { orderId: guestCode, sender: "GUEST", text: chatInput.trim() }); setChatInput(""); })()}
              />
              <button 
                onClick={() => { if (chatInput.trim() && socket) { socket.emit("chat:send", { orderId: guestCode, sender: "GUEST", text: chatInput.trim() }); setChatInput(""); } }} 
                className="h-9 w-9 bg-slate-900 text-white rounded-xl flex items-center justify-center hover:bg-slate-800 transition-colors shrink-0"
              >
                <Send size={14} className="rotate-180" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Toast Alert Notifications */}
      <AnimatePresence>
        {message && (
          <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="fixed top-20 left-0 right-0 z-[100] flex justify-center pointer-events-none px-4">
            <div className={cn(
              "px-4 py-2.5 rounded-xl shadow-lg flex items-center gap-2 border text-xs font-black", 
              message.ok ? "bg-emerald-50 border-emerald-250 text-emerald-800" : "bg-rose-50 border-rose-250 text-rose-800"
            )}>
              {message.ok ? <CheckCircle2 size={16} className="text-emerald-500" /> : <Info size={16} className="text-rose-500" />}
              <p>{message.text}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
