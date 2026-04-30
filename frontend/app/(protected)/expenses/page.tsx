"use client";

import { useMemo, useState, useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { 
  Wallet, Plus, Search, ArrowUpRight, ArrowDownRight, TrendingUp, 
  Building2, FileText, Download, Trash2, Tag, CreditCard, Banknote, 
  Clock, RefreshCw, ChevronDown, Pencil, Check
} from "lucide-react";
import { api } from "../../../lib/api";
import { money, dateTime } from "../../../lib/format";
import { 
  Badge, Btn, DataTable, FormField, Input, Modal, Panel, 
  Spinner, EmptyState, statusBadgeTone, Select
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

// --- High-End AdvancedSelect (Horizontal & Large) ---
function AdvancedSelect({ 
  label, options, value, onChange, placeholder = "اختر...", icon, horizontal = true 
}: { 
  label?: string; options: { id: string; name: string; info?: string }[]; 
  value: string; onChange: (id: string) => void; placeholder?: string; icon?: any; horizontal?: boolean 
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
    <div className={clsx("relative w-full", horizontal ? "flex items-center gap-3" : "flex flex-col")} ref={containerRef}>
      {label && <label className="shrink-0 font-bold text-slate-700 text-sm">{label}:</label>}
      
      <div className="relative flex-1">
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className={clsx(
            "flex w-full items-center justify-between gap-3 rounded-xl border bg-white px-5 py-3 text-right text-[15px] transition-all shadow-md font-bold",
            isOpen ? "border-blue-600 ring-4 ring-blue-500/10" : "border-slate-200 hover:border-slate-400"
          )}
        >
          <div className="flex items-center gap-2 overflow-hidden">
            {icon && <span className="text-blue-500 shrink-0">{icon}</span>}
            <span className={clsx("truncate", !selectedOption ? "text-slate-400" : "text-slate-800")}>
              {selectedOption ? selectedOption.name : placeholder}
            </span>
          </div>
          <ChevronDown size={18} className={clsx("text-slate-400 transition-transform duration-300", isOpen && "rotate-180")} />
        </button>

        {isOpen && (
          <div className="absolute z-50 mt-2 w-full animate-in fade-in zoom-in-95 duration-150 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl max-h-[300px] overflow-y-auto p-1.5">
            {options.length === 0 && <div className="p-4 text-center text-xs text-slate-400">لا توجد خيارات</div>}
            {options.map((opt) => (
              <button
                key={opt.id}
                type="button"
                onClick={() => { onChange(opt.id); setIsOpen(false); }}
                className={clsx(
                  "flex w-full items-center justify-between gap-2 rounded-xl px-4 py-3 text-right text-sm transition-colors mb-0.5",
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

  const { data: expensesData, isLoading: isLoadingExpenses, refetch } = useQuery({
    queryKey: ["expenses", filterCategory, filterFrom, filterTo],
    queryFn: async () => {
      const r = await api.get("/expenses", {
        params: { categoryId: filterCategory || undefined, fromDate: filterFrom || undefined, toDate: filterTo || undefined, limit: 500 },
      });
      return r.data.data;
    },
  });

  const { data: categories } = useQuery({
    queryKey: ["expense-categories"],
    queryFn: async () => {
      const r = await api.get("/expenses/categories");
      return r.data;
    },
  });

  const { data: vendors } = useQuery({
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

  const { data: users } = useQuery({
    queryKey: ["users-list"],
    queryFn: async () => {
      const r = await api.get("/users");
      const responseData = r.data.data;
      return Array.isArray(responseData) ? responseData : responseData?.data || [];
    },
  });

  const createExpenseMutation = useMutation({
    mutationFn: (data: any) => editingExpense ? api.patch(`/expenses/${editingExpense.id}`, data) : api.post("/expenses", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["expenses"] });
      queryClient.invalidateQueries({ queryKey: ["financial-summary"] });
      setExpenseModalOpen(false);
      setEditingExpense(null);
      resetForm();
      toast.success(editingExpense ? "تم التحديث" : "تم الحفظ بنجاح");
    },
  });

  const deleteExpenseMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/expenses/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["expenses"] });
      queryClient.invalidateQueries({ queryKey: ["financial-summary"] });
      toast.success("تم الحذف بنجاح");
    },
  });

  const resetForm = () => {
    setFormCategory(""); setFormVendor(""); setFormLinkedUser(""); setFormPaymentMethod("cash"); setFormStatus("paid");
  };

  useEffect(() => {
    if (editingExpense) {
      setFormCategory(editingExpense.category.id);
      setFormVendor(editingExpense.vendor?.id || "");
      setFormLinkedUser(editingExpense.linkedUser?.id || "");
      setFormPaymentMethod(editingExpense.paymentMethod);
      setFormStatus(editingExpense.status);
    } else { resetForm(); }
  }, [editingExpense, isExpenseModalOpen]);

  const filteredExpenses = useMemo(() => {
    const list = expensesData?.data ?? [];
    if (!searchTerm.trim()) return list;
    const q = searchTerm.toLowerCase();
    return list.filter((e: Expense) => 
      e.description.toLowerCase().includes(q) || (e.vendor?.name ?? "").toLowerCase().includes(q) || e.category.name.toLowerCase().includes(q)
    );
  }, [expensesData, searchTerm]);

  const headers = ["التاريخ", "البيان", "التصنيف", "المبلغ", "الوسيلة", "الحالة", ""];
  const rows = filteredExpenses.map((e: Expense) => [
    <div key={e.id} className="text-xs text-slate-400 font-bold">{dateTime(e.date).split(',')[0]}</div>,
    <div key={e.id + "desc"}>
      <div className="font-bold text-slate-800 text-sm">{e.description}</div>
      <div className="text-[10px] text-slate-400 mt-1">{e.vendor?.name || 'مورد عام'} • {e.recordedByUser.firstName}</div>
    </div>,
    <Badge key={e.id + "cat"} tone="neutral" className="px-3 py-1 text-[11px] font-bold">{e.category.name}</Badge>,
    <div key={e.id + "amt"} className="text-left font-black text-rose-600 text-base">{money(e.amount)}</div>,
    <div key={e.id + "pm"} className="flex items-center gap-1.5 text-xs text-slate-600 font-bold">
      {e.paymentMethod === 'cash' ? <Banknote size={14} /> : <CreditCard size={14} />}
      {e.paymentMethod === 'cash' ? 'نقدي' : 'إلكتروني'}
    </div>,
    <div key={e.id + "st"}><Badge tone={statusBadgeTone(e.status)} className="px-3 py-1 text-[11px] font-black">{e.status === 'paid' ? 'تم السداد' : 'مديونية'}</Badge></div>,
    <div key={e.id + "act"} className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
      <button className="p-2 text-slate-400 hover:text-blue-600 transition-colors" onClick={() => { setEditingExpense(e); setExpenseModalOpen(true); }}><Pencil size={16} /></button>
      <button className="p-2 text-slate-400 hover:text-rose-600 transition-colors" onClick={() => { if(confirm('حذف هذا السجل؟')) deleteExpenseMutation.mutate(e.id); }}><Trash2 size={16} /></button>
    </div>
  ]);

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm overflow-hidden relative">
        <div className="absolute top-0 right-0 w-1 h-full bg-blue-600" />
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1 text-blue-600 font-black">
               <Wallet size={18} />
               <span className="text-[10px] uppercase tracking-widest">إدارة المصروفات والخزينة</span>
            </div>
            <h1 className="text-2xl font-bold text-slate-900">سجل المعاملات المالية</h1>
          </div>
          <div className="flex gap-2">
            <Btn variant="secondary" size="sm" onClick={() => setVendorModalOpen(true)} icon={<Building2 size={16} />}>الموردين</Btn>
            <Btn variant="secondary" size="sm" onClick={() => setCategoryModalOpen(true)} icon={<Tag size={16} />}>التصنيفات</Btn>
            <Btn variant="primary" size="sm" onClick={() => { setEditingExpense(null); setExpenseModalOpen(true); }} icon={<Plus size={18} />}>إضافة مصروف</Btn>
          </div>
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <CompactStat label="إجمالي المصروفات" value={summary?.expensesTotal ?? 0} tone="rose" icon={<ArrowDownRight size={16} />} />
          <CompactStat label="إجمالي الإيرادات" value={summary?.revenueTotal ?? 0} tone="emerald" icon={<ArrowUpRight size={16} />} />
          <CompactStat label="صافي الربح" value={summary?.netProfit ?? 0} tone="blue" icon={<TrendingUp size={16} />} />
          <CompactStat label="العمليات المنفذة" value={expensesData?.total || 0} tone="slate" icon={<FileText size={16} />} isCurrency={false} />
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_380px]">
        <div className="space-y-4">
          <Panel className="flex items-center gap-4 p-4 bg-white shadow-sm border-slate-200">
            <div className="relative flex-1">
              <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
              <input type="text" placeholder="بحث في السجل..." className="w-full bg-slate-50 border-none rounded-xl pr-11 py-2.5 text-sm font-bold focus:ring-1 focus:ring-blue-500" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
            </div>
            <div className="hidden sm:flex items-center gap-3">
               <input type="date" className="border rounded-xl text-xs py-2 px-3 focus:ring-1 outline-none text-slate-700 font-bold shadow-sm" value={filterFrom} onChange={(e) => setFilterFrom(e.target.value)} />
               <input type="date" className="border rounded-xl text-xs py-2 px-3 focus:ring-1 outline-none text-slate-700 font-bold shadow-sm" value={filterTo} onChange={(e) => setFilterTo(e.target.value)} />
            </div>
            <button className="p-2.5 text-slate-400 hover:text-blue-600 transition-colors" onClick={() => refetch()}><RefreshCw size={18} /></button>
          </Panel>

          <Panel className="!p-0 overflow-hidden shadow-lg border-slate-200">
            <div className="p-5 border-b flex justify-between items-center bg-slate-50/80">
               <h2 className="text-base font-bold text-slate-800">تفاصيل السجل المالي</h2>
               <div className="w-[450px]">
                 <AdvancedSelect 
                  label="فلترة القسم"
                  horizontal={true}
                  options={[{id: "", name: "كل الأقسام"}, ...(categories || []).map((c: any) => ({id: c.id, name: c.name}))]} 
                  value={filterCategory} 
                  onChange={setFilterCategory}
                 />
               </div>
            </div>
            <div className="p-3"><DataTable headers={headers} rows={rows} selectable={false} /></div>
          </Panel>
        </div>

        <div className="space-y-6">
          <Panel title="توزيع التكاليف" icon={<TrendingUp size={18} className="text-rose-500" />}>
             <div className="space-y-5 mt-4">
                {summary?.breakdown?.map((item: any) => (
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
             </div>
          </Panel>

          <div className="rounded-3xl bg-gradient-to-br from-blue-700 to-indigo-900 p-8 text-white shadow-xl relative overflow-hidden group">
             <div className="absolute -top-10 -right-10 opacity-10 group-hover:scale-125 transition-transform duration-1000"><Download size={150} /></div>
             <div className="relative z-10">
                <h3 className="text-xl font-bold mb-2">تصدير التقارير</h3>
                <p className="text-xs text-blue-100 mb-6 font-medium leading-relaxed">يمكنك طباعة كشف حساب كامل للمصروفات خلال الفترة المحددة لمراجعتها ورقياً.</p>
                <Btn variant="secondary" className="w-full bg-white text-blue-900 border-none hover:bg-blue-50 font-black h-12 rounded-2xl" onClick={() => window.print()}>تحميل / طباعة التقرير</Btn>
             </div>
          </div>
        </div>
      </div>

      <Modal isOpen={isExpenseModalOpen} onClose={() => {setExpenseModalOpen(false); setEditingExpense(null);}} title={editingExpense ? "تعديل بيانات المصروف" : "تسجيل عملية صرف جديدة"} size="lg">
         <form onSubmit={(e) => {
            e.preventDefault(); const formData = new FormData(e.currentTarget); const rawData = Object.fromEntries(formData.entries());
            createExpenseMutation.mutate({ amount: Number(rawData.amount), date: new Date(rawData.date as string).toISOString(), description: rawData.description as string, categoryId: formCategory, vendorId: formVendor || undefined, paymentMethod: formPaymentMethod, linkedUserId: formLinkedUser || undefined, isRecurring: rawData.isRecurring === 'on', status: formStatus });
         }} className="space-y-6">
            <div className="grid gap-6 sm:grid-cols-2">
              <FormField label="المبلغ (ج.م)"><Input name="amount" type="number" step="0.01" required defaultValue={editingExpense?.amount} placeholder="0.00" className="h-16 text-3xl font-black text-blue-600 text-center bg-blue-50/30 border-blue-100 rounded-2xl" /></FormField>
              <FormField label="تاريخ المعاملة"><Input name="date" type="date" required defaultValue={editingExpense?.date.split('T')[0] || new Date().toISOString().split('T')[0]} className="h-16 rounded-2xl font-bold" /></FormField>
            </div>
            <FormField label="البيان التفصيلي"><Input name="description" required defaultValue={editingExpense?.description} placeholder="مثلاً: شراء بن برازيلي، فاتورة الكهرباء..." className="h-14 rounded-2xl font-bold" /></FormField>
            
            <div className="grid gap-4">
              <AdvancedSelect label="القسم المالي" options={(categories || []).map((c: any) => ({id: c.id, name: c.name}))} value={formCategory} onChange={setFormCategory} horizontal={true} />
              <AdvancedSelect label="المورد / الجهة" options={(vendors || []).map((v: any) => ({id: v.id, name: v.name}))} value={formVendor} onChange={setFormVendor} placeholder="مورد عام" horizontal={true} />
              <AdvancedSelect label="وسيلة الدفع" options={[{id: "cash", name: "نقداً (كاش)"}, {id: "card", name: "فيزا"}, {id: "bank_transfer", name: "تحويل بنكي"}]} value={formPaymentMethod} onChange={setFormPaymentMethod} horizontal={true} />
              <AdvancedSelect label="حالة السداد" options={[{id: "paid", name: "تم الدفع"}, {id: "pending", name: "مديونية / آجل"}]} value={formStatus} onChange={setFormStatus} horizontal={true} />
              <AdvancedSelect label="ارتباط بموظف" options={(users || []).map((u: any) => ({id: u.id, name: `${u.firstName} ${u.lastName}`}))} value={formLinkedUser} onChange={setFormLinkedUser} placeholder="غير مرتبط" horizontal={true} />
            </div>

            <div className="flex items-center gap-4 p-5 bg-slate-50 rounded-[2rem] border border-slate-200">
               <input type="checkbox" name="isRecurring" id="isRecurring" defaultChecked={editingExpense?.isRecurring} className="h-6 w-6 rounded-lg border-slate-300 text-blue-600" />
               <div>
                  <label htmlFor="isRecurring" className="block text-sm font-black text-slate-800 cursor-pointer">تصنيف كمصروف دوري متكرر</label>
                  <p className="text-[10px] text-slate-400 font-bold">سيتم تذكيرك بهذا المصروف شهرياً في التقارير التحليلية</p>
               </div>
            </div>
            <Btn type="submit" className="w-full h-16 font-black text-lg bg-blue-600 hover:bg-blue-700 shadow-xl rounded-2xl" loading={createExpenseMutation.isPending}>{editingExpense ? "تأكيد التعديلات" : "حفظ في السجل المالي"}</Btn>
         </form>
      </Modal>

      {/* Categories & Vendors Modals remain consistent */}
      <Modal isOpen={isCategoryModalOpen} onClose={() => setCategoryModalOpen(false)} title="إدارة الأقسام">
         <form onSubmit={(e) => {
            e.preventDefault(); const formData = new FormData(e.currentTarget);
            api.post("/expenses/categories", Object.fromEntries(formData.entries())).then(() => { queryClient.invalidateQueries({ queryKey: ["expense-categories"] }); (e.target as HTMLFormElement).reset(); toast.success("تم الحفظ"); });
         }} className="space-y-4">
            <div className="flex gap-2"><Input name="name" required placeholder="اسم القسم الجديد..." className="h-14 rounded-2xl" /><Btn type="submit" className="px-8 h-14 rounded-2xl font-bold">إضافة</Btn></div>
         </form>
         <div className="mt-6 grid grid-cols-2 gap-3 max-h-52 overflow-y-auto p-1">
            {categories?.map((c: any) => (<div key={c.id} className="bg-white border border-slate-100 p-4 rounded-2xl text-[13px] font-black text-center shadow-sm">{c.name}</div>))}
         </div>
      </Modal>

      <Modal isOpen={isVendorModalOpen} onClose={() => setVendorModalOpen(false)} title="إدارة الموردين">
         <form onSubmit={(e) => {
            e.preventDefault(); const formData = new FormData(e.currentTarget);
            api.post("/expenses/vendors", Object.fromEntries(formData.entries())).then(() => { queryClient.invalidateQueries({ queryKey: ["vendors"] }); (e.target as HTMLFormElement).reset(); toast.success("تم التسجيل"); });
         }} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2"><FormField label="اسم المورد"><Input name="name" required className="h-14 rounded-2xl" /></FormField><FormField label="رقم الهاتف"><Input name="phone" className="h-14 rounded-2xl" /></FormField></div>
            <Btn type="submit" className="w-full h-14 rounded-2xl font-bold">حفظ المورد</Btn>
         </form>
         <div className="mt-6 space-y-2 max-h-52 overflow-y-auto p-1">
            {vendors?.map((v: any) => (<div key={v.id} className="flex justify-between items-center p-4 bg-white border rounded-2xl shadow-sm text-sm font-bold"><span>{v.name}</span><span className="text-slate-400">{v.phone}</span></div>))}
         </div>
      </Modal>
    </div>
  );
}

function CompactStat({ label, value, tone, icon, isCurrency = true }: { label: string; value: number; tone: "rose" | "emerald" | "blue" | "slate"; icon: any; isCurrency?: boolean }) {
  const styles = { rose: "bg-rose-50 text-rose-600 border-rose-100 shadow-rose-100/50", emerald: "bg-emerald-50 text-emerald-600 border-emerald-100 shadow-emerald-100/50", blue: "bg-blue-50 text-blue-600 border-blue-100 shadow-blue-100/50", slate: "bg-slate-50 text-slate-600 border-slate-100 shadow-slate-100/50" };
  return (
    <div className={clsx("rounded-[2rem] p-5 border shadow-lg transition-transform hover:scale-[1.02]", styles[tone])}>
      <div className="flex items-center justify-between mb-2 opacity-80">
         <p className="text-[11px] font-black uppercase tracking-[0.1em]">{label}</p>
         <div className="p-1.5 bg-white/50 rounded-lg">{icon}</div>
      </div>
      <p className="text-2xl font-black tracking-tight leading-none">{isCurrency ? money(value) : value}</p>
    </div>
  );
}
