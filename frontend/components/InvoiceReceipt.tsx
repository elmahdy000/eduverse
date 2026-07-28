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
@media print {
  @page {
    size: 80mm auto;
    margin: 0;
  }

  html,
  body {
    width: 80mm !important;
    min-width: 80mm !important;
    margin: 0 !important;
    padding: 0 !important;
    background: #ffffff !important;
    overflow: visible !important;
    -webkit-print-color-adjust: exact !important;
    print-color-adjust: exact !important;
  }

  body * {
    visibility: hidden;
  }

  .invoice-print,
  .invoice-print * {
    visibility: visible;
  }

  .invoice-print {
    position: absolute !important;
    top: 0 !important;
    left: 0 !important;
    right: 0 !important;
    width: 72mm !important;
    max-width: 72mm !important;
    min-width: 0 !important;
    margin: 0 auto !important;
    padding: 2mm 2mm 10mm 2mm !important;
    box-sizing: border-box !important;
    overflow: visible !important;
    transform: none !important;
    background: #ffffff !important;
    color: #000000 !important;
    direction: rtl !important;
    font-family: 'Cairo', 'Tahoma', 'Courier New', Courier, monospace, sans-serif !important;
    line-height: 1.35 !important;
    text-align: right !important;
  }

  .invoice-print,
  .invoice-print * {
    box-sizing: border-box !important;
  }

  .invoice-print table {
    width: 100% !important;
    max-width: 100% !important;
    table-layout: fixed !important;
    border-collapse: collapse !important;
  }

  .invoice-print th,
  .invoice-print td {
    max-width: 100% !important;
    padding: 2px !important;
    font-size: 10px !important;
    line-height: 1.35 !important;
    white-space: normal !important;
    overflow: visible !important;
    overflow-wrap: anywhere !important;
    word-break: break-word !important;
    text-overflow: clip !important;
  }

  .invoice-print img,
  .invoice-print svg,
  .invoice-print canvas {
    max-width: 100% !important;
    height: auto !important;
  }

  .invoice-print .product-name {
    white-space: normal !important;
    word-break: break-word !important;
    overflow-wrap: anywhere !important;
    font-weight: 700 !important;
    font-size: 10.5px !important;
  }

  .invoice-print .invoice-row,
  .invoice-print tr {
    page-break-inside: avoid !important;
    break-inside: avoid !important;
  }

  .no-print,
  button,
  nav,
  aside,
  header,
  footer {
    display: none !important;
  }
}

/* Screen Fallback & Print Window Helper Styles */
#printable-invoice {
  box-sizing: border-box;
  width: 72mm;
  max-width: 72mm;
  margin: 0 auto;
  padding: 2mm 2mm 10mm 2mm;
  font-family: 'Cairo', 'Tahoma', sans-serif;
  color: #000000;
  background: #ffffff;
  direction: rtl;
  text-align: right;
  line-height: 1.35;
}
#printable-invoice .rc-center { text-align: center; }
#printable-invoice .rc-venue { font-size: 18px; font-weight: 800; margin: 0; text-align: center; }
#printable-invoice .rc-venue-ar { font-size: 12px; font-weight: 700; margin: 1px 0; text-align: center; }
#printable-invoice .rc-muted { font-size: 9px; color: #000; text-align: center; }
#printable-invoice .rc-divider { border: 0; border-top: 1px dashed #000; margin: 5px 0; width: 100%; }

#printable-invoice .rc-meta-table { width: 100%; border-collapse: collapse; margin: 3px 0; font-size: 10px; }
#printable-invoice .rc-meta-table td { padding: 1.5px 0; vertical-align: top; }
#printable-invoice .rc-meta-table .lbl { font-weight: 400; color: #333; text-align: right; }
#printable-invoice .rc-meta-table .val { font-weight: 700; color: #000; text-align: left; }

#printable-invoice table.rc-items-table { width: 100%; border-collapse: collapse; margin: 4px 0; table-layout: fixed; }
#printable-invoice table.rc-items-table th { border-bottom: 1px solid #000; padding: 3px 2px; font-weight: 800; font-size: 10px; }
#printable-invoice table.rc-items-table td { padding: 3px 2px; vertical-align: top; border-bottom: 1px dotted #888; font-size: 10px; }
#printable-invoice table.rc-items-table th.col-name { width: 44%; text-align: right; }
#printable-invoice table.rc-items-table th.col-qty { width: 16%; text-align: center; }
#printable-invoice table.rc-items-table th.col-price { width: 20%; text-align: left; }
#printable-invoice table.rc-items-table th.col-total { width: 20%; text-align: left; }
#printable-invoice table.rc-items-table td.col-qty { text-align: center; font-variant-numeric: tabular-nums; }
#printable-invoice table.rc-items-table td.col-price,
#printable-invoice table.rc-items-table td.col-total { text-align: left; font-variant-numeric: tabular-nums; white-space: nowrap; font-weight: 700; }

#printable-invoice .rc-total-box { border-top: 1.5px solid #000; border-bottom: 1.5px solid #000; padding: 4px 0; margin: 6px 0; width: 100%; }
#printable-invoice .rc-total-box td { vertical-align: middle; }
#printable-invoice .rc-total-box .title { font-size: 12px; font-weight: 800; text-align: right; }
#printable-invoice .rc-total-box .amt { font-size: 20px; font-weight: 900; text-align: left; font-variant-numeric: tabular-nums; }

#printable-invoice .rc-status-box { text-align: center; font-size: 11px; font-weight: 800; border: 1.5px solid #000; border-radius: 3px; padding: 4px 0; margin: 5px 0; }
#printable-invoice .rc-foot { text-align: center; font-size: 10px; font-weight: 700; margin-top: 6px; }
#printable-invoice .rc-foot-sm { text-align: center; font-size: 8.5px; margin-top: 2px; }
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

      {/* محتوى الفاتورة القابل للطباعة بحجم الـ 80mm وطابعة Xprinter */}
      <div id="printable-invoice" className="invoice-print relative p-4 text-right" dir="rtl">
        {/* أنماط الطباعة الحرارية */}
        <style
          dangerouslySetInnerHTML={{ __html: RECEIPT_PRINT_CSS }}
        />

        {/* الرأس واللوجو */}
        <div className="rc-center receipt-header mb-4 flex flex-col items-center justify-center gap-1">
          <h1 className="rc-venue text-2xl font-black tracking-tighter text-slate-900">{VENUE.name}</h1>
          <p className="rc-venue-ar text-sm font-bold text-slate-700">{VENUE.nameAr}</p>
          <div className="flex flex-col items-center gap-0.5 text-[10px] font-bold text-slate-400">
            <span className="rc-muted">{VENUE.tagline}</span>
            <span className="rc-muted" dir="ltr">☎ {VENUE.phone}</span>
          </div>
        </div>

        <hr className="rc-divider" />

        {/* بيانات الفاتورة Metadata */}
        <table className="rc-meta-table rc-meta-row my-2 w-full">
          <tbody>
            <tr className="invoice-row">
              <td className="lbl">التاريخ:</td>
              <td className="val font-mono">{dateTime(invoice.issuedAt)}</td>
            </tr>
            <tr className="invoice-row">
              <td className="lbl">العميل:</td>
              <td className="val text-slate-900">{invoice.customer?.fullName ?? "عميل عام"}</td>
            </tr>
            <tr className="invoice-row">
              <td className="lbl">رقم الفاتورة:</td>
              <td className="val font-mono">{invoice.invoiceNumber}</td>
            </tr>
            {invoice.notes && (
              <tr className="invoice-row">
                <td className="lbl">ملاحظات:</td>
                <td className="val">{invoice.notes}</td>
              </tr>
            )}
          </tbody>
        </table>

        <hr className="rc-divider" />

        {/* جدول البنود بأسماء عريضة وأعمدة نسبية */}
        <table className="rc-items-table rc-items w-full text-sm">
          <thead>
            <tr className="invoice-row">
              <th className="col-name text-right">الصنف</th>
              <th className="col-qty text-center">العدد</th>
              <th className="col-price text-left">السعر</th>
              <th className="col-total text-left">المبلغ</th>
            </tr>
          </thead>
          <tbody>
            {(invoice.items ?? []).map((item) => (
              <tr key={item.id ?? `${item.itemType}-${item.description}`} className="invoice-row">
                <td className="col-name">
                  <div className="product-name">
                    {item.description || "بند خدمة"}
                  </div>
                  <div className="rc-item-sub text-[8.5px] text-slate-400">
                    {itemTypeLabel(item.itemType)}
                  </div>
                </td>
                <td className="col-qty">{item.quantity || 1}</td>
                <td className="col-price">{money(item.unitPrice ?? item.total)}</td>
                <td className="col-total">{money(item.total)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <hr className="rc-divider" />

        {/* الإجماليات */}
        <table className="rc-meta-table rc-meta-row mt-2 w-full">
          <tbody>
            <tr className="invoice-row">
              <td className="lbl">المجموع الفرعي</td>
              <td className="val font-mono">{money(subtotal)}</td>
            </tr>
            {discountAmount > 0 && (
              <tr className="invoice-row">
                <td className="lbl">خصم العميل</td>
                <td className="val font-mono">-{money(discountAmount)}</td>
              </tr>
            )}
            {taxAmount > 0 && (
              <tr className="invoice-row">
                <td className="lbl">ضريبة</td>
                <td className="val font-mono">{money(taxAmount)}</td>
              </tr>
            )}
          </tbody>
        </table>

        {/* الإجمالي الكبير */}
        <table className="rc-total-box rc-total my-2 w-full">
          <tbody>
            <tr className="invoice-row">
              <td className="title text-xs font-black text-slate-900">الإجمالي النهائي</td>
              <td className="amt text-left text-2xl font-black font-mono text-slate-900">{money(totalAmount)}</td>
            </tr>
          </tbody>
        </table>

        {/* المدفوع والمتبقي */}
        <table className="rc-meta-table rc-meta-row w-full">
          <tbody>
            {amountPaid > 0 && (
              <tr className="invoice-row">
                <td className="lbl">المدفوع{lastMethod ? ` (${translatePaymentMethod(lastMethod)})` : ""}</td>
                <td className="val font-mono">{money(amountPaid)}</td>
              </tr>
            )}
            {remainingAmount > 0 && (
              <tr className="invoice-row">
                <td className="lbl font-bold text-rose-600">المتبقي</td>
                <td className="val font-mono font-bold text-rose-600">{money(remainingAmount)}</td>
              </tr>
            )}
          </tbody>
        </table>

        {/* حالة الدفع */}
        <div className="rc-status-box rc-status mt-2 rounded-lg border-2 border-slate-900 py-1.5 text-center text-xs font-black text-slate-900">
          {translateStatus(invoice.paymentStatus)}
        </div>

        {/* التذييل */}
        <div className="mt-4 flex flex-col items-center gap-1 border-t border-dashed border-slate-200 pt-4 text-center">
          <p className="rc-foot text-[10px] font-black text-slate-900">شكراً لزيارتكم — نتمنى لكم يوماً سعيداً!</p>
          <p className="rc-foot-sm font-mono text-[8.5px] font-bold text-slate-400">
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
