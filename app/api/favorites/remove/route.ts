import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  try {
    const { sourceUrl } = await request.json();

    if (!sourceUrl) {
      return NextResponse.json(
        { error: "缺少 sourceUrl" },
        { status: 400 }
      );
    }

    await prisma.favorite.deleteMany({
      where: { sourceUrl },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "取消收藏失败" },
      { status: 500 }
    );
  }
}
