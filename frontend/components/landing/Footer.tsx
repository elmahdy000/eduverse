import { Camera, Globe, Mail, MapPin, MessageCircle, Phone, Send, Sparkles } from "lucide-react";
import Link from "next/link";

export default function Footer() {
  return (
    <footer className="bg-slate-950 pt-24 pb-12 text-slate-300 relative overflow-hidden" dir="rtl">
      {/* Subtle background glow */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-amber-500/5 blur-[120px] pointer-events-none rounded-full" />
      <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-blue-500/5 blur-[100px] pointer-events-none rounded-full" />
      
      <div className="container mx-auto max-w-7xl px-6 relative z-10">
        
        {/* Premium Newsletter Section */}
        <div className="mb-24 relative">
          <div className="relative bg-white/5 border border-white/10 backdrop-blur-md p-8 md:p-12 rounded-[2.5rem] flex flex-col lg:flex-row items-center justify-between gap-8 overflow-hidden">
            <div className="max-w-xl text-right">
              <h3 className="text-2xl md:text-3xl font-black text-white mb-4">كن أول من يعلم</h3>
              <p className="text-slate-400 text-sm leading-relaxed">اشترك في نشرتنا الإخبارية لتصلك أحدث العروض، باقات العمل الجديدة، وتحديثات نظام إديوفيرس فور صدورها.</p>
            </div>
            <form className="w-full lg:w-auto flex flex-col sm:flex-row gap-3">
              <input 
                type="email" 
                placeholder="بريدك الإلكتروني" 
                className="w-full sm:w-80 h-13 px-5 rounded-xl bg-slate-900/80 border border-white/10 text-white focus:outline-none focus:ring-1 focus:ring-amber-500 transition-all font-bold text-sm"
              />
              <button className="h-13 px-8 rounded-xl bg-amber-500 text-slate-950 font-black flex items-center justify-center gap-2 hover:bg-amber-400 transition-all active:scale-95 shadow-md shadow-amber-900/10 whitespace-nowrap text-sm">
                اشترك الآن
                <Send size={16} />
              </button>
            </form>
          </div>
        </div>

        <div className="grid gap-16 md:grid-cols-2 lg:grid-cols-4 text-right">
          {/* Brand Identity */}
          <div className="col-span-1 md:col-span-2 lg:col-span-1">
            <Link href="/" className="flex items-center gap-3 text-white mb-8 group">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-500 text-slate-950 shadow-md group-hover:scale-105 transition-transform duration-300">
                <Sparkles size={20} />
              </div>
              <div className="flex flex-col">
                <span className="text-xl font-black tracking-tight block leading-none">إديوفيرس</span>
                <span className="text-[9px] font-bold text-amber-500 uppercase tracking-widest mt-1">Smart Experience Space</span>
              </div>
            </Link>
            <p className="mb-8 text-sm leading-relaxed text-slate-400 max-w-xs font-medium">
              مساحتك الذكية للعمل والتصوير والتدريب في مكان واحد. صُممت لتمنحك السهولة في الحجز والإنتاجية في الأداء.
            </p>
            <div className="flex gap-3">
              {[
                { icon: MessageCircle, label: "WhatsApp", color: "hover:bg-[#25D366]/10 hover:text-[#25D366]" },
                { icon: Camera, label: "Instagram", color: "hover:bg-[#E4405F]/10 hover:text-[#E4405F]" },
                { icon: Send, label: "Telegram", color: "hover:bg-[#0088cc]/10 hover:text-[#0088cc]" },
              ].map((social) => (
                <a
                  key={social.label}
                  href="#"
                  className={`flex h-10 w-10 items-center justify-center rounded-lg bg-white/5 border border-white/10 text-white transition-all duration-300 hover:scale-105 active:scale-95 ${social.color}`}
                >
                  <social.icon size={16} />
                </a>
              ))}
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="mb-8 text-xs font-black uppercase tracking-wider text-amber-500">روابط سريعة</h4>
            <ul className="grid gap-4 text-sm font-bold">
              <li><Link href="/" className="transition-colors hover:text-amber-500">الرئيسية</Link></li>
              <li><a href="#spaces" className="transition-colors hover:text-amber-500">المساحات المتاحة</a></li>
              <li><a href="#why-us" className="transition-colors hover:text-amber-500">لماذا نحن؟</a></li>
              <li><a href="#how-it-works" className="transition-colors hover:text-amber-500">كيف نحجز؟</a></li>
              <li><Link href="/login" className="transition-colors hover:text-amber-500">دخول النظام</Link></li>
            </ul>
          </div>

          {/* Core Services */}
          <div>
            <h4 className="mb-8 text-xs font-black uppercase tracking-wider text-amber-500">مساحاتنا</h4>
            <ul className="grid gap-4 text-sm font-bold text-slate-400">
              <li><a href="#spaces" className="hover:text-white transition-colors">مساحة العمل المشتركة</a></li>
              <li><a href="#spaces" className="hover:text-white transition-colors">قاعات تدريب متكاملة</a></li>
              <li><a href="#spaces" className="hover:text-white transition-colors">استوديو تصوير وإنتاج</a></li>
              <li><a href="#spaces" className="hover:text-white transition-colors">غرف بودكاست معزولة</a></li>
              <li><a href="#spaces" className="hover:text-white transition-colors">غرف اجتماعات هادئة</a></li>
            </ul>
          </div>

          {/* Contact Details */}
          <div>
            <h4 className="mb-8 text-xs font-black uppercase tracking-wider text-amber-500">تواصل معنا</h4>
            <ul className="grid gap-5 text-sm font-bold">
              <li className="flex items-start gap-3 group">
                <MapPin size={18} className="text-amber-500 shrink-0 mt-0.5" />
                <span className="leading-relaxed">مصر، الشرقية، الزقازيق</span>
              </li>
              <li className="flex items-center gap-3 group">
                <Phone size={18} className="text-amber-500 shrink-0" />
                <a href="tel:+201234567890" className="hover:text-amber-500 transition-colors" dir="ltr">+20 123 456 7890</a>
              </li>
              <li className="flex items-center gap-3 group">
                <Mail size={18} className="text-amber-500 shrink-0" />
                <a href="mailto:info@eduvers.com" className="hover:text-amber-500 transition-colors">info@eduvers.com</a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-20 pt-8 border-t border-white/5 flex flex-col md:flex-row items-center justify-between gap-6 text-xs text-slate-500 font-bold">
          <p>© {new Date().getFullYear()} إديوفيرس (Eduverse). جميع الحقوق محفوظة.</p>
          <div className="flex gap-8">
            <a href="#" className="hover:text-white transition-colors">سياسة الخصوصية</a>
            <a href="#" className="hover:text-white transition-colors">الشروط والأحكام</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
