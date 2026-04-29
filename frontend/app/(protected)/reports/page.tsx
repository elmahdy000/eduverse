"use client";

import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Activity, Banknote, BarChart3, CalendarRange, Coffee, Download, FileText, RefreshCw, Users } from "lucide-react";
import { api } from "../../../lib/api";
import { dateTime, money } from "../../../lib/format";
import { translateStatus } from "../../../lib/labels";
import { Alert, EmptyState, Panel, SectionTitle, StatCard } from "../../../components/ui";

type MetricKey = "todayRevenue" | "invoicesToday" | "activeCustomersNow" | "currentBarOrders" | "totalOperationsToday";

interface OwnerData {
  todayRevenue: number;
  yesterdayRevenue: number;
  weekRevenue: number;
  invoicesToday: number;
  activeCustomersNow: number;
  currentBarOrders: number;
}

interface OperationLog {
  id: string;
  action: string;
  entityType: string;
  timestamp: string;
  user: { email: string; firstName?: string | null; lastName?: string | null };
}

interface OperationsByRoleData {
  operationsByRole: Array<{
    role: string;
    totalOperations: number;
    userCount: number;
    recentLogs: OperationLog[];
  }>;
  totalOperationsToday: number;
}

interface InvoiceRecord {
  id: string;
  invoiceNumber: string;
  paymentStatus: string;
  totalAmount: number | string;
  amountPaid: number | string;
  remainingAmount: number | string;
  issuedAt: string;
  customer?: { id: string; fullName: string; phoneNumber?: string | null } | null;
}

interface InvoiceItem {
  id: string;
  itemType: string;
  description?: string | null;
  quantity: number;
  unitPrice: number | string;
  total: number | string;
}

interface PaymentRecord {
  id: string;
  amount: number | string;
  paymentMethod: string;
  notes?: string | null;
  paidAt: string;
}

interface InvoiceDetails extends InvoiceRecord {
  subtotal?: number | string;
  discountAmount?: number | string;
  taxAmount?: number | string;
  notes?: string | null;
  items?: InvoiceItem[];
  payments?: PaymentRecord[];
  session?: { id: string; sessionType?: string; startTime?: string } | null;
}

interface Paginated<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

function metricLabel(key: MetricKey) {
  const map: Record<MetricKey, string> = {
    todayRevenue: "إيراد النهارده",
    invoicesToday: "فواتير النهارده",
    activeCustomersNow: "العملاء الموجودين دلوقتي",
    currentBarOrders: "طلبات البار الحالية",
    totalOperationsToday: "عمليات اليوم",
  };
  return map[key];
}

function roleLabel(role: string) {
  if (role === "Operations Manager") return "مدير التشغيل";
  if (role === "Receptionist") return "الاستقبال";
  if (role === "Barista") return "الباريستا";
  return role;
}

export default function ReportsPage() {
  const [activeMetric, setActiveMetric] = useState<MetricKey>("todayRevenue");
  const [selectedInvoiceId, setSelectedInvoiceId] = useState<string | null>(null);
  const [paymentStatusFilter, setPaymentStatusFilter] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [customerFilter, setCustomerFilter] = useState("");

  const ownerQuery = useQuery({
    queryKey: ["dashboard", "owner", "reports-v2"],
    queryFn: async () => {
      const r = await api.get("/dashboards/owner");
      return r.data.data as OwnerData;
    },
    refetchInterval: 60000,
  });

  const opsQuery = useQuery({
    queryKey: ["dashboard", "operations-by-role", "reports-v2"],
    queryFn: async () => {
      const r = await api.get("/dashboards/operations-by-role");
      return r.data.data as OperationsByRoleData;
    },
    refetchInterval: 60000,
  });

  const invoicesQuery = useQuery({
    queryKey: ["reports", "invoices-list", paymentStatusFilter, fromDate, toDate],
    queryFn: async () => {
      const r = await api.get("/invoices", {
        params: {
          page: 1,
          limit: 100,
          paymentStatus: paymentStatusFilter || undefined,
          fromDate: fromDate || undefined,
          toDate: toDate || undefined,
        },
      });
      return r.data.data as Paginated<InvoiceRecord>;
    },
    refetchInterval: 60000,
  });

  const invoiceDetailsQuery = useQuery({
    queryKey: ["reports", "invoice-details", selectedInvoiceId],
    enabled: Boolean(selectedInvoiceId),
    queryFn: async () => {
      const r = await api.get(`/invoices/${selectedInvoiceId}`);
      return r.data.data as InvoiceDetails;
    },
  });

  const metrics = useMemo(() => {
    const owner = ownerQuery.data;
    const ops = opsQuery.data;
    if (!owner || !ops) return [] as Array<{ key: MetricKey; value: string; raw: number }>;
    return [
      { key: "todayRevenue" as const, value: money(owner.todayRevenue), raw: Number(owner.todayRevenue || 0) },
      { key: "invoicesToday" as const, value: String(owner.invoicesToday), raw: Number(owner.invoicesToday || 0) },
      { key: "activeCustomersNow" as const, value: String(owner.activeCustomersNow), raw: Number(owner.activeCustomersNow || 0) },
      { key: "currentBarOrders" as const, value: String(owner.currentBarOrders), raw: Number(owner.currentBarOrders || 0) },
      { key: "totalOperationsToday" as const, value: String(ops.totalOperationsToday), raw: Number(ops.totalOperationsToday || 0) },
    ];
  }, [ownerQuery.data, opsQuery.data]);

  const activeMetricLogs = useMemo(() => {
    const ops = opsQuery.data;
    if (!ops) return [] as Array<OperationLog & { role: string }>;
    return ops.operationsByRole.flatMap((roleBlock) => roleBlock.recentLogs.map((log) => ({ ...log, role: roleBlock.role })));
  }, [opsQuery.data]);

  const invoiceRows = useMemo(() => {
    const rows = invoicesQuery.data?.data ?? [];
    if (!customerFilter.trim()) return rows;
    const q = customerFilter.trim().toLowerCase();
    return rows.filter((i) => (i.customer?.fullName ?? "").toLowerCase().includes(q) || i.invoiceNumber.toLowerCase().includes(q));
  }, [invoicesQuery.data?.data, customerFilter]);

  function exportInvoicesCsv() {
    if (invoiceRows.length === 0) return;
    const headers = ["رقم الفاتورة", "العميل", "الحالة", "الإجمالي", "المدفوع", "المتبقي", "تاريخ الإصدار"];
    const lines = [
      headers.join(","),
      ...invoiceRows.map((inv) =>
        [
          inv.invoiceNumber,
          inv.customer?.fullName ?? "غير محدد",
          translateStatus(inv.paymentStatus),
          String(inv.totalAmount),
          String(inv.amountPaid),
          String(inv.remainingAmount),
          dateTime(inv.issuedAt),
        ]
          .map((v) => `"${String(v).replace(/"/g, '""')}"`)
          .join(","),
      ),
    ];
    const blob = new Blob(["\uFEFF" + lines.join("\n")], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `invoices-report-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  }

  function printSelectedInvoice() {
    const inv = invoiceDetailsQuery.data;
    if (!inv) return;
    const html = `
      <html dir="rtl" lang="ar"><head><meta charset="utf-8" />
      <title>فاتورة ${inv.invoiceNumber}</title>
      <style>
      body{font-family:Tahoma,Arial,sans-serif;padding:20px;color:#0f172a}
      table{width:100%;border-collapse:collapse;margin-top:12px}
      th,td{border:1px solid #cbd5e1;padding:8px;text-align:right}
      h2,h3{margin:6px 0}
      .muted{color:#64748b;font-size:12px}
      </style></head><body>
      <h2>تفاصيل فاتورة</h2>
      <p><strong>رقم الفاتورة:</strong> ${inv.invoiceNumber}</p>
      <p><strong>العميل:</strong> ${inv.customer?.fullName ?? "غير محدد"}</p>
      <p><strong>الحالة:</strong> ${translateStatus(inv.paymentStatus)}</p>
      <p><strong>التاريخ:</strong> ${dateTime(inv.issuedAt)}</p>
      <h3>البنود</h3>
      <table><thead><tr><th>الوصف</th><th>الكمية</th><th>سعر الوحدة</th><th>الإجمالي</th></tr></thead><tbody>
      ${(inv.items ?? []).map((it) => `<tr><td>${it.description ?? it.itemType}</td><td>${it.quantity}</td><td>${money(it.unitPrice)}</td><td>${money(it.total)}</td></tr>`).join("")}
      </tbody></table>
      <h3>الملخص المالي</h3>
      <p><strong>الإجمالي:</strong> ${money(inv.totalAmount)}</p>
      <p><strong>المدفوع:</strong> ${money(inv.amountPaid)}</p>
      <p><strong>المتبقي:</strong> ${money(inv.remainingAmount)}</p>
      </body></html>
    `;
    const w = window.open("", "_blank");
    if (!w) return;
    w.document.open();
    w.document.write(html);
    w.document.close();
    w.focus();
    w.print();
  }

  if (ownerQuery.isLoading || opsQuery.isLoading) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-20">
        <RefreshCw size={28} className="animate-spin text-slate-400" />
        <p className="text-sm text-slate-500">جاري تحميل شاشة التقارير...</p>
      </div>
    );
  }

  if (ownerQuery.isError || opsQuery.isError || !ownerQuery.data || !opsQuery.data) {
    return <div className="py-10"><Alert tone="danger">مش قادرين نحمل بيانات التقارير حالياً.</Alert></div>;
  }

  return (
    <div className="space-y-6">
      <SectionTitle
        title="التقارير الشاملة"
        subtitle="كل مؤشرات التشغيل والمبيعات والفواتير في شاشة واحدة تفاعلية."
        icon={<BarChart3 size={20} />}
      />

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        <StatCard label="إيراد النهارده" value={money(ownerQuery.data.todayRevenue)} icon={<Banknote size={18} />} tone="success" />
        <StatCard label="فواتير النهارده" value={ownerQuery.data.invoicesToday} icon={<FileText size={18} />} tone="info" />
        <StatCard label="عملاء داخل المكان" value={ownerQuery.data.activeCustomersNow} icon={<Users size={18} />} />
        <StatCard label="طلبات بار حالية" value={ownerQuery.data.currentBarOrders} icon={<Coffee size={18} />} tone="warn" />
        <StatCard label="إجمالي عمليات اليوم" value={opsQuery.data.totalOperationsToday} icon={<Activity size={18} />} tone="info" />
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.2fr_1fr]">
        <Panel title="عناصر التقارير القابلة للاستكشاف" icon={<CalendarRange size={16} />}>
          <div className="space-y-2">
            {metrics.map((m) => (
              <button
                key={m.key}
                type="button"
                onClick={() => setActiveMetric(m.key)}
                className={`w-full rounded-xl border px-3 py-2 text-right transition ${activeMetric === m.key ? "border-slate-900 bg-slate-900 text-white" : "border-slate-200 bg-white hover:bg-slate-50"}`}
              >
                <div className="flex items-center justify-between">
                  <span className={`text-xs ${activeMetric === m.key ? "text-slate-200" : "text-slate-500"}`}>اضغط لعرض التفاصيل</span>
                  <span className="font-semibold">{metricLabel(m.key)}</span>
                </div>
                <div className="mt-1 text-lg font-bold">{m.value}</div>
              </button>
            ))}
          </div>
        </Panel>

        <Panel title={`تفاصيل: ${metricLabel(activeMetric)}`} icon={<Activity size={16} />}>
          {activeMetric === "todayRevenue" && (
            <div className="space-y-2 text-sm">
              <p>إيراد النهارده: <strong>{money(ownerQuery.data.todayRevenue)}</strong></p>
              <p>إيراد امبارح: <strong>{money(ownerQuery.data.yesterdayRevenue)}</strong></p>
              <p>إيراد الأسبوع: <strong>{money(ownerQuery.data.weekRevenue)}</strong></p>
            </div>
          )}

          {activeMetric === "invoicesToday" && (
            <p className="text-sm">عدد الفواتير اللي اتعملت النهارده: <strong>{ownerQuery.data.invoicesToday}</strong></p>
          )}

          {activeMetric === "activeCustomersNow" && (
            <p className="text-sm">عدد العملاء الموجودين حالياً في المكان: <strong>{ownerQuery.data.activeCustomersNow}</strong></p>
          )}

          {activeMetric === "currentBarOrders" && (
            <p className="text-sm">طلبات البار الحالية (جديد + بيتجهز + جاهز): <strong>{ownerQuery.data.currentBarOrders}</strong></p>
          )}

          {activeMetric === "totalOperationsToday" && (
            <div className="space-y-2">
              {opsQuery.data.operationsByRole.map((r) => (
                <div key={r.role} className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm">
                  <p className="font-semibold">{roleLabel(r.role)}</p>
                  <p className="text-slate-600">{r.totalOperations} عملية بواسطة {r.userCount} مستخدم</p>
                </div>
              ))}
            </div>
          )}
        </Panel>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.2fr_1fr]">
        <Panel title="الفواتير" icon={<FileText size={16} />}>
          <div className="mb-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
            <select value={paymentStatusFilter} onChange={(e) => setPaymentStatusFilter(e.target.value)} className="rounded-lg border border-slate-300 px-2 py-2 text-sm">
              <option value="">كل الحالات</option>
              <option value="unpaid">غير مدفوعة</option>
              <option value="partially_paid">مدفوعة جزئي</option>
              <option value="paid">مدفوعة</option>
              <option value="refunded">مسترجعة</option>
            </select>
            <input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} className="rounded-lg border border-slate-300 px-2 py-2 text-sm" />
            <input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} className="rounded-lg border border-slate-300 px-2 py-2 text-sm" />
            <input value={customerFilter} onChange={(e) => setCustomerFilter(e.target.value)} placeholder="بحث عميل/رقم فاتورة" className="rounded-lg border border-slate-300 px-2 py-2 text-sm" />
          </div>
          <div className="mb-3 flex items-center justify-end">
            <button onClick={exportInvoicesCsv} className="inline-flex items-center gap-1 rounded-lg border border-slate-300 bg-white px-2 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50">
              <Download size={12} /> تصدير CSV
            </button>
          </div>
          {invoicesQuery.isLoading ? (
            <p className="text-sm text-slate-500">جاري تحميل الفواتير...</p>
          ) : invoiceRows.length === 0 ? (
            <EmptyState icon={<FileText size={32} />} title="مفيش فواتير لسه" />
          ) : (
            <div className="space-y-2">
              {invoiceRows.map((inv) => (
                <button
                  key={inv.id}
                  type="button"
                  onClick={() => setSelectedInvoiceId(inv.id)}
                  className={`w-full rounded-xl border p-3 text-right transition ${selectedInvoiceId === inv.id ? "border-slate-900 bg-slate-50" : "border-slate-200 bg-white hover:bg-slate-50"}`}
                >
                  <div className="flex items-center justify-between text-xs text-slate-500">
                    <span>{dateTime(inv.issuedAt)}</span>
                    <span>{inv.invoiceNumber}</span>
                  </div>
                  <div className="mt-2 flex items-center justify-between">
                    <span className="text-sm font-bold text-emerald-700">{money(inv.totalAmount)}</span>
                    <span className="text-sm font-semibold text-slate-800">{inv.customer?.fullName ?? "عميل غير محدد"}</span>
                  </div>
                  <div className="mt-1 text-xs text-slate-600">الحالة: {translateStatus(inv.paymentStatus)}</div>
                </button>
              ))}
            </div>
          )}
        </Panel>

        <Panel title="تفاصيل الفاتورة" icon={<Banknote size={16} />}>
          {!selectedInvoiceId ? (
            <EmptyState icon={<FileText size={30} />} title="اختار فاتورة من القائمة" sub="أول ما تضغط على أي فاتورة هتظهر كل تفاصيلها هنا." />
          ) : invoiceDetailsQuery.isLoading ? (
            <p className="text-sm text-slate-500">جاري تحميل تفاصيل الفاتورة...</p>
          ) : !invoiceDetailsQuery.data ? (
            <Alert tone="danger">تعذر تحميل تفاصيل الفاتورة.</Alert>
          ) : (
            <div className="space-y-3 text-sm">
              <div className="flex justify-end">
                <button onClick={printSelectedInvoice} className="rounded-lg border border-slate-300 bg-white px-2 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50">
                  طباعة الفاتورة
                </button>
              </div>
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                <p><strong>رقم الفاتورة:</strong> {invoiceDetailsQuery.data.invoiceNumber}</p>
                <p><strong>العميل:</strong> {invoiceDetailsQuery.data.customer?.fullName ?? "غير محدد"}</p>
                <p><strong>الحالة:</strong> {translateStatus(invoiceDetailsQuery.data.paymentStatus)}</p>
                <p><strong>تاريخ الإصدار:</strong> {dateTime(invoiceDetailsQuery.data.issuedAt)}</p>
              </div>

              <div className="rounded-lg border border-slate-200 p-3">
                <p className="mb-2 font-semibold">تفاصيل البنود</p>
                {(invoiceDetailsQuery.data.items?.length ?? 0) === 0 ? (
                  <p className="text-slate-500">مفيش بنود مسجلة.</p>
                ) : (
                  <div className="space-y-2">
                    {invoiceDetailsQuery.data.items?.map((item) => (
                      <div key={item.id} className="rounded-md bg-slate-50 px-2 py-1.5">
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-emerald-700">{money(item.total)}</span>
                          <span className="font-medium text-slate-800">{item.description ?? item.itemType}</span>
                        </div>
                        <div className="text-xs text-slate-600">{item.quantity} × {money(item.unitPrice)}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="rounded-lg border border-slate-200 p-3">
                <p className="mb-2 font-semibold">ملخص المبالغ</p>
                <div className="space-y-1 text-xs">
                  <p>Subtotal: <strong>{money(invoiceDetailsQuery.data.subtotal ?? 0)}</strong></p>
                  <p>Discount: <strong>{money(invoiceDetailsQuery.data.discountAmount ?? 0)}</strong></p>
                  <p>Tax: <strong>{money(invoiceDetailsQuery.data.taxAmount ?? 0)}</strong></p>
                  <p>Total: <strong>{money(invoiceDetailsQuery.data.totalAmount ?? 0)}</strong></p>
                  <p>Paid: <strong>{money(invoiceDetailsQuery.data.amountPaid ?? 0)}</strong></p>
                  <p>Remaining: <strong>{money(invoiceDetailsQuery.data.remainingAmount ?? 0)}</strong></p>
                </div>
              </div>

              <div className="rounded-lg border border-slate-200 p-3">
                <p className="mb-2 font-semibold">المدفوعات على الفاتورة</p>
                {(invoiceDetailsQuery.data.payments?.length ?? 0) === 0 ? (
                  <p className="text-slate-500">لحد دلوقتي مفيش مدفوعات مسجلة.</p>
                ) : (
                  <div className="space-y-2">
                    {invoiceDetailsQuery.data.payments?.map((p) => (
                      <div key={p.id} className="rounded-md bg-slate-50 px-2 py-1.5 text-xs">
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-emerald-700">{money(p.amount)}</span>
                          <span className="font-medium">{p.paymentMethod}</span>
                        </div>
                        <p className="text-slate-600">{dateTime(p.paidAt)}</p>
                        {p.notes ? <p className="text-slate-600">ملاحظات: {p.notes}</p> : null}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </Panel>
      </div>

      <Panel title="آخر عمليات النظام" icon={<Activity size={16} />}>
        {activeMetricLogs.length === 0 ? (
          <EmptyState icon={<Activity size={30} />} title="مفيش عمليات اليوم" />
        ) : (
          <div className="space-y-2">
            {activeMetricLogs.slice(0, 12).map((log) => {
              const user = [log.user.firstName, log.user.lastName].filter(Boolean).join(" ") || log.user.email;
              return (
                <div key={log.id} className="flex items-center justify-between rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm">
                  <div className="text-left text-xs text-slate-500">{dateTime(log.timestamp)}</div>
                  <div className="text-right">
                    <p className="font-semibold text-slate-900">{log.action}</p>
                    <p className="text-xs text-slate-500">{user} - {roleLabel(log.role)}</p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Panel>
    </div>
  );
}
