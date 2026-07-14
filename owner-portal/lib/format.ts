export function fmtMoney(value: number | null | undefined): string {
  if (value === null || value === undefined || isNaN(Number(value))) return "—";
  const num = Number(value);
  return num.toLocaleString("ar-EG", {
    style: "currency",
    currency: "EGP",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export function fmtNumber(value: number | null | undefined, digits = 0): string {
  if (value === null || value === undefined || isNaN(Number(value))) return "—";
  return Number(value).toLocaleString("ar-EG", {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  });
}

export function fmtPercent(value: number | null | undefined): string {
  if (value === null || value === undefined || isNaN(Number(value))) return "—";
  const sign = value > 0 ? "+" : "";
  return `${sign}${Number(value).toFixed(1)}%`;
}

export function fmtDate(iso: string | Date | null | undefined): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("ar-EG", {
    year: "numeric",
    month: "short",
    day: "2-digit",
  });
}

export function fmtDateTime(iso: string | Date | null | undefined): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "—";
  return d.toLocaleString("ar-EG", {
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/**
 * يرجّع نطاق تاريخ بصيغة yyyy-MM-dd جاهزة للاستخدام في inputs
 */
export function ymd(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function preset(range: "today" | "week" | "month" | "quarter"): { from: string; to: string } {
  const now = new Date();
  const to = ymd(now);
  const from = new Date(now);
  if (range === "today") {
    // نفس اليوم
  } else if (range === "week") {
    from.setDate(now.getDate() - 6);
  } else if (range === "month") {
    from.setDate(now.getDate() - 29);
  } else if (range === "quarter") {
    from.setDate(now.getDate() - 89);
  }
  return { from: ymd(from), to };
}

const PAYMENT_METHOD_LABELS: Record<string, string> = {
  cash: "نقدي",
  card: "بطاقة",
  bank_transfer: "تحويل بنكي",
  wallet: "محفظة",
  mixed: "متعدد",
};

export function paymentMethodLabel(m: string): string {
  return PAYMENT_METHOD_LABELS[m] || m;
}

const CUSTOMER_TYPE_LABELS: Record<string, string> = {
  student: "طالب",
  employee: "موظف",
  trainer: "محاضر",
  parent: "ولي أمر",
  visitor: "زائر",
  staff: "طاقم",
  owner_discount: "مالك (خصم)",
};

export function customerTypeLabel(t: string): string {
  return CUSTOMER_TYPE_LABELS[t] || t || "—";
}
