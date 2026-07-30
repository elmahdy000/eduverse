"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { 
  CreditCard, Plus, Search, Tag, Users,
  RefreshCw, Sparkles, Pencil, Clock3, CalendarDays, CalendarRange,
  Check, ArrowLeft, WalletCards,
} from "lucide-react";
import { api } from "../../../lib/api";
import { money, dateTime } from "../../../lib/format";
import { 
  Badge, Btn, DataTable, FormField, Input, Modal, Panel, 
  Spinner, EmptyState, SectionTitle, Select
} from "../../../components/ui";
import { toast } from "sonner";
import clsx from "clsx";
import { useAuthStore } from "../../../store/auth-store";

type PlanPeriod = "all" | "daily" | "weekly" | "monthly";

const PLAN_PERIODS: { value: PlanPeriod; label: string; days?: number }[] = [
  { value: "all", label: "كل الباقات" },
  { value: "daily", label: "يومية", days: 1 },
  { value: "weekly", label: "أسبوعية", days: 7 },
  { value: "monthly", label: "شهرية", days: 30 },
];

function planPeriod(plan: Pick<Plan, "packageType" | "durationDays">): Exclude<PlanPeriod, "all"> {
  const type = plan.packageType.toLowerCase();
  if (type.includes("daily") || plan.durationDays === 1) return "daily";
  if (type.includes("weekly") || plan.durationDays === 7) return "weekly";
  return "monthly";
}

function planPeriodLabel(plan: Pick<Plan, "packageType" | "durationDays">) {
  return PLAN_PERIODS.find((period) => period.value === planPeriod(plan))?.label ?? plan.packageType;
}

const PLAN_THEMES = {
  daily: {
    icon: Clock3,
    accent: "text-sky-700",
    iconBg: "bg-sky-100",
    border: "border-sky-200 hover:border-sky-400",
    glow: "from-sky-500/10",
  },
  weekly: {
    icon: CalendarDays,
    accent: "text-violet-700",
    iconBg: "bg-violet-100",
    border: "border-violet-200 hover:border-violet-400",
    glow: "from-violet-500/10",
  },
  monthly: {
    icon: CalendarRange,
    accent: "text-amber-700",
    iconBg: "bg-amber-100",
    border: "border-amber-200 hover:border-amber-400",
    glow: "from-amber-500/10",
  },
} as const;

interface Plan {
  id: string;
  name: string;
  packageType: string;
  durationDays: number;
  price: number;
  description?: string | null;
  isActive: boolean;
}

interface Subscription {
  id: string;
  customerId: string;
  customer?: { id: string; fullName: string; phoneNumber: string };
  planId: string;
  plan?: Plan;
  packageType: string;
  startDate: string;
  endDate: string;
  status: "active" | "expired" | "cancelled";
  pricePaid: number;
}

interface CustomerOption {
  id: string;
  fullName: string;
  phoneNumber: string;
}

type PlanPayload = Pick<Plan, "name" | "packageType" | "durationDays" | "price"> & {
  description: string;
  isActive: boolean;
};

type ApiError = { response?: { data?: { message?: string } } };

export default function SubscriptionsPage() {
  const queryClient = useQueryClient();
  const roleName = useAuthStore((state) => state.user?.role?.name);
  const canManagePlans = roleName === "Owner" || roleName === "Operations Manager" || roleName === "Receptionist";
  const [activeTab, setActiveTab] = useState<"subscriptions" | "plans">("plans");
  const [planPeriodFilter, setPlanPeriodFilter] = useState<PlanPeriod>("all");
  const [isSubscribeModalOpen, setSubscribeModalOpen] = useState(false);
  const [isPlanModalOpen, setPlanModalOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<Plan | null>(null);
  const [draftPlanPeriod, setDraftPlanPeriod] = useState<Exclude<PlanPeriod, "all">>("monthly");

  const [selectedCustomerId, setSelectedCustomerId] = useState("");
  const [selectedPlanId, setSelectedPlanId] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<"cash" | "card" | "bank_transfer" | "mixed">("cash");
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  // Queries
  const { data: plans, isLoading: isLoadingPlans } = useQuery<Plan[]>({
    queryKey: ["subscription-plans"],
    queryFn: async () => {
      const r = await api.get("/subscriptions/plans?all=true");
      return r.data;
    },
  });

  const { data: subscriptionsRes, isLoading: isLoadingSubs, refetch } = useQuery({
    queryKey: ["customer-subscriptions", statusFilter],
    queryFn: async () => {
      const r = await api.get("/subscriptions", {
        params: { status: statusFilter || undefined, limit: 500 },
      });
      return r.data;
    },
  });

  const { data: customers } = useQuery<CustomerOption[]>({
    queryKey: ["customers-list"],
    queryFn: async () => {
      const r = await api.get("/customers", { params: { limit: 1000 } });
      const res = r.data.data;
      return Array.isArray(res) ? res : res?.data || [];
    },
  });

  // Mutations
  const subscribeMutation = useMutation({
    mutationFn: (data: { customerId: string; planId: string; paymentMethod: "cash" | "card" | "bank_transfer" | "mixed"; startDate?: string }) =>
      api.post("/subscriptions", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["customer-subscriptions"] });
      setSubscribeModalOpen(false);
      setSelectedCustomerId("");
      setSelectedPlanId("");
      setPaymentMethod("cash");
      toast.success("تم الاشتراك بنجاح");
    },
    onError: (err: ApiError) => {
      toast.error(err.response?.data?.message || "تعذر إتمام الاشتراك");
    },
  });

  const savePlanMutation = useMutation({
    mutationFn: (data: PlanPayload) =>
      editingPlan ? api.patch(`/subscriptions/plans/${editingPlan.id}`, data) : api.post("/subscriptions/plans", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["subscription-plans"] });
      setPlanModalOpen(false);
      setEditingPlan(null);
      toast.success(editingPlan ? "تم تحديث الباقة" : "تم إضافة الباقة بنجاح");
    },
    onError: (err: ApiError) => {
      toast.error(err.response?.data?.message || "حصل خطأ في حفظ الباقة");
    },
  });

  const cancelSubMutation = useMutation({
    mutationFn: (id: string) => api.patch(`/subscriptions/${id}/cancel`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["customer-subscriptions"] });
      toast.success("تم إلغاء الاشتراك");
    },
    onError: (err: ApiError) => {
      toast.error(err.response?.data?.message || "تعذر إلغاء الاشتراك");
    },
  });

  const subscriptionsList: Subscription[] = Array.isArray(subscriptionsRes?.data)
    ? subscriptionsRes.data
    : Array.isArray(subscriptionsRes)
    ? subscriptionsRes
    : [];

  const filteredSubscriptions = subscriptionsList.filter((sub) => {
    if (!searchTerm.trim()) return true;
    const q = searchTerm.toLowerCase();
    return (
      sub.customer?.fullName.toLowerCase().includes(q) ||
      sub.customer?.phoneNumber.includes(q) ||
      sub.packageType.toLowerCase().includes(q)
    );
  });

  const visiblePlans = (plans ?? []).filter(
    (plan) => planPeriodFilter === "all" || planPeriod(plan) === planPeriodFilter,
  );
  const missingPeriods = PLAN_PERIODS.filter(
    (period): period is { value: Exclude<PlanPeriod, "all">; label: string; days: number } =>
      period.value !== "all" &&
      (planPeriodFilter === "all" || period.value === planPeriodFilter) &&
      !(plans ?? []).some((plan) => planPeriod(plan) === period.value),
  );
  const activePlans = (plans ?? []).filter((plan) => plan.isActive);
  const selectedPlan = activePlans.find((plan) => plan.id === selectedPlanId);

  function openSubscription(planId = "") {
    setSelectedPlanId(planId);
    setSubscribeModalOpen(true);
  }

  const subHeaders = ["العميل", "الباقة / النوع", "تاريخ البدء", "تاريخ الانتهاء", "المبلغ", "الحالة", ""];
  const subRows = filteredSubscriptions.map((s) => [
    <div key={s.id + "cust"}>
      <div className="font-bold text-slate-900 text-sm">{s.customer?.fullName || "—"}</div>
      <div className="text-xs text-slate-400 font-mono">{s.customer?.phoneNumber}</div>
    </div>,
    <Badge key={s.id + "plan"} tone="info" className="px-3 py-1 font-bold text-xs">
      {s.plan?.name || s.packageType}
    </Badge>,
    <div key={s.id + "st"} className="text-xs font-bold text-slate-600">{dateTime(s.startDate).split(",")[0]}</div>,
    <div key={s.id + "end"} className="text-xs font-bold text-slate-800">{dateTime(s.endDate).split(",")[0]}</div>,
    <div key={s.id + "amt"} className="font-black text-emerald-600">{money(s.pricePaid)}</div>,
    <Badge
      key={s.id + "st"}
      tone={s.status === "active" ? "success" : s.status === "expired" ? "warn" : "danger"}
      className="px-3 py-1 text-xs font-black"
    >
      {s.status === "active" ? "نشط" : s.status === "expired" ? "منتهي" : "ملغى"}
    </Badge>,
    <div key={s.id + "act"} className="flex justify-end">
      {s.status === "active" && (
        <button
          onClick={() => {
            if (confirm("هل أنت تأكد من إلغاء هذا الاشتراك؟")) cancelSubMutation.mutate(s.id);
          }}
          className="text-xs text-rose-600 hover:bg-rose-50 px-2 py-1 rounded-lg transition font-bold"
        >
          إلغاء
        </button>
      )}
    </div>,
  ]);

  return (
    <div className="space-y-6">
      <SectionTitle
        title="إدارة الباقات والاشتراكات"
        subtitle="متابعة باقات الطلاب والعملاء وساعات الحجز الشهرية والأسبوعية."
        icon={<CreditCard size={22} />}
        action={
          <div className="flex gap-2">
            {canManagePlans && (
              <Btn variant="secondary" size="sm" onClick={() => { window.location.href = "/subscription-plans"; }} icon={<Tag size={16} />}>
                إدارة الباقات
              </Btn>
            )}
            <Btn
              variant="primary"
              size="sm"
              onClick={() => openSubscription()}
              icon={<Plus size={18} />}
              disabled={!isLoadingPlans && activePlans.length === 0}
            >
              اشتراك جديد
            </Btn>
          </div>
        }
      />

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
        <button
          onClick={() => setActiveTab("subscriptions")}
          className={clsx(
            "flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold transition-all",
            activeTab === "subscriptions" ? "bg-blue-600 text-white shadow-md shadow-blue-500/20" : "text-slate-600 hover:bg-slate-100"
          )}
        >
          <Users size={16} /> اشتراكات العملاء
        </button>
        <button
          onClick={() => setActiveTab("plans")}
          className={clsx(
            "flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold transition-all",
            activeTab === "plans" ? "bg-blue-600 text-white shadow-md shadow-blue-500/20" : "text-slate-600 hover:bg-slate-100"
          )}
        >
          <Sparkles size={16} /> الباقات المتاحة ({activePlans.length})
        </button>
      </div>

      {activeTab === "subscriptions" ? (
        <div className="space-y-4">
          <Panel className="flex flex-wrap items-center justify-between gap-4 p-4 bg-white shadow-sm border-slate-200">
            <div className="relative flex-1 min-w-[240px]">
              <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
              <input
                type="text"
                placeholder="بحث باسم العميل أو رقم الهاتف..."
                className="w-full bg-slate-50 border border-slate-200 focus:bg-white rounded-xl pr-11 pl-4 py-2.5 text-sm font-bold outline-none focus:ring-2 focus:ring-blue-500/20"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="flex items-center gap-2">
              <select
                className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-700 outline-none"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="">جميع الحالات</option>
                <option value="active">الاشتراكات النشطة فقط</option>
                <option value="expired">الاشتراكات المنتهية</option>
                <option value="cancelled">الاشتراكات الملغاة</option>
              </select>
              <button
                onClick={() => refetch()}
                className="p-2 text-slate-400 hover:text-blue-600 rounded-xl transition"
              >
                <RefreshCw size={18} />
              </button>
            </div>
          </Panel>

          <Panel className="!p-0 overflow-hidden shadow-sm border-slate-200">
            {isLoadingSubs ? (
              <div className="flex items-center justify-center py-20"><Spinner size={32} /></div>
            ) : filteredSubscriptions.length === 0 ? (
              <EmptyState
                icon={<CreditCard size={40} className="text-slate-300" />}
                title="لا توجد اشتراكات مسجلة"
                sub="اضغط على 'اشتراك جديد' لإشراك عميل في إحدى باقات المجموعات أو الساعات."
              />
            ) : (
              <div className="p-3"><DataTable headers={subHeaders} rows={subRows} selectable={false} /></div>
            )}
          </Panel>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex flex-wrap gap-2" role="group" aria-label="تصفية الباقات حسب المدة">
            {PLAN_PERIODS.map((period) => (
              <button
                key={period.value}
                type="button"
                onClick={() => setPlanPeriodFilter(period.value)}
                aria-pressed={planPeriodFilter === period.value}
                className={clsx(
                  "rounded-xl border px-4 py-2 text-sm font-bold transition",
                  planPeriodFilter === period.value
                    ? "border-blue-600 bg-blue-600 text-white shadow-sm"
                    : "border-slate-200 bg-white text-slate-600 hover:border-blue-300 hover:text-blue-700",
                )}
              >
                {period.label}
              </button>
            ))}
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {isLoadingPlans ? (
            <div className="col-span-full flex justify-center py-20"><Spinner size={32} /></div>
          ) : (
            <>
            {canManagePlans && missingPeriods.map((period) => (
              <button
                type="button"
                key={period.value}
                onClick={() => { setEditingPlan(null); setDraftPlanPeriod(period.value); setPlanModalOpen(true); }}
                className="group min-h-64 rounded-3xl border-2 border-dashed border-slate-200 bg-white/60 p-6 text-right transition hover:border-amber-400 hover:bg-amber-50/40"
              >
                <span className="mb-8 flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-400 transition group-hover:bg-amber-100 group-hover:text-amber-700">
                  <Plus size={24} />
                </span>
                <span className="text-xs font-black text-slate-400">باقة {period.label}</span>
                <h3 className="mt-1 text-lg font-black text-slate-800">إضافة وتسعير الباقة</h3>
                <p className="mt-2 text-sm text-slate-500">المدة المقترحة: {period.days} {period.days === 1 ? "يوم" : "أيام"}</p>
              </button>
            ))}
            {visiblePlans.map((plan) => (
              <article
                key={plan.id}
                className={clsx(
                  "group relative min-h-64 overflow-hidden rounded-3xl border bg-white p-6 shadow-sm transition-all hover:-translate-y-1 hover:shadow-xl",
                  PLAN_THEMES[planPeriod(plan)].border,
                  !plan.isActive && "opacity-55 grayscale"
                )}
              >
                <div className={clsx("pointer-events-none absolute inset-x-0 top-0 h-28 bg-gradient-to-b to-transparent", PLAN_THEMES[planPeriod(plan)].glow)} />
                <div className="relative flex items-start justify-between">
                  {(() => {
                    const ThemeIcon = PLAN_THEMES[planPeriod(plan)].icon;
                    return <span className={clsx("flex h-12 w-12 items-center justify-center rounded-2xl", PLAN_THEMES[planPeriod(plan)].iconBg, PLAN_THEMES[planPeriod(plan)].accent)}><ThemeIcon size={23} /></span>;
                  })()}
                  <Badge tone={plan.isActive ? "success" : "neutral"} className="text-xs">
                    {plan.isActive ? "نشط" : "متوقف"}
                  </Badge>
                </div>
                <div className="relative mt-5">
                  <span className={clsx("text-xs font-black", PLAN_THEMES[planPeriod(plan)].accent)}>باقة {planPeriodLabel(plan)}</span>
                  <h3 className="mt-1 text-xl font-black text-slate-950">{plan.name}</h3>
                  <div className="mt-3 flex items-end gap-2">
                    <span className="text-3xl font-black text-slate-950">{money(plan.price)}</span>
                    <span className="pb-1 text-xs font-bold text-slate-400">لمدة {plan.durationDays} يوم</span>
                  </div>
                </div>
                {plan.description && <p className="relative mt-3 line-clamp-2 text-sm text-slate-500">{plan.description}</p>}
                <div className="relative mt-5 flex gap-2 border-t border-slate-100 pt-4">
                  {plan.isActive && (
                    <Btn
                      size="sm"
                      className="flex-1"
                      onClick={() => openSubscription(plan.id)}
                      icon={<ArrowLeft size={15} />}
                    >
                      اختيار للعميل
                    </Btn>
                  )}
                  {canManagePlans && (
                    <Btn
                      variant="secondary"
                      size="sm"
                      className={plan.isActive ? "px-3" : "w-full"}
                      onClick={() => { setEditingPlan(plan); setPlanModalOpen(true); }}
                      icon={<Pencil size={14} />}
                    >
                      {plan.isActive ? "" : "تعديل الباقة"}
                    </Btn>
                  )}
                </div>
              </article>
            ))}
            {!canManagePlans && !isLoadingPlans && visiblePlans.length === 0 && (
              <div className="col-span-full rounded-3xl border border-slate-200 bg-white px-6 py-14 text-center shadow-sm">
                <WalletCards className="mx-auto text-slate-300" size={48} />
                <h3 className="mt-4 text-xl font-black text-slate-900">لا توجد باقات مفعلة حاليًا</h3>
                <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">يجب أن يضيف المالك أو مدير العمليات أسعار الباقات أولًا، وبعدها ستظهر هنا ويمكن اختيارها للعميل مباشرة.</p>
              </div>
            )}
            </>
          )}
          </div>
        </div>
      )}

      {/* Modal Subscribe */}
      <Modal isOpen={isSubscribeModalOpen} onClose={() => setSubscribeModalOpen(false)} title="تسجيل اشتراك جديد" size="xl">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (!selectedCustomerId || !selectedPlanId) {
              toast.error("يرجى اختيار العميل والباقة");
              return;
            }
            subscribeMutation.mutate({ customerId: selectedCustomerId, planId: selectedPlanId, paymentMethod });
          }}
          className="space-y-4"
        >
          <div>
            <div className="mb-3 flex items-center justify-between">
              <div>
                <p className="text-sm font-black text-slate-900">1. اختر الباقة</p>
                <p className="mt-0.5 text-xs text-slate-500">اضغط على الباقة المناسبة للعميل</p>
              </div>
              {selectedPlan && <Badge tone="success"><Check size={12} /> تم الاختيار</Badge>}
            </div>
            {activePlans.length === 0 ? (
              <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm font-bold text-amber-800">
                لا توجد باقات مفعلة. يجب إعداد الباقات أولًا بواسطة المالك أو مدير العمليات.
              </div>
            ) : (
              <div className="grid gap-2 sm:grid-cols-3">
                {activePlans.map((plan) => {
                  const period = planPeriod(plan);
                  const ThemeIcon = PLAN_THEMES[period].icon;
                  const isSelected = selectedPlanId === plan.id;
                  return (
                    <button
                      key={plan.id}
                      type="button"
                      onClick={() => setSelectedPlanId(plan.id)}
                      className={clsx(
                        "relative rounded-2xl border-2 p-4 text-right transition",
                        isSelected
                          ? "border-amber-500 bg-amber-50 shadow-sm ring-2 ring-amber-500/15"
                          : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50",
                      )}
                    >
                      {isSelected && <span className="absolute left-3 top-3 flex h-6 w-6 items-center justify-center rounded-full bg-amber-500 text-white"><Check size={14} /></span>}
                      <span className={clsx("flex h-9 w-9 items-center justify-center rounded-xl", PLAN_THEMES[period].iconBg, PLAN_THEMES[period].accent)}><ThemeIcon size={18} /></span>
                      <p className="mt-3 text-sm font-black text-slate-900">{plan.name}</p>
                      <p className="mt-1 text-xs font-bold text-slate-500">{planPeriodLabel(plan)} · {plan.durationDays} يوم</p>
                      <p className="mt-3 text-lg font-black text-slate-950">{money(plan.price)}</p>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          <div className="border-t border-slate-100 pt-4">
          <FormField label="2. اختر العميل">
            <select
              required
              className="w-full h-12 rounded-xl border border-slate-200 px-4 text-sm font-bold bg-white text-slate-800"
              value={selectedCustomerId}
              onChange={(e) => setSelectedCustomerId(e.target.value)}
            >
              <option value="">-- اختر العميل --</option>
              {customers?.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.fullName} ({c.phoneNumber})
                </option>
              ))}
            </select>
          </FormField>

          {selectedCustomerId && selectedPlan && (
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
              <p className="text-xs font-black text-emerald-700">ملخص الاشتراك</p>
              <div className="mt-2 flex items-center justify-between gap-4">
                <div>
                  <p className="font-black text-slate-900">{customers?.find((customer) => customer.id === selectedCustomerId)?.fullName}</p>
                  <p className="text-xs text-slate-500">{selectedPlan.name} · {selectedPlan.durationDays} يوم</p>
                </div>
                <p className="text-xl font-black text-emerald-700">{money(selectedPlan.price)}</p>
              </div>
            </div>
          )}

          <FormField label="3. طريقة الدفع">
            <select
              required
              className="w-full h-12 rounded-xl border border-slate-200 px-4 text-sm font-bold bg-white text-slate-800"
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value as typeof paymentMethod)}
            >
              <option value="cash">نقدي</option>
              <option value="card">بطاقة</option>
              <option value="bank_transfer">تحويل بنكي</option>
              <option value="mixed">متعدد</option>
            </select>
          </FormField>
          </div>

          <Btn type="submit" className="w-full h-14 rounded-2xl font-bold" loading={subscribeMutation.isPending} disabled={!selectedCustomerId || !selectedPlanId || activePlans.length === 0}>
            تأكيد الاشتراك وتفعيل الباقة
          </Btn>
        </form>
      </Modal>

      {/* Modal Plan Add/Edit */}
      <Modal
        isOpen={isPlanModalOpen}
        onClose={() => { setPlanModalOpen(false); setEditingPlan(null); }}
        title={editingPlan ? "تعديل بيانات الباقة" : "إضافة باقة جديدة"}
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            const formData = new FormData(e.currentTarget);
            savePlanMutation.mutate({
              name: formData.get("name") as string,
              packageType: editingPlan?.packageType || (formData.get("packageType") as string),
              durationDays: Number(formData.get("durationDays")),
              price: Number(formData.get("price")),
              description: formData.get("description") as string,
              isActive: formData.get("isActive") === "on",
            });
          }}
          className="space-y-4"
        >
          <FormField label="اسم الباقة"><Input name="name" required defaultValue={editingPlan?.name} placeholder="مثلاً: باقة المجموعات الشهرية" className="h-12 rounded-xl font-bold" /></FormField>
          <FormField label="نوع الباقة">
            <Select name="packageType" required defaultValue={editingPlan?.packageType || draftPlanPeriod} disabled={Boolean(editingPlan)} className="h-12 rounded-xl font-bold">
              <option value="daily">يومية</option>
              <option value="weekly">أسبوعية</option>
              <option value="monthly">شهرية</option>
            </Select>
          </FormField>
          <div className="grid grid-cols-2 gap-3">
            <FormField label="السعر (ج.م)"><Input name="price" type="number" step="0.01" required defaultValue={editingPlan?.price} className="h-12 rounded-xl font-bold text-emerald-600" /></FormField>
            <FormField label="المدة (بالأيام)"><Input name="durationDays" type="number" required defaultValue={editingPlan?.durationDays || PLAN_PERIODS.find((period) => period.value === draftPlanPeriod)?.days || 30} className="h-12 rounded-xl font-bold" /></FormField>
          </div>
          <FormField label="وصف أو ملاحظات"><Input name="description" defaultValue={editingPlan?.description || ""} placeholder="مميزات الباقة أو الساعات المتاحة..." className="h-12 rounded-xl" /></FormField>
          <div className="flex items-center gap-2 p-3 bg-slate-50 rounded-xl border border-slate-200">
            <input type="checkbox" name="isActive" id="isActive" defaultChecked={editingPlan ? editingPlan.isActive : true} className="h-5 w-5 rounded text-blue-600" />
            <label htmlFor="isActive" className="text-sm font-bold text-slate-800 cursor-pointer">الباقة مفعّلة ومتاحة للاشتراك</label>
          </div>
          <Btn type="submit" className="w-full h-14 rounded-2xl font-bold bg-blue-600 hover:bg-blue-700" loading={savePlanMutation.isPending}>
            {editingPlan ? "حفظ التعديلات" : "إضافة الباقة"}
          </Btn>
        </form>
      </Modal>
    </div>
  );
}
