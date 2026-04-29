"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { PropsWithChildren, useState } from "react";
import clsx from "clsx";
import {
  LayoutDashboard,
  Users,
  Calendar,
  BookOpen,
  Receipt,
  Package,
  DoorOpen,
  Coffee,
  ShieldCheck,
  UserCog,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Building2,
  Settings,
  TrendingUp,
  BarChart3,
  Activity,
} from "lucide-react";
import { useAuthStore } from "../store/auth-store";
import { roleHomePath, roleLabel } from "../lib/api";

type NavItem = { label: string; href: string; roles: string[]; icon: React.ReactNode };

type NavGroup = {
  label: string;
  icon: React.ReactNode;
  items: NavItem[];
  roles: string[];
  defaultOpen?: boolean;
};

const navGroups: NavGroup[] = [
  {
    label: "لوحة التحكم",
    icon: <LayoutDashboard size={16} />,
    roles: ["Owner", "Operations Manager", "Receptionist", "Barista"],
    defaultOpen: true,
    items: [
      {
        label: "لوحة التحكم",
        href: "/dashboard",
        roles: ["Owner", "Operations Manager", "Receptionist", "Barista"],
        icon: <LayoutDashboard size={14} />,
      },
    ],
  },
  {
    label: "العمليات",
    icon: <Calendar size={16} />,
    roles: ["Owner", "Operations Manager", "Receptionist"],
    defaultOpen: true,
    items: [
      {
        label: "العملاء",
        href: "/customers",
        roles: ["Owner", "Operations Manager", "Receptionist"],
        icon: <Users size={14} />,
      },
      {
        label: "الجلسات",
        href: "/sessions",
        roles: ["Owner", "Operations Manager", "Receptionist"],
        icon: <Calendar size={14} />,
      },
      {
        label: "الغرف",
        href: "/rooms",
        roles: ["Owner", "Operations Manager"],
        icon: <DoorOpen size={14} />,
      },
      {
        label: "الحجوزات",
        href: "/bookings",
        roles: ["Owner", "Operations Manager", "Receptionist"],
        icon: <BookOpen size={14} />,
      },
      {
        label: "طلبات البار",
        href: "/bar-orders",
        roles: ["Owner", "Operations Manager", "Receptionist", "Barista"],
        icon: <Coffee size={14} />,
      },
      {
        label: "الفواتير والدفع",
        href: "/billing",
        roles: ["Owner", "Operations Manager", "Receptionist"],
        icon: <Receipt size={14} />,
      },
    ],
  },
  {
    label: "الإدارة",
    icon: <Settings size={16} />,
    roles: ["Owner", "Operations Manager"],
    defaultOpen: false,
    items: [
      {
        label: "المنتجات",
        href: "/products",
        roles: ["Owner", "Operations Manager", "Barista"],
        icon: <Package size={14} />,
      },
      {
        label: "المستخدمين",
        href: "/users",
        roles: ["Owner", "Operations Manager"],
        icon: <UserCog size={14} />,
      },
      {
        label: "التقارير",
        href: "/reports",
        roles: ["Owner", "Operations Manager"],
        icon: <BarChart3 size={14} />,
      },
      {
        label: "عمليات السيستم",
        href: "/system-operations",
        roles: ["Owner"],
        icon: <Activity size={14} />,
      },
    ],
  },
  {
    label: "الإعدادات",
    icon: <Settings size={16} />,
    roles: ["Owner"],
    defaultOpen: false,
    items: [
      {
        label: "سجل العمليات",
        href: "/audit-logs",
        roles: ["Owner", "Operations Manager"],
        icon: <ShieldCheck size={14} />,
      },
      {
        label: "إعدادات النظام",
        href: "/settings",
        roles: ["Owner"],
        icon: <Settings size={14} />,
      },
    ],
  },
  {
    label: "الباريستا",
    icon: <Coffee size={16} />,
    roles: ["Barista"],
    defaultOpen: true,
    items: [
      {
        label: "نقطة البيع",
        href: "/dashboard/barista/pos",
        roles: ["Barista"],
        icon: <Receipt size={14} />,
      },
      {
        label: "طابور الطلبات",
        href: "/bar-orders",
        roles: ["Barista"],
        icon: <Coffee size={14} />,
      },
    ],
  },
];

function roleColor(roleName?: string | null) {
  switch (roleName) {
    case "Owner": return "bg-violet-100 text-violet-700 border-violet-200";
    case "Operations Manager": return "bg-blue-100 text-blue-700 border-blue-200";
    case "Receptionist": return "bg-emerald-100 text-emerald-700 border-emerald-200";
    case "Barista": return "bg-amber-100 text-amber-700 border-amber-200";
    default: return "bg-slate-100 text-slate-600 border-slate-200";
  }
}

export function AppShell({ children }: PropsWithChildren) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, clearAuth } = useAuthStore();
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({});

  const roleName = user?.role?.name;
  const fullName =
    [user?.firstName, user?.lastName].filter(Boolean).join(" ") || user?.email || "مستخدم";

  const allowedGroups = navGroups.filter((group) =>
    roleName ? group.roles.includes(roleName) : false
  );

  const toggleGroup = (groupLabel: string) => {
    setOpenGroups((prev) => ({
      ...prev,
      [groupLabel]: !prev[groupLabel],
    }));
  };

  const handleLogout = () => {
    clearAuth();
    // Use window.location.href for immediate redirect
    window.location.href = "/login";
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-slate-100 to-slate-200 text-slate-900">
      <div className="mx-auto grid min-h-screen w-full max-w-[1600px] grid-cols-1 lg:grid-cols-[280px_1fr]">
        {/* ── Sidebar ── */}
        <aside className="flex flex-col border-l border-slate-200/80 bg-white/95 shadow-sm backdrop-blur-xl lg:sticky lg:top-0 lg:h-screen lg:overflow-y-auto">
          {/* Logo */}
          <div className="border-b border-slate-100 px-6 py-5">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-900 text-white shadow">
                <Building2 size={18} />
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">
                  EDUVERS
                </p>
                <p className="text-sm font-semibold text-slate-900">نظام التشغيل</p>
              </div>
            </div>
          </div>

          {/* User Card */}
          <div className="border-b border-slate-100 px-4 py-4">
            <div className="rounded-xl bg-slate-50 p-3">
              <div className="mb-2 flex items-center gap-2">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-200 text-xs font-bold text-slate-600">
                  {(fullName[0] || "U").toUpperCase()}
                </div>
                <div className="min-w-0 flex-1 text-right">
                  <p className="truncate text-xs font-semibold text-slate-900">{fullName}</p>
                  <p className="truncate text-[10px] text-slate-500">{user?.email}</p>
                </div>
              </div>
              <span
                className={clsx(
                  "inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold",
                  roleColor(roleName),
                )}
              >
                {roleLabel(roleName)}
              </span>
            </div>
          </div>

          {/* Nav Groups */}
          <nav className="flex-1 overflow-y-auto px-3 py-4">
            <div className="space-y-1">
              {allowedGroups.map((group) => {
                const allowedItems = group.items.filter((item) =>
                  roleName ? item.roles.includes(roleName) : false
                );
                if (allowedItems.length === 0) return null;

                const isOpen = openGroups[group.label] ?? (group.defaultOpen ?? true);

                if (allowedItems.length === 1) {
                  const item = allowedItems[0];
                  const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={clsx(
                        "flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-medium transition",
                        isActive
                          ? "bg-slate-900 text-white shadow-sm"
                          : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                      )}
                    >
                      <span className={clsx("shrink-0", isActive ? "text-white" : "text-slate-400")}>
                        {item.icon}
                      </span>
                      {item.label}
                    </Link>
                  );
                }

                return (
                  <div key={group.label}>
                    <button
                      onClick={() => toggleGroup(group.label)}
                      className="flex w-full items-center justify-between rounded-xl px-3 py-2 text-xs font-bold uppercase tracking-wider text-slate-400 hover:bg-slate-50 transition"
                    >
                      <div className="flex items-center gap-2">
                        <span>{group.icon}</span>
                        <span>{group.label}</span>
                      </div>
                      {isOpen ? <ChevronLeft size={13} /> : <ChevronRight size={13} />}
                    </button>

                    {isOpen && (
                      <div className="mt-1 space-y-0.5 pr-2">
                        {allowedItems.map((item) => {
                          const isActive =
                            pathname === item.href || pathname.startsWith(item.href + "/");
                          return (
                            <Link
                              key={item.href}
                              href={item.href}
                              className={clsx(
                                "flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm font-medium transition",
                                isActive
                                  ? "bg-slate-900 text-white shadow-sm"
                                  : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                              )}
                            >
                              <span className={clsx("shrink-0", isActive ? "text-white" : "text-slate-400")}>
                                {item.icon}
                              </span>
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
          <div className="border-t border-slate-100 px-4 py-4">
            <button
              onClick={handleLogout}
              className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-500 transition hover:bg-rose-50 hover:text-rose-600"
            >
              <LogOut size={16} />
              تسجيل الخروج
            </button>
          </div>
        </aside>

        {/* ── Main Content ── */}
        <main className="min-w-0 p-4 md:p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
