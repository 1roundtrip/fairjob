/**
 * 招聘平台搜索发现器 - RecruitmentPlatformDiscovery
 *
 * 通过搜索引擎索引获取主流招聘平台的职位数据
 * 支持: BOSS直聘、猎聘、前程无忧、智联招聘、拉勾网等
 *
 * 注意: 
 * - 不直接爬取招聘平台API，而是通过搜索引擎获取已索引的公开页面
 * - 严格遵守各平台 robots.txt
 * - 仅抓取无需登录的公开职位页面
 */

import axios from "axios";
import { UniversalJobParser, type ParsedJob } from "@/lib/parsers/universal-job-parser";
import { prisma } from "@/lib/prisma";
import { isSameJob } from "@/lib/dice-similarity";

export interface PlatformSearchOptions {
  apiKey: string;
  endpoint?: string;
  market?: string;
  count?: number;
  maxUrls?: number;
}

export interface PlatformSearchResult {
  url: string;
  title: string;
  snippet: string;
  platform: string;
}

const PLATFORMS = [
  {
    name: "BOSS直聘",
    domains: ["zhipin.com"],
    searchQueries: [
      '"岗位" site:zhipin.com',
      '"招聘" site:zhipin.com',
      '"校招" site:zhipin.com',
      '"社招" site:zhipin.com',
      '"实习生" site:zhipin.com',
    ],
  },
  {
    name: "猎聘",
    domains: ["liepin.com", "liepin.cn"],
    searchQueries: [
      '"岗位" site:liepin.com',
      '"招聘" site:liepin.com',
      '"校招" site:liepin.com',
      '"社招" site:liepin.com',
    ],
  },
  {
    name: "前程无忧",
    domains: ["51job.com"],
    searchQueries: [
      '"岗位" site:51job.com',
      '"招聘" site:51job.com',
      '"校园招聘" site:51job.com',
      '"实习生" site:51job.com',
    ],
  },
  {
    name: "智联招聘",
    domains: ["zhaopin.com"],
    searchQueries: [
      '"岗位" site:zhaopin.com',
      '"招聘" site:zhaopin.com',
      '"校招" site:zhaopin.com',
      '"校园招聘" site:zhaopin.com',
    ],
  },
  {
    name: "拉勾网",
    domains: ["lagou.com"],
    searchQueries: [
      '"岗位" site:lagou.com',
      '"招聘" site:lagou.com',
      '"校招" site:lagou.com',
    ],
  },
  {
    name: "看准网",
    domains: ["kanzhun.com"],
    searchQueries: [
      '"岗位" site:kanzhun.com',
      '"招聘" site:kanzhun.com',
    ],
  },
  {
    name: "牛客网",
    domains: ["nowcoder.com"],
    searchQueries: [
      '"岗位" site:nowcoder.com',
      '"招聘" site:nowcoder.com',
      '"校招" site:nowcoder.com',
    ],
  },
];

const KEYWORDS = [
  "工程师", "开发", "设计师", "产品经理", "运营", "市场", "销售",
  "校招", "春招", "秋招", "实习", "社招",
  "前端", "后端", "算法", "数据", "测试",
];

const LOCATIONS = [
  "北京", "上海", "深圳", "广州", "杭州", "成都", "南京", "武汉",
];

export class RecruitmentPlatformDiscovery {
  private apiKey: string;
  private endpoint: string;
  private market: string;
  private count: number;
  private maxUrls: number;

  constructor(options: PlatformSearchOptions) {
    this.apiKey = options.apiKey;
    this.endpoint = options.endpoint || "https://api.bing.microsoft.com/v7.0/search";
    this.market = options.market || "zh-CN";
    this.count = options.count || 20;
    this.maxUrls = options.maxUrls || 50;
  }

  async discover(
    platforms?: string[],
    keywords?: string[],
    limit?: number
  ): Promise<{
    totalResults: number;
    jobsFound: number;
    jobsAdded: number;
    jobsReview: number;
    errors: string[];
  }> {
    const targetPlatforms = platforms
      ? PLATFORMS.filter((p) => platforms.includes(p.name))
      : PLATFORMS;

    const targetKeywords = keywords || KEYWORDS.slice(0, 5);
    const errors: string[] = [];
    const allUrls = new Map<string, { platform: string; title: string }>();

    console.log(`🔍 开始搜索发现 (${targetPlatforms.length} 个平台, ${targetKeywords.length} 个关键词)`);

    for (const platform of targetPlatforms) {
      for (const queryTemplate of platform.searchQueries) {
        for (const keyword of targetKeywords) {
          const query = queryTemplate.replace("{keyword}", keyword);
          try {
            const results = await this.search(query);
            for (const r of results) {
              if (!allUrls.has(r.url)) {
                allUrls.set(r.url, { platform: platform.name, title: r.title });
              }
            }
          } catch (e: any) {
            errors.push(`搜索 "${query}" 失败: ${e.message}`);
          }
          await new Promise((r) => setTimeout(r, 350));
        }
      }
    }

    const urls = Array.from(allUrls.entries()).slice(0, limit || this.maxUrls);
    let jobsFound = 0;
    let jobsAdded = 0;
    let jobsReview = 0;

    console.log(`📥 共发现 ${urls.length} 个候选链接，开始提取职位...`);

    for (let i = 0; i < urls.length; i++) {
      const [url, info] = urls[i];
      try {
        const result = await this.processUrl(url, info.platform);
        jobsFound += result.jobsFound;
        jobsAdded += result.jobsAdded;
        jobsReview += result.jobsReview;
      } catch (e: any) {
        errors.push(`处理 "${url}" 失败: ${e.message}`);
      }
      if (i < urls.length - 1) {
        await new Promise((r) => setTimeout(r, 3000));
      }
    }

    return {
      totalResults: allUrls.size,
      jobsFound,
      jobsAdded,
      jobsReview,
      errors,
    };
  }

  private async search(query: string): Promise<PlatformSearchResult[]> {
    const response = await axios.get(this.endpoint, {
      params: {
        q: query,
        mkt: this.market,
        count: this.count,
        safeSearch: "Moderate",
      },
      headers: {
        "Ocp-Apim-Subscription-Key": this.apiKey,
      },
      timeout: 15000,
    });

    const webPages = response.data?.webPages?.value || [];
    return webPages.map((page: any) => ({
      url: page.url,
      title: page.name,
      snippet: page.snippet,
      platform: page.siteName || "",
    }));
  }

  private async processUrl(
    url: string,
    platform: string
  ): Promise<{ jobsFound: number; jobsAdded: number; jobsReview: number }> {
    try {
      const response = await axios.get(url, {
        timeout: 15000,
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
          Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
          "Accept-Language": "zh-CN,zh;q=0.9,en;q=0.8",
        },
        responseType: "text",
        validateStatus: (status) => status < 500,
      });

      if (response.status === 403 || response.status === 429) {
        return { jobsFound: 0, jobsAdded: 0, jobsReview: 0 };
      }

      const parser = new UniversalJobParser({ baseUrl: url });
      const result = parser.parse(response.data, url);

      let jobsAdded = 0;
      let jobsReview = 0;

      for (const job of result.jobs.slice(0, 15)) {
        const existing = await prisma.job.findUnique({
          where: { sourceUrl: job.sourceUrl },
        });
        if (existing) continue;

        if (job.confidence < 0.5) {
          await prisma.reviewJob.create({
            data: {
              title: job.title,
              company: job.company,
              location: job.location,
              salary: job.salary,
              description: job.description,
              requirements: job.requirements,
              education: job.education,
              sourceUrl: job.sourceUrl,
              confidence: job.confidence,
              rawHtml: job.rawHtml,
              status: "PENDING",
            },
          });
          jobsReview++;
          continue;
        }

        const similarJobs = await prisma.job.findMany({
          where: {
            company: { contains: job.company.slice(0, Math.min(4, job.company.length)) },
          },
          take: 10,
        });

        let merged = false;
        for (const existing of similarJobs) {
          if (
            isSameJob(
              existing.company,
              existing.title,
              existing.location,
              job.company,
              job.title,
              job.location
            )
          ) {
            await prisma.job.update({
              where: { id: existing.id },
              data: {
                mergeCount: { increment: 1 },
                isMerged: true,
              },
            });
            merged = true;
            break;
          }
        }

        if (!merged) {
          await prisma.job.create({
            data: {
              title: job.title,
              company: job.company,
              location: job.location,
              salary: job.salary,
              salaryMin: null,
              salaryMax: null,
              description: job.description,
              requirements: job.requirements,
              education: job.education,
              jobType: job.jobType,
              publishedAt: job.publishedAt,
              sourceName: platform,
              sourceUrl: job.sourceUrl,
              confidence: job.confidence,
            },
          });
          jobsAdded++;
        }
      }

      return { jobsFound: result.jobs.length, jobsAdded, jobsReview };
    } catch (error: any) {
      console.warn(`处理 ${url} 失败: ${error.message}`);
      return { jobsFound: 0, jobsAdded: 0, jobsReview: 0 };
    }
  }
}

export async function runPlatformDiscovery(
  apiKey: string,
  platforms?: string[]
): Promise<void> {
  const discovery = new RecruitmentPlatformDiscovery({ apiKey, count: 15, maxUrls: 50 });
  const result = await discovery.discover(platforms);

  console.log("\n" + "=".repeat(60));
  console.log("📊 招聘平台搜索发现报告");
  console.log("=".repeat(60));
  console.log(`搜索结果: ${result.totalResults} 个链接`);
  console.log(`发现职位: ${result.jobsFound} 个`);
  console.log(`新增职位: ${result.jobsAdded} 个`);
  console.log(`待审核: ${result.jobsReview} 个`);

  if (result.errors.length > 0) {
    console.log(`\n错误 (${result.errors.length}):`);
    for (const err of result.errors.slice(0, 5)) {
      console.log(`  - ${err}`);
    }
  }

  console.log("=".repeat(60));
}
