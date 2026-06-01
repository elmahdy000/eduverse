"use client";

import React, { useState, useEffect, useMemo } from "react";
import { 
  Coffee, ShoppingCart, CheckCircle2, 
  Search, Plus, Minus, Send, History,
  LogOut, MessageCircle, X, Info, Utensils,
  GlassWater, IceCream, Soup, Pizza, Sandwich, Bell,
  ChevronDown, ChevronUp
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { api } from "../../lib/api";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { io, Socket } from "socket.io-client";
import { Input, Btn, Sheet, SheetHeader, SheetTitle, ScrollArea, Modal } from "@/components/ui";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { translateProductCategory, translateProductName } from "@/lib/labels";

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

const getCategoryIcon = (category: string) => {
  const c = category.toLowerCase();
  if (c.includes('hot') || c.includes('coffee') || c.includes('tea')) return <Coffee size={18} />;
  if (c.includes('cold') || c.includes('juice') || c.includes('soft') || c.includes('water')) return <GlassWater size={18} />;
  if (c.includes('dessert') || c.includes('ice')) return <IceCream size={18} />;
  if (c.includes('snack') || c.includes('appetizer')) return <Soup size={18} />;
  if (c.includes('main') || c.includes('pizza') || c.includes('sandwich')) return <Pizza size={18} />;
  if (c.includes('bakery') || c.includes('breakfast')) return <Sandwich size={18} />;
  return <Utensils size={18} />;
};

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

  if (!src || error) {
    return (
      <div className={cn("bg-slate-50 flex items-center justify-center text-slate-300 border border-slate-100", className)}>
        {getCategoryIcon(product.category)}
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
      <div className="mt-3 text-xs font-bold text-red-600 bg-red-50 border border-red-100 px-3 py-1.5 rounded-lg inline-flex items-center gap-1.5">
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
          className="absolute top-[6px] right-0 h-1 bg-orange-500 rounded-full transition-all duration-700 ease-out"
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
                    isActive ? "border-orange-500" : "border-slate-200",
                    isCurrent ? "scale-125 shadow-sm" : "scale-100"
                  )} 
                >
                  {isActive && <div className={cn("rounded-full bg-orange-500 transition-all", isCurrent ? "h-1.5 w-1.5" : "h-0 w-0")} />}
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
      className="mt-2 text-[10px] font-bold text-red-600 bg-red-50 border border-red-100 px-3 py-1.5 rounded-lg hover:bg-red-100 transition-colors flex items-center justify-center gap-1.5 w-full"
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
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-sm bg-white rounded-2xl shadow-sm border border-slate-200 p-6 text-center">
          <div className="h-12 w-12 bg-slate-100 text-slate-800 rounded-xl flex items-center justify-center mx-auto mb-4">
            <Utensils size={24} />
          </div>
          <h1 className="text-xl font-bold text-slate-900 mb-1">Eduvers Cafe</h1>
          <p className="text-xs text-slate-500 mb-6">القائمة الرقمية للطلبات</p>
          
          <div className="space-y-4 text-right">
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1.5">كود الطاولة</label>
              <Input 
                value={guestCode} 
                onChange={(e: any) => setGuestCode(e.target.value)} 
                placeholder="أدخل كود الطاولة..." 
                className="h-10 text-center font-bold text-sm rounded-xl bg-slate-50"
                onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
              />
            </div>
            <Btn onClick={handleLogin} variant="primary" className="w-full h-10 rounded-xl bg-orange-600 hover:bg-orange-700 text-white font-bold border-none text-sm">
              تصفح القائمة
            </Btn>
          </div>
        </motion.div>
      </div>
    );
  }

  const activeOrders = ordersQuery.data?.filter(o => ["new", "in_preparation", "ready"].includes(o.status)) || [];

  return (
    <div className="min-h-screen bg-slate-50 pb-24 lg:pb-8 text-slate-800 font-sans" dir="rtl">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-sm border-b border-slate-200">
        <div className="max-w-[1200px] mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3 min-w-0">
            <div className="h-8 w-8 bg-slate-900 rounded-lg flex items-center justify-center text-white font-bold text-sm shrink-0">E</div>
            <div className="min-w-0">
              <h2 className="text-sm font-bold leading-tight truncate">Eduvers Cafe</h2>
              <p className="text-[10px] text-slate-500 font-medium">طاولة {guestCode}</p>
            </div>
          </div>
          <button onClick={handleLogout} className="p-1.5 text-slate-400 hover:text-slate-700 transition-colors rounded-lg hover:bg-slate-100 shrink-0">
            <LogOut size={18} />
          </button>
        </div>
      </header>

      <main className="max-w-[1200px] mx-auto px-4 py-6">
        <div className="grid w-full grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
          
          {/* Order Summary Sidebar (Desktop) - First in JSX, Right conceptually but we swap order in RTL using col-start if needed. But in RTL [1fr_320px] means 1fr on Right, 320px on Left. */}
          <aside className="hidden lg:block min-w-0 lg:col-start-2">
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 sticky top-20 max-h-[calc(100vh-6rem)] flex flex-col">
              <h3 className="text-sm font-bold text-slate-900 mb-4 flex items-center gap-2">
                <ShoppingCart size={16} /> ملخص الطلب
              </h3>
              
              {cartItems.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center text-slate-400 py-12">
                  <ShoppingCart size={32} className="mb-3 opacity-50" />
                  <p className="text-xs">لم تقم باختيار أي أصناف بعد.</p>
                </div>
              ) : (
                <>
                  <ScrollArea className="flex-1 -mx-2 px-2">
                    <div className="space-y-3 pr-2">
                      {cartItems.map(item => (
                        <div key={item.id} className="flex items-start justify-between gap-3 text-sm min-w-0">
                          <div className="flex-1 min-w-0">
                            <p className="font-bold text-slate-800 leading-tight truncate">{item.product.name}</p>
                            <p className="text-[10px] text-slate-500 mt-0.5">{money(item.product.price)}</p>
                          </div>
                          <div className="flex flex-col items-end gap-1.5 shrink-0">
                            <span className="text-xs font-bold text-slate-900">{money(item.product.price * item.qty)}</span>
                            <div className="flex items-center gap-2 bg-slate-50 rounded-md px-1 border border-slate-200">
                              <button onClick={(e) => removeFromCart(item.id, e)} className="p-1 text-slate-500 hover:text-slate-800"><Minus size={10} /></button>
                              <span className="text-[10px] font-bold w-3 text-center">{item.qty}</span>
                              <button onClick={(e) => addToCart(item.id, e)} className="p-1 text-slate-500 hover:text-slate-800"><Plus size={10} /></button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                  <div className="pt-4 border-t border-slate-100 mt-4 shrink-0">
                    <div className="flex justify-between items-end mb-4">
                      <span className="text-xs text-slate-500 font-bold">الإجمالي</span>
                      <span className="text-lg font-bold text-slate-900">{money(grandTotal)}</span>
                    </div>
                    <Btn onClick={() => setIsReviewOpen(true)} className="w-full bg-orange-600 hover:bg-orange-700 text-white rounded-xl h-10 text-sm font-bold border-none">
                      مراجعة الطلب
                    </Btn>
                  </div>
                </>
              )}
            </div>
          </aside>

          {/* Main Menu Area - Second in JSX */}
          <section className="min-w-0 space-y-6 lg:col-start-1 lg:row-start-1">
            
            {/* Active Orders Tracker */}
            {activeOrders.length > 0 && (
              <div className="space-y-3">
                <h3 className="text-xs font-bold text-slate-700 flex items-center gap-2">
                  <Bell size={14} className="text-orange-500" /> طلباتك الحالية
                </h3>
                {activeOrders.map(order => (
                  <div key={order.id} className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm min-w-0">
                    <div className="flex justify-between items-start mb-2">
                      <div className="min-w-0">
                        <span className="text-[10px] font-bold text-slate-400">طلب #{order.id.slice(-4)}</span>
                        <div className="text-sm font-bold text-slate-900">{money(order.totalAmount)}</div>
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
            )}

            {/* Navigation Tabs & Search */}
            <div className="flex flex-col sm:flex-row gap-3 min-w-0">
              <div className="flex bg-slate-200/50 p-1 rounded-lg shrink-0">
                <button 
                  onClick={() => setActiveTab("menu")} 
                  className={cn("px-4 py-1.5 text-xs font-bold rounded-md transition-colors", activeTab === "menu" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700")}
                >
                  القائمة
                </button>
                <button 
                  onClick={() => setActiveTab("history")} 
                  className={cn("px-4 py-1.5 text-xs font-bold rounded-md transition-colors", activeTab === "history" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700")}
                >
                  السجل
                </button>
              </div>
              <div className="relative flex-1 min-w-0">
                <Search size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input 
                  type="text"
                  placeholder="ابحث عن صنف..."
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className="w-full h-9 bg-white border border-slate-200 rounded-lg pr-9 pl-4 text-xs focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-all"
                />
              </div>
            </div>

            {/* Menu View */}
            {activeTab === "menu" && (
              <div className="space-y-6 min-w-0">
                {/* Category Chips */}
                <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
                  <button 
                    onClick={() => setSelectedCategory("all")} 
                    className={cn("whitespace-nowrap px-3 py-1.5 rounded-lg text-[11px] font-bold transition-colors border", selectedCategory === "all" ? "bg-slate-800 border-slate-800 text-white" : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50")}
                  >الكل</button>
                  {Array.from(new Set(productsQuery.data?.map(p => p.category) || [])).map(cat => (
                    <button 
                      key={cat} 
                      onClick={() => setSelectedCategory(cat)} 
                      className={cn("whitespace-nowrap px-3 py-1.5 rounded-lg text-[11px] font-bold transition-colors border flex items-center gap-1.5", selectedCategory === cat ? "bg-slate-800 border-slate-800 text-white" : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50")}
                    >
                      {getCategoryIcon(cat)} {translateProductCategory(cat)}
                    </button>
                  ))}
                </div>

                {/* Products Sections */}
                <div className="space-y-8 min-w-0">
                  {Array.from(new Set(productsQuery.data?.map(p => p.category) || []))
                    .filter(cat => selectedCategory === "all" || selectedCategory === cat)
                    .map(category => {
                      const prods = productsQuery.data?.filter(p => 
                        p.category === category && p.name.toLowerCase().includes(searchTerm.toLowerCase())
                      );
                      if (!prods?.length) return null;
                      
                      return (
                        <div key={category} className="space-y-3 min-w-0">
                          <div className="flex items-center gap-2">
                            <h3 className="text-base font-black text-slate-800">{translateProductCategory(category)}</h3>
                            <span className="text-[10px] font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">{prods.length}</span>
                          </div>
                          
                          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
                            {prods.map(product => (
                              <div 
                                key={product.id} 
                                onClick={() => !cart[product.id] && addToCart(product.id)}
                                className={cn(
                                  "bg-white rounded-xl p-3 border transition-all flex items-center gap-3 group select-none min-w-0",
                                  cart[product.id] ? "border-orange-500 shadow-sm" : "border-slate-200 hover:border-slate-300 cursor-pointer"
                                )}
                              >
                                <ProductImage product={product} className="h-16 w-16 rounded-lg shrink-0" />
                                <div className="flex-1 min-w-0 flex flex-col justify-between h-full">
                                  <div className="min-w-0">
                                    <h4 className="text-sm font-bold text-slate-900 truncate">{translateProductName(product.name)}</h4>
                                    <p className="text-[10px] text-slate-500 line-clamp-1 mt-0.5">{product.description || translateProductCategory(product.category)}</p>
                                  </div>
                                  <div className="flex items-center justify-between mt-2 min-w-0">
                                    <span className="text-xs font-bold text-slate-800">{money(product.price)}</span>
                                    
                                    {cart[product.id] ? (
                                      <div className="flex items-center gap-2 bg-slate-50 rounded-md px-1.5 py-0.5 border border-slate-200 shrink-0" onClick={e => e.stopPropagation()}>
                                        <button onClick={(e) => removeFromCart(product.id, e)} className="text-slate-500 hover:text-slate-800 p-1"><Minus size={12} /></button>
                                        <span className="text-[10px] font-bold w-3 text-center">{cart[product.id]}</span>
                                        <button onClick={(e) => addToCart(product.id, e)} className="text-slate-500 hover:text-slate-800 p-1"><Plus size={12} /></button>
                                      </div>
                                    ) : (
                                      <button className="h-6 w-6 rounded-md bg-slate-100 flex items-center justify-center text-slate-600 group-hover:bg-slate-200 transition-colors shrink-0">
                                        <Plus size={12} />
                                      </button>
                                    )}
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                  })}
                </div>
              </div>
            )}

            {/* History View */}
            {activeTab === "history" && (
              <div className="space-y-3 min-w-0">
                {ordersQuery.data?.length === 0 ? (
                  <div className="py-10 text-center border border-dashed border-slate-200 rounded-xl">
                    <History size={24} className="mx-auto text-slate-300 mb-2" />
                    <p className="text-xs text-slate-500">لا يوجد سجل طلبات سابق.</p>
                  </div>
                ) : (
                  ordersQuery.data?.slice().reverse().map(order => (
                    <div key={order.id} className="bg-white rounded-xl p-0 border border-slate-200 shadow-sm min-w-0 overflow-hidden">
                      <button 
                        onClick={() => setExpandedOrderId(expandedOrderId === order.id ? null : order.id)}
                        className="w-full flex justify-between items-center p-4 text-right transition-colors hover:bg-slate-50 focus:outline-none"
                      >
                        <div className="min-w-0">
                          <p className="text-[10px] text-slate-400 font-bold">{new Date(order.createdAt).toLocaleDateString('ar-EG', { hour: '2-digit', minute: '2-digit' })}</p>
                          <p className="text-xs font-bold text-slate-800 mt-0.5">طلب #{order.id.slice(-4)}</p>
                        </div>
                        <div className="flex items-center gap-4 shrink-0">
                          <div className="text-left">
                            <p className="text-sm font-bold text-slate-900">{money(order.totalAmount)}</p>
                            <span className="text-[9px] text-slate-500">
                              {order.status === "completed" || order.status === "delivered" ? "مكتمل" : order.status === "cancelled" ? "ملغي" : "حالي"}
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
                              <p className="text-[10px] font-bold text-slate-500 mb-2 uppercase tracking-wider">تفاصيل الطلب</p>
                              {order.items?.map(item => (
                                <div key={item.id} className="flex justify-between items-center text-[11px] text-slate-700 bg-white p-2 rounded-lg border border-slate-100 shadow-sm">
                                  <span className="truncate font-medium">{item.quantity} × {item.product ? translateProductName(item.product.name) : "صنف محذوف"}</span>
                                  <span className="font-bold shrink-0 ml-2">{money(item.subtotal)}</span>
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

        </div>
      </main>

      {/* Mobile Cart Bar */}
      <AnimatePresence>
        {cartItems.length > 0 && (
          <motion.div 
            initial={{ y: 100 }} animate={{ y: 0 }} exit={{ y: 100 }} 
            className="lg:hidden fixed bottom-0 left-0 right-0 z-40 p-3 bg-white border-t border-slate-200 shadow-sm overflow-x-hidden"
          >
            <div className="max-w-[1200px] mx-auto flex items-center justify-between gap-3 min-w-0">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="relative shrink-0">
                  <div className="h-10 w-10 bg-orange-50 text-orange-600 rounded-lg flex items-center justify-center border border-orange-100">
                    <ShoppingCart size={16} />
                  </div>
                  <span className="absolute -top-1.5 -right-1.5 h-4 w-4 bg-slate-900 text-white rounded-full text-[9px] font-bold flex items-center justify-center border-2 border-white">
                    {cartItems.length}
                  </span>
                </div>
                <div className="min-w-0">
                  <p className="text-[9px] text-slate-500 font-bold truncate">الإجمالي</p>
                  <p className="text-sm font-bold text-slate-900 leading-none truncate">{money(grandTotal)}</p>
                </div>
              </div>
              <Btn onClick={() => setIsCartOpen(true)} className="bg-slate-900 hover:bg-slate-800 text-white px-4 h-10 rounded-lg font-bold border-none text-xs shrink-0">
                عرض السلة
              </Btn>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Mobile Cart Sheet */}
      <Sheet open={isCartOpen} onOpenChange={setIsCartOpen}>
        <div className="flex flex-col h-[80vh] bg-white overflow-x-hidden">
          <div className="w-10 h-1 bg-slate-200 rounded-full mx-auto my-3 shrink-0" />
          <div className="px-4 pb-2 border-b border-slate-100 flex justify-between items-center shrink-0">
            <h2 className="text-base font-bold text-slate-900">سلة المشتريات</h2>
            <button onClick={() => setIsCartOpen(false)} className="p-1.5 text-slate-400 hover:bg-slate-100 rounded-md"><X size={16} /></button>
          </div>
          <ScrollArea className="flex-1 p-4">
            <div className="space-y-3">
              {cartItems.map(item => (
                <div key={item.id} className="flex gap-3 min-w-0">
                  <ProductImage product={item.product} className="h-14 w-14 rounded-lg shrink-0" />
                  <div className="flex-1 flex flex-col justify-between min-w-0">
                    <div className="flex justify-between items-start min-w-0">
                      <p className="text-xs font-bold text-slate-900 truncate">{translateProductName(item.product.name)}</p>
                      <p className="text-xs font-bold text-slate-900 shrink-0 ml-2">{money(item.product.price * item.qty)}</p>
                    </div>
                    <div className="flex justify-between items-center mt-2">
                      <p className="text-[10px] text-slate-500">{money(item.product.price)} للقطعة</p>
                      <div className="flex items-center gap-2 bg-slate-50 rounded-md px-1.5 py-0.5 border border-slate-200 shrink-0">
                        <button onClick={() => removeFromCart(item.id)} className="p-1 text-slate-500"><Minus size={12} /></button>
                        <span className="text-[10px] font-bold w-4 text-center">{item.qty}</span>
                        <button onClick={() => addToCart(item.id)} className="p-1 text-slate-500"><Plus size={12} /></button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
          <div className="p-4 border-t border-slate-100 bg-slate-50 shrink-0">
            <div className="flex justify-between items-end mb-3">
              <span className="text-xs font-bold text-slate-500">الإجمالي النهائي</span>
              <span className="text-lg font-bold text-slate-900">{money(grandTotal)}</span>
            </div>
            <Btn onClick={() => { setIsCartOpen(false); setIsReviewOpen(true); }} className="w-full h-10 bg-orange-600 hover:bg-orange-700 text-white rounded-xl font-bold border-none text-sm">
              مراجعة الطلب
            </Btn>
          </div>
        </div>
      </Sheet>

      {/* Mandatory Review Modal */}
      <Modal isOpen={isReviewOpen} onClose={() => setIsReviewOpen(false)} title="مراجعة الطلب" size="md">
        <div className="p-1 min-w-0">
          <div className="bg-slate-50 rounded-xl p-3 border border-slate-100 mb-4 min-w-0">
            <div className="space-y-2 max-h-[40vh] overflow-y-auto pr-1 custom-scrollbar min-w-0">
              {cartItems.map(item => (
                <div key={item.id} className="flex justify-between items-center text-xs min-w-0">
                  <div className="flex items-center gap-2 text-slate-700 min-w-0">
                    <span className="font-bold text-slate-900 bg-white border border-slate-200 h-5 w-5 rounded flex items-center justify-center text-[10px] shrink-0">{item.qty}</span>
                    <span className="truncate">{translateProductName(item.product.name)}</span>
                  </div>
                  <span className="font-bold text-slate-900 shrink-0 ml-2">{money(item.product.price * item.qty)}</span>
                </div>
              ))}
            </div>
            <div className="border-t border-slate-200 mt-3 pt-2 flex justify-between items-center">
              <span className="text-xs font-bold text-slate-500">الإجمالي</span>
              <span className="text-base font-bold text-slate-900">{money(grandTotal)}</span>
            </div>
          </div>
          
          <div className="mb-5 min-w-0">
            <label className="block text-[11px] font-bold text-slate-500 mb-1.5">ملاحظات للباريستا (اختياري)</label>
            <textarea 
              value={orderNotes}
              onChange={e => setOrderNotes(e.target.value)}
              placeholder="بدون سكر، حليب خالي الدسم..."
              className="w-full h-16 rounded-xl border border-slate-200 p-2 text-xs focus:border-orange-500 focus:ring-1 focus:ring-orange-500 outline-none resize-none bg-white"
            />
          </div>

          <div className="flex gap-2 min-w-0">
            <Btn 
              onClick={() => setIsReviewOpen(false)} 
              variant="secondary"
              className="flex-1 bg-slate-100 text-slate-700 border-none hover:bg-slate-200 rounded-xl h-10 text-xs font-bold"
            >
              تعديل الطلب
            </Btn>
            <Btn 
              onClick={() => createOrderMutation.mutate(cartItems.map(i => ({ productId: i.id, quantity: i.qty })))} 
              loading={createOrderMutation.isPending}
              disabled={cartItems.length === 0}
              className="flex-[2] bg-orange-600 hover:bg-orange-700 text-white border-none rounded-xl h-10 text-xs font-bold flex items-center justify-center gap-1.5"
            >
              <Send size={14} className="rotate-180" /> إرسال للباريستا
            </Btn>
          </div>
        </div>
      </Modal>

      {/* Floating Chat */}
      <button 
        onClick={() => setIsChatOpen(!isChatOpen)} 
        className="fixed bottom-20 lg:bottom-6 right-4 lg:right-6 z-30 h-10 w-10 bg-slate-900 shadow-md shadow-slate-900/10 rounded-full flex items-center justify-center text-white hover:scale-105 transition-transform"
      >
        <MessageCircle size={18} />
      </button>

      {/* Chat Box */}
      <AnimatePresence>
        {isChatOpen && (
          <motion.div 
            initial={{ opacity: 0, y: 10, scale: 0.95 }} 
            animate={{ opacity: 1, y: 0, scale: 1 }} 
            exit={{ opacity: 0, y: 10, scale: 0.95 }} 
            className="fixed bottom-32 lg:bottom-20 right-4 lg:right-6 z-50 w-72 bg-white rounded-xl shadow-[0_10px_30px_-10px_rgba(0,0,0,0.15)] border border-slate-200 overflow-hidden"
          >
            <div className="bg-slate-900 p-3 text-white flex justify-between items-center shrink-0">
              <div className="flex items-center gap-2">
                <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-xs font-bold">تواصل معنا</span>
              </div>
              <button onClick={() => setIsChatOpen(false)} className="text-slate-400 hover:text-white transition-colors">
                <X size={14} />
              </button>
            </div>
            <ScrollArea className="h-56 p-3 bg-slate-50 space-y-2">
              {chatMessages.map((msg, i) => (
                <div key={i} className={cn("flex", msg.sender === "GUEST" ? "justify-end" : "justify-start")}>
                  <div className={cn("max-w-[85%] p-2 rounded-lg text-[11px] shadow-sm", msg.sender === "GUEST" ? "bg-orange-600 text-white rounded-tl-none" : "bg-white border border-slate-200 text-slate-800 rounded-tr-none")}>
                    {msg.text}
                  </div>
                </div>
              ))}
              {chatMessages.length === 0 && <p className="text-center text-[10px] text-slate-400 py-8">اكتب رسالتك وسنرد عليك فوراً</p>}
            </ScrollArea>
            <div className="p-2 bg-white border-t border-slate-100 flex gap-1.5 shrink-0">
              <Input 
                value={chatInput} 
                onChange={(e: any) => setChatInput(e.target.value)} 
                placeholder="رسالتك..." 
                className="h-8 text-[11px] rounded-md border-slate-200 flex-1 bg-slate-50 focus:bg-white" 
                onKeyDown={e => e.key === 'Enter' && chatInput.trim() && socket && (() => { socket.emit("chat:send", { orderId: guestCode, sender: "GUEST", text: chatInput.trim() }); setChatInput(""); })()}
              />
              <button 
                onClick={() => { if (chatInput.trim() && socket) { socket.emit("chat:send", { orderId: guestCode, sender: "GUEST", text: chatInput.trim() }); setChatInput(""); } }} 
                className="h-8 w-8 bg-slate-900 text-white rounded-md flex items-center justify-center hover:bg-slate-800 transition-colors shrink-0"
              >
                <Send size={12} className="rotate-180" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Toast */}
      <AnimatePresence>
        {message && (
          <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="fixed top-20 left-0 right-0 z-[100] flex justify-center pointer-events-none px-4">
            <div className={cn("px-3 py-2 rounded-lg shadow-md flex items-center gap-2 border", message.ok ? "bg-emerald-50 border-emerald-200 text-emerald-800" : "bg-red-50 border-red-200 text-red-800")}>
              {message.ok ? <CheckCircle2 size={14} className="text-emerald-500" /> : <Info size={14} className="text-red-500" />}
              <p className="text-xs font-bold">{message.text}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
