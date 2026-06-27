import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const count = Math.min(Math.max(parseInt(searchParams.get("count") || "20", 10), 1), 50);

  try {
    // 获取随机职位（使用 NEWID() 的替代方案）
    const jobs = await prisma.$queryRaw<
      Array<{
        id: number;
        title: string;
        company: string;
        location: string | null;
        salary: string | null;
        education: string;
        jobType: string | null;
        publishedAt: Date | null;
        sourceName: string | null;
        sourceUrl: string;
        isMerged: boolean;
        mergeCount: number;
        failCount: number | null;
        confidence: number | null;
        createdAt: Date;
      }>
    >`
      SELECT * FROM Job 
      WHERE failCount < 2 
        AND confidence > 0.3
      ORDER BY RANDOM() 
      LIMIT ${count}
    `;

    return NextResponse.json({ jobs });
  } catch (error) {
    console.error("Random jobs error:", error);
    return NextResponse.json({ jobs: [] }, { status: 200 });
  }
}
