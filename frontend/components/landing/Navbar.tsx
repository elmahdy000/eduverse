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
        "fixed top-0 z-50 w-full transition-all duration-500",
        scrolled ? "py-3" : "py-6"
      )}
    >
      <div className={clsx(
        "mx-auto flex max-w-7xl items-center justify-between px-6 transition-all duration-500 rounded-[1.5rem] md:rounded-full",
        scrolled ? "bg-white/70 backdrop-blur-xl shadow-[0_8px_32px_rgba(0,0,0,0.05)] border border-white/20 py-3 mx-4 md:mx-auto" : "bg-transparent py-0"
      )}>
        <Link href="/" className="flex items-center gap-3 group">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-900 text-white shadow-xl group-hover:rotate-6 transition-transform duration-500">
            <Sparkles size={22} className="text-amber-400" />
          </div>
          <div className="hidden sm:block">
            <p className="text-lg font-black tracking-tight text-slate-900 leading-none">إديوفيرس</p>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Experience Space</p>
          </div>
        </Link>

        <div className="hidden items-center gap-10 lg:flex">
          <a href="#features" className="text-sm font-bold text-slate-500 transition-colors hover:text-slate-900 relative group">
            المساحات
            <span className="absolute -bottom-1 right-0 w-0 h-0.5 bg-amber-500 transition-all group-hover:w-full" />
          </a>
          <a href="#why-us" className="text-sm font-bold text-slate-500 transition-colors hover:text-slate-900 relative group">
            لماذا نحن؟
            <span className="absolute -bottom-1 right-0 w-0 h-0.5 bg-amber-500 transition-all group-hover:w-full" />
          </a>
          <a href="#" className="text-sm font-bold text-slate-500 transition-colors hover:text-slate-900 relative group">
            تواصل معنا
            <span className="absolute -bottom-1 right-0 w-0 h-0.5 bg-amber-500 transition-all group-hover:w-full" />
          </a>
        </div>

        <div className="flex items-center gap-4">
          <Link
            href="/login"
            className="inline-flex items-center gap-2 rounded-2xl bg-slate-900 px-7 py-3 text-sm font-bold text-white shadow-2xl shadow-slate-900/10 transition-all hover:bg-slate-800 hover:-translate-y-0.5 active:scale-95"
          >
            دخول النظام
            <ArrowUpLeft size={18} className="text-amber-400" />
          </Link>
        </div>
      </div>
    </nav>
  );
}
