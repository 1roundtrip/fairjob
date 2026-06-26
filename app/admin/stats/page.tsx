import Navbar from "@/components/Navbar";
import { getStatistics } from "@/lib/services/job-service";
import { prisma } from "@/lib/prisma";
import { EDUCATION_LABELS } from "@/lib/constants";
import Link from "next/link";

export default async function StatsPage() {
  const stats = await getStatistics();
  const crawlLogs = await prisma.crawlLog.findMany({
    orderBy: { createdAt: "desc" },
    take: 20,
  });

  return (
    <div className="min-h-screen relative z-10">
      <Navbar />

      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-white">数据统计</h1>
          <Link
            href="/admin"
            className="text-sm text-white/50 hover:text-white/70"
          >
            ← 返回后台
          </Link>
        </div>

        {/* 核心指标 */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="glass-card p-5">
            <p className="text-sm text-white/60">总职位数</p>
            <p className="text-2xl font-bold text-white mt-1">
              {stats.totalJobs.toLocaleString()}
            </p>
          </div>
          <div className="glass-card p-5">
            <p className="text-sm text-white/60">活跃来源</p>
            <p className="text-2xl font-bold text-blue-300 mt-1">
              {stats.totalSources}
            </p>
          </div>
          <div className="glass-card p-5">
            <p className="text-sm text-white/60">本周新增</p>
            <p className="text-2xl font-bold text-emerald-300 mt-1">
              +{stats.newThisWeek}
            </p>
          </div>
          <div className="glass-card p-5">
            <p className="text-sm text-white/60">待审核</p>
            <p className="text-2xl font-bold text-amber-300 mt-1">
              {stats.pendingReview}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {/* 学历分布 */}
          <div className="glass-card p-5">
            <h3 className="font-semibold text-white mb-4">各学历岗位数量</h3>
            <div className="space-y-3">
              {stats.educationBreakdown.length > 0 ? (
                stats.educationBreakdown
                  .sort((a, b) => b.count - a.count)
                  .map((item) => (
                    <div key={item.education} className="flex items-center gap-3">
                      <span className="text-sm text-white/70 w-24">
                        {EDUCATION_LABELS[item.education]}
                      </span>
                      <div className="flex-1 h-6 bg-white/[0.05] rounded-lg overflow-hidden relative">
                        <div
                          className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-lg"
                          style={{
                            width: `${stats.totalJobs > 0
                                ? (item.count / stats.totalJobs) * 100
                                : 0
                              }%`,
                          }}
                        />
                        <span className="absolute inset-0 flex items-center px-3 text-xs font-medium text-white">
                          {item.count}
                        </span>
                      </div>
                    </div>
                  ))
              ) : (
                <p className="text-sm text-white/40">暂无数据</p>
              )}
            </div>
          </div>

          {/* 来源排行 */}
          <div className="glass-card p-5">
            <h3 className="font-semibold text-white mb-4">来源抓取排行</h3>
            <div className="space-y-3">
              {stats.sourceBreakdown.length > 0 ? (
                stats.sourceBreakdown.map((item, idx) => (
                  <div key={item.sourceName} className="flex items-center gap-3">
                    <span className="text-sm text-white/40 w-5">#{idx + 1}</span>
                    <span className="text-sm text-white/70 flex-1 truncate">
                      {item.sourceName}
                    </span>
                    <span className="text-sm font-medium text-white">
                      {item.count}
                    </span>
                  </div>
                ))
              ) : (
                <p className="text-sm text-white/40">暂无数据</p>
              )}
            </div>
          </div>
        </div>

        {/* 抓取日志 */}
        <div className="glass-card overflow-hidden">
          <div className="px-5 py-4 border-b border-white/[0.08]">
            <h3 className="font-semibold text-white">最近抓取记录</h3>
          </div>
          {crawlLogs.length === 0 ? (
            <div className="p-8 text-center text-white/40 text-sm">
              暂无抓取记录
            </div>
          ) : (
            <div className="divide-y divide-white/[0.05]">
              {crawlLogs.map((log) => (
                <div key={log.id} className="px-5 py-3 flex items-center gap-4 flex-wrap">
                  <span className="text-sm text-white font-medium w-32 truncate">
                    {log.sourceName || "未知来源"}
                  </span>
                  <span className="text-xs text-emerald-300">
                    +{log.jobsAdded} 新增
                  </span>
                  <span className="text-xs text-blue-300">
                    {log.jobsFound} 发现
                  </span>
                  {log.jobsReview > 0 && (
                    <span className="text-xs text-amber-300">
                      {log.jobsReview} 待审
                    </span>
                  )}
                  {log.errorMessage && (
                    <span className="text-xs text-red-300 truncate max-w-xs">
                      错误: {log.errorMessage}
                    </span>
                  )}
                  <span className="text-xs text-white/40 ml-auto">
                    {new Date(log.createdAt).toLocaleString("zh-CN")}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
