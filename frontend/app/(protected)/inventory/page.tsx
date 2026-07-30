"use client";

import { useEffect, useState, useMemo } from "react";
import {
  AlertTriangle,
  ArrowDownLeft,
  ArrowUpRight,
  BarChart3,
  Boxes,
  Check,
  CheckCircle2,
  ChevronRight,
  Clock,
  Download,
  Edit3,
  Eye,
  FileSpreadsheet,
  FileText,
  Filter,
  History,
  Info,
  Layers,
  MinusCircle,
  Package,
  PackageCheck,
  PackageMinus,
  PackagePlus,
  Plus,
  PlusCircle,
  RefreshCw,
  Search,
  Settings2,
  Sparkles,
  Tag,
  Trash2,
  TrendingDown,
  TrendingUp,
  X,
  Zap,
} from "lucide-react";
import { toast } from "sonner";
import { api } from "../../../lib/api";
import { money, dateTime } from "../../../lib/format";
import { useAuthStore } from "../../../store/auth-store";
import {
  Badge,
  Btn,
  FormField,
  Input,
  Modal,
  Spinner,
} from "../../../components/ui";

type InventoryItem = {
  id: string;
  name: string;
  unit: string;
  category?: string | null;
  currentStock: number | string;
  minStockLevel: number | string;
  isFridge?: boolean;
  isBakery?: boolean;
  costPerUnit?: number | string | null;
  _count?: { recipes: number };
};

type InventoryTransaction = {
  id: string;
  type: "in" | "out" | "adjustment";
  quantity: number;
  reason?: string | null;
  createdAt: string;
  inventoryItem: { name: string; unit: string };
  performedBy?: { firstName: string | null; lastName: string | null; email: string } | null;
};

const CATEGORIES = [
  { value: "", label: "جميع الأقسام" },
  { value: "coffee", label: "قهوة وبن" },
  { value: "tea", label: "شاي وأعشاب" },
  { value: "raw", label: "خامات رئيسية (بودرة، سكر...)" },
  { value: "dairy", label: "ألبان ومنتجات حليب" },
  { value: "drinks", label: "مشروبات ومعلبات" },
  { value: "packaging", label: "تعبئة وتغليف (أكواب، قش)" },
  { value: "cleaning", label: "منظفات ومستلزمات نظافة" },
  { value: "bakery", label: "مخبوزات وتسهيلات" },
  { value: "other", label: "أخرى" },
];

const EMPTY_NEW_ITEM = {
  name: "",
  unit: "جرام",
  category: "raw",
  minStockLevel: "10",
  costPerUnit: "0",
  initialStock: "0",
  isFridge: false,
  isBakery: false,
};

export default function InventoryPage() {
  const roleName = useAuthStore((state) => state.user?.role?.name);
  const canManageInventory = roleName === "Owner" || roleName === "Operations Manager";

  const [items, setItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [stockLevelFilter, setStockLevelFilter] = useState<"all" | "ok" | "low" | "out">("all");

  const [activeTab, setActiveTab] = useState<"items" | "stocktake" | "withdraw" | "analytics">("items");

  // Modals State
  const [showNewItemModal, setShowNewItemModal] = useState(false);
  const [newItemData, setNewItemData] = useState(EMPTY_NEW_ITEM);

  const [selectedStockItem, setSelectedStockItem] = useState<InventoryItem | null>(null);
  const [addStockData, setAddStockData] = useState({ quantity: "", reason: "" });

  const [showWasteModal, setShowWasteModal] = useState<string | null>(null);
  const [wasteData, setWasteData] = useState({ quantity: "", reason: "" });

  // Item History Modal
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyItems, setHistoryItems] = useState<InventoryTransaction[]>([]);
  const [historyItemName, setHistoryItemName] = useState("");

  // Physical Stocktake State
  const [stocktakeValues, setStocktakeValues] = useState<Record<string, string>>({});
  const [stocktakeReasons, setStocktakeReasons] = useState<Record<string, string>>({});

  // Direct Withdrawal State
  const [withdrawItemId, setWithdrawItemId] = useState("");
  const [withdrawQty, setWithdrawQty] = useState("");
  const [withdrawReason, setWithdrawReason] = useState("");

  // Transactions Tab Log
  const [allTransactions, setAllTransactions] = useState<InventoryTransaction[]>([]);
  const [loadingTransactions, setLoadingTransactions] = useState(false);

  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchInventory();
  }, []);

  useEffect(() => {
    if (activeTab === "analytics") {
      fetchTransactions();
    }
  }, [activeTab]);

  const fetchInventory = async () => {
    try {
      const res = await api.get("/inventory/items");
      setItems(res.data);
    } catch (err) {
      console.error("Failed to fetch inventory", err);
      toast.error("تعذر تحميل بيانات المخزون");
    } finally {
      setLoading(false);
    }
  };

  const fetchTransactions = async () => {
    setLoadingTransactions(true);
    try {
      const res = await api.get("/inventory/transactions", { params: { limit: 250 } });
      setAllTransactions(res.data);
    } catch (err) {
      console.error("Failed to fetch transactions", err);
    } finally {
      setLoadingTransactions(false);
    }
  };

  useEffect(() => {
    if (items.length > 0) {
      const initialValues: Record<string, string> = {};
      const initialReasons: Record<string, string> = {};
      items.forEach((item) => {
        initialValues[item.id] = String(item.currentStock);
        initialReasons[item.id] = "";
      });
      setStocktakeValues(initialValues);
      setStocktakeReasons(initialReasons);
    }
  }, [items]);

  // Statistics
  const stats = useMemo(() => {
    const total = items.length;
    let ok = 0;
    let low = 0;
    let out = 0;
    let totalVal = 0;

    items.forEach((item) => {
      const current = Number(item.currentStock) || 0;
      const minLevel = Number(item.minStockLevel) || 0;
      const cost = Number(item.costPerUnit) || 0;
      totalVal += current * cost;

      if (current <= 0) {
        out++;
      } else if (minLevel > 0 && current <= minLevel) {
        low++;
      } else {
        ok++;
      }
    });

    return { total, ok, low, out, totalVal };
  }, [items]);

  // Filtered Items List
  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      const matchesSearch =
        !search ||
        item.name.toLowerCase().includes(search.toLowerCase()) ||
        (item.category && item.category.toLowerCase().includes(search.toLowerCase()));

      const matchesCat = !categoryFilter || item.category === categoryFilter;

      const current = Number(item.currentStock) || 0;
      const minLevel = Number(item.minStockLevel) || 0;

      let matchesStockLevel = true;
      if (stockLevelFilter === "ok") {
        matchesStockLevel = current > 0 && (minLevel === 0 || current > minLevel);
      } else if (stockLevelFilter === "low") {
        matchesStockLevel = current > 0 && minLevel > 0 && current <= minLevel;
      } else if (stockLevelFilter === "out") {
        matchesStockLevel = current <= 0;
      }

      return matchesSearch && matchesCat && matchesStockLevel;
    });
  }, [items, search, categoryFilter, stockLevelFilter]);

  // Create Item Handler
  const handleCreateItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItemData.name || !newItemData.unit) {
      toast.error("يرجى إدخال اسم الخامة والوحدة");
      return;
    }
    setSubmitting(true);
    try {
      await api.post("/inventory/items", {
        name: newItemData.name.trim(),
        unit: newItemData.unit.trim(),
        category: newItemData.category || undefined,
        minStockLevel: Number(newItemData.minStockLevel) || 0,
        costPerUnit: Number(newItemData.costPerUnit) || 0,
        initialStock: Number(newItemData.initialStock) || 0,
        isFridge: newItemData.isFridge,
        isBakery: newItemData.isBakery,
      });
      toast.success("تمت إضافة الخامة الجديدة للمخزن بنجاح");
      setShowNewItemModal(false);
      setNewItemData(EMPTY_NEW_ITEM);
      fetchInventory();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "فشل إضافة الخامة");
    } finally {
      setSubmitting(false);
    }
  };

  // Add Stock Handler (Tawreed)
  const handleAddStock = async () => {
    if (!selectedStockItem || !addStockData.quantity || Number(addStockData.quantity) <= 0) {
      toast.error("يرجى كتابة كمية توريد صحيحة أكبر من صفر");
      return;
    }
    setSubmitting(true);
    try {
      await api.post(`/inventory/items/${selectedStockItem.id}/add-stock`, {
        quantity: Number(addStockData.quantity),
        reason: addStockData.reason.trim() || undefined,
      });
      toast.success("تم تسجيل التوريد وإضافة الرصيد بنجاح");
      setSelectedStockItem(null);
      setAddStockData({ quantity: "", reason: "" });
      fetchInventory();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "فشل إضافة الرصيد");
    } finally {
      setSubmitting(false);
    }
  };

  // Record Waste Handler (Halek)
  const handleRecordWaste = async () => {
    if (!showWasteModal || !wasteData.quantity || Number(wasteData.quantity) <= 0) {
      toast.error("يرجى كتابة كمية الهالك الصحيحة");
      return;
    }
    setSubmitting(true);
    try {
      await api.post(`/inventory/items/${showWasteModal}/waste`, {
        quantity: Number(wasteData.quantity),
        reason: wasteData.reason.trim() || undefined,
      });
      toast.success("تم تسجيل الهالك وخصمه من المخزن بنجاح");
      setShowWasteModal(null);
      setWasteData({ quantity: "", reason: "" });
      fetchInventory();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "فشل تسجيل الهالك");
    } finally {
      setSubmitting(false);
    }
  };

  // Physical Stocktake Handler
  const handleSaveStocktake = async () => {
    const payloadItems = items
      .map((item) => {
        const actualValStr = stocktakeValues[item.id];
        const actualVal = Number(actualValStr);
        const currentVal = Number(item.currentStock);
        if (actualValStr !== "" && !isNaN(actualVal) && actualVal !== currentVal) {
          return {
            inventoryItemId: item.id,
            actualStock: actualVal,
            reason: stocktakeReasons[item.id]?.trim() || undefined,
          };
        }
        return null;
      })
      .filter(Boolean) as { inventoryItemId: string; actualStock: number; reason?: string }[];

    if (payloadItems.length === 0) {
      toast.error("لم تقم بتغيير أية كميات لإجراء الجرد الفعلي");
      return;
    }

    setSubmitting(true);
    try {
      await api.post("/inventory/stocktake", { items: payloadItems });
      toast.success("تم تسوية الرصيد وحفظ الجرد الفعلي بنجاح");
      await fetchInventory();
      setActiveTab("items");
    } catch (err: any) {
      toast.error("فشل حفظ الجرد الفعلي، يرجى المحاولة مرة أخرى");
    } finally {
      setSubmitting(false);
    }
  };

  // Direct Withdraw Handler
  const handleSaveWithdraw = async () => {
    if (!withdrawItemId || !withdrawQty || isNaN(Number(withdrawQty)) || Number(withdrawQty) <= 0) {
      toast.error("يرجى اختيار الخامة وكتابة كمية سحب صحيحة");
      return;
    }
    const item = items.find((i) => i.id === withdrawItemId);
    if (!item) return;

    if (Number(item.currentStock) < Number(withdrawQty)) {
      toast.error(`رصيد الخامة الحالي (${item.currentStock} ${item.unit}) أقل من الكمية المطلوبة!`);
      return;
    }

    setSubmitting(true);
    try {
      await api.post(`/inventory/items/${withdrawItemId}/withdraw`, {
        quantity: Number(withdrawQty),
        reason: withdrawReason.trim() || undefined,
      });
      toast.success("تم تسجيل عملية الصرف السريع بنجاح");
      setWithdrawItemId("");
      setWithdrawQty("");
      setWithdrawReason("");
      await fetchInventory();
      setActiveTab("items");
    } catch (err: any) {
      toast.error("فشل تسجيل الصرف، يرجى المحاولة مرة أخرى");
    } finally {
      setSubmitting(false);
    }
  };

  // Open Item History Handler
  const openItemHistory = async (item: InventoryItem) => {
    setHistoryItemName(item.name);
    setShowHistoryModal(true);
    setHistoryLoading(true);
    try {
      const res = await api.get(`/inventory/items/${item.id}/history`);
      setHistoryItems(res.data);
    } catch (err) {
      toast.error("فشل تحميل سجل حركة الخامة");
    } finally {
      setHistoryLoading(false);
    }
  };

  // Delete Item Handler
  const handleDeleteItem = async (item: InventoryItem) => {
    if (!confirm(`هل أنت محتأكد من حذف الخور الخامة «${item.name}»؟`)) return;
    try {
      await api.delete(`/inventory/items/${item.id}`);
      toast.success("تم حذف الخامة بنجاح");
      fetchInventory();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "تعذر حذف الخامة المربوطة بوصفات عروض أو منتجات");
    }
  };

  // Translate Category Label
  const getCategoryLabel = (cat?: string | null) => {
    if (!cat) return "عام";
    const found = CATEGORIES.find((c) => c.value === cat);
    return found ? found.label.split(" (")[0] : cat;
  };

  return (
    <div className="space-y-6" dir="rtl">
      {/* Page Header */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20 shrink-0">
            <Boxes size={28} />
          </div>
          <div>
            <h1 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">إدارة المخزون والخامات</h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-medium">
              متابعة حركة الخامات، التوريدات، الجرد الفعلي، والتسوية الفورية للبار.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {canManageInventory && (
            <button
              type="button"
              onClick={() => setShowNewItemModal(true)}
              className="flex items-center justify-center gap-2 rounded-2xl bg-amber-500 hover:bg-amber-400 text-slate-950 px-5 py-3 text-sm font-black shadow-md shadow-amber-500/20 active:scale-95 transition-all cursor-pointer"
            >
              <Plus size={18} />
              خامة جديدة
            </button>
          )}

          <button
            type="button"
            onClick={() => setActiveTab("stocktake")}
            className="flex items-center justify-center gap-2 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 px-4 py-3 text-xs font-bold transition-all cursor-pointer"
          >
            <Layers size={16} />
            جرد فعلي
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("withdraw")}
            className="flex items-center justify-center gap-2 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 px-4 py-3 text-xs font-bold transition-all cursor-pointer shadow-2xs"
          >
            <MinusCircle size={16} />
            صرف خامة
          </button>
        </div>
      </div>

      {/* Metric Cards (4 Summary Cards, 85px Max Height) */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <button
          type="button"
          onClick={() => { setStockLevelFilter("all"); setActiveTab("items"); }}
          className={`flex items-center justify-between p-4 rounded-2xl border transition-all text-right h-[84px] cursor-pointer ${
            stockLevelFilter === "all" && activeTab === "items"
              ? "bg-amber-50/80 dark:bg-amber-950/40 border-amber-400 ring-2 ring-amber-400/20"
              : "bg-white dark:bg-slate-900 border-slate-200/80 dark:border-slate-800 hover:border-slate-300"
          }`}
        >
          <div className="space-y-0.5">
            <p className="text-[11px] font-bold text-slate-500 dark:text-slate-400">إجمالي الأصناف</p>
            <p className="text-2xl font-black text-slate-900 dark:text-white font-mono">{stats.total}</p>
          </div>
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600 shrink-0">
            <Boxes size={20} />
          </div>
        </button>

        <button
          type="button"
          onClick={() => { setStockLevelFilter("ok"); setActiveTab("items"); }}
          className={`flex items-center justify-between p-4 rounded-2xl border transition-all text-right h-[84px] cursor-pointer ${
            stockLevelFilter === "ok" && activeTab === "items"
              ? "bg-emerald-50/80 dark:bg-emerald-950/40 border-emerald-400 ring-2 ring-emerald-400/20"
              : "bg-white dark:bg-slate-900 border-slate-200/80 dark:border-slate-800 hover:border-slate-300"
          }`}
        >
          <div className="space-y-0.5">
            <p className="text-[11px] font-bold text-slate-500 dark:text-slate-400">رصيد آمن وموفر</p>
            <p className="text-2xl font-black text-emerald-600 font-mono">{stats.ok}</p>
          </div>
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 shrink-0">
            <CheckCircle2 size={20} />
          </div>
        </button>

        <button
          type="button"
          onClick={() => { setStockLevelFilter("low"); setActiveTab("items"); }}
          className={`flex items-center justify-between p-4 rounded-2xl border transition-all text-right h-[84px] cursor-pointer ${
            stockLevelFilter === "low" && activeTab === "items"
              ? "bg-amber-50/80 dark:bg-amber-950/40 border-amber-400 ring-2 ring-amber-400/20"
              : "bg-white dark:bg-slate-900 border-slate-200/80 dark:border-slate-800 hover:border-slate-300"
          }`}
        >
          <div className="space-y-0.5">
            <p className="text-[11px] font-bold text-slate-500 dark:text-slate-400">منخفض (يلزم الطلب ⚠️)</p>
            <p className="text-2xl font-black text-amber-600 font-mono">{stats.low}</p>
          </div>
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 text-amber-600 shrink-0">
            <AlertTriangle size={20} />
          </div>
        </button>

        <button
          type="button"
          onClick={() => { setStockLevelFilter("out"); setActiveTab("items"); }}
          className={`flex items-center justify-between p-4 rounded-2xl border transition-all text-right h-[84px] cursor-pointer ${
            stockLevelFilter === "out" && activeTab === "items"
              ? "bg-rose-50/80 dark:bg-rose-950/40 border-rose-400 ring-2 ring-rose-400/20"
              : "bg-white dark:bg-slate-900 border-slate-200/80 dark:border-slate-800 hover:border-slate-300"
          }`}
        >
          <div className="space-y-0.5">
            <p className="text-[11px] font-bold text-slate-500 dark:text-slate-400">نفد المخزون 🔴</p>
            <p className="text-2xl font-black text-rose-600 font-mono">{stats.out}</p>
          </div>
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-50 text-rose-600 shrink-0">
            <XCircleIcon size={20} />
          </div>
        </button>
      </div>

      {/* Navigation Segmented Tabs */}
      <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800 p-1.5 rounded-2xl border border-slate-200/80 dark:border-slate-700">
        <button
          type="button"
          onClick={() => setActiveTab("items")}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs font-black transition-all cursor-pointer ${
            activeTab === "items"
              ? "bg-white dark:bg-slate-900 text-slate-950 dark:text-white shadow-xs"
              : "text-slate-600 dark:text-slate-400 hover:text-slate-950"
          }`}
        >
          <Package size={15} />
          قائمة الخامات والأرصدة ({filteredItems.length})
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("stocktake")}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs font-black transition-all cursor-pointer ${
            activeTab === "stocktake"
              ? "bg-white dark:bg-slate-900 text-slate-950 dark:text-white shadow-xs"
              : "text-slate-600 dark:text-slate-400 hover:text-slate-950"
          }`}
        >
          <Layers size={15} />
          الجرد الفعلي والتسوية
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("withdraw")}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs font-black transition-all cursor-pointer ${
            activeTab === "withdraw"
              ? "bg-white dark:bg-slate-900 text-slate-950 dark:text-white shadow-xs"
              : "text-slate-600 dark:text-slate-400 hover:text-slate-950"
          }`}
        >
          <MinusCircle size={15} />
          صرف سريعة / مسحوبات
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("analytics")}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs font-black transition-all cursor-pointer ${
            activeTab === "analytics"
              ? "bg-white dark:bg-slate-900 text-slate-950 dark:text-white shadow-xs"
              : "text-slate-600 dark:text-slate-400 hover:text-slate-950"
          }`}
        >
          <History size={15} />
          سجل حركات المخزن
        </button>
      </div>

      {/* TAB 1: ITEMS & STOCK VIEW */}
      {activeTab === "items" && (
        <div className="space-y-4">
          {/* Search & Filter Controls */}
          <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col sm:flex-row items-center gap-3">
            <div className="relative flex-1 w-full">
              <Search className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={17} />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="ابحث باسم الخامة، القسم، أو النوع..."
                className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 py-2.5 pl-4 pr-10 text-sm font-semibold outline-none focus:border-amber-500 transition-all"
              />
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2.5 text-xs font-bold text-slate-800 dark:text-slate-200 outline-none focus:border-amber-500 cursor-pointer"
              >
                {CATEGORIES.map((c) => (
                  <option key={c.value} value={c.value}>
                    {c.label}
                  </option>
                ))}
              </select>

              <select
                value={stockLevelFilter}
                onChange={(e) => setStockLevelFilter(e.target.value as any)}
                className="rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2.5 text-xs font-bold text-slate-800 dark:text-slate-200 outline-none focus:border-amber-500 cursor-pointer"
              >
                <option value="all">كل المستويات</option>
                <option value="ok">رصيد آمن</option>
                <option value="low">منخفض (يلزم الطلب)</option>
                <option value="out">نفد المخزون</option>
              </select>

              {(search || categoryFilter || stockLevelFilter !== "all") && (
                <button
                  type="button"
                  onClick={() => { setSearch(""); setCategoryFilter(""); setStockLevelFilter("all"); }}
                  className="rounded-xl bg-rose-50 text-rose-700 border border-rose-200 px-3 py-2.5 text-xs font-bold hover:bg-rose-100 transition cursor-pointer"
                >
                  مسح
                </button>
              )}
            </div>
          </div>

          {/* Items Table */}
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 shadow-xs">
              <Spinner size={34} />
              <p className="mt-3 text-xs font-bold text-slate-400">جاري تحميل خامات المخزن...</p>
            </div>
          ) : filteredItems.length === 0 ? (
            <div className="bg-white dark:bg-slate-900 p-12 rounded-3xl border border-slate-200/80 text-center space-y-4 shadow-xs">
              <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-3xl bg-amber-50 text-amber-500">
                <Boxes size={38} />
              </div>
              <p className="text-sm font-black text-slate-900 dark:text-white">لا توجد خامات مطابقة للبحث</p>
            </div>
          ) : (
            <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-right text-sm">
                  <thead className="bg-slate-50 dark:bg-slate-800 text-xs font-bold text-slate-500 uppercase border-b border-slate-200 dark:border-slate-800">
                    <tr>
                      <th className="p-4">اسم الخامة</th>
                      <th className="p-4">القسم</th>
                      <th className="p-4">الرصيد الحالي</th>
                      <th className="p-4">الحد الأدنى</th>
                      <th className="p-4">سعر التكلفة للوحدة</th>
                      <th className="p-4">إجمالي قيمة الرصيد</th>
                      <th className="p-4 text-left">الإجراءات</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
                    {filteredItems.map((item) => {
                      const current = Number(item.currentStock) || 0;
                      const minLevel = Number(item.minStockLevel) || 0;
                      const cost = Number(item.costPerUnit) || 0;
                      const totalCost = current * cost;

                      const isOut = current <= 0;
                      const isLow = current > 0 && current <= minLevel;

                      return (
                        <tr key={item.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors">
                          <td className="p-4">
                            <div className="space-y-0.5">
                              <p className="font-bold text-slate-900 dark:text-white">{item.name}</p>
                              {item._count && item._count.recipes > 0 && (
                                <span className="text-[10px] text-slate-400 font-bold block">
                                  مربوط بـ {item._count.recipes} وصفة بار
                                </span>
                              )}
                            </div>
                          </td>

                          <td className="p-4">
                            <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 dark:bg-slate-800 px-3 py-1 text-xs font-bold text-slate-700 dark:text-slate-300">
                              {getCategoryLabel(item.category)}
                            </span>
                          </td>

                          <td className="p-4">
                            <span
                              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-black ltr-value font-mono ${
                                isOut
                                  ? "bg-rose-100 text-rose-700"
                                  : isLow
                                  ? "bg-amber-100 text-amber-800"
                                  : "bg-emerald-100 text-emerald-800"
                              }`}
                            >
                              {current} {item.unit}
                            </span>
                          </td>

                          <td className="p-4 text-xs font-bold text-slate-500 font-mono">
                            {minLevel} {item.unit}
                          </td>

                          <td className="p-4 font-mono font-bold text-slate-700 dark:text-slate-300">
                            {money(cost)}
                          </td>

                          <td className="p-4 font-mono font-black text-emerald-700 dark:text-emerald-400">
                            {money(totalCost)}
                          </td>

                          <td className="p-4 text-left">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                type="button"
                                onClick={() => setSelectedStockItem(item)}
                                className="flex items-center gap-1 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200 px-3 py-1.5 text-xs font-bold hover:bg-emerald-100 transition shadow-2xs"
                                title="إضافة توريد"
                              >
                                <Plus size={13} /> توريد
                              </button>

                              <button
                                type="button"
                                onClick={() => setShowWasteModal(item.id)}
                                className="flex items-center gap-1 rounded-xl bg-amber-50 text-amber-700 border border-amber-200 px-3 py-1.5 text-xs font-bold hover:bg-amber-100 transition shadow-2xs"
                                title="تسجيل هالك"
                              >
                                <Trash2 size={13} /> هالك
                              </button>

                              <button
                                type="button"
                                onClick={() => openItemHistory(item)}
                                className="rounded-xl border border-slate-200 dark:border-slate-700 p-2 text-slate-500 hover:text-slate-900 transition shadow-2xs"
                                title="سجل الحركة"
                              >
                                <History size={14} />
                              </button>

                              {canManageInventory && (
                                <button
                                  type="button"
                                  onClick={() => handleDeleteItem(item)}
                                  className="rounded-xl border border-rose-100 p-2 text-rose-500 hover:bg-rose-50 transition shadow-2xs"
                                  title="حذف الخامة"
                                >
                                  <Trash2 size={14} />
                                </button>
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
          )}
        </div>
      )}

      {/* TAB 2: PHYSICAL STOCKTAKE */}
      {activeTab === "stocktake" && (
        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200/80 shadow-xs space-y-5">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
            <div>
              <h2 className="text-base font-black text-slate-900 dark:text-white">الجرد الفعلي وتسوية الأرصدة</h2>
              <p className="text-xs text-slate-500 mt-0.5">أدخل الكميات الفعلية الموجودة بالبار والمخزن الآن لتسوية الرصيد تلقائياً.</p>
            </div>

            <button
              type="button"
              onClick={handleSaveStocktake}
              disabled={submitting}
              className="flex items-center gap-2 rounded-2xl bg-amber-500 text-slate-950 px-6 py-3 text-sm font-black hover:bg-amber-400 transition cursor-pointer shadow-md shadow-amber-500/20"
            >
              <CheckCircle2 size={18} />
              {submitting ? "جاري التسوية..." : "تثبيت نتائج الجرد وتسوية الرصيد"}
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-right text-sm">
              <thead className="bg-slate-50 dark:bg-slate-800 text-xs font-bold text-slate-500 uppercase border-b border-slate-200">
                <tr>
                  <th className="p-3.5">اسم الخامة</th>
                  <th className="p-3.5">الرصيد بالسيستم</th>
                  <th className="p-3.5">الرصيد الفعلي (الجرد) *</th>
                  <th className="p-3.5">الفارق</th>
                  <th className="p-3.5">سبب التسوية / ملاحظات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {items.map((item) => {
                  const systemStock = Number(item.currentStock) || 0;
                  const actualValStr = stocktakeValues[item.id] ?? String(systemStock);
                  const actualVal = Number(actualValStr);
                  const diff = !isNaN(actualVal) ? actualVal - systemStock : 0;

                  return (
                    <tr key={item.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="p-3.5 font-bold text-slate-900 dark:text-white">{item.name}</td>
                      <td className="p-3.5 font-mono font-bold text-slate-500">
                        {systemStock} {item.unit}
                      </td>
                      <td className="p-3.5">
                        <input
                          type="text"
                          inputMode="decimal"
                          value={actualValStr}
                          onChange={(e) => setStocktakeValues({ ...stocktakeValues, [item.id]: e.target.value })}
                          className="w-28 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-1.5 text-xs font-mono font-bold text-slate-900 dark:text-white outline-none focus:border-amber-500"
                        />
                      </td>
                      <td className="p-3.5 font-mono font-black">
                        {diff === 0 ? (
                          <span className="text-slate-400">مظبوط (0)</span>
                        ) : diff > 0 ? (
                          <span className="text-emerald-600">+{diff} (زيادة)</span>
                        ) : (
                          <span className="text-rose-600">{diff} (عجز)</span>
                        )}
                      </td>
                      <td className="p-3.5">
                        <input
                          type="text"
                          value={stocktakeReasons[item.id] ?? ""}
                          onChange={(e) => setStocktakeReasons({ ...stocktakeReasons, [item.id]: e.target.value })}
                          placeholder="سبب الفرق..."
                          className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-1.5 text-xs outline-none focus:border-amber-500"
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: DIRECT WITHDRAWAL */}
      {activeTab === "withdraw" && (
        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200/80 shadow-xs max-w-xl mx-auto space-y-5">
          <div className="space-y-1 text-center border-b border-slate-100 pb-4">
            <h2 className="text-base font-black text-slate-900 dark:text-white">صرف خامة مباشر / مسحوبات</h2>
            <p className="text-xs text-slate-500">تسجيل صرف خامة للاستخدام الداخلي أو تحضير البار.</p>
          </div>

          <div className="space-y-4">
            <FormField label="اختر الخامة *">
              <select
                value={withdrawItemId}
                onChange={(e) => setWithdrawItemId(e.target.value)}
                className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2.5 text-sm font-bold outline-none"
              >
                <option value="">اختر الخامة المطلوبة...</option>
                {items.map((i) => (
                  <option key={i.id} value={i.id}>
                    {i.name} — الرصيد: {i.currentStock} {i.unit}
                  </option>
                ))}
              </select>
            </FormField>

            <FormField label="الكمية المصروفة *">
              <Input
                type="text"
                inputMode="decimal"
                value={withdrawQty}
                onChange={(e) => setWithdrawQty(e.target.value)}
                placeholder="أدخل الكمية..."
              />
            </FormField>

            <FormField label="سبب الصرف / الجهة">
              <Input
                value={withdrawReason}
                onChange={(e) => setWithdrawReason(e.target.value)}
                placeholder="تحضير البار / استخدام نظافة..."
              />
            </FormField>

            <button
              type="button"
              onClick={handleSaveWithdraw}
              disabled={submitting}
              className="w-full h-14 rounded-2xl bg-amber-500 text-slate-950 font-black text-base hover:bg-amber-400 transition cursor-pointer shadow-md shadow-amber-500/20"
            >
              {submitting ? "جاري التسجيل..." : "تأكيد تسجيل الصرف"}
            </button>
          </div>
        </div>
      )}

      {/* TAB 4: TRANSACTIONS & LOG */}
      {activeTab === "analytics" && (
        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200/80 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div>
              <h2 className="text-base font-black text-slate-900 dark:text-white">سجل حركات وإضافات المخزن</h2>
              <p className="text-xs text-slate-500">متابعة كافة حركات التوريد، الصرف، الهالك، وتسويات الجرد.</p>
            </div>
            <button
              type="button"
              onClick={fetchTransactions}
              className="flex items-center gap-1 rounded-xl bg-slate-100 text-slate-700 px-3 py-2 text-xs font-bold hover:bg-slate-200 transition"
            >
              <RefreshCw size={14} /> تحديث السجل
            </button>
          </div>

          {loadingTransactions ? (
            <div className="py-16 text-center text-slate-400">
              <Spinner size={30} />
              <p className="mt-2 text-xs font-bold">جاري تحميل سجل الحركة...</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-right text-sm">
                <thead className="bg-slate-50 text-xs font-bold text-slate-500 uppercase border-b border-slate-200">
                  <tr>
                    <th className="p-3.5">الخامة</th>
                    <th className="p-3.5">نوع الحركة</th>
                    <th className="p-3.5">الكمية</th>
                    <th className="p-3.5">السبب / الملاحظات</th>
                    <th className="p-3.5">المسؤول</th>
                    <th className="p-3.5">التاريخ والوقت</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {allTransactions.map((tx) => (
                    <tr key={tx.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="p-3.5 font-bold text-slate-900">{tx.inventoryItem?.name}</td>
                      <td className="p-3.5">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black ${
                            tx.type === "in"
                              ? "bg-emerald-100 text-emerald-800"
                              : tx.type === "out"
                              ? "bg-rose-100 text-rose-800"
                              : "bg-amber-100 text-amber-800"
                          }`}
                        >
                          {tx.type === "in" ? "توريد (+)" : tx.type === "out" ? "صرف (-)" : "تسوية جرد"}
                        </span>
                      </td>
                      <td className="p-3.5 font-mono font-black ltr-value">
                        {tx.quantity} {tx.inventoryItem?.unit}
                      </td>
                      <td className="p-3.5 text-xs text-slate-500">{tx.reason || "-"}</td>
                      <td className="p-3.5 text-xs text-slate-600 font-bold">
                        {tx.performedBy
                          ? `${tx.performedBy.firstName || ""} ${tx.performedBy.lastName || ""}`.trim() || tx.performedBy.email
                          : "السيستم"}
                      </td>
                      <td className="p-3.5 text-xs font-mono text-slate-400">{dateTime(tx.createdAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* MODAL: NEW ITEM */}
      <Modal isOpen={showNewItemModal} onClose={() => setShowNewItemModal(false)} title="إضافة خامة جديدة للمخزن" size="lg">
        <form onSubmit={handleCreateItem} className="space-y-4" dir="rtl">
          <FormField label="اسم الخامة *">
            <Input
              required
              value={newItemData.name}
              onChange={(e) => setNewItemData({ ...newItemData, name: e.target.value })}
              placeholder="مثال: بن أصل تركي"
            />
          </FormField>

          <div className="grid grid-cols-2 gap-3">
            <FormField label="وحدة القياس *">
              <Input
                required
                value={newItemData.unit}
                onChange={(e) => setNewItemData({ ...newItemData, unit: e.target.value })}
                placeholder="جرام / كيلو / قطعة / مل"
              />
            </FormField>

            <FormField label="القسم">
              <select
                value={newItemData.category}
                onChange={(e) => setNewItemData({ ...newItemData, category: e.target.value })}
                className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2.5 text-sm font-bold outline-none"
              >
                {CATEGORIES.filter((c) => c.value).map((c) => (
                  <option key={c.value} value={c.value}>
                    {c.label}
                  </option>
                ))}
              </select>
            </FormField>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <FormField label="الرصيد الأولي">
              <Input
                type="text"
                inputMode="decimal"
                value={newItemData.initialStock}
                onChange={(e) => setNewItemData({ ...newItemData, initialStock: e.target.value })}
                placeholder="0"
              />
            </FormField>

            <FormField label="الحد الأدنى للطلب">
              <Input
                type="text"
                inputMode="decimal"
                value={newItemData.minStockLevel}
                onChange={(e) => setNewItemData({ ...newItemData, minStockLevel: e.target.value })}
                placeholder="10"
              />
            </FormField>

            <FormField label="تكلُفة الوحدة (ج.م)">
              <Input
                type="text"
                inputMode="decimal"
                value={newItemData.costPerUnit}
                onChange={(e) => setNewItemData({ ...newItemData, costPerUnit: e.target.value })}
                placeholder="0.00"
              />
            </FormField>
          </div>

          <Btn type="submit" className="h-13 w-full rounded-2xl bg-amber-500 text-slate-950 font-black text-base" loading={submitting}>
            إضافة الخامة الآن
          </Btn>
        </form>
      </Modal>

      {/* MODAL: ADD STOCK (TAWREED) */}
      {selectedStockItem && (
        <Modal isOpen={!!selectedStockItem} onClose={() => setSelectedStockItem(null)} title={`إضافة توريد خامة: ${selectedStockItem.name}`}>
          <div className="space-y-4" dir="rtl">
            <FormField label={`الكمية الموردة (${selectedStockItem.unit}) *`}>
              <Input
                type="text"
                inputMode="decimal"
                value={addStockData.quantity}
                onChange={(e) => setAddStockData({ ...addStockData, quantity: e.target.value })}
                placeholder="أدخل الكمية الموردة..."
              />
            </FormField>

            <FormField label="سبب التوريد / رقم الفاتورة (اختياري)">
              <Input
                value={addStockData.reason}
                onChange={(e) => setAddStockData({ ...addStockData, reason: e.target.value })}
                placeholder="توريد شراء / إمداد فرعي..."
              />
            </FormField>

            <Btn
              onClick={handleAddStock}
              className="h-12 w-full rounded-xl bg-emerald-600 text-white font-black text-sm hover:bg-emerald-700"
              loading={submitting}
            >
              تأكيد إضافة التوريد
            </Btn>
          </div>
        </Modal>
      )}

      {/* MODAL: RECORD WASTE (HALEK) */}
      {showWasteModal && (
        <Modal isOpen={!!showWasteModal} onClose={() => setShowWasteModal(null)} title="تسجيل هالك / تالف خامة">
          <div className="space-y-4" dir="rtl">
            <FormField label="الكمية الهالكة *">
              <Input
                type="text"
                inputMode="decimal"
                value={wasteData.quantity}
                onChange={(e) => setWasteData({ ...wasteData, quantity: e.target.value })}
                placeholder="أدخل الكمية الهالكة..."
              />
            </FormField>

            <FormField label="سبب الهلاك (اختياري)">
              <Input
                value={wasteData.reason}
                onChange={(e) => setWasteData({ ...wasteData, reason: e.target.value })}
                placeholder="سكب / انتهاء صلاحية / تلف..."
              />
            </FormField>

            <Btn
              onClick={handleRecordWaste}
              className="h-12 w-full rounded-xl bg-amber-600 text-white font-black text-sm hover:bg-amber-700"
              loading={submitting}
            >
              تأكيد خصم الهالك
            </Btn>
          </div>
        </Modal>
      )}

      {/* MODAL: ITEM HISTORY */}
      {showHistoryModal && (
        <Modal isOpen={showHistoryModal} onClose={() => setShowHistoryModal(false)} title={`سجل حركة الخامة: ${historyItemName}`} size="lg">
          <div className="space-y-3" dir="rtl">
            {historyLoading ? (
              <div className="py-12 text-center text-slate-400">
                <Spinner size={28} />
                <p className="mt-2 text-xs font-bold">جاري تحميل سجل الحركة...</p>
              </div>
            ) : historyItems.length === 0 ? (
              <p className="py-8 text-center text-xs text-slate-400">لا توجد حركات مسجلة لهذه الخامة حتى الآن.</p>
            ) : (
              <div className="max-h-80 overflow-y-auto space-y-2 pr-1">
                {historyItems.map((tx) => (
                  <div key={tx.id} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 text-xs">
                    <div>
                      <span
                        className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-black ${
                          tx.type === "in" ? "bg-emerald-100 text-emerald-800" : "bg-rose-100 text-rose-800"
                        }`}
                      >
                        {tx.type === "in" ? "إضافة (+)" : "خصم (-)"}
                      </span>
                      <span className="mr-2 font-mono font-black">{tx.quantity} {tx.inventoryItem?.unit}</span>
                      {tx.reason && <p className="text-[11px] text-slate-500 mt-1">{tx.reason}</p>}
                    </div>
                    <span className="text-[11px] font-mono text-slate-400">{dateTime(tx.createdAt)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </Modal>
      )}
    </div>
  );
}

function XCircleIcon({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <path d="m15 9-6 6" />
      <path d="m9 9 6 6" />
    </svg>
  );
}
