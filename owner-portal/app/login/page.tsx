"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { login } from "@/lib/api";
import { ShieldCheck, Lock, Mail } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await login(email, password);
      router.push("/dashboard");
    } catch (err: any) {
      setError(err?.message || "فشل تسجيل الدخول");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="op-panel w-full max-w-md" style={{ padding: 32 }}>
        <div className="flex items-center justify-center gap-3 mb-8">
          <ShieldCheck className="text-amber-400" size={40} />
          <div>
            <div className="text-2xl font-black text-amber-300">بوابة أصحاب المشروع</div>
            <div className="text-xs text-slate-400 mt-1">
              وصول مقيّد — لأصحاب المشروع فقط
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className="block text-sm text-slate-400 mb-2">البريد الإلكتروني</label>
            <div className="relative">
              <Mail
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500"
                size={18}
              />
              <input
                type="email"
                dir="ltr"
                autoComplete="username"
                className="op-input"
                style={{ paddingRight: 40, textAlign: "left" }}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="owner@example.com"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm text-slate-400 mb-2">كلمة المرور</label>
            <div className="relative">
              <Lock
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500"
                size={18}
              />
              <input
                type="password"
                autoComplete="current-password"
                className="op-input"
                style={{ paddingRight: 40 }}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
              />
            </div>
          </div>

          {error && (
            <div
              className="text-sm px-4 py-3 rounded-lg"
              style={{ background: "rgba(239, 68, 68, 0.1)", color: "#fca5a5" }}
            >
              {error}
            </div>
          )}

          <button type="submit" className="op-btn w-full mt-2" disabled={loading}>
            {loading ? "جاري التحقق..." : "دخول"}
          </button>
        </form>

        <div className="text-xs text-slate-500 mt-6 text-center leading-relaxed">
          هذه البوابة مخصّصة لعرض التقارير المالية والتشغيلية.
          <br />
          يتم تسجيل كل محاولة دخول.
        </div>
      </div>
    </div>
  );
}
