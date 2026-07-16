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
  @page { size: 80mm auto; margin: 0; }
  * { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  .no-print { display: none !important; }

  /* أخفي كل الصفحة وأظهر الفاتورة بس — أضمن طريقة تمنع المعاينة الفاضية
     لما نطبع من داخل صفحة فيها عناصر تانية (قوائم/أزرار/فورمات) */
  body * { visibility: hidden !important; }
  #printable-invoice, #printable-invoice * { visibility: visible !important; }

  html, body {
    margin: 0 !important;
    padding: 0 !important;
    background: #fff !important;
    color: #000 !important;
    font-family: 'Cairo', 'Tahoma', 'Segoe UI', sans-serif !important;
  }
  #printable-invoice {
    position: absolute !important;
    top: 0 !important;
    right: 0 !important;
    left: 0 !important;
    width: 76mm;
    margin: 0 auto;
    padding: 3mm 2mm;
    font-family: 'Cairo', 'Tahoma', sans-serif;
    color: #000;
    background: #fff;
    direction: rtl;
    text-align: right;
    line-height: 1.5;
  }
  #printable-invoice .rc-center { text-align: center; }
  #printable-invoice .rc-venue {
    font-size: 20px;
    font-weight: 800;
    letter-spacing: 1px;
    margin: 0;
  }
  #printable-invoice .rc-venue-ar { font-size: 13px; font-weight: 700; margin: 1px 0; }
  #printable-invoice .rc-muted { font-size: 10px; color: #000; }
  #printable-invoice .rc-divider {
    border: 0;
    border-top: 1px dashed #000;
    margin: 6px 0;
  }
  #printable-invoice .rc-meta {
    display: flex;
    justify-content: space-between;
    font-size: 11px;
    margin: 2px 0;
  }
  #printable-invoice .rc-meta .lbl { font-weight: 400; }
  #printable-invoice .rc-meta .val { font-weight: 700; }
  #printable-invoice table.rc-items {
    width: 100%;
    border-collapse: collapse;
    font-size: 12px;
    margin: 2px 0;
  }
  #printable-invoice table.rc-items th {
    border-bottom: 1px solid #000;
    padding: 3px 0;
    font-weight: 800;
    font-size: 11px;
  }
  #printable-invoice table.rc-items th.amt,
  #printable-invoice table.rc-items td.amt {
    text-align: left;
    font-variant-numeric: tabular-nums;
    white-space: nowrap;
  }
  #printable-invoice table.rc-items td {
    padding: 3px 0;
    vertical-align: top;
    border-bottom: 1px dotted #999;
  }
  #printable-invoice .rc-item-name { font-weight: 700; }
  #printable-invoice .rc-item-sub { font-size: 9px; }
  #printable-invoice .rc-line {
    display: flex;
    justify-content: space-between;
    font-size: 11px;
    margin: 2px 0;
  }
  #printable-invoice .rc-total {
    display: flex;
    justify-content: space-between;
    align-items: baseline;
    border-top: 2px solid #000;
    border-bottom: 2px solid #000;
    padding: 6px 0;
    margin: 5px 0;
  }
  #printable-invoice .rc-total span:first-child { font-size: 11px; font-weight: 800; }
  #printable-invoice .rc-total .amt { font-size: 24px; font-weight: 900; font-variant-numeric: tabular-nums; }
  #printable-invoice .rc-status {
    text-align: center;
    font-size: 12px;
    font-weight: 800;
    border: 2px solid #000;
    border-radius: 4px;
    padding: 5px 0;
    margin: 5px 0;
  }
  #printable-invoice .rc-foot {
    text-align: center;
    font-size: 11px;
    font-weight: 700;
    margin-top: 6px;
  }
  #printable-invoice .rc-foot-sm { text-align: center; font-size: 9px; margin-top: 2px; }
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

        {/* بيانات الفاتورة */}
        <div className="my-4 space-y-1.5 text-[11px] font-bold text-slate-600">
          <div className="rc-meta flex justify-between">
            <span className="lbl text-slate-400">التاريخ:</span>
            <span className="val">{dateTime(invoice.issuedAt)}</span>
          </div>
          <div className="rc-meta flex justify-between">
            <span className="lbl text-slate-400">العميل:</span>
            <span className="val text-slate-900">{invoice.customer?.fullName ?? "عميل عام"}</span>
          </div>
          <div className="rc-meta flex justify-between">
            <span className="lbl text-slate-400">رقم الفاتورة:</span>
            <span className="val font-mono">{invoice.invoiceNumber}</span>
          </div>
        </div>

        <hr className="rc-divider border-t-2 border-dashed border-slate-100" />

        {/* البنود */}
        <table className="rc-items w-full text-sm">
          <thead className="text-[10px] font-black uppercase text-slate-400">
            <tr>
              <th className="pb-3 text-right">الصنف</th>
              <th className="amt pb-3 text-left">المبلغ</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-dashed divide-slate-100">
            {(invoice.items ?? []).map((item, idx) => (
              <tr key={idx}>
                <td className="py-3">
                  <div className="flex flex-col gap-0.5">
                    <span className="rc-item-name font-bold text-slate-900">
                      {item.description || "بند خدمة"}
                    </span>
                    <span className="rc-item-sub text-[9px] uppercase tracking-wider text-slate-400">
                      {itemTypeLabel(item.itemType)} {item.quantity > 1 && `x${item.quantity}`}
                    </span>
                  </div>
                </td>
                <td className="amt py-3 text-left font-mono font-black text-slate-900">
                  {money(item.total)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <hr className="rc-divider border-t-2 border-dashed border-slate-100" />

        {/* الإجماليات */}
        <div className="mt-4 space-y-1.5">
          <div className="rc-line flex justify-between text-xs font-bold text-slate-500">
            <span>المجموع الفرعي</span>
            <span className="amt font-mono">{money(subtotal)}</span>
          </div>

          {discountAmount > 0 && (
            <div className="rc-line flex justify-between text-xs font-bold text-slate-500">
              <span>خصم العميل</span>
              <span className="amt font-mono">-{money(discountAmount)}</span>
            </div>
          )}

          {taxAmount > 0 && (
            <div className="rc-line flex justify-between text-xs font-bold text-slate-500">
              <span>ضريبة</span>
              <span className="amt font-mono">{money(taxAmount)}</span>
            </div>
          )}

          {/* الإجمالي — خطين فوق وتحت زي الصورة */}
          <div className="rc-total flex items-baseline justify-between border-t-2 border-b-2 border-slate-900 py-3 mt-3">
            <span className="text-xs font-black text-slate-900">الإجمالي</span>
            <span className="amt text-4xl font-black tracking-tighter font-mono text-slate-900">{money(totalAmount)}</span>
          </div>

          {/* المدفوع */}
          {amountPaid > 0 && (
            <div className="rc-line flex justify-between text-xs font-bold text-slate-500">
              <span>المدفوع{lastMethod ? ` (${translatePaymentMethod(lastMethod)})` : ""}</span>
              <span className="amt font-mono">{money(amountPaid)}</span>
            </div>
          )}
          {remainingAmount > 0 && (
            <div className="rc-line flex justify-between text-xs font-bold text-rose-600">
              <span>المتبقي</span>
              <span className="amt font-mono">{money(remainingAmount)}</span>
            </div>
          )}

          {/* حالة الدفع — badge بإطار كامل */}
          <div className="rc-status mt-2 rounded-lg border-2 border-slate-900 py-2 text-center text-sm font-black text-slate-900">
            {translateStatus(invoice.paymentStatus)}
          </div>
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
