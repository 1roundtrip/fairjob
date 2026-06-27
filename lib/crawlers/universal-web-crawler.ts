/**
 * 通用网页抓取器 - UniversalWebCrawler
 *
 * 使用 UniversalJobParser 解析任意招聘页面
 * 适用于: 高校就业网、企业官网、其他招聘平台
 */

import { BaseCrawler } from "./base-crawler";
import { UniversalJobParser, type ParsedJob } from "@/lib/parsers/universal-job-parser";
import { prisma } from "@/lib/prisma";
import { isSameJob } from "@/lib/dice-similarity";
import { URL } from "url";

export class UniversalWebCrawler extends BaseCrawler {
  private parser: UniversalJobParser;
  private sourceId: number;
  private sourceName: string;
  private baseUrl: string;

  constructor(baseUrl: string, sourceId: number, sourceName: string) {
    const domain = new URL(baseUrl).hostname;
    super(domain, { delayMs: 8000 });

    this.parser = new UniversalJobParser({ baseUrl });
    this.sourceId = sourceId;
    this.sourceName = sourceName;
    this.baseUrl = baseUrl;
  }

  /**
   * 执行抓取
   */
  async crawl(): Promise<{
    jobsFound: number;
    jobsAdded: number;
    jobsMerged: number;
    jobsReview: number;
    error?: string;
  }> {
    const startTime = Date.now();

    try {
      // 检查 robots.txt
      const allowed = await this.checkRobotsTxt("/");
      if (!allowed) {
        return {
          jobsFound: 0,
          jobsAdded: 0,
          jobsMerged: 0,
          jobsReview: 0,
          error: "Blocked by robots.txt",
        };
      }

      // 抓取列表页
      const result = await this.fetch(this.baseUrl);
      if (!result.success || !result.html) {
        throw new Error(result.error || "Failed to fetch page");
      }

      // 解析职位
      const parseResult = this.parser.parse(result.html, result.url || this.baseUrl);

      // 保存职位
      const saveResult = await this.saveJobs(parseResult.jobs);

      // 更新 Source 状态
      await prisma.source.update({
        where: { id: this.sourceId },
        data: {
          lastCrawledAt: new Date(),
          successCount: { increment: 1 },
          totalJobs: { increment: saveResult.jobsAdded },
        },
      });

      // 记录抓取日志
      await prisma.crawlLog.create({
        data: {
          sourceId: this.sourceId,
          sourceName: this.sourceName,
          jobsFound: parseResult.jobs.length,
          jobsAdded: saveResult.jobsAdded,
          jobsMerged: saveResult.jobsMerged,
          jobsReview: saveResult.jobsReview,
          durationMs: Date.now() - startTime,
        },
      });

      return {
        jobsFound: parseResult.jobs.length,
        ...saveResult,
      };
    } catch (error: any) {
      await prisma.source.update({
        where: { id: this.sourceId },
        data: {
          lastCrawledAt: new Date(),
          failCount: { increment: 1 },
        },
      });

      await prisma.crawlLog.create({
        data: {
          sourceId: this.sourceId,
          sourceName: this.sourceName,
          jobsFound: 0,
          errorMessage: error.message,
          durationMs: Date.now() - startTime,
        },
      });

      return {
        jobsFound: 0,
        jobsAdded: 0,
        jobsMerged: 0,
        jobsReview: 0,
        error: error.message,
      };
    }
  }

  /**
   * 保存职位到数据库（去重 + 合并 + 低置信度审核）
   */
  private async saveJobs(jobs: ParsedJob[]): Promise<{
    jobsAdded: number;
    jobsMerged: number;
    jobsReview: number;
  }> {
    let jobsAdded = 0;
    let jobsMerged = 0;
    let jobsReview = 0;

    for (const job of jobs) {
      // URL 精确去重
      const existingByUrl = await prisma.job.findUnique({
        where: { sourceUrl: job.sourceUrl },
      });
      if (existingByUrl) continue;

      // 置信度 < 0.5 送入待审核
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
            sourceId: this.sourceId,
            confidence: job.confidence,
            rawHtml: job.rawHtml,
            status: "PENDING",
          },
        });
        jobsReview++;
        continue;
      }

      // 相似度去重
      const searchPrefix = job.company.slice(0, Math.min(4, job.company.length));
      if (!searchPrefix) {
        await prisma.job.create({ data: job as any });
        jobsAdded++;
        continue;
      }
      const similarJobs = await prisma.job.findMany({
        where: {
          company: {
            contains: searchPrefix,
          },
        },
        take: 20,
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
          jobsMerged++;
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
            experience: null,
            publishedAt: job.publishedAt,
            sourceId: this.sourceId,
            sourceName: this.sourceName,
            sourceUrl: job.sourceUrl,
            confidence: job.confidence,
          },
        });
        jobsAdded++;
        await this.updateCompanyStat(job.company);
      }
    }

    return { jobsAdded, jobsMerged, jobsReview };
  }

  private async updateCompanyStat(companyName: string): Promise<void> {
    const today = new Date();

    try {
      // 先尝试 upsert，避免 read-modify-write 竞态
      const existing = await prisma.companyStat.findUnique({
        where: { companyName },
        select: { lastSeen: true },
      });

      const isNewDay = !existing || existing.lastSeen.toDateString() !== today.toDateString();

      await prisma.companyStat.upsert({
        where: { companyName },
        create: {
          companyName,
          jobCount: 1,
          dayCount: 1,
          avgJobsPerDay: 1,
          lastSeen: today,
        },
        update: {
          jobCount: { increment: 1 },
          dayCount: isNewDay ? { increment: 1 } : undefined,
          lastSeen: today,
        },
      });

      // avgJobsPerDay 需要重新计算（Prisma 不支持除法 increment）
      if (existing) {
        const stat = await prisma.companyStat.findUnique({
          where: { companyName },
          select: { jobCount: true, dayCount: true },
        });
        if (stat) {
          await prisma.companyStat.update({
            where: { companyName },
            data: { avgJobsPerDay: stat.jobCount / Math.max(1, stat.dayCount) },
          });
        }
      }
    } catch {
      // 并发冲突时忽略，下次会重试
    }
  }
}
