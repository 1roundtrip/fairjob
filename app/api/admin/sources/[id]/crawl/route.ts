import { NextResponse } from "next/server";
import { crawlScheduler } from "@/lib/crawlers/crawl-scheduler";

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  const sourceId = parseInt(params.id, 10);

  if (isNaN(sourceId)) {
    return NextResponse.json({ error: "Invalid source ID" }, { status: 400 });
  }

  try {
    const result = await crawlScheduler.crawlSource(sourceId);

    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Crawl failed" },
      { status: 500 }
    );
  }
}
