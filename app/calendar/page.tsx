import Navbar from "@/components/Navbar";

export default function CalendarPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">校招日历</h1>
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <p className="text-gray-500">校招日历功能开发中...</p>
          <p className="text-sm text-gray-400 mt-2">
            将展示各公司校招宣讲会、截止日期等时间线信息
          </p>
        </div>
      </main>
    </div>
  );
}
