"use client";

import { useMemo, useState, useEffect, useRef, type ReactNode } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { 
  Wallet, Plus, Search, ArrowUpRight, ArrowDownRight, TrendingUp, 
  Building2, FileText, Download, Trash2, Tag, CreditCard, Banknote,
  RefreshCw, ChevronDown, Pencil, Check, X, SlidersHorizontal
} from "lucide-react";
import { api } from "../../../lib/api";
import { money, dateTime } from "../../../lib/format";
import { 
  Badge, Btn, DataTable, FormField, Input, Modal, Panel, 
  Spinner, EmptyState, statusBadgeTone
} from "../../../components/ui";
import { toast } from "sonner";
import clsx from "clsx";

interface Expense {
  id: string;
  amount: number;
  date: string;
  description: string;
  paymentMethod: string;
  status: string;
  isRecurring: boolean;
  category: { id: string; name: string };
  vendor?: { id: string; name: string } | null;
  recordedByUser: { id: string; firstName: string; lastName: string };
  linkedUser?: { id: string; firstName: string; lastName: string } | null;
}

interface ExpenseCategory { id: string; name: string; _count?: { expenses: number } }
interface Vendor { id: string; name: string; phone?: string | null; _count?: { expenses: number } }
interface UserOption { id: string; firstName: string; lastName: string }
interface ExpenseBreakdown { categoryId: string; categoryName: string; total: number; count: number }
interface ExpensePayload {
  amount: number; date: string; description: string; categoryId: string;
  vendorId?: string | null; paymentMethod: string; linkedUserId?: string | null;
  isRecurring: boolean; status: string;
}

const getApiError = (error: unknown, fallback: string) => {
  const message = (error as { response?: { data?: { message?: string | string[] } } })?.response?.data?.message;
  return Array.isArray(message) ? message.join("، ") : message || fallback;
};

const paymentMethodLabel: Record<string, string> = {
  cash: "نقدي", card: "بطاقة", bank_transfer: "تحويل بنكي", wallet: "محفظة إلكترونية",
};

const expenseStatusLabel: Record<string, string> = {
  paid: "تم السداد", pending: "آجل", cancelled: "ملغي",
};

// --- High-End AdvancedSelect (Horizontal & Large) ---
function AdvancedSelect({
  label, options, value, onChange, placeholder = "اختر...", icon, horizontal = true, allowClear = false,
}: { 
  label?: string; options: { id: string; name: string; info?: string }[]; 
  value: string; onChange: (id: string) => void; placeholder?: string; icon?: ReactNode;
  horizontal?: boolean; allowClear?: boolean;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const selectedOption = options.find(o => o.id === value);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) setIsOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className={clsx("relative w-full", horizontal ? "sm:flex sm:items-center sm:gap-3" : "flex flex-col gap-1.5")} ref={containerRef}>
      {label && <span className={clsx("mb-1 block shrink-0 text-xs font-black text-slate-600 sm:mb-0", horizontal && "sm:w-24")}>{label}</span>}
      
      <div className="relative flex-1">
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          aria-expanded={isOpen}
          className={clsx(
            "flex min-h-11 w-full items-center justify-between gap-3 rounded-xl border bg-white px-3.5 py-2.5 text-right text-sm font-bold transition-all",
            isOpen ? "border-blue-600 ring-4 ring-blue-500/10" : "border-slate-200 hover:border-slate-400"
          )}
        >
          <div className="flex items-center gap-2 overflow-hidden">
            {icon && <span className="text-blue-500 shrink-0">{icon}</span>}
            <span className={clsx("truncate", !selectedOption ? "text-slate-400" : "text-slate-800")}>
              {selectedOption ? selectedOption.name : placeholder}
            </span>
          </div>
          <div className="flex shrink-0 items-center gap-1">
            {allowClear && value && (
              <span
                role="button"
                tabIndex={0}
                aria-label="مسح الاختيار"
                onClick={(event) => { event.stopPropagation(); onChange(""); setIsOpen(false); }}
                onKeyDown={(event) => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); onChange(""); setIsOpen(false); } }}
                className="rounded-md p-1 text-slate-400 hover:bg-slate-100 hover:text-rose-600"
              ><X size={14} /></span>
            )}
            <ChevronDown size={16} className={clsx("text-slate-400 transition-transform duration-300", isOpen && "rotate-180")} />
          </div>
        </button>

        {isOpen && (
          <div className="absolute z-50 mt-1.5 max-h-64 w-full overflow-y-auto rounded-xl border border-slate-200 bg-white p-1.5 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
            {options.length === 0 && <div className="p-4 text-center text-xs text-slate-400">لا توجد خيارات</div>}
            {options.map((opt) => (
              <button
                key={opt.id}
                type="button"
                onClick={() => { onChange(opt.id); setIsOpen(false); }}
                className={clsx(
                  "mb-0.5 flex w-full items-center justify-between gap-2 rounded-lg px-3 py-2.5 text-right text-sm transition-colors",
                  value === opt.id ? "bg-blue-600 text-white font-bold" : "hover:bg-blue-50 text-slate-700"
                )}
              >
                <div className="min-w-0">
                  <p className="truncate font-bold">{opt.name}</p>
                  {opt.info && <p className={clsx("truncate text-[10px]", value === opt.id ? "text-blue-100" : "text-slate-400")}>{opt.info}</p>}
                </div>
                {value === opt.id && <Check size={16} />}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default function ExpensesPage() {
  const queryClient = useQueryClient();
  const [isExpenseModalOpen, setExpenseModalOpen] = useState(false);
  const [isCategoryModalOpen, setCategoryModalOpen] = useState(false);
  const [isVendorModalOpen, setVendorModalOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);

  const [formCategory, setFormCategory] = useState("");
  const [formVendor, setFormVendor] = useState("");
  const [formLinkedUser, setFormLinkedUser] = useState("");
  const [formPaymentMethod, setFormPaymentMethod] = useState("cash");
  const [formStatus, setFormStatus] = useState("paid");

  const [filterCategory, setFilterCategory] = useState("");
  const [filterFrom, setFilterFrom] = useState("");
  const [filterTo, setFilterTo] = useState("");
  const [searchTerm, setSearchTerm] = useState("");

  const { data: expensesRes, isLoading: isLoadingExpenses, refetch } = useQuery({
    queryKey: ["expenses", filterCategory, filterFrom, filterTo],
    queryFn: async () => {
      const r = await api.get("/expenses", {
        params: { categoryId: filterCategory || undefined, fromDate: filterFrom || undefined, toDate: filterTo || undefined, limit: 1000 },
      });
      return r.data;
    },
  });

  const { data: categories = [] } = useQuery<ExpenseCategory[]>({
    queryKey: ["expense-categories"],
    queryFn: async () => {
      const r = await api.get("/expenses/categories");
      return r.data;
    },
  });

  const { data: vendors = [] } = useQuery<Vendor[]>({
    queryKey: ["vendors"],
    queryFn: async () => {
      const r = await api.get("/expenses/vendors");
      return r.data;
    },
  });

  const { data: summary } = useQuery({
    queryKey: ["financial-summary", filterFrom, filterTo],
    queryFn: async () => {
      const r = await api.get("/expenses/summary", {
        params: { fromDate: filterFrom || undefined, toDate: filterTo || undefined },
      });
      return r.data;
    },
  });

  const { data: users = [] } = useQuery<UserOption[]>({
    queryKey: ["users-list"],
    queryFn: async () => {
      const r = await api.get("/users");
      const responseData = r.data.data;
      return Array.isArray(responseData) ? responseData : responseData?.data || [];
    },
  });

  const createExpenseMutation = useMutation({
    mutationFn: (data: ExpensePayload) => editingExpense ? api.patch(`/expenses/${editingExpense.id}`, data) : api.post("/expenses", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["expenses"] });
      queryClient.invalidateQueries({ queryKey: ["financial-summary"] });
      setExpenseModalOpen(false);
      setEditingExpense(null);
      resetForm();
      toast.success(editingExpense ? "تم التحديث" : "تم الحفظ بنجاح");
    },
    onError: (error: unknown) => toast.error(getApiError(error, "تعذر حفظ المصروف")),
  });

  const deleteExpenseMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/expenses/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["expenses"] });
      queryClient.invalidateQueries({ queryKey: ["financial-summary"] });
      toast.success("تم إلغاء المصروف بنجاح");
    },
    onError: (error: unknown) => toast.error(getApiError(error, "تعذر إلغاء المصروف")),
  });

  const resetForm = () => {
    setFormCategory(""); setFormVendor(""); setFormLinkedUser(""); setFormPaymentMethod("cash"); setFormStatus("paid");
  };

  const openCreateExpense = () => {
    setEditingExpense(null);
    resetForm();
    setExpenseModalOpen(true);
  };

  const openEditExpense = (expense: Expense) => {
    setEditingExpense(expense);
    setFormCategory(expense.category.id);
    setFormVendor(expense.vendor?.id || "");
    setFormLinkedUser(expense.linkedUser?.id || "");
    setFormPaymentMethod(expense.paymentMethod);
    setFormStatus(expense.status);
    setExpenseModalOpen(true);
  };

  const closeExpenseModal = () => {
    setExpenseModalOpen(false);
    setEditingExpense(null);
    resetForm();
  };

  const filteredExpenses = useMemo(() => {
    const list = Array.isArray(expensesRes?.data) ? expensesRes.data : Array.isArray(expensesRes) ? expensesRes : [];
    if (!searchTerm.trim()) return list;
    const q = searchTerm.toLowerCase();
    return list.filter((e: Expense) => 
      e.description.toLowerCase().includes(q) || (e.vendor?.name ?? "").toLowerCase().includes(q) || e.category?.name?.toLowerCase().includes(q)
    );
  }, [expensesRes, searchTerm]);

  const headers = ["التاريخ", "البيان", "التصنيف", "المبلغ", "الوسيلة", "الحالة", ""];
  const rows = filteredExpenses.map((e: Expense) => [
    <div key={e.id} className="text-xs text-slate-400 font-bold">{dateTime(e.date).split(',')[0]}</div>,
    <div key={e.id + "desc"}>
      <div className="font-bold text-slate-800 text-sm">{e.description}</div>
      <div className="text-[10px] text-slate-400 mt-1">{e.vendor?.name || 'مورد عام'} • {e.recordedByUser?.firstName ?? ''}</div>
    </div>,
    <Badge key={e.id + "cat"} tone="neutral" className="px-3 py-1 text-[11px] font-bold">{e.category?.name ?? 'عام'}</Badge>,
    <div key={e.id + "amt"} className="text-left font-black text-rose-600 text-base">{money(e.amount)}</div>,
    <div key={e.id + "pm"} className="flex min-w-24 items-center gap-1.5 text-xs font-bold text-slate-600">
      {e.paymentMethod === 'cash' ? <Banknote size={14} /> : <CreditCard size={14} />}
      {paymentMethodLabel[e.paymentMethod] || e.paymentMethod}
    </div>,
    <div key={e.id + "st"}><Badge tone={statusBadgeTone(e.status)} className="whitespace-nowrap px-3 py-1 text-[11px] font-black">{expenseStatusLabel[e.status] || e.status}</Badge></div>,
    <div key={e.id + "act"} className="flex min-w-20 justify-end gap-1">
      <button title="تعديل المصروف" disabled={e.status === "cancelled"} className="rounded-lg p-2 text-slate-500 transition-colors hover:bg-blue-50 hover:text-blue-600 disabled:cursor-not-allowed disabled:opacity-30" onClick={() => openEditExpense(e)}><Pencil size={16} /></button>
      <button title="إلغاء المصروف" disabled={e.status === "cancelled" || deleteExpenseMutation.isPending} className="rounded-lg p-2 text-slate-500 transition-colors hover:bg-rose-50 hover:text-rose-600 disabled:cursor-not-allowed disabled:opacity-30" onClick={() => { if(confirm('هل تريد إلغاء هذا المصروف؟ سيظل محفوظًا في السجل.')) deleteExpenseMutation.mutate(e.id); }}><Trash2 size={16} /></button>
    </div>
  ]);

  return (
    <div className="space-y-4 pb-8">
      <div className="relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
        <div className="absolute top-0 right-0 w-1 h-full bg-blue-600" />
        <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
          <div>
            <div className="flex items-center gap-2 mb-1 text-blue-600 font-black">
               <Wallet size={18} />
               <span className="text-[10px] uppercase tracking-widest">إدارة المصروفات والخزينة</span>
            </div>
            <h1 className="text-xl font-black text-slate-900 sm:text-2xl">المصروفات</h1>
            <p className="mt-1 text-xs font-medium text-slate-400">تسجيل ومراجعة جميع عمليات الصرف من مكان واحد</p>
          </div>
          <div className="grid w-full grid-cols-2 gap-2 sm:flex lg:w-auto">
            <Btn variant="secondary" size="sm" onClick={() => setVendorModalOpen(true)} icon={<Building2 size={16} />} className="justify-center">الموردون</Btn>
            <Btn variant="secondary" size="sm" onClick={() => setCategoryModalOpen(true)} icon={<Tag size={16} />} className="justify-center">التصنيفات</Btn>
            <Btn variant="primary" size="sm" onClick={openCreateExpense} icon={<Plus size={18} />} className="col-span-2 justify-center sm:col-span-1">مصروف جديد</Btn>
          </div>
        </div>

        <div className="mt-5 grid grid-cols-2 gap-2.5 xl:grid-cols-4">
          <CompactStat label="إجمالي المصروفات" value={summary?.expensesTotal ?? 0} tone="rose" icon={<ArrowDownRight size={16} />} />
          <CompactStat label="إجمالي الإيرادات" value={summary?.revenueTotal ?? 0} tone="emerald" icon={<ArrowUpRight size={16} />} />
          <CompactStat label="صافي الربح" value={summary?.netProfit ?? 0} tone="blue" icon={<TrendingUp size={16} />} />
          <CompactStat label="العمليات المنفذة" value={expensesRes?.total || filteredExpenses.length} tone="slate" icon={<FileText size={16} />} isCurrency={false} />
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_320px]">
        <div className="space-y-4">
          <Panel className="!p-4 border-slate-200 bg-white shadow-sm">
            <div className="mb-3 flex items-center gap-2 text-xs font-black text-slate-500">
              <SlidersHorizontal size={15} /> البحث والتصفية
            </div>
            <div className="grid gap-2.5 md:grid-cols-2 xl:grid-cols-[minmax(220px,1fr)_170px_150px_150px_auto]">
            <div className="relative min-w-0">
              <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
              <input type="text" placeholder="بحث بالبيان أو المورد أو القسم..." className="w-full bg-slate-50 border border-slate-200 focus:bg-white rounded-xl pr-11 pl-4 py-2.5 text-sm font-bold focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
            </div>
            <AdvancedSelect
              options={[{id: "", name: "كل التصنيفات"}, ...categories.map((category) => ({id: category.id, name: category.name}))]}
              value={filterCategory}
              onChange={setFilterCategory}
              horizontal={false}
            />
            <input aria-label="من تاريخ" type="date" className="min-h-11 rounded-xl border border-slate-200 bg-slate-50 px-3 text-xs font-bold text-slate-700 outline-none focus:border-blue-500 focus:bg-white" value={filterFrom} onChange={(e) => setFilterFrom(e.target.value)} />
            <input aria-label="إلى تاريخ" type="date" className="min-h-11 rounded-xl border border-slate-200 bg-slate-50 px-3 text-xs font-bold text-slate-700 outline-none focus:border-blue-500 focus:bg-white" value={filterTo} onChange={(e) => setFilterTo(e.target.value)} />
            <div className="flex gap-1.5">
              {(filterCategory || filterFrom || filterTo || searchTerm) && (
                <button title="مسح الفلاتر" onClick={() => { setFilterCategory(""); setFilterFrom(""); setFilterTo(""); setSearchTerm(""); }} className="min-h-11 rounded-xl border border-rose-200 px-3 text-rose-600 transition-colors hover:bg-rose-50"><X size={17} /></button>
              )}
              <button title="تحديث السجل" className="min-h-11 rounded-xl border border-slate-200 px-3 text-slate-500 transition-colors hover:bg-blue-50 hover:text-blue-600" onClick={() => refetch()}><RefreshCw size={17} /></button>
            </div>
            </div>
          </Panel>

          <Panel className="!p-0 overflow-hidden shadow-lg border-slate-200">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b bg-slate-50/80 p-4">
               <div className="flex items-center gap-3">
                 <h2 className="text-base font-bold text-slate-800">تفاصيل السجل المالي</h2>
                 <Badge tone="info" className="px-2.5 py-1 text-xs font-black">{filteredExpenses.length} معاملة</Badge>
               </div>
               <span className="text-[11px] font-bold text-slate-400">الأحدث أولًا</span>
            </div>
            {isLoadingExpenses ? (
              <div className="flex items-center justify-center py-20"><Spinner size={32} /></div>
            ) : filteredExpenses.length === 0 ? (
              <EmptyState icon={<Wallet size={40} className="text-slate-300" />} title="لا توجد مصروفات مسجلة" sub="لم يتم العثور على أي عمليات مصروفات تطابق معايير البحث أو التصفية الحالية." />
            ) : (
              <div className="p-2 sm:p-3"><DataTable headers={headers} rows={rows} selectable={false} /></div>
            )}
          </Panel>
        </div>

        <div className="space-y-4">
          <Panel title="توزيع التكاليف" icon={<TrendingUp size={18} className="text-rose-500" />}>
             <div className="mt-4 space-y-4">
                {summary?.breakdown?.map((item: ExpenseBreakdown) => (
                  <div key={item.categoryId} className="space-y-2">
                    <div className="flex justify-between text-xs font-black text-slate-800">
                      <span>{item.categoryName}</span>
                      <span>{money(item.total)}</span>
                    </div>
                    <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden border shadow-sm">
                      <div className="h-full bg-blue-600 rounded-full" style={{ width: `${Math.min(100, (item.total / (summary.expensesTotal || 1)) * 100)}%` }} />
                    </div>
                  </div>
                ))}
                {!summary?.breakdown?.length && <p className="py-6 text-center text-xs font-bold text-slate-400">لا توجد بيانات للفترة المحددة</p>}
             </div>
          </Panel>

          <div className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-800 to-slate-950 p-5 text-white shadow-lg">
             <div className="absolute -top-10 -right-10 opacity-10 group-hover:scale-125 transition-transform duration-1000"><Download size={150} /></div>
             <div className="relative z-10">
                <h3 className="mb-2 text-base font-bold">طباعة التقرير</h3>
                <p className="text-xs text-blue-100 mb-6 font-medium leading-relaxed">يمكنك طباعة كشف حساب كامل للمصروفات خلال الفترة المحددة لمراجعتها ورقياً.</p>
                <Btn variant="secondary" className="w-full bg-white text-blue-900 border-none hover:bg-blue-50 font-black h-12 rounded-2xl" onClick={() => window.print()}>تحميل / طباعة التقرير</Btn>
             </div>
          </div>
        </div>
      </div>

      <Modal isOpen={isExpenseModalOpen} onClose={closeExpenseModal} title={editingExpense ? "تعديل المصروف" : "إضافة مصروف جديد"} size="lg">
         <form onSubmit={(e) => {
            e.preventDefault(); const formData = new FormData(e.currentTarget); const rawData = Object.fromEntries(formData.entries());
            if (!formCategory) { toast.error("اختر تصنيف المصروف"); return; }
            const amount = Number(rawData.amount);
            if (!Number.isFinite(amount) || amount <= 0) { toast.error("أدخل مبلغًا صحيحًا أكبر من صفر"); return; }
            createExpenseMutation.mutate({ amount, date: new Date(rawData.date as string).toISOString(), description: String(rawData.description).trim(), categoryId: formCategory, vendorId: formVendor || (editingExpense ? null : undefined), paymentMethod: formPaymentMethod, linkedUserId: formLinkedUser || (editingExpense ? null : undefined), isRecurring: rawData.isRecurring === 'on', status: formStatus });
         }} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField label="المبلغ (ج.م)"><Input name="amount" type="number" inputMode="decimal" min="0.01" step="0.01" required defaultValue={editingExpense?.amount} placeholder="0.00" autoFocus className="h-14 rounded-xl border-blue-100 bg-blue-50/30 text-center text-2xl font-black text-blue-700" /></FormField>
              <FormField label="تاريخ المعاملة"><Input name="date" type="date" required defaultValue={editingExpense?.date.split('T')[0] || new Date().toLocaleDateString("en-CA")} className="h-14 rounded-xl font-bold" /></FormField>
            </div>
            <FormField label="البيان التفصيلي"><Input name="description" required minLength={3} defaultValue={editingExpense?.description} placeholder="مثال: شراء مستلزمات البار" className="h-12 rounded-xl font-bold" /></FormField>
            
            <div className="grid gap-3 sm:grid-cols-2">
              <AdvancedSelect label="التصنيف *" options={categories.map((category) => ({id: category.id, name: category.name}))} value={formCategory} onChange={setFormCategory} horizontal={false} />
              <AdvancedSelect label="المورد / الجهة" options={vendors.map((vendor) => ({id: vendor.id, name: vendor.name}))} value={formVendor} onChange={setFormVendor} placeholder="بدون مورد" horizontal={false} allowClear />
              <AdvancedSelect label="وسيلة الدفع" options={[{id: "cash", name: "نقدًا (كاش)"}, {id: "card", name: "بطاقة"}, {id: "bank_transfer", name: "تحويل بنكي"}, {id: "wallet", name: "محفظة إلكترونية"}]} value={formPaymentMethod} onChange={setFormPaymentMethod} horizontal={false} />
              <AdvancedSelect label="حالة السداد" options={[{id: "paid", name: "تم الدفع"}, {id: "pending", name: "آجل / لم يُدفع"}]} value={formStatus} onChange={setFormStatus} horizontal={false} />
              <div className="sm:col-span-2"><AdvancedSelect label="مرتبط بموظف" options={users.map((user) => ({id: user.id, name: `${user.firstName} ${user.lastName}`}))} value={formLinkedUser} onChange={setFormLinkedUser} placeholder="غير مرتبط بموظف" horizontal={false} allowClear /></div>
            </div>

            <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3.5">
               <input type="checkbox" name="isRecurring" id="isRecurring" defaultChecked={editingExpense?.isRecurring} className="h-5 w-5 rounded border-slate-300 text-blue-600" />
               <div>
                  <label htmlFor="isRecurring" className="block cursor-pointer text-sm font-black text-slate-800">مصروف دوري متكرر</label>
                  <p className="text-[10px] font-bold text-slate-400">يُستخدم لتصنيف المصروف داخل التحليلات</p>
               </div>
            </div>
            <div className="flex flex-col-reverse gap-2 border-t border-slate-100 pt-4 sm:flex-row">
              <Btn type="button" variant="secondary" className="h-12 flex-1 justify-center rounded-xl" onClick={closeExpenseModal}>إلغاء</Btn>
              <Btn type="submit" className="h-12 flex-[2] justify-center rounded-xl bg-blue-600 font-black hover:bg-blue-700" loading={createExpenseMutation.isPending}>{editingExpense ? "حفظ التعديلات" : "تسجيل المصروف"}</Btn>
            </div>
         </form>
      </Modal>

      {/* Categories & Vendors Modals remain consistent */}
      <Modal isOpen={isCategoryModalOpen} onClose={() => setCategoryModalOpen(false)} title="إدارة الأقسام">
         <form onSubmit={async (e) => {
            e.preventDefault(); const formData = new FormData(e.currentTarget);
            try {
              await api.post("/expenses/categories", Object.fromEntries(formData.entries()));
              await queryClient.invalidateQueries({ queryKey: ["expense-categories"] });
              e.currentTarget.reset(); toast.success("تم حفظ التصنيف");
            } catch (error) { toast.error(getApiError(error, "تعذر حفظ التصنيف")); }
         }} className="space-y-4">
            <div className="flex gap-2"><Input name="name" required placeholder="اسم التصنيف الجديد..." className="h-12 rounded-xl" /><Btn type="submit" className="h-12 rounded-xl px-6 font-bold">إضافة</Btn></div>
         </form>
         <div className="mt-5 grid max-h-64 grid-cols-1 gap-2 overflow-y-auto p-1 sm:grid-cols-2">
            {categories.map((category) => (<div key={category.id} className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-3 text-sm font-black"><span>{category.name}</span><span className="text-[10px] text-slate-400">{category._count?.expenses ?? 0} مصروف</span></div>))}
         </div>
      </Modal>

      <Modal isOpen={isVendorModalOpen} onClose={() => setVendorModalOpen(false)} title="إدارة الموردين">
         <form onSubmit={async (e) => {
            e.preventDefault(); const formData = new FormData(e.currentTarget);
            try {
              await api.post("/expenses/vendors", Object.fromEntries(formData.entries()));
              await queryClient.invalidateQueries({ queryKey: ["vendors"] });
              e.currentTarget.reset(); toast.success("تم حفظ المورد");
            } catch (error) { toast.error(getApiError(error, "تعذر حفظ المورد")); }
         }} className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-2"><FormField label="اسم المورد"><Input name="name" required className="h-12 rounded-xl" /></FormField><FormField label="رقم الهاتف"><Input name="phone" inputMode="tel" className="h-12 rounded-xl" /></FormField></div>
            <Btn type="submit" className="h-12 w-full justify-center rounded-xl font-bold">حفظ المورد</Btn>
         </form>
         <div className="mt-5 max-h-64 space-y-2 overflow-y-auto p-1">
            {vendors.map((vendor) => (<div key={vendor.id} className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-3 text-sm font-bold"><div><p>{vendor.name}</p><p className="mt-0.5 text-[10px] text-slate-400">{vendor._count?.expenses ?? 0} مصروف</p></div><span className="text-xs text-slate-400">{vendor.phone || "بدون هاتف"}</span></div>))}
         </div>
      </Modal>
    </div>
  );
}

function CompactStat({ label, value, tone, icon, isCurrency = true }: { label: string; value: number; tone: "rose" | "emerald" | "blue" | "slate"; icon: ReactNode; isCurrency?: boolean }) {
  const styles = { rose: "bg-rose-50 text-rose-700 border-rose-100", emerald: "bg-emerald-50 text-emerald-700 border-emerald-100", blue: "bg-blue-50 text-blue-700 border-blue-100", slate: "bg-slate-50 text-slate-700 border-slate-100" };
  return (
    <div className={clsx("rounded-xl border p-3.5 sm:p-4", styles[tone])}>
      <div className="mb-2 flex items-center justify-between opacity-80">
         <p className="text-[10px] font-black sm:text-[11px]">{label}</p>
         <div className="p-1.5 bg-white/50 rounded-lg">{icon}</div>
      </div>
      <p className="text-lg font-black leading-none tracking-tight sm:text-xl">{isCurrency ? money(value) : value}</p>
    </div>
  );
}
