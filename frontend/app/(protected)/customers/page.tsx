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
  customer: Customer & { barOrders?: any[] };
  sessionsCount: number;
  invoicesCount: number;
  bookingsCount: number;
  ordersCount: number;
  barOrdersCount?: number;
  totalPaid: number;
  totalSpent?: number;
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
  const [phoneNumberSecondary, setPhoneNumberSecondary] = useState("");
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
  const [editPhoneNumberSecondary, setEditPhoneNumberSecondary] = useState("");
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
        phoneNumberSecondary: phoneNumberSecondary || undefined,
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
        phoneNumberSecondary: editPhoneNumberSecondary || undefined,
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
    setPhoneNumberSecondary("");
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
                <FormField label="الموبايل (الأساسي)"><Input value={phoneNumber} onChange={(e) => setPhoneNumber(e.target.value)} dir="ltr" required /></FormField>
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
                <FormField label="الموبايل (بديل)"><Input value={phoneNumberSecondary} onChange={(e) => setPhoneNumberSecondary(e.target.value)} dir="ltr" placeholder="اختياري" /></FormField>
              </div>
              
              {/* الحقول الخاصة بناءً على النوع */}
              {customerType === "student" && (
                <div className="grid gap-4 md:grid-cols-3 bg-blue-50 p-3 rounded-xl border border-blue-100">
                  <FormField label="الكلية / الجامعة"><Input value={college} onChange={(e) => setCollege(e.target.value)} placeholder="مثال: هندسة" /></FormField>
                  <FormField label="السنة الدراسية"><Input value={studyLevel} onChange={(e) => setStudyLevel(e.target.value)} placeholder="مثال: الفرقة الثالثة" /></FormField>
                  <FormField label="التخصص"><Input value={specialization} onChange={(e) => setSpecialization(e.target.value)} placeholder="مثال: ميكاترونكس" /></FormField>
                </div>
              )}
              {customerType === "employee" && (
                <div className="grid gap-4 md:grid-cols-2 bg-violet-50 p-3 rounded-xl border border-violet-100">
                  <FormField label="جهة العمل / الشركة"><Input value={employerName} onChange={(e) => setEmployerName(e.target.value)} placeholder="اسم الشركة" /></FormField>
                  <FormField label="المسمى الوظيفي"><Input value={jobTitle} onChange={(e) => setJobTitle(e.target.value)} placeholder="مثال: مهندس برمجيات" /></FormField>
                </div>
              )}

              <div className="grid gap-4 md:grid-cols-2">
                <FormField label="الايميل"><Input value={email} onChange={(e) => setEmail(e.target.value)} dir="ltr" placeholder="اختياري" /></FormField>
                <FormField label="العنوان"><Input value={address} onChange={(e) => setAddress(e.target.value)} placeholder="اختياري" /></FormField>
              </div>
              <FormField label="ملاحظات">
                <textarea className="w-full rounded-xl border border-slate-200 p-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900" rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="أضف أي ملاحظات تهمك عن العميل..." />
              </FormField>

              <div className="flex gap-2 pt-2 border-t border-slate-100">
                <Btn type="submit" className="flex-1" loading={createMutation.isPending}>حفظ بيانات العميل</Btn>
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
        <Panel 
          className="scroll-mt-6 border-2 border-slate-900 shadow-xl overflow-hidden" 
          title={`ملف العميل: ${selectedCustomer?.fullName ?? "..."}`} 
          icon={<UserCheck size={18} className="text-emerald-500" />} 
          action={<Btn size="sm" variant="ghost" className="hover:bg-rose-50 hover:text-rose-600" onClick={() => setSelectedCustomerId(null)}><X size={16} /></Btn>}
        >
          {customerDetailsQuery.isLoading ? (
            <div className="flex flex-col items-center justify-center py-12">
               <RefreshCw size={32} className="animate-spin text-slate-300 mb-4" />
               <p className="text-sm text-slate-400 font-bold">جاري تحميل الملف الكامل...</p>
            </div>
          ) : selectedCustomer ? (
            <div className="space-y-8">
              {/* Header Info Bar */}
              <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 pb-6">
                <div className="flex items-center gap-4">
                   <div className={clsx("flex h-16 w-16 items-center justify-center rounded-[1.5rem] border-2 shadow-inner text-2xl font-black", ctypeColors[selectedCustomer.customerType] ?? ctypeColors.visitor)}>
                      {selectedCustomer.fullName.charAt(0)}
                   </div>
                   <div>
                      <h2 className="text-2xl font-black text-slate-900">{selectedCustomer.fullName}</h2>
                      <div className="flex items-center gap-2 mt-1">
                        <span className={clsx("rounded-full px-3 py-0.5 text-[10px] font-black uppercase tracking-wider border", ctypeColors[selectedCustomer.customerType] ?? ctypeColors.visitor)}>
                          {translateCustomerType(selectedCustomer.customerType)}
                        </span>
                        <Badge tone={statusBadgeTone(selectedCustomer.status)}>{translateStatus(selectedCustomer.status)}</Badge>
                      </div>
                   </div>
                </div>
                <div className="flex gap-2">
                  <Btn size="sm" variant="secondary" icon={<Edit2 size={14} />} onClick={() => {
                    setEditFullName(selectedCustomer.fullName);
                    setEditPhoneNumber(selectedCustomer.phoneNumber);
                    setEditPhoneNumberSecondary(selectedCustomer.phoneNumberSecondary || "");
                    setEditEmail(selectedCustomer.email || "");
                    setEditAddress(selectedCustomer.address || "");
                    setEditNotes(selectedCustomer.notes || "");
                    setEditCollege(selectedCustomer.college || "");
                    setEditStudyLevel(selectedCustomer.studyLevel || "");
                    setEditSpecialization(selectedCustomer.specialization || "");
                    setEditEmployerName(selectedCustomer.employerName || "");
                    setEditJobTitle(selectedCustomer.jobTitle || "");
                    setShowEditModal(true);
                  }}>تعديل البيانات</Btn>
                  <Btn size="sm" variant="danger" icon={<ShieldBan size={14} />} onClick={() => {
                    if (confirm("هل أنت متأكد من حظر هذا العميل؟")) {
                      statusMutation.mutate({ customerId: selectedCustomer.id, action: "blacklist" });
                    }
                  }}>حظر العميل</Btn>
                </div>
              </div>

              <div className="grid gap-6 lg:grid-cols-3">
                {/* 1. Personal & Contact Details */}
                <div className="space-y-6">
                  <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
                    <h4 className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-slate-400 mb-4">
                       <Phone size={14} /> بيانات التواصل
                    </h4>
                    <div className="space-y-4">
                       <div>
                          <p className="text-[10px] font-bold text-slate-400">الموبايل الأساسي</p>
                          <p className="text-sm font-black text-slate-900 font-mono" dir="ltr">{selectedCustomer.phoneNumber}</p>
                       </div>
                       {selectedCustomer.phoneNumberSecondary && (
                         <div>
                            <p className="text-[10px] font-bold text-slate-400">الموبايل البديل</p>
                            <p className="text-sm font-black text-slate-900 font-mono" dir="ltr">{selectedCustomer.phoneNumberSecondary}</p>
                         </div>
                       )}
                       {selectedCustomer.email && (
                         <div>
                            <p className="text-[10px] font-bold text-slate-400">البريد الإلكتروني</p>
                            <p className="text-sm font-black text-slate-900 font-mono" dir="ltr">{selectedCustomer.email}</p>
                         </div>
                       )}
                       {selectedCustomer.address && (
                         <div>
                            <p className="text-[10px] font-bold text-slate-400">العنوان</p>
                            <p className="text-sm font-bold text-slate-800">{selectedCustomer.address}</p>
                         </div>
                       )}
                    </div>
                  </div>

                  {/* 2. Education / Work Details */}
                  {(selectedCustomer.customerType === "student" || selectedCustomer.customerType === "employee") && (
                    <div className={clsx("rounded-2xl border p-5 shadow-sm", selectedCustomer.customerType === "student" ? "bg-blue-50/50 border-blue-100" : "bg-violet-50/50 border-violet-100")}>
                      <h4 className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-slate-400 mb-4">
                         <History size={14} /> {selectedCustomer.customerType === "student" ? "البيانات الدراسية" : "بيانات العمل"}
                      </h4>
                      <div className="space-y-4">
                         {selectedCustomer.customerType === "student" ? (
                           <>
                              <div>
                                <p className="text-[10px] font-bold text-slate-400">الكلية / الجامعة</p>
                                <p className="text-sm font-black text-blue-900">{selectedCustomer.college || "غير محدد"}</p>
                              </div>
                              <div className="grid grid-cols-2 gap-2">
                                <div>
                                  <p className="text-[10px] font-bold text-slate-400">السنة</p>
                                  <p className="text-xs font-bold text-blue-800">{selectedCustomer.studyLevel || "غير محدد"}</p>
                                </div>
                                <div>
                                  <p className="text-[10px] font-bold text-slate-400">التخصص</p>
                                  <p className="text-xs font-bold text-blue-800">{selectedCustomer.specialization || "غير محدد"}</p>
                                </div>
                              </div>
                           </>
                         ) : (
                           <>
                              <div>
                                <p className="text-[10px] font-bold text-slate-400">جهة العمل</p>
                                <p className="text-sm font-black text-violet-900">{selectedCustomer.employerName || "غير محدد"}</p>
                              </div>
                              <div>
                                <p className="text-[10px] font-bold text-slate-400">المسمى الوظيفي</p>
                                <p className="text-sm font-bold text-violet-800">{selectedCustomer.jobTitle || "غير محدد"}</p>
                              </div>
                           </>
                         )}
                      </div>
                    </div>
                  )}

                  <div className="rounded-2xl border border-amber-100 bg-amber-50/50 p-5 shadow-sm">
                    <h4 className="text-xs font-black uppercase tracking-widest text-amber-600 mb-2">ملاحظات العميل</h4>
                    <p className="text-sm font-medium text-amber-900 italic leading-relaxed">
                      {selectedCustomer.notes || "لا توجد ملاحظات مسجلة لهذا العميل."}
                    </p>
                  </div>
                </div>

                {/* 3. Stats & History */}
                <div className="lg:col-span-2 space-y-6">
                  {/* Current Activity Status */}
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="rounded-2xl border border-emerald-100 bg-emerald-50/50 p-4 flex items-center gap-4">
                        <div className="h-10 w-10 rounded-xl bg-white flex items-center justify-center text-emerald-600 shadow-sm">
                           <Clock3 size={20} />
                        </div>
                        <div>
                           <p className="text-[10px] font-black text-slate-400 uppercase">الحالة الحالية</p>
                           {activeSessionQuery.data ? (
                             <p className="text-sm font-black text-emerald-900">في جلسة نشطة ({translateSessionType(activeSessionQuery.data.sessionType)})</p>
                           ) : <p className="text-sm font-bold text-slate-500">خارج المكان حالياً</p>}
                        </div>
                    </div>
                    <div className="rounded-2xl border border-slate-100 bg-white p-4 flex items-center gap-4">
                        <div className="h-10 w-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400">
                           <Calendar size={20} />
                        </div>
                        <div className="grid grid-cols-2 gap-4 w-full">
                           <div>
                              <p className="text-[10px] font-black text-slate-400 uppercase">أول زيارة</p>
                              <p className="text-xs font-bold text-slate-700">{selectedCustomer.firstVisitAt ? dateTime(selectedCustomer.firstVisitAt).split(' ')[0] : "جديد"}</p>
                           </div>
                           <div>
                              <p className="text-[10px] font-black text-slate-400 uppercase">آخر زيارة</p>
                              <p className="text-xs font-bold text-slate-700">{dateTime(selectedCustomer.lastVisitAt)}</p>
                           </div>
                        </div>
                    </div>
                  </div>

                  {/* Summary Cards */}
                  <div className="rounded-[2rem] bg-slate-900 p-8 text-white shadow-2xl relative overflow-hidden">
                    <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white/5 blur-3xl" />
                    <p className="mb-6 text-xs font-black uppercase tracking-[0.3em] text-slate-500">إحصائيات العميل التاريخية</p>
                    {historyQuery.data ? (
                      <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
                        <div className="space-y-1">
                          <p className="text-[10px] font-bold text-slate-500 uppercase">الجلسات</p>
                          <p className="text-3xl font-black">{historyQuery.data.sessionsCount}</p>
                        </div>
                        <div className="space-y-1">
                          <p className="text-[10px] font-bold text-slate-500 uppercase">الحجوزات</p>
                          <p className="text-3xl font-black">{historyQuery.data.bookingsCount}</p>
                        </div>
                        <div className="space-y-1">
                          <p className="text-[10px] font-bold text-slate-500 uppercase">البار</p>
                          <p className="text-3xl font-black">{historyQuery.data.barOrdersCount || historyQuery.data.ordersCount}</p>
                        </div>
                        <div className="space-y-1 text-emerald-400">
                          <p className="text-[10px] font-bold text-emerald-500/50 uppercase">إجمالي الإنفاق</p>
                          <p className="text-3xl font-black">{money(historyQuery.data.totalSpent || historyQuery.data.totalPaid)}</p>
                        </div>
                      </div>
                    ) : <p className="animate-pulse text-sm text-slate-600 font-bold">جاري حساب الإحصائيات...</p>}
                  </div>

                  {/* Orders History Tab-like section */}
                  {historyQuery.data?.customer?.barOrders && historyQuery.data.customer.barOrders.length > 0 && (
                    <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
                      <div className="flex items-center justify-between mb-6">
                        <h4 className="flex items-center gap-2 font-black text-slate-900">
                          <Coffee size={18} className="text-amber-500" /> آخر طلبات البار
                        </h4>
                        <span className="text-[10px] font-black text-slate-400 bg-slate-50 px-2 py-1 rounded-lg">تاريخ المشتريات</span>
                      </div>
                      <div className="space-y-4 max-h-[350px] overflow-y-auto pr-2 custom-scrollbar">
                        {historyQuery.data.customer.barOrders.map((order: any) => (
                          <div key={order.id} className="group relative rounded-2xl border border-slate-50 bg-slate-50/30 p-4 transition-all hover:bg-white hover:shadow-md">
                            <div className="flex justify-between items-center mb-3">
                              <div className="flex items-center gap-3">
                                <div className="h-8 w-8 rounded-full bg-white border border-slate-100 flex items-center justify-center text-[10px] font-black text-slate-400">
                                   #{order.id.slice(-4)}
                                </div>
                                <span className="text-xs font-black text-slate-800">{dateTime(order.createdAt)}</span>
                              </div>
                              <span className="text-base font-black text-slate-900">{money(order.totalAmount)}</span>
                            </div>
                            <div className="grid gap-2 sm:grid-cols-2">
                              {order.items?.map((item: any) => (
                                <div key={item.id} className="flex items-center justify-between rounded-lg bg-white/50 px-3 py-1.5 text-xs text-slate-600 border border-slate-100/50">
                                  <span><span className="font-black text-slate-900">{item.quantity}</span> × {item.product?.name || "منتج"}</span>
                                  <span className="font-mono font-bold text-[10px]">{money(item.subtotal)}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : <Alert tone="danger">فشل تحميل ملف العميل. حاول مرة أخرى.</Alert>}
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
                <FormField label="الموبايل (الأساسي)"><Input value={editPhoneNumber} onChange={e => setEditPhoneNumber(e.target.value)} dir="ltr" required /></FormField>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <FormField label="الموبايل (بديل)"><Input value={editPhoneNumberSecondary} onChange={e => setEditPhoneNumberSecondary(e.target.value)} dir="ltr" /></FormField>
                <FormField label="الايميل"><Input value={editEmail} onChange={e => setEditEmail(e.target.value)} dir="ltr" /></FormField>
              </div>
              
              {selectedCustomer.customerType === "student" && (
                <div className="grid gap-4 md:grid-cols-3 bg-blue-50 p-3 rounded-xl border border-blue-100">
                  <FormField label="الكلية / الجامعة"><Input value={editCollege} onChange={e => setEditCollege(e.target.value)} /></FormField>
                  <FormField label="السنة الدراسية"><Input value={editStudyLevel} onChange={e => setEditStudyLevel(e.target.value)} /></FormField>
                  <FormField label="التخصص"><Input value={editSpecialization} onChange={e => setEditSpecialization(e.target.value)} /></FormField>
                </div>
              )}
              {selectedCustomer.customerType === "employee" && (
                <div className="grid gap-4 md:grid-cols-2 bg-violet-50 p-3 rounded-xl border border-violet-100">
                  <FormField label="جهة العمل / الشركة"><Input value={editEmployerName} onChange={e => setEditEmployerName(e.target.value)} /></FormField>
                  <FormField label="المسمى الوظيفي"><Input value={editJobTitle} onChange={e => setEditJobTitle(e.target.value)} /></FormField>
                </div>
              )}

              <FormField label="العنوان"><Input value={editAddress} onChange={e => setEditAddress(e.target.value)} /></FormField>
              
              <FormField label="ملاحظات">
                <textarea className="w-full rounded-xl border border-slate-200 p-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900" rows={3} value={editNotes} onChange={e => setEditNotes(e.target.value)} />
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
