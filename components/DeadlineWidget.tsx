import { getUpcomingDeadlines, getDaysUntilDeadline } from "@/lib/services/event-service";
import { EDUCATION_LABELS } from "@/lib/constants";
import Link from "next/link";
import { cn } from "@/lib/utils";

export default async function DeadlineWidget({ className }: { className?: string }) {
  const events = await getUpcomingDeadlines(14);

  return (
    <div className={cn("bg-white/[0.03] backdrop-blur-xl border border-white/[0.08] rounded-2xl p-5", className)}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <svg
            className="w-5 h-5 text-white"
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
          <h3 className="font-semibold text-white">即将截止</h3>
        </div>
        <Link
          href="/admin/events"
          className="text-xs text-white/50 hover:text-white/70 transition-colors"
        >
          + 快速添加
        </Link>
      </div>

      {events.length === 0 ? (
        <div className="py-6 text-center">
          <p className="text-sm text-white/40">暂无即将截止的网申</p>
          <Link
            href="/admin/events"
            className="text-xs text-white/50 hover:text-white/70 mt-2 inline-block transition-colors"
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
                className="block p-3 rounded-lg bg-white/[0.02] border border-white/[0.06] hover:bg-white/[0.05] transition-colors group"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-white truncate">
                      {event.company}
                    </p>
                    <p className="text-xs text-white/50 truncate">{event.title}</p>
                  </div>
                  <span
                    className={cn(
                      "shrink-0 px-2 py-0.5 rounded-full text-xs font-medium",
                      isUrgent
                        ? "text-red-400/80 bg-red-500/15 border border-red-400/30"
                        : daysLeft <= 7
                        ? "text-orange-400/80 bg-orange-500/15 border border-orange-400/30"
                        : "text-white/50 bg-white/[0.05]"
                    )}
                  >
                    {daysLeft === 0 ? "今天截止" : `${daysLeft}天后`}
                  </span>
                </div>
                <div className="mt-1.5 flex items-center gap-2 text-xs text-white/40">
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
