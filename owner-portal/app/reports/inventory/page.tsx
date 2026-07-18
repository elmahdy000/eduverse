"use client";

import { useEffect, useState } from "react";
import { PortalShell } from "@/components/PortalShell";
import { DateRangePicker, DateRange } from "@/components/DateRangePicker";
import { reports } from "@/lib/api";
import { fmtMoney, fmtNumber, fmtDateTime } from "@/lib/format";
import { AlertTriangle } from "lucide-react";

export default function InventoryPage() {
  const [range, setRange] = useState<DateRange>({ from: "", to: "" });
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<"all" | "low" | "fridge" | "bakery">("all");

  useEffect(() => {
    if (!range.from || !range.to) return;
    let cancelled = false;
    setLoading(true);
    setError(null);
    reports
      .inventory(range.from, range.to)
      .then((d) => {
        if (!cancelled) setData(d);
      })
      .catch((e) => {
        if (!cancelled) setError(e?.message || "خطأ في تحميل البيانات");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [range.from, range.to]);

  const items = data?.items?.filter((i: any) => {
    if (filter === "low") return i.belowMin;
    if (filter === "fridge") return i.isFridge;
    if (filter === "bakery") return i.isBakery;
    return true;
  });

  return (
    <PortalShell>
      <div className="mb-6">
        <h1 className="text-3xl font-black text-amber-300 mb-2">المخزون والهالك</h1>
        <div className="text-slate-400 text-sm">
          حالة المخزون الحالية، الأصناف تحت حد الإنذار، والهالك خلال الفترة.
        </div>
      </div>

      <div className="op-panel mb-6">
        <DateRangePicker value={range} onChange={setRange} />
      </div>

      {loading && (
        <div className="flex items-center justify-center py-16">
          <div className="op-spinner" />
        </div>
      )}

      {error && (
        <div className="op-panel text-rose-300 text-sm">خطأ: {error}</div>
      )}

      {!loading && !error && data && (
        <>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
            <div className="op-panel">
              <div className="op-card-title">إجمالي الأصناف</div>
              <div className="op-card-value">{fmtNumber(data.summary?.totalItems)}</div>
            </div>
            <div className="op-panel">
              <div className="op-card-title">قيمة المخزون</div>
              <div className="op-card-value text-emerald-400">
                {fmtMoney(data.summary?.totalStockValue)}
              </div>
            </div>
            <div className="op-panel" style={{ borderColor: data.summary?.lowStockCount > 0 ? "#ef4444" : undefined }}>
              <div className="op-card-title flex items-center gap-2">
                {data.summary?.lowStockCount > 0 && <AlertTriangle size={14} className="text-rose-400" />}
                تحت حد الإنذار
              </div>
              <div className={`op-card-value ${data.summary?.lowStockCount > 0 ? "text-rose-400" : ""}`}>
                {fmtNumber(data.summary?.lowStockCount)}
              </div>
            </div>
            <div className="op-panel">
              <div className="op-card-title">قيود هالك</div>
              <div className="op-card-value">{fmtNumber(data.summary?.wasteEntriesCount)}</div>
            </div>
            <div className="op-panel">
              <div className="op-card-title">تكلفة الهالك</div>
              <div className="op-card-value text-rose-400">{fmtMoney(data.summary?.totalWasteCost)}</div>
            </div>
          </div>

          {/* Low stock items */}
          {data.lowStockItems?.length > 0 && (
            <div className="op-panel mb-6" style={{ borderColor: "#ef4444" }}>
              <div className="flex items-center gap-2 mb-4">
                <AlertTriangle className="text-rose-400" size={18} />
                <div className="text-sm font-bold text-rose-300">
                  أصناف تحت حد الإنذار ({data.lowStockItems.length})
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="op-table">
                  <thead>
                    <tr>
                      <th>الصنف</th>
                      <th>الرصيد الحالي</th>
                      <th>الحد الأدنى</th>
                      <th>العجز</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.lowStockItems.map((i: any) => (
                      <tr key={i.id}>
                        <td className="font-semibold">{i.name}</td>
                        <td>
                          {fmtNumber(i.currentStock, 2)} {i.unit}
                        </td>
                        <td className="text-slate-400">
                          {fmtNumber(i.minStockLevel, 2)} {i.unit}
                        </td>
                        <td className="text-rose-300 font-bold">
                          {fmtNumber(i.deficit, 2)} {i.unit}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Waste */}
          {data.wasteByItem?.length > 0 && (
            <div className="op-panel mb-6">
              <div className="text-sm font-bold mb-4">تحليل الهالك حسب الصنف</div>
              <div className="overflow-x-auto">
                <table className="op-table">
                  <thead>
                    <tr>
                      <th>الصنف</th>
                      <th>الكمية</th>
                      <th>التكلفة المقدَّرة</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.wasteByItem.map((w: any) => (
                      <tr key={w.itemId}>
                        <td className="font-semibold">{w.name}</td>
                        <td>{fmtNumber(w.quantity, 2)}</td>
                        <td className="text-rose-300 font-bold">{fmtMoney(w.estimatedCost)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* All items with filter */}
          <div className="op-panel mb-6">
            <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
              <div className="text-sm font-bold">الأصناف ({items?.length ?? 0})</div>
              <div className="flex gap-2 text-sm">
                <button
                  className={`op-btn-ghost ${filter === "all" ? "is-active" : ""}`}
                  onClick={() => setFilter("all")}
                >
                  الكل
                </button>
                <button
                  className={`op-btn-ghost ${filter === "low" ? "is-active" : ""}`}
                  onClick={() => setFilter("low")}
                >
                  تحت الحد
                </button>
                <button
                  className={`op-btn-ghost ${filter === "fridge" ? "is-active" : ""}`}
                  onClick={() => setFilter("fridge")}
                >
                  تلاجة
                </button>
                <button
                  className={`op-btn-ghost ${filter === "bakery" ? "is-active" : ""}`}
                  onClick={() => setFilter("bakery")}
                >
                  مخبوزات
                </button>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="op-table">
                <thead>
                  <tr>
                    <th>الصنف</th>
                    <th>التصنيف</th>
                    <th>الرصيد</th>
                    <th>الحد الأدنى</th>
                    <th>تكلفة الوحدة</th>
                    <th>قيمة الرصيد</th>
                  </tr>
                </thead>
                <tbody>
                  {items?.map((i: any) => (
                    <tr key={i.id}>
                      <td className="font-semibold">
                        {i.name}
                        {i.isFridge && (
                          <span className="text-xs text-blue-400 mr-2">تلاجة</span>
                        )}
                        {i.isBakery && (
                          <span className="text-xs text-orange-400 mr-2">مخبوز</span>
                        )}
                      </td>
                      <td className="text-xs text-slate-400">{i.category || "—"}</td>
                      <td className={i.belowMin ? "text-rose-300 font-bold" : ""}>
                        {fmtNumber(i.currentStock, 2)} {i.unit}
                      </td>
                      <td className="text-slate-400">
                        {fmtNumber(i.minStockLevel, 2)} {i.unit}
                      </td>
                      <td>{fmtMoney(i.costPerUnit)}</td>
                      <td className="font-bold text-emerald-300">{fmtMoney(i.stockValue)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Recent movements */}
          <div className="op-panel">
            <div className="text-sm font-bold mb-4">أحدث حركات المخزون</div>
            <div className="overflow-x-auto">
              <table className="op-table">
                <thead>
                  <tr>
                    <th>التاريخ</th>
                    <th>الصنف</th>
                    <th>النوع</th>
                    <th>الكمية</th>
                    <th>السبب</th>
                    <th>بواسطة</th>
                  </tr>
                </thead>
                <tbody>
                  {data.recentMovements?.map((m: any) => (
                    <tr key={m.id}>
                      <td className="text-xs">{fmtDateTime(m.createdAt)}</td>
                      <td className="font-semibold">{m.itemName}</td>
                      <td>
                        <span
                          className={`op-badge ${
                            m.type === "in" ? "paid" : m.type === "out" ? "unpaid" : "partial"
                          }`}
                        >
                          {m.type === "in" ? "وارد" : m.type === "out" ? "منصرف" : "تسوية"}
                        </span>
                      </td>
                      <td>
                        {fmtNumber(m.quantity, 2)} {m.unit}
                      </td>
                      <td className="text-xs text-slate-400">{m.reason || "—"}</td>
                      <td className="text-xs">{m.performedBy || "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </PortalShell>
  );
}
