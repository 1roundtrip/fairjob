import Navbar from "@/components/Navbar";
import { getStatistics } from "@/lib/services/job-service";
import { prisma } from "@/lib/prisma";
import { EDUCATION_LABELS } from "@/lib/constants";
import Link from "next/link";

export default async function AdminPage() {
  const stats = await getStatistics();
  const sources = await prisma.source.findMany({
    orderBy: { createdAt: "desc" },
    take: 10,
  });
  const pendingReviews = await prisma.reviewJob.count({
    where: { status: "PENDING" },
  });

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-2xl font-bold text-gray-900">管理后台</h1>
          <span className="text-sm text-gray-500">
            FairJob 平台管理
          </span>
        </div>

        {/* 统计卡片 */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
            <p className="text-sm text-gray-500">总职位数</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">
              {stats.totalJobs.toLocaleString()}
            </p>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
            <p className="text-sm text-gray-500">本周新增</p>
            <p className="text-2xl font-bold text-green-600 mt-1">
              +{stats.newThisWeek}
            </p>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
            <p className="text-sm text-gray-500">活跃来源</p>
            <p className="text-2xl font-bold text-blue-600 mt-1">
              {stats.totalSources}
            </p>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
            <p className="text-sm text-gray-500">待审核</p>
            <p className="text-2xl font-bold text-amber-600 mt-1">
              {pendingReviews}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* 学历分布 */}
          <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
            <h3 className="font-semibold text-gray-900 mb-4">学历分布</h3>
            <div className="space-y-3">
              {stats.educationBreakdown.length > 0 ? (
                stats.educationBreakdown
                  .sort((a, b) => b.count - a.count)
                  .map((item) => (
                    <div key={item.education} className="flex items-center gap-3">
                      <span className="text-sm text-gray-700 w-20">
                        {EDUCATION_LABELS[item.education]}
                      </span>
                      <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-blue-500 rounded-full"
                          style={{
                            width: `${stats.totalJobs > 0
                                ? (item.count / stats.totalJobs) * 100
                                : 0
                              }%`,
                          }}
                        />
                      </div>
                      <span className="text-sm text-gray-600 w-12 text-right">
                        {item.count}
                      </span>
                    </div>
                  ))
              ) : (
                <p className="text-sm text-gray-400">暂无数据</p>
              )}
            </div>
          </div>

          {/* 来源分布 */}
          <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm lg:col-span-2">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-900">数据源管理</h3>
              <Link
                href="/admin/sources"
                className="text-sm text-blue-600 hover:text-blue-700"
              >
                管理全部 →
              </Link>
            </div>
            {sources.length > 0 ? (
              <div className="space-y-2">
                {sources.map((source) => (
                  <div
                    key={source.id}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                  >
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {source.name}
                      </p>
                      <p className="text-xs text-gray-500">{source.url}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span
                        className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                          source.isActive
                            ? "bg-green-100 text-green-700"
                            : "bg-gray-100 text-gray-600"
                        }`}
                      >
                        {source.isActive ? "启用" : "禁用"}
                      </span>
                      <span className="text-xs text-gray-500">
                        {source.totalJobs} 职位
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-400">暂无数据源</p>
            )}
          </div>
        </div>

        {/* 快捷操作 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link
            href="/admin/sources"
            className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm hover:shadow-md transition-shadow"
          >
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center mb-3">
              <svg
                className="w-5 h-5 text-blue-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                />
              </svg>
            </div>
            <h3 className="font-semibold text-gray-900">数据源管理</h3>
            <p className="text-sm text-gray-500 mt-1">
              添加、启用、禁用抓取来源
            </p>
          </Link>

          <Link
            href="/admin/review"
            className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm hover:shadow-md transition-shadow"
          >
            <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center mb-3">
              <svg
                className="w-5 h-5 text-amber-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <h3 className="font-semibold text-gray-900">学历待审核</h3>
            <p className="text-sm text-gray-500 mt-1">
              {pendingReviews} 条待确认学历的职位
            </p>
          </Link>

          <Link
            href="/admin/stats"
            className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm hover:shadow-md transition-shadow"
          >
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center mb-3">
              <svg
                className="w-5 h-5 text-green-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                />
              </svg>
            </div>
            <h3 className="font-semibold text-gray-900">数据统计</h3>
            <p className="text-sm text-gray-500 mt-1">抓取趋势、来源排行</p>
          </Link>
        </div>
      </main>
    </div>
  );
}
