import Link from "next/link";
import {
  ArrowUpLeft,
  Coffee,
  Mic2,
  MonitorSmartphone,
  PlayCircle,
  Podcast,
  Presentation,
  Sparkles,
} from "lucide-react";

const spaces = [
  {
    title: "استوديو تصوير وإنتاج",
    desc: "مساحة مجهزة للتصوير الاحترافي، الريلز، والإعلانات مع إضاءة وصوت مضبوطين.",
    icon: PlayCircle,
  },
  {
    title: "قاعات شرح وتدريب",
    desc: "قاعات مريحة للمحاضرات وورش العمل مع مرونة في عدد الحضور وطريقة الجلوس.",
    icon: Presentation,
  },
  {
    title: "غرف بودكاست",
    desc: "غرف عزل صوتي للتسجيل بجودة عالية للبودكاست والمحتوى الصوتي.",
    icon: Podcast,
  },
  {
    title: "كافيه ومساحة استراحة",
    desc: "مشروبات وقعدة هادية تكمل تجربة اليوم وتخلي الفريق في أفضل مزاج للشغل.",
    icon: Coffee,
  },
  {
    title: "شاشات تفاعلية",
    desc: "شاشات عرض وتفاعل مباشر للشرح، العصف الذهني، وتقديم الأفكار بطريقة احترافية.",
    icon: MonitorSmartphone,
  },
  {
    title: "دعم إنتاج المحتوى",
    desc: "خدمات مساعدة للتجهيز، التسجيل، والمتابعة عشان تطلع بأفضل نتيجة بأقل مجهود.",
    icon: Mic2,
  },
];

export default function Home() {
  return (
    <main className="relative overflow-hidden">
      <div className="pointer-events-none absolute -top-28 -right-28 h-80 w-80 rounded-full bg-amber-300/40 blur-3xl" />
      <div className="pointer-events-none absolute top-64 -left-28 h-96 w-96 rounded-full bg-sky-300/30 blur-3xl" />

      <section className="mx-auto flex min-h-screen w-full max-w-7xl flex-col px-5 pb-16 pt-10 md:px-8 lg:px-12">
        <header className="mb-12 flex items-center justify-between rounded-2xl border border-white/70 bg-white/70 px-4 py-3 backdrop-blur md:px-5">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-500">Eduvers Space</p>
            <p className="text-sm font-semibold text-slate-900">مساحة المحتوى والتدريب والتجربة</p>
          </div>
          <Link
            href="/login"
            className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800"
          >
            دخول النظام
            <ArrowUpLeft size={16} />
          </Link>
        </header>

        <div className="grid items-start gap-8 lg:grid-cols-[1.2fr_0.8fr]">
          <div>
            <span className="mb-4 inline-flex items-center gap-2 rounded-full border border-amber-300 bg-amber-100 px-3 py-1 text-xs font-bold text-amber-800">
              <Sparkles size={14} />
              تجربة متكاملة في مكان واحد
            </span>
            <h1 className="text-4xl font-black leading-tight text-slate-900 md:text-6xl">
              مكان واحد
              <br />
              لكل فكرة عايزة
              <span className="text-amber-600"> تتنفّذ صح</span>
            </h1>
            <p className="mt-5 max-w-2xl text-base leading-8 text-slate-700 md:text-lg">
              سواء جاي تصور، تسجل بودكاست، تقدم شرح، أو تعمل ورشة.. المكان متجهز لكل ده بجودة عالية وتجربة
              مريحة من أول دقيقة.
            </p>

            <div className="mt-7 flex flex-wrap gap-3">
              <Link
                href="/login"
                className="rounded-xl bg-amber-500 px-5 py-3 text-sm font-bold text-white transition hover:bg-amber-600"
              >
                ابدأ الحجز والتشغيل
              </Link>
              <a
                href="#spaces"
                className="rounded-xl border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                شوف المساحات والخدمات
              </a>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1">
            <div className="rounded-2xl border border-white/80 bg-white/80 p-4 backdrop-blur">
              <p className="text-xs text-slate-500">مساحات متخصصة</p>
              <p className="mt-1 text-3xl font-black text-slate-900">5+</p>
            </div>
            <div className="rounded-2xl border border-white/80 bg-white/80 p-4 backdrop-blur">
              <p className="text-xs text-slate-500">جاهزية تشغيل</p>
              <p className="mt-1 text-3xl font-black text-slate-900">100%</p>
            </div>
            <div className="rounded-2xl border border-white/80 bg-white/80 p-4 backdrop-blur">
              <p className="text-xs text-slate-500">تجربة عميل</p>
              <p className="mt-1 text-3xl font-black text-slate-900">Premium</p>
            </div>
          </div>
        </div>

        <section id="spaces" className="mt-14">
          <div className="mb-5 flex items-end justify-between">
            <h2 className="text-2xl font-black text-slate-900 md:text-3xl">الخدمات والمساحات</h2>
            <p className="text-sm text-slate-500">اختار اللي يناسب هدفك وخلّي الباقي علينا</p>
          </div>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {spaces.map((space) => {
              const Icon = space.icon;
              return (
                <article
                  key={space.title}
                  className="group rounded-2xl border border-white/80 bg-white/75 p-5 backdrop-blur transition hover:-translate-y-0.5 hover:shadow-lg"
                >
                  <div className="mb-3 inline-flex rounded-xl bg-slate-900 p-2 text-white">
                    <Icon size={18} />
                  </div>
                  <h3 className="text-lg font-bold text-slate-900">{space.title}</h3>
                  <p className="mt-2 text-sm leading-7 text-slate-600">{space.desc}</p>
                </article>
              );
            })}
          </div>
        </section>
      </section>
    </main>
  );
}
