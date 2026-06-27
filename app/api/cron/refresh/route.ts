/**
 * 定时任务：全量数据刷新
 *
 * 功能：
 * 1. 增量抓取所有活跃数据源的新职位
 * 2. 验证最近 7 天内的职位链接有效性（用 GET 请求，更准确）
 * 3. 失效的链接降低置信度，连续失效 2 次则删除
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
  if (!CRON_SECRET || authHeader !== `Bearer ${CRON_SECRET}`) {
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

    for (const err of crawlResult.errors) {
      await prisma.source.update({
        where: { id: err.sourceId },
        data: { failCount: { increment: 1 } },
      });
    }
    const activeSources = await prisma.source.findMany({
      where: { isActive: true },
      select: { id: true, failCount: true },
    });
    for (const source of activeSources) {
      if (!crawlResult.errors.find((e) => e.sourceId === source.id) && source.failCount > 0) {
        await prisma.source.update({
          where: { id: source.id },
          data: { failCount: 0 },
        });
      }
    }

    // 第二步：验证职位链接有效性
    // 策略：优先验证 failCount>0 的（有失效嫌疑），然后验证最新的
    console.log("[Refresh] 步骤 2/3: 验证职位链接有效性");
    const verifyStart = Date.now();

    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    // 先取有失效记录的，优先验证
    const suspectJobs = await prisma.job.findMany({
      where: {
        createdAt: { gte: sevenDaysAgo },
        failCount: { gt: 0 },
        confidence: { gte: 0.3 },
      },
      select: {
        id: true,
        sourceUrl: true,
        title: true,
        company: true,
        confidence: true,
        failCount: true,
      },
      orderBy: { failCount: "desc" },
      take: 30,
    });

    // 再取最新的职位（还没验证过的）
    const newJobs = await prisma.job.findMany({
      where: {
        createdAt: { gte: sevenDaysAgo },
        confidence: { gte: 0.5 },
        id: { notIn: suspectJobs.map((j) => j.id) },
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
      take: 70,
    });

    const jobsToVerify = [...suspectJobs, ...newJobs];
    console.log(`[Refresh] 待验证链接数: ${jobsToVerify.length}（嫌疑 ${suspectJobs.length} + 新 ${newJobs.length}）`);

    let verifiedCount = 0;
    let expiredCount = 0;
    let deletedCount = 0;
    let timeoutCount = 0;
    let verifyErrors: string[] = [];

    for (const job of jobsToVerify) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000);

        // 用 GET 而不是 HEAD，很多网站拦截 HEAD 请求
        const response = await fetch(job.sourceUrl, {
          method: "GET",
          signal: controller.signal,
          headers: {
            "User-Agent":
              "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
            Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
            "Accept-Language": "zh-CN,zh;q=0.9,en;q=0.8",
          },
          redirect: "follow",
        });

        clearTimeout(timeoutId);

        const isOk = response.ok || [301, 302, 303, 307, 308].includes(response.status);
        const isExpired = [404, 410].includes(response.status);
        const isForbidden = response.status === 403;

        if (isOk || isForbidden) {
          verifiedCount++;
          if (job.failCount && job.failCount > 0) {
            await prisma.job.update({
              where: { id: job.id },
              data: { failCount: 0 },
            });
          }
        } else if (isExpired) {
          expiredCount++;
          const newFailCount = (job.failCount || 0) + 1;
          const newConfidence = Math.max(0, job.confidence - 0.3 * newFailCount);

          // 连续失效 2 次直接删除（不浪费用户时间）
          if (newFailCount >= 2 || newConfidence <= 0.2) {
            await prisma.job.delete({ where: { id: job.id } });
            deletedCount++;
            console.log(`[Refresh] 删除失效职位 [${newFailCount}次失效]: ${job.company} - ${job.title}`);
          } else {
            await prisma.job.update({
              where: { id: job.id },
              data: { confidence: newConfidence, failCount: newFailCount },
            });
            console.log(`[Refresh] 标记失效 [${newFailCount}次]: ${job.company} - ${job.title}`);
          }
        }
      } catch (err: any) {
        if (err.name === "AbortError") {
          timeoutCount++;
        } else {
          verifyErrors.push(`${job.company}: ${err.message}`);
        }
      }

      await new Promise((resolve) => setTimeout(resolve, 800));
    }

    result.verify = {
      checked: jobsToVerify.length,
      verified: verifiedCount,
      expired: expiredCount,
      deleted: deletedCount,
      timeout: timeoutCount,
      errors: verifyErrors.length,
      errorDetails: verifyErrors.slice(0, 10),
      durationMs: Date.now() - verifyStart,
    };
    console.log(
      `[Refresh] 验证完成：有效 ${verifiedCount}，失效 ${expiredCount}，删除 ${deletedCount}，超时 ${timeoutCount}，耗时 ${Date.now() - verifyStart}ms`
    );

    // 第三步：清理低质量和过期数据
    console.log("[Refresh] 步骤 3/3: 清理低质量数据");
    const cleanupStart = Date.now();

    const threeDaysAgo = new Date();
    threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);

    // 置信度低且已超过3天的，直接删
    const deletedLowConf = await prisma.job.deleteMany({
      where: {
        confidence: { lt: 0.4 },
        createdAt: { lt: threeDaysAgo },
      },
    });

    const twentyDaysAgo = new Date();
    twentyDaysAgo.setDate(twentyDaysAgo.getDate() - 20);

    // 超过20天且置信度不高的，删（校招信息时效性强）
    const deletedOld = await prisma.job.deleteMany({
      where: {
        createdAt: { lt: twentyDaysAgo },
        confidence: { lt: 0.8 },
      },
    });

    result.cleanup = {
      deletedLowConfidence: deletedLowConf.count,
      deletedOldLowQuality: deletedOld.count,
      durationMs: Date.now() - cleanupStart,
    };
    console.log(
      `[Refresh] 清理完成：删除低置信度 ${deletedLowConf.count}，删除过期低质量 ${deletedOld.count}，耗时 ${Date.now() - cleanupStart}ms`
    );

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
