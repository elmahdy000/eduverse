"use client";

import { useMemo, useState, useEffect } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Archive,
  ArrowUpDown,
  Check,
  CheckCircle2,
  Cherry,
  ChevronLeft,
  ChevronRight,
  Clock,
  Coffee,
  Copy,
  CupSoda,
  Download,
  Edit,
  Edit3,
  Eye,
  EyeOff,
  FileSpreadsheet,
  Filter,
  Flame,
  GlassWater,
  Grid,
  IceCream,
  Image as ImageIcon,
  Info,
  Layers,
  Leaf,
  List,
  Milk,
  MoreVertical,
  Package,
  Plus,
  PlusCircle,
  Power,
  PowerOff,
  Printer,
  RefreshCw,
  Search,
  Settings2,
  ShoppingBag,
  SlidersHorizontal,
  Snowflake,
  Soup,
  Sparkles,
  Tag,
  Trash2,
  Upload,
  X,
  XCircle,
  Zap,
} from "lucide-react";
import { toast } from "sonner";
import { api } from "../../../lib/api";
import { translateApiError } from "../../../lib/errors";
import { money } from "../../../lib/format";
import { translateProductCategory } from "../../../lib/labels";
import type { Paginated, Product } from "../../../lib/types";
import { useAuthStore } from "../../../store/auth-store";
import {
  Badge,
  Btn,
  FormField,
  Input,
  Modal,
  Spinner,
} from "../../../components/ui";

const CATEGORIES = [
  { value: "", label: "جميع التصنيفات" },
  { value: "coffee", label: "قهوة" },
  { value: "tea", label: "شاي" },
  { value: "frappe", label: "فرابيه" },
  { value: "cold-coffee", label: "قهوة مثلجة" },
  { value: "hot-drinks", label: "مشروبات ساخنة" },
  { value: "frappuccino", label: "فرابوتشينو" },
  { value: "milk-shake", label: "ميلك شيك" },
  { value: "smoothies", label: "سموذي" },
  { value: "yougert", label: "زبادي" },
  { value: "cans", label: "كانز (معلبات)" },
  { value: "water", label: "مياه" },
  { value: "juice", label: "عصير" },
  { value: "mocktails", label: "موكتيل" },
  { value: "indomy", label: "إندومي" },
  { value: "boba-drinks", label: "بوبا" },
  { value: "snack", label: "سناكس" },
  { value: "dessert", label: "حلويات" },
  { value: "sandwich", label: "ساندويتش" },
  { value: "additions", label: "إضافات" },
];

const TOP_CATEGORIES = [
  { value: "coffee", label: "☕ قهوة" },
  { value: "tea", label: "🌿 شاي" },
  { value: "frappe", label: "🥤 فرابيه" },
  { value: "hot-drinks", label: "🔥 ساخن" },
  { value: "cans", label: "🥫 معلبات" },
];

const FRIDGE_CATEGORIES = ["cans", "water", "juice"];

const categoryIcons: Record<string, React.ComponentType<{ size?: number; className?: string }>> = {
  coffee: Coffee,
  tea: Leaf,
  frappe: CupSoda,
  "cold-coffee": Snowflake,
  "hot-drinks": Flame,
  frappuccino: IceCream,
  "milk-shake": Milk,
  smoothies: Cherry,
  yougert: CupSoda,
  cans: CupSoda,
  water: GlassWater,
  juice: Cherry,
  mocktails: GlassWater,
  indomy: Soup,
  "boba-drinks": CupSoda,
  snack: ShoppingBag,
  dessert: IceCream,
  sandwich: Soup,
  additions: PlusCircle,
};

type ViewMode = "table" | "grid";
type SortOption = "newest" | "oldest" | "name" | "price_asc" | "price_desc";

interface ProductForm {
  name: string;
  category: string;
  price: string;
  costPrice: string;
  description: string;
  imageUrl: string;
  isFridge: boolean;
  isBakery: boolean;
  availability: boolean;
  active: boolean;
}

const EMPTY_PRODUCT_FORM: ProductForm = {
  name: "",
  category: "coffee",
  price: "0",
  costPrice: "0",
  description: "",
  imageUrl: "",
  isFridge: false,
  isBakery: false,
  availability: true,
  active: true,
};

/* ════════════════════════════════════════════════════════════
   PRODUCT THUMBNAIL COMPONENT (Handles image fallback cleanly)
   ════════════════════════════════════════════════════════════ */
function ProductThumbnail({
  src,
  alt,
  category,
  className = "w-12 h-12 rounded-xl",
  iconSize = 20,
}: {
  src?: string | null;
  alt: string;
  category?: string;
  className?: string;
  iconSize?: number;
}) {
  const [error, setError] = useState(false);
  const CategoryIcon = (category && categoryIcons[category]) ? categoryIcons[category] : Package;

  const validSrc = useMemo(() => {
    if (!src || typeof src !== "string" || src.trim() === "") return null;
    const clean = src.trim();
    if (clean.startsWith("http://") || clean.startsWith("https://") || clean.startsWith("data:")) {
      return clean;
    }
    return clean.startsWith("/") ? clean : `/${clean}`;
  }, [src]);

  if (!validSrc || error) {
    return (
      <div className={`flex items-center justify-center bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 border border-slate-200/60 dark:border-slate-700/60 shrink-0 ${className}`}>
        <CategoryIcon size={iconSize} />
      </div>
    );
  }

  return (
    <img
      src={validSrc}
      alt={alt}
      loading="lazy"
      onError={() => setError(true)}
      className={`object-cover shrink-0 border border-slate-200/60 dark:border-slate-700/60 ${className}`}
    />
  );
}

const CATEGORY_MAP: Record<string, string[]> = {
  coffee: ["coffee", "قهوة", "قهوه"],
  tea: ["tea", "شاي"],
  frappe: ["frappe", "فرابيه"],
  "cold-coffee": ["cold-coffee", "قهوة مثلجة", "آيس كوفي", "ايس كوفي"],
  "hot-drinks": ["hot-drinks", "مشروبات ساخنة", "مشروبات ساخنه", "ساخن"],
  frappuccino: ["frappuccino", "فرابوتشينو"],
  "milk-shake": ["milk-shake", "ميلك شيك", "ميلكشيك"],
  smoothies: ["smoothies", "سموذي"],
  yougert: ["yougert", "زبادي"],
  cans: ["cans", "كانز", "معلبات", "كانز (معلبات)"],
  water: ["water", "مياه"],
  juice: ["juice", "عصير"],
  mocktails: ["mocktails", "موكتيل"],
  indomy: ["indomy", "إندومي", "اندومي"],
  "boba-drinks": ["boba-drinks", "بوبا"],
  snack: ["snack", "سناكس", "سناكس/مأكولات"],
  dessert: ["dessert", "حلويات"],
  sandwich: ["sandwich", "ساندويتش", "ساندوتش"],
  additions: ["additions", "إضافات", "اضافات"],
};

function matchesCategory(prodCat: string, filterVal: string): boolean {
  if (!filterVal) return true;
  if (!prodCat) return false;

  const pCat = prodCat.trim().toLowerCase();
  const fVal = filterVal.trim().toLowerCase();

  if (pCat === fVal) return true;

  const equivalents = CATEGORY_MAP[fVal];
  if (equivalents) {
    return equivalents.some(
      (eq) => eq.toLowerCase() === pCat || pCat.includes(eq.toLowerCase()) || eq.toLowerCase().includes(pCat)
    );
  }

  return pCat.includes(fVal) || fVal.includes(pCat);
}

export default function ProductsPage() {
  const qc = useQueryClient();
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const { user } = useAuthStore();

  const canManage =
    user?.role?.name === "Owner" ||
    user?.role?.name === "Operations Manager" ||
    user?.role?.name === "Receptionist";

  // URL Query Sync State
  const [search, setSearch] = useState(searchParams.get("q") || "");
  const [categoryFilter, setCategoryFilter] = useState(searchParams.get("category") || "");
  const [statusFilter, setStatusFilter] = useState(searchParams.get("status") || "all");
  const [stockFilter, setStockFilter] = useState(searchParams.get("stock") || "all");
  const [sortBy, setSortBy] = useState<SortOption>((searchParams.get("sort") as SortOption) || "newest");
  const [viewMode, setViewMode] = useState<ViewMode>((searchParams.get("view") as ViewMode) || "table");
  const [page, setPage] = useState(Number(searchParams.get("page")) || 1);
  const [pageSize, setPageSize] = useState(Number(searchParams.get("limit")) || 25);

  // Bulk Selection State
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Modals & Drawers State
  const [showFullFormModal, setShowFullFormModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [form, setForm] = useState<ProductForm>(EMPTY_PRODUCT_FORM);
  const [quickEditProduct, setQuickEditProduct] = useState<Product | null>(null);
  const [showImportModal, setShowImportModal] = useState(false);
  const [importCsvText, setImportCsvText] = useState("");

  // Recipe Modal State
  const [recipeProduct, setRecipeProduct] = useState<Product | null>(null);
  const [recipeItems, setRecipeItems] = useState<{ inventoryItemId: string; quantity: number; name?: string; unit?: string }[]>([]);
  const [recipeLoading, setRecipeLoading] = useState(false);
  const [inventoryItems, setInventoryItems] = useState<any[]>([]);
  const [selectedItemId, setSelectedItemId] = useState("");
  const [selectedQty, setSelectedQty] = useState("");
  const [submittingRecipe, setSubmittingRecipe] = useState(false);

  // Active Action Menu Dropdown State
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);

  // Synchronize state with URL
  useEffect(() => {
    const params = new URLSearchParams();
    if (search) params.set("q", search);
    if (categoryFilter) params.set("category", categoryFilter);
    if (statusFilter !== "all") params.set("status", statusFilter);
    if (stockFilter !== "all") params.set("stock", stockFilter);
    if (sortBy !== "newest") params.set("sort", sortBy);
    if (viewMode !== "table") params.set("view", viewMode);
    if (page > 1) params.set("page", String(page));
    if (pageSize !== 25) params.set("limit", String(pageSize));
    const query = params.toString();
    router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
  }, [search, categoryFilter, statusFilter, stockFilter, sortBy, viewMode, page, pageSize, pathname, router]);

  // Fetch Products Query - Load all products for full instant filtering
  const productsQuery = useQuery({
    queryKey: ["products"],
    queryFn: async () => {
      const res = await api.get("/products", {
        params: {
          page: 1,
          limit: 500,
          all: "true",
        },
      });
      return res.data.data as Paginated<Product>;
    },
    staleTime: 5000,
  });

  const rawProducts = useMemo(() => productsQuery.data?.data ?? [], [productsQuery.data?.data]);

  // Filter & Sort Products locally for immediate UI responsiveness
  const filteredAndSortedProducts = useMemo(() => {
    let list = [...rawProducts];

    // Search Query Filter
    if (search.trim()) {
      const term = search.trim().toLowerCase();
      list = list.filter(
        (p) =>
          p.name.toLowerCase().includes(term) ||
          p.category.toLowerCase().includes(term) ||
          (p.description && p.description.toLowerCase().includes(term))
      );
    }

    // Category Filter
    if (categoryFilter) {
      list = list.filter((p) => matchesCategory(p.category, categoryFilter));
    }

    // Status Filter
    if (statusFilter === "active") {
      list = list.filter((p) => p.active);
    } else if (statusFilter === "inactive") {
      list = list.filter((p) => !p.active);
    }

    // Stock / Availability Filter
    if (stockFilter === "available") {
      list = list.filter((p) => p.availability && p.active);
    } else if (stockFilter === "out_of_stock") {
      list = list.filter((p) => !p.availability || !p.active);
    }

    // Sorting
    list.sort((a, b) => {
      if (sortBy === "name") return a.name.localeCompare(b.name, "ar");
      if (sortBy === "price_asc") return Number(a.price) - Number(b.price);
      if (sortBy === "price_desc") return Number(b.price) - Number(a.price);
      if (sortBy === "oldest") return a.id > b.id ? 1 : -1;
      return 0; // default newest
    });

    return list;
  }, [rawProducts, search, categoryFilter, statusFilter, stockFilter, sortBy]);

  // Client Pagination
  const totalItems = filteredAndSortedProducts.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const currentPage = Math.min(page, totalPages);
  const paginatedProducts = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredAndSortedProducts.slice(start, start + pageSize);
  }, [filteredAndSortedProducts, currentPage, pageSize]);

  // Statistics Calculations
  const stats = useMemo(() => {
    const total = rawProducts.length;
    const active = rawProducts.filter((p) => p.active && p.availability).length;
    const inactive = rawProducts.filter((p) => !p.active).length;
    const outOfStock = rawProducts.filter((p) => p.active && !p.availability).length;
    const fridgeCount = rawProducts.filter((p) => p.isFridge).length;
    return { total, active, inactive, outOfStock, fridgeCount };
  }, [rawProducts]);

  // Mutations
  const saveProductMutation = useMutation({
    mutationFn: async (payload: ProductForm) => {
      const data = {
        name: payload.name.trim(),
        category: payload.category,
        price: Number(payload.price) || 0,
        costPrice: Number(payload.costPrice) || 0,
        description: payload.description || undefined,
        imageUrl: payload.imageUrl || undefined,
        isFridge: payload.isFridge,
        isBakery: payload.isBakery,
        availability: payload.availability,
      };

      if (editingProduct) {
        return api.put(`/products/${editingProduct.id}`, data);
      }
      return api.post("/products", data);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["products"] });
      setShowFullFormModal(false);
      setEditingProduct(null);
      setForm(EMPTY_PRODUCT_FORM);
      toast.success(editingProduct ? "تم تحديث بيانات المنتج بنجاح" : "تمت إضافة المنتج بنجاح");
    },
    onError: (err: unknown) => {
      toast.error(translateApiError((err as any)?.response?.data?.message || "فشل حفظ المنتج"));
    },
  });

  const toggleActiveMutation = useMutation({
    mutationFn: ({ id, action }: { id: string; action: "deactivate" | "reactivate" }) =>
      api.post(`/products/${id}/${action}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["products"] });
      toast.success("تم تحديث حالة تفعيل المنتج");
    },
    onError: (err: unknown) => {
      toast.error(translateApiError((err as any)?.response?.data?.message));
    },
  });

  const toggleAvailMutation = useMutation({
    mutationFn: ({ product }: { product: Product }) =>
      api.put(`/products/${product.id}`, { availability: !product.availability }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["products"] });
      toast.success("تم تحديث إتاحة المنتج للبيع");
    },
    onError: (err: unknown) => {
      toast.error(translateApiError((err as any)?.response?.data?.message));
    },
  });

  const deleteProductMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/products/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["products"] });
      toast.success("تم حذف المنتج بنجاح");
    },
    onError: (err: unknown) => {
      toast.error(translateApiError((err as any)?.response?.data?.message || "تعذر حذف المنتج"));
    },
  });

  // Bulk Operations Mutations
  const bulkDeactivateMutation = useMutation({
    mutationFn: async (ids: string[]) => {
      return Promise.all(ids.map((id) => api.post(`/products/${id}/deactivate`)));
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["products"] });
      setSelectedIds(new Set());
      toast.success("تم تعطيل المنتجات المحددة");
    },
  });

  const bulkReactivateMutation = useMutation({
    mutationFn: async (ids: string[]) => {
      return Promise.all(ids.map((id) => api.post(`/products/${id}/reactivate`)));
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["products"] });
      setSelectedIds(new Set());
      toast.success("تم تفعيل المنتجات المحددة");
    },
  });

  // Open Full Add Modal
  function openCreate() {
    setEditingProduct(null);
    setForm(EMPTY_PRODUCT_FORM);
    setShowFullFormModal(true);
  }

  // Open Edit Modal
  function openEdit(product: Product) {
    setEditingProduct(product);
    setForm({
      name: product.name,
      category: product.category || "coffee",
      price: String(product.price),
      costPrice: String(product.costPrice ?? 0),
      description: product.description ?? "",
      imageUrl: product.imageUrl ?? "",
      isFridge: product.isFridge ?? false,
      isBakery: product.isBakery ?? false,
      availability: product.availability ?? true,
      active: product.active ?? true,
    });
    setShowFullFormModal(true);
  }

  // Duplicate Product
  function duplicateProduct(product: Product) {
    setEditingProduct(null);
    setForm({
      name: `${product.name} (نسخة)`,
      category: product.category || "coffee",
      price: String(product.price),
      costPrice: String(product.costPrice ?? 0),
      description: product.description ?? "",
      imageUrl: product.imageUrl ?? "",
      isFridge: product.isFridge ?? false,
      isBakery: product.isBakery ?? false,
      availability: true,
      active: true,
    });
    setShowFullFormModal(true);
  }

  // Open Recipe Modal
  const openRecipeModal = async (product: Product) => {
    setRecipeProduct(product);
    setRecipeLoading(true);
    setSelectedItemId("");
    setSelectedQty("");
    try {
      if (inventoryItems.length === 0) {
        const invRes = await api.get("/inventory/items");
        setInventoryItems(invRes.data);
      }
      const recipeRes = await api.get(`/inventory/products/${product.id}/recipe`);
      const mapped = recipeRes.data.map((item: any) => ({
        inventoryItemId: item.inventoryItemId,
        quantity: Number(item.quantity),
        name: item.inventoryItem?.name,
        unit: item.inventoryItem?.unit,
      }));
      setRecipeItems(mapped);
    } catch (err) {
      console.error(err);
      toast.error("فشل تحميل مكونات وصفة المنتج");
    } finally {
      setRecipeLoading(false);
    }
  };

  const handleAddRecipeItem = () => {
    if (!selectedItemId || !selectedQty || isNaN(Number(selectedQty)) || Number(selectedQty) <= 0) {
      toast.error("برجاء إدخال كمية صحيحة للمكون");
      return;
    }
    const alreadyExists = recipeItems.some((i) => i.inventoryItemId === selectedItemId);
    if (alreadyExists) {
      toast.error("هذا المكون مضاف بالفعل في الوصفة");
      return;
    }
    const item = inventoryItems.find((i) => i.id === selectedItemId);
    if (!item) return;

    setRecipeItems([
      ...recipeItems,
      {
        inventoryItemId: selectedItemId,
        quantity: Number(selectedQty),
        name: item.name,
        unit: item.unit,
      },
    ]);
    setSelectedItemId("");
    setSelectedQty("");
  };

  const handleSaveRecipe = async () => {
    if (!recipeProduct) return;
    setSubmittingRecipe(true);
    try {
      await api.post(`/inventory/products/${recipeProduct.id}/recipe`, {
        items: recipeItems.map((item) => ({
          inventoryItemId: item.inventoryItemId,
          quantity: Number(item.quantity),
        })),
      });
      toast.success("تم تحديث وصفة مكونات المنتج بنجاح");
      setRecipeProduct(null);
    } catch (err) {
      console.error(err);
      toast.error("فشل حفظ الوصفة، حاول مرة أخرى");
    } finally {
      setSubmittingRecipe(false);
    }
  };

  // Bulk Selection Handlers
  const toggleSelectAll = () => {
    if (selectedIds.size === paginatedProducts.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(paginatedProducts.map((p) => p.id)));
    }
  };

  const toggleSelectOne = (id: string) => {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedIds(next);
  };

  // Export CSV Handler
  const exportCSV = (listToExport = filteredAndSortedProducts) => {
    const headers = ["المعرف", "اسم المنتج", "التصنيف", "سعر البيع", "سعر التكلفة", "الإتاحة", "الحالة"];
    const rows = listToExport.map((p) => [
      p.id,
      `"${p.name.replace(/"/g, '""')}"`,
      translateProductCategory(p.category),
      p.price,
      p.costPrice ?? 0,
      p.availability ? "متاح" : "مش متاح",
      p.active ? "نشط" : "غير نشط",
    ]);

    const csvContent = "\uFEFF" + [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `products_export_${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("تم تصدير ملف CSV بنجاح");
  };

  // Reset Filters
  const clearFilters = () => {
    setSearch("");
    setCategoryFilter("");
    setStatusFilter("all");
    setStockFilter("all");
    setSortBy("newest");
    setPage(1);
  };

  return (
    <div className="space-y-5" dir="rtl">
      {/* ════════════════════════════════════════════════════════════
          1. PAGE HEADER
          ════════════════════════════════════════════════════════════ */}
      <div className="bg-white dark:bg-slate-900 p-5 sm:p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20 shrink-0">
            <ShoppingBag size={28} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">إدارة المنتجات</h1>
              <span className="rounded-full bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 text-xs font-black px-2.5 py-0.5">
                {rawProducts.length} منتج
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-medium">
              التحكم الكامل في الأصناف، الأسعار، الإتاحة، والوصفات للباريستا ونقطة البيع.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {canManage && (
            <button
              type="button"
              onClick={openCreate}
              className="flex items-center justify-center gap-2 rounded-2xl bg-amber-500 hover:bg-amber-400 text-slate-950 px-5 py-3 text-sm font-black shadow-md shadow-amber-500/20 active:scale-95 transition-all cursor-pointer"
            >
              <Plus size={18} />
              إضافة منتج
            </button>
          )}

          <button
            type="button"
            onClick={() => setShowImportModal(true)}
            className="flex items-center justify-center gap-2 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 px-4 py-3 text-xs font-bold transition-all cursor-pointer"
          >
            <FileSpreadsheet size={16} />
            استيراد Excel
          </button>

          <div className="relative">
            <button
              type="button"
              onClick={() => exportCSV()}
              className="flex items-center justify-center gap-2 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 px-4 py-3 text-xs font-bold transition-all cursor-pointer shadow-2xs"
            >
              <Download size={15} />
              تصدير CSV
            </button>
          </div>
        </div>
      </div>

      {/* ════════════════════════════════════════════════════════════
          2. COMPACT STATISTICS SECTION (5 Cards, Max Height 85px)
          ════════════════════════════════════════════════════════════ */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        <button
          type="button"
          onClick={() => { setStatusFilter("all"); setStockFilter("all"); }}
          className={`flex items-center justify-between p-3.5 rounded-2xl border transition-all text-right h-[84px] cursor-pointer ${
            statusFilter === "all" && stockFilter === "all"
              ? "bg-amber-50/80 dark:bg-amber-950/40 border-amber-400 dark:border-amber-600 ring-2 ring-amber-400/20"
              : "bg-white dark:bg-slate-900 border-slate-200/80 dark:border-slate-800 hover:border-slate-300"
          }`}
        >
          <div className="space-y-0.5">
            <p className="text-[11px] font-bold text-slate-500 dark:text-slate-400">إجمالي المنتجات</p>
            <p className="text-2xl font-black text-slate-900 dark:text-white font-mono">{stats.total}</p>
          </div>
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 shrink-0">
            <Package size={20} />
          </div>
        </button>

        <button
          type="button"
          onClick={() => { setStatusFilter("active"); setStockFilter("available"); }}
          className={`flex items-center justify-between p-3.5 rounded-2xl border transition-all text-right h-[84px] cursor-pointer ${
            stockFilter === "available"
              ? "bg-emerald-50/80 dark:bg-emerald-950/40 border-emerald-400 dark:border-emerald-600 ring-2 ring-emerald-400/20"
              : "bg-white dark:bg-slate-900 border-slate-200/80 dark:border-slate-800 hover:border-slate-300"
          }`}
        >
          <div className="space-y-0.5">
            <p className="text-[11px] font-bold text-slate-500 dark:text-slate-400">متاح للبيع</p>
            <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400 font-mono">{stats.active}</p>
          </div>
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 shrink-0">
            <CheckCircle2 size={20} />
          </div>
        </button>

        <button
          type="button"
          onClick={() => { setStatusFilter("inactive"); setStockFilter("all"); }}
          className={`flex items-center justify-between p-3.5 rounded-2xl border transition-all text-right h-[84px] cursor-pointer ${
            statusFilter === "inactive"
              ? "bg-rose-50/80 dark:bg-rose-950/40 border-rose-400 dark:border-rose-600 ring-2 ring-rose-400/20"
              : "bg-white dark:bg-slate-900 border-slate-200/80 dark:border-slate-800 hover:border-slate-300"
          }`}
        >
          <div className="space-y-0.5">
            <p className="text-[11px] font-bold text-slate-500 dark:text-slate-400">غير نشط / موقوف</p>
            <p className="text-2xl font-black text-rose-600 dark:text-rose-400 font-mono">{stats.inactive}</p>
          </div>
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 shrink-0">
            <PowerOff size={20} />
          </div>
        </button>

        <button
          type="button"
          onClick={() => { setStatusFilter("active"); setStockFilter("out_of_stock"); }}
          className={`flex items-center justify-between p-3.5 rounded-2xl border transition-all text-right h-[84px] cursor-pointer ${
            stockFilter === "out_of_stock"
              ? "bg-amber-50/80 dark:bg-amber-950/40 border-amber-400 dark:border-amber-600 ring-2 ring-amber-400/20"
              : "bg-white dark:bg-slate-900 border-slate-200/80 dark:border-slate-800 hover:border-slate-300"
          }`}
        >
          <div className="space-y-0.5">
            <p className="text-[11px] font-bold text-slate-500 dark:text-slate-400">مش متاح / نفد</p>
            <p className="text-2xl font-black text-amber-600 dark:text-amber-400 font-mono">{stats.outOfStock}</p>
          </div>
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 shrink-0">
            <EyeOff size={20} />
          </div>
        </button>

        <button
          type="button"
          onClick={() => { setCategoryFilter("cans"); }}
          className={`flex items-center justify-between p-3.5 rounded-2xl border transition-all text-right h-[84px] cursor-pointer ${
            categoryFilter === "cans"
              ? "bg-sky-50/80 dark:bg-sky-950/40 border-sky-400 dark:border-sky-600 ring-2 ring-sky-400/20"
              : "bg-white dark:bg-slate-900 border-slate-200/80 dark:border-slate-800 hover:border-slate-300"
          }`}
        >
          <div className="space-y-0.5">
            <p className="text-[11px] font-bold text-slate-500 dark:text-slate-400">تلاجة / معلبات</p>
            <p className="text-2xl font-black text-sky-600 dark:text-sky-400 font-mono">{stats.fridgeCount}</p>
          </div>
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-50 dark:bg-sky-950/60 text-sky-600 dark:text-sky-400 shrink-0">
            <Snowflake size={20} />
          </div>
        </button>
      </div>

      {/* ════════════════════════════════════════════════════════════
          3. SEARCH & FILTERS TOOLBAR (Sticky on Desktop)
          ════════════════════════════════════════════════════════════ */}
      <div className="sticky top-4 z-20 space-y-3 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 p-4 shadow-sm backdrop-blur-md">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={17} />
            <input
              type="text"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              placeholder="ابحث باسم المنتج، الكود، أو الوصف..."
              className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 py-2.5 pl-4 pr-10 text-sm font-semibold text-slate-900 dark:text-white placeholder:text-slate-400 outline-none focus:border-amber-500 focus:bg-white dark:focus:bg-slate-900 transition-all"
            />
          </div>

          {/* Filter Controls Dropdowns */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Category Dropdown */}
            <select
              value={categoryFilter}
              onChange={(e) => { setCategoryFilter(e.target.value); setPage(1); }}
              className="rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2.5 text-xs font-bold text-slate-800 dark:text-slate-200 outline-none focus:border-amber-500 cursor-pointer"
            >
              {CATEGORIES.map((c) => (
                <option key={c.value} value={c.value}>{c.label}</option>
              ))}
            </select>

            {/* Status Dropdown */}
            <select
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
              className="rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2.5 text-xs font-bold text-slate-800 dark:text-slate-200 outline-none focus:border-amber-500 cursor-pointer"
            >
              <option value="all">كل التفعيل</option>
              <option value="active">نشط (شغال)</option>
              <option value="inactive">غير نشط (موقوف)</option>
            </select>

            {/* Stock Availability Dropdown */}
            <select
              value={stockFilter}
              onChange={(e) => { setStockFilter(e.target.value); setPage(1); }}
              className="rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2.5 text-xs font-bold text-slate-800 dark:text-slate-200 outline-none focus:border-amber-500 cursor-pointer"
            >
              <option value="all">كل الإتاحة</option>
              <option value="available">متاح للبيع</option>
              <option value="out_of_stock">مش متاح / نفد</option>
            </select>

            {/* Sort Dropdown */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortOption)}
              className="rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2.5 text-xs font-bold text-slate-800 dark:text-slate-200 outline-none focus:border-amber-500 cursor-pointer"
            >
              <option value="newest">الأحدث أولاً</option>
              <option value="oldest">الأقدم أولاً</option>
              <option value="name">بالاسم (أ-ي)</option>
              <option value="price_asc">السعر: من الأقل</option>
              <option value="price_desc">السعر: من الأعلى</option>
            </select>

            {/* Clear Filters Button */}
            {(search || categoryFilter || statusFilter !== "all" || stockFilter !== "all" || sortBy !== "newest") && (
              <button
                type="button"
                onClick={clearFilters}
                className="flex items-center gap-1 rounded-xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 px-3 py-2.5 text-xs font-bold hover:bg-rose-100 transition-colors cursor-pointer"
              >
                <X size={14} /> مسح الفلاتر
              </button>
            )}

            {/* View Switcher Buttons */}
            <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border border-slate-200/60 dark:border-slate-700">
              <button
                type="button"
                onClick={() => setViewMode("table")}
                className={`rounded-lg p-1.5 transition-all cursor-pointer ${
                  viewMode === "table"
                    ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-2xs"
                    : "text-slate-500 hover:text-slate-900 dark:hover:text-white"
                }`}
                title="عرض الجدول"
              >
                <List size={16} />
              </button>
              <button
                type="button"
                onClick={() => setViewMode("grid")}
                className={`rounded-lg p-1.5 transition-all cursor-pointer ${
                  viewMode === "grid"
                    ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-2xs"
                    : "text-slate-500 hover:text-slate-900 dark:hover:text-white"
                }`}
                title="عرض الشبكة (كروت)"
              >
                <Grid size={16} />
              </button>
            </div>
          </div>
        </div>

        {/* Quick Filter Category Chips */}
        <div className="flex flex-wrap items-center gap-1.5 pt-1 border-t border-slate-100 dark:border-slate-800">
          <span className="text-[11px] font-bold text-slate-400 ml-1">أبرز الأقسام:</span>
          {TOP_CATEGORIES.map((chip) => {
            const isSelected = categoryFilter === chip.value;
            return (
              <button
                key={chip.value}
                type="button"
                onClick={() => {
                  setCategoryFilter(isSelected ? "" : chip.value);
                  setPage(1);
                }}
                className={`rounded-xl px-3 py-1 text-xs font-bold transition-all cursor-pointer ${
                  isSelected
                    ? "bg-amber-500 text-slate-950 font-black shadow-2xs"
                    : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
                }`}
              >
                {chip.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* ════════════════════════════════════════════════════════════
          BULK ACTIONS FLOATING TOOLBAR
          ════════════════════════════════════════════════════════════ */}
      {selectedIds.size > 0 && (
        <div className="fixed bottom-6 right-1/2 translate-x-1/2 z-40 bg-slate-900 text-white px-6 py-3.5 rounded-2xl shadow-2xl border border-slate-800 flex items-center gap-4 animate-in slide-in-from-bottom duration-200">
          <div className="flex items-center gap-2 border-l border-slate-700 pl-4">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-amber-500 text-slate-950 text-xs font-black">
              {selectedIds.size}
            </span>
            <span className="text-xs font-bold">منتج محدد</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => bulkReactivateMutation.mutate(Array.from(selectedIds))}
              className="flex items-center gap-1 rounded-xl bg-emerald-600 hover:bg-emerald-500 px-3 py-1.5 text-xs font-bold transition-colors"
            >
              <CheckCircle2 size={13} /> تفعيل
            </button>

            <button
              type="button"
              onClick={() => bulkDeactivateMutation.mutate(Array.from(selectedIds))}
              className="flex items-center gap-1 rounded-xl bg-slate-800 hover:bg-slate-700 text-rose-400 px-3 py-1.5 text-xs font-bold transition-colors"
            >
              <PowerOff size={13} /> تعطيل
            </button>

            <button
              type="button"
              onClick={() => {
                const selectedProds = rawProducts.filter((p) => selectedIds.has(p.id));
                exportCSV(selectedProds);
              }}
              className="flex items-center gap-1 rounded-xl bg-slate-800 hover:bg-slate-700 px-3 py-1.5 text-xs font-bold transition-colors"
            >
              <Download size={13} /> تصدير المحدد
            </button>

            <button
              type="button"
              onClick={() => setSelectedIds(new Set())}
              className="text-xs text-slate-400 hover:text-white mr-2 font-bold"
            >
              إلغاء التحديد
            </button>
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════
          4. MAIN PRODUCT LIST (TABLE OR GRID)
          ════════════════════════════════════════════════════════════ */}
      {productsQuery.isLoading ? (
        <div className="flex flex-col items-center justify-center py-20 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
          <Spinner size={34} />
          <p className="mt-3 text-xs font-bold text-slate-400">جاري تحميل قائمة المنتجات...</p>
        </div>
      ) : paginatedProducts.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 p-12 rounded-3xl border border-slate-200/80 dark:border-slate-800 text-center space-y-4 shadow-xs">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-3xl bg-amber-50 dark:bg-amber-950/40 text-amber-500">
            <ShoppingBag size={38} />
          </div>
          <div className="max-w-sm mx-auto space-y-1">
            <h3 className="text-base font-black text-slate-900 dark:text-white">لا توجد منتجات مطابقة</h3>
            <p className="text-xs font-bold text-slate-400">
              {search || categoryFilter || statusFilter !== "all"
                ? "لم نجد أي منتج يطابق خيارات التصفية الحالية."
                : "لم يتم إضافة أي منتج في النظام حتى الآن."}
            </p>
          </div>
          <button
            type="button"
            onClick={clearFilters}
            className="inline-flex items-center gap-2 rounded-2xl bg-amber-500 px-6 py-2.5 text-sm font-black text-slate-950 hover:bg-amber-400 transition cursor-pointer"
          >
            <RefreshCw size={15} /> إعادة ضبط الفلاتر
          </button>
        </div>
      ) : viewMode === "table" ? (
        /* TABLE VIEW */
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-right text-sm">
              <thead className="sticky top-0 z-10 bg-slate-50 dark:bg-slate-800/80 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="p-4 w-10 text-center">
                    <input
                      type="checkbox"
                      checked={selectedIds.size === paginatedProducts.length && paginatedProducts.length > 0}
                      onChange={toggleSelectAll}
                      className="h-4 w-4 rounded border-slate-300 text-amber-500 focus:ring-amber-500 cursor-pointer"
                    />
                  </th>
                  <th className="p-4">المنتج</th>
                  <th className="p-4">التصنيف</th>
                  <th className="p-4">سعر البيع</th>
                  <th className="p-4">التكلفة</th>
                  <th className="p-4">الحالة والتوافر</th>
                  <th className="p-4 text-center">الظهور (تفعيل)</th>
                  <th className="p-4 text-left">الإجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-medium">
                {paginatedProducts.map((product) => {
                  const isSelected = selectedIds.has(product.id);
                  return (
                    <tr
                      key={product.id}
                      className={`hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors ${
                        !product.active ? "opacity-60 bg-slate-50/30 dark:bg-slate-900/30" : ""
                      }`}
                    >
                      {/* Checkbox */}
                      <td className="p-4 text-center">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleSelectOne(product.id)}
                          className="h-4 w-4 rounded border-slate-300 text-amber-500 focus:ring-amber-500 cursor-pointer"
                        />
                      </td>

                      {/* Product Thumbnail & Names */}
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <ProductThumbnail
                            src={product.imageUrl}
                            alt={product.name}
                            category={product.category}
                            className="w-12 h-12 rounded-xl"
                            iconSize={22}
                          />
                          <div className="space-y-0.5 max-w-[200px]">
                            <p className="font-bold text-slate-900 dark:text-white truncate" title={product.name}>
                              {product.name}
                            </p>
                            {product.description && (
                              <p className="text-xs text-slate-400 truncate">{product.description}</p>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Category */}
                      <td className="p-4">
                        <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 dark:bg-slate-800 px-3 py-1 text-xs font-bold text-slate-700 dark:text-slate-300">
                          {translateProductCategory(product.category)}
                        </span>
                      </td>

                      {/* Selling Price */}
                      <td className="p-4 font-black text-emerald-700 dark:text-emerald-400 ltr-value font-mono text-base">
                        {money(product.price)}
                      </td>

                      {/* Cost Price */}
                      <td className="p-4 font-semibold text-slate-500 dark:text-slate-400 ltr-value font-mono">
                        {money(product.costPrice ?? 0)}
                      </td>

                      {/* Availability Badges */}
                      <td className="p-4">
                        <div className="flex flex-wrap gap-1 items-center">
                          <span
                            className={`rounded-full px-2.5 py-0.5 text-[10px] font-black ${
                              product.availability
                                ? "bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200/60"
                                : "bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200/60"
                            }`}
                          >
                            {product.availability ? "متاح للبيع" : "نفد / مش متاح"}
                          </span>
                          {product.isFridge && (
                            <span className="rounded-full bg-sky-50 dark:bg-sky-950/60 text-sky-700 dark:text-sky-300 border border-sky-200/60 px-2 py-0.5 text-[10px] font-bold">
                              تلاجة
                            </span>
                          )}
                          {product.isBakery && (
                            <span className="rounded-full bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border border-purple-200/60 px-2 py-0.5 text-[10px] font-bold">
                              بيكرى
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Active Status Toggle */}
                      <td className="p-4 text-center">
                        {canManage ? (
                          <button
                            type="button"
                            onClick={() =>
                              toggleActiveMutation.mutate({
                                id: product.id,
                                action: product.active ? "deactivate" : "reactivate",
                              })
                            }
                            disabled={toggleActiveMutation.isPending}
                            className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                              product.active ? "bg-emerald-500" : "bg-slate-300 dark:bg-slate-700"
                            }`}
                            title={product.active ? "إيقاف المنتج" : "تفعيل المنتج"}
                          >
                            <span
                              className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                                product.active ? "-translate-x-5" : "translate-x-0"
                              }`}
                            />
                          </button>
                        ) : (
                          <Badge tone={product.active ? "success" : "neutral"}>
                            {product.active ? "نشط" : "موقوف"}
                          </Badge>
                        )}
                      </td>

                      {/* Actions Menu */}
                      <td className="p-4 text-left relative">
                        <div className="flex items-center justify-end gap-1">
                          {canManage && (
                            <>
                              <button
                                type="button"
                                onClick={() => openEdit(product)}
                                className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 transition-all shadow-2xs"
                                title="تعديل المنتج"
                              >
                                <Edit3 size={15} />
                              </button>

                              <button
                                type="button"
                                onClick={() => openRecipeModal(product)}
                                className="rounded-xl border border-violet-200 dark:border-violet-800 bg-violet-50 dark:bg-violet-950/60 p-2 text-violet-700 dark:text-violet-300 hover:bg-violet-100 transition-all shadow-2xs"
                                title="إدارة مكونات الوصفة"
                              >
                                <Settings2 size={15} />
                              </button>

                              <button
                                type="button"
                                onClick={() => toggleAvailMutation.mutate({ product })}
                                className={`rounded-xl border p-2 transition-all shadow-2xs ${
                                  product.availability
                                    ? "bg-amber-50 dark:bg-amber-950/60 text-amber-700 border-amber-200"
                                    : "bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 border-emerald-200"
                                }`}
                                title={product.availability ? "إيقاف الإتاحة" : "إتاحة للبيع"}
                              >
                                {product.availability ? <EyeOff size={15} /> : <Eye size={15} />}
                              </button>

                              <button
                                type="button"
                                onClick={() => duplicateProduct(product)}
                                className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-2 text-slate-500 hover:text-slate-900 transition-all shadow-2xs"
                                title="نسخ المنتج"
                              >
                                <Copy size={15} />
                              </button>

                              <button
                                type="button"
                                onClick={() => {
                                  if (confirm(`هل أنت تأكد من حذف المنتج «${product.name}»؟`)) {
                                    deleteProductMutation.mutate(product.id);
                                  }
                                }}
                                className="rounded-xl border border-rose-100 dark:border-rose-900 bg-white dark:bg-slate-800 p-2 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950 transition-all shadow-2xs"
                                title="حذف"
                              >
                                <Trash2 size={15} />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* GRID VIEW (Square 1:1 Aspect Ratio Cards) */
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {paginatedProducts.map((product) => (
            <div
              key={product.id}
              className={`group flex flex-col rounded-3xl border bg-white dark:bg-slate-900 overflow-hidden transition-all shadow-2xs hover:shadow-md ${
                !product.active
                  ? "opacity-65 border-slate-200 dark:border-slate-800"
                  : "border-slate-200/80 dark:border-slate-800 hover:border-amber-400"
              }`}
            >
              {/* 1:1 Aspect Ratio Image Container */}
              <div className="relative aspect-square w-full bg-slate-50 dark:bg-slate-800 overflow-hidden">
                <ProductThumbnail
                  src={product.imageUrl}
                  alt={product.name}
                  category={product.category}
                  className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300"
                  iconSize={42}
                />

                {/* Floating Category Pill */}
                <span className="absolute top-3 right-3 rounded-full bg-white/90 dark:bg-slate-900/90 backdrop-blur-sm border border-slate-200/60 text-slate-900 dark:text-white px-3 py-1 text-[11px] font-black shadow-xs">
                  {translateProductCategory(product.category)}
                </span>

                {/* Status Badges */}
                <div className="absolute bottom-3 right-3 flex flex-wrap gap-1">
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-[10px] font-black ${
                      product.availability
                        ? "bg-emerald-500 text-slate-950 shadow-xs"
                        : "bg-amber-500 text-slate-950 shadow-xs"
                    }`}
                  >
                    {product.availability ? "متاح للبيع" : "نفد / مش متاح"}
                  </span>
                </div>
              </div>

              {/* Product Info */}
              <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                <div>
                  <h3 className="font-black text-slate-900 dark:text-white text-base leading-snug line-clamp-1">
                    {product.name}
                  </h3>
                  {product.description && (
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-2">
                      {product.description}
                    </p>
                  )}
                </div>

                <div className="flex items-center justify-between border-t border-slate-100 dark:border-slate-800 pt-3">
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 block">السعر</span>
                    <span className="text-xl font-black text-emerald-600 dark:text-emerald-400 ltr-value font-mono">
                      {money(product.price)}
                    </span>
                  </div>

                  {canManage && (
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => openEdit(product)}
                        className="rounded-xl border border-slate-200 dark:border-slate-700 p-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 transition shadow-2xs"
                        title="تعديل"
                      >
                        <Edit3 size={14} />
                      </button>
                      <button
                        type="button"
                        onClick={() => openRecipeModal(product)}
                        className="rounded-xl border border-violet-200 text-violet-600 bg-violet-50 p-2 hover:bg-violet-100 transition shadow-2xs"
                        title="الوصفة"
                      >
                        <Settings2 size={14} />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════
          5. PAGINATION TOOLBAR
          ════════════════════════════════════════════════════════════ */}
      {filteredAndSortedProducts.length > 0 && (
        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3 text-xs text-slate-500 font-bold">
            <span>
              عرض {(currentPage - 1) * pageSize + 1} إلى {Math.min(currentPage * pageSize, totalItems)} من أصل {totalItems} منتج
            </span>
            <div className="flex items-center gap-1.5 border-r border-slate-200 dark:border-slate-700 pr-3">
              <span>عرض:</span>
              <select
                value={pageSize}
                onChange={(e) => { setPageSize(Number(e.target.value)); setPage(1); }}
                className="rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-2 py-1 text-xs font-bold outline-none cursor-pointer"
              >
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="flex items-center gap-1 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-1.5 text-xs font-bold text-slate-700 dark:text-slate-200 disabled:opacity-40 hover:bg-slate-50 transition cursor-pointer"
            >
              <ChevronRight size={15} /> السابق
            </button>

            <span className="px-3 py-1 text-xs font-black text-slate-900 dark:text-white font-mono">
              صفحة {currentPage} من {totalPages}
            </span>

            <button
              type="button"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="flex items-center gap-1 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-1.5 text-xs font-bold text-slate-700 dark:text-slate-200 disabled:opacity-40 hover:bg-slate-50 transition cursor-pointer"
            >
              التالي <ChevronLeft size={15} />
            </button>
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════
          FULL ADD / EDIT PRODUCT MODAL
          ════════════════════════════════════════════════════════════ */}
      <Modal
        isOpen={showFullFormModal}
        onClose={() => setShowFullFormModal(false)}
        title={editingProduct ? "تعديل بيانات المنتج" : "إضافة منتج جديد"}
        size="lg"
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            saveProductMutation.mutate(form);
          }}
          className="space-y-5"
          dir="rtl"
        >
          {/* Section 1: Basic Info */}
          <div className="space-y-3">
            <p className="text-xs font-black text-amber-800 dark:text-amber-400 uppercase tracking-wide">1. البيانات الأساسية</p>
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField label="اسم المنتج *">
                <Input
                  required
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="مثال: كابوتشينو دبل شوت"
                />
              </FormField>

              <FormField label="التصنيف الرئيسي *">
                <select
                  value={form.category}
                  onChange={(e) => {
                    const val = e.target.value;
                    setForm({
                      ...form,
                      category: val,
                      isFridge: FRIDGE_CATEGORIES.includes(val) ? true : form.isFridge,
                    });
                  }}
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2.5 text-sm font-bold outline-none focus:border-amber-500"
                >
                  {CATEGORIES.filter((c) => c.value).map((c) => (
                    <option key={c.value} value={c.value}>
                      {c.label}
                    </option>
                  ))}
                </select>
              </FormField>
            </div>
          </div>

          {/* Section 2: Pricing */}
          <div className="space-y-3 border-t border-slate-100 dark:border-slate-800 pt-4">
            <p className="text-xs font-black text-amber-800 dark:text-amber-400 uppercase tracking-wide">2. التسعير والتكلفة</p>
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField label="سعر البيع (ج.م) *">
                <Input
                  required
                  type="text"
                  inputMode="decimal"
                  value={form.price}
                  onChange={(e) => setForm({ ...form, price: e.target.value })}
                  placeholder="0.00"
                />
              </FormField>

              <FormField label="سعر التكلفة (سعر الوارد ج.م)">
                <Input
                  type="text"
                  inputMode="decimal"
                  value={form.costPrice}
                  onChange={(e) => setForm({ ...form, costPrice: e.target.value })}
                  placeholder="0.00"
                />
              </FormField>
            </div>
          </div>

          {/* Section 3: Bar & Discount Settings */}
          <div className="space-y-3 border-t border-slate-100 dark:border-slate-800 pt-4">
            <p className="text-xs font-black text-amber-800 dark:text-amber-400 uppercase tracking-wide">3. استثناءات الخصم والبار</p>
            <div className="flex flex-wrap gap-4">
              <label className="flex items-center gap-2 cursor-pointer select-none rounded-xl border border-slate-200 dark:border-slate-800 p-3 bg-slate-50 dark:bg-slate-800/50 flex-1">
                <input
                  type="checkbox"
                  checked={form.isFridge}
                  onChange={(e) => setForm({ ...form, isFridge: e.target.checked })}
                  className="h-4 w-4 rounded border-slate-300 text-amber-500 focus:ring-amber-500 accent-amber-500"
                />
                <div className="text-xs">
                  <p className="font-black text-slate-900 dark:text-white">منتج تلاجة / معلبات</p>
                  <p className="text-slate-400">لا ينطبق عليه خصم المالك والstaff (يُباع بسعره الكامل)</p>
                </div>
              </label>

              <label className="flex items-center gap-2 cursor-pointer select-none rounded-xl border border-slate-200 dark:border-slate-800 p-3 bg-slate-50 dark:bg-slate-800/50 flex-1">
                <input
                  type="checkbox"
                  checked={form.isBakery}
                  onChange={(e) => setForm({ ...form, isBakery: e.target.checked })}
                  className="h-4 w-4 rounded border-slate-300 text-amber-500 focus:ring-amber-500 accent-amber-500"
                />
                <div className="text-xs">
                  <p className="font-black text-slate-900 dark:text-white">منتج بيكرى / مخبوزات</p>
                  <p className="text-slate-400">صنف جاهز من المخبز</p>
                </div>
              </label>
            </div>
          </div>

          {/* Section 4: Image & Description */}
          <div className="space-y-3 border-t border-slate-100 dark:border-slate-800 pt-4">
            <p className="text-xs font-black text-amber-800 dark:text-amber-400 uppercase tracking-wide">4. صورة المنتج والوصف</p>
            <FormField label="رابط صورة المنتج (URL)">
              <Input
                value={form.imageUrl}
                onChange={(e) => setForm({ ...form, imageUrl: e.target.value })}
                placeholder="https://..."
              />
            </FormField>

            {form.imageUrl && (
              <div className="flex items-center gap-3 p-2 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
                <ProductThumbnail src={form.imageUrl} alt="معاينة" className="w-14 h-14 rounded-lg" />
                <p className="text-xs font-bold text-emerald-600">تم التعرف على معاينة الصورة بنجاح</p>
              </div>
            )}

            <FormField label="وصف المنتج مختصر">
              <textarea
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                rows={2}
                placeholder="ملاحظات أو تفاصيل المكونات السريعة..."
                className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-3 text-sm font-semibold outline-none focus:border-amber-500"
              />
            </FormField>
          </div>

          {/* Submit */}
          <Btn
            type="submit"
            className="h-14 w-full rounded-2xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-base transition-all shadow-md shadow-amber-500/20"
            loading={saveProductMutation.isPending}
          >
            {editingProduct ? "حفظ التعديلات" : "إضافة المنتج الآن"}
          </Btn>
        </form>
      </Modal>

      {/* ════════════════════════════════════════════════════════════
          RECIPE / INGREDIENTS MODAL
          ════════════════════════════════════════════════════════════ */}
      {recipeProduct && (
        <Modal
          isOpen={!!recipeProduct}
          onClose={() => setRecipeProduct(null)}
          title={`إدارة مكونات وصفة: ${recipeProduct.name}`}
          size="lg"
        >
          <div className="space-y-5" dir="rtl">
            {recipeLoading ? (
              <div className="py-12 text-center text-slate-500 font-semibold">
                <Spinner size={28} />
                <p className="mt-2 text-xs">جاري تحميل مكونات المخزن والوصفة...</p>
              </div>
            ) : (
              <>
                <div className="bg-amber-50 dark:bg-amber-950/40 p-4 rounded-2xl border border-amber-200/80 dark:border-amber-800/80 space-y-3">
                  <p className="text-xs font-black text-amber-900 dark:text-amber-300">إضافة خامة من المخزن لوصفة المنتج</p>
                  <div className="grid gap-3 sm:grid-cols-3 items-end">
                    <FormField label="الصنف من المخزن">
                      <select
                        value={selectedItemId}
                        onChange={(e) => setSelectedItemId(e.target.value)}
                        className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-xs font-bold outline-none"
                      >
                        <option value="">اختر الخامة المخزنية...</option>
                        {inventoryItems.map((item) => (
                          <option key={item.id} value={item.id}>
                            {item.name} ({item.unit}) — رصيد: {Number(item.currentStock)}
                          </option>
                        ))}
                      </select>
                    </FormField>

                    <FormField label="الكمية لكل كوب/منتج">
                      <Input
                        type="text"
                        inputMode="decimal"
                        value={selectedQty}
                        onChange={(e) => setSelectedQty(e.target.value)}
                        placeholder="مثال: 18 (جرام)"
                      />
                    </FormField>

                    <button
                      type="button"
                      onClick={handleAddRecipeItem}
                      className="rounded-xl bg-amber-500 text-slate-950 font-black py-2.5 px-4 text-xs hover:bg-amber-400 transition cursor-pointer"
                    >
                      + إضافة للوصفة
                    </button>
                  </div>
                </div>

                {/* Recipe Items Table */}
                <div className="space-y-2">
                  <p className="text-xs font-black text-slate-700 dark:text-slate-300">مكونات الوصفة الحالية:</p>
                  {recipeItems.length === 0 ? (
                    <p className="text-xs text-slate-400 py-6 text-center border border-dashed border-slate-200 rounded-2xl">
                      لا توجد مكونات مضافة لهذه الوصفة بعد.
                    </p>
                  ) : (
                    <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                      {recipeItems.map((item) => (
                        <div
                          key={item.inventoryItemId}
                          className="flex items-center justify-between bg-slate-50 dark:bg-slate-800/60 p-3 rounded-xl border border-slate-200/70 text-xs"
                        >
                          <span className="font-bold text-slate-900 dark:text-white">{item.name || "خامة مخزنية"}</span>
                          <span className="font-black text-amber-700 dark:text-amber-400 ltr-value font-mono">
                            {item.quantity} {item.unit || ""}
                          </span>
                          <button
                            type="button"
                            onClick={() => setRecipeItems(recipeItems.filter((i) => i.inventoryItemId !== item.inventoryItemId))}
                            className="text-rose-600 hover:text-rose-700 p-1 font-bold"
                          >
                            حذف
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <button
                  type="button"
                  onClick={handleSaveRecipe}
                  disabled={submittingRecipe}
                  className="w-full h-12 rounded-2xl bg-slate-900 text-white font-black text-sm hover:bg-slate-800 transition disabled:opacity-50 cursor-pointer"
                >
                  {submittingRecipe ? "جاري حفظ الوصفة..." : "حفظ تغييرات الوصفة"}
                </button>
              </>
            )}
          </div>
        </Modal>
      )}

      {/* ════════════════════════════════════════════════════════════
          EXCEL / CSV IMPORT MODAL
          ════════════════════════════════════════════════════════════ */}
      {showImportModal && (
        <Modal
          isOpen={showImportModal}
          onClose={() => setShowImportModal(false)}
          title="استيراد منتجات من ملف CSV"
          size="lg"
        >
          <div className="space-y-4" dir="rtl">
            <p className="text-xs text-slate-500 leading-relaxed">
              قم بلصق بيانات CSV (الاسم، التصنيف، سعر البيع، سعر التكلفة) مفصولة بفاصلة لإنشاء منتجات دفعة واحدة:
            </p>
            <textarea
              value={importCsvText}
              onChange={(e) => setImportCsvText(e.target.value)}
              rows={8}
              placeholder="اسم المنتج, coffee, 50, 20&#10;شاي أخضر, tea, 25, 10"
              className="w-full rounded-2xl border border-slate-200 dark:border-slate-700 p-4 text-xs font-mono outline-none focus:border-amber-500"
            />
            <div className="flex gap-2">
              <button
                type="button"
                onClick={async () => {
                  if (!importCsvText.trim()) return;
                  const lines = importCsvText.trim().split("\n");
                  let successCount = 0;
                  for (const line of lines) {
                    const parts = line.split(",").map((s) => s.trim());
                    if (parts.length >= 3) {
                      try {
                        await api.post("/products", {
                          name: parts[0],
                          category: parts[1] || "coffee",
                          price: Number(parts[2]) || 0,
                          costPrice: Number(parts[3]) || 0,
                        });
                        successCount++;
                      } catch (e) {}
                    }
                  }
                  qc.invalidateQueries({ queryKey: ["products"] });
                  setShowImportModal(false);
                  setImportCsvText("");
                  toast.success(`تم استيراد ${successCount} منتج بنجاح!`);
                }}
                className="flex-1 py-3 rounded-xl bg-amber-500 text-slate-950 font-black text-xs hover:bg-amber-400 transition"
              >
                تأكيد الاستيراد
              </button>
              <button
                type="button"
                onClick={() => setShowImportModal(false)}
                className="py-3 px-5 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-100 transition"
              >
                إلغاء
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
