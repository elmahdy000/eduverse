"use client";

import { Printer, Download, Receipt, User, Calendar, MapPin, Phone } from "lucide-react";
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

  return (
    <div className="mx-auto max-w-sm overflow-hidden rounded-3xl bg-white shadow-[0_20px_50px_rgba(0,0,0,0.1)] transition-all hover:shadow-[0_30px_70px_rgba(0,0,0,0.15)] no-print">
      {/* Action Header - No Print */}
      <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/50 px-6 py-4 backdrop-blur-sm">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-900 text-white">
            <Receipt size={16} />
          </div>
          <span className="text-xs font-black text-slate-900">فاتورة رقم #{invoice.invoiceNumber.split('-').pop()}</span>
        </div>
        <div className="flex gap-2">
          <button onClick={onPrint} className="rounded-lg bg-slate-900 p-2 text-white hover:bg-slate-800 transition-colors">
            <Printer size={14} />
          </button>
          <button onClick={onDownload} className="rounded-lg bg-slate-100 p-2 text-slate-600 hover:bg-slate-200 transition-colors">
            <Download size={14} />
          </button>
        </div>
      </div>

      {/* The Actual Receipt Content */}
      <div id="printable-invoice" className="relative p-6 pt-8 text-right" dir="rtl">
        {/* Receipt Styles for Printing */}
        <style dangerouslySetInnerHTML={{ __html: `
          @media print {
            @page { size: 80mm auto; margin: 0; }
            body { background: white !important; color: black !important; font-family: 'Inter', system-ui, sans-serif !important; width: 80mm !important; }
            #printable-invoice { width: 80mm !important; padding: 4mm !important; margin: 0 auto !important; box-shadow: none !important; border: none !important; }
            .no-print { display: none !important; }
            .receipt-divider { border-top: 2px dashed #000 !important; margin: 12px 0 !important; height: 0 !important; }
            .receipt-header { text-align: center !important; margin-bottom: 20px !important; }
            .receipt-title { font-size: 28px !important; font-weight: 900 !important; }
            .receipt-table { width: 100% !important; border-collapse: collapse !important; font-size: 14px !important; }
            .receipt-table th { border-bottom: 2px solid #000 !important; padding: 8px 0 !important; text-align: right !important; font-weight: 900 !important; }
            .receipt-table td { padding: 10px 0 !important; border-bottom: 1px dashed #eee !important; }
            .receipt-total-row { display: flex !important; justify-content: space-between !important; font-size: 16px !important; font-weight: 900 !important; margin-top: 8px !important; }
          }
        `}} />

        {/* Serrated Top Edge Visual */}
        <div className="absolute top-0 left-0 right-0 h-2 bg-[radial-gradient(circle,transparent_0,transparent_4px,#fff_4px,#fff_10px)] bg-[length:20px_20px] bg-repeat-x print:hidden opacity-20" />

        <div className="receipt-header mb-8 flex flex-col items-center justify-center gap-1">
          <div className="mb-2 flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-900 text-white shadow-xl rotate-3">
            <span className="text-3xl font-black italic">E</span>
          </div>
          <h1 className="text-2xl font-black tracking-tighter text-slate-900">EDUVERSE</h1>
          <div className="flex flex-col items-center gap-0.5 text-[10px] font-bold text-slate-400">
            <span className="flex items-center gap-1 uppercase tracking-widest"><MapPin size={10} /> Workspace & Education Hub</span>
            <span className="flex items-center gap-1 tracking-widest" dir="ltr"><Phone size={10} /> +20 123 456 7890</span>
          </div>
        </div>

        <div className="receipt-divider border-t-2 border-dashed border-slate-100" />

        <div className="my-4 space-y-1.5 text-[11px] font-bold text-slate-600">
          <div className="flex justify-between">
            <span className="text-slate-400">التاريخ:</span>
            <span>{dateTime(invoice.issuedAt)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400">العميل:</span>
            <span className="text-slate-900">{invoice.customer?.fullName ?? "عميل عام"}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400">رقم الفاتورة:</span>
            <span className="font-mono">{invoice.invoiceNumber}</span>
          </div>
        </div>

        <div className="receipt-divider border-t-2 border-dashed border-slate-100" />

        <table className="w-full text-sm">
          <thead className="text-[10px] font-black uppercase text-slate-400">
            <tr>
              <th className="pb-3 text-right">الصنف</th>
              <th className="pb-3 text-left">المبلغ</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-dashed divide-slate-100">
            {(invoice.items ?? []).map((item, idx) => (
              <tr key={idx}>
                <td className="py-3">
                  <div className="flex flex-col gap-0.5">
                    <span className="font-bold text-slate-900">{item.description || "بند خدمة"}</span>
                    <span className="text-[9px] uppercase tracking-wider text-slate-400">
                      {itemTypeLabel(item.itemType)} {item.quantity > 1 && `x${item.quantity}`}
                    </span>
                  </div>
                </td>
                <td className="py-3 text-left font-mono font-black text-slate-900">
                  {money(item.total)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="receipt-divider border-t-2 border-dashed border-slate-100" />

        <div className="mt-4 space-y-2">
          <div className="flex justify-between text-xs font-bold text-slate-500">
            <span>المجموع الفرعي</span>
            <span className="font-mono">{money(subtotal)}</span>
          </div>
          
          {discountAmount > 0 && (
            <div className="flex justify-between text-xs font-bold text-rose-500">
              <span>خصم العميل</span>
              <span className="font-mono">-{money(discountAmount)}</span>
            </div>
          )}

          <div className="flex justify-between items-center rounded-xl bg-slate-900 p-4 text-white shadow-lg">
            <div className="flex flex-col">
              <span className="text-[10px] font-black uppercase tracking-widest opacity-60">الإجمالي</span>
              <span className="text-xs font-bold">{translateStatus(invoice.paymentStatus)}</span>
            </div>
            <span className="text-3xl font-black tracking-tighter font-mono">
              {money(totalAmount)}
            </span>
          </div>
        </div>

        <div className="mt-6 flex flex-col items-center gap-1.5 border-t border-dashed border-slate-100 pt-6 text-center">
          <p className="text-[11px] font-black text-slate-900">شكراً لثقتكم في إيدوفيرس!</p>
          <div className="flex h-20 w-20 items-center justify-center rounded-xl border border-slate-100 bg-slate-50 p-2">
             <div className="grid grid-cols-5 gap-1">
                {Array.from({length: 25}).map((_, i) => (
                  <div key={i} className={clsx("h-1.5 w-1.5 rounded-sm", (i % 3 === 0 || i % 7 === 0) ? "bg-slate-900" : "bg-slate-200")} />
                ))}
             </div>
          </div>
          <p className="font-mono text-[9px] font-bold text-slate-400">eduvers.space • scan for digital copy</p>
        </div>

        {/* Serrated Bottom Edge Visual */}
        <div className="absolute bottom-0 left-0 right-0 h-2 bg-[radial-gradient(circle,transparent_0,transparent_4px,#fff_4px,#fff_10px)] bg-[length:20px_20px] bg-repeat-x print:hidden rotate-180 opacity-20" />
      </div>
    </div>
  );
}
