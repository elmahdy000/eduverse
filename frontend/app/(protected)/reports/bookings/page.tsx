"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { 
  Calendar, 
  Search, 
  Filter, 
  XCircle, 
  CheckCircle2, 
  Clock, 
  FileText,
  Download,
  User,
  MapPin
} from "lucide-react";
import { api } from "../../../../lib/api";
import { dateTime, money } from "../../../../lib/format";
import { translateStatus } from "../../../../lib/labels";
import { Badge, DataTable, Panel, SectionTitle } from "../../../../components/ui";

export default function BookingReportsPage() {
  const [statusFilter, setStatusFilter] = useState("cancelled"); // الافتراضي عرض الملغي
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  const bookingsQuery = useQuery({
    queryKey: ["booking-reports", statusFilter, fromDate, toDate],
    queryFn: async () => {
      const response = await api.get("/bookings", {
        params: { 
          page: 1, 
          limit: 100, 
          status: statusFilter || undefined,
          fromDate: fromDate || undefined,
          toDate: toDate || undefined
        },
      });
      return response.data;
    },
  });

  const bookings = bookingsQuery.data?.data || [];

  const rows = bookings.map((booking: any) => [
    booking.id.slice(0, 8),
    booking.customer?.fullName ?? "-",
    booking.room?.name ?? "-",
    dateTime(booking.startTime),
    dateTime(booking.endTime),
    <Badge key={booking.id} tone={booking.status === 'confirmed' ? 'success' : booking.status === 'completed' ? 'info' : booking.status === 'cancelled' ? 'danger' : 'default'}>
      {translateStatus(booking.status)}
    </Badge>,
    money(booking.totalAmount),
    booking.notes || "-"
  ]);

  return (
    <div className="space-y-6" dir="rtl">
      <SectionTitle
        title="تقارير الحجوزات"
        subtitle="مراجعة كافة الحجوزات، الحالات الملغية، وتحليل أداء الغرف."
        icon={<FileText size={20} />}
        action={
          <button className="flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2 text-sm font-bold text-white shadow-lg transition hover:bg-slate-800">
            <Download size={16} />
            تصدير تقرير
          </button>
        }
      />

      {/* Filters Panel */}
      <Panel>
        <div className="grid gap-4 md:grid-cols-4">
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-500 uppercase">حالة الحجز</label>
            <select 
              value={statusFilter} 
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full rounded-xl border-slate-200 bg-slate-50 p-2.5 text-sm"
            >
              <option value="">كل الحالات</option>
              <option value="cancelled">الملغية فقط</option>
              <option value="confirmed">المؤكدة</option>
              <option value="completed">المكتملة</option>
            </select>
          </div>
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-500 uppercase">من تاريخ</label>
            <input 
              type="date" 
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              className="w-full rounded-xl border-slate-200 bg-slate-50 p-2.5 text-sm"
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-500 uppercase">إلى تاريخ</label>
            <input 
              type="date" 
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              className="w-full rounded-xl border-slate-200 bg-slate-50 p-2.5 text-sm"
            />
          </div>
          <div className="flex items-end">
             <button 
               onClick={() => bookingsQuery.refetch()}
               className="w-full flex items-center justify-center gap-2 rounded-xl bg-slate-100 px-4 py-2.5 text-sm font-bold text-slate-700 hover:bg-slate-200 transition"
             >
               <Filter size={16} />
               تطبيق الفلاتر
             </button>
          </div>
        </div>
      </Panel>

      {/* Bookings Table */}
      <Panel>
        {bookingsQuery.isLoading ? (
          <div className="p-20 text-center text-slate-400">جاري تحميل البيانات...</div>
        ) : (
          <DataTable 
            headers={["المعرف", "العميل", "الغرفة", "البداية", "النهاية", "الحالة", "الإجمالي", "ملاحظات"]} 
            rows={rows} 
          />
        )}
        {!bookingsQuery.isLoading && bookings.length === 0 && (
          <div className="p-20 text-center text-slate-400">لا توجد سجلات مطابقة لهذا البحث.</div>
        )}
      </Panel>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-3">
         <div className="rounded-3xl bg-rose-50 p-6 border border-rose-100">
            <div className="flex items-center gap-3 text-rose-600 mb-2">
               <XCircle size={20} />
               <span className="text-sm font-bold uppercase">إجمالي الملغى</span>
            </div>
            <p className="text-3xl font-black text-rose-900">{bookings.filter((b:any) => b.status === 'cancelled').length}</p>
         </div>
         <div className="rounded-3xl bg-emerald-50 p-6 border border-emerald-100">
            <div className="flex items-center gap-3 text-emerald-600 mb-2">
               <CheckCircle2 size={20} />
               <span className="text-sm font-bold uppercase">إجمالي المؤكد</span>
            </div>
            <p className="text-3xl font-black text-emerald-900">{bookings.filter((b:any) => b.status === 'confirmed').length}</p>
         </div>
         <div className="rounded-3xl bg-blue-50 p-6 border border-blue-100">
            <div className="flex items-center gap-3 text-blue-600 mb-2">
               <Clock size={20} />
               <span className="text-sm font-bold uppercase">متوسط الحجز</span>
            </div>
            <p className="text-3xl font-black text-blue-900">{bookings.length > 0 ? (bookings.reduce((acc:any, b:any) => acc + (new Date(b.endTime).getTime() - new Date(b.startTime).getTime()) / (1000 * 60 * 60), 0) / bookings.length).toFixed(1) : 0} ساعة</p>
         </div>
      </div>
    </div>
  );
}
