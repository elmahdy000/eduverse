"use client";

import type { ReactNode } from "react";
import { Printer, Download, Receipt, MapPin, Phone, Clock, Coffee, Tag, Wallet, CheckCircle2, AlertCircle } from "lucide-react";
import { money, dateTime } from "../lib/format";
import { translateStatus, translatePaymentMethod } from "../lib/labels";
import type { Invoice, Payment } from "../lib/types";

interface InvoiceReceiptProps {
  invoice: Invoice;
  payments?: Payment[];
  onPrint?: () => void;
  onDownload?: () => void;
}

// معلومات المكان — عدّلها من مكان واحد هنا
const VENUE = {
  name: "EDUVERSE",
  nameAr: "إيدوفيرس",
  tagline: "Workspace & Education Hub • مساحة عمل وتعليم",
  phone: "+20 123 456 7890",
};

function itemTypeLabel(itemType: string) {
  switch (itemType) {
    case "session":
      return "جلسة";
    case "bar_order":
      return "بار";
    case "discount":
      return "خصم";
    default:
      return "بند";
  }
}

/**
 * أنماط الطباعة الحرارية (80mm).
 * مكتوبة كـ CSS نصي عشان دالة الطباعة تقدر تحقنها في نافذة الطباعة
 * الجديدة (وإلا الأنماط بتضيع وتطبع بمقاس A4 غلط).
 * التصميم: نص أسود على أبيض، بدون خلفيات سودا (البرينتر الحراري
 * بيتجاهل الخلفيات ويطلع بقع)، خط monospace واضح للأرقام.
 */
export const RECEIPT_PRINT_CSS = `
  @page {
    size: 80mm auto;
    margin: 0mm !important;
  }
  @media print {
    html, body {
      width: 80mm !important;
      margin: 0 !important;
      padding: 0 !important;
      background: #ffffff !important;
      color: #000000 !important;
      font-family: 'Cairo', 'Courier New', Courier, monospace, sans-serif !important;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }
    .no-print { display: none !important; }
    
    tr, td, th, div, p {
      page-break-inside: avoid !important;
      break-inside: avoid !important;
    }
  }

  /* Xprinter & 80mm Thermal Receipt Container */
  #printable-invoice {
    box-sizing: border-box !important;
    width: 68mm !important;
    max-width: 68mm !important;
    margin: 0 auto !important;
    padding: 2mm 1mm 12mm 1mm !important; /* 12mm bottom padding to prevent auto-cutter from cutting text */
    font-family: 'Cairo', 'Courier New', Courier, monospace, sans-serif !important;
    color: #000000 !important;
    background: #ffffff !important;
    direction: rtl !important;
    text-align: right !important;
    line-height: 1.3 !important;
    word-wrap: break-word !important;
    overflow: hidden !important;
  }
  #printable-invoice .rc-center { text-align: center !important; }
  #printable-invoice .rc-venue {
    font-size: 16px !important;
    font-weight: 800 !important;
    letter-spacing: 0px !important;
    margin: 0 0 2px 0 !important;
    text-align: center !important;
  }
  #printable-invoice .rc-venue-ar { font-size: 11px !important; font-weight: 700 !important; margin: 1px 0 !important; text-align: center !important; }
  #printable-invoice .rc-muted { font-size: 8.5px !important; color: #000000 !important; text-align: center !important; }
  #printable-invoice .rc-divider {
    border: 0 !important;
    border-top: 1px dashed #000000 !important;
    margin: 4px 0 !important;
    width: 100% !important;
  }
  
  /* Layout rows using table for reliable Xprinter printing (flex layout sometimes breaks in print drivers) */
  #printable-invoice .rc-meta-row {
    width: 100% !important;
    margin: 2px 0 !important;
    font-size: 9.5px !important;
    border-collapse: collapse !important;
  }
  #printable-invoice .rc-meta-row td {
    padding: 1px 0 !important;
    font-size: 9.5px !important;
  }
  #printable-invoice .rc-meta-row .lbl { font-weight: 400 !important; text-align: right !important; color: #000 !important; }
  #printable-invoice .rc-meta-row .val { font-weight: 700 !important; text-align: left !important; color: #000 !important; }

  #printable-invoice table.rc-items {
    width: 100% !important;
    border-collapse: collapse !important;
    font-size: 10px !important;
    margin: 3px 0 !important;
    table-layout: fixed !important;
  }
  #printable-invoice table.rc-items th {
    border-bottom: 1px solid #000000 !important;
    padding: 2px 0 !important;
    font-weight: 800 !important;
    font-size: 9.5px !important;
  }
  #printable-invoice table.rc-items th.amt,
  #printable-invoice table.rc-items td.amt {
    text-align: left !important;
    font-variant-numeric: tabular-nums !important;
    white-space: nowrap !important;
    width: 32% !important;
  }
  #printable-invoice table.rc-items td {
    padding: 3px 0 !important;
    vertical-align: top !important;
    border-bottom: 1px dotted #777777 !important;
  }
  #printable-invoice .rc-item-name { font-weight: 700 !important; font-size: 10px !important; word-break: break-word !important; }
  #printable-invoice .rc-item-sub { font-size: 8px !important; color: #333 !important; }

  #printable-invoice .rc-total {
    border-top: 1.5px solid #000000 !important;
    border-bottom: 1.5px solid #000000 !important;
    padding: 4px 0 !important;
    margin: 4px 0 !important;
    width: 100% !important;
  }
  #printable-invoice .rc-total td {
    vertical-align: middle !important;
  }
  #printable-invoice .rc-total .title { font-size: 11px !important; font-weight: 800 !important; text-align: right !important; }
  #printable-invoice .rc-total .amt { font-size: 18px !important; font-weight: 900 !important; text-align: left !important; font-variant-numeric: tabular-nums !important; }

  #printable-invoice .rc-status {
    text-align: center !important;
    font-size: 10px !important;
    font-weight: 800 !important;
    border: 1px solid #000000 !important;
    border-radius: 2px !important;
    padding: 3px 0 !important;
    margin: 4px 0 !important;
  }
  #printable-invoice .rc-foot {
    text-align: center !important;
    font-size: 9.5px !important;
    font-weight: 700 !important;
    margin-top: 5px !important;
  }
  #printable-invoice .rc-foot-sm { text-align: center !important; font-size: 8px !important; margin-top: 2px !important; }
`;

export function InvoiceReceipt({ invoice, payments = [], onPrint, onDownload }: InvoiceReceiptProps) {
  const totalAmount = Math.round(Number(invoice.totalAmount || 0));
  const amountPaid = Math.round(Number(invoice.amountPaid || 0));
  const remainingAmount = Math.round(Number(invoice.remainingAmount || 0));
  const subtotal = Math.round(Number(invoice.subtotal ?? totalAmount));
  const discountAmount = Math.round(Number(invoice.discountAmount ?? 0));
  const taxAmount = Math.round(Number(invoice.taxAmount ?? 0));

  // آخر طريقة دفع مستخدمة (لو فيه مدفوعات)
  const lastMethod = payments.find((p) => Number(p.amount) > 0)?.paymentMethod;

  return (
    <div className="mx-auto max-w-sm overflow-hidden rounded-3xl bg-white shadow-[0_20px_50px_rgba(0,0,0,0.1)] transition-all hover:shadow-[0_30px_70px_rgba(0,0,0,0.15)] no-print">
      {/* شريط الأدوات — مايتطبعش */}
      <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/50 px-6 py-4">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-900 text-white">
            <Receipt size={16} />
          </div>
          <span className="text-xs font-black text-slate-900">
            فاتورة رقم #{invoice.invoiceNumber.split("-").pop()}
          </span>
        </div>
        <div className="flex gap-2">
          <button
            onClick={onPrint}
            title="طباعة على البرينتر الحراري"
            className="flex items-center gap-1.5 rounded-lg bg-slate-900 px-3 py-2 text-xs font-bold text-white hover:bg-slate-800 transition-colors"
          >
            <Printer size={14} /> طباعة
          </button>
          <button
            onClick={onDownload}
            title="تنزيل نسخة"
            className="rounded-lg bg-slate-100 p-2 text-slate-600 hover:bg-slate-200 transition-colors"
          >
            <Download size={14} />
          </button>
        </div>
      </div>

      {/* محتوى الفاتورة القابل للطباعة */}
      <div id="printable-invoice" className="relative p-6 pt-8 text-right" dir="rtl">
        {/* أنماط الطباعة الحرارية */}
        <style
          dangerouslySetInnerHTML={{ __html: `@media print { .no-print { display: none !important; } ${RECEIPT_PRINT_CSS} }` }}
        />

        {/* الرأس */}
        <div className="rc-center receipt-header mb-6 flex flex-col items-center justify-center gap-1">
          <h1 className="rc-venue text-2xl font-black tracking-tighter text-slate-900">{VENUE.name}</h1>
          <p className="rc-venue-ar text-sm font-bold text-slate-700">{VENUE.nameAr}</p>
          <div className="flex flex-col items-center gap-0.5 text-[10px] font-bold text-slate-400">
            <span className="rc-muted">{VENUE.tagline}</span>
            <span className="rc-muted" dir="ltr">☎ {VENUE.phone}</span>
          </div>
        </div>

        <hr className="rc-divider border-t-2 border-dashed border-slate-100" />

        {/* بيانات الفاتورة — جدول لتوافق طابعات Xprinter */}
        <table className="rc-meta-row my-3 w-full">
          <tbody>
            <tr>
              <td className="lbl text-slate-500">التاريخ:</td>
              <td className="val font-mono">{dateTime(invoice.issuedAt)}</td>
            </tr>
            <tr>
              <td className="lbl text-slate-500">العميل:</td>
              <td className="val text-slate-900">{invoice.customer?.fullName ?? "عميل عام"}</td>
            </tr>
            <tr>
              <td className="lbl text-slate-500">رقم الفاتورة:</td>
              <td className="val font-mono">{invoice.invoiceNumber}</td>
            </tr>
          </tbody>
        </table>

        <hr className="rc-divider" />

        {/* البنود */}
        <table className="rc-items w-full text-sm">
          <thead className="text-[10px] font-black uppercase text-slate-400">
            <tr>
              <th className="pb-2 text-right">الصنف</th>
              <th className="amt pb-2 text-left">المبلغ</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-dashed divide-slate-100">
            {(invoice.items ?? []).map((item) => (
              <tr key={item.id ?? `${item.itemType}-${item.description}`}>
                <td className="py-2">
                  <div className="flex flex-col gap-0.5">
                    <span className="rc-item-name font-bold text-slate-900">
                      {item.description || "بند خدمة"}
                    </span>
                    <span className="rc-item-sub text-[9px] uppercase tracking-wider text-slate-400">
                      {itemTypeLabel(item.itemType)} {item.quantity > 1 && `x${item.quantity}`}
                    </span>
                  </div>
                </td>
                <td className="amt py-2 text-left font-mono font-black text-slate-900">
                  {money(item.total)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <hr className="rc-divider" />

        {/* الإجماليات */}
        <table className="rc-meta-row mt-3 w-full">
          <tbody>
            <tr>
              <td className="lbl text-slate-500">المجموع الفرعي</td>
              <td className="val font-mono">{money(subtotal)}</td>
            </tr>
            {discountAmount > 0 && (
              <tr>
                <td className="lbl text-slate-500">خصم العميل</td>
                <td className="val font-mono">-{money(discountAmount)}</td>
              </tr>
            )}
            {taxAmount > 0 && (
              <tr>
                <td className="lbl text-slate-500">ضريبة</td>
                <td className="val font-mono">{money(taxAmount)}</td>
              </tr>
            )}
          </tbody>
        </table>

        {/* الإجمالي */}
        <table className="rc-total my-2 w-full">
          <tbody>
            <tr>
              <td className="title text-xs font-black text-slate-900">الإجمالي</td>
              <td className="amt text-left text-2xl font-black font-mono text-slate-900">{money(totalAmount)}</td>
            </tr>
          </tbody>
        </table>

        {/* المدفوع والمتبقي */}
        <table className="rc-meta-row w-full">
          <tbody>
            {amountPaid > 0 && (
              <tr>
                <td className="lbl text-slate-500">المدفوع{lastMethod ? ` (${translatePaymentMethod(lastMethod)})` : ""}</td>
                <td className="val font-mono">{money(amountPaid)}</td>
              </tr>
            )}
            {remainingAmount > 0 && (
              <tr>
                <td className="lbl text-rose-600 font-bold">المتبقي</td>
                <td className="val font-mono text-rose-600 font-bold">{money(remainingAmount)}</td>
              </tr>
            )}
          </tbody>
        </table>

          {/* حالة الدفع — badge بإطار كامل */}
          <div className="rc-status mt-2 rounded-lg border-2 border-slate-900 py-2 text-center text-sm font-black text-slate-900">
            {translateStatus(invoice.paymentStatus)}
          </div>

        {/* التذييل */}
        <div className="mt-6 flex flex-col items-center gap-1.5 border-t border-dashed border-slate-100 pt-6 text-center">
          <p className="rc-foot text-[11px] font-black text-slate-900">شكراً لزيارتكم — نتمنى لكم يوماً سعيداً!</p>
          <p className="rc-foot-sm font-mono text-[9px] font-bold text-slate-400">
            {invoice.invoiceNumber}
          </p>
        </div>
      </div>
    </div>
  );
}

/**
 * SessionCloseSummary
 * -----------------------------------------------------------------------------
 * ملخص شامل بيظهر على الشاشة (مش للطباعة) بعد إغلاق الجلسة أو تحصيل طلب.
 * بيجمّع بنود الفاتورة حسب النوع (جلسة / بار / خصم) ويعرض صورة كاملة:
 * تكلفة الجلسة، إجمالي البار، الخصم، الإجمالي، المدفوع، المتبقي، والحالة.
 */
export function SessionCloseSummary({
  invoice,
  durationMinutes,
  barOrdersCount,
}: {
  invoice: Invoice;
  durationMinutes?: number | null;
  barOrdersCount?: number | null;
}) {
  const items = invoice.items ?? [];
  const sum = (type: string) =>
    items
      .filter((i) => i.itemType === type)
      .reduce((s, i) => s + Number(i.total || 0), 0);

  const sessionTotal = sum("session");
  const barTotal = sum("bar_order");
  const barItemsCount =
    barOrdersCount ??
    items.filter((i) => i.itemType === "bar_order").reduce((s, i) => s + Number(i.quantity || 0), 0);

  const discount = Math.abs(
    Number(invoice.discountAmount ?? 0) || sum("discount"),
  );
  const total = Math.round(Number(invoice.totalAmount || 0));
  const paid = Math.round(Number(invoice.amountPaid || 0));
  const remaining = Math.round(Number(invoice.remainingAmount || 0));
  const isPaid = remaining <= 0;

  const durationLabel = (() => {
    if (!durationMinutes || durationMinutes <= 0) return null;
    const h = Math.floor(durationMinutes / 60);
    const m = durationMinutes % 60;
    if (h > 0 && m > 0) return `${h} ساعة و ${m} دقيقة`;
    if (h > 0) return `${h} ساعة`;
    return `${m} دقيقة`;
  })();

  const Row = ({
    icon,
    label,
    value,
    tone = "slate",
    sub,
  }: {
    icon: ReactNode;
    label: string;
    value: string;
    tone?: "slate" | "amber" | "rose" | "emerald";
    sub?: string;
  }) => {
    const toneMap: Record<string, string> = {
      slate: "text-slate-500 bg-slate-100",
      amber: "text-amber-600 bg-amber-100",
      rose: "text-rose-600 bg-rose-100",
      emerald: "text-emerald-600 bg-emerald-100",
    };
    return (
      <div className="flex items-center justify-between py-2">
        <div className="flex items-center gap-2.5">
          <span className={`flex h-8 w-8 items-center justify-center rounded-lg ${toneMap[tone]}`}>
            {icon}
          </span>
          <div className="flex flex-col">
            <span className="text-sm font-bold text-slate-700">{label}</span>
            {sub && <span className="text-[10px] font-semibold text-slate-400">{sub}</span>}
          </div>
        </div>
        <span className="font-mono text-sm font-black text-slate-900">{value}</span>
      </div>
    );
  };

  return (
    <div className="mx-auto max-w-sm overflow-hidden rounded-3xl border border-slate-100 bg-white shadow-sm">
      {/* الرأس */}
      <div className={`flex items-center gap-3 px-6 py-4 ${isPaid ? "bg-emerald-50" : "bg-amber-50"}`}>
        <span className={`flex h-10 w-10 items-center justify-center rounded-xl ${isPaid ? "bg-emerald-500" : "bg-amber-500"} text-white`}>
          {isPaid ? <CheckCircle2 size={20} /> : <AlertCircle size={20} />}
        </span>
        <div>
          <p className="text-sm font-black text-slate-900">ملخص الحساب</p>
          <p className="text-[11px] font-bold text-slate-500">
            {invoice.customer?.fullName ?? "عميل عام"} • {dateTime(invoice.issuedAt)}
          </p>
        </div>
      </div>

      <div className="divide-y divide-slate-100 px-6 py-2">
        {sessionTotal > 0 && (
          <Row
            icon={<Clock size={15} />}
            label="تكلفة الجلسة"
            sub={durationLabel ?? undefined}
            value={money(sessionTotal)}
          />
        )}
        {barTotal > 0 && (
          <Row
            icon={<Coffee size={15} />}
            label="طلبات البار"
            tone="amber"
            sub={barItemsCount > 0 ? `${barItemsCount} صنف` : undefined}
            value={money(barTotal)}
          />
        )}
        {discount > 0 && (
          <Row
            icon={<Tag size={15} />}
            label="الخصم"
            tone="rose"
            value={`- ${money(discount)}`}
          />
        )}
      </div>

      {/* الإجمالي */}
      <div className="mx-6 my-2 flex items-baseline justify-between border-y-2 border-slate-900 py-3">
        <span className="text-xs font-black text-slate-900">الإجمالي</span>
        <span className="font-mono text-3xl font-black tracking-tight text-slate-900">{money(total)}</span>
      </div>

      <div className="px-6 pb-2">
        {paid > 0 && (
          <Row icon={<Wallet size={15} />} label="المدفوع" tone="emerald" value={money(paid)} />
        )}
        {remaining > 0 && (
          <Row icon={<AlertCircle size={15} />} label="المتبقي" tone="rose" value={money(remaining)} />
        )}
      </div>

      {/* الحالة */}
      <div className={`px-6 pb-5 pt-1`}>
        <div className={`rounded-xl py-2.5 text-center text-sm font-black ${isPaid ? "bg-emerald-500 text-white" : "bg-amber-100 text-amber-800"}`}>
          {translateStatus(invoice.paymentStatus)}
        </div>
      </div>
    </div>
  );
}
