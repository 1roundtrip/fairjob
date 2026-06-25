import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const favorites = await prisma.favorite.findMany({
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(favorites);
}
