"use client";

import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { 
  Coffee, ShoppingCart, CheckCircle2, 
  ChevronRight, ArrowLeft, RefreshCw,
  Search, Plus, Minus, Send, Key, Timer, ChefHat, PackageCheck, History, Wallet,
  LayoutGrid, ReceiptText, Sparkles, Bell, X, Trash2, Info, Flame, IceCream, Pizza, Utensils
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { api } from "../../lib/api";
import { money } from "../../lib/format";
import { translateProductCategory } from "../../lib/labels";
import { 
  Badge, Btn, FormField, Panel, Spinner
} from "../../components/ui";
import { useBarOrderSocket } from "../../lib/useBarOrderSocket";
import clsx from "clsx";

interface Product {
  id: string;
  name: string;
  price: number;
  category: string;
  description?: string;
}

interface OrderItem {
  id: string;
  quantity: number;
  subtotal: number;
  product: { name: string };
}

interface Order {
  id: string;
  status: string;
  totalAmount: number;
  createdAt: string;
  items: OrderItem[];
}

export default function GuestOrderPage() {
  const [guestCode, setGuestCode] = useState("");
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [activeTab, setActiveTab] = useState<"menu" | "history">("menu");
  const [cart, setCart] = useState<Record<string, number>>({});
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [message, setMessage] = useState<{ text: string; ok: boolean } | null>(null);

  // Chat State
  const [chatMessages, setChatMessages] = useState<any[]>([]);
  const [chatOpen, setChatOpen] = useState(false);
  const [chatInput, setChatInput] = useState("");
  const [unreadCount, setUnreadCount] = useState(0);
  const chatScrollRef = useRef<HTMLDivElement>(null);
  const chatAudioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    chatAudioRef.current = new Audio('https://assets.mixkit.co/active_storage/sfx/2357/2357-preview.mp3');
  }, []);

  // Persistence of guest code
  useEffect(() => {
    const saved = localStorage.getItem("eduvers_guest_code");
    if (saved) setGuestCode(saved);
  }, []);

  // Fetch products
  const productsQuery = useQuery({
    queryKey: ["public-products"],
    queryFn: async () => {
      const r = await api.get("/public/orders/products");
      return r.data.data as Product[];
    },
    enabled: isAuthorized,
  });

  // Status tracking query
  const statusQuery = useQuery({
    queryKey: ["order-status", guestCode],
    queryFn: async () => {
      const r = await api.get(`/public/orders/status/${guestCode}`);
      return r.data.data as Order[];
    },
    enabled: isAuthorized && !!guestCode,
    refetchInterval: 5000, // Fallback; WebSocket handles real-time
  });

  // Real-time WebSocket — guest sees status changes instantly
  const { sendMessage } = useBarOrderSocket({
    onStatusUpdate: () => {
      if (isAuthorized && guestCode) statusQuery.refetch();
    },
    onDashboardRefresh: () => {
      if (isAuthorized && guestCode) statusQuery.refetch();
    },
    onChatMessage: (msg) => {
      console.log("[Socket.IO] 💬 Guest received chat message:", msg);
      if (msg.orderId === guestCode) {
        setChatMessages(prev => [...prev, msg]);
        if (!chatOpen) {
          setUnreadCount(c => c + 1);
          chatAudioRef.current?.play().catch(() => {});
        }
      }
    }
  });

  useEffect(() => {
    if (chatOpen) {
      setUnreadCount(0);
      setTimeout(() => chatScrollRef.current?.scrollTo({ top: chatScrollRef.current.scrollHeight, behavior: 'smooth' }), 100);
    }
  }, [chatOpen, chatMessages]);

  const handleSendChat = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!chatInput.trim()) return;
    console.log("[Chat] Sending message from guest:", chatInput);
    sendMessage(guestCode, "العميل", chatInput);
    setChatInput("");
  };

  const orderMutation = useMutation({
    mutationFn: (items: any[]) => api.post("/public/orders", { guestCode, items }),
    onSuccess: () => {
      setCart({});
      setIsCartOpen(false);
      setMessage({ text: "تم إرسال طلبك بنجاح!", ok: true });
      statusQuery.refetch();
      window.scrollTo({ top: 0, behavior: 'smooth' });
      setTimeout(() => setMessage(null), 5000);
    },
    onError: (err: any) => {
      setMessage({ text: err.response?.data?.message || "فشل إرسال الطلب.", ok: false });
    }
  });

  const activeOrders = statusQuery.data?.filter(o => o.status !== 'delivered' && o.status !== 'cancelled') || [];
  const grandTotal = statusQuery.data?.reduce((sum, o) => sum + Number(o.totalAmount || 0), 0) || 0;

  const addToCart = (productId: string) => {
    setCart(prev => ({ ...prev, [productId]: (prev[productId] || 0) + 1 }));
  };

  const removeFromCart = (productId: string) => {
    setCart(prev => {
      const next = { ...prev };
      if (next[productId] > 1) next[productId]--;
      else delete next[productId];
      return next;
    });
  };

  const deleteFromCart = (productId: string) => {
    setCart(prev => {
      const next = { ...prev };
      delete next[productId];
      return next;
    });
  };

  const cartItems = Object.entries(cart).map(([id, qty]) => {
    const product = productsQuery.data?.find(p => p.id === id);
    return { id, qty, product };
  }).filter(item => item.product);

  const currentCartTotal = cartItems.reduce((sum, item) => sum + (Number(item.product?.price || 0) * item.qty), 0);

  const getStatusInfo = (status: string) => {
    switch(status) {
      case 'new': return { label: 'تم الاستلام', icon: <Timer size={18} />, color: 'bg-blue-500', light: 'bg-blue-50', text: 'text-blue-700', step: 1 };
      case 'in_preparation': return { label: 'يتم التحضير', icon: <ChefHat size={18} />, color: 'bg-orange-500', light: 'bg-orange-50', text: 'text-orange-700', step: 2 };
      case 'ready': return { label: 'جاهز الآن', icon: <PackageCheck size={18} />, color: 'bg-emerald-500', light: 'bg-emerald-50', text: 'text-emerald-700', step: 3 };
      case 'delivered': return { label: 'تم التسليم', icon: <CheckCircle2 size={18} />, color: 'bg-slate-500', light: 'bg-slate-50', text: 'text-slate-700', step: 4 };
      default: return { label: 'ملغي', icon: <History size={18} />, color: 'bg-rose-500', light: 'bg-rose-50', text: 'text-rose-700', step: 0 };
    }
  };

  const getCategoryIcon = (category: string) => {
    const c = category.toLowerCase();
    if (c.includes('coffee') || c.includes('مشروبات ساخنة')) return <Coffee size={18} />;
    if (c.includes('cold') || c.includes('مشروبات باردة')) return <IceCream size={18} />;
    if (c.includes('food') || c.includes('طعام')) return <Pizza size={18} />;
    if (c.includes('snack') || c.includes('سناك')) return <Flame size={18} />;
    return <Utensils size={18} />;
  };

  const getProductImage = (name: string, category: string) => {
    const n = name.toLowerCase();
    const c = category.toLowerCase();
    // Specific product keyword → Unsplash photo ID mapping
    const imageMap: [string[], string][] = [
      // Coffee
      [['espresso', 'اسبرسو', 'إسبريسو'], 'photo-1510707577719-ae7c14805e3a'],
      [['latte', 'لاتيه', 'لاتية'], 'photo-1534778101976-62847782c213'],
      [['cappuccino', 'كابتشينو'], 'photo-1572442388796-11668a67e53d'],
      [['americano', 'أمريكانو', 'امريكانو'], 'photo-1551030173-122aabc4489c'],
      [['mocha', 'موكا'], 'photo-1578314675249-a6910f80cc4e'],
      [['macchiato', 'ماكياتو'], 'photo-1485808191679-5f86510681a2'],
      [['turkish', 'تركي', 'قهوة تركي'], 'photo-1514432324607-a09d9b4aefda'],
      [['filter', 'فلتر', 'v60'], 'photo-1495474472287-4d71bcdd2085'],
      [['flat white', 'فلات وايت'], 'photo-1577968897966-3d4325b36b61'],
      // Tea
      [['tea', 'شاي', 'چاي'], 'photo-1556679343-c7306c1976bc'],
      [['green tea', 'شاي اخضر', 'شاي أخضر', 'ماتشا', 'matcha'], 'photo-1515823064-d6e0c04616a7'],
      [['herbal', 'أعشاب', 'اعشاب', 'يانسون', 'نعناع'], 'photo-1597318181409-cf64d0b5d8a2'],
      // Cold drinks
      [['iced coffee', 'آيس', 'ايس كوفي', 'بارد', 'cold brew'], 'photo-1461023058943-07fcbe16d735'],
      [['smoothie', 'سموذي'], 'photo-1638176066666-ffb2f013c7dd'],
      [['juice', 'عصير', 'عصائر'], 'photo-1600271886742-f049cd451bba'],
      [['milkshake', 'ميلك شيك', 'شيك'], 'photo-1572490122747-3968b75cc699'],
      [['mojito', 'موهيتو'], 'photo-1536935338788-846bb9981813'],
      [['lemonade', 'ليمون'], 'photo-1621263764928-df1444c5e859'],
      // Food
      [['croissant', 'كرواسون', 'كرواسان'], 'photo-1555507036-ab1f4038024a'],
      [['sandwich', 'ساندويتش', 'ساندوتش'], 'photo-1528735602780-2552fd46c7af'],
      [['cake', 'كيك', 'كيكة', 'تشيز'], 'photo-1578985545062-69928b1d9587'],
      [['cookie', 'كوكيز', 'بسكويت'], 'photo-1499636136210-6f4ee915583e'],
      [['waffle', 'وافل'], 'photo-1562376552-0d160a2f238d'],
      [['pancake', 'بان كيك', 'بانكيك'], 'photo-1567620905732-2d1ec7ab7445'],
      [['muffin', 'مافن'], 'photo-1607958996333-41aef7caefaa'],
      [['brownie', 'براوني'], 'photo-1606313564200-e75d5e30476c'],
      [['donut', 'دونات'], 'photo-1551024601-bec78aea704b'],
      // Snacks
      [['chips', 'شيبس', 'بطاطس'], 'photo-1621447504864-d8686e12698c'],
      [['nuts', 'مكسرات'], 'photo-1599599810694-b5b37304c041'],
      [['popcorn', 'فشار'], 'photo-1585735684041-78e6f11b7668'],
      [['chocolate', 'شوكولاتة', 'شوكولا'], 'photo-1511381939415-e44015466834'],
    ];

    for (const [keywords, photoId] of imageMap) {
      if (keywords.some(k => n.includes(k))) {
        return `https://images.unsplash.com/${photoId}?w=200&h=200&fit=crop&auto=format&q=80`;
      }
    }

    // Category-level fallbacks
    const categoryFallback: Record<string, string> = {
      coffee: 'photo-1509042239860-f550ce710b93',
      tea: 'photo-1556679343-c7306c1976bc',
      juice: 'photo-1600271886742-f049cd451bba',
      cold: 'photo-1461023058943-07fcbe16d735',
      snack: 'photo-1621447504864-d8686e12698c',
      dessert: 'photo-1578985545062-69928b1d9587',
      sandwich: 'photo-1528735602780-2552fd46c7af',
      food: 'photo-1567620905732-2d1ec7ab7445',
    };

    for (const [key, photoId] of Object.entries(categoryFallback)) {
      if (c.includes(key)) {
        return `https://images.unsplash.com/${photoId}?w=200&h=200&fit=crop&auto=format&q=80`;
      }
    }

    // Ultimate fallback
    return `https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=200&h=200&fit=crop&auto=format&q=80`;
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if(guestCode.length >= 4) {
      localStorage.setItem("eduvers_guest_code", guestCode);
      setIsAuthorized(true);
    }
  };

  if (!isAuthorized) {
    return (
      <div className="min-h-screen bg-[#020617] overflow-hidden flex items-center justify-center p-6 relative" dir="rtl">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-blue-600/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-emerald-600/10 rounded-full blur-[120px]" />
        
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md z-10">
          <div className="flex flex-col items-center gap-6 mb-12">
            <motion.div whileHover={{ rotate: 10 }} className="h-24 w-24 rounded-3xl bg-white text-[#020617] flex items-center justify-center shadow-2xl">
              <Coffee size={48} strokeWidth={1.5} />
            </motion.div>
            <div className="text-center">
              <h1 className="text-4xl font-black text-white tracking-tighter">EDUVERS</h1>
              <p className="text-slate-400 font-medium mt-2">نظام طلبات الضيوف الذكي</p>
            </div>
          </div>

          <div className="bg-white/5 backdrop-blur-3xl rounded-[2.5rem] border border-white/10 p-8 shadow-2xl">
            <form onSubmit={handleLogin} className="space-y-8">
              <div className="space-y-4">
                <label className="text-sm font-bold text-slate-300 block text-center uppercase tracking-widest">أدخل كود الطاولة أو الضيف</label>
                <input 
                  type="text" value={guestCode} onChange={e => setGuestCode(e.target.value)}
                  className="w-full rounded-2xl border-2 border-white/5 bg-white/5 py-5 text-center text-3xl font-black text-white tracking-[0.3em] outline-none transition focus:border-blue-500/50 focus:bg-white/10"
                  placeholder="0000" required
                />
              </div>
              <button type="submit" className="w-full py-5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-2xl font-black text-lg shadow-xl hover:scale-[1.02] active:scale-[0.98] transition">دخول</button>
            </form>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8fafc] pb-32" dir="rtl">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-2xl border-b border-slate-200/60 px-4 pt-4 pb-2">
        <div className="mx-auto max-w-2xl flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => setIsAuthorized(false)} className="h-10 w-10 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-500">
              <ArrowLeft size={18} className="rotate-180" />
            </button>
            <div>
              <h2 className="font-black text-slate-900 text-base">Eduvers Bar</h2>
              <div className="flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-[10px] font-bold text-slate-400">طاولة {guestCode}</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
             <div className="text-left bg-slate-50 rounded-xl px-3 py-1.5 border border-slate-200/50">
                <p className="text-[9px] text-slate-400 font-bold uppercase">الإجمالي</p>
                <p className="text-sm font-black text-slate-900 leading-none">{money(grandTotal)}</p>
             </div>
             <div className="h-10 w-10 rounded-xl bg-slate-900 text-white flex items-center justify-center shadow-lg"><Wallet size={18} /></div>
          </div>
        </div>
        
        {/* Animated Tabs */}
        <div className="mx-auto max-w-2xl mt-4 relative flex p-1 bg-slate-100 rounded-2xl border border-slate-200/50">
          <motion.div className="absolute top-1 bottom-1 bg-white rounded-xl shadow-sm z-0" animate={{ x: activeTab === "menu" ? "0%" : "-100%" }} style={{ width: "calc(50% - 4px)" }} />
          <button onClick={() => setActiveTab("menu")} className={clsx("relative z-10 flex-1 py-2 text-xs font-bold flex items-center justify-center gap-2 transition-colors", activeTab === "menu" ? "text-slate-900" : "text-slate-400")}><LayoutGrid size={14} /> القائمة</button>
          <button onClick={() => setActiveTab("history")} className={clsx("relative z-10 flex-1 py-2 text-xs font-bold flex items-center justify-center gap-2 transition-colors", activeTab === "history" ? "text-slate-900" : "text-slate-400")}><ReceiptText size={14} /> طلباتي</button>
        </div>
      </header>

      <main className="mx-auto max-w-2xl px-4 py-6">
        <AnimatePresence mode="wait">
          {activeTab === "menu" ? (
            <motion.div key="menu" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-8">
              {message && (
                <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className={clsx("rounded-2xl p-4 flex items-center gap-3 border shadow-lg", message.ok ? "bg-emerald-50 border-emerald-100 text-emerald-800" : "bg-rose-50 border-rose-100 text-rose-800")}>
                  {message.ok ? <CheckCircle2 size={18} /> : <Bell size={18} />}
                  <p className="text-xs font-bold">{message.text}</p>
                </motion.div>
              )}

              {/* Active Orders Tracker */}
              {activeOrders.length > 0 && (
                <div className="space-y-3">
                  <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">حالة الطلبات الحالية</h3>
                  {activeOrders.map((order) => {
                    const info = getStatusInfo(order.status);
                    const steps = [
                      { key: 'new', label: 'تم الاستلام', icon: <Timer size={16} /> },
                      { key: 'in_preparation', label: 'التحضير', icon: <ChefHat size={16} /> },
                      { key: 'ready', label: 'جاهز', icon: <PackageCheck size={16} /> },
                      { key: 'delivered', label: 'تم التسليم', icon: <CheckCircle2 size={16} /> },
                    ];
                    return (
                      <div key={order.id} className="bg-white rounded-[2rem] p-5 border border-slate-200/60 shadow-sm relative overflow-hidden">
                        {/* Top header */}
                        <div className="flex items-center justify-between mb-6">
                          <div className="flex items-center gap-3">
                            <motion.div 
                              animate={{ scale: [1, 1.08, 1] }}
                              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                              className={clsx("h-10 w-10 rounded-2xl flex items-center justify-center text-white shadow-lg", info.color)}
                            >
                              {info.icon}
                            </motion.div>
                            <div>
                              <h4 className={clsx("text-xs font-black", info.text)}>{info.label}</h4>
                              <p className="text-[10px] font-bold text-slate-300">#{order.id.slice(0, 6)}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-1.5 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-100">
                            <Timer size={12} className="text-slate-400" />
                            <span className="text-[10px] font-black text-slate-600">{new Date(order.createdAt).toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })}</span>
                          </div>
                        </div>
                        
                        {/* Premium Progress Stepper */}
                        <div className="flex items-start justify-between relative px-2">
                          {steps.map((step, i) => {
                            const stepNum = i + 1;
                            const isCompleted = info.step > stepNum;
                            const isCurrent = info.step === stepNum;
                            const isUpcoming = info.step < stepNum;
                            return (
                              <div key={step.key} className="flex flex-col items-center relative" style={{ flex: 1 }}>
                                {/* Connector line (between steps, not before the first) */}
                                {i > 0 && (
                                  <div className="absolute top-[18px] right-[50%] h-[3px] rounded-full overflow-hidden" style={{ width: '100%' }}>
                                    <div className="w-full h-full bg-slate-100" />
                                    {(isCompleted || isCurrent) && (
                                      <motion.div
                                        className="absolute top-0 right-0 h-full bg-gradient-to-l from-blue-500 via-indigo-500 to-emerald-500"
                                        initial={{ width: '0%' }}
                                        animate={{ width: '100%' }}
                                        transition={{ duration: 0.6, delay: i * 0.15, ease: "easeOut" }}
                                      />
                                    )}
                                  </div>
                                )}
                                {/* Step circle */}
                                <div className="relative">
                                  {isCurrent && (
                                    <motion.div
                                      className={clsx("absolute -inset-1.5 rounded-full opacity-30", info.color)}
                                      animate={{ scale: [1, 1.4, 1], opacity: [0.3, 0.08, 0.3] }}
                                      transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                                    />
                                  )}
                                  <motion.div
                                    initial={false}
                                    animate={{
                                      scale: isCurrent ? 1.15 : 1,
                                    }}
                                    className={clsx(
                                      "h-9 w-9 rounded-full flex items-center justify-center relative z-10 transition-all duration-500 border-[3px]",
                                      isCompleted && "bg-emerald-500 border-emerald-200 text-white shadow-md shadow-emerald-200/50",
                                      isCurrent && clsx(info.color, "border-white text-white shadow-lg ring-2 ring-offset-1", info.color === 'bg-blue-500' ? 'ring-blue-200' : info.color === 'bg-orange-500' ? 'ring-orange-200' : 'ring-emerald-200'),
                                      isUpcoming && "bg-white border-slate-200 text-slate-300"
                                    )}
                                  >
                                    {isCompleted ? <CheckCircle2 size={16} strokeWidth={2.5} /> : step.icon}
                                  </motion.div>
                                </div>
                                {/* Label */}
                                <p className={clsx(
                                  "text-[9px] font-bold mt-2 text-center leading-tight",
                                  isCompleted && "text-emerald-600",
                                  isCurrent && info.text,
                                  isUpcoming && "text-slate-300"
                                )}>
                                  {step.label}
                                </p>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Menu */}
              <div className="space-y-6">
                <div className="relative group">
                  <Search size={18} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                  <input type="text" placeholder="ابحث في القائمة..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="w-full rounded-2xl border border-slate-200 bg-white py-4 pr-12 pl-4 text-xs font-bold outline-none shadow-sm focus:ring-4 focus:ring-blue-500/5 focus:border-blue-500/30" />
                </div>

                {productsQuery.isLoading ? (
                  <div className="py-20 flex flex-col items-center gap-3"><Spinner size={24} /> <p className="text-[10px] font-bold text-slate-400">جاري التحميل...</p></div>
                ) : (
                  <div className="space-y-10">
                    {Array.from(new Set(productsQuery.data?.map(p => p.category))).map(category => {
                      const prods = productsQuery.data?.filter(p => p.category === category && p.name.toLowerCase().includes(searchTerm.toLowerCase()));
                      if (!prods?.length) return null;
                      return (
                        <div key={category} className="space-y-4">
                          <div className="flex items-center gap-2 px-1">
                            <div className="h-8 w-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">{getCategoryIcon(category)}</div>
                            <h3 className="text-sm font-black text-slate-900">{translateProductCategory(category)}</h3>
                            <div className="h-px flex-1 bg-gradient-to-l from-slate-200 to-transparent ml-4" />
                          </div>
                          <div className="grid grid-cols-1 gap-3">
                            {prods.map(product => (
                              <div key={product.id} className="group bg-white rounded-3xl border border-slate-100 p-3 flex items-center justify-between shadow-sm hover:shadow-md hover:border-blue-100 transition-all duration-300">
                                <div className="flex items-center gap-4 flex-1">
                                  {/* Product Image */}
                                  <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-2xl bg-slate-50 border border-slate-100">
                                    <img 
                                      src={getProductImage(product.name, product.category)} 
                                      alt={product.name}
                                      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                                      loading="lazy"
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                                  </div>

                                  <div>
                                    <h4 className="text-[13px] font-black text-slate-800 group-hover:text-blue-600 transition-colors">{product.name}</h4>
                                    <div className="flex items-center gap-2 mt-1">
                                      <span className="text-xs font-black text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-lg">{money(product.price)}</span>
                                      {product.description && <p className="text-[10px] text-slate-400 font-medium truncate max-w-[120px]">{product.description}</p>}
                                    </div>
                                  </div>
                                </div>

                                <div className="flex items-center gap-2">
                                  {cart[product.id] ? (
                                    <div className="flex items-center gap-2 bg-slate-900 text-white rounded-2xl p-1.5 shadow-lg shadow-slate-900/20">
                                      <button 
                                        onClick={() => removeFromCart(product.id)} 
                                        className="h-8 w-8 rounded-xl hover:bg-white/10 flex items-center justify-center transition-colors"
                                      >
                                        <Minus size={14} />
                                      </button>
                                      <span className="text-sm font-black w-5 text-center">{cart[product.id]}</span>
                                      <button 
                                        onClick={() => addToCart(product.id)} 
                                        className="h-8 w-8 rounded-xl hover:bg-white/10 flex items-center justify-center transition-colors"
                                      >
                                        <Plus size={14} />
                                      </button>
                                    </div>
                                  ) : (
                                    <button 
                                      onClick={() => addToCart(product.id)} 
                                      className="h-12 w-12 rounded-2xl bg-slate-50 text-slate-400 hover:bg-blue-600 hover:text-white hover:shadow-lg hover:shadow-blue-600/30 transition-all duration-300 flex items-center justify-center border border-slate-100"
                                    >
                                      <Plus size={20} />
                                    </button>
                                  )}
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
            </motion.div>
          ) : (
            <motion.div key="history" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} className="space-y-8">
               {/* Premium Balance Card */}
               <div className="relative">
                 <div className="absolute -inset-0.5 bg-gradient-to-br from-blue-500 via-indigo-500 to-emerald-500 rounded-[2.75rem] opacity-20 blur-sm" />
                 <div className="relative bg-slate-900 rounded-[2.5rem] p-7 text-white shadow-2xl overflow-hidden">
                   <div className="absolute top-[-30%] left-[-20%] w-72 h-72 bg-blue-500/15 rounded-full blur-[100px]" />
                   <div className="absolute bottom-[-30%] right-[-20%] w-72 h-72 bg-emerald-500/10 rounded-full blur-[100px]" />
                   <div className="relative z-10">
                     <div className="flex items-center justify-between mb-5">
                       <div className="flex items-center gap-3">
                         <motion.div 
                           animate={{ rotate: [0, 5, -5, 0] }}
                           transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                           className="h-12 w-12 rounded-2xl bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center shadow-lg shadow-emerald-500/30"
                         >
                           <Wallet size={22} />
                         </motion.div>
                         <div>
                           <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">إجمالي الحساب</h3>
                           <p className="text-xs text-slate-500">المستحق عند المغادرة</p>
                         </div>
                       </div>
                       <div className="text-left">
                         <motion.p 
                           key={grandTotal}
                           initial={{ scale: 1.1, opacity: 0 }}
                           animate={{ scale: 1, opacity: 1 }}
                           className="text-3xl font-black tracking-tight"
                         >
                           {money(grandTotal)}
                         </motion.p>
                       </div>
                     </div>
                     <div className="flex items-center gap-2.5 p-3 bg-white/5 rounded-2xl border border-white/5">
                       <div className="h-7 w-7 rounded-lg bg-blue-500/20 flex items-center justify-center shrink-0">
                         <Info size={12} className="text-blue-400" />
                       </div>
                       <p className="text-[10px] text-slate-400 font-medium leading-relaxed">يرجى سداد المبلغ عند الكاشير قبل مغادرة المكان.</p>
                     </div>
                   </div>
                 </div>
               </div>

               {/* Orders */}
               {(() => {
                 const sortNewest = (a: Order, b: Order) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
                 const active = (statusQuery.data?.filter(o => o.status !== 'delivered' && o.status !== 'cancelled') || []).sort(sortNewest);
                 const completed = (statusQuery.data?.filter(o => o.status === 'delivered' || o.status === 'cancelled') || []).sort(sortNewest);
                 const allOrders = statusQuery.data || [];

                 const timeAgo = (date: string) => {
                   const mins = Math.floor((Date.now() - new Date(date).getTime()) / 60000);
                   if (mins < 1) return 'الآن';
                   if (mins < 60) return `منذ ${mins} د`;
                   const hrs = Math.floor(mins / 60);
                   if (hrs < 24) return `منذ ${hrs} ساعة`;
                   return `منذ ${Math.floor(hrs / 24)} يوم`;
                 };

                 return (
                   <>
                     {/* Quick Stats Row */}
                     {allOrders.length > 0 && (
                       <div className="grid grid-cols-3 gap-3">
                         <div className="bg-white rounded-2xl border border-blue-100 p-3 text-center">
                           <p className="text-lg font-black text-blue-600">{active.length}</p>
                           <p className="text-[9px] font-bold text-slate-400 mt-0.5">جارية</p>
                         </div>
                         <div className="bg-white rounded-2xl border border-emerald-100 p-3 text-center">
                           <p className="text-lg font-black text-emerald-600">{completed.filter(o => o.status === 'delivered').length}</p>
                           <p className="text-[9px] font-bold text-slate-400 mt-0.5">مكتملة</p>
                         </div>
                         <div className="bg-white rounded-2xl border border-slate-100 p-3 text-center">
                           <p className="text-lg font-black text-slate-800">{allOrders.length}</p>
                           <p className="text-[9px] font-bold text-slate-400 mt-0.5">الكل</p>
                         </div>
                       </div>
                     )}

                     {/* Active Orders */}
                     {active.length > 0 && (
                       <div className="space-y-4">
                         <div className="flex items-center gap-2 px-1">
                           <div className="h-6 w-6 rounded-lg bg-amber-100 flex items-center justify-center"><Sparkles size={12} className="text-amber-600" /></div>
                           <h3 className="text-xs font-black text-slate-700">طلبات جارية</h3>
                           <span className="text-[9px] font-bold bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">{active.length}</span>
                           <div className="h-px flex-1 bg-gradient-to-l from-amber-200 to-transparent" />
                         </div>
                         {active.map((order, i) => {
                           const info = getStatusInfo(order.status);
                           const steps = [
                             { key: 'new', label: 'استلام', icon: <Timer size={10} /> },
                             { key: 'in_preparation', label: 'تحضير', icon: <ChefHat size={10} /> },
                             { key: 'ready', label: 'جاهز', icon: <PackageCheck size={10} /> },
                             { key: 'delivered', label: 'تسليم', icon: <CheckCircle2 size={10} /> },
                           ];
                           return (
                             <motion.div 
                               key={order.id}
                               initial={{ opacity: 0, y: 12 }}
                               animate={{ opacity: 1, y: 0 }}
                               transition={{ delay: i * 0.06 }}
                               className="bg-white rounded-[1.75rem] border border-slate-100 shadow-sm overflow-hidden"
                             >
                               {/* Animated gradient strip */}
                               <div className="h-1.5 w-full bg-slate-50 relative overflow-hidden">
                                 <motion.div 
                                   className="h-full bg-gradient-to-l from-blue-500 via-indigo-500 to-emerald-500"
                                   initial={{ width: 0 }}
                                   animate={{ width: `${(info.step / 4) * 100}%` }}
                                   transition={{ duration: 1, ease: "easeOut" }}
                                 />
                               </div>
                               <div className="p-4">
                                 {/* Header */}
                                 <div className="flex items-center justify-between mb-4">
                                   <div className="flex items-center gap-2.5">
                                     <motion.div
                                       animate={{ scale: [1, 1.08, 1] }}
                                       transition={{ duration: 2, repeat: Infinity }}
                                       className={clsx("h-9 w-9 rounded-xl flex items-center justify-center text-white", info.color)}
                                     >
                                       {info.icon}
                                     </motion.div>
                                     <div>
                                       <h4 className={clsx("text-[11px] font-black leading-none", info.text)}>{info.label}</h4>
                                       <div className="flex items-center gap-1.5 mt-1">
                                         <span className="text-[8px] font-bold text-slate-300">#{order.id.slice(0, 6)}</span>
                                         <span className="text-[8px] text-slate-200">•</span>
                                         <span className="text-[8px] font-bold text-blue-400">{timeAgo(order.createdAt)}</span>
                                       </div>
                                     </div>
                                   </div>
                                   <div className="text-left">
                                     <p className="text-sm font-black text-slate-900 leading-none">{money(order.totalAmount)}</p>
                                     <p className="text-[8px] font-bold text-slate-300 mt-0.5">{order.items.length} أصناف</p>
                                   </div>
                                 </div>
                                 
                                 {/* Stepper */}
                                 <div className="flex items-center gap-0.5 mb-4">
                                   {steps.map((step, si) => (
                                     <div key={step.key} className="flex items-center flex-1">
                                       <div className={clsx(
                                         "h-7 w-7 rounded-full flex items-center justify-center border-2 transition-all shrink-0",
                                         info.step > si + 1 ? "bg-emerald-500 border-emerald-100 text-white" :
                                         info.step === si + 1 ? clsx(info.color, "border-white text-white shadow-lg ring-2 ring-offset-1", info.color === 'bg-blue-500' ? 'ring-blue-100' : info.color === 'bg-orange-500' ? 'ring-orange-100' : 'ring-emerald-100') :
                                         "bg-slate-50 border-slate-200 text-slate-300"
                                       )}>
                                         {info.step > si + 1 ? <CheckCircle2 size={12} /> : step.icon}
                                       </div>
                                       {si < steps.length - 1 && (
                                         <div className="flex-1 h-[3px] mx-0.5 rounded-full overflow-hidden bg-slate-100">
                                           {info.step > si + 1 && <div className="h-full w-full bg-emerald-400 rounded-full" />}
                                           {info.step === si + 1 && <motion.div className="h-full bg-gradient-to-l from-blue-400 to-indigo-400 rounded-full" initial={{ width: 0 }} animate={{ width: "60%" }} transition={{ duration: 1.2 }} />}
                                         </div>
                                       )}
                                     </div>
                                   ))}
                                 </div>

                                 {/* Items list */}
                                 <div className="bg-slate-50/70 rounded-xl p-3 space-y-1.5">
                                   {order.items.map(item => (
                                     <div key={item.id} className="flex items-center justify-between py-0.5">
                                       <div className="flex items-center gap-2">
                                         <span className="h-5 min-w-[20px] px-1 bg-white border border-slate-200 rounded-md flex items-center justify-center text-[9px] font-black text-slate-600 shadow-sm">×{item.quantity}</span>
                                         <span className="text-[11px] font-bold text-slate-700">{item.product.name}</span>
                                       </div>
                                       <span className="text-[10px] font-black text-slate-400">{money(item.subtotal)}</span>
                                     </div>
                                   ))}
                                 </div>
                               </div>
                             </motion.div>
                           );
                         })}
                       </div>
                     )}

                     {/* Completed / Past Orders */}
                     <div className="space-y-3">
                       <div className="flex items-center gap-2 px-1">
                         <div className="h-6 w-6 rounded-lg bg-slate-100 flex items-center justify-center"><History size={12} className="text-slate-500" /></div>
                         <h3 className="text-xs font-black text-slate-600">السجل</h3>
                         {completed.length > 0 && <span className="text-[9px] font-bold bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full">{completed.length}</span>}
                         <div className="h-px flex-1 bg-gradient-to-l from-slate-200 to-transparent" />
                       </div>

                       {allOrders.length === 0 ? (
                         <div className="py-16 text-center bg-white rounded-[2rem] border border-dashed border-slate-200">
                           <div className="relative mx-auto w-20 h-20 mb-5">
                             <div className="absolute inset-0 bg-blue-50 rounded-3xl rotate-6" />
                             <div className="absolute inset-0 bg-slate-100 rounded-3xl -rotate-3" />
                             <div className="relative bg-white rounded-3xl border border-slate-200 w-full h-full flex items-center justify-center">
                               <Coffee size={28} className="text-slate-300" />
                             </div>
                           </div>
                           <p className="text-sm font-bold text-slate-500 mb-1">لم تقم بأي طلبات بعد</p>
                           <p className="text-[10px] text-slate-300 font-medium">اذهب للقائمة واطلب مشروبك المفضل ☕</p>
                         </div>
                       ) : completed.length === 0 ? (
                         <div className="py-8 text-center bg-white/50 rounded-2xl border border-dashed border-slate-100">
                           <p className="text-xs font-bold text-slate-300">لا توجد طلبات مكتملة بعد</p>
                         </div>
                       ) : (
                         <div className="relative">
                           {/* Timeline line */}
                           <div className="absolute top-0 bottom-0 right-[19px] w-px bg-gradient-to-b from-slate-200 via-slate-100 to-transparent" />
                           
                           <div className="space-y-0">
                             {completed.map((order, i) => {
                               const isDelivered = order.status === 'delivered';
                               return (
                                 <motion.div 
                                   key={order.id}
                                   initial={{ opacity: 0, x: -8 }}
                                   animate={{ opacity: 1, x: 0 }}
                                   transition={{ delay: i * 0.04 }}
                                   className="flex gap-3 py-2 group"
                                 >
                                   {/* Timeline dot */}
                                   <div className="relative shrink-0 mt-3">
                                     <div className={clsx(
                                       "h-4 w-4 rounded-full border-[3px] relative z-10",
                                       isDelivered ? "bg-emerald-500 border-emerald-100" : "bg-rose-400 border-rose-100"
                                     )} />
                                   </div>
                                   
                                   {/* Order card */}
                                   <div className="flex-1 bg-white rounded-2xl border border-slate-100 p-3.5 shadow-sm group-hover:shadow-md group-hover:border-slate-200 transition-all">
                                     <div className="flex items-start justify-between mb-2.5">
                                       <div>
                                         <div className="flex items-center gap-1.5 mb-0.5">
                                           <span className={clsx("text-[10px] font-black", isDelivered ? "text-emerald-600" : "text-rose-500")}>
                                             {isDelivered ? "✓ تم التسليم" : "✕ ملغي"}
                                           </span>
                                           <span className="text-[8px] text-slate-300">•</span>
                                           <span className="text-[8px] font-bold text-slate-300">#{order.id.slice(0, 6)}</span>
                                         </div>
                                         <p className="text-[9px] font-medium text-slate-400">{timeAgo(order.createdAt)} — {new Date(order.createdAt).toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })}</p>
                                       </div>
                                       <span className="text-sm font-black text-slate-900">{money(order.totalAmount)}</span>
                                     </div>
                                     <div className="flex flex-wrap gap-1">
                                       {order.items.map(item => (
                                         <span key={item.id} className="inline-flex items-center gap-1 bg-slate-50 text-slate-600 border border-slate-100 rounded-lg px-2 py-0.5 text-[8px] font-bold">
                                           <span className="text-slate-400 font-black">×{item.quantity}</span> {item.product.name}
                                         </span>
                                       ))}
                                     </div>
                                   </div>
                                 </motion.div>
                               );
                             })}
                           </div>
                         </div>
                       )}
                     </div>
                   </>
                 );
               })()}
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Cart Drawer & Checkout */}
      <AnimatePresence>
        {isCartOpen && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsCartOpen(false)} className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[50]" />
            <motion.div initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }} transition={{ type: "spring", damping: 25, stiffness: 200 }} className="fixed bottom-0 left-0 right-0 bg-white rounded-t-[3rem] z-[60] p-6 max-h-[80vh] overflow-y-auto shadow-2xl border-t border-slate-100">
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center"><ShoppingCart size={24} /></div>
                  <h3 className="text-xl font-black text-slate-900">مراجعة طلبك</h3>
                </div>
                <button onClick={() => setIsCartOpen(false)} className="h-10 w-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-500"><X size={20} /></button>
              </div>

              <div className="space-y-4 mb-8">
                {cartItems.map(item => (
                  <div key={item.id} className="flex items-center gap-4 p-4 bg-slate-50 rounded-[2.5rem] border border-slate-200/50">
                    {/* Item Image */}
                    <div className="h-16 w-16 shrink-0 rounded-2xl overflow-hidden border border-slate-200 bg-white">
                      <img 
                        src={getProductImage(item.product?.name || '', item.product?.category || '')} 
                        alt={item.product?.name}
                        className="h-full w-full object-cover"
                      />
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-black text-slate-900 truncate">{item.product?.name}</h4>
                      <p className="text-[10px] font-bold text-slate-400 mt-0.5">{money(item.product?.price || 0)} للواحد</p>
                    </div>

                    <div className="flex flex-col items-center gap-2">
                      <div className="flex items-center gap-2 bg-white p-1 rounded-xl shadow-sm border border-slate-100">
                        <button onClick={() => removeFromCart(item.id)} className="h-7 w-7 rounded-lg bg-slate-50 text-slate-600 flex items-center justify-center"><Minus size={12} /></button>
                        <span className="text-xs font-black w-4 text-center">{item.qty}</span>
                        <button onClick={() => addToCart(item.id)} className="h-7 w-7 rounded-lg bg-slate-900 text-white flex items-center justify-center"><Plus size={12} /></button>
                      </div>
                      <button onClick={() => deleteFromCart(item.id)} className="text-[9px] font-bold text-rose-500 hover:text-rose-600 transition-colors">حذف</button>
                    </div>
                  </div>
                ))}
              </div>

              <div className="border-t border-slate-100 pt-6 space-y-4">
                <div className="flex items-center justify-between px-2">
                  <span className="text-sm font-bold text-slate-500">إجمالي الطلب الحالي</span>
                  <span className="text-2xl font-black text-slate-900">{money(currentCartTotal)}</span>
                </div>
                <button 
                  onClick={() => {
                    const items = cartItems.map(i => ({ productId: i.id, quantity: i.qty }));
                    orderMutation.mutate(items);
                  }}
                  disabled={orderMutation.isPending}
                  className="w-full py-5 bg-slate-900 text-white rounded-2xl font-black text-lg shadow-xl flex items-center justify-center gap-3 disabled:opacity-50"
                >
                  {orderMutation.isPending ? <Spinner size={24} /> : (
                    <>إرسال الطلب للباريستا <Send size={20} className="rotate-180" /></>
                  )}
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Chat UI */}
      <AnimatePresence>
        {isAuthorized && (
          <>
            {/* Chat Floating Button */}
            <motion.button 
              initial={{ scale: 0, rotate: -45 }}
              animate={{ scale: 1, rotate: 0 }}
              onClick={() => setChatOpen(true)}
              className="fixed bottom-24 left-6 z-[45] h-14 w-14 bg-blue-600 text-white rounded-2xl shadow-2xl flex items-center justify-center hover:scale-110 active:scale-95 transition-all group"
            >
              <div className="relative">
                <Bell size={24} className="group-hover:animate-swing" />
                {unreadCount > 0 && (
                  <div className="absolute -top-2 -right-2 bg-rose-500 text-white text-[10px] font-black h-5 w-5 rounded-full flex items-center justify-center border-2 border-white animate-bounce">
                    {unreadCount}
                  </div>
                )}
              </div>
            </motion.button>

            {/* Chat Window */}
            {chatOpen && (
              <>
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setChatOpen(false)} className="fixed inset-0 bg-slate-900/40 backdrop-blur-[2px] z-[55]" />
                <motion.div 
                  initial={{ y: 100, opacity: 0, scale: 0.9 }} 
                  animate={{ y: 0, opacity: 1, scale: 1 }} 
                  exit={{ y: 100, opacity: 0, scale: 0.9 }}
                  className="fixed inset-x-6 bottom-6 top-20 bg-white rounded-[2.5rem] shadow-2xl z-[60] flex flex-col overflow-hidden border border-slate-100"
                >
                  {/* Chat Header */}
                  <div className="p-6 bg-slate-900 text-white flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-xl bg-blue-500 flex items-center justify-center"><ChefHat size={20} /></div>
                      <div>
                        <h3 className="text-sm font-black">دردشة مع الباريستا</h3>
                        <p className="text-[10px] text-blue-300">طاولة {guestCode} • متاح الآن</p>
                      </div>
                    </div>
                    <button onClick={() => setChatOpen(false)} className="h-10 w-10 rounded-xl bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors"><X size={20} /></button>
                  </div>

                  {/* Messages Area */}
                  <div ref={chatScrollRef} className="flex-1 overflow-y-auto p-6 space-y-4 bg-slate-50/50">
                    {chatMessages.length === 0 ? (
                      <div className="h-full flex flex-col items-center justify-center text-center opacity-40 grayscale px-10">
                        <div className="h-20 w-20 bg-slate-200 rounded-[2rem] flex items-center justify-center mb-4"><Send size={32} className="rotate-180" /></div>
                        <p className="text-xs font-bold">ابدأ المحادثة مع الباريستا إذا كان لديك أي استفسار عن طلبك</p>
                      </div>
                    ) : (
                      chatMessages.map((msg, i) => (
                        <motion.div 
                          key={msg.id || i}
                          initial={{ opacity: 0, x: msg.sender === 'العميل' ? -20 : 20 }}
                          animate={{ opacity: 1, x: 0 }}
                          className={clsx("flex flex-col", msg.sender === 'العميل' ? "items-start" : "items-end")}
                        >
                          <div className={clsx(
                            "max-w-[80%] p-4 rounded-3xl text-xs font-bold shadow-sm",
                            msg.sender === 'العميل' ? "bg-white border border-slate-100 text-slate-800 rounded-br-none" : "bg-blue-600 text-white rounded-bl-none shadow-blue-500/20"
                          )}>
                            {msg.text}
                          </div>
                          <span className="text-[8px] text-slate-400 mt-1 px-2">{msg.sender} • {new Date(msg.timestamp).toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })}</span>
                        </motion.div>
                      ))
                    )}
                  </div>

                  {/* Input Area */}
                  <form onSubmit={handleSendChat} className="p-4 bg-white border-t border-slate-100 flex items-center gap-3">
                    <input 
                      type="text" 
                      placeholder="اكتب رسالتك هنا..." 
                      value={chatInput}
                      onChange={e => setChatInput(e.target.value)}
                      className="flex-1 bg-slate-100 border-none rounded-2xl px-5 py-4 text-xs font-bold outline-none focus:ring-2 focus:ring-blue-500/20 transition-all"
                    />
                    <button 
                      type="submit"
                      disabled={!chatInput.trim()}
                      className="h-12 w-12 bg-blue-600 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-blue-600/20 hover:scale-105 active:scale-95 transition-all disabled:opacity-50 disabled:grayscale"
                    >
                      <Send size={18} className="rotate-180" />
                    </button>
                  </form>
                </motion.div>
              </>
            )}
          </>
        )}
      </AnimatePresence>

      {/* Floating Review Bar */}

      <AnimatePresence>
        {activeTab === "menu" && currentCartTotal > 0 && !isCartOpen && (
          <motion.div initial={{ y: 100, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 100, opacity: 0 }} className="fixed bottom-8 left-4 right-4 z-40 pointer-events-none">
            <button 
              onClick={() => setIsCartOpen(true)}
              className="mx-auto max-w-lg w-full rounded-[2.5rem] bg-slate-900 p-5 shadow-2xl flex items-center justify-between pointer-events-auto hover:scale-[1.02] active:scale-[0.98] transition"
            >
              <div className="text-right">
                <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest leading-none mb-1">عرض السلة ({cartItems.length} صنف)</p>
                <p className="text-xl font-black text-white leading-none">{money(currentCartTotal)}</p>
              </div>
              <div className="bg-blue-600 text-white px-6 py-3 rounded-2xl font-black text-xs flex items-center gap-2">
                مراجعة الطلب
                <ChevronRight size={16} className="rotate-180" />
              </div>
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
