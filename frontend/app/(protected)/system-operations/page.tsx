"use client";

import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Activity, Clock3, Filter, RefreshCw, ShieldCheck, UserRound, Users } from "lucide-react";
import { api } from "../../../lib/api";
import { dateTime } from "../../../lib/format";
import { translateStatus } from "../../../lib/labels";
import { Alert, EmptyState, Panel, SectionTitle, StatCard } from "../../../components/ui";

type RoleName = "Operations Manager" | "Receptionist" | "Barista";

interface OperationLog {
  id: string;
  action: string;
  entityType: string;
  entityId?: string | null;
  oldValue?: unknown;
  newValue?: unknown;
  timestamp: string;
  user: {
    id: string;
    email: string;
    firstName?: string | null;
    lastName?: string | null;
  };
}

interface RoleOps {
  role: RoleName;
  userCount: number;
  totalOperations: number;
  actionCounts: Record<string, number>;
  recentLogs: OperationLog[];
}

interface OperationsByRoleResponse {
  operationsByRole: RoleOps[];
  totalOperationsToday: number;
}

const roleLabel: Record<RoleName, string> = {
  "Operations Manager": "مدير العمليات",
  Receptionist: "الاستقبال",
  Barista: "الباريستا",
};

const roleTone: Record<RoleName, "info" | "success" | "warn"> = {
  "Operations Manager": "info",
  Receptionist: "success",
  Barista: "warn",
};

function actionLabel(action: string) {
  const map: Record<string, string> = {
    read: "قراءة",
    create: "إضافة",
    update: "تعديل",
    cancel: "إلغاء",
    close: "إغلاق",
    record: "تسجيل",
    generate: "إنشاء",
    refund: "استرجاع",
    manage: "إدارة",
  };
  return map[action] ?? action;
}

function friendlyTopAction(rawAction: string) {
  return explainAction(rawAction, "api");
}

function parseAction(rawAction: string) {
  const [method = "", ...rest] = rawAction.trim().split(" ");
  const path = rest.join(" ").trim();
  const cleanPath = path.split("?")[0];
  const parts = cleanPath.split("/").filter(Boolean);
  const apiIndex = parts.findIndex((p) => p.toLowerCase() === "api");
  const modulePart = apiIndex >= 0 ? parts[apiIndex + 1] : parts[0];
  const entityId = apiIndex >= 0 ? parts[apiIndex + 2] : parts[1];
  const lastPart = parts[parts.length - 1];
  return {
    method: method.toUpperCase(),
    path: cleanPath,
    modulePart: modulePart ?? "",
    entityId: entityId ?? null,
    lastPart: lastPart ?? "",
  };
}

function entityLabel(entityType: string) {
  const map: Record<string, string> = {
    customers: "العملاء",
    customer: "عميل",
    sessions: "الجلسات",
    session: "جلسة",
    bookings: "الحجوزات",
    booking: "حجز",
    rooms: "الغرف",
    products: "المنتجات",
    invoices: "الفواتير",
    payments: "المدفوعات",
    payment: "دفعة",
    bar_orders: "طلبات البار",
    bar_order: "طلب بار",
    users: "المستخدمين",
  };
  return map[entityType] ?? entityType;
}

function explainAction(rawAction: string, entityType: string) {
  const parsed = parseAction(rawAction);
  const entity = entityType === "api" || entityType === "unknown"
    ? entityLabel(parsed.modulePart)
    : entityLabel(entityType);

  if (parsed.method === "GET") return `استعراض بيانات ${entity}`;
  if (parsed.method === "POST") return `إضافة/إنشاء في ${entity}`;
  if (parsed.method === "PUT" || parsed.method === "PATCH") {
    if (parsed.lastPart.toLowerCase() === "status") return `تحديث حالة ${entity}`;
    if (parsed.lastPart.toLowerCase() === "cancel") return `إلغاء ${entity}`;
    if (parsed.lastPart.toLowerCase() === "close") return `إغلاق ${entity}`;
    return `تعديل بيانات ${entity}`;
  }
  if (parsed.method === "DELETE") return `حذف من ${entity}`;
  return actionLabel(rawAction);
}

function inferChangeSummary(log: OperationLog) {
  const parsed = parseAction(log.action);
  const entity =
    log.entityType === "api" || log.entityType === "unknown"
      ? entityLabel(parsed.modulePart)
      : entityLabel(log.entityType);

  const nextStatus =
    typeof log.newValue === "object" && log.newValue && "status" in (log.newValue as Record<string, unknown>)
      ? String((log.newValue as Record<string, unknown>).status ?? "")
      : "";

  if ((parsed.method === "PUT" || parsed.method === "PATCH") && parsed.lastPart.toLowerCase() === "status") {
    return nextStatus
      ? `تم تغيير حالة ${entity} إلى: ${translateStatus(nextStatus)}`
      : `تم تغيير حالة ${entity}`;
  }
  if ((parsed.method === "PUT" || parsed.method === "PATCH") && parsed.lastPart.toLowerCase() === "cancel") {
    return `تم إلغاء ${entity}`;
  }
  if ((parsed.method === "PUT" || parsed.method === "PATCH") && parsed.lastPart.toLowerCase() === "close") {
    return `تم إغلاق ${entity}`;
  }
  if (parsed.method === "POST") return `تمت إضافة/إنشاء سجل جديد في ${entity}`;
  if (parsed.method === "GET") return `تم استعراض بيانات ${entity}`;
  if (parsed.method === "DELETE") return `تم حذف سجل من ${entity}`;
  return explainAction(log.action, log.entityType);
}

function asObject(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  return value as Record<string, unknown>;
}

function getNestedObject(obj: Record<string, unknown> | null, key: string): Record<string, unknown> | null {
  if (!obj) return null;
  const v = obj[key];
  return v && typeof v === "object" && !Array.isArray(v) ? (v as Record<string, unknown>) : null;
}

function getSnapshotLines(value: unknown) {
  const root = asObject(value);
  if (!root) return [] as Array<{ label: string; value: string }>;

  const customer = getNestedObject(root, "customer");
  const items = Array.isArray(root.items) ? root.items : [];
  const status = typeof root.status === "string" ? root.status : null;
  const totalAmount = root.totalAmount;
  const notes = root.notes;
  const createdAt = root.createdAt;
  const updatedAt = root.updatedAt;

  const lines: Array<{ label: string; value: string }> = [];
  if (status) lines.push({ label: "الحالة", value: translateStatus(status) });
  if (customer?.fullName) lines.push({ label: "اسم العميل", value: String(customer.fullName) });
  if (customer?.phoneNumber) lines.push({ label: "موبايل العميل", value: String(customer.phoneNumber) });
  if (items.length) lines.push({ label: "عدد الأصناف", value: `${items.length} صنف` });
  if (typeof totalAmount === "number" || typeof totalAmount === "string") lines.push({ label: "الإجمالي", value: `${totalAmount} ج.م` });
  if (typeof notes === "string" && notes.trim()) lines.push({ label: "ملاحظات", value: notes });
  if (typeof createdAt === "string") lines.push({ label: "وقت الإنشاء", value: dateTime(createdAt) });
  if (typeof updatedAt === "string") lines.push({ label: "آخر تحديث", value: dateTime(updatedAt) });

  return lines;
}

export default function SystemOperationsPage() {
  const [activeRole, setActiveRole] = useState<RoleName>("Operations Manager");
  const [selectedLog, setSelectedLog] = useState<OperationLog | null>(null);
  const [showTechnicalData, setShowTechnicalData] = useState(false);

  const reportQuery = useQuery({
    queryKey: ["dashboard", "operations-by-role"],
    queryFn: async () => {
      const response = await api.get("/dashboards/operations-by-role");
      return response.data.data as OperationsByRoleResponse;
    },
    refetchInterval: 30000,
  });

  const roleData = useMemo(() => {
    const rows = reportQuery.data?.operationsByRole ?? [];
    return rows.find((r) => r.role === activeRole) ?? null;
  }, [reportQuery.data?.operationsByRole, activeRole]);

  const allRoles = useMemo(() => {
    const rows = reportQuery.data?.operationsByRole ?? [];
    return rows.map((r) => r.role);
  }, [reportQuery.data?.operationsByRole]);

  if (reportQuery.isLoading) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-20">
        <RefreshCw size={28} className="animate-spin text-slate-400" />
        <p className="text-sm text-slate-500">جاري تحميل عمليات السيستم...</p>
      </div>
    );
  }

  if (reportQuery.isError || !reportQuery.data) {
    return (
      <div className="py-10">
        <Alert tone="danger">تعذر تحميل تقرير عمليات السيستم.</Alert>
      </div>
    );
  }

  return (
    <div className="space-y-6" dir="rtl">
      <SectionTitle
        title="عمليات السيستم"
        subtitle="صفحة تفصيلية لمتابعة عمليات كل دور داخل النظام - خاصة بمالك النظام."
        icon={<ShieldCheck size={20} />}
        action={
          <button
            onClick={() => reportQuery.refetch()}
            className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 transition hover:bg-slate-50"
          >
            <RefreshCw size={12} /> تحديث
          </button>
        }
      />

      <div className="grid gap-3 sm:grid-cols-3">
        <StatCard label="إجمالي عمليات اليوم" value={<span className="text-xl md:text-2xl">{reportQuery.data.totalOperationsToday}</span>} icon={<Activity size={18} />} tone="info" />
        <StatCard label="عدد الأدوار المتابعة" value={<span className="text-xl md:text-2xl">{allRoles.length}</span>} icon={<Users size={18} />} />
        <StatCard label="الدور الحالي" value={<span className="text-base md:text-lg">{roleData ? roleLabel[roleData.role] : "-"}</span>} icon={<UserRound size={18} />} tone={roleData ? roleTone[roleData.role] : "default"} />
      </div>

      <Panel title="اختيار الدور" icon={<Filter size={15} />}>
        <div className="flex flex-wrap gap-2">
          {allRoles.map((role) => {
            const isActive = role === activeRole;
            return (
              <button
                key={role}
                type="button"
                onClick={() => setActiveRole(role)}
                className={`rounded-xl border px-3 py-1.5 text-xs font-semibold transition ${
                  isActive
                    ? "border-slate-900 bg-slate-900 text-white"
                    : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                }`}
              >
                {roleLabel[role]}
              </button>
            );
          })}
        </div>
      </Panel>

      {roleData ? (
        <>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard label="إجمالي عمليات الدور" value={<span className="text-xl md:text-2xl">{roleData.totalOperations}</span>} icon={<Activity size={18} />} tone={roleTone[roleData.role]} />
            <StatCard label="عدد المستخدمين" value={<span className="text-xl md:text-2xl">{roleData.userCount}</span>} icon={<Users size={18} />} />
            <StatCard
              label="أكثر إجراء"
              value={
                Object.keys(roleData.actionCounts)[0]
                  ? <span className="block text-sm md:text-base leading-6 break-words">{friendlyTopAction(Object.entries(roleData.actionCounts).sort((a, b) => b[1] - a[1])[0][0])}</span>
                  : "-"
              }
              icon={<Filter size={18} />}
            />
            <StatCard label="آخر تحديث" value={<span className="text-base md:text-lg">{roleData.recentLogs[0] ? dateTime(roleData.recentLogs[0].timestamp) : "-"}</span>} icon={<Clock3 size={18} />} />
          </div>

          <Panel title={`تفاصيل عمليات ${roleLabel[roleData.role]}`} icon={<Activity size={15} />}>
            {roleData.recentLogs.length === 0 ? (
              <EmptyState icon={<Activity size={32} />} title="لا توجد عمليات مسجلة لهذا الدور اليوم" />
            ) : (
              <div className="space-y-2">
                {roleData.recentLogs.map((log) => {
                  const username = [log.user.firstName, log.user.lastName].filter(Boolean).join(" ") || log.user.email;
                  const parsed = parseAction(log.action);
                  const displayEntity =
                    log.entityType === "api" || log.entityType === "unknown"
                      ? entityLabel(parsed.modulePart)
                      : entityLabel(log.entityType);

                  return (
                    <button
                      key={log.id}
                      type="button"
                      onClick={() => setSelectedLog(log)}
                      className={`w-full rounded-xl border bg-white p-3 text-right transition hover:border-slate-400 hover:shadow-sm ${
                        selectedLog?.id === log.id ? "border-slate-400 ring-2 ring-slate-900/10" : "border-slate-200"
                      }`}
                    >
                      <div className="mb-2 flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span className="rounded-full border border-blue-200 bg-blue-50 px-2 py-0.5 text-[11px] font-medium text-blue-700">
                            {explainAction(log.action, log.entityType)}
                          </span>
                          <span className="text-xs text-slate-500">{dateTime(log.timestamp)}</span>
                        </div>
                        <span className="text-xs font-semibold text-slate-800">{username}</span>
                      </div>

                      <div className="grid gap-1 text-xs text-slate-600 sm:grid-cols-2">
                        <p>الكيان: <span className="font-semibold text-slate-800">{displayEntity}</span></p>
                        <p>المعرف: <span className="font-semibold text-slate-800">{log.entityId ?? parsed.entityId ?? "-"}</span></p>
                        <p className="sm:col-span-2">البريد: <span className="font-semibold text-slate-800">{log.user.email}</span></p>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </Panel>
        </>
      ) : null}

      {selectedLog ? (
        <Panel
          title={`تقرير عملية #${selectedLog.id.slice(0, 8)}`}
          icon={<ShieldCheck size={15} />}
          action={
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setShowTechnicalData((s) => !s)}
                className="rounded-lg border border-slate-300 bg-white px-2 py-1 text-xs text-slate-600"
              >
                {showTechnicalData ? "إخفاء البيانات التقنية" : "عرض البيانات التقنية"}
              </button>
              <button
                type="button"
                onClick={() => setSelectedLog(null)}
                className="rounded-lg border border-slate-300 bg-white px-2 py-1 text-xs text-slate-600"
              >
                إغلاق
              </button>
            </div>
          }
        >
          <div className="space-y-3 text-sm">
            <div className="grid gap-2 sm:grid-cols-2">
              <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
                <p className="text-[11px] text-slate-500">الوصف</p>
                <p className="font-semibold text-slate-900">{explainAction(selectedLog.action, selectedLog.entityType)}</p>
              </div>
              <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 sm:col-span-2">
                <p className="text-[11px] text-emerald-700">ملخص تنفيذي</p>
                <p className="font-semibold text-emerald-900">{inferChangeSummary(selectedLog)}</p>
              </div>
              <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
                <p className="text-[11px] text-slate-500">الإجراء التقني</p>
                <p className="font-mono text-xs text-slate-800">{selectedLog.action}</p>
              </div>
              <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
                <p className="text-[11px] text-slate-500">الكيان</p>
                <p className="font-semibold text-slate-900">
                  {selectedLog.entityType === "api" || selectedLog.entityType === "unknown"
                    ? entityLabel(parseAction(selectedLog.action).modulePart)
                    : entityLabel(selectedLog.entityType)}
                </p>
              </div>
              <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
                <p className="text-[11px] text-slate-500">معرف الكيان</p>
                <p className="font-mono text-xs text-slate-800">{selectedLog.entityId ?? parseAction(selectedLog.action).entityId ?? "-"}</p>
              </div>
              <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
                <p className="text-[11px] text-slate-500">المستخدم</p>
                <p className="font-semibold text-slate-900">
                  {[selectedLog.user.firstName, selectedLog.user.lastName].filter(Boolean).join(" ") || selectedLog.user.email}
                </p>
                <p className="text-xs text-slate-500">{selectedLog.user.email}</p>
              </div>
              <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
                <p className="text-[11px] text-slate-500">وقت التنفيذ</p>
                <p className="font-semibold text-slate-900">{dateTime(selectedLog.timestamp)}</p>
              </div>
            </div>

            <div className="grid gap-3 lg:grid-cols-2">
              <div className="rounded-lg border border-slate-200">
                <div className="border-b border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-600">قبل التنفيذ</div>
                <div className="space-y-2 p-3 text-sm">
                  {getSnapshotLines(selectedLog.oldValue).length === 0 ? (
                    <p className="text-slate-500">لا يوجد بيانات سابقة</p>
                  ) : (
                    getSnapshotLines(selectedLog.oldValue).map((line, idx) => (
                      <div key={`${line.label}-${idx}`} className="flex items-center justify-between rounded-md bg-slate-50 px-2 py-1.5">
                        <span className="font-semibold text-slate-800">{line.value}</span>
                        <span className="text-slate-500">{line.label}</span>
                      </div>
                    ))
                  )}
                </div>
              </div>
              <div className="rounded-lg border border-slate-200">
                <div className="border-b border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-600">بعد التنفيذ</div>
                <div className="space-y-2 p-3 text-sm">
                  {getSnapshotLines(selectedLog.newValue).length === 0 ? (
                    <p className="text-slate-500">لا يوجد بيانات لاحقة</p>
                  ) : (
                    getSnapshotLines(selectedLog.newValue).map((line, idx) => (
                      <div key={`${line.label}-${idx}`} className="flex items-center justify-between rounded-md bg-emerald-50 px-2 py-1.5">
                        <span className="font-semibold text-emerald-800">{line.value}</span>
                        <span className="text-emerald-700">{line.label}</span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>

            {showTechnicalData && (
              <div className="grid gap-3 lg:grid-cols-2">
                <div className="rounded-lg border border-slate-200">
                  <div className="border-b border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-600">البيانات التقنية السابقة (JSON)</div>
                  <pre className="max-h-64 overflow-auto p-3 text-xs text-slate-700">
                    {selectedLog.oldValue ? JSON.stringify(selectedLog.oldValue, null, 2) : "لا يوجد"}
                  </pre>
                </div>
                <div className="rounded-lg border border-slate-200">
                  <div className="border-b border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-600">البيانات التقنية اللاحقة (JSON)</div>
                  <pre className="max-h-64 overflow-auto p-3 text-xs text-slate-700">
                    {selectedLog.newValue ? JSON.stringify(selectedLog.newValue, null, 2) : "لا يوجد"}
                  </pre>
                </div>
              </div>
            )}
          </div>
        </Panel>
      ) : null}
    </div>
  );
}
