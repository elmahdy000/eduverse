"use client";

import { Printer, Download, Receipt, User, Calendar } from "lucide-react";
import { money, dateTime } from "../lib/format";
import { translateStatus } from "../lib/labels";
import clsx from "clsx";
import { Badge, statusBadgeTone, Btn } from "./ui";
import type { Invoice, Payment } from "../lib/types";

interface InvoiceReceiptProps {
  invoice: Invoice;
  payments?: Payment[];
  onPrint?: () => void;
  onDownload?: () => void;
}

function itemTypeLabel(itemType: string) {
  switch (itemType) {
    case "session": return "جلسة";
    case "bar_order": return "بار";
    case "discount": return "خصم";
    default: return "بند";
  }
}

export function InvoiceReceipt({ invoice, payments = [], onPrint, onDownload }: InvoiceReceiptProps) {
  const isPaid = invoice.paymentStatus === "paid";
  const totalAmount = Math.round(Number(invoice.totalAmount || 0));
  const amountPaid = Math.round(Number(invoice.amountPaid || 0));
  const remainingAmount = Math.round(Number(invoice.remainingAmount || 0));
  const subtotal = Math.round(Number(invoice.subtotal ?? totalAmount));
  const discountAmount = Math.round(Number(invoice.discountAmount ?? 0));
  const taxAmount = Math.round(Number(invoice.taxAmount ?? 0));
  const progress = totalAmount > 0 ? Math.min(100, (amountPaid / totalAmount) * 100) : 100;

  return (
    <div className="flex flex-col gap-6 overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-xl">
      <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/50 px-6 py-4 no-print">
        <div className="flex items-center gap-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-900 text-white shadow-lg shadow-slate-900/20">
            <Receipt size={20} />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900">معاينة الفاتورة</h3>
            <p className="text-[10px] font-medium uppercase tracking-wider text-slate-500">{invoice.invoiceNumber}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Btn size="sm" variant="secondary" icon={<Download size={14} />} onClick={onDownload}>تحميل نسخة</Btn>
          <Btn size="sm" variant="primary" icon={<Printer size={14} />} onClick={onPrint}>طباعة</Btn>
        </div>
      </div>

      <div id="printable-invoice" className="px-8 pb-8 pt-2 text-right" dir="rtl">
        {/* Receipt Styles for Printing */}
        <style dangerouslySetInnerHTML={{ __html: `
          @media print {
            @page { size: 80mm auto; margin: 0; }
            body { background: white !important; color: black !important; font-family: 'Courier New', Courier, monospace !important; width: 80mm !important; }
            #printable-invoice { width: 80mm !important; padding: 5mm !important; margin: 0 auto !important; box-shadow: none !important; border: none !important; }
            .no-print { display: none !important; }
            .receipt-divider { border-top: 1px dashed black !important; margin: 8px 0 !important; height: 1px !important; }
            .receipt-header { text-align: center !important; margin-bottom: 15px !important; }
            .receipt-title { font-size: 20px !important; font-weight: 900 !important; margin-bottom: 2px !important; }
            .receipt-table { width: 100% !important; border-collapse: collapse !important; font-size: 12px !important; }
            .receipt-table th { border-bottom: 1px solid black !important; padding: 4px 0 !important; text-align: right !important; }
            .receipt-table td { padding: 6px 0 !important; border-bottom: 1px solid #eee !important; }
            .receipt-total-box { margin-top: 15px !important; border: 2px solid black !important; padding: 8px !important; text-align: center !important; }
            .receipt-total-label { font-size: 12px !important; font-weight: bold !important; }
            .receipt-total-value { font-size: 22px !important; font-weight: 900 !important; }
            * { transition: none !important; animation: none !important; }
          }
        `}} />

        <div className="receipt-header mb-8 flex flex-col items-center justify-center gap-1 border-b border-slate-100 pb-6 print:border-none print:mb-2">
          <h1 className="receipt-title text-2xl font-black tracking-tight text-slate-900">EDUVERSE</h1>
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest print:text-black print:text-[8px]">Workspace & Education Hub</p>
          <div className="mt-2 hidden print:block text-[10px] text-black border-t border-black pt-1 w-full">
            تاريخ: {dateTime(invoice.issuedAt)}
            <br />
            رقم: {invoice.invoiceNumber}
          </div>
          <div className="no-print">
            <Badge tone={statusBadgeTone(invoice.paymentStatus)}>
              {translateStatus(invoice.paymentStatus)}
            </Badge>
          </div>
        </div>

        <div className="mb-8 grid gap-6 sm:grid-cols-2 print:grid-cols-1 print:gap-1 print:mb-4">
          <div className="space-y-4 print:space-y-0">
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 text-slate-600 print:hidden">
                <User size={16} />
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase text-slate-400 print:text-black print:text-[9px]">العميل</p>
                <p className="text-sm font-bold text-slate-900 print:text-xs">{invoice.customer?.fullName ?? "عميل غير معروف"}</p>
                <p className="font-mono text-xs text-slate-500 print:text-[9px] print:text-black" dir="ltr">{invoice.customer?.phoneNumber}</p>
              </div>
            </div>
          </div>
          <div className="space-y-4 sm:text-left print:hidden no-print">
            <div className="flex items-center gap-3 sm:flex-row-reverse">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 text-slate-600">
                <Calendar size={16} />
              </div>
              <div className="text-right sm:text-left">
                <p className="text-[10px] font-bold uppercase text-slate-400">تاريخ الإصدار</p>
                <p className="text-sm font-bold text-slate-900">{dateTime(invoice.issuedAt)}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="receipt-divider hidden print:block" />

        <div className="mb-8 overflow-hidden rounded-2xl border border-slate-200 print:border-none print:mb-2">
          <table className="receipt-table w-full text-right text-sm">
            <thead className="bg-slate-50 text-xs font-bold uppercase text-slate-500 print:bg-white print:text-black">
              <tr>
                <th className="px-4 py-3 print:px-0 print:py-1">البند</th>
                <th className="px-4 py-3 text-left print:px-0 print:py-1">المبلغ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 print:divide-black/10">
              {(invoice.items ?? []).map((item, idx) => (
                <tr key={idx} className="transition hover:bg-slate-50/50">
                  <td className="px-4 py-4 font-medium text-slate-900 print:px-0 print:py-2 print:text-[11px]">
                    {item.description || "بند خدمة"}
                    <span className="hidden print:inline text-[9px] text-black/60 block">
                      ({itemTypeLabel(item.itemType)})
                    </span>
                  </td>
                  <td className="px-4 py-4 text-left font-mono font-bold text-slate-900 print:px-0 print:text-[11px]">{money(item.total)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="receipt-divider hidden print:block" />

        <div className="grid gap-8 lg:grid-cols-2 print:grid-cols-1 print:gap-1">
          <div className="rounded-2xl bg-slate-50 p-6 print:hidden no-print">
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
          </div>

          <div className="space-y-3 px-2 print:px-0 print:space-y-1">
            <div className="flex justify-between text-sm text-slate-500 print:text-[11px] print:text-black">
              <span>المجموع الفرعي</span>
              <span className="font-mono">{money(subtotal)}</span>
            </div>
            {discountAmount > 0 && (
              <div className="flex justify-between text-sm text-slate-500 print:text-[11px] print:text-black">
                <span>الخصم</span>
                <span className="font-mono">-{money(discountAmount)}</span>
              </div>
            )}
            <div className="flex justify-between border-t border-slate-200 pt-3 text-lg font-black text-slate-900 print:border-black print:pt-1">
              <span className="print:text-xs">الإجمالي النهائي</span>
              <span className="font-mono print:text-xl">{money(totalAmount)}</span>
            </div>
            <div className="hidden print:block text-[9px] font-bold border-t border-dashed border-black mt-1 pt-1">
              المدفوع: {money(amountPaid)} | المتبقي: {money(remainingAmount)}
            </div>
          </div>
        </div>

        <div className="receipt-total-box hidden print:block mt-6">
          <p className="receipt-total-label print:text-[10px]">برجاء سداد المبلغ المطلوب</p>
          <p className="receipt-total-value">{money(totalAmount)}</p>
        </div>

        <div className="mt-12 rounded-xl border border-dashed border-slate-200 p-4 text-center print:border-none print:mt-4 print:p-0">
          <p className="text-xs font-medium text-slate-500 print:text-black print:font-bold print:text-[11px]">شكراً لزيارتكم إيدوفيرس!</p>
          <p className="mt-1 font-mono text-[10px] text-slate-400 print:text-black print:text-[8px]">eduvers.space | {invoice.id.slice(0,8)}</p>
        </div>
      </div>
    </div>
  );
}
