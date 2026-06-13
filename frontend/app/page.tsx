"use client";

import Link from "next/link";
import {
  ArrowLeft,
  Coffee,
  Mic2,
  Video,
  Presentation,
  Users,
  Building,
  Sparkles,
  CheckCircle2,
  CalendarCheck,
  Zap,
  Wifi,
  Tv,
  Wind,
  PhoneCall,
  Clock,
  ShieldCheck,
  HeartHandshake,
  Layers,
  ArrowRight
} from "lucide-react";
import { motion } from "framer-motion";
import Navbar from "@/components/landing/Navbar";
import Footer from "@/components/landing/Footer";

// Realistic spaces dataset
const spacesList = [
  {
    title: "مساحة عمل مشتركة",
    desc: "مكاتب مرنة ومريحة تناسب العمل الفردي أو الجماعي مع إضاءة طبيعية وإنترنت فائق السرعة.",
    bullets: ["إنترنت فائق السرعة ومستقر", "مكاتب مريحة ومنافذ طاقة متوفرة", "بيئة عمل هادئة ومحفزة للتركيز"],
    target: "الفريلانسرز، المطورين، والطلاب",
    price: "تبدأ من 15 ج.م / ساعة",
    image: "https://images.unsplash.com/photo-1527192491265-7e15c55b1ed2?auto=format&fit=crop&q=80&w=800",
    icon: Users
  },
  {
    title: "قاعات تدريب",
    desc: "قاعات تدريبية واسعة ومجهزة بشاشات عرض تفاعلية وأنظمة صوتية لإلقاء المحاضرات وورش العمل.",
    bullets: ["شاشات تفاعلية وأجهزة عرض حديثة", "تتسع حتى 35 متدرباً براحة تامة", "أنظمة تكييف متكاملة وديكور احترافي"],
    target: "المدربين والمحاضرين والمراكز التعليمية",
    price: "تبدأ من 120 ج.م / ساعة",
    image: "https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?auto=format&fit=crop&q=80&w=800",
    icon: Presentation
  },
  {
    title: "استوديو تصوير وإنتاج",
    desc: "مساحة احترافية مخصصة لتصوير الفيديوهات والريلز والإعلانات وتصوير المنتجات مع إضاءة كاملة.",
    bullets: ["أنظمة إضاءة احترافية (Softboxes)", "خلفيات ملونة وكروما خضراء للتصوير", "معدات تصوير متكاملة متاحة للإيجار"],
    target: "صناع المحتوى والمصورين والشركات الناشئة",
    price: "تبدأ من 150 ج.م / ساعة",
    image: "https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?auto=format&fit=crop&q=80&w=800",
    icon: Video
  },
  {
    title: "غرف بودكاست",
    desc: "غرفة معزولة صوتياً بالكامل ومجهزة بأفضل الميكروفونات لتسجيل الحلقات الصوتية والمقابلات.",
    bullets: ["عزل صوتي احترافي بنسبة 100%", "ميكروفونات رود (Rode) احترافية", "جهاز مزج الصوت (Mixer) لتعديل فوري"],
    target: "صناع البودكاست والمدونات الصوتية",
    price: "تبدأ من 80 ج.م / ساعة",
    image: "https://images.unsplash.com/photo-1590602847861-f357a9332bbc?auto=format&fit=crop&q=80&w=800",
    icon: Mic2
  },
  {
    title: "كافيه ومساحة عمل",
    desc: "استمتع بمشروبك المفضل من قهوة مختصة وعصائر فريش أثناء عملك في صالة مريحة ومهيأة للتركيز.",
    bullets: ["قهوة مختصة محضرة بأيدي باريستا محترف", "جلسات مريحة تخدم العمل المكتبي الطويل", "مأكولات خفيفة وحلويات طازجة يومياً"],
    target: "عشاق القهوة والباحثين عن بيئة عمل حيوية",
    price: "قائمة أسعار متنوعة ومناسبة",
    image: "https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?auto=format&fit=crop&q=80&w=800",
    icon: Coffee
  },
  {
    title: "غرفة اجتماعات",
    desc: "غرفة مغلقة ومستقلة مثالية لعقد اجتماعات مجلس الإدارة، المقابلات الشخصية، أو تقديم عروض عمل.",
    bullets: ["طاولة اجتماعات تتسع حتى 10 أفراد", "شاشة عرض ذكية للمشاريع والعروض", "عزل تام يضمن خصوصية نقاشاتكم"],
    target: "فرق العمل، رواد الأعمال، والشركات الصغيرة",
    price: "تبدأ من 60 ج.م / ساعة",
    image: "https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&q=80&w=800",
    icon: Building
  }
];

// Facilities list
const facilitiesList = [
  { title: "إنترنت سريع", desc: "شبكة واي فاي فائقة السرعة تغطي كافة أركان المساحة.", icon: Wifi },
  { title: "شاشات تفاعلية", desc: "شاشات حديثة لعرض مشاريعك ومحاضراتك بوضوح تام.", icon: Tv },
  { title: "تجهيزات تصوير", desc: "إضاءة وخلفيات ومعدات متاحة لصناع المحتوى.", icon: Video },
  { title: "مشروبات وكافيه", desc: "منيو متنوع من القهوة المختصة والمشروبات الساخنة والباردة.", icon: Coffee },
  { title: "قاعات مكيفة", desc: "تكييف هواء مركزي يضمن حرارة مثالية طوال اليوم.", icon: Wind },
  { title: "حجز مرن", desc: "نظام حجز بالساعة أو اليوم أو اشتراكات شهرية مخصصة.", icon: Clock },
  { title: "دعم فني", desc: "فريق متواجد لحل أي مشكلة تقنية أو لوجستية فوراً.", icon: ShieldCheck },
  { title: "بيئة هادئة", desc: "عزل صوتي وتنسيق هادئ يضمنان أعلى درجات التركيز.", icon: HeartHandshake }
];

export default function Home() {
  return (
    <div className="min-h-screen bg-slate-50/50 font-sans antialiased text-slate-900 selection:bg-amber-100 selection:text-amber-900" dir="rtl">
      {/* Header / Navbar */}
      <Navbar />

      <main className="relative">
        {/* ══════════════════════════════
            HERO SECTION
        ══════════════════════════════ */}
        <section className="relative min-h-[95vh] flex items-center pt-28 pb-16 overflow-hidden bg-white">
          <div className="absolute inset-0 z-0">
            {/* Soft decorative elements - strictly elegant and clean */}
            <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-amber-500/[0.03] rounded-full blur-[100px] -translate-y-1/3 translate-x-1/4" />
            <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-slate-900/[0.02] rounded-full blur-[90px] translate-y-1/3 -translate-x-1/4" />
          </div>

          <div className="container mx-auto max-w-7xl px-6 relative z-10">
            <div className="grid lg:grid-cols-12 gap-12 items-center">
              
              {/* Right: Text Content */}
              <div className="lg:col-span-7 flex flex-col items-start text-right">
                <div className="inline-flex items-center gap-2 rounded-full border border-amber-200/80 bg-amber-50/60 backdrop-blur-sm px-4 py-1.5 mb-6">
                  <Sparkles size={14} className="text-amber-600 animate-pulse" />
                  <span className="text-xs font-black text-amber-800">مساحة عمل حقيقية + نظام إدارة ذكي</span>
                </div>

                <h1 className="text-4xl md:text-5xl lg:text-6xl font-black text-slate-950 tracking-tight leading-[1.15] mb-6">
                  مساحتك الذكية للعمل <br />
                  <span className="text-amber-600">والتصوير والتدريب</span> في مكان واحد
                </h1>

                <p className="text-base md:text-lg text-slate-500 max-w-2xl leading-relaxed mb-10 font-medium">
                  احجز مكتبك، قاعة تدريبك، استوديو التصوير، أو غرفة البودكاست بسهولة داخل إديوفيرس. نجمع لك بين بيئة العمل الهادئة والحلول التقنية المتكاملة.
                </p>

                <div className="flex flex-wrap gap-4 mb-12">
                  <a
                    href="#contact"
                    className="px-8 py-4 bg-slate-950 text-white rounded-xl font-black text-sm hover:bg-slate-800 transition-all hover:-translate-y-0.5 active:scale-95 flex items-center gap-3 shadow-md shadow-slate-950/10"
                  >
                    احجز مساحتك الآن
                    <ArrowLeft size={16} className="text-amber-400" />
                  </a>
                  <a
                    href="#spaces"
                    className="px-8 py-4 bg-slate-50 border border-slate-200 text-slate-700 rounded-xl font-black text-sm hover:bg-slate-100 transition-all active:scale-95"
                  >
                    استكشف المساحات
                  </a>
                </div>

                {/* Unified compact trust badges */}
                <div className="w-full border-t border-slate-100 pt-8">
                  <p className="text-xs font-black text-slate-400 uppercase tracking-wider mb-4">مميزات تشغيل إديوفيرس</p>
                  <div className="flex flex-wrap gap-2.5">
                    {["قاعات مجهزة", "استوديو تصوير", "حجز بالساعة", "نظام إدارة ذكي", "كافيه ومساحة عمل"].map((badge, idx) => (
                      <span key={idx} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-50 border border-slate-200/80 text-xs font-bold text-slate-600">
                        <CheckCircle2 size={12} className="text-amber-600" />
                        {badge}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Left: Premium Realistic Layout Mockup Visual */}
              <div className="lg:col-span-5 relative">
                <div className="aspect-[4/3] rounded-3xl overflow-hidden bg-slate-100 border border-slate-200/60 shadow-2xl relative group">
                  <img
                    src="https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&q=80&w=1000"
                    alt="Eduverse workspace"
                    className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-700"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/40 via-transparent to-transparent" />
                  
                  {/* Floating POS/Booking Badge Mockup */}
                  <div className="absolute bottom-6 right-6 left-6 bg-white/95 backdrop-blur-md p-4 rounded-2xl border border-slate-100 shadow-lg flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-xl bg-amber-500 text-slate-950 flex items-center justify-center font-black">
                        <Zap size={18} />
                      </div>
                      <div className="text-right">
                        <h4 className="text-xs font-black text-slate-900 leading-none mb-1">نظام إدارة ذكي للمساحات</h4>
                        <p className="text-[10px] font-bold text-slate-400">حجز ذاتي، تتبع العمليات، ومبيعات POS فورية</p>
                      </div>
                    </div>
                    <span className="shrink-0 inline-flex items-center gap-1 bg-emerald-50 text-emerald-700 px-2 py-1 rounded-lg text-[10px] font-black">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      متصل مباشر
                    </span>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </section>

        {/* ══════════════════════════════
            SPACES SECTION
        ══════════════════════════════ */}
        <section id="spaces" className="py-24 bg-slate-50/30 border-y border-slate-200/40 relative">
          <div className="container mx-auto max-w-7xl px-6">
            <div className="text-center max-w-2xl mx-auto mb-16">
              <h2 className="text-3xl font-black text-slate-950 mb-4">اختر المساحة المناسبة ليومك</h2>
              <p className="text-sm font-bold text-slate-400">كل مساحة مصممة بعناية وتجهيزات احترافية تناسب كافة متطلباتك.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {spacesList.map((space, idx) => (
                <div
                  key={idx}
                  className="bg-white rounded-2xl border border-slate-200/50 hover:border-amber-500/40 shadow-xs hover:shadow-lg transition-all duration-350 flex flex-col overflow-hidden group"
                >
                  {/* Image area */}
                  <div className="h-48 overflow-hidden bg-slate-100 relative">
                    <img
                      src={space.image}
                      alt={space.title}
                      className="object-cover w-full h-full group-hover:scale-103 transition-transform duration-500"
                    />
                    <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-xs px-2.5 py-1 rounded-lg text-[10px] font-black text-slate-800 border border-slate-100">
                      {space.price}
                    </div>
                  </div>

                  {/* Content below */}
                  <div className="p-6 flex-1 flex flex-col text-right">
                    <div className="flex items-center gap-2 mb-3">
                      <div className="h-7 w-7 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
                        <space.icon size={15} />
                      </div>
                      <h3 className="text-base font-black text-slate-950 group-hover:text-amber-600 transition-colors">
                        {space.title}
                      </h3>
                    </div>

                    <p className="text-xs font-medium text-slate-500 leading-relaxed mb-4">
                      {space.desc}
                    </p>

                    {/* Features list */}
                    <div className="space-y-1.5 mb-5 border-t border-slate-100 pt-4 flex-1">
                      {space.bullets.map((bullet, bIdx) => (
                        <div key={bIdx} className="flex items-center gap-2 text-[11px] font-bold text-slate-600">
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0" />
                          <span>{bullet}</span>
                        </div>
                      ))}
                    </div>

                    {/* Target audience label */}
                    <div className="mb-6 bg-slate-50 rounded-xl px-3.5 py-2.5 border border-slate-100">
                      <span className="text-[10px] font-black text-slate-400 block mb-1">مناسب لـ:</span>
                      <span className="text-xs font-bold text-slate-700">{space.target}</span>
                    </div>

                    <a
                      href="#contact"
                      className="w-full py-3 text-center rounded-xl bg-slate-950 text-white text-xs font-black hover:bg-slate-800 transition-colors"
                    >
                      احجز الآن
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ══════════════════════════════
            WHY EDUVERSE SECTION (Dark Premium)
        ══════════════════════════════ */}
        <section id="why-us" className="py-24 bg-slate-950 text-white relative overflow-hidden">
          <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-[0.01]" />
          
          <div className="container mx-auto max-w-7xl px-6 relative z-10">
            <div className="grid lg:grid-cols-2 gap-16 items-center">
              
              {/* Right Column: Visual Panel (Mock Dashboard / Space Admin View) */}
              <div className="order-2 lg:order-1 relative">
                <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl relative">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-6">
                    <div className="flex items-center gap-1.5">
                      <div className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                      <div className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                      <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                    </div>
                    <span className="text-[10px] font-bold text-slate-500 font-mono">eduverse_core_system.config</span>
                  </div>

                  {/* Mock content representation */}
                  <div className="space-y-4 text-right">
                    <div className="h-10 rounded-xl bg-slate-950 border border-slate-800/80 px-4 flex items-center justify-between text-xs font-bold">
                      <span className="text-emerald-500 font-bold">نشط</span>
                      <span className="text-slate-400">استوديو تصوير وإنتاج - غرفة 1</span>
                    </div>
                    <div className="h-10 rounded-xl bg-slate-950 border border-slate-800/80 px-4 flex items-center justify-between text-xs font-bold">
                      <span className="text-slate-500 font-bold">جاهز</span>
                      <span className="text-slate-400">غرفة البودكاست - الميكروفون المتاح</span>
                    </div>
                    <div className="h-10 rounded-xl bg-slate-950 border border-slate-800/80 px-4 flex items-center justify-between text-xs font-bold">
                      <span className="text-amber-500 font-bold">محجوز (14:00 - 16:00)</span>
                      <span className="text-slate-400">قاعة اجتماعات - ورشة عمل الفريلانسرز</span>
                    </div>
                  </div>

                  {/* Floating stats card */}
                  <div className="absolute -bottom-6 -right-6 bg-slate-900 border border-amber-500/20 rounded-2xl p-4 shadow-xl flex items-center gap-3">
                    <div className="h-9 w-9 rounded-lg bg-amber-500/10 text-amber-500 flex items-center justify-center shrink-0">
                      <Zap size={16} />
                    </div>
                    <div>
                      <h4 className="text-xs font-black text-white leading-none mb-1">0% تداخل مواعيد</h4>
                      <p className="text-[9px] font-medium text-slate-400">تحديث ذكي فوري للحجوزات</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Left Column: Text & Items */}
              <div className="order-1 lg:order-2 text-right">
                <h2 className="text-3xl md:text-4xl font-black mb-12">ليه إديوفيرس اختيارك الأفضل؟</h2>
                
                <div className="grid gap-8 sm:grid-cols-2">
                  {[
                    { title: "إدارة حجوزات بدون تعارض", desc: "نظام منع التداخل الذكي يضمن عدم حجز مساحة واحدة لشخصين في نفس الوقت." },
                    { title: "مساحات مجهزة للعمل والتدريب", desc: "أثاث مريح، تكييف متكامل، شاشات عرض، وإضاءة مريحة للعين طوال اليوم." },
                    { title: "نظام POS للكافيه والبار", desc: "مبيعات فورية للمشروبات والمأكولات للعملاء المتواجدين داخل مساحتك." },
                    { title: "تقارير مالية وتشغيلية دقيقة", desc: "متابعة مستمرة لمدخلات ومخرجات المساحة التشغيلية والمالية بكل وضوح." },
                    { title: "تجربة هادئة ومناسبة للإنتاج", desc: "عزل صوتي كامل في البودكاست وتصميم مريح للتركيز والدراسة والعمل." },
                    { title: "دعم كامل لصناع المحتوى والمدربين", desc: "تسهيلات متكاملة للتصوير والتدريب المباشر لمساعدة مشاريعكم على النمو." }
                  ].map((item, idx) => (
                    <div key={idx} className="space-y-2 group">
                      <div className="flex items-center gap-2 mb-1.5 justify-start">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0" />
                        <h3 className="text-sm font-black text-white group-hover:text-amber-500 transition-colors">
                          {item.title}
                        </h3>
                      </div>
                      <p className="text-xs text-slate-400 leading-relaxed font-bold">
                        {item.desc}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          </div>
        </section>

        {/* ══════════════════════════════
            HOW IT WORKS SECTION
        ══════════════════════════════ */}
        <section id="how-it-works" className="py-24 bg-white relative">
          <div className="container mx-auto max-w-7xl px-6">
            <div className="text-center max-w-2xl mx-auto mb-16">
              <h2 className="text-3xl font-black text-slate-950 mb-4">كيف تعمل إديوفيرس؟</h2>
              <p className="text-sm font-bold text-slate-400">احجز مساحتك وابدأ نشاطك في 3 خطوات بسيطة ومباشرة.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center max-w-5xl mx-auto">
              {[
                { step: "1", title: "اختر المساحة", desc: "تصفح المساحات المتوفرة واختر ما يناسب نشاطك من مساحة عمل أو استوديو أو قاعة." },
                { step: "2", title: "حدد الموعد", desc: "اختر الوقت والتاريخ المناسبين لك، وحدد عدد الساعات المطلوبة لحجزك." },
                { step: "3", title: "ابدأ يومك", desc: "تفضل بزيارتنا لتجد مساحتك مهيأة بالكامل ومعدة لتنطلق في عملك بكل راحة." }
              ].map((step, idx) => (
                <div key={idx} className="relative p-6 rounded-2xl border border-slate-100 bg-slate-50/50 flex flex-col items-center">
                  <div className="h-10 w-10 rounded-full bg-amber-500 text-slate-950 font-black flex items-center justify-center text-sm mb-4">
                    {step.step}
                  </div>
                  <h3 className="text-base font-black text-slate-950 mb-2">{step.title}</h3>
                  <p className="text-xs text-slate-500 leading-relaxed font-medium">{step.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ══════════════════════════════
            WHO IS IT FOR SECTION
        ══════════════════════════════ */}
        <section className="py-24 bg-slate-50/40 border-y border-slate-200/40">
          <div className="container mx-auto max-w-7xl px-6">
            <div className="text-center max-w-2xl mx-auto mb-16">
              <h2 className="text-3xl font-black text-slate-950 mb-4">لمن صممت إديوفيرس؟</h2>
              <p className="text-sm font-bold text-slate-400">تستقبل إديوفيرس المبدعين والمحترفين من كافة المجالات لتجربة عمل مختلفة.</p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              {[
                { title: "الطلاب", desc: "بيئة هادئة ومثالية للمذاكرة والتركيز والمشاريع الدراسية." },
                { title: "الفريلانسرز", desc: "مكاتب مجهزة بإنترنت سريع لإنجاز مهام عملك اليومي." },
                { title: "المدربين", desc: "قاعات تدريب تتسع للمتدربين وشاشات تواصل تفاعلية." },
                { title: "صناع المحتوى", desc: "استوديو تصوير وإنتاج لتصوير الريلز وتعديل الفيديوهات." },
                { title: "الشركات الصغيرة", desc: "مساحات لعقد اجتماعات ولقاء الشركاء والعملاء بسرية." },
                { title: "فرق العمل", desc: "طاولات عمل مشتركة مخصصة للعمل الجماعي والعصف الذهني." }
              ].map((item, idx) => (
                <div key={idx} className="bg-white rounded-xl border border-slate-200/50 p-5 text-right flex flex-col justify-between">
                  <h3 className="text-sm font-black text-slate-950 mb-2">{item.title}</h3>
                  <p className="text-[11px] font-bold text-slate-400 leading-normal">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ══════════════════════════════
            FACILITIES SECTION
        ══════════════════════════════ */}
        <section id="facilities" className="py-24 bg-white">
          <div className="container mx-auto max-w-7xl px-6">
            <div className="text-center max-w-2xl mx-auto mb-16">
              <h2 className="text-3xl font-black text-slate-950 mb-4">التسهيلات والخدمات المتوفرة</h2>
              <p className="text-sm font-bold text-slate-400">تضم إديوفيرس كافة التسهيلات لضمان يوم عمل منتج ومريح دون انقطاع.</p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {facilitiesList.map((facility, idx) => (
                <div key={idx} className="p-5 rounded-xl border border-slate-100 bg-slate-50/50 flex flex-col items-start text-right">
                  <div className="h-8 w-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center mb-3">
                    <facility.icon size={16} />
                  </div>
                  <h3 className="text-xs font-black text-slate-900 mb-1">{facility.title}</h3>
                  <p className="text-[10px] font-bold text-slate-400 leading-normal">{facility.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ══════════════════════════════
            CTA SECTION
        ══════════════════════════════ */}
        <section id="contact" className="py-24 bg-slate-50/20 border-t border-slate-200/40 relative">
          <div className="container mx-auto max-w-4xl px-6 text-center">
            <div className="bg-slate-950 text-white rounded-[2.5rem] p-10 md:p-16 shadow-xl relative overflow-hidden">
              <div className="absolute top-0 right-0 w-full h-1 bg-amber-500" />
              
              <h2 className="text-2xl md:text-4xl font-black mb-4">جاهز تبدأ يومك في إديوفيرس؟</h2>
              <p className="text-sm md:text-base text-slate-400 mb-8 max-w-xl mx-auto font-medium">
                احجز مساحتك الآن أو تواصل معنا لمعرفة الباقات المتاحة. فريقنا جاهز دائماً لمساعدتك في تجهيز حجزك.
              </p>

              <div className="flex flex-wrap justify-center gap-3.5">
                <a
                  href="tel:+201234567890"
                  className="px-8 py-3.5 bg-amber-500 text-slate-950 rounded-xl font-black text-xs hover:bg-amber-400 transition-colors"
                >
                  احجز الآن
                </a>
                <a
                  href="mailto:info@eduvers.com"
                  className="px-8 py-3.5 bg-white/5 border border-white/10 text-white rounded-xl font-black text-xs hover:bg-white/10 transition-colors"
                >
                  تواصل معنا
                </a>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <Footer />
    </div>
  );
}
