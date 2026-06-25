/**
 * 定时任务：网申截止提醒
 * 每天上午 9 点运行
 * 更新 /api/deadlines/today 接口的数据
 * 可被外部服务（如 IFTTT）轮询
 */

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendAlert } from "@/lib/services/monitoring";

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  const CRON_SECRET = process.env.CRON_SECRET || "";
  if (CRON_SECRET && authHeader !== `Bearer ${CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const now = new Date();
  const threeDaysLater = new Date();
  threeDaysLater.setDate(now.getDate() + 3);

  try {
    console.log("[Cron] 检查网申截止提醒");

    // 找出未来 3 天内截止的事件
    const urgentEvents = await prisma.event.findMany({
      where: {
        deadlineDate: { gte: now, lte: threeDaysLater },
      },
      orderBy: { deadlineDate: "asc" },
    });

    if (urgentEvents.length > 0) {
      // 发送推送通知
      const eventList = urgentEvents
        .map(
          (e, i) =>
            `${i + 1}. ${e.company} - ${e.title} (${new Date(e.deadlineDate).toLocaleDateString("zh-CN")})`
        )
        .join("\n");

      await sendAlert({
        title: `[FairJob] ${urgentEvents.length} 个网申即将截止`,
        content: eventList,
        level: "warning",
      });

      console.log(`[Cron] 发送截止提醒: ${urgentEvents.length} 个`);
    }

    // 同时更新一个缓存记录，供 /api/deadlines/today 使用
    // 用 CrawlLog 表存今天的提醒状态
    await prisma.crawlLog.create({
      data: {
        sourceName: "截止提醒",
        jobsFound: urgentEvents.length,
        jobsAdded: 0,
        jobsMerged: 0,
        jobsReview: 0,
        durationMs: 0,
      },
    });

    return NextResponse.json({
      success: true,
      urgentCount: urgentEvents.length,
      events: urgentEvents.map((e) => ({
        company: e.company,
        title: e.title,
        deadlineDate: e.deadlineDate.toISOString(),
        sourceUrl: e.sourceUrl,
      })),
    });
  } catch (error: any) {
    console.error("[Cron] 截止提醒失败:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
