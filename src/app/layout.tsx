import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Account 관리 시스템",
  description: "회사/사업자별 입출금 및 프로젝트 관리 시스템",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body className="bg-gray-50">{children}</body>
    </html>
  );
}

