"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Archive,
  CalendarDays,
  CheckCircle2,
  Clock,
  Edit3,
  PackagePlus,
  Plus,
  Search,
  Sparkles,
  Tag,
  Trash2,
  X,
  XCircle,
  Zap,
} from "lucide-react";
import { toast } from "sonner";
import { api } from "../../../lib/api";
import { money } from "../../../lib/format";
import { useAuthStore } from "../../../store/auth-store";
import {
  Badge,
  Btn,
  FormField,
  Input,
  Modal,
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
  durationDays: 30,
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
      toast.success(editingPlan ? "تم تحديث الباقة بنجاح" : "تمت إضافة الباقة أو العرض بنجاح");
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
      <div className="mx-auto max-w-xl py-16 text-center" dir="rtl">
        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-3xl bg-slate-100 text-slate-400 mb-4">
          <Archive size={40} />
        </div>
        <h1 className="text-xl font-black text-slate-900">إدارة الباقات غير متاحة لهذا الحساب</h1>
        <p className="mt-2 text-sm text-slate-500">تغيير الأسعار والعروض متاح للمالك ومدير العمليات وموظف الاستقبال فقط.</p>
        <Link href="/subscriptions" className="mt-6 inline-flex rounded-2xl bg-amber-500 px-6 py-3 text-sm font-bold text-slate-950 hover:bg-amber-400 transition shadow-sm">
          العودة للاشتراكات
        </Link>
      </div>
    );
  }

  const activeCount = plans.filter((p) => p.isActive).length;
  const archivedCount = plans.filter((p) => !p.isActive).length;

  return (
    <div className="space-y-6" dir="rtl">
      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs">
        <div className="flex items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20">
            <PackagePlus size={28} />
          </div>
          <div>
            <h1 className="text-xl font-black text-slate-900 tracking-tight">إدارة الباقات والعروض</h1>
            <p className="text-xs text-slate-500 mt-1 font-medium">أنشئ أي باقة أو عرض وحدد مدته وسعره، ثم فعّله ليظهر لموظف الاستقبال.</p>
          </div>
        </div>

        <button
          type="button"
          onClick={openCreate}
          className="flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-amber-500 to-amber-600 px-6 py-3.5 text-sm font-black text-slate-950 shadow-lg shadow-amber-500/25 hover:from-amber-400 hover:to-amber-500 active:scale-95 transition-all cursor-pointer"
        >
          <Plus size={18} />
          إضافة باقة أو عرض
        </button>
      </div>

      {/* Metric Cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-xs font-bold text-slate-500">إجمالي الباقات والعروض</p>
            <p className="text-3xl font-black text-slate-900 font-mono">{plans.length}</p>
          </div>
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
            <Tag size={22} />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-xs font-bold text-slate-500">الباقات المفعّلة</p>
            <p className="text-3xl font-black text-emerald-600 font-mono">{activeCount}</p>
          </div>
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600">
            <CheckCircle2 size={22} />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-xs font-bold text-slate-500">الباقات المؤرشفة</p>
            <p className="text-3xl font-black text-slate-400 font-mono">{archivedCount}</p>
          </div>
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-500">
            <Archive size={22} />
          </div>
        </div>
      </div>

      {/* Toolbar: Search & Segmented Filter */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="ابحث باسم الباقة أو العرض أو الكود..."
            className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-4 pr-10 text-sm font-semibold text-slate-900 placeholder:text-slate-400 outline-none focus:border-amber-500 focus:bg-white transition-all"
          />
        </div>

        <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl border border-slate-200/60 w-full sm:w-auto">
          {([
            ["all", "الكل"],
            ["active", "المفعّلة ⚡"],
            ["archived", "المؤرشفة 📦"],
          ] as const).map(([value, label]) => (
            <button
              key={value}
              type="button"
              onClick={() => setStatusFilter(value)}
              className={`flex-1 sm:flex-none rounded-lg px-4 py-1.5 text-xs font-black transition-all cursor-pointer ${
                statusFilter === value
                  ? "bg-white text-slate-950 shadow-xs border border-slate-200/40"
                  : "text-slate-600 hover:text-slate-950"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Content Grid / Loading / Empty */}
      {plansQuery.isLoading ? (
        <div className="flex flex-col items-center justify-center py-20 bg-white rounded-3xl border border-slate-200/80 shadow-xs">
          <Spinner size={34} />
          <p className="mt-3 text-xs font-bold text-slate-400">جاري تحميل الباقات والعروض...</p>
        </div>
      ) : filteredPlans.length === 0 ? (
        <div className="bg-white p-12 rounded-3xl border border-slate-200/80 shadow-xs text-center space-y-4">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-3xl bg-amber-50 text-amber-500">
            <PackagePlus size={38} />
          </div>
          <div className="max-w-sm mx-auto space-y-1">
            <h3 className="text-base font-black text-slate-900">لا توجد باقات أو عروض مطابقة</h3>
            <p className="text-xs font-bold text-slate-400">
              {search ? "لم يتم العثور على أي باقة تطابق كلمة البحث الحالية." : "لم تقم بإنشاء أي باقة أو عرض حتى الآن."}
            </p>
          </div>
          <button
            type="button"
            onClick={openCreate}
            className="inline-flex items-center gap-2 rounded-2xl bg-amber-500 px-6 py-3 text-sm font-black text-slate-950 hover:bg-amber-400 transition shadow-sm cursor-pointer"
          >
            <Plus size={16} />
            إضافة أول باقة أو عرض
          </button>
        </div>
      ) : (
        <div className="grid gap-5 lg:grid-cols-2 xl:grid-cols-3">
          {filteredPlans.map((plan) => (
            <div
              key={plan.id}
              className={`group relative overflow-hidden rounded-3xl border transition-all duration-200 ${
                plan.isActive
                  ? "bg-white border-slate-200 shadow-sm hover:shadow-md hover:border-amber-300"
                  : "bg-slate-50/70 border-slate-200 opacity-80"
              }`}
            >
              {/* Card Header */}
              <div className="p-6 space-y-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1.5 flex-1">
                    <div className="flex items-center gap-2">
                      <span
                        className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-black ${
                          plan.isActive
                            ? "bg-emerald-50 text-emerald-700 border border-emerald-200/60"
                            : "bg-slate-200/70 text-slate-600 border border-slate-300/60"
                        }`}
                      >
                        {plan.isActive ? (
                          <>
                            <Zap size={11} /> مفعّلة ومتاحة
                          </>
                        ) : (
                          <>
                            <Archive size={11} /> غير مفعّلة
                          </>
                        )}
                      </span>
                      {plan.packageType && (
                        <span className="rounded-full bg-slate-100 text-slate-600 px-2 py-0.5 text-[10px] font-mono font-bold">
                          {plan.packageType}
                        </span>
                      )}
                    </div>
                    <h3 className="text-lg font-black text-slate-900 group-hover:text-amber-600 transition-colors leading-tight">
                      {plan.name}
                    </h3>
                  </div>

                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-amber-50 text-amber-600 border border-amber-100">
                    <Sparkles size={22} />
                  </div>
                </div>

                {/* Price & Duration Box */}
                <div className="flex items-center justify-between bg-slate-50 p-3.5 rounded-2xl border border-slate-100">
                  <div>
                    <span className="text-[10px] font-black text-slate-400 block uppercase tracking-wider">السعر المستحق</span>
                    <span className="text-2xl font-black text-slate-900 ltr-value font-mono">{money(plan.price)}</span>
                  </div>

                  <div className="text-left">
                    <span className="text-[10px] font-black text-slate-400 block uppercase tracking-wider">مدة الاشتراك</span>
                    <span className="inline-flex items-center gap-1 text-sm font-black text-amber-700 bg-amber-100/70 px-2.5 py-1 rounded-xl">
                      <Clock size={13} />
                      {plan.durationDays} يوم
                    </span>
                  </div>
                </div>

                {/* Description */}
                <p className="text-xs text-slate-500 leading-relaxed min-h-[36px] line-clamp-2">
                  {plan.description || "لا يوجد وصف إضافي مكتوب لهذا العرض."}
                </p>
              </div>

              {/* Card Footer Actions */}
              <div className="flex items-center justify-between border-t border-slate-100 bg-slate-50/50 px-6 py-3.5">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => openEdit(plan)}
                    className="flex items-center gap-1 rounded-xl bg-white border border-slate-200 px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-100 transition-colors shadow-2xs"
                  >
                    <Edit3 size={13} /> تعديل
                  </button>
                  <button
                    type="button"
                    onClick={() => toggleMutation.mutate({ id: plan.id, isActive: !plan.isActive })}
                    disabled={toggleMutation.isPending}
                    className={`flex items-center gap-1 rounded-xl border px-3 py-1.5 text-xs font-bold transition-colors shadow-2xs ${
                      plan.isActive
                        ? "bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100"
                        : "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100"
                    }`}
                  >
                    {plan.isActive ? (
                      <>
                        <XCircle size={13} /> إيقاف
                      </>
                    ) : (
                      <>
                        <CheckCircle2 size={13} /> تفعيل
                      </>
                    )}
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    if (confirm(`حذف الباقة «${plan.name}»؟ إذا كانت مستخدمة سابقًا سيتم أرشفتها بدلاً من حذف سجلات العملاء.`)) {
                      deleteMutation.mutate(plan.id);
                    }
                  }}
                  className="rounded-xl border border-slate-200 bg-white p-2 text-slate-400 hover:text-rose-600 hover:border-rose-200 hover:bg-rose-50 transition-all cursor-pointer"
                  title={`حذف ${plan.name}`}
                >
                  <Trash2 size={15} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal: Create / Edit Subscription Plan */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingPlan ? "تعديل بيانات الباقة أو العرض" : "إضافة باقة أو عرض جديد"}
        size="lg"
      >
        <form
          onSubmit={(event) => {
            event.preventDefault();
            const packageType = editingPlan ? form.packageType : form.packageType.trim() || suggestedCode(form.name);
            saveMutation.mutate({ ...form, name: form.name.trim(), packageType });
          }}
          className="space-y-4"
          dir="rtl"
        >
          <FormField label="اسم الباقة أو العرض *">
            <Input
              required
              value={form.name}
              onChange={(event) => setForm({ ...form, name: event.target.value })}
              placeholder="مثال: عرض طلبة الجامعة - شهر كامل"
            />
          </FormField>

          <FormField label="كود فريد مخصص (اختياري)">
            <Input
              value={form.packageType}
              disabled={Boolean(editingPlan)}
              onChange={(event) =>
                setForm({
                  ...form,
                  packageType: event.target.value.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, ""),
                })
              }
              placeholder="يُنشأ تلقائيًا إذا تركته فارغًا (مثال: student-offer)"
            />
            <p className="mt-1 text-[11px] text-slate-400">الكود معرف داخلي في السيستم ولا يمكن تغييره بعد الإنشاء.</p>
          </FormField>

          <div className="grid grid-cols-2 gap-4">
            <FormField label="المدة بالأيام *">
              <Input
                required
                type="text"
                inputMode="numeric"
                value={form.durationDays}
                onChange={(event) => setForm({ ...form, durationDays: event.target.value === "" ? 0 : Number(event.target.value) || 0 })}
                placeholder="30"
              />
            </FormField>

            <FormField label="السعر النهائي (ج.م) *">
              <Input
                required
                type="text"
                inputMode="decimal"
                value={form.price}
                onChange={(event) => setForm({ ...form, price: event.target.value === "" ? 0 : Number(event.target.value) || 0 })}
                placeholder="0.00"
              />
            </FormField>
          </div>

          <FormField label="الوصف والتفاصيل">
            <textarea
              value={form.description}
              onChange={(event) => setForm({ ...form, description: event.target.value })}
              rows={3}
              placeholder="اكتب تفاصيل ومميزات العرض السريعة (الساعات المتاحة، الخصم...)"
              className="w-full rounded-xl border border-slate-200 p-3 text-sm outline-none focus:border-amber-500 transition-all font-semibold"
            />
          </FormField>

          <label className="flex cursor-pointer items-center justify-between rounded-2xl border border-slate-200 bg-slate-50/80 p-4 transition-all hover:bg-slate-100">
            <div>
              <p className="text-sm font-black text-slate-900">متاحة للاشتراك والتفعيل</p>
              <p className="text-xs font-bold text-slate-500 mt-0.5">ستظهر لموظف الاستقبال فوراً عند اختيار باقة لعميل جديد.</p>
            </div>
            <input
              type="checkbox"
              checked={form.isActive}
              onChange={(event) => setForm({ ...form, isActive: event.target.checked })}
              className="h-5 w-5 rounded border-slate-300 text-amber-500 focus:ring-amber-500 accent-amber-500"
            />
          </label>

          <Btn
            type="submit"
            className="h-14 w-full rounded-2xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-base transition-all shadow-md shadow-amber-500/20"
            loading={saveMutation.isPending}
          >
            {editingPlan ? "حفظ التعديلات" : "إضافة الباقة أو العرض الآن"}
          </Btn>
        </form>
      </Modal>
    </div>
  );
}
