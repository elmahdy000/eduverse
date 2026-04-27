"use client";

import { useMemo } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "../../../store/auth-store";
import { roleHomePath, roleLabel } from "../../../lib/api";
import { SectionTitle } from "../../../components/ui";

export default function DashboardPage() {
  const router = useRouter();
  const role = useAuthStore((s) => s.user?.role?.name);
  const target = useMemo(() => roleHomePath(role), [role]);

  return (
    <div>
      <SectionTitle title="لوحة التحكم" subtitle="افتح مساحة العمل المناسبة لدورك الوظيفي." />
      <button
        className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white"
        onClick={() => router.push(target)}
      >
        الانتقال إلى لوحة {roleLabel(role)}
      </button>
    </div>
  );
}
