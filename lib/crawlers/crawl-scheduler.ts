/**
 * 抓取调度服务 - CrawlScheduler
 *
 * 负责:
 * - 管理所有数据源的抓取调度
 * - 按来源类型选择合适的抓取器
 * - 记录抓取日志和统计
 *
 * 设计说明:
 * - 在 Vercel 等 serverless 环境中，可通过 Cron Job 触发
 * - 也可通过 API 路由手动触发单源抓取测试
 */

import { prisma } from "@/lib/prisma";
import { UniversalWebCrawler } from "./universal-web-crawler";
import { RssCrawler } from "./rss-crawler";
import { type SourceType, type ParserType } from "@/lib/constants";

export class CrawlScheduler {
  /**
   * 抓取单个数据源
   */
  async crawlSource(sourceId: number): Promise<{
    success: boolean;
    jobsFound: number;
    jobsAdded: number;
    jobsMerged: number;
    jobsReview: number;
    error?: string;
  }> {
    const source = await prisma.source.findUnique({
      where: { id: sourceId },
    });

    if (!source) {
      return {
        success: false,
        jobsFound: 0,
        jobsAdded: 0,
        jobsMerged: 0,
        jobsReview: 0,
        error: "Source not found",
      };
    }

    if (!source.isActive) {
      return {
        success: false,
        jobsFound: 0,
        jobsAdded: 0,
        jobsMerged: 0,
        jobsReview: 0,
        error: "Source is not active",
      };
    }

    try {
      let result: {
        jobsFound: number;
        jobsAdded: number;
        jobsMerged: number;
        jobsReview: number;
        error?: string;
      };

      switch (source.parserType) {
        case "RSS":
          result = await this.crawlRss(source.id, source.url, source.name);
          break;

        case "UNIVERSAL":
        case "API":
        default:
          result = await this.crawlWeb(source.id, source.url, source.name);
          break;
      }

      return {
        success: !result.error,
        ...result,
      };
    } catch (error: any) {
      return {
        success: false,
        jobsFound: 0,
        jobsAdded: 0,
        jobsMerged: 0,
        jobsReview: 0,
        error: error.message,
      };
    }
  }

  /**
   * 抓取所有活跃的数据源
   */
  async crawlAllActive(): Promise<{
    totalSources: number;
    successSources: number;
    totalJobsFound: number;
    totalJobsAdded: number;
    totalJobsMerged: number;
    totalJobsReview: number;
    errors: { sourceId: number; sourceName: string; error: string }[];
  }> {
    const sources = await prisma.source.findMany({
      where: { isActive: true },
    });

    let successSources = 0;
    let totalJobsFound = 0;
    let totalJobsAdded = 0;
    let totalJobsMerged = 0;
    let totalJobsReview = 0;
    const errors: { sourceId: number; sourceName: string; error: string }[] = [];

    for (const source of sources) {
      const result = await this.crawlSource(source.id);
      if (result.success) {
        successSources++;
        totalJobsFound += result.jobsFound;
        totalJobsAdded += result.jobsAdded;
        totalJobsMerged += result.jobsMerged;
        totalJobsReview += result.jobsReview;
      } else if (result.error) {
        errors.push({
          sourceId: source.id,
          sourceName: source.name,
          error: result.error,
        });
      }

      // 数据源之间间隔一下（避免并发过高）
      await new Promise((r) => setTimeout(r, 1000));
    }

    return {
      totalSources: sources.length,
      successSources,
      totalJobsFound,
      totalJobsAdded,
      totalJobsMerged,
      totalJobsReview,
      errors,
    };
  }

  private async crawlRss(
    sourceId: number,
    url: string,
    name: string
  ): Promise<{
    jobsFound: number;
    jobsAdded: number;
    jobsMerged: number;
    jobsReview: number;
    error?: string;
  }> {
    const crawler = new RssCrawler(url, sourceId, name);
    return crawler.crawl();
  }

  private async crawlWeb(
    sourceId: number,
    url: string,
    name: string
  ): Promise<{
    jobsFound: number;
    jobsAdded: number;
    jobsMerged: number;
    jobsReview: number;
    error?: string;
  }> {
    const crawler = new UniversalWebCrawler(url, sourceId, name);
    return crawler.crawl();
  }

  /**
   * 初始化默认数据源
   * 在项目首次启动时调用，写入一些默认来源
   */
  async seedDefaultSources(): Promise<{ created: number; skipped: number }> {
    const defaultSources = [
      {
        name: "国家24365大学生就业服务平台",
        url: "https://job.ncss.cn/",
        type: "OFFICIAL_PLATFORM" as SourceType,
        parserType: "UNIVERSAL" as ParserType,
        crawlInterval: 120,
      },
      {
        name: "清华大学就业信息网",
        url: "https://career.tsinghua.edu.cn/",
        type: "UNIVERSITY" as SourceType,
        parserType: "UNIVERSAL" as ParserType,
        crawlInterval: 360,
      },
      {
        name: "北京大学学生就业指导服务中心",
        url: "https://scc.pku.edu.cn/",
        type: "UNIVERSITY" as SourceType,
        parserType: "UNIVERSAL" as ParserType,
        crawlInterval: 360,
      },
      {
        name: "华为校园招聘",
        url: "https://career.huawei.com/reccampportal/portal5/campus-recruitment.html",
        type: "ENTERPRISE" as SourceType,
        parserType: "UNIVERSAL" as ParserType,
        crawlInterval: 720,
      },
      {
        name: "阿里巴巴校园招聘",
        url: "https://campus.alibaba.com/index.htm",
        type: "ENTERPRISE" as SourceType,
        parserType: "UNIVERSAL" as ParserType,
        crawlInterval: 720,
      },
      {
        name: "腾讯校园招聘",
        url: "https://join.qq.com/",
        type: "ENTERPRISE" as SourceType,
        parserType: "UNIVERSAL" as ParserType,
        crawlInterval: 720,
      },
      {
        name: "字节跳动校园招聘",
        url: "https://jobs.bytedance.com/zh-CN/campus",
        type: "ENTERPRISE" as SourceType,
        parserType: "UNIVERSAL" as ParserType,
        crawlInterval: 720,
      },
      {
        name: "百度校园招聘",
        url: "https://talent.baidu.com/external/baidu/campus.html",
        type: "ENTERPRISE" as SourceType,
        parserType: "UNIVERSAL" as ParserType,
        crawlInterval: 720,
      },
      {
        name: "京东校园招聘",
        url: "https://campus.jd.com/",
        type: "ENTERPRISE" as SourceType,
        parserType: "UNIVERSAL" as ParserType,
        crawlInterval: 720,
      },
      {
        name: "美团校园招聘",
        url: "https://campus.meituan.com/",
        type: "ENTERPRISE" as SourceType,
        parserType: "UNIVERSAL" as ParserType,
        crawlInterval: 720,
      },
      {
        name: "网易校园招聘",
        url: "https://campus.163.com/",
        type: "ENTERPRISE" as SourceType,
        parserType: "UNIVERSAL" as ParserType,
        crawlInterval: 720,
      },
      {
        name: "小米校园招聘",
        url: "https://hr.xiaomi.com/campus",
        type: "ENTERPRISE" as SourceType,
        parserType: "UNIVERSAL" as ParserType,
        crawlInterval: 720,
      },
      {
        name: "字节跳动社招",
        url: "https://jobs.bytedance.com/zh-CN/",
        type: "ENTERPRISE" as SourceType,
        parserType: "UNIVERSAL" as ParserType,
        crawlInterval: 720,
      },
      {
        name: "浙江大学就业指导中心",
        url: "https://www.career.zju.edu.cn/",
        type: "UNIVERSITY" as SourceType,
        parserType: "UNIVERSAL" as ParserType,
        crawlInterval: 360,
      },
      {
        name: "上海交通大学就业服务中心",
        url: "https://career.sjtu.edu.cn/",
        type: "UNIVERSITY" as SourceType,
        parserType: "UNIVERSAL" as ParserType,
        crawlInterval: 360,
      },
      {
        name: "复旦大学学生职业发展教育服务中心",
        url: "https://career.fudan.edu.cn/",
        type: "UNIVERSITY" as SourceType,
        parserType: "UNIVERSAL" as ParserType,
        crawlInterval: 360,
      },
      {
        name: "中国人民大学就业信息网",
        url: "http://job.ruc.edu.cn/",
        type: "UNIVERSITY" as SourceType,
        parserType: "UNIVERSAL" as ParserType,
        crawlInterval: 360,
      },
      {
        name: "应届生求职网",
        url: "https://www.yingjiesheng.com/",
        type: "OFFICIAL_PLATFORM" as SourceType,
        parserType: "UNIVERSAL" as ParserType,
        crawlInterval: 60,
      },
      {
        name: "智联招聘校招",
        url: "https://xiaozhao.zhaopin.com/",
        type: "OFFICIAL_PLATFORM" as SourceType,
        parserType: "UNIVERSAL" as ParserType,
        crawlInterval: 60,
      },
      {
        name: "牛客网校招",
        url: "https://nowpick.nowcoder.com/",
        type: "OFFICIAL_PLATFORM" as SourceType,
        parserType: "UNIVERSAL" as ParserType,
        crawlInterval: 120,
      },
    ];

    let created = 0;
    let skipped = 0;

    for (const source of defaultSources) {
      const existing = await prisma.source.findFirst({
        where: { url: source.url },
      });
      if (existing) {
        skipped++;
        continue;
      }

      await prisma.source.create({ data: source });
      created++;
    }

    return { created, skipped };
  }
}

export const crawlScheduler = new CrawlScheduler();
