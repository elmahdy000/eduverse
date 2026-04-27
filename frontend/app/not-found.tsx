"use client";

import { useRouter } from "next/navigation";
import { AlertTriangle, Home, ArrowRight } from "lucide-react";

export default function NotFound() {
  const router = useRouter();

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-slate-50 via-slate-100 to-slate-200 px-4">
      <div className="text-center">
        <div className="mx-auto mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-amber-50">
          <AlertTriangle size={40} className="text-amber-500" />
        </div>

        <h1 className="text-6xl font-bold text-slate-900">404</h1>
        <h2 className="mt-2 text-xl font-semibold text-slate-600">الصفحة غير موجودة</h2>
        <p className="mt-3 max-w-md text-sm text-slate-500">
          عذراً، الصفحة التي تبحث عنها غير موجودة أو تم نقلها.
        </p>

        <div className="mt-8 flex items-center justify-center gap-3">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-medium text-slate-600 transition hover:bg-slate-50"
          >
            <ArrowRight size={16} />
            رجوع
          </button>
          <button
            onClick={() => router.push("/login")}
            className="flex items-center gap-2 rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-slate-700"
          >
            <Home size={16} />
            تسجيل الدخول
          </button>
        </div>
      </div>

      <p className="mt-12 text-xs text-slate-400">
        EDUVERS Venue Management System &copy; {new Date().getFullYear()}
      </p>
    </div>
  );
}
