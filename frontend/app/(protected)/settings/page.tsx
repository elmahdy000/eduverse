"use client";

import { useQuery } from "@tanstack/react-query";
import { AlertTriangle, Clock3, ShieldCheck, Settings, Users2 } from "lucide-react";
import { api } from "../../../lib/api";
import { dateTime } from "../../../lib/format";
import { Alert, Panel, SectionTitle, StatCard } from "../../../components/ui";

interface RoleUser {
  id: string;
  email: string;
  status: string;
  lastLoginAt?: string | null;
  role?: { name: string };
}

interface Paginated<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
}

export default function SettingsPage() {
  const usersQuery = useQuery({
    queryKey: ["settings", "users-overview"],
    queryFn: async () => {
      const r = await api.get("/users", { params: { page: 1, limit: 200 } });
      return r.data.data as Paginated<RoleUser>;
    },
    refetchInterval: 60000,
  });

  const users = usersQuery.data?.data ?? [];
  const activeUsers = users.filter((u) => u.status === "active").length;
  const owners = users.filter((u) => u.role?.name === "Owner").length;
  const opsManagers = users.filter((u) => u.role?.name === "Operations Manager").length;
  const lastLogin = users
    .map((u) => u.lastLoginAt)
    .filter(Boolean)
    .sort()
    .reverse()[0] ?? null;

  return (
    <div className="space-y-5">
      <SectionTitle
        title="إعدادات النظام"
        subtitle="لوحة متابعة إعدادات التشغيل والصلاحيات الأساسية لمالك النظام."
        icon={<Settings size={18} />}
      />

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="إجمالي المستخدمين" value={users.length} icon={<Users2 size={18} />} tone="info" />
        <StatCard label="مستخدمين نشطين" value={activeUsers} icon={<ShieldCheck size={18} />} tone="success" />
        <StatCard label="مديري التشغيل" value={opsManagers} icon={<Users2 size={18} />} />
        <StatCard label="حسابات مالك" value={owners} icon={<ShieldCheck size={18} />} tone="warn" />
      </div>

      <Panel title="مراجعة صلاحيات الأدوار" icon={<ShieldCheck size={15} />}>
        <div className="space-y-2 text-sm">
          <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
            <p className="font-semibold text-slate-900">المالك</p>
            <p className="text-slate-600">إدارة كاملة للنظام + متابعة عمليات السيستم + إدارة المستخدمين والإعدادات.</p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
            <p className="font-semibold text-slate-900">مدير العمليات</p>
            <p className="text-slate-600">متابعة التشغيل اليومي والتقارير التنفيذية بدون صلاحيات Owner الحساسة.</p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
            <p className="font-semibold text-slate-900">الاستقبال</p>
            <p className="text-slate-600">تسجيل العملاء، الجلسات، الحجز، الدفع وخدمة العملاء.</p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
            <p className="font-semibold text-slate-900">الباريستا</p>
            <p className="text-slate-600">إدارة طابور الطلبات وتحضير وتسليم طلبات البار.</p>
          </div>
        </div>
      </Panel>

      <Panel title="حالة السيستم" icon={<Clock3 size={15} />}>
        <div className="grid gap-3 md:grid-cols-2">
          <div className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm">
            <p className="text-slate-500">آخر تسجيل دخول على أي حساب</p>
            <p className="font-semibold text-slate-900">{dateTime(lastLogin)}</p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm">
            <p className="text-slate-500">تحديث البيانات</p>
            <p className="font-semibold text-slate-900">تلقائي كل 60 ثانية</p>
          </div>
        </div>

        {owners === 0 && (
          <div className="mt-3">
            <Alert tone="danger">تحذير: لا يوجد حساب مالك نشط.</Alert>
          </div>
        )}
        {activeUsers === 0 && (
          <div className="mt-3">
            <Alert tone="warn">تحذير: لا يوجد أي مستخدم نشط حالياً.</Alert>
          </div>
        )}
        {users.length > 0 && activeUsers > 0 && (
          <div className="mt-3">
            <Alert tone="success">الحالة العامة جيدة: يوجد مستخدمون نشطون والصلاحيات موزعة.</Alert>
          </div>
        )}
      </Panel>

      <Panel title="ملاحظات تشغيل" icon={<AlertTriangle size={15} />}>
        <ul className="space-y-1 text-sm text-slate-700">
          <li>يفضّل مراجعة شاشة "عمليات السيستم" يومياً لمتابعة أي حركة غير معتادة.</li>
          <li>تأكد إن كل دور شغال بحساب منفصل لتتبع العمليات بدقة.</li>
          <li>تغيير كلمات المرور الدورية يقلل مخاطر الوصول غير المصرح.</li>
        </ul>
      </Panel>
    </div>
  );
}
