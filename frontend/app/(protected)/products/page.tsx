"use client";

import { FormEvent, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Package, Plus, Search, Pencil, PowerOff, Power, Eye, EyeOff, RefreshCw, Coffee, Tag, ShoppingBag, Leaf, CupSoda, Snowflake, Flame, IceCream, Milk, Cherry, GlassWater, Soup, PlusCircle, Settings2, Trash } from "lucide-react";
import { api } from "../../../lib/api";
import { translateApiError } from "../../../lib/errors";
import { money } from "../../../lib/format";
import { translateProductCategory } from "../../../lib/labels";
import type { Paginated, Product } from "../../../lib/types";
import { Alert, Btn, EmptyState, FormField, Panel, SectionTitle, StatCard, CardSkeleton } from "../../../components/ui";
import { useAuthStore } from "../../../store/auth-store";

const CATEGORIES = [
  { value: "", label: "الكل" },
  { value: "coffee", label: "قهوة" },
  { value: "tea", label: "شاي" },
  { value: "frappe", label: "فرابيه" },
  { value: "cold-coffee", label: "قهوة مثلجة" },
  { value: "hot-drinks", label: "مشروبات ساخنة" },
  { value: "frappuccino", label: "فرابوتشينو" },
  { value: "milk-shake", label: "ميلك شيك" },
  { value: "smoothies", label: "سموذي" },
  { value: "yougert", label: "زبادي" },
  { value: "cans", label: "كانز (معلبات)" },
  { value: "water", label: "مياه" },
  { value: "juice", label: "عصير" },
  { value: "mocktails", label: "موكتيل" },
  { value: "indomy", label: "إندومي" },
  { value: "boba-drinks", label: "بوبا" },
  { value: "snack", label: "سناكس" },
  { value: "dessert", label: "حلويات" },
  { value: "sandwich", label: "ساندويتش" },
  { value: "additions", label: "إضافات" },
];

// تصنيفات التلاجة/الساقعة/المعلبات — بتتباع بسعرها الكامل (مستثناة من خصم owner/staff)
const FRIDGE_CATEGORIES = ["cans", "water", "juice"];

const categoryIcons: Record<string, React.ComponentType<{ size?: number; className?: string }>> = {
  coffee: Coffee,
  tea: Leaf,
  frappe: CupSoda,
  "cold-coffee": Snowflake,
  "hot-drinks": Flame,
  frappuccino: IceCream,
  "milk-shake": Milk,
  smoothies: Cherry,
  yougert: CupSoda,
  cans: CupSoda,
  water: GlassWater,
  juice: Cherry,
  mocktails: GlassWater,
  indomy: Soup,
  "boba-drinks": CupSoda,
  snack: ShoppingBag,
  dessert: IceCream,
  sandwich: Soup,
  additions: PlusCircle,
};


function ProductCard({ product, onEdit, onRecipe, onToggleActive, onToggleAvail, busy, canManage }: {
  product: Product;
  onEdit: () => void;
  onRecipe: () => void;
  onToggleActive: () => void;
  onToggleAvail: () => void;
  busy: boolean;
  canManage: boolean;
}) {
  const CategoryIcon = categoryIcons[product.category] ?? Package;
  return (
    <div className={`flex flex-col rounded-2xl border bg-white shadow-sm transition ${!product.active ? "opacity-60" : ""} ${!product.availability ? "border-amber-200" : "border-slate-200"}`}>
      <div className="p-2">
        <div className="aspect-video w-full overflow-hidden rounded-xl bg-slate-50">
          {product.imageUrl ? (
            <img src={product.imageUrl} alt={product.name} className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 text-slate-300">
              <CategoryIcon size={32} />
            </div>
          )}
        </div>
      </div>
      <div className="flex items-start justify-between p-4 pt-0">
        <div className="flex flex-col gap-1 text-right">
          <p className="font-bold text-slate-900">{product.name}</p>
          <p className="text-xs text-slate-500">{translateProductCategory(product.category)}</p>
          {product.description && <p className="text-xs text-slate-400 line-clamp-1">{product.description}</p>}
        </div>
        <div className="text-left">
          <p className="text-lg font-bold text-emerald-700">{money(product.price)}</p>
          <div className="mt-1 flex flex-col gap-1 items-end">
            <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${product.active ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-700"}`}>
              {product.active ? "شغال" : "موقوف"}
            </span>
            <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${product.availability ? "bg-blue-100 text-blue-700" : "bg-amber-100 text-amber-700"}`}>
              {product.availability ? "متاح" : "مش متاح"}
            </span>
            {product.isFridge && (
              <span className="rounded-full bg-sky-100 text-sky-700 px-2 py-0.5 text-[10px] font-bold">
                تلاجة
              </span>
            )}
            {product.isBakery && (
              <span className="rounded-full bg-purple-100 text-purple-700 px-2 py-0.5 text-[10px] font-bold">
                بيكرى
              </span>
            )}
          </div>
        </div>
      </div>

      {canManage && (
        <div className="grid grid-cols-2 gap-1 border-t border-slate-100 p-2">
          <button onClick={onEdit} className="flex items-center justify-center gap-1 rounded-lg py-1.5 text-xs font-semibold text-slate-600 transition hover:bg-slate-100">
            <Pencil size={11} /> تعديل
          </button>
          <button onClick={onRecipe} className="flex items-center justify-center gap-1 rounded-lg py-1.5 text-xs font-semibold text-violet-600 transition hover:bg-violet-50">
            <Settings2 size={11} /> الوصفة
          </button>
          <button onClick={onToggleAvail} disabled={busy} className="flex items-center justify-center gap-1 rounded-lg py-1.5 text-xs font-semibold text-amber-600 transition hover:bg-amber-50">
            {product.availability ? <EyeOff size={11} /> : <Eye size={11} />}
            {product.availability ? "إيقاف الإتاحة" : "إتاحة"}
          </button>
          <button onClick={onToggleActive} disabled={busy} className={`flex items-center justify-center gap-1 rounded-lg py-1.5 text-xs font-semibold transition ${product.active ? "text-rose-600 hover:bg-rose-50" : "text-emerald-600 hover:bg-emerald-50"}`}>
            {product.active ? <PowerOff size={11} /> : <Power size={11} />}
            {product.active ? "إيقاف" : "تفعيل"}
          </button>
        </div>
      )}
    </div>
  );
}

export default function ProductsPage() {
  const qc = useQueryClient();
  const { user } = useAuthStore();
  // الإدارة (إضافة/تعديل/حالة/وصفة) للمالك ومدير العمليات وموظف الاستقبال.
  // الباريستا يشوف المنيو والأسعار للعرض فقط (صلاحيته read).
  const canManage = user?.role?.name === "Owner" || user?.role?.name === "Operations Manager" || user?.role?.name === "Receptionist";
  const [search, setSearch] = useState("");
  const [catFilter, setCatFilter] = useState("");
  const [activeFilter, setActiveFilter] = useState("true");
  const [message, setMessage] = useState<{ text: string; ok: boolean } | null>(null);

  // New product form
  const [name, setName] = useState("");
  const [category, setCategory] = useState("coffee");
  const [price, setPrice] = useState("0");
  const [costPrice, setCostPrice] = useState("0");
  const [description, setDescription] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [isFridge, setIsFridge] = useState(false);
  const [isBakery, setIsBakery] = useState(false);
  const [showForm, setShowForm] = useState(false);

  // Edit form
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [editName, setEditName] = useState("");
  const [editCategory, setEditCategory] = useState("coffee");
  const [editPrice, setEditPrice] = useState("0");
  const [editCostPrice, setEditCostPrice] = useState("0");
  const [editDescription, setEditDescription] = useState("");
  const [editImageUrl, setEditImageUrl] = useState("");
  const [editAvailability, setEditAvailability] = useState(true);
  const [editIsFridge, setEditIsFridge] = useState(false);
  const [editIsBakery, setEditIsBakery] = useState(false);

  // Recipe State
  const [recipeProduct, setRecipeProduct] = useState<Product | null>(null);
  const [recipeItems, setRecipeItems] = useState<{ inventoryItemId: string; quantity: number; name?: string; unit?: string }[]>([]);
  const [recipeLoading, setRecipeLoading] = useState(false);
  const [inventoryItems, setInventoryItems] = useState<any[]>([]);
  const [selectedItemId, setSelectedItemId] = useState("");
  const [selectedQty, setSelectedQty] = useState("");
  const [submittingRecipe, setSubmittingRecipe] = useState(false);

  const openRecipeModal = async (product: Product) => {
    setRecipeProduct(product);
    setRecipeLoading(true);
    setSelectedItemId("");
    setSelectedQty("");
    try {
      if (inventoryItems.length === 0) {
        const invRes = await api.get("/inventory/items");
        setInventoryItems(invRes.data);
      }
      const recipeRes = await api.get(`/inventory/products/${product.id}/recipe`);
      const mapped = recipeRes.data.map((item: any) => ({
        inventoryItemId: item.inventoryItemId,
        quantity: Number(item.quantity),
        name: item.inventoryItem?.name,
        unit: item.inventoryItem?.unit,
      }));
      setRecipeItems(mapped);
    } catch (err) {
      console.error(err);
      setMessage({ text: "فشل تحميل مكونات المنتج.", ok: false });
    } finally {
      setRecipeLoading(false);
    }
  };

  const handleAddRecipeItem = () => {
    if (!selectedItemId || !selectedQty || isNaN(Number(selectedQty)) || Number(selectedQty) <= 0) {
      setMessage({ text: "برجاء إدخال كمية صحيحة.", ok: false });
      return;
    }
    const alreadyExists = recipeItems.some(i => i.inventoryItemId === selectedItemId);
    if (alreadyExists) {
      setMessage({ text: "هذا المكون مضاف بالفعل في الوصفة.", ok: false });
      return;
    }
    const item = inventoryItems.find(i => i.id === selectedItemId);
    if (!item) return;

    setRecipeItems([...recipeItems, {
      inventoryItemId: selectedItemId,
      quantity: Number(selectedQty),
      name: item.name,
      unit: item.unit
    }]);
    setSelectedItemId("");
    setSelectedQty("");
  };

  const handleRemoveRecipeItem = (itemId: string) => {
    setRecipeItems(recipeItems.filter(i => i.inventoryItemId !== itemId));
  };

  const handleSaveRecipe = async () => {
    if (!recipeProduct) return;
    setSubmittingRecipe(true);
    try {
      await api.post(`/inventory/products/${recipeProduct.id}/recipe`, {
        items: recipeItems.map(item => ({
          inventoryItemId: item.inventoryItemId,
          quantity: Number(item.quantity),
        })),
      });
      setMessage({ text: "تم تحديث وصفة المنتج بنجاح. ✓", ok: true });
      setRecipeProduct(null);
    } catch (err) {
      console.error(err);
      setMessage({ text: "فشل حفظ الوصفة، حاول مرة أخرى.", ok: false });
    } finally {
      setSubmittingRecipe(false);
    }
  };

  const productsQuery = useQuery({
    queryKey: ["products", search, catFilter, activeFilter],
    queryFn: async () => {
      const r = await api.get("/products", {
        params: {
          page: 1, limit: 100,
          q: search.trim() || undefined,
          category: catFilter !== "" ? catFilter : undefined,
          active: activeFilter === "all" ? undefined : activeFilter === "true",
        },
      });
      return r.data.data as Paginated<Product>;
    },
    staleTime: 0,
  });

  const createMutation = useMutation({
    mutationFn: () => api.post("/products", {
      name,
      category,
      price: Number(price),
      costPrice: Number(costPrice) || 0,
      description: description || undefined,
      imageUrl: imageUrl || undefined,
      isFridge,
      isBakery,
    }),
    onSuccess: () => {
      setName(""); setCategory("coffee"); setPrice("0"); setCostPrice("0"); setDescription(""); setImageUrl(""); setIsFridge(false); setIsBakery(false); setShowForm(false);
      setMessage({ text: "تم إضافة المنتج بنجاح! ✓", ok: true });
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
      return await api.put(`/products/${editingProduct.id}`, {
        name: editName,
        category: editCategory,
        price: Number(editPrice),
        costPrice: Number(editCostPrice) || 0,
        description: editDescription || undefined,
        imageUrl: editImageUrl || undefined,
        availability: editAvailability,
        isFridge: editIsFridge,
        isBakery: editIsBakery,
      });
    },
    onSuccess: () => {
      setEditingProduct(null);
      setMessage({ text: "تم حفظ التعديلات بنجاح. ✓", ok: true });
      qc.invalidateQueries({ queryKey: ["products"] });
      qc.refetchQueries({ queryKey: ["products"] });
    },
    onError: (err: unknown) => {
      const m = (err as any)?.response?.data?.message;
      setMessage({ text: translateApiError(m), ok: false });
    },
    onSettled: () => {
      // Always reset loading state
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
    // Reset mutation state before opening (prevents stuck loading button)
    updateMutation.reset();
    setEditingProduct(product);
    setEditName(product.name);
    // Ensure category is always set from the actual product data
    setEditCategory(product.category ?? "coffee");
    setEditPrice(String(product.price));
    setEditCostPrice(String(product.costPrice ?? 0));
    setEditDescription(product.description ?? "");
    setEditImageUrl(product.imageUrl ?? "");
    setEditAvailability(product.availability ?? true);
    setEditIsFridge(product.isFridge ?? false);
    setEditIsBakery(product.isBakery ?? false);
  }

  return (
    <div className="space-y-6">
      <SectionTitle
        title="المنتجات"
        subtitle="إدارة منتجات البار — أضف، عدّل، وتحكم في الإتاحة على طول."
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
        <StatCard label="متاحة الآن" value={available} tone="info" icon={<Coffee size={18} />} sub="نشطة وإتاحتها مفتوحة" />
      </div>

      {/* Add form */}
      {showForm && (
        <Panel title="إضافة منتج جديد" icon={<Plus size={15} />} action={
          <Btn size="sm" variant="ghost" onClick={() => setShowForm(false)}>✕ إغلاق</Btn>
        }>
          <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); createMutation.mutate(); }}>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <FormField label="اسم المنتج">
                <input value={name} onChange={e => setName(e.target.value)} placeholder="مثال: كابوتشينو" required
                  className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-right text-sm outline-none focus:border-slate-900 focus:ring-2 focus:ring-slate-900/10" />
              </FormField>
              <FormField label="التصنيف">
                <select value={category} onChange={e => {
                  const val = e.target.value;
                  setCategory(val);
                  // لو التصنيف تلاجة/معلبات، أشّر "منتج تلاجة" تلقائياً (يقدر يلغيه يدوي)
                  if (FRIDGE_CATEGORIES.includes(val)) setIsFridge(true);
                }}
                  className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-right text-sm outline-none focus:border-slate-900">
                  {CATEGORIES.filter(c => c.value).map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                </select>
              </FormField>
              <FormField label="السعر (جنيه)">
                <input type="text" inputMode="decimal" value={price} onChange={e => setPrice(e.target.value)} required
                  className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-right text-sm outline-none focus:border-slate-900 focus:ring-2 focus:ring-slate-900/10" />
              </FormField>
              <FormField label="سعر التكلفة (الوارد)">
                <input type="text" inputMode="decimal" value={costPrice} onChange={e => setCostPrice(e.target.value)}
                  placeholder="لحساب الربحية"
                  className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-right text-sm outline-none focus:border-slate-900 focus:ring-2 focus:ring-slate-900/10" />
              </FormField>
              <FormField label="وصف مختصر">
                <input value={description} onChange={e => setDescription(e.target.value)} placeholder="اختياري"
                  className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-right text-sm outline-none focus:border-slate-900 focus:ring-2 focus:ring-slate-900/10" />
              </FormField>
              <FormField label="رابط الصورة">
                <input value={imageUrl} onChange={e => setImageUrl(e.target.value)} placeholder="https://..."
                  className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-right text-sm outline-none focus:border-slate-900 focus:ring-2 focus:ring-slate-900/10" />
              </FormField>
            </div>

            <div className="flex flex-wrap gap-6 py-2 border-t border-slate-100" dir="rtl">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={isFridge}
                  onChange={(e) => setIsFridge(e.target.checked)}
                  className="h-4 w-4 rounded border-slate-300 text-slate-900 focus:ring-slate-900"
                />
                <span className="text-sm font-bold text-slate-700">منتج تلاجة (بيبسي، ماية، معلبات)</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={isBakery}
                  onChange={(e) => setIsBakery(e.target.checked)}
                  className="h-4 w-4 rounded border-slate-300 text-slate-900 focus:ring-slate-900"
                />
                <span className="text-sm font-bold text-slate-700">منتج بيكرى (مخبوزات، جاهز)</span>
              </label>
            </div>

            <Btn type="submit" loading={createMutation.isPending} loadingText="جاري الإضافة..." icon={<Plus size={14} />}>
              ضيف المنتج
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
              <FormField label="التصنيف">
                <select value={editCategory} onChange={e => setEditCategory(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-right text-sm outline-none focus:border-slate-900">
                  {CATEGORIES.filter(c => c.value).map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                </select>
              </FormField>
              <FormField label="السعر">
                <input type="text" inputMode="decimal" value={editPrice} onChange={e => setEditPrice(e.target.value)} required
                  className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-right text-sm outline-none focus:border-slate-900 focus:ring-2 focus:ring-slate-900/10" />
              </FormField>
              <FormField label="سعر التكلفة (الوارد)">
                <input type="text" inputMode="decimal" value={editCostPrice} onChange={e => setEditCostPrice(e.target.value)}
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
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField label="الوصف">
                <input value={editDescription} onChange={e => setEditDescription(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-right text-sm outline-none focus:border-slate-900 focus:ring-2 focus:ring-slate-900/10" />
              </FormField>
              <FormField label="رابط الصورة">
                <input value={editImageUrl} onChange={e => setEditImageUrl(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-right text-sm outline-none focus:border-slate-900 focus:ring-2 focus:ring-slate-900/10" />
              </FormField>
            </div>

            <div className="flex flex-wrap gap-6 py-2 border-t border-slate-100" dir="rtl">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={editIsFridge}
                  onChange={(e) => setEditIsFridge(e.target.checked)}
                  className="h-4 w-4 rounded border-slate-300 text-slate-900 focus:ring-slate-900"
                />
                <span className="text-sm font-bold text-slate-700">منتج تلاجة (بيبسي، ماية، معلبات)</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={editIsBakery}
                  onChange={(e) => setEditIsBakery(e.target.checked)}
                  className="h-4 w-4 rounded border-slate-300 text-slate-900 focus:ring-slate-900"
                />
                <span className="text-sm font-bold text-slate-700">منتج بيكرى (مخبوزات، جاهز)</span>
              </label>
            </div>

            <div className="flex gap-2">
              <Btn type="submit" loading={updateMutation.isPending} loadingText="جاري الحفظ..." icon={<Pencil size={14} />}>احفظ التعديل</Btn>
              <Btn type="button" variant="ghost" onClick={() => setEditingProduct(null)}>إلغاء</Btn>
            </div>
          </form>
        </Panel>
      )}

      {/* Recipe management form */}
      {recipeProduct && (
        <Panel title={`إدارة مكونات وصفة المنتج: ${recipeProduct.name}`} icon={<Settings2 size={15} />} action={
          <Btn size="sm" variant="ghost" onClick={() => setRecipeProduct(null)}>✕ إغلاق</Btn>
        }>
          {recipeLoading ? (
            <div className="py-6 text-center text-slate-500 font-semibold">جاري تحميل المكونات والوصفة...</div>
          ) : (
            <div className="space-y-6">
              {/* Add Ingredient form block */}
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200">
                <p className="text-sm font-bold text-slate-800 mb-3">إضافة مكون للوصفة</p>
                <div className="grid gap-3 sm:grid-cols-3 items-end">
                  <FormField label="الصنف في المخزن">
                    <select value={selectedItemId} onChange={e => setSelectedItemId(e.target.value)}
                      className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-right text-sm outline-none focus:border-slate-900">
                      <option value="">اختر صنف مخزني...</option>
                      {inventoryItems.map(item => (
                        <option key={item.id} value={item.id}>
                          {item.name} ({item.unit}) - رصيد: {Number(item.currentStock)}
                        </option>
                      ))}
                    </select>
                  </FormField>
                  <FormField label="الكمية المطلوبة (لكل منتج)">
                    <div className="relative">
                      <input type="text" inputMode="decimal" value={selectedQty} onChange={e => setSelectedQty(e.target.value)} placeholder="0.00"
                        className="w-full rounded-xl border border-slate-300 bg-white pl-10 pr-3 py-2.5 text-right text-sm outline-none focus:border-slate-900" />
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-slate-400">
                        {inventoryItems.find(i => i.id === selectedItemId)?.unit || ""}
                      </span>
                    </div>
                  </FormField>
                  <div>
                    <Btn type="button" onClick={handleAddRecipeItem} icon={<Plus size={14} />} className="w-full py-2.5">
                      إضافة للوصفة
                    </Btn>
                  </div>
                </div>
              </div>

              {/* Recipe items list */}
              <div className="space-y-3">
                <p className="text-sm font-bold text-slate-800">مكونات الوصفة الحالية</p>
                {recipeItems.length === 0 ? (
                  <p className="text-sm text-slate-500 py-2">لا توجد مكونات مضاف لهذا الوصف بعد. عند بيع هذا المنتج، لن يتم خصم أي خامات من المخزن.</p>
                ) : (
                  <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
                    <table className="w-full text-right text-sm">
                      <thead>
                        <tr className="bg-slate-50 border-b border-slate-200">
                          <th className="p-3 font-semibold text-slate-600">الصنف</th>
                          <th className="p-3 font-semibold text-slate-600">الكمية المطلوبة</th>
                          <th className="p-3 font-semibold text-slate-600 w-16 text-center">إجراء</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {recipeItems.map(item => (
                          <tr key={item.inventoryItemId}>
                            <td className="p-3 font-medium text-slate-900">{item.name}</td>
                            <td className="p-3 text-slate-700">
                              {item.quantity} {item.unit}
                            </td>
                            <td className="p-3 text-center">
                              <button type="button" onClick={() => handleRemoveRecipeItem(item.inventoryItemId)}
                                className="p-1 rounded-lg text-rose-500 hover:bg-rose-50 transition">
                                <Trash size={15} />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* Save actions */}
              <div className="flex gap-2 border-t border-slate-100 pt-4">
                <Btn type="button" onClick={handleSaveRecipe} loading={submittingRecipe} loadingText="جاري الحفظ..." icon={<Settings2 size={14} />}>
                  حفظ الوصفة بالكامل
                </Btn>
                <Btn type="button" variant="ghost" onClick={() => setRecipeProduct(null)}>إلغاء</Btn>
              </div>
            </div>
          )}
        </Panel>
      )}

      {/* Filters */}
      <Panel title="المنتجات" icon={<Search size={15} />} action={
        <div className="flex gap-2">
          <select value={activeFilter} onChange={e => setActiveFilter(e.target.value)}
            className="rounded-xl border border-slate-200 bg-white px-2 py-1.5 text-xs font-medium text-slate-600 outline-none">
            <option value="true">شغالة فقط</option>
            <option value="false">موقوفة فقط</option>
            <option value="all">الكل</option>
          </select>
        </div>
      }>
        {/* Category tabs */}
        <div className="mb-4 flex gap-2 overflow-x-auto pb-1">
          {CATEGORIES.map(c => {
            const Icon = categoryIcons[c.value];
            return (
              <button key={c.value} onClick={() => setCatFilter(c.value)}
                className={`shrink-0 flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition ${catFilter === c.value ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}>
                {Icon && <Icon size={12} />}
                {c.label}
              </button>
            );
          })}
        </div>

        {/* Search */}
        <div className="relative mb-4">
          <Search size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="دور على منتج..."
            className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2 pl-3 pr-9 text-right text-sm outline-none focus:border-slate-900 focus:bg-white" />
        </div>

        {/* Products grid */}
        {productsQuery.isLoading ? (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <CardSkeleton key={i} />
            ))}
          </div>
        ) : products.length === 0 ? (
          <EmptyState icon={<Package size={36} />} title="مفيش منتجات" sub="ضيف أول منتج من الأعلى." />
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {products.map(product => (
              <ProductCard key={product.id} product={product}
                onEdit={() => openEdit(product)}
                onRecipe={() => openRecipeModal(product)}
                onToggleActive={() => statusMutation.mutate({ id: product.id, action: product.active ? "deactivate" : "reactivate" })}
                onToggleAvail={() => availMutation.mutate({ product })}
                busy={statusMutation.isPending || availMutation.isPending}
                canManage={canManage} />
            ))}
          </div>
        )}
      </Panel>
    </div>
  );
}
