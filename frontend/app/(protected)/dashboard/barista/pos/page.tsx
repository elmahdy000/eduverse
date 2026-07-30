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
  QrCode,
} from "lucide-react";
import Link from "next/link";
import { api } from "@/lib/api";
import { money } from "@/lib/format";
import { translateApiError } from "@/lib/errors";
import { translateProductCategory, translateProductName, normalizeCategoryKey } from "@/lib/labels";
import type { Customer, Paginated, Product, Session } from "@/lib/types";
import { useBarOrderSocket } from "@/lib/useBarOrderSocket";
import { CardSkeleton } from "@/components/ui";
import clsx from "clsx";

interface CartItem {
  productId: string;
  productName: string;
  unitPrice: number;
  costPrice: number;
  category: string;
  quantity: number;
  isFridge?: boolean;
  isBakery?: boolean;
}

// التصنيفات المستثناة من الخصم — لازم تطابق الباك اند (bar-orders.service.ts NON_DISCOUNTED_CATEGORIES)
const NON_DISCOUNTED_CATEGORIES = ['cans', 'can', 'water', 'juice'];

function isNonDiscountedProduct(item: { productName: string; category: string; isFridge?: boolean; isBakery?: boolean }) {
  if (item.isFridge || item.isBakery) {
    return true;
  }

  const nameLower = item.productName?.toLowerCase() || '';
  const categoryLower = item.category?.toLowerCase() || '';

  // التصنيف الصريح (يطابق الباك اند) — يشمل juice
  if (NON_DISCOUNTED_CATEGORIES.includes(categoryLower)) {
    return true;
  }

  // 1. Water
  if (
    categoryLower.includes('water') ||
    nameLower.includes('مياه') ||
    nameLower.includes('مياة') ||
    nameLower.includes('ماء') ||
    nameLower.includes('water')
  ) {
    return true;
  }

  // 2. Canned / Packed / Cold Cans
  if (
    categoryLower.includes('cans') ||
    categoryLower.includes('can') ||
    nameLower.includes('بيبسي') ||
    nameLower.includes('pepsi') ||
    nameLower.includes('كولا') ||
    nameLower.includes('cola') ||
    nameLower.includes('سفن') ||
    nameLower.includes('seven') ||
    nameLower.includes('سبرايت') ||
    nameLower.includes('sprite') ||
    nameLower.includes('ريد بول') ||
    nameLower.includes('red bull') ||
    nameLower.includes('redbull') ||
    nameLower.includes('بيريل') ||
    nameLower.includes('birell') ||
    nameLower.includes('فيروز') ||
    nameLower.includes('fayrouz') ||
    nameLower.includes('شوويبس') ||
    nameLower.includes('schweppes') ||
    nameLower.includes('معلب') ||
    nameLower.includes('ساقع')
  ) {
    return true;
  }

  return false;
}

function getEffectiveUnitPrice(
  item: { productName: string; category: string; unitPrice: number; isFridge?: boolean; isBakery?: boolean },
  customerType?: string | null
): number {
  if (!customerType) return item.unitPrice;
  const isNonDiscounted = isNonDiscountedProduct(item);
  if (isNonDiscounted) return item.unitPrice;

  if (customerType === 'owner_discount') {
    return item.unitPrice * 0.3; // 70% discount
  }
  if (customerType === 'staff') {
    return item.unitPrice * 0.5; // 50% discount
  }
  return item.unitPrice;
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
  juice: { icon: GlassWater, iconColor: "text-orange-600", bgColor: "bg-orange-50" },
  water: { icon: Droplets, iconColor: "text-sky-600", bgColor: "bg-sky-50" },
  snack: { icon: Package, iconColor: "text-yellow-600", bgColor: "bg-yellow-50" },
  dessert: { icon: Apple, iconColor: "text-pink-600", bgColor: "bg-pink-50" },
  sandwich: { icon: Utensils, iconColor: "text-orange-700", bgColor: "bg-orange-50" },
};

function getCategoryMeta(cat: string): CategoryMeta {
  return categoryConfig[normalizeCategoryKey(cat)] ?? categoryConfig.all;
}

const vintagePages = [
  {
    id: 1,
    title: "Hot Drinks & Desserts",
    image: "/images/vintage_coffee.png",
    sections: [
      { title: "HOT DRINKS", categories: ["coffee", "hot-drinks"] },
      { title: "DESSERTS", categories: ["dessert"] }
    ]
  },
  {
    id: 2,
    title: "Iced Drinks & Yogurt",
    image: "/images/vintage_iced_coffee.png",
    sections: [
      { title: "ICE COFFEE", categories: ["cold-coffee", "frappuccino"] },
      { title: "ICE TEA & YOGURT", categories: ["tea", "yougert"] }
    ]
  },
  {
    id: 3,
    title: "Mocktails & Frappes",
    image: "/images/vintage_cake.png",
    sections: [
      { title: "MOCKTAILS", categories: ["mocktails"] },
      { title: "FRAPPE & BOBA", categories: ["frappe", "boba-drinks"] }
    ]
  },
  {
    id: 4,
    title: "Milkshakes & Smoothies",
    image: "/images/vintage_milkshake.png",
    sections: [
      { title: "MILK SHAKE", categories: ["milk-shake"] },
      { title: "SMOOTHIE & JUICE", categories: ["smoothies", "juice"] }
    ]
  },
  {
    id: 5,
    title: "Cans & Additions",
    image: "/images/vintage_smoothie.png",
    sections: [
      { title: "CANS & FOOD", categories: ["cans", "indomy"] },
      { title: "ADDITIONS", categories: ["additions"] }
    ]
  }
];

export default function BaristaPOSPage() {
  const queryClient = useQueryClient();

  // realtime — الباريستا يشوف الطلبات الجديدة/المحدّثة لحظياً
  useBarOrderSocket({
    onNewOrder: () => queryClient.invalidateQueries({ queryKey: ["bar-orders"] }),
    onStatusUpdate: () => queryClient.invalidateQueries({ queryKey: ["bar-orders"] }),
    onDashboardRefresh: () => queryClient.invalidateQueries({ queryKey: ["bar-orders"] }),
  });

  const [sessionId, setSessionId] = useState("");
  const [notes, setNotes] = useState("");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [lastOrder, setLastOrder] = useState<any | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [customerSearchQuery, setCustomerSearchQuery] = useState("");
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [showFavorites, setShowFavorites] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [showQRCode, setShowQRCode] = useState(false);
  const [customerTab, setCustomerTab] = useState<"active" | "search" | "staff">("active");
  const [isMobileCartOpen, setIsMobileCartOpen] = useState(false);
  const [isSelectingCustomer, setIsSelectingCustomer] = useState(false);

  // Vintage Mode States
  const [viewMode, setViewMode] = useState<"grid" | "vintage">("grid");
  const [vintagePageIndex, setVintagePageIndex] = useState(0);
  const [isLargeScreen, setIsLargeScreen] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      setIsLargeScreen(window.innerWidth >= 1024);
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    const stored = localStorage.getItem(FAVORITES_KEY);
    if (stored) {
      try { setFavorites(new Set(JSON.parse(stored))); } catch (e) { }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(FAVORITES_KEY, JSON.stringify(Array.from(favorites)));
  }, [favorites]);

  const selectCategoryAndFlip = (cat: string) => {
    setSelectedCategory(cat);
    setShowFavorites(false);
    
    const pageIndex = vintagePages.findIndex(page => 
      page.sections.some(sect => sect.categories.map(c => normalizeCategoryKey(c)).includes(normalizeCategoryKey(cat)))
    );
    if (pageIndex !== -1) {
      const targetIndex = isLargeScreen 
        ? Math.floor(pageIndex / 2) * 2 
        : pageIndex;
      setVintagePageIndex(targetIndex);
    }
  };

  const renderVintagePage = (pageIndex: number) => {
    const page = vintagePages[pageIndex];
    if (!page) return null;

    const products = productsQuery.data?.data ?? [];

    return (
      <div className="menu-card flex-1 min-h-[500px] shadow-sm">
        <span className="menu-leaf tl">❧</span>
        <span className="menu-leaf bl">❧</span>

        {/* رأس المنيو */}
        <div className="menu-head border-b border-[color:var(--menu-line)] pb-3">
          <p className="menu-title">Menu</p>
          <p className="menu-subtitle">{page.title}</p>
        </div>

        {/* أقسام الصفحة */}
        <div className="relative z-[2] mt-1">
          {page.sections.map((sect) => {
            const sectionProducts = products.filter((p) =>
              sect.categories.map((c) => normalizeCategoryKey(c)).includes(normalizeCategoryKey(p.category)),
            );
            const filteredSectProducts = sectionProducts.filter((p) => {
              if (!searchQuery.trim()) return true;
              return p.name.toLowerCase().includes(searchQuery.toLowerCase());
            });

            if (filteredSectProducts.length === 0) return null;

            return (
              <div key={sect.title}>
                <div className="menu-section-head">
                  <span className="menu-chip">{sect.title}</span>
                  <span className="menu-sprig">🌿</span>
                  <span className="menu-section-line" />
                </div>
                <div>
                  {filteredSectProducts.map((prod) => {
                    const inCart = cart.find((i) => i.productId === prod.id);
                    const outOfStock = prod.availability === false;
                    return (
                      <div
                        key={prod.id}
                        onClick={() => addToCart(prod)}
                        className={clsx(
                          "menu-item",
                          inCart && !outOfStock && "is-selected",
                          outOfStock && "is-out",
                        )}
                      >
                        {inCart && !outOfStock && <span className="menu-qbadge">{inCart.quantity}</span>}
                        <span className="menu-item-name">{translateProductName(prod.name)}</span>
                        {outOfStock && <span className="menu-out-tag">نفد</span>}
                        <span className="menu-leader" />
                        <span className="menu-item-price">{money(Number(prod.price))}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        <div className="menu-pagenum">{String(pageIndex + 1).padStart(2, "0")}</div>
      </div>
    );
  };

  const productsQuery = useQuery({
    queryKey: ["products", "pos"],
    queryFn: async () => {
      // نجيب كل المنتجات النشطة (حتى غير المتاحة) عشان نعرض علامة "نفد" بدل ما تختفي
      const response = await api.get("/products", { params: { page: 1, limit: 200, active: true } });
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
      const [staffRes, ownersRes] = await Promise.all([
        api.get("/customers", { params: { customerType: "staff", limit: 200 } }),
        api.get("/customers", { params: { customerType: "owner_discount", limit: 200 } }),
      ]);
      const extract = (res: any): Customer[] => {
        const d = res.data.data;
        return Array.isArray(d) ? d : (d?.data ?? []);
      };
      return [...extract(staffRes), ...extract(ownersRes)];
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
      const res = await api.post("/bar-orders", {
        sessionId: sessionId || undefined,
        customerId: effectiveCustomerId,
        items,
        notes: notes || undefined,
      });
      return res.data?.data;
    },
    onSuccess: (order: any) => {
      setLastOrder(order ?? null);
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
      const effectiveUnitPrice = getEffectiveUnitPrice(item, selectedCustomer?.customerType);
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
    // منع إضافة منتج نفد أو غير متاح
    if (product.availability === false) {
      setMessage({ type: "error", text: `"${translateProductName(product.name)}" غير متاح حالياً (نفد المخزون)` });
      setTimeout(() => setMessage(null), 2500);
      return;
    }
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
        quantity: 1,
        isFridge: product.isFridge,
        isBakery: product.isBakery
      }];
    });
  }, [setMessage, setCart]);

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
    <>
      <link 
        href="https://fonts.googleapis.com/css2?family=Alex+Brush&family=Caveat:wght@700&display=swap" 
        rel="stylesheet" 
      />
      <div
        className="relative flex h-[calc(100vh-80px)] flex-col lg:flex-row overflow-hidden rounded-[1.5rem] border border-slate-200 bg-white shadow-sm"
        dir="rtl"
      >

      {/* Categories Sidebar */}
      <aside className="hidden xl:flex w-20 2xl:w-52 border-l border-slate-100 flex-col bg-slate-50/50 shrink-0">
        <div className="h-16 px-4 flex items-center border-b border-slate-100">
          <Link
            href="/dashboard/barista"
            className="flex items-center gap-2 text-slate-400 hover:text-slate-900 transition-colors"
          >
            <ChevronRight size={20} />
            <span className="hidden 2xl:inline text-xs font-bold tracking-tight">الرئيسية</span>
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
            <span className="hidden 2xl:inline text-xs font-bold">المفضلة</span>
          </button>

          <div className="my-2 mx-2 h-px bg-slate-200/60" />

          {categories.map((cat) => {
            const meta = getCategoryMeta(cat);
            const IconComp = meta.icon;
            const isActive = selectedCategory === cat && !showFavorites;
            return (
              <button
                key={cat}
                onClick={() => selectCategoryAndFlip(cat)}
                title={cat === "all" ? "كل القائمة" : translateProductCategory(cat)}
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
                <span className="hidden 2xl:inline text-xs font-bold truncate">
                  {cat === "all" ? "كل القائمة" : translateProductCategory(cat)}
                </span>
              </button>
            );
          })}
        </nav>
      </aside>

      {/* Product Grid */}
      <main className="flex-1 flex flex-col min-w-0 bg-white relative">
        <header className="min-h-16 px-3 sm:px-4 flex items-center gap-2 sm:gap-3 border-b border-slate-100 shrink-0">
          {/* Mobile Back Button */}
          <Link
            href="/dashboard/barista"
            className="xl:hidden h-10 w-10 flex items-center justify-center rounded-xl bg-slate-50 text-slate-400 shrink-0"
          >
            <ChevronRight size={20} />
          </Link>
          <div className="relative min-w-24 flex-1 max-w-md">
            <Search size={14} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="ابحث عن مشروب أو صنف..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-10 pr-10 pl-4 rounded-xl bg-slate-50 border-none text-xs font-medium focus:ring-2 focus:ring-slate-900/10 transition-all"
            />
          </div>
          
          <div className="flex bg-slate-100 p-1 rounded-xl gap-1 select-none">
            <button
              onClick={() => setViewMode("grid")}
              className={clsx(
                "px-2.5 py-1.5 rounded-lg text-[10px] font-black transition-all flex items-center gap-1",
                viewMode === "grid" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-900"
              )}
            >
              <LayoutGrid size={12} />
              <span className="hidden xl:inline">شبكة (Grid)</span>
            </button>
            <button
              onClick={() => setViewMode("vintage")}
              className={clsx(
                "px-2.5 py-1.5 rounded-lg text-[10px] font-black transition-all flex items-center gap-1",
                viewMode === "vintage" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-900"
              )}
            >
              <Sparkles size={12} />
              <span className="hidden xl:inline">منيو مميز</span>
            </button>
          </div>

          <button
            onClick={() => setShowQRCode(true)}
            className="hidden sm:flex h-10 px-3 items-center gap-2 rounded-xl bg-amber-50 text-amber-600 hover:bg-amber-100 border border-amber-200/50 transition-colors shrink-0"
          >
            <QrCode size={14} />
            <span className="hidden sm:inline text-[10px] font-black">كود الطلب</span>
          </button>

          <button
            onClick={() => queryClient.invalidateQueries({ queryKey: ["products", "pos"] })}
            className="hidden md:flex h-10 px-3 items-center gap-2 rounded-xl bg-slate-50 text-slate-500 hover:text-slate-900 transition-colors shrink-0"
          >
            <RefreshCw size={14} className={productsQuery.isLoading ? "animate-spin" : ""} />
            <span className="hidden sm:inline text-[10px] font-bold">تحديث</span>
          </button>
        </header>

        {/* Mobile Categories Scroll */}
        <div className="xl:hidden flex overflow-x-auto px-4 py-3 gap-2 border-b border-slate-50 bg-slate-50/30 scrollbar-none">
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
                onClick={() => selectCategoryAndFlip(cat)}
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

        <div className={clsx(
          "flex-1 overflow-y-auto scroll-smooth",
          viewMode === "vintage" ? "bg-slate-50 p-4 lg:p-6" : "p-4 lg:p-5"
        )}>
          {productsQuery.isLoading ? (
            <div className="grid grid-cols-[repeat(auto-fill,minmax(140px,1fr))] gap-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <CardSkeleton key={i} />
              ))}
            </div>
          ) : viewMode === "vintage" ? (
            <div className="max-w-6xl mx-auto flex flex-col h-full justify-between gap-4">
              {/* Double page spread on large screens, single page on small */}
              <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-4 items-stretch">
                {renderVintagePage(vintagePageIndex)}
                
                {/* On desktop, show the next page, or the decorative cover if we are at the end */}
                <div className="hidden lg:flex flex-1">
                  {vintagePageIndex + 1 < vintagePages.length ? (
                    renderVintagePage(vintagePageIndex + 1)
                  ) : (
                    /* End Cover */
                    <div className="flex-1 flex flex-col p-6 min-h-[500px] bg-slate-900 border border-slate-800 rounded-2xl shadow-sm relative text-white select-none items-center justify-center text-center">
                      <div className="h-12 w-12 rounded-2xl bg-white/10 flex items-center justify-center mb-4">
                        <Coffee size={24} className="text-white" />
                      </div>
                      <h2 className="text-2xl font-black text-white mb-1">Eduverse</h2>
                      <p className="text-[10px] tracking-widest uppercase font-bold text-slate-400 mb-4">Cafe &amp; Study Space</p>
                      <div className="w-12 h-px bg-white/20 my-3" />
                      <p className="text-xs text-slate-400 max-w-[180px] leading-relaxed">"A space designed for productivity, learning, and premium coffee."</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Page Navigation */}
              <div className="flex items-center justify-between bg-slate-50 border border-slate-200 p-3 rounded-2xl shrink-0 select-none">
                <button
                  disabled={vintagePageIndex === 0}
                  onClick={() => {
                    const step = isLargeScreen ? 2 : 1;
                    setVintagePageIndex(prev => Math.max(0, prev - step));
                  }}
                  className="px-4 py-2 bg-white border border-slate-200 text-slate-700 font-black rounded-xl text-xs shadow-sm disabled:opacity-30 disabled:pointer-events-none hover:bg-slate-100 transition-colors"
                >
                  السابق
                </button>
                
                <span className="text-[11px] font-black text-slate-500 tracking-widest uppercase">
                  {isLargeScreen 
                    ? `Pages ${vintagePageIndex + 1}-${Math.min(vintagePages.length, vintagePageIndex + 2)} of ${vintagePages.length}`
                    : `Page ${vintagePageIndex + 1} of ${vintagePages.length}`
                  }
                </span>

                <button
                  disabled={isLargeScreen ? vintagePageIndex >= vintagePages.length - 2 : vintagePageIndex >= vintagePages.length - 1}
                  onClick={() => {
                    const step = isLargeScreen ? 2 : 1;
                    setVintagePageIndex(prev => Math.min(vintagePages.length - 1, prev + step));
                  }}
                  className="px-4 py-2 bg-white border border-slate-200 text-slate-700 font-black rounded-xl text-xs shadow-sm disabled:opacity-30 disabled:pointer-events-none hover:bg-slate-100 transition-colors"
                >
                  التالي
                </button>
              </div>
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

                    <div className="grid grid-cols-[repeat(auto-fill,minmax(140px,1fr))] gap-3">
                      {items.map((product) => {
                        const inCart = cart.find((i) => i.productId === product.id);
                        const isFav = favorites.has(product.id);
                        const outOfStock = product.availability === false;
                        return (
                          <div
                            key={product.id}
                            onClick={() => addToCart(product)}
                            className={clsx(
                              "relative flex min-h-36 flex-col justify-between p-3.5 rounded-2xl border transition-all select-none",
                              outOfStock
                                ? "border-slate-100 bg-slate-50 opacity-60 cursor-not-allowed"
                                : "cursor-pointer active:scale-95 " + (inCart ? "border-slate-900 bg-white shadow-xl ring-1 ring-slate-900" : "border-slate-100 bg-white hover:border-slate-300 hover:shadow-lg")
                            )}
                          >
                            {outOfStock && (
                              <div className="absolute inset-0 z-20 flex items-center justify-center rounded-2xl bg-white/40">
                                <span className="rounded-full bg-rose-600 px-2.5 py-1 text-[10px] font-black text-white shadow-md">
                                  نفد المخزون
                                </span>
                              </div>
                            )}
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

                            <div className={clsx("h-11 w-11 mb-4 rounded-xl flex items-center justify-center", meta.bgColor, meta.iconColor)}>
                              <IconComp size={20} />
                            </div>

                            <div className="space-y-2">
                              <p className="text-xs font-bold text-slate-800 leading-5 line-clamp-2 min-h-10">
                                {translateProductName(product.name)}
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
            className="xl:hidden fixed bottom-6 left-6 z-40 h-16 w-16 bg-slate-900 text-white rounded-full shadow-2xl flex items-center justify-center transition-transform active:scale-90"
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
        "fixed inset-y-0 left-0 z-50 w-full sm:w-96 xl:relative xl:inset-auto xl:z-auto xl:w-80 2xl:w-[22rem] xl:flex flex-col bg-slate-50 border-r border-slate-200/80 transition-transform duration-300 xl:translate-x-0 shadow-2xl xl:shadow-[0_0_30px_rgba(0,0,0,0.03)] shrink-0",
        isMobileCartOpen ? "flex translate-x-0" : "-translate-x-full xl:translate-x-0"
      )}>
        <div className="h-16 px-5 flex items-center justify-between border-b border-slate-200 bg-white shrink-0">
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
            <button onClick={() => setIsMobileCartOpen(false)} className="xl:hidden p-2 text-slate-400 hover:text-slate-900">
              <X size={20} />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
          {cart.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-slate-200 py-12">
              <Receipt size={40} strokeWidth={1} className="mb-3 text-slate-300" />
              <p className="text-xs font-bold uppercase tracking-widest text-slate-400">السلة فارغة</p>
            </div>
          ) : (
            cart.map((item) => (
              <div key={item.productId} className="group p-3.5 rounded-2xl border border-slate-200 bg-white shadow-sm hover:shadow-md hover:border-slate-300 transition-all">
                <div className="flex justify-between items-start gap-3 mb-3">
                  <div className="min-w-0 text-right">
                    <p className="text-xs font-black text-slate-900 truncate leading-snug">{translateProductName(item.productName)}</p>
                    <p className="text-[10px] text-slate-400 font-bold mt-0.5">{money(item.unitPrice)}</p>
                  </div>
                  <span className="text-xs font-black text-slate-950">{money(item.unitPrice * item.quantity)}</span>
                </div>
                
                <div className="flex items-center gap-2">
                  <button onClick={() => updateQuantity(item.productId, -1)} className="h-7 w-7 rounded-lg bg-slate-50 border border-slate-200/60 flex items-center justify-center hover:bg-slate-100 transition-colors">
                    <Minus size={12} className="text-slate-400" />
                  </button>
                  <span className="w-6 text-center text-xs font-black text-slate-800">{item.quantity}</span>
                  <button onClick={() => updateQuantity(item.productId, 1)} className="h-7 w-7 rounded-lg bg-slate-900 text-white flex items-center justify-center hover:bg-slate-800 transition-colors">
                    <Plus size={12} />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="p-5 border-t border-slate-200 bg-white space-y-4 shadow-[0_-4px_20px_-4px_rgba(0,0,0,0.05)] shrink-0">
          <div className="space-y-2">
            <div className="flex justify-between text-xs font-bold text-slate-400">
              <span>الإجمالي</span>
              <span>{money(cartSubtotal)}</span>
            </div>
            {discountInfo && (
              <div className="flex justify-between text-xs font-bold text-emerald-600 bg-emerald-50 px-2.5 py-1.5 rounded-xl border border-emerald-100">
                <span>{discountInfo.label}</span>
                <span>-{money(discountAmount)}</span>
              </div>
            )}
            <div className="flex justify-between pt-2 border-t border-slate-100">
              <span className="text-sm font-black text-slate-900">المطلوب دفعه</span>
              <span className="text-2xl font-black text-slate-950">{money(cartTotal)}</span>
            </div>
          </div>

          <div className="space-y-3">
            {!isSelectingCustomer ? (
              <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-3.5 flex items-center justify-between shadow-xs">
                <div className="text-right space-y-1">
                  <span className="text-[10px] font-black text-slate-400 block uppercase tracking-wider">العميل المرتبط بالطلب</span>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-900">
                      {selectedCustomer?.fullName || (sessionId ? "العميل من الجلسة" : "لم يتم اختيار عميل")}
                    </span>
                    {selectedCustomer?.customerType === 'owner_discount' && (
                      <span className="bg-amber-100 text-amber-700 text-[9px] font-black px-1.5 py-0.5 rounded-md">مالك 70%</span>
                    )}
                    {selectedCustomer?.customerType === 'staff' && (
                      <span className="bg-blue-100 text-blue-700 text-[9px] font-black px-1.5 py-0.5 rounded-md">موظف 50%</span>
                    )}
                  </div>
                  {sessionId && (
                    <div className="text-[10px] text-slate-500 font-bold">
                      الجلسة: {activeSessionsQuery.data?.data?.find(s => s.id === sessionId)?.room?.name ? `غرفة ${activeSessionsQuery.data?.data?.find(s => s.id === sessionId)?.room?.name}` : "المساحة العامة"}
                    </div>
                  )}
                </div>
                <div className="flex gap-1.5">
                  {(selectedCustomer || sessionId) && (
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedCustomer(null);
                        setSessionId("");
                      }}
                      className="rounded-xl border border-slate-200 bg-white px-2.5 py-1.5 text-[10px] font-black text-rose-600 hover:bg-rose-50 transition-colors shadow-xs"
                    >
                      إزالة
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => setIsSelectingCustomer(true)}
                    className="rounded-xl border border-slate-200 bg-white px-2.5 py-1.5 text-[10px] font-black text-slate-700 hover:bg-slate-100 transition-colors shadow-xs"
                  >
                    تغيير
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-3 border border-slate-200 bg-slate-50/50 p-3 rounded-2xl transition-all">
                <div className="flex items-center justify-between">
                  <p className="text-[10px] font-black uppercase text-slate-400 tracking-tighter">تحديد العميل أو الجلسة</p>
                  <button
                    type="button"
                    onClick={() => setIsSelectingCustomer(false)}
                    className="text-[10px] font-black text-slate-500 hover:text-slate-900 bg-white border border-slate-200 px-2.5 py-1 rounded-lg shadow-xs"
                  >
                    تم
                  </button>
                </div>

                <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl border border-slate-200/40">
                  <button
                    type="button"
                    onClick={() => setCustomerTab("active")}
                    className={clsx(
                      "flex-1 rounded-lg py-1.5 text-[10px] font-black transition-all",
                      customerTab === "active"
                        ? "bg-white text-slate-900 shadow-xs border border-slate-200/20"
                        : "text-slate-500 hover:text-slate-900"
                    )}
                  >
                    النشطين
                  </button>
                  <button
                    type="button"
                    onClick={() => setCustomerTab("search")}
                    className={clsx(
                      "flex-1 rounded-lg py-1.5 text-[10px] font-black transition-all",
                      customerTab === "search"
                        ? "bg-white text-slate-900 shadow-xs border border-slate-200/20"
                        : "text-slate-500 hover:text-slate-900"
                    )}
                  >
                    البحث
                  </button>
                  <button
                    type="button"
                    onClick={() => setCustomerTab("staff")}
                    className={clsx(
                      "flex-1 rounded-lg py-1.5 text-[10px] font-black transition-all",
                      customerTab === "staff"
                        ? "bg-white text-slate-900 shadow-xs border border-slate-200/20"
                        : "text-slate-500 hover:text-slate-900"
                    )}
                  >
                    الخصومات
                  </button>
                </div>

                {customerTab === "active" && (
                  <div className="max-h-40 overflow-y-auto rounded-xl border border-slate-200 bg-white p-1.5">
                    {activeSessionsQuery.isLoading ? (
                      <div className="space-y-1">
                        {[...Array(2)].map((_, idx) => (
                          <div key={idx} className="h-8 rounded-lg bg-slate-200 animate-pulse" />
                        ))}
                      </div>
                    ) : (activeSessionsQuery.data?.data?.length ?? 0) > 0 ? (
                      activeSessionsQuery.data?.data?.map((session) => {
                        const cust = session.customer;
                        if (!cust) return null;
                        const isSelected = sessionId === session.id;
                        return (
                          <button
                            key={session.id}
                            type="button"
                            onClick={() => {
                              setSessionId(session.id);
                              setSelectedCustomer(cust as any);
                              setIsSelectingCustomer(false);
                            }}
                            className={clsx(
                              "w-full rounded-lg px-2.5 py-1.5 text-right text-[10px] font-semibold transition mb-1 flex flex-col gap-0.5 border",
                              isSelected ? "bg-slate-900 text-white border-slate-900 shadow-xs" : "bg-slate-50 text-slate-800 hover:bg-slate-100 border-slate-100"
                            )}
                          >
                            <div className="flex items-center justify-between w-full">
                              <span className="font-bold">{cust.fullName}</span>
                              <span className={clsx("text-[8px] px-1 py-0.2 rounded-md font-bold", isSelected ? "bg-white/20 text-white" : "bg-slate-200 text-slate-600")}>
                                {session.room?.name ? `غرفة ${session.room.name}` : "المساحة العامة"}
                              </span>
                            </div>
                          </button>
                        );
                      })
                    ) : (
                      <p className="text-[10px] text-slate-500 text-center py-3">لا يوجد عملاء نشطين.</p>
                    )}
                  </div>
                )}

                {customerTab === "search" && (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-2.5 py-1.5">
                      <Search size={12} className="text-slate-400" />
                      <input
                        type="text"
                        placeholder="ابحث باسم أو هاتف العميل"
                        value={customerSearchQuery}
                        onChange={(e) => setCustomerSearchQuery(e.target.value)}
                        className="flex-1 bg-transparent border-none text-[10px] font-bold focus:ring-0 outline-none"
                      />
                    </div>
                    <div className="max-h-40 overflow-y-auto rounded-xl border border-slate-200 bg-white p-1.5">
                      {customersQuery.isLoading ? (
                        <div className="space-y-1">
                          {[...Array(2)].map((_, idx) => (
                            <div key={idx} className="h-8 rounded-lg bg-slate-200 animate-pulse" />
                          ))}
                        </div>
                      ) : (customersQuery.data?.data.length ?? 0) > 0 ? (
                        customersQuery.data?.data.map((customer) => (
                          <button
                            key={customer.id}
                            type="button"
                            onClick={() => {
                              setSelectedCustomer(customer);
                              setSessionId("");
                              setIsSelectingCustomer(false);
                            }}
                            className={clsx(
                              "w-full rounded-lg px-2.5 py-1.5 text-right text-[10px] font-semibold transition mb-1 border",
                              selectedCustomer?.id === customer.id ? "bg-slate-900 text-white border-slate-900 shadow-xs" : "bg-slate-50 text-slate-800 hover:bg-slate-100 border-slate-100"
                            )}
                          >
                            <div className="flex items-center justify-between gap-2">
                              <span className="font-bold">{customer.fullName}</span>
                              <span className="text-[9px] text-slate-400">{customer.phoneNumber || "بدون هاتف"}</span>
                            </div>
                          </button>
                        ))
                      ) : (
                        <p className="text-[10px] text-slate-500 text-center py-3">لا يوجد عملاء مطابقين.</p>
                      )}
                    </div>
                  </div>
                )}

                {customerTab === "staff" && (
                  <div className="max-h-40 overflow-y-auto rounded-xl border border-slate-200 bg-white p-1.5">
                    {staffQuery.isLoading ? (
                      <div className="space-y-1">
                        {[...Array(2)].map((_, idx) => (
                          <div key={idx} className="h-8 rounded-lg bg-slate-200 animate-pulse" />
                        ))}
                      </div>
                    ) : (staffQuery.data?.length ?? 0) > 0 ? (
                      staffQuery.data?.map((customer) => (
                        <button
                          key={customer.id}
                          type="button"
                          onClick={() => {
                            setSelectedCustomer(customer);
                            setSessionId("");
                            setIsSelectingCustomer(false);
                          }}
                          className={clsx(
                            "w-full rounded-lg px-2.5 py-1.5 text-right text-[10px] font-semibold transition mb-1 border",
                            selectedCustomer?.id === customer.id
                              ? "bg-slate-900 text-white border-slate-900 shadow-xs"
                              : "bg-slate-50 text-slate-800 hover:bg-slate-100 border-slate-100"
                          )}
                        >
                          <div className="flex items-center justify-between gap-2">
                            <span className="font-bold truncate">{customer.fullName}</span>
                            <span className={clsx(
                              "shrink-0 rounded-full px-1.5 py-0.2 text-[8px] font-black",
                              customer.customerType === "owner_discount"
                                ? selectedCustomer?.id === customer.id ? "bg-white/20 text-white" : "bg-amber-100 text-amber-700"
                                : selectedCustomer?.id === customer.id ? "bg-white/20 text-white" : "bg-blue-100 text-blue-700"
                            )}>
                              {customer.customerType === "owner_discount" ? "مالك 70%" : "موظف 50%"}
                            </span>
                          </div>
                        </button>
                      ))
                    ) : (
                      <p className="text-[10px] text-slate-500 text-center py-3">لا يوجد أصحاب خصومات.</p>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          <button
            onClick={() => setShowConfirm(true)}
            disabled={cart.length === 0 || (!selectedCustomer && !sessionId)}
            className="w-full py-4 rounded-2xl bg-slate-900 text-white text-sm font-black shadow-xl shadow-slate-200 hover:bg-slate-800 disabled:opacity-30 disabled:pointer-events-none transition-all active:scale-95 flex items-center justify-center gap-3"
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
                        {translateProductName(item.productName)}
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
                          {money(getEffectiveUnitPrice(item, selectedCustomer?.customerType) * item.quantity)}
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

      {/* Order Summary Modal — ملخص الطلب بعد إتمامه */}
      {lastOrder && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm" dir="rtl">
          <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl overflow-hidden">
            <div className="flex items-center gap-3 px-6 py-5 bg-emerald-50 border-b border-emerald-100">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500 text-white">
                <CheckCircle2 size={20} />
              </span>
              <div className="flex-1">
                <h3 className="text-base font-black text-slate-900">تم تسجيل الطلب</h3>
                <p className="text-[11px] font-bold text-slate-500">
                  {lastOrder.customer?.fullName ?? "عميل"}
                  {lastOrder.session ? " • جلسة نشطة" : ""}
                </p>
              </div>
              <button
                onClick={() => setLastOrder(null)}
                className="h-9 w-9 flex items-center justify-center rounded-xl hover:bg-white/60 text-slate-400 transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            <div className="px-6 py-5 space-y-4">
              <div className="max-h-56 overflow-y-auto space-y-2 rounded-xl bg-slate-50 p-3">
                {(lastOrder.items ?? []).map((it: any) => (
                  <div key={it.id} className="flex items-center justify-between text-sm">
                    <span className="text-slate-700">
                      {translateProductName(it.product?.name ?? "صنف")}
                      <span className="text-slate-400 mx-1">×</span>
                      <span className="font-black text-slate-900">{it.quantity}</span>
                    </span>
                    <span className="font-black text-slate-900 font-mono">{money(it.subtotal)}</span>
                  </div>
                ))}
              </div>

              {lastOrder.notes && (
                <div className="flex justify-between text-sm gap-4">
                  <span className="text-slate-500 shrink-0">ملاحظات</span>
                  <span className="font-bold text-slate-900 text-left">{lastOrder.notes}</span>
                </div>
              )}

              <div className="flex items-baseline justify-between border-y-2 border-slate-900 py-3">
                <span className="text-sm font-black text-slate-900">الإجمالي</span>
                <span className="font-mono text-3xl font-black text-slate-900">{money(lastOrder.totalAmount)}</span>
              </div>

              <button
                onClick={() => setLastOrder(null)}
                className="w-full h-12 rounded-2xl bg-slate-900 text-white text-sm font-black hover:bg-slate-800 active:scale-[0.98] transition-all"
              >
                تمام
              </button>
            </div>
          </div>
        </div>
      )}

      {/* QR Code Modal */}
      {showQRCode && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm" dir="rtl">
          <div className="bg-white rounded-3xl w-full max-w-sm shadow-2xl overflow-hidden text-center border border-slate-100">
            <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100">
              <h3 className="text-base font-black text-slate-900">كود طلب العميل</h3>
              <button
                onClick={() => setShowQRCode(false)}
                className="h-9 w-9 flex items-center justify-center rounded-xl hover:bg-slate-100 text-slate-400 transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-6 flex flex-col items-center">
              <p className="text-xs font-bold text-slate-500 mb-6">
                اجعل العميل يمسح الكود لفتح صفحة طلبات المشروبات والدراسة من تليفونه مباشرة.
              </p>
              
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 mb-6 flex items-center justify-center">
                <img
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent("https://edu-vers.com/order")}`}
                  alt="Order Page QR Code"
                  className="w-48 h-48"
                />
              </div>

              <div className="w-full flex gap-3">
                <button
                  onClick={() => {
                    if (typeof window !== 'undefined') {
                      navigator.clipboard.writeText("https://edu-vers.com/order");
                      alert("تم نسخ رابط الطلب بنجاح!");
                    }
                  }}
                  className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-black rounded-xl transition-all"
                >
                  نسخ الرابط
                </button>
                <button
                  onClick={() => setShowQRCode(false)}
                  className="flex-1 py-3 bg-slate-900 hover:bg-slate-800 text-white text-xs font-black rounded-xl transition-all"
                >
                  إغلاق
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
    </>
  );
}
