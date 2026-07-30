"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { 
  CreditCard, Plus, Search, Tag, Users, Calendar, CheckCircle2, 
  XCircle, Clock, RefreshCw, AlertCircle, Sparkles, Pencil, Trash2, Flag
} from "lucide-react";
import { api } from "../../../lib/api";
import { money, dateTime } from "../../../lib/format";
import { 
  Badge, Btn, DataTable, FormField, Input, Modal, Panel, 
  Spinner, EmptyState, SectionTitle, Select
} from "../../../components/ui";
import { toast } from "sonner";
import clsx from "clsx";

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
  paidAmount: number;
}

export default function SubscriptionsPage() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<"subscriptions" | "plans">("subscriptions");
  const [isSubscribeModalOpen, setSubscribeModalOpen] = useState(false);
  const [isPlanModalOpen, setPlanModalOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<Plan | null>(null);

  const [selectedCustomerId, setSelectedCustomerId] = useState("");
  const [selectedPlanId, setSelectedPlanId] = useState("");
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

  const { data: customers } = useQuery({
    queryKey: ["customers-list"],
    queryFn: async () => {
      const r = await api.get("/customers", { params: { limit: 1000 } });
      const res = r.data.data;
      return Array.isArray(res) ? res : res?.data || [];
    },
  });

  // Mutations
  const subscribeMutation = useMutation({
    mutationFn: (data: { customerId: string; planId: string; startDate?: string; paidAmount?: number }) =>
      api.post("/subscriptions", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["customer-subscriptions"] });
      setSubscribeModalOpen(false);
      setSelectedCustomerId("");
      setSelectedPlanId("");
      toast.success("تم الاشتراك بنجاح");
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || "تعذر إتمام الاشتراك");
    },
  });

  const savePlanMutation = useMutation({
    mutationFn: (data: any) =>
      editingPlan ? api.patch(`/subscriptions/plans/${editingPlan.id}`, data) : api.post("/subscriptions/plans", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["subscription-plans"] });
      setPlanModalOpen(false);
      setEditingPlan(null);
      toast.success(editingPlan ? "تم تحديث الباقة" : "تم إضافة الباقة بنجاح");
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || "حصل خطأ في حفظ الباقة");
    },
  });

  const cancelSubMutation = useMutation({
    mutationFn: (id: string) => api.patch(`/subscriptions/${id}/cancel`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["customer-subscriptions"] });
      toast.success("تم إلغاء الاشتراك");
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
    <div key={s.id + "amt"} className="font-black text-emerald-600">{money(s.paidAmount)}</div>,
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
            <Btn variant="secondary" size="sm" onClick={() => setPlanModalOpen(true)} icon={<Tag size={16} />}>
              إدارة الباقات
            </Btn>
            <Btn variant="primary" size="sm" onClick={() => setSubscribeModalOpen(true)} icon={<Plus size={18} />}>
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
          <Sparkles size={16} /> الباقات المتاحة ({plans?.length || 0})
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
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {isLoadingPlans ? (
            <div className="col-span-full flex justify-center py-20"><Spinner size={32} /></div>
          ) : (
            plans?.map((plan) => (
              <div
                key={plan.id}
                className={clsx(
                  "rounded-2xl border bg-white p-6 shadow-sm relative overflow-hidden transition-all hover:shadow-md",
                  plan.isActive ? "border-slate-200" : "border-slate-100 opacity-60"
                )}
              >
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <span className="text-[10px] font-black uppercase text-blue-600 tracking-wider">
                      {plan.packageType}
                    </span>
                    <h3 className="text-xl font-bold text-slate-900 mt-0.5">{plan.name}</h3>
                  </div>
                  <Badge tone={plan.isActive ? "success" : "neutral"} className="text-xs">
                    {plan.isActive ? "نشط" : "متوقف"}
                  </Badge>
                </div>
                <div className="mb-4">
                  <span className="text-3xl font-black text-slate-900">{money(plan.price)}</span>
                  <span className="text-xs text-slate-400 font-bold mr-1">/ {plan.durationDays} يوم</span>
                </div>
                {plan.description && <p className="text-xs text-slate-500 mb-6">{plan.description}</p>}
                <div className="flex gap-2 pt-4 border-t border-slate-100">
                  <Btn
                    variant="secondary"
                    size="sm"
                    className="w-full"
                    onClick={() => { setEditingPlan(plan); setPlanModalOpen(true); }}
                    icon={<Pencil size={14} />}
                  >
                    تعديل الباقة
                  </Btn>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Modal Subscribe */}
      <Modal isOpen={isSubscribeModalOpen} onClose={() => setSubscribeModalOpen(false)} title="اشتراك عميل في باقة جديدة">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (!selectedCustomerId || !selectedPlanId) {
              toast.error("يرجى اختيار العميل والباقة");
              return;
            }
            subscribeMutation.mutate({ customerId: selectedCustomerId, planId: selectedPlanId });
          }}
          className="space-y-4"
        >
          <FormField label="اختر العميل">
            <select
              required
              className="w-full h-12 rounded-xl border border-slate-200 px-4 text-sm font-bold bg-white text-slate-800"
              value={selectedCustomerId}
              onChange={(e) => setSelectedCustomerId(e.target.value)}
            >
              <option value="">-- اختر العميل --</option>
              {customers?.map((c: any) => (
                <option key={c.id} value={c.id}>
                  {c.fullName} ({c.phoneNumber})
                </option>
              ))}
            </select>
          </FormField>

          <FormField label="اختر الباقة">
            <select
              required
              className="w-full h-12 rounded-xl border border-slate-200 px-4 text-sm font-bold bg-white text-slate-800"
              value={selectedPlanId}
              onChange={(e) => setSelectedPlanId(e.target.value)}
            >
              <option value="">-- اختر الباقة --</option>
              {plans?.filter(p => p.isActive).map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} — {money(p.price)} ({p.durationDays} يوم)
                </option>
              ))}
            </select>
          </FormField>

          <Btn type="submit" className="w-full h-14 rounded-2xl font-bold bg-blue-600 hover:bg-blue-700" loading={subscribeMutation.isPending}>
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
              packageType: formData.get("packageType") as string,
              durationDays: Number(formData.get("durationDays")),
              price: Number(formData.get("price")),
              description: formData.get("description") as string,
              isActive: formData.get("isActive") === "on",
            });
          }}
          className="space-y-4"
        >
          <FormField label="اسم الباقة"><Input name="name" required defaultValue={editingPlan?.name} placeholder="مثلاً: باقة المجموعات الشهرية" className="h-12 rounded-xl font-bold" /></FormField>
          <FormField label="رمز/نوع الباقة (كود تعريف فريد)">
            <Input name="packageType" required defaultValue={editingPlan?.packageType} placeholder="monthly_standard / hourly_20" className="h-12 rounded-xl font-mono text-sm" />
          </FormField>
          <div className="grid grid-cols-2 gap-3">
            <FormField label="السعر (ج.م)"><Input name="price" type="number" step="0.01" required defaultValue={editingPlan?.price} className="h-12 rounded-xl font-bold text-emerald-600" /></FormField>
            <FormField label="المدة (بالأيام)"><Input name="durationDays" type="number" required defaultValue={editingPlan?.durationDays || 30} className="h-12 rounded-xl font-bold" /></FormField>
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
