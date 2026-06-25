import { NextResponse } from "next/server";
import { crawlScheduler } from "@/lib/crawlers/crawl-scheduler";

/**
 * 健康检查 + 触发全量抓取（用于 Vercel Cron 调用）
 * GET 请求可被 Vercel Cron 定时触发
 */
export async function GET() {
  return NextResponse.json({ status: "ok" });
}

/**
 * POST 手动触发全量抓取
 */
export async function POST() {
  try {
    const result = await crawlScheduler.crawlAllActive();

    return NextResponse.json({
      success: true,
      ...result,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
