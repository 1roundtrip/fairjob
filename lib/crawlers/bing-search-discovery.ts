/**
 * Bing 搜索发现代理
 *
 * 使用 Bing Web Search API 发现新的招聘信息来源
 * 预设搜索词，对结果链接去重后逐个用通用解析器提取
 *
 * 注意: 需要配置 BING_SEARCH_API_KEY 环境变量
 */

import axios from "axios";
import { UniversalJobParser, type ParsedJob } from "@/lib/parsers/universal-job-parser";
import { prisma } from "@/lib/prisma";
import { isSameJob } from "@/lib/dice-similarity";

// 预设搜索词模板
const SEARCH_QUERY_TEMPLATES = [
  // 校招
  '"{year}届 校招" site:edu.cn',
  '"校园招聘" site:{domain}',
  '"春招" 岗位 site:edu.cn',
  '"秋招" 招聘 site:edu.cn',
  // 实习
  '"实习生招聘" site:edu.cn',
  '"实习" 岗位 site:{domain}',
  // 按专业
  '"计算机 招聘" site:edu.cn',
  '"软件工程师" 校招 site:edu.cn',
];

export interface BingSearchOptions {
  apiKey: string;
  endpoint?: string;
  market?: string;
  count?: number;
}

export interface BingSearchResult {
  url: string;
  title: string;
  snippet: string;
  source: string;
}

export class BingSearchDiscovery {
  private apiKey: string;
  private endpoint: string;
  private market: string;
  private count: number;

  constructor(options: BingSearchOptions) {
    this.apiKey = options.apiKey;
    this.endpoint = options.endpoint || "https://api.bing.microsoft.com/v7.0/search";
    this.market = options.market || "zh-CN";
    this.count = options.count || 30;
  }

  /**
   * 执行搜索发现
   * @param customQueries 自定义搜索词列表（可选）
   */
  async discover(customQueries?: string[]): Promise<{
    totalResults: number;
    jobsFound: number;
    jobsAdded: number;
    jobsReview: number;
    errors: string[];
  }> {
    const queries = customQueries || this.generateDefaultQueries();
    const allUrls = new Set<string>();
    const errors: string[] = [];

    for (const query of queries) {
      try {
        const results = await this.search(query);
        for (const r of results) {
          allUrls.add(r.url);
        }
      } catch (e: any) {
        errors.push(`Query "${query}" failed: ${e.message}`);
      }
      // Bing API 限速: 每秒 3 次
      await new Promise((r) => setTimeout(r, 350));
    }

    // 逐个提取职位
    const urls = Array.from(allUrls);
    let jobsFound = 0;
    let jobsAdded = 0;
    let jobsReview = 0;

    // 限制最多处理的 URL 数量
    const maxUrls = Math.min(urls.length, 20);

    for (let i = 0; i < maxUrls; i++) {
      const url = urls[i];
      try {
        const result = await this.processUrl(url);
        jobsFound += result.jobsFound;
        jobsAdded += result.jobsAdded;
        jobsReview += result.jobsReview;
      } catch (e: any) {
        errors.push(`URL "${url}" failed: ${e.message}`);
      }
      // 每个域名之间间隔 8 秒（遵守 robots.txt 精神）
      if (i < maxUrls - 1) {
        await new Promise((r) => setTimeout(r, 2000)); // 简化：固定 2 秒
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

  /**
   * 调用 Bing 搜索 API
   */
  private async search(query: string): Promise<BingSearchResult[]> {
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
      source: page.siteName || "",
    }));
  }

  /**
   * 处理单个搜索结果 URL
   */
  private async processUrl(url: string): Promise<{
    jobsFound: number;
    jobsAdded: number;
    jobsReview: number;
  }> {
    // 抓取页面
    const response = await axios.get(url, {
      timeout: 15000,
      headers: {
        "User-Agent": "FairJobBot/1.0 (non-commercial job aggregation)",
      },
      responseType: "text",
    });

    // 用通用解析器解析
    const parser = new UniversalJobParser();
    const result = parser.parse(response.data, url);

    // 保存职位
    let jobsAdded = 0;
    let jobsReview = 0;

    for (const job of result.jobs.slice(0, 10)) {
      // URL 去重
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

      // 相似度去重
      const similarJobs = await prisma.job.findMany({
        where: {
          company: { contains: job.company.slice(0, 4) },
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
            education: job.education,
            jobType: job.jobType,
            publishedAt: job.publishedAt,
            sourceName: "Bing搜索发现",
            sourceUrl: job.sourceUrl,
            confidence: job.confidence,
          },
        });
        jobsAdded++;
      }
    }

    return {
      jobsFound: result.jobs.length,
      jobsAdded,
      jobsReview,
    };
  }

  /**
   * 生成默认搜索词列表
   */
  private generateDefaultQueries(): string[] {
    const year = new Date().getFullYear();
    const nextYear = year + 1;

    return [
      `${year}届 校招 site:edu.cn`,
      `${nextYear}届 校园招聘 site:edu.cn`,
      `"实习" 招聘 site:edu.cn`,
      `"春招" 岗位 site:edu.cn`,
      `"秋招" 职位 site:edu.cn`,
      `"软件工程师" 校招 site:edu.cn`,
      `"产品经理" 实习 site:edu.cn`,
      `"央企" 招聘 site:edu.cn`,
      `"国企" 校招 site:edu.cn`,
    ];
  }
}
