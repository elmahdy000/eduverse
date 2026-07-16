import type { Metadata } from "next";
import Script from "next/script";
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
  const gaId = process.env.NEXT_PUBLIC_GA_ID;
  const pixelId = process.env.NEXT_PUBLIC_META_PIXEL_ID;

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

        {/* Google Analytics - Loaded only if configured */}
        {gaId && gaId !== "G-XXXXXXXXXX" && (
          <>
            <Script strategy="afterInteractive" src={`https://www.googletagmanager.com/gtag/js?id=${gaId}`} />
            <Script
              id="google-analytics"
              strategy="afterInteractive"
              dangerouslySetInnerHTML={{
                __html: `
                  window.dataLayer = window.dataLayer || [];
                  function gtag(){dataLayer.push(arguments);}
                  gtag('js', new Date());
                  gtag('config', '${gaId}', {
                    page_path: window.location.pathname,
                  });
                `,
              }}
            />
          </>
        )}

        {/* Meta Pixel - Loaded only if configured */}
        {pixelId && pixelId !== "0000000000000000" && (
          <Script
            id="meta-pixel"
            strategy="afterInteractive"
            dangerouslySetInnerHTML={{
              __html: `
                !function(f,b,e,v,n,t,s)
                {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
                n.callMethod.apply(n,arguments):n.queue.push(arguments)};
                if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
                n.queue=[];t=b.createElement(e);t.async=!0;
                t.src=v;s=b.getElementsByTagName(e)[0];
                s.parentNode.insertBefore(t,s)}(window, document,'script',
                'https://connect.facebook.net/en_US/fbevents.js');
                fbq('init', '${pixelId}');
                fbq('track', 'PageView');
              `,
            }}
          />
        )}
      </body>
    </html>
  );
}
