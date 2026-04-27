"use client";

import { useState, useEffect } from "react";
import { readBarMenuFromExcel, formatBarMenuForDisplay, BarMenuItem } from "@/lib/excel-reader";
import { Coffee, Martini, Cookie, Sandwich, IceCream, Utensils, Star, Flame } from "lucide-react";
import { money } from "@/lib/format";
import clsx from "clsx";

const categoryIcons: Record<string, React.ReactNode> = {
  coffee: <Coffee size={24} />,
  tea: <Utensils size={24} />,
  juice: <Martini size={24} />,
  snack: <Cookie size={24} />,
  sandwich: <Sandwich size={24} />,
  dessert: <IceCream size={24} />,
  other: <Flame size={24} />,
};

const categoryColors: Record<string, string> = {
  coffee: "bg-amber-100 border-amber-200 text-amber-800",
  tea: "bg-emerald-100 border-emerald-200 text-emerald-800",
  juice: "bg-rose-100 border-rose-200 text-rose-800",
  snack: "bg-orange-100 border-orange-200 text-orange-800",
  sandwich: "bg-blue-100 border-blue-200 text-blue-800",
  dessert: "bg-pink-100 border-pink-200 text-pink-800",
  other: "bg-violet-100 border-violet-200 text-violet-800",
};

export function BarMenuDisplay() {
  const [menuItems, setMenuItems] = useState<BarMenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    async function loadMenu() {
      try {
        const items = await readBarMenuFromExcel("/duvers_menu_extracted.xlsx");
        setMenuItems(items);
      } catch (error) {
        console.error("Failed to load menu:", error);
      } finally {
        setLoading(false);
      }
    }
    loadMenu();
  }, []);

  const categories = [...new Set(menuItems.map(item => item.category))];
  const filteredItems = menuItems.filter(item => {
    const matchesCategory = selectedCategory === "all" || item.category === selectedCategory;
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const featuredItems = menuItems.slice(0, 6);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-slate-300 border-t-slate-900" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Featured Items */}
      {featuredItems.length > 0 && (
        <section>
          <div className="mb-4 flex items-center gap-2">
            <Star className="text-amber-500" size={20} />
            <h2 className="text-xl font-bold text-slate-900">الأكثر طلباً</h2>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {featuredItems.map((item, index) => (
              <div
                key={index}
                className="group relative overflow-hidden rounded-2xl border border-amber-200 bg-gradient-to-br from-amber-50 to-white p-4 transition hover:shadow-lg"
              >
                <div className="absolute top-2 right-2 flex h-8 w-8 items-center justify-center rounded-full bg-amber-500 text-white font-bold">
                  {index + 1}
                </div>
                <div className="mb-3 flex h-16 w-16 items-center justify-center rounded-xl bg-white shadow-sm">
                  {categoryIcons[item.category] || categoryIcons.other}
                </div>
                <h3 className="mb-1 font-bold text-slate-900">{item.name}</h3>
                {item.description && (
                  <p className="mb-2 text-xs text-slate-600 line-clamp-2">{item.description}</p>
                )}
                <p className="text-lg font-bold text-emerald-600">{money(item.price)}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Full Menu */}
      <section>
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2">
            <Coffee className="text-slate-700" size={24} />
            <h2 className="text-2xl font-bold text-slate-900">قائمة البار الكاملة</h2>
          </div>
          
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="ابحث في القائمة..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="rounded-lg border border-slate-300 px-4 py-2 text-sm"
            />
          </div>
        </div>

        {/* Category Tabs */}
        <div className="mb-6 flex flex-wrap gap-2">
          <button
            onClick={() => setSelectedCategory("all")}
            className={clsx(
              "flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium transition",
              selectedCategory === "all"
                ? "bg-slate-900 text-white border-slate-900"
                : "border-slate-300 text-slate-700 hover:bg-slate-50"
            )}
          >
            <Star size={16} />
            الكل ({menuItems.length})
          </button>
          {categories.map((category) => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={clsx(
                "flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium transition",
                selectedCategory === category
                  ? "bg-slate-900 text-white border-slate-900"
                  : `border-slate-300 text-slate-700 hover:bg-slate-50 ${categoryColors[category] || categoryColors.other}`
              )}
            >
              {categoryIcons[category] || categoryIcons.other}
              {category} ({menuItems.filter(i => i.category === category).length})
            </button>
          ))}
        </div>

        {/* Menu Grid */}
        {filteredItems.length > 0 ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filteredItems.map((item, index) => (
              <div
                key={index}
                className={clsx(
                  "group overflow-hidden rounded-2xl border p-4 transition hover:shadow-lg",
                  categoryColors[item.category] || categoryColors.other
                )}
              >
                <div className="mb-3 flex h-20 w-20 items-center justify-center rounded-xl bg-white shadow-sm">
                  {categoryIcons[item.category] || categoryIcons.other}
                </div>
                <h3 className="mb-1 font-bold text-slate-900 line-clamp-2">{item.name}</h3>
                {item.description && (
                  <p className="mb-2 text-xs text-slate-700 line-clamp-2">{item.description}</p>
                )}
                <div className="flex items-center justify-between">
                  <p className="text-lg font-bold text-slate-900">{money(item.price)}</p>
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white/50">
                    <Star size={14} className="text-slate-600" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <Coffee size={48} className="mb-4 text-slate-300" />
            <p className="text-lg font-medium text-slate-600">لا توجد عناصر في هذه الفئة</p>
            <p className="text-sm text-slate-400">جرب فئة أخرى أو ابحث باسم مختلف</p>
          </div>
        )}
      </section>
    </div>
  );
}
