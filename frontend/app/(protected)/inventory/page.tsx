"use client";

import { useState, useEffect } from "react";
import { 
  Boxes, 
  Plus, 
  AlertTriangle, 
  ArrowUpRight, 
  ArrowDownRight, 
  Search, 
  Filter,
  MoreVertical,
  History,
  Settings2,
  PackageCheck
} from "lucide-react";
import { api } from "../../../lib/api";
import clsx from "clsx";

export default function InventoryPage() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetchInventory();
  }, []);

  const fetchInventory = async () => {
    try {
      const res = await api.get("/inventory/items");
      setItems(res.data);
    } catch (err) {
      console.error("Failed to fetch inventory", err);
    } finally {
      setLoading(false);
    }
  };

  const lowStockItems = items.filter(item => Number(item.currentStock) <= Number(item.minStockLevel));
  const totalItems = items.length;

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">المخازن</h1>
          <p className="text-slate-500">إدارة المواد الخام والوصفات ومراقبة المخزون.</p>
        </div>
        <div className="flex items-center gap-3">
          <button className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50">
            <History size={18} />
            السجل
          </button>
          <button className="flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white shadow-lg transition hover:bg-slate-800 active:scale-95">
            <Plus size={18} />
            إضافة صنف جديد
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        <div className="group relative overflow-hidden rounded-3xl bg-white p-6 shadow-sm border border-slate-100 transition-all hover:shadow-md">
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
            <span>+2 صنف جديد هذا الأسبوع</span>
          </div>
        </div>

        <div className="group relative overflow-hidden rounded-3xl bg-white p-6 shadow-sm border border-slate-100 transition-all hover:shadow-md">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-sm font-medium text-slate-500">أصناف منخفضة</p>
              <p className="text-3xl font-bold text-rose-600">{lowStockItems.length}</p>
            </div>
            <div className={clsx(
              "rounded-2xl p-3 transition-colors",
              lowStockItems.length > 0 ? "bg-rose-50 text-rose-600 animate-pulse" : "bg-slate-50 text-slate-400"
            )}>
              <AlertTriangle size={24} />
            </div>
          </div>
          <div className="mt-4 flex items-center gap-2 text-xs font-medium text-rose-500">
            {lowStockItems.length > 0 ? "يجب إعادة الطلب فوراً" : "المخزون في حالة جيدة"}
          </div>
        </div>

        <div className="group relative overflow-hidden rounded-3xl bg-white p-6 shadow-sm border border-slate-100 transition-all hover:shadow-md">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-sm font-medium text-slate-500">جاهزية الوصفات</p>
              <p className="text-3xl font-bold text-slate-900">92%</p>
            </div>
            <div className="rounded-2xl bg-amber-50 p-3 text-amber-600 transition-colors group-hover:bg-amber-100">
              <Settings2 size={24} />
            </div>
          </div>
          <div className="mt-4 flex items-center gap-2 text-xs font-medium text-amber-600">
            <span>تحتاج 3 منتجات لربط وصفاتها</span>
          </div>
        </div>
      </div>

      {/* Main Grid */}
      <div className="space-y-4">
        {/* Search and Filters */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between bg-white/50 p-2 rounded-2xl border border-slate-200/50 backdrop-blur-sm">
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
            <button className="flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 transition">
              <Filter size={14} />
              تصفية
            </button>
          </div>
        </div>

        {/* Inventory Grid */}
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {loading ? (
            Array(6).fill(0).map((_, i) => (
              <div key={i} className="h-48 rounded-3xl bg-slate-100 animate-pulse" />
            ))
          ) : (
            items.filter(item => item.name.includes(search)).map((item) => {
              const stockNum = Number(item.currentStock);
              const minStock = Number(item.minStockLevel);
              const percentage = Math.min(100, Math.max(0, (stockNum / (minStock * 2 || 100)) * 100));
              
              return (
                <div key={item.id} className="group flex flex-col justify-between rounded-3xl bg-white p-5 shadow-sm border border-slate-100 transition-all hover:shadow-md hover:-translate-y-1">
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">{item.category || "خامات"}</p>
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
                      <span className={clsx(
                        "text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-tight",
                        stockNum <= minStock ? "bg-rose-50 text-rose-600" : "bg-emerald-50 text-emerald-600"
                      )}>
                        {stockNum <= minStock ? "منخفض" : "متوفر"}
                      </span>
                    </div>
                    
                    {/* Progress Bar */}
                    <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
                      <div 
                        className={clsx(
                          "h-full transition-all duration-1000",
                          stockNum <= minStock ? "bg-rose-500" : "bg-emerald-500"
                        )}
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>

                  <div className="mt-6 grid grid-cols-2 gap-2">
                    <button className="flex items-center justify-center gap-2 rounded-xl bg-slate-50 py-2 text-xs font-bold text-slate-600 transition hover:bg-slate-100">
                      <Plus size={14} />
                      إضافة مخزون
                    </button>
                    <button className="flex items-center justify-center gap-2 rounded-xl bg-slate-50 py-2 text-xs font-bold text-slate-600 transition hover:bg-slate-100">
                      <Settings2 size={14} />
                      تعديل الوصفة
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
