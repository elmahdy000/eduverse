import { Camera, Globe, Mail, MapPin, MessageCircle, Phone, Send, Sparkles } from "lucide-react";
import Link from "next/link";

export default function Footer() {
  return (
    <footer className="bg-slate-900 pt-24 pb-12 text-slate-300 relative overflow-hidden">
      {/* Dynamic Background */}
      <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-amber-500/5 blur-[140px] pointer-events-none rounded-full" />
      <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-blue-500/5 blur-[120px] pointer-events-none rounded-full" />
      
      <div className="container mx-auto max-w-7xl px-6 relative z-10">
        
        {/* Premium Newsletter Section */}
        <div className="mb-24 relative">
          <div className="absolute inset-0 bg-gradient-to-r from-amber-500 to-orange-600 blur-2xl opacity-10" />
          <div className="relative bg-white/5 border border-white/10 backdrop-blur-md p-8 md:p-16 rounded-[4rem] flex flex-col lg:flex-row items-center justify-between gap-12 overflow-hidden">
            <div className="max-w-xl">
              <h3 className="text-3xl md:text-4xl font-black text-white mb-6">خليك دايمًا في الصورة</h3>
              <p className="text-slate-400 text-lg leading-relaxed">اشترك في نشرتنا الإخبارية لتصلك أحدث العروض، الفعاليات، وتحديثات النظام في إديوفيرس فور صدورها.</p>
            </div>
            <form className="w-full lg:w-auto flex flex-col sm:flex-row gap-4">
              <input 
                type="email" 
                placeholder="بريدك الإلكتروني" 
                className="w-full sm:w-80 h-16 px-8 rounded-2xl bg-slate-950/50 border border-white/10 text-white focus:outline-none focus:ring-2 focus:ring-amber-500 transition-all font-medium text-lg"
              />
              <button className="h-16 px-10 rounded-2xl bg-amber-500 text-slate-900 font-black flex items-center justify-center gap-3 hover:bg-amber-400 transition-all active:scale-95 shadow-xl shadow-amber-900/20 whitespace-nowrap text-lg">
                اشترك الآن
                <Send size={20} />
              </button>
            </form>
          </div>
        </div>

        <div className="grid gap-20 md:grid-cols-2 lg:grid-cols-4">
          {/* Brand Identity */}
          <div className="col-span-1 md:col-span-2 lg:col-span-1">
            <Link href="/" className="flex items-center gap-4 text-white mb-10 group">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-500 text-slate-900 shadow-xl shadow-amber-900/20 group-hover:rotate-6 transition-transform duration-500">
                <Sparkles size={28} />
              </div>
              <div>
                <span className="text-2xl font-black tracking-tight block">إديوفيرس</span>
                <span className="text-[10px] font-bold text-amber-500 uppercase tracking-[0.3em]">Premium Space</span>
              </div>
            </Link>
            <p className="mb-10 text-lg leading-relaxed text-slate-400 max-w-xs">
              أول مساحة عمل متكاملة مخصصة لصناع المحتوى والمدربين، بنظام إدارة هو الأذكى من نوعه.
            </p>
            <div className="flex gap-4">
              {[
                { icon: MessageCircle, label: "WhatsApp", color: "hover:bg-[#25D366]" },
                { icon: Camera, label: "Instagram", color: "hover:bg-[#E4405F]" },
                { icon: Send, label: "Telegram", color: "hover:bg-[#0088cc]" },
              ].map((social) => (
                <a
                  key={social.label}
                  href="#"
                  className={`flex h-12 w-12 items-center justify-center rounded-xl bg-white/5 border border-white/10 text-white transition-all duration-300 hover:text-white hover:scale-110 active:scale-90 ${social.color}`}
                >
                  <social.icon size={20} />
                </a>
              ))}
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="mb-10 text-sm font-black uppercase tracking-[0.3em] text-amber-500">روابط سريعة</h4>
            <ul className="grid gap-5 text-lg font-bold">
              <li><Link href="/" className="transition-colors hover:text-amber-500">الرئيسية</Link></li>
              <li><a href="#features" className="transition-colors hover:text-amber-500">المساحات والخدمات</a></li>
              <li><a href="#why-us" className="transition-colors hover:text-amber-500">لماذا نحن؟</a></li>
              <li><Link href="/login" className="transition-colors hover:text-amber-500">دخول النظام</Link></li>
            </ul>
          </div>

          {/* Core Services */}
          <div>
            <h4 className="mb-10 text-sm font-black uppercase tracking-[0.3em] text-amber-500">خدماتنا</h4>
            <ul className="grid gap-5 text-lg font-bold text-slate-400">
              <li className="hover:text-white transition-colors cursor-pointer">استوديو التصوير</li>
              <li className="hover:text-white transition-colors cursor-pointer">قاعات التدريب</li>
              <li className="hover:text-white transition-colors cursor-pointer">غرف البودكاست</li>
              <li className="hover:text-white transition-colors cursor-pointer">نظام POS الذكي</li>
            </ul>
          </div>

          {/* Contact Details */}
          <div>
            <h4 className="mb-10 text-sm font-black uppercase tracking-[0.3em] text-amber-500">تواصل معنا</h4>
            <ul className="grid gap-6 text-lg font-bold">
              <li className="flex items-start gap-4 group">
                <MapPin size={22} className="text-amber-500 shrink-0 mt-1 group-hover:scale-110 transition-transform" />
                <span className="leading-relaxed">القاهرة، مدينة نصر، شارع عباس العقاد الرئيسي</span>
              </li>
              <li className="flex items-center gap-4 group">
                <Phone size={22} className="text-amber-500 shrink-0 group-hover:scale-110 transition-transform" />
                <a href="tel:+201234567890" className="hover:text-amber-500 transition-colors" dir="ltr">+20 123 456 7890</a>
              </li>
              <li className="flex items-center gap-4 group">
                <Mail size={22} className="text-amber-500 shrink-0 group-hover:scale-110 transition-transform" />
                <a href="mailto:info@eduvers.com" className="hover:text-amber-500 transition-colors">info@eduvers.com</a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-24 pt-10 border-t border-white/5 flex flex-col md:flex-row items-center justify-between gap-8 text-slate-500 font-bold">
          <p>© {new Date().getFullYear()} إديوفيرس (Eduvers). جميع الحقوق محفوظة.</p>
          <div className="flex gap-10">
            <a href="#" className="hover:text-white transition-colors">سياسة الخصوصية</a>
            <a href="#" className="hover:text-white transition-colors">الشروط والأحكام</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
