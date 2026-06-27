/**
 * 定时任务：增量抓取
 * 每小时运行一次，遍历所有活跃数据源抓取新岗位
 * 路径：/api/cron/incremental-crawl
 */

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { crawlScheduler } from "@/lib/crawlers/crawl-scheduler";
import { sendDailyReport } from "@/lib/services/monitoring";

const CRON_SECRET = process.env.CRON_SECRET || "";

function verifyCronAuth(request: Request): boolean {
  if (!CRON_SECRET) return false;
  const authHeader = request.headers.get("authorization");
  return authHeader === `Bearer ${CRON_SECRET}`;
}

export async function GET(request: Request) {
  if (!verifyCronAuth(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const startTime = Date.now();

  try {
    console.log("[Cron] 开始增量抓取任务");

    // 遍历所有活跃数据源
    const result = await crawlScheduler.crawlAllActive();

    // 更新失败计数
    for (const err of result.errors) {
      await prisma.source.update({
        where: { id: err.sourceId },
        data: { failCount: { increment: 1 } },
      });
    }

    // 成功的来源重置失败计数
    const successSourceIds = result.totalSources - result.errors.length;
    if (successSourceIds > 0) {
      const sources = await prisma.source.findMany({
        where: { isActive: true },
        select: { id: true, name: true, failCount: true },
      });

      for (const source of sources) {
        if (!result.errors.find((e) => e.sourceId === source.id)) {
          if (source.failCount > 0) {
            await prisma.source.update({
              where: { id: source.id },
              data: { failCount: 0 },
            });
          }
        }
      }
    }

    const duration = Date.now() - startTime;

    // 记录抓取日志
    await prisma.crawlLog.create({
      data: {
        sourceName: "批量抓取",
        jobsFound: result.totalJobsFound,
        jobsAdded: result.totalJobsAdded,
        jobsMerged: result.totalJobsMerged,
        jobsReview: result.totalJobsReview,
        errorMessage:
          result.errors.length > 0
            ? result.errors.map((e) => `${e.sourceName}: ${e.error}`).join("; ")
            : null,
        durationMs: duration,
      },
    });

    // 如果有失败，发送告警
    if (result.errors.length > 0) {
      await sendDailyReport({
        totalNew: result.totalJobsAdded,
        totalMerged: result.totalJobsMerged,
        totalReview: result.totalJobsReview,
        failedSources: result.errors.map((e) => e.sourceName),
      });
    }

    console.log(
      `[Cron] 抓取完成：新增 ${result.totalJobsAdded}，合并 ${result.totalJobsMerged}，耗时 ${duration}ms`
    );

    return NextResponse.json({
      success: true,
      result: {
        totalSources: result.totalSources,
        successSources: result.successSources,
        failedSources: result.errors.length,
        jobsAdded: result.totalJobsAdded,
        jobsMerged: result.totalJobsMerged,
        jobsReview: result.totalJobsReview,
        errors: result.errors,
        durationMs: duration,
      },
    });
  } catch (error: any) {
    console.error("[Cron] 抓取失败:", error);

    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
