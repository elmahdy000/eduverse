"use client";

import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Calendar,
  Filter,
  XCircle,
  CheckCircle2,
  Clock,
  FileText,
  Download,
  RefreshCw,
} from "lucide-react";
import { api } from "../../../../lib/api";
import { dateTime, money } from "../../../../lib/format";
import { translateStatus } from "../../../../lib/labels";
import { Badge, DataTable, Panel, SectionTitle } from "../../../../components/ui";

type BookingRow = {
  id: string;
  customer?: { fullName?: string };
  room?: { name?: string };
  startTime: string;
  endTime: string;
  status: string;
  totalAmount: string | number;
  notes?: string | null;
};

type Paginated<T> = {
  data: T[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
};

function toCsv(rows: BookingRow[]) {
  const header = ["المعرف", "العميل", "الغرفة", "البداية", "النهاية", "الحالة", "الإجمالي", "ملاحظات"];
  const lines = rows.map((b) => [
    b.id,
    b.customer?.fullName ?? "-",
    b.room?.name ?? "-",
    dateTime(b.startTime),
    dateTime(b.endTime),
    translateStatus(b.status),
    String(b.totalAmount),
    (b.notes ?? "-").replace(/\n/g, " "),
  ]);
  const csv = [header, ...lines]
    .map((line) => line.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(","))
    .join("\n");
  return "\uFEFF" + csv;
}

export default function BookingReportsPage() {
  const [statusFilter, setStatusFilter] = useState("cancelled");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  const bookingsQuery = useQuery({
    queryKey: ["booking-reports", statusFilter, fromDate, toDate],
    queryFn: async () => {
      const response = await api.get("/bookings", {
        params: {
          page: 1,
          limit: 200,
          status: statusFilter || undefined,
          fromDate: fromDate || undefined,
          toDate: toDate || undefined,
        },
      });
      return response.data.data as Paginated<BookingRow>;
    },
  });

  const bookings = bookingsQuery.data?.data ?? [];

  const rows = useMemo(
    () =>
      bookings.map((booking) => [
        booking.id.slice(0, 8),
        booking.customer?.fullName ?? "-",
        booking.room?.name ?? "-",
        dateTime(booking.startTime),
        dateTime(booking.endTime),
        <Badge
          key={booking.id}
          tone={
            booking.status === "confirmed"
              ? "success"
              : booking.status === "completed"
                ? "info"
                : booking.status === "cancelled"
                  ? "danger"
                  : "default"
          }
        >
          {translateStatus(booking.status)}
        </Badge>,
        money(booking.totalAmount),
        booking.notes || "-",
      ]),
    [bookings],
  );

  const cancelledCount = bookings.filter((b) => b.status === "cancelled").length;
  const confirmedCount = bookings.filter((b) => b.status === "confirmed").length;
  const avgHours =
    bookings.length > 0
      ? (
          bookings.reduce(
            (acc, b) => acc + (new Date(b.endTime).getTime() - new Date(b.startTime).getTime()) / (1000 * 60 * 60),
            0,
          ) / bookings.length
        ).toFixed(1)
      : "0.0";

  const handleExport = () => {
    const csv = toCsv(bookings);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `booking-report-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6" dir="rtl">
      <SectionTitle
        title="تقارير الحجوزات"
        subtitle="راجع الحجوزات بسهولة، وشوف الملغي والمؤكد ومتوسط مدة الحجز."
        icon={<FileText size={20} />}
        action={
          <button
            onClick={handleExport}
            className="flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2 text-sm font-bold text-white shadow-lg transition hover:bg-slate-800"
          >
            <Download size={16} />
            تصدير CSV
          </button>
        }
      />

      <Panel>
        <div className="grid gap-4 md:grid-cols-4">
          <div className="space-y-1">
            <label className="text-xs font-bold uppercase text-slate-500">حالة الحجز</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full rounded-xl border-slate-200 bg-slate-50 p-2.5 text-sm"
            >
              <option value="">كل الحالات</option>
              <option value="cancelled">الملغي فقط</option>
              <option value="confirmed">المؤكد</option>
              <option value="completed">المكتمل</option>
            </select>
          </div>
          <div className="space-y-1">
            <label className="text-xs font-bold uppercase text-slate-500">من تاريخ</label>
            <input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} className="w-full rounded-xl border-slate-200 bg-slate-50 p-2.5 text-sm" />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-bold uppercase text-slate-500">إلى تاريخ</label>
            <input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} className="w-full rounded-xl border-slate-200 bg-slate-50 p-2.5 text-sm" />
          </div>
          <div className="flex items-end">
            <button
              onClick={() => bookingsQuery.refetch()}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-slate-100 px-4 py-2.5 text-sm font-bold text-slate-700 transition hover:bg-slate-200"
            >
              {bookingsQuery.isFetching ? <RefreshCw size={16} className="animate-spin" /> : <Filter size={16} />}
              تطبيق الفلاتر
            </button>
          </div>
        </div>
      </Panel>

      <Panel>
        {bookingsQuery.isLoading ? (
          <div className="p-20 text-center text-slate-400">جاري تحميل البيانات...</div>
        ) : (
          <DataTable headers={["المعرف", "العميل", "الغرفة", "البداية", "النهاية", "الحالة", "الإجمالي", "ملاحظات"]} rows={rows} />
        )}
        {!bookingsQuery.isLoading && bookings.length === 0 && (
          <div className="p-20 text-center text-slate-400">مفيش سجلات مطابقة للفلاتر دي.</div>
        )}
      </Panel>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-3xl border border-rose-100 bg-rose-50 p-6">
          <div className="mb-2 flex items-center gap-3 text-rose-600">
            <XCircle size={20} />
            <span className="text-sm font-bold uppercase">إجمالي الملغي</span>
          </div>
          <p className="text-3xl font-black text-rose-900">{cancelledCount}</p>
        </div>
        <div className="rounded-3xl border border-emerald-100 bg-emerald-50 p-6">
          <div className="mb-2 flex items-center gap-3 text-emerald-600">
            <CheckCircle2 size={20} />
            <span className="text-sm font-bold uppercase">إجمالي المؤكد</span>
          </div>
          <p className="text-3xl font-black text-emerald-900">{confirmedCount}</p>
        </div>
        <div className="rounded-3xl border border-blue-100 bg-blue-50 p-6">
          <div className="mb-2 flex items-center gap-3 text-blue-600">
            <Clock size={20} />
            <span className="text-sm font-bold uppercase">متوسط مدة الحجز</span>
          </div>
          <p className="text-3xl font-black text-blue-900">{avgHours} ساعة</p>
        </div>
      </div>
    </div>
  );
}
