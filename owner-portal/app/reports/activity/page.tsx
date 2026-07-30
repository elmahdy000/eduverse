"use client";

import { useEffect, useMemo, useState } from "react";
import { PortalShell } from "@/components/PortalShell";
import { DateRangePicker, type DateRange } from "@/components/DateRangePicker";
import { reports } from "@/lib/api";
import { fmtDate, fmtMoney, fmtNumber } from "@/lib/format";
import {
  Activity, CalendarDays, Coffee, CreditCard, DoorOpen, Receipt,
  Search, ShieldCheck, UsersRound, WalletCards,
} from "lucide-react";

type ActivityType = "session" | "booking" | "bar_order" | "payment" | "expense" | "shift" | "subscription" | "audit";

type ActivityEvent = {
  id: string;
  entityId: string;
  type: ActivityType;
  timestamp: string;
  title: string;
  description: string;
  status: string;
  amount: number | null;
  actor: string;
  meta: string | null;
};

type ActivityResponse = {
  summary: { totalEvents: number; counts: Partial<Record<ActivityType, number>> };
  events: ActivityEvent[];
  truncated: boolean;
};

const TYPES: Array<{ value: "all" | ActivityType; label: string }> = [
  { value: "all", label: "كل الحركات" },
  { value: "session", label: "الجلسات" },
  { value: "booking", label: "الحجوزات" },
  { value: "bar_order", label: "طلبات البار" },
  { value: "payment", label: "المدفوعات" },
  { value: "expense", label: "المصروفات" },
  { value: "shift", label: "الورديات" },
  { value: "subscription", label: "الاشتراكات" },
  { value: "audit", label: "تغييرات النظام" },
];

const typeMeta: Record<ActivityType, { label: string; color: string; icon: typeof Activity }> = {
  session: { label: "جلسة", color: "text-sky-300 bg-sky-400/10", icon: DoorOpen },
  booking: { label: "حجز", color: "text-violet-300 bg-violet-400/10", icon: CalendarDays },
  bar_order: { label: "بار", color: "text-amber-300 bg-amber-400/10", icon: Coffee },
  payment: { label: "دفعة", color: "text-emerald-300 bg-emerald-400/10", icon: CreditCard },
  expense: { label: "مصروف", color: "text-rose-300 bg-rose-400/10", icon: Receipt },
  shift: { label: "وردية", color: "text-cyan-300 bg-cyan-400/10", icon: UsersRound },
  subscription: { label: "اشتراك", color: "text-fuchsia-300 bg-fuchsia-400/10", icon: WalletCards },
  audit: { label: "نظام", color: "text-slate-300 bg-slate-400/10", icon: ShieldCheck },
};

export default function ActivityReportPage() {
  const [range, setRange] = useState<DateRange>({ from: "", to: "" });
  const [data, setData] = useState<ActivityResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [type, setType] = useState<"all" | ActivityType>("all");
  const [search, setSearch] = useState("");

  useEffect(() => {
    if (!range.from || !range.to) return;
    let cancelled = false;
    reports.activity(range.from, range.to)
      .then((result) => { if (!cancelled) setData(result as ActivityResponse); })
      .catch((requestError: Error) => { if (!cancelled) setError(requestError.message || "تعذر تحميل سجل الحركات"); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [range.from, range.to]);

  const handleRangeChange = (nextRange: DateRange) => {
    setLoading(Boolean(nextRange.from && nextRange.to));
    setError(null);
    setRange(nextRange);
  };

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    return (data?.events || []).filter((event) => {
      const matchesType = type === "all" || event.type === type;
      const matchesSearch = !query || `${event.title} ${event.description} ${event.actor} ${event.status}`.toLowerCase().includes(query);
      return matchesType && matchesSearch;
    });
  }, [data?.events, search, type]);

  return (
    <PortalShell>
      <div className="mb-6 flex flex-col justify-between gap-4 xl:flex-row xl:items-end">
        <div>
          <div className="mb-2 flex items-center gap-2 text-amber-300"><Activity size={22} /><span className="text-xs font-black tracking-widest">LIVE OPERATIONS</span></div>
          <h1 className="text-2xl font-black text-white sm:text-3xl">سجل كل الحركات</h1>
          <p className="mt-2 text-sm text-slate-400">خط زمني موحّد لكل العمليات المالية والتشغيلية ومن قام بها.</p>
        </div>
        <div className="rounded-xl border border-amber-400/20 bg-amber-400/5 px-4 py-3 text-sm text-amber-200">
          {fmtNumber(data?.summary.totalEvents || 0)} حركة في الفترة
        </div>
      </div>

      <div className="op-panel mb-5 overflow-x-auto"><DateRangePicker value={range} onChange={handleRangeChange} /></div>

      {data && (
        <div className="mb-5 grid grid-cols-2 gap-3 md:grid-cols-4 xl:grid-cols-8">
          {TYPES.slice(1).map((item) => {
            const meta = typeMeta[item.value as ActivityType];
            const Icon = meta.icon;
            return <button key={item.value} onClick={() => setType(item.value as ActivityType)} className={`rounded-xl border p-3 text-right transition ${type === item.value ? "border-amber-400 bg-amber-400/10" : "border-slate-800 bg-slate-900/40 hover:border-slate-700"}`}>
              <Icon size={16} className={meta.color.split(" ")[0]} />
              <div className="mt-2 text-xl font-black">{fmtNumber(data.summary.counts[item.value as ActivityType] || 0)}</div>
              <div className="text-[11px] text-slate-400">{item.label}</div>
            </button>;
          })}
        </div>
      )}

      <div className="op-panel mb-5 flex flex-col gap-3 lg:flex-row">
        <div className="relative min-w-0 flex-1">
          <Search size={17} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="ابحث باسم العميل، الموظف، البيان أو الحالة..." className="op-input pr-10" />
        </div>
        <select value={type} onChange={(event) => setType(event.target.value as "all" | ActivityType)} className="op-input lg:w-52">
          {TYPES.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
        </select>
      </div>

      {loading && <div className="flex justify-center py-20"><div className="op-spinner" /></div>}
      {error && <div className="op-panel text-sm text-rose-300">{error}</div>}

      {!loading && !error && (
        <div className="op-panel !p-0 overflow-hidden">
          <div className="flex items-center justify-between border-b border-slate-800 px-5 py-4">
            <h2 className="font-bold">الخط الزمني</h2><span className="text-xs text-slate-500">{fmtNumber(filtered.length)} نتيجة</span>
          </div>
          {filtered.length === 0 ? <div className="py-20 text-center text-sm text-slate-500">لا توجد حركات مطابقة</div> : (
            <div className="divide-y divide-slate-800/80">
              {filtered.map((event) => {
                const meta = typeMeta[event.type];
                const Icon = meta.icon;
                return <div key={event.id} className="grid gap-3 px-4 py-4 transition hover:bg-white/[0.02] sm:grid-cols-[44px_minmax(0,1fr)_140px_130px] sm:items-center sm:px-5">
                  <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${meta.color}`}><Icon size={18} /></div>
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2"><h3 className="font-bold text-slate-100">{event.title}</h3><span className="rounded-full bg-slate-800 px-2 py-0.5 text-[10px] text-slate-400">{meta.label}</span></div>
                    <p className="mt-1 truncate text-sm text-slate-400">{event.description}</p>
                    <p className="mt-1 text-[11px] text-slate-600">بواسطة {event.actor} • {event.status}</p>
                  </div>
                  <div className="text-xs text-slate-400">{fmtDate(event.timestamp)}</div>
                  <div className={`font-black ${event.type === "expense" || (event.amount || 0) < 0 ? "text-rose-300" : "text-emerald-300"}`}>{event.amount == null ? "—" : fmtMoney(event.amount)}</div>
                </div>;
              })}
            </div>
          )}
          {data?.truncated && <div className="border-t border-slate-800 p-3 text-center text-xs text-amber-300">تم عرض أحدث 1000 حركة فقط؛ ضيّق الفترة لعرض تفاصيل أدق.</div>}
        </div>
      )}
    </PortalShell>
  );
}
