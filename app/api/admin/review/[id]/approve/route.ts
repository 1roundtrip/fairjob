import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { ALL_EDUCATION_OPTIONS, type EducationLevel } from "@/lib/constants";

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  const id = parseInt(params.id, 10);

  if (isNaN(id)) {
    return NextResponse.json({ error: "Invalid ID" }, { status: 400 });
  }

  try {
    const formData = await request.formData();
    const education = formData.get("education") as string;

    if (!education || !ALL_EDUCATION_OPTIONS.includes(education as EducationLevel)) {
      return NextResponse.json(
        { error: `Invalid education level` },
        { status: 400 }
      );
    }

    const reviewJob = await prisma.reviewJob.findUnique({
      where: { id },
      include: { source: true },
    });

    if (!reviewJob) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    // 创建正式职位
    await prisma.job.create({
      data: {
        title: reviewJob.title,
        company: reviewJob.company,
        location: reviewJob.location,
        salary: reviewJob.salary,
        description: reviewJob.description,
        requirements: reviewJob.requirements,
        education: education as EducationLevel,
        sourceId: reviewJob.sourceId,
        sourceName: reviewJob.source?.name || "人工审核",
        sourceUrl: reviewJob.sourceUrl,
        confidence: Math.max(reviewJob.confidence, 0.8),
      },
    });

    // 更新审核状态
    await prisma.reviewJob.update({
      where: { id },
      data: {
        status: "APPROVED",
        suggestedEdu: education as EducationLevel,
        reviewedAt: new Date(),
        reviewNote: "人工审核通过",
      },
    });

    // 重定向回审核页
    return NextResponse.redirect(new URL(request.url).origin + "/admin/review");
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Approval failed" },
      { status: 500 }
    );
  }
}
