import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  const id = parseInt(params.id, 10);

  if (isNaN(id)) {
    return NextResponse.json({ error: "Invalid ID" }, { status: 400 });
  }

  try {
    await prisma.reviewJob.update({
      where: { id },
      data: {
        status: "REJECTED",
        reviewedAt: new Date(),
        reviewNote: "人工拒绝",
      },
    });

    return NextResponse.redirect(new URL(request.url).origin + "/admin/review");
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Rejection failed" },
      { status: 500 }
    );
  }
}
