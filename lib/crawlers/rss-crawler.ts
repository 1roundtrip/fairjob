/**
 * RSS 源抓取器
 *
 * 支持标准 RSS 2.0 / Atom 格式
 * 将 <item> / <entry> 映射到 Job 模型
 */

import Parser from "rss-parser";
import { prisma } from "@/lib/prisma";
import { extractEducation } from "@/lib/parsers/education-extractor";
import { extractPrimaryLocation, parseDate } from "@/lib/parsers/location-date-extractor";
import { UniversalJobParser, type ParsedJob } from "@/lib/parsers/universal-job-parser";
import { isSameJob } from "@/lib/dice-similarity";

const parser = new Parser({
  timeout: 30000,
  headers: {
    "User-Agent": "FairJobBot/1.0 (job aggregation; non-commercial)",
  },
});

export class RssCrawler {
  private feedUrl: string;
  private sourceId: number;
  private sourceName: string;

  constructor(feedUrl: string, sourceId: number, sourceName: string) {
    this.feedUrl = feedUrl;
    this.sourceId = sourceId;
    this.sourceName = sourceName;
  }

  /**
   * 抓取并解析 RSS 源
   */
  async crawl(): Promise<{
    jobsFound: number;
    jobsAdded: number;
    jobsMerged: number;
    jobsReview: number;
    error?: string;
  }> {
    try {
      const feed = await parser.parseURL(this.feedUrl);

      const items = feed.items || [];
      const jobs: ParsedJob[] = [];

      for (const item of items) {
        const title = item.title || "";
        const link = item.link || item.guid || "";
        const content = item.contentSnippet || item.content || "";
        const pubDate = item.pubDate ? parseDate(item.pubDate) : null;

        if (!title || !link) continue;

        // 提取学历
        const eduResult = extractEducation(title, content);

        // 提取地点
        const location = extractPrimaryLocation(title + " " + content);

        // 薪资（简单提取）
        const salaryMatch = content.match(/(\d+[Kk千万][-~至]\d+[Kk千万])/);
        const salary = salaryMatch ? salaryMatch[0] : null;

        // 职位类型
        let jobType: string | null = null;
        const fullText = title + content;
        if (fullText.includes("校招") || fullText.includes("校园招聘")) jobType = "校招";
        else if (fullText.includes("实习")) jobType = "实习";
        else if (fullText.includes("社招")) jobType = "社招";

        const job: ParsedJob = {
          title,
          company: this.extractCompanyFromFeed(feed.title || "", title, content),
          location,
          salary,
          description: content.slice(0, 1000),
          requirements: null,
          education: eduResult.education,
          educationConfidence: eduResult.fromDescription ? 0.9 : 0.6,
          sourceUrl: link,
          publishedAt: pubDate,
          jobType,
          confidence: 0,
        };

        // 计算置信度
        job.confidence = this.calculateConfidence(job);

        jobs.push(job);
      }

      // 去重并入库
      const result = await this.saveJobs(jobs);

      // 更新 Source 状态
      await prisma.source.update({
        where: { id: this.sourceId },
        data: {
          lastCrawledAt: new Date(),
          successCount: { increment: 1 },
          totalJobs: { increment: result.jobsAdded },
        },
      });

      return {
        jobsFound: jobs.length,
        ...result,
      };
    } catch (error: any) {
      // 记录失败
      await prisma.source.update({
        where: { id: this.sourceId },
        data: {
          lastCrawledAt: new Date(),
          failCount: { increment: 1 },
        },
      });

      return {
        jobsFound: 0,
        jobsAdded: 0,
        jobsMerged: 0,
        jobsReview: 0,
        error: error.message || "RSS crawl failed",
      };
    }
  }

  private extractCompanyFromFeed(
    feedTitle: string,
    itemTitle: string,
    content: string
  ): string {
    // 从 feed 标题或内容中提取公司名
    const fullText = itemTitle + " " + content;

    const companyPattern = /([\u4e00-\u9fa5A-Za-z0-9]{2,20}(?:公司|集团|科技|大学|学院|研究院|研究所|中心))/g;
    const matches = fullText.match(companyPattern);
    if (matches && matches.length > 0) {
      return matches[0];
    }

    // 用 feed 标题作为备选
    if (feedTitle && feedTitle.length < 50) {
      return feedTitle.replace(/招聘|就业|信息网|官网/g, "").trim() || this.sourceName;
    }

    return this.sourceName;
  }

  private calculateConfidence(job: ParsedJob): number {
    let score = 0.3; // RSS 来源基础分
    if (job.location) score += 0.1;
    if (job.publishedAt) score += 0.1;
    if (job.education !== "UNKNOWN") score += 0.2;
    else score -= 0.1;
    if (job.salary) score += 0.1;
    if (job.description && job.description.length > 50) score += 0.1;
    return Math.max(0, Math.min(1, score));
  }

  /**
   * 保存职位（去重 + 合并 + 低置信度进审核）
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
      // 先按 URL 精确去重
      const existingByUrl = await prisma.job.findUnique({
        where: { sourceUrl: job.sourceUrl },
      });

      if (existingByUrl) {
        continue; // URL 已存在，跳过
      }

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
            rawHtml: job.description || undefined,
            status: "PENDING",
          },
        });
        jobsReview++;
        continue;
      }

      // 相似度去重
      const similarJobs = await prisma.job.findMany({
        where: {
          company: {
            contains: job.company.slice(0, 4), // 用前4个字符快速过滤
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
          // 合并：追加 source 信息
          const mergedIds: number[] = existing.mergedJobIds
            ? JSON.parse(existing.mergedJobIds)
            : [];

          await prisma.job.update({
            where: { id: existing.id },
            data: {
              mergeCount: { increment: 1 },
              isMerged: true,
              mergedJobIds: JSON.stringify([...mergedIds, 0]),
            },
          });
          merged = true;
          jobsMerged++;
          break;
        }
      }

      if (!merged) {
        // 创建新职位
        await prisma.job.create({
          data: {
            title: job.title,
            company: job.company,
            location: job.location,
            salary: job.salary,
            description: job.description,
            requirements: job.requirements,
            education: job.education,
            jobType: job.jobType,
            publishedAt: job.publishedAt,
            sourceId: this.sourceId,
            sourceName: this.sourceName,
            sourceUrl: job.sourceUrl,
            confidence: job.confidence,
          },
        });
        jobsAdded++;

        // 更新公司统计
        await this.updateCompanyStat(job.company);
      }
    }

    return { jobsAdded, jobsMerged, jobsReview };
  }

  private async updateCompanyStat(companyName: string): Promise<void> {
    const existing = await prisma.companyStat.findUnique({
      where: { companyName },
    });

    if (existing) {
      const today = new Date().toDateString();
      const lastSeenDay = existing.lastSeen.toDateString();
      const newDayCount = today !== lastSeenDay ? existing.dayCount + 1 : existing.dayCount;
      const newJobCount = existing.jobCount + 1;

      await prisma.companyStat.update({
        where: { companyName },
        data: {
          jobCount: newJobCount,
          dayCount: newDayCount,
          avgJobsPerDay: newJobCount / Math.max(1, newDayCount),
          lastSeen: new Date(),
        },
      });
    } else {
      await prisma.companyStat.create({
        data: {
          companyName,
          jobCount: 1,
          dayCount: 1,
          avgJobsPerDay: 1,
        },
      });
    }
  }
}
