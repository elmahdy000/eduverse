"use client";

import { useMemo, useState, useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Coffee, Clock, CheckCircle2, XCircle, RefreshCw, ArrowRight, Timer } from "lucide-react";
import Link from "next/link";
import { io, Socket } from "socket.io-client";
import { api } from "../../../lib/api";
import { idShort, money, dateTime } from "../../../lib/format";
import { translateStatus } from "../../../lib/labels";
import type { BarOrder, Paginated } from "../../../lib/types";
import { Panel, SectionTitle, Badge, Alert, Modal, CardSkeleton } from "../../../components/ui";
import { useAuthStore } from "../../../store/auth-store";
import clsx from "clsx";

type OrdersTab = "active" | "completed";

/* ── WaitBadge ── */
function WaitBadge({ minutes }: { minutes?: number }) {
  if (!minutes && minutes !== 0) return null;
  const urgent = minutes > 15;
  const warn = minutes > 8;
  return (
    <span
      className={clsx(
        "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold",
        urgent
          ? "bg-rose-100 text-rose-700"
          : warn
          ? "bg-amber-100 text-amber-700"
          : "bg-slate-100 text-slate-600",
      )}
    >
      <Timer size={9} />
      {minutes}د
    </span>
  );
}

/* ── KanbanSkeleton ── */
function KanbanSkeleton() {
  return (
    <div className="grid gap-4 lg:grid-cols-3 xl:grid-cols-3">
      {[1, 2, 3].map((col) => (
        <div key={col} className="rounded-xl border border-slate-200 bg-slate-50 p-4 min-h-[340px]">
          <div className="mb-4 h-5 w-20 rounded bg-slate-200 animate-pulse" />
          <div className="space-y-3">
            {[1, 2, 3].map((row) => (
              <CardSkeleton key={row} />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

export default function BarOrdersPage() {
  const queryClient = useQueryClient();
  const currentUser = useAuthStore((s) => s.user);
  const isOpsManager = currentUser?.role?.name === "Operations Manager";

  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [ordersTab, setOrdersTab] = useState<OrdersTab>("active");
  const [message, setMessage] = useState<{ text: string; ok: boolean } | null>(null);
  const [cancelConfirm, setCancelConfirm] = useState<{ orderId: string; orderRef: string } | null>(null);
  const [cancelReason, setCancelReason] = useState("");

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

  // Real-time updates via Socket.IO
  useEffect(() => {
    // نفس منطق lib/api.ts: الباك اند على 3001، ونشيل /api لو موجود
    const rawBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
    const socketBase = rawBase.replace(/\/api\/?$/, '');
    const socket: Socket = io(`${socketBase}/bar-orders`, { auth: { token: useAuthStore.getState().accessToken } });

    const handleOrderUpdate = () => {
      queryClient.invalidateQueries({ queryKey: ["bar-orders"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard", "barista"] });
    };

    socket.on("order:new", handleOrderUpdate);
    socket.on("order:status-updated", handleOrderUpdate);
    socket.on("dashboard:refresh", handleOrderUpdate);

    return () => {
      socket.off("order:new", handleOrderUpdate);
      socket.off("order:status-updated", handleOrderUpdate);
      socket.off("dashboard:refresh", handleOrderUpdate);
      socket.disconnect();
    };
  }, [queryClient]);

  const updateStatusMutation = useMutation({
    mutationFn: async ({ orderId, status }: { orderId: string; status: string }) => {
      await api.put(`/bar-orders/${orderId}/status`, { status });
    },
    onSuccess: () => {
      setMessage({ text: "تم تغيير حالة الطلب بنجاح.", ok: true });
      queryClient.invalidateQueries({ queryKey: ["bar-orders"] });
      if (selectedOrderId) queryClient.invalidateQueries({ queryKey: ["bar-orders", selectedOrderId] });
      queryClient.invalidateQueries({ queryKey: ["dashboard", "barista"] });
    },
    onError: (err: unknown) => {
      const m = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setMessage({ text: m ?? "فشل تغيير الحالة، حاول تاني.", ok: false });
    },
  });

  const cancelMutation = useMutation({
    mutationFn: async ({ orderId, reason }: { orderId: string; reason?: string }) => {
      await api.put(`/bar-orders/${orderId}/cancel`, { reason });
    },
    onSuccess: () => {
      setMessage({ text: "تم إلغاء الطلب.", ok: true });
      setCancelConfirm(null);
      setCancelReason("");
      queryClient.invalidateQueries({ queryKey: ["bar-orders"] });
      if (selectedOrderId) queryClient.invalidateQueries({ queryKey: ["bar-orders", selectedOrderId] });
      queryClient.invalidateQueries({ queryKey: ["dashboard", "barista"] });
    },
    onError: (err: unknown) => {
      const m = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setMessage({ text: m ?? "فشل إلغاء الطلب، حاول تاني.", ok: false });
      setCancelConfirm(null);
      setCancelReason("");
    },
  });

  const kanbanColumns = [
    { id: "new", label: "جديد" },
    { id: "in_preparation", label: "بيتجهز" },
    { id: "ready", label: "جاهز" },
    { id: "delivered", label: "اتسلّم" },
  ];
  const activeKanbanColumns = kanbanColumns.filter((column) => column.id !== "delivered");

  function columnColorClass(columnId: string) {
    if (columnId === "new") return "bg-blue-100 border-blue-200";
    if (columnId === "in_preparation") return "bg-amber-100 border-amber-200";
    if (columnId === "ready") return "bg-emerald-100 border-emerald-200";
    return "bg-slate-100 border-slate-200";
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
    <div className="space-y-5" dir="rtl">
      <SectionTitle
        title="طلبات البار"
        subtitle="إدارة الطلبات عبر لوحة كانبان - اسحب الطلبات بين الحالات"
        icon={<Coffee size={20} />}
        action={
          <div className="flex items-center gap-2">
            <Link
              href="/dashboard/barista/pos"
              className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 transition hover:bg-slate-50"
              aria-label="العودة إلى نقطة البيع"
            >
              <ArrowRight size={12} /> نقطة البيع
            </Link>
            <button
              onClick={() => ordersQuery.refetch()}
              className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 transition hover:bg-slate-50"
              aria-label="تحديث طلبات البار"
            >
              <RefreshCw size={12} /> تحديث
            </button>
          </div>
        }
      />

      {ordersQuery.isError && (
        <Alert tone="danger">حصل خطأ في تحميل طلبات البار. جرّب زر التحديث.</Alert>
      )}

      {message && (
        <Alert tone={message.ok ? "success" : "danger"}>{message.text}</Alert>
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
            ordersQuery.isPending ? (
              <KanbanSkeleton />
            ) : (
              <div className="grid gap-4 lg:grid-cols-3 xl:grid-cols-3">
                {activeKanbanColumns.map((column) => (
                  <div key={column.id} className={clsx("rounded-xl border p-4 min-h-[340px] max-h-[520px]", columnColorClass(column.id))}>
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
                          <button
                            key={order.id}
                            type="button"
                            onClick={() => setSelectedOrderId(order.id)}
                            aria-label={`عرض تفاصيل الطلب ${idShort(order.id)}`}
                            className={clsx(
                              "w-full cursor-pointer rounded-lg border bg-white p-3 text-right shadow-sm transition hover:border-slate-400 hover:shadow",
                              urgent ? "border-rose-200 bg-rose-50" : "border-slate-200",
                              selectedOrderId === order.id && "border-slate-400 ring-2 ring-slate-900/15",
                            )}
                          >
                            <div className="mb-2 flex items-start justify-between gap-2">
                              <div className="flex-1">
                                <p className="text-xs font-bold text-slate-900">
                                  #<span className="ltr-value font-mono">{idShort(order.id)}</span>
                                </p>
                                <p className="text-xs text-slate-600">{order.customer?.fullName || "ضيف"}</p>
                              </div>
                              <div className="flex flex-col items-end gap-1">
                                <span className="ltr-value text-xs font-bold text-slate-900">{money(order.totalAmount ?? 0)}</span>
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
                              <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
                                {column.id === "new" && (
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      updateStatusMutation.mutate({ orderId: order.id, status: "in_preparation" });
                                    }}
                                    disabled={updateStatusMutation.isPending}
                                    aria-label="تحويل الطلب إلى قيد التجهيز"
                                    className="flex-1 rounded bg-amber-500 py-1 text-[10px] font-bold text-white hover:bg-amber-600 disabled:opacity-50"
                                  >
                                    بيتجهز
                                  </button>
                                )}
                                {column.id === "in_preparation" && (
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      updateStatusMutation.mutate({ orderId: order.id, status: "ready" });
                                    }}
                                    disabled={updateStatusMutation.isPending}
                                    aria-label="تحويل الطلب إلى جاهز"
                                    className="flex-1 rounded bg-emerald-600 py-1 text-[10px] font-bold text-white hover:bg-emerald-700 disabled:opacity-50"
                                  >
                                    جاهز
                                  </button>
                                )}
                                {column.id === "ready" && (
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      updateStatusMutation.mutate({ orderId: order.id, status: "delivered" });
                                    }}
                                    disabled={updateStatusMutation.isPending}
                                    aria-label="تأكيد تسليم الطلب"
                                    className="flex-1 rounded bg-blue-600 py-1 text-[10px] font-bold text-white hover:bg-blue-700 disabled:opacity-50"
                                  >
                                    تسليم
                                  </button>
                                )}
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setCancelReason("");
                                    setCancelConfirm({ orderId: order.id, orderRef: idShort(order.id) });
                                  }}
                                  disabled={cancelMutation.isPending}
                                  aria-label="إلغاء الطلب"
                                  className="rounded bg-rose-500 px-2 py-1 text-[10px] font-bold text-white hover:bg-rose-600 disabled:opacity-50"
                                >
                                  <XCircle size={12} />
                                </button>
                              </div>
                            ) : (
                              <p className="text-[10px] font-medium text-slate-500">عرض فقط</p>
                            )}
                          </button>
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
            )
          ) : (
            <Panel title="الطلبات المنتهية" icon={<CheckCircle2 size={15} />}>
              {ordersQuery.isPending ? (
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <CardSkeleton key={i} />
                  ))}
                </div>
              ) : completedOrders.length === 0 ? (
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
                      aria-label={`عرض تفاصيل الطلب المنتهي ${idShort(order.id)}`}
                      className={clsx(
                        "w-full rounded-lg border border-slate-200 bg-white p-3 text-right shadow-sm transition hover:border-slate-400 hover:shadow",
                        selectedOrderId === order.id && "border-slate-400 ring-2 ring-slate-900/15",
                      )}
                    >
                      <div className="mb-2 flex items-start justify-between gap-2">
                        <div className="flex-1">
                          <p className="text-xs font-bold text-slate-900">
                            #<span className="ltr-value font-mono">{idShort(order.id)}</span>
                          </p>
                          <p className="text-xs text-slate-600">{order.customer?.fullName || "ضيف"}</p>
                        </div>
                        <div className="flex flex-col items-end gap-1">
                          <Badge tone={order.status === "delivered" ? "success" : "danger"}>{translateStatus(order.status)}</Badge>
                          <span className="ltr-value text-xs font-bold text-slate-900">{money(order.totalAmount ?? 0)}</span>
                        </div>
                      </div>
                      <p className="ltr-value text-[11px] text-slate-500">{dateTime(order.createdAt)}</p>
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
              ) : selectedOrderQuery.isPending ? (
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <CardSkeleton key={i} />
                  ))}
                </div>
              ) : selectedOrderQuery.isError ? (
                <Alert tone="danger">تعذّر تحميل تفاصيل الطلب. جرّب مرة أخرى.</Alert>
              ) : selectedOrderQuery.data ? (
                <div className="space-y-3 text-sm">
                  <div className="grid gap-2">
                    <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
                      <p className="text-[11px] text-slate-500">رقم الطلب</p>
                      <p className="font-semibold text-slate-900">
                        #<span className="ltr-value font-mono">{idShort(selectedOrderQuery.data.id)}</span>
                      </p>
                    </div>
                    <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
                      <p className="text-[11px] text-slate-500">العميل</p>
                      <p className="font-semibold text-slate-900">{selectedOrderQuery.data.customer?.fullName ?? "ضيف"}</p>
                    </div>
                    <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
                      <p className="text-[11px] text-slate-500">الحالة</p>
                      <Badge
                        tone={
                          selectedOrderQuery.data.status === "delivered"
                            ? "success"
                            : selectedOrderQuery.data.status === "cancelled"
                            ? "danger"
                            : "info"
                        }
                      >
                        {translateStatus(selectedOrderQuery.data.status)}
                      </Badge>
                    </div>
                    <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
                      <p className="text-[11px] text-slate-500">الإجمالي</p>
                      <p className="ltr-value font-semibold text-slate-900">{money(selectedOrderQuery.data.totalAmount ?? 0)}</p>
                    </div>
                    <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
                      <p className="text-[11px] text-slate-500">وقت الطلب</p>
                      <p className="ltr-value font-semibold text-slate-900">{dateTime(selectedOrderQuery.data.createdAt)}</p>
                    </div>

                    {/* Items list */}
                    {selectedOrderQuery.data.items && selectedOrderQuery.data.items.length > 0 && (
                      <div>
                        <p className="mb-2 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                          العناصر ({selectedOrderQuery.data.items.length})
                        </p>
                        <div className="space-y-1.5">
                          {selectedOrderQuery.data.items.map((item, idx) => (
                            <div key={idx} className="flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
                              <span className="ltr-value font-bold text-emerald-700">{money(Number(item.unitPrice ?? 0) * Number(item.quantity || 0))}</span>
                              <div className="text-right">
                                <span className="text-sm font-semibold text-slate-800">{item.product?.name}</span>
                                <span className="mr-1.5 text-xs text-slate-400">x{item.quantity}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Action buttons for non-ops manager */}
                    {!isOpsManager && selectedOrderQuery.data.status !== "delivered" && selectedOrderQuery.data.status !== "cancelled" && (
                      <div className="flex flex-col gap-2 border-t border-slate-100 pt-3">
                        {selectedOrderQuery.data.status === "new" && (
                          <button
                            type="button"
                            onClick={() => updateStatusMutation.mutate({ orderId: selectedOrderQuery.data!.id, status: "in_preparation" })}
                            disabled={updateStatusMutation.isPending}
                            className="w-full rounded-xl bg-amber-500 py-2 text-sm font-bold text-white hover:bg-amber-600 disabled:opacity-50 transition"
                          >
                            بدء التجهيز
                          </button>
                        )}
                        {selectedOrderQuery.data.status === "in_preparation" && (
                          <button
                            type="button"
                            onClick={() => updateStatusMutation.mutate({ orderId: selectedOrderQuery.data!.id, status: "ready" })}
                            disabled={updateStatusMutation.isPending}
                            className="w-full rounded-xl bg-emerald-600 py-2 text-sm font-bold text-white hover:bg-emerald-700 disabled:opacity-50 transition"
                          >
                            جاهز للتسليم
                          </button>
                        )}
                        {selectedOrderQuery.data.status === "ready" && (
                          <button
                            type="button"
                            onClick={() => updateStatusMutation.mutate({ orderId: selectedOrderQuery.data!.id, status: "delivered" })}
                            disabled={updateStatusMutation.isPending}
                            className="w-full rounded-xl bg-blue-600 py-2 text-sm font-bold text-white hover:bg-blue-700 disabled:opacity-50 transition"
                          >
                            تأكيد التسليم
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => {
                            setCancelReason("");
                            setCancelConfirm({ orderId: selectedOrderQuery.data!.id, orderRef: idShort(selectedOrderQuery.data!.id) });
                          }}
                          disabled={cancelMutation.isPending}
                          className="w-full rounded-xl border border-rose-200 bg-rose-50 py-2 text-sm font-bold text-rose-700 hover:bg-rose-100 disabled:opacity-50 transition"
                        >
                          إلغاء الطلب
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ) : null}
            </Panel>
          </div>
        </div>
      </div>

      {/* Cancel Modal */}
      <Modal
        isOpen={Boolean(cancelConfirm)}
        onClose={() => {
          setCancelConfirm(null);
          setCancelReason("");
        }}
        title="تأكيد الإلغاء"
        size="sm"
      >
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-rose-100 text-rose-600">
              <XCircle size={18} />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-900">
                إلغاء الطلب #<span className="ltr-value font-mono">{cancelConfirm?.orderRef}</span>
              </p>
              <p className="text-xs text-slate-500">الإجراء ده مش قابل للتراجع.</p>
            </div>
          </div>

          <p className="text-sm text-slate-700">
            هل أنت متأكد إنك عايز تلغي الطلب{" "}
            <span className="font-bold">#<span className="ltr-value font-mono">{cancelConfirm?.orderRef}</span></span>؟
          </p>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-slate-600 uppercase tracking-wide">سبب الإلغاء (اختياري)</label>
            <textarea
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              placeholder="اكتب سبب الإلغاء هنا..."
              rows={3}
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-right text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/15 hover:border-slate-300 resize-none"
            />
          </div>

          <div className="flex gap-3 pt-1">
            <button
              type="button"
              onClick={() =>
                cancelMutation.mutate({
                  orderId: cancelConfirm!.orderId,
                  reason: cancelReason.trim() || undefined,
                })
              }
              disabled={cancelMutation.isPending}
              className="flex-1 rounded-xl bg-rose-600 py-2.5 text-sm font-bold text-white hover:bg-rose-700 disabled:opacity-50 transition"
            >
              {cancelMutation.isPending ? "جاري الإلغاء..." : "نعم، إلغاء الطلب"}
            </button>
            <button
              type="button"
              onClick={() => {
                setCancelConfirm(null);
                setCancelReason("");
              }}
              className="flex-1 rounded-xl border border-slate-200 bg-white py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50 transition"
            >
              لأ، رجوع
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
