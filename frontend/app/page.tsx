"use client";

import Link from "next/link";
import {
  ArrowRight,
  Coffee,
  Mic2,
  MonitorSmartphone,
  PlayCircle,
  Podcast,
  Presentation,
  Sparkles,
  CheckCircle2,
  ArrowUpLeft,
  CalendarCheck,
  LogIn,
  Search,
  Users,
  ShieldCheck,
  Zap,
} from "lucide-react";
import { motion, useScroll, useTransform } from "framer-motion";
import Navbar from "@/components/landing/Navbar";
import Footer from "@/components/landing/Footer";
import { useRef } from "react";

const spaces = [
  {
    title: "استوديو تصوير وإنتاج",
    desc: "مساحة مجهزة للتصوير الاحترافي، الريلز، والإعلانات مع إضاءة وصوت مضبوطين.",
    icon: PlayCircle,
    color: "from-blue-500 to-indigo-600",
    size: "col-span-1 md:col-span-2",
  },
  {
    title: "قاعات تدريب",
    desc: "قاعات مريحة للمحاضرات وورش العمل.",
    icon: Presentation,
    color: "from-purple-500 to-pink-600",
    size: "col-span-1",
  },
  {
    title: "غرف بودكاست",
    desc: "عزل صوتي تام لتسجيل محتواك الصوتي.",
    icon: Podcast,
    color: "from-red-500 to-orange-600",
    size: "col-span-1",
  },
  {
    title: "كافيه ومساحة عمل",
    desc: "أفضل مزاج للشغل مع قهوة مختصة وقعدة هادية.",
    icon: Coffee,
    color: "from-amber-500 to-yellow-600",
    size: "col-span-1 md:col-span-2",
  },
];

const stats = [
  { label: "عميل سعيد", value: "+5,000", icon: Users },
  { label: "ساعة إبداع", value: "+12,000", icon: Zap },
  { label: "مساحة مجهزة", value: "24/7", icon: ShieldCheck },
];

export default function Home() {
  const containerRef = useRef(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end start"],
  });

  const y = useTransform(scrollYProgress, [0, 1], ["0%", "50%"]);
  const opacity = useTransform(scrollYProgress, [0, 0.5], [1, 0]);

  return (
    <div className="min-h-screen bg-[#fafafa] font-sans antialiased text-slate-900 selection:bg-amber-100 selection:text-amber-900" dir="rtl">
      <Navbar />

      <main className="relative">
        {/* Modern Hero Section */}
        <section className="relative min-h-[90vh] flex items-center pt-32 pb-20 overflow-hidden">
          {/* Abstract Background Elements */}
          <div className="absolute inset-0 z-0">
            <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-gradient-to-br from-amber-100/40 to-transparent rounded-full blur-[120px] -translate-y-1/2 translate-x-1/3" />
            <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-gradient-to-tr from-blue-100/30 to-transparent rounded-full blur-[100px] translate-y-1/3 -translate-x-1/4" />
            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-[0.03]" />
          </div>

          <div className="container mx-auto max-w-7xl px-6 relative z-10">
            <div className="flex flex-col items-center text-center max-w-4xl mx-auto">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="inline-flex items-center gap-2 rounded-full border border-amber-200 bg-amber-50/50 backdrop-blur-sm px-4 py-1.5 mb-8"
              >
                <Sparkles size={16} className="text-amber-600 animate-pulse" />
                <span className="text-sm font-bold text-amber-800">إديوفيرس: المنصة الأذكى لإدارة مساحتك</span>
              </motion.div>

              <motion.h1
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, delay: 0.1 }}
                className="text-6xl md:text-8xl font-black tracking-tight leading-[1.05] mb-8"
              >
                أدر <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-600 to-orange-500">إبداعك</span> <br />
                في مكان واحد
              </motion.h1>

              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="text-lg md:text-xl text-slate-500 max-w-2xl leading-relaxed mb-12"
              >
                المنصة المتكاملة لإدارة مساحات العمل المشترك، استوديوهات التصوير، والبار. صممت لتمنحك السهولة في التحكم والاحترافية في التنفيذ.
              </motion.p>

              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, delay: 0.3 }}
                className="flex flex-wrap justify-center gap-5"
              >
                <Link
                  href="/login"
                  className="px-10 py-5 bg-slate-900 text-white rounded-2xl font-bold text-lg hover:shadow-[0_20px_50px_rgba(0,0,0,0.15)] transition-all hover:-translate-y-1 active:scale-95 flex items-center gap-3"
                >
                  ابدأ التشغيل الآن
                  <ArrowUpLeft size={20} />
                </Link>
                <Link
                  href="#features"
                  className="px-10 py-5 bg-white border border-slate-200 text-slate-700 rounded-2xl font-bold text-lg hover:bg-slate-50 transition-all active:scale-95"
                >
                  استكشف المميزات
                </Link>
              </motion.div>

              {/* Stat Badges */}
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
                className="mt-20 grid grid-cols-2 md:grid-cols-3 gap-8 w-full border-t border-slate-200/60 pt-12"
              >
                {stats.map((stat, i) => (
                  <div key={i} className="flex flex-col items-center">
                    <div className="text-3xl font-black text-slate-900 mb-1">{stat.value}</div>
                    <div className="text-sm font-medium text-slate-400 flex items-center gap-2">
                      <stat.icon size={14} />
                      {stat.label}
                    </div>
                  </div>
                ))}
              </motion.div>
            </div>
          </div>
        </section>

        {/* Bento Grid Spaces Section */}
        <section id="features" className="py-24 bg-white relative overflow-hidden">
          <div className="container mx-auto max-w-7xl px-6">
            <div className="flex flex-col md:flex-row md:items-end justify-between mb-16 gap-6">
              <div className="max-w-2xl">
                <h2 className="text-4xl md:text-5xl font-black mb-6">مساحات مصممة للإلهام</h2>
                <p className="text-lg text-slate-500">اختر المساحة التي تناسب طموحك، وجهزنا لك كل ما تحتاجه لتنطلق فوراً.</p>
              </div>
              <div className="flex gap-2">
                <div className="h-12 w-12 rounded-full border border-slate-200 flex items-center justify-center text-slate-400 hover:text-slate-900 hover:border-slate-900 cursor-pointer transition-all">
                  <ArrowRight size={20} className="rotate-180" />
                </div>
                <div className="h-12 w-12 rounded-full border border-slate-900 flex items-center justify-center text-white bg-slate-900 cursor-pointer transition-all">
                  <ArrowRight size={20} />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {spaces.map((space, i) => (
                <motion.div
                  key={i}
                  whileHover={{ y: -8 }}
                  className={`group relative overflow-hidden rounded-[2.5rem] p-8 min-h-[320px] flex flex-col justify-end bg-slate-50 border border-slate-100 ${space.size}`}
                >
                  <div className={`absolute top-8 left-8 h-14 w-14 rounded-2xl bg-gradient-to-br ${space.color} flex items-center justify-center text-white shadow-lg shadow-black/5`}>
                    <space.icon size={28} />
                  </div>
                  
                  <div className="relative z-10">
                    <h3 className="text-2xl font-black mb-3 group-hover:text-amber-600 transition-colors">{space.title}</h3>
                    <p className="text-slate-500 leading-relaxed max-w-sm">{space.desc}</p>
                  </div>

                  <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-slate-200/20 to-transparent rounded-full -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-700" />
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Feature Highlights */}
        <section className="py-24 bg-slate-900 text-white overflow-hidden">
          <div className="container mx-auto max-w-7xl px-6">
            <div className="grid lg:grid-cols-2 gap-20 items-center">
              <div className="relative">
                <motion.div 
                  initial={{ opacity: 0, scale: 0.8 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  className="aspect-square rounded-[3rem] bg-gradient-to-br from-amber-500 to-orange-600 relative overflow-hidden"
                >
                  <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&q=80')] mix-blend-overlay opacity-40 object-cover" />
                  <div className="absolute inset-0 p-12 flex flex-col justify-end">
                    <div className="h-16 w-16 bg-white/10 backdrop-blur-md rounded-2xl flex items-center justify-center mb-6">
                      <Zap size={32} className="text-amber-400" />
                    </div>
                    <h4 className="text-4xl font-black mb-4">سرعة في التنفيذ، <br />دقة في التشغيل.</h4>
                    <p className="text-white/60 text-lg">نظامنا يضمن لك سير العمل بدون انقطاع مع واجهات تفاعلية سهلة الاستخدام.</p>
                  </div>
                </motion.div>
                
                {/* Floating badge */}
                <div className="absolute -bottom-6 -right-6 bg-white rounded-3xl p-6 shadow-2xl md:-right-12">
                   <div className="flex items-center gap-4 text-slate-900">
                     <div className="h-12 w-12 bg-emerald-100 text-emerald-600 rounded-2xl flex items-center justify-center font-bold">99%</div>
                     <div>
                       <div className="font-bold text-sm">معدل رضا العملاء</div>
                       <div className="text-xs text-slate-400">تقييماتنا لعام 2026</div>
                     </div>
                   </div>
                </div>
              </div>

              <div>
                <h2 className="text-4xl md:text-5xl font-black mb-12">ليه إديوفيرس هي اختيارك الأمثل؟</h2>
                <div className="space-y-10">
                  {[
                    { title: "إدارة ذكية للحجوزات", desc: "نظام منع التداخل الذكي يضمن لك عدم تعارض المواعيد أبداً.", icon: CalendarCheck },
                    { title: "نظام POS متكامل", desc: "أدر مبيعات البار والمخزن بكل سهولة من شاشة واحدة.", icon: Coffee },
                    { title: "تقارير مالية دقيقة", desc: "راقب دخلك ومصاريفك من خلال لوحة تحكم تفاعلية وشاملة.", icon: Zap },
                  ].map((item, i) => (
                    <div key={i} className="flex gap-6 group">
                      <div className="h-14 w-14 shrink-0 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-amber-500 group-hover:bg-amber-500 group-hover:text-white transition-all">
                        <item.icon size={28} />
                      </div>
                      <div>
                        <h5 className="text-xl font-bold mb-2">{item.title}</h5>
                        <p className="text-slate-400 leading-relaxed">{item.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Final CTA */}
        <section className="py-32 relative overflow-hidden">
          <div className="container mx-auto max-w-5xl px-6 text-center">
            <div className="bg-white rounded-[4rem] border border-slate-100 p-16 md:p-24 shadow-2xl shadow-slate-200/50 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-full h-2 bg-gradient-to-r from-amber-500 via-orange-500 to-amber-500" />
              
              <div className="relative z-10">
                <h2 className="text-4xl md:text-6xl font-black mb-8">جاهز لنقلة نوعية في إدارتك؟</h2>
                <p className="text-xl text-slate-500 mb-12 max-w-2xl mx-auto">سجل الآن وانضم لمئات الشركات والمبدعين اللي وثقوا في إديوفيرس لتشغيل مساحاتهم.</p>
                
                <div className="flex flex-wrap justify-center gap-6">
                  <Link
                    href="/login"
                    className="px-12 py-6 bg-slate-900 text-white rounded-[2rem] font-bold text-xl hover:shadow-2xl transition-all hover:-translate-y-1 active:scale-95"
                  >
                    سجل دخولك الآن
                  </Link>
                  <Link
                    href="/contact"
                    className="px-12 py-6 bg-slate-50 text-slate-700 rounded-[2rem] font-bold text-xl hover:bg-slate-100 transition-all active:scale-95"
                  >
                    تواصل معنا
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
