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
    <div className="flex flex-col gap-0 overflow-hidden rounded-[2.5rem] border border-slate-200 bg-white shadow-2xl relative">
      {/* Paid Stamp Overlay */}
      {isPaid && (
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-0 opacity-[0.08] pointer-events-none rotate-12 select-none no-print">
          <div className="border-8 border-emerald-600 rounded-2xl px-8 py-4 flex flex-col items-center">
            <span className="text-8xl font-black text-emerald-600 tracking-tighter">PAID</span>
            <span className="text-2xl font-bold text-emerald-600 uppercase tracking-[0.5em] mt-[-10px]">VERIFIED</span>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/80 backdrop-blur-sm px-8 py-5 no-print relative z-10">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-900 text-white shadow-xl shadow-slate-900/20">
            <Receipt size={24} />
          </div>
          <div>
            <h3 className="text-sm font-black text-slate-900">معاينة الفاتورة</h3>
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
              #{invoice.invoiceNumber.split('-').pop()} • {dateTime(invoice.issuedAt).split(' ')[0]}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Btn size="sm" variant="secondary" className="bg-white/50 border-white" icon={<Download size={14} />} onClick={onDownload}>تحميل</Btn>
          <Btn size="sm" variant="primary" className="shadow-lg shadow-amber-500/20" icon={<Printer size={14} />} onClick={onPrint}>طباعة</Btn>
        </div>
      </div>

      <div id="printable-invoice" className="px-10 pb-10 pt-4 text-right relative z-10" dir="rtl">
        {/* Receipt Styles for Printing */}
        <style dangerouslySetInnerHTML={{ __html: `
          @media print {
            @page { size: 80mm auto; margin: 0; }
            body { background: white !important; color: black !important; font-family: 'Inter', system-ui, sans-serif !important; width: 80mm !important; }
            #printable-invoice { width: 80mm !important; padding: 6mm !important; margin: 0 auto !important; box-shadow: none !important; border: none !important; }
            .no-print { display: none !important; }
            .receipt-divider { border-top: 1.5px dashed #000 !important; margin: 10px 0 !important; height: 1px !important; }
            .receipt-header { text-align: center !important; margin-bottom: 15px !important; }
            .receipt-title { font-size: 24px !important; font-weight: 900 !important; margin-bottom: 2px !important; }
            .receipt-table { width: 100% !important; border-collapse: collapse !important; font-size: 13px !important; }
            .receipt-table th { border-bottom: 1.5px solid #000 !important; padding: 6px 0 !important; text-align: right !important; }
            .receipt-table td { padding: 8px 0 !important; border-bottom: 1px solid #eee !important; }
            .receipt-total-box { margin-top: 15px !important; border: 2px solid #000 !important; padding: 10px !important; text-align: center !important; }
            .receipt-total-label { font-size: 13px !important; font-weight: bold !important; }
            .receipt-total-value { font-size: 26px !important; font-weight: 900 !important; }
            * { transition: none !important; animation: none !important; }
          }
        `}} />

        <div className="receipt-header mb-10 flex flex-col items-center justify-center gap-1 border-b border-slate-100 pb-8 print:border-none print:mb-2">
          <div className="h-14 w-14 rounded-full bg-amber-500 flex items-center justify-center mb-2 no-print shadow-inner">
            <span className="text-2xl text-white font-black">E</span>
          </div>
          <h1 className="receipt-title text-3xl font-black tracking-tighter text-slate-900">EDUVERSE</h1>
          <p className="text-[11px] font-black text-slate-400 uppercase tracking-[0.3em] print:text-black print:text-[8px]">Workspace & Education Hub</p>
          
          <div className="mt-4 hidden print:block text-[10px] text-black border-t-2 border-black pt-2 w-full text-right space-y-0.5">
            <div className="flex justify-between"><span>تاريخ:</span> <span>{dateTime(invoice.issuedAt)}</span></div>
            <div className="flex justify-between"><span>رقم الفاتورة:</span> <span>{invoice.invoiceNumber}</span></div>
          </div>

          <div className="no-print mt-3">
            <Badge tone={statusBadgeTone(invoice.paymentStatus)} className="px-4 py-1 text-[10px] font-black uppercase">
              {translateStatus(invoice.paymentStatus)}
            </Badge>
          </div>
        </div>

        <div className="mb-10 grid gap-8 sm:grid-cols-2 print:grid-cols-1 print:gap-1 print:mb-4">
          <div className="space-y-4 print:space-y-0">
            <div className="flex items-center gap-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-50 text-slate-400 print:hidden border border-slate-100">
                <User size={18} />
              </div>
              <div>
                <p className="text-[10px] font-black uppercase text-slate-400 tracking-wider print:text-black print:text-[9px]">العميل</p>
                <p className="text-base font-black text-slate-900 print:text-xs">{invoice.customer?.fullName ?? "عميل غير معروف"}</p>
                <p className="font-mono text-xs font-bold text-slate-400 print:text-[9px] print:text-black" dir="ltr">{invoice.customer?.phoneNumber}</p>
              </div>
            </div>
          </div>
          <div className="space-y-4 sm:text-left print:hidden no-print">
            <div className="flex items-center gap-4 sm:flex-row-reverse">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-50 text-slate-400 border border-slate-100">
                <Calendar size={18} />
              </div>
              <div className="text-right sm:text-left">
                <p className="text-[10px] font-black uppercase text-slate-400 tracking-wider">تاريخ الإصدار</p>
                <p className="text-base font-black text-slate-900">{dateTime(invoice.issuedAt).split(' ')[0]}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="receipt-divider hidden print:block" />

        <div className="mb-10 overflow-hidden rounded-3xl border border-slate-100 print:border-none print:mb-2 shadow-sm shadow-slate-100">
          <table className="receipt-table w-full text-right text-sm">
            <thead className="bg-slate-50/50 text-[10px] font-black uppercase text-slate-400 print:bg-white print:text-black">
              <tr>
                <th className="px-6 py-4 print:px-0 print:py-1">وصف البند</th>
                <th className="px-6 py-4 text-left print:px-0 print:py-1">المبلغ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 print:divide-black/10">
              {(invoice.items ?? []).map((item, idx) => (
                <tr key={idx} className="transition hover:bg-slate-50/50">
                  <td className="px-6 py-5 font-bold text-slate-800 print:px-0 print:py-2 print:text-[11px]">
                    <div className="flex flex-col gap-0.5">
                      <span>{item.description || "بند خدمة"}</span>
                      <span className="text-[10px] text-slate-400 print:text-black/60">
                        {itemTypeLabel(item.itemType)}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-5 text-left font-mono font-black text-slate-900 print:px-0 print:text-[11px]">{money(item.total)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="receipt-divider hidden print:block" />

        <div className="grid gap-10 lg:grid-cols-2 print:grid-cols-1 print:gap-1">
          <div className="rounded-[2rem] bg-slate-50 p-8 print:hidden no-print border border-slate-100">
            <div className="mb-4 flex items-center justify-between">
              <h4 className="text-xs font-black text-slate-900 uppercase tracking-widest">حالة السداد</h4>
              <span className="text-sm font-black text-slate-900">{Math.round(progress)}%</span>
            </div>
            <div className="h-2.5 w-full overflow-hidden rounded-full bg-white border border-slate-100 p-0.5">
              <div
                className={clsx("h-full rounded-full transition-all duration-1000 ease-out", isPaid ? "bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.4)]" : "bg-slate-900")}
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          <div className="space-y-4 px-4 print:px-0 print:space-y-1">
            <div className="flex justify-between text-sm font-bold text-slate-500 print:text-[11px] print:text-black">
              <span>المجموع الفرعي</span>
              <span className="font-mono">{money(subtotal)}</span>
            </div>
            {discountAmount > 0 && (
              <div className="flex justify-between text-sm font-bold text-rose-500 print:text-[11px] print:text-black">
                <span>الخصم المطبق</span>
                <span className="font-mono">-{money(discountAmount)}</span>
              </div>
            )}
            <div className="flex justify-between border-t-2 border-slate-900 pt-5 text-2xl font-black text-slate-900 print:border-black print:pt-1">
              <span className="print:text-xs">الإجمالي</span>
              <span className="font-mono tracking-tighter print:text-2xl">{money(totalAmount)}</span>
            </div>
            <div className="hidden print:block text-[10px] font-black border-t border-dashed border-black mt-2 pt-1">
              المدفوع: {money(amountPaid)} | المتبقي: {money(remainingAmount)}
            </div>
          </div>
        </div>

        <div className="receipt-total-box hidden print:block mt-8">
          <p className="receipt-total-label print:text-[11px]">صافي المبلغ المطلوب</p>
          <p className="receipt-total-value">{money(totalAmount)}</p>
        </div>

        <div className="mt-16 rounded-[2rem] border-2 border-dashed border-slate-100 p-6 text-center print:border-none print:mt-6 print:p-0">
          <p className="text-sm font-black text-slate-900 print:text-black print:font-bold print:text-[12px]">شكراً لزيارتكم إيدوفيرس!</p>
          <p className="mt-1 font-mono text-[10px] font-bold text-slate-400 print:text-black print:text-[9px]">eduvers.space • {invoice.id.slice(0,8).toUpperCase()}</p>
          <div className="mt-4 flex justify-center no-print">
            <div className="flex gap-1">
              {[1,2,3,4,5].map(i => <div key={i} className="h-1 w-1 rounded-full bg-slate-200" />)}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
