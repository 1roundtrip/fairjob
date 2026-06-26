import Navbar from "@/components/Navbar";

export default function CalendarPage() {
  return (
    <div className="min-h-screen relative z-10">
      <Navbar />

      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-2xl font-bold text-white mb-6">校招日历</h1>
        <div className="glass-card p-12 text-center">
          <p className="text-white/50">校招日历功能开发中...</p>
          <p className="text-sm text-white/40 mt-2">
            将展示各公司校招宣讲会、截止日期等时间线信息
          </p>
        </div>
      </main>
    </div>
  );
}
