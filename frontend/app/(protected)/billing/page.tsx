"use client";

import { FormEvent, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Receipt, CreditCard, RotateCcw, RefreshCw, Banknote, FileText, CheckCircle2, AlertCircle, ChevronDown, ChevronUp, Wallet, Search, User } from "lucide-react";
import { api } from "../../../lib/api";
import { translateApiError } from "../../../lib/errors";
import { dateTime, money } from "../../../lib/format";
import { translatePaymentMethod, translateStatus } from "../../../lib/labels";
import type { Customer, Invoice, Paginated, Payment, Session } from "../../../lib/types";
import { Alert, Badge, Btn, EmptyState, FormField, Input, Panel, SectionTitle, Select, StatCard, statusBadgeTone } from "../../../components/ui";

interface InvoicePaymentsSummary {
  data: Payment[];
  total: number;
  totalRecorded: number;
  remainingAmount: number;
}

function InvoiceRow({ invoice, onSelect, selected }: {
  invoice: Invoice;
  onSelect: () => void;
  selected: boolean;
}) {
  const isPaid = invoice.paymentStatus === "paid";
  const isPartial = invoice.paymentStatus === "partially_paid";
  return (
    <div
      onClick={onSelect}
      className={`cursor-pointer rounded-xl border p-3 transition ${selected ? "border-slate-900 bg-slate-50 ring-1 ring-slate-900" : "border-slate-200 bg-white hover:border-slate-300"}`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="text-right">
          <p className="font-mono text-xs font-bold text-slate-800">{invoice.invoiceNumber}</p>
          <p className="text-[10px] text-slate-500">{dateTime(invoice.issuedAt)}</p>
        </div>
        <Badge tone={statusBadgeTone(invoice.paymentStatus)}>{translateStatus(invoice.paymentStatus)}</Badge>
      </div>
      <div className="mt-2 grid grid-cols-3 gap-1 text-center text-[10px]">
        <div className="rounded-lg bg-slate-100 p-1">
          <p className="font-bold text-slate-800">{money(invoice.totalAmount)}</p>
          <p className="text-slate-500">الإجمالي</p>
        </div>
        <div className={`rounded-lg p-1 ${isPaid ? "bg-emerald-100" : "bg-amber-50"}`}>
          <p className={`font-bold ${isPaid ? "text-emerald-700" : "text-amber-700"}`}>{money(invoice.amountPaid)}</p>
          <p className="text-slate-500">المدفوع</p>
        </div>
        <div className={`rounded-lg p-1 ${Number(invoice.remainingAmount) > 0 ? "bg-rose-50" : "bg-slate-100"}`}>
          <p className={`font-bold ${Number(invoice.remainingAmount) > 0 ? "text-rose-700" : "text-slate-400"}`}>{money(invoice.remainingAmount)}</p>
          <p className="text-slate-500">المتبقي</p>
        </div>
      </div>
    </div>
  );
}

export default function BillingPage() {
  const qc = useQueryClient();

  const [sessionId, setSessionId] = useState("");
  const [invoiceId, setInvoiceId] = useState("");
  const [amount, setAmount] = useState("0");
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [paymentNotes, setPaymentNotes] = useState("");
  const [refundPaymentId, setRefundPaymentId] = useState("");
  const [refundAmount, setRefundAmount] = useState("");
  const [refundReason, setRefundReason] = useState("");
  const [selectedInvoiceId, setSelectedInvoiceId] = useState<string | null>(null);
  const [message, setMessage] = useState<{ text: string; ok: boolean } | null>(null);
  const [activeTab, setActiveTab] = useState<"invoice" | "pay" | "refund" | "customer">("customer");
  const [searchName, setSearchName] = useState("");
  const [searchPhone, setSearchPhone] = useState("");
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);

  const invoicesQuery = useQuery({
    queryKey: ["invoices"],
    queryFn: async () => {
      const r = await api.get("/invoices", { params: { page: 1, limit: 50 } });
      return r.data.data as Paginated<Invoice>;
    },
  });

  const paymentsQuery = useQuery({
    queryKey: ["payments"],
    queryFn: async () => {
      const r = await api.get("/payments", { params: { page: 1, limit: 50 } });
      return r.data.data as Paginated<Payment>;
    },
  });

  const selectedInvoiceQuery = useQuery({
    queryKey: ["invoices", selectedInvoiceId],
    enabled: Boolean(selectedInvoiceId),
    queryFn: async () => {
      const r = await api.get(`/invoices/${selectedInvoiceId}`);
      return r.data.data as Invoice;
    },
  });

  const selectedInvoicePaymentsQuery = useQuery({
    queryKey: ["invoices", selectedInvoiceId, "payments"],
    enabled: Boolean(selectedInvoiceId),
    queryFn: async () => {
      const r = await api.get(`/invoices/${selectedInvoiceId}/payments`);
      return r.data.data as InvoicePaymentsSummary;
    },
  });

  const customersSearchQuery = useQuery({
    queryKey: ["customers", "billing-search", searchName, searchPhone],
    queryFn: async () => {
      const r = await api.get("/customers", {
        params: { page: 1, limit: 20, name: searchName || undefined, phone: searchPhone || undefined }
      });
      return r.data.data as Paginated<Customer>;
    },
    enabled: Boolean(searchName) || Boolean(searchPhone),
  });

  const customerSessionsQuery = useQuery({
    queryKey: ["customers", selectedCustomerId, "sessions"],
    enabled: Boolean(selectedCustomerId),
    queryFn: async () => {
      const r = await api.get("/sessions", {
        params: { customerId: selectedCustomerId, page: 1, limit: 50 }
      });
      return r.data.data as Paginated<Session>;
    },
  });

  const customerInvoicesQuery = useQuery({
    queryKey: ["customers", selectedCustomerId, "invoices"],
    enabled: Boolean(selectedCustomerId),
    queryFn: async () => {
      const r = await api.get("/invoices", {
        params: { customerId: selectedCustomerId, page: 1, limit: 50 }
      });
      return r.data.data as Paginated<Invoice>;
    },
  });

  const customerPaymentsQuery = useQuery({
    queryKey: ["customers", selectedCustomerId, "payments"],
    enabled: Boolean(selectedCustomerId),
    queryFn: async () => {
      const r = await api.get("/payments", {
        params: { customerId: selectedCustomerId, page: 1, limit: 50 }
      });
      return r.data.data as Paginated<Payment>;
    },
  });

  const generateMutation = useMutation({
    mutationFn: () => api.post("/invoices", { sessionId }),
    onSuccess: () => {
      setSessionId("");
      setMessage({ text: "الفاتورة اتعملت بنجاح! ✓", ok: true });
      qc.invalidateQueries({ queryKey: ["invoices"] });
    },
    onError: (err: unknown) => {
      const m = (err as any)?.response?.data?.message;
      setMessage({ text: translateApiError(m), ok: false });
    },
  });

  const payMutation = useMutation({
    mutationFn: () => api.post("/payments", { invoiceId, paymentMethod, amount: Number(amount), notes: paymentNotes || undefined }),
    onSuccess: () => {
      setAmount("0"); setPaymentNotes("");
      setMessage({ text: "الدفع اتسجل بنجاح! ✓", ok: true });
      qc.invalidateQueries({ queryKey: ["payments"] });
      qc.invalidateQueries({ queryKey: ["invoices"] });
      if (invoiceId) {
        setSelectedInvoiceId(invoiceId);
        qc.invalidateQueries({ queryKey: ["invoices", invoiceId] });
        qc.invalidateQueries({ queryKey: ["invoices", invoiceId, "payments"] });
      }
    },
    onError: (err: unknown) => {
      const m = (err as any)?.response?.data?.message;
      setMessage({ text: translateApiError(m), ok: false });
    },
  });

  const refundMutation = useMutation({
    mutationFn: () => api.post(`/payments/${refundPaymentId}/refund`, {
      amount: refundAmount ? Number(refundAmount) : undefined,
      reason: refundReason || undefined,
    }),
    onSuccess: () => {
      setRefundPaymentId(""); setRefundAmount(""); setRefundReason("");
      setMessage({ text: "المرتجع اتسجل. ✓", ok: true });
      qc.invalidateQueries({ queryKey: ["payments"] });
      qc.invalidateQueries({ queryKey: ["invoices"] });
      if (selectedInvoiceId) {
        qc.invalidateQueries({ queryKey: ["invoices", selectedInvoiceId] });
        qc.invalidateQueries({ queryKey: ["invoices", selectedInvoiceId, "payments"] });
      }
    },
    onError: (err: unknown) => {
      const m = (err as any)?.response?.data?.message;
      setMessage({ text: translateApiError(m), ok: false });
    },
  });

  const invoices = invoicesQuery.data?.data ?? [];
  const payments = paymentsQuery.data?.data ?? [];
  const unpaidInvoices = invoices.filter(i => i.remainingAmount !== 0);
  const totalCollected = payments.reduce((s, p) => s + Number(p.amount), 0);
  const paidCount = invoices.filter(i => i.paymentStatus === "paid").length;
  const unpaidCount = invoices.filter(i => i.paymentStatus !== "paid").length;

  const TABS = [
    { id: "customer" as const, label: "بحث عميل", icon: <User size={14} /> },
    { id: "pay" as const, label: "تسجيل دفع", icon: <CreditCard size={14} /> },
    { id: "refund" as const, label: "مرتجع", icon: <RotateCcw size={14} /> },
  ];

  return (
    <div className="space-y-6">
      <SectionTitle
        title="الفواتير والمدفوعات"
        subtitle="ابحث عن عميل، سجّل دفع، واعمل مرتجع — كل حاجة من مكان واحد."
        icon={<Receipt size={20} />}
        action={
          <button onClick={() => { invoicesQuery.refetch(); paymentsQuery.refetch(); }}
            className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 transition hover:bg-slate-50">
            <RefreshCw size={12} /> تحديث
          </button>
        }
      />

      {message && <Alert tone={message.ok ? "success" : "danger"}>{message.text}</Alert>}

      {/* Stats */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="إجمالي الفواتير" value={invoices.length} icon={<Receipt size={18} />} />
        <StatCard label="متدفعة بالكامل" value={paidCount} tone="success" icon={<CheckCircle2 size={18} />} />
        <StatCard label="لسه عليها مبالغ" value={unpaidCount} tone={unpaidCount > 0 ? "warn" : "default"} icon={<AlertCircle size={18} />} />
        <StatCard label="إجمالي المحصّل" value={money(totalCollected)} tone="success" icon={<Wallet size={18} />} />
      </div>

      {/* Action tabs */}
      <Panel>
        {/* Tab bar */}
        <div className="mb-5 flex gap-1 rounded-xl bg-slate-100 p-1">
          {TABS.map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              className={`flex flex-1 items-center justify-center gap-2 rounded-lg py-2 text-xs font-semibold transition ${activeTab === tab.id ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}>
              {tab.icon} {tab.label}
            </button>
          ))}
        </div>

        {/* Tab: Customer Search */}
        {activeTab === "customer" && (
          <div className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <FormField label="بحث بالاسم">
                <div className="relative">
                  <Search size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    value={searchName}
                    onChange={e => setSearchName(e.target.value)}
                    placeholder="اسم العميل..."
                    className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 pr-9 text-sm outline-none focus:border-slate-900 focus:ring-2 focus:ring-slate-900/10"
                  />
                </div>
              </FormField>
              <FormField label="بحث بالهاتف">
                <div className="relative">
                  <Search size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    value={searchPhone}
                    onChange={e => setSearchPhone(e.target.value)}
                    placeholder="رقم الهاتف..."
                    className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 pr-9 text-sm outline-none focus:border-slate-900 focus:ring-2 focus:ring-slate-900/10"
                  />
                </div>
              </FormField>
            </div>

            {customersSearchQuery.data?.data && customersSearchQuery.data.data.length > 0 ? (
              <div className="space-y-2">
                <p className="text-xs font-semibold text-slate-600">العملاء المطابقين</p>
                {customersSearchQuery.data.data.map(customer => (
                  <div
                    key={customer.id}
                    onClick={() => setSelectedCustomerId(customer.id)}
                    className={`cursor-pointer rounded-xl border p-3 transition ${selectedCustomerId === customer.id ? "border-slate-900 bg-slate-50 ring-1 ring-slate-900" : "border-slate-200 bg-white hover:border-slate-300"}`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-semibold text-slate-900">{customer.fullName}</p>
                        <p className="text-xs text-slate-500">{customer.phoneNumber}</p>
                      </div>
                      <span className="text-xs text-slate-400">#{customer.id.slice(0, 8)}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (searchName || searchPhone) && customersSearchQuery.data?.data?.length === 0 ? (
              <EmptyState icon={<User size={28} />} title="لا توجد نتائج" sub="جرب البحث باسم أو رقم هاتف آخر." />
            ) : null}

            {selectedCustomerId && (
              <div className="space-y-4 mt-6">
                <div className="border-t border-slate-200 pt-4">
                  <p className="text-sm font-semibold text-slate-700 mb-3">معاملات العميل</p>

                  {/* Customer Invoices */}
                  <div className="mb-4">
                    <p className="text-xs font-semibold text-slate-600 mb-2">الفواتير</p>
                    {customerInvoicesQuery.isLoading ? (
                      <p className="text-sm text-slate-500">جاري التحميل...</p>
                    ) : customerInvoicesQuery.data?.data && customerInvoicesQuery.data.data.length > 0 ? (
                      <div className="space-y-2">
                        {customerInvoicesQuery.data.data.map(invoice => (
                          <div
                            key={invoice.id}
                            onClick={() => setSelectedInvoiceId(invoice.id)}
                            className="cursor-pointer flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs hover:border-slate-300"
                          >
                            <div>
                              <p className="font-mono text-slate-500">{invoice.invoiceNumber}</p>
                              <p className="text-slate-700">{dateTime(invoice.issuedAt)}</p>
                            </div>
                            <div className="text-right">
                              <p className="font-bold text-slate-900">{money(invoice.totalAmount)}</p>
                              <Badge tone={statusBadgeTone(invoice.paymentStatus)}>{translateStatus(invoice.paymentStatus)}</Badge>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-slate-500">لا توجد فواتير</p>
                    )}
                  </div>

                  {/* Customer Payments */}
                  <div>
                    <p className="text-xs font-semibold text-slate-600 mb-2">المدفوعات</p>
                    {customerPaymentsQuery.isLoading ? (
                      <p className="text-sm text-slate-500">جاري التحميل...</p>
                    ) : customerPaymentsQuery.data?.data && customerPaymentsQuery.data.data.length > 0 ? (
                      <div className="space-y-2">
                        {customerPaymentsQuery.data.data.map(payment => (
                          <div key={payment.id} className="flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs">
                            <div>
                              <p className="font-mono text-slate-500">#{payment.id.slice(0, 8)}</p>
                              <p className="text-slate-700">{dateTime(payment.paidAt)}</p>
                            </div>
                            <div className="text-right">
                              <p className="font-bold text-emerald-700">{money(payment.amount)}</p>
                              <span className="text-slate-500">{translatePaymentMethod(payment.paymentMethod)}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-slate-500">لا توجد مدفوعات</p>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Tab: Record Payment */}
        {activeTab === "pay" && (
          <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); setMessage(null); payMutation.mutate(); }}>
            <FormField label="الفاتورة">
              <Select value={invoiceId} onChange={e => setInvoiceId(e.target.value)} required>
                <option value="">اختر الفاتورة</option>
                {unpaidInvoices.map(inv => (
                  <option key={inv.id} value={inv.id}>
                    {inv.invoiceNumber} — متبقي {money(inv.remainingAmount)}
                  </option>
                ))}
              </Select>
            </FormField>
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField label="طريقة الدفع">
                <Select value={paymentMethod} onChange={e => setPaymentMethod(e.target.value)}>
                  <option value="cash">💵 كاش</option>
                  <option value="card">💳 بطاقة</option>
                  <option value="bank_transfer">🏦 تحويل بنكي</option>
                  <option value="mixed">🔀 مختلط</option>
                </Select>
              </FormField>
              <FormField label="المبلغ (جنيه)">
                <input type="number" min={0.01} step={0.01} value={amount} onChange={e => setAmount(e.target.value)} required
                  className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-right text-sm outline-none focus:border-slate-900 focus:ring-2 focus:ring-slate-900/10" />
              </FormField>
            </div>
            <FormField label="ملاحظة (اختياري)">
              <input value={paymentNotes} onChange={e => setPaymentNotes(e.target.value)} placeholder="أي تفاصيل تانية..."
                className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-right text-sm outline-none focus:border-slate-900 focus:ring-2 focus:ring-slate-900/10" />
            </FormField>
            <Btn type="submit" loading={payMutation.isPending} loadingText="جاري التسجيل..." icon={<CreditCard size={14} />} className="w-full">
              سجّل الدفع
            </Btn>
          </form>
        )}

        {/* Tab: Refund */}
        {activeTab === "refund" && (
          <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); setMessage(null); refundMutation.mutate(); }}>
            <FormField label="عملية الدفع">
              <Select value={refundPaymentId} onChange={e => setRefundPaymentId(e.target.value)} required>
                <option value="">اختر عملية الدفع</option>
                {payments.filter(p => Number(p.amount) > 0).map(p => (
                  <option key={p.id} value={p.id}>
                    #{p.id.slice(0, 8)} — {money(p.amount)} — {translatePaymentMethod(p.paymentMethod)}
                  </option>
                ))}
              </Select>
            </FormField>
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField label="مبلغ المرتجع (فاضي = كامل)">
                <input type="number" min={0.01} step={0.01} value={refundAmount} onChange={e => setRefundAmount(e.target.value)} placeholder="اتركه فاضي لمرتجع كامل"
                  className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-right text-sm outline-none focus:border-slate-900 focus:ring-2 focus:ring-slate-900/10" />
              </FormField>
              <FormField label="سبب المرتجع">
                <input value={refundReason} onChange={e => setRefundReason(e.target.value)} placeholder="اختياري..."
                  className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-right text-sm outline-none focus:border-slate-900 focus:ring-2 focus:ring-slate-900/10" />
              </FormField>
            </div>
            <Btn type="submit" variant="danger" loading={refundMutation.isPending} loadingText="جاري التسجيل..." icon={<RotateCcw size={14} />} className="w-full">
              سجّل المرتجع
            </Btn>
          </form>
        )}
      </Panel>

      {/* Invoices list */}
      <div className="grid gap-4 lg:grid-cols-2">
        <Panel title="الفواتير" icon={<Receipt size={15} />} action={
          <span className="text-xs text-slate-500">{invoices.length} فاتورة</span>
        }>
          {invoicesQuery.isLoading ? (
            <div className="flex justify-center py-8"><RefreshCw size={20} className="animate-spin text-slate-400" /></div>
          ) : invoices.length === 0 ? (
            <EmptyState icon={<Receipt size={36} />} title="مفيش فواتير لحد دلوقتي" sub="اعمل أول فاتورة من فوق." />
          ) : (
            <div className="space-y-2 max-h-[32rem] overflow-y-auto">
              {invoices.map(inv => (
                <InvoiceRow key={inv.id} invoice={inv}
                  selected={selectedInvoiceId === inv.id}
                  onSelect={() => setSelectedInvoiceId(prev => prev === inv.id ? null : inv.id)} />
              ))}
            </div>
          )}
        </Panel>

        {/* Invoice detail */}
        <div className="space-y-4">
          {selectedInvoiceId && selectedInvoiceQuery.data ? (
            <>
              <Panel title={`تفاصيل — ${selectedInvoiceQuery.data.invoiceNumber}`} icon={<FileText size={15} />} action={
                <Btn size="sm" variant="ghost" onClick={() => setSelectedInvoiceId(null)}>✕</Btn>
              }>
                <dl className="divide-y divide-slate-100">
                  {[
                    { label: "الحالة",   value: <Badge tone={statusBadgeTone(selectedInvoiceQuery.data.paymentStatus)}>{translateStatus(selectedInvoiceQuery.data.paymentStatus)}</Badge> },
                    { label: "الإجمالي", value: <span className="font-bold text-slate-900">{money(selectedInvoiceQuery.data.totalAmount)}</span> },
                    { label: "المدفوع",  value: <span className="font-bold text-emerald-700">{money(selectedInvoiceQuery.data.amountPaid)}</span> },
                    { label: "المتبقي",  value: <span className={`font-bold ${Number(selectedInvoiceQuery.data.remainingAmount) > 0 ? "text-rose-700" : "text-slate-400"}`}>{money(selectedInvoiceQuery.data.remainingAmount)}</span> },
                  ].map(({ label, value }) => (
                    <div key={label} className="flex items-center justify-between py-2.5">
                      <span>{value}</span>
                      <span className="text-sm text-slate-500">{label}</span>
                    </div>
                  ))}
                </dl>

                {selectedInvoiceQuery.data.items && selectedInvoiceQuery.data.items.length > 0 && (
                  <div className="mt-4">
                    <p className="mb-2 text-xs font-semibold text-slate-500">بنود الفاتورة</p>
                    <div className="space-y-1">
                      {selectedInvoiceQuery.data.items.map((item, i) => (
                        <div key={i} className="flex justify-between rounded-lg bg-slate-50 px-3 py-2 text-xs">
                          <span className="font-bold text-slate-800">{money(item.total)}</span>
                          <span className="text-slate-600">{item.description ?? item.itemType}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </Panel>

              {/* Payment history */}
              <Panel title="حركة المدفوعات" icon={<Banknote size={15} />}>
                {selectedInvoicePaymentsQuery.isLoading ? (
                  <p className="py-4 text-center text-sm text-slate-500">جاري التحميل...</p>
                ) : (selectedInvoicePaymentsQuery.data?.data?.length ?? 0) === 0 ? (
                  <EmptyState icon={<CreditCard size={28} />} title="لا توجد مدفوعات بعد" />
                ) : (
                  <div className="space-y-2">
                    {selectedInvoicePaymentsQuery.data?.data?.map((p) => (
                      <div key={p.id} className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-emerald-700">{money(p.amount)}</span>
                          <Badge tone="neutral">{translatePaymentMethod(p.paymentMethod)}</Badge>
                        </div>
                        <div className="text-right">
                          <p className="font-mono text-[10px] text-slate-400">#{p.id.slice(0, 8)}</p>
                          <p className="text-[10px] text-slate-500">{dateTime(p.paidAt)}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </Panel>
            </>
          ) : (
            <Panel title="تفاصيل الفاتورة" icon={<FileText size={15} />}>
              <EmptyState icon={<Receipt size={36} />} title="اختر فاتورة من القائمة" sub="اضغط على أي فاتورة لتشوف تفاصيلها وحركة مدفوعاتها." />
            </Panel>
          )}

          {/* Recent payments */}
          <Panel title="آخر المدفوعات" icon={<CreditCard size={15} />}>
            {payments.length === 0 ? (
              <EmptyState icon={<CreditCard size={28} />} title="مفيش مدفوعات لحد دلوقتي" />
            ) : (
              <div className="space-y-1.5">
                {payments.slice(0, 8).map(p => (
                  <div key={p.id} className="flex items-center justify-between rounded-xl border border-slate-100 px-3 py-2 text-xs">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-emerald-700">{money(p.amount)}</span>
                      <span className="text-slate-500">{translatePaymentMethod(p.paymentMethod)}</span>
                    </div>
                    <span className="text-slate-400">{dateTime(p.paidAt)}</span>
                  </div>
                ))}
              </div>
            )}
          </Panel>
        </div>
      </div>
    </div>
  );
}
