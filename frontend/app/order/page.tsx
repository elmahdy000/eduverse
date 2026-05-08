"use client";

import React, { useState, useEffect, useMemo } from "react";
import { 
  Coffee, ShoppingCart, CheckCircle2, 
  ChevronRight, ArrowLeft, RefreshCw,
  Search, Plus, Minus, Send, Key, Timer, ChefHat, PackageCheck, History, Wallet,
  LayoutGrid, ReceiptText, Bell, X, Trash2, Info, Utensils, LogOut, MessageCircle
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { api } from "../../lib/api";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { io, Socket } from "socket.io-client";
import { Badge, Input, Btn, Sheet, SheetHeader, SheetTitle, ScrollArea } from "@/components/ui";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

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
  status: "PENDING" | "PREPARING" | "READY" | "COMPLETED" | "CANCELLED";
  total: number;
  createdAt: string;
  items: OrderItem[];
}

export default function GuestOrderPage() {
  // --- Basic State ---
  const [guestCode, setGuestCode] = useState("");
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [activeTab, setActiveTab] = useState<"menu" | "history">("menu");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [cart, setCart] = useState<Record<string, number>>({});
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [message, setMessage] = useState<{ text: string; ok: boolean } | null>(null);

  // --- Chat State (Minimized) ---
  const [chatMessages, setChatMessages] = useState<any[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [socket, setSocket] = useState<Socket | null>(null);

  const queryClient = useQueryClient();

  // --- Auth Logic ---
  useEffect(() => {
    const savedCode = localStorage.getItem("eduverse_guest_code");
    if (savedCode) {
      setGuestCode(savedCode);
      setIsAuthorized(true);
    }
  }, []);

  const handleLogin = () => {
    if (guestCode.trim()) {
      localStorage.setItem("eduverse_guest_code", guestCode);
      setIsAuthorized(true);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("eduverse_guest_code");
    setIsAuthorized(false);
    setCart({});
  };

  // --- WebSocket Logic ---
  useEffect(() => {
    if (isAuthorized) {
      const s = io(process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000");
      setSocket(s);
      s.emit("join_guest", guestCode);
      s.on("order_status_updated", () => queryClient.invalidateQueries({ queryKey: ["guest-orders"] }));
      s.on("new_chat_message", (msg) => setChatMessages(prev => [...prev, msg]));
      return () => { s.disconnect(); };
    }
  }, [isAuthorized, guestCode, queryClient]);

  // --- Queries ---
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
    enabled: isAuthorized,
    refetchInterval: 10000,
  });

  // --- Cart Mutations ---
  const createOrderMutation = useMutation({
    mutationFn: async (items: any[]) => {
      return api.post("/public/orders/create", { tableCode: guestCode, items });
    },
    onSuccess: () => {
      setCart({});
      setIsCartOpen(false);
      setMessage({ text: "تم إرسال طلبك بنجاح!", ok: true });
      queryClient.invalidateQueries({ queryKey: ["guest-orders"] });
      setTimeout(() => setMessage(null), 3000);
    },
    onError: () => setMessage({ text: "عذراً، فشل إرسال الطلب.", ok: false }),
  });

  // --- Helpers ---
  const addToCart = (id: string) => setCart(prev => ({ ...prev, [id]: (prev[id] || 0) + 1 }));
  const removeFromCart = (id: string) => {
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
    }).filter(item => item.product);
  }, [cart, productsQuery.data]);

  const grandTotal = useMemo(() => {
    return cartItems.reduce((acc, item) => acc + (item.product?.price || 0) * item.qty, 0);
  }, [cartItems]);

  const money = (v: number) => new Intl.NumberFormat('ar-EG', { style: 'currency', currency: 'EGP' }).format(v);

  const getStatusLabel = (s: string) => {
    const map = {
      PENDING: { label: "قيد الانتظار", color: "text-slate-400", icon: <Timer size={14} /> },
      PREPARING: { label: "جاري التحضير", color: "text-orange-500", icon: <ChefHat size={14} /> },
      READY: { label: "جاهز للاستلام", color: "text-emerald-500", icon: <PackageCheck size={14} /> },
      COMPLETED: { label: "تم التوصيل", color: "text-slate-500", icon: <CheckCircle2 size={14} /> },
      CANCELLED: { label: "تم الإلغاء", color: "text-red-500", icon: <X size={14} /> },
    };
    return map[s as keyof typeof map] || { label: s, color: "text-slate-400", icon: null };
  };

  const translateCategory = (c: string) => {
    const map: Record<string, string> = {
      "Hot Drinks": "مشروبات ساخنة",
      "Cold Drinks": "مشروبات باردة",
      "Desserts": "حلويات",
      "Snacks": "سناكس",
      "Coffee": "قهوة",
      "Tea": "شاي",
      "Juice": "عصائر",
      "Soft Drinks": "مشروبات غازية",
    };
    return map[c] || c;
  };

  const getCategoryIcon = (c: string) => {
    const lower = c.toLowerCase();
    if (lower.includes("hot") || lower.includes("coffee")) return <Coffee size={18} />;
    if (lower.includes("cold") || lower.includes("drink")) return <Utensils size={18} />;
    return <Utensils size={18} />;
  };

  // --- Rendering Logic ---

  if (!isAuthorized) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6" dir="rtl">
        <motion.div 
          initial={{ opacity: 0, y: 10 }} 
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-sm bg-white rounded-2xl shadow-sm border border-slate-200 p-8"
        >
          <div className="text-center mb-8">
            <div className="h-16 w-16 bg-orange-50 text-orange-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Utensils size={32} />
            </div>
            <h1 className="text-2xl font-bold text-slate-900">Eduvers Bar</h1>
            <p className="text-slate-500 mt-1">مرحباً بك في قائمة طلباتنا الرقمية</p>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">كود الطاولة</label>
              <Input 
                value={guestCode}
                onChange={(e: any) => setGuestCode(e.target.value)}
                placeholder="مثلاً: A10"
                className="h-14 text-center text-xl font-bold tracking-widest border-slate-200 focus:ring-orange-500"
              />
            </div>
            <Btn 
              onClick={handleLogin}
              className="w-full h-14 bg-orange-600 hover:bg-orange-700 text-white rounded-xl text-lg font-bold transition-all shadow-sm"
            >
              دخول المنيو
            </Btn>
            <p className="text-center text-xs text-slate-400">برجاء إدخال الكود الموجود على الطاولة للبدء</p>
          </div>
        </motion.div>
      </div>
    );
  }

  const activeOrders = ordersQuery.data?.filter(o => ["PENDING", "PREPARING", "READY"].includes(o.status)) || [];

  return (
    <div className="min-h-screen bg-white pb-24 font-sans text-slate-900" dir="rtl">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-100 px-4 py-4">
        <div className="mx-auto max-w-2xl flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 bg-slate-900 rounded-xl flex items-center justify-center text-white font-bold">E</div>
            <div>
              <h2 className="text-base font-bold text-slate-900 leading-none">Eduvers Bar</h2>
              <span className="text-[12px] font-medium text-slate-500">طاولة: <span className="text-orange-600 font-bold">{guestCode}</span></span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="text-left ml-2">
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">إجمالي الطلبات</p>
              <p className="text-sm font-black text-slate-900 leading-none">{money(ordersQuery.data?.reduce((acc, o) => acc + o.total, 0) || 0)}</p>
            </div>
            <Btn variant="ghost" size="sm" onClick={handleLogout} className="text-slate-400 h-10 w-10 p-0">
              <LogOut size={20} />
            </Btn>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-2xl px-4 py-6">
        {/* Active Status Card */}
        {activeOrders.length > 0 && (
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="mb-8">
            {activeOrders.map(order => {
              const status = getStatusLabel(order.status);
              return (
                <div key={order.id} className="bg-slate-900 rounded-2xl p-4 flex items-center justify-between shadow-md mb-2">
                  <div className="flex items-center gap-4">
                    <div className={cn("h-10 w-10 rounded-xl flex items-center justify-center bg-white/10", status.color)}>
                      {status.icon}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className={cn("text-sm font-bold", status.color)}>{status.label}</p>
                        <span className="h-1 w-1 rounded-full bg-slate-500" />
                        <p className="text-[12px] text-slate-400 font-medium">#{order.id.slice(-4)}</p>
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">{order.items.length} أصناف • {money(order.total)}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className={cn("h-1.5 w-1.5 rounded-full", order.status === "PENDING" ? "bg-slate-600" : "bg-emerald-500 animate-pulse")} />
                    <div className={cn("h-1.5 w-6 rounded-full", ["PREPARING", "READY"].includes(order.status) ? "bg-emerald-500" : "bg-slate-800")} />
                  </div>
                </div>
              );
            })}
          </motion.div>
        )}

        {/* Search & Tabs */}
        <div className="flex items-center gap-2 mb-6">
          <div className="relative flex-1">
            <Input 
              placeholder="ابحث عن مشروبك..." 
              value={searchTerm}
              onChange={(e: any) => setSearchTerm(e.target.value)}
              icon={<Search size={18} />}
              className="h-12 border-slate-200 bg-slate-50/50 focus:bg-white transition-all rounded-xl"
            />
          </div>
          <div className="flex bg-slate-100 p-1 rounded-xl">
            <button onClick={() => setActiveTab("menu")} className={cn("px-4 py-2 text-sm font-bold rounded-lg transition-all", activeTab === "menu" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500")}>القائمة</button>
            <button onClick={() => setActiveTab("history")} className={cn("px-4 py-2 text-sm font-bold rounded-lg transition-all", activeTab === "history" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500")}>طلباتي</button>
          </div>
        </div>

        {activeTab === "menu" ? (
          <div className="space-y-8">
            {/* Horizontal Categories */}
            <div className="flex items-center gap-2 overflow-x-auto no-scrollbar -mx-4 px-4">
              <button 
                onClick={() => setSelectedCategory("all")}
                className={cn("whitespace-nowrap px-5 py-2 rounded-xl text-sm font-bold border transition-all", selectedCategory === "all" ? "bg-orange-600 border-orange-600 text-white" : "bg-white border-slate-200 text-slate-600 hover:border-orange-200")}
              >الكل</button>
              {Array.from(new Set(productsQuery.data?.map(p => p.category) || [])).map(cat => (
                <button 
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={cn("whitespace-nowrap px-5 py-2 rounded-xl text-sm font-bold border transition-all flex items-center gap-2", selectedCategory === cat ? "bg-orange-600 border-orange-600 text-white" : "bg-white border-slate-200 text-slate-600 hover:border-orange-200")}
                >
                  {getCategoryIcon(cat)}
                  {translateCategory(cat)}
                </button>
              ))}
            </div>

            {/* Product List */}
            {productsQuery.isLoading ? (
              <div className="flex flex-col items-center justify-center py-20 text-slate-400">
                <RefreshCw className="animate-spin mb-4" size={32} />
                <p className="font-medium">جاري تحميل المنيو...</p>
              </div>
            ) : (
              <div className="space-y-8">
                {Array.from(new Set(productsQuery.data?.map(p => p.category) || []))
                  .filter(cat => selectedCategory === "all" || selectedCategory === cat)
                  .map(category => {
                    const prods = productsQuery.data?.filter(p => p.category === category && p.name.toLowerCase().includes(searchTerm.toLowerCase()));
                    if (!prods?.length) return null;
                    return (
                      <div key={category} className="space-y-4">
                        <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
                          <span className="h-4 w-1 bg-orange-500 rounded-full" />
                          {translateCategory(category)}
                        </h3>
                        <div className="grid grid-cols-1 gap-3">
                          {prods.map(product => (
                            <div key={product.id} className="bg-white border border-slate-100 rounded-2xl p-3 flex items-center gap-4 hover:border-orange-100 transition-all shadow-sm">
                              {product.imageUrl && (
                                <div className="h-16 w-16 bg-slate-50 rounded-xl overflow-hidden shrink-0 border border-slate-100">
                                  <img src={product.imageUrl} alt={product.name} className="h-full w-full object-cover" />
                                </div>
                              )}
                              <div className="flex-1 min-w-0">
                                <h4 className="text-[15px] font-bold text-slate-900 truncate">{product.name}</h4>
                                <p className="text-[11px] text-slate-400 font-medium truncate mb-2">{translateCategory(product.category)}</p>
                                <div className="flex items-center justify-between">
                                  <span className="text-base font-black text-slate-900">{money(product.price)}</span>
                                  
                                  <div className="flex items-center gap-2">
                                    {cart[product.id] ? (
                                      <div className="flex items-center gap-3 bg-slate-100 rounded-lg p-1">
                                        <button onClick={() => removeFromCart(product.id)} className="h-7 w-7 bg-white rounded-md flex items-center justify-center text-slate-600 shadow-sm"><Minus size={14} /></button>
                                        <span className="text-sm font-bold w-4 text-center">{cart[product.id]}</span>
                                        <button onClick={() => addToCart(product.id)} className="h-7 w-7 bg-white rounded-md flex items-center justify-center text-slate-600 shadow-sm"><Plus size={14} /></button>
                                      </div>
                                    ) : (
                                      <button 
                                        onClick={() => addToCart(product.id)}
                                        className="h-10 px-6 bg-slate-900 text-white text-xs font-bold rounded-xl hover:bg-orange-600 transition-all"
                                      >
                                        إضافة
                                      </button>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {ordersQuery.data?.length === 0 ? (
              <div className="text-center py-20 text-slate-400">
                <History size={48} className="mx-auto mb-4 opacity-20" />
                <p className="font-medium">لا توجد طلبات سابقة</p>
              </div>
            ) : (
              ordersQuery.data?.slice().reverse().map(order => (
                <div key={order.id} className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-black text-slate-900">طلب #{order.id.slice(-4)}</span>
                        <Badge tone={order.status === "COMPLETED" ? "success" : "warn"} className="text-[10px] font-bold">
                          {getStatusLabel(order.status).label}
                        </Badge>
                      </div>
                      <p className="text-xs text-slate-400 mt-1">{new Date(order.createdAt).toLocaleString('ar-EG', { dateStyle: 'medium', timeStyle: 'short' })}</p>
                    </div>
                    <p className="text-lg font-black text-slate-900">{money(order.total)}</p>
                  </div>
                  <div className="space-y-1">
                    {order.items.map(item => (
                      <div key={item.id} className="flex justify-between text-xs text-slate-500">
                        <span>{item.quantity}x {item.product.name}</span>
                        <span>{money(item.subtotal)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </main>

      {/* Cart Bottom Bar */}
      <AnimatePresence>
        {cartItems.length > 0 && !isCartOpen && (
          <motion.div 
            initial={{ y: 100 }} 
            animate={{ y: 0 }} 
            exit={{ y: 100 }}
            className="fixed bottom-6 left-4 right-4 z-50"
          >
            <div className="mx-auto max-w-2xl bg-orange-600 text-white rounded-2xl shadow-2xl shadow-orange-900/20 p-4 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 bg-white/20 rounded-xl flex items-center justify-center relative">
                  <ShoppingCart size={24} />
                  <span className="absolute -top-2 -right-2 h-6 w-6 bg-white text-orange-600 rounded-full flex items-center justify-center text-xs font-black shadow-lg">{cartItems.length}</span>
                </div>
                <div>
                  <p className="text-xs text-orange-100 font-bold uppercase tracking-wider">سلة الطلبات</p>
                  <p className="text-lg font-black leading-none">{money(grandTotal)}</p>
                </div>
              </div>
              <Btn 
                onClick={() => setIsCartOpen(true)}
                className="bg-white text-orange-600 hover:bg-orange-50 font-black px-8 h-12 rounded-xl"
              >
                مراجعة الطلب
              </Btn>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Cart Drawer */}
      <Sheet open={isCartOpen} onOpenChange={setIsCartOpen}>
        <div className="h-full flex flex-col bg-white">
          <div className="mx-auto w-12 h-1.5 bg-slate-100 rounded-full my-4" />
          <SheetHeader>
            <SheetTitle>سلة المشتريات</SheetTitle>
            <p className="text-xs text-slate-400 text-right">راجع طلباتك قبل الإرسال للمطبخ</p>
          </SheetHeader>

          <ScrollArea className="flex-1 px-6">
            <div className="space-y-4">
              {cartItems.map(item => (
                <div key={item.id} className="flex items-center gap-4 py-4 border-b border-slate-50 last:border-0">
                  <div className="h-14 w-14 bg-slate-50 rounded-xl overflow-hidden border border-slate-100">
                    <img src={item.product?.imageUrl} className="h-full w-full object-cover" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-bold text-slate-900 truncate">{item.product?.name}</h4>
                    <p className="text-xs text-slate-400 mt-0.5">{money(item.product?.price || 0)}</p>
                  </div>
                  <div className="flex items-center gap-3 bg-slate-50 rounded-lg p-1">
                    <button onClick={() => removeFromCart(item.id)} className="h-8 w-8 bg-white rounded-md shadow-sm flex items-center justify-center text-slate-600"><Minus size={14} /></button>
                    <span className="text-sm font-black w-4 text-center">{item.qty}</span>
                    <button onClick={() => addToCart(item.id)} className="h-8 w-8 bg-white rounded-md shadow-sm flex items-center justify-center text-slate-600"><Plus size={14} /></button>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>

          <div className="p-6 bg-slate-50/50 border-t border-slate-100">
            <div className="flex items-center justify-between mb-6">
              <div>
                <p className="text-sm font-bold text-slate-900">إجمالي الحساب</p>
                <p className="text-xs text-slate-400">شامل الضريبة والخدمة</p>
              </div>
              <p className="text-2xl font-black text-slate-900">{money(grandTotal)}</p>
            </div>
            <div className="flex gap-3">
              <Btn variant="secondary" onClick={() => setIsCartOpen(false)} className="flex-1 h-14 rounded-2xl font-bold">إلغاء</Btn>
              <Btn 
                onClick={() => createOrderMutation.mutate(cartItems.map(i => ({ productId: i.id, quantity: i.qty })))}
                loading={createOrderMutation.isPending}
                loadingText="جاري الإرسال..."
                className="flex-[2] h-14 bg-orange-600 hover:bg-orange-700 text-white rounded-2xl font-black text-lg shadow-lg shadow-orange-200 border-none"
              >
                تأكيد الطلب
              </Btn>
            </div>
          </div>
        </div>
      </Sheet>

      {/* Chat Minimized Toggle */}
      <button 
        onClick={() => setIsChatOpen(!isChatOpen)}
        className="fixed bottom-6 right-4 z-40 h-12 w-12 bg-white shadow-xl border border-slate-100 rounded-full flex items-center justify-center text-slate-600 hover:text-orange-600 transition-all"
      >
        <MessageCircle size={24} />
      </button>

      {/* Minimized Chat Drawer */}
      <AnimatePresence>
        {isChatOpen && (
          <motion.div 
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="fixed bottom-20 right-4 left-4 z-50 max-w-sm ml-auto"
          >
            <div className="bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden">
              <div className="bg-slate-900 p-4 text-white flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-sm font-bold">خدمة العملاء</span>
                </div>
                <button onClick={() => setIsChatOpen(false)} className="text-slate-400 hover:text-white"><X size={18} /></button>
              </div>
              <ScrollArea className="h-64 p-4 bg-slate-50">
                <div className="space-y-3">
                  {chatMessages.length === 0 && <p className="text-center text-xs text-slate-400 py-10">ارسل رسالة للمساعدة...</p>}
                  {chatMessages.map((msg, i) => (
                    <div key={i} className={cn("flex", msg.sender === "GUEST" ? "justify-end" : "justify-start")}>
                      <div className={cn("max-w-[80%] p-3 rounded-2xl text-xs font-medium", msg.sender === "GUEST" ? "bg-orange-600 text-white rounded-tl-none" : "bg-white border border-slate-200 text-slate-700 rounded-tr-none shadow-sm")}>
                        {msg.text}
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
              <div className="p-3 bg-white border-t border-slate-100 flex gap-2">
                <Input 
                  value={chatInput}
                  onChange={(e: any) => setChatInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && chatInput && (socket?.emit("guest_message", { tableCode: guestCode, text: chatInput }), setChatInput(""))}
                  placeholder="اكتب هنا..." 
                  className="h-10 border-slate-100 text-xs" 
                />
                <Btn size="sm" className="h-10 w-10 bg-orange-600 shrink-0 p-0 border-none" onClick={() => {
                  if (chatInput && socket) {
                    socket.emit("guest_message", { tableCode: guestCode, text: chatInput });
                    setChatInput("");
                  }
                }}>
                  <Send size={16} className="rotate-180" />
                </Btn>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Simple Toast Message */}
      <AnimatePresence>
        {message && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-24 left-4 right-4 z-[100] pointer-events-none"
          >
            <div className={cn("mx-auto max-w-xs p-4 rounded-xl shadow-xl border flex items-center gap-3", message.ok ? "bg-emerald-50 border-emerald-100 text-emerald-800" : "bg-red-50 border-red-100 text-red-800")}>
              {message.ok ? <CheckCircle2 size={20} /> : <Info size={20} />}
              <p className="text-sm font-bold">{message.text}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
