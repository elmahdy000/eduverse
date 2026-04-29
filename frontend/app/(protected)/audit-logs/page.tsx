"use client";

import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "../../../lib/api";
import { dateTime } from "../../../lib/format";
import type { Paginated } from "../../../lib/types";
import { DataTable, Panel, SectionTitle } from "../../../components/ui";

interface AuditLogRecord {
  id: string;
  action: string;
  entityType: string;
  entityId?: string | null;
  userId: string;
  timestamp: string;
  ipAddress?: string | null;
  user?: { email?: string | null } | null;
}

export default function AuditLogsPage() {
  const [entityType, setEntityType] = useState("");
  const [action, setAction] = useState("");
  const [selectedLogId, setSelectedLogId] = useState<string | null>(null);

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

  const detailQuery = useQuery({
    queryKey: ["audit-logs", selectedLogId],
    enabled: Boolean(selectedLogId),
    queryFn: async () => {
      const response = await api.get(`/audit-logs/${selectedLogId}`);
      return response.data.data as AuditLogRecord;
    },
  });

  const rows = useMemo(
    () =>
      logsQuery.data?.data?.map((log) => [
        log.id.slice(0, 8),
        log.entityType,
        log.action,
        log.user?.email ?? log.userId,
        dateTime(log.timestamp),
      ]) ?? [],
    [logsQuery.data?.data],
  );

  return (
    <div className="space-y-5">
      <SectionTitle title="سجل العمليات" subtitle="متابعة كل عمليات التعديل في النظام." />

      <Panel>
        <div className="grid gap-3 md:grid-cols-2">
          <input
            value={entityType}
            onChange={(event) => setEntityType(event.target.value)}
            placeholder="فلترة حسب الكيان (مثلا: bookings)"
            className="rounded-lg border border-slate-300 px-3 py-2"
          />
          <input
            value={action}
            onChange={(event) => setAction(event.target.value)}
            placeholder="فلترة حسب الإجراء (مثلا: POST /bookings)"
            className="rounded-lg border border-slate-300 px-3 py-2"
          />
        </div>
      </Panel>

      <Panel>
        <h3 className="mb-3 text-sm font-semibold tracking-wide text-slate-600">آخر السجلات</h3>
        <DataTable headers={["المعرف", "الكيان", "الإجراء", "المستخدم", "الوقت"]} rows={rows} />
        <div className="mt-3 flex flex-wrap gap-2">
          {logsQuery.data?.data?.map((log) => (
            <button
              key={log.id}
              className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700"
              onClick={() => setSelectedLogId(log.id)}
            >
              تفاصيل #{log.id.slice(0, 8)}
            </button>
          ))}
        </div>
      </Panel>

      {selectedLogId ? (
        <Panel>
          <h3 className="mb-3 text-sm font-semibold tracking-wide text-slate-600">تفاصيل السجل</h3>
          {detailQuery.isLoading ? (
            <p className="text-sm text-slate-500">بنجيب التفاصيل...</p>
          ) : detailQuery.data ? (
            <div className="space-y-2 text-sm text-slate-700">
              <p>المعرف: <strong>{detailQuery.data.id}</strong></p>
              <p>الكيان: <strong>{detailQuery.data.entityType}</strong></p>
              <p>معرف الكيان: <strong>{detailQuery.data.entityId}</strong></p>
              <p>الإجراء: <strong>{detailQuery.data.action}</strong></p>
              <p>المستخدم: <strong>{detailQuery.data.user?.email ?? detailQuery.data.userId}</strong></p>
              <p>الوقت: <strong>{dateTime(detailQuery.data.timestamp)}</strong></p>
              <p>IP: <strong>{detailQuery.data.ipAddress ?? "-"}</strong></p>
            </div>
          ) : (
            <p className="text-sm text-slate-500">مش قادرين نجيب تفاصيل السجل.</p>
          )}
        </Panel>
      ) : null}
    </div>
  );
}
