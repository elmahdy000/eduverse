"use client";

import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ClipboardList, RefreshCw, X } from "lucide-react";
import { api } from "../../../lib/api";
import { dateTime } from "../../../lib/format";
import type { Paginated } from "../../../lib/types";
import { Badge, EmptyState, Panel, SectionTitle } from "../../../components/ui";

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
  user?: { email?: string | null; firstName?: string | null; lastName?: string | null } | null;
}

const ENTITY_TYPES = [
  { value: "booking", label: "حجز" },
  { value: "session", label: "جلسة" },
  { value: "customer", label: "عميل" },
  { value: "room", label: "غرفة" },
  { value: "product", label: "منتج" },
  { value: "bar_order", label: "طلب بار" },
  { value: "invoice", label: "فاتورة" },
  { value: "payment", label: "دفع" },
  { value: "expense", label: "مصروف" },
  { value: "inventory_item", label: "مخزون" },
  { value: "user", label: "مستخدم" },
  { value: "shift", label: "وردية" },
];

const ACTIONS = [
  { value: "POST /bookings", label: "إنشاء حجز" },
  { value: "POST /sessions", label: "فتح جلسة" },
  { value: "POST /sessions/:id/close", label: "إغلاق جلسة" },
  { value: "POST /customers", label: "إضافة عميل" },
  { value: "POST /bar-orders", label: "طلب بار جديد" },
  { value: "PUT /bar-orders/:id/status", label: "تحديث حالة طلب" },
  { value: "POST /payments", label: "تحصيل دفعة" },
  { value: "POST /expenses", label: "إضافة مصروف" },
  { value: "ADD_STOCK", label: "إضافة مخزون" },
  { value: "RECORD_WASTE", label: "تسجيل هالك" },
  { value: "AUTO_DEDUCT_STOCK", label: "خصم تلقائي مخزون" },
  { value: "POST /shifts/start", label: "بداية وردية" },
  { value: "PUT /shifts/:id/close", label: "إغلاق وردية" },
  { value: "POST /users", label: "إضافة مستخدم" },
];

function actionTone(action: string): "success" | "danger" | "warn" | "info" | "default" {
  if (action.startsWith("POST")) return "success";
  if (action.startsWith("DELETE") || action.includes("cancel") || action.includes("WASTE")) return "danger";
  if (action.startsWith("PUT") || action.startsWith("PATCH")) return "warn";
  return "info";
}

export default function AuditLogsPage() {
  const [entityType, setEntityType] = useState("");
  const [action, setAction] = useState("");
  const [selectedLog, setSelectedLog] = useState<AuditLogRecord | null>(null);

  const logsQuery = useQuery({
    queryKey: ["audit-logs", entityType, action],
    queryFn: async () => {
      const response = await api.get("/audit-logs", {
        params: {
          page: 1,
          limit: 100,
          entityType: entityType || undefined,
          action: action || undefined,
        },
      });
      return response.data.data as Paginated<AuditLogRecord>;
    },
  });

  const logs = logsQuery.data?.data ?? [];

  const entityLabel = (type: string) =>
    ENTITY_TYPES.find(e => e.value === type)?.label ?? type;

  return (
    <div className="space-y-5" dir="rtl">
      <SectionTitle
        title="سجل العمليات"
        subtitle="متابعة كل عمليات التعديل في النظام."
        icon={<ClipboardList size={20} />}
        action={
          <button
            onClick={() => logsQuery.refetch()}
            className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50"
          >
            <RefreshCw size={12} /> تحديث
          </button>
        }
      />

      {/* Filters */}
      <Panel>
        <div className="grid gap-3 md:grid-cols-2">
          <div>
            <label className="mb-1.5 block text-xs font-semibold text-slate-600">نوع الكيان</label>
            <select
              value={entityType}
              onChange={(e) => setEntityType(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            >
              <option value="">كل الكيانات</option>
              {ENTITY_TYPES.map(et => (
                <option key={et.value} value={et.value}>{et.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-semibold text-slate-600">نوع الإجراء</label>
            <select
              value={action}
              onChange={(e) => setAction(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            >
              <option value="">كل الإجراءات</option>
              {ACTIONS.map(a => (
                <option key={a.value} value={a.value}>{a.label}</option>
              ))}
            </select>
          </div>
        </div>
        {(entityType || action) && (
          <button
            onClick={() => { setEntityType(""); setAction(""); }}
            className="mt-2 flex items-center gap-1 text-xs font-medium text-slate-500 hover:text-slate-800"
          >
            <X size={12} /> مسح الفلاتر
          </button>
        )}
      </Panel>

      {/* Logs Table */}
      <Panel>
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-sm font-semibold tracking-wide text-slate-600">
            آخر السجلات
            {logs.length > 0 && (
              <span className="mr-2 rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-500">
                {logs.length}
              </span>
            )}
          </h3>
          <p className="text-xs text-slate-400">اضغط على أي صف للتفاصيل</p>
        </div>

        {logsQuery.isLoading ? (
          <div className="flex items-center justify-center py-10">
            <RefreshCw size={20} className="animate-spin text-slate-400" />
          </div>
        ) : logs.length === 0 ? (
          <EmptyState icon={<ClipboardList size={36} />} title="لا توجد سجلات" />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 text-right text-xs font-semibold text-slate-500">
                  <th className="pb-2 pr-2">المعرف</th>
                  <th className="pb-2">الكيان</th>
                  <th className="pb-2">الإجراء</th>
                  <th className="pb-2">المستخدم</th>
                  <th className="pb-2 pl-2">الوقت</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log) => (
                  <tr
                    key={log.id}
                    onClick={() => setSelectedLog(log)}
                    className="cursor-pointer border-b border-slate-50 transition hover:bg-slate-50"
                  >
                    <td className="py-2 pr-2 font-mono text-xs text-slate-400">{log.id.slice(0, 8)}</td>
                    <td className="py-2">
                      <span className="rounded-md bg-slate-100 px-1.5 py-0.5 text-xs font-medium text-slate-600">
                        {entityLabel(log.entityType)}
                      </span>
                    </td>
                    <td className="py-2">
                      <Badge tone={actionTone(log.action)}>
                        <span className="max-w-[160px] truncate block">{log.action}</span>
                      </Badge>
                    </td>
                    <td className="py-2 text-xs text-slate-600">
                      {log.user?.firstName
                        ? `${log.user.firstName} ${log.user.lastName ?? ""}`.trim()
                        : log.user?.email ?? log.userId.slice(0, 8)}
                    </td>
                    <td className="py-2 pl-2 text-xs text-slate-400">{dateTime(log.timestamp)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Panel>

      {/* Detail Modal */}
      {selectedLog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm" dir="rtl">
          <div className="w-full max-w-lg rounded-2xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 p-5">
              <div>
                <h3 className="font-bold text-slate-900">تفاصيل السجل</h3>
                <p className="text-xs text-slate-500 font-mono">#{selectedLog.id}</p>
              </div>
              <button onClick={() => setSelectedLog(null)} className="rounded-lg border border-slate-200 p-1.5 hover:bg-slate-50">
                <X size={16} />
              </button>
            </div>
            <div className="space-y-3 p-5 text-sm">
              {[
                { label: "الكيان", value: entityLabel(selectedLog.entityType) },
                { label: "معرف الكيان", value: selectedLog.entityId ?? "-", mono: true },
                { label: "الإجراء", value: selectedLog.action },
                { label: "المستخدم", value: selectedLog.user?.email ?? selectedLog.userId },
                { label: "الوقت", value: dateTime(selectedLog.timestamp) },
                { label: "عنوان IP", value: selectedLog.ipAddress ?? "-" },
              ].map(({ label, value, mono }) => (
                <div key={label} className="flex justify-between gap-3 border-b border-slate-50 pb-2">
                  <span className="font-medium text-slate-500">{label}</span>
                  <span className={`text-right text-slate-800 ${mono ? "font-mono text-xs" : ""}`}>{value}</span>
                </div>
              ))}
              {!!selectedLog.oldValue && (
                <div>
                  <p className="mb-1 text-xs font-semibold text-slate-500">قبل التعديل</p>
                  <pre className="max-h-32 overflow-auto rounded-lg bg-slate-50 p-2 text-[10px] text-slate-600 text-left">
                    {JSON.stringify(selectedLog.oldValue, null, 2)}
                  </pre>
                </div>
              )}
              {!!selectedLog.newValue && (
                <div>
                  <p className="mb-1 text-xs font-semibold text-slate-500">بعد التعديل</p>
                  <pre className="max-h-32 overflow-auto rounded-lg bg-emerald-50 p-2 text-[10px] text-emerald-700 text-left">
                    {JSON.stringify(selectedLog.newValue, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
