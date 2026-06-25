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
    await prisma.event.delete({ where: { id } });
    return NextResponse.redirect(
      new URL(request.url).origin + "/admin/events"
    );
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "删除失败" },
      { status: 500 }
    );
  }
}
