"use client";

import React, { useState, useEffect, useMemo } from "react";
import { 
  Coffee, ShoppingCart, CheckCircle2, 
  ChevronRight, ArrowLeft, RefreshCw,
  Search, Plus, Minus, Send, Key, Timer, ChefHat, PackageCheck, History, Wallet,
  LayoutGrid, ReceiptText, Bell, X, Trash2, Info, Utensils, LogOut, MessageCircle,
  Soup, Pizza, IceCream, Beer, Wine, GlassWater, Sandwich, Flame
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
      const upperCode = guestCode.trim().toUpperCase();
      setGuestCode(upperCode);
      localStorage.setItem("eduverse_guest_code", upperCode);
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
      new: { label: "استلمنا طلبك", color: "text-blue-600", bg: "bg-blue-50", tone: "info" as const, icon: <Bell size={16} /> },
      in_preparation: { label: "جاري التحضير", color: "text-orange-600", bg: "bg-orange-50", tone: "warn" as const, icon: <Flame size={16} /> },
      ready: { label: "طلبك جاهز!", color: "text-emerald-600", bg: "bg-emerald-50", tone: "success" as const, icon: <PackageCheck size={16} /> },
      delivered: { label: "تم التوصيل", color: "text-slate-600", bg: "bg-slate-50", tone: "neutral" as const, icon: <CheckCircle2 size={16} /> },
      completed: { label: "تم اكتماله", color: "text-slate-600", bg: "bg-slate-50", tone: "neutral" as const, icon: <CheckCircle2 size={16} /> },
      cancelled: { label: "تم الإلغاء", color: "text-red-600", bg: "bg-red-50", tone: "danger" as const, icon: <X size={16} /> },
    };
    return map[s as keyof typeof map] || { label: s, color: "text-slate-400", bg: "bg-slate-50", tone: "neutral" as const, icon: null };
  };

  // --- UI Components ---
  const OrderProgress = ({ status }: { status: string }) => {
    const steps = [
      { id: "new", label: "استلمنا", icon: <Bell size={14} /> },
      { id: "in_preparation", label: "تحضير", icon: <Flame size={14} /> },
      { id: "ready", label: "جاهز", icon: <PackageCheck size={14} /> },
    ];
    
    const currentIndex = steps.findIndex(s => s.id === status);
    const isCompleted = status === "delivered" || status === "completed";
    
    return (
      <div className="w-full mt-4 pt-2">
        <div className="relative flex justify-between">
          {/* Background Line */}
          <div className="absolute top-4 left-0 right-0 h-0.5 bg-slate-800" />
          
          {/* Progress Line */}
          <motion.div 
            initial={{ width: 0 }}
            animate={{ width: isCompleted ? "100%" : `${(currentIndex / (steps.length - 1)) * 100}%` }}
            className="absolute top-4 right-0 h-0.5 bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.4)]"
          />

          {steps.map((step, i) => {
            const isActive = currentIndex >= i || isCompleted;
            const isCurrent = currentIndex === i && !isCompleted;
            
            return (
              <div key={step.id} className="relative z-10 flex flex-col items-center">
                <div className={cn(
                  "h-8 w-8 rounded-full flex items-center justify-center transition-all duration-500 border-2",
                  isActive ? "bg-emerald-500 border-emerald-500 text-slate-900" : "bg-slate-900 border-slate-700 text-slate-500",
                  isCurrent && "ring-4 ring-emerald-500/20 animate-pulse"
                )}>
                  {step.icon}
                </div>
                <span className={cn(
                  "text-[10px] font-black mt-2 transition-colors",
                  isActive ? "text-emerald-500" : "text-slate-500"
                )}>
                  {step.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  if (!isAuthorized) {
    return (
      <div className="min-h-screen bg-[#fafafa] flex items-center justify-center p-6" dir="rtl">
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="w-full max-w-sm bg-white rounded-[2.5rem] shadow-2xl shadow-slate-200/50 border border-slate-100 p-10">
          <div className="text-center mb-10">
            <div className="h-20 w-20 bg-orange-50 text-orange-600 rounded-[2rem] flex items-center justify-center mx-auto mb-6 shadow-inner">
              <Utensils size={40} />
            </div>
            <h1 className="text-3xl font-black text-slate-900 tracking-tight">Eduvers Bar</h1>
            <p className="text-slate-400 mt-2 font-medium">أهلاً بك في تجربتك الرقمية</p>
          </div>
          <div className="space-y-6">
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-400 mr-2 uppercase tracking-widest">كود الطاولة</label>
              <Input 
                value={guestCode} 
                onChange={(e: any) => setGuestCode(e.target.value)} 
                placeholder="مثلاً: A10" 
                className="h-16 text-center text-2xl font-black border-slate-100 bg-slate-50/50 focus:bg-white rounded-[1.25rem] transition-all" 
              />
            </div>
            <Btn onClick={handleLogin} variant="orange" className="w-full h-16 rounded-[1.25rem] text-xl font-black shadow-lg">دخول القائمة</Btn>
          </div>
        </motion.div>
      </div>
    );
  }

  const activeOrders = ordersQuery.data?.filter(o => ["new", "in_preparation", "ready"].includes(o.status)) || [];

  return (
    <div className="min-h-screen bg-white pb-24 selection:bg-orange-100" dir="rtl">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-xl border-b border-slate-50 px-4 py-5">
        <div className="mx-auto max-w-2xl flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 bg-slate-900 rounded-2xl flex items-center justify-center text-white font-black text-xl shadow-lg shadow-slate-200">E</div>
            <div>
              <h2 className="text-lg font-black text-slate-900 leading-none">Eduvers Bar</h2>
              <div className="flex items-center gap-1.5 mt-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-[12px] font-bold text-slate-500">طاولة <span className="text-orange-600">{guestCode}</span></span>
              </div>
            </div>
          </div>
          <Btn variant="ghost" size="sm" onClick={handleLogout} className="h-12 w-12 p-0 rounded-2xl bg-slate-50 text-slate-400 hover:text-red-500 transition-colors">
            <LogOut size={22} />
          </Btn>
        </div>
      </header>

      <main className="mx-auto max-w-2xl px-4 py-8">
        {/* Active Status Cards */}
        <AnimatePresence>
          {activeOrders.map(order => (
            <motion.div 
              key={order.id} 
              initial={{ opacity: 0, y: -10 }} 
              animate={{ opacity: 1, y: 0 }} 
              exit={{ opacity: 0, scale: 0.95 }}
              className="mb-4 bg-slate-900 rounded-[2rem] p-6 flex flex-col shadow-xl shadow-slate-900/10 border border-slate-800"
            >
              <div className="flex items-center justify-between w-full mb-2">
                <div className="flex items-center gap-4">
                  <div className={cn("h-12 w-12 rounded-2xl flex items-center justify-center shadow-inner", getStatusLabel(order.status).bg, getStatusLabel(order.status).color)}>
                    {getStatusLabel(order.status).icon}
                  </div>
                  <div>
                    <p className={cn("text-sm font-black", getStatusLabel(order.status).color)}>
                      {getStatusLabel(order.status).label}
                    </p>
                    <p className="text-[11px] text-slate-500 font-bold mt-0.5">طلب #{order.id.slice(-4)} • {money(order.totalAmount)}</p>
                  </div>
                </div>
                <div className="text-left">
                  <span className="text-[10px] font-bold text-slate-600 uppercase tracking-widest">حالة الطلب</span>
                </div>
              </div>
              
              <OrderProgress status={order.status} />
            </motion.div>
          ))}
        </AnimatePresence>

        {/* Search & Tabs */}
        <div className="flex items-center gap-3 mb-8">
          <Input 
            placeholder="ابحث عن طلبك..." 
            value={searchTerm} 
            onChange={(e: any) => setSearchTerm(e.target.value)} 
            icon={<Search size={20} />} 
            className="flex-1 h-14 rounded-2xl border-slate-100 bg-slate-50/50 focus:bg-white" 
          />
          <div className="flex bg-slate-100/50 p-1.5 rounded-[1.25rem] shrink-0 border border-slate-100">
            <button onClick={() => setActiveTab("menu")} className={cn("px-5 py-2.5 text-sm font-black rounded-xl transition-all", activeTab === "menu" ? "bg-white text-slate-900 shadow-sm" : "text-slate-400 hover:text-slate-600")}>القائمة</button>
            <button onClick={() => setActiveTab("history")} className={cn("px-5 py-2.5 text-sm font-black rounded-xl transition-all", activeTab === "history" ? "bg-white text-slate-900 shadow-sm" : "text-slate-400 hover:text-slate-600")}>طلباتي</button>
          </div>
        </div>

        {activeTab === "menu" ? (
          <div className="space-y-10">
            {/* Categories */}
            <div className="flex items-center gap-3 overflow-x-auto no-scrollbar -mx-4 px-4 py-2">
              <button 
                onClick={() => setSelectedCategory("all")} 
                className={cn("whitespace-nowrap px-6 py-3 rounded-2xl text-sm font-black transition-all border-2", selectedCategory === "all" ? "bg-orange-600 border-orange-600 text-white shadow-lg shadow-orange-100" : "bg-white border-slate-50 text-slate-500 hover:border-slate-200")}
              >الكل</button>
              {Array.from(new Set(productsQuery.data?.map(p => p.category) || [])).map(cat => (
                <button 
                  key={cat} 
                  onClick={() => setSelectedCategory(cat)} 
                  className={cn("whitespace-nowrap px-6 py-3 rounded-2xl text-sm font-black transition-all border-2 flex items-center gap-2.5", selectedCategory === cat ? "bg-orange-600 border-orange-600 text-white shadow-lg shadow-orange-100" : "bg-white border-slate-50 text-slate-500 hover:border-slate-200")}
                >
                  {getCategoryIcon(cat)} {translateProductCategory(cat)}
                </button>
              ))}
            </div>

            {/* Products Grid */}
            {productsQuery.isLoading ? (
              <div className="py-24 text-center">
                <RefreshCw className="animate-spin mx-auto mb-4 text-orange-500" size={40} />
                <p className="text-slate-400 font-bold">جاري تحضير القائمة...</p>
              </div>
            ) : (
              <div className="space-y-10">
                {Array.from(new Set(productsQuery.data?.map(p => p.category) || []))
                  .filter(cat => selectedCategory === "all" || selectedCategory === cat)
                  .map(category => {
                    const prods = productsQuery.data?.filter(p => 
                      (selectedCategory === "all" || p.category === category) && 
                      p.name.toLowerCase().includes(searchTerm.toLowerCase())
                    );
                    if (!prods?.length) return null;
                    return (
                      <section key={category} className="space-y-5">
                        <div className="flex items-center justify-between">
                          <h3 className="text-xl font-black text-slate-900 flex items-center gap-3">
                            <span className="h-6 w-1.5 bg-orange-500 rounded-full" />
                            {translateProductCategory(category)}
                          </h3>
                          <span className="text-xs font-bold text-slate-300 uppercase tracking-widest">{prods.length} صنف</span>
                        </div>
                        <div className="grid grid-cols-1 gap-4">
                          {prods.map(product => (
                            <motion.div 
                              key={product.id} 
                              whileTap={{ scale: 0.98 }}
                              className="bg-white border border-slate-50 rounded-[2rem] p-4 flex items-center gap-5 shadow-sm hover:shadow-md transition-all group"
                            >
                              <div className="h-20 w-20 bg-slate-50 rounded-[1.5rem] overflow-hidden shrink-0 border border-slate-100 group-hover:border-orange-100 transition-colors">
                                <img src={getProductImage(product)} alt={product.name} className="h-full w-full object-cover transition-transform group-hover:scale-110" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <h4 className="text-[16px] font-black text-slate-900 truncate">{product.name}</h4>
                                <div className="flex items-center justify-between mt-3">
                                  <span className="text-lg font-black text-slate-900">{money(product.price)}</span>
                                  <div className="flex items-center gap-2">
                                    {cart[product.id] ? (
                                      <div className="flex items-center gap-1.5 bg-slate-100/80 p-1 rounded-[1rem] border border-slate-200/50">
                                        <button onClick={() => removeFromCart(product.id)} className="h-9 w-9 bg-white rounded-xl flex items-center justify-center shadow-sm text-slate-600 hover:bg-red-50 hover:text-red-500 transition-colors"><Minus size={16} /></button>
                                        <span className="text-sm font-black w-6 text-center">{cart[product.id]}</span>
                                        <button onClick={() => addToCart(product.id)} className="h-9 w-9 bg-white rounded-xl flex items-center justify-center shadow-sm text-slate-600 hover:bg-emerald-50 hover:text-emerald-500 transition-colors"><Plus size={16} /></button>
                                      </div>
                                    ) : (
                                      <Btn 
                                        onClick={() => addToCart(product.id)} 
                                        variant="primary" 
                                        size="sm"
                                        className="h-10 px-6 rounded-xl font-black bg-slate-900 hover:bg-orange-600 transition-all border-none"
                                      >
                                        إضافة
                                      </Btn>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </motion.div>
                          ))}
                        </div>
                      </section>
                    );
                  })}
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {ordersQuery.data?.slice().reverse().map(order => (
              <div key={order.id} className="bg-white border border-slate-100 rounded-[2rem] p-6 shadow-sm">
                <div className="flex items-center justify-between mb-5">
                  <div className="flex items-center gap-3">
                    <div className={cn("h-10 w-10 rounded-xl flex items-center justify-center shadow-inner", getStatusLabel(order.status).bg, getStatusLabel(order.status).color)}>
                      {getStatusLabel(order.status).icon}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-black">طلب #{order.id.slice(-4)}</span>
                        <Badge tone={getStatusLabel(order.status).tone} className="font-bold">{getStatusLabel(order.status).label}</Badge>
                      </div>
                      <p className="text-[11px] text-slate-400 font-bold mt-1">{new Date(order.createdAt).toLocaleString('ar-EG')}</p>
                    </div>
                  </div>
                  <p className="text-xl font-black text-slate-900">{money(order.totalAmount)}</p>
                </div>
                <div className="space-y-2 bg-slate-50/50 p-4 rounded-2xl border border-slate-50">
                  {order.items.map((item: any) => (
                    <div key={item.id} className="flex justify-between text-[12px] font-bold text-slate-500">
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
          <motion.div 
            initial={{ y: 100, opacity: 0 }} 
            animate={{ y: 0, opacity: 1 }} 
            exit={{ y: 100, opacity: 0 }} 
            className="fixed bottom-8 left-4 right-4 z-50"
          >
            <div className="mx-auto max-w-2xl bg-orange-600 text-white rounded-[2rem] shadow-2xl shadow-orange-600/30 p-5 flex items-center justify-between border border-orange-500">
              <div className="flex items-center gap-4">
                <div className="h-14 w-14 bg-white/20 rounded-2xl flex items-center justify-center relative shadow-inner">
                  <ShoppingCart size={28} />
                  <span className="absolute -top-1.5 -right-1.5 h-7 w-7 bg-white text-orange-600 rounded-full flex items-center justify-center text-xs font-black shadow-lg border-2 border-orange-600">{cartItems.length}</span>
                </div>
                <div>
                  <p className="text-xs text-orange-100 font-bold uppercase tracking-widest opacity-80">سلة الطلبات</p>
                  <p className="text-2xl font-black leading-none mt-1">{money(grandTotal)}</p>
                </div>
              </div>
              <Btn 
                onClick={() => setIsCartOpen(true)} 
                className="bg-white text-orange-600 hover:bg-orange-50 px-10 h-14 rounded-2xl font-black text-lg border-none active:scale-95"
              >
                مراجعة السلة
              </Btn>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Cart Drawer */}
      <Sheet open={isCartOpen} onOpenChange={setIsCartOpen}>
        <div className="h-full flex flex-col bg-white">
          <div className="mx-auto w-16 h-1.5 bg-slate-100 rounded-full my-6" />
          <SheetHeader className="px-8 border-none">
            <SheetTitle className="text-3xl font-black">سلة المشتريات</SheetTitle>
            <p className="text-sm font-bold text-slate-400 mt-1">راجع أصنافك المختارة بعناية</p>
          </SheetHeader>
          <ScrollArea className="flex-1 px-8 mt-6">
            <div className="space-y-6">
              {cartItems.map(item => (
                <div key={item.id} className="flex items-center gap-5 py-5 border-b border-slate-50 last:border-0 group">
                  <div className="h-16 w-16 rounded-2xl overflow-hidden border border-slate-100 group-hover:border-orange-100 transition-colors shadow-sm">
                    <img src={getProductImage(item.product!)} className="h-full w-full object-cover" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-base font-black text-slate-900 truncate">{item.product?.name}</h4>
                    <p className="text-sm font-bold text-slate-400 mt-1">{money(item.product?.price || 0)}</p>
                  </div>
                  <div className="flex items-center gap-2 bg-slate-50 p-1.5 rounded-2xl border border-slate-100">
                    <button onClick={() => removeFromCart(item.id)} className="h-10 w-10 bg-white rounded-xl flex items-center justify-center shadow-sm text-slate-600 hover:text-red-500"><Minus size={16} /></button>
                    <span className="text-sm font-black w-6 text-center">{item.qty}</span>
                    <button onClick={() => addToCart(item.id)} className="h-10 w-10 bg-white rounded-xl flex items-center justify-center shadow-sm text-slate-600 hover:text-emerald-500"><Plus size={16} /></button>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
          <div className="p-8 bg-slate-50/50 border-t border-slate-100 rounded-t-[3rem]">
            <div className="flex justify-between items-center mb-8 px-2">
              <div>
                <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">المجموع الكلي</p>
                <p className="text-3xl font-black text-slate-900 mt-1">{money(grandTotal)}</p>
              </div>
              <div className="text-left">
                <p className="text-xs font-bold text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-full inline-block">شامل الضريبة</p>
              </div>
            </div>
            <Btn 
              onClick={() => createOrderMutation.mutate(cartItems.map(i => ({ productId: i.id, quantity: i.qty })))} 
              loading={createOrderMutation.isPending} 
              variant="orange"
              className="w-full h-16 rounded-[1.5rem] font-black text-xl shadow-xl shadow-orange-200 border-none"
            >
              تأكيد وإرسال الطلب
            </Btn>
          </div>
        </div>
      </Sheet>

      {/* Floating Chat */}
      <button 
        onClick={() => setIsChatOpen(!isChatOpen)} 
        className="fixed bottom-10 right-6 z-40 h-16 w-16 bg-white shadow-2xl border border-slate-100 rounded-full flex items-center justify-center text-slate-700 hover:text-orange-600 hover:scale-110 active:scale-95 transition-all"
      >
        <MessageCircle size={28} />
      </button>

      {/* Chat UI */}
      <AnimatePresence>
        {isChatOpen && (
          <motion.div 
            initial={{ opacity: 0, y: 30, scale: 0.9 }} 
            animate={{ opacity: 1, y: 0, scale: 1 }} 
            exit={{ opacity: 0, y: 30, scale: 0.9 }} 
            className="fixed bottom-28 right-6 left-6 z-50 max-w-sm ml-auto bg-white rounded-[2.5rem] shadow-[0_20px_60px_-15px_rgba(0,0,0,0.15)] border border-slate-100 overflow-hidden"
          >
            <div className="bg-slate-900 p-6 text-white flex justify-between items-center">
              <div className="flex items-center gap-3">
                <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-base font-black">الدعم الفني</span>
              </div>
              <button onClick={() => setIsChatOpen(false)} className="h-8 w-8 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors">
                <X size={18} />
              </button>
            </div>
            <ScrollArea className="h-80 p-6 bg-slate-50 space-y-4">
              {chatMessages.map((msg, i) => (
                <div key={i} className={cn("flex", msg.sender === "GUEST" ? "justify-end" : "justify-start")}>
                  <div className={cn("max-w-[85%] p-4 rounded-[1.5rem] text-sm font-bold shadow-sm", msg.sender === "GUEST" ? "bg-orange-600 text-white rounded-tl-none" : "bg-white border border-slate-100 text-slate-800 rounded-tr-none")}>
                    {msg.text}
                  </div>
                </div>
              ))}
              {chatMessages.length === 0 && <p className="text-center text-xs text-slate-300 font-bold py-20">اترك لنا رسالة وسنرد عليك فوراً</p>}
            </ScrollArea>
            <div className="p-4 bg-white border-t border-slate-50 flex gap-3">
              <Input 
                value={chatInput} 
                onChange={(e: any) => setChatInput(e.target.value)} 
                placeholder="كيف يمكننا مساعدتك؟" 
                className="h-12 text-sm rounded-xl border-slate-100 font-bold" 
              />
              <Btn 
                onClick={() => { if (chatInput && socket) { socket.emit("guest_message", { tableCode: guestCode, text: chatInput }); setChatInput(""); } }} 
                variant="orange"
                className="h-12 w-12 p-0 rounded-xl"
              >
                <Send size={18} className="rotate-180" />
              </Btn>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Message Toast */}
      <AnimatePresence>
        {message && (
          <motion.div initial={{ opacity: 0, y: -40 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -40 }} className="fixed top-24 left-6 right-6 z-[100] pointer-events-none">
            <div className={cn("mx-auto max-w-sm p-5 rounded-3xl shadow-2xl flex items-center gap-4 border-2 backdrop-blur-md", message.ok ? "bg-emerald-50/90 border-emerald-100 text-emerald-900" : "bg-red-50/90 border-red-100 text-red-900")}>
              <div className={cn("h-10 w-10 rounded-2xl flex items-center justify-center shrink-0 shadow-sm", message.ok ? "bg-emerald-500 text-white" : "bg-red-500 text-white")}>
                {message.ok ? <CheckCircle2 size={24} /> : <Info size={24} />}
              </div>
              <p className="text-base font-black leading-tight">{message.text}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
