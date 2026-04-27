"use client";

import { FormEvent, useMemo, useState, useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Users, UserPlus, Search, UserCheck, UserX, ShieldBan, History, Clock, Receipt, BookOpen, Wallet, RefreshCw, X, AlertTriangle, Phone } from "lucide-react";
import { api } from "../../../lib/api";
import { translateApiError } from "../../../lib/errors";
import { dateTime, money } from "../../../lib/format";
import { translateCustomerType, translateSessionType, translateStatus } from "../../../lib/labels";
import type { Customer, Paginated, Session } from "../../../lib/types";
import { Alert, Badge, Btn, DataTable, EmptyState, FormField, Input, Panel, SectionTitle, Select, StatCard, statusBadgeTone } from "../../../components/ui";
import clsx from "clsx";

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
  const [searchName, setSearchName] = useState("");
  const [searchPhone, setSearchPhone] = useState("");
  const [message, setMessage] = useState<{ text: string; ok: boolean } | null>(null);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);
  const [showRegistrationModal, setShowRegistrationModal] = useState(false);
  const [duplicateCustomer, setDuplicateCustomer] = useState<Customer | null>(null);

  const customersQuery = useQuery({
    queryKey: ["customers", searchName, searchPhone],
    queryFn: async () => {
      const response = await api.get("/customers", {
        params: { page: 1, limit: 50, name: searchName || undefined, phone: searchPhone || undefined },
      });
      return response.data.data as Paginated<Customer>;
    },
  });

  const phoneSearchQuery = useQuery({
    queryKey: ["customers", "phone-search", phoneNumber],
    enabled: phoneNumber.length >= 10,
    queryFn: async () => {
      const response = await api.get("/customers", {
        params: { page: 1, limit: 5, phone: phoneNumber },
      });
      return response.data.data as Paginated<Customer>;
    },
  });

  useEffect(() => {
    if (phoneSearchQuery.data?.data && phoneSearchQuery.data.data.length > 0) {
      setDuplicateCustomer(phoneSearchQuery.data.data[0]);
    } else {
      setDuplicateCustomer(null);
    }
  }, [phoneSearchQuery.data]);

  const activeSessionQuery = useQuery({
    queryKey: ["customers", selectedCustomerId, "active-session"],
    enabled: Boolean(selectedCustomerId),
    queryFn: async () => {
      const response = await api.get(`/customers/${selectedCustomerId}/active-session`);
      return response.data.data as Session | null;
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
      await api.post("/customers", { fullName, phoneNumber, customerType });
    },
    onSuccess: () => {
      setFullName(""); setPhoneNumber(""); setCustomerType("visitor");
      setDuplicateCustomer(null);
      setShowRegistrationModal(false);
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
    },
    onError: (err: unknown) => {
      const m = (err as { response?: { data?: { message?: string | string[] } } })?.response?.data?.message;
      setMessage({ text: translateApiError(m), ok: false });
    },
  });

  function onCreateSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage(null);
    if (duplicateCustomer) {
      if (confirm(`هذا العميل موجود بالفعل: ${duplicateCustomer.fullName}\nهل تريد اختياره بدلاً من إنشاء عميل جديد؟`)) {
        setSelectedCustomerId(duplicateCustomer.id);
        setShowRegistrationModal(false);
        setDuplicateCustomer(null);
      }
      return;
    }
    createMutation.mutate();
  }

  function openRegistrationModal() {
    setFullName("");
    setPhoneNumber("");
    setCustomerType("visitor");
    setDuplicateCustomer(null);
    setShowRegistrationModal(true);
  }

  function closeRegistrationModal() {
    setShowRegistrationModal(false);
    setFullName("");
    setPhoneNumber("");
    setCustomerType("visitor");
    setDuplicateCustomer(null);
  }

  const customers = customersQuery.data?.data ?? [];
  const selectedCustomer = customers.find((c) => c.id === selectedCustomerId) ?? null;

  const rows = useMemo(() =>
    customers.map((c) => [
      <span key="name" className="font-medium text-slate-900">{c.fullName}</span>,
      <span key="phone" className="font-mono text-xs">{c.phoneNumber}</span>,
      <span key="type" className={"inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold " + (ctypeColors[c.customerType] ?? ctypeColors.visitor)}>
        {translateCustomerType(c.customerType)}
      </span>,
      <Badge key="status" tone={statusBadgeTone(c.status)}>{translateStatus(c.status)}</Badge>,
      <span key="visit" className="text-xs text-slate-500">{dateTime(c.lastVisitAt ?? null)}</span>,
      <Btn key="manage" size="sm" variant="ghost" onClick={() => setSelectedCustomerId(c.id)}>إدارة</Btn>,
    ]),
    [customers],
  );

  const total = customers.length;
  const active = customers.filter((c) => c.status === "active").length;

  return (
    <div className="space-y-6" dir="rtl">
      <SectionTitle
        title="العملاء"
        subtitle="سجّل عميل جديد، ابحث بسرعة، وتحكم في حالاتهم من نفس الصفحة."
        icon={<Users size={20} />}
        action={
          <button onClick={() => customersQuery.refetch()} className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 transition hover:bg-slate-50">
            <RefreshCw size={12} /> تحديث
          </button>
        }
      />

      {message && (
        <Alert tone={message.ok ? "success" : "danger"}>{message.text}</Alert>
      )}

      {/* Stats */}
      <div className="grid gap-3 sm:grid-cols-3">
        <StatCard label="إجمالي العملاء" value={total} icon={<Users size={18} />} />
        <StatCard label="العملاء النشطون" value={active} tone="success" icon={<UserCheck size={18} />} />
        <StatCard label="نتائج البحث" value={total} icon={<Search size={18} />} sub="حسب الفلتر الحالي" />
      </div>

      {/* Registration + Search */}
      <div className="grid gap-4 lg:grid-cols-2">
        <Panel title="تسجيل عميل جديد" icon={<UserPlus size={15} />}>
          {!showRegistrationModal ? (
            <button
              onClick={openRegistrationModal}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-700"
            >
              <UserPlus size={16} />
              تسجيل عميل جديد
            </button>
          ) : (
            <form className="space-y-3" onSubmit={onCreateSubmit}>
              <div className="flex items-center justify-between">
                <button type="button" onClick={closeRegistrationModal} className="text-slate-400 hover:text-slate-600">
                  <X size={16} />
                </button>
                <p className="text-sm font-semibold text-slate-700">بيانات العميل الجديد</p>
              </div>

              {duplicateCustomer && (
                <div className="flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-700">
                  <AlertTriangle size={14} className="mt-0.5 shrink-0" />
                  <div>
                    <p className="font-semibold">تحذير: رقم الهاتف موجود مسبقاً!</p>
                    <p>العميل: {duplicateCustomer.fullName}</p>
                  </div>
                </div>
              )}

              <FormField label="الاسم الكامل">
                <Input value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="اسم العميل" required />
              </FormField>
              <FormField label="رقم الهاتف">
                <div className="relative">
                  <Phone size={13} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <Input value={phoneNumber} onChange={(e) => setPhoneNumber(e.target.value)} placeholder="01xxxxxxxxx" dir="ltr" className="pr-9" required />
                </div>
              </FormField>
              <FormField label="النوع">
                <Select value={customerType} onChange={(e) => setCustomerType(e.target.value)}>
                  <option value="student">طالب</option>
                  <option value="employee">موظف</option>
                  <option value="trainer">مدرب</option>
                  <option value="parent">ولي أمر</option>
                  <option value="visitor">زائر</option>
                </Select>
              </FormField>
              <Btn type="submit" loading={createMutation.isPending} loadingText="جاري التسجيل..." className="w-full" icon={<UserPlus size={14} />}>
                تسجيل
              </Btn>
            </form>
          )}
        </Panel>

        <Panel title="البحث عن عميل" icon={<Search size={15} />}>
          <div className="space-y-3">
            <FormField label="الاسم">
              <Input value={searchName} onChange={(e) => setSearchName(e.target.value)} placeholder="ابحث بالاسم..." />
            </FormField>
            <FormField label="رقم الهاتف">
              <Input value={searchPhone} onChange={(e) => setSearchPhone(e.target.value)} placeholder="ابحث بالهاتف..." dir="ltr" />
            </FormField>
            <div className="rounded-xl bg-slate-50 px-4 py-3 text-right">
              <p className="text-xs text-slate-500">عدد النتائج</p>
              <p className="text-lg font-bold text-slate-900">{total}</p>
            </div>
          </div>
        </Panel>
      </div>

      {/* Customers Table */}
      <Panel title="قائمة العملاء" icon={<Users size={15} />}>
        {customersQuery.isLoading ? (
          <div className="flex justify-center py-10"><RefreshCw size={20} className="animate-spin text-slate-400" /></div>
        ) : customers.length === 0 ? (
          <EmptyState icon={<Users size={36} />} title="لا يوجد عملاء" sub="سجّل أول عميل من الأعلى." />
        ) : (
          <DataTable
            headers={["الاسم", "الهاتف", "النوع", "الحالة", "آخر زيارة", "إجراء"]}
            rows={rows}
          />
        )}
      </Panel>

      {/* Customer Management Panel */}
      {selectedCustomer && (
        <Panel
          title={`إدارة العميل: ${selectedCustomer.fullName}`}
          icon={<UserCheck size={15} />}
          action={
            <Btn size="sm" variant="ghost" onClick={() => setSelectedCustomerId(null)}>✕ إغلاق</Btn>
          }
        >
          <div className="mb-4 flex flex-wrap gap-2">
            <Btn variant="warn" size="sm" onClick={() => statusMutation.mutate({ customerId: selectedCustomer.id, action: "deactivate" })} loading={statusMutation.isPending} icon={<UserX size={14} />}>
              إيقاف العميل
            </Btn>
            <Btn variant="success" size="sm" onClick={() => statusMutation.mutate({ customerId: selectedCustomer.id, action: "reactivate" })} loading={statusMutation.isPending} icon={<UserCheck size={14} />}>
              تفعيل العميل
            </Btn>
            <Btn variant="danger" size="sm" onClick={() => statusMutation.mutate({ customerId: selectedCustomer.id, action: "blacklist" })} loading={statusMutation.isPending} icon={<ShieldBan size={14} />}>
              قائمة سوداء
            </Btn>
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            {/* Active Session */}
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <div className="mb-3 flex items-center gap-2">
                <Clock size={15} className="text-slate-500" />
                <h4 className="text-sm font-semibold text-slate-700">المدة الحالية</h4>
              </div>
              {activeSessionQuery.isLoading ? (
                <p className="text-sm text-slate-500">جاري التحميل...</p>
              ) : activeSessionQuery.data ? (
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <Badge tone={statusBadgeTone(activeSessionQuery.data.status)}>{translateStatus(activeSessionQuery.data.status)}</Badge>
                    <span className="text-slate-500">الحالة</span>
                  </div>
                  <div className="flex justify-between text-slate-700">
                    <span>{translateSessionType(activeSessionQuery.data.sessionType)}</span>
                    <span className="text-slate-500">النوع</span>
                  </div>
                  <div className="flex justify-between text-slate-700">
                    <span className="text-xs">{dateTime(activeSessionQuery.data.startTime)}</span>
                    <span className="text-slate-500">من</span>
                  </div>
                  {activeSessionQuery.data.room && (
                    <div className="flex justify-between text-slate-700">
                      <span>{activeSessionQuery.data.room.name}</span>
                      <span className="text-slate-500">الغرفة</span>
                    </div>
                  )}
                </div>
              ) : (
                <EmptyState icon={<Clock size={28} />} title="لا توجد مدة نشطة" sub="العميل ليس داخل المكان حالياً." />
              )}
            </div>

            {/* History Summary */}
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <div className="mb-3 flex items-center gap-2">
                <History size={15} className="text-slate-500" />
                <h4 className="text-sm font-semibold text-slate-700">ملخص التاريخ</h4>
              </div>
              {historyQuery.isLoading ? (
                <p className="text-sm text-slate-500">جاري التحميل...</p>
              ) : historyQuery.data ? (
                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-lg bg-white p-2 text-center">
                    <Clock size={14} className="mx-auto mb-1 text-blue-500" />
                    <p className="text-lg font-bold text-slate-900">{historyQuery.data.sessionsCount}</p>
                    <p className="text-[10px] text-slate-500">مدة</p>
                  </div>
                  <div className="rounded-lg bg-white p-2 text-center">
                    <BookOpen size={14} className="mx-auto mb-1 text-violet-500" />
                    <p className="text-lg font-bold text-slate-900">{historyQuery.data.bookingsCount}</p>
                    <p className="text-[10px] text-slate-500">حجز</p>
                  </div>
                  <div className="rounded-lg bg-white p-2 text-center">
                    <Receipt size={14} className="mx-auto mb-1 text-amber-500" />
                    <p className="text-lg font-bold text-slate-900">{historyQuery.data.invoicesCount}</p>
                    <p className="text-[10px] text-slate-500">فاتورة</p>
                  </div>
                  <div className="rounded-lg bg-white p-2 text-center">
                    <Wallet size={14} className="mx-auto mb-1 text-emerald-500" />
                    <p className="text-lg font-bold text-slate-900">{money(historyQuery.data.totalSpent)}</p>
                    <p className="text-[10px] text-slate-500">إجمالي</p>
                  </div>
                </div>
              ) : (
                <EmptyState icon={<History size={28} />} title="لا توجد بيانات" sub="لم يتم العثور على تاريخ لهذا العميل." />
              )}
            </div>
          </div>

          {/* Customer Info */}
          <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-4">
            <p className="mb-2 text-xs font-semibold text-slate-500">بيانات العميل</p>
            <div className="grid gap-2 sm:grid-cols-2 text-sm">
              <div className="flex justify-between">
                <span className="font-medium text-slate-900">{selectedCustomer.fullName}</span>
                <span className="text-slate-500">الاسم</span>
              </div>
              <div className="flex justify-between">
                <span className="font-mono text-slate-900">{selectedCustomer.phoneNumber}</span>
                <span className="text-slate-500">الهاتف</span>
              </div>
              <div className="flex justify-between">
                <span className={clsx("inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold", ctypeColors[selectedCustomer.customerType] ?? ctypeColors.visitor)}>
                  {translateCustomerType(selectedCustomer.customerType)}
                </span>
                <span className="text-slate-500">النوع</span>
              </div>
              <div className="flex justify-between">
                <Badge tone={statusBadgeTone(selectedCustomer.status)}>{translateStatus(selectedCustomer.status)}</Badge>
                <span className="text-slate-500">الحالة</span>
              </div>
              {selectedCustomer.email && (
                <div className="flex justify-between sm:col-span-2">
                  <span className="text-slate-900 text-xs" dir="ltr">{selectedCustomer.email}</span>
                  <span className="text-slate-500">البريد</span>
                </div>
              )}
              {selectedCustomer.notes && (
                <div className="sm:col-span-2">
                  <p className="text-[10px] text-slate-500 mb-0.5">ملاحظات</p>
                  <p className="text-xs text-slate-700">{selectedCustomer.notes}</p>
                </div>
              )}
            </div>
          </div>
        </Panel>
      )}
    </div>
  );
}
