import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ROSHA 입시평가회",
  description: "음악 입시평가회 온라인 시스템",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body className="antialiased bg-white text-gray-900 min-h-screen">
        {children}
      </body>
    </html>
  );
}
