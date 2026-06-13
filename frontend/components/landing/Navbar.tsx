"use client";

import Link from "next/link";
import { ArrowLeft, Sparkles, Menu, X, Calendar } from "lucide-react";
import { useEffect, useState } from "react";
import { clsx } from "clsx";

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <>
      <nav
        className={clsx(
          "fixed top-0 left-0 right-0 z-50 transition-all duration-350 ease-in-out",
          scrolled 
            ? "py-3 bg-white/80 dark:bg-slate-950/80 backdrop-blur-md border-b border-slate-200/50 shadow-[0_2px_20px_rgba(0,0,0,0.03)]" 
            : "py-5 bg-transparent"
        )}
        dir="rtl"
      >
        <div className="mx-auto max-w-7xl px-6 flex items-center justify-between">
          {/* Right: Logo */}
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-950 text-white shadow-md group-hover:scale-105 transition-transform duration-300">
              <Sparkles size={18} className="text-amber-400" />
            </div>
            <div className="flex flex-col text-right">
              <span className="text-base font-black tracking-tight text-slate-900 leading-none">إديوفيرس</span>
              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mt-1">Smart Experience Space</span>
            </div>
          </Link>

          {/* Center: Desktop Navigation Links */}
          <div className="hidden md:flex items-center gap-8">
            <a href="#spaces" className="text-xs font-black text-slate-500 transition-colors hover:text-slate-900 relative group">
              المساحات
              <span className="absolute -bottom-1 right-0 w-0 h-0.5 bg-amber-500 transition-all group-hover:w-full" />
            </a>
            <a href="#why-us" className="text-xs font-black text-slate-500 transition-colors hover:text-slate-900 relative group">
              لماذا نحن؟
              <span className="absolute -bottom-1 right-0 w-0 h-0.5 bg-amber-500 transition-all group-hover:w-full" />
            </a>
            <a href="#how-it-works" className="text-xs font-black text-slate-500 transition-colors hover:text-slate-900 relative group">
              كيف نحجز؟
              <span className="absolute -bottom-1 right-0 w-0 h-0.5 bg-amber-500 transition-all group-hover:w-full" />
            </a>
            <a href="#facilities" className="text-xs font-black text-slate-500 transition-colors hover:text-slate-900 relative group">
              التسهيلات
              <span className="absolute -bottom-1 right-0 w-0 h-0.5 bg-amber-500 transition-all group-hover:w-full" />
            </a>
            <a href="#contact" className="text-xs font-black text-slate-500 transition-colors hover:text-slate-900 relative group">
              تواصل معنا
              <span className="absolute -bottom-1 right-0 w-0 h-0.5 bg-amber-500 transition-all group-hover:w-full" />
            </a>
          </div>

          {/* Left: Action Buttons */}
          <div className="hidden md:flex items-center gap-3">
            <Link
              href="/login"
              className="text-xs font-black text-slate-600 hover:text-slate-900 transition-colors px-3 py-2"
            >
              دخول النظام
            </Link>
            <a
              href="#contact"
              className="inline-flex items-center gap-1.5 rounded-xl bg-slate-950 px-5 py-2.5 text-xs font-black text-white hover:bg-slate-800 transition-all active:scale-95 shadow-sm"
            >
              احجز مساحتك الآن
              <ArrowLeft size={14} className="text-amber-400" />
            </a>
          </div>

          {/* Mobile Menu Toggle Button */}
          <div className="flex md:hidden items-center gap-2">
            <a
              href="#contact"
              className="inline-flex h-9 items-center gap-1 px-3 rounded-lg bg-slate-950 text-white text-[11px] font-black"
            >
              <Calendar size={12} className="text-amber-400" />
              حجز
            </a>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="h-9 w-9 flex items-center justify-center rounded-lg border border-slate-200 text-slate-700 bg-white"
            >
              {mobileMenuOpen ? <X size={18} /> : <Menu size={18} />}
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-40 bg-white pt-24 px-6 flex flex-col gap-6 md:hidden" dir="rtl">
          <a
            href="#spaces"
            onClick={() => setMobileMenuOpen(false)}
            className="text-lg font-black text-slate-800 border-b border-slate-100 pb-3"
          >
            المساحات
          </a>
          <a
            href="#why-us"
            onClick={() => setMobileMenuOpen(false)}
            className="text-lg font-black text-slate-800 border-b border-slate-100 pb-3"
          >
            لماذا نحن؟
          </a>
          <a
            href="#how-it-works"
            onClick={() => setMobileMenuOpen(false)}
            className="text-lg font-black text-slate-800 border-b border-slate-100 pb-3"
          >
            كيف نحجز؟
          </a>
          <a
            href="#facilities"
            onClick={() => setMobileMenuOpen(false)}
            className="text-lg font-black text-slate-800 border-b border-slate-100 pb-3"
          >
            التسهيلات
          </a>
          <a
            href="#contact"
            onClick={() => setMobileMenuOpen(false)}
            className="text-lg font-black text-slate-800 border-b border-slate-100 pb-3"
          >
            تواصل معنا
          </a>
          <div className="flex flex-col gap-3 mt-6">
            <Link
              href="/login"
              onClick={() => setMobileMenuOpen(false)}
              className="w-full py-3 text-center text-sm font-black text-slate-700 bg-slate-100 rounded-xl"
            >
              دخول النظام
            </Link>
            <a
              href="#contact"
              onClick={() => setMobileMenuOpen(false)}
              className="w-full py-3.5 text-center text-sm font-black text-white bg-slate-950 rounded-xl flex items-center justify-center gap-2"
            >
              احجز مساحتك الآن
              <ArrowLeft size={16} className="text-amber-400" />
            </a>
          </div>
        </div>
      )}
    </>
  );
}
