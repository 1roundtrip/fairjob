import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    // 各数据源最近抓取状态
    const recentLogs = await prisma.crawlLog.findMany({
      orderBy: { createdAt: "desc" },
      take: 20,
    });

    // 按来源分组，看最新一次
    const sourceStatus = await prisma.source.findMany({
      select: {
        id: true,
        name: true,
        isActive: true,
        failCount: true,
        lastCrawledAt: true,
      },
    });

    // 检查连续失败的数据源
    const alertSources = sourceStatus.filter(
      (s) => s.isActive && s.failCount >= 3
    );

    // 统计
    const [totalJobs, totalSources, pendingReview, totalEvents] =
      await Promise.all([
        prisma.job.count(),
        prisma.source.count({ where: { isActive: true } }),
        prisma.reviewJob.count({ where: { status: "PENDING" } }),
        prisma.event.count(),
      ]);

    // 即将截止的网申
    const now = new Date();
    const threeDaysLater = new Date();
    threeDaysLater.setDate(now.getDate() + 3);

    const urgentEvents = await prisma.event.count({
      where: {
        deadlineDate: { gte: now, lte: threeDaysLater },
      },
    });

    // 本周新增
    const weekAgo = new Date();
    weekAgo.setDate(now.getDate() - 7);

    const newThisWeek = await prisma.job.count({
      where: { createdAt: { gte: weekAgo } },
    });

    const status = {
      ok: true,
      timestamp: now.toISOString(),
      database: "connected",
      stats: {
        totalJobs,
        totalSources,
        pendingReview,
        totalEvents,
        newThisWeek,
      },
      sources: sourceStatus.map((s) => ({
        id: s.id,
        name: s.name,
        active: s.isActive,
        consecutiveFailures: s.failCount,
        lastCrawledAt: s.lastCrawledAt?.toISOString() || null,
        alert:
          s.isActive && s.failCount >= 3
            ? `连续失败 ${s.failCount} 次`
            : null,
      })),
      alerts: {
        critical: alertSources.map((s) => ({
          sourceId: s.id,
          sourceName: s.name,
          message: `连续失败 ${s.failCount} 次，请检查`,
        })),
        urgentEvents,
      },
    };

    return NextResponse.json(status, {
      headers: {
        "Cache-Control": "no-store",
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        ok: false,
        timestamp: new Date().toISOString(),
        database: "error",
        error: error.message,
      },
      { status: 500 }
    );
  }
}
