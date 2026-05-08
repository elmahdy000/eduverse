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
} from "lucide-react";
import { motion } from "framer-motion";
import Navbar from "@/components/landing/Navbar";
import Footer from "@/components/landing/Footer";

const spaces = [
  {
    title: "استوديو تصوير وإنتاج",
    desc: "مساحة مجهزة للتصوير الاحترافي، الريلز، والإعلانات مع إضاءة وصوت مضبوطين.",
    icon: PlayCircle,
    color: "bg-blue-500",
  },
  {
    title: "قاعات شرح وتدريب",
    desc: "قاعات مريحة للمحاضرات وورش العمل مع مرونة في عدد الحضور وطريقة الجلوس.",
    icon: Presentation,
    color: "bg-purple-500",
  },
  {
    title: "غرف بودكاست",
    desc: "غرف عزل صوتي للتسجيل بجودة عالية للبودكاست والمحتوى الصوتي.",
    icon: Podcast,
    color: "bg-red-500",
  },
  {
    title: "كافيه ومساحة استراحة",
    desc: "مشروبات وقعدة هادية تكمل تجربة اليوم وتخلي الفريق في أفضل مزاج للشغل.",
    icon: Coffee,
    color: "bg-amber-500",
  },
  {
    title: "شاشات تفاعلية",
    desc: "شاشات عرض وتفاعل مباشر للشرح، العصف الذهني، وتقديم الأفكار بطريقة احترافية.",
    icon: MonitorSmartphone,
    color: "bg-emerald-500",
  },
  {
    title: "دعم إنتاج المحتوى",
    desc: "خدمات مساعدة للتجهيز، التسجيل، والمتابعة عشان تطلع بأفضل نتيجة بأقل مجهود.",
    icon: Mic2,
    color: "bg-indigo-500",
  },
];

const features = [
  "حجز لحظي وسهل عبر النظام",
  "تجهيزات احترافية (إضاءة، صوت، ديكور)",
  "إنترنت فائق السرعة ومساحات مريحة",
  "دعم فني متواجد طوال فترة الحجز",
];

const steps = [
  {
    number: "01",
    title: "استعرض المساحات",
    desc: "تصفح مساحاتنا المتخصصة واختر اللي يناسب طبيعة شغلك، سواء تصوير، تدريب، أو بودكاست.",
    icon: Search,
    color: "bg-blue-500",
  },
  {
    number: "02",
    title: "احجز في ثوانٍ",
    desc: "حدد الوقت والتاريخ المناسب ليك وأكد الحجز بخطوات بسيطة من خلال النظام.",
    icon: CalendarCheck,
    color: "bg-amber-500",
  },
  {
    number: "03",
    title: "ادخل وابدع",
    desc: "كل شيء جاهز لاستقبالك. ادخل، اشتغل، وركز في إبداعك — وسيب التفاصيل علينا.",
    icon: LogIn,
    color: "bg-emerald-500",
  },
];

export default function Home() {
  return (
    <div className="min-h-screen bg-slate-50 font-sans antialiased text-slate-900" dir="rtl">
      <Navbar />

      <main>
        {/* Hero Section */}
        <section className="relative overflow-hidden pt-32 pb-20 lg:pt-48 lg:pb-32">
          <div className="pointer-events-none absolute -top-24 -right-24 h-96 w-96 rounded-full bg-amber-200/50 blur-3xl" />
          <div className="pointer-events-none absolute top-1/2 -left-24 h-96 w-96 rounded-full bg-sky-200/40 blur-3xl" />

          <div className="mx-auto max-w-7xl px-5 md:px-10">
            <div className="grid gap-16 lg:grid-cols-2 lg:items-center">
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6 }}
              >
                <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-amber-200 bg-amber-50 px-4 py-1.5 text-xs font-bold text-amber-700">
                  <Sparkles size={14} />
                  إديوفيرس: حيث تولد الأفكار الكبيرة
                </div>
                <h1 className="text-5xl font-black leading-[1.1] text-slate-900 md:text-7xl">
                  منصتك المتكاملة <br />
                  لإدارة <span className="text-amber-600">مساحات العمل</span> <br />
                  والإنتاج الإبداعي
                </h1>
                <p className="mt-8 max-w-xl text-lg leading-relaxed text-slate-600 md:text-xl">
                  سواء كنت صانع محتوى، مدرب، أو صاحب مشروع.. بنوفرلك المساحة المجهزة والأدوات اللي تخليك تركز في "إبداعك" بس، وسيب علينا التفاصيل.
                </p>

                <div className="mt-10 flex flex-wrap gap-4">
                  <Link
                    href="/login"
                    className="group relative inline-flex items-center gap-2 overflow-hidden rounded-2xl bg-slate-900 px-8 py-4 text-lg font-bold text-white transition-all hover:bg-slate-800 hover:shadow-2xl hover:shadow-slate-200 active:scale-95"
                  >
                    ابدأ تجربتك الآن
                    <ArrowUpLeft className="transition-transform group-hover:-translate-y-1 group-hover:translate-x-1" />
                  </Link>
                  <a
                    href="#features"
                    className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-8 py-4 text-lg font-bold text-slate-700 transition-all hover:bg-slate-50 hover:border-slate-300"
                  >
                    اكتشف المساحات
                  </a>
                </div>

                <div className="mt-12 flex items-center gap-8 border-t border-slate-200 pt-8">
                  <div className="flex -space-x-3 space-x-reverse">
                    {[1, 2, 3, 4].map((i) => (
                      <div key={i} className="h-10 w-10 rounded-full border-2 border-white bg-slate-200" />
                    ))}
                  </div>
                  <p className="text-sm font-medium text-slate-500">
                    انضم لـ <span className="font-bold text-slate-900">+500</span> عميل بيثقوا في إديوفيرس شهرياً
                  </p>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.8, delay: 0.2 }}
                className="relative"
              >
                <div className="relative z-10 overflow-hidden rounded-[2.5rem] border-[12px] border-white shadow-2xl shadow-slate-200">
                  <img
                    src="/images/hero.png"
                    alt="مساحات عمل مشتركة مجهزة بأحدث التقنيات في إديوفيرس"
                    className="aspect-[4/3] w-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-900/40 to-transparent" />
                </div>

                {/* Floating Cards */}
                <div className="absolute -bottom-6 -right-6 z-20 rounded-3xl bg-white p-6 shadow-xl shadow-slate-200 md:-right-12">
                  <div className="flex items-center gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-500 text-white">
                      <CheckCircle2 size={24} />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-slate-900">جاهزية فورية</p>
                      <p className="text-xs text-slate-500">احجز وادخل في دقيقة</p>
                    </div>
                  </div>
                </div>

                <div className="absolute -top-6 -left-6 z-20 rounded-3xl bg-white p-6 shadow-xl shadow-slate-200 md:-left-12">
                  <div className="flex items-center gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-500 text-white">
                      <MonitorSmartphone size={24} />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-slate-900">أحدث الأجهزة</p>
                      <p className="text-xs text-slate-500">تكنولوجيا إنتاج عالمية</p>
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* Features / Spaces Section */}
        <section id="features" className="bg-white py-24 md:py-32">
          <div className="mx-auto max-w-7xl px-5 md:px-10">
            <div className="mb-20 text-center">
              <h2 className="text-3xl font-black text-slate-900 md:text-5xl">خدماتنا ومساحاتنا المتخصصة</h2>
              <p className="mx-auto mt-6 max-w-2xl text-lg text-slate-500">
                صممنا كل ركن في إديوفيرس ليكون له طابع خاص يخدم هدفك، سواء كان تعليمي، إنتاجي أو حتى للراحة.
              </p>
            </div>

            <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
              {spaces.map((space, idx) => {
                const Icon = space.icon;
                return (
                  <motion.article
                    key={space.title}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5, delay: idx * 0.1 }}
                    className="group relative overflow-hidden rounded-[2rem] border border-slate-100 bg-slate-50/50 p-8 transition-all hover:bg-white hover:shadow-2xl hover:shadow-slate-200"
                  >
                    <div className={`mb-6 inline-flex rounded-2xl ${space.color} p-4 text-white shadow-lg`}>
                      <Icon size={24} />
                    </div>
                    <h3 className="text-xl font-black text-slate-900">{space.title}</h3>
                    <p className="mt-4 leading-relaxed text-slate-600">{space.desc}</p>
                    <div className="mt-8">
                      <Link
                        href="/login"
                        className="inline-flex items-center gap-2 text-sm font-bold text-slate-400 transition-colors group-hover:text-slate-900"
                      >
                        احجز هذه المساحة
                        <ArrowRight size={16} className="rotate-180" />
                      </Link>
                    </div>
                  </motion.article>
                );
              })}
            </div>
          </div>
        </section>

        {/* How It Works Section */}
        <section id="how-it-works" className="bg-slate-50 py-24 md:py-32">
          <div className="mx-auto max-w-7xl px-5 md:px-10">
            <div className="mb-20 text-center">
              <h2 className="text-3xl font-black text-slate-900 md:text-5xl">كيف نعمل؟</h2>
              <p className="mx-auto mt-6 max-w-2xl text-lg text-slate-500">
                ثلاث خطوات بسيطة تفصلك عن تجربة احترافية لا مثيل لها.
              </p>
            </div>

            <div className="grid gap-8 md:grid-cols-3">
              {steps.map((step, idx) => {
                const Icon = step.icon;
                return (
                  <motion.div
                    key={step.number}
                    initial={{ opacity: 0, y: 24 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5, delay: idx * 0.15 }}
                    className="relative flex flex-col items-center text-center"
                  >
                    {/* Connector line between steps */}
                    {idx < steps.length - 1 && (
                      <div className="absolute top-10 left-1/2 hidden h-px w-full border-t-2 border-dashed border-slate-200 md:block" />
                    )}

                    <div className={`relative z-10 mb-6 flex h-20 w-20 items-center justify-center rounded-3xl ${step.color} text-white shadow-lg`}>
                      <Icon size={32} />
                      <span className="absolute -top-2 -right-2 flex h-7 w-7 items-center justify-center rounded-full bg-slate-900 text-xs font-black text-white">
                        {step.number.replace("0", "")}
                      </span>
                    </div>

                    <h3 className="text-xl font-black text-slate-900">{step.title}</h3>
                    <p className="mt-4 max-w-xs text-slate-500 leading-relaxed">{step.desc}</p>
                  </motion.div>
                );
              })}
            </div>

            <div className="mt-16 text-center">
              <Link
                href="/login"
                className="inline-flex items-center gap-2 rounded-2xl bg-slate-900 px-10 py-4 text-base font-bold text-white transition-all hover:bg-slate-800 hover:shadow-xl active:scale-95"
              >
                ابدأ حجزك الآن
                <ArrowUpLeft size={18} />
              </Link>
            </div>
          </div>
        </section>

        {/* Why Us Section */}
        <section id="why-us" className="bg-slate-900 py-24 text-white md:py-32 overflow-hidden relative">
          <div className="pointer-events-none absolute top-0 right-0 h-[500px] w-[500px] bg-amber-500/10 blur-[120px]" />

          <div className="mx-auto max-w-7xl px-5 md:px-10">
            <div className="grid gap-16 lg:grid-cols-2 lg:items-center">
              <div>
                <h2 className="text-3xl font-black md:text-5xl">ليه تختار <br /><span className="text-amber-500">إديوفيرس؟</span></h2>
                <p className="mt-6 text-lg text-slate-400">
                  إحنا مش مجرد مكان للحجز، إحنا شريك في نجاحك من أول الفكرة لحد التنفيذ.
                </p>

                <div className="mt-12 grid gap-6">
                  {features.map((f, i) => (
                    <div key={i} className="flex items-center gap-4">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-amber-500/20 text-amber-500">
                        <CheckCircle2 size={18} />
                      </div>
                      <span className="text-lg font-bold">{f}</span>
                    </div>
                  ))}
                </div>

                <div className="mt-12 flex gap-12">
                  <div>
                    <p className="text-4xl font-black text-white">+5000</p>
                    <p className="mt-1 text-sm text-slate-500">ساعة تسجيل سنوياً</p>
                  </div>
                  <div>
                    <p className="text-4xl font-black text-white">+1200</p>
                    <p className="mt-1 text-sm text-slate-500">صانع محتوى سعيد</p>
                  </div>
                </div>
              </div>

              <div className="relative">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-4 pt-12">
                    <div className="aspect-square rounded-3xl bg-slate-800 p-8 flex flex-col justify-end">
                      <div className="mb-4 h-12 w-12 rounded-2xl bg-amber-500" />
                      <p className="font-bold">جودة لا تساوم</p>
                    </div>
                    <div className="aspect-[4/5] rounded-3xl bg-slate-800 p-8 flex flex-col justify-end overflow-hidden">
                      <p className="font-bold">دعم فني مستمر</p>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div className="aspect-[4/5] rounded-3xl bg-amber-500 p-8 flex flex-col justify-end text-slate-900">
                      <Sparkles size={32} className="mb-4" />
                      <p className="font-black text-xl leading-tight">تجربة مميزة لكل زائر</p>
                    </div>
                    <div className="aspect-square rounded-3xl bg-slate-800 p-8 flex flex-col justify-end">
                      <p className="font-bold">سهولة الحجز</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-24 md:py-32">
          <div className="mx-auto max-w-5xl px-5 md:px-10">
            <div className="relative overflow-hidden rounded-[3rem] bg-amber-500 px-8 py-16 text-center text-slate-900 md:py-24">
              <div className="relative z-10">
                <h2 className="text-4xl font-black md:text-6xl">جاهز تبدأ مشروعك الجاي؟</h2>
                <p className="mx-auto mt-6 max-w-xl text-xl font-bold opacity-80">
                  انضم لينا النهاردة واستمتع بأفضل مساحات العمل والإنتاج في مصر.
                </p>
                <div className="mt-12 flex flex-wrap justify-center gap-4">
                  <Link
                    href="/login"
                    className="rounded-2xl bg-slate-900 px-10 py-5 text-xl font-black text-white transition-all hover:bg-slate-800 hover:shadow-xl active:scale-95"
                  >
                    سجل دخولك دلوقتي
                  </Link>
                  <a
                    href="#how-it-works"
                    className="rounded-2xl border-2 border-slate-900/20 bg-transparent px-10 py-5 text-xl font-black text-slate-900 transition-all hover:bg-slate-900/10 active:scale-95"
                  >
                    اعرف أكتر
                  </a>
                </div>
              </div>
              <div className="pointer-events-none absolute -bottom-12 -left-12 h-64 w-64 rounded-full bg-white/20 blur-3xl" />
              <div className="pointer-events-none absolute -top-12 -right-12 h-64 w-64 rounded-full bg-slate-900/10 blur-3xl" />
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
