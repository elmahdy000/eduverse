"use client";

import { AlertTriangle, RefreshCw, Home } from "lucide-react";
import { useRouter } from "next/navigation";

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const router = useRouter();

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-slate-50 via-slate-100 to-slate-200 px-4">
      <div className="text-center">
        <div className="mx-auto mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-rose-50">
          <AlertTriangle size={40} className="text-rose-500" />
        </div>

        <h1 className="text-4xl font-bold text-slate-900">حدث خطأ</h1>
        <h2 className="mt-2 text-lg font-semibold text-slate-600">خطأ في تحميل الصفحة</h2>
        <p className="mt-3 max-w-md text-sm text-slate-500">
          عذراً، حدث خطأ غير متوقع. يرجى المحاولة مرة أخرى.
        </p>

        <div className="mt-8 flex items-center justify-center gap-3">
          <button
            onClick={reset}
            className="flex items-center gap-2 rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-slate-700"
          >
            <RefreshCw size={16} />
            إعادة المحاولة
          </button>
          <button
            onClick={() => router.push("/login")}
            className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-medium text-slate-600 transition hover:bg-slate-50"
          >
            <Home size={16} />
            صفحة الدخول
          </button>
        </div>

        {error.digest && (
          <p className="mt-6 font-mono text-xs text-slate-400">خطأ: {error.digest}</p>
        )}
      </div>
    </div>
  );
}
