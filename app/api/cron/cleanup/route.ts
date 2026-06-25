/**
 * 定时任务：去重与清理
 * 每天凌晨 4 点运行
 * 1. 合并重复岗位（基于 Dice 系数）
 * 2. 删除已过期且无收藏的网申截止事件
 */

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { diceCoefficient } from "@/lib/dice-similarity";

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  const CRON_SECRET = process.env.CRON_SECRET || "";
  if (CRON_SECRET && authHeader !== `Bearer ${CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const startTime = Date.now();

  try {
    console.log("[Cron] 开始去重与清理任务");

    // 1. 删除已过期的网申事件（且无收藏关联）
    const now = new Date();
    const expiredEvents = await prisma.event.deleteMany({
      where: {
        deadlineDate: { lt: now },
      },
    });

    console.log(`[Cron] 删除过期网申事件: ${expiredEvents.count} 条`);

    // 2. 清理长期未审核的条目（超过 30 天的待审核职位）
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(now.getDate() - 30);

    const oldPendingJobs = await prisma.reviewJob.deleteMany({
      where: {
        status: "PENDING",
        createdAt: { lt: thirtyDaysAgo },
      },
    });

    console.log(`[Cron] 清理长期未审核: ${oldPendingJobs.count} 条`);

    // 3. 合并重复职位（简化版：只处理当天的）
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const todayJobs = await prisma.job.findMany({
      where: {
        createdAt: { gte: todayStart },
        isMerged: false,
      },
      select: {
        id: true,
        title: true,
        company: true,
        location: true,
        sourceUrl: true,
      },
      take: 100,
    });

    let merged = 0;

    for (const job of todayJobs) {
      // 找相似职位
      const candidates = await prisma.job.findMany({
        where: {
          id: { not: job.id },
          company: job.company,
          isMerged: false,
        },
        select: {
          id: true,
          title: true,
          location: true,
          sourceUrl: true,
        },
      });

      for (const candidate of candidates) {
        const titleSim = diceCoefficient(job.title, candidate.title);
        const locSim = diceCoefficient(
          job.location || "",
          candidate.location || ""
        );

        // 综合相似度
        const overallSim = titleSim * 0.7 + locSim * 0.3;

        if (overallSim >= 0.9) {
          // 合并：保留当前职位，更新合并信息
          const existingMerged = (await prisma.job.findUnique({
            where: { id: job.id },
            select: { mergedJobIds: true, mergeCount: true },
          })) || { mergedJobIds: null, mergeCount: 1 };

          const parsedIds: number[] = existingMerged.mergedJobIds
            ? JSON.parse(existingMerged.mergedJobIds)
            : [];

          const newMergedIds = [...parsedIds, candidate.id];

          await prisma.job.update({
            where: { id: job.id },
            data: {
              isMerged: true,
              mergedJobIds: JSON.stringify(newMergedIds),
              mergeCount: newMergedIds.length + 1,
            },
          });

          // 删除被合并的职位
          await prisma.job.delete({ where: { id: candidate.id } });
          merged++;

          console.log(
            `[Cron] 合并重复职位: #${job.id} ← #${candidate.id} (相似度 ${overallSim.toFixed(2)})`
          );
        }
      }
    }

    const duration = Date.now() - startTime;

    console.log(
      `[Cron] 去重清理完成：合并 ${merged} 对，耗时 ${duration}ms`
    );

    return NextResponse.json({
      success: true,
      expiredEvents: expiredEvents.count,
      oldPendingJobs: oldPendingJobs.count,
      mergedPairs: merged,
      durationMs: duration,
    });
  } catch (error: any) {
    console.error("[Cron] 去重清理失败:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
