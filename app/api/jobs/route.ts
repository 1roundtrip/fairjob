import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { ALL_EDUCATION_OPTIONS } from "@/lib/constants";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get("page") || "1", 10);
  const pageSize = parseInt(searchParams.get("pageSize") || "20", 10);
  const keyword = searchParams.get("q") || "";
  const location = searchParams.get("location") || "";
  const educationParam = searchParams.get("education") || "";
  const source = searchParams.get("source") || "";
  const sortBy = searchParams.get("sortBy") || "newest";

  const skip = (page - 1) * pageSize;

  const where: any = {};

  if (keyword) {
    where.OR = [
      { title: { contains: keyword } },
      { company: { contains: keyword } },
    ];
  }

  if (location) {
    where.location = { contains: location };
  }

  if (educationParam) {
    const edus = educationParam
      .split(",")
      .filter((e) => ALL_EDUCATION_OPTIONS.includes(e as any));
    if (edus.length > 0) {
      where.education = { in: edus };
    }
  }

  if (source) {
    where.sourceName = source;
  }

  let orderBy: any = { publishedAt: "desc" };
  if (sortBy === "salary_desc") {
    orderBy = { salaryMax: "desc" };
  }

  const [items, total] = await Promise.all([
    prisma.job.findMany({
      where,
      orderBy: [orderBy, { createdAt: "desc" }],
      skip,
      take: pageSize,
      select: {
        id: true,
        title: true,
        company: true,
        location: true,
        salary: true,
        education: true,
        jobType: true,
        publishedAt: true,
        sourceName: true,
        sourceUrl: true,
        isMerged: true,
        mergeCount: true,
        createdAt: true,
      },
    }),
    prisma.job.count({ where }),
  ]);

  return NextResponse.json({
    items,
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
  });
}
