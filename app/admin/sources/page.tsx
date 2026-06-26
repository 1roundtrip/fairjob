import Navbar from "@/components/Navbar";
import { prisma } from "@/lib/prisma";
import { SOURCE_TYPE_LABELS } from "@/lib/constants";
import Link from "next/link";

export default async function SourcesPage() {
  const sources = await prisma.source.findMany({
    orderBy: [{ isActive: "desc" }, { createdAt: "desc" }],
  });

  return (
    <div className="min-h-screen relative z-10">
      <Navbar />

      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-white">数据源管理</h1>
          <Link
            href="/admin"
            className="text-sm text-white/50 hover:text-white/70"
          >
            ← 返回后台
          </Link>
        </div>

        <div className="glass-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-white/[0.08]">
              <thead className="bg-white/[0.03]">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-white/50 uppercase tracking-wider">
                    来源名称
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-white/50 uppercase tracking-wider">
                    类型
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-white/50 uppercase tracking-wider">
                    状态
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-white/50 uppercase tracking-wider">
                    职位数
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-white/50 uppercase tracking-wider">
                    上次抓取
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-white/50 uppercase tracking-wider">
                    操作
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.05]">
                {sources.length === 0 ? (
                  <tr>
                    <td
                      colSpan={6}
                      className="px-6 py-12 text-center text-white/40"
                    >
                      暂无数据源，运行种子脚本后将自动添加默认来源
                    </td>
                  </tr>
                ) : (
                  sources.map((source) => (
                    <tr key={source.id} className="hover:bg-white/[0.03] transition-colors">
                      <td className="px-6 py-4">
                        <div>
                          <p className="text-sm font-medium text-white">
                            {source.name}
                          </p>
                          <p className="text-xs text-white/50 truncate max-w-xs">
                            {source.url}
                          </p>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-white/60">
                        {(SOURCE_TYPE_LABELS as any)[source.type] || source.type}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-medium border ${
                            source.isActive
                              ? "bg-emerald-500/15 text-emerald-300 border-emerald-400/30"
                              : "bg-white/[0.05] text-white/50 border-white/[0.1]"
                          }`}
                        >
                          {source.isActive ? "启用" : "禁用"}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-white">
                        {source.totalJobs}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-white/50">
                        {source.lastCrawledAt
                          ? new Date(source.lastCrawledAt).toLocaleDateString(
                              "zh-CN"
                            )
                          : "从未"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm space-x-2">
                        <form action={`/api/admin/sources/${source.id}/crawl`} method="POST">
                          <button
                            type="submit"
                            className="text-indigo-300 hover:text-indigo-200 transition-colors"
                          >
                            抓取测试
                          </button>
                        </form>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="mt-6 p-4 bg-indigo-500/10 rounded-lg border border-indigo-400/30">
          <h3 className="font-medium text-indigo-200 mb-2">💡 添加数据源</h3>
          <p className="text-sm text-indigo-200/70">
            你可以直接在数据库中添加 Source 记录，或通过 API 创建。
            数据源类型支持：官方平台、高校就业网、企业官网、RSS、搜索发现。
          </p>
        </div>
      </main>
    </div>
  );
}
