"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { PropsWithChildren, useState, useEffect, useCallback } from "react";
import {
  LayoutDashboard,
  Clock,
  CalendarCheck,
  Users,
  Coffee,
  Receipt,
  Wallet,
  Package,
  PackagePlus,
  DoorOpen,
  Warehouse,
  Timer,
  CreditCard,
  UserCog,
  Settings,
  LogOut,
  Menu,
  X,
  ChevronRight,
  ChevronLeft,
  Building2,
} from "lucide-react";
import { useAuthStore } from "../store/auth-store";
import type { AuthUser } from "../lib/types";
import { useRealtime } from "../lib/useRealtime";
import { api } from "../lib/api";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type NavItem = {
  label: string;
  href: string;
  icon: React.ElementType;
  ownerOnly?: boolean;
  planManagerOnly?: boolean;
  receptionOnly?: boolean;  // hidden from Barista — reception + owner roles only
};

// ---------------------------------------------------------------------------
// Navigation definition
// ---------------------------------------------------------------------------

const NAV_ITEMS: NavItem[] = [
  { label: "لوحة التحكم", href: "/dashboard",     icon: LayoutDashboard },
  { label: "الجلسات",      href: "/sessions",      icon: Clock           },
  { label: "الحجوزات",     href: "/bookings",      icon: CalendarCheck,  receptionOnly: true },
  { label: "العملاء",      href: "/customers",     icon: Users           },
  { label: "طلبات البار",  href: "/bar-orders",    icon: Coffee          },
  { label: "الفواتير",     href: "/billing",       icon: Receipt         },
  { label: "المصروفات",    href: "/expenses",      icon: Wallet          },
  { label: "المنتجات",     href: "/products",      icon: Package         },
  { label: "الغرف",        href: "/rooms",         icon: DoorOpen        },
  { label: "المخزون",      href: "/inventory",     icon: Warehouse       },
  { label: "الورديات",     href: "/shifts",        icon: Timer           },
  { label: "الاشتراكات",   href: "/subscriptions", icon: CreditCard      },
  { label: "إدارة الباقات", href: "/subscription-plans", icon: PackagePlus, planManagerOnly: true },
  { label: "المستخدمين",   href: "/users",         icon: UserCog,        ownerOnly: true },
  { label: "الإعدادات",    href: "/settings",      icon: Settings        },
];

const PRIVILEGED_ROLES    = new Set(["Owner", "Operations Manager", "owner", "operations manager"]);
const PLAN_MANAGER_ROLES  = new Set(["Owner", "Operations Manager", "Receptionist", "owner", "operations manager", "receptionist"]);
const RECEPTION_ROLES     = new Set(["Owner", "Operations Manager", "Receptionist", "owner", "operations manager", "receptionist"]);

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const STORAGE_KEY = "eduvers-sidebar-collapsed";
const SIDEBAR_EXPANDED = 260;
const SIDEBAR_COLLAPSED = 76;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getInitialCollapsed(): boolean {
  if (typeof window === "undefined") return false;
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored !== null) return stored === "true";
  return window.innerWidth < 1024;
}

function isActive(href: string, pathname: string): boolean {
  if (href === "/dashboard") return pathname === href;
  return pathname === href || pathname.startsWith(href + "/");
}

function roleColor(roleName?: string | null): { dot: string; pill: string } {
  switch (roleName) {
    case "Owner":              return { dot: "#a78bfa", pill: "rgba(167,139,250,0.18)" };
    case "Operations Manager": return { dot: "#60a5fa", pill: "rgba(96,165,250,0.18)"  };
    case "Receptionist":       return { dot: "#34d399", pill: "rgba(52,211,153,0.18)"  };
    case "Barista":            return { dot: "#fbbf24", pill: "rgba(251,191,36,0.18)"  };
    default:                   return { dot: "#94a3b8", pill: "rgba(148,163,184,0.18)" };
  }
}

function roleDisplayLabel(roleName?: string | null): string {
  switch (roleName) {
    case "Owner":              return "المالك";
    case "Operations Manager": return "مدير العمليات";
    case "Receptionist":       return "موظف استقبال";
    case "Barista":            return "باريستا";
    default:                   return roleName ?? "مستخدم";
  }
}

function getPageTitle(pathname: string): string {
  const map: Record<string, string> = {
    "/dashboard":     "لوحة التحكم",
    "/sessions":      "الجلسات",
    "/bookings":      "الحجوزات",
    "/customers":     "العملاء",
    "/bar-orders":    "طلبات البار",
    "/billing":       "الفواتير",
    "/expenses":      "المصروفات",
    "/products":      "المنتجات",
    "/rooms":         "الغرف",
    "/inventory":     "المخزون",
    "/shifts":        "الورديات",
    "/subscriptions": "الاشتراكات",
    "/subscription-plans": "إدارة الباقات والعروض",
    "/users":         "المستخدمين",
    "/settings":      "الإعدادات",
  };
  const seg = "/" + pathname.split("/").filter(Boolean)[0];
  return map[seg] ?? "إديوفيرس";
}

// ---------------------------------------------------------------------------
// NavLink
// ---------------------------------------------------------------------------

function NavLink({
  item,
  collapsed,
  onClick,
  pathname,
}: {
  item: NavItem;
  collapsed: boolean;
  onClick?: () => void;
  pathname: string;
}) {
  const active = isActive(item.href, pathname);
  const Icon = item.icon;

  return (
    <Link
      href={item.href}
      onClick={onClick}
      title={collapsed ? item.label : undefined}
      style={{
        position: "relative",
        display: "flex",
        alignItems: "center",
        gap: collapsed ? 0 : "11px",
        justifyContent: collapsed ? "center" : "flex-start",
        padding: collapsed ? "11px 0" : "10px 14px",
        borderRadius: "10px",
        fontSize: "13.5px",
        fontWeight: active ? 600 : 400,
        color: active ? "#fff" : "rgba(255,255,255,0.55)",
        background: active ? "rgba(255,255,255,0.09)" : "transparent",
        textDecoration: "none",
        whiteSpace: "nowrap",
        overflow: "hidden",
        transition: "background 180ms ease, color 180ms ease",
        // Active RTL indicator: thin left border (right side in RTL = left in physical layout)
        borderLeft: active ? "2.5px solid var(--color-brand)" : "2.5px solid transparent",
      }}
      onMouseEnter={(e) => {
        if (!active) {
          (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.06)";
          (e.currentTarget as HTMLElement).style.color = "rgba(255,255,255,0.85)";
        }
      }}
      onMouseLeave={(e) => {
        if (!active) {
          (e.currentTarget as HTMLElement).style.background = "transparent";
          (e.currentTarget as HTMLElement).style.color = "rgba(255,255,255,0.55)";
        }
      }}
    >
      <Icon
        size={17}
        style={{
          flexShrink: 0,
          color: active ? "var(--color-brand)" : "rgba(255,255,255,0.40)",
          transition: "color 180ms ease",
        }}
      />
      {!collapsed && (
        <span style={{ overflow: "hidden", textOverflow: "ellipsis", letterSpacing: "0.01em" }}>
          {item.label}
        </span>
      )}

      {/* Active dot when collapsed */}
      {active && collapsed && (
        <span
          style={{
            position: "absolute",
            bottom: "7px",
            left: "50%",
            transform: "translateX(-50%)",
            width: "4px",
            height: "4px",
            borderRadius: "50%",
            background: "var(--color-brand)",
          }}
        />
      )}
    </Link>
  );
}

// ---------------------------------------------------------------------------
// SidebarContent
// ---------------------------------------------------------------------------

function SidebarContent({
  collapsed,
  onToggle,
  onClose,
  showToggle,
  pathname,
  user,
  onLogout,
}: {
  collapsed: boolean;
  onToggle?: () => void;
  onClose?: () => void;
  showToggle: boolean;
  pathname: string;
  user: AuthUser | null;
  onLogout: () => void;
}) {
  const fullName =
    [user?.firstName, user?.lastName].filter(Boolean).join(" ") ||
    user?.email ||
    "مستخدم";
  const initials = fullName
    .split(" ")
    .slice(0, 2)
    .map((w: string) => w[0])
    .join("");
  const roleName = user?.role?.name;
  const rc = roleColor(roleName);
  const canSeeUsers    = PRIVILEGED_ROLES.has(roleName ?? "");
  const canManagePlans = PLAN_MANAGER_ROLES.has(roleName ?? "");
  const canSeeBookings = RECEPTION_ROLES.has(roleName ?? "");

  const visibleItems = NAV_ITEMS.filter(
    (item) =>
      (!item.ownerOnly      || canSeeUsers) &&
      (!item.planManagerOnly || canManagePlans) &&
      (!item.receptionOnly  || canSeeBookings)
  );

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100%",
        background: "var(--color-navy)",
        overflow: "hidden",
        borderLeft: "1px solid rgba(255,255,255,0.05)",
      }}
    >
      {/* ------------------------------------------------------------------ */}
      {/* Brand header                                                         */}
      {/* ------------------------------------------------------------------ */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: collapsed ? "center" : "space-between",
          padding: collapsed ? "18px 0" : "18px 16px",
          borderBottom: "1px solid rgba(255,255,255,0.06)",
          flexShrink: 0,
          minHeight: "68px",
        }}
      >
        {collapsed ? (
          /* Collapsed logo — brand mark only */
          <div
            style={{
              width: "38px",
              height: "38px",
              borderRadius: "11px",
              background: "var(--color-brand)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
              boxShadow: "0 4px 14px rgba(247,148,0,0.30)",
            }}
          >
            <Building2 size={18} color="#fff" />
          </div>
        ) : (
          <>
            {/* Brand mark + wordmark */}
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <div
                style={{
                  background: "var(--color-brand)",
                  borderRadius: "11px",
                  width: "38px",
                  height: "38px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                  boxShadow: "0 4px 14px rgba(247,148,0,0.30)",
                }}
              >
                <Building2 size={18} color="#fff" />
              </div>
              <div>
                <p
                  style={{
                    margin: 0,
                    fontSize: "16px",
                    fontWeight: 700,
                    color: "#fff",
                    lineHeight: 1.2,
                    letterSpacing: "-0.01em",
                  }}
                >
                  إديوفيرس
                </p>
                <p
                  style={{
                    margin: 0,
                    fontSize: "9.5px",
                    fontWeight: 600,
                    color: "var(--color-brand)",
                    letterSpacing: "0.14em",
                    textTransform: "uppercase",
                    lineHeight: 1.5,
                    opacity: 0.85,
                  }}
                >
                  EDUVERSE
                </p>
              </div>
            </div>

            {/* Desktop collapse toggle or mobile close */}
            {showToggle && (
              <button
                onClick={onToggle}
                aria-label="طي الشريط الجانبي"
                style={{
                  background: "rgba(255,255,255,0.06)",
                  border: "none",
                  borderRadius: "8px",
                  width: "30px",
                  height: "30px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: "pointer",
                  color: "rgba(255,255,255,0.40)",
                  flexShrink: 0,
                  transition: "background 180ms ease, color 180ms ease",
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.11)";
                  (e.currentTarget as HTMLElement).style.color = "#fff";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.06)";
                  (e.currentTarget as HTMLElement).style.color = "rgba(255,255,255,0.40)";
                }}
              >
                {/* RTL: right chevron = collapse toward sidebar edge */}
                <ChevronRight size={15} />
              </button>
            )}

            {onClose && !showToggle && (
              <button
                onClick={onClose}
                aria-label="إغلاق القائمة"
                style={{
                  background: "rgba(255,255,255,0.06)",
                  border: "none",
                  borderRadius: "8px",
                  width: "30px",
                  height: "30px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: "pointer",
                  color: "rgba(255,255,255,0.55)",
                  flexShrink: 0,
                }}
              >
                <X size={15} />
              </button>
            )}
          </>
        )}
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* Navigation                                                           */}
      {/* ------------------------------------------------------------------ */}
      <nav
        aria-label="القائمة الرئيسية"
        style={{
          flex: 1,
          overflowY: "auto",
          overflowX: "hidden",
          padding: collapsed ? "10px 8px" : "10px 10px",
          display: "flex",
          flexDirection: "column",
          gap: "1px",
          scrollbarWidth: "none",
        }}
      >
        {visibleItems.map((item) => (
          <NavLink
            key={item.href}
            item={item}
            collapsed={collapsed}
            pathname={pathname}
            onClick={onClose}
          />
        ))}
      </nav>

      {/* ------------------------------------------------------------------ */}
      {/* User section + collapse toggle at bottom                            */}
      {/* ------------------------------------------------------------------ */}
      <div
        style={{
          borderTop: "1px solid rgba(255,255,255,0.06)",
          padding: collapsed ? "10px 8px" : "10px 10px",
          flexShrink: 0,
          display: "flex",
          flexDirection: "column",
          gap: "4px",
        }}
      >
        {/* User card — expanded */}
        {!collapsed && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "10px",
              padding: "9px 12px",
              borderRadius: "10px",
              background: "rgba(255,255,255,0.05)",
              marginBottom: "2px",
            }}
          >
            {/* Avatar */}
            <div
              style={{
                width: "34px",
                height: "34px",
                borderRadius: "50%",
                background: "linear-gradient(135deg, var(--color-brand) 0%, #c97200 100%)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "12px",
                fontWeight: 700,
                color: "#fff",
                flexShrink: 0,
                letterSpacing: "0.02em",
              }}
            >
              {initials}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p
                style={{
                  margin: 0,
                  fontSize: "13px",
                  fontWeight: 600,
                  color: "#fff",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                  lineHeight: 1.3,
                }}
              >
                {fullName}
              </p>
              <div
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "5px",
                  marginTop: "3px",
                  padding: "1.5px 8px 1.5px 8px",
                  borderRadius: "999px",
                  background: rc.pill,
                }}
              >
                <span
                  style={{
                    width: "5px",
                    height: "5px",
                    borderRadius: "50%",
                    background: rc.dot,
                    flexShrink: 0,
                  }}
                />
                <span
                  style={{
                    fontSize: "10.5px",
                    fontWeight: 500,
                    color: rc.dot,
                    whiteSpace: "nowrap",
                  }}
                >
                  {roleDisplayLabel(roleName)}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Collapsed avatar */}
        {collapsed && (
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              padding: "3px 0",
            }}
          >
            <div
              title={`${fullName} — ${roleDisplayLabel(roleName)}`}
              style={{
                width: "34px",
                height: "34px",
                borderRadius: "50%",
                background: "linear-gradient(135deg, var(--color-brand) 0%, #c97200 100%)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "12px",
                fontWeight: 700,
                color: "#fff",
                flexShrink: 0,
                letterSpacing: "0.02em",
              }}
            >
              {initials}
            </div>
          </div>
        )}

        {/* Logout */}
        <button
          onClick={onLogout}
          title={collapsed ? "تسجيل الخروج" : undefined}
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: collapsed ? "center" : "flex-start",
            gap: collapsed ? 0 : "9px",
            padding: collapsed ? "10px 0" : "9px 14px",
            borderRadius: "10px",
            border: "none",
            background: "transparent",
            color: "rgba(255,255,255,0.35)",
            fontSize: "13px",
            fontWeight: 500,
            cursor: "pointer",
            width: "100%",
            transition: "background 180ms ease, color 180ms ease",
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLElement).style.background = "rgba(220,38,38,0.10)";
            (e.currentTarget as HTMLElement).style.color = "#f87171";
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLElement).style.background = "transparent";
            (e.currentTarget as HTMLElement).style.color = "rgba(255,255,255,0.35)";
          }}
        >
          <LogOut size={15} style={{ flexShrink: 0 }} />
          {!collapsed && <span>تسجيل الخروج</span>}
        </button>

        {/* Collapse toggle — bottom of sidebar, desktop only */}
        {showToggle && collapsed && (
          <button
            onClick={onToggle}
            aria-label="توسيع الشريط الجانبي"
            title="توسيع"
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: "9px 0",
              borderRadius: "10px",
              border: "none",
              background: "transparent",
              color: "rgba(255,255,255,0.28)",
              cursor: "pointer",
              width: "100%",
              transition: "background 180ms ease, color 180ms ease",
              marginTop: "2px",
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.06)";
              (e.currentTarget as HTMLElement).style.color = "rgba(255,255,255,0.70)";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLElement).style.background = "transparent";
              (e.currentTarget as HTMLElement).style.color = "rgba(255,255,255,0.28)";
            }}
          >
            <ChevronLeft size={15} />
          </button>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// AppShell
// ---------------------------------------------------------------------------

export function AppShell({ children }: PropsWithChildren) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, clearAuth } = useAuthStore();
  const roleName = user?.role?.name;

  const [collapsed, setCollapsed] = useState(false);
  const [hydrated, setHydrated] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);

  // Realtime connection
  useRealtime();

  // Hydrate collapsed state
  useEffect(() => {
    setCollapsed(getInitialCollapsed());
    setHydrated(true);
  }, []);

  // Collapse on small window resize
  useEffect(() => {
    function onResize() {
      if (window.innerWidth < 1024) {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored === null) setCollapsed(true);
      }
    }
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  // Close drawer on route change
  useEffect(() => {
    setDrawerOpen(false);
  }, [pathname]);

  // Lock body scroll when drawer open
  useEffect(() => {
    document.body.style.overflow = drawerOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [drawerOpen]);

  // Auto-start shift for staff roles
  useEffect(() => {
    if (roleName === "Receptionist" || roleName === "Barista") {
      api
        .get("/shifts/current")
        .then((res) => {
          if (!res.data?.data && !res.data?.id) return api.post("/shifts/start", { startCash: 0 });
        })
        .catch((err) => {
          if (err.response?.status === 404) {
            api.post("/shifts/start", { startCash: 0 }).catch(() => {});
          }
        });
    }
  }, [roleName]);

  const handleToggle = useCallback(() => {
    setCollapsed((prev) => {
      const next = !prev;
      localStorage.setItem(STORAGE_KEY, String(next));
      return next;
    });
  }, []);

  const handleLogout = useCallback(() => {
    clearAuth();
    router.push("/login");
  }, [clearAuth, router]);

  // Use hydrated state to avoid SSR mismatch
  const resolvedCollapsed = hydrated ? collapsed : false;
  const sidebarPx = resolvedCollapsed ? SIDEBAR_COLLAPSED : SIDEBAR_EXPANDED;

  const fullName =
    [user?.firstName, user?.lastName].filter(Boolean).join(" ") ||
    user?.email ||
    "مستخدم";
  const initials = fullName
    .split(" ")
    .slice(0, 2)
    .map((w: string) => w[0])
    .join("");

  return (
    <div
      dir="rtl"
      style={{
        minHeight: "100vh",
        background: "var(--color-page-bg)",
        display: "flex",
        position: "relative",
      }}
    >
      {/* ------------------------------------------------------------------ */}
      {/* Desktop fixed sidebar                                               */}
      {/* ------------------------------------------------------------------ */}
      <aside
        className="app-shell-sidebar"
        style={{
          position: "fixed",
          top: 0,
          right: 0,
          bottom: 0,
          width: `${sidebarPx}px`,
          zIndex: 40,
          transition: "width 300ms cubic-bezier(0.4, 0, 0.2, 1)",
        }}
      >
        <SidebarContent
          collapsed={resolvedCollapsed}
          onToggle={handleToggle}
          showToggle={true}
          pathname={pathname}
          user={user}
          onLogout={handleLogout}
        />
      </aside>

      {/* ------------------------------------------------------------------ */}
      {/* Mobile topbar                                                        */}
      {/* ------------------------------------------------------------------ */}
      <header
        className="app-shell-topbar"
        style={{
          position: "fixed",
          top: 0,
          right: 0,
          left: 0,
          height: "56px",
          background: "var(--color-navy)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0 16px",
          zIndex: 50,
          borderBottom: "1px solid rgba(255,255,255,0.06)",
        }}
      >
        {/* Hamburger */}
        <button
          onClick={() => setDrawerOpen(true)}
          aria-label="فتح القائمة"
          style={{
            background: "rgba(255,255,255,0.07)",
            border: "none",
            borderRadius: "9px",
            width: "36px",
            height: "36px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
            color: "rgba(255,255,255,0.80)",
            transition: "background 180ms ease",
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.12)";
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.07)";
          }}
        >
          <Menu size={18} />
        </button>

        {/* Brand */}
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <div
            style={{
              background: "var(--color-brand)",
              borderRadius: "9px",
              width: "32px",
              height: "32px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "0 2px 8px rgba(247,148,0,0.30)",
            }}
          >
            <Building2 size={15} color="#fff" />
          </div>
          <span
            style={{
              fontSize: "15px",
              fontWeight: 700,
              color: "#fff",
              letterSpacing: "-0.01em",
            }}
          >
            {getPageTitle(pathname)}
          </span>
        </div>

        {/* User avatar pill */}
        <div
          style={{
            width: "36px",
            height: "36px",
            borderRadius: "50%",
            background: "linear-gradient(135deg, var(--color-brand) 0%, #c97200 100%)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "12px",
            fontWeight: 700,
            color: "#fff",
            flexShrink: 0,
          }}
        >
          {initials}
        </div>
      </header>

      {/* ------------------------------------------------------------------ */}
      {/* Mobile drawer + backdrop                                            */}
      {/* ------------------------------------------------------------------ */}
      {drawerOpen && (
        <>
          {/* Backdrop */}
          <div
            onClick={() => setDrawerOpen(false)}
            style={{
              position: "fixed",
              inset: 0,
              background: "rgba(0,0,0,0.60)",
              zIndex: 60,
              backdropFilter: "blur(3px)",
              WebkitBackdropFilter: "blur(3px)",
              animation: "shellFadeIn 220ms ease",
            }}
          />
          {/* Drawer panel */}
          <div
            style={{
              position: "fixed",
              top: 0,
              right: 0,
              bottom: 0,
              width: `${SIDEBAR_EXPANDED}px`,
              zIndex: 70,
              animation: "shellSlideIn 240ms cubic-bezier(0.25, 0.46, 0.45, 0.94)",
            }}
          >
            <SidebarContent
              collapsed={false}
              showToggle={false}
              onClose={() => setDrawerOpen(false)}
              pathname={pathname}
              user={user}
              onLogout={handleLogout}
            />
          </div>
        </>
      )}

      {/* ------------------------------------------------------------------ */}
      {/* Main content                                                         */}
      {/* ------------------------------------------------------------------ */}
      <main
        className="app-shell-main"
        style={{
          flex: 1,
          minWidth: 0,
          minHeight: "100vh",
          padding: "28px 28px 28px 28px",
          background: "var(--color-page-bg)",
          overflowY: "auto",
          overflowX: "hidden",
          marginRight: `${sidebarPx}px`,
          transition: "margin-right 300ms cubic-bezier(0.4, 0, 0.2, 1)",
        }}
      >
        {children}
      </main>

      {/* ------------------------------------------------------------------ */}
      {/* Scoped styles                                                        */}
      {/* ------------------------------------------------------------------ */}
      <style>{`
        @keyframes shellFadeIn {
          from { opacity: 0; }
          to   { opacity: 1; }
        }
        @keyframes shellSlideIn {
          from { transform: translateX(100%); }
          to   { transform: translateX(0); }
        }

        /* Desktop: show sidebar, hide topbar */
        @media (min-width: 1024px) {
          .app-shell-sidebar { display: block !important; }
          .app-shell-topbar  { display: none  !important; }
        }

        /* Mobile/tablet: hide desktop sidebar, show topbar */
        @media (max-width: 1023px) {
          .app-shell-sidebar { display: none !important; }
          .app-shell-main {
            margin-right: 0 !important;
            padding-top: 76px !important;
            padding-left: 16px !important;
            padding-right: 16px !important;
            padding-bottom: 28px !important;
          }
        }

        @media (max-width: 639px) {
          .app-shell-main {
            padding-top: 70px !important;
            padding-left: 12px !important;
            padding-right: 12px !important;
          }
        }

        /* Hide nav scrollbar */
        nav::-webkit-scrollbar { display: none; }

        /* Focus ring */
        .app-shell-sidebar a:focus-visible,
        .app-shell-sidebar button:focus-visible {
          outline: 2px solid var(--color-brand);
          outline-offset: 2px;
          border-radius: 8px;
        }
      `}</style>
    </div>
  );
}
