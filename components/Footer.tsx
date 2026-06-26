import Link from "next/link";

export default function Footer() {
  return (
    <footer className="relative z-10 border-t border-white/[0.08] bg-white/[0.02] backdrop-blur-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="text-center md:text-left">
            <p className="text-xs text-white/40">
              本网站所有职位信息均源于网络公开页面，仅作聚合展示，不对信息真实性负责。
            </p>
            <p className="text-xs text-white/30 mt-1">
              请以各企业官网发布为准。
            </p>
          </div>
          <div className="flex items-center gap-4 text-xs text-white/30">
            <span>FairJob 公平求职</span>
            <span>·</span>
            <Link href="/admin/login" className="hover:text-white/50 transition-colors">
              管理后台
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
