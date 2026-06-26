"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const navLinks = [
  { href: "/", label: "全部岗位" },
  { href: "/calendar", label: "校招日历" },
  { href: "/random", label: "随机探索" },
  { href: "/favorites", label: "我的收藏" },
  { href: "/admin", label: "管理后台" },
];

export default function Navbar() {
  const pathname = usePathname();

  return (
    <nav className="sticky top-0 z-50 bg-white/[0.03] backdrop-blur-xl border-b border-white/[0.08]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <Link href="/" className="flex items-center space-x-2 group">
            <div className="relative w-9 h-9 rounded-lg flex items-center justify-center transition-all duration-300 group-hover:scale-105">
              <div className="absolute inset-0 bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 rounded-lg opacity-80 blur-[6px] group-hover:opacity-100 transition-opacity duration-300"></div>
              <div className="relative w-full h-full bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
                <svg
                  className="w-5 h-5 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7V6m-3 4h18M9 10h.01M13 14h.01M9 14v-4h6v4M9 14v0m0 0l3-4m3 4l3-4m-3 4v0"
                  />
                </svg>
              </div>
            </div>
            <span className="text-lg font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-300 via-purple-300 to-pink-300 drop-shadow-[0_0_20px_rgba(139,92,246,0.3)]">
              FairJob
            </span>
          </Link>

          <div className="hidden md:flex items-center space-x-1">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "relative px-4 py-2 rounded-xl text-sm font-medium transition-all duration-300 ease-out",
                  pathname === link.href
                    ? "text-white bg-white/[0.08] border border-white/[0.12] shadow-[0_0_20px_rgba(139,92,246,0.15)]"
                    : "text-white/60 hover:text-white hover:bg-white/[0.05] hover:border-white/[0.08] border border-transparent"
                )}
              >
                {pathname === link.href && (
                  <span className="absolute inset-0 rounded-xl bg-gradient-to-r from-indigo-500/10 via-purple-500/10 to-pink-500/10 -z-10"></span>
                )}
                {link.label}
              </Link>
            ))}
          </div>

          <div className="flex items-center space-x-3">
            <span className="hidden sm:inline-flex items-center px-3 py-1.5 rounded-full text-xs font-medium border border-emerald-500/30 bg-emerald-500/10 text-emerald-300 shadow-[0_0_15px_rgba(16,185,129,0.2)]">
              <span className="relative w-2 h-2 bg-emerald-400 rounded-full mr-2">
                <span className="absolute inset-0 bg-emerald-400 rounded-full animate-ping opacity-60"></span>
              </span>
              反算法
            </span>
          </div>
        </div>
      </div>
    </nav>
  );
}
