"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Archive,
  CalendarDays,
  CheckCircle2,
  Edit3,
  PackagePlus,
  Plus,
  Search,
  Tag,
  Trash2,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";
import { api } from "../../../lib/api";
import { money } from "../../../lib/format";
import { useAuthStore } from "../../../store/auth-store";
import {
  Badge,
  Btn,
  EmptyState,
  FormField,
  Input,
  Modal,
  Panel,
  SectionTitle,
  Spinner,
} from "../../../components/ui";

interface Plan {
  id: string;
  name: string;
  packageType: string;
  durationDays: number;
  price: number;
  description?: string | null;
  isActive: boolean;
  createdAt: string;
}

interface PlanForm {
  name: string;
  packageType: string;
  durationDays: number;
  price: number;
  description: string;
  isActive: boolean;
}

type ApiError = { response?: { data?: { message?: string | string[] } } };
type StatusFilter = "all" | "active" | "archived";

const EMPTY_FORM: PlanForm = {
  name: "",
  packageType: "",
  durationDays: 1,
  price: 0,
  description: "",
  isActive: true,
};

function errorMessage(error: ApiError, fallback: string) {
  const message = error.response?.data?.message;
  return Array.isArray(message) ? message.join("، ") : message || fallback;
}

function suggestedCode(name: string) {
  const latin = name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
  return latin || `offer-${Date.now().toString(36)}`;
}

export default function SubscriptionPlansPage() {
  const queryClient = useQueryClient();
  const roleName = useAuthStore((state) => state.user?.role?.name);
  const canManage = roleName === "Owner" || roleName === "Operations Manager" || roleName === "Receptionist";
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<Plan | null>(null);
  const [form, setForm] = useState<PlanForm>(EMPTY_FORM);

  const plansQuery = useQuery<Plan[]>({
    queryKey: ["subscription-plans", "management"],
    queryFn: async () => (await api.get("/subscriptions/plans?all=true")).data,
    enabled: canManage,
  });

  const saveMutation = useMutation({
    mutationFn: async (payload: PlanForm) => {
      if (editingPlan) {
        const update = {
          name: payload.name,
          durationDays: payload.durationDays,
          price: payload.price,
          description: payload.description,
          isActive: payload.isActive,
        };
        return api.patch(`/subscriptions/plans/${editingPlan.id}`, update);
      }
      return api.post("/subscriptions/plans", payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["subscription-plans"] });
      setModalOpen(false);
      toast.success(editingPlan ? "تم تحديث الباقة" : "تمت إضافة الباقة أو العرض");
    },
    onError: (error: ApiError) => toast.error(errorMessage(error, "تعذر حفظ الباقة")),
  });

  const toggleMutation = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      api.patch(`/subscriptions/plans/${id}`, { isActive }),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["subscription-plans"] });
      toast.success(variables.isActive ? "تم تفعيل الباقة" : "تم إيقاف الباقة");
    },
    onError: (error: ApiError) => toast.error(errorMessage(error, "تعذر تغيير حالة الباقة")),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/subscriptions/plans/${id}`),
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ["subscription-plans"] });
      toast.success(response.data?.archived ? "الباقة مستخدمة سابقًا؛ تم أرشفتها" : "تم حذف الباقة نهائيًا");
    },
    onError: (error: ApiError) => toast.error(errorMessage(error, "تعذر حذف الباقة")),
  });

  const plans = useMemo(() => plansQuery.data ?? [], [plansQuery.data]);
  const filteredPlans = useMemo(() => {
    const term = search.trim().toLowerCase();
    return plans.filter((plan) => {
      const matchesStatus = statusFilter === "all" || (statusFilter === "active" ? plan.isActive : !plan.isActive);
      const matchesSearch = !term || [plan.name, plan.packageType, plan.description ?? ""].some((value) => value.toLowerCase().includes(term));
      return matchesStatus && matchesSearch;
    });
  }, [plans, search, statusFilter]);

  function openCreate() {
    setEditingPlan(null);
    setForm(EMPTY_FORM);
    setModalOpen(true);
  }

  function openEdit(plan: Plan) {
    setEditingPlan(plan);
    setForm({
      name: plan.name,
      packageType: plan.packageType,
      durationDays: plan.durationDays,
      price: Number(plan.price),
      description: plan.description ?? "",
      isActive: plan.isActive,
    });
    setModalOpen(true);
  }

  if (!canManage) {
    return (
      <Panel className="mx-auto max-w-xl py-14 text-center">
        <Archive className="mx-auto text-slate-300" size={52} />
        <h1 className="mt-4 text-xl font-black text-slate-900">إدارة الباقات غير متاحة لهذا الحساب</h1>
        <p className="mt-2 text-sm leading-6 text-slate-500">تغيير الأسعار والعروض متاح للمالك ومدير العمليات وموظف الاستقبال فقط.</p>
        <Link href="/subscriptions" className="mt-6 inline-flex rounded-xl bg-amber-500 px-5 py-2.5 text-sm font-bold text-white">العودة للاشتراكات</Link>
      </Panel>
    );
  }

  return (
    <div className="space-y-6">
      <SectionTitle
        title="إدارة الباقات والعروض"
        subtitle="أنشئ أي باقة أو عرض وحدد مدته وسعره، ثم فعّله ليظهر لموظف الاستقبال."
        icon={<PackagePlus size={22} />}
        action={<Btn onClick={openCreate} icon={<Plus size={17} />}>إضافة باقة أو عرض</Btn>}
      />

      <div className="grid gap-3 sm:grid-cols-3">
        <Panel className="flex items-center gap-3 p-4"><Tag className="text-blue-600" /><div><p className="text-xs text-slate-500">إجمالي الباقات</p><p className="text-2xl font-black">{plans.length}</p></div></Panel>
        <Panel className="flex items-center gap-3 p-4"><CheckCircle2 className="text-emerald-600" /><div><p className="text-xs text-slate-500">المفعّلة</p><p className="text-2xl font-black">{plans.filter((plan) => plan.isActive).length}</p></div></Panel>
        <Panel className="flex items-center gap-3 p-4"><Archive className="text-slate-500" /><div><p className="text-xs text-slate-500">المؤرشفة</p><p className="text-2xl font-black">{plans.filter((plan) => !plan.isActive).length}</p></div></Panel>
      </div>

      <Panel className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" size={17} />
          <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="ابحث بالاسم أو الكود..." className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-3 pr-10 text-sm outline-none focus:border-amber-400" />
        </div>
        <div className="flex gap-2">
          {([['all', 'الكل'], ['active', 'المفعّلة'], ['archived', 'المؤرشفة']] as const).map(([value, label]) => (
            <button key={value} onClick={() => setStatusFilter(value)} className={`rounded-xl px-4 py-2 text-xs font-bold transition ${statusFilter === value ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>{label}</button>
          ))}
        </div>
      </Panel>

      {plansQuery.isLoading ? (
        <div className="flex justify-center py-20"><Spinner size={34} /></div>
      ) : filteredPlans.length === 0 ? (
        <Panel><EmptyState icon={<PackagePlus size={44} className="text-slate-300" />} title="لا توجد باقات أو عروض" sub="اضغط على إضافة باقة أو عرض لإنشاء أول باقة." /></Panel>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
          {filteredPlans.map((plan) => (
            <Panel key={plan.id} className={`relative overflow-hidden p-5 ${plan.isActive ? 'border-slate-200' : 'border-slate-200 bg-slate-50 opacity-75'}`}>
              <div className="flex items-start justify-between gap-3">
                <div><Badge tone={plan.isActive ? "success" : "neutral"}>{plan.isActive ? "مفعّلة" : "مؤرشفة"}</Badge><h2 className="mt-3 text-lg font-black text-slate-950">{plan.name}</h2><p className="mt-1 font-mono text-[11px] text-slate-400">{plan.packageType}</p></div>
                <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-amber-100 text-amber-700"><CalendarDays size={21} /></span>
              </div>
              <div className="mt-5 flex items-end justify-between border-y border-slate-100 py-4"><div><p className="text-xs text-slate-500">السعر</p><p className="text-2xl font-black">{money(plan.price)}</p></div><div className="text-left"><p className="text-xs text-slate-500">المدة</p><p className="font-black">{plan.durationDays} يوم</p></div></div>
              <p className="mt-4 min-h-10 text-sm leading-5 text-slate-500">{plan.description || "لا يوجد وصف لهذا العرض."}</p>
              <div className="mt-5 flex gap-2">
                <Btn variant="secondary" size="sm" className="flex-1" onClick={() => openEdit(plan)} icon={<Edit3 size={14} />}>تعديل</Btn>
                <Btn variant={plan.isActive ? "warn" : "success"} size="sm" className="flex-1" onClick={() => toggleMutation.mutate({ id: plan.id, isActive: !plan.isActive })} icon={plan.isActive ? <XCircle size={14} /> : <CheckCircle2 size={14} />}>{plan.isActive ? "إيقاف" : "تفعيل"}</Btn>
                <button type="button" onClick={() => { if (confirm(`حذف الباقة «${plan.name}»؟ إذا كانت مستخدمة سابقًا سيتم أرشفتها بدل حذف السجلات.`)) deleteMutation.mutate(plan.id); }} className="rounded-xl border border-rose-200 p-2.5 text-rose-600 transition hover:bg-rose-50" aria-label={`حذف ${plan.name}`}><Trash2 size={16} /></button>
              </div>
            </Panel>
          ))}
        </div>
      )}

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editingPlan ? "تعديل الباقة أو العرض" : "إضافة باقة أو عرض"} size="lg">
        <form onSubmit={(event) => { event.preventDefault(); const packageType = editingPlan ? form.packageType : (form.packageType.trim() || suggestedCode(form.name)); saveMutation.mutate({ ...form, name: form.name.trim(), packageType }); }} className="space-y-4">
          <FormField label="اسم الباقة أو العرض"><Input required value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} placeholder="مثال: عرض طلبة الجامعة" /></FormField>
          <FormField label="كود فريد (اختياري)"><Input value={form.packageType} disabled={Boolean(editingPlan)} onChange={(event) => setForm({ ...form, packageType: event.target.value.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '') })} placeholder="يُنشأ تلقائيًا إذا تركته فارغًا" /><p className="mt-1 text-[11px] text-slate-400">الكود داخلي ولا يمكن تغييره بعد إنشاء الباقة.</p></FormField>
          <div className="grid grid-cols-2 gap-3"><FormField label="المدة بالأيام"><Input required type="number" min={1} value={form.durationDays} onChange={(event) => setForm({ ...form, durationDays: Number(event.target.value) })} /></FormField><FormField label="السعر"><Input required type="number" min={0} step="0.01" value={form.price} onChange={(event) => setForm({ ...form, price: Number(event.target.value) })} /></FormField></div>
          <FormField label="الوصف"><textarea value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} rows={4} placeholder="اكتب تفاصيل ومميزات العرض..." className="w-full rounded-xl border border-slate-200 p-3 text-sm outline-none focus:border-amber-400" /></FormField>
          <label className="flex cursor-pointer items-center justify-between rounded-xl border border-slate-200 bg-slate-50 p-4"><div><p className="text-sm font-black text-slate-900">متاحة للاشتراك</p><p className="text-xs text-slate-500">ستظهر لموظف الاستقبال عند اختيار باقة للعميل.</p></div><input type="checkbox" checked={form.isActive} onChange={(event) => setForm({ ...form, isActive: event.target.checked })} className="h-5 w-5 accent-amber-500" /></label>
          <Btn type="submit" className="h-13 w-full" loading={saveMutation.isPending}>{editingPlan ? "حفظ التعديلات" : "إضافة الباقة أو العرض"}</Btn>
        </form>
      </Modal>
    </div>
  );
}
