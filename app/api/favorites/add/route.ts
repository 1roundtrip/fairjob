import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  try {
    const data = await request.json();
    const {
      jobId,
      title,
      company,
      location,
      education,
      jobType,
      sourceUrl,
      sourceName,
    } = data;

    if (!sourceUrl || !title || !company) {
      return NextResponse.json(
        { error: "缺少必要字段" },
        { status: 400 }
      );
    }

    const existing = await prisma.favorite.findUnique({
      where: { sourceUrl },
    });

    if (existing) {
      return NextResponse.json(existing);
    }

    const favorite = await prisma.favorite.create({
      data: {
        jobId: jobId || null,
        title,
        company,
        location: location || null,
        education: education || "UNKNOWN",
        jobType: jobType || null,
        sourceUrl,
        sourceName: sourceName || null,
      },
    });

    return NextResponse.json(favorite);
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "收藏失败" },
      { status: 500 }
    );
  }
}
