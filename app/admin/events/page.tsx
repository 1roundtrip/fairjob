import Navbar from "@/components/Navbar";
import { prisma } from "@/lib/prisma";
import { getDaysUntilDeadline } from "@/lib/services/event-service";
import { EDUCATION_LABELS, ALL_EDUCATION_OPTIONS } from "@/lib/constants";
import { cn } from "@/lib/utils";
import Link from "next/link";

export default async function EventsAdminPage() {
  const events = await prisma.event.findMany({
    orderBy: { deadlineDate: "asc" },
  });

  const now = new Date();
  const upcoming = events.filter(
    (e) => new Date(e.deadlineDate) >= now
  );
  const expired = events.filter(
    (e) => new Date(e.deadlineDate) < now
  );

  return (
    <div className="min-h-screen relative z-10">
      <Navbar />

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-white">网申截止管理</h1>
            <p className="text-sm text-white/50 mt-1">
              手动添加网申截止日期，看到官网信息后 30 秒录入
            </p>
          </div>
          <Link
            href="/admin"
            className="text-sm text-white/50 hover:text-white/70"
          >
            ← 返回后台
          </Link>
        </div>

        {/* 快速添加表单 */}
        <div className="glass-card p-6 mb-8">
          <h2 className="font-semibold text-white mb-4">➕ 快速添加</h2>
          <form action="/api/admin/events" method="POST" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-white/80 mb-1">
                  公司名称 *
                </label>
                <input
                  type="text"
                  name="company"
                  required
                  placeholder="如：华为、字节跳动"
                  className="w-full px-3 py-2 bg-white/[0.05] border border-white/[0.1] rounded-lg text-sm text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-400/50"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-white/80 mb-1">
                  岗位/批次 *
                </label>
                <input
                  type="text"
                  name="title"
                  required
                  placeholder="如：2026届春招、算法工程师"
                  className="w-full px-3 py-2 bg-white/[0.05] border border-white/[0.1] rounded-lg text-sm text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-400/50"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-white/80 mb-1">
                  截止日期 *
                </label>
                <input
                  type="date"
                  name="deadlineDate"
                  required
                  className="w-full px-3 py-2 bg-white/[0.05] border border-white/[0.1] rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-400/50"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-white/80 mb-1">
                  目标学历
                </label>
                <select
                  name="targetEducation"
                  className="w-full px-3 py-2 bg-white/[0.05] border border-white/[0.1] rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-400/50"
                >
                  {ALL_EDUCATION_OPTIONS.map((edu) => (
                    <option key={edu} value={edu} className="bg-slate-900">
                      {EDUCATION_LABELS[edu]}
                    </option>
                  ))}
                </select>
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-white/80 mb-1">
                  网申链接 *
                </label>
                <input
                  type="url"
                  name="sourceUrl"
                  required
                  placeholder="https://..."
                  className="w-full px-3 py-2 bg-white/[0.05] border border-white/[0.1] rounded-lg text-sm text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-400/50"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-white/80 mb-1">
                  备注（可选）
                </label>
                <input
                  type="text"
                  name="note"
                  placeholder="内推码、注意事项等..."
                  className="w-full px-3 py-2 bg-white/[0.05] border border-white/[0.1] rounded-lg text-sm text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-400/50"
                />
              </div>
            </div>
            <div className="flex justify-end">
              <button
                type="submit"
                className="btn-primary"
              >
                添加
              </button>
            </div>
          </form>
        </div>

        {/* 即将截止 */}
        <div className="mb-8">
          <h2 className="font-semibold text-white mb-3">
            进行中 ({upcoming.length})
          </h2>
          {upcoming.length === 0 ? (
            <div className="glass-card p-8 text-center">
              <p className="text-white/40 text-sm">暂无进行中的网申</p>
            </div>
          ) : (
            <div className="space-y-2">
              {upcoming.map((event) => {
                const daysLeft = getDaysUntilDeadline(event.deadlineDate);
                const isUrgent = daysLeft <= 3;
                return (
                  <div
                    key={event.id}
                    className="glass-card p-4 flex items-center justify-between"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-white">
                          {event.company}
                        </span>
                        <span className="text-sm text-white/30">·</span>
                        <span className="text-sm text-white/60 truncate">
                          {event.title}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 mt-1 text-xs text-white/40">
                        <span>{EDUCATION_LABELS[event.targetEducation]}</span>
                        <span>·</span>
                        <a
                          href={event.sourceUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-indigo-300 hover:text-indigo-200 truncate max-w-xs"
                        >
                          {event.sourceUrl}
                        </a>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 shrink-0 ml-4">
                      <span
                        className={cn(
                          "px-2.5 py-1 rounded-full text-xs font-medium border",
                          isUrgent
                            ? "bg-red-500/15 text-red-300 border-red-400/30"
                            : daysLeft <= 7
                            ? "bg-amber-500/15 text-amber-300 border-amber-400/30"
                            : "bg-emerald-500/15 text-emerald-300 border-emerald-400/30"
                        )}
                      >
                        {daysLeft === 0 ? "今天截止" : `${daysLeft}天后`}
                      </span>
                      <form
                        action={`/api/admin/events/${event.id}/delete`}
                        method="POST"
                      >
                        <button
                          type="submit"
                          className="text-white/40 hover:text-red-300 text-xs transition-colors"
                        >
                          删除
                        </button>
                      </form>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* 已过期 */}
        {expired.length > 0 && (
          <div>
            <h2 className="font-semibold text-white/50 mb-3 text-sm">
              已过期 ({expired.length})
            </h2>
            <div className="space-y-1 opacity-60">
              {expired.slice(0, 10).map((event) => (
                <div
                  key={event.id}
                  className="bg-white/[0.02] rounded-lg border border-white/[0.05] p-3 flex items-center justify-between text-sm"
                >
                  <div className="flex items-center gap-2 text-white/50">
                    <span className="line-through">{event.company}</span>
                    <span>·</span>
                    <span className="line-through">{event.title}</span>
                  </div>
                  <form
                    action={`/api/admin/events/${event.id}/delete`}
                    method="POST"
                  >
                    <button
                      type="submit"
                      className="text-white/40 hover:text-red-300 text-xs transition-colors"
                    >
                      删除
                    </button>
                  </form>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
