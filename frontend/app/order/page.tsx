"use client";

import React, { useState, useEffect, useMemo } from "react";
import { 
  Coffee, ShoppingCart, CheckCircle2, 
  Search, Plus, Minus, Send, Flame, PackageCheck, History,
  LogOut, MessageCircle, X, Info, Utensils,
  GlassWater, IceCream, Soup, Pizza, Sandwich, Bell, Edit3
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { api } from "../../lib/api";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { io, Socket } from "socket.io-client";
import { Badge, Input, Btn, Sheet, SheetHeader, SheetTitle, ScrollArea, Modal } from "@/components/ui";
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
  if (c.includes('hot') || c.includes('coffee') || c.includes('tea')) return <Coffee size={16} />;
  if (c.includes('cold') || c.includes('juice') || c.includes('soft') || c.includes('water')) return <GlassWater size={16} />;
  if (c.includes('dessert') || c.includes('ice')) return <IceCream size={16} />;
  if (c.includes('snack') || c.includes('appetizer')) return <Soup size={16} />;
  if (c.includes('main') || c.includes('pizza') || c.includes('sandwich')) return <Pizza size={16} />;
  if (c.includes('bakery') || c.includes('breakfast')) return <Sandwich size={16} />;
  return <Utensils size={16} />;
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

const money = (v: number) => new Intl.NumberFormat('ar-EG', { style: 'currency', currency: 'EGP' }).format(v);

// --- Components ---
const CompactProgress = ({ status }: { status: string }) => {
  const steps = [
    { id: "new", label: "تم الاستلام" },
    { id: "in_preparation", label: "جاري التحضير" },
    { id: "ready", label: "جاهز" },
    { id: "delivered", label: "تم التسليم" },
  ];
  
  // map completed to delivered for progress bar logic
  const normalizedStatus = status === "completed" ? "delivered" : status;
  const currentIndex = steps.findIndex(s => s.id === normalizedStatus);
  const isCancelled = status === "cancelled";

  if (isCancelled) {
    return (
      <div className="mt-3 text-xs font-bold text-red-500 bg-red-50 p-2 rounded-lg inline-flex items-center gap-2">
        <X size={14} /> تم إلغاء الطلب
      </div>
    );
  }

  return (
    <div className="mt-4 pt-1">
      <div className="relative flex justify-between">
        <div className="absolute top-1.5 left-0 right-0 h-1 bg-slate-100 rounded-full" />
        <div 
          className="absolute top-1.5 right-0 h-1 bg-orange-500 rounded-full transition-all duration-500"
          style={{ width: currentIndex >= 0 ? `${(currentIndex / (steps.length - 1)) * 100}%` : '0%' }}
        />
        {steps.map((step, i) => {
          const isActive = currentIndex >= i;
          return (
            <div key={step.id} className="relative z-10 flex flex-col items-center gap-1.5">
              <div className={cn(
                "h-4 w-4 rounded-full border-2 transition-colors duration-300",
                isActive ? "border-orange-500 bg-orange-500" : "border-slate-200 bg-white"
              )} />
              <span className={cn(
                "text-[10px] font-bold transition-colors",
                isActive ? "text-slate-800" : "text-slate-400"
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
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6" dir="rtl">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md bg-white rounded-2xl shadow-sm border border-slate-100 p-8">
          <div className="text-center mb-8">
            <div className="h-16 w-16 bg-slate-100 text-slate-800 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Utensils size={32} />
            </div>
            <h1 className="text-2xl font-bold text-slate-900">Eduvers Cafe</h1>
            <p className="text-sm text-slate-500 mt-1">القائمة الرقمية للطلبات</p>
          </div>
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-2">كود الطاولة</label>
              <Input 
                value={guestCode} 
                onChange={(e: any) => setGuestCode(e.target.value)} 
                placeholder="أدخل كود الطاولة..." 
                className="h-12 text-center font-bold text-lg rounded-xl bg-slate-50"
                onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
              />
            </div>
            <Btn onClick={handleLogin} variant="primary" className="w-full h-12 rounded-xl bg-orange-600 hover:bg-orange-700 border-none font-bold">
              تصفح القائمة
            </Btn>
          </div>
        </motion.div>
      </div>
    );
  }

  const activeOrders = ordersQuery.data?.filter(o => ["new", "in_preparation", "ready"].includes(o.status)) || [];

  return (
    <div className="min-h-screen bg-slate-50 pb-28 lg:pb-8 text-slate-800 font-sans selection:bg-orange-100" dir="rtl">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-slate-200">
        <div className="max-w-[1200px] mx-auto px-3 sm:px-4 h-14 sm:h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5 sm:gap-3">
            <div className="h-8 w-8 sm:h-10 sm:w-10 bg-slate-900 rounded-lg sm:rounded-xl flex items-center justify-center text-white font-bold text-base sm:text-lg">E</div>
            <div>
              <h2 className="text-xs sm:text-sm font-bold leading-tight">Eduvers Cafe</h2>
              <p className="text-[10px] sm:text-[11px] text-slate-500 font-medium">طاولة {guestCode}</p>
            </div>
          </div>
          <button onClick={handleLogout} className="p-1.5 sm:p-2 text-slate-400 hover:text-slate-700 transition-colors rounded-lg hover:bg-slate-100">
            <LogOut size={18} className="sm:w-5 sm:h-5" />
          </button>
        </div>
      </header>

      <main className="max-w-[1200px] mx-auto px-3 sm:px-4 py-4 sm:py-6">
        <div className="grid lg:grid-cols-[1fr_360px] gap-4 sm:gap-8">
          
          {/* Main Content Area */}
          <div className="space-y-6">
            
            {/* Active Orders Status */}
            {activeOrders.length > 0 && (
              <div className="space-y-3">
                <h3 className="text-xs sm:text-sm font-bold text-slate-700 flex items-center gap-2">
                  <Bell size={14} className="sm:w-4 sm:h-4 text-orange-500" /> طلباتك الحالية
                </h3>
                {activeOrders.map(order => (
                  <div key={order.id} className="bg-white rounded-xl sm:rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-sm">
                    <div className="flex justify-between items-start mb-1">
                      <div>
                        <span className="text-[10px] sm:text-xs font-bold text-slate-400">طلب #{order.id.slice(-4)}</span>
                        <div className="text-xs sm:text-sm font-bold text-slate-900 mt-1">{money(order.totalAmount)}</div>
                      </div>
                    </div>
                    <CompactProgress status={order.status} />
                  </div>
                ))}
              </div>
            )}

            {/* Navigation Tabs & Search */}
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
              <div className="flex bg-slate-200/50 p-1 rounded-lg sm:rounded-xl shrink-0">
                <button 
                  onClick={() => setActiveTab("menu")} 
                  className={cn("px-4 py-1.5 sm:px-6 sm:py-2 text-xs sm:text-sm font-bold rounded-md sm:rounded-lg transition-colors", activeTab === "menu" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700")}
                >
                  القائمة
                </button>
                <button 
                  onClick={() => setActiveTab("history")} 
                  className={cn("px-4 py-1.5 sm:px-6 sm:py-2 text-xs sm:text-sm font-bold rounded-md sm:rounded-lg transition-colors", activeTab === "history" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700")}
                >
                  السجل
                </button>
              </div>
              <div className="relative flex-1">
                <Search size={14} className="sm:w-4 sm:h-4 absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input 
                  type="text"
                  placeholder="ابحث عن صنف..."
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className="w-full h-9 sm:h-10 bg-white border border-slate-200 rounded-lg sm:rounded-xl pr-9 sm:pr-10 pl-4 text-xs sm:text-sm focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-all"
                />
              </div>
            </div>

            {/* Menu View */}
            {activeTab === "menu" && (
              <div className="space-y-8">
                {/* Categories */}
                <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto no-scrollbar pb-2 -mx-3 px-3 sm:mx-0 sm:px-0">
                  <button 
                    onClick={() => setSelectedCategory("all")} 
                    className={cn("whitespace-nowrap px-3 py-1.5 sm:px-4 sm:py-2 rounded-lg sm:rounded-xl text-[11px] sm:text-xs font-bold transition-colors border", selectedCategory === "all" ? "bg-slate-800 border-slate-800 text-white" : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50")}
                  >الكل</button>
                  {Array.from(new Set(productsQuery.data?.map(p => p.category) || [])).map(cat => (
                    <button 
                      key={cat} 
                      onClick={() => setSelectedCategory(cat)} 
                      className={cn("whitespace-nowrap px-3 py-1.5 sm:px-4 sm:py-2 rounded-lg sm:rounded-xl text-[11px] sm:text-xs font-bold transition-colors border flex items-center gap-1.5 sm:gap-2", selectedCategory === cat ? "bg-slate-800 border-slate-800 text-white" : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50")}
                    >
                      {getCategoryIcon(cat)} {translateProductCategory(cat)}
                    </button>
                  ))}
                </div>

                {/* Products */}
                <div className="space-y-6 sm:space-y-8">
                  {Array.from(new Set(productsQuery.data?.map(p => p.category) || []))
                    .filter(cat => selectedCategory === "all" || selectedCategory === cat)
                    .map(category => {
                      const prods = productsQuery.data?.filter(p => 
                        p.category === category && p.name.toLowerCase().includes(searchTerm.toLowerCase())
                      );
                      if (!prods?.length) return null;
                      
                      return (
                        <div key={category} className="space-y-3 sm:space-y-4">
                          <h3 className="text-base sm:text-lg font-bold text-slate-800">{translateProductCategory(category)}</h3>
                          <div className="grid grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-4">
                            {prods.map(product => (
                              <div 
                                key={product.id} 
                                onClick={() => !cart[product.id] && addToCart(product.id)}
                                className={cn(
                                  "bg-white rounded-xl sm:rounded-2xl p-2 sm:p-3 border transition-all flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 group select-none",
                                  cart[product.id] ? "border-orange-500 shadow-sm" : "border-slate-200 hover:border-slate-300 cursor-pointer"
                                )}
                              >
                                <img src={getProductImage(product)} alt={product.name} className="h-24 sm:h-20 w-full sm:w-20 rounded-lg sm:rounded-xl object-cover border border-slate-100 shrink-0" />
                                <div className="flex-1 min-w-0 flex flex-col justify-between w-full h-full">
                                  <div>
                                    <h4 className="text-[13px] sm:text-sm font-bold text-slate-900 line-clamp-1">{product.name}</h4>
                                    <p className="text-[9px] sm:text-[10px] text-slate-500 line-clamp-1 sm:line-clamp-2 mt-0.5">{product.description || "بدون وصف"}</p>
                                  </div>
                                  <div className="flex items-center justify-between mt-2 pt-2 border-t sm:border-t-0 border-slate-50">
                                    <span className="text-xs sm:text-sm font-bold text-slate-800">{money(product.price)}</span>
                                    
                                    {cart[product.id] ? (
                                      <div className="flex items-center gap-2 sm:gap-3 bg-slate-50 rounded-lg px-1.5 sm:px-2 py-0.5 sm:py-1 border border-slate-200" onClick={e => e.stopPropagation()}>
                                        <button onClick={(e) => removeFromCart(product.id, e)} className="text-slate-500 hover:text-slate-800 p-0.5"><Minus size={12} className="sm:w-3.5 sm:h-3.5" /></button>
                                        <span className="text-[11px] sm:text-xs font-bold w-3 sm:w-4 text-center">{cart[product.id]}</span>
                                        <button onClick={(e) => addToCart(product.id, e)} className="text-slate-500 hover:text-slate-800 p-0.5"><Plus size={12} className="sm:w-3.5 sm:h-3.5" /></button>
                                      </div>
                                    ) : (
                                      <button className="h-6 w-6 sm:h-7 sm:w-7 rounded-md sm:rounded-lg bg-slate-100 flex items-center justify-center text-slate-600 group-hover:bg-slate-200 transition-colors">
                                        <Plus size={12} className="sm:w-3.5 sm:h-3.5" />
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
              <div className="space-y-4">
                {ordersQuery.data?.length === 0 ? (
                  <div className="py-12 text-center border border-dashed border-slate-200 rounded-2xl">
                    <History size={32} className="mx-auto text-slate-300 mb-3" />
                    <p className="text-sm text-slate-500">لا يوجد سجل طلبات سابق.</p>
                  </div>
                ) : (
                  ordersQuery.data?.slice().reverse().map(order => (
                    <div key={order.id} className="bg-white rounded-xl sm:rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-sm">
                      <div className="flex justify-between items-center mb-3 sm:mb-4 pb-3 sm:pb-4 border-b border-slate-100">
                        <div>
                          <p className="text-[10px] sm:text-xs text-slate-400 font-bold">{new Date(order.createdAt).toLocaleDateString('ar-EG', { hour: '2-digit', minute: '2-digit' })}</p>
                          <p className="text-xs sm:text-sm font-bold text-slate-800 mt-0.5">طلب #{order.id.slice(-4)}</p>
                        </div>
                        <div className="text-left">
                          <p className="text-base sm:text-lg font-bold text-slate-900">{money(order.totalAmount)}</p>
                          <span className="text-[9px] sm:text-[10px] text-slate-500">
                            {order.status === "completed" || order.status === "delivered" ? "مكتمل" : order.status === "cancelled" ? "ملغي" : "حالي"}
                          </span>
                        </div>
                      </div>
                      <div className="space-y-1.5 sm:space-y-2">
                        {order.items.map(item => (
                          <div key={item.id} className="flex justify-between text-[11px] sm:text-xs text-slate-600">
                            <span>{item.quantity} × {item.product.name}</span>
                            <span className="font-medium">{money(item.subtotal)}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>

          {/* Sidebar Cart (Desktop) */}
          <div className="hidden lg:block">
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 sticky top-24 max-h-[calc(100vh-8rem)] flex flex-col">
              <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                <ShoppingCart size={18} /> ملخص الطلب
              </h3>
              
              {cartItems.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center text-slate-400 py-12">
                  <ShoppingCart size={40} className="mb-4 opacity-50" />
                  <p className="text-sm">لم تقم باختيار أي أصناف بعد.</p>
                </div>
              ) : (
                <>
                  <ScrollArea className="flex-1 -mx-2 px-2">
                    <div className="space-y-3 pr-2">
                      {cartItems.map(item => (
                        <div key={item.id} className="flex items-start justify-between gap-3 text-sm">
                          <div className="flex-1">
                            <p className="font-bold text-slate-800 leading-tight">{item.product.name}</p>
                            <p className="text-[11px] text-slate-500 mt-1">{money(item.product.price)}</p>
                          </div>
                          <div className="flex flex-col items-end gap-2">
                            <span className="font-bold text-slate-900">{money(item.product.price * item.qty)}</span>
                            <div className="flex items-center gap-2 bg-slate-50 rounded-md px-1.5 border border-slate-200">
                              <button onClick={() => removeFromCart(item.id)} className="p-1 text-slate-500 hover:text-slate-800"><Minus size={12} /></button>
                              <span className="text-[10px] font-bold w-3 text-center">{item.qty}</span>
                              <button onClick={() => addToCart(item.id)} className="p-1 text-slate-500 hover:text-slate-800"><Plus size={12} /></button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                  <div className="pt-4 border-t border-slate-100 mt-4">
                    <div className="flex justify-between items-end mb-4">
                      <span className="text-sm text-slate-500 font-bold">الإجمالي</span>
                      <span className="text-xl font-bold text-slate-900">{money(grandTotal)}</span>
                    </div>
                    <Btn onClick={() => setIsReviewOpen(true)} className="w-full bg-orange-600 hover:bg-orange-700 text-white rounded-xl h-12 font-bold border-none">
                      مراجعة الطلب
                    </Btn>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* Mobile Cart Bar */}
      <AnimatePresence>
        {cartItems.length > 0 && (
          <motion.div 
            initial={{ y: 100 }} animate={{ y: 0 }} exit={{ y: 100 }} 
            className="lg:hidden fixed bottom-0 left-0 right-0 z-40 p-3 sm:p-4 bg-white border-t border-slate-200 shadow-[0_-4px_20px_rgba(0,0,0,0.05)]"
          >
            <div className="max-w-[1200px] mx-auto flex items-center justify-between gap-3 sm:gap-4">
              <div className="flex items-center gap-2.5 sm:gap-3">
                <div className="relative">
                  <div className="h-10 w-10 sm:h-12 sm:w-12 bg-orange-100 text-orange-600 rounded-lg sm:rounded-xl flex items-center justify-center">
                    <ShoppingCart size={18} className="sm:w-5 sm:h-5" />
                  </div>
                  <span className="absolute -top-1.5 -right-1.5 h-4 w-4 sm:h-5 sm:w-5 bg-slate-900 text-white rounded-full text-[9px] sm:text-[10px] font-bold flex items-center justify-center border-2 border-white">
                    {cartItems.length}
                  </span>
                </div>
                <div>
                  <p className="text-[9px] sm:text-[10px] text-slate-500 font-bold">الإجمالي</p>
                  <p className="text-sm sm:text-base font-bold text-slate-900 leading-none mt-0.5">{money(grandTotal)}</p>
                </div>
              </div>
              <Btn onClick={() => setIsCartOpen(true)} className="bg-slate-900 hover:bg-slate-800 text-white px-4 sm:px-6 h-10 sm:h-12 rounded-lg sm:rounded-xl font-bold border-none text-xs sm:text-sm">
                عرض السلة
              </Btn>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Mobile Cart Sheet */}
      <Sheet open={isCartOpen} onOpenChange={setIsCartOpen}>
        <div className="flex flex-col h-full bg-white">
          <div className="w-12 h-1.5 bg-slate-200 rounded-full mx-auto my-3" />
          <div className="px-6 pb-2 border-b border-slate-100 flex justify-between items-center">
            <h2 className="text-lg font-bold text-slate-900">سلة المشتريات</h2>
            <button onClick={() => setIsCartOpen(false)} className="p-2 text-slate-400 hover:bg-slate-100 rounded-full"><X size={20} /></button>
          </div>
          <ScrollArea className="flex-1 p-6">
            <div className="space-y-4">
              {cartItems.map(item => (
                <div key={item.id} className="flex gap-4">
                  <img src={getProductImage(item.product)} className="h-16 w-16 rounded-xl object-cover border border-slate-100" />
                  <div className="flex-1 flex flex-col justify-between">
                    <div className="flex justify-between items-start">
                      <p className="text-sm font-bold text-slate-900">{item.product.name}</p>
                      <p className="text-sm font-bold text-slate-900">{money(item.product.price * item.qty)}</p>
                    </div>
                    <div className="flex justify-between items-center">
                      <p className="text-[11px] text-slate-500">{money(item.product.price)} للقطعة</p>
                      <div className="flex items-center gap-3 bg-slate-50 rounded-lg px-2 border border-slate-200">
                        <button onClick={() => removeFromCart(item.id)} className="p-1.5 text-slate-500"><Minus size={14} /></button>
                        <span className="text-xs font-bold w-4 text-center">{item.qty}</span>
                        <button onClick={() => addToCart(item.id)} className="p-1.5 text-slate-500"><Plus size={14} /></button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
          <div className="p-6 border-t border-slate-100 bg-slate-50">
            <div className="flex justify-between items-end mb-4">
              <span className="text-sm font-bold text-slate-500">الإجمالي النهائي</span>
              <span className="text-2xl font-bold text-slate-900">{money(grandTotal)}</span>
            </div>
            <Btn onClick={() => { setIsCartOpen(false); setIsReviewOpen(true); }} className="w-full h-12 bg-orange-600 hover:bg-orange-700 text-white rounded-xl font-bold border-none text-base">
              مراجعة الطلب
            </Btn>
          </div>
        </div>
      </Sheet>

      {/* Mandatory Review Modal */}
      <Modal isOpen={isReviewOpen} onClose={() => setIsReviewOpen(false)} title="مراجعة الطلب" size="md">
        <div className="p-1">
          <div className="bg-slate-50 rounded-xl p-4 border border-slate-100 mb-4">
            <div className="space-y-3 max-h-[40vh] overflow-y-auto pr-2 custom-scrollbar">
              {cartItems.map(item => (
                <div key={item.id} className="flex justify-between items-center text-sm">
                  <div className="flex items-center gap-2 text-slate-700">
                    <span className="font-bold text-slate-900 bg-white border border-slate-200 h-6 w-6 rounded flex items-center justify-center text-[11px]">{item.qty}</span>
                    <span>{item.product.name}</span>
                  </div>
                  <span className="font-bold text-slate-900">{money(item.product.price * item.qty)}</span>
                </div>
              ))}
            </div>
            <div className="border-t border-slate-200 mt-4 pt-3 flex justify-between items-center">
              <span className="text-sm font-bold text-slate-500">الإجمالي</span>
              <span className="text-xl font-bold text-slate-900">{money(grandTotal)}</span>
            </div>
          </div>
          
          <div className="mb-6">
            <label className="block text-xs font-bold text-slate-500 mb-1.5">ملاحظات للباريستا (اختياري)</label>
            <textarea 
              value={orderNotes}
              onChange={e => setOrderNotes(e.target.value)}
              placeholder="مثال: بدون سكر، حليب خالي الدسم..."
              className="w-full h-20 rounded-xl border border-slate-200 p-3 text-sm focus:border-orange-500 focus:ring-1 focus:ring-orange-500 outline-none resize-none bg-white"
            />
          </div>

          <div className="flex gap-3">
            <Btn 
              onClick={() => setIsReviewOpen(false)} 
              variant="secondary"
              className="flex-1 bg-slate-100 text-slate-700 border-none hover:bg-slate-200 rounded-xl h-12 font-bold"
            >
              تعديل الطلب
            </Btn>
            <Btn 
              onClick={() => createOrderMutation.mutate(cartItems.map(i => ({ productId: i.id, quantity: i.qty })))} 
              loading={createOrderMutation.isPending}
              className="flex-[2] bg-orange-600 hover:bg-orange-700 text-white border-none rounded-xl h-12 font-bold flex items-center justify-center gap-2"
            >
              <Send size={16} className="rotate-180" /> إرسال للباريستا
            </Btn>
          </div>
        </div>
      </Modal>

      {/* Floating Chat */}
      <button 
        onClick={() => setIsChatOpen(!isChatOpen)} 
        className="fixed bottom-24 lg:bottom-8 right-4 lg:right-8 z-30 h-12 w-12 bg-slate-900 shadow-lg shadow-slate-900/20 rounded-full flex items-center justify-center text-white hover:scale-105 transition-transform"
      >
        <MessageCircle size={20} />
      </button>

      {/* Chat Box */}
      <AnimatePresence>
        {isChatOpen && (
          <motion.div 
            initial={{ opacity: 0, y: 10, scale: 0.95 }} 
            animate={{ opacity: 1, y: 0, scale: 1 }} 
            exit={{ opacity: 0, y: 10, scale: 0.95 }} 
            className="fixed bottom-40 lg:bottom-24 right-4 lg:right-8 z-50 w-80 bg-white rounded-2xl shadow-[0_10px_40px_-10px_rgba(0,0,0,0.15)] border border-slate-200 overflow-hidden"
          >
            <div className="bg-slate-900 p-4 text-white flex justify-between items-center">
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-sm font-bold">تواصل معنا</span>
              </div>
              <button onClick={() => setIsChatOpen(false)} className="text-slate-400 hover:text-white transition-colors">
                <X size={16} />
              </button>
            </div>
            <ScrollArea className="h-64 p-4 bg-slate-50 space-y-3">
              {chatMessages.map((msg, i) => (
                <div key={i} className={cn("flex", msg.sender === "GUEST" ? "justify-end" : "justify-start")}>
                  <div className={cn("max-w-[85%] p-2.5 rounded-xl text-xs shadow-sm", msg.sender === "GUEST" ? "bg-orange-600 text-white rounded-tl-none" : "bg-white border border-slate-200 text-slate-800 rounded-tr-none")}>
                    {msg.text}
                  </div>
                </div>
              ))}
              {chatMessages.length === 0 && <p className="text-center text-xs text-slate-400 py-10">اكتب رسالتك وسنرد عليك فوراً</p>}
            </ScrollArea>
            <div className="p-3 bg-white border-t border-slate-100 flex gap-2">
              <Input 
                value={chatInput} 
                onChange={(e: any) => setChatInput(e.target.value)} 
                placeholder="رسالتك..." 
                className="h-10 text-xs rounded-lg border-slate-200 flex-1 bg-slate-50 focus:bg-white" 
                onKeyDown={e => e.key === 'Enter' && chatInput && socket && (() => { socket.emit("guest_message", { tableCode: guestCode, text: chatInput }); setChatInput(""); })()}
              />
              <button 
                onClick={() => { if (chatInput && socket) { socket.emit("guest_message", { tableCode: guestCode, text: chatInput }); setChatInput(""); } }} 
                className="h-10 w-10 bg-slate-900 text-white rounded-lg flex items-center justify-center hover:bg-slate-800 transition-colors shrink-0"
              >
                <Send size={14} className="rotate-180" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Toast */}
      <AnimatePresence>
        {message && (
          <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="fixed top-20 left-0 right-0 z-[100] flex justify-center pointer-events-none px-4">
            <div className={cn("px-4 py-3 rounded-xl shadow-lg flex items-center gap-3 border", message.ok ? "bg-emerald-50 border-emerald-200 text-emerald-800" : "bg-red-50 border-red-200 text-red-800")}>
              {message.ok ? <CheckCircle2 size={18} className="text-emerald-500" /> : <Info size={18} className="text-red-500" />}
              <p className="text-sm font-bold">{message.text}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
