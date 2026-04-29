"use client";

import { FormEvent, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  AlertTriangle,
  Coffee,
  Clock3,
  History,
  Phone,
  RefreshCw,
  Search,
  ShieldBan,
  UserCheck,
  UserPlus,
  UserX,
  Users,
  Wallet,
} from "lucide-react";
import clsx from "clsx";
import { api } from "../../../lib/api";
import { translateApiError } from "../../../lib/errors";
import { dateTime, money } from "../../../lib/format";
import { translateCustomerType, translateSessionType, translateStatus } from "../../../lib/labels";
import type { BarOrder, Customer, Paginated, Session } from "../../../lib/types";
import {
  Alert,
  Badge,
  Btn,
  DataTable,
  EmptyState,
  FormField,
  Input,
  Panel,
  SectionTitle,
  Select,
  StatCard,
  statusBadgeTone,
} from "../../../components/ui";

interface CustomerHistory {
  customer: Customer;
  sessionsCount: number;
  invoicesCount: number;
  bookingsCount: number;
  totalSpent: number;
}

const ctypeColors: Record<string, string> = {
  student: "bg-blue-100 text-blue-700 border-blue-200",
  employee: "bg-violet-100 text-violet-700 border-violet-200",
  trainer: "bg-emerald-100 text-emerald-700 border-emerald-200",
  parent: "bg-amber-100 text-amber-700 border-amber-200",
  visitor: "bg-slate-100 text-slate-600 border-slate-200",
};

export default function CustomersPage() {
  const queryClient = useQueryClient();

  const [fullName, setFullName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [customerType, setCustomerType] = useState("visitor");
  const [email, setEmail] = useState("");
  const [address, setAddress] = useState("");
  const [notes, setNotes] = useState("");
  const [college, setCollege] = useState("");
  const [studyLevel, setStudyLevel] = useState("");
  const [specialization, setSpecialization] = useState("");
  const [employerName, setEmployerName] = useState("");
  const [jobTitle, setJobTitle] = useState("");

  const [searchName, setSearchName] = useState("");
  const [searchPhone, setSearchPhone] = useState("");
  const [activeTypeTab, setActiveTypeTab] = useState<string>("all");
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [message, setMessage] = useState<{ text: string; ok: boolean } | null>(null);

  const customersQuery = useQuery({
    queryKey: ["customers", searchName, searchPhone],
    queryFn: async () => {
      const response = await api.get("/customers", {
        params: {
          page: 1,
          limit: 50,
          name: searchName || undefined,
          phone: searchPhone || undefined,
        },
      });
      return response.data.data as Paginated<Customer>;
    },
  });

  const phoneSearchQuery = useQuery({
    queryKey: ["customers", "phone-search", phoneNumber],
    enabled: phoneNumber.trim().length >= 10,
    queryFn: async () => {
      const response = await api.get("/customers", {
        params: { page: 1, limit: 5, phone: phoneNumber },
      });
      return response.data.data as Paginated<Customer>;
    },
  });

  const duplicateCustomer = useMemo(() => phoneSearchQuery.data?.data?.[0] ?? null, [phoneSearchQuery.data]);

  const activeSessionQuery = useQuery({
    queryKey: ["customers", selectedCustomerId, "active-session"],
    enabled: Boolean(selectedCustomerId),
    queryFn: async () => {
      const response = await api.get(`/customers/${selectedCustomerId}/active-session`);
      return response.data.data as Session | null;
    },
  });

  const customerDetailsQuery = useQuery({
    queryKey: ["customers", selectedCustomerId, "details"],
    enabled: Boolean(selectedCustomerId),
    queryFn: async () => {
      const response = await api.get(`/customers/${selectedCustomerId}`);
      return response.data.data as Customer;
    },
  });

  const historyQuery = useQuery({
    queryKey: ["customers", selectedCustomerId, "history"],
    enabled: Boolean(selectedCustomerId),
    queryFn: async () => {
      const response = await api.get(`/customers/${selectedCustomerId}/history`);
      return response.data.data as CustomerHistory;
    },
  });

  const barOrdersQuery = useQuery({
    queryKey: ["customers", selectedCustomerId, "bar-orders"],
    enabled: Boolean(selectedCustomerId),
    queryFn: async () => {
      const response = await api.get("/bar-orders", {
        params: { page: 1, limit: 30, customerId: selectedCustomerId },
      });
      return response.data.data as Paginated<BarOrder>;
    },
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      await api.post("/customers", {
        fullName,
        phoneNumber,
        customerType,
        email: email || undefined,
        address: address || undefined,
        notes: notes || undefined,
        college: customerType === "student" ? college : undefined,
        studyLevel: customerType === "student" ? studyLevel : undefined,
        specialization: customerType === "student" ? specialization : undefined,
        employerName: customerType === "employee" ? employerName : undefined,
        jobTitle: customerType === "employee" ? jobTitle : undefined,
      });
    },
    onSuccess: () => {
      resetCreateForm();
      setShowCreateForm(false);
      setMessage({ text: "تم تسجيل العميل بنجاح.", ok: true });
      queryClient.invalidateQueries({ queryKey: ["customers"] });
    },
    onError: (err: unknown) => {
      const m = (err as { response?: { data?: { message?: string | string[] } } })?.response?.data?.message;
      setMessage({ text: translateApiError(m), ok: false });
    },
  });

  const statusMutation = useMutation({
    mutationFn: async ({ customerId, action }: { customerId: string; action: "deactivate" | "reactivate" | "blacklist" }) => {
      if (action === "blacklist") {
        await api.post(`/customers/${customerId}/blacklist`, { reason: "مخالفة قواعد المكان" });
        return;
      }
      await api.post(`/customers/${customerId}/${action}`);
    },
    onSuccess: () => {
      setMessage({ text: "تم تحديث حالة العميل.", ok: true });
      queryClient.invalidateQueries({ queryKey: ["customers"] });
      queryClient.invalidateQueries({ queryKey: ["customers", selectedCustomerId, "history"] });
      queryClient.invalidateQueries({ queryKey: ["customers", selectedCustomerId, "active-session"] });
    },
    onError: (err: unknown) => {
      const m = (err as { response?: { data?: { message?: string | string[] } } })?.response?.data?.message;
      setMessage({ text: translateApiError(m), ok: false });
    },
  });

  const customers = useMemo(() => customersQuery.data?.data ?? [], [customersQuery.data]);
  const customerTypeTabs = useMemo(
    () => [
      { key: "all", label: "الكل", count: customers.length },
      { key: "student", label: "طلاب", count: customers.filter((c) => c.customerType === "student").length },
      { key: "employee", label: "موظفين", count: customers.filter((c) => c.customerType === "employee").length },
      { key: "trainer", label: "مدربين", count: customers.filter((c) => c.customerType === "trainer").length },
      { key: "parent", label: "أولياء أمور", count: customers.filter((c) => c.customerType === "parent").length },
      { key: "visitor", label: "زوار", count: customers.filter((c) => c.customerType === "visitor").length },
    ],
    [customers],
  );

  const visibleCustomers = useMemo(() => {
    if (activeTypeTab === "all") return customers;
    return customers.filter((c) => c.customerType === activeTypeTab);
  }, [customers, activeTypeTab]);

  const selectedCustomer = customerDetailsQuery.data ?? null;
  const totalCount = customers.length;
  const activeCount = customers.filter((c) => c.status === "active").length;
  const blockedCount = customers.filter((c) => c.status === "blacklisted").length;

  const rows = useMemo(
    () =>
      visibleCustomers.map((c) => [
        <span key={`name-${c.id}`} className="font-semibold text-slate-900">{c.fullName}</span>,
        <span key={`phone-${c.id}`} className="font-mono text-xs">{c.phoneNumber}</span>,
        <span key={`type-${c.id}`} className={clsx("inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold", ctypeColors[c.customerType] ?? ctypeColors.visitor)}>
          {translateCustomerType(c.customerType)}
        </span>,
        <Badge key={`status-${c.id}`} tone={statusBadgeTone(c.status)}>{translateStatus(c.status)}</Badge>,
        <span key={`visit-${c.id}`} className="text-xs text-slate-500">{dateTime(c.lastVisitAt ?? null)}</span>,
        <Btn
          key={`open-${c.id}`}
          size="sm"
          variant="secondary"
          onClick={() => {
            setSelectedCustomerId(c.id);
            setTimeout(() => document.getElementById("customer-details-panel")?.scrollIntoView({ behavior: "smooth", block: "start" }), 120);
          }}
        >
          فتح الملف
        </Btn>,
      ]),
    [visibleCustomers],
  );

  const topProducts = useMemo(() => {
    const orders = barOrdersQuery.data?.data ?? [];
    const counter = new Map<string, { name: string; qty: number }>();
    for (const order of orders) {
      for (const item of order.items ?? []) {
        const key = item.productId;
        const current = counter.get(key);
        if (current) current.qty += item.quantity;
        else counter.set(key, { name: item.product?.name ?? "منتج", qty: item.quantity });
      }
    }
    return [...counter.values()].sort((a, b) => b.qty - a.qty).slice(0, 5);
  }, [barOrdersQuery.data]);

  function resetCreateForm() {
    setFullName("");
    setPhoneNumber("");
    setCustomerType("visitor");
    setEmail("");
    setAddress("");
    setNotes("");
    setCollege("");
    setStudyLevel("");
    setSpecialization("");
    setEmployerName("");
    setJobTitle("");
  }

  function onCreateSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage(null);
    if (duplicateCustomer) {
      const useExisting = confirm(`الرقم ده متسجل بالفعل باسم: ${duplicateCustomer.fullName}\nتحب نفتح ملفه بدل تسجيل عميل جديد؟`);
      if (useExisting) {
        setSelectedCustomerId(duplicateCustomer.id);
        setShowCreateForm(false);
        resetCreateForm();
      }
      return;
    }
    createMutation.mutate();
  }

  return (
    <div className="space-y-6">
      <SectionTitle
        title="شاشة العملاء"
        subtitle="تسجيل سريع، بحث مباشر، وتقسيم العملاء حسب الفئات في تابات واضحة."
        icon={<Users size={20} />}
        action={<button onClick={() => customersQuery.refetch()} className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 transition hover:bg-slate-50"><RefreshCw size={12} /> تحديث</button>}
      />

      {message && <Alert tone={message.ok ? "success" : "danger"}>{message.text}</Alert>}

      <div className="grid gap-3 sm:grid-cols-3">
        <StatCard label="إجمالي العملاء" value={totalCount} icon={<Users size={18} />} />
        <StatCard label="نشطين دلوقتي" value={activeCount} tone="success" icon={<UserCheck size={18} />} />
        <StatCard label="قائمة سوداء" value={blockedCount} tone="danger" icon={<ShieldBan size={18} />} />
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.3fr_1fr]">
        <Panel title="بحث العملاء" icon={<Search size={15} />}>
          <div className="grid gap-3 md:grid-cols-2">
            <FormField label="بالاسم"><Input value={searchName} onChange={(e) => setSearchName(e.target.value)} placeholder="اكتب اسم العميل..." /></FormField>
            <FormField label="بالموبايل"><Input value={searchPhone} onChange={(e) => setSearchPhone(e.target.value)} placeholder="01xxxxxxxxx" dir="ltr" /></FormField>
          </div>
        </Panel>

        <Panel title="تسجيل عميل جديد" icon={<UserPlus size={15} />}>
          {!showCreateForm ? (
            <Btn className="w-full" icon={<UserPlus size={14} />} onClick={() => setShowCreateForm(true)}>فتح فورم التسجيل</Btn>
          ) : (
            <form className="space-y-4" onSubmit={onCreateSubmit}>
              {duplicateCustomer && (
                <div className="flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-700">
                  <AlertTriangle size={14} className="mt-0.5 shrink-0" />
                  <div>
                    <p className="font-semibold">الرقم ده متسجل قبل كده</p>
                    <p>العميل الحالي: {duplicateCustomer.fullName}</p>
                  </div>
                </div>
              )}

              <div className="grid gap-4 md:grid-cols-2">
                <FormField label="الاسم الكامل">
                  <Input value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="مثال: محمد أحمد" required />
                </FormField>
                <FormField label="رقم الموبايل">
                  <div className="relative">
                    <Phone size={13} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <Input value={phoneNumber} onChange={(e) => setPhoneNumber(e.target.value)} placeholder="01xxxxxxxxx" dir="ltr" className="pr-9" required />
                  </div>
                </FormField>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <FormField label="البريد الإلكتروني (اختياري)">
                  <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="email@example.com" dir="ltr" />
                </FormField>
                <FormField label="نوع العميل">
                  <Select value={customerType} onChange={(e) => setCustomerType(e.target.value)}>
                    <option value="student">طالب</option>
                    <option value="employee">موظف</option>
                    <option value="trainer">مدرب</option>
                    <option value="parent">ولي أمر</option>
                    <option value="visitor">زائر</option>
                  </Select>
                </FormField>
              </div>

              {customerType === "student" && (
                <div className="grid gap-3 rounded-xl border border-blue-100 bg-blue-50/50 p-4">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-blue-600">بيانات الطالب</p>
                  <div className="grid gap-3 md:grid-cols-3">
                    <FormField label="الجامعة / الكلية">
                      <Input value={college} onChange={(e) => setCollege(e.target.value)} placeholder="مثال: جامعة القاهرة" />
                    </FormField>
                    <FormField label="المستوى الدراسي">
                      <Input value={studyLevel} onChange={(e) => setStudyLevel(e.target.value)} placeholder="مثال: رابعة هندسة" />
                    </FormField>
                    <FormField label="التخصص">
                      <Input value={specialization} onChange={(e) => setSpecialization(e.target.value)} placeholder="مثال: عمارة" />
                    </FormField>
                  </div>
                </div>
              )}

              {customerType === "employee" && (
                <div className="grid gap-3 rounded-xl border border-violet-100 bg-violet-50/50 p-4">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-violet-600">بيانات الموظف</p>
                  <div className="grid gap-3 md:grid-cols-2">
                    <FormField label="جهة العمل">
                      <Input value={employerName} onChange={(e) => setEmployerName(e.target.value)} placeholder="اسم الشركة أو المؤسسة" />
                    </FormField>
                    <FormField label="المسمى الوظيفي">
                      <Input value={jobTitle} onChange={(e) => setJobTitle(e.target.value)} placeholder="مثال: محاسب، مهندس" />
                    </FormField>
                  </div>
                </div>
              )}

              <FormField label="العنوان (اختياري)">
                <Input value={address} onChange={(e) => setAddress(e.target.value)} placeholder="عنوان السكن الحالي" />
              </FormField>

              <FormField label="ملاحظات">
                <textarea
                  className="w-full rounded-xl border border-slate-200 bg-white p-3 text-sm outline-none transition focus:border-slate-400"
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="أي ملاحظات إضافية عن العميل..."
                />
              </FormField>

              <div className="flex gap-2 pt-2">
                <Btn type="submit" className="flex-1" loading={createMutation.isPending} loadingText="بيتم التسجيل..." icon={<UserPlus size={14} />}>
                  تسجيل الحساب
                </Btn>
                <Btn variant="ghost" onClick={() => { setShowCreateForm(false); resetCreateForm(); }}>
                  إلغاء
                </Btn>
              </div>
            </form>
          )}
        </Panel>
      </div>

      <Panel title="قائمة العملاء" icon={<Users size={15} />}>
        {customersQuery.isLoading ? (
          <div className="flex justify-center py-10"><RefreshCw size={20} className="animate-spin text-slate-400" /></div>
        ) : customers.length === 0 ? (
          <EmptyState icon={<Users size={36} />} title="مفيش عملاء بالفلاتر الحالية" sub="جرّب تغيّر شروط البحث أو سجّل عميل جديد." />
        ) : (
          <>
            <div className="mb-3 flex flex-wrap gap-2">
              {customerTypeTabs.map((tab) => (
                <button key={tab.key} type="button" onClick={() => setActiveTypeTab(tab.key)} className={clsx("inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold transition", activeTypeTab === tab.key ? "border-slate-900 bg-slate-900 text-white" : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50")}>
                  <span>{tab.label}</span>
                  <span className={clsx("rounded-full px-1.5 py-0.5 text-[10px]", activeTypeTab === tab.key ? "bg-white/20" : "bg-slate-100 text-slate-600")}>{tab.count}</span>
                </button>
              ))}
            </div>
            {visibleCustomers.length === 0 ? (
              <EmptyState title="مفيش عملاء في الفئة دي" sub="غيّر التاب أو عدّل البحث." />
            ) : (
              <DataTable headers={["الاسم", "الموبايل", "النوع", "الحالة", "آخر زيارة", "الإجراء"]} rows={rows} />
            )}
          </>
        )}
      </Panel>

      {selectedCustomerId && (
        <Panel className="scroll-mt-6" title={`ملف العميل: ${selectedCustomer?.fullName ?? "..."}`} icon={<UserCheck size={15} />} action={<Btn size="sm" variant="ghost" onClick={() => setSelectedCustomerId(null)}>إغلاق</Btn>}>
          <div id="customer-details-panel" />
          {customerDetailsQuery.isLoading ? (
            <div className="flex justify-center py-10"><RefreshCw size={20} className="animate-spin text-slate-400" /></div>
          ) : !selectedCustomer ? (
            <Alert tone="danger">مش قادرين نجيب بيانات العميل.</Alert>
          ) : (
            <>
              <div className="mb-4 flex flex-wrap gap-2">
                <Btn variant="warn" size="sm" icon={<UserX size={14} />} loading={statusMutation.isPending} onClick={() => statusMutation.mutate({ customerId: selectedCustomer.id, action: "deactivate" })}>إيقاف</Btn>
                <Btn variant="success" size="sm" icon={<UserCheck size={14} />} loading={statusMutation.isPending} onClick={() => statusMutation.mutate({ customerId: selectedCustomer.id, action: "reactivate" })}>تفعيل</Btn>
                <Btn variant="danger" size="sm" icon={<ShieldBan size={14} />} loading={statusMutation.isPending} onClick={() => statusMutation.mutate({ customerId: selectedCustomer.id, action: "blacklist" })}>قائمة سوداء</Btn>
              </div>

              <div className="grid gap-4 lg:grid-cols-3">
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                  <div className="mb-2 flex items-center gap-2 text-slate-600"><Clock3 size={14} /><p className="text-sm font-semibold">الجلسة الحالية</p></div>
                  {activeSessionQuery.isLoading ? <p className="text-sm text-slate-500">جاري التحميل...</p> : activeSessionQuery.data ? (
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center justify-between"><Badge tone={statusBadgeTone(activeSessionQuery.data.status)}>{translateStatus(activeSessionQuery.data.status)}</Badge><span className="text-slate-500">الحالة</span></div>
                      <div className="flex items-center justify-between"><span>{translateSessionType(activeSessionQuery.data.sessionType)}</span><span className="text-slate-500">النوع</span></div>
                      <div className="flex items-center justify-between"><span className="text-xs">{dateTime(activeSessionQuery.data.startTime)}</span><span className="text-slate-500">من</span></div>
                      {activeSessionQuery.data.room?.name && <div className="flex items-center justify-between"><span>{activeSessionQuery.data.room.name}</span><span className="text-slate-500">الغرفة</span></div>}
                    </div>
                  ) : <EmptyState title="مفيش جلسة نشطة" sub="العميل مش داخل حالياً." />}
                </div>

                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 lg:col-span-2">
                  <div className="mb-2 flex items-center gap-2 text-slate-600"><History size={14} /><p className="text-sm font-semibold">ملخص التاريخ</p></div>
                  {historyQuery.isLoading ? <p className="text-sm text-slate-500">جاري التحميل...</p> : historyQuery.data ? (
                    <div className="grid gap-3 sm:grid-cols-4">
                      <StatCard label="جلسات" value={historyQuery.data.sessionsCount} />
                      <StatCard label="حجوزات" value={historyQuery.data.bookingsCount} tone="info" />
                      <StatCard label="فواتير" value={historyQuery.data.invoicesCount} tone="warn" />
                      <StatCard label="إجمالي صرف" value={money(historyQuery.data.totalSpent)} tone="success" icon={<Wallet size={15} />} />
                    </div>
                  ) : <EmptyState title="مفيش بيانات تاريخية" />}
                </div>
              </div>

              <div className="mt-4 grid gap-4 lg:grid-cols-2">
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                  <div className="mb-3 flex items-center gap-2 text-slate-600"><Coffee size={14} /><p className="text-sm font-semibold">طلبات البار الأخيرة</p></div>
                  {barOrdersQuery.isLoading ? <p className="text-sm text-slate-500">جاري تحميل طلبات البار...</p> : (barOrdersQuery.data?.data?.length ?? 0) === 0 ? <EmptyState title="مفيش طلبات بار للعميل ده" /> : (
                    <div className="space-y-2">
                      {(barOrdersQuery.data?.data ?? []).slice(0, 6).map((order) => (
                        <div key={order.id} className="rounded-lg border border-slate-200 bg-white p-3 text-xs">
                          <div className="mb-1 flex items-center justify-between"><Badge tone={statusBadgeTone(order.status)}>{translateStatus(order.status)}</Badge><span className="font-mono text-slate-500">#{order.id.slice(0, 8)}</span></div>
                          <div className="flex items-center justify-between text-slate-700"><span>{money(order.totalAmount ?? 0)}</span><span>{dateTime(order.createdAt)}</span></div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                  <div className="mb-3 flex items-center gap-2 text-slate-600"><Coffee size={14} /><p className="text-sm font-semibold">اقتراحات (الأكثر طلبًا)</p></div>
                  {topProducts.length === 0 ? <EmptyState title="لسه مفيش بيانات كفاية للتوصية" sub="أول ما العميل يعمل طلبات، هتظهر هنا المنتجات المناسبة." /> : (
                    <div className="space-y-2">
                      {topProducts.map((p, idx) => (
                        <div key={`${p.name}-${idx}`} className="flex items-center justify-between rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm"><span className="font-semibold text-slate-800">{p.name}</span><span className="text-xs text-slate-500">اتطلب {p.qty} مرة</span></div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
        </Panel>
      )}
    </div>
  );
}
