/**
 * 定时任务：全量数据刷新
 *
 * 功能：
 * 1. 增量抓取所有活跃数据源的新职位（获取最新数据）
 * 2. 验证最近 3 天内的职位链接是否仍然有效
 * 3. 失效的链接降低置信度，连续失效则删除
 * 4. 清理低质量 / 过期数据
 *
 * 执行频率：每半小时一次（5:00 - 22:00）
 */

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { crawlScheduler } from "@/lib/crawlers/crawl-scheduler";

const CRON_SECRET = process.env.CRON_SECRET || "";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (CRON_SECRET && authHeader !== `Bearer ${CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const totalStartTime = Date.now();
  const result: Record<string, any> = {};

  try {
    console.log("[Refresh] ===== 开始全量数据刷新任务 =====");

    // 第一步：增量抓取新职位
    console.log("[Refresh] 步骤 1/3: 增量抓取新职位");
    const crawlStart = Date.now();
    const crawlResult = await crawlScheduler.crawlAllActive();
    result.crawl = {
      totalSources: crawlResult.totalSources,
      successSources: crawlResult.successSources,
      failedSources: crawlResult.errors.length,
      jobsFound: crawlResult.totalJobsFound,
      jobsAdded: crawlResult.totalJobsAdded,
      jobsMerged: crawlResult.totalJobsMerged,
      jobsReview: crawlResult.totalJobsReview,
      durationMs: Date.now() - crawlStart,
    };
    console.log(
      `[Refresh] 抓取完成：新增 ${crawlResult.totalJobsAdded}，合并 ${crawlResult.totalJobsMerged}，耗时 ${Date.now() - crawlStart}ms`
    );

    // 更新失败计数
    for (const err of crawlResult.errors) {
      await prisma.source.update({
        where: { id: err.sourceId },
        data: { failCount: { increment: 1 } },
      });
    }
    const successSourceIds = crawlResult.totalSources - crawlResult.errors.length;
    if (successSourceIds > 0) {
      const sources = await prisma.source.findMany({
        where: { isActive: true },
        select: { id: true, failCount: true },
      });
      for (const source of sources) {
        if (!crawlResult.errors.find((e) => e.sourceId === source.id)) {
          if (source.failCount > 0) {
            await prisma.source.update({
              where: { id: source.id },
              data: { failCount: 0 },
            });
          }
        }
      }
    }

    // 第二步：验证最近 3 天内的职位链接有效性
    console.log("[Refresh] 步骤 2/3: 验证职位链接有效性");
    const verifyStart = Date.now();

    const threeDaysAgo = new Date();
    threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);

    const recentJobs = await prisma.job.findMany({
      where: {
        createdAt: { gte: threeDaysAgo },
        confidence: { gte: 0.5 },
      },
      select: {
        id: true,
        sourceUrl: true,
        title: true,
        company: true,
        confidence: true,
        failCount: true,
      },
      orderBy: { createdAt: "desc" },
      take: 80,
    });

    console.log(`[Refresh] 待验证链接数: ${recentJobs.length}`);

    let verifiedCount = 0;
    let expiredCount = 0;
    let timeoutCount = 0;
    let verifyErrors: string[] = [];

    for (const job of recentJobs) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 8000);

        const response = await fetch(job.sourceUrl, {
          method: "HEAD",
          signal: controller.signal,
          headers: {
            "User-Agent":
              "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
            Accept: "text/html,application/xhtml+xml",
          },
          redirect: "follow",
        });

        clearTimeout(timeoutId);

        if (response.ok || response.status === 301 || response.status === 302 || response.status === 307 || response.status === 308) {
          verifiedCount++;
          if (job.failCount && job.failCount > 0) {
            await prisma.job.update({
              where: { id: job.id },
              data: { failCount: 0 },
            });
          }
        } else if (response.status === 404 || response.status === 410) {
          expiredCount++;
          const newFailCount = (job.failCount || 0) + 1;
          const newConfidence = Math.max(0, job.confidence - 0.25 * newFailCount);

          if (newConfidence <= 0.2 || newFailCount >= 3) {
            await prisma.job.delete({
              where: { id: job.id },
            });
            console.log(`[Refresh] 删除失效职位: ${job.company} - ${job.title}`);
          } else {
            await prisma.job.update({
              where: { id: job.id },
              data: {
                confidence: newConfidence,
                failCount: newFailCount,
              },
            });
          }
        }
      } catch (err: any) {
        if (err.name === "AbortError") {
          timeoutCount++;
        } else {
          verifyErrors.push(`${job.company} - ${job.title}: ${err.message}`);
        }
      }

      await new Promise((resolve) => setTimeout(resolve, 600));
    }

    result.verify = {
      checked: recentJobs.length,
      verified: verifiedCount,
      expired: expiredCount,
      timeout: timeoutCount,
      errors: verifyErrors.length,
      errorDetails: verifyErrors.slice(0, 10),
      durationMs: Date.now() - verifyStart,
    };
    console.log(
      `[Refresh] 验证完成：有效 ${verifiedCount}，失效 ${expiredCount}，超时 ${timeoutCount}，耗时 ${Date.now() - verifyStart}ms`
    );

    // 第三步：清理低质量和过期数据
    console.log("[Refresh] 步骤 3/3: 清理低质量数据");
    const cleanupStart = Date.now();

    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const deletedLowConf = await prisma.job.deleteMany({
      where: {
        confidence: { lt: 0.3 },
        createdAt: { lt: threeDaysAgo },
      },
    });

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const deletedOld = await prisma.job.deleteMany({
      where: {
        createdAt: { lt: thirtyDaysAgo },
        confidence: { lt: 0.7 },
      },
    });

    result.cleanup = {
      deletedLowConfidence: deletedLowConf.count,
      deletedOldLowQuality: deletedOld.count,
      durationMs: Date.now() - cleanupStart,
    };
    console.log(
      `[Refresh] 清理完成：删除低置信度 ${deletedLowConf.count}，删除旧低质量 ${deletedOld.count}，耗时 ${Date.now() - cleanupStart}ms`
    );

    // 记录抓取日志
    await prisma.crawlLog.create({
      data: {
        sourceName: "定时刷新",
        jobsFound: crawlResult.totalJobsFound,
        jobsAdded: crawlResult.totalJobsAdded,
        jobsMerged: crawlResult.totalJobsMerged,
        jobsReview: crawlResult.totalJobsReview,
        errorMessage:
          crawlResult.errors.length > 0
            ? crawlResult.errors.map((e) => `${e.sourceName}: ${e.error}`).join("; ")
            : null,
        durationMs: Date.now() - totalStartTime,
      },
    });

    const totalDuration = Date.now() - totalStartTime;
    console.log(`[Refresh] ===== 全部完成，总耗时 ${totalDuration}ms =====`);

    return NextResponse.json({
      success: true,
      result,
      totalDurationMs: totalDuration,
    });
  } catch (error: any) {
    console.error("[Refresh] 任务失败:", error);
    return NextResponse.json(
      { success: false, error: error.message, result },
      { status: 500 }
    );
  }
}
