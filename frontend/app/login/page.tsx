"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { Building2, Eye, EyeOff, LogIn, Mail, Lock, AlertCircle } from "lucide-react";
import { api, roleHomePath } from "../../lib/api";
import { useAuthStore } from "../../store/auth-store";
import { AuthGate } from "../../components/auth-gate";
import type { ApiSuccess, AuthPayload } from "../../lib/types";
import { translateApiError } from "../../lib/errors";

const DEMO_CREDENTIALS = [
  { role: "المالك", email: "owner@eduvers.com", password: "owner123", color: "violet" },
  { role: "مدير العمليات", email: "opsmanager@eduvers.com", password: "ops123", color: "blue" },
  { role: "الاستقبال", email: "receptionist@eduvers.com", password: "recept123", color: "emerald" },
  { role: "الباريستا", email: "barista@eduvers.com", password: "barista123", color: "amber" },
];

type DemoColor = "violet" | "blue" | "emerald" | "amber";

const colorMap: Record<DemoColor, { active: string; base: string; dot: string }> = {
  violet: {
    active: "bg-violet-50 border-violet-300 text-violet-700",
    base: "border-slate-200 hover:border-violet-200 hover:bg-violet-50/50 text-slate-700",
    dot: "bg-violet-500",
  },
  blue: {
    active: "bg-blue-50 border-blue-300 text-blue-700",
    base: "border-slate-200 hover:border-blue-200 hover:bg-blue-50/50 text-slate-700",
    dot: "bg-blue-500",
  },
  emerald: {
    active: "bg-emerald-50 border-emerald-300 text-emerald-700",
    base: "border-slate-200 hover:border-emerald-200 hover:bg-emerald-50/50 text-slate-700",
    dot: "bg-emerald-500",
  },
  amber: {
    active: "bg-amber-50 border-amber-300 text-amber-700",
    base: "border-slate-200 hover:border-amber-200 hover:bg-amber-50/50 text-slate-700",
    dot: "bg-amber-500",
  },
};

export default function LoginPage() {
  const router = useRouter();
  const setAuth = useAuthStore((s) => s.setAuth);

  const [email, setEmail] = useState("owner@eduvers.com");
  const [password, setPassword] = useState("owner123");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const response = await api.post<ApiSuccess<AuthPayload>>("/auth/login", { email, password });
      const payload = response.data.data;
      setAuth({
        accessToken: payload.accessToken,
        refreshToken: payload.refreshToken,
        user: payload.user,
      });
      router.push(roleHomePath(payload.user.role.name));
    } catch (err: unknown) {
      setError(
        translateApiError(
          (err as { response?: { data?: { message?: string | string[] } } })?.response?.data?.message ??
            "فشل تسجيل الدخول. تأكد من البريد وكلمة المرور.",
        ),
      );
    } finally {
      setLoading(false);
    }
  }

  function fillCredentials(cred: (typeof DEMO_CREDENTIALS)[number]) {
    setEmail(cred.email);
    setPassword(cred.password);
    setError(null);
  }

  return (
    <AuthGate publicOnly>
      <div
        dir="rtl"
        className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 px-4"
      >
        {/* Decorative background */}
        <div className="pointer-events-none fixed inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 h-80 w-80 rounded-full bg-violet-600/10 blur-3xl" />
          <div className="absolute -bottom-40 -left-40 h-80 w-80 rounded-full bg-blue-600/10 blur-3xl" />
        </div>

        <div className="relative w-full max-w-md">
          {/* Header */}
          <div className="mb-8 text-center">
            <div className="mb-4 inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-white/10 backdrop-blur-sm border border-white/20 shadow-xl">
              <Building2 size={32} className="text-white" />
            </div>
            <h1 className="text-3xl font-bold text-white tracking-tight">EDUVERS</h1>
            <p className="mt-2 text-sm text-slate-400">نظام إدارة المساحات التعليمية</p>
          </div>

          {/* Card */}
          <div className="rounded-2xl border border-white/10 bg-white/95 shadow-2xl backdrop-blur-xl p-8">
            <h2 className="mb-6 text-center text-lg font-bold text-slate-900">تسجيل الدخول</h2>

            {error && (
              <div className="mb-4 flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                <AlertCircle size={16} className="mt-0.5 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={onSubmit} className="space-y-4">
              {/* Email */}
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-slate-600">
                  البريد الإلكتروني
                </label>
                <div className="relative">
                  <Mail size={15} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    dir="ltr"
                    placeholder="email@example.com"
                    className="w-full rounded-xl border border-slate-300 bg-white py-2.5 pr-9 pl-4 text-left text-sm text-slate-900 outline-none placeholder:text-slate-400 transition focus:border-slate-900 focus:ring-2 focus:ring-slate-900/10"
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-slate-600">
                  كلمة المرور
                </label>
                <div className="relative">
                  <Lock size={15} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    dir="ltr"
                    placeholder="••••••••"
                    className="w-full rounded-xl border border-slate-300 bg-white py-2.5 pr-9 pl-10 text-left text-sm text-slate-900 outline-none placeholder:text-slate-400 transition focus:border-slate-900 focus:ring-2 focus:ring-slate-900/10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={loading}
                className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl bg-slate-900 py-3 text-sm font-bold text-white transition hover:bg-slate-700 disabled:opacity-60"
              >
                {loading ? (
                  <>
                    <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className="animate-spin">
                      <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
                    </svg>
                    جاري تسجيل الدخول...
                  </>
                ) : (
                  <>
                    <LogIn size={16} />
                    تسجيل الدخول
                  </>
                )}
              </button>
            </form>

            {/* Demo Credentials */}
            <div className="mt-6 space-y-3">
              <p className="text-center text-xs font-bold text-slate-500">اختر الحساب التجريبي</p>

              <div className="grid grid-cols-2 gap-2">
                {DEMO_CREDENTIALS.map((cred) => {
                  const colors = colorMap[cred.color as DemoColor];
                  const isActive = email === cred.email;
                  return (
                    <button
                      key={cred.role}
                      type="button"
                      onClick={() => fillCredentials(cred)}
                      className={`rounded-xl border p-2.5 text-right transition hover:scale-[1.02] active:scale-100 ${
                        isActive ? colors.active : colors.base
                      }`}
                    >
                      <div className="flex items-center gap-1.5">
                        <span className={`h-2 w-2 shrink-0 rounded-full ${colors.dot}`} />
                        <span className="text-xs font-semibold">{cred.role}</span>
                      </div>
                      <p className="mt-0.5 truncate text-[10px] opacity-70 text-left" dir="ltr">
                        {cred.email}
                      </p>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          <p className="mt-6 text-center text-xs text-slate-500">
            © {new Date().getFullYear()} Eduvers — جميع الحقوق محفوظة
          </p>
        </div>
      </div>
    </AuthGate>
  );
}
