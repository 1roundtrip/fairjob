import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { ALL_EDUCATION_OPTIONS, type EducationLevel } from "@/lib/constants";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const days = parseInt(searchParams.get("days") || "14", 10);
  const education = searchParams.get("education");

  const now = new Date();
  const deadline = new Date();
  deadline.setDate(deadline.getDate() + days);

  const where: any = {
    deadlineDate: {
      gte: now,
      lte: deadline,
    },
  };

  if (education && ALL_EDUCATION_OPTIONS.includes(education as EducationLevel)) {
    where.targetEducation = education;
  }

  const events = await prisma.event.findMany({
    where,
    orderBy: { deadlineDate: "asc" },
  });

  return NextResponse.json(events);
}

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const company = formData.get("company") as string;
    const title = formData.get("title") as string;
    const deadlineDate = formData.get("deadlineDate") as string;
    const targetEducation =
      (formData.get("targetEducation") as EducationLevel) ||
      "UNKNOWN";
    const sourceUrl = formData.get("sourceUrl") as string;
    const note = (formData.get("note") as string) || null;

    if (!company || !title || !deadlineDate || !sourceUrl) {
      return NextResponse.json(
        { error: "缺少必填字段" },
        { status: 400 }
      );
    }

    const event = await prisma.event.create({
      data: {
        company,
        title,
        deadlineDate: new Date(deadlineDate + "T23:59:59"),
        targetEducation,
        sourceUrl,
        note,
      },
    });

    // 重定向回管理页
    return NextResponse.redirect(
      new URL(request.url).origin + "/admin/events"
    );
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "创建失败" },
      { status: 500 }
    );
  }
}
