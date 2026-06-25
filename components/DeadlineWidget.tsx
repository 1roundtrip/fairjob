import { getUpcomingDeadlines, getDaysUntilDeadline } from "@/lib/services/event-service";
import { EDUCATION_LABELS } from "@/lib/constants";
import Link from "next/link";
import { cn } from "@/lib/utils";

export default async function DeadlineWidget({ className }: { className?: string }) {
  const events = await getUpcomingDeadlines(14);

  return (
    <div className={cn("bg-white rounded-xl border border-gray-200 p-5 shadow-sm", className)}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <svg
            className="w-5 h-5 text-orange-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <h3 className="font-semibold text-gray-900">即将截止</h3>
        </div>
        <Link
          href="/admin/events"
          className="text-xs text-blue-600 hover:text-blue-700"
        >
          + 快速添加
        </Link>
      </div>

      {events.length === 0 ? (
        <div className="py-6 text-center">
          <p className="text-sm text-gray-400">暂无即将截止的网申</p>
          <Link
            href="/admin/events"
            className="text-xs text-blue-600 hover:text-blue-700 mt-2 inline-block"
          >
            去添加 →
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {events.map((event) => {
            const daysLeft = getDaysUntilDeadline(event.deadlineDate);
            const isUrgent = daysLeft <= 3;

            return (
              <a
                key={event.id}
                href={event.sourceUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="block p-3 rounded-lg border border-gray-100 hover:border-orange-200 hover:bg-orange-50/50 transition-colors group"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-gray-900 group-hover:text-orange-700 truncate">
                      {event.company}
                    </p>
                    <p className="text-xs text-gray-500 truncate">{event.title}</p>
                  </div>
                  <span
                    className={cn(
                      "shrink-0 px-2 py-0.5 rounded-full text-xs font-medium",
                      isUrgent
                        ? "bg-red-100 text-red-700"
                        : daysLeft <= 7
                        ? "bg-orange-100 text-orange-700"
                        : "bg-gray-100 text-gray-600"
                    )}
                  >
                    {daysLeft === 0 ? "今天截止" : `${daysLeft}天后`}
                  </span>
                </div>
                <div className="mt-1.5 flex items-center gap-2 text-xs text-gray-400">
                  <span>{EDUCATION_LABELS[event.targetEducation] || "不限"}</span>
                  <span>·</span>
                  <span>
                    {new Date(event.deadlineDate).toLocaleDateString("zh-CN", {
                      month: "short",
                      day: "numeric",
                    })}
                  </span>
                </div>
              </a>
            );
          })}
        </div>
      )}
    </div>
  );
}
