import { NextResponse } from "next/server";
import { getStatistics } from "@/lib/services/job-service";

export async function GET() {
  const stats = await getStatistics();
  return NextResponse.json(stats);
}
