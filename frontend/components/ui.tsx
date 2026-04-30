"use client";

import { PropsWithChildren, ReactNode, useState, useMemo } from "react";
import clsx from "clsx";
import { CalendarClock } from "lucide-react";

/* ── Badge ── */
type BadgeTone = "default" | "success" | "warn" | "danger" | "info" | "neutral";
const badgeStyles: Record<BadgeTone, string> = {
  default: "bg-slate-100 text-slate-700 border-slate-200",
  success: "bg-emerald-50 text-emerald-700 border-emerald-200",
  warn: "bg-amber-50 text-amber-700 border-amber-200",
  danger: "bg-rose-50 text-rose-700 border-rose-200",
  info: "bg-blue-50 text-blue-700 border-blue-200",
  neutral: "bg-slate-50 text-slate-500 border-slate-200",
};
export function Badge({ children, tone = "default", className }: PropsWithChildren<{ tone?: BadgeTone; className?: string }>) {
  return (
    <span className={clsx("inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-medium leading-4", badgeStyles[tone], className)}>
      {children}
    </span>
  );
}
export function statusBadgeTone(status?: string | null): BadgeTone {
  switch (status) {
    case "active": case "available": case "paid": case "delivered": case "completed": case "confirmed": case "ready": return "success";
    case "inactive": case "out_of_service": case "cancelled": case "refunded": case "blacklisted": return "danger";
    case "new": case "draft": case "unpaid": return "info";
    case "in_preparation": case "partially_paid": case "booked_soon": case "under_prep": return "warn";
    default: return "neutral";
  }
}

/* ── SectionTitle ── */
export function SectionTitle({ title, subtitle, icon, action }: { title: string; subtitle?: string; icon?: ReactNode; action?: ReactNode }) {
  return (
    <header className="mb-6 flex items-start justify-between gap-4">
      <div className="flex items-center gap-3">
        {icon && (
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-900 text-white">
            {icon}
          </div>
        )}
        <div className="text-right">
          <h2 className="text-xl font-semibold text-slate-900 md:text-2xl">{title}</h2>
          {subtitle && <p className="mt-0.5 text-sm text-slate-500">{subtitle}</p>}
        </div>
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </header>
  );
}

/* ── StatCard ── */
export function StatCard({ label, value, sub, tone, icon }: { label: string; value: ReactNode; sub?: string; tone?: BadgeTone; icon?: ReactNode }) {
  const colors: Record<string, string> = {
    success: "from-emerald-50 to-emerald-100/50 border-emerald-200",
    warn: "from-amber-50 to-amber-100/50 border-amber-200",
    danger: "from-rose-50 to-rose-100/50 border-rose-200",
    info: "from-blue-50 to-blue-100/50 border-blue-200",
    default: "from-white to-slate-50 border-slate-200",
    neutral: "from-slate-50 to-slate-100/50 border-slate-200",
  };
  const iconColors: Record<string, string> = {
    success: "bg-emerald-100 text-emerald-600",
    warn: "bg-amber-100 text-amber-600",
    danger: "bg-rose-100 text-rose-600",
    info: "bg-blue-100 text-blue-600",
    default: "bg-slate-100 text-slate-600",
    neutral: "bg-slate-100 text-slate-500",
  };
  const t = tone ?? "default";
  return (
    <div className={clsx("rounded-2xl border bg-gradient-to-br p-4 shadow-sm", colors[t])}>
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1 text-right">
          <p className="mb-1 text-xs font-medium text-slate-500 truncate">{label}</p>
          <p className="text-2xl font-bold leading-tight text-slate-900">{value}</p>
          {sub && <p className="mt-1 text-[11px] text-slate-400">{sub}</p>}
        </div>
        {icon && (
          <div className={clsx("flex h-9 w-9 shrink-0 items-center justify-center rounded-xl", iconColors[t])}>
            {icon}
          </div>
        )}
      </div>
    </div>
  );
}

/* ── Panel ── */
export function Panel({ children, title, icon, action, className }: PropsWithChildren<{ title?: string; icon?: ReactNode; action?: ReactNode; className?: string }>) {
  return (
    <div className={clsx("rounded-2xl border border-slate-200 bg-white p-5 shadow-sm", className)}>
      {(title || action) && (
        <div className="mb-4 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            {icon && <span className="text-slate-500">{icon}</span>}
            {title && <h3 className="text-sm font-semibold text-slate-700">{title}</h3>}
          </div>
          {action && <div className="shrink-0">{action}</div>}
        </div>
      )}
      {children}
    </div>
  );
}

/* ── Alert ── */
export function Alert({ children, tone = "info" }: PropsWithChildren<{ tone?: BadgeTone }>) {
  const styles: Record<string, string> = {
    info: "bg-blue-50 border-blue-200 text-blue-800",
    success: "bg-emerald-50 border-emerald-200 text-emerald-800",
    warn: "bg-amber-50 border-amber-200 text-amber-800",
    danger: "bg-rose-50 border-rose-200 text-rose-800",
    default: "bg-slate-50 border-slate-200 text-slate-800",
    neutral: "bg-slate-50 border-slate-200 text-slate-600",
  };
  return (
    <div className={clsx("rounded-xl border px-4 py-3 text-sm font-medium", styles[tone ?? "info"])}>
      {children}
    </div>
  );
}

/* ── EmptyState ── */
export function EmptyState({ icon, title, sub, action }: { icon?: ReactNode; title: string; sub?: string; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-12 text-center">
      {icon && <span className="text-slate-300">{icon}</span>}
      <div>
        <p className="text-sm font-semibold text-slate-600">{title}</p>
        {sub && <p className="mt-1 text-xs text-slate-400">{sub}</p>}
      </div>
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}

/* ── Spinner ── */
export function Spinner({ size = 20 }: { size?: number }) {
  return (
    <svg
      width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth={2.5}
      className="animate-spin text-slate-400"
    >
      <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
    </svg>
  );
}

/* ── FormField ── */
export function FormField({ label, children, hint }: PropsWithChildren<{ label: string; hint?: string }>) {
  return (
    <div className="flex flex-col gap-1 text-right">
      <label className="text-xs font-semibold text-slate-600">{label}</label>
      {children}
      {hint && <p className="text-[11px] text-slate-400">{hint}</p>}
    </div>
  );
}

/* ── Input ── */
export function Input({ className, icon, ...props }: React.InputHTMLAttributes<HTMLInputElement> & { icon?: ReactNode }) {
  if (icon) {
    return (
      <div className="group relative">
        <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 transition group-focus-within:text-slate-700">
          {icon}
        </div>
        <input
          {...props}
          className={clsx(
            "w-full rounded-xl border border-slate-300 bg-white py-2.5 pr-9 pl-3 text-right text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-slate-900 focus:ring-2 focus:ring-slate-900/10",
            className,
          )}
        />
      </div>
    );
  }
  return (
    <input
      {...props}
      className={clsx(
        "w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-right text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-slate-900 focus:ring-2 focus:ring-slate-900/10",
        className,
      )}
    />
  );
}

/* —— DateTimeInput —— */
export function DateTimeInput({ className, ...props }: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div className="group relative">
      <CalendarClock
        size={14}
        className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 transition group-focus-within:text-slate-700"
      />
      <input
        {...props}
        type="datetime-local"
        className={clsx(
          "w-full rounded-xl border border-slate-300 bg-gradient-to-br from-white to-slate-50 py-2.5 pr-9 pl-3 text-right text-sm text-slate-900 outline-none transition",
          "focus:border-slate-900 focus:ring-2 focus:ring-slate-900/10",
          "[color-scheme:light]",
          className,
        )}
      />
    </div>
  );
}

/* ── Select ── */
export function Select({ children, className, ...props }: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      {...props}
      className={clsx(
        "w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-right text-sm text-slate-900 outline-none transition focus:border-slate-900 focus:ring-2 focus:ring-slate-900/10",
        className,
      )}
    >
      {children}
    </select>
  );
}

/* ── Btn ── */
type BtnVariant = "primary" | "secondary" | "danger" | "ghost" | "success" | "warn";
type BtnSize = "sm" | "md" | "lg";

const btnVariants: Record<BtnVariant, string> = {
  primary: "bg-slate-900 text-white hover:bg-slate-700 border-transparent",
  secondary: "bg-white text-slate-700 border-slate-300 hover:bg-slate-50",
  danger: "bg-rose-600 text-white hover:bg-rose-700 border-transparent",
  success: "bg-emerald-600 text-white hover:bg-emerald-700 border-transparent",
  warn: "bg-amber-500 text-white hover:bg-amber-600 border-transparent",
  ghost: "bg-transparent text-slate-600 border-slate-200 hover:bg-slate-100",
};

const btnSizes: Record<BtnSize, string> = {
  sm: "px-3 py-1.5 text-xs gap-1.5",
  md: "px-4 py-2.5 text-sm gap-2",
  lg: "px-5 py-3 text-base gap-2",
};

export function Btn({
  children, variant = "primary", size = "md", loading, loadingText, icon, className, type = "button", disabled, onClick,
}: {
  children?: ReactNode; variant?: BtnVariant; size?: BtnSize; loading?: boolean;
  loadingText?: string; icon?: ReactNode; className?: string; type?: "button" | "submit" | "reset";
  disabled?: boolean; onClick?: () => void;
}) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      className={clsx(
        "inline-flex items-center justify-center rounded-xl border font-semibold transition disabled:opacity-50 disabled:cursor-not-allowed",
        btnVariants[variant],
        btnSizes[size],
        className,
      )}
    >
      {loading ? (
        <>
          <Spinner size={14} />
          {loadingText ?? children}
        </>
      ) : (
        <>
          {icon && <span>{icon}</span>}
          {children}
        </>
      )}
    </button>
  );
}

/* ── DataTable ── */
type DataTableProps = {
  headers: string[];
  rows: Array<Array<string | number | null | undefined | ReactNode>>;
  sortable?: boolean;
  filterable?: boolean;
  selectable?: boolean;
  onSelectionChange?: (selectedIndexes: number[]) => void;
};

export function DataTable({ headers, rows, sortable = false, filterable = false, selectable = false, onSelectionChange }: DataTableProps) {
  const [sortConfig, setSortConfig] = useState<{ column: number; direction: "asc" | "desc" } | null>(null);
  const [filterText, setFilterText] = useState("");
  const [selectedRows, setSelectedRows] = useState<Set<number>>(new Set());

  const filteredRows = useMemo(() => {
    if (!filterText.trim()) return rows;
    const lower = filterText.toLowerCase();
    return rows.filter((row) =>
      row.some((cell) => {
        if (cell === null || cell === undefined) return false;
        if (typeof cell === "string" || typeof cell === "number") {
          return String(cell).toLowerCase().includes(lower);
        }
        return false;
      })
    );
  }, [rows, filterText]);

  const sortedRows = useMemo(() => {
    if (!sortConfig || !sortable) return filteredRows;
    const { column, direction } = sortConfig;
    return [...filteredRows].sort((a, b) => {
      const av = a[column];
      const bv = b[column];
      const as = typeof av === "string" || typeof av === "number" ? String(av) : "";
      const bs = typeof bv === "string" || typeof bv === "number" ? String(bv) : "";
      return direction === "asc" ? as.localeCompare(bs) : bs.localeCompare(as);
    });
  }, [filteredRows, sortConfig, sortable]);

  const handleSort = (col: number) => {
    if (!sortable) return;
    setSortConfig((prev) =>
      prev?.column === col
        ? { column: col, direction: prev.direction === "asc" ? "desc" : "asc" }
        : { column: col, direction: "asc" }
    );
  };

  const handleSelectRow = (index: number) => {
    setSelectedRows((prev) => {
      const next = new Set(prev);
      if (next.has(index)) next.delete(index);
      else next.add(index);
      onSelectionChange?.([...next]);
      return next;
    });
  };

  const handleSelectAll = () => {
    if (selectedRows.size === filteredRows.length) {
      setSelectedRows(new Set());
      onSelectionChange?.([]);
    } else {
      const allIndexes = filteredRows.map((_: Array<string | number | null | undefined | ReactNode>, i: number) => i);
      setSelectedRows(new Set(allIndexes));
      onSelectionChange?.(allIndexes);
    }
  };

  return (
    <div className="space-y-3">
      {(sortable || filterable) && (
        <div className="flex flex-wrap gap-3">
          {filterable && (
            <input
              type="text"
              placeholder="تصفية البيانات..."
              value={filterText}
              onChange={(e) => setFilterText(e.target.value)}
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
            />
          )}
          {selectable && selectedRows.size > 0 && (
            <span className="rounded-lg bg-blue-100 px-3 py-2 text-sm font-medium text-blue-700">
              تم اختيار {selectedRows.size} صف
            </span>
          )}
        </div>
      )}

      <div className="overflow-x-auto rounded-xl border border-slate-200">
        <table className="w-full text-right text-sm">
          <thead className="bg-slate-50 text-xs font-semibold uppercase tracking-wider text-slate-500">
            <tr>
              {selectable && (
                <th className="px-3 py-3">
                  <input
                    type="checkbox"
                    checked={selectedRows.size === filteredRows.length && filteredRows.length > 0}
                    onChange={handleSelectAll}
                    className="rounded border-slate-300"
                  />
                </th>
              )}
              {headers.map((h, i) => (
                <th
                  key={i}
                  className={clsx(
                    "px-4 py-3 font-semibold",
                    sortable && "cursor-pointer hover:bg-slate-100 transition"
                  )}
                  onClick={() => handleSort(i)}
                >
                  <div className="flex items-center gap-1">
                    {h}
                    {sortable && sortConfig?.column === i && (
                      <span className="text-slate-400">
                        {sortConfig.direction === "asc" ? "↑" : "↓"}
                      </span>
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {sortedRows.length === 0 ? (
              <tr>
                <td colSpan={headers.length + (selectable ? 1 : 0)} className="py-10 text-center text-sm text-slate-400">
                  لا توجد بيانات
                </td>
              </tr>
            ) : (
              sortedRows.map((row, ri) => (
                <tr
                  key={ri}
                  className={clsx(
                    "transition hover:bg-slate-50",
                    selectable && selectedRows.has(ri) && "bg-blue-50/50"
                  )}
                >
                  {selectable && (
                    <td className="px-3 py-3">
                      <input
                        type="checkbox"
                        checked={selectedRows.has(ri)}
                        onChange={() => handleSelectRow(ri)}
                        className="rounded border-slate-300"
                      />
                    </td>
                  )}
                  {row.map((cell, ci) => (
                    <td key={ci} className="px-4 py-3 text-slate-700">
                      {cell ?? <span className="text-slate-300">—</span>}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ── Modal ── */
export function Modal({ isOpen, onClose, title, children, size = "md" }: { isOpen: boolean; onClose: () => void; title?: string; children: ReactNode; size?: "sm" | "md" | "lg" | "xl" | "full" }) {
  if (!isOpen) return null;

  const sizes: Record<string, string> = {
    sm: "max-w-md",
    md: "max-w-lg",
    lg: "max-w-2xl",
    xl: "max-w-4xl",
    full: "max-w-[95vw]",
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity" onClick={onClose} />
      <div className={clsx("relative w-full overflow-hidden rounded-3xl bg-white shadow-2xl transition-all", sizes[size])} dir="rtl">
        {title && (
          <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
            <h3 className="text-lg font-bold text-slate-900">{title}</h3>
            <button onClick={onClose} className="rounded-xl p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600">
              <XCircle size={20} />
            </button>
          </div>
        )}
        <div className="max-h-[85vh] overflow-y-auto p-6">
          {children}
        </div>
      </div>
    </div>
  );
}

import { XCircle } from "lucide-react";

