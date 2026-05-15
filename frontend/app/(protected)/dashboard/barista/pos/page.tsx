"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ShoppingCart,
  Plus,
  Minus,
  RefreshCw,
  Coffee,
  Receipt,
  Search,
  X,
  Heart,
  User,
  CheckCircle2,
  ChevronRight,
  Users,
  Leaf,
  Flame,
  Snowflake,
  Wine,
  Milk,
  Apple,
  Package,
  Utensils,
  GlassWater,
  Droplets,
  LayoutGrid,
  Sparkles,
  Trash2,
} from "lucide-react";
import Link from "next/link";
import { api } from "@/lib/api";
import { money } from "@/lib/format";
import { translateApiError } from "@/lib/errors";
import { translateProductCategory } from "@/lib/labels";
import type { Customer, Paginated, Product, Session } from "@/lib/types";
import clsx from "clsx";

interface CartItem {
  productId: string;
  productName: string;
  unitPrice: number;
  costPrice: number;
  category: string;
  quantity: number;
}

const FAVORITES_KEY = "pos_favorites_v1";

type CategoryMeta = {
  icon: React.ElementType;
  iconColor: string;
  bgColor: string;
};

const categoryConfig: Record<string, CategoryMeta> = {
  all: { icon: LayoutGrid, iconColor: "text-slate-500", bgColor: "bg-slate-50" },
  coffee: { icon: Coffee, iconColor: "text-amber-600", bgColor: "bg-amber-50" },
  tea: { icon: Leaf, iconColor: "text-emerald-600", bgColor: "bg-emerald-50" },
  frappe: { icon: GlassWater, iconColor: "text-cyan-600", bgColor: "bg-cyan-50" },
  "cold-coffee": { icon: Snowflake, iconColor: "text-blue-600", bgColor: "bg-blue-50" },
  "hot-drinks": { icon: Flame, iconColor: "text-orange-600", bgColor: "bg-orange-50" },
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
  return categoryConfig[cat] ?? categoryConfig.all;
}

export default function BaristaPOSPage() {
  const queryClient = useQueryClient();

  const [sessionId, setSessionId] = useState("");
  const [notes, setNotes] = useState("");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [customerSearchQuery, setCustomerSearchQuery] = useState("");
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [showFavorites, setShowFavorites] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [customerTab, setCustomerTab] = useState<"search" | "staff">("search");
  const [isMobileCartOpen, setIsMobileCartOpen] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem(FAVORITES_KEY);
    if (stored) {
      try { setFavorites(new Set(JSON.parse(stored))); } catch (e) { }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(FAVORITES_KEY, JSON.stringify(Array.from(favorites)));
  }, [favorites]);

  const productsQuery = useQuery({
    queryKey: ["products", "pos"],
    queryFn: async () => {
      const response = await api.get("/products", { params: { page: 1, limit: 200, active: true, availability: true } });
      return response.data.data as Paginated<Product>;
    },
  });

  const activeSessionsQuery = useQuery({
    queryKey: ["sessions", "active"],
    queryFn: async () => {
      const response = await api.get("/sessions", { params: { page: 1, limit: 50, status: "active" } });
      return response.data.data as Paginated<Session>;
    },
  });

  const customersQuery = useQuery({
    queryKey: ["customers", customerSearchQuery ? "search" : "all", customerSearchQuery],
    queryFn: async () => {
      const params: Record<string, any> = { page: 1, limit: 200 };
      if (customerSearchQuery.trim()) params.name = customerSearchQuery.trim();
      const response = await api.get("/customers", { params });
      return response.data.data as Paginated<Customer>;
    },
  });

  const staffQuery = useQuery({
    queryKey: ["customers", "staff-list"],
    queryFn: async () => {
      const response = await api.get("/customers", { params: { customerType: "staff,owner_discount", limit: 200 } });
      return response.data.data as Paginated<Customer>;
    },
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      const selectedSession = activeSessionsQuery.data?.data?.find((s) => s.id === sessionId);
      const effectiveCustomerId = selectedSession?.customerId || selectedCustomer?.id;

      if (!effectiveCustomerId) {
        throw new Error("يجب اختيار عميل أو جلسة لإتمام الطلب");
      }

      const items = cart.map((item) => ({
        productId: item.productId,
        quantity: item.quantity,
      }));
      await api.post("/bar-orders", {
        sessionId: sessionId || undefined,
        customerId: effectiveCustomerId,
        items,
        notes: notes || undefined,
      });
    },
    onSuccess: () => {
      setCart([]);
      setSessionId("");
      setNotes("");
      setSelectedCustomer(null);
      setShowConfirm(false);
      setMessage({ type: "success", text: "تم تسجيل الطلب بنجاح ✓" });
      queryClient.invalidateQueries({ queryKey: ["bar-orders"] });
      setTimeout(() => setMessage(null), 3000);
    },
    onError: (error: unknown) => {
      setShowConfirm(false);
      const apiMessage = (error as any)?.response?.data?.message;
      setMessage({ type: "error", text: translateApiError(apiMessage) });
    },
  });

  const cartSubtotal = useMemo(() => cart.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0), [cart]);

  const discountInfo = useMemo(() => {
    if (!selectedCustomer) return null;
    if (selectedCustomer.customerType === 'owner_discount') {
      return { label: 'خصم مالك (70%)', percentage: 70, multiplier: 0.3 };
    }
    if (selectedCustomer.customerType === 'staff') {
      return { label: 'خصم موظف (50%)', percentage: 50, multiplier: 0.5 };
    }
    return null;
  }, [selectedCustomer]);

  const cartTotal = useMemo(() => {
    if (!discountInfo) return cartSubtotal;
    return cart.reduce((sum, item) => {
      const isWater = 
        item.category.toLowerCase().includes('water') || 
        item.productName.toLowerCase().includes('مياه') || 
        item.productName.toLowerCase().includes('مياة');

      let effectiveUnitPrice = item.unitPrice;
      
      if (selectedCustomer?.customerType === 'owner_discount') {
        effectiveUnitPrice = isWater ? item.costPrice : item.unitPrice * 0.3;
      } else if (selectedCustomer?.customerType === 'staff') {
        effectiveUnitPrice = isWater ? item.costPrice : item.unitPrice * 0.5;
      }
      
      return sum + (effectiveUnitPrice * item.quantity);
    }, 0);
  }, [cart, selectedCustomer, discountInfo, cartSubtotal]);

  const discountAmount = cartSubtotal - cartTotal;
  const cartCount = useMemo(() => cart.reduce((sum, item) => sum + item.quantity, 0), [cart]);
  const products = productsQuery.data?.data ?? [];
  const categories = useMemo(() => ["all", ...Array.from(new Set(products.map((p) => p.category)))], [products]);

  const filteredProducts = useMemo(() => {
    let result = products;
    if (showFavorites) result = result.filter((p) => favorites.has(p.id));
    if (selectedCategory !== "all") result = result.filter((p) => p.category === selectedCategory);
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter((p) => p.name.toLowerCase().includes(q));
    }
    return result;
  }, [products, selectedCategory, searchQuery, favorites, showFavorites]);

  const grouped = useMemo(() => {
    return Object.entries(
      filteredProducts.reduce((acc, p) => {
        if (!acc[p.category]) acc[p.category] = [];
        acc[p.category].push(p);
        return acc;
      }, {} as Record<string, Product[]>)
    );
  }, [filteredProducts]);

  const addToCart = useCallback((product: Product) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.productId === product.id);
      if (existing) {
        return prev.map((item) =>
          item.productId === product.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...prev, { 
        productId: product.id, 
        productName: product.name, 
        unitPrice: Number(product.price), 
        costPrice: Number(product.costPrice || 0),
        category: product.category,
        quantity: 1 
      }];
    });
  }, []);

  const updateQuantity = useCallback((productId: string, delta: number) => {
    setCart((prev) => {
      const updated = prev.map((item) =>
        item.productId === productId ? { ...item, quantity: Math.max(0, item.quantity + delta) } : item
      );
      return updated.filter((item) => item.quantity > 0);
    });
  }, []);

  const toggleFavorite = useCallback((productId: string) => {
    setFavorites((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(productId)) newSet.delete(productId);
      else newSet.add(productId);
      return newSet;
    });
  }, []);

  return (
    <div
      className="relative flex h-[calc(100vh-80px)] flex-col lg:flex-row overflow-hidden rounded-[1.5rem] border border-slate-200 bg-white shadow-sm"
      dir="rtl"
    >

      {/* Categories Sidebar */}
      <aside className="hidden lg:flex w-16 lg:w-56 border-l border-slate-100 flex-col bg-slate-50/50 shrink-0">
        <div className="h-16 px-4 flex items-center border-b border-slate-100">
          <Link
            href="/dashboard/barista"
            className="flex items-center gap-2 text-slate-400 hover:text-slate-900 transition-colors"
          >
            <ChevronRight size={20} />
            <span className="hidden lg:inline text-xs font-bold tracking-tight">الرئيسية</span>
          </Link>
        </div>

        <nav className="flex-1 overflow-y-auto px-2 lg:px-3 py-4 space-y-1">
          <button
            onClick={() => setShowFavorites(!showFavorites)}
            className={clsx(
              "w-full flex items-center gap-3 px-3 py-3 rounded-xl transition-all",
              showFavorites
                ? "bg-rose-500 text-white shadow-md"
                : "text-slate-500 hover:bg-slate-100"
            )}
          >
            <Heart size={18} className={showFavorites ? "fill-white" : ""} />
            <span className="hidden lg:inline text-xs font-bold">المفضلة</span>
          </button>

          <div className="my-2 mx-2 h-px bg-slate-200/60" />

          {categories.map((cat) => {
            const meta = getCategoryMeta(cat);
            const IconComp = meta.icon;
            const isActive = selectedCategory === cat && !showFavorites;
            return (
              <button
                key={cat}
                onClick={() => { setSelectedCategory(cat); setShowFavorites(false); }}
                className={clsx(
                  "w-full flex items-center gap-3 px-3 py-3 rounded-xl transition-all group",
                  isActive
                    ? "bg-slate-900 text-white shadow-lg"
                    : "text-slate-500 hover:bg-slate-100"
                )}
              >
                <div
                  className={clsx(
                    "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition-colors",
                    isActive ? "bg-white/20" : `${meta.bgColor} ${meta.iconColor}`
                  )}
                >
                  <IconComp size={16} />
                </div>
                <span className="hidden lg:inline text-xs font-bold truncate">
                  {cat === "all" ? "كل القائمة" : translateProductCategory(cat)}
                </span>
              </button>
            );
          })}
        </nav>
      </aside>

      {/* Product Grid */}
      <main className="flex-1 flex flex-col min-w-0 bg-white relative">
        <header className="h-16 px-4 lg:px-6 flex items-center gap-3 lg:gap-4 border-b border-slate-100 shrink-0">
          {/* Mobile Back Button */}
          <Link
            href="/dashboard/barista"
            className="lg:hidden h-10 w-10 flex items-center justify-center rounded-xl bg-slate-50 text-slate-400"
          >
            <ChevronRight size={20} />
          </Link>
          <div className="relative flex-1 max-w-sm">
            <Search size={14} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="ابحث عن مشروب أو صنف..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-10 pr-10 pl-4 rounded-xl bg-slate-50 border-none text-xs font-medium focus:ring-2 focus:ring-slate-900/10 transition-all"
            />
          </div>
          
          <button
            onClick={() => queryClient.invalidateQueries({ queryKey: ["products", "pos"] })}
            className="h-10 px-3 lg:px-4 flex items-center gap-2 rounded-xl bg-slate-50 text-slate-500 hover:text-slate-900 transition-colors"
          >
            <RefreshCw size={14} className={productsQuery.isLoading ? "animate-spin" : ""} />
            <span className="hidden sm:inline text-[10px] font-bold">تحديث</span>
          </button>
        </header>

        {/* Mobile Categories Scroll */}
        <div className="lg:hidden flex overflow-x-auto px-4 py-3 gap-2 border-b border-slate-50 bg-slate-50/30 scrollbar-none">
          <button
            onClick={() => setShowFavorites(!showFavorites)}
            className={clsx(
              "whitespace-nowrap flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all",
              showFavorites ? "bg-rose-500 text-white shadow-md" : "bg-white text-slate-500 border border-slate-100"
            )}
          >
            <Heart size={14} className={showFavorites ? "fill-white" : ""} />
            المفضلة
          </button>
          {categories.map((cat) => {
            const isActive = selectedCategory === cat && !showFavorites;
            return (
              <button
                key={cat}
                onClick={() => { setSelectedCategory(cat); setShowFavorites(false); }}
                className={clsx(
                  "whitespace-nowrap px-4 py-2 rounded-xl text-xs font-bold transition-all border",
                  isActive ? "bg-slate-900 text-white border-slate-900 shadow-md" : "bg-white text-slate-500 border-slate-100"
                )}
              >
                {cat === "all" ? "كل القائمة" : translateProductCategory(cat)}
              </button>
            );
          })}
        </div>

        {message && (
          <div className={clsx(
            "mx-6 mt-4 flex items-center gap-3 rounded-xl border px-4 py-2.5 text-xs font-bold",
            message.type === "success" ? "bg-emerald-50 border-emerald-100 text-emerald-700" : "bg-red-50 border-red-100 text-red-700"
          )}>
            <CheckCircle2 size={16} />
            {message.text}
          </div>
        )}

        <div className="flex-1 overflow-y-auto px-6 py-6 scroll-smooth">
          {productsQuery.isLoading ? (
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {[1, 2, 3, 4, 5, 6].map(i => <div key={i} className="h-32 rounded-2xl bg-slate-50 animate-pulse" />)}
            </div>
          ) : (
            <div className="space-y-10">
              {grouped.map(([cat, items]) => {
                const meta = getCategoryMeta(cat);
                const IconComp = meta.icon;
                return (
                  <section key={cat}>
                    <div className="flex items-center gap-3 mb-5">
                      <div className={clsx("h-8 w-8 rounded-lg flex items-center justify-center", meta.bgColor, meta.iconColor)}>
                        <IconComp size={16} />
                      </div>
                      <h2 className="text-sm font-black text-slate-800 uppercase tracking-tight">
                        {translateProductCategory(cat)}
                      </h2>
                      <div className="flex-1 h-px bg-slate-100" />
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
                      {items.map((product) => {
                        const inCart = cart.find((i) => i.productId === product.id);
                        const isFav = favorites.has(product.id);
                        return (
                          <div
                            key={product.id}
                            onClick={() => addToCart(product)}
                            className={clsx(
                              "relative flex flex-col p-3 rounded-2xl border transition-all cursor-pointer select-none active:scale-95",
                              inCart ? "border-slate-900 bg-white shadow-xl ring-1 ring-slate-900" : "border-slate-100 bg-white hover:border-slate-300 hover:shadow-lg"
                            )}
                          >
                            <button
                              onClick={(e) => { e.stopPropagation(); toggleFavorite(product.id); }}
                              className={clsx(
                                "absolute top-2 left-2 z-10 h-7 w-7 flex items-center justify-center rounded-lg transition-all",
                                isFav ? "text-rose-500" : "text-slate-200 hover:text-rose-300"
                              )}
                            >
                              <Heart size={14} className={isFav ? "fill-rose-500" : ""} />
                            </button>

                            {inCart && (
                              <div className="absolute -top-2 -right-2 h-7 w-7 bg-slate-900 text-white rounded-full flex items-center justify-center text-[10px] font-black shadow-md border-2 border-white">
                                {inCart.quantity}
                              </div>
                            )}

                            <div className={clsx("h-10 w-10 mb-3 rounded-xl flex items-center justify-center", meta.bgColor, meta.iconColor)}>
                              <IconComp size={20} />
                            </div>

                            <div className="space-y-2">
                              <p className="text-[11px] font-bold text-slate-800 leading-tight line-clamp-2 min-h-[2.2rem]">
                                {product.name}
                              </p>
                              <p className={clsx("text-xs font-black", inCart ? "text-slate-900" : "text-slate-400")}>
                                {money(Number(product.price))}
                              </p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </section>
                );
              })}
            </div>
          )}
        </div>

        {/* Floating Cart Button for Mobile */}
        {cartCount > 0 && (
          <button
            onClick={() => setIsMobileCartOpen(true)}
            className="lg:hidden fixed bottom-6 left-6 z-40 h-16 w-16 bg-slate-900 text-white rounded-full shadow-2xl flex items-center justify-center transition-transform active:scale-90"
          >
            <div className="relative">
              <ShoppingCart size={24} />
              <span className="absolute -top-3 -right-3 h-6 w-6 bg-rose-500 text-white text-[10px] font-black rounded-full flex items-center justify-center ring-2 ring-white">
                {cartCount}
              </span>
            </div>
          </button>
        )}
      </main>

      {/* Checkout Section - Responsive Drawer */}
      <aside className={clsx(
        "fixed inset-y-0 left-0 z-50 w-full sm:w-[24rem] lg:relative lg:inset-auto lg:z-auto lg:w-[20rem] lg:flex flex-col bg-white border-r border-slate-100 transition-transform duration-300 lg:translate-x-0 shadow-2xl lg:shadow-none shrink-0",
        isMobileCartOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
      )}>
        <div className="h-16 px-5 flex items-center justify-between border-b border-slate-100">
          <div className="flex items-center gap-2">
            <ShoppingCart size={18} className="text-slate-400" />
            <span className="text-sm font-black text-slate-900">سلة الطلب ({cartCount})</span>
          </div>
          <div className="flex items-center gap-1">
            {cart.length > 0 && (
              <button onClick={() => setCart([])} className="p-2 text-slate-300 hover:text-rose-500 transition-colors">
                <Trash2 size={16} />
              </button>
            )}
            <button onClick={() => setIsMobileCartOpen(false)} className="lg:hidden p-2 text-slate-400 hover:text-slate-900">
              <X size={20} />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
          {cart.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-slate-200">
              <Receipt size={40} strokeWidth={1} className="mb-3" />
              <p className="text-xs font-bold uppercase tracking-widest">السلة فارغة</p>
            </div>
          ) : (
            cart.map((item) => (
              <div key={item.productId} className="group p-3 rounded-xl border border-slate-100 hover:border-slate-200 transition-all">
                <div className="flex justify-between items-start gap-3 mb-3">
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-slate-800 truncate">{item.productName}</p>
                    <p className="text-[10px] text-slate-400 mt-0.5">{money(item.unitPrice)}</p>
                  </div>
                  <span className="text-xs font-black text-slate-900">{money(item.unitPrice * item.quantity)}</span>
                </div>
                
                <div className="flex items-center gap-2">
                  <button onClick={() => updateQuantity(item.productId, -1)} className="h-7 w-7 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-center hover:bg-slate-100">
                    <Minus size={12} className="text-slate-400" />
                  </button>
                  <span className="w-6 text-center text-xs font-black">{item.quantity}</span>
                  <button onClick={() => updateQuantity(item.productId, 1)} className="h-7 w-7 rounded-lg bg-slate-900 text-white flex items-center justify-center hover:bg-slate-800">
                    <Plus size={12} />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="p-4 border-t border-slate-100 bg-slate-50/50 space-y-4">
          <div className="space-y-2">
            <div className="flex justify-between text-xs font-bold text-slate-400">
              <span>الإجمالي</span>
              <span>{money(cartSubtotal)}</span>
            </div>
            {discountInfo && (
              <div className="flex justify-between text-xs font-bold text-emerald-600">
                <span>{discountInfo.label}</span>
                <span>-{money(discountAmount)}</span>
              </div>
            )}
            <div className="flex justify-between pt-2 border-t border-slate-100">
              <span className="text-sm font-black text-slate-900">المطلوب دفعه</span>
              <span className="text-2xl font-black text-slate-900">{money(cartTotal)}</span>
            </div>
          </div>

          <div className="space-y-3">
            <p className="text-[10px] font-black uppercase text-slate-400 tracking-tighter">اختيار العميل</p>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setCustomerTab("search")}
                className={clsx(
                  "flex-1 rounded-2xl border px-3 py-2 text-[10px] font-bold transition",
                  customerTab === "search"
                    ? "bg-slate-900 text-white border-slate-900"
                    : "bg-white text-slate-500 border-slate-200 hover:bg-slate-50"
                )}
              >
                بحث العملاء
              </button>
              <button
                type="button"
                onClick={() => setCustomerTab("staff")}
                className={clsx(
                  "flex-1 rounded-2xl border px-3 py-2 text-[10px] font-bold transition",
                  customerTab === "staff"
                    ? "bg-slate-900 text-white border-slate-900"
                    : "bg-white text-slate-500 border-slate-200 hover:bg-slate-50"
                )}
              >
                موظفين / خصومات
              </button>
            </div>

            {customerTab === "search" ? (
              <div className="space-y-2">
                <div className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-3 py-2">
                  <Search size={14} className="text-slate-400" />
                  <input
                    type="text"
                    placeholder="ابحث باسم أو هاتف العميل"
                    value={customerSearchQuery}
                    onChange={(e) => setCustomerSearchQuery(e.target.value)}
                    className="flex-1 bg-transparent border-none text-[11px] font-bold focus:ring-0 outline-none"
                  />
                </div>
                <div className="max-h-48 overflow-y-auto rounded-2xl border border-slate-200 bg-slate-50 p-2">
                  {customersQuery.isLoading ? (
                    <div className="space-y-2">
                      {[...Array(3)].map((_, idx) => (
                        <div key={idx} className="h-10 rounded-xl bg-slate-200 animate-pulse" />
                      ))}
                    </div>
                  ) : (customersQuery.data?.data.length ?? 0) > 0 ? (
                    <>
                      <div className="mb-2 text-[11px] font-semibold text-slate-500">
                        عرض {customersQuery.data?.data.length ?? 0} من أصل {customersQuery.data?.total ?? 0} عميل
                      </div>
                      {customersQuery.data?.data.map((customer) => (
                        <button
                          key={customer.id}
                          type="button"
                          onClick={() => {
                            setSelectedCustomer(customer);
                            setSessionId("");
                          }}
                          className={clsx(
                            "w-full rounded-2xl px-3 py-2 text-left text-[11px] font-semibold transition",
                            selectedCustomer?.id === customer.id ? "bg-slate-900 text-white" : "bg-white text-slate-800 hover:bg-slate-100"
                          )}
                        >
                          <div className="flex items-center justify-between gap-2">
                            <span>{customer.fullName}</span>
                            <span className="text-[10px] text-slate-400">{customer.phoneNumber || "بدون هاتف"}</span>
                          </div>
                          {customer.customerType && (
                            <div className="mt-1 text-[10px] text-slate-500">{customer.customerType}</div>
                          )}
                        </button>
                      ))}
                    </>
                  ) : (
                    <p className="text-[11px] text-slate-500">لا يوجد عملاء مطابقين.</p>
                  )}
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="rounded-2xl border border-slate-200 bg-white p-2 max-h-48 overflow-y-auto">
                  {staffQuery.isLoading ? (
                    <div className="space-y-2">
                      {[...Array(3)].map((_, idx) => (
                        <div key={idx} className="h-10 rounded-xl bg-slate-200 animate-pulse" />
                      ))}
                    </div>
                  ) : (staffQuery.data?.data.length ?? 0) > 0 ? (
                    staffQuery.data?.data.map((customer) => (
                      <button
                        key={customer.id}
                        type="button"
                        onClick={() => {
                          setSelectedCustomer(customer);
                          setSessionId("");
                          setCustomerTab("search");
                        }}
                        className={clsx(
                          "w-full rounded-2xl px-3 py-2 text-left text-[11px] font-semibold transition",
                          selectedCustomer?.id === customer.id ? "bg-slate-900 text-white" : "bg-white text-slate-800 hover:bg-slate-100"
                        )}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span>{customer.fullName}</span>
                          <span className="text-[10px] text-slate-400">{customer.customerType}</span>
                        </div>
                      </button>
                    ))
                  ) : (
                    <p className="text-[11px] text-slate-500">لا يوجد موظفين أو خصومات.</p>
                  )}
                </div>
              </div>
            )}

            <div className="space-y-4">
              <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-[10px] font-black uppercase text-slate-400 tracking-tighter">العميل المختار</p>
                    <p className="mt-1 text-sm font-bold text-slate-900">
                      {selectedCustomer?.fullName || (sessionId ? "العميل من الجلسة" : "لم يتم اختيار عميل")}
                    </p>
                    <p className="mt-1 text-[11px] text-slate-500">
                      {selectedCustomer?.phoneNumber || (sessionId ? "سيتم استخدام العميل المرتبط بالجلسة" : "اختر عميلًا من القائمة أو جلسة نشطة")}
                    </p>
                  </div>
                  {selectedCustomer && (
                    <button
                      type="button"
                      onClick={() => setSelectedCustomer(null)}
                      className="rounded-2xl border border-slate-200 px-3 py-2 text-[11px] font-bold text-slate-500 hover:bg-slate-100"
                    >
                      مسح
                    </button>
                  )}
                </div>
              </div>

              <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-[10px] font-black uppercase text-slate-400 tracking-tighter">الجلسة النشطة</p>
                <div className="mt-3 rounded-2xl border border-slate-200 bg-white">
                  <select
                    className="w-full bg-transparent px-4 py-3 text-[12px] font-bold outline-none"
                    onChange={(e) => {
                      const session = activeSessionsQuery.data?.data?.find((s) => s.id === e.target.value);
                      setSessionId(e.target.value);
                      if (session?.customer) setSelectedCustomer(session.customer as any);
                    }}
                    value={sessionId}
                  >
                    <option value="">لا توجد جلسة</option>
                    {activeSessionsQuery.data?.data?.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.customer?.fullName || "جلسة نشطة"} - {s.room?.name || "بدون غرفة"}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          </div>

          <button
            onClick={() => setShowConfirm(true)}
            disabled={cart.length === 0 || (!selectedCustomer && !sessionId)}
            className="w-full py-4 rounded-2xl bg-slate-900 text-white text-sm font-black shadow-xl shadow-slate-200 hover:bg-slate-800 disabled:opacity-30 transition-all active:scale-95 flex items-center justify-center gap-3"
          >
            تأكيد العملية
            <ChevronRight size={18} className="rotate-180" />
          </button>
        </div>
      </aside>

      {/* ══════════════════════════════
          CONFIRM MODAL
      ══════════════════════════════ */}
      {showConfirm && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100">
              <h3 className="text-lg font-black text-slate-900">تأكيد الطلب</h3>
              <button
                onClick={() => setShowConfirm(false)}
                className="h-9 w-9 flex items-center justify-center rounded-xl hover:bg-slate-100 text-slate-400 transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            <div className="px-6 py-5 space-y-5">
              {/* Items */}
              <div>
                <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-3">ملخص الأصناف</p>
                <div className="max-h-48 overflow-y-auto space-y-2 rounded-xl bg-slate-50 p-3">
                  {cart.map((item) => (
                    <div key={item.productId} className="flex items-center justify-between text-sm">
                      <span className="text-slate-700">
                        {item.productName}
                        <span className="text-slate-400 mx-1">×</span>
                        <span className="font-black text-slate-900">{item.quantity}</span>
                      </span>
                      <div className="text-left">
                        {discountInfo && (
                          <div className="text-[10px] text-slate-400 line-through leading-none">
                            {money(item.unitPrice * item.quantity)}
                          </div>
                        )}
                        <span className="font-black text-slate-900">
                          {money(
                            (() => {
                              const isWater = 
                                item.category.toLowerCase().includes('water') || 
                                item.productName.toLowerCase().includes('مياه') || 
                                item.productName.toLowerCase().includes('مياة');
                              
                              if (selectedCustomer?.customerType === 'owner_discount') {
                                return (isWater ? item.costPrice : item.unitPrice * 0.3) * item.quantity;
                              }
                              if (selectedCustomer?.customerType === 'staff') {
                                return (isWater ? item.costPrice : item.unitPrice * 0.5) * item.quantity;
                              }
                              return item.unitPrice * item.quantity;
                            })()
                          )}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Summary */}
              <div className="rounded-2xl border border-slate-200 p-4 space-y-2.5">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">المجموع الفرعي</span>
                  <span className="font-bold text-slate-900">{money(cartSubtotal)}</span>
                </div>
                
                {discountInfo && (
                  <div className="flex justify-between text-sm text-emerald-600">
                    <span className="font-medium">{discountInfo.label}</span>
                    <span className="font-black">-{money(discountAmount)}</span>
                  </div>
                )}

                {notes && (
                  <div className="flex justify-between text-sm gap-4">
                    <span className="text-slate-500 shrink-0">ملاحظات</span>
                    <span className="font-bold text-slate-900 text-left">{notes}</span>
                  </div>
                )}
                <div className="h-px bg-slate-100" />
                <div className="flex justify-between items-center">
                  <span className="text-base font-bold text-slate-500">الإجمالي النهائي</span>
                  <div className="text-left">
                    {discountInfo && (
                      <div className="text-xs text-slate-400 line-through font-bold leading-none mb-1">
                        {money(cartSubtotal)}
                      </div>
                    )}
                    <div className="text-2xl font-black text-slate-900 leading-none">
                      {money(cartTotal)}
                    </div>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3">
                <button
                  onClick={() => setShowConfirm(false)}
                  className="flex-1 h-12 rounded-2xl border-2 border-slate-200 text-sm font-bold text-slate-600 hover:bg-slate-50 transition-colors"
                >
                  إلغاء
                </button>
                <button
                  onClick={() => createMutation.mutate()}
                  disabled={createMutation.isPending}
                  className="flex-[2] h-12 rounded-2xl bg-slate-900 text-white text-sm font-black hover:bg-slate-800 active:scale-[0.98] transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {createMutation.isPending
                    ? <RefreshCw className="animate-spin" size={18} />
                    : <><CheckCircle2 size={18} /> تأكيد وإرسال</>
                  }
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
