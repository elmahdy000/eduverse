"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  ClipboardList, RefreshCw, X, Search, User, Calendar,
  ChevronLeft, ChevronRight, ShieldCheck, Eye,
} from "lucide-react";
import { api } from "../../../lib/api";
import { dateTime } from "../../../lib/format";
import type { Paginated } from "../../../lib/types";
import { Badge, EmptyState, Panel, SectionTitle, Select, Spinner, Input } from "../../../components/ui";

interface AuditLogRecord {
  id: string;
  action: string;
  entityType: string;
  entityId?: string | null;
  userId: string;
  timestamp: string;
  ipAddress?: string | null;
  oldValue?: unknown;
  newValue?: unknown;
  user?: {
    email?: string | null;
    firstName?: string | null;
    lastName?: string | null;
  } | null;
}

const ENTITY_TYPES = [
  { value: "booking",        label: "حجز" },
  { value: "session",        label: "جلسة" },
  { value: "customer",       label: "عميل" },
  { value: "room",           label: "غرفة" },
  { value: "product",        label: "منتج" },
  { value: "bar_order",      label: "طلب بار" },
  { value: "invoice",        label: "فاتورة" },
  { value: "payment",        label: "دفع" },
  { value: "expense",        label: "مصروف" },
  { value: "inventory_item", label: "مخزون" },
  { value: "user",           label: "مستخدم" },
  { value: "shift",          label: "وردية" },
];

const ACTIONS = [
  { value: "POST /bookings",          label: "إنشاء حجز" },
  { value: "POST /sessions",          label: "فتح جلسة" },
  { value: "POST /sessions/:id/close", label: "إغلاق جلسة" },
  { value: "POST /customers",         label: "إضافة عميل" },
  { value: "PATCH /customers/:id",    label: "تعديل عميل" },
  { value: "POST /bar-orders",        label: "طلب بار جديد" },
  { value: "PUT /bar-orders/:id/status", label: "تحديث حالة طلب" },
  { value: "POST /payments",          label: "تحصيل دفعة" },
  { value: "POST /expenses",          label: "إضافة مصروف" },
  { value: "ADD_STOCK",               label: "إضافة مخزون" },
  { value: "RECORD_WASTE",            label: "تسجيل هالك" },
  { value: "AUTO_DEDUCT_STOCK",       label: "خصم تلقائي مخزون" },
  { value: "POST /shifts/start",      label: "بداية وردية" },
  { value: "PUT /shifts/:id/close",   label: "إغلاق وردية" },
  { value: "POST /users",             label: "إضافة مستخدم" },
];

function actionTone(action: string): "success" | "danger" | "warn" | "info" | "default" {
  if (action.startsWith("DELETE") || action.includes("cancel") || action.includes("WASTE"))
    return "danger";
  if (action.startsWith("PUT") || action.startsWith("PATCH")) return "warn";
  if (action.startsWith("POST")) return "success";
  return "info";
}

function actionLabel(action: string) {
  return ACTIONS.find((a) => a.value === action)?.label ?? action;
}

function entityLabel(type: string) {
  return ENTITY_TYPES.find((e) => e.value === type)?.label ?? type;
}

function userName(user?: AuditLogRecord["user"]) {
  if (!user) return "مجهول";
  const name = [user.firstName, user.lastName].filter(Boolean).join(" ");
  return name || user.email || "مجهول";
}

function JsonViewer({ value, label }: { value: unknown; label: string }) {
  if (value === null || value === undefined) return null;
  let text: string;
  try { text = JSON.stringify(value, null, 2); } catch { text = String(value); }
  return (
    <div>
      <p className="mb-1 text-xs font-bold uppercase tracking-wider text-slate-500">{label}</p>
      <pre className="max-h-48 overflow-auto rounded-xl bg-slate-900 p-3 text-[11px] text-emerald-300 leading-relaxed">
        {text}
      </pre>
    </div>
  );
}

const PAGE_SIZE = 50;

export default function AuditLogsPage() {
  const [entityTypeFilter, setEntityTypeFilter] = useState("");
  const [actionFilter, setActionFilter] = useState("");
  const [searchText, setSearchText] = useState("");
  const [page, setPage] = useState(1);
  const [selectedLog, setSelectedLog] = useState<AuditLogRecord | null>(null);

  const logsQuery = useQuery({
    queryKey: ["audit-logs", entityTypeFilter, actionFilter, page],
    queryFn: async () => {
      const response = await api.get("/audit-logs", {
        params: {
          page,
          limit: PAGE_SIZE,
          entityType: entityTypeFilter || undefined,
          action: actionFilter || undefined,
        },
      });
      return response.data.data as Paginated<AuditLogRecord>;
    },
    staleTime: 30000,
  });

  const logs = logsQuery.data?.data ?? [];
  const total = logsQuery.data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const filtered = searchText.trim()
    ? logs.filter((l) => {
        const q = searchText.toLowerCase();
        return (
          actionLabel(l.action).includes(q) ||
          entityLabel(l.entityType).includes(q) ||
          userName(l.user).toLowerCase().includes(q) ||
          (l.entityId ?? "").toLowerCase().includes(q)
        );
      })
    : logs;

  const resetFilters = () => {
    setEntityTypeFilter("");
    setActionFilter("");
    setSearchText("");
    setPage(1);
  };

  const hasFilters = entityTypeFilter || actionFilter || searchText;

  return (
    <div className="space-y-5" dir="rtl">
      <SectionTitle
        title="سجل العمليات"
        subtitle={`${total.toLocaleString("ar")} عملية مسجلة — متابعة كاملة لكل التعديلات في النظام.`}
        icon={<ShieldCheck size={20} />}
        action={
          <button
            onClick={() => logsQuery.refetch()}
            className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition"
          >
            <RefreshCw size={12} className={logsQuery.isFetching ? "animate-spin" : ""} />
            تحديث
          </button>
        }
      />

      {/* Filters */}
      <Panel icon={<Search size={14} />} title="البحث والفلتر">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <label className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-slate-500">
              نوع الكيان
            </label>
            <Select
              value={entityTypeFilter}
              onChange={(e) => { setEntityTypeFilter(e.target.value); setPage(1); }}
            >
              <option value="">كل الكيانات</option>
              {ENTITY_TYPES.map((e) => (
                <option key={e.value} value={e.value}>{e.label}</option>
              ))}
            </Select>
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-slate-500">
              نوع العملية
            </label>
            <Select
              value={actionFilter}
              onChange={(e) => { setActionFilter(e.target.value); setPage(1); }}
            >
              <option value="">كل العمليات</option>
              {ACTIONS.map((a) => (
                <option key={a.value} value={a.value}>{a.label}</option>
              ))}
            </Select>
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-slate-500">
              بحث سريع
            </label>
            <Input
              placeholder="اسم المستخدم، ID..."
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              icon={<Search size={13} />}
            />
          </div>

          <div className="flex items-end">
            {hasFilters && (
              <button
                onClick={resetFilters}
                className="flex w-full items-center justify-center gap-1.5 rounded-xl border border-slate-200 px-3 py-2.5 text-sm font-semibold text-slate-500 hover:border-rose-200 hover:bg-rose-50 hover:text-rose-600 transition"
              >
                <X size={13} />
                مسح الفلاتر
              </button>
            )}
          </div>
        </div>
      </Panel>

      {/* Table */}
      <Panel>
        {logsQuery.isLoading ? (
          <div className="flex items-center justify-center gap-2 py-16 text-slate-400">
            <Spinner size={20} /> جاري التحميل...
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={<ClipboardList size={32} />}
            title="لا توجد سجلات"
            sub="جرّب تغيير الفلاتر أو البحث بكلمات مختلفة"
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-right text-sm">
              <thead className="border-b border-slate-100 bg-slate-50">
                <tr>
                  <th className="px-4 py-3 text-xs font-black uppercase tracking-wider text-slate-500">التوقيت</th>
                  <th className="px-4 py-3 text-xs font-black uppercase tracking-wider text-slate-500">العملية</th>
                  <th className="px-4 py-3 text-xs font-black uppercase tracking-wider text-slate-500">الكيان</th>
                  <th className="px-4 py-3 text-xs font-black uppercase tracking-wider text-slate-500">المستخدم</th>
                  <th className="px-4 py-3 text-xs font-black uppercase tracking-wider text-slate-500">IP</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((log) => (
                  <tr
                    key={log.id}
                    className="transition-colors hover:bg-amber-50/40 cursor-pointer"
                    onClick={() => setSelectedLog(log)}
                  >
                    <td className="whitespace-nowrap px-4 py-3">
                      <div className="flex items-center gap-1.5 text-slate-500">
                        <Calendar size={12} className="shrink-0" />
                        <span className="text-xs">{dateTime(log.timestamp)}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <Badge tone={actionTone(log.action)} dot>
                        {actionLabel(log.action)}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-col gap-0.5">
                        <span className="font-semibold text-slate-800">{entityLabel(log.entityType)}</span>
                        {log.entityId && (
                          <span className="font-mono text-[10px] text-slate-400">
                            {log.entityId.slice(0, 8)}…
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5 text-slate-700">
                        <User size={12} className="shrink-0 text-slate-400" />
                        <span className="text-sm font-medium">{userName(log.user)}</span>
                      </div>
                      {log.user?.email && (
                        <p className="text-[10px] text-slate-400">{log.user.email}</p>
                      )}
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-slate-400">
                      {log.ipAddress ?? "—"}
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={(e) => { e.stopPropagation(); setSelectedLog(log); }}
                        className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-400 hover:bg-amber-100 hover:text-amber-600 transition"
                        title="عرض التفاصيل"
                      >
                        <Eye size={14} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-4">
            <p className="text-xs text-slate-400">
              صفحة {page} من {totalPages} — {total.toLocaleString("ar")} عملية
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-40 transition"
              >
                <ChevronRight size={14} />
              </button>
              <span className="min-w-[2rem] text-center text-sm font-bold text-slate-700">{page}</span>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
                className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-40 transition"
              >
                <ChevronLeft size={14} />
              </button>
            </div>
          </div>
        )}
      </Panel>

      {/* Detail Modal */}
      {selectedLog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm"
            onClick={() => setSelectedLog(null)}
          />
          <div
            className="relative w-full max-w-lg overflow-hidden rounded-3xl bg-white shadow-2xl ring-1 ring-slate-200"
            dir="rtl"
          >
            {/* Modal header */}
            <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50 px-6 py-4">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-500/10 text-amber-600">
                  <ShieldCheck size={16} />
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-900">تفاصيل العملية</h3>
                  <p className="text-xs text-slate-500">{dateTime(selectedLog.timestamp)}</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedLog(null)}
                className="rounded-xl p-1.5 text-slate-400 hover:bg-white hover:text-slate-600 transition"
              >
                <X size={16} />
              </button>
            </div>

            <div className="max-h-[75vh] space-y-4 overflow-y-auto p-6">
              {/* Meta info */}
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-xl bg-slate-50 p-3">
                  <p className="mb-0.5 text-[10px] font-bold uppercase tracking-wider text-slate-400">العملية</p>
                  <Badge tone={actionTone(selectedLog.action)} dot className="mt-1">
                    {actionLabel(selectedLog.action)}
                  </Badge>
                </div>
                <div className="rounded-xl bg-slate-50 p-3">
                  <p className="mb-0.5 text-[10px] font-bold uppercase tracking-wider text-slate-400">الكيان</p>
                  <p className="font-bold text-slate-800">{entityLabel(selectedLog.entityType)}</p>
                </div>
                <div className="rounded-xl bg-slate-50 p-3">
                  <p className="mb-0.5 text-[10px] font-bold uppercase tracking-wider text-slate-400">المستخدم</p>
                  <p className="font-semibold text-slate-800">{userName(selectedLog.user)}</p>
                  {selectedLog.user?.email && (
                    <p className="text-[10px] text-slate-400">{selectedLog.user.email}</p>
                  )}
                </div>
                <div className="rounded-xl bg-slate-50 p-3">
                  <p className="mb-0.5 text-[10px] font-bold uppercase tracking-wider text-slate-400">IP</p>
                  <p className="font-mono text-sm text-slate-700">{selectedLog.ipAddress ?? "—"}</p>
                </div>
              </div>

              {selectedLog.entityId && (
                <div className="rounded-xl bg-slate-50 p-3">
                  <p className="mb-0.5 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    معرّف الكيان
                  </p>
                  <p className="font-mono text-xs text-slate-700 break-all">{selectedLog.entityId}</p>
                </div>
              )}

              <JsonViewer value={selectedLog.oldValue} label="القيمة القديمة" />
              <JsonViewer value={selectedLog.newValue} label="القيمة الجديدة" />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
