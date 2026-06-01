import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "../components/providers";

// Fonts are loaded via globals.css @import to avoid build-time Google Fonts fetch failures
const sans = { variable: "--font-sans" };
const mono = { variable: "--font-mono" };

export const metadata: Metadata = {
  title: {
    default: "إديوفيرس | المنصة المتكاملة لإدارة المساحات التعليمية والبار",
    template: "%s | إديوفيرس"
  },
  description: "إديوفيرس هي المنصة الرائدة لإدارة مساحات العمل المشترك (Coworking Spaces)، الحجوزات، والبار. نظام متكامل يجمع بين السهولة والقوة في التشغيل.",
  keywords: ["مساحات عمل مشتركة", "إدارة حجز قاعات", "نظام POS للبار", "إدارة تعليمية", "Eduvers", "إدارة كافيهات"],
  authors: [{ name: "إديوفيرس" }],
  creator: "إديوفيرس",
  publisher: "إديوفيرس",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  openGraph: {
    type: "website",
    locale: "ar_EG",
    url: "https://edu-vers.com",
    siteName: "إديوفيرس",
    title: "إديوفيرس | نظام إدارة التشغيل المتكامل",
    description: "أدر مساحتك التعليمية، حجوزاتك، وطلبات البار من مكان واحد بكل سهولة واحترافية.",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "إديوفيرس - نظام الإدارة المتكامل",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "إديوفيرس | نظام إدارة التشغيل المتكامل",
    description: "أدر مساحتك التعليمية، حجوزاتك، وطلبات البار من مكان واحد بكل سهولة واحترافية.",
    images: ["/og-image.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
};

import { Toaster } from "sonner";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ar" dir="rtl" className={`${sans.variable} ${mono.variable}`}>
      <body className="antialiased">
        <Providers>
          {children}
          <Toaster richColors position="top-center" dir="rtl" />
        </Providers>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "Organization",
              "name": "إديوفيرس - Eduvers",
              "url": "https://edu-vers.com",
              "logo": "https://edu-vers.com/logo.png",
              "description": "المنصة المتكاملة لإدارة مساحات العمل المشترك، الحجوزات، والبار.",
              "address": {
                "@type": "PostalAddress",
                "addressCountry": "EG"
              },
              "contactPoint": {
                "@type": "ContactPoint",
                "telephone": "+20-XXX-XXXXXXX",
                "contactType": "customer service"
              }
            }),
          }}
        />
      </body>
    </html>
  );
}
