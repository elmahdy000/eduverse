"use client";

import Link from "next/link";
import { ArrowUpLeft, Sparkles } from "lucide-react";
import { useEffect, useState } from "react";
import { clsx } from "clsx";

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <nav
      className={clsx(
        "fixed top-0 z-50 w-full transition-all duration-300 px-5 md:px-10 py-4",
        scrolled ? "bg-white/80 backdrop-blur-md shadow-sm" : "bg-transparent"
      )}
    >
      <div className="mx-auto flex max-w-7xl items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-900 text-white">
            <Sparkles size={20} />
          </div>
          <div>
            <p className="text-sm font-black uppercase tracking-wider text-slate-900">Eduvers</p>
            <p className="text-[10px] font-bold text-slate-500">Space & Experience</p>
          </div>
        </div>

        <div className="hidden items-center gap-8 md:flex">
          <a href="#features" className="text-sm font-bold text-slate-600 transition hover:text-slate-900">المساحات</a>
          <a href="#how-it-works" className="text-sm font-bold text-slate-600 transition hover:text-slate-900">كيف نعمل</a>
          <a href="#why-us" className="text-sm font-bold text-slate-600 transition hover:text-slate-900">عن إديوفيرس</a>
        </div>

        <Link
          href="/login"
          className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-bold text-white transition hover:bg-slate-800 hover:shadow-lg active:scale-95"
        >
          دخول النظام
          <ArrowUpLeft size={16} />
        </Link>
      </div>
    </nav>
  );
}
