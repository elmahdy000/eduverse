/**
 * format.ts — EDUVERSE formatting utilities
 *
 * Egyptian locale (ar-EG) with Western (Latin) digits throughout.
 * All functions are pure, side-effect-free named exports.
 * Null / undefined inputs return a safe fallback ("-" or "0").
 */

// ---------------------------------------------------------------------------
// Internal constants & helpers
// ---------------------------------------------------------------------------

/** Arabic locale tag — kept as a constant so it's easy to change. */
const AR = "ar-EG";

/** Always produce Western (Latin) digits, never Arabic-Indic. */
const LATIN: Intl.NumberFormatOptions = { numberingSystem: "latn" };

/** Convert a raw number to a Western-digit string without grouping. */
function westernInt(n: number): string {
  return n.toLocaleString("en-US", { useGrouping: false });
}

/** Pad an integer to at least `width` digits with leading zeros. */
function pad(n: number, width = 2): string {
  return westernInt(n).padStart(width, "0");
}

/** Coerce any date-like value to a Date, returning null on failure. */
function toDate(value: string | Date | null | undefined): Date | null {
  if (value == null) return null;
  const d = value instanceof Date ? value : new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
}

// ---------------------------------------------------------------------------
// 1. money(value)
// ---------------------------------------------------------------------------

/**
 * Format Egyptian currency with exactly two decimal places and Western digits.
 * Output example: "80.00 ج.م"
 *
 * The result is designed to sit inside a `.ltr-value` CSS class so the
 * number reads left-to-right inside the RTL layout.
 */
export function money(value: string | number | null | undefined): string {
  const num = Number(value ?? 0);
  if (Number.isNaN(num)) return "0.00 ج.م";

  const formatted = new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(num);

  return `${formatted} ج.م`;
}

// ---------------------------------------------------------------------------
// 2. dateShort(value)
// ---------------------------------------------------------------------------

/**
 * Short date for tables with Western digits.
 * Output example: "30/07/2026"
 */
export function dateShort(value: string | Date | null | undefined): string {
  const d = toDate(value);
  if (!d) return "-";

  const day = pad(d.getDate());
  const month = pad(d.getMonth() + 1);
  const year = westernInt(d.getFullYear());

  return `${day}/${month}/${year}`;
}

// ---------------------------------------------------------------------------
// 3. dateFull(value)
// ---------------------------------------------------------------------------

/**
 * Full Arabic date with weekday name and Western digits.
 * Output example: "الأربعاء 30 يوليو 2026"
 */
export function dateFull(value: string | Date | null | undefined): string {
  const d = toDate(value);
  if (!d) return "-";

  return new Intl.DateTimeFormat(AR, {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    ...LATIN,
  } as Intl.DateTimeFormatOptions).format(d);
}

// ---------------------------------------------------------------------------
// 4. timeShort(value)
// ---------------------------------------------------------------------------

/**
 * 12-hour time in Arabic with Western digits.
 * Output example: "02:30 م"
 */
export function timeShort(value: string | Date | null | undefined): string {
  const d = toDate(value);
  if (!d) return "-";

  return new Intl.DateTimeFormat(AR, {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
    ...LATIN,
  } as Intl.DateTimeFormatOptions).format(d);
}

// ---------------------------------------------------------------------------
// 5. dateTime(value)
// ---------------------------------------------------------------------------

/**
 * Combined date + time with Western digits.
 * Output example: "30 يوليو 2026، 02:30 م"
 */
export function dateTime(value: string | Date | null | undefined): string {
  const d = toDate(value);
  if (!d) return "-";

  return new Intl.DateTimeFormat(AR, {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
    ...LATIN,
  } as Intl.DateTimeFormatOptions).format(d);
}

// ---------------------------------------------------------------------------
// 6. relativeTime(value)
// ---------------------------------------------------------------------------

/**
 * Human-friendly relative time in Arabic with Western digits.
 * Output examples: "منذ 5 دقائق", "منذ ساعتين", "منذ 3 أيام"
 * Falls back to dateFull() for dates older than a year or in the future.
 */
export function relativeTime(value: string | Date | null | undefined): string {
  const d = toDate(value);
  if (!d) return "-";

  const diffMs = Date.now() - d.getTime();
  const diffSec = Math.floor(diffMs / 1000);

  if (diffSec < 0) {
    // Future date — show absolute
    return dateFull(d);
  }

  const rtf = new Intl.RelativeTimeFormat(AR, { numeric: "auto", ...LATIN } as Intl.RelativeTimeFormatOptions);

  if (diffSec < 60) return rtf.format(-diffSec, "second");
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return rtf.format(-diffMin, "minute");
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return rtf.format(-diffHr, "hour");
  const diffDay = Math.floor(diffHr / 24);
  if (diffDay < 30) return rtf.format(-diffDay, "day");
  const diffMo = Math.floor(diffDay / 30);
  if (diffMo < 12) return rtf.format(-diffMo, "month");
  const diffYr = Math.floor(diffMo / 12);
  return rtf.format(-diffYr, "year");
}

// ---------------------------------------------------------------------------
// 7. duration(minutes)
// ---------------------------------------------------------------------------

/**
 * Format an integer number of minutes as a human-readable Arabic duration
 * with Western digits.
 * Output examples: "2 ساعة 30 دقيقة", "45 دقيقة", "0 دقيقة"
 */
export function duration(minutes: number | null | undefined): string {
  const mins = Math.max(0, Math.floor(Number(minutes ?? 0)));
  if (Number.isNaN(mins)) return "0 دقيقة";

  const hours = Math.floor(mins / 60);
  const remainingMins = mins % 60;

  const parts: string[] = [];
  if (hours > 0) parts.push(`${westernInt(hours)} ساعة`);
  if (remainingMins > 0 || hours === 0) parts.push(`${westernInt(remainingMins)} دقيقة`);

  return parts.join(" ");
}

// ---------------------------------------------------------------------------
// 8. elapsedTimer(startTime)
// ---------------------------------------------------------------------------

/**
 * Live elapsed timer from startTime to now, formatted as "HH:MM:SS".
 * Designed to be called repeatedly (e.g. every second) for a live counter.
 * Returns "00:00:00" for future start times and "-" for invalid input.
 * All digits are Western (Latin).
 */
export function elapsedTimer(startTime: string | Date | null | undefined): string {
  const d = toDate(startTime);
  if (!d) return "-";

  const totalSec = Math.max(0, Math.floor((Date.now() - d.getTime()) / 1000));
  const hours = Math.floor(totalSec / 3600);
  const mins = Math.floor((totalSec % 3600) / 60);
  const secs = totalSec % 60;

  return `${pad(hours)}:${pad(mins)}:${pad(secs)}`;
}

// ---------------------------------------------------------------------------
// 9. phoneDisplay(phone)
// ---------------------------------------------------------------------------

/**
 * Return a phone number string as-is.
 * Phone numbers are already LTR digit sequences; this function exists to
 * signal intent and provide a single place to apply any future formatting.
 * Returns "-" for empty / null values.
 */
export function phoneDisplay(phone: string | null | undefined): string {
  if (!phone) return "-";
  return phone.trim();
}

// ---------------------------------------------------------------------------
// 10. idShort(uuid)
// ---------------------------------------------------------------------------

/**
 * Shorten a UUID to its first 8 characters, uppercased.
 * Output example: "A3F8B210"
 * Returns "-" for null / undefined.
 */
export function idShort(uuid: string | null | undefined): string {
  if (!uuid) return "-";
  return uuid.replace(/-/g, "").slice(0, 8).toUpperCase();
}

// ---------------------------------------------------------------------------
// 11. percentage(value, total)
// ---------------------------------------------------------------------------

/**
 * Compute and format a percentage with Western digits.
 * Output example: percentage(45, 100) → "45%"
 * Returns "0%" when total is 0 or falsy to avoid division by zero.
 * @param value  The part (numerator).
 * @param total  The whole (denominator).
 * @param decimals  Number of decimal places (default 0).
 */
export function percentage(
  value: number | null | undefined,
  total: number | null | undefined,
  decimals = 0,
): string {
  const v = Number(value ?? 0);
  const t = Number(total ?? 0);

  if (!t || Number.isNaN(v) || Number.isNaN(t)) return "0%";

  const pct = (v / t) * 100;
  return `${pct.toFixed(decimals)}%`;
}
