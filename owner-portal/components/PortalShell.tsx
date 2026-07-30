"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { getUser, logout } from "@/lib/api";
import {
  LayoutDashboard,
  TrendingUp,
  Receipt,
  PiggyBank,
  Coffee,
  Package,
  LogOut,
  ShieldCheck,
  Activity,
} from "lucide-react";

const NAV = [
  { href: "/dashboard", label: "لوحة KPI", icon: LayoutDashboard },
  { href: "/reports/activity", label: "كل الحركات", icon: Activity },
  { href: "/reports/revenue", label: "الدخل", icon: TrendingUp },
  { href: "/reports/expenses", label: "المصروفات", icon: Receipt },
  { href: "/reports/profit", label: "صافي الربح", icon: PiggyBank },
  { href: "/reports/bar", label: "البار", icon: Coffee },
  { href: "/reports/inventory", label: "المخزون", icon: Package },
];

export function PortalShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const u = getUser();
    if (!u) {
      router.push("/login");
      return;
    }
    if (u?.role?.name !== "OwnerPortal") {
      logout();
      return;
    }
    setUser(u);
    setReady(true);
  }, [router]);

  if (!ready) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="op-spinner" />
      </div>
    );
  }

  return (
    <div className="min-h-screen lg:flex">
      {/* Sidebar */}
      <aside
        className="border-b border-slate-800 lg:fixed lg:inset-y-0 lg:right-0 lg:flex lg:w-[260px] lg:flex-col lg:border-b-0 lg:border-l"
        style={{ background: "rgba(0,0,0,0.35)" }}
      >
        <div className="px-5 py-6 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <ShieldCheck className="text-amber-400" size={22} />
            <div>
              <div className="text-lg font-black text-amber-300">بوابة أصحاب المشروع</div>
              <div className="text-xs text-slate-500 mt-0.5">Eduvers Owner Portal</div>
            </div>
          </div>
        </div>

        <nav className="flex gap-1 overflow-x-auto px-3 py-3 lg:flex-1 lg:flex-col lg:overflow-y-auto lg:py-4">
          {NAV.map((item) => {
            const Icon = item.icon;
            const active = pathname === item.href || pathname?.startsWith(item.href + "/");
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`op-nav-link shrink-0 ${active ? "is-active" : ""}`}
              >
                <Icon size={18} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="hidden p-4 border-t border-slate-800 lg:block">
          <div className="text-sm font-bold">
            {user?.firstName} {user?.lastName}
          </div>
          <div className="text-xs text-slate-500 mb-3">{user?.email}</div>
          <button
            className="op-btn-ghost w-full flex items-center justify-center gap-2 text-sm"
            onClick={() => logout()}
          >
            <LogOut size={16} />
            <span>تسجيل الخروج</span>
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="min-w-0 px-4 py-5 sm:px-6 lg:mr-[260px] lg:px-8 lg:py-8">{children}</main>
    </div>
  );
}
