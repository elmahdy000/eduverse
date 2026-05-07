import { Camera, Globe, Mail, MapPin, MessageCircle, Phone, Send, ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function Footer() {
  return (
    <footer className="bg-slate-900 pt-24 pb-12 text-slate-300 relative overflow-hidden">
      {/* Background Decor */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-orange-500/5 blur-[120px] pointer-events-none" />
      
      <div className="mx-auto max-w-7xl px-5 md:px-10 relative z-10">
        
        {/* Newsletter Section */}
        <div className="mb-20 grid gap-12 lg:grid-cols-2 items-center bg-slate-800/50 p-8 md:p-12 rounded-[3rem] border border-slate-700/50 backdrop-blur-sm shadow-2xl">
          <div>
            <h3 className="text-2xl font-black text-white mb-4">خليك دايمًا في الصورة</h3>
            <p className="text-slate-400 font-bold max-w-md">اشترك في نشرتنا الإخبارية عشان توصلك أحدث العروض والفعاليات في إديوفيرس قبل أي حد.</p>
          </div>
          <form className="flex flex-col sm:flex-row gap-3">
            <input 
              type="email" 
              placeholder="بريدك الإلكتروني" 
              className="flex-1 h-14 px-6 rounded-2xl bg-slate-900 border border-slate-700 text-white focus:outline-none focus:ring-2 focus:ring-orange-500 transition-all font-bold"
            />
            <button className="h-14 px-8 rounded-2xl bg-orange-600 text-white font-black flex items-center justify-center gap-2 hover:bg-orange-500 transition-all active:scale-95 shadow-xl shadow-orange-900/20 whitespace-nowrap">
              اشترك الآن
              <Send size={18} />
            </button>
          </form>
        </div>

        <div className="grid gap-16 md:grid-cols-2 lg:grid-cols-4">
          {/* Brand */}
          <div className="col-span-1 md:col-span-2 lg:col-span-1">
            <Link href="/" className="flex items-center gap-3 text-white mb-8 group">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-orange-600 shadow-lg shadow-orange-900/20 group-hover:rotate-6 transition-transform duration-500">
                <span className="font-black text-slate-900 text-xl">E</span>
              </div>
              <span className="text-2xl font-black tracking-tighter">EDUVERS</span>
            </Link>
            <p className="mb-8 text-base leading-relaxed text-slate-400 max-w-xs font-medium">
              أول مساحة عمل متكاملة في مصر مخصصة لصناع المحتوى، المدربين، والمبدعين. بنوفرلك البيئة المثالية عشان تطلع أفضل ما عندك.
            </p>
            <div className="flex gap-4">
              {[
                { icon: MessageCircle, label: "WhatsApp", color: "hover:bg-[#25D366]" },
                { icon: Camera, label: "Instagram", color: "hover:bg-[#E4405F]" },
                { icon: Send, label: "Telegram", color: "hover:bg-[#0088cc]" },
                { icon: Globe, label: "Website", color: "hover:bg-orange-500" },
              ].map((social) => (
                <a
                  key={social.label}
                  href="#"
                  className={`flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-800 text-white transition-all duration-300 hover:text-white hover:shadow-xl group active:scale-90 ${social.color}`}
                >
                  <social.icon size={20} className="group-hover:scale-110 transition-transform duration-300" />
                </a>
              ))}
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="mb-8 text-sm font-black uppercase tracking-[0.2em] text-white">روابط سريعة</h4>
            <ul className="grid gap-4 text-base font-bold">
              <li>
                <Link href="/" className="transition-colors hover:text-orange-500 flex items-center gap-2 group">
                  <span className="h-1.5 w-1.5 rounded-full bg-orange-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                  الرئيسية
                </Link>
              </li>
              <li>
                <a href="#features" className="transition-colors hover:text-orange-500 flex items-center gap-2 group">
                  <span className="h-1.5 w-1.5 rounded-full bg-orange-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                  المساحات والخدمات
                </a>
              </li>
              <li>
                <a href="#how-it-works" className="transition-colors hover:text-orange-500 flex items-center gap-2 group">
                  <span className="h-1.5 w-1.5 rounded-full bg-orange-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                  كيفية الحجز
                </a>
              </li>
              <li>
                <Link href="/login" className="transition-colors hover:text-orange-500 flex items-center gap-2 group">
                  <span className="h-1.5 w-1.5 rounded-full bg-orange-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                  دخول النظام
                </Link>
              </li>
            </ul>
          </div>

          {/* Spaces */}
          <div>
            <h4 className="mb-8 text-sm font-black uppercase tracking-[0.2em] text-white">المساحات</h4>
            <ul className="grid gap-4 text-base font-bold text-slate-400">
              <li className="hover:text-white transition-colors cursor-pointer flex items-center gap-2">
                استوديو التصوير
              </li>
              <li className="hover:text-white transition-colors cursor-pointer flex items-center gap-2">
                غرف البودكاست
              </li>
              <li className="hover:text-white transition-colors cursor-pointer flex items-center gap-2">
                قاعات التدريب
              </li>
              <li className="hover:text-white transition-colors cursor-pointer flex items-center gap-2">
                مساحات العمل
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="mb-8 text-sm font-black uppercase tracking-[0.2em] text-white">تواصل معنا</h4>
            <ul className="grid gap-5 text-base font-bold">
              <li className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center shrink-0">
                  <MapPin size={18} className="text-orange-500" />
                </div>
                <span className="leading-relaxed">مدينة نصر، شارع عباس العقاد، القاهرة</span>
              </li>
              <li className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center shrink-0">
                  <Phone size={18} className="text-orange-500" />
                </div>
                <a href="tel:+201234567890" className="hover:text-orange-500 transition-colors" dir="ltr">+20 123 456 7890</a>
              </li>
              <li className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center shrink-0">
                  <Mail size={18} className="text-orange-500" />
                </div>
                <a href="mailto:info@eduvers.com" className="hover:text-orange-500 transition-colors">info@eduvers.com</a>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-24 border-t border-slate-800 pt-10 flex flex-col md:flex-row items-center justify-between gap-6 text-sm text-slate-500 font-bold">
          <p>© {new Date().getFullYear()} إديوفيرس (Eduvers). جميع الحقوق محفوظة.</p>
          <div className="flex gap-8">
            <a href="#" className="hover:text-white transition-colors">سياسة الخصوصية</a>
            <a href="#" className="hover:text-white transition-colors">الشروط والأحكام</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
