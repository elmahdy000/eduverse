"use client";

import { PropsWithChildren, ReactNode, useState, useMemo } from "react";
import clsx from "clsx";
import { motion, AnimatePresence } from "framer-motion";
import { CalendarClock, XCircle, ArrowUpRight, ArrowDownRight, Minus } from "lucide-react";

/* ── Badge ── */
type BadgeTone = "default" | "success" | "warn" | "danger" | "info" | "neutral";
const badgeStyles: Record<BadgeTone, string> = {
  default:  "bg-slate-100 text-slate-700 border-slate-200",
  success:  "bg-emerald-50 text-emerald-700 border-emerald-200",
  warn:     "bg-amber-50 text-amber-700 border-amber-200",
  danger:   "bg-rose-50 text-rose-700 border-rose-200",
  info:     "bg-blue-50 text-blue-700 border-blue-200",
  neutral:  "bg-slate-50 text-slate-500 border-slate-200",
};
const dotStyles: Record<BadgeTone, string> = {
  default: "bg-slate-400",
  success: "bg-emerald-500",
  warn:    "bg-amber-500",
  danger:  "bg-rose-500",
  info:    "bg-blue-500",
  neutral: "bg-slate-400",
};
export function Badge({
  children, tone = "default", dot = false, className,
}: PropsWithChildren<{ tone?: BadgeTone; dot?: boolean; className?: string }>) {
  return (
    <span className={clsx(
      "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11px] font-semibold leading-4",
      badgeStyles[tone], className,
    )}>
      {dot && <span className={clsx("h-1.5 w-1.5 rounded-full shrink-0", dotStyles[tone])} />}
      {children}
    </span>
  );
}
export function statusBadgeTone(status?: string | null): BadgeTone {
  switch (status) {
    case "active": case "available": case "paid": case "delivered":
    case "completed": case "confirmed": case "ready": return "success";
    case "inactive": case "out_of_service": case "cancelled":
    case "refunded": case "blacklisted": return "danger";
    case "new": case "draft": case "unpaid": return "info";
    case "in_preparation": case "partially_paid": case "booked_soon":
    case "under_prep": case "no_show": return "warn";
    default: return "neutral";
  }
}

/* ── SectionTitle ── */
export function SectionTitle({
  title, subtitle, icon, action,
}: {
  title: string; subtitle?: string; icon?: ReactNode; action?: ReactNode;
}) {
  return (
    <header className="mb-6 flex items-start justify-between gap-4">
      <div className="flex items-center gap-3">
        {icon && (
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-amber-500 text-white shadow-lg shadow-amber-500/25">
            {icon}
          </div>
        )}
        <div className="text-right">
          <h2 className="text-xl font-black text-slate-900 md:text-2xl tracking-tight">{title}</h2>
          {subtitle && <p className="mt-0.5 text-sm text-slate-500">{subtitle}</p>}
        </div>
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </header>
  );
}

/* ── StatCard ── */
const statAccent: Record<string, string> = {
  success: "border-l-emerald-500",
  warn:    "border-l-amber-500",
  danger:  "border-l-rose-500",
  info:    "border-l-blue-500",
  default: "border-l-slate-300",
  neutral: "border-l-slate-300",
};
const statIcon: Record<string, string> = {
  success: "bg-emerald-50 text-emerald-600",
  warn:    "bg-amber-50 text-amber-600",
  danger:  "bg-rose-50 text-rose-600",
  info:    "bg-blue-50 text-blue-600",
  default: "bg-slate-100 text-slate-500",
  neutral: "bg-slate-100 text-slate-400",
};
const statValue: Record<string, string> = {
  success: "text-emerald-700",
  warn:    "text-amber-700",
  danger:  "text-rose-700",
  info:    "text-blue-700",
  default: "text-slate-900",
  neutral: "text-slate-600",
};

export function StatCard({
  label, value, sub, tone, icon, trend,
}: {
  label: string; value: ReactNode; sub?: string;
  tone?: BadgeTone; icon?: ReactNode;
  trend?: { value: number; label?: string };
}) {
  const t = tone ?? "default";
  return (
    <div className={clsx(
      "rounded-2xl border border-slate-200 bg-white p-5 shadow-sm border-l-4 transition hover:shadow-md",
      statAccent[t],
    )}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1 text-right">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 truncate mb-2">{label}</p>
          <p className={clsx("text-3xl font-black leading-none tabular-nums", statValue[t])}>{value}</p>
          {sub && <p className="mt-2 text-[11px] text-slate-400 leading-relaxed">{sub}</p>}
          {trend && (
            <div className={clsx(
              "mt-2 inline-flex items-center gap-1 text-[11px] font-semibold",
              trend.value > 0 ? "text-emerald-600" : trend.value < 0 ? "text-rose-600" : "text-slate-400",
            )}>
              {trend.value > 0
                ? <ArrowUpRight size={12} />
                : trend.value < 0
                ? <ArrowDownRight size={12} />
                : <Minus size={12} />}
              {Math.abs(trend.value)}%
              {trend.label && <span className="font-normal text-slate-400">{trend.label}</span>}
            </div>
          )}
        </div>
        {icon && (
          <div className={clsx(
            "flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl",
            statIcon[t],
          )}>
            {icon}
          </div>
        )}
      </div>
    </div>
  );
}

/* ── Panel ── */
export function Panel({
  children, title, icon, action, className, accent,
}: PropsWithChildren<{
  title?: string; icon?: ReactNode; action?: ReactNode;
  className?: string; accent?: boolean;
}>) {
  return (
    <div className={clsx(
      "rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden",
      className,
    )}>
      {(title || action) && (
        <div className={clsx(
          "flex items-center justify-between gap-2 px-5 py-4 border-b border-slate-100",
          accent && "bg-slate-50",
        )}>
          <div className="flex items-center gap-2.5">
            {icon && (
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-500/10 text-amber-600">
                {icon}
              </span>
            )}
            {title && (
              <h3 className="text-sm font-bold text-slate-800">{title}</h3>
            )}
          </div>
          {action && <div className="shrink-0">{action}</div>}
        </div>
      )}
      <div className="p-5">{children}</div>
    </div>
  );
}

/* ── Alert ── */
const alertStyles: Record<string, string> = {
  info:    "bg-blue-50  border-blue-200  text-blue-800  border-l-blue-500",
  success: "bg-emerald-50 border-emerald-200 text-emerald-800 border-l-emerald-500",
  warn:    "bg-amber-50 border-amber-200 text-amber-800 border-l-amber-500",
  danger:  "bg-rose-50  border-rose-200  text-rose-800  border-l-rose-500",
  default: "bg-slate-50 border-slate-200 text-slate-800 border-l-slate-400",
  neutral: "bg-slate-50 border-slate-200 text-slate-600 border-l-slate-300",
};
export function Alert({
  children, tone = "info",
}: PropsWithChildren<{ tone?: BadgeTone }>) {
  return (
    <div className={clsx(
      "rounded-xl border border-l-4 px-4 py-3 text-sm font-medium",
      alertStyles[tone ?? "info"],
    )}>
      {children}
    </div>
  );
}

/* ── EmptyState ── */
export function EmptyState({
  icon, title, sub, action,
}: {
  icon?: ReactNode; title: string; sub?: string; action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 py-16 text-center">
      {icon && (
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
          {icon}
        </div>
      )}
      <div>
        <p className="text-base font-bold text-slate-700">{title}</p>
        {sub && <p className="mt-1 text-sm text-slate-400">{sub}</p>}
      </div>
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}

/* ── Spinner ── */
export function Spinner({ size = 20, className }: { size?: number; className?: string }) {
  return (
    <svg
      width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth={2.5}
      className={clsx("animate-spin", className || "text-slate-400")}
    >
      <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
    </svg>
  );
}

/* ── FormField ── */
export function FormField({
  label, children, hint,
}: PropsWithChildren<{ label: string; hint?: string }>) {
  return (
    <div className="flex flex-col gap-1.5 text-right">
      <label className="text-xs font-bold text-slate-600 uppercase tracking-wide">{label}</label>
      {children}
      {hint && <p className="text-[11px] text-slate-400">{hint}</p>}
    </div>
  );
}

/* ── Input ── */
export function Input({
  className, icon, ...props
}: React.InputHTMLAttributes<HTMLInputElement> & { icon?: ReactNode }) {
  const base = "w-full rounded-xl border border-slate-200 bg-white py-2.5 text-right text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/15 hover:border-slate-300";
  if (icon) {
    return (
      <div className="group relative">
        <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 transition group-focus-within:text-amber-500">
          {icon}
        </div>
        <input {...props} className={clsx(base, "pr-9 pl-3", className)} />
      </div>
    );
  }
  return <input {...props} className={clsx(base, "px-3", className)} />;
}

/* ── DateTimeInput ── */
export function DateTimeInput({
  className, ...props
}: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div className="group relative">
      <CalendarClock
        size={14}
        className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 transition group-focus-within:text-amber-500"
      />
      <input
        {...props}
        type="datetime-local"
        className={clsx(
          "w-full rounded-xl border border-slate-200 bg-white py-2.5 pr-9 pl-3 text-right text-sm text-slate-900 outline-none transition",
          "hover:border-slate-300 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/15",
          "[color-scheme:light]",
          className,
        )}
      />
    </div>
  );
}

/* ── Select ── */
export function Select({
  children, className, ...props
}: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      {...props}
      className={clsx(
        "w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-right text-sm text-slate-900 outline-none transition",
        "hover:border-slate-300 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/15",
        className,
      )}
    >
      {children}
    </select>
  );
}

/* ── Btn ── */
type BtnVariant = "primary" | "secondary" | "danger" | "ghost" | "success" | "warn" | "orange";
type BtnSize = "sm" | "md" | "lg";

const btnVariants: Record<BtnVariant, string> = {
  primary:   "bg-amber-500 text-white hover:bg-amber-600 border-transparent shadow-md shadow-amber-500/20 active:scale-[0.97]",
  secondary: "bg-white text-slate-700 border-slate-200 hover:bg-slate-50 hover:border-slate-300 shadow-sm active:scale-[0.97]",
  danger:    "bg-rose-500 text-white hover:bg-rose-600 border-transparent shadow-sm active:scale-[0.97]",
  success:   "bg-emerald-500 text-white hover:bg-emerald-600 border-transparent shadow-sm active:scale-[0.97]",
  warn:      "bg-amber-500 text-white hover:bg-amber-600 border-transparent shadow-sm active:scale-[0.97]",
  orange:    "bg-orange-600 text-white hover:bg-orange-700 border-transparent shadow-md shadow-orange-200 active:scale-[0.97]",
  ghost:     "bg-transparent text-slate-500 hover:bg-slate-100 border-transparent",
};
const btnSizes: Record<BtnSize, string> = {
  sm: "px-3 py-1.5 text-xs gap-1.5 rounded-lg",
  md: "px-4 py-2.5 text-sm gap-2 rounded-xl",
  lg: "px-5 py-3 text-base gap-2 rounded-xl",
};

export function Btn({
  children, variant = "primary", size = "md", loading, loadingText,
  icon, className, type = "button", disabled, onClick,
}: {
  children?: ReactNode; variant?: BtnVariant; size?: BtnSize; loading?: boolean;
  loadingText?: string; icon?: ReactNode; className?: string;
  type?: "button" | "submit" | "reset"; disabled?: boolean; onClick?: () => void;
}) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      className={clsx(
        "inline-flex items-center justify-center border font-semibold transition-all",
        "disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none",
        btnVariants[variant],
        btnSizes[size],
        className,
      )}
    >
      {loading ? (
        <>
          <Spinner size={14} className="text-current opacity-80" />
          {loadingText ?? children}
        </>
      ) : (
        <>
          {icon && <span className="shrink-0">{icon}</span>}
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

export function DataTable({
  headers, rows, sortable = false, filterable = false,
  selectable = false, onSelectionChange,
}: DataTableProps) {
  const [sortConfig, setSortConfig] = useState<{ column: number; direction: "asc" | "desc" } | null>(null);
  const [filterText, setFilterText] = useState("");
  const [selectedRows, setSelectedRows] = useState<Set<number>>(new Set());

  const filteredRows = useMemo(() => {
    if (!filterText.trim()) return rows;
    const lower = filterText.toLowerCase();
    return rows.filter((row) =>
      row.some((cell) => {
        if (cell === null || cell === undefined) return false;
        if (typeof cell === "string" || typeof cell === "number")
          return String(cell).toLowerCase().includes(lower);
        return false;
      }),
    );
  }, [rows, filterText]);

  const sortedRows = useMemo(() => {
    if (!sortConfig || !sortable) return filteredRows;
    const { column, direction } = sortConfig;
    return [...filteredRows].sort((a, b) => {
      const av = a[column]; const bv = b[column];
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
        : { column: col, direction: "asc" },
    );
  };

  const handleSelectRow = (index: number) => {
    setSelectedRows((prev) => {
      const next = new Set(prev);
      if (next.has(index)) next.delete(index); else next.add(index);
      onSelectionChange?.([...next]);
      return next;
    });
  };

  const handleSelectAll = () => {
    if (selectedRows.size === filteredRows.length) {
      setSelectedRows(new Set());
      onSelectionChange?.([]);
    } else {
      const all = filteredRows.map((_, i) => i);
      setSelectedRows(new Set(all));
      onSelectionChange?.(all);
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
              className="rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-amber-500 focus:ring-2 focus:ring-amber-500/15 outline-none"
            />
          )}
          {selectable && selectedRows.size > 0 && (
            <span className="rounded-lg bg-amber-50 px-3 py-2 text-sm font-semibold text-amber-700 border border-amber-200">
              تم اختيار {selectedRows.size} صف
            </span>
          )}
        </div>
      )}

      <div className="overflow-x-auto rounded-2xl border border-slate-200">
        <table className="w-full text-right text-sm">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              {selectable && (
                <th className="px-4 py-3.5">
                  <input
                    type="checkbox"
                    checked={selectedRows.size === filteredRows.length && filteredRows.length > 0}
                    onChange={handleSelectAll}
                    className="rounded border-slate-300 accent-amber-500"
                  />
                </th>
              )}
              {headers.map((h, i) => (
                <th
                  key={i}
                  className={clsx(
                    "px-4 py-3.5 text-xs font-black uppercase tracking-wider text-slate-500",
                    sortable && "cursor-pointer hover:bg-slate-100 transition",
                  )}
                  onClick={() => handleSort(i)}
                >
                  <div className="flex items-center gap-1">
                    {h}
                    {sortable && sortConfig?.column === i && (
                      <span className="text-amber-500 font-bold">
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
                <td
                  colSpan={headers.length + (selectable ? 1 : 0)}
                  className="py-14 text-center text-sm text-slate-400"
                >
                  لا توجد بيانات
                </td>
              </tr>
            ) : (
              sortedRows.map((row, ri) => (
                <tr
                  key={ri}
                  className={clsx(
                    "transition-colors hover:bg-amber-50/40",
                    selectable && selectedRows.has(ri) && "bg-amber-50/60",
                  )}
                >
                  {selectable && (
                    <td className="px-4 py-3.5">
                      <input
                        type="checkbox"
                        checked={selectedRows.has(ri)}
                        onChange={() => handleSelectRow(ri)}
                        className="rounded border-slate-300 accent-amber-500"
                      />
                    </td>
                  )}
                  {row.map((cell, ci) => (
                    <td key={ci} className="px-4 py-3.5 text-slate-700">
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
export function Modal({
  isOpen, onClose, title, children, size = "md",
}: {
  isOpen: boolean; onClose: () => void; title?: string;
  children: ReactNode; size?: "sm" | "md" | "lg" | "xl" | "full";
}) {
  if (!isOpen) return null;
  const sizes: Record<string, string> = {
    sm: "max-w-md", md: "max-w-lg", lg: "max-w-2xl",
    xl: "max-w-4xl", full: "max-w-[95vw]",
  };
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={onClose} />
      <div
        className={clsx(
          "relative w-full overflow-hidden rounded-3xl bg-white shadow-2xl ring-1 ring-slate-200",
          sizes[size],
        )}
        dir="rtl"
      >
        {title && (
          <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50 px-6 py-4">
            <h3 className="text-base font-black text-slate-900">{title}</h3>
            <button
              onClick={onClose}
              className="rounded-xl p-1.5 text-slate-400 hover:bg-white hover:text-slate-600 transition"
            >
              <XCircle size={18} />
            </button>
          </div>
        )}
        <div className="max-h-[85vh] overflow-y-auto p-6">{children}</div>
      </div>
    </div>
  );
}

/* ── Sheet (Bottom Sheet) ── */
export function Sheet({
  open, onOpenChange, children,
}: {
  open: boolean; onOpenChange: (open: boolean) => void; children: ReactNode;
}) {
  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 flex items-end justify-center">
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm"
            onClick={() => onOpenChange(false)}
          />
          <motion.div
            initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="relative w-full max-w-2xl overflow-hidden rounded-t-[2.5rem] bg-white shadow-2xl ring-1 ring-slate-200 max-h-[85vh] flex flex-col"
            dir="rtl"
          >
            {children}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

export function SheetHeader({ children, className }: PropsWithChildren<{ className?: string }>) {
  return <div className={clsx("px-6 py-4 border-b border-slate-100 bg-slate-50", className)}>{children}</div>;
}

export function SheetTitle({ children, className }: PropsWithChildren<{ className?: string }>) {
  return <h2 className={clsx("text-lg font-black text-slate-900", className)}>{children}</h2>;
}

/* ── ScrollArea ── */
export function ScrollArea({ children, className }: PropsWithChildren<{ className?: string }>) {
  return (
    <div className={clsx("overflow-y-auto no-scrollbar", className)}>
      {children}
    </div>
  );
}

/* ── Skeletons ── */
export function TableSkeleton({ rows = 5, cols = 4 }: { rows?: number; cols?: number }) {
  return (
    <div className="w-full space-y-4 animate-pulse">
      <div className="h-8 bg-slate-100 rounded-lg w-full" />
      <div className="space-y-2">
        {Array.from({ length: rows }).map((_, r) => (
          <div key={r} className="flex gap-4 items-center py-3 border-b border-slate-50">
            {Array.from({ length: cols }).map((_, c) => (
              <div
                key={c}
                className={clsx(
                  "h-4 bg-slate-100 rounded",
                  c === 0 ? "w-1/3" : "w-1/6"
                )}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

export function CardSkeleton() {
  return (
    <div className="border border-slate-200 bg-white rounded-2xl p-5 shadow-sm space-y-4 animate-pulse">
      <div className="flex justify-between items-center">
        <div className="h-4 bg-slate-200 rounded w-1/3" />
        <div className="h-6 w-6 bg-slate-100 rounded-lg" />
      </div>
      <div className="h-8 bg-slate-200 rounded w-1/2" />
      <div className="h-3 bg-slate-100 rounded w-2/3" />
    </div>
  );
}

