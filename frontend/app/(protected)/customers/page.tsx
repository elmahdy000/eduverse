"use client";

import { FormEvent, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  AlertTriangle,
  Coffee,
  Clock3,
  Edit2,
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
  X,
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
  ordersCount: number;
  totalPaid: number;
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

  // Create form state
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

  // Search/View state
  const [searchName, setSearchName] = useState("");
  const [searchPhone, setSearchPhone] = useState("");
  const [activeTypeTab, setActiveTypeTab] = useState<string>("all");
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [message, setMessage] = useState<{ text: string; ok: boolean } | null>(null);

  // Edit modal state
  const [showEditModal, setShowEditModal] = useState(false);
  const [editFullName, setEditFullName] = useState("");
  const [editPhoneNumber, setEditPhoneNumber] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editAddress, setEditAddress] = useState("");
  const [editNotes, setEditNotes] = useState("");
  const [editCollege, setEditCollege] = useState("");
  const [editStudyLevel, setEditStudyLevel] = useState("");
  const [editSpecialization, setEditSpecialization] = useState("");
  const [editEmployerName, setEditEmployerName] = useState("");
  const [editJobTitle, setEditJobTitle] = useState("");

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

  const updateMutation = useMutation({
    mutationFn: async () => {
      if (!selectedCustomerId) return;
      await api.put(`/customers/${selectedCustomerId}`, {
        fullName: editFullName,
        phoneNumber: editPhoneNumber,
        email: editEmail || undefined,
        address: editAddress || undefined,
        notes: editNotes || undefined,
        college: editCollege || undefined,
        studyLevel: editStudyLevel || undefined,
        specialization: editSpecialization || undefined,
        employerName: editEmployerName || undefined,
        jobTitle: editJobTitle || undefined,
      });
    },
    onSuccess: () => {
      setShowEditModal(false);
      setMessage({ text: "تم تحديث بيانات العميل بنجاح.", ok: true });
      queryClient.invalidateQueries({ queryKey: ["customers"] });
      queryClient.invalidateQueries({ queryKey: ["customers", selectedCustomerId, "details"] });
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
      queryClient.invalidateQueries({ queryKey: ["customers", selectedCustomerId, "details"] });
    },
    onError: (err: unknown) => {
      const m = (err as { response?: { data?: { message?: string | string[] } } })?.response?.data?.message;
      setMessage({ text: translateApiError(m), ok: false });
    },
  });

  const customers = useMemo(() => customersQuery.data?.data ?? [], [customersQuery.data]);
  const visibleCustomers = useMemo(() => {
    if (activeTypeTab === "all") return customers;
    return customers.filter((c) => c.customerType === activeTypeTab);
  }, [customers, activeTypeTab]);

  const customerTypeTabs = useMemo(() => [
    { key: "all", label: "الكل", count: customers.length },
    { key: "student", label: "طلاب", count: customers.filter(c => c.customerType === "student").length },
    { key: "employee", label: "موظفين", count: customers.filter(c => c.customerType === "employee").length },
    { key: "trainer", label: "مدربين", count: customers.filter(c => c.customerType === "trainer").length },
    { key: "visitor", label: "زوار", count: customers.filter(c => c.customerType === "visitor").length },
  ], [customers]);

  const selectedCustomer = customerDetailsQuery.data ?? null;

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
    if (duplicateCustomer) {
      if (confirm(`الرقم ده متسجل باسم: ${duplicateCustomer.fullName}\nتحب نفتح ملفه؟`)) {
        setSelectedCustomerId(duplicateCustomer.id);
        setShowCreateForm(false);
        resetCreateForm();
        return;
      }
    }
    createMutation.mutate();
  }

  const rows = useMemo(() => visibleCustomers.map((c) => [
    <span key={`name-${c.id}`} className="font-semibold text-slate-900">{c.fullName}</span>,
    <span key={`phone-${c.id}`} className="font-mono text-xs">{c.phoneNumber}</span>,
    <span key={`type-${c.id}`} className={clsx("inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold", ctypeColors[c.customerType] ?? ctypeColors.visitor)}>
      {translateCustomerType(c.customerType)}
    </span>,
    <Badge key={`status-${c.id}`} tone={statusBadgeTone(c.status)}>{translateStatus(c.status)}</Badge>,
    <span key={`visit-${c.id}`} className="text-xs text-slate-500">{dateTime(c.lastVisitAt ?? null)}</span>,
    <Btn key={`action-${c.id}`} size="sm" variant="secondary" onClick={() => setSelectedCustomerId(c.id)}>فتح الملف</Btn>
  ]), [visibleCustomers]);

  return (
    <div className="space-y-6">
      <SectionTitle
        title="شاشة العملاء"
        subtitle="إدارة بيانات العملاء والتسجيل السريع."
        icon={<Users size={20} />}
      />

      {message && <Alert tone={message.ok ? "success" : "danger"}>{message.text}</Alert>}

      <div className="grid gap-4 xl:grid-cols-[1.3fr_1fr]">
        <Panel title="بحث العملاء" icon={<Search size={15} />}>
          <div className="grid gap-3 md:grid-cols-2">
            <FormField label="بالاسم"><Input value={searchName} onChange={(e) => setSearchName(e.target.value)} placeholder="اسم العميل..." /></FormField>
            <FormField label="بالموبايل"><Input value={searchPhone} onChange={(e) => setSearchPhone(e.target.value)} placeholder="01xxxxxxxxx" dir="ltr" /></FormField>
          </div>
        </Panel>

        <Panel title="تسجيل عميل جديد" icon={<UserPlus size={15} />}>
          {!showCreateForm ? (
            <Btn className="w-full" onClick={() => setShowCreateForm(true)}>تسجيل عميل جديد</Btn>
          ) : (
            <form className="space-y-4" onSubmit={onCreateSubmit}>
              <div className="grid gap-4 md:grid-cols-2">
                <FormField label="الاسم"><Input value={fullName} onChange={(e) => setFullName(e.target.value)} required /></FormField>
                <FormField label="الموبايل"><Input value={phoneNumber} onChange={(e) => setPhoneNumber(e.target.value)} dir="ltr" required /></FormField>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <FormField label="النوع">
                  <Select value={customerType} onChange={(e) => setCustomerType(e.target.value)}>
                    <option value="visitor">زائر</option>
                    <option value="student">طالب</option>
                    <option value="employee">موظف</option>
                    <option value="trainer">مدرب</option>
                  </Select>
                </FormField>
                <FormField label="الايميل"><Input value={email} onChange={(e) => setEmail(e.target.value)} dir="ltr" /></FormField>
              </div>
              <div className="flex gap-2">
                <Btn type="submit" className="flex-1" loading={createMutation.isPending}>حفظ</Btn>
                <Btn variant="ghost" onClick={() => setShowCreateForm(false)}>إلغاء</Btn>
              </div>
            </form>
          )}
        </Panel>
      </div>

      <Panel title="قائمة العملاء" icon={<Users size={15} />}>
        <div className="mb-4 flex flex-wrap gap-2">
          {customerTypeTabs.map(tab => (
            <button key={tab.key} onClick={() => setActiveTypeTab(tab.key)} className={clsx("rounded-full px-3 py-1 text-xs font-medium border transition", activeTypeTab === tab.key ? "bg-slate-900 text-white border-slate-900" : "bg-white text-slate-600 border-slate-200")}>
              {tab.label} ({tab.count})
            </button>
          ))}
        </div>
        {customersQuery.isLoading ? <p>جاري التحميل...</p> : <DataTable headers={["الاسم", "الموبايل", "النوع", "الحالة", "آخر زيارة", "الإجراء"]} rows={rows} />}
      </Panel>

      {selectedCustomerId && (
        <Panel className="scroll-mt-6" title={`ملف العميل: ${selectedCustomer?.fullName ?? "..."}`} icon={<UserCheck size={15} />} action={<Btn size="sm" variant="ghost" onClick={() => setSelectedCustomerId(null)}>إغلاق</Btn>}>
          {customerDetailsQuery.isLoading ? <p>جاري تحميل البيانات...</p> : selectedCustomer ? (
            <div className="space-y-6">
              <div className="flex flex-wrap gap-2">
                <Btn size="sm" variant="secondary" icon={<Edit2 size={14} />} onClick={() => {
                  setEditFullName(selectedCustomer.fullName);
                  setEditPhoneNumber(selectedCustomer.phoneNumber);
                  setEditEmail(selectedCustomer.email || "");
                  setEditAddress(selectedCustomer.address || "");
                  setEditNotes(selectedCustomer.notes || "");
                  setShowEditModal(true);
                }}>تعديل</Btn>
                <Btn size="sm" variant="danger" icon={<ShieldBan size={14} />} onClick={() => statusMutation.mutate({ customerId: selectedCustomer.id, action: "blacklist" })}>حظر</Btn>
              </div>

              <div className="grid gap-4 lg:grid-cols-3">
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                  <p className="mb-2 text-sm font-bold text-slate-600">الجلسة الحالية</p>
                  {activeSessionQuery.data ? (
                    <div className="space-y-1 text-xs">
                      <p>النوع: {translateSessionType(activeSessionQuery.data.sessionType)}</p>
                      <p>منذ: {dateTime(activeSessionQuery.data.startTime)}</p>
                    </div>
                  ) : <p className="text-xs text-slate-400">لا توجد جلسة نشطة</p>}
                </div>

                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 lg:col-span-2">
                  <p className="mb-2 text-sm font-bold text-slate-600">تاريخ العميل</p>
                  {historyQuery.data ? (
                    <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                      <StatCard label="جلسات" value={historyQuery.data.sessionsCount} />
                      <StatCard label="حجوزات" value={historyQuery.data.bookingsCount} />
                      <StatCard label="طلبات بار" value={historyQuery.data.ordersCount} />
                      <StatCard label="إجمالي المدفوع" value={money(historyQuery.data.totalPaid)} tone="success" />
                    </div>
                  ) : <p className="text-xs text-slate-400">جاري تحميل التاريخ...</p>}
                </div>
              </div>
            </div>
          ) : <Alert tone="danger">خطأ في تحميل العميل</Alert>}
        </Panel>
      )}

      {showEditModal && selectedCustomer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="w-full max-w-xl rounded-2xl bg-white shadow-xl" dir="rtl">
            <div className="flex items-center justify-between border-b p-4">
              <h3 className="font-bold">تعديل العميل</h3>
              <button onClick={() => setShowEditModal(false)}><X size={20} /></button>
            </div>
            <form className="p-6 space-y-4" onSubmit={(e) => { e.preventDefault(); updateMutation.mutate(); }}>
              <div className="grid gap-4 md:grid-cols-2">
                <FormField label="الاسم"><Input value={editFullName} onChange={e => setEditFullName(e.target.value)} required /></FormField>
                <FormField label="الموبايل"><Input value={editPhoneNumber} onChange={e => setEditPhoneNumber(e.target.value)} required /></FormField>
              </div>
              <FormField label="ملاحظات">
                <textarea className="w-full rounded-xl border border-slate-200 p-2 text-sm" rows={3} value={editNotes} onChange={e => setEditNotes(e.target.value)} />
              </FormField>
              <div className="flex gap-2">
                <Btn type="submit" className="flex-1" loading={updateMutation.isPending}>حفظ التغييرات</Btn>
                <Btn variant="ghost" onClick={() => setShowEditModal(false)}>إلغاء</Btn>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
