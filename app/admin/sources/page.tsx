import Navbar from "@/components/Navbar";
import { prisma } from "@/lib/prisma";
import { SOURCE_TYPE_LABELS } from "@/lib/constants";
import Link from "next/link";

export default async function SourcesPage() {
  const sources = await prisma.source.findMany({
    orderBy: [{ isActive: "desc" }, { createdAt: "desc" }],
  });

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-gray-900">数据源管理</h1>
          <Link
            href="/admin"
            className="text-sm text-gray-500 hover:text-gray-700"
          >
            ← 返回后台
          </Link>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  来源名称
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  类型
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  状态
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  职位数
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  上次抓取
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  操作
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {sources.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="px-6 py-12 text-center text-gray-400"
                  >
                    暂无数据源，运行种子脚本后将自动添加默认来源
                  </td>
                </tr>
              ) : (
                sources.map((source) => (
                  <tr key={source.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          {source.name}
                        </p>
                        <p className="text-xs text-gray-500 truncate max-w-xs">
                          {source.url}
                        </p>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {(SOURCE_TYPE_LABELS as any)[source.type] || source.type}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${
                          source.isActive
                            ? "bg-green-100 text-green-700"
                            : "bg-gray-100 text-gray-600"
                        }`}
                      >
                        {source.isActive ? "启用" : "禁用"}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {source.totalJobs}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
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
                          className="text-blue-600 hover:text-blue-700"
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

        <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-100">
          <h3 className="font-medium text-blue-900 mb-2">💡 添加数据源</h3>
          <p className="text-sm text-blue-700">
            你可以直接在数据库中添加 Source 记录，或通过 API 创建。
            数据源类型支持：官方平台、高校就业网、企业官网、RSS、搜索发现。
          </p>
        </div>
      </main>
    </div>
  );
}
