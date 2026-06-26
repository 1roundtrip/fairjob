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

  let education: typeof ALL_EDUCATION_OPTIONS = [...ALL_EDUCATION_OPTIONS];
  if (searchParams.edu) {
    const parsed = searchParams.edu
      .split(",")
      .filter((e) => ALL_EDUCATION_OPTIONS.includes(e as any)) as typeof ALL_EDUCATION_OPTIONS;
    if (parsed.length > 0) education = parsed;
  }

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
    <div className="min-h-screen relative">
      <div className="relative z-10">
        <Navbar />

        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Hero 顶部标题区 */}
          <div
            className="text-center mb-10 opacity-0 animate-fade-in-up"
            style={{ animationDelay: "100ms", animationFillMode: "forwards" }}
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/[0.05] border border-white/[0.1] mb-6">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span className="text-sm text-white/60">实时更新 · 反算法推荐</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-4">
              <span className="glow-text">FairJob</span>
              <span className="text-white"> 公平求职平台</span>
            </h1>
            <p className="text-white/60 max-w-2xl mx-auto text-lg">
              打破算法茧房，公平聚合全网招聘信息。
              <span className="text-indigo-300 font-medium"> 默认按时间倒序</span>
              ，不记录用户偏好，让每个人看到同样的机会。
            </p>
          </div>

          {/* 本专科分离 - 胶囊按钮组 */}
          <div
            className="flex justify-center mb-8 opacity-0 animate-fade-in-up"
            style={{ animationDelay: "200ms", animationFillMode: "forwards" }}
          >
            <div className="inline-flex p-1 rounded-2xl bg-white/[0.04] border border-white/[0.08] backdrop-blur-xl">
              <Link
                href={{
                  pathname: "/",
                  query: { ...searchParams, mode: "all", edu: undefined },
                }}
                className={cn(
                  "px-5 py-2.5 text-sm font-medium rounded-xl transition-all duration-300",
                  filterMode === "all"
                    ? "bg-white/10 text-white border border-white/10 shadow-lg shadow-white/5"
                    : "text-white/50 hover:text-white/80"
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
                  "px-5 py-2.5 text-sm font-medium rounded-xl transition-all duration-300",
                  filterMode === "bachelor"
                    ? "bg-gradient-to-r from-indigo-500/20 to-purple-500/20 text-white border border-indigo-400/30 shadow-lg shadow-indigo-500/20"
                    : "text-white/50 hover:text-white/80"
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
                  "px-5 py-2.5 text-sm font-medium rounded-xl transition-all duration-300",
                  filterMode === "associate"
                    ? "bg-gradient-to-r from-emerald-500/20 to-teal-500/20 text-white border border-emerald-400/30 shadow-lg shadow-emerald-500/20"
                    : "text-white/50 hover:text-white/80"
                )}
              >
                专科生专属
              </Link>
            </div>
          </div>

          {/* 筛选提示 */}
          {filterMode !== "all" && (
            <div
              className="max-w-2xl mx-auto mb-6 opacity-0 animate-fade-in-up"
              style={{ animationDelay: "250ms", animationFillMode: "forwards" }}
            >
              <div
                className={cn(
                  "p-4 rounded-2xl text-sm text-center backdrop-blur-xl",
                  filterMode === "bachelor"
                    ? "bg-indigo-500/10 text-indigo-200/80 border border-indigo-400/20"
                    : "bg-emerald-500/10 text-emerald-200/80 border border-emerald-400/20"
                )}
              >
                {filterMode === "bachelor"
                  ? "当前显示「本科生专属」职位（本科及以上 + 仅本科）。"
                  : "当前显示「专科生专属」职位（专科及以上 + 仅专科）。"}
                <Link
                  href={{ pathname: "/", query: { ...searchParams, mode: "all" } }}
                  className="ml-2 underline underline-offset-2 hover:text-white transition-colors"
                >
                  查看全部
                </Link>
              </div>
            </div>
          )}

          {/* 筛选栏 */}
          <div
            className="opacity-0 animate-fade-in-up"
            style={{ animationDelay: "300ms", animationFillMode: "forwards" }}
          >
            <FilterBar className="mb-6" />
          </div>

          {/* 本周新开公司 */}
          {newCompanies.length > 0 && (
            <div
              className="opacity-0 animate-fade-in-up"
              style={{ animationDelay: "350ms", animationFillMode: "forwards" }}
            >
              <NewCompaniesWidget companies={newCompanies} />
            </div>
          )}

          <div className="flex flex-col lg:flex-row gap-6 mt-8">
            {/* 职位列表 */}
            <div
              className="flex-1 opacity-0 animate-fade-in-up"
              style={{ animationDelay: "400ms", animationFillMode: "forwards" }}
            >
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-lg font-semibold text-white">
                  最新职位
                  <span className="ml-2 text-sm font-normal text-white/40">
                    共 {jobList.total.toLocaleString()} 条
                  </span>
                </h2>
                <div className="flex items-center gap-3">
                  <Link
                    href="/random"
                    className="inline-flex items-center gap-1.5 px-4 py-2 text-sm text-purple-300 bg-purple-500/15 border border-purple-400/25 rounded-xl hover:bg-purple-500/25 transition-all duration-300"
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
                  <span className="text-xs text-white/30">按发布时间倒序</span>
                </div>
              </div>

              {jobList.items.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {jobList.items.map((job, index) => (
                    <div
                      key={job.id}
                      className="opacity-0 animate-fade-in-up"
                      style={{
                        animationDelay: `${450 + index * 50}ms`,
                        animationFillMode: "forwards",
                      }}
                    >
                      <JobCard job={job} />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="glass-card p-12 text-center">
                  <svg
                    className="w-16 h-16 text-white/20 mx-auto mb-4"
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
                  <p className="text-white/60">暂无符合条件的职位</p>
                  <p className="text-sm text-white/40 mt-1">
                    试试调整筛选条件，或等待抓取更多数据
                  </p>
                </div>
              )}

              {/* 分页 */}
              {totalPages > 1 && (
                <div className="flex justify-center items-center gap-2 mt-10">
                  {page > 1 && (
                    <Link
                      href={{
                        pathname: "/",
                        query: { ...searchParams, page: page - 1 },
                      }}
                      className="px-4 py-2.5 text-sm border border-white/10 rounded-xl hover:bg-white/5 text-white/70 transition-all"
                    >
                      上一页
                    </Link>
                  )}
                  <span className="px-5 py-2.5 text-sm text-white/50 glass-card">
                    {page} / {totalPages}
                  </span>
                  {page < totalPages && (
                    <Link
                      href={{
                        pathname: "/",
                        query: { ...searchParams, page: page + 1 },
                      }}
                      className="px-4 py-2.5 text-sm border border-white/10 rounded-xl hover:bg-white/5 text-white/70 transition-all"
                    >
                      下一页
                    </Link>
                  )}
                </div>
              )}
            </div>

            {/* 侧边栏 */}
            <aside
              className="w-full lg:w-72 space-y-5 opacity-0 animate-fade-in-up"
              style={{ animationDelay: "500ms", animationFillMode: "forwards" }}
            >
              {/* 数据统计卡片 */}
              <div className="glass-card p-5">
                <h3 className="font-semibold text-white mb-4">数据概览</h3>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-white/50 text-sm">总职位数</span>
                    <span className="font-semibold text-white text-lg">
                      {stats.totalJobs.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-white/50 text-sm">本周新增</span>
                    <span className="font-medium text-emerald-400">
                      +{stats.newThisWeek}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-white/50 text-sm">活跃来源</span>
                    <span className="font-medium text-white">
                      {stats.totalSources}
                    </span>
                  </div>
                </div>
              </div>

              {/* 学历分布 */}
              <div className="glass-card p-5">
                <h3 className="font-semibold text-white mb-4">学历分布</h3>
                <div className="space-y-3">
                  {stats.educationBreakdown
                    .sort((a, b) => b.count - a.count)
                    .map((item) => (
                      <div key={item.education} className="flex items-center gap-3">
                        <EducationBadge education={item.education} size="sm" />
                        <div className="flex-1 h-1.5 bg-white/5 rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-purple-500"
                            style={{
                              width: `${
                                stats.totalJobs > 0
                                  ? (item.count / stats.totalJobs) * 100
                                  : 0
                              }%`,
                            }}
                          />
                        </div>
                        <span className="text-xs text-white/40 w-8 text-right">
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
                <div className="glass-card p-5 relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
                  <div className="relative">
                    <div className="flex items-center gap-2 mb-4">
                      <svg
                        className="w-5 h-5 text-amber-400"
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
                      <h3 className="font-semibold text-white">低调公司推荐</h3>
                    </div>
                    <p className="text-xs text-white/50 mb-3">
                      岗位多但曝光少，竞争更小的好机会
                    </p>
                    <div className="space-y-2">
                      {lowProfileCompanies.map((company) => (
                        <div
                          key={company.companyName}
                          className="flex items-center justify-between py-2"
                        >
                          <span className="text-sm text-white/80 font-medium truncate">
                            {company.companyName}
                          </span>
                          <span className="text-xs text-amber-400/80 whitespace-nowrap ml-2">
                            {company.jobCount} 个岗位
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* 反算法声明 */}
              <div className="glass-card p-5 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-24 h-24 bg-indigo-500/10 rounded-full blur-3xl -translate-y-1/2 -translate-x-1/2"></div>
                <div className="relative flex items-start gap-3">
                  <svg
                    className="w-5 h-5 text-indigo-400 mt-0.5 shrink-0"
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
                    <p className="text-sm font-medium text-white">反算法承诺</p>
                    <p className="text-xs text-white/50 mt-1 leading-relaxed">
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
        <footer className="border-t border-white/[0.06] mt-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
            <div className="text-center text-sm text-white/30">
              <p className="mb-2">
                FairJob 公平求职平台 · 信息源自各招聘网站，本平台仅聚合展示
              </p>
              <p className="text-white/20 text-xs">
                仅用于个人非商业求职用途 · 严格遵守 robots.txt · 仅抓取公开页面
              </p>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}
