"use client";

import React, { useState, useEffect, useMemo } from "react";
import { 
  Coffee, ShoppingCart, CheckCircle2, 
  ChevronRight, ArrowLeft, RefreshCw,
  Search, Plus, Minus, Send, Key, Timer, ChefHat, PackageCheck, History, Wallet,
  LayoutGrid, ReceiptText, Bell, X, Trash2, Info, Utensils, LogOut, MessageCircle,
  Soup, Pizza, IceCream, Beer, Wine, GlassWater, Sandwich
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
  status: "new" | "in_preparation" | "ready" | "delivered" | "cancelled" | "completed";
  totalAmount: number;
  createdAt: string;
  items: OrderItem[];
}

// --- Helpers ---
const translateProductCategory = (category: string) => {
  const map: Record<string, string> = {
    'Hot Drinks': 'مشروبات ساخنة',
    'Cold Drinks': 'مشروبات باردة',
    'Juices': 'عصائر طازجة',
    'Desserts': 'حلويات',
    'Snacks': 'سناكس',
    'Appetizers': 'مقبلات',
    'Main Courses': 'أطباق رئيسية',
    'Coffee': 'ركن القهوة',
    'Tea': 'شاي ومنكهات',
    'Soft Drinks': 'مشروبات غازية',
    'Water': 'مياه معدنية',
    'Bakery': 'مخبوزات',
    'Breakfast': 'فطور',
  };
  return map[category] || category;
};

const getCategoryIcon = (category: string) => {
  const c = category.toLowerCase();
  if (c.includes('hot') || c.includes('coffee')) return <Coffee size={18} />;
  if (c.includes('cold') || c.includes('juice') || c.includes('soft')) return <GlassWater size={18} />;
  if (c.includes('dessert') || c.includes('ice')) return <IceCream size={18} />;
  if (c.includes('snack') || c.includes('appetizer')) return <Soup size={18} />;
  if (c.includes('main') || c.includes('pizza') || c.includes('sandwich')) return <Pizza size={18} />;
  if (c.includes('bakery') || c.includes('breakfast')) return <Sandwich size={18} />;
  return <Utensils size={18} />;
};

const categoryImages: Record<string, string> = {
  'Hot Drinks': 'https://images.unsplash.com/photo-1541167760496-162955ed8a9f?q=80&w=400&auto=format&fit=crop',
  'Cold Drinks': 'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?q=80&w=400&auto=format&fit=crop',
  'Coffee': 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?q=80&w=400&auto=format&fit=crop',
  'Tea': 'https://images.unsplash.com/photo-1544787210-22bb840c5dad?q=80&w=400&auto=format&fit=crop',
  'Juices': 'https://images.unsplash.com/photo-1621506289937-a8e4df240d0b?q=80&w=400&auto=format&fit=crop',
  'Desserts': 'https://images.unsplash.com/photo-1551024506-0bccd828d307?q=80&w=400&auto=format&fit=crop',
  'Snacks': 'https://images.unsplash.com/photo-15994906592a3-e3f9c07cc4f4?q=80&w=400&auto=format&fit=crop',
};

const getProductImage = (product: Product) => {
  if (product.imageUrl && product.imageUrl !== "null") return product.imageUrl;
  return categoryImages[product.category] || 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?q=80&w=400&auto=format&fit=crop';
};

export default function GuestOrderPage() {
  const [guestCode, setGuestCode] = useState("");
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [activeTab, setActiveTab] = useState<"menu" | "history">("menu");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [cart, setCart] = useState<Record<string, number>>({});
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [message, setMessage] = useState<{ text: string; ok: boolean } | null>(null);

  const [chatMessages, setChatMessages] = useState<any[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [socket, setSocket] = useState<Socket | null>(null);

  const queryClient = useQueryClient();

  useEffect(() => {
    const savedCode = localStorage.getItem("eduverse_guest_code");
    if (savedCode) {
      setGuestCode(savedCode);
      setIsAuthorized(true);
    }
  }, []);

  const handleLogin = () => {
    if (guestCode.trim()) {
      localStorage.setItem("eduverse_guest_code", guestCode.toUpperCase());
      setIsAuthorized(true);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("eduverse_guest_code");
    setIsAuthorized(false);
    setCart({});
  };

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

  const createOrderMutation = useMutation({
    mutationFn: async (items: any[]) => {
      return api.post("/public/orders", { guestCode, items });
    },
    onSuccess: () => {
      setCart({});
      setIsCartOpen(false);
      setMessage({ text: "تم إرسال طلبك بنجاح! طاقمنا سيبدأ التحضير فوراً.", ok: true });
      queryClient.invalidateQueries({ queryKey: ["guest-orders"] });
      setTimeout(() => setMessage(null), 4000);
    },
    onError: (err: any) => {
      const errMsg = err.response?.data?.message || "عذراً، فشل إرسال الطلب.";
      setMessage({ text: errMsg, ok: false });
    },
  });

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
      new: { label: "طلب جديد", color: "text-blue-500", tone: "info" as const, icon: <Bell size={14} /> },
      in_preparation: { label: "جاري التحضير", color: "text-orange-500", tone: "warn" as const, icon: <ChefHat size={14} /> },
      ready: { label: "جاهز للاستلام", color: "text-emerald-500", tone: "success" as const, icon: <PackageCheck size={14} /> },
      delivered: { label: "تم التوصيل", color: "text-slate-500", tone: "neutral" as const, icon: <CheckCircle2 size={14} /> },
      completed: { label: "تم اكتماله", color: "text-slate-500", tone: "neutral" as const, icon: <CheckCircle2 size={14} /> },
      cancelled: { label: "تم الإلغاء", color: "text-red-500", tone: "danger" as const, icon: <X size={14} /> },
    };
    return map[s as keyof typeof map] || { label: s, color: "text-slate-400", tone: "neutral" as const, icon: null };
  };

  if (!isAuthorized) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6" dir="rtl">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-sm bg-white rounded-2xl shadow-sm border border-slate-200 p-8">
          <div className="text-center mb-8">
            <div className="h-16 w-16 bg-orange-50 text-orange-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Utensils size={32} />
            </div>
            <h1 className="text-2xl font-bold text-slate-900">Eduvers Bar</h1>
            <p className="text-slate-500 mt-1">مرحباً بك في قائمة طلباتنا الرقمية</p>
          </div>
          <div className="space-y-4">
            <Input value={guestCode} onChange={(e: any) => setGuestCode(e.target.value)} placeholder="أدخل كود الطاولة (مثلاً: A10)" className="h-14 text-center text-xl font-bold border-slate-200" />
            <Btn onClick={handleLogin} className="w-full h-14 bg-orange-600 text-white rounded-xl text-lg font-bold">دخول القائمة</Btn>
          </div>
        </motion.div>
      </div>
    );
  }

  const activeOrders = ordersQuery.data?.filter(o => ["new", "in_preparation", "ready"].includes(o.status)) || [];

  return (
    <div className="min-h-screen bg-white pb-24" dir="rtl">
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
          <Btn variant="ghost" size="sm" onClick={handleLogout} className="text-slate-400"><LogOut size={20} /></Btn>
        </div>
      </header>

      <main className="mx-auto max-w-2xl px-4 py-6">
        {/* Active Orders Info */}
        {activeOrders.map(order => (
          <motion.div key={order.id} initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} className="mb-3 bg-slate-900 rounded-2xl p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={cn("h-10 w-10 rounded-xl flex items-center justify-center bg-white/10", getStatusLabel(order.status).color)}>
                {getStatusLabel(order.status).icon}
              </div>
              <div>
                <p className={cn("text-sm font-bold", getStatusLabel(order.status).color)}>{getStatusLabel(order.status).label}</p>
                <p className="text-[11px] text-slate-400">طلب #{order.id.slice(-4)} • {money(order.totalAmount)}</p>
              </div>
            </div>
          </motion.div>
        ))}

        {/* Search & Tabs */}
        <div className="flex items-center gap-2 mb-6">
          <Input placeholder="ابحث عن مشروبك..." value={searchTerm} onChange={(e: any) => setSearchTerm(e.target.value)} icon={<Search size={18} />} className="flex-1 h-12 rounded-xl" />
          <div className="flex bg-slate-100 p-1 rounded-xl shrink-0">
            <button onClick={() => setActiveTab("menu")} className={cn("px-4 py-2 text-sm font-bold rounded-lg transition-all", activeTab === "menu" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500")}>القائمة</button>
            <button onClick={() => setActiveTab("history")} className={cn("px-4 py-2 text-sm font-bold rounded-lg transition-all", activeTab === "history" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500")}>طلباتي</button>
          </div>
        </div>

        {activeTab === "menu" ? (
          <div className="space-y-6">
            <div className="flex items-center gap-2 overflow-x-auto no-scrollbar -mx-4 px-4">
              <button onClick={() => setSelectedCategory("all")} className={cn("whitespace-nowrap px-4 py-2 rounded-xl text-sm font-bold border", selectedCategory === "all" ? "bg-orange-600 border-orange-600 text-white" : "bg-white border-slate-200")}>الكل</button>
              {Array.from(new Set(productsQuery.data?.map(p => p.category) || [])).map(cat => (
                <button key={cat} onClick={() => setSelectedCategory(cat)} className={cn("whitespace-nowrap px-4 py-2 rounded-xl text-sm font-bold border flex items-center gap-2", selectedCategory === cat ? "bg-orange-600 border-orange-600 text-white" : "bg-white border-slate-200")}>
                  {getCategoryIcon(cat)} {translateProductCategory(cat)}
                </button>
              ))}
            </div>

            {productsQuery.isLoading ? (
              <div className="py-20 text-center text-slate-400"><RefreshCw className="animate-spin mx-auto mb-2" /> جاري التحميل...</div>
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
                          {translateProductCategory(category)}
                        </h3>
                        <div className="grid grid-cols-1 gap-3">
                          {prods.map(product => (
                            <div key={product.id} className="bg-white border border-slate-100 rounded-2xl p-3 flex items-center gap-4 shadow-sm">
                              <div className="h-16 w-16 bg-slate-50 rounded-xl overflow-hidden shrink-0 border border-slate-100">
                                <img src={getProductImage(product)} alt={product.name} className="h-full w-full object-cover" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <h4 className="text-[15px] font-bold text-slate-900 truncate">{product.name}</h4>
                                <div className="flex items-center justify-between mt-2">
                                  <span className="text-base font-black text-slate-900">{money(product.price)}</span>
                                  <div className="flex items-center gap-2">
                                    {cart[product.id] ? (
                                      <div className="flex items-center gap-3 bg-slate-100 rounded-lg p-1">
                                        <button onClick={() => removeFromCart(product.id)} className="h-7 w-7 bg-white rounded-md flex items-center justify-center shadow-sm"><Minus size={14} /></button>
                                        <span className="text-sm font-bold">{cart[product.id]}</span>
                                        <button onClick={() => addToCart(product.id)} className="h-7 w-7 bg-white rounded-md flex items-center justify-center shadow-sm"><Plus size={14} /></button>
                                      </div>
                                    ) : (
                                      <button onClick={() => addToCart(product.id)} className="h-9 px-5 bg-slate-900 text-white text-xs font-bold rounded-xl">إضافة</button>
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
          <div className="space-y-3">
            {ordersQuery.data?.slice().reverse().map(order => (
              <div key={order.id} className="bg-white border border-slate-100 rounded-2xl p-4 shadow-sm">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-black">طلب #{order.id.slice(-4)}</span>
                      <Badge tone={getStatusLabel(order.status).tone}>{getStatusLabel(order.status).label}</Badge>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-1">{new Date(order.createdAt).toLocaleString('ar-EG')}</p>
                  </div>
                  <p className="text-lg font-black">{money(order.totalAmount)}</p>
                </div>
                <div className="space-y-1">
                  {order.items.map((item: any) => (
                    <div key={item.id} className="flex justify-between text-[11px] text-slate-500">
                      <span>{item.quantity}x {item.product.name}</span>
                      <span>{money(item.subtotal)}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Cart Bottom Bar */}
      <AnimatePresence>
        {cartItems.length > 0 && !isCartOpen && (
          <motion.div initial={{ y: 100 }} animate={{ y: 0 }} exit={{ y: 100 }} className="fixed bottom-6 left-4 right-4 z-50">
            <div className="mx-auto max-w-2xl bg-orange-600 text-white rounded-2xl shadow-xl p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 bg-white/20 rounded-xl flex items-center justify-center relative">
                  <ShoppingCart size={20} />
                  <span className="absolute -top-1 -right-1 h-5 w-5 bg-white text-orange-600 rounded-full flex items-center justify-center text-[10px] font-black">{cartItems.length}</span>
                </div>
                <div>
                  <p className="text-xs text-orange-100 font-bold uppercase tracking-wider">سلة الطلبات</p>
                  <p className="text-lg font-black leading-none">{money(grandTotal)}</p>
                </div>
              </div>
              <Btn onClick={() => setIsCartOpen(true)} className="bg-white text-orange-600 px-6 h-11 rounded-xl font-black">مراجعة الطلب</Btn>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Cart Drawer */}
      <Sheet open={isCartOpen} onOpenChange={setIsCartOpen}>
        <div className="h-full flex flex-col">
          <div className="mx-auto w-12 h-1.5 bg-slate-100 rounded-full my-4" />
          <SheetHeader><SheetTitle>سلة المشتريات</SheetTitle></SheetHeader>
          <ScrollArea className="flex-1 px-6">
            {cartItems.map(item => (
              <div key={item.id} className="flex items-center gap-4 py-4 border-b border-slate-50">
                <div className="h-14 w-14 rounded-xl overflow-hidden border border-slate-100">
                  <img src={getProductImage(item.product!)} className="h-full w-full object-cover" />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="text-sm font-bold text-slate-900 truncate">{item.product?.name}</h4>
                  <p className="text-xs text-slate-400">{money(item.product?.price || 0)}</p>
                </div>
                <div className="flex items-center gap-3 bg-slate-50 rounded-lg p-1">
                  <button onClick={() => removeFromCart(item.id)} className="h-7 w-7 bg-white rounded flex items-center justify-center shadow-sm"><Minus size={12} /></button>
                  <span className="text-sm font-black">{item.qty}</span>
                  <button onClick={() => addToCart(item.id)} className="h-7 w-7 bg-white rounded flex items-center justify-center shadow-sm"><Plus size={12} /></button>
                </div>
              </div>
            ))}
          </ScrollArea>
          <div className="p-6 bg-slate-50 border-t border-slate-100">
            <div className="flex justify-between mb-4">
              <p className="text-sm font-bold">الإجمالي</p>
              <p className="text-2xl font-black">{money(grandTotal)}</p>
            </div>
            <Btn onClick={() => createOrderMutation.mutate(cartItems.map(i => ({ productId: i.id, quantity: i.qty })))} loading={createOrderMutation.isPending} className="w-full h-14 bg-orange-600 text-white rounded-2xl font-black text-lg">تأكيد الطلب</Btn>
          </div>
        </div>
      </Sheet>

      {/* Message Toast */}
      <AnimatePresence>
        {message && (
          <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="fixed top-20 left-4 right-4 z-[100]">
            <div className={cn("mx-auto max-w-xs p-4 rounded-xl shadow-xl flex items-center gap-3 border", message.ok ? "bg-emerald-50 border-emerald-100 text-emerald-800" : "bg-red-50 border-red-100 text-red-800")}>
              {message.ok ? <CheckCircle2 size={20} /> : <Info size={20} />}
              <p className="text-sm font-bold">{message.text}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Chat */}
      <button onClick={() => setIsChatOpen(!isChatOpen)} className="fixed bottom-6 right-4 z-40 h-12 w-12 bg-white shadow-xl border border-slate-100 rounded-full flex items-center justify-center text-slate-600"><MessageCircle size={24} /></button>
      <AnimatePresence>
        {isChatOpen && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }} className="fixed bottom-20 right-4 left-4 z-50 max-w-sm ml-auto bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden">
            <div className="bg-slate-900 p-4 text-white flex justify-between items-center"><span className="text-sm font-bold">مساعدة</span><button onClick={() => setIsChatOpen(false)}><X size={18} /></button></div>
            <ScrollArea className="h-64 p-4 bg-slate-50 space-y-3">
              {chatMessages.map((msg, i) => (
                <div key={i} className={cn("flex", msg.sender === "GUEST" ? "justify-end" : "justify-start")}>
                  <div className={cn("p-3 rounded-2xl text-xs font-medium", msg.sender === "GUEST" ? "bg-orange-600 text-white" : "bg-white border border-slate-200")}>{msg.text}</div>
                </div>
              ))}
            </ScrollArea>
            <div className="p-3 border-t flex gap-2">
              <Input value={chatInput} onChange={(e: any) => setChatInput(e.target.value)} placeholder="اكتب رسالتك..." className="h-10 text-xs" />
              <Btn onClick={() => { if (chatInput && socket) { socket.emit("guest_message", { tableCode: guestCode, text: chatInput }); setChatInput(""); } }} className="bg-orange-600 p-2"><Send size={16} /></Btn>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
