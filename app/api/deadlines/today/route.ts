/**
 * 公开接口：今日/近期网申截止列表
 * 无需认证，供外部服务（IFTTT、RSS 阅读器等）调用
 */

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const now = new Date();
  const threeDaysLater = new Date();
  threeDaysLater.setDate(now.getDate() + 14); // 展示未来 14 天

  try {
    const events = await prisma.event.findMany({
      where: {
        deadlineDate: {
          gte: now,
          lte: threeDaysLater,
        },
      },
      orderBy: { deadlineDate: "asc" },
    });

    return NextResponse.json(
      {
        updatedAt: now.toISOString(),
        total: events.length,
        urgentCount: events.filter(
          (e) => new Date(e.deadlineDate).getTime() - now.getTime() < 3 * 24 * 60 * 60 * 1000
        ).length,
        events: events.map((e) => ({
          company: e.company,
          title: e.title,
          deadlineDate: e.deadlineDate.toISOString(),
          daysLeft: Math.ceil(
            (new Date(e.deadlineDate).getTime() - now.getTime()) /
              (1000 * 60 * 60 * 24)
          ),
          education: e.targetEducation,
          sourceUrl: e.sourceUrl,
          note: e.note,
        })),
      },
      {
        headers: {
          "Cache-Control": "public, max-age=3600", // 缓存 1 小时
        },
      }
    );
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
