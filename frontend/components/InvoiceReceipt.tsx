"use client";

import type { ReactNode } from "react";
import { Printer, Download, Receipt, Clock, Coffee, Tag, Wallet, CheckCircle2, AlertCircle } from "lucide-react";
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
    case "session":  return "جلسة";
    case "bar_order": return "بار";
    case "discount":  return "خصم";
    default:          return "بند";
  }
}

/* ─────────────────────────────────────────────────────────────────
 * RECEIPT_PRINT_CSS
 * CSS يُحقن في نافذة الطباعة المستقلة فقط — لا يؤثر على الصفحة الأصلية.
 * ─────────────────────────────────────────────────────────────────*/
export const RECEIPT_PRINT_CSS = `
/* Reset صارم لمنع أي إرث من الصفحة الأصلية */
html, body {
  margin: 0 !important;
  padding: 0 !important;
  background: #fff !important;
  width: 80mm !important;
  min-width: 0 !important;
  max-width: 80mm !important;
  overflow: visible !important;
  font-family: 'Cairo', 'Tahoma', sans-serif !important;
  direction: rtl !important;
}

/* الغاء كل transform وposition قد يأتي من أي مكان */
* {
  box-sizing: border-box !important;
  transform: none !important;
  -webkit-transform: none !important;
  transition: none !important;
  animation: none !important;
  backface-visibility: visible !important;
  -webkit-backface-visibility: visible !important;
  perspective: none !important;
  will-change: auto !important;
}

/* حاوي الفاتورة الحرارية */
#thermal-invoice-print {
  display: block !important;
  position: static !important;
  top: auto !important;
  left: auto !important;
  right: auto !important;
  bottom: auto !important;
  transform: none !important;
  width: 74mm !important;
  max-width: 74mm !important;
  min-width: 0 !important;
  margin: 0 auto !important;
  padding: 3mm 2mm 8mm 2mm !important;
  background: #fff !important;
  color: #000 !important;
  direction: rtl !important;
  text-align: right !important;
  font-family: 'Cairo', 'Tahoma', sans-serif !important;
  font-size: 11px !important;
  line-height: 1.5 !important;
  overflow: visible !important;
}

/* رأس الفاتورة */
#thermal-invoice-print .ti-center { text-align: center !important; }
#thermal-invoice-print .ti-venue  { font-size: 20px !important; font-weight: 800 !important; letter-spacing: 1px !important; margin: 0 !important; text-align: center !important; }
#thermal-invoice-print .ti-venue-ar { font-size: 13px !important; font-weight: 700 !important; margin: 1px 0 !important; text-align: center !important; display: block !important; }
#thermal-invoice-print .ti-muted { font-size: 10px !important; color: #000 !important; text-align: center !important; display: block !important; }
#thermal-invoice-print .ti-divider { border: 0 !important; border-top: 1px dashed #000 !important; margin: 6px 0 !important; width: 100% !important; }

/* سطر بيانات (تاريخ / عميل / رقم) */
#thermal-invoice-print .ti-row { display: flex !important; justify-content: space-between !important; font-size: 11px !important; margin: 2px 0 !important; }
#thermal-invoice-print .ti-row .lbl { font-weight: 400 !important; }
#thermal-invoice-print .ti-row .val { font-weight: 700 !important; }

/* جدول البنود */
#thermal-invoice-print table.ti-items { width: 100% !important; border-collapse: collapse !important; font-size: 11px !important; margin: 2px 0 !important; table-layout: fixed !important; }
#thermal-invoice-print table.ti-items th { border-bottom: 1px solid #000 !important; padding: 3px 2px !important; font-weight: 800 !important; font-size: 11px !important; }
#thermal-invoice-print table.ti-items th.c-name { text-align: right !important; width: 48% !important; }
#thermal-invoice-print table.ti-items th.c-qty  { text-align: center !important; width: 14% !important; }
#thermal-invoice-print table.ti-items th.c-amt  { text-align: left !important; width: 19% !important; }
#thermal-invoice-print table.ti-items td { padding: 3px 2px !important; vertical-align: top !important; border-bottom: 1px dotted #999 !important; font-size: 11px !important; }
#thermal-invoice-print table.ti-items td.c-qty  { text-align: center !important; }
#thermal-invoice-print table.ti-items td.c-amt  { text-align: left !important; font-variant-numeric: tabular-nums !important; white-space: nowrap !important; font-weight: 700 !important; }
#thermal-invoice-print .ti-item-name { font-weight: 700 !important; word-break: break-word !important; }
#thermal-invoice-print .ti-item-sub  { font-size: 9px !important; color: #555 !important; }

/* سطر مبلغ (subtotal / discount) */
#thermal-invoice-print .ti-line { display: flex !important; justify-content: space-between !important; font-size: 11px !important; margin: 2px 0 !important; }
#thermal-invoice-print .ti-line .amt { font-variant-numeric: tabular-nums !important; font-weight: 700 !important; }

/* صندوق الإجمالي الكبير */
#thermal-invoice-print .ti-total { display: flex !important; justify-content: space-between !important; align-items: baseline !important; font-size: 15px !important; font-weight: 800 !important; border-top: 2px solid #000 !important; border-bottom: 2px solid #000 !important; padding: 5px 0 !important; margin: 5px 0 !important; }
#thermal-invoice-print .ti-total .amt { font-variant-numeric: tabular-nums !important; font-size: 22px !important; }

/* حالة الدفع */
#thermal-invoice-print .ti-status { text-align: center !important; font-size: 12px !important; font-weight: 800 !important; border: 1.5px solid #000 !important; border-radius: 4px !important; padding: 3px 0 !important; margin: 4px 0 !important; }

/* التذييل */
#thermal-invoice-print .ti-foot    { text-align: center !important; font-size: 11px !important; font-weight: 700 !important; margin-top: 6px !important; }
#thermal-invoice-print .ti-foot-sm { text-align: center !important; font-size: 9px !important; margin-top: 2px !important; }

/* إعدادات الطباعة الحرارية */
@page {
  size: 80mm auto;
  margin: 0;
}
@media print {
  * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
}
`;

/* ─────────────────────────────────────────────────────────────────
 * buildThermalPrintHTML
 * تبني HTML مستقل كامل للطباعة — بدون أي إرث من الصفحة الأصلية.
 * ─────────────────────────────────────────────────────────────────*/
export function buildThermalPrintHTML(invoiceNode: HTMLElement): string {
  return `<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>فاتورة</title>
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;700;800&display=swap" rel="stylesheet" />
  <style>
    ${RECEIPT_PRINT_CSS}
  </style>
</head>
<body>
  ${invoiceNode.outerHTML}
  <script>
    (function () {
      function go() { window.print(); window.close(); }
      if (document.fonts && document.fonts.ready) {
        document.fonts.ready
          .then(function () { setTimeout(go, 200); })
          .catch(function () { setTimeout(go, 500); });
      } else {
        setTimeout(go, 500);
      }
    })();
  <\/script>
</body>
</html>`;
}

/* ─────────────────────────────────────────────────────────────────
 * printThermalInvoice
 * دالة الطباعة المستقلة — تأخذ محتوى الفاتورة وتفتح نافذة نظيفة.
 * ─────────────────────────────────────────────────────────────────*/
export function printThermalInvoice() {
  const node = document.getElementById("thermal-invoice-print");
  if (!node) {
    // Fallback: طباعة النافذة كاملة (لو العنصر مش موجود)
    window.print();
    return;
  }

  const w = window.open("", "_blank", "width=420,height=800,scrollbars=yes");
  if (!w) {
    // لو المتصفح منع popup
    window.print();
    return;
  }

  w.document.write(buildThermalPrintHTML(node));
  w.document.close();
  w.focus();
}

/* ─────────────────────────────────────────────────────────────────
 * InvoiceReceipt Component
 * المكوّن الرئيسي للفاتورة — يعرض على الشاشة ويتيح الطباعة.
 * ─────────────────────────────────────────────────────────────────*/
export function InvoiceReceipt({ invoice, payments = [], onPrint, onDownload }: InvoiceReceiptProps) {
  const totalAmount    = Math.round(Number(invoice.totalAmount || 0));
  const amountPaid     = Math.round(Number(invoice.amountPaid || 0));
  const remainingAmount = Math.round(Number(invoice.remainingAmount || 0));
  const subtotal       = Math.round(Number(invoice.subtotal ?? totalAmount));
  const discountAmount = Math.round(Number(invoice.discountAmount ?? 0));
  const taxAmount      = Math.round(Number(invoice.taxAmount ?? 0));

  const lastMethod = payments.find((p) => Number(p.amount) > 0)?.paymentMethod;

  return (
    <div className="mx-auto max-w-sm overflow-hidden rounded-3xl bg-white shadow-[0_20px_50px_rgba(0,0,0,0.1)] transition-all hover:shadow-[0_30px_70px_rgba(0,0,0,0.15)]">
      {/* ── شريط الأدوات (لا يُطبع) ── */}
      <div className="no-print flex items-center justify-between border-b border-slate-100 bg-slate-50/50 px-6 py-4">
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

      {/* ── محتوى الفاتورة القابل للطباعة ── */}
      {/* 
        ⚠️  الـ id هنا = "thermal-invoice-print" 
        هو اللي بتجيبه دالة printThermalInvoice() 
        يجب أن يبقى خارج أي element يحمل transform أو overflow:hidden 
      */}
      <div
        id="thermal-invoice-print"
        className="thermal-invoice-print"
        dir="rtl"
        style={{
          width: "74mm",
          maxWidth: "74mm",
          margin: "0 auto",
          padding: "8px 6px 16px",
          fontFamily: "'Cairo', 'Tahoma', sans-serif",
          fontSize: "11px",
          lineHeight: "1.5",
          color: "#000",
          background: "#fff",
          direction: "rtl",
          textAlign: "right",
        }}
      >
        {/* الرأس */}
        <div className="ti-center" style={{ marginBottom: 10, textAlign: "center" }}>
          <h1 className="ti-venue"
            style={{ fontSize: 20, fontWeight: 800, letterSpacing: 1, margin: 0, textAlign: "center" }}>
            {VENUE.name}
          </h1>
          <p className="ti-venue-ar"
            style={{ fontSize: 13, fontWeight: 700, margin: "1px 0", textAlign: "center", display: "block" }}>
            {VENUE.nameAr}
          </p>
          <span className="ti-muted"
            style={{ fontSize: 10, color: "#000", textAlign: "center", display: "block" }}>
            {VENUE.tagline}
          </span>
          <span className="ti-muted"
            dir="ltr"
            style={{ fontSize: 10, color: "#000", textAlign: "center", display: "block" }}>
            ☎ {VENUE.phone}
          </span>
        </div>

        <hr className="ti-divider"
          style={{ border: 0, borderTop: "1px dashed #000", margin: "6px 0", width: "100%" }} />

        {/* بيانات الفاتورة */}
        <div className="ti-row" style={{ display: "flex", justifyContent: "space-between", fontSize: 11, margin: "2px 0" }}>
          <span style={{ fontWeight: 400 }}>التاريخ:</span>
          <span style={{ fontWeight: 700 }}>{dateTime(invoice.issuedAt)}</span>
        </div>
        <div className="ti-row" style={{ display: "flex", justifyContent: "space-between", fontSize: 11, margin: "2px 0" }}>
          <span style={{ fontWeight: 400 }}>العميل:</span>
          <span style={{ fontWeight: 700 }}>{invoice.customer?.fullName ?? "عميل عام"}</span>
        </div>
        <div className="ti-row" style={{ display: "flex", justifyContent: "space-between", fontSize: 11, margin: "2px 0" }}>
          <span style={{ fontWeight: 400 }}>رقم الفاتورة:</span>
          <span style={{ fontWeight: 700, wordBreak: "break-all" }}>{invoice.invoiceNumber}</span>
        </div>
        {invoice.notes && (
          <div className="ti-row" style={{ display: "flex", justifyContent: "space-between", fontSize: 11, margin: "2px 0" }}>
            <span style={{ fontWeight: 400 }}>ملاحظات:</span>
            <span style={{ fontWeight: 700 }}>{invoice.notes}</span>
          </div>
        )}

        <hr className="ti-divider"
          style={{ border: 0, borderTop: "1px dashed #000", margin: "6px 0", width: "100%" }} />

        {/* جدول البنود */}
        <table className="ti-items"
          style={{ width: "100%", borderCollapse: "collapse", fontSize: 11, margin: "2px 0", tableLayout: "fixed" }}>
          <thead>
            <tr>
              <th className="c-name" style={{ textAlign: "right", width: "48%", borderBottom: "1px solid #000", padding: "3px 2px", fontWeight: 800 }}>الصنف</th>
              <th className="c-qty"  style={{ textAlign: "center", width: "14%", borderBottom: "1px solid #000", padding: "3px 2px", fontWeight: 800 }}>الكمية</th>
              <th className="c-amt"  style={{ textAlign: "left", width: "19%", borderBottom: "1px solid #000", padding: "3px 2px", fontWeight: 800 }}>السعر</th>
              <th className="c-amt"  style={{ textAlign: "left", width: "19%", borderBottom: "1px solid #000", padding: "3px 2px", fontWeight: 800 }}>المبلغ</th>
            </tr>
          </thead>
          <tbody>
            {(invoice.items ?? []).map((item) => (
              <tr key={item.id ?? `${item.itemType}-${item.description}`}>
                <td style={{ padding: "3px 2px", verticalAlign: "top", borderBottom: "1px dotted #999" }}>
                  <div className="ti-item-name" style={{ fontWeight: 700, wordBreak: "break-word" }}>
                    {item.description || "بند خدمة"}
                  </div>
                  <div className="ti-item-sub" style={{ fontSize: 9, color: "#555" }}>
                    {itemTypeLabel(item.itemType)}
                  </div>
                </td>
                <td className="c-qty" style={{ textAlign: "center", padding: "3px 2px", borderBottom: "1px dotted #999" }}>
                  {item.quantity || 1}
                </td>
                <td className="c-amt" style={{ textAlign: "left", fontVariantNumeric: "tabular-nums", whiteSpace: "nowrap", fontWeight: 700, padding: "3px 2px", borderBottom: "1px dotted #999" }}>
                  {money(item.unitPrice ?? item.total)}
                </td>
                <td className="c-amt" style={{ textAlign: "left", fontVariantNumeric: "tabular-nums", whiteSpace: "nowrap", fontWeight: 700, padding: "3px 2px", borderBottom: "1px dotted #999" }}>
                  {money(item.total)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <hr className="ti-divider"
          style={{ border: 0, borderTop: "1px dashed #000", margin: "6px 0", width: "100%" }} />

        {/* الإجماليات */}
        <div className="ti-line" style={{ display: "flex", justifyContent: "space-between", fontSize: 11, margin: "2px 0" }}>
          <span>المجموع الفرعي</span>
          <span style={{ fontVariantNumeric: "tabular-nums", fontWeight: 700 }}>{money(subtotal)}</span>
        </div>
        {discountAmount > 0 && (
          <div className="ti-line" style={{ display: "flex", justifyContent: "space-between", fontSize: 11, margin: "2px 0" }}>
            <span>خصم العميل</span>
            <span style={{ fontVariantNumeric: "tabular-nums", fontWeight: 700 }}>- {money(discountAmount)}</span>
          </div>
        )}
        {taxAmount > 0 && (
          <div className="ti-line" style={{ display: "flex", justifyContent: "space-between", fontSize: 11, margin: "2px 0" }}>
            <span>ضريبة</span>
            <span style={{ fontVariantNumeric: "tabular-nums", fontWeight: 700 }}>{money(taxAmount)}</span>
          </div>
        )}

        {/* الإجمالي الكبير */}
        <div className="ti-total" style={{
          display: "flex", justifyContent: "space-between", alignItems: "baseline",
          fontSize: 15, fontWeight: 800,
          borderTop: "2px solid #000", borderBottom: "2px solid #000",
          padding: "5px 0", margin: "5px 0",
        }}>
          <span>الإجمالي</span>
          <span className="amt" style={{ fontVariantNumeric: "tabular-nums", fontSize: 22 }}>
            {money(totalAmount)}
          </span>
        </div>

        {/* المدفوع والمتبقي */}
        {amountPaid > 0 && (
          <div className="ti-line" style={{ display: "flex", justifyContent: "space-between", fontSize: 11, margin: "2px 0" }}>
            <span>المدفوع{lastMethod ? ` (${translatePaymentMethod(lastMethod)})` : ""}</span>
            <span style={{ fontVariantNumeric: "tabular-nums", fontWeight: 700 }}>{money(amountPaid)}</span>
          </div>
        )}
        {remainingAmount > 0 && (
          <div className="ti-line" style={{ display: "flex", justifyContent: "space-between", fontSize: 11, margin: "2px 0", color: "#dc2626" }}>
            <span>المتبقي</span>
            <span style={{ fontVariantNumeric: "tabular-nums", fontWeight: 700 }}>{money(remainingAmount)}</span>
          </div>
        )}

        {/* حالة الدفع */}
        <div className="ti-status" style={{
          textAlign: "center", fontSize: 12, fontWeight: 800,
          border: "1.5px solid #000", borderRadius: 4,
          padding: "3px 0", margin: "4px 0",
        }}>
          {translateStatus(invoice.paymentStatus)}
        </div>

        {/* التذييل */}
        <div style={{ marginTop: 14, borderTop: "1px dashed #000", paddingTop: 10 }}>
          <p className="ti-foot" style={{ textAlign: "center", fontSize: 11, fontWeight: 700, marginTop: 6 }}>
            شكراً لزيارتكم — نتمنى لكم يوماً سعيداً!
          </p>
          <p className="ti-foot-sm" style={{ textAlign: "center", fontSize: 9, marginTop: 2 }}>
            {invoice.invoiceNumber}
          </p>
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────
 * SessionCloseSummary
 * ملخص على الشاشة فقط — لا يُطبع.
 * ─────────────────────────────────────────────────────────────────*/
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
    items.filter((i) => i.itemType === type).reduce((s, i) => s + Number(i.total || 0), 0);

  const sessionTotal  = sum("session");
  const barTotal      = sum("bar_order");
  const barItemsCount =
    barOrdersCount ??
    items.filter((i) => i.itemType === "bar_order").reduce((s, i) => s + Number(i.quantity || 0), 0);

  const discount  = Math.abs(Number(invoice.discountAmount ?? 0) || sum("discount"));
  const total     = Math.round(Number(invoice.totalAmount || 0));
  const paid      = Math.round(Number(invoice.amountPaid || 0));
  const remaining = Math.round(Number(invoice.remainingAmount || 0));
  const isPaid    = remaining <= 0;

  const durationLabel = (() => {
    if (!durationMinutes || durationMinutes <= 0) return null;
    const h = Math.floor(durationMinutes / 60);
    const m = durationMinutes % 60;
    if (h > 0 && m > 0) return `${h} ساعة و ${m} دقيقة`;
    if (h > 0) return `${h} ساعة`;
    return `${m} دقيقة`;
  })();

  const Row = ({
    icon, label, value, tone = "slate", sub,
  }: {
    icon: ReactNode; label: string; value: string;
    tone?: "slate" | "amber" | "rose" | "emerald"; sub?: string;
  }) => {
    const toneMap: Record<string, string> = {
      slate:   "text-slate-500 bg-slate-100",
      amber:   "text-amber-600 bg-amber-100",
      rose:    "text-rose-600 bg-rose-100",
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
          <Row icon={<Clock size={15} />} label="تكلفة الجلسة" sub={durationLabel ?? undefined} value={money(sessionTotal)} />
        )}
        {barTotal > 0 && (
          <Row icon={<Coffee size={15} />} label="طلبات البار" tone="amber"
            sub={barItemsCount > 0 ? `${barItemsCount} صنف` : undefined} value={money(barTotal)} />
        )}
        {discount > 0 && (
          <Row icon={<Tag size={15} />} label="الخصم" tone="rose" value={`- ${money(discount)}`} />
        )}
      </div>

      <div className="mx-6 my-2 flex items-baseline justify-between border-y-2 border-slate-900 py-3">
        <span className="text-xs font-black text-slate-900">الإجمالي</span>
        <span className="font-mono text-3xl font-black tracking-tight text-slate-900">{money(total)}</span>
      </div>

      <div className="px-6 pb-2">
        {paid > 0 && <Row icon={<Wallet size={15} />} label="المدفوع" tone="emerald" value={money(paid)} />}
        {remaining > 0 && <Row icon={<AlertCircle size={15} />} label="المتبقي" tone="rose" value={money(remaining)} />}
      </div>

      <div className="px-6 pb-5 pt-1">
        <div className={`rounded-xl py-2.5 text-center text-sm font-black ${isPaid ? "bg-emerald-500 text-white" : "bg-amber-100 text-amber-800"}`}>
          {translateStatus(invoice.paymentStatus)}
        </div>
      </div>
    </div>
  );
}
