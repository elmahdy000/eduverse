"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ShoppingCart,
  Plus,
  Minus,
  Trash2,
  CheckCircle2,
  Clock,
  RefreshCw,
  Coffee,
  Receipt,
  Search,
  X,
  Zap,
  Star,
  Flame,
  IceCream,
  Cookie,
  Sandwich,
  Martini,
  Utensils,
  Heart,
  TrendingUp,
  Sparkles,
  Clock4,
  ArrowRight,
} from "lucide-react";
import Link from "next/link";
import { api } from "@/lib/api";
import { money } from "@/lib/format";
import { translateApiError } from "@/lib/errors";
import type { BarOrder, Customer, Paginated, Product, Session } from "@/lib/types";
import { Alert, Badge, Panel, SectionTitle } from "@/components/ui";
import clsx from "clsx";

interface CartItem {
  productId: string;
  productName: string;
  unitPrice: number;
  quantity: number;
}

const categoryIcons: Record<string, React.ReactNode> = {
  coffee: <Coffee size={20} />,
  tea: <Utensils size={20} />,
  juice: <Martini size={20} />,
  snack: <Cookie size={20} />,
  sandwich: <Sandwich size={20} />,
  dessert: <IceCream size={20} />,
  all: <Star size={20} />,
};

const categoryColors: Record<string, string> = {
  coffee: "bg-amber-100 text-amber-700 border-amber-200",
  tea: "bg-emerald-100 text-emerald-700 border-emerald-200",
  juice: "bg-rose-100 text-rose-700 border-rose-200",
  snack: "bg-orange-100 text-orange-700 border-orange-200",
  sandwich: "bg-blue-100 text-blue-700 border-blue-200",
  dessert: "bg-pink-100 text-pink-700 border-pink-200",
  all: "bg-slate-100 text-slate-700 border-slate-200",
};

const FAVORITES_KEY = "barista_favorites";

export default function BaristaPOSPage() {
  const queryClient = useQueryClient();

  const [sessionId, setSessionId] = useState("");
  const [customerId, setCustomerId] = useState("");
  const [notes, setNotes] = useState("");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [showCustomerSearch, setShowCustomerSearch] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [showFavorites, setShowFavorites] = useState(false);

  // Load favorites from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem(FAVORITES_KEY);
    if (stored) {
      try {
        setFavorites(new Set(JSON.parse(stored)));
      } catch (e) {
        console.error("Failed to load favorites", e);
      }
    }
  }, []);

  // Save favorites to localStorage whenever they change (debounced)
  const prevFavoritesRef = useRef<Set<string>>(new Set());
  useEffect(() => {
    const currentArray = Array.from(favorites);
    const prevArray = Array.from(prevFavoritesRef.current);

    // Only save if favorites actually changed
    if (JSON.stringify(currentArray) !== JSON.stringify(prevArray)) {
      localStorage.setItem(FAVORITES_KEY, JSON.stringify(currentArray));
      prevFavoritesRef.current = new Set(favorites);
    }
  }, [favorites]);

  const productsQuery = useQuery({
    queryKey: ["products", "pos"],
    queryFn: async () => {
      const response = await api.get("/products", { params: { page: 1, limit: 100, active: true, availability: true } });
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
    queryKey: ["customers", "list"],
    queryFn: async () => {
      const response = await api.get("/customers", { params: { page: 1, limit: 50, status: "active" } });
      return response.data.data as Paginated<Customer>;
    },
  });

  const recentOrdersQuery = useQuery({
    queryKey: ["bar-orders", "recent"],
    queryFn: async () => {
      const response = await api.get("/bar-orders", { params: { page: 1, limit: 10, status: "new,in_preparation,ready" } });
      return response.data.data as Paginated<BarOrder>;
    },
    refetchInterval: 30000,
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      const items = cart.map((item) => ({
        productId: item.productId,
        quantity: item.quantity,
      }));
      await api.post("/bar-orders", {
        sessionId: sessionId || undefined,
        customerId: selectedCustomer?.id || customerId || undefined,
        items,
        notes: notes || undefined,
      });
    },
    onSuccess: () => {
      setCart([]);
      setSessionId("");
      setCustomerId("");
      setNotes("");
      setSelectedCustomer(null);
      setMessage({ type: "success", text: "تم تسجيل الطلب بنجاح! ✓" });
      queryClient.invalidateQueries({ queryKey: ["bar-orders", "recent"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard", "barista"] });
      setTimeout(() => setMessage(null), 3000);
    },
    onError: (error: unknown) => {
      const apiMessage =
        (error as { response?: { data?: { message?: string | string[] } } })?.response?.data?.message;
      setMessage({ type: "error", text: translateApiError(apiMessage) });
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      await api.put(`/bar-orders/${id}/status`, { status });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bar-orders", "recent"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard", "barista"] });
    },
  });

  const cartTotal = useMemo(() => cart.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0), [cart]);

  const products = productsQuery.data?.data ?? [];

  const categories = useMemo(() => {
    const cats = new Set(products.map((p) => p.category));
    return ["all", ...Array.from(cats)];
  }, [products]);

  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = { all: products.length };
    products.forEach((p) => {
      counts[p.category] = (counts[p.category] || 0) + 1;
    });
    return counts;
  }, [products]);

  const filteredProducts = useMemo(() => {
    let result = products;
    if (showFavorites) {
      result = result.filter((p) => favorites.has(p.id));
    }
    if (selectedCategory !== "all") {
      result = result.filter((p) => p.category === selectedCategory);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter((p) => p.name.toLowerCase().includes(q));
    }
    return result;
  }, [products, selectedCategory, searchQuery, favorites, showFavorites]);

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
    // Add to favorites when added to cart
    setFavorites((prev) => new Set([...prev, product.id]));
  }, []);

  const toggleFavorite = useCallback((productId: string) => {
    setFavorites((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(productId)) {
        newSet.delete(productId);
      } else {
        newSet.add(productId);
      }
      return newSet;
    });
  }, []);

  const quickAddFavorite = useCallback((productId: string) => {
    const product = products.find((p) => p.id === productId);
    if (product) {
      addToCart(product);
    }
  }, [products, addToCart]);

  const updateQuantity = useCallback((productId: string, delta: number) => {
    setCart((prev) => {
      const updated = prev.map((item) =>
        item.productId === productId ? { ...item, quantity: Math.max(0, item.quantity + delta) } : item
      );
      return updated.filter((item) => item.quantity > 0);
    });
  }, []);

  const removeFromCart = useCallback((productId: string) => {
    setCart((prev) => prev.filter((item) => item.productId !== productId));
  }, []);

  const clearCart = useCallback(() => {
    setCart([]);
    setSessionId("");
    setCustomerId("");
    setNotes("");
    setSelectedCustomer(null);
  }, []);

  const submitOrder = () => {
    if (cart.length === 0) return;
    if (!selectedCustomer?.id && !sessionId) {
      setMessage({ type: "error", text: "يجب اختيار عميل أو مدة قبل إنشاء الطلب" });
      setTimeout(() => setMessage(null), 3000);
      return;
    }
    setMessage(null);
    createMutation.mutate();
  };

  return (
    <div className="space-y-5">
      <SectionTitle
        title="نقطة البيع - الباريستا"
        subtitle="أنشئ طلبات سريع"
        icon={<Coffee size={20} />}
        action={
          <div className="flex items-center gap-2">
            <Link
              href="/dashboard/barista"
              className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 transition hover:bg-slate-50"
            >
              <ArrowRight size={12} /> لوحة الباريستا
            </Link>
            <button
              onClick={() => {
                queryClient.invalidateQueries({ queryKey: ["products", "pos"] });
                queryClient.invalidateQueries({ queryKey: ["bar-orders", "recent"] });
              }}
              className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 transition hover:bg-slate-50"
            >
              <RefreshCw size={12} /> تحديث
            </button>
          </div>
        }
      />

      {message && (
        <Alert tone={message.type === "success" ? "success" : "danger"}>
          {message.text}
        </Alert>
      )}

      <div className="grid gap-5 lg:grid-cols-3">
        {/* Product Grid */}
        <div className="lg:col-span-2 space-y-4">
          {/* Quick Stats */}
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-xl border border-slate-200 bg-gradient-to-br from-slate-50 to-white p-4">
              <div className="flex items-center gap-2 text-slate-500">
                <TrendingUp size={16} />
                <span className="text-xs">إجمالي الطلبات</span>
              </div>
              <p className="mt-2 text-2xl font-bold text-slate-900">{recentOrdersQuery.data?.total ?? 0}</p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-gradient-to-br from-amber-50 to-white p-4">
              <div className="flex items-center gap-2 text-amber-600">
                <Clock4 size={16} />
                <span className="text-xs">قيد التحضير</span>
              </div>
              <p className="mt-2 text-2xl font-bold text-amber-700">
                {recentOrdersQuery.data?.data?.filter(o => o.status === 'in_preparation').length ?? 0}
              </p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-gradient-to-br from-emerald-50 to-white p-4">
              <div className="flex items-center gap-2 text-emerald-600">
                <Sparkles size={16} />
                <span className="text-xs">المفضلة</span>
              </div>
              <p className="mt-2 text-2xl font-bold text-emerald-700">{favorites.size}</p>
            </div>
          </div>

          <Panel>
            {/* Search & Categories */}
            <div className="mb-4 space-y-3">
              <div className="relative">
                <Search size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="ابحث عن منتج..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 py-2 pr-10 text-sm"
                />
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setShowFavorites(!showFavorites)}
                  className={clsx(
                    "flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition",
                    showFavorites
                      ? "bg-rose-100 text-rose-700 border-rose-300"
                      : "border-slate-200 text-slate-600 hover:bg-slate-50"
                  )}
                >
                  <Heart size={14} className={showFavorites ? "fill-current" : ""} />
                  <span>المفضلة</span>
                  {favorites.size > 0 && (
                    <span className="rounded-full bg-rose-200 px-1.5 py-0.5 text-[10px] font-bold text-rose-800">
                      {favorites.size}
                    </span>
                  )}
                </button>
                {categories.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={clsx(
                      "flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition",
                      selectedCategory === cat
                        ? "bg-slate-900 text-white border-slate-900"
                        : `border-slate-200 text-slate-600 hover:bg-slate-50 ${categoryColors[cat] || categoryColors.all}`
                    )}
                  >
                    {categoryIcons[cat] || categoryIcons.all}
                    <span>{cat === "all" ? "الكل" : cat}</span>
                    <span className="rounded-full bg-white/20 px-1.5 py-0.5 text-[10px] font-bold">
                      {categoryCounts[cat] || 0}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {productsQuery.isLoading ? (
              <div className="flex items-center justify-center py-10">
                <RefreshCw size={24} className="animate-spin text-slate-400" />
              </div>
            ) : filteredProducts.length === 0 ? (
              <div className="text-center py-10 text-slate-500">مفيش منتجات متاحة</div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {filteredProducts.map((product) => (
                  <button
                    key={product.id}
                    onClick={() => addToCart(product)}
                    className={clsx(
                      "group relative rounded-xl border bg-white p-4 text-right transition-all duration-200",
                      favorites.has(product.id) ? "border-rose-200 bg-rose-50/30" : "border-slate-200",
                      "hover:border-slate-300 hover:shadow-lg hover:shadow-slate-200/50 hover:-translate-y-1"
                    )}
                  >
                    {favorites.has(product.id) && (
                      <div className="absolute top-0 right-0 w-8 h-8 bg-rose-500 rounded-bl-xl rounded-tr-xl flex items-center justify-center">
                        <Heart size={12} className="text-white fill-current" />
                      </div>
                    )}
                    <div
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleFavorite(product.id);
                      }}
                      className={clsx(
                        "absolute top-2 right-2 flex h-7 w-7 items-center justify-center rounded-full backdrop-blur-sm border transition z-10 cursor-pointer",
                        favorites.has(product.id)
                          ? "bg-white/90 text-rose-500 border-rose-300"
                          : "bg-white/80 text-slate-400 border-slate-200 hover:text-rose-500 hover:border-rose-300"
                      )}
                    >
                      <Heart size={14} className={favorites.has(product.id) ? "fill-current" : ""} />
                    </div>
                    <div className={clsx(
                      "mb-3 flex h-14 w-14 items-center justify-center rounded-xl shadow-sm",
                      categoryColors[product.category]?.split(' ')[0] || "bg-slate-100"
                    )}>
                      {categoryIcons[product.category] || <Coffee size={24} className="text-slate-600" />}
                    </div>
                    <p className="text-sm font-semibold text-slate-900 line-clamp-2">{product.name}</p>
                    <p className="mt-2 text-lg font-bold text-slate-900">{money(Number(product.price))}</p>
                    <div className="mt-3 flex items-center justify-center rounded-lg bg-gradient-to-r from-slate-900 to-slate-800 px-3 py-2 opacity-0 transition-all duration-200 group-hover:opacity-100 shadow-lg">
                      <Plus size={16} className="text-white" />
                      <span className="mr-1 text-xs font-medium text-white">ضيف للسلة</span>
                    </div>
                    {cart.find((item) => item.productId === product.id) && (
                      <div className="absolute top-2 left-2 flex h-7 w-7 items-center justify-center rounded-full bg-emerald-600 text-white text-xs font-bold shadow-lg animate-bounce">
                        {cart.find((item) => item.productId === product.id)?.quantity}
                      </div>
                    )}
                  </button>
                ))}
              </div>
            )}
          </Panel>
        </div>

        {/* Cart & Order Form */}
        <div className="space-y-4">
          <Panel className="sticky top-4">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                <ShoppingCart size={16} />
                السلة
                {cart.length > 0 && (
                  <span className="rounded-full bg-slate-900 px-2 py-0.5 text-[10px] font-bold text-white">
                    {cart.reduce((s, i) => s + i.quantity, 0)}
                  </span>
                )}
              </h3>
              {cart.length > 0 && (
                <button onClick={clearCart} className="text-xs text-rose-600 hover:underline flex items-center gap-1">
                  <Trash2 size={12} /> مسح الكل
                </button>
              )}
            </div>

            {cart.length === 0 ? (
              <div className="py-8 text-center">
                <ShoppingCart size={32} className="mx-auto mb-2 text-slate-300" />
                <p className="text-sm text-slate-500">السلة فاضية</p>
                <p className="text-xs text-slate-400">اضغط على منتج للإضافة</p>
              </div>
            ) : (
              <div className="space-y-3">
                {cart.map((item) => (
                  <div key={item.productId} className="flex items-center justify-between rounded-lg border border-slate-100 p-3">
                    <div className="flex-1 text-right">
                      <p className="text-sm font-medium text-slate-900">{item.productName}</p>
                      <p className="text-xs text-slate-500">{money(item.unitPrice)}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => updateQuantity(item.productId, -1)}
                        className="flex h-7 w-7 items-center justify-center rounded-lg border border-slate-200 text-slate-600 transition hover:bg-slate-50"
                      >
                        <Minus size={12} />
                      </button>
                      <span className="w-8 text-center text-sm font-bold">{item.quantity}</span>
                      <button
                        onClick={() => updateQuantity(item.productId, 1)}
                        className="flex h-7 w-7 items-center justify-center rounded-lg border border-slate-200 text-slate-600 transition hover:bg-slate-50"
                      >
                        <Plus size={12} />
                      </button>
                      <button
                        onClick={() => removeFromCart(item.productId)}
                        className="flex h-7 w-7 items-center justify-center rounded-lg border border-rose-200 text-rose-600 transition hover:bg-rose-50"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </div>
                ))}

                <div className="border-t border-slate-200 pt-3">
                  <div className="mb-4 space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-slate-600">عدد المنتجات</span>
                      <span className="font-bold text-slate-900">{cart.reduce((s, i) => s + i.quantity, 0)}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-slate-600">الإجمالي</span>
                      <span className="text-2xl font-bold text-slate-900">{money(cartTotal)}</span>
                    </div>
                  </div>

                  {/* Quick Customer Selection */}
                  {showCustomerSearch && customersQuery.data ? (
                    <div className="mb-2 rounded-lg border border-slate-200 p-2">
                      <div className="mb-2 flex items-center justify-between">
                        <span className="text-xs font-medium text-slate-600">اختر عميل</span>
                        <button onClick={() => setShowCustomerSearch(false)} className="text-slate-400 hover:text-slate-600">
                          <X size={14} />
                        </button>
                      </div>
                      <div className="max-h-32 space-y-1 overflow-y-auto">
                        {customersQuery.data.data.map((customer) => (
                          <button
                            key={customer.id}
                            onClick={() => {
                              setSelectedCustomer(customer);
                              setCustomerId(customer.id);
                              setShowCustomerSearch(false);
                            }}
                            className={`w-full rounded px-2 py-1.5 text-right text-sm transition ${
                              selectedCustomer?.id === customer.id
                                ? "bg-slate-900 text-white"
                                : "text-slate-700 hover:bg-slate-50"
                            }`}
                          >
                            {customer.fullName || customer.phoneNumber}
                          </button>
                        ))}
                      </div>
                    </div>
                  ) : selectedCustomer ? (
                    <div className="mb-2 flex items-center justify-between rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2">
                      <div className="text-right">
                        <p className="text-sm font-medium text-emerald-700">{selectedCustomer.fullName}</p>
                        <p className="text-xs text-emerald-600">{selectedCustomer.phoneNumber}</p>
                      </div>
                      <button
                        onClick={() => {
                          setSelectedCustomer(null);
                          setCustomerId("");
                        }}
                        className="text-emerald-600 hover:text-emerald-800"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setShowCustomerSearch(true)}
                      className="mb-2 w-full rounded-lg border border-dashed border-slate-300 px-3 py-2 text-sm text-slate-500 transition hover:border-slate-400"
                    >
                      + اختيار عميل (اختياري)
                    </button>
                  )}

                  <select
                    value={sessionId}
                    onChange={(e) => {
                      setSessionId(e.target.value);
                      if (e.target.value) {
                        const session = activeSessionsQuery.data?.data?.find((s) => s.id === e.target.value);
                        if (session?.customerId) {
                          setCustomerId(session.customerId);
                          customersQuery.data?.data?.forEach((c) => {
                            if (c.id === session.customerId) setSelectedCustomer(c);
                          });
                        }
                      }
                    }}
                    className="mb-2 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                  >
                    <option value="">اختار مدة (اختياري)</option>
                    {activeSessionsQuery.data?.data?.map((session) => (
                      <option key={session.id} value={session.id}>
                        #{session.id.slice(0, 8)} - {session.customer?.fullName ?? "بدون اسم"}
                      </option>
                    ))}
                  </select>

                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="ملاحظات خاصة بالطلب..."
                    className="mb-3 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                    rows={2}
                  />

                  <button
                    onClick={submitOrder}
                    disabled={createMutation.isPending || cart.length === 0}
                    className={clsx(
                      "flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-bold text-white transition-all duration-200",
                      "bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-700 hover:to-emerald-600",
                      "shadow-lg hover:shadow-xl hover:shadow-emerald-200/50",
                      "disabled:cursor-not-allowed disabled:opacity-60 disabled:shadow-none"
                    )}
                  >
                    {createMutation.isPending ? (
                      <>
                        <RefreshCw size={16} className="animate-spin" />
                        جاري التسجيل...
                      </>
                    ) : (
                      <>
                        <Receipt size={16} />
                        تسجيل الطلب ({cart.reduce((s, i) => s + i.quantity, 0)} منتج)
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}
          </Panel>

          {/* Recent Orders Queue */}
          <Panel>
            <div className="mb-3 flex items-center justify-between">
              <h3 className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                <Clock size={16} />
                طابور الطلبات
              </h3>
              <span className="text-xs text-slate-400">
                {recentOrdersQuery.data?.total ?? 0} طلب
              </span>
            </div>

            {recentOrdersQuery.isLoading ? (
              <div className="flex items-center justify-center py-4">
                <RefreshCw size={16} className="animate-spin text-slate-400" />
              </div>
            ) : recentOrdersQuery.data?.data?.length === 0 ? (
              <div className="py-8 text-center">
                <Clock size={32} className="mx-auto mb-2 text-slate-300" />
                <p className="text-sm text-slate-500">مفيش طلبات في الطابور</p>
                <p className="text-xs text-slate-400">ORDER QUEUE EMPTY</p>
              </div>
            ) : (
              <div className="space-y-2">
                {recentOrdersQuery.data?.data?.slice(0, 6).map((order) => (
                  <div
                    key={order.id}
                    className={`rounded-xl border p-3 text-right transition ${
                      order.status === "new"
                        ? "border-blue-200 bg-blue-50/50"
                        : order.status === "in_preparation"
                        ? "border-amber-200 bg-amber-50/50"
                        : order.status === "ready"
                        ? "border-emerald-200 bg-emerald-50/50"
                        : "border-slate-100"
                    }`}
                  >
                    <div className="mb-2 flex items-start justify-between">
                      <div>
                        <p className="text-sm font-bold text-slate-900">
                          #{order.id.slice(0, 6)}
                        </p>
                        <p className="text-xs text-slate-500">
                          {order.customer?.fullName || "ضيف"}
                        </p>
                      </div>
                      <Badge
                        tone={
                          order.status === "new"
                            ? "info"
                            : order.status === "in_preparation"
                            ? "warn"
                            : order.status === "ready"
                            ? "success"
                            : "neutral"
                        }
                      >
                        {order.status === "new"
                          ? "🆕 جديد"
                          : order.status === "in_preparation"
                          ? "🔥 بيتجهز"
                          : order.status === "ready"
                          ? "✅ جاهز"
                          : order.status}
                      </Badge>
                    </div>
                    <div className="mb-2 flex flex-wrap gap-1">
                      {order.items?.slice(0, 3).map((item, idx) => (
                        <span
                          key={idx}
                          className="rounded bg-white px-1.5 py-0.5 text-[10px] font-medium text-slate-600"
                        >
                          {item.product?.name} x{item.quantity}
                        </span>
                      ))}
                      {(order.items?.length ?? 0) > 3 && (
                        <span className="text-[10px] text-slate-400">
                          +{order.items!.length - 3} more
                        </span>
                      )}
                    </div>
                    <div className="flex gap-1">
                      {order.status === "new" && (
                        <button
                          onClick={() =>
                            updateStatusMutation.mutate({
                              id: order.id,
                              status: "in_preparation",
                            })
                          }
                          className="flex-1 rounded-lg bg-amber-500 py-1.5 text-xs font-bold text-white transition hover:bg-amber-600"
                        >
                          🔥 ابدأ تجهيز
                        </button>
                      )}
                      {order.status === "in_preparation" && (
                        <button
                          onClick={() =>
                            updateStatusMutation.mutate({ id: order.id, status: "ready" })
                          }
                          className="flex-1 rounded-lg bg-emerald-600 py-1.5 text-xs font-bold text-white transition hover:bg-emerald-700"
                        >
                          ✅ جاهز للاستلام
                        </button>
                      )}
                      {order.status === "ready" && (
                        <button
                          onClick={() =>
                            updateStatusMutation.mutate({
                              id: order.id,
                              status: "delivered",
                            })
                          }
                          className="flex-1 rounded-lg bg-blue-600 py-1.5 text-xs font-bold text-white transition hover:bg-blue-700"
                        >
                          📦 سلّم للعميل
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Panel>
        </div>
      </div>
    </div>
  );
}
