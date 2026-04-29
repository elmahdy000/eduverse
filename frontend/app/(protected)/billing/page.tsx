"use client";

import { FormEvent, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { 
  Receipt, CreditCard, RotateCcw, RefreshCw, 
  Banknote, FileText, CheckCircle2, AlertCircle, 
  Wallet, Search, User, ArrowLeft, History,
  Filter, PlusCircle
} from "lucide-react";
import { api } from "../../../lib/api";
import { translateApiError } from "../../../lib/errors";
import { dateTime, money } from "../../../lib/format";
import { translatePaymentMethod, translateStatus } from "../../../lib/labels";
import type { Customer, Invoice, Paginated, Payment, Session } from "../../../lib/types";
import { 
  Alert, Badge, Btn, EmptyState, FormField, 
  Input, Panel, SectionTitle, Select, 
  StatCard, statusBadgeTone 
} from "../../../components/ui";
import { InvoiceReceipt } from "../../../components/InvoiceReceipt";
import clsx from "clsx";

interface InvoicePaymentsSummary {
  data: Payment[];
  total: number;
  totalRecorded: number;
  remainingAmount: number;
}

function InvoiceListItem({ invoice, onSelect, selected }: {
  invoice: Invoice;
  onSelect: () => void;
  selected: boolean;
}) {
  const isPaid = invoice.paymentStatus === "paid";
  const progress = (Number(invoice.amountPaid) / Number(invoice.totalAmount)) * 100;
  
  return (
    <div
      onClick={onSelect}
      className={clsx(
        "group cursor-pointer rounded-2xl border p-4 transition-all duration-200",
        selected 
          ? "border-slate-900 bg-slate-900 text-white shadow-lg shadow-slate-900/10" 
          : "border-slate-200 bg-white hover:border-slate-400 hover:shadow-md"
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="text-right">
          <p className={clsx("font-mono text-xs font-black", selected ? "text-slate-100" : "text-slate-900")}>
            {invoice.invoiceNumber}
          </p>
          <p className={clsx("mt-0.5 text-[10px]", selected ? "text-slate-400" : "text-slate-500")}>
            {dateTime(invoice.issuedAt)}
          </p>
        </div>
        <Badge tone={selected ? "neutral" : statusBadgeTone(invoice.paymentStatus)}>
          {translateStatus(invoice.paymentStatus)}
        </Badge>
      </div>

      <div className="mt-4 flex items-center justify-between">
        <div className="flex flex-col">
          <span className={clsx("text-[10px] uppercase font-bold", selected ? "text-slate-400" : "text-slate-500")}>العميل</span>
          <span className="text-xs font-bold truncate max-w-[120px]">{invoice.customer?.fullName ?? "—"}</span>
        </div>
        <div className="text-left">
          <span className={clsx("text-[10px] uppercase font-bold", selected ? "text-slate-400" : "text-slate-500")}>المبلغ</span>
          <p className="text-sm font-black">{money(invoice.totalAmount)}</p>
        </div>
      </div>

      {/* Mini Progress Bar */}
      <div className="mt-4 space-y-1.5">
        <div className="flex justify-between text-[9px] font-bold uppercase">
          <span className={selected ? "text-slate-400" : "text-slate-500"}>تم سداد {Math.round(progress)}%</span>
        </div>
        <div className={clsx("h-1 w-full overflow-hidden rounded-full", selected ? "bg-white/20" : "bg-slate-100")}>
          <div 
            className={clsx("h-full transition-all duration-500", selected ? "bg-white" : isPaid ? "bg-emerald-500" : "bg-slate-900")} 
            style={{ width: `${progress}%` }} 
          />
        </div>
      </div>
    </div>
  );
}

export default function BillingPage() {
  const qc = useQueryClient();

  const [invoiceId, setInvoiceId] = useState("");
  const [amount, setAmount] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [paymentNotes, setPaymentNotes] = useState("");
  const [refundPaymentId, setRefundPaymentId] = useState("");
  const [refundAmount, setRefundAmount] = useState("");
  const [refundReason, setRefundReason] = useState("");
  const [selectedInvoiceId, setSelectedInvoiceId] = useState<string | null>(null);
  const [message, setMessage] = useState<{ text: string; ok: boolean } | null>(null);
  
  const [explorerTab, setExplorerTab] = useState<"invoices" | "search">("invoices");
  const [searchName, setSearchName] = useState("");
  const [searchPhone, setSearchPhone] = useState("");
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);

  const invoicesQuery = useQuery({
    queryKey: ["invoices", explorerTab === "invoices"],
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
    enabled: explorerTab === "search" && (Boolean(searchName) || Boolean(searchPhone)),
  });

  const customerInvoicesQuery = useQuery({
    queryKey: ["customers", selectedCustomerId, "invoices"],
    enabled: explorerTab === "search" && Boolean(selectedCustomerId),
    queryFn: async () => {
      const r = await api.get("/invoices", {
        params: { customerId: selectedCustomerId, page: 1, limit: 50 }
      });
      return r.data.data as Paginated<Invoice>;
    },
  });

  const payMutation = useMutation({
    mutationFn: () => api.post("/payments", { 
      invoiceId: selectedInvoiceId, 
      paymentMethod, 
      amount: Number(amount), 
      notes: paymentNotes || undefined 
    }),
    onSuccess: () => {
      setAmount(""); setPaymentNotes("");
      setMessage({ text: "تم تسجيل الدفع بنجاح! ✓", ok: true });
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

  const refundMutation = useMutation({
    mutationFn: () => api.post(`/payments/${refundPaymentId}/refund`, {
      amount: refundAmount ? Number(refundAmount) : undefined,
      reason: refundReason || undefined,
    }),
    onSuccess: () => {
      setRefundPaymentId(""); setRefundAmount(""); setRefundReason("");
      setMessage({ text: "تم تسجيل المرتجع بنجاح. ✓", ok: true });
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
  const totalCollected = payments.reduce((s, p) => s + Number(p.amount), 0);
  const paidCount = invoices.filter(i => i.paymentStatus === "paid").length;
  const pendingCount = invoices.filter(i => i.paymentStatus !== "paid").length;

  return (
    <div className="space-y-6" dir="rtl">
      <SectionTitle
        title="المالية والفواتير"
        subtitle="إدارة المدفوعات، تحصيل الفواتير، ومتابعة السجلات المالية بدقة."
        icon={<Receipt size={20} />}
        action={
          <div className="flex gap-2">
            <Btn size="sm" variant="secondary" onClick={() => { invoicesQuery.refetch(); paymentsQuery.refetch(); }} icon={<RefreshCw size={12} />}>
              تحديث البيانات
            </Btn>
          </div>
        }
      />

      {message && <Alert tone={message.ok ? "success" : "danger"}>{message.text}</Alert>}

      {/* Top Stats Overview */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="إجمالي الفواتير" value={invoices.length} icon={<Receipt size={18} />} />
        <StatCard label="فواتير مُحصلة" value={paidCount} tone="success" icon={<CheckCircle2 size={18} />} />
        <StatCard label="فواتير معلقة" value={pendingCount} tone={pendingCount > 0 ? "warn" : "success"} icon={<AlertCircle size={18} />} />
        <StatCard label="إجمالي التحصيل" value={money(totalCollected)} tone="success" icon={<Wallet size={18} />} />
      </div>

      <div className="grid gap-6 lg:grid-cols-[400px_1fr]">
        
        {/* Left Column: Explorer */}
        <div className="space-y-4">
          <Panel className="p-0 overflow-hidden">
            <div className="flex border-b border-slate-100">
              <button 
                onClick={() => setExplorerTab("invoices")}
                className={clsx(
                  "flex-1 py-4 text-xs font-bold transition-all",
                  explorerTab === "invoices" ? "bg-slate-900 text-white" : "bg-white text-slate-500 hover:bg-slate-50"
                )}
              >
                قائمة الفواتير
              </button>
              <button 
                onClick={() => setExplorerTab("search")}
                className={clsx(
                  "flex-1 py-4 text-xs font-bold transition-all",
                  explorerTab === "search" ? "bg-slate-900 text-white" : "bg-white text-slate-500 hover:bg-slate-50"
                )}
              >
                بحث عن عميل
              </button>
            </div>

            <div className="p-4">
              {explorerTab === "invoices" ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">أحدث الفواتير</p>
                    <Filter size={14} className="text-slate-400" />
                  </div>
                  {invoicesQuery.isLoading ? (
                    <div className="flex justify-center py-12"><RefreshCw size={24} className="animate-spin text-slate-300" /></div>
                  ) : invoices.length === 0 ? (
                    <EmptyState title="لا توجد فواتير" sub="لم يتم إصدار فواتير بعد." />
                  ) : (
                    <div className="space-y-2 max-h-[600px] overflow-y-auto pr-1 custom-scrollbar">
                      {invoices.map(inv => (
                        <InvoiceListItem 
                          key={inv.id} 
                          invoice={inv} 
                          selected={selectedInvoiceId === inv.id}
                          onSelect={() => setSelectedInvoiceId(inv.id)} 
                        />
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="space-y-3">
                    <FormField label="الاسم">
                      <Input 
                        value={searchName} 
                        onChange={e => setSearchName(e.target.value)} 
                        placeholder="بحث بالاسم..." 
                        icon={<User size={14} />} 
                      />
                    </FormField>
                    <FormField label="رقم الهاتف">
                      <Input 
                        value={searchPhone} 
                        onChange={e => setSearchPhone(e.target.value)} 
                        placeholder="01xxxxxxxxx" 
                        dir="ltr"
                      />
                    </FormField>
                  </div>

                  {customersSearchQuery.data?.data && (
                    <div className="mt-4 space-y-2 border-t border-slate-100 pt-4">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">نتائج البحث</p>
                      {customersSearchQuery.data.data.map(customer => (
                        <div 
                          key={customer.id}
                          onClick={() => setSelectedCustomerId(customer.id)}
                          className={clsx(
                            "cursor-pointer rounded-xl border p-3 transition-all",
                            selectedCustomerId === customer.id ? "border-slate-900 bg-slate-50" : "border-slate-200 hover:border-slate-400"
                          )}
                        >
                          <p className="text-sm font-bold text-slate-900">{customer.fullName}</p>
                          <p className="text-xs text-slate-500 font-mono" dir="ltr">{customer.phoneNumber}</p>
                        </div>
                      ))}
                    </div>
                  )}

                  {selectedCustomerId && customerInvoicesQuery.data?.data && (
                    <div className="mt-4 space-y-2 border-t border-slate-100 pt-4">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">فواتير العميل</p>
                      {customerInvoicesQuery.data.data.map(inv => (
                        <InvoiceListItem 
                          key={inv.id} 
                          invoice={inv} 
                          selected={selectedInvoiceId === inv.id}
                          onSelect={() => setSelectedInvoiceId(inv.id)} 
                        />
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </Panel>

          {/* Activity Mini Panel */}
          <Panel title="أحدث العمليات" icon={<History size={14} />}>
             <div className="space-y-3">
               {payments.slice(0, 5).map(p => (
                 <div key={p.id} className="flex items-center justify-between text-xs">
                   <div className="flex items-center gap-2">
                     <div className="h-2 w-2 rounded-full bg-emerald-500" />
                     <span className="font-bold text-slate-700">{money(p.amount)}</span>
                   </div>
                   <span className="text-slate-400 font-mono">{dateTime(p.paidAt).split(",")[1]}</span>
                 </div>
               ))}
             </div>
          </Panel>
        </div>

        {/* Right Column: Workspace */}
        <div className="space-y-6">
          {!selectedInvoiceId ? (
            <div className="flex flex-col items-center justify-center rounded-3xl border-2 border-dashed border-slate-200 bg-slate-50/50 py-32 text-center">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-white text-slate-300 shadow-sm">
                <Receipt size={32} />
              </div>
              <h3 className="text-lg font-bold text-slate-900">لم يتم اختيار فاتورة</h3>
              <p className="mx-auto max-w-[240px] text-sm text-slate-500">اختر فاتورة من القائمة اليمنى لعرض التفاصيل وتسجيل المدفوعات.</p>
            </div>
          ) : selectedInvoiceQuery.isLoading ? (
            <div className="flex justify-center py-32"><RefreshCw size={32} className="animate-spin text-slate-200" /></div>
          ) : selectedInvoiceQuery.data ? (
            <div className="space-y-6">
              
              {/* Invoice Preview Section */}
              <InvoiceReceipt 
                invoice={selectedInvoiceQuery.data} 
                payments={selectedInvoicePaymentsQuery.data?.data}
                onPrint={() => window.print()}
              />

              {/* Payment Actions Grid */}
              <div className="grid gap-6 md:grid-cols-2">
                
                {/* Record Payment */}
                {selectedInvoiceQuery.data.paymentStatus !== "paid" && (
                  <Panel title="تحصيل مبلغ" icon={<CreditCard size={16} />} className="shadow-lg border-emerald-100 bg-emerald-50/10">
                    <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); setMessage(null); payMutation.mutate(); }}>
                      <div className="grid gap-4 sm:grid-cols-2">
                        <FormField label="طريقة الدفع">
                          <Select value={paymentMethod} onChange={e => setPaymentMethod(e.target.value)}>
                            <option value="cash">💵 نقدي (كاش)</option>
                            <option value="card">💳 بطاقة بنكية</option>
                            <option value="bank_transfer"> تحويل بنكي</option>
                            <option value="mixed">🔀 مختلط</option>
                          </Select>
                        </FormField>
                        <FormField label="المبلغ (جنيه)">
                          <Input 
                            type="number" min={0.01} step={0.01} 
                            value={amount} onChange={e => setAmount(e.target.value)} 
                            placeholder={String(selectedInvoiceQuery.data?.remainingAmount)}
                            required 
                          />
                        </FormField>
                      </div>
                      <FormField label="ملاحظات التحصيل (اختياري)">
                        <Input value={paymentNotes} onChange={e => setPaymentNotes(e.target.value)} placeholder="رقم العملية، ملاحظات..." />
                      </FormField>
                      <Btn type="submit" loading={payMutation.isPending} loadingText="جاري التحصيل..." icon={<Banknote size={16} />} className="w-full bg-emerald-600 hover:bg-emerald-700">
                        تأكيد تحصيل المبلغ
                      </Btn>
                    </form>
                  </Panel>
                )}

                {/* Refund Panel */}
                <Panel title="طلب مرتجع" icon={<RotateCcw size={16} />} className="shadow-lg">
                  <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); setMessage(null); refundMutation.mutate(); }}>
                    <FormField label="اختر عملية الدفع">
                      <Select value={refundPaymentId} onChange={e => setRefundPaymentId(e.target.value)} required>
                        <option value="">-- اختر العملية --</option>
                        {selectedInvoicePaymentsQuery.data?.data?.map(p => (
                          <option key={p.id} value={p.id}>
                            {money(p.amount)} — {translatePaymentMethod(p.paymentMethod)} ({dateTime(p.paidAt).split(",")[0]})
                          </option>
                        ))}
                      </Select>
                    </FormField>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <FormField label="المبلغ">
                        <Input 
                          type="number" min={0.01} step={0.01} 
                          value={refundAmount} onChange={e => setRefundAmount(e.target.value)} 
                          placeholder="مبلغ المرتجع..."
                        />
                      </FormField>
                      <FormField label="السبب">
                        <Input value={refundReason} onChange={e => setRefundReason(e.target.value)} placeholder="سبب المرتجع..." />
                      </FormField>
                    </div>
                    <Btn type="submit" variant="danger" loading={refundMutation.isPending} loadingText="جاري المعالجة..." icon={<RotateCcw size={14} />} className="w-full">
                      تأكيد المرتجع
                    </Btn>
                  </form>
                </Panel>
              </div>

              {/* Transactions History Table */}
              <Panel title="سجل المعاملات لهذه الفاتورة" icon={<History size={16} />}>
                <div className="overflow-x-auto">
                  <table className="w-full text-right text-sm">
                    <thead>
                      <tr className="border-b border-slate-100 text-[10px] font-black text-slate-400 uppercase">
                        <th className="pb-3 pr-4">العملية</th>
                        <th className="pb-3 px-4">التاريخ</th>
                        <th className="pb-3 px-4">الوسيلة</th>
                        <th className="pb-3 pl-4 text-left">المبلغ</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {selectedInvoicePaymentsQuery.data?.data?.map((p) => (
                        <tr key={p.id} className="group">
                          <td className="py-3 pr-4 font-mono text-[10px] text-slate-400 group-hover:text-slate-900 transition-colors">#{p.id.slice(0, 8)}</td>
                          <td className="py-3 px-4 text-slate-600">{dateTime(p.paidAt)}</td>
                          <td className="py-3 px-4">
                            <Badge tone="neutral">{translatePaymentMethod(p.paymentMethod)}</Badge>
                          </td>
                          <td className="py-3 pl-4 text-left font-black text-emerald-700">{money(p.amount)}</td>
                        </tr>
                      ))}
                      {(selectedInvoicePaymentsQuery.data?.data?.length ?? 0) === 0 && (
                        <tr>
                          <td colSpan={4} className="py-8 text-center text-slate-400">لا توجد عمليات دفع مسجلة بعد.</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </Panel>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
