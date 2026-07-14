import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "بوابة أصحاب المشروع | Eduvers",
  description: "تقارير مالية وتشغيلية لأصحاب المشروع.",
  robots: { index: false, follow: false },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ar" dir="rtl">
      <body>{children}</body>
    </html>
  );
}
