"use client";

import { useEffect, useState } from "react";
import {
  AlertTriangle,
  ArrowUpRight,
  Boxes,
  Filter,
  History,
  MoreVertical,
  Plus,
  Search,
  Settings2,
  Trash2,
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

  const [showNewItemModal, setShowNewItemModal] = useState(false);
  const [newItemData, setNewItemData] = useState(EMPTY_NEW_ITEM);

  const [showAddStockModal, setShowAddStockModal] = useState<string | null>(null);
  const [addStockData, setAddStockData] = useState({ quantity: "", reason: "" });

  const [showWasteModal, setShowWasteModal] = useState<string | null>(null);
  const [wasteData, setWasteData] = useState({ quantity: "", reason: "" });

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
      setMessage({ ok: false, text: "Could not load inventory now." });
    } finally {
      setLoading(false);
    }
  };

  const lowStockItems = items.filter((item) => Number(item.currentStock) <= Number(item.minStockLevel));
  const totalItems = items.length;

  const selectedStockItem = items.find((item) => item.id === showAddStockModal);

  const handleCreateItem = async () => {
    if (!newItemData.name.trim() || !newItemData.unit.trim()) {
      setMessage({ ok: false, text: "Item name and unit are required." });
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
      setMessage({ ok: true, text: "Item created successfully." });
      await fetchInventory();
    } catch (err: any) {
      console.error("Failed to create inventory item", err);
      const status = err?.response?.status;
      setMessage({
        ok: false,
        text: status === 403 ? "Only owner or operations manager can create inventory items." : "Failed to create item.",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleAddStock = async () => {
    if (!showAddStockModal || !addStockData.quantity) return;

    const quantity = Number(addStockData.quantity);
    if (!Number.isFinite(quantity) || quantity <= 0) {
      setMessage({ ok: false, text: "Stock quantity must be greater than zero." });
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
      setMessage({ ok: true, text: "Stock added successfully." });
      await fetchInventory();
    } catch (err: any) {
      console.error("Failed to add stock", err);
      const status = err?.response?.status;
      setMessage({
        ok: false,
        text: status === 403 ? "Only owner or operations manager can add stock." : "Failed to add stock.",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleRecordWaste = async () => {
    if (!showWasteModal) return;

    const quantity = Number(wasteData.quantity);
    if (!Number.isFinite(quantity) || quantity <= 0) {
      setMessage({ ok: false, text: "Waste quantity must be greater than zero." });
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
      setMessage({ ok: true, text: "Waste recorded successfully." });
      await fetchInventory();
    } catch (err) {
      console.error("Failed to record waste", err);
      setMessage({ ok: false, text: "Failed to record waste." });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Inventory</h1>
          <p className="text-slate-500">Manage raw materials, recipes, and stock movement.</p>
        </div>
        <div className="flex items-center gap-3">
          <button className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50">
            <History size={18} />
            Log
          </button>
          <button
            onClick={() => setShowNewItemModal(true)}
            className="flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white shadow-lg transition hover:bg-slate-800 active:scale-95"
          >
            <Plus size={18} />
            Add New Item
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
              <p className="text-sm font-medium text-slate-500">Total Items</p>
              <p className="text-3xl font-bold text-slate-900">{totalItems}</p>
            </div>
            <div className="rounded-2xl bg-blue-50 p-3 text-blue-600 transition-colors group-hover:bg-blue-100">
              <Boxes size={24} />
            </div>
          </div>
          <div className="mt-4 flex items-center gap-2 text-xs font-medium text-emerald-600">
            <ArrowUpRight size={14} />
            <span>Live stock monitoring</span>
          </div>
        </div>

        <div className="group relative overflow-hidden rounded-3xl border border-slate-100 bg-white p-6 shadow-sm transition-all hover:shadow-md">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-sm font-medium text-slate-500">Low Stock Items</p>
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
            {lowStockItems.length > 0 ? "Some items need replenishment" : "Stock status is healthy"}
          </div>
        </div>

        <div className="group relative overflow-hidden rounded-3xl border border-slate-100 bg-white p-6 shadow-sm transition-all hover:shadow-md">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-sm font-medium text-slate-500">Recipe Coverage</p>
              <p className="text-3xl font-bold text-slate-900">92%</p>
            </div>
            <div className="rounded-2xl bg-amber-50 p-3 text-amber-600 transition-colors group-hover:bg-amber-100">
              <Settings2 size={24} />
            </div>
          </div>
          <div className="mt-4 flex items-center gap-2 text-xs font-medium text-amber-600">
            <span>Review products that still miss recipe links</span>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex flex-col gap-4 rounded-2xl border border-slate-200/50 bg-white/50 p-2 backdrop-blur-sm md:flex-row md:items-center md:justify-between">
          <div className="relative flex-1">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input
              type="text"
              placeholder="Search item..."
              className="w-full rounded-xl border-none bg-transparent pr-10 text-sm focus:ring-0"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-2 px-2">
            <button className="flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-semibold text-slate-600 transition hover:bg-slate-100">
              <Filter size={14} />
              Filter
            </button>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {loading ? (
            Array(6)
              .fill(0)
              .map((_, i) => <div key={i} className="h-48 animate-pulse rounded-3xl bg-slate-100" />)
          ) : (
            items
              .filter((item) => item.name.toLowerCase().includes(search.toLowerCase()))
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
                        <p className="text-xs font-bold uppercase tracking-wider text-slate-400">{item.category || "Raw Material"}</p>
                        <h3 className="font-bold text-slate-900">{item.name}</h3>
                      </div>
                      <button className="text-slate-400 hover:text-slate-600">
                        <MoreVertical size={18} />
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
                          {stockNum <= minStock ? "Low" : "Available"}
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
                        Add Stock
                      </button>
                      <button
                        onClick={() => setShowWasteModal(item.id)}
                        className="flex items-center justify-center gap-2 rounded-xl bg-rose-50 py-2 text-xs font-bold text-rose-600 transition hover:bg-rose-100"
                      >
                        <Trash2 size={14} />
                        Record Waste
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
            <h3 className="text-xl font-bold text-slate-900">Add New Item</h3>
            <p className="mt-1 text-sm text-slate-500">Save new item details and it will appear immediately.</p>

            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              <input className="rounded-xl border border-slate-200 p-3 text-sm" placeholder="Item name" value={newItemData.name} onChange={(e) => setNewItemData((p) => ({ ...p, name: e.target.value }))} />
              <input className="rounded-xl border border-slate-200 p-3 text-sm" placeholder="Unit (kg/ltr/pcs)" value={newItemData.unit} onChange={(e) => setNewItemData((p) => ({ ...p, unit: e.target.value }))} />
              <input className="rounded-xl border border-slate-200 p-3 text-sm" placeholder="Category" value={newItemData.category} onChange={(e) => setNewItemData((p) => ({ ...p, category: e.target.value }))} />
              <input type="number" className="rounded-xl border border-slate-200 p-3 text-sm" placeholder="Minimum stock level" value={newItemData.minStockLevel} onChange={(e) => setNewItemData((p) => ({ ...p, minStockLevel: e.target.value }))} />
              <input type="number" className="rounded-xl border border-slate-200 p-3 text-sm sm:col-span-2" placeholder="Cost per unit (optional)" value={newItemData.costPerUnit} onChange={(e) => setNewItemData((p) => ({ ...p, costPerUnit: e.target.value }))} />
            </div>

            <div className="mt-6 flex gap-3">
              <button onClick={() => { setShowNewItemModal(false); setNewItemData(EMPTY_NEW_ITEM); }} className="flex-1 rounded-xl bg-slate-100 py-3 font-semibold text-slate-700 hover:bg-slate-200">Cancel</button>
              <button onClick={handleCreateItem} disabled={submitting} className="flex-1 rounded-xl bg-slate-900 py-3 font-semibold text-white hover:bg-slate-800 disabled:opacity-50">{submitting ? "Saving..." : "Save Item"}</button>
            </div>
          </div>
        </div>
      )}

      {showAddStockModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 text-right backdrop-blur-sm">
          <div className="w-full max-w-md rounded-[2rem] bg-white p-6 shadow-2xl">
            <h3 className="text-xl font-bold text-slate-900">Add Stock</h3>
            <p className="mt-1 text-sm text-slate-500">Item: {selectedStockItem?.name || "-"}</p>

            <div className="mt-5 space-y-3">
              <input type="number" autoFocus className="w-full rounded-xl border border-slate-200 p-3 text-sm" placeholder="Quantity" value={addStockData.quantity} onChange={(e) => setAddStockData((p) => ({ ...p, quantity: e.target.value }))} />
              <input className="w-full rounded-xl border border-slate-200 p-3 text-sm" placeholder="Reason (optional)" value={addStockData.reason} onChange={(e) => setAddStockData((p) => ({ ...p, reason: e.target.value }))} />
            </div>

            <div className="mt-6 flex gap-3">
              <button onClick={() => { setShowAddStockModal(null); setAddStockData({ quantity: "", reason: "" }); }} className="flex-1 rounded-xl bg-slate-100 py-3 font-semibold text-slate-700 hover:bg-slate-200">Cancel</button>
              <button onClick={handleAddStock} disabled={submitting || !addStockData.quantity} className="flex-1 rounded-xl bg-slate-900 py-3 font-semibold text-white hover:bg-slate-800 disabled:opacity-50">{submitting ? "Adding..." : "Confirm"}</button>
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
            <h3 className="text-2xl font-bold text-slate-900">Record Waste</h3>
            <p className="mt-2 text-sm text-slate-500">Quantity will be deducted and recorded for review.</p>

            <div className="mt-8 space-y-4">
              <div className="space-y-1.5">
                <label className="text-sm font-bold text-slate-700">Quantity</label>
                <input type="number" autoFocus placeholder="0.00" className="w-full rounded-2xl border-slate-200 bg-slate-50 p-4 text-lg font-bold text-slate-900" value={wasteData.quantity} onChange={(e) => setWasteData({ ...wasteData, quantity: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-bold text-slate-700">Reason</label>
                <select className="w-full rounded-2xl border-slate-200 bg-slate-50 p-4 text-sm text-slate-900" value={wasteData.reason} onChange={(e) => setWasteData({ ...wasteData, reason: e.target.value })}>
                  <option value="">Select reason...</option>
                  <option value="Breakage">Breakage</option>
                  <option value="Expired">Expired</option>
                  <option value="Preparation Error">Preparation Error</option>
                  <option value="Spillage">Spillage</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div className="flex gap-3 pt-4">
                <button onClick={() => setShowWasteModal(null)} className="flex-1 rounded-2xl bg-slate-100 py-4 font-bold text-slate-600 transition hover:bg-slate-200">Cancel</button>
                <button onClick={handleRecordWaste} disabled={!wasteData.quantity || submitting} className="flex-1 rounded-2xl bg-rose-600 py-4 font-bold text-white shadow-lg transition hover:bg-rose-700 disabled:opacity-50">{submitting ? "Saving..." : "Confirm"}</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
