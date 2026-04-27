"use client";

import { usePathname } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { useAuthStore } from "../store/auth-store";
import { roleHomePath } from "../lib/api";

export function AuthGate({
  children,
  publicOnly = false,
}: {
  children: React.ReactNode;
  publicOnly?: boolean;
}) {
  const pathname = usePathname();
  const { isAuthenticated, user } = useAuthStore();
  const [mounted, setMounted] = useState(false);

  const destination = useMemo(() => roleHomePath(user?.role?.name), [user?.role?.name]);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) {
      return;
    }

    if (!isAuthenticated && !publicOnly && pathname !== "/login") {
      window.location.href = "/login";
      return;
    }

    if (isAuthenticated && publicOnly && pathname !== "/login") {
      window.location.href = destination;
    }
  }, [destination, isAuthenticated, mounted, publicOnly, pathname]);

  if (!mounted) {
    return <div className="p-8 text-sm text-slate-600">جاري التحميل...</div>;
  }

  if (!isAuthenticated && !publicOnly && pathname !== "/login") {
    return <div className="p-8 text-sm text-slate-600">جاري التحويل إلى صفحة تسجيل الدخول...</div>;
  }

  if (isAuthenticated && publicOnly && pathname !== "/login") {
    return <div className="p-8 text-sm text-slate-600">جاري التحويل إلى لوحة التحكم...</div>;
  }

  return <>{children}</>;
}
