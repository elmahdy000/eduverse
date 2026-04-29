"use client";

import { FormEvent, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Package, Plus, Search, Pencil, PowerOff, Power, Eye, EyeOff, RefreshCw, Coffee, Tag, ShoppingBag } from "lucide-react";
import { api } from "../../../lib/api";
import { translateApiError } from "../../../lib/errors";
import { money } from "../../../lib/format";
import { translateProductCategory } from "../../../lib/labels";
import type { Paginated, Product } from "../../../lib/types";
import { Alert, Btn, EmptyState, FormField, Panel, SectionTitle, StatCard } from "../../../components/ui";

const CATEGORIES = [
  { value: "", label: "الكل" },
  { value: "coffee",   label: "☕ قهوة" },
  { value: "tea",      label: " شاي" },
  { value: "juice",    label: "🧃 عصير" },
  { value: "snack",    label: " سناك" },
  { value: "dessert",  label: " حلويات" },
  { value: "sandwich", label: "🥪 ساندويتش" },
  { value: "other",    label: "📦 أخرى" },
];

function ProductCard({ product, onEdit, onToggleActive, onToggleAvail, busy }: {
  product: Product;
  onEdit: () => void;
  onToggleActive: () => void;
  onToggleAvail: () => void;
  busy: boolean;
}) {
  return (
    <div className={`flex flex-col rounded-2xl border bg-white shadow-sm transition ${!product.active ? "opacity-60" : ""} ${!product.availability ? "border-amber-200" : "border-slate-200"}`}>
      <div className="flex items-start justify-between p-4">
        <div className="flex flex-col gap-1 text-right">
          <p className="font-bold text-slate-900">{product.name}</p>
          <p className="text-xs text-slate-500">{translateProductCategory(product.category)}</p>
          {product.description && <p className="text-xs text-slate-400 line-clamp-1">{product.description}</p>}
        </div>
        <div className="text-left">
          <p className="text-lg font-bold text-emerald-700">{money(product.price)}</p>
          <div className="mt-1 flex flex-col gap-1 items-end">
            <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${product.active ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-700"}`}>
              {product.active ? "شغال" : "موقو"}
            </span>
            <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${product.availability ? "bg-blue-100 text-blue-700" : "bg-amber-100 text-amber-700"}`}>
              {product.availability ? "متاح" : "مش متاح"}
            </span>
          </div>
        </div>
      </div>

      <div className="flex gap-1 border-t border-slate-100 p-2">
        <button onClick={onEdit} className="flex flex-1 items-center justify-center gap-1 rounded-lg py-1.5 text-xs font-semibold text-slate-600 transition hover:bg-slate-100">
          <Pencil size={11} /> تعديل
        </button>
        <button onClick={onToggleAvail} disabled={busy} className="flex flex-1 items-center justify-center gap-1 rounded-lg py-1.5 text-xs font-semibold text-amber-600 transition hover:bg-amber-50">
          {product.availability ? <EyeOff size={11} /> : <Eye size={11} />}
          {product.availability ? "اوق الإتاحة" : "اتح الإتاحة"}
        </button>
        <button onClick={onToggleActive} disabled={busy} className={`flex flex-1 items-center justify-center gap-1 rounded-lg py-1.5 text-xs font-semibold transition ${product.active ? "text-rose-600 hover:bg-rose-50" : "text-emerald-600 hover:bg-emerald-50"}`}>
          {product.active ? <PowerOff size={11} /> : <Power size={11} />}
          {product.active ? "إيقا" : "تعيل"}
        </button>
      </div>
    </div>
  );
}

export default function ProductsPage() {
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [catFilter, setCatFilter] = useState("");
  const [activeFilter, setActiveFilter] = useState("true");
  const [message, setMessage] = useState<{ text: string; ok: boolean } | null>(null);

  // New product form
  const [name, setName] = useState("");
  const [category, setCategory] = useState("other");
  const [price, setPrice] = useState("0");
  const [description, setDescription] = useState("");
  const [showForm, setShowForm] = useState(false);

  // Edit form
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [editName, setEditName] = useState("");
  const [editCategory, setEditCategory] = useState("other");
  const [editPrice, setEditPrice] = useState("0");
  const [editDescription, setEditDescription] = useState("");
  const [editAvailability, setEditAvailability] = useState(true);

  const productsQuery = useQuery({
    queryKey: ["products", search, catFilter, activeFilter],
    queryFn: async () => {
      const r = await api.get("/products", {
        params: {
          page: 1, limit: 100,
          q: search || undefined,
          category: catFilter || undefined,
          active: activeFilter === "all" ? undefined : activeFilter === "true",
        },
      });
      return r.data.data as Paginated<Product>;
    },
  });

  const createMutation = useMutation({
    mutationFn: () => api.post("/products", { name, category, price: Number(price), description: description || undefined }),
    onSuccess: () => {
      setName(""); setCategory("other"); setPrice("0"); setDescription(""); setShowForm(false);
      setMessage({ text: "المنتج اتضا بنجاح! ✓", ok: true });
      qc.invalidateQueries({ queryKey: ["products"] });
    },
    onError: (err: unknown) => {
      const m = (err as any)?.response?.data?.message;
      setMessage({ text: translateApiError(m), ok: false });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async () => {
      if (!editingProduct) return;
      await api.put(`/products/${editingProduct.id}`, {
        name: editName,
        category: editCategory,
        price: Number(editPrice),
        description: editDescription || undefined,
        availability: editAvailability,
      });
    },
    onSuccess: () => {
      setEditingProduct(null);
      setMessage({ text: "التعديل اتحظ. ✓", ok: true });
      qc.invalidateQueries({ queryKey: ["products"] });
    },
    onError: (err: unknown) => {
      const m = (err as any)?.response?.data?.message;
      setMessage({ text: translateApiError(m), ok: false });
    },
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, action }: { id: string; action: "deactivate" | "reactivate" }) =>
      api.post(`/products/${id}/${action}`),
    onSuccess: () => { setMessage({ text: "الحالة اتحدّثت.", ok: true }); qc.invalidateQueries({ queryKey: ["products"] }); },
    onError: (err: unknown) => { const m = (err as any)?.response?.data?.message; setMessage({ text: translateApiError(m), ok: false }); },
  });

  const availMutation = useMutation({
    mutationFn: ({ product }: { product: Product }) =>
      api.put(`/products/${product.id}`, { availability: !product.availability }),
    onSuccess: () => { setMessage({ text: "الإتاحة اتغيّرت.", ok: true }); qc.invalidateQueries({ queryKey: ["products"] }); },
    onError: (err: unknown) => { const m = (err as any)?.response?.data?.message; setMessage({ text: translateApiError(m), ok: false }); },
  });

  const products = productsQuery.data?.data ?? [];
  const total = products.length;
  const active = products.filter(p => p.active).length;
  const available = products.filter(p => p.availability && p.active).length;

  function openEdit(product: Product) {
    setEditingProduct(product);
    setEditName(product.name);
    setEditCategory(product.category);
    setEditPrice(String(product.price));
    setEditDescription(product.description ?? "");
    setEditAvailability(product.availability);
  }

  return (
    <div className="space-y-6">
      <SectionTitle
        title="المنتجات"
        subtitle="إدارة منتجات البار — ضي، عدّل، وتحكم ي الإتاحة على طول."
        icon={<ShoppingBag size={20} />}
        action={
          <Btn size="sm" onClick={() => setShowForm(!showForm)} icon={<Plus size={14} />}>
            منتج جديد
          </Btn>
        }
      />

      {message && <Alert tone={message.ok ? "success" : "danger"}>{message.text}</Alert>}

      {/* Stats */}
      <div className="grid gap-3 sm:grid-cols-3">
        <StatCard label="إجمالي المنتجات" value={total} icon={<Package size={18} />} />
        <StatCard label="شغالة" value={active} tone="success" icon={<Power size={18} />} />
        <StatCard label="متاحة الآن" value={available} tone="info" icon={<Coffee size={18} />} sub="نشطة وإتاحتها متوحة" />
      </div>

      {/* Add form */}
      {showForm && (
        <Panel title="إضاة منتج جديد" icon={<Plus size={15} />} action={
          <Btn size="sm" variant="ghost" onClick={() => setShowForm(false)}>✕ إغلاق</Btn>
        }>
          <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); createMutation.mutate(); }}>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <FormField label="اسم المنتج">
                <input value={name} onChange={e => setName(e.target.value)} placeholder="مثال: كابوتشينو" required
                  className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-right text-sm outline-none focus:border-slate-900 focus:ring-2 focus:ring-slate-900/10" />
              </FormField>
              <FormField label="التصني">
                <select value={category} onChange={e => setCategory(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-right text-sm outline-none focus:border-slate-900">
                  {CATEGORIES.filter(c => c.value).map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                </select>
              </FormField>
              <FormField label="السعر (جنيه)">
                <input type="number" min={0} step={0.5} value={price} onChange={e => setPrice(e.target.value)} required
                  className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-right text-sm outline-none focus:border-slate-900 focus:ring-2 focus:ring-slate-900/10" />
              </FormField>
              <FormField label="وص مختصر">
                <input value={description} onChange={e => setDescription(e.target.value)} placeholder="اختياري"
                  className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-right text-sm outline-none focus:border-slate-900 focus:ring-2 focus:ring-slate-900/10" />
              </FormField>
            </div>
            <Btn type="submit" loading={createMutation.isPending} loadingText="جاري الإضاة..." icon={<Plus size={14} />}>
              ضي المنتج
            </Btn>
          </form>
        </Panel>
      )}

      {/* Edit form */}
      {editingProduct && (
        <Panel title={`تعديل: ${editingProduct.name}`} icon={<Pencil size={15} />} action={
          <Btn size="sm" variant="ghost" onClick={() => setEditingProduct(null)}>✕ إغلاق</Btn>
        }>
          <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); updateMutation.mutate(); }}>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <FormField label="الاسم">
                <input value={editName} onChange={e => setEditName(e.target.value)} required
                  className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-right text-sm outline-none focus:border-slate-900 focus:ring-2 focus:ring-slate-900/10" />
              </FormField>
              <FormField label="التصني">
                <select value={editCategory} onChange={e => setEditCategory(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-right text-sm outline-none focus:border-slate-900">
                  {CATEGORIES.filter(c => c.value).map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                </select>
              </FormField>
              <FormField label="السعر">
                <input type="number" min={0} step={0.5} value={editPrice} onChange={e => setEditPrice(e.target.value)} required
                  className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-right text-sm outline-none focus:border-slate-900 focus:ring-2 focus:ring-slate-900/10" />
              </FormField>
              <FormField label="الإتاحة">
                <select value={editAvailability ? "true" : "false"} onChange={e => setEditAvailability(e.target.value === "true")}
                  className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-right text-sm outline-none focus:border-slate-900">
                  <option value="true">متاح ✓</option>
                  <option value="false">مش متاح</option>
                </select>
              </FormField>
            </div>
            <FormField label="الوص">
              <input value={editDescription} onChange={e => setEditDescription(e.target.value)}
                className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-right text-sm outline-none focus:border-slate-900 focus:ring-2 focus:ring-slate-900/10" />
            </FormField>
            <div className="flex gap-2">
              <Btn type="submit" loading={updateMutation.isPending} loadingText="جاري الحظ..." icon={<Pencil size={14} />}>احظ التعديل</Btn>
              <Btn type="button" variant="ghost" onClick={() => setEditingProduct(null)}>إلغاء</Btn>
            </div>
          </form>
        </Panel>
      )}

      {/* Filters */}
      <Panel title="المنتجات" icon={<Search size={15} />} action={
        <div className="flex gap-2">
          <select value={activeFilter} onChange={e => setActiveFilter(e.target.value)}
            className="rounded-xl border border-slate-200 bg-white px-2 py-1.5 text-xs font-medium text-slate-600 outline-none">
            <option value="true">شغالة قط</option>
            <option value="false">موقوة قط</option>
            <option value="all">الكل</option>
          </select>
        </div>
      }>
        {/* Category tabs */}
        <div className="mb-4 flex gap-2 overflow-x-auto pb-1">
          {CATEGORIES.map(c => (
            <button key={c.value} onClick={() => setCatFilter(c.value)}
              className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-semibold transition ${catFilter === c.value ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}>
              {c.label}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative mb-4">
          <Search size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="دور على منتج..."
            className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2 pl-3 pr-9 text-right text-sm outline-none focus:border-slate-900 focus:bg-white" />
        </div>

        {/* Products grid */}
        {productsQuery.isLoading ? (
          <div className="flex justify-center py-10"><RefreshCw size={20} className="animate-spin text-slate-400" /></div>
        ) : products.length === 0 ? (
          <EmptyState icon={<Package size={36} />} title="ميش منتجات" sub="ضي أول منتج من الأعلى." />
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {products.map(product => (
              <ProductCard key={product.id} product={product}
                onEdit={() => openEdit(product)}
                onToggleActive={() => statusMutation.mutate({ id: product.id, action: product.active ? "deactivate" : "reactivate" })}
                onToggleAvail={() => availMutation.mutate({ product })}
                busy={statusMutation.isPending || availMutation.isPending} />
            ))}
          </div>
        )}
      </Panel>
    </div>
  );
}
