import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { ALL_SOURCE_TYPES, ALL_PARSER_TYPES, type SourceType, type ParserType } from "@/lib/constants";

export async function GET() {
  const sources = await prisma.source.findMany({
    orderBy: [{ isActive: "desc" }, { createdAt: "desc" }],
  });

  return NextResponse.json(sources);
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const { name, url, type, parserType, isActive = true, crawlInterval = 120, config } = body;

    if (!name || !url) {
      return NextResponse.json(
        { error: "name and url are required" },
        { status: 400 }
      );
    }

    if (!ALL_SOURCE_TYPES.includes(type as SourceType)) {
      return NextResponse.json(
        { error: `Invalid source type. Must be one of: ${ALL_SOURCE_TYPES.join(", ")}` },
        { status: 400 }
      );
    }

    if (!ALL_PARSER_TYPES.includes(parserType as ParserType)) {
      return NextResponse.json(
        { error: `Invalid parser type. Must be one of: ${ALL_PARSER_TYPES.join(", ")}` },
        { status: 400 }
      );
    }

    const source = await prisma.source.create({
      data: {
        name,
        url,
        type,
        parserType,
        isActive,
        crawlInterval,
        config,
      },
    });

    return NextResponse.json(source, { status: 201 });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to create source" },
      { status: 500 }
    );
  }
}
