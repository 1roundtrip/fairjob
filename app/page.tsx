import Navbar from "@/components/Navbar";
import JobCard from "@/components/JobCard";
import FilterBar from "@/components/FilterBar";
import EducationBadge from "@/components/EducationBadge";
import DeadlineWidget from "@/components/DeadlineWidget";
import NewCompaniesWidget from "@/components/NewCompaniesWidget";
import { getJobList, getLowProfileCompanies, getStatistics, getNewCompaniesThisWeek } from "@/lib/services/job-service";
import {
  BACHELOR_FILTER,
  ASSOCIATE_FILTER,
  ALL_EDUCATION_OPTIONS,
  EDUCATION_LABELS,
} from "@/lib/constants";
import { cn } from "@/lib/utils";
import Link from "next/link";

// 反算法原则: 默认按时间倒序，不记录用户偏好
// 页面为 Server Component，搜索使用 URL 参数（不持久化）

type FilterMode = "all" | "bachelor" | "associate";

export default async function Home({
  searchParams,
}: {
  searchParams: {
    q?: string;
    loc?: string;
    edu?: string;
    mode?: string;
    page?: string;
  };
}) {
  const page = parseInt(searchParams.page || "1", 10);
  const keyword = searchParams.q || "";
  const location = searchParams.loc || "";
  const modeParam = (searchParams.mode as FilterMode) || "all";

  // 解析学历筛选
  let education: typeof ALL_EDUCATION_OPTIONS = [...ALL_EDUCATION_OPTIONS];
  if (searchParams.edu) {
    const parsed = searchParams.edu
      .split(",")
      .filter((e) => ALL_EDUCATION_OPTIONS.includes(e as any)) as typeof ALL_EDUCATION_OPTIONS;
    if (parsed.length > 0) education = parsed;
  }

  // 本专科快捷模式
  let filterMode: FilterMode = modeParam;
  if (filterMode === "bachelor") {
    education = BACHELOR_FILTER as any;
  } else if (filterMode === "associate") {
    education = ASSOCIATE_FILTER as any;
  }

  const [jobList, stats, lowProfileCompanies, newCompanies] = await Promise.all([
    getJobList({
      page,
      pageSize: 20,
      keyword,
      location,
      education,
      sortBy: "newest",
    }),
    getStatistics(),
    getLowProfileCompanies(5),
    getNewCompaniesThisWeek(8),
  ]);

  const totalPages = Math.ceil(jobList.total / jobList.pageSize);

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 顶部标题区 */}
        <div className="text-center mb-8">
          <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent">
            FairJob 公平求职平台
          </h1>
          <p className="mt-3 text-gray-600 max-w-2xl mx-auto">
            打破算法茧房，公平聚合全网招聘信息。
            <span className="text-blue-600 font-medium">默认按时间倒序</span>，
            不记录用户偏好，让每个人看到同样的机会。
          </p>
        </div>

        {/* 本专科分离 - 低调按钮组 */}
        <div className="flex justify-center mb-6">
          <div className="inline-flex rounded-lg bg-gray-100 p-1">
            <Link
              href={{
                pathname: "/",
                query: { ...searchParams, mode: "all", edu: undefined },
              }}
              className={cn(
                "px-4 py-2 text-sm font-medium rounded-md transition-all",
                filterMode === "all"
                  ? "bg-white text-gray-900 shadow-sm"
                  : "text-gray-600 hover:text-gray-900"
              )}
            >
              全部岗位
            </Link>
            <Link
              href={{
                pathname: "/",
                query: { ...searchParams, mode: "bachelor", edu: undefined },
              }}
              className={cn(
                "px-4 py-2 text-sm font-medium rounded-md transition-all",
                filterMode === "bachelor"
                  ? "bg-blue-600 text-white shadow-sm"
                  : "text-gray-600 hover:text-gray-900"
              )}
            >
              本科生专属
            </Link>
            <Link
              href={{
                pathname: "/",
                query: { ...searchParams, mode: "associate", edu: undefined },
              }}
              className={cn(
                "px-4 py-2 text-sm font-medium rounded-md transition-all",
                filterMode === "associate"
                  ? "bg-green-600 text-white shadow-sm"
                  : "text-gray-600 hover:text-gray-900"
              )}
            >
              专科生专属
            </Link>
          </div>
        </div>

        {/* 透明提示 */}
        {filterMode !== "all" && (
          <div className="max-w-2xl mx-auto mb-6">
            <div
              className={cn(
                "p-3 rounded-lg text-sm text-center",
                filterMode === "bachelor"
                  ? "bg-blue-50 text-blue-700 border border-blue-100"
                  : "bg-green-50 text-green-700 border border-green-100"
              )}
            >
              {filterMode === "bachelor"
                ? "当前显示「本科生专属」职位（本科及以上 + 仅本科）。"
                : "当前显示「专科生专属」职位（专科及以上 + 仅专科）。"}
              <span className="ml-2 underline cursor-pointer">
                <Link href={{ pathname: "/", query: { ...searchParams, mode: "all" } }}>
                  查看全部
                </Link>
              </span>
            </div>
          </div>
        )}

        {/* 筛选栏 - 通过 URL 参数驱动，刷新恢复默认（反算法：不记录用户选择） */}
        <FilterBar className="mb-4" />

        {/* 本周新开公司 */}
        {newCompanies.length > 0 && (
          <NewCompaniesWidget companies={newCompanies} />
        )}

        <div className="flex flex-col lg:flex-row gap-6 mt-6">
          {/* 职位列表 */}
          <div className="flex-1">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">
                最新职位
                <span className="ml-2 text-sm font-normal text-gray-500">
                  共 {jobList.total.toLocaleString()} 条
                </span>
              </h2>
              <div className="flex items-center gap-3">
                <Link
                  href="/random"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm text-purple-700 bg-purple-50 rounded-lg hover:bg-purple-100 transition-colors"
                >
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                    />
                  </svg>
                  随机探索
                </Link>
                <span className="text-xs text-gray-400">按发布时间倒序</span>
              </div>
            </div>

            {jobList.items.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {jobList.items.map((job) => (
                  <JobCard key={job.id} job={job} />
                ))}
              </div>
            ) : (
              <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
                <svg
                  className="w-16 h-16 text-gray-300 mx-auto mb-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <p className="text-gray-500">暂无符合条件的职位</p>
                <p className="text-sm text-gray-400 mt-1">
                  试试调整筛选条件，或等待抓取更多数据
                </p>
              </div>
            )}

            {/* 分页 */}
            {totalPages > 1 && (
              <div className="flex justify-center items-center gap-2 mt-8">
                {page > 1 && (
                  <Link
                    href={{
                      pathname: "/",
                      query: { ...searchParams, page: page - 1 },
                    }}
                    className="px-3 py-2 text-sm border border-gray-200 rounded-lg hover:bg-gray-50"
                  >
                    上一页
                  </Link>
                )}
                <span className="px-4 py-2 text-sm text-gray-600">
                  {page} / {totalPages}
                </span>
                {page < totalPages && (
                  <Link
                    href={{
                      pathname: "/",
                      query: { ...searchParams, page: page + 1 },
                    }}
                    className="px-3 py-2 text-sm border border-gray-200 rounded-lg hover:bg-gray-50"
                  >
                    下一页
                  </Link>
                )}
              </div>
            )}
          </div>

          {/* 侧边栏 */}
          <aside className="w-full lg:w-72 space-y-6">
            {/* 数据统计卡片 */}
            <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
              <h3 className="font-semibold text-gray-900 mb-4">数据概览</h3>
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">总职位数</span>
                  <span className="font-medium text-gray-900">
                    {stats.totalJobs.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">本周新增</span>
                  <span className="font-medium text-green-600">
                    +{stats.newThisWeek}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">活跃来源</span>
                  <span className="font-medium text-gray-900">
                    {stats.totalSources}
                  </span>
                </div>
              </div>
            </div>

            {/* 学历分布 */}
            <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
              <h3 className="font-semibold text-gray-900 mb-4">学历分布</h3>
              <div className="space-y-2">
                {stats.educationBreakdown
                  .sort((a, b) => b.count - a.count)
                  .map((item) => (
                    <div key={item.education} className="flex items-center gap-3">
                      <EducationBadge education={item.education} size="sm" />
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
                      <span className="text-xs text-gray-500 w-10 text-right">
                        {item.count}
                      </span>
                    </div>
                  ))}
              </div>
            </div>

            {/* 网申截止倒计时 */}
            <DeadlineWidget />

            {/* 低调公司推荐 */}
            {lowProfileCompanies.length > 0 && (
              <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-xl border border-amber-200 p-5 shadow-sm">
                <div className="flex items-center gap-2 mb-4">
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
                      d="M13 10V3L4 14h7v7l9-11h-7z"
                    />
                  </svg>
                  <h3 className="font-semibold text-amber-900">低调公司推荐</h3>
                </div>
                <p className="text-xs text-amber-700 mb-3">
                  岗位多但曝光少，竞争更小的好机会
                </p>
                <div className="space-y-2">
                  {lowProfileCompanies.map((company) => (
                    <div
                      key={company.companyName}
                      className="flex items-center justify-between py-1.5"
                    >
                      <span className="text-sm text-amber-900 font-medium truncate">
                        {company.companyName}
                      </span>
                      <span className="text-xs text-amber-600 whitespace-nowrap ml-2">
                        {company.jobCount} 个岗位
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 反算法声明 */}
            <div className="bg-blue-50 rounded-xl border border-blue-100 p-4">
              <div className="flex items-start gap-3">
                <svg
                  className="w-5 h-5 text-blue-600 mt-0.5 shrink-0"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                  />
                </svg>
                <div>
                  <p className="text-sm font-medium text-blue-900">
                    反算法承诺
                  </p>
                  <p className="text-xs text-blue-700 mt-1">
                    所有职位按发布时间倒序排列，不记录你的浏览历史，不做个性化推荐。
                    每个人看到的列表都是一样的。
                  </p>
                </div>
              </div>
            </div>
          </aside>
        </div>
      </main>

      {/* 页脚 */}
      <footer className="border-t border-gray-200 mt-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center text-sm text-gray-500">
            <p className="mb-2">
              FairJob 公平求职平台 · 信息源自各招聘网站，本平台仅聚合展示
            </p>
            <p className="text-gray-400 text-xs">
              仅用于个人非商业求职用途 · 严格遵守 robots.txt · 仅抓取公开页面
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
