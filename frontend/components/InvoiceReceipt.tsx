"use client";

import { Printer, Download, Share2, Receipt, User, Calendar, Clock, DollarSign } from "lucide-react";
import { money, dateTime } from "../lib/format";
import { translateStatus, translatePaymentMethod } from "../lib/labels";
import clsx from "clsx";
import { Badge, statusBadgeTone, Btn } from "./ui";
import type { Invoice, Payment } from "../lib/types";

interface InvoiceReceiptProps {
  invoice: Invoice;
  payments?: Payment[];
  onPrint?: () => void;
}

export function InvoiceReceipt({ invoice, payments = [], onPrint }: InvoiceReceiptProps) {
  const isPaid = invoice.paymentStatus === "paid";
  const progress = Math.min(100, (Number(invoice.amountPaid) / Number(invoice.totalAmount)) * 100);

  return (
    <div className="flex flex-col gap-6 overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-xl">
      {/* Header / Actions */}
      <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/50 px-6 py-4">
        <div className="flex items-center gap-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-900 text-white shadow-lg shadow-slate-900/20">
            <Receipt size={20} />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900">معاينة الفاتورة</h3>
            <p className="text-[10px] font-medium text-slate-500 uppercase tracking-wider">{invoice.invoiceNumber}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Btn size="sm" variant="secondary" icon={<Download size={14} />}>تحميل PDF</Btn>
          <Btn size="sm" variant="primary" icon={<Printer size={14} />} onClick={onPrint}>طباعة</Btn>
        </div>
      </div>

      {/* Main Content (Printable Area) */}
      <div id="printable-invoice" className="px-8 pb-8 pt-2 text-right" dir="rtl">
        {/* Brand Section */}
        <div className="mb-8 flex items-start justify-between border-b border-slate-100 pb-6">
          <div>
            <h1 className="text-2xl font-black tracking-tight text-slate-900">EDUVERSE</h1>
            <p className="text-xs text-slate-500">مساحة عمل مشتركة وبيئة تعليمية</p>
          </div>
          <div className="text-left">
            <Badge tone={statusBadgeTone(invoice.paymentStatus)}>
              {translateStatus(invoice.paymentStatus)}
            </Badge>
          </div>
        </div>

        {/* Info Grid */}
        <div className="mb-8 grid gap-6 sm:grid-cols-2">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 text-slate-600">
                <User size={16} />
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase">إلى العميل</p>
                <p className="text-sm font-bold text-slate-900">{invoice.customer?.fullName ?? "عميل غير معروف"}</p>
                <p className="text-xs text-slate-500 font-mono" dir="ltr">{invoice.customer?.phoneNumber}</p>
              </div>
            </div>
          </div>
          <div className="space-y-4 sm:text-left">
            <div className="flex items-center gap-3 sm:flex-row-reverse">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 text-slate-600">
                <Calendar size={16} />
              </div>
              <div className="sm:text-left text-right">
                <p className="text-[10px] font-bold text-slate-400 uppercase">تاريخ الإصدار</p>
                <p className="text-sm font-bold text-slate-900">{dateTime(invoice.issuedAt)}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Items Table */}
        <div className="mb-8 overflow-hidden rounded-2xl border border-slate-200">
          <table className="w-full text-right text-sm">
            <thead className="bg-slate-50 text-xs font-bold text-slate-500 uppercase">
              <tr>
                <th className="px-4 py-3">الوصف</th>
                <th className="px-4 py-3 text-center">النوع</th>
                <th className="px-4 py-3 text-left">المبلغ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {(invoice.items ?? []).map((item, idx) => (
                <tr key={idx} className="transition hover:bg-slate-50/50">
                  <td className="px-4 py-4 font-medium text-slate-900">{item.description || "خدمة / منتج"}</td>
                  <td className="px-4 py-4 text-center">
                    <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[10px] text-slate-600 font-bold">
                      {item.itemType === "session" ? "جلسة" : item.itemType === "bar" ? "بار" : "أخرى"}
                    </span>
                  </td>
                  <td className="px-4 py-4 text-left font-mono font-bold text-slate-900">{money(item.total)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Summary & Progress */}
        <div className="grid gap-8 lg:grid-cols-2">
          {/* Payment Progress */}
          <div className="rounded-2xl bg-slate-50 p-6">
            <div className="mb-4 flex items-center justify-between">
              <h4 className="text-xs font-bold text-slate-900">حالة السداد</h4>
              <span className="text-xs font-black text-slate-900">{Math.round(progress)}%</span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-slate-200">
              <div 
                className={clsx("h-full transition-all duration-500", isPaid ? "bg-emerald-500" : "bg-slate-900")} 
                style={{ width: `${progress}%` }} 
              />
            </div>
            <div className="mt-4 flex justify-between text-[11px] font-bold">
              <div className="text-right">
                <p className="text-slate-400 uppercase">المدفوع</p>
                <p className="text-emerald-700">{money(invoice.amountPaid)}</p>
              </div>
              <div className="text-left">
                <p className="text-slate-400 uppercase">المتبقي</p>
                <p className="text-rose-600">{money(invoice.remainingAmount)}</p>
              </div>
            </div>
          </div>

          {/* Totals */}
          <div className="space-y-3 px-2">
            <div className="flex justify-between text-sm text-slate-500">
              <span>المجموع الفرعي</span>
              <span className="font-mono">{money(invoice.totalAmount)}</span>
            </div>
            <div className="flex justify-between text-sm text-slate-500">
              <span>الضريبة (0%)</span>
              <span className="font-mono">{money(0)}</span>
            </div>
            <div className="flex justify-between border-t border-slate-200 pt-3 text-lg font-black text-slate-900">
              <span>الإجمالي النهائي</span>
              <span className="font-mono">{money(invoice.totalAmount)}</span>
            </div>
          </div>
        </div>

        {/* Footer Notes */}
        <div className="mt-12 rounded-xl border border-dashed border-slate-200 p-4 text-center">
          <p className="text-xs font-medium text-slate-500">شكراً لثقتكم في Eduverse. نتمنى لكم تجربة عمل مثمرة.</p>
          <p className="mt-1 text-[10px] text-slate-400 font-mono">ID: {invoice.id}</p>
        </div>
      </div>
    </div>
  );
}
