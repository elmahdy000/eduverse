"use client";

import { FormEvent, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Coffee, Clock, CheckCircle2, XCircle, Plus, Trash2, RefreshCw, ArrowLeft, Timer, Flame } from "lucide-react";
import Link from "next/link";
import { api } from "../../../lib/api";
import { translateApiError } from "../../../lib/errors";
import { dateTime, money } from "../../../lib/format";
import { translateStatus } from "../../../lib/labels";
import type { BarOrder, Customer, Paginated, Product, Session } from "../../../lib/types";
import { DataTable, Panel, SectionTitle, Badge } from "../../../components/ui";
import clsx from "clsx";

interface CreateItem {
  productId: string;
  quantity: number;
}

export default function BarOrdersPage() {
  const queryClient = useQueryClient();

  const [sessionId, setSessionId] = useState("");
  const [customerId, setCustomerId] = useState("");
  const [notes, setNotes] = useState("");
  const [newItemProductId, setNewItemProductId] = useState("");
  const [newItemQuantity, setNewItemQuantity] = useState("1");
  const [items, setItems] = useState<CreateItem[]>([]);

  const [statusFilter, setStatusFilter] = useState("");
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const ordersQuery = useQuery({
    queryKey: ["bar-orders", "kanban"],
    queryFn: async () => {
      const response = await api.get("/bar-orders", {
        params: { page: 1, limit: 100, status: "new,in_preparation,ready,delivered" },
      });
      return response.data.data as Paginated<BarOrder>;
    },
    refetchInterval: 30000,
  });

  const productsQuery = useQuery({
    queryKey: ["products", "for-bar-orders"],
    queryFn: async () => {
      const response = await api.get("/products", { params: { page: 1, limit: 100, active: true } });
      return response.data.data as Paginated<Product>;
    },
  });

  const sessionsQuery = useQuery({
    queryKey: ["sessions", "for-bar-orders"],
    queryFn: async () => {
      const response = await api.get("/sessions", { params: { page: 1, limit: 100 } });
      return response.data.data as Paginated<Session>;
    },
  });

  const customersQuery = useQuery({
    queryKey: ["customers", "for-bar-orders"],
    queryFn: async () => {
      const response = await api.get("/customers", { params: { page: 1, limit: 100 } });
      return response.data.data as Paginated<Customer>;
    },
  });

  const selectedOrderQuery = useQuery({
    queryKey: ["bar-orders", selectedOrderId],
    enabled: Boolean(selectedOrderId),
    queryFn: async () => {
      const response = await api.get(`/bar-orders/${selectedOrderId}`);
      return response.data.data as BarOrder;
    },
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      await api.post("/bar-orders", {
        sessionId: sessionId || undefined,
        customerId: customerId || undefined,
        items,
        notes: notes || undefined,
      });
    },
    onSuccess: () => {
      setSessionId("");
      setCustomerId("");
      setNotes("");
      setItems([]);
      setNewItemProductId("");
      setNewItemQuantity("1");
      setMessage("الطلب اتسجل.");
      queryClient.invalidateQueries({ queryKey: ["bar-orders"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard", "barista"] });
    },
    onError: (error: unknown) => {
      const apiMessage =
        (error as { response?: { data?: { message?: string | string[] } } })?.response?.data?.message;
      setMessage(translateApiError(apiMessage));
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ orderId, status }: { orderId: string; status: string }) => {
      await api.put(`/bar-orders/${orderId}/status`, { status });
    },
    onSuccess: () => {
      setMessage("حالة الطلب اتغيرت.");
      queryClient.invalidateQueries({ queryKey: ["bar-orders"] });
      if (selectedOrderId) {
        queryClient.invalidateQueries({ queryKey: ["bar-orders", selectedOrderId] });
      }
      queryClient.invalidateQueries({ queryKey: ["dashboard", "barista"] });
    },
    onError: (error: unknown) => {
      const apiMessage =
        (error as { response?: { data?: { message?: string | string[] } } })?.response?.data?.message;
      setMessage(translateApiError(apiMessage));
    },
  });

  const cancelMutation = useMutation({
    mutationFn: async ({ orderId, reason }: { orderId: string; reason?: string }) => {
      await api.put(`/bar-orders/${orderId}/cancel`, { reason });
    },
    onSuccess: () => {
      setMessage("الطلب اتلغى.");
      queryClient.invalidateQueries({ queryKey: ["bar-orders"] });
      if (selectedOrderId) {
        queryClient.invalidateQueries({ queryKey: ["bar-orders", selectedOrderId] });
      }
      queryClient.invalidateQueries({ queryKey: ["dashboard", "barista"] });
    },
    onError: (error: unknown) => {
      const apiMessage =
        (error as { response?: { data?: { message?: string | string[] } } })?.response?.data?.message;
      setMessage(translateApiError(apiMessage));
    },
  });

  function addItem() {
    if (!newItemProductId) return;
    const quantity = Number(newItemQuantity);
    if (!Number.isFinite(quantity) || quantity < 1) return;
    setItems((prev) => [...prev, { productId: newItemProductId, quantity }]);
    setNewItemProductId("");
    setNewItemQuantity("1");
  }

  function onCreateSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage(null);
    createMutation.mutate();
  }

  const rows = useMemo(
    () =>
      ordersQuery.data?.data?.map((order) => [
        order.id.slice(0, 8),
        translateStatus(order.status),
        money(order.totalAmount ?? 0),
        dateTime(order.createdAt),
      ]) ?? [],
    [ordersQuery.data?.data],
  );

  const kanbanColumns = [
    { id: "new", label: "جديد", color: "bg-blue-100 border-blue-200" },
    { id: "in_preparation", label: "بيتجهز", color: "bg-amber-100 border-amber-200" },
    { id: "ready", label: "جاهز", color: "bg-emerald-100 border-emerald-200" },
    { id: "delivered", label: "اتسلّم", color: "bg-slate-100 border-slate-200" },
  ];

  function WaitBadge({ minutes }: { minutes?: number }) {
    if (!minutes && minutes !== 0) return null;
    const urgent = minutes > 15;
    const warn = minutes > 8;
    return (
      <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold ${urgent ? "bg-rose-100 text-rose-700" : warn ? "bg-amber-100 text-amber-700" : "bg-slate-100 text-slate-600"}`}>
        <Timer size={9} />
        {minutes}د
      </span>
    );
  }

  const ordersByStatus = useMemo(() => {
    const grouped: Record<string, BarOrder[]> = {
      new: [],
      in_preparation: [],
      ready: [],
      delivered: [],
    };
    ordersQuery.data?.data?.forEach((order) => {
      if (grouped[order.status]) {
        grouped[order.status].push(order);
      }
    });
    return grouped;
  }, [ordersQuery.data?.data]);

  const itemRows = items.map((item) => {
    const product = productsQuery.data?.data?.find((p) => p.id === item.productId);
    return [product?.name ?? item.productId, item.quantity];
  });

  return (
    <div className="space-y-5">
      <SectionTitle
        title="طلبات البار"
        subtitle="إدارة الطلبات عبر لوحة كانبان - اسحب الطلبات بين الحالات"
        icon={<Coffee size={20} />}
        action={
          <div className="flex items-center gap-2">
            <Link
              href="/dashboard/barista/pos"
              className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 transition hover:bg-slate-50"
            >
              <ArrowLeft size={12} /> نقطة البيع
            </Link>
            <button
              onClick={() => ordersQuery.refetch()}
              className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 transition hover:bg-slate-50"
            >
              <RefreshCw size={12} /> تحديث
            </button>
          </div>
        }
      />

      {message && (
        <div className={clsx("rounded-xl border px-4 py-3 text-sm", message.includes("بنجاح") || message.includes("اتسجل") ? "bg-emerald-50 border-emerald-200 text-emerald-800" : "bg-rose-50 border-rose-200 text-rose-800")}>
          {message}
        </div>
      )}

      {/* Kanban Board */}
      <div className="grid gap-4 lg:grid-cols-4 xl:grid-cols-4">
        {kanbanColumns.map((column) => (
          <div key={column.id} className={clsx("rounded-xl border p-4 min-h-[500px]", column.color)}>
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900">{column.label}</h3>
              <span className="rounded-full bg-white px-2 py-0.5 text-xs font-bold text-slate-700">
                {ordersByStatus[column.id]?.length || 0}
              </span>
            </div>
            
            <div className="space-y-2">
              {ordersByStatus[column.id]?.map((order) => {
                const urgent = (order.waitMinutes ?? 0) > 15;
                return (
                  <div key={order.id} className={`rounded-lg bg-white border border-slate-200 p-3 shadow-sm ${urgent ? "border-rose-200 bg-rose-50" : ""}`}>
                    <div className="mb-2 flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <p className="text-xs font-bold text-slate-900">#{order.id.slice(0, 6)}</p>
                        <p className="text-xs text-slate-600">{order.customer?.fullName || "ضيف"}</p>
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        <span className="text-xs font-bold text-slate-900">{money(order.totalAmount ?? 0)}</span>
                        <WaitBadge minutes={order.waitMinutes} />
                      </div>
                    </div>

                    <div className="mb-2 flex flex-wrap gap-1">
                      {order.items?.slice(0, 3).map((item, idx) => (
                        <span key={idx} className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] text-slate-700">
                          {item.product?.name} x{item.quantity}
                        </span>
                      ))}
                      {(order.items?.length ?? 0) > 3 && (
                        <span className="text-[10px] text-slate-400">+{order.items!.length - 3}</span>
                      )}
                    </div>

                  <div className="flex gap-1">
                    {column.id === "new" && (
                      <button
                        onClick={() => updateStatusMutation.mutate({ orderId: order.id, status: "in_preparation" })}
                        className="flex-1 rounded bg-amber-500 py-1 text-[10px] font-bold text-white hover:bg-amber-600"
                      >
                        بيتجهز
                      </button>
                    )}
                    {column.id === "in_preparation" && (
                      <button
                        onClick={() => updateStatusMutation.mutate({ orderId: order.id, status: "ready" })}
                        className="flex-1 rounded bg-emerald-600 py-1 text-[10px] font-bold text-white hover:bg-emerald-700"
                      >
                        جاهز
                      </button>
                    )}
                    {column.id === "ready" && (
                      <button
                        onClick={() => updateStatusMutation.mutate({ orderId: order.id, status: "delivered" })}
                        className="flex-1 rounded bg-blue-600 py-1 text-[10px] font-bold text-white hover:bg-blue-700"
                      >
                        تسليم
                      </button>
                    )}
                    <button
                      onClick={() => cancelMutation.mutate({ orderId: order.id, reason: "إلغاء من الكانبان" })}
                      className="rounded bg-rose-500 px-2 py-1 text-[10px] font-bold text-white hover:bg-rose-600"
                    >
                      <XCircle size={12} />
                    </button>
                  </div>
                </div>
              );
            })}
              
              {(!ordersByStatus[column.id] || ordersByStatus[column.id].length === 0) && (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <Clock size={24} className="mb-2 text-slate-300" />
                  <p className="text-xs text-slate-400">لا توجد طلبات</p>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Quick Create Form */}
      <Panel title="طلب سريع" icon={<Plus size={15} />}>
        <form className="grid gap-3 md:grid-cols-4" onSubmit={onCreateSubmit}>
          <select 
            value={sessionId} 
            onChange={(event) => setSessionId(event.target.value)} 
            className="rounded-lg border border-slate-300 px-3 py-2"
          >
            <option value="">بدون مدة</option>
            {sessionsQuery.data?.data?.map((session) => (
              <option key={session.id} value={session.id}>
                #{session.id.slice(0, 8)} - {session.customer?.fullName ?? session.customerId}
              </option>
            ))}
          </select>
          
          <select 
            value={newItemProductId} 
            onChange={(event) => setNewItemProductId(event.target.value)} 
            className="rounded-lg border border-slate-300 px-3 py-2"
          >
            <option value="">اختار منتج</option>
            {productsQuery.data?.data?.map((product) => (
              <option key={product.id} value={product.id}>
                {product.name} - {money(product.price)}
              </option>
            ))}
          </select>
          
          <input 
            type="number" 
            min={1} 
            value={newItemQuantity} 
            onChange={(event) => setNewItemQuantity(event.target.value)} 
            className="rounded-lg border border-slate-300 px-3 py-2"
            placeholder="الكمية"
          />
          
          <div className="flex gap-2">
            <button 
              type="button" 
              onClick={addItem} 
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium flex-1"
            >
              <Plus size={14} className="inline ml-1" /> إضافة
            </button>
            <button 
              type="submit" 
              className="rounded-lg bg-slate-900 px-3 py-2 text-sm font-semibold text-white flex-1"
              disabled={createMutation.isPending || items.length === 0}
            >
              {createMutation.isPending ? "جاري..." : "تسجيل"}
            </button>
          </div>
        </form>
        
        {items.length > 0 && (
          <div className="mt-3 rounded-lg bg-slate-50 p-3">
            <p className="text-xs font-semibold text-slate-700 mb-2">العناصر في الطلب:</p>
            <div className="flex flex-wrap gap-2">
              {items.map((item, idx) => {
                const product = productsQuery.data?.data?.find((p) => p.id === item.productId);
                return (
                  <span key={idx} className="inline-flex items-center gap-1 rounded-full bg-white px-2 py-1 text-xs border border-slate-200">
                    {product?.name || item.productId} x{item.quantity}
                    <button 
                      onClick={() => setItems(items.filter((_, i) => i !== idx))}
                      className="text-rose-500 hover:text-rose-700"
                    >
                      <Trash2 size={10} />
                    </button>
                  </span>
                );
              })}
            </div>
          </div>
        )}
      </Panel>
    </div>
  );
}
