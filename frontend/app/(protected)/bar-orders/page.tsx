"use client";

import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Coffee, Clock, CheckCircle2, XCircle, RefreshCw, ArrowLeft, Timer } from "lucide-react";
import Link from "next/link";
import { api } from "../../../lib/api";
import { dateTime, money } from "../../../lib/format";
import { translateStatus } from "../../../lib/labels";
import type { BarOrder, Paginated } from "../../../lib/types";
import { Panel, SectionTitle, Badge } from "../../../components/ui";
import { useAuthStore } from "../../../store/auth-store";
import clsx from "clsx";

type OrdersTab = "active" | "completed";

export default function BarOrdersPage() {
  const queryClient = useQueryClient();
  const currentUser = useAuthStore((s) => s.user);
  const isOpsManager = currentUser?.role?.name === "Operations Manager";

  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [ordersTab, setOrdersTab] = useState<OrdersTab>("active");
  const [message, setMessage] = useState<string | null>(null);

  const ordersQuery = useQuery({
    queryKey: ["bar-orders", "kanban"],
    queryFn: async () => {
      const response = await api.get("/bar-orders", {
        params: { page: 1, limit: 100, status: "new,in_preparation,ready,delivered,cancelled" },
      });
      return response.data.data as Paginated<BarOrder>;
    },
    refetchInterval: 30000,
  });

  const selectedOrderQuery = useQuery({
    queryKey: ["bar-orders", selectedOrderId],
    enabled: Boolean(selectedOrderId),
    queryFn: async () => {
      const response = await api.get(`/bar-orders/${selectedOrderId}`);
      return response.data.data as BarOrder;
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
  });

  const kanbanColumns = [
    { id: "new", label: "جديد", color: "bg-blue-100 border-blue-200" },
    { id: "in_preparation", label: "بيتجهز", color: "bg-amber-100 border-amber-200" },
    { id: "ready", label: "جاهز", color: "bg-emerald-100 border-emerald-200" },
    { id: "delivered", label: "اتسلّم", color: "bg-slate-100 border-slate-200" },
  ];
  const activeKanbanColumns = kanbanColumns.filter((column) => column.id !== "delivered");

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
  const completedOrders = useMemo(
    () => (ordersQuery.data?.data ?? []).filter((order) => order.status === "delivered" || order.status === "cancelled"),
    [ordersQuery.data?.data],
  );

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

      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => {
            setOrdersTab("active");
            setSelectedOrderId(null);
          }}
          className={clsx(
            "rounded-xl border px-3 py-1.5 text-xs font-semibold transition",
            ordersTab === "active" ? "border-slate-900 bg-slate-900 text-white" : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50",
          )}
        >
          قيد التنفيذ ({(ordersByStatus.new?.length ?? 0) + (ordersByStatus.in_preparation?.length ?? 0) + (ordersByStatus.ready?.length ?? 0)})
        </button>
        <button
          type="button"
          onClick={() => {
            setOrdersTab("completed");
            setSelectedOrderId(null);
          }}
          className={clsx(
            "rounded-xl border px-3 py-1.5 text-xs font-semibold transition",
            ordersTab === "completed" ? "border-slate-900 bg-slate-900 text-white" : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50",
          )}
        >
          الطلبات المنتهية ({completedOrders.length})
        </button>
      </div>

      {/* Kanban + Details */}
      <div className="grid gap-4 xl:grid-cols-[1fr_360px]">
        <div>
          {ordersTab === "active" ? (
            <div className="grid gap-4 lg:grid-cols-3 xl:grid-cols-3">
              {activeKanbanColumns.map((column) => (
                <div key={column.id} className={clsx("rounded-xl border p-4 min-h-[340px] max-h-[520px]", column.color)}>
                  <div className="mb-3 flex items-center justify-between">
                    <h3 className="text-sm font-bold text-slate-900">{column.label}</h3>
                    <span className="rounded-full bg-white px-2 py-0.5 text-xs font-bold text-slate-700">
                      {ordersByStatus[column.id]?.length || 0}
                    </span>
                  </div>

                  <div className="space-y-2 max-h-[430px] overflow-y-auto pr-1">
                    {ordersByStatus[column.id]?.map((order) => {
                      const urgent = (order.waitMinutes ?? 0) > 15;
                      return (
                        <div
                          key={order.id}
                          onClick={() => setSelectedOrderId(order.id)}
                          className={clsx(
                            "cursor-pointer rounded-lg border bg-white p-3 shadow-sm transition hover:border-slate-400 hover:shadow",
                            urgent ? "border-rose-200 bg-rose-50" : "border-slate-200",
                            selectedOrderId === order.id && "border-slate-400 ring-2 ring-slate-900/15",
                          )}
                        >
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

                          {!isOpsManager ? (
                            <div className="flex gap-1">
                              {column.id === "new" && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    updateStatusMutation.mutate({ orderId: order.id, status: "in_preparation" });
                                  }}
                                  className="flex-1 rounded bg-amber-500 py-1 text-[10px] font-bold text-white hover:bg-amber-600"
                                >
                                  بيتجهز
                                </button>
                              )}
                              {column.id === "in_preparation" && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    updateStatusMutation.mutate({ orderId: order.id, status: "ready" });
                                  }}
                                  className="flex-1 rounded bg-emerald-600 py-1 text-[10px] font-bold text-white hover:bg-emerald-700"
                                >
                                  جاهز
                                </button>
                              )}
                              {column.id === "ready" && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    updateStatusMutation.mutate({ orderId: order.id, status: "delivered" });
                                  }}
                                  className="flex-1 rounded bg-blue-600 py-1 text-[10px] font-bold text-white hover:bg-blue-700"
                                >
                                  تسليم
                                </button>
                              )}
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  cancelMutation.mutate({ orderId: order.id, reason: "إلغاء من الكانبان" });
                                }}
                                className="rounded bg-rose-500 px-2 py-1 text-[10px] font-bold text-white hover:bg-rose-600"
                              >
                                <XCircle size={12} />
                              </button>
                            </div>
                          ) : (
                            <p className="text-[10px] font-medium text-slate-500">عرض فقط - بدون تعديل حالة</p>
                          )}
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
          ) : (
            <Panel title="الطلبات المنتهية" icon={<CheckCircle2 size={15} />}>
              {completedOrders.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <Clock size={24} className="mb-2 text-slate-300" />
                  <p className="text-xs text-slate-400">لا توجد طلبات منتهية</p>
                </div>
              ) : (
                <div className="space-y-2 max-h-[520px] overflow-y-auto pr-1">
                  {completedOrders.map((order) => (
                    <button
                      key={order.id}
                      type="button"
                      onClick={() => setSelectedOrderId(order.id)}
                      className={clsx(
                        "w-full rounded-lg border border-slate-200 bg-white p-3 text-right shadow-sm transition hover:border-slate-400 hover:shadow",
                        selectedOrderId === order.id && "border-slate-400 ring-2 ring-slate-900/15",
                      )}
                    >
                      <div className="mb-2 flex items-start justify-between gap-2">
                        <div className="flex-1">
                          <p className="text-xs font-bold text-slate-900">#{order.id.slice(0, 6)}</p>
                          <p className="text-xs text-slate-600">{order.customer?.fullName || "ضيف"}</p>
                        </div>
                        <div className="flex flex-col items-end gap-1">
                          <Badge tone={order.status === "delivered" ? "success" : "danger"}>{translateStatus(order.status)}</Badge>
                          <span className="text-xs font-bold text-slate-900">{money(order.totalAmount ?? 0)}</span>
                        </div>
                      </div>
                      <p className="text-[11px] text-slate-500">{dateTime(order.createdAt)}</p>
                    </button>
                  ))}
                </div>
              )}
            </Panel>
          )}
        </div>

        <div className="hidden xl:block">
          <div className="sticky top-4">
            <Panel title={ordersTab === "completed" ? "تفاصيل الطلب المنتهي" : "تفاصيل الطلب"} icon={<Coffee size={15} />}>
              {!selectedOrderId ? (
                <div className="py-10 text-center">
                  <Clock size={24} className="mx-auto mb-2 text-slate-300" />
                  <p className="text-xs text-slate-500">اختار طلب علشان تشوف تفاصيله</p>
                </div>
              ) : selectedOrderQuery.isLoading ? (
                <div className="py-10 text-center">
                  <RefreshCw size={18} className="mx-auto mb-2 animate-spin text-slate-400" />
                  <p className="text-xs text-slate-500">جاري تحميل التفاصيل...</p>
                </div>
              ) : selectedOrderQuery.data ? (
                <div className="space-y-3 text-sm">
                  <div className="grid gap-2">
                    <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
                      <p className="text-[11px] text-slate-500">العميل</p>
                      <p className="font-semibold text-slate-900">{selectedOrderQuery.data.customer?.fullName ?? "ضيف"}</p>
                    </div>
                    <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
                      <p className="text-[11px] text-slate-500">الحالة</p>
                      <Badge tone={selectedOrderQuery.data.status === "delivered" ? "success" : selectedOrderQuery.data.status === "cancelled" ? "danger" : "info"}>
                        {translateStatus(selectedOrderQuery.data.status)}
                      </Badge>
                    </div>
                    <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
                      <p className="text-[11px] text-slate-500">الإجمالي</p>
                      <p className="font-semibold text-slate-900">{money(selectedOrderQuery.data.totalAmount ?? 0)}</p>
                    </div>
                    <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
                      <p className="text-[11px] text-slate-500">تاريخ الطلب</p>
                      <p className="text-slate-700">{dateTime(selectedOrderQuery.data.createdAt)}</p>
                    </div>
                  </div>

                  <div className="rounded-lg border border-slate-200">
                    <div className="border-b border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-600">الأصناف</div>
                    <div className="space-y-2 p-3">
                      {(selectedOrderQuery.data.items ?? []).map((item) => (
                        <div key={item.id} className="flex items-center justify-between">
                          <span className="text-slate-900">{item.product?.name ?? "منتج"}</span>
                          <span className="text-xs text-slate-500">x{item.quantity}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {selectedOrderQuery.data.notes ? (
                    <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
                      <p className="mb-1 font-semibold">ملاحظات</p>
                      <p>{selectedOrderQuery.data.notes}</p>
                    </div>
                  ) : null}
                </div>
              ) : (
                <p className="text-xs text-slate-500">مفيش تفاصيل متاحة للطلب ده.</p>
              )}
            </Panel>
          </div>
        </div>
      </div>

    </div>
  );
}
