import type { Metadata } from "next";
import { Almarai, Source_Code_Pro } from "next/font/google";
import "./globals.css";
import { Providers } from "../components/providers";

const sans = Almarai({
  variable: "--font-sans",
  subsets: ["arabic"],
  weight: ["300", "400", "700", "800"],
  display: "swap",
});

const mono = Source_Code_Pro({
  variable: "--font-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "إديوفيرس | منصة التشغيل",
  description: "منصة إدارة تشغيل القاعات والخدمات",
};

import { Toaster } from "sonner";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ar" dir="rtl" className={`${sans.variable} ${mono.variable}`}>
      <body>
        <Providers>
          {children}
          <Toaster richColors position="top-center" dir="rtl" />
        </Providers>
      </body>
    </html>
  );
}
