"use client";

import type { ReactNode } from "react";
import {
  Printer, Download, Receipt,
  Clock, Coffee, Tag, Wallet, CheckCircle2, AlertCircle,
} from "lucide-react";
import { money, dateTime } from "../lib/format";
import { translateStatus, translatePaymentMethod } from "../lib/labels";
import type { Invoice, Payment } from "../lib/types";

/* ─────────────── types ─────────────── */
interface InvoiceReceiptProps {
  invoice: Invoice;
  payments?: Payment[];
  onPrint?: () => void;
  onDownload?: () => void;
}

/* ─────────────── venue config ─────────────── */
const VENUE = {
  name: "EDUVERSE",
  nameAr: "إيدوفيرس",
  tagline: "Workspace & Education Hub • مساحة عمل وتعليم",
  phone: "+20 123 456 7890",
};

/* ─────────────── helpers ─────────────── */
function itemTypeLabel(t: string) {
  const m: Record<string, string> = { session: "جلسة", bar_order: "بار", discount: "خصم" };
  return m[t] ?? "بند";
}

/* ══════════════════════════════════════════════════════════════
 * THERMAL PRINT CSS
 * يُحقن في <head> الصفحة الأصلية مؤقتاً أثناء الطباعة.
 * يُستخدم ".thermal-receipt" كـ selector حتى يطبّق على الـ clone.
 * ══════════════════════════════════════════════════════════════ */
const THERMAL_PRINT_CSS = `
@page {
  size: 80mm auto;
  margin: 0;
}

/* أثناء الطباعة: اخفِ كل شيء وأظهر الفاتورة فقط */
@media print {
  html, body {
    margin: 0 !important;
    padding: 0 !important;
    background: #fff !important;
    -webkit-print-color-adjust: exact !important;
    print-color-adjust: exact !important;
  }

  /* اخفِ كل شيء */
  body > * {
    display: none !important;
  }

  /* أظهر فقط حاوي الطباعة */
  body > #__thermal_print_root__ {
    display: block !important;
  }

  #__thermal_print_root__ {
    position: static !important;
    top: 0 !important;
    left: 0 !important;
    right: 0 !important;
    transform: none !important;
    width: 76mm !important;
    max-width: 76mm !important;
    margin: 0 auto !important;
    padding: 0 !important;
    background: #fff !important;
    overflow: visible !important;
  }

  .thermal-receipt {
    display: block !important;
    position: static !important;
    transform: none !important;
    width: 74mm !important;
    max-width: 74mm !important;
    margin: 0 auto !important;
    padding: 3mm 2mm 10mm !important;
    background: #fff !important;
    color: #000 !important;
    font-family: 'Cairo', 'Tahoma', sans-serif !important;
    font-size: 11px !important;
    line-height: 1.5 !important;
    direction: rtl !important;
    text-align: right !important;
    overflow: visible !important;
    box-sizing: border-box !important;
  }

  .thermal-receipt * {
    box-sizing: border-box !important;
    transform: none !important;
  }
}
`;

/* ══════════════════════════════════════════════════════════════
 * printThermalInvoice
 * الخطوات:
 * 1. Clone عنصر #thermal-invoice-print
 * 2. أضف الـ clone مباشرة لـ document.body (خارج أي Modal/Dialog)
 * 3. أضف <style> في <head> يخفي كل شيء ويظهر الفاتورة فقط
 * 4. window.print()
 * 5. تنظيف بعد الطباعة (afterprint event)
 * ══════════════════════════════════════════════════════════════ */
export function printThermalInvoice() {
  if (typeof window === "undefined") return;

  const receipt = document.getElementById("thermal-invoice-print");
  if (!receipt) {
    window.print();
    return;
  }

  const w = window.open("", "_blank", "width=450,height=750,top=50,left=50");
  if (!w) {
    window.print();
    return;
  }

  const htmlContent = `<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>معاينة وطباعة الفاتورة - Eduverse</title>
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;700;800&display=swap" rel="stylesheet" />
  <style>
    @page {
      size: 80mm auto;
      margin: 0;
    }
    * {
      box-sizing: border-box !important;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }
    html, body {
      margin: 0 !important;
      padding: 0 !important;
      background: #f1f5f9;
      font-family: 'Cairo', 'Tahoma', sans-serif !important;
      direction: rtl !important;
    }
    .preview-toolbar {
      position: sticky;
      top: 0;
      background: #0f172a;
      color: #fff;
      padding: 12px 20px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
      z-index: 999;
    }
    .preview-toolbar h2 {
      margin: 0;
      font-size: 14px;
      font-weight: 800;
    }
    .preview-btn {
      background: #3b82f6;
      color: #fff;
      border: none;
      padding: 8px 16px;
      border-radius: 8px;
      font-family: inherit;
      font-weight: 700;
      font-size: 13px;
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 6px;
    }
    .preview-btn:hover {
      background: #2563eb;
    }
    .preview-container {
      display: flex;
      justify-content: center;
      padding: 20px 10px;
    }
    .thermal-receipt-wrap {
      background: #ffffff;
      width: 76mm;
      box-shadow: 0 10px 25px rgba(0,0,0,0.1);
      border-radius: 4px;
      overflow: hidden;
    }
    @media print {
      .preview-toolbar {
        display: none !important;
      }
      .preview-container {
        padding: 0 !important;
      }
      .thermal-receipt-wrap {
        box-shadow: none !important;
        width: 76mm !important;
        margin: 0 auto !important;
      }
      html, body {
        background: #fff !important;
      }
    }
  </style>
</head>
<body>
  <div class="preview-toolbar">
    <h2>🖨️ معاينة طباعة الفاتورة (80mm)</h2>
    <button class="preview-btn" onclick="window.print()">طباعة الفاتورة الأن</button>
  </div>
  <div class="preview-container">
    <div class="thermal-receipt-wrap">
      ${receipt.outerHTML}
    </div>
  </div>
  <script>
    (function () {
      function triggerPrint() {
        setTimeout(function() {
          window.print();
        }, 300);
      }
      if (document.fonts && document.fonts.ready) {
        document.fonts.ready.then(triggerPrint).catch(triggerPrint);
      } else {
        triggerPrint();
      }
    })();
  <\/script>
</body>
</html>`;

  w.document.write(htmlContent);
  w.document.close();
  w.focus();
}

/* ══════════════════════════════════════════════════════════════
 * InvoiceReceipt Component
 * ══════════════════════════════════════════════════════════════ */
export function InvoiceReceipt({
  invoice, payments = [], onPrint, onDownload,
}: InvoiceReceiptProps) {
  const totalAmount     = Math.round(Number(invoice.totalAmount   || 0));
  const amountPaid      = Math.round(Number(invoice.amountPaid    || 0));
  const remainingAmount = Math.round(Number(invoice.remainingAmount || 0));
  const subtotal        = Math.round(Number(invoice.subtotal      ?? totalAmount));
  const discountAmount  = Math.round(Number(invoice.discountAmount ?? 0));
  const taxAmount       = Math.round(Number(invoice.taxAmount     ?? 0));
  const lastMethod      = payments.find((p) => Number(p.amount) > 0)?.paymentMethod;

  /* ── inline styles (يشتغلوا حتى في نافذة الطباعة بدون Tailwind) ── */
  const S = {
    wrap: {
      width: "74mm", maxWidth: "74mm", margin: "0 auto",
      padding: "8px 6px 20px", fontFamily: "'Cairo','Tahoma',sans-serif",
      fontSize: "11px", lineHeight: "1.5", color: "#000", background: "#fff",
      direction: "rtl" as const, textAlign: "right" as const,
      boxSizing: "border-box" as const,
    } as React.CSSProperties,
    center: { textAlign: "center" as const } as React.CSSProperties,
    venue:  { fontSize: 20, fontWeight: 800, letterSpacing: 1, margin: 0, textAlign: "center" as const } as React.CSSProperties,
    venueAr:{ fontSize: 13, fontWeight: 700, margin: "1px 0", textAlign: "center" as const, display: "block" } as React.CSSProperties,
    muted:  { fontSize: 10, color: "#000", textAlign: "center" as const, display: "block" } as React.CSSProperties,
    divider:{ border: 0, borderTop: "1px dashed #000", margin: "6px 0", width: "100%" } as React.CSSProperties,
    row:    { display: "flex", justifyContent: "space-between", fontSize: 11, margin: "2px 0" } as React.CSSProperties,
    lbl:    { fontWeight: 400 } as React.CSSProperties,
    val:    { fontWeight: 700, wordBreak: "break-all" as const } as React.CSSProperties,
    table:  { width: "100%", borderCollapse: "collapse" as const, fontSize: 11, margin: "2px 0", tableLayout: "fixed" as const } as React.CSSProperties,
    thName: { textAlign: "right" as const, width: "46%", borderBottom: "1px solid #000", padding: "3px 2px", fontWeight: 800, fontSize: 11 } as React.CSSProperties,
    thQty:  { textAlign: "center" as const, width: "14%", borderBottom: "1px solid #000", padding: "3px 2px", fontWeight: 800, fontSize: 11 } as React.CSSProperties,
    thAmt:  { textAlign: "left" as const, width: "20%", borderBottom: "1px solid #000", padding: "3px 2px", fontWeight: 800, fontSize: 11 } as React.CSSProperties,
    tdBase: { padding: "3px 2px", verticalAlign: "top" as const, borderBottom: "1px dotted #999", fontSize: 11 } as React.CSSProperties,
    tdQty:  { padding: "3px 2px", textAlign: "center" as const, borderBottom: "1px dotted #999", fontSize: 11 } as React.CSSProperties,
    tdAmt:  { padding: "3px 2px", textAlign: "left" as const, fontVariantNumeric: "tabular-nums" as const, whiteSpace: "nowrap" as const, fontWeight: 700, borderBottom: "1px dotted #999", fontSize: 11 } as React.CSSProperties,
    itemName:{ fontWeight: 700, wordBreak: "break-word" as const } as React.CSSProperties,
    itemSub: { fontSize: 9, color: "#555" } as React.CSSProperties,
    line:   { display: "flex", justifyContent: "space-between", fontSize: 11, margin: "2px 0" } as React.CSSProperties,
    lineAmt:{ fontVariantNumeric: "tabular-nums" as const, fontWeight: 700 } as React.CSSProperties,
    total:  { display: "flex", justifyContent: "space-between", alignItems: "baseline", fontWeight: 800, borderTop: "2px solid #000", borderBottom: "2px solid #000", padding: "5px 0", margin: "5px 0" } as React.CSSProperties,
    totalLbl:{ fontSize: 15 } as React.CSSProperties,
    totalAmt:{ fontSize: 22, fontVariantNumeric: "tabular-nums" as const } as React.CSSProperties,
    status: { textAlign: "center" as const, fontSize: 12, fontWeight: 800, border: "1.5px solid #000", borderRadius: 4, padding: "3px 0", margin: "4px 0" } as React.CSSProperties,
    foot:   { textAlign: "center" as const, fontSize: 11, fontWeight: 700, marginTop: 6 } as React.CSSProperties,
    footSm: { textAlign: "center" as const, fontSize: 9, marginTop: 2 } as React.CSSProperties,
    footer: { marginTop: 14, borderTop: "1px dashed #000", paddingTop: 10 } as React.CSSProperties,
  };

  return (
    <div className="mx-auto max-w-sm overflow-hidden rounded-3xl bg-white shadow-[0_20px_50px_rgba(0,0,0,0.1)]">

      {/* ── شريط الأدوات (لا يُطبع أبداً) ── */}
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
            className="flex items-center gap-1.5 rounded-lg bg-slate-900 px-3 py-2 text-xs font-bold text-white hover:bg-slate-800 transition-colors"
          >
            <Printer size={14} /> طباعة
          </button>
          <button
            onClick={onDownload}
            className="rounded-lg bg-slate-100 p-2 text-slate-600 hover:bg-slate-200 transition-colors"
          >
            <Download size={14} />
          </button>
        </div>
      </div>

      {/* ══ محتوى الفاتورة ══
          id="thermal-invoice-print"  ← دالة printThermalInvoice تجيبه من هنا
          كل الـ styles inline عشان تشتغل بعد الـ clone في body
      */}
      <div
        id="thermal-invoice-print"
        className="thermal-receipt"
        dir="rtl"
        style={S.wrap}
      >
        {/* الرأس */}
        <div style={{ ...S.center, marginBottom: 10 }}>
          <h1 style={S.venue}>{VENUE.name}</h1>
          <p  style={S.venueAr}>{VENUE.nameAr}</p>
          <span style={S.muted}>{VENUE.tagline}</span>
          <span style={S.muted} dir="ltr">☎ {VENUE.phone}</span>
        </div>

        <hr style={S.divider} />

        {/* بيانات الفاتورة */}
        <div style={S.row}><span style={S.lbl}>التاريخ:</span>      <span style={S.val}>{dateTime(invoice.issuedAt)}</span></div>
        <div style={S.row}><span style={S.lbl}>العميل:</span>       <span style={S.val}>{invoice.customer?.fullName ?? "عميل عام"}</span></div>
        <div style={S.row}><span style={S.lbl}>رقم الفاتورة:</span> <span style={S.val}>{invoice.invoiceNumber}</span></div>
        {invoice.notes && (
          <div style={S.row}><span style={S.lbl}>ملاحظات:</span>   <span style={S.val}>{invoice.notes}</span></div>
        )}

        <hr style={S.divider} />

        {/* جدول البنود */}
        <table style={S.table}>
          <thead>
            <tr>
              <th style={S.thName}>الصنف</th>
              <th style={S.thQty}>الكمية</th>
              <th style={S.thAmt}>السعر</th>
              <th style={S.thAmt}>المبلغ</th>
            </tr>
          </thead>
          <tbody>
            {(invoice.items ?? []).map((item) => (
              <tr key={item.id ?? `${item.itemType}-${item.description}`}>
                <td style={S.tdBase}>
                  <div style={S.itemName}>{item.description || "بند خدمة"}</div>
                  <div style={S.itemSub}>{itemTypeLabel(item.itemType)}</div>
                </td>
                <td style={S.tdQty}>{item.quantity || 1}</td>
                <td style={S.tdAmt}>{money(item.unitPrice ?? item.total)}</td>
                <td style={S.tdAmt}>{money(item.total)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <hr style={S.divider} />

        {/* الإجماليات */}
        <div style={S.line}><span>المجموع الفرعي</span><span style={S.lineAmt}>{money(subtotal)}</span></div>
        {discountAmount > 0 && (
          <div style={S.line}><span>خصم العميل</span><span style={S.lineAmt}>- {money(discountAmount)}</span></div>
        )}
        {taxAmount > 0 && (
          <div style={S.line}><span>ضريبة</span><span style={S.lineAmt}>{money(taxAmount)}</span></div>
        )}

        {/* الإجمالي الكبير */}
        <div style={S.total}>
          <span style={S.totalLbl}>الإجمالي</span>
          <span style={S.totalAmt}>{money(totalAmount)}</span>
        </div>

        {/* المدفوع والمتبقي */}
        {amountPaid > 0 && (
          <div style={S.line}>
            <span>المدفوع{lastMethod ? ` (${translatePaymentMethod(lastMethod)})` : ""}</span>
            <span style={S.lineAmt}>{money(amountPaid)}</span>
          </div>
        )}
        {remainingAmount > 0 && (
          <div style={{ ...S.line, color: "#dc2626" }}>
            <span>المتبقي</span>
            <span style={S.lineAmt}>{money(remainingAmount)}</span>
          </div>
        )}

        {/* حالة الدفع */}
        <div style={S.status}>{translateStatus(invoice.paymentStatus)}</div>

        {/* التذييل */}
        <div style={S.footer}>
          <p style={S.foot}>شكراً لزيارتكم — نتمنى لكم يوماً سعيداً!</p>
          <p style={S.footSm}>{invoice.invoiceNumber}</p>
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════
 * SessionCloseSummary  (screen-only, no print)
 * ══════════════════════════════════════════════════════════════ */
export function SessionCloseSummary({
  invoice, durationMinutes, barOrdersCount,
}: {
  invoice: Invoice;
  durationMinutes?: number | null;
  barOrdersCount?: number | null;
}) {
  const items       = invoice.items ?? [];
  const sum         = (t: string) => items.filter((i) => i.itemType === t).reduce((s, i) => s + Number(i.total || 0), 0);
  const sessionTotal = sum("session");
  const barTotal     = sum("bar_order");
  const barItemsCount =
    barOrdersCount ??
    items.filter((i) => i.itemType === "bar_order").reduce((s, i) => s + Number(i.quantity || 0), 0);
  const discount  = Math.abs(Number(invoice.discountAmount ?? 0) || sum("discount"));
  const total     = Math.round(Number(invoice.totalAmount    || 0));
  const paid      = Math.round(Number(invoice.amountPaid     || 0));
  const remaining = Math.round(Number(invoice.remainingAmount || 0));
  const isPaid    = remaining <= 0;

  const dl = (() => {
    if (!durationMinutes || durationMinutes <= 0) return null;
    const h = Math.floor(durationMinutes / 60), m = durationMinutes % 60;
    return h > 0 && m > 0 ? `${h} ساعة و ${m} دقيقة` : h > 0 ? `${h} ساعة` : `${m} دقيقة`;
  })();

  const Row = ({ icon, label, value, tone = "slate", sub }: {
    icon: ReactNode; label: string; value: string;
    tone?: "slate" | "amber" | "rose" | "emerald"; sub?: string;
  }) => {
    const c: Record<string, string> = {
      slate: "text-slate-500 bg-slate-100", amber: "text-amber-600 bg-amber-100",
      rose: "text-rose-600 bg-rose-100",   emerald: "text-emerald-600 bg-emerald-100",
    };
    return (
      <div className="flex items-center justify-between py-2">
        <div className="flex items-center gap-2.5">
          <span className={`flex h-8 w-8 items-center justify-center rounded-lg ${c[tone]}`}>{icon}</span>
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
        {sessionTotal > 0 && <Row icon={<Clock size={15} />} label="تكلفة الجلسة" sub={dl ?? undefined} value={money(sessionTotal)} />}
        {barTotal     > 0 && <Row icon={<Coffee size={15} />} label="طلبات البار" tone="amber" sub={barItemsCount > 0 ? `${barItemsCount} صنف` : undefined} value={money(barTotal)} />}
        {discount     > 0 && <Row icon={<Tag size={15} />} label="الخصم" tone="rose" value={`- ${money(discount)}`} />}
      </div>
      <div className="mx-6 my-2 flex items-baseline justify-between border-y-2 border-slate-900 py-3">
        <span className="text-xs font-black text-slate-900">الإجمالي</span>
        <span className="font-mono text-3xl font-black tracking-tight text-slate-900">{money(total)}</span>
      </div>
      <div className="px-6 pb-2">
        {paid      > 0 && <Row icon={<Wallet size={15} />}       label="المدفوع" tone="emerald" value={money(paid)} />}
        {remaining > 0 && <Row icon={<AlertCircle size={15} />}  label="المتبقي" tone="rose"    value={money(remaining)} />}
      </div>
      <div className="px-6 pb-5 pt-1">
        <div className={`rounded-xl py-2.5 text-center text-sm font-black ${isPaid ? "bg-emerald-500 text-white" : "bg-amber-100 text-amber-800"}`}>
          {translateStatus(invoice.paymentStatus)}
        </div>
      </div>
    </div>
  );
}
