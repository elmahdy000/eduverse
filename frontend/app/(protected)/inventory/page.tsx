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
              .map((_, i) => <div key={i} className="h-48 animate-pulse rounded-3xl bg-slate-100" />)
          ) : (
            items
              .filter((item) =>
                item.name.toLowerCase().includes(search.toLowerCase()) &&
                (categoryFilter === "" || item.category === categoryFilter)
              )
              .map((item) => {
                const stockNum = Number(item.currentStock);
                const minStock = Number(item.minStockLevel);
                const percentage = Math.min(100, Math.max(0, (stockNum / (minStock * 2 || 100)) * 100));

                return (
                  <div
                    key={item.id}
                    className="group flex flex-col justify-between rounded-3xl border border-slate-100 bg-white p-5 shadow-sm transition-all hover:-translate-y-1 hover:shadow-md"
                  >
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <p className="text-xs font-bold uppercase tracking-wider text-slate-400">{item.category || "خامات"}</p>
                        <h3 className="font-bold text-slate-900">{item.name}</h3>
                      </div>
                      <button
                        onClick={() => openHistory(item.id)}
                        title="سجل حركة هذا الصنف"
                        className="text-slate-400 hover:text-slate-600 transition-colors"
                      >
                        <History size={16} />
                      </button>
                    </div>

                    <div className="mt-6 space-y-3">
                      <div className="flex items-end justify-between">
                        <div className="flex items-baseline gap-1">
                          <span className="text-2xl font-bold text-slate-900">{stockNum}</span>
                          <span className="text-xs font-medium text-slate-500">{item.unit}</span>
                        </div>
                        <span
                          className={clsx(
                            "rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-tight",
                            stockNum <= minStock ? "bg-rose-50 text-rose-600" : "bg-emerald-50 text-emerald-600",
                          )}
                        >
                          {stockNum <= minStock ? "منخفض" : "متوفر"}
                        </span>
                      </div>

                      <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
                        <div
                          className={clsx(
                            "h-full transition-all duration-1000",
                            stockNum <= minStock ? "bg-rose-500" : "bg-emerald-500",
                          )}
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>

                    <div className="mt-6 grid grid-cols-2 gap-2">
                      <button
                        onClick={() => setShowAddStockModal(item.id)}
                        className="flex items-center justify-center gap-2 rounded-xl bg-slate-50 py-2 text-xs font-bold text-slate-600 transition hover:bg-slate-100"
                      >
                        <Plus size={14} />
                        إضافة مخزون
                      </button>
                      <button
                        onClick={() => setShowWasteModal(item.id)}
                        className="flex items-center justify-center gap-2 rounded-xl bg-rose-50 py-2 text-xs font-bold text-rose-600 transition hover:bg-rose-100"
                      >
                        <Trash2 size={14} />
                        تسجيل هالك
                      </button>
                    </div>
                  </div>
                );
              })
          )}
        </div>
      </div>

      {showNewItemModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 text-right backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-[2rem] bg-white p-6 shadow-2xl">
            <h3 className="text-xl font-bold text-slate-900">إضافة صنف جديد</h3>
            <p className="mt-1 text-sm text-slate-500">اكتب بيانات الصنف وهيظهر فورًا في القائمة.</p>

            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              <input className="rounded-xl border border-slate-200 p-3 text-sm" placeholder="اسم الصنف" value={newItemData.name} onChange={(e) => setNewItemData((p) => ({ ...p, name: e.target.value }))} />
              <input className="rounded-xl border border-slate-200 p-3 text-sm" placeholder="الوحدة (كجم/لتر/قطعة)" value={newItemData.unit} onChange={(e) => setNewItemData((p) => ({ ...p, unit: e.target.value }))} />
              <input className="rounded-xl border border-slate-200 p-3 text-sm" placeholder="التصنيف" value={newItemData.category} onChange={(e) => setNewItemData((p) => ({ ...p, category: e.target.value }))} />
              <input type="number" className="rounded-xl border border-slate-200 p-3 text-sm" placeholder="الحد الأدنى للمخزون" value={newItemData.minStockLevel} onChange={(e) => setNewItemData((p) => ({ ...p, minStockLevel: e.target.value }))} />
              <input type="number" className="rounded-xl border border-slate-200 p-3 text-sm sm:col-span-2" placeholder="تكلفة الوحدة (اختياري)" value={newItemData.costPerUnit} onChange={(e) => setNewItemData((p) => ({ ...p, costPerUnit: e.target.value }))} />
            </div>

            <div className="mt-6 flex gap-3">
              <button onClick={() => { setShowNewItemModal(false); setNewItemData(EMPTY_NEW_ITEM); }} className="flex-1 rounded-xl bg-slate-100 py-3 font-semibold text-slate-700 hover:bg-slate-200">إلغاء</button>
              <button onClick={handleCreateItem} disabled={submitting} className="flex-1 rounded-xl bg-slate-900 py-3 font-semibold text-white hover:bg-slate-800 disabled:opacity-50">{submitting ? "جاري الحفظ..." : "حفظ الصنف"}</button>
            </div>
          </div>
        </div>
      )}

      {showAddStockModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 text-right backdrop-blur-sm">
          <div className="w-full max-w-md rounded-[2rem] bg-white p-6 shadow-2xl">
            <h3 className="text-xl font-bold text-slate-900">إضافة مخزون</h3>
            <p className="mt-1 text-sm text-slate-500">الصنف: {selectedStockItem?.name || "-"}</p>

            <div className="mt-5 space-y-3">
              <input type="number" autoFocus className="w-full rounded-xl border border-slate-200 p-3 text-sm" placeholder="الكمية" value={addStockData.quantity} onChange={(e) => setAddStockData((p) => ({ ...p, quantity: e.target.value }))} />
              <input className="w-full rounded-xl border border-slate-200 p-3 text-sm" placeholder="سبب الإضافة (اختياري)" value={addStockData.reason} onChange={(e) => setAddStockData((p) => ({ ...p, reason: e.target.value }))} />
            </div>

            <div className="mt-6 flex gap-3">
              <button onClick={() => { setShowAddStockModal(null); setAddStockData({ quantity: "", reason: "" }); }} className="flex-1 rounded-xl bg-slate-100 py-3 font-semibold text-slate-700 hover:bg-slate-200">إلغاء</button>
              <button onClick={handleAddStock} disabled={submitting || !addStockData.quantity} className="flex-1 rounded-xl bg-slate-900 py-3 font-semibold text-white hover:bg-slate-800 disabled:opacity-50">{submitting ? "جاري الإضافة..." : "تأكيد"}</button>
            </div>
          </div>
        </div>
      )}

      {/* History Modal */}
      {showHistoryModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 text-right backdrop-blur-sm">
          <div className="flex h-[600px] w-full max-w-2xl flex-col overflow-hidden rounded-[2rem] bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 p-6">
              <div>
                <h3 className="text-xl font-bold text-slate-900">
                  {historyItemName ? `سجل حركة: ${historyItemName}` : "سجل حركة المخزون"}
                </h3>
                <p className="text-sm text-slate-500">آخر 100 عملية</p>
              </div>
              <button
                onClick={() => setShowHistoryModal(false)}
                className="rounded-xl border border-slate-200 p-2 hover:bg-slate-50"
              >
                <X size={18} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
              {historyLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Clock size={24} className="animate-spin text-slate-400" />
                </div>
              ) : historyItems.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-slate-400">
                  <History size={40} className="mb-3" />
                  <p className="text-sm">لا توجد عمليات مسجلة بعد.</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {historyItems.map((tx) => (
                    <div
                      key={tx.id}
                      className={clsx(
                        "flex items-start justify-between rounded-xl border p-3",
                        tx.type === "in" ? "border-emerald-100 bg-emerald-50" :
                        tx.type === "out" ? "border-rose-100 bg-rose-50" :
                        "border-amber-100 bg-amber-50"
                      )}
                    >
                      <div className="space-y-0.5 text-right">
                        <p className="text-xs font-bold text-slate-700">
                          {tx.inventoryItem.name}
                        </p>
                        <p className="text-[11px] text-slate-500">{tx.reason || "بدون سبب"}</p>
                        <p className="text-[10px] text-slate-400">
                          {tx.performedBy
                            ? `${tx.performedBy.firstName || ""} ${tx.performedBy.lastName || ""}`.trim() || tx.performedBy.email
                            : "نظام"}
                        </p>
                      </div>
                      <div className="text-left">
                        <span
                          className={clsx(
                            "text-sm font-black",
                            tx.type === "in" ? "text-emerald-700" :
                            tx.type === "out" ? "text-rose-700" : "text-amber-700"
                          )}
                        >
                          {tx.type === "in" ? "+" : "-"}{tx.quantity} {tx.inventoryItem.unit}
                        </span>
                        <p className="text-[10px] text-slate-400 mt-1">
                          {new Date(tx.createdAt).toLocaleString("ar-EG", {
                            day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit",
                          })}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {showWasteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 text-right backdrop-blur-sm">
          <div className="w-full max-w-md rounded-[2.5rem] bg-white p-8 shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-3xl bg-rose-50 text-rose-600">
              <Trash2 size={32} />
            </div>
            <h3 className="text-2xl font-bold text-slate-900">تسجيل هالك</h3>
            <p className="mt-2 text-sm text-slate-500">الكمية هتتخصم من المخزون وتتسجل للمراجعة.</p>

            <div className="mt-8 space-y-4">
              <div className="space-y-1.5">
                <label className="text-sm font-bold text-slate-700">الكمية</label>
                <input type="number" autoFocus placeholder="0.00" className="w-full rounded-2xl border-slate-200 bg-slate-50 p-4 text-lg font-bold text-slate-900" value={wasteData.quantity} onChange={(e) => setWasteData({ ...wasteData, quantity: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-bold text-slate-700">السبب</label>
                <select className="w-full rounded-2xl border-slate-200 bg-slate-50 p-4 text-sm text-slate-900" value={wasteData.reason} onChange={(e) => setWasteData({ ...wasteData, reason: e.target.value })}>
                  <option value="">اختار السبب...</option>
                  <option value="Breakage">كسر</option>
                  <option value="Expired">انتهاء صلاحية</option>
                  <option value="Preparation Error">خطأ تحضير</option>
                  <option value="Spillage">انسكاب</option>
                  <option value="Other">أخرى</option>
                </select>
              </div>

              <div className="flex gap-3 pt-4">
                <button onClick={() => setShowWasteModal(null)} className="flex-1 rounded-2xl bg-slate-100 py-4 font-bold text-slate-600 transition hover:bg-slate-200">إلغاء</button>
                <button onClick={handleRecordWaste} disabled={!wasteData.quantity || submitting} className="flex-1 rounded-2xl bg-rose-600 py-4 font-bold text-white shadow-lg transition hover:bg-rose-700 disabled:opacity-50">{submitting ? "جاري التسجيل..." : "تأكيد"}</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
