"use client";

import { useEffect, useState, useMemo } from "react";
import {
  AlertTriangle,
  ArrowUpRight,
  Boxes,
  ChevronDown,
  Clock,
  History,
  Plus,
  Search,
  Settings2,
  Trash2,
  X,
} from "lucide-react";
import clsx from "clsx";
import { api } from "../../../lib/api";

type InventoryItem = {
  id: string;
  name: string;
  unit: string;
  category?: string | null;
  currentStock: number | string;
  minStockLevel: number | string;
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

type FlashMessage = { ok: boolean; text: string } | null;

const EMPTY_NEW_ITEM = {
  name: "",
  unit: "",
  category: "",
  minStockLevel: "",
  costPerUnit: "",
};

export default function InventoryPage() {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");

  const [showNewItemModal, setShowNewItemModal] = useState(false);
  const [newItemData, setNewItemData] = useState(EMPTY_NEW_ITEM);

  const [showAddStockModal, setShowAddStockModal] = useState<string | null>(null);
  const [addStockData, setAddStockData] = useState({ quantity: "", reason: "" });

  const [showWasteModal, setShowWasteModal] = useState<string | null>(null);
  const [wasteData, setWasteData] = useState({ quantity: "", reason: "" });

  // History log modal
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyItems, setHistoryItems] = useState<InventoryTransaction[]>([]);
  const [historyItemId, setHistoryItemId] = useState<string | null>(null); // null = all

  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<FlashMessage>(null);

  useEffect(() => {
    fetchInventory();
  }, []);

  const fetchInventory = async () => {
    try {
      const res = await api.get("/inventory/items");
      setItems(res.data);
    } catch (err) {
      console.error("Failed to fetch inventory", err);
      setMessage({ ok: false, text: "مش قادرين نحمل المخزون دلوقتي." });
    } finally {
      setLoading(false);
    }
  };

  const openHistory = async (itemId?: string) => {
    setHistoryItemId(itemId || null);
    setShowHistoryModal(true);
    setHistoryLoading(true);
    try {
      const url = itemId ? `/inventory/items/${itemId}/transactions` : `/inventory/transactions`;
      const res = await api.get(url, { params: { limit: 100 } });
      setHistoryItems(res.data);
    } catch {
      setHistoryItems([]);
    } finally {
      setHistoryLoading(false);
    }
  };

  // Unique categories derived from items
  const categories = useMemo(() => {
    const cats = new Set(items.map(i => i.category).filter(Boolean) as string[]);
    return Array.from(cats).sort();
  }, [items]);

  // Recipe coverage: items that have at least one recipe / total
  const recipeCoverage = useMemo(() => {
    if (!items.length) return null;
    const withRecipes = items.filter(i => (i._count?.recipes ?? 0) > 0).length;
    return Math.round((withRecipes / items.length) * 100);
  }, [items]);

  const lowStockItems = items.filter((item) => Number(item.currentStock) <= Number(item.minStockLevel));
  const totalItems = items.length;

  const selectedStockItem = items.find((item) => item.id === showAddStockModal);
  const historyItemName = historyItemId ? items.find(i => i.id === historyItemId)?.name : null;

  const handleCreateItem = async () => {
    if (!newItemData.name.trim() || !newItemData.unit.trim()) {
      setMessage({ ok: false, text: "لازم تكتب اسم الصنف والوحدة." });
      return;
    }

    setSubmitting(true);
    try {
      await api.post("/inventory/items", {
        name: newItemData.name.trim(),
        unit: newItemData.unit.trim(),
        category: newItemData.category.trim() || undefined,
        minStockLevel: newItemData.minStockLevel ? Number(newItemData.minStockLevel) : undefined,
        costPerUnit: newItemData.costPerUnit ? Number(newItemData.costPerUnit) : undefined,
      });
      setShowNewItemModal(false);
      setNewItemData(EMPTY_NEW_ITEM);
      setMessage({ ok: true, text: "الصنف اتضاف بنجاح." });
      await fetchInventory();
    } catch (err: any) {
      console.error("Failed to create inventory item", err);
      const status = err?.response?.status;
      setMessage({
        ok: false,
        text: status === 403 ? "الإضافة متاحة للـ Owner أو مدير التشغيل بس." : "ماعرفناش نضيف الصنف.",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleAddStock = async () => {
    if (!showAddStockModal || !addStockData.quantity) return;

    const quantity = Number(addStockData.quantity);
    if (!Number.isFinite(quantity) || quantity <= 0) {
      setMessage({ ok: false, text: "كمية الإضافة لازم تكون أكبر من صفر." });
      return;
    }

    setSubmitting(true);
    try {
      await api.post(`/inventory/items/${showAddStockModal}/add-stock`, {
        quantity,
        reason: addStockData.reason.trim() || undefined,
      });
      setShowAddStockModal(null);
      setAddStockData({ quantity: "", reason: "" });
      setMessage({ ok: true, text: "المخزون اتضاف بنجاح." });
      await fetchInventory();
    } catch (err: any) {
      console.error("Failed to add stock", err);
      const status = err?.response?.status;
      setMessage({
        ok: false,
        text: status === 403 ? "إضافة المخزون متاحة للـ Owner أو مدير التشغيل بس." : "ماعرفناش نضيف المخزون.",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleRecordWaste = async () => {
    if (!showWasteModal) return;

    const quantity = Number(wasteData.quantity);
    if (!Number.isFinite(quantity) || quantity <= 0) {
      setMessage({ ok: false, text: "كمية الهالك لازم تكون أكبر من صفر." });
      return;
    }

    setSubmitting(true);
    try {
      await api.post("/inventory/waste", {
        inventoryItemId: showWasteModal,
        quantity,
        reason: wasteData.reason,
      });
      setShowWasteModal(null);
      setWasteData({ quantity: "", reason: "" });
      setMessage({ ok: true, text: "تم تسجيل الهالك." });
      await fetchInventory();
    } catch (err) {
      console.error("Failed to record waste", err);
      setMessage({ ok: false, text: "ماعرفناش نسجل الهالك." });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">المخزون</h1>
          <p className="text-slate-500">إدارة الخامات والوصفات وحركة المخزن.</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => openHistory()}
            className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
          >
            <History size={18} />
            سجل الحركة
          </button>
          <button
            onClick={() => setShowNewItemModal(true)}
            className="flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white shadow-lg transition hover:bg-slate-800 active:scale-95"
          >
            <Plus size={18} />
            إضافة صنف جديد
          </button>
        </div>
      </div>

      {message && (
        <div
          className={clsx(
            "rounded-2xl border px-4 py-3 text-sm font-semibold",
            message.ok ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-rose-200 bg-rose-50 text-rose-700",
          )}
        >
          {message.text}
        </div>
      )}

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        <div className="group relative overflow-hidden rounded-3xl border border-slate-100 bg-white p-6 shadow-sm transition-all hover:shadow-md">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-sm font-medium text-slate-500">إجمالي الأصناف</p>
              <p className="text-3xl font-bold text-slate-900">{totalItems}</p>
            </div>
            <div className="rounded-2xl bg-blue-50 p-3 text-blue-600 transition-colors group-hover:bg-blue-100">
              <Boxes size={24} />
            </div>
          </div>
          <div className="mt-4 flex items-center gap-2 text-xs font-medium text-emerald-600">
            <ArrowUpRight size={14} />
            <span>متابعة لحظية لحركة المخزون</span>
          </div>
        </div>

        <div className="group relative overflow-hidden rounded-3xl border border-slate-100 bg-white p-6 shadow-sm transition-all hover:shadow-md">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-sm font-medium text-slate-500">أصناف ناقصة</p>
              <p className="text-3xl font-bold text-rose-600">{lowStockItems.length}</p>
            </div>
            <div
              className={clsx(
                "rounded-2xl p-3 transition-colors",
                lowStockItems.length > 0 ? "bg-rose-50 text-rose-600 animate-pulse" : "bg-slate-50 text-slate-400",
              )}
            >
              <AlertTriangle size={24} />
            </div>
          </div>
          <div className="mt-4 flex items-center gap-2 text-xs font-medium text-rose-500">
            {lowStockItems.length > 0 ? "في أصناف محتاجة توريد" : "وضع المخزون كويس"}
          </div>
        </div>

        <div className="group relative overflow-hidden rounded-3xl border border-slate-100 bg-white p-6 shadow-sm transition-all hover:shadow-md">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-sm font-medium text-slate-500">تغطية الوصفات</p>
              <p className="text-3xl font-bold text-slate-900">
                {recipeCoverage !== null ? `${recipeCoverage}%` : "—"}
              </p>
            </div>
            <div className="rounded-2xl bg-amber-50 p-3 text-amber-600 transition-colors group-hover:bg-amber-100">
              <Settings2 size={24} />
            </div>
          </div>
          <div className="mt-4 flex items-center gap-2 text-xs font-medium text-amber-600">
            <span>
              {recipeCoverage !== null
                ? `${items.filter(i => (i._count?.recipes ?? 0) > 0).length} من ${totalItems} صنف ليه وصفة`
                : "راجع المنتجات اللي لسه بدون وصفة"}
            </span>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex flex-col gap-4 rounded-2xl border border-slate-200/50 bg-white/50 p-2 backdrop-blur-sm md:flex-row md:items-center md:justify-between">
          <div className="relative flex-1">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input
              type="text"
              placeholder="ابحث عن صنف..."
              className="w-full rounded-xl border-none bg-transparent pr-10 text-sm focus:ring-0"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-2 px-2">
            <div className="relative">
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="appearance-none rounded-lg border border-slate-200 bg-white pl-8 pr-3 py-1.5 text-xs font-semibold text-slate-600 focus:outline-none focus:ring-2 focus:ring-slate-300"
              >
                <option value="">كل الفئات</option>
                {categories.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
              <ChevronDown size={12} className="pointer-events-none absolute left-2 top-1/2 -translate-y-1/2 text-slate-400" />
            </div>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {loading ? (
            Array(6)
              .fill(0)
              .map((_, i) => (
                <div key={i} className="h-40 animate-pulse rounded-2xl bg-slate-100" />
              ))
          ) : items.filter(item => {
            const matchSearch = !search || item.name.toLowerCase().includes(search.toLowerCase());
            const matchCat = !categoryFilter || item.category === categoryFilter;
            return matchSearch && matchCat;
          }).length === 0 ? (
            <div className="col-span-3 flex flex-col items-center justify-center gap-4 py-20 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100 text-slate-300">
                <Boxes size={28} />
              </div>
              <div>
                <p className="font-bold text-slate-600">لا توجد أصناف</p>
                <p className="mt-1 text-sm text-slate-400">جرّب تغيير البحث أو أضف صنف جديد</p>
              </div>
            </div>
          ) : (
            items.filter(item => {
              const matchSearch = !search || item.name.toLowerCase().includes(search.toLowerCase());
              const matchCat = !categoryFilter || item.category === categoryFilter;
              return matchSearch && matchCat;
            }).map((item) => {
              const stock = Number(item.currentStock);
              const minStock = Number(item.minStockLevel);
              const isLow = stock <= minStock;
              const isOut = stock === 0;
              return (
                <div
                  key={item.id}
                  className={clsx(
                    "group relative flex flex-col rounded-2xl border bg-white p-5 shadow-sm transition hover:shadow-md",
                    isOut ? "border-rose-300 bg-rose-50/30" : isLow ? "border-amber-300 bg-amber-50/20" : "border-slate-200",
                  )}
                >
                  <div className="mb-3 flex items-start justify-between">
                    <div className="flex flex-col gap-1">
                      {isOut && (
                        <span className="rounded-full bg-rose-100 px-2 py-0.5 text-[10px] font-bold text-rose-700">نفذ</span>
                      )}
                      {isLow && !isOut && (
                        <span className="flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-700">
                          <AlertTriangle size={9} /> ناقص
                        </span>
                      )}
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-slate-900">{item.name}</p>
                      {item.category && (
                        <p className="text-xs text-slate-400">{item.category}</p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-baseline justify-between mb-3">
                    <span className="text-xs font-medium text-slate-400">{item.unit}</span>
                    <div className="text-right">
                      <span className={clsx("text-2xl font-black tabular-nums", isOut ? "text-rose-600" : isLow ? "text-amber-600" : "text-slate-900")}>
                        {stock}
                      </span>
                      <span className="mr-1 text-xs text-slate-400">/ حد أدنى {minStock}</span>
                    </div>
                  </div>

                  {/* Stock level bar */}
                  <div className="mb-4 h-1.5 rounded-full bg-slate-100 overflow-hidden">
                    <div
                      className={clsx("h-full rounded-full transition-all", isOut ? "bg-rose-500" : isLow ? "bg-amber-400" : "bg-emerald-500")}
                      style={{ width: `${minStock > 0 ? Math.min(100, Math.round((stock / (minStock * 2)) * 100)) : 100}%` }}
                    />
                  </div>

                  <div className="mt-auto flex gap-2">
                    <button
                      onClick={() => { setShowAddStockModal(item.id); setAddStockData({ quantity: "", reason: "" }); }}
                      className="flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-slate-200 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 transition"
                    >
                      <Plus size={13} /> إضافة
                    </button>
                    <button
                      onClick={() => { setShowWasteModal(item.id); setWasteData({ quantity: "", reason: "" }); }}
                      className="flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-amber-200 py-2 text-xs font-bold text-amber-700 hover:bg-amber-50 transition"
                    >
                      <Trash2 size={13} /> هالك
                    </button>
                    <button
                      onClick={() => openHistory(item.id)}
                      className="flex items-center justify-center rounded-xl border border-slate-200 px-2.5 py-2 text-slate-500 hover:bg-slate-50 transition"
                    >
                      <Clock size={13} />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Add New Item Modal */}
      {showNewItemModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={() => setShowNewItemModal(false)} />
          <div className="relative w-full max-w-md overflow-hidden rounded-3xl bg-white shadow-2xl ring-1 ring-slate-200" dir="rtl">
            <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50 px-6 py-4">
              <h3 className="text-base font-black text-slate-900">إضافة صنف جديد</h3>
              <button onClick={() => setShowNewItemModal(false)} className="rounded-xl p-1.5 text-slate-400 hover:bg-white hover:text-slate-600 transition">
                <X size={16} />
              </button>
            </div>
            <div className="space-y-4 p-6">
              <div>
                <label className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-slate-600">اسم الصنف *</label>
                <input
                  value={newItemData.name}
                  onChange={e => setNewItemData(p => ({ ...p, name: e.target.value }))}
                  placeholder="مثال: قهوة عربية"
                  className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm text-slate-900 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/15 outline-none"
                />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-slate-600">الوحدة *</label>
                  <input
                    value={newItemData.unit}
                    onChange={e => setNewItemData(p => ({ ...p, unit: e.target.value }))}
                    placeholder="كج / لتر / علبة"
                    className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm focus:border-amber-500 focus:ring-2 focus:ring-amber-500/15 outline-none"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-slate-600">الفئة</label>
                  <input
                    value={newItemData.category}
                    onChange={e => setNewItemData(p => ({ ...p, category: e.target.value }))}
                    placeholder="بن / مشروبات..."
                    className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm focus:border-amber-500 focus:ring-2 focus:ring-amber-500/15 outline-none"
                  />
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-slate-600">حد أدنى للمخزون</label>
                  <input
                    type="number" min={0} value={newItemData.minStockLevel}
                    onChange={e => setNewItemData(p => ({ ...p, minStockLevel: e.target.value }))}
                    placeholder="0"
                    className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm focus:border-amber-500 focus:ring-2 focus:ring-amber-500/15 outline-none"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-slate-600">التكلفة للوحدة</label>
                  <input
                    type="number" min={0} step={0.01} value={newItemData.costPerUnit}
                    onChange={e => setNewItemData(p => ({ ...p, costPerUnit: e.target.value }))}
                    placeholder="0.00"
                    className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm focus:border-amber-500 focus:ring-2 focus:ring-amber-500/15 outline-none"
                  />
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  onClick={handleCreateItem}
                  disabled={submitting}
                  className="flex-1 rounded-xl bg-amber-500 py-2.5 text-sm font-bold text-white hover:bg-amber-600 disabled:opacity-50 transition"
                >
                  {submitting ? "جاري الإضافة..." : "إضافة الصنف"}
                </button>
                <button
                  onClick={() => setShowNewItemModal(false)}
                  className="flex-1 rounded-xl border border-slate-200 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50 transition"
                >
                  إلغاء
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Stock Modal */}
      {showAddStockModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={() => setShowAddStockModal(null)} />
          <div className="relative w-full max-w-sm overflow-hidden rounded-3xl bg-white shadow-2xl ring-1 ring-slate-200" dir="rtl">
            <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50 px-6 py-4">
              <div>
                <h3 className="text-base font-black text-slate-900">إضافة مخزون</h3>
                <p className="text-xs text-slate-500">{selectedStockItem?.name}</p>
              </div>
              <button onClick={() => setShowAddStockModal(null)} className="rounded-xl p-1.5 text-slate-400 hover:bg-white hover:text-slate-600 transition">
                <X size={16} />
              </button>
            </div>
            <div className="space-y-4 p-6">
              <div>
                <label className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-slate-600">
                  الكمية ({selectedStockItem?.unit})
                </label>
                <input
                  type="number" min={0.01} step={0.01}
                  value={addStockData.quantity}
                  onChange={e => setAddStockData(p => ({ ...p, quantity: e.target.value }))}
                  placeholder="أدخل الكمية..."
                  className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm focus:border-amber-500 focus:ring-2 focus:ring-amber-500/15 outline-none"
                  autoFocus
                />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-slate-600">السبب (اختياري)</label>
                <input
                  value={addStockData.reason}
                  onChange={e => setAddStockData(p => ({ ...p, reason: e.target.value }))}
                  placeholder="توريد / شراء..."
                  className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm focus:border-amber-500 focus:ring-2 focus:ring-amber-500/15 outline-none"
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  onClick={handleAddStock}
                  disabled={submitting || !addStockData.quantity}
                  className="flex-1 rounded-xl bg-emerald-600 py-2.5 text-sm font-bold text-white hover:bg-emerald-700 disabled:opacity-50 transition"
                >
                  {submitting ? "جاري الإضافة..." : "تأكيد الإضافة"}
                </button>
                <button
                  onClick={() => setShowAddStockModal(null)}
                  className="flex-1 rounded-xl border border-slate-200 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50 transition"
                >
                  إلغاء
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Waste Modal */}
      {showWasteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={() => setShowWasteModal(null)} />
          <div className="relative w-full max-w-sm overflow-hidden rounded-3xl bg-white shadow-2xl ring-1 ring-slate-200" dir="rtl">
            <div className="flex items-center gap-3 border-b border-slate-100 bg-amber-50 px-6 py-4">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-100 text-amber-600">
                <Trash2 size={16} />
              </div>
              <div>
                <h3 className="text-base font-black text-slate-900">تسجيل هالك</h3>
                <p className="text-xs text-slate-500">{items.find(i => i.id === showWasteModal)?.name}</p>
              </div>
              <button onClick={() => setShowWasteModal(null)} className="mr-auto rounded-xl p-1.5 text-slate-400 hover:bg-white hover:text-slate-600 transition">
                <X size={16} />
              </button>
            </div>
            <div className="space-y-4 p-6">
              <div>
                <label className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-slate-600">
                  الكمية ({items.find(i => i.id === showWasteModal)?.unit})
                </label>
                <input
                  type="number" min={0.01} step={0.01}
                  value={wasteData.quantity}
                  onChange={e => setWasteData(p => ({ ...p, quantity: e.target.value }))}
                  placeholder="أدخل الكمية..."
                  className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm focus:border-amber-500 focus:ring-2 focus:ring-amber-500/15 outline-none"
                  autoFocus
                />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-slate-600">السبب</label>
                <input
                  value={wasteData.reason}
                  onChange={e => setWasteData(p => ({ ...p, reason: e.target.value }))}
                  placeholder="انتهاء صلاحية / تلف..."
                  className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm focus:border-amber-500 focus:ring-2 focus:ring-amber-500/15 outline-none"
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  onClick={handleRecordWaste}
                  disabled={submitting || !wasteData.quantity}
                  className="flex-1 rounded-xl bg-amber-500 py-2.5 text-sm font-bold text-white hover:bg-amber-600 disabled:opacity-50 transition"
                >
                  {submitting ? "جاري التسجيل..." : "تسجيل الهالك"}
                </button>
                <button
                  onClick={() => setShowWasteModal(null)}
                  className="flex-1 rounded-xl border border-slate-200 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50 transition"
                >
                  إلغاء
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* History Modal */}
      {showHistoryModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={() => setShowHistoryModal(false)} />
          <div className="relative w-full max-w-2xl overflow-hidden rounded-3xl bg-white shadow-2xl ring-1 ring-slate-200" dir="rtl">
            <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50 px-6 py-4">
              <div>
                <h3 className="text-base font-black text-slate-900">سجل حركة المخزون</h3>
                <p className="text-xs text-slate-500">{historyItemName ?? "كل الأصناف"}</p>
              </div>
              <button onClick={() => setShowHistoryModal(false)} className="rounded-xl p-1.5 text-slate-400 hover:bg-white hover:text-slate-600 transition">
                <X size={16} />
              </button>
            </div>
            <div className="max-h-[70vh] overflow-y-auto p-6">
              {historyLoading ? (
                <div className="flex items-center justify-center gap-2 py-12 text-slate-400">
                  <History size={20} className="animate-spin" />
                  جاري التحميل...
                </div>
              ) : historyItems.length === 0 ? (
                <div className="py-12 text-center text-sm text-slate-400">لا توجد حركات مسجلة</div>
              ) : (
                <div className="overflow-x-auto rounded-xl border border-slate-200">
                  <table className="w-full text-right text-sm">
                    <thead className="border-b border-slate-100 bg-slate-50">
                      <tr>
                        <th className="px-4 py-3 text-xs font-black uppercase tracking-wider text-slate-500">الصنف</th>
                        <th className="px-4 py-3 text-xs font-black uppercase tracking-wider text-slate-500">النوع</th>
                        <th className="px-4 py-3 text-xs font-black uppercase tracking-wider text-slate-500">الكمية</th>
                        <th className="px-4 py-3 text-xs font-black uppercase tracking-wider text-slate-500">السبب</th>
                        <th className="px-4 py-3 text-xs font-black uppercase tracking-wider text-slate-500">المستخدم</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {historyItems.map((tx) => (
                        <tr key={tx.id} className="hover:bg-amber-50/40 transition-colors">
                          <td className="px-4 py-3 font-semibold text-slate-800">{tx.inventoryItem.name}</td>
                          <td className="px-4 py-3">
                            <span className={clsx(
                              "rounded-full px-2.5 py-0.5 text-[11px] font-bold",
                              tx.type === "in" ? "bg-emerald-100 text-emerald-700" :
                              tx.type === "out" ? "bg-rose-100 text-rose-700" :
                              "bg-amber-100 text-amber-700"
                            )}>
                              {tx.type === "in" ? "إضافة" : tx.type === "out" ? "خصم" : "تعديل"}
                            </span>
                          </td>
                          <td className={clsx("px-4 py-3 font-bold tabular-nums", tx.type === "out" ? "text-rose-600" : "text-emerald-600")}>
                            {tx.type === "out" ? "-" : "+"}{tx.quantity} {tx.inventoryItem.unit}
                          </td>
                          <td className="px-4 py-3 text-slate-500 text-xs">{tx.reason ?? "—"}</td>
                          <td className="px-4 py-3 text-xs text-slate-400">
                            {tx.performedBy
                              ? [tx.performedBy.firstName, tx.performedBy.lastName].filter(Boolean).join(" ") || tx.performedBy.email
                              : "—"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
