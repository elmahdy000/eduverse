export function money(value: string | number | null | undefined) {
  const parsed = Number(value ?? 0);
  if (Number.isNaN(parsed)) return "0.00";
  return new Intl.NumberFormat("ar-EG", {
    style: "currency",
    currency: "EGP",
    minimumFractionDigits: 2,
  }).format(parsed);
}

export function dateTime(value: string | null | undefined) {
  if (!value) return "-";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "-";
  return d.toLocaleString("ar-EG");
}
