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
  quantity: number;
}

const FAVORITES_KEY = "pos_favorites_v1";

type CategoryMeta = {
  icon: React.ElementType;
  iconColor: string;
  bgColor: string;
};

const categoryConfig: Record<string, CategoryMeta> = {
  all: { icon: LayoutGrid, iconColor: "text-slate-600", bgColor: "bg-slate-100" },
  coffee: { icon: Coffee, iconColor: "text-amber-700", bgColor: "bg-amber-100" },
  tea: { icon: Leaf, iconColor: "text-emerald-700", bgColor: "bg-emerald-100" },
  frappe: { icon: GlassWater, iconColor: "text-cyan-700", bgColor: "bg-cyan-100" },
  "cold-coffee": { icon: Snowflake, iconColor: "text-blue-700", bgColor: "bg-blue-100" },
  "hot-drinks": { icon: Flame, iconColor: "text-orange-700", bgColor: "bg-orange-100" },
  frappuccino: { icon: GlassWater, iconColor: "text-violet-700", bgColor: "bg-violet-100" },
  "milk-shake": { icon: Milk, iconColor: "text-pink-700", bgColor: "bg-pink-100" },
  smoothies: { icon: Apple, iconColor: "text-lime-700", bgColor: "bg-lime-100" },
  yougert: { icon: Droplets, iconColor: "text-teal-700", bgColor: "bg-teal-100" },
  cans: { icon: Package, iconColor: "text-slate-700", bgColor: "bg-slate-100" },
  mocktails: { icon: Wine, iconColor: "text-rose-700", bgColor: "bg-rose-100" },
  indomy: { icon: Utensils, iconColor: "text-red-700", bgColor: "bg-red-100" },
  "boba-drinks": { icon: Sparkles, iconColor: "text-purple-700", bgColor: "bg-purple-100" },
  additions: { icon: Plus, iconColor: "text-slate-700", bgColor: "bg-slate-200" },
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
  const [showCustomerResults, setShowCustomerResults] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [customerTab, setCustomerTab] = useState<"search" | "staff">("search");

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
    queryKey: ["customers", "search", customerSearchQuery],
    enabled: customerSearchQuery.length > 1,
    queryFn: async () => {
      const response = await api.get("/customers", { params: { name: customerSearchQuery, page: 1, limit: 10 } });
      return response.data.data as Paginated<Customer>;
    },
  });

  const staffQuery = useQuery({
    queryKey: ["customers", "staff-list"],
    queryFn: async () => {
      const response = await api.get("/customers", { params: { customerType: "staff,owner_discount", limit: 50 } });
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

  const cartTotal = useMemo(() => cart.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0), [cart]);
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
      return [...prev, { productId: product.id, productName: product.name, unitPrice: Number(product.price), quantity: 1 }];
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
      className="flex h-[calc(100vh-100px)] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"
      dir="rtl"
    >

      {/* ══════════════════════════════
          SIDEBAR — Categories
      ══════════════════════════════ */}
      <aside className="w-16 lg:w-60 border-l border-slate-100 flex flex-col bg-white shrink-0">
        {/* Header */}
        <div className="h-16 px-3 lg:px-4 flex items-center border-b border-slate-100">
          <Link
            href="/dashboard/barista"
            className="flex items-center gap-2 text-slate-400 hover:text-slate-800 transition-colors"
          >
            <ChevronRight size={18} />
            <span className="hidden lg:inline text-sm font-bold">رجوع</span>
          </Link>
        </div>

        {/* Favourites toggle */}
        <div className="px-2 lg:px-3 pt-3 pb-2">
          <button
            onClick={() => setShowFavorites(!showFavorites)}
            className={clsx(
              "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all text-sm font-bold",
              showFavorites
                ? "bg-rose-50 text-rose-600"
                : "text-slate-500 hover:bg-slate-50 hover:text-slate-800"
            )}
          >
            <Heart size={18} className={showFavorites ? "fill-rose-500 text-rose-500" : ""} />
            <span className="hidden lg:inline">المفضلة</span>
          </button>
        </div>

        <div className="mx-3 h-px bg-slate-100" />

        {/* Category nav */}
        <nav className="flex-1 overflow-y-auto px-2 lg:px-3 py-3 space-y-0.5">
          {categories.map((cat) => {
            const meta = getCategoryMeta(cat);
            const IconComp = meta.icon;
            const isActive = selectedCategory === cat && !showFavorites;
            return (
              <button
                key={cat}
                onClick={() => { setSelectedCategory(cat); setShowFavorites(false); }}
                className={clsx(
                  "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all text-sm font-bold",
                  isActive
                    ? "bg-slate-900 text-white shadow-md"
                    : "text-slate-500 hover:bg-slate-50 hover:text-slate-800"
                )}
              >
                <span
                  className={clsx(
                    "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition-colors",
                    isActive ? "bg-white/15 text-white" : `${meta.bgColor} ${meta.iconColor}`
                  )}
                >
                  <IconComp size={16} />
                </span>
                <span className="hidden lg:inline truncate">
                  {cat === "all" ? "كل الأصناف" : translateProductCategory(cat)}
                </span>
              </button>
            );
          })}
        </nav>
      </aside>

      {/* ══════════════════════════════
          CENTER — Product Grid
      ══════════════════════════════ */}
      <main className="flex-1 flex flex-col min-w-0 bg-slate-50/60">
        {/* Search header */}
        <header className="h-16 px-5 flex items-center gap-3 border-b border-slate-100 bg-white/80 backdrop-blur-sm shrink-0">
          <div className="relative flex-1 max-w-sm">
            <Search size={15} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            <input
              type="text"
              placeholder="ابحث عن صنف..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-10 pr-9 pl-4 rounded-xl bg-slate-100 border-none text-sm focus:outline-none focus:bg-white focus:ring-2 focus:ring-slate-900/10 transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X size={13} />
              </button>
            )}
          </div>

          <button
            onClick={() => queryClient.invalidateQueries({ queryKey: ["products", "pos"] })}
            className="h-10 w-10 flex items-center justify-center rounded-xl text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors"
            title="تحديث"
          >
            <RefreshCw size={17} />
          </button>
        </header>

        {/* Toast */}
        {message && (
          <div className={clsx(
            "mx-5 mt-4 flex items-center gap-3 rounded-2xl border px-4 py-3 text-sm font-bold shrink-0",
            message.type === "success"
              ? "bg-emerald-50 border-emerald-200 text-emerald-700"
              : "bg-red-50 border-red-200 text-red-700"
          )}>
            <CheckCircle2 size={17} />
            {message.text}
          </div>
        )}

        {/* Products */}
        <div className="flex-1 overflow-y-auto px-5 py-5 space-y-8">
          {productsQuery.isLoading ? (
            <div className="h-64 flex items-center justify-center text-slate-400 text-sm">جاري التحميل...</div>
          ) : grouped.length === 0 ? (
            <div className="h-64 flex flex-col items-center justify-center text-slate-400 gap-3">
              <Search size={32} className="opacity-30" />
              <p className="text-sm">لا توجد نتائج</p>
            </div>
          ) : (
            grouped.map(([cat, items]) => {
              const meta = getCategoryMeta(cat);
              const IconComp = meta.icon;
              return (
                <section key={cat}>
                  {/* Section title */}
                  <div className="flex items-center gap-2.5 mb-4">
                    <span className={clsx("flex h-7 w-7 items-center justify-center rounded-lg", meta.bgColor, meta.iconColor)}>
                      <IconComp size={14} />
                    </span>
                    <h2 className="text-sm font-black text-slate-700 tracking-wide">
                      {translateProductCategory(cat)}
                    </h2>
                    <span className="text-xs font-bold text-slate-400 bg-slate-100 rounded-full px-2 py-0.5">
                      {items.length}
                    </span>
                    <div className="flex-1 h-px bg-slate-200/70" />
                  </div>

                  {/* Product cards */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
                    {items.map((product) => {
                      const inCart = cart.find((i) => i.productId === product.id);
                      const isFav = favorites.has(product.id);
                      return (
                        <div
                          key={product.id}
                          onClick={() => addToCart(product)}
                          className={clsx(
                            "group relative flex flex-col rounded-2xl bg-white border cursor-pointer select-none",
                            "transition-all duration-150 active:scale-[0.96]",
                            inCart
                              ? "border-slate-900 shadow-lg ring-1 ring-slate-900"
                              : "border-slate-200 hover:border-slate-300 hover:shadow-md hover:shadow-slate-100/80"
                          )}
                        >
                          {/* Favourite btn */}
                          <button
                            type="button"
                            onClick={(e) => { e.stopPropagation(); toggleFavorite(product.id); }}
                            className={clsx(
                              "absolute top-2 left-2 z-10 h-7 w-7 flex items-center justify-center rounded-lg transition-all",
                              isFav
                                ? "bg-rose-50 text-rose-500"
                                : "opacity-0 group-hover:opacity-100 bg-white text-slate-300 hover:text-rose-400 shadow-sm"
                            )}
                          >
                            <Heart size={13} className={isFav ? "fill-rose-500" : ""} />
                          </button>

                          {/* Cart quantity badge */}
                          {inCart && (
                            <div className="absolute -top-2.5 -right-2.5 z-10 h-7 w-7 flex items-center justify-center rounded-full bg-slate-900 text-white text-xs font-black ring-2 ring-white shadow-md">
                              {inCart.quantity}
                            </div>
                          )}

                          {/* Icon */}
                          <div className={clsx("mx-3 mt-3 flex h-11 w-11 items-center justify-center rounded-xl", meta.bgColor)}>
                            <span className={meta.iconColor}>
                              <IconComp size={20} />
                            </span>
                          </div>

                          {/* Name + price */}
                          <div className="px-3 pt-2 pb-3 flex flex-col gap-2 flex-1">
                            <p className="text-[13px] font-bold text-slate-800 leading-snug line-clamp-2">
                              {product.name}
                            </p>
                            <div className="mt-auto">
                              <span className={clsx(
                                "inline-block text-xs font-black px-2.5 py-1 rounded-lg",
                                inCart ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-700"
                              )}>
                                {money(Number(product.price))}
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </section>
              );
            })
          )}
        </div>
      </main>

      {/* ══════════════════════════════
          RIGHT PANEL — Cart
      ══════════════════════════════ */}
      <aside className="w-[22rem] shrink-0 border-r border-slate-100 flex flex-col bg-white">
        {/* Header */}
        <div className="h-16 px-5 flex items-center justify-between border-b border-slate-100 shrink-0">
          <div className="flex items-center gap-2.5">
            <ShoppingCart size={18} className="text-slate-700" />
            <span className="text-base font-black text-slate-900">الطلب</span>
            {cartCount > 0 && (
              <span className="flex h-6 min-w-[1.5rem] items-center justify-center rounded-full bg-slate-900 px-1.5 text-xs font-black text-white">
                {cartCount}
              </span>
            )}
          </div>
          {cart.length > 0 && (
            <button
              onClick={() => setCart([])}
              className="flex items-center gap-1.5 text-xs font-bold text-slate-400 hover:text-red-500 transition-colors"
            >
              <Trash2 size={13} />
              مسح الكل
            </button>
          )}
        </div>

        {/* Customer */}
        <div className="px-4 py-3 border-b border-slate-100 space-y-2.5 bg-slate-50/60 shrink-0">
          <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest">العميل / الجلسة</p>

          {!selectedCustomer ? (
            <div className="space-y-2">
              {/* Tabs */}
              <div className="flex bg-white rounded-xl p-1 border border-slate-100 shadow-sm">
                <button
                  onClick={() => setCustomerTab("search")}
                  className={clsx(
                    "flex-1 flex items-center justify-center gap-2 py-1.5 rounded-lg text-[10px] font-black transition-all",
                    customerTab === "search" ? "bg-slate-900 text-white" : "text-slate-400 hover:text-slate-600"
                  )}
                >
                  <Search size={12} />
                  بحث عن عميل
                </button>
                <button
                  onClick={() => setCustomerTab("staff")}
                  className={clsx(
                    "flex-1 flex items-center justify-center gap-2 py-1.5 rounded-lg text-[10px] font-black transition-all",
                    customerTab === "staff" ? "bg-slate-900 text-white" : "text-slate-400 hover:text-slate-600"
                  )}
                >
                  <Users size={12} />
                  قائمة الموظفين
                </button>
              </div>

              {customerTab === "search" ? (
                <div className="relative">
                  <Search size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                  <input
                    type="text"
                    placeholder="بحث باسم أو رقم..."
                    value={customerSearchQuery}
                    onChange={(e) => { setCustomerSearchQuery(e.target.value); setShowCustomerResults(true); }}
                    onFocus={() => setShowCustomerResults(true)}
                    className="w-full h-9 pr-8 pl-3 rounded-xl bg-white border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900/10 transition-all"
                  />
                  {showCustomerResults && customerSearchQuery.length > 1 && (
                    <div className="absolute top-full right-0 left-0 mt-1.5 bg-white rounded-xl shadow-2xl border border-slate-100 z-50 max-h-56 overflow-y-auto">
                      {customersQuery.isLoading ? (
                        <div className="p-4 text-center text-xs text-slate-400">جاري البحث...</div>
                      ) : customersQuery.data?.data?.length ? (
                        customersQuery.data.data.map((c) => (
                          <button
                            key={c.id}
                            onClick={() => { setSelectedCustomer(c); setCustomerSearchQuery(""); setShowCustomerResults(false); }}
                            className="w-full flex items-center gap-3 px-4 py-2.5 text-right hover:bg-slate-50 border-b border-slate-50 last:border-0 transition-colors"
                          >
                            <div className="h-8 w-8 shrink-0 rounded-lg bg-slate-100 flex items-center justify-center">
                              <User size={14} className="text-slate-500" />
                            </div>
                            <div className="min-w-0">
                              <p className="text-sm font-bold text-slate-900 truncate">{c.fullName || "بدون اسم"}</p>
                              <p className="text-xs text-slate-400">{c.phoneNumber}</p>
                            </div>
                          </button>
                        ))
                      ) : (
                        <div className="p-4 text-center text-xs text-slate-400">لا توجد نتائج</div>
                      )}
                    </div>
                  )}
                </div>
              ) : (
                <div className="max-h-48 overflow-y-auto space-y-1 pr-1 custom-scrollbar">
                  {staffQuery.isLoading ? (
                    <div className="py-8 flex flex-col items-center gap-2">
                      <RefreshCw className="animate-spin text-slate-300" size={24} />
                      <p className="text-[10px] text-slate-400 font-bold">جاري تحميل القائمة...</p>
                    </div>
                  ) : staffQuery.data?.data?.length ? (
                    staffQuery.data.data.map((staff) => (
                      <button
                        key={staff.id}
                        onClick={() => setSelectedCustomer(staff)}
                        className="w-full flex items-center gap-3 px-3 py-2 rounded-xl bg-white border border-slate-100 hover:border-slate-300 hover:bg-slate-50 transition-all text-right shadow-sm group"
                      >
                        <div className={clsx(
                          "h-8 w-8 shrink-0 rounded-lg flex items-center justify-center transition-colors",
                          staff.customerType === 'owner_discount' ? "bg-amber-100 text-amber-600" : "bg-blue-100 text-blue-600"
                        )}>
                          {staff.customerType === 'owner_discount' ? <Sparkles size={14} /> : <User size={14} />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-black text-slate-900 truncate">{staff.fullName}</p>
                          <p className="text-[10px] text-slate-400 font-bold">
                            {staff.customerType === 'owner_discount' ? 'مالك (70%)' : 'موظف (50%)'}
                          </p>
                        </div>
                      </button>
                    ))
                  ) : (
                    <div className="py-8 text-center text-[10px] text-slate-400 font-bold bg-white rounded-xl border border-dashed border-slate-200">
                      لا يوجد موظفين مسجلين حالياً
                    </div>
                  )}
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-3 p-2.5 rounded-xl bg-slate-900 text-white">
              <div className="h-9 w-9 shrink-0 rounded-lg bg-white/10 flex items-center justify-center">
                <User size={16} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold truncate">{selectedCustomer.fullName || "ضيف"}</p>
                <p className="text-[11px] text-white/50 truncate">{selectedCustomer.phoneNumber || "بدون رقم"}</p>
              </div>
              <button onClick={() => setSelectedCustomer(null)} className="shrink-0 p-1 rounded-lg hover:bg-white/10 transition-colors">
                <X size={15} />
              </button>
            </div>
          )}

          {/* Session select */}
          <div className="flex items-center gap-2 px-1">
            <Users size={13} className="text-slate-400 shrink-0" />
            <select
              className="flex-1 bg-transparent border-none text-xs font-bold text-slate-600 focus:outline-none focus:ring-0 p-0 cursor-pointer"
              onChange={(e) => {
                const session = activeSessionsQuery.data?.data?.find((s) => s.id === e.target.value);
                setSessionId(e.target.value);
                if (session?.customer) setSelectedCustomer(session.customer as any);
              }}
              value={sessionId}
            >
              <option value="">بدون جلسة محددة</option>
              {activeSessionsQuery.data?.data?.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.customer?.fullName || s.id.slice(0, 8)}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Cart items */}
        <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2">
          {cart.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-slate-300 gap-3 py-10">
              <Receipt size={36} strokeWidth={1.5} />
              <p className="text-sm font-medium text-slate-400">أضف أصناف للطلب</p>
            </div>
          ) : (
            cart.map((item) => (
              <div
                key={item.productId}
                className="flex items-center gap-3 rounded-xl border border-slate-100 bg-slate-50 px-3 py-2.5 hover:border-slate-200 transition-colors"
              >
                {/* Name + unit price */}
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] font-bold text-slate-800 truncate">{item.productName}</p>
                  <p className="text-xs text-slate-400 mt-0.5">{money(item.unitPrice)}</p>
                </div>

                {/* Qty stepper */}
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    onClick={() => updateQuantity(item.productId, -1)}
                    className="h-7 w-7 flex items-center justify-center rounded-lg bg-white border border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-100 transition-colors"
                  >
                    <Minus size={12} />
                  </button>
                  <span className="w-6 text-center text-sm font-black text-slate-900">{item.quantity}</span>
                  <button
                    onClick={() => updateQuantity(item.productId, 1)}
                    className="h-7 w-7 flex items-center justify-center rounded-lg bg-slate-900 text-white hover:bg-slate-700 transition-colors"
                  >
                    <Plus size={12} />
                  </button>
                </div>

                {/* Line total */}
                <span className="text-xs font-black text-slate-700 shrink-0 w-12 text-left">
                  {money(item.unitPrice * item.quantity)}
                </span>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="px-4 pb-4 pt-3 border-t border-slate-100 space-y-3 bg-white shrink-0">
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="ملاحظات على الطلب..."
            rows={2}
            className="w-full resize-none px-3 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-300 transition-all"
          />

          <div className="flex items-center justify-between px-1">
            <span className="text-sm font-bold text-slate-500">الإجمالي</span>
            <span className="text-2xl font-black text-slate-900">{money(cartTotal)}</span>
          </div>

          <button
            onClick={() => setShowConfirm(true)}
            disabled={cart.length === 0 || (!selectedCustomer && !sessionId)}
            className={clsx(
              "w-full h-12 rounded-2xl flex items-center justify-center gap-2.5 text-base font-black transition-all",
              cart.length > 0 && (selectedCustomer || sessionId)
                ? "bg-slate-900 text-white shadow-lg shadow-slate-200 hover:bg-slate-800 active:scale-[0.98]"
                : "bg-slate-100 text-slate-400 cursor-not-allowed"
            )}
          >
            <CheckCircle2 size={18} />
            مراجعة وتأكيد
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
                      <span className="font-black text-slate-900">{money(item.unitPrice * item.quantity)}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Summary */}
              <div className="rounded-2xl border border-slate-200 p-4 space-y-2.5">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">العميل</span>
                  <span className="font-bold text-slate-900">{selectedCustomer?.fullName || "ضيف"}</span>
                </div>
                {notes && (
                  <div className="flex justify-between text-sm gap-4">
                    <span className="text-slate-500 shrink-0">ملاحظات</span>
                    <span className="font-bold text-slate-900 text-left">{notes}</span>
                  </div>
                )}
                <div className="h-px bg-slate-100" />
                <div className="flex justify-between items-center">
                  <span className="text-base font-bold text-slate-500">الإجمالي</span>
                  <span className="text-2xl font-black text-slate-900">{money(cartTotal)}</span>
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
