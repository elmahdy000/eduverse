"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { PropsWithChildren, useState } from "react";
import clsx from "clsx";
import {
  LayoutDashboard, Users, Calendar, BookOpen, Receipt,
  Package, DoorOpen, Coffee, ShieldCheck, UserCog, LogOut,
  Building2, Settings, Activity, Wallet, Boxes, Timer,
  BarChartHorizontal, FileText, ChevronDown, ChevronUp,
  Menu, X,
} from "lucide-react";
import { useAuthStore } from "../store/auth-store";
import { roleLabel } from "../lib/api";

type NavItem = { label: string; href: string; roles: string[]; icon: React.ReactNode };
type NavGroup = {
  label: string; icon: React.ReactNode; items: NavItem[];
  roles: string[]; defaultOpen?: boolean;
};

const navGroups: NavGroup[] = [
  {
    label: "لوحة التحكم",
    icon: <LayoutDashboard size={15} />,
    roles: ["Owner", "Operations Manager", "Receptionist", "Barista"],
    defaultOpen: true,
    items: [
      { label: "لوحة التحكم", href: "/dashboard", roles: ["Owner", "Operations Manager", "Receptionist", "Barista"], icon: <LayoutDashboard size={14} /> },
    ],
  },
  {
    label: "العمليات",
    icon: <Calendar size={15} />,
    roles: ["Owner", "Operations Manager", "Receptionist"],
    defaultOpen: true,
    items: [
      { label: "العملاء", href: "/customers", roles: ["Owner", "Operations Manager", "Receptionist"], icon: <Users size={14} /> },
      { label: "الجلسات", href: "/sessions", roles: ["Owner", "Operations Manager", "Receptionist"], icon: <Calendar size={14} /> },
      { label: "الغرف", href: "/rooms", roles: ["Owner", "Operations Manager"], icon: <DoorOpen size={14} /> },
      { label: "الحجوزات", href: "/bookings", roles: ["Owner", "Operations Manager", "Receptionist"], icon: <BookOpen size={14} /> },
      { label: "طلبات البار", href: "/bar-orders", roles: ["Owner", "Operations Manager", "Receptionist", "Barista"], icon: <Coffee size={14} /> },
      { label: "الفواتير والدفع", href: "/billing", roles: ["Owner", "Operations Manager", "Receptionist"], icon: <Receipt size={14} /> },
    ],
  },
  {
    label: "الإدارة",
    icon: <Settings size={15} />,
    roles: ["Owner", "Operations Manager"],
    defaultOpen: false,
    items: [
      { label: "المنتجات", href: "/products", roles: ["Owner", "Operations Manager", "Barista"], icon: <Package size={14} /> },
      { label: "المخازن", href: "/inventory", roles: ["Owner", "Operations Manager"], icon: <Boxes size={14} /> },
      { label: "الورديات", href: "/shifts", roles: ["Owner", "Operations Manager", "Barista"], icon: <Timer size={14} /> },
      { label: "التقارير المالية", href: "/reports", roles: ["Owner", "Operations Manager"], icon: <BarChartHorizontal size={14} /> },
      { label: "تقارير الحجوزات", href: "/reports/bookings", roles: ["Owner", "Operations Manager"], icon: <FileText size={14} /> },
      { label: "المستخدمين", href: "/users", roles: ["Owner", "Operations Manager"], icon: <UserCog size={14} /> },
      { label: "المصروفات", href: "/expenses", roles: ["Owner", "Operations Manager"], icon: <Wallet size={14} /> },
      { label: "عمليات السيستم", href: "/system-operations", roles: ["Owner"], icon: <Activity size={14} /> },
    ],
  },
  {
    label: "الإعدادات",
    icon: <Settings size={15} />,
    roles: ["Owner"],
    defaultOpen: false,
    items: [
      { label: "سجل العمليات", href: "/audit-logs", roles: ["Owner", "Operations Manager"], icon: <ShieldCheck size={14} /> },
      { label: "إعدادات النظام", href: "/settings", roles: ["Owner"], icon: <Settings size={14} /> },
    ],
  },
  {
    label: "الباريستا",
    icon: <Coffee size={15} />,
    roles: ["Barista"],
    defaultOpen: true,
    items: [
      { label: "نقطة البيع", href: "/dashboard/barista/pos", roles: ["Barista"], icon: <Receipt size={14} /> },
      { label: "طابور الطلبات", href: "/bar-orders", roles: ["Barista"], icon: <Coffee size={14} /> },
    ],
  },
];

function roleStyle(roleName?: string | null) {
  switch (roleName) {
    case "Owner": return { dot: "bg-violet-400", badge: "text-violet-300 bg-violet-500/20" };
    case "Operations Manager": return { dot: "bg-blue-400", badge: "text-blue-300 bg-blue-500/20" };
    case "Receptionist": return { dot: "bg-emerald-400", badge: "text-emerald-300 bg-emerald-500/20" };
    case "Barista": return { dot: "bg-amber-400", badge: "text-amber-300 bg-amber-500/20" };
    default: return { dot: "bg-slate-400", badge: "text-slate-300 bg-slate-500/20" };
  }
}

export function AppShell({ children }: PropsWithChildren) {
  const pathname = usePathname();
  const { user, clearAuth } = useAuthStore();
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({});
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const roleName = user?.role?.name;
  const fullName = [user?.firstName, user?.lastName].filter(Boolean).join(" ") || user?.email || "مستخدم";
  const initials = fullName.slice(0, 2).toUpperCase();
  const rs = roleStyle(roleName);

  const allowedGroups = navGroups.filter((g) => roleName ? g.roles.includes(roleName) : false);
  const toggleGroup = (label: string) =>
    setOpenGroups((p) => ({ ...p, [label]: !p[label] }));
  const handleLogout = () => { clearAuth(); window.location.href = "/login"; };

  const Sidebar = (
    <aside className="flex h-full flex-col bg-[#0f172a]">
      {/* Logo */}
      <div className="flex items-center gap-3 border-b border-white/8 px-5 py-5">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-500 shadow-lg shadow-amber-500/30">
          <Building2 size={18} className="text-white" />
        </div>
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.25em] text-amber-400">EDUVERS</p>
          <p className="text-sm font-bold text-white">نظام التشغيل</p>
        </div>
      </div>

      {/* User Card */}
      <div className="border-b border-white/8 px-4 py-4">
        <div className="flex items-center gap-3 rounded-xl bg-white/6 px-3 py-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 text-xs font-black text-white shadow">
            {initials}
          </div>
          <div className="min-w-0 flex-1 text-right">
            <p className="truncate text-sm font-bold text-white">{fullName}</p>
            <div className="mt-0.5 flex items-center justify-end gap-1.5">
              <span className={clsx("rounded-full px-2 py-0.5 text-[10px] font-bold", rs.badge)}>
                {roleLabel(roleName)}
              </span>
              <span className={clsx("h-1.5 w-1.5 rounded-full", rs.dot)} />
            </div>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-3 py-3 scrollbar-thin">
        <div className="space-y-0.5">
          {allowedGroups.map((group) => {
            const items = group.items.filter((i) => roleName ? i.roles.includes(roleName) : false);
            if (items.length === 0) return null;

            const isOpen = openGroups[group.label] ?? (group.defaultOpen ?? true);

            if (items.length === 1) {
              const item = items[0];
              const isActive = (item.href === "/reports" || item.href === "/dashboard")
                ? pathname === item.href
                : pathname === item.href || pathname.startsWith(item.href + "/");
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setSidebarOpen(false)}
                  className={clsx(
                    "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition-all",
                    isActive
                      ? "bg-amber-500 text-white shadow-md shadow-amber-500/30"
                      : "text-slate-400 hover:bg-white/8 hover:text-white",
                  )}
                >
                  <span className={isActive ? "text-white" : "text-slate-500"}>{item.icon}</span>
                  {item.label}
                </Link>
              );
            }

            return (
              <div key={group.label} className="pt-1">
                <button
                  onClick={() => toggleGroup(group.label)}
                  className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-[10px] font-black uppercase tracking-widest text-slate-500 hover:text-slate-400 transition"
                >
                  <div className="flex items-center gap-2">
                    <span>{group.icon}</span>
                    <span>{group.label}</span>
                  </div>
                  {isOpen ? <ChevronUp size={11} /> : <ChevronDown size={11} />}
                </button>

                {isOpen && (
                  <div className="mt-0.5 space-y-0.5">
                    {items.map((item) => {
                      const isActive = (item.href === "/reports" || item.href === "/dashboard")
                        ? pathname === item.href
                        : pathname === item.href || pathname.startsWith(item.href + "/");
                      return (
                        <Link
                          key={item.href}
                          href={item.href}
                          onClick={() => setSidebarOpen(false)}
                          className={clsx(
                            "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all",
                            isActive
                              ? "bg-amber-500 text-white font-semibold shadow-md shadow-amber-500/30"
                              : "text-slate-400 hover:bg-white/8 hover:text-white",
                          )}
                        >
                          <span className={clsx("shrink-0", isActive ? "text-white" : "text-slate-500")}>{item.icon}</span>
                          {item.label}
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </nav>

      {/* Logout */}
      <div className="border-t border-white/8 px-4 py-4">
        <button
          onClick={handleLogout}
          className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-400 transition hover:bg-rose-500/15 hover:text-rose-400"
        >
          <LogOut size={15} />
          تسجيل الخروج
        </button>
      </div>
    </aside>
  );

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900" dir="rtl">
      {/* Mobile topbar */}
      <div className="flex items-center justify-between border-b border-slate-200 bg-white px-4 py-3 lg:hidden">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-500">
            <Building2 size={14} className="text-white" />
          </div>
          <span className="text-sm font-black text-slate-900">EDUVERS</span>
        </div>
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="rounded-xl p-2 text-slate-600 hover:bg-slate-100"
        >
          {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="fixed inset-0 bg-black/60" onClick={() => setSidebarOpen(false)} />
          <div className="fixed right-0 top-0 h-full w-72 z-50">
            {Sidebar}
          </div>
        </div>
      )}

      <div className="mx-auto flex min-h-screen w-full max-w-[1600px]">
        {/* Desktop Sidebar */}
        <div className="hidden w-[265px] shrink-0 lg:block lg:sticky lg:top-0 lg:h-screen overflow-hidden">
          {Sidebar}
        </div>

        {/* Main content */}
        <main className="min-w-0 flex-1 border-r border-slate-200/60 bg-slate-50 p-4 md:p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
