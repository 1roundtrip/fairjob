/**
 * 定时任务：学历回填
 * 每天凌晨 3 点运行
 * 检查 education=UNKNOWN 的岗位，用规则重新判断
 */

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { extractEducation } from "@/lib/parsers/education-extractor";
import { type EducationLevel } from "@/lib/constants";

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  const CRON_SECRET = process.env.CRON_SECRET || "";
  if (CRON_SECRET && authHeader !== `Bearer ${CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const startTime = Date.now();

  try {
    console.log("[Cron] 开始学历回填任务");

    // 找出所有 UNKNOWN 的待审核职位
    const unknownJobs = await prisma.reviewJob.findMany({
      where: {
        status: "PENDING",
        education: "UNKNOWN",
      },
      select: {
        id: true,
        title: true,
        description: true,
        requirements: true,
      },
      take: 100, // 每次最多处理 100 条
    });

    let updated = 0;
    let stillUnknown = 0;

    for (const job of unknownJobs) {
      const text = [job.title, job.description, job.requirements]
        .filter(Boolean)
        .join("\n");

      const result = extractEducation(text);

      if (result.education !== "UNKNOWN") {
        await prisma.reviewJob.update({
          where: { id: job.id },
          data: {
            education: result.education,
            suggestedEdu: result.education,
          },
        });
        updated++;
      } else {
        stillUnknown++;
      }
    }

    const duration = Date.now() - startTime;

    console.log(
      `[Cron] 学历回填完成：更新 ${updated} 条，剩余未知 ${stillUnknown} 条，耗时 ${duration}ms`
    );

    return NextResponse.json({
      success: true,
      processed: unknownJobs.length,
      updated,
      stillUnknown,
      durationMs: duration,
    });
  } catch (error: any) {
    console.error("[Cron] 学历回填失败:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
