export function money(value: string | number | null | undefined) {
  const parsed = Math.round(Number(value ?? 0));
  if (Number.isNaN(parsed)) return "0";
  return new Intl.NumberFormat("ar-EG", {
    style: "currency",
    currency: "EGP",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(parsed);
}

export function dateTime(value: string | null | undefined) {
  if (!value) return "-";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "-";
  return d.toLocaleString("ar-EG");
}
