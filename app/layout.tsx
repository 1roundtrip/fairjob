import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "FairJob - 公平求职聚合平台",
  description:
    "打破算法茧房，公平聚合全网招聘信息。本科/专科分类浏览，反个性化推荐，随机发现好工作。",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-CN">
      <body className="min-h-screen font-sans antialiased">
        {children}
      </body>
    </html>
  );
}
