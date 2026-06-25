import { prisma } from "@/lib/prisma";
import { type EducationLevel } from "@/lib/constants";

/**
 * 获取即将截止的网申（未来14天内）
 */
export async function getUpcomingDeadlines(days = 14, education?: EducationLevel[]) {
  const now = new Date();
  const deadline = new Date();
  deadline.setDate(deadline.getDate() + days);

  const where: any = {
    deadlineDate: {
      gte: now,
      lte: deadline,
    },
  };

  if (education && education.length > 0) {
    where.targetEducation = { in: education };
  }

  const events = await prisma.event.findMany({
    where,
    orderBy: { deadlineDate: "asc" },
    take: 20,
  });

  return events;
}

/**
 * 计算距离截止日期的天数
 */
export function getDaysUntilDeadline(deadlineDate: Date): number {
  const now = new Date();
  const deadline = new Date(deadlineDate);
  const diffTime = deadline.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
}
