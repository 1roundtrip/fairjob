/**
 * 首页数据查询服务
 */

import { prisma } from "@/lib/prisma";
import { type EducationLevel } from "@/lib/constants";

export interface JobListQuery {
  page?: number;
  pageSize?: number;
  keyword?: string;
  location?: string;
  education?: EducationLevel[];
  source?: string;
  sortBy?: "newest" | "salary_desc" | "salary_asc";
}

export interface JobListResult {
  items: any[];
  total: number;
  page: number;
  pageSize: number;
}

/**
 * 查询职位列表
 * 默认按发布时间倒序（反算法原则：不根据用户行为调整）
 */
export async function getJobList(query: JobListQuery): Promise<JobListResult> {
  const page = query.page || 1;
  const pageSize = query.pageSize || 20;
  const skip = (page - 1) * pageSize;

  const where: any = {};

  if (query.keyword) {
    where.OR = [
      { title: { contains: query.keyword } },
      { company: { contains: query.keyword } },
    ];
  }

  if (query.location) {
    where.location = { contains: query.location };
  }

  if (query.education && query.education.length > 0) {
    where.education = { in: query.education };
  }

  if (query.source) {
    where.sourceName = query.source;
  }

  let orderBy: any = { publishedAt: "desc" };
  if (query.sortBy === "salary_desc") {
    orderBy = { salaryMax: "desc" };
  } else if (query.sortBy === "salary_asc") {
    orderBy = { salaryMin: "asc" };
  }
  // 默认始终按时间倒序，保证反算法

  const [items, total] = await Promise.all([
    prisma.job.findMany({
      where,
      orderBy: [orderBy, { createdAt: "desc" }],
      skip,
      take: pageSize,
      select: {
        id: true,
        title: true,
        company: true,
        location: true,
        salary: true,
        education: true,
        jobType: true,
        publishedAt: true,
        sourceName: true,
        sourceUrl: true,
        isMerged: true,
        mergeCount: true,
        createdAt: true,
      },
    }),
    prisma.job.count({ where }),
  ]);

  return { items, total, page, pageSize };
}

/**
 * 随机探索功能 - 从当前筛选条件下随机抽取 N 个不同公司的职位
 *
 * 反算法原则: 完全随机，打破个性化推荐茧房
 */
export async function getRandomJobs(
  count: number = 20,
  education?: EducationLevel[],
  location?: string
): Promise<any[]> {
  const where: any = {};

  if (education && education.length > 0) {
    where.education = { in: education };
  }

  if (location) {
    where.location = { contains: location };
  }

  // 获取所有符合条件的职位
  const allJobs = await prisma.job.findMany({
    where,
    select: {
      id: true,
      title: true,
      company: true,
      location: true,
      salary: true,
      education: true,
      jobType: true,
      publishedAt: true,
      sourceName: true,
      sourceUrl: true,
    },
    // 取足够多的数据用于随机
    take: 500,
    orderBy: { publishedAt: "desc" },
  });

  if (allJobs.length === 0) return [];

  // 按公司分组，保证多样性
  const byCompany = new Map<string, any[]>();
  for (const job of allJobs) {
    if (!byCompany.has(job.company)) {
      byCompany.set(job.company, []);
    }
    byCompany.get(job.company)!.push(job);
  }

  const companies = Array.from(byCompany.keys());

  // Fisher-Yates 洗牌
  for (let i = companies.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [companies[i], companies[j]] = [companies[j], companies[i]];
  }

  // 从每个公司选一个职位，直到凑够 count 个
  const result: any[] = [];
  for (const company of companies) {
    if (result.length >= count) break;
    const companyJobs = byCompany.get(company)!;
    const randomJob = companyJobs[Math.floor(Math.random() * companyJobs.length)];
    result.push(randomJob);
  }

  // 如果不够 count，再从剩余中补
  if (result.length < count && allJobs.length > result.length) {
    const remaining = allJobs.filter(
      (j) => !result.some((r) => r.id === j.id)
    );
    // 打乱
    for (let i = remaining.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [remaining[i], remaining[j]] = [remaining[j], remaining[i]];
    }
    result.push(...remaining.slice(0, count - result.length));
  }

  return result;
}

/**
 * "低调公司"推荐 - 人均岗位数高但曝光少的公司
 *
 * 算法:
 * 1. 计算 avgJobsPerDay (公司总岗位数 / 出现天数)
 * 2. 排除头部热门公司（按总岗位数前 20%）
 * 3. 按 avgJobsPerDay 降序取前 N 家
 */
export async function getLowProfileCompanies(limit: number = 5): Promise<
  {
    companyName: string;
    jobCount: number;
    dayCount: number;
    avgJobsPerDay: number;
  }[]
> {
  const stats = await prisma.companyStat.findMany({
    orderBy: { jobCount: "desc" },
    take: 100,
  });

  if (stats.length === 0) return [];

  // 排除前 20% 的热门公司
  const top20Threshold = Math.floor(stats.length * 0.2);
  const nonTopCompanies = stats.slice(top20Threshold);

  if (nonTopCompanies.length === 0) {
    nonTopCompanies.push(...stats.slice(0, Math.min(limit, stats.length)));
  }

  // 按人均日岗位数降序
  nonTopCompanies.sort((a, b) => b.avgJobsPerDay - a.avgJobsPerDay);

  return nonTopCompanies.slice(0, limit).map((s) => ({
    companyName: s.companyName,
    jobCount: s.jobCount,
    dayCount: s.dayCount,
    avgJobsPerDay: s.avgJobsPerDay,
  }));
}

/**
 * 数据统计 - 各维度计数
 */
export async function getStatistics(): Promise<{
  totalJobs: number;
  totalSources: number;
  pendingReview: number;
  educationBreakdown: { education: EducationLevel; count: number }[];
  sourceBreakdown: { sourceName: string; count: number }[];
  newThisWeek: number;
}> {
  const [totalJobs, totalSources, pendingReview] = await Promise.all([
    prisma.job.count(),
    prisma.source.count({ where: { isActive: true } }),
    prisma.reviewJob.count({ where: { status: "PENDING" } }),
  ]);

  // 各学历分布
  const educationStats = await prisma.job.groupBy({
    by: ["education"],
    _count: { education: true },
  });

  // 各来源分布
  const sourceStats = await prisma.job.groupBy({
    by: ["sourceName"],
    _count: { sourceName: true },
    orderBy: { _count: { sourceName: "desc" } },
    take: 10,
  });

  // 本周新增
  const weekAgo = new Date();
  weekAgo.setDate(weekAgo.getDate() - 7);
  const newThisWeek = await prisma.job.count({
    where: { createdAt: { gte: weekAgo } },
  });

  return {
    totalJobs,
    totalSources,
    pendingReview,
    educationBreakdown: educationStats.map((s) => ({
      education: s.education as EducationLevel,
      count: s._count.education,
    })),
    sourceBreakdown: sourceStats
      .filter((s) => s.sourceName)
      .map((s) => ({
        sourceName: s.sourceName!,
        count: s._count.sourceName,
      })),
    newThisWeek,
  };
}

/**
 * 本周新开校招的公司 - 找出本周首次出现的公司
 *
 * 算法:
 * 1. 找本周内新增的职位的公司集合
 * 2. 检查这些公司在本周之前是否有职位
 * 3. 只返回之前没有出现过的公司（即本周新开）
 * 4. 按该公司本周岗位数降序
 */
export async function getNewCompaniesThisWeek(
  limit: number = 10
): Promise<{ companyName: string; jobCount: number }[]> {
  const now = new Date();
  const weekStart = new Date();
  weekStart.setDate(now.getDate() - 7);
  weekStart.setHours(0, 0, 0, 0);

  // 本周新增的职位，按公司分组
  const thisWeekJobs = await prisma.job.groupBy({
    by: ["company"],
    where: { createdAt: { gte: weekStart } },
    _count: { company: true },
    orderBy: { _count: { company: "desc" } },
    take: 50,
  });

  if (thisWeekJobs.length === 0) return [];

  const thisWeekCompanies = thisWeekJobs.map((j) => j.company);

  // 看看这些公司在本周之前是否有职位
  const beforeWeekJobs = await prisma.job.groupBy({
    by: ["company"],
    where: {
      company: { in: thisWeekCompanies },
      createdAt: { lt: weekStart },
    },
    _count: { company: true },
  });

  const existingCompanies = new Set(beforeWeekJobs.map((j) => j.company));

  // 只保留本周新开的公司
  const newCompanies = thisWeekJobs.filter(
    (j) => !existingCompanies.has(j.company)
  );

  return newCompanies.slice(0, limit).map((j) => ({
    companyName: j.company,
    jobCount: j._count.company,
  }));
}
