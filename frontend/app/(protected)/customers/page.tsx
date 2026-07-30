"use client";

import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  Calendar,
  Clock3,
  Coffee,
  Edit2,
  History,
  Phone,
  RefreshCw,
  Search,
  ShieldBan,
  UserCheck,
  UserPlus,
  Users,
  Wallet,
  X,
} from "lucide-react";
import clsx from "clsx";
import { api } from "../../../lib/api";
import { translateApiError } from "../../../lib/errors";
import { dateShort, dateTime, idShort, money, phoneDisplay } from "../../../lib/format";
import { translateCustomerType, translateSessionType, translateStatus } from "../../../lib/labels";
import type { BarOrder, Booking, Customer, Invoice, Paginated, Session } from "../../../lib/types";
import {
  Alert,
  Badge,
  Btn,
  DataTable,
  EmptyState,
  FormField,
  Input,
  Modal,
  Panel,
  SectionTitle,
  Select,
  statusBadgeTone,
  TableSkeleton,
} from "../../../components/ui";

interface CustomerHistory {
  customer: Customer & {
    barOrders?: BarOrder[];
    sessions?: Session[];
    invoices?: Invoice[];
    bookings?: Booking[];
  };
  sessionsCount: number;
  invoicesCount: number;
  bookingsCount: number;
  ordersCount: number;
  barOrdersCount?: number;
  totalPaid: number;
  totalSpent?: number;
}

/* Badge tones mapped to design tokens — no raw hex classes */
const ctypeTone: Record<string, "info" | "neutral" | "success" | "warn" | "danger" | "default"> = {
  student:        "info",
  employee:       "neutral",
  trainer:        "success",
  parent:         "warn",
  visitor:        "neutral",
  staff:          "success",
  owner_discount: "warn",
};

export default function CustomersPage() {
  const queryClient = useQueryClient();
  const searchParams = useSearchParams();

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
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(
    () => searchParams.get("customerId"),
  );
  const [showCreateForm, setShowCreateForm] = useState(
    () => searchParams.get("new") === "1",
  );
  const [statusDialog, setStatusDialog] = useState<{
    action: "blacklist" | "reactivate";
    customerId: string;
  } | null>(null);
  const [statusReason, setStatusReason] = useState("");
  const [message, setMessage] = useState<{ text: string; ok: boolean } | null>(null);
  const profileRef = useRef<HTMLDivElement>(null);

  // Duplicate-phone confirmation modal state
  const [dupDialog, setDupDialog] = useState<{ customer: Customer } | null>(null);

  // Scroll to profile when selected
  useEffect(() => {
    if (selectedCustomerId && profileRef.current) {
      profileRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [selectedCustomerId]);

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
  const [editCustomerType, setEditCustomerType] = useState("visitor");

  // Debounce search inputs to reduce API calls
  const [debouncedSearchName, setDebouncedSearchName] = useState(searchName);
  const [debouncedSearchPhone, setDebouncedSearchPhone] = useState(searchPhone);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchName(searchName);
      setDebouncedSearchPhone(searchPhone);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchName, searchPhone]);

  const customersQuery = useQuery({
    queryKey: ["customers", debouncedSearchName, debouncedSearchPhone],
    queryFn: async () => {
      const response = await api.get("/customers", {
        params: {
          page: 1,
          limit: 50,
          name: debouncedSearchName || undefined,
          phone: debouncedSearchPhone || undefined,
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

  const duplicateCustomer = useMemo(
    () => phoneSearchQuery.data?.data?.[0] ?? null,
    [phoneSearchQuery.data],
  );

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

  const createMutation = useMutation({
    mutationFn: async () => {
      const response = await api.post("/customers", {
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
      return response.data.data as Customer;
    },
    onSuccess: (customer) => {
      resetCreateForm();
      setShowCreateForm(false);
      setMessage({ text: "تم تسجيل العميل بنجاح.", ok: true });
      queryClient.invalidateQueries({ queryKey: ["customers"] });
      if (customer?.id) setSelectedCustomerId(customer.id);
    },
    onError: (err: unknown) => {
      const m = (err as { response?: { data?: { message?: string | string[] } } })?.response?.data
        ?.message;
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
        customerType: editCustomerType,
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
      queryClient.invalidateQueries({
        queryKey: ["customers", selectedCustomerId, "details"],
      });
    },
    onError: (err: unknown) => {
      const m = (err as { response?: { data?: { message?: string | string[] } } })?.response?.data
        ?.message;
      setMessage({ text: translateApiError(m), ok: false });
    },
  });

  const statusMutation = useMutation({
    mutationFn: async ({
      customerId,
      action,
    }: {
      customerId: string;
      action: "deactivate" | "reactivate" | "blacklist";
    }) => {
      if (action === "blacklist") {
        await api.post(`/customers/${customerId}/blacklist`, {
          reason: statusReason.trim(),
        });
        return;
      }
      await api.post(`/customers/${customerId}/${action}`);
    },
    onSuccess: () => {
      setMessage({ text: "تم تحديث حالة العميل.", ok: true });
      queryClient.invalidateQueries({ queryKey: ["customers"] });
      queryClient.invalidateQueries({
        queryKey: ["customers", selectedCustomerId, "details"],
      });
    },
    onError: (err: unknown) => {
      const m = (err as { response?: { data?: { message?: string | string[] } } })?.response?.data
        ?.message;
      setMessage({ text: translateApiError(m), ok: false });
    },
  });

  const customers = useMemo(() => customersQuery.data?.data ?? [], [customersQuery.data]);
  const visibleCustomers = useMemo(() => {
    if (activeTypeTab === "all") return customers;
    return customers.filter((c) => c.customerType === activeTypeTab);
  }, [customers, activeTypeTab]);

  const customerTypeTabs = useMemo(
    () => [
      { key: "all", label: "الكل", count: customers.length },
      {
        key: "student",
        label: "طلاب",
        count: customers.filter((c) => c.customerType === "student").length,
      },
      {
        key: "employee",
        label: "موظفين",
        count: customers.filter((c) => c.customerType === "employee").length,
      },
      {
        key: "trainer",
        label: "مدربين",
        count: customers.filter((c) => c.customerType === "trainer").length,
      },
      {
        key: "visitor",
        label: "زوار",
        count: customers.filter((c) => c.customerType === "visitor").length,
      },
      {
        key: "staff",
        label: "طاقم عمل (50%)",
        count: customers.filter((c) => c.customerType === "staff").length,
      },
      {
        key: "owner_discount",
        label: "ملاك (70%)",
        count: customers.filter((c) => c.customerType === "owner_discount").length,
      },
    ],
    [customers],
  );

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
      setDupDialog({ customer: duplicateCustomer });
      return;
    }
    createMutation.mutate();
  }

  const rows = useMemo(
    () =>
      visibleCustomers.map((c) => [
        <span key={`name-${c.id}`} className="font-semibold text-slate-900">
          {c.fullName}
        </span>,
        <span key={`phone-${c.id}`} className="ltr-value font-mono text-xs">
          {phoneDisplay(c.phoneNumber)}
        </span>,
        <Badge key={`type-${c.id}`} tone={ctypeTone[c.customerType] ?? "neutral"}>
          {translateCustomerType(c.customerType)}
        </Badge>,
        <Badge key={`status-${c.id}`} tone={statusBadgeTone(c.status)}>
          {translateStatus(c.status)}
        </Badge>,
        <span key={`visit-${c.id}`} className="ltr-value text-xs text-slate-500">
          {dateTime(c.lastVisitAt ?? null)}
        </span>,
        <Btn
          key={`action-${c.id}`}
          size="sm"
          variant="secondary"
          onClick={() => setSelectedCustomerId(c.id)}
        >
          فتح الملف
        </Btn>,
      ]),
    [visibleCustomers],
  );

  return (
    <div className="space-y-6" dir="rtl">
      <SectionTitle
        title="شاشة العملاء"
        subtitle="إدارة بيانات العملاء والتسجيل السريع."
        icon={<Users size={20} />}
      />

      {message && (
        <Alert tone={message.ok ? "success" : "danger"}>{message.text}</Alert>
      )}

      {customersQuery.isError && (
        <Alert tone="danger">فشل تحميل قائمة العملاء. تحقق من الاتصال وأعد المحاولة.</Alert>
      )}

      <div className="grid gap-4 xl:grid-cols-[1.3fr_1fr]">
        <Panel title="بحث العملاء" icon={<Search size={15} />}>
          <div className="grid gap-3 md:grid-cols-2">
            <FormField label="بالاسم">
              <Input
                value={searchName}
                onChange={(e) => setSearchName(e.target.value)}
                placeholder="اسم العميل..."
              />
            </FormField>
            <FormField label="بالموبايل">
              <Input
                value={searchPhone}
                onChange={(e) =>
                  setSearchPhone(e.target.value.replace(/\D/g, "").slice(0, 11))
                }
                placeholder="01xxxxxxxxx"
                dir="ltr"
              />
            </FormField>
          </div>
        </Panel>

        <Panel title="تسجيل عميل جديد" icon={<UserPlus size={15} />}>
          {!showCreateForm ? (
            <Btn className="w-full" onClick={() => setShowCreateForm(true)}>
              تسجيل عميل جديد
            </Btn>
          ) : (
            <form className="space-y-4" onSubmit={onCreateSubmit}>
              <div className="grid gap-4 md:grid-cols-2">
                <FormField label="الاسم">
                  <Input
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    required
                  />
                </FormField>
                <FormField label="الموبايل (الأساسي)">
                  <Input
                    value={phoneNumber}
                    onChange={(e) =>
                      setPhoneNumber(e.target.value.replace(/\D/g, "").slice(0, 11))
                    }
                    dir="ltr"
                    required
                  />
                </FormField>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <FormField label="النوع">
                  <Select
                    value={customerType}
                    onChange={(e) => setCustomerType(e.target.value)}
                  >
                    <option value="visitor">زائر</option>
                    <option value="student">طالب</option>
                    <option value="employee">موظف</option>
                    <option value="trainer">مدرب</option>
                    <option value="staff">موظف كافيه (خصم 50%)</option>
                    <option value="owner_discount">مالك (خصم 70%)</option>
                  </Select>
                </FormField>
                <FormField label="الموبايل (بديل)">
                  <Input
                    value={phoneNumberSecondary}
                    onChange={(e) =>
                      setPhoneNumberSecondary(
                        e.target.value.replace(/\D/g, "").slice(0, 11),
                      )
                    }
                    dir="ltr"
                    placeholder="اختياري"
                  />
                </FormField>
              </div>

              {/* حقول الطالب */}
              {customerType === "student" && (
                <div className="grid gap-4 md:grid-cols-3 rounded-xl border border-blue-100 bg-blue-50 p-3">
                  <FormField label="الكلية / الجامعة">
                    <Input
                      value={college}
                      onChange={(e) => setCollege(e.target.value)}
                      placeholder="مثال: هندسة"
                    />
                  </FormField>
                  <FormField label="السنة الدراسية">
                    <Input
                      value={studyLevel}
                      onChange={(e) => setStudyLevel(e.target.value)}
                      placeholder="مثال: الفرقة الثالثة"
                    />
                  </FormField>
                  <FormField label="التخصص">
                    <Input
                      value={specialization}
                      onChange={(e) => setSpecialization(e.target.value)}
                      placeholder="مثال: ميكاترونكس"
                    />
                  </FormField>
                </div>
              )}

              {/* حقول الموظف */}
              {customerType === "employee" && (
                <div className="grid gap-4 md:grid-cols-2 rounded-xl border border-violet-100 bg-violet-50 p-3">
                  <FormField label="جهة العمل / الشركة">
                    <Input
                      value={employerName}
                      onChange={(e) => setEmployerName(e.target.value)}
                      placeholder="اسم الشركة"
                    />
                  </FormField>
                  <FormField label="المسمى الوظيفي">
                    <Input
                      value={jobTitle}
                      onChange={(e) => setJobTitle(e.target.value)}
                      placeholder="مثال: مهندس برمجيات"
                    />
                  </FormField>
                </div>
              )}

              <div className="grid gap-4 md:grid-cols-2">
                <FormField label="الايميل">
                  <Input
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    dir="ltr"
                    placeholder="اختياري"
                  />
                </FormField>
                <FormField label="العنوان">
                  <Input
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="اختياري"
                  />
                </FormField>
              </div>

              <FormField label="ملاحظات">
                <textarea
                  className="w-full rounded-xl border border-slate-200 bg-white p-2.5 text-right text-sm text-slate-900 outline-none transition placeholder:text-slate-400 hover:border-slate-300 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/15"
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="أضف أي ملاحظات تهمك عن العميل..."
                />
              </FormField>

              <div className="flex gap-2 border-t border-slate-100 pt-2">
                <Btn
                  type="submit"
                  className="flex-1"
                  loading={createMutation.isPending}
                >
                  حفظ بيانات العميل
                </Btn>
                <Btn variant="ghost" onClick={() => setShowCreateForm(false)}>
                  إلغاء
                </Btn>
              </div>
            </form>
          )}
        </Panel>
      </div>

      <Panel title="قائمة العملاء" icon={<Users size={15} />}>
        {/* Type-filter pills */}
        <div className="mb-4 flex flex-wrap gap-2" role="tablist" aria-label="تصفية حسب نوع العميل">
          {customerTypeTabs.map((tab) => (
            <button
              key={tab.key}
              role="tab"
              aria-selected={activeTypeTab === tab.key}
              aria-label={`عرض ${tab.label}`}
              onClick={() => setActiveTypeTab(tab.key)}
              className={clsx(
                "rounded-full border px-3 py-1 text-xs font-medium transition",
                activeTypeTab === tab.key
                  ? "border-slate-900 bg-slate-900 text-white"
                  : "border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50",
              )}
            >
              {tab.label} ({tab.count})
            </button>
          ))}
        </div>

        {customersQuery.isLoading ? (
          <TableSkeleton rows={5} cols={6} />
        ) : visibleCustomers.length === 0 ? (
          <EmptyState
            icon={<Users size={28} />}
            title="لا يوجد عملاء في هذه الفئة"
            sub="جرب تصفية مختلفة أو قم بتسجيل عميل جديد."
          />
        ) : (
          <DataTable
            headers={["الاسم", "الموبايل", "النوع", "الحالة", "آخر زيارة", "الإجراء"]}
            rows={rows}
          />
        )}
      </Panel>

      {selectedCustomerId && (
        <div ref={profileRef} className="scroll-mt-6">
          <Panel
            className="border-2 border-slate-900 shadow-xl overflow-hidden"
            title={`ملف العميل: ${selectedCustomer?.fullName ?? "..."}`}
            icon={<UserCheck size={18} className="text-emerald-500" />}
            action={
              <Btn
                size="sm"
                variant="ghost"
                className="hover:bg-rose-50 hover:text-rose-600"
                onClick={() => setSelectedCustomerId(null)}
                aria-label="إغلاق ملف العميل"
              >
                <X size={16} />
              </Btn>
            }
          >
            {customerDetailsQuery.isError ? (
              <Alert tone="danger">فشل تحميل ملف العميل. حاول مرة أخرى.</Alert>
            ) : customerDetailsQuery.isLoading ? (
              <div className="flex flex-col items-center justify-center py-12">
                <RefreshCw size={32} className="animate-spin text-slate-300 mb-4" />
                <p className="text-sm font-bold text-slate-400">
                  جاري تحميل الملف الكامل...
                </p>
              </div>
            ) : selectedCustomer ? (
              <div className="space-y-8">
                {/* Header Info Bar */}
                <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 pb-6">
                  <div className="flex items-center gap-4">
                    <div
                      className={clsx(
                        "flex h-14 w-14 items-center justify-center rounded-2xl border-2 shadow-inner text-xl font-black",
                        "bg-slate-100 text-slate-700 border-slate-200",
                      )}
                    >
                      {selectedCustomer.fullName.charAt(0)}
                    </div>
                    <div>
                      <h2 className="text-xl font-black text-slate-900 leading-tight">
                        {selectedCustomer.fullName}
                      </h2>
                      <div className="mt-1 flex items-center gap-2">
                        <Badge tone={ctypeTone[selectedCustomer.customerType] ?? "neutral"}>
                          {translateCustomerType(selectedCustomer.customerType)}
                        </Badge>
                        <Badge tone={statusBadgeTone(selectedCustomer.status)}>
                          {translateStatus(selectedCustomer.status)}
                        </Badge>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {selectedCustomer.status === "active" && (
                      <>
                        <Link
                          href={`/sessions?customerId=${selectedCustomer.id}`}
                          className="inline-flex h-8 items-center justify-center rounded-lg bg-emerald-500 px-3 text-xs font-semibold text-white hover:bg-emerald-600 transition"
                        >
                          فتح جلسة
                        </Link>
                        <Link
                          href={`/bookings?customerId=${selectedCustomer.id}`}
                          className="inline-flex h-8 items-center justify-center rounded-lg bg-violet-500 px-3 text-xs font-semibold text-white hover:bg-violet-600 transition"
                        >
                          حجز جديد
                        </Link>
                      </>
                    )}
                    <Btn
                      size="sm"
                      variant="secondary"
                      className="h-8 text-xs"
                      icon={<Edit2 size={12} />}
                      aria-label="تعديل بيانات العميل"
                      onClick={() => {
                        setEditFullName(selectedCustomer.fullName);
                        setEditPhoneNumber(selectedCustomer.phoneNumber);
                        setEditPhoneNumberSecondary(
                          selectedCustomer.phoneNumberSecondary || "",
                        );
                        setEditEmail(selectedCustomer.email || "");
                        setEditAddress(selectedCustomer.address || "");
                        setEditNotes(selectedCustomer.notes || "");
                        setEditCollege(selectedCustomer.college || "");
                        setEditStudyLevel(selectedCustomer.studyLevel || "");
                        setEditSpecialization(selectedCustomer.specialization || "");
                        setEditEmployerName(selectedCustomer.employerName || "");
                        setEditJobTitle(selectedCustomer.jobTitle || "");
                        setEditCustomerType(selectedCustomer.customerType);
                        setShowEditModal(true);
                      }}
                    >
                      تعديل البيانات
                    </Btn>

                    {selectedCustomer.status === "active" ? (
                      <Btn
                        size="sm"
                        variant="danger"
                        className="h-8 text-xs"
                        icon={<ShieldBan size={12} />}
                        onClick={() => {
                          setStatusReason("");
                          setStatusDialog({
                            customerId: selectedCustomer.id,
                            action: "blacklist",
                          });
                        }}
                      >
                        حظر العميل
                      </Btn>
                    ) : (
                      <Btn
                        size="sm"
                        variant="success"
                        className="h-8 text-xs"
                        icon={<ShieldBan size={12} />}
                        onClick={() => {
                          setStatusDialog({
                            customerId: selectedCustomer.id,
                            action: "reactivate",
                          });
                        }}
                      >
                        إعادة تفعيل العميل
                      </Btn>
                    )}
                  </div>
                </div>

                <div className="grid gap-6 lg:grid-cols-3">
                  {/* Side Info */}
                  <div className="space-y-6">
                    {/* Contact card */}
                    <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
                      <h4 className="mb-4 flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-400">
                        <Phone size={12} /> بيانات التواصل
                      </h4>
                      <div className="space-y-4">
                        <div>
                          <p className="text-[9px] font-bold uppercase text-slate-400">
                            الموبايل الأساسي
                          </p>
                          <p className="ltr-value font-mono text-xs font-black text-slate-900">
                            {phoneDisplay(selectedCustomer.phoneNumber)}
                          </p>
                        </div>
                        {selectedCustomer.phoneNumberSecondary && (
                          <div>
                            <p className="text-[9px] font-bold uppercase text-slate-400">
                              الموبايل البديل
                            </p>
                            <p className="ltr-value font-mono text-xs font-black text-slate-900">
                              {phoneDisplay(selectedCustomer.phoneNumberSecondary)}
                            </p>
                          </div>
                        )}
                        {selectedCustomer.email && (
                          <div>
                            <p className="text-[9px] font-bold uppercase text-slate-400">
                              البريد الإلكتروني
                            </p>
                            <p className="ltr-value font-mono text-xs font-black text-slate-900">
                              {selectedCustomer.email}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Student / Employee extra info */}
                    {(selectedCustomer.customerType === "student" ||
                      selectedCustomer.customerType === "employee") && (
                      <div
                        className={clsx(
                          "rounded-2xl border p-5 shadow-sm",
                          selectedCustomer.customerType === "student"
                            ? "border-blue-100 bg-blue-50/50"
                            : "border-violet-100 bg-violet-50/50",
                        )}
                      >
                        <h4 className="mb-4 flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-400">
                          <History size={12} />
                          {selectedCustomer.customerType === "student"
                            ? "البيانات الدراسية"
                            : "بيانات العمل"}
                        </h4>
                        <div className="space-y-4">
                          {selectedCustomer.customerType === "student" ? (
                            <>
                              <div>
                                <p className="text-[9px] font-bold uppercase text-slate-400">
                                  الكلية / الجامعة
                                </p>
                                <p className="text-xs font-black text-blue-900">
                                  {selectedCustomer.college || "غير محدد"}
                                </p>
                              </div>
                              <div className="grid grid-cols-2 gap-2">
                                <div>
                                  <p className="text-[9px] font-bold uppercase text-slate-400">
                                    السنة
                                  </p>
                                  <p className="text-[11px] font-bold text-blue-800">
                                    {selectedCustomer.studyLevel || "غير محدد"}
                                  </p>
                                </div>
                                <div>
                                  <p className="text-[9px] font-bold uppercase text-slate-400">
                                    التخصص
                                  </p>
                                  <p className="text-[11px] font-bold text-blue-800">
                                    {selectedCustomer.specialization || "غير محدد"}
                                  </p>
                                </div>
                              </div>
                            </>
                          ) : (
                            <>
                              <div>
                                <p className="text-[9px] font-bold uppercase text-slate-400">
                                  جهة العمل
                                </p>
                                <p className="text-xs font-black text-violet-900">
                                  {selectedCustomer.employerName || "غير محدد"}
                                </p>
                              </div>
                              <div>
                                <p className="text-[9px] font-bold uppercase text-slate-400">
                                  المسمى الوظيفي
                                </p>
                                <p className="text-[11px] font-bold text-violet-800">
                                  {selectedCustomer.jobTitle || "غير محدد"}
                                </p>
                              </div>
                            </>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Notes */}
                    <div className="rounded-2xl border border-amber-100 bg-amber-50/50 p-5 shadow-sm">
                      <h4 className="mb-2 text-[10px] font-black uppercase tracking-widest text-amber-600">
                        ملاحظات العميل
                      </h4>
                      <p className="text-xs font-medium italic leading-relaxed text-amber-900">
                        {selectedCustomer.notes ||
                          "لا توجد ملاحظات مسجلة لهذا العميل."}
                      </p>
                    </div>
                  </div>

                  {/* Timeline & History */}
                  <div className="space-y-6 lg:col-span-2">
                    {/* Stats row */}
                    {historyQuery.isError ? (
                      <Alert tone="danger">
                        فشل تحميل سجل العميل. حاول مرة أخرى.
                      </Alert>
                    ) : historyQuery.isLoading ? (
                      <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-4 animate-pulse">
                        {Array.from({ length: 4 }).map((_, i) => (
                          <div
                            key={i}
                            className="h-20 rounded-2xl border border-slate-100 bg-slate-50"
                          />
                        ))}
                      </div>
                    ) : (
                      <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-4">
                        <div className="rounded-2xl border border-slate-100 bg-white p-4">
                          <p className="text-[9px] font-black uppercase tracking-tighter text-slate-400">
                            إجمالي الجلسات
                          </p>
                          <p className="text-xl font-black text-slate-900">
                            {historyQuery.data?.sessionsCount ?? 0}
                          </p>
                        </div>
                        <div className="rounded-2xl border border-slate-100 bg-white p-4">
                          <p className="text-[9px] font-black uppercase tracking-tighter text-slate-400">
                            إجمالي الحجوزات
                          </p>
                          <p className="text-xl font-black text-slate-900">
                            {historyQuery.data?.bookingsCount ?? 0}
                          </p>
                        </div>
                        <div className="rounded-2xl border border-slate-100 bg-white p-4">
                          <p className="text-[9px] font-black uppercase tracking-tighter text-slate-400">
                            طلبات البار
                          </p>
                          <p className="text-xl font-black text-slate-900">
                            {historyQuery.data?.barOrdersCount ?? 0}
                          </p>
                        </div>
                        <div className="rounded-2xl bg-slate-900 p-4 text-white">
                          <p className="text-[9px] font-black uppercase tracking-tighter text-slate-400">
                            إجمالي المدفوع
                          </p>
                          <p className="ltr-value font-mono text-xl font-black tracking-tighter text-emerald-400">
                            {money(historyQuery.data?.totalSpent ?? 0)}
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Visit Feed */}
                    <div className="rounded-3xl border border-slate-100 bg-white p-8 shadow-sm">
                      <div className="mb-8 flex items-center justify-between">
                        <h3 className="flex items-center gap-2 text-base font-black text-slate-900">
                          <Clock3 size={18} className="text-blue-500" />
                          سجل الزيارات التفصيلي
                        </h3>
                        <Badge tone="success" className="text-[9px]">
                          مكتمل
                        </Badge>
                      </div>

                      {historyQuery.isLoading ? (
                        <div className="space-y-6 animate-pulse">
                          {Array.from({ length: 3 }).map((_, i) => (
                            <div key={i} className="flex gap-4">
                              <div className="mt-1 h-3 w-3 shrink-0 rounded-full bg-slate-200" />
                              <div className="flex-1 space-y-2">
                                <div className="h-3 w-1/4 rounded bg-slate-100" />
                                <div className="h-16 rounded-xl bg-slate-100" />
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="relative space-y-12 before:absolute before:right-6 before:top-0 before:bottom-0 before:w-0.5 before:bg-slate-50">
                          {historyQuery.data?.customer?.sessions?.map(
                            (session: any) => {
                              const durationHrs = session.durationMinutes
                                ? Math.floor(session.durationMinutes / 60)
                                : 0;
                              const durationMins = session.durationMinutes
                                ? session.durationMinutes % 60
                                : 0;

                              const sessionOrders =
                                historyQuery.data?.customer?.barOrders?.filter(
                                  (o: any) => o.sessionId === session.id,
                                );
                              const sessionInvoice =
                                historyQuery.data?.customer?.invoices?.find(
                                  (i: any) => i.sessionId === session.id,
                                );

                              return (
                                <div
                                  key={session.id}
                                  className="group relative pr-14"
                                >
                                  {/* Timeline Dot */}
                                  <div className="absolute right-[21px] top-0 h-3 w-3 rounded-full bg-blue-500 ring-4 ring-blue-50 transition-transform group-hover:scale-125" />

                                  <div className="grid gap-6 md:grid-cols-[1fr_2.5fr]">
                                    <div className="space-y-1 pt-0.5">
                                      <p className="text-xs font-black text-slate-900">
                                        <span className="ltr-value">
                                          {dateShort(session.startTime)}
                                        </span>
                                      </p>
                                      <p className="text-[9px] font-bold uppercase tracking-widest text-slate-400">
                                        <span className="ltr-value">
                                          {new Date(session.startTime).toLocaleTimeString(
                                            "ar-EG",
                                            { hour: "2-digit", minute: "2-digit" },
                                          )}
                                        </span>
                                      </p>
                                    </div>

                                    <div className="rounded-2xl border border-slate-100 bg-slate-50/30 p-5 transition-all hover:border-blue-100 hover:bg-white hover:shadow-xl">
                                      <div className="mb-4 flex flex-wrap items-center justify-between gap-4">
                                        <div className="flex items-center gap-3">
                                          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                                            <Clock3 size={16} />
                                          </div>
                                          <div>
                                            <p className="text-[9px] font-black uppercase text-slate-400">
                                              مدة الزيارة
                                            </p>
                                            <p className="mt-0.5 text-xs font-black leading-none text-slate-900">
                                              {durationHrs} ساعة و {durationMins} دقيقة
                                            </p>
                                          </div>
                                        </div>
                                        <div className="text-left">
                                          <p className="text-[9px] font-black uppercase text-slate-400">
                                            الحساب الإجمالي
                                          </p>
                                          <p className="ltr-value text-sm font-black text-slate-900">
                                            {sessionInvoice
                                              ? money(sessionInvoice.totalAmount)
                                              : money(0)}
                                          </p>
                                        </div>
                                      </div>

                                      {sessionOrders && sessionOrders.length > 0 && (
                                        <div className="mt-4 border-t border-slate-100 pt-4">
                                          <p className="mb-3 flex items-center gap-1.5 text-[9px] font-black uppercase leading-none text-slate-400">
                                            <Coffee size={12} className="text-amber-500" />
                                            طلبات البار
                                          </p>
                                          <div className="grid gap-2 sm:grid-cols-2">
                                            {sessionOrders.map((order: any) =>
                                              order.items?.map((item: any) => (
                                                <div
                                                  key={item.id}
                                                  className="flex items-center justify-between rounded-lg border border-slate-100 bg-white p-2 text-[11px]"
                                                >
                                                  <span className="font-medium text-slate-700">
                                                    {item.quantity} × {item.product?.name}
                                                  </span>
                                                  <span className="ltr-value font-mono text-[9px] font-bold text-slate-400">
                                                    {money(item.total ?? item.subtotal)}
                                                  </span>
                                                </div>
                                              )),
                                            )}
                                          </div>
                                        </div>
                                      )}

                                      {sessionInvoice && (
                                        <div className="mt-4 flex items-center justify-between border-t border-slate-50 pt-3 text-[9px] font-bold text-slate-400">
                                          <span>
                                            رقم الفاتورة:{" "}
                                            <span className="ltr-value font-mono">
                                              #{sessionInvoice.invoiceNumber.split("-").pop()}
                                            </span>
                                          </span>
                                          <span
                                            className={clsx(
                                              sessionInvoice.paymentStatus === "paid"
                                                ? "text-emerald-500"
                                                : "text-amber-500",
                                            )}
                                          >
                                            حالة الدفع:{" "}
                                            {translateStatus(sessionInvoice.paymentStatus)}
                                          </span>
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              );
                            },
                          )}

                          {!historyQuery.data?.customer?.sessions?.length && (
                            <EmptyState
                              icon={<History size={32} />}
                              title="لا يوجد سجل جلسات"
                              sub="لا يوجد سجل جلسات سابق لهذا العميل."
                            />
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <Alert tone="danger">فشل تحميل ملف العميل. حاول مرة أخرى.</Alert>
            )}
          </Panel>
        </div>
      )}

      {/* Edit Customer Modal */}
      <Modal
        isOpen={showEditModal && Boolean(selectedCustomer)}
        onClose={() => setShowEditModal(false)}
        title="تعديل بيانات العميل"
        size="md"
      >
        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            updateMutation.mutate();
          }}
        >
          <div className="grid gap-4 md:grid-cols-2">
            <FormField label="الاسم">
              <Input
                value={editFullName}
                onChange={(e) => setEditFullName(e.target.value)}
                required
              />
            </FormField>
            <FormField label="الموبايل (الأساسي)">
              <Input
                value={editPhoneNumber}
                onChange={(e) =>
                  setEditPhoneNumber(e.target.value.replace(/\D/g, "").slice(0, 11))
                }
                dir="ltr"
                required
              />
            </FormField>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <FormField label="الموبايل (بديل)">
              <Input
                value={editPhoneNumberSecondary}
                onChange={(e) =>
                  setEditPhoneNumberSecondary(
                    e.target.value.replace(/\D/g, "").slice(0, 11),
                  )
                }
                dir="ltr"
              />
            </FormField>
            <FormField label="الايميل">
              <Input
                value={editEmail}
                onChange={(e) => setEditEmail(e.target.value)}
                dir="ltr"
              />
            </FormField>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <FormField label="النوع">
              <Select
                value={editCustomerType}
                onChange={(e) => setEditCustomerType(e.target.value)}
              >
                <option value="visitor">زائر</option>
                <option value="student">طالب</option>
                <option value="employee">موظف</option>
                <option value="trainer">مدرب</option>
                <option value="staff">موظف كافيه (خصم 50%)</option>
                <option value="owner_discount">مالك (خصم 70%)</option>
              </Select>
            </FormField>
            <FormField label="العنوان">
              <Input
                value={editAddress}
                onChange={(e) => setEditAddress(e.target.value)}
              />
            </FormField>
          </div>

          {editCustomerType === "student" && (
            <div className="grid gap-4 md:grid-cols-3 rounded-xl border border-blue-100 bg-blue-50 p-3">
              <FormField label="الكلية / الجامعة">
                <Input
                  value={editCollege}
                  onChange={(e) => setEditCollege(e.target.value)}
                />
              </FormField>
              <FormField label="السنة الدراسية">
                <Input
                  value={editStudyLevel}
                  onChange={(e) => setEditStudyLevel(e.target.value)}
                />
              </FormField>
              <FormField label="التخصص">
                <Input
                  value={editSpecialization}
                  onChange={(e) => setEditSpecialization(e.target.value)}
                />
              </FormField>
            </div>
          )}

          {editCustomerType === "employee" && (
            <div className="grid gap-4 md:grid-cols-2 rounded-xl border border-violet-100 bg-violet-50 p-3">
              <FormField label="جهة العمل / الشركة">
                <Input
                  value={editEmployerName}
                  onChange={(e) => setEditEmployerName(e.target.value)}
                />
              </FormField>
              <FormField label="المسمى الوظيفي">
                <Input
                  value={editJobTitle}
                  onChange={(e) => setEditJobTitle(e.target.value)}
                />
              </FormField>
            </div>
          )}

          <FormField label="ملاحظات">
            <textarea
              className="w-full rounded-xl border border-slate-200 bg-white p-2.5 text-right text-sm text-slate-900 outline-none transition placeholder:text-slate-400 hover:border-slate-300 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/15"
              rows={3}
              value={editNotes}
              onChange={(e) => setEditNotes(e.target.value)}
            />
          </FormField>

          <div className="flex gap-2">
            <Btn type="submit" className="flex-1" loading={updateMutation.isPending}>
              حفظ التغييرات
            </Btn>
            <Btn variant="ghost" onClick={() => setShowEditModal(false)}>
              إلغاء
            </Btn>
          </div>
        </form>
      </Modal>

      {/* Duplicate phone confirmation Modal */}
      <Modal
        isOpen={Boolean(dupDialog)}
        onClose={() => setDupDialog(null)}
        title="رقم موبايل مسجل مسبقاً"
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-sm text-slate-700">
            الرقم ده متسجل باسم:{" "}
            <span className="font-black text-slate-900">{dupDialog?.customer.fullName}</span>
            . تحب نفتح ملفه؟
          </p>
          <div className="flex gap-2">
            <Btn
              variant="primary"
              className="flex-1"
              onClick={() => {
                if (!dupDialog) return;
                setSelectedCustomerId(dupDialog.customer.id);
                setShowCreateForm(false);
                resetCreateForm();
                setDupDialog(null);
              }}
            >
              فتح الملف
            </Btn>
            <Btn
              variant="secondary"
              onClick={() => {
                setDupDialog(null);
                createMutation.mutate();
              }}
            >
              تسجيل على أي حال
            </Btn>
            <Btn variant="ghost" onClick={() => setDupDialog(null)}>
              إلغاء
            </Btn>
          </div>
        </div>
      </Modal>

      {/* Status Modal (blacklist / reactivate) */}
      <Modal
        isOpen={Boolean(statusDialog)}
        onClose={() => setStatusDialog(null)}
        title={
          statusDialog?.action === "blacklist" ? "حظر العميل" : "إعادة تفعيل العميل"
        }
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-sm text-slate-600">
            {statusDialog?.action === "blacklist"
              ? "اكتب سبب الحظر ليظهر كسجل واضح بدل استخدام سبب افتراضي."
              : "هل تريد إعادة تفعيل هذا العميل؟"}
          </p>
          {statusDialog?.action === "blacklist" && (
            <FormField label="سبب الحظر">
              <Input
                value={statusReason}
                onChange={(e) => setStatusReason(e.target.value)}
                placeholder="سبب واضح ومختصر"
              />
            </FormField>
          )}
          <div className="flex gap-2">
            <Btn
              variant={statusDialog?.action === "blacklist" ? "danger" : "success"}
              loading={statusMutation.isPending}
              disabled={
                statusDialog?.action === "blacklist" && !statusReason.trim()
              }
              onClick={() => {
                if (!statusDialog) return;
                statusMutation.mutate(
                  { customerId: statusDialog.customerId, action: statusDialog.action },
                  { onSuccess: () => setStatusDialog(null) },
                );
              }}
            >
              تأكيد
            </Btn>
            <Btn variant="ghost" onClick={() => setStatusDialog(null)}>
              رجوع
            </Btn>
          </div>
        </div>
      </Modal>
    </div>
  );
}
