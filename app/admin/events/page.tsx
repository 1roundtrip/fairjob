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
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">网申截止管理</h1>
            <p className="text-sm text-gray-500 mt-1">
              手动添加网申截止日期，看到官网信息后 30 秒录入
            </p>
          </div>
          <Link
            href="/admin"
            className="text-sm text-gray-500 hover:text-gray-700"
          >
            ← 返回后台
          </Link>
        </div>

        {/* 快速添加表单 */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm mb-8">
          <h2 className="font-semibold text-gray-900 mb-4">➕ 快速添加</h2>
          <form action="/api/admin/events" method="POST" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  公司名称 *
                </label>
                <input
                  type="text"
                  name="company"
                  required
                  placeholder="如：华为、字节跳动"
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  岗位/批次 *
                </label>
                <input
                  type="text"
                  name="title"
                  required
                  placeholder="如：2026届春招、算法工程师"
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  截止日期 *
                </label>
                <input
                  type="date"
                  name="deadlineDate"
                  required
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  目标学历
                </label>
                <select
                  name="targetEducation"
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {ALL_EDUCATION_OPTIONS.map((edu) => (
                    <option key={edu} value={edu}>
                      {EDUCATION_LABELS[edu]}
                    </option>
                  ))}
                </select>
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  网申链接 *
                </label>
                <input
                  type="url"
                  name="sourceUrl"
                  required
                  placeholder="https://..."
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  备注（可选）
                </label>
                <input
                  type="text"
                  name="note"
                  placeholder="内推码、注意事项等..."
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            <div className="flex justify-end">
              <button
                type="submit"
                className="px-5 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
              >
                添加
              </button>
            </div>
          </form>
        </div>

        {/* 即将截止 */}
        <div className="mb-8">
          <h2 className="font-semibold text-gray-900 mb-3">
            进行中 ({upcoming.length})
          </h2>
          {upcoming.length === 0 ? (
            <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
              <p className="text-gray-400 text-sm">暂无进行中的网申</p>
            </div>
          ) : (
            <div className="space-y-2">
              {upcoming.map((event) => {
                const daysLeft = getDaysUntilDeadline(event.deadlineDate);
                const isUrgent = daysLeft <= 3;
                return (
                  <div
                    key={event.id}
                    className="bg-white rounded-lg border border-gray-200 p-4 flex items-center justify-between"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-gray-900">
                          {event.company}
                        </span>
                        <span className="text-sm text-gray-500">·</span>
                        <span className="text-sm text-gray-600 truncate">
                          {event.title}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 mt-1 text-xs text-gray-400">
                        <span>{EDUCATION_LABELS[event.targetEducation]}</span>
                        <span>·</span>
                        <a
                          href={event.sourceUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-500 hover:text-blue-600 truncate max-w-xs"
                        >
                          {event.sourceUrl}
                        </a>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 shrink-0 ml-4">
                      <span
                        className={cn(
                          "px-2.5 py-1 rounded-full text-xs font-medium",
                          isUrgent
                            ? "bg-red-100 text-red-700"
                            : daysLeft <= 7
                            ? "bg-orange-100 text-orange-700"
                            : "bg-green-100 text-green-700"
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
                          className="text-gray-400 hover:text-red-500 text-xs"
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
            <h2 className="font-semibold text-gray-500 mb-3 text-sm">
              已过期 ({expired.length})
            </h2>
            <div className="space-y-1 opacity-60">
              {expired.slice(0, 10).map((event) => (
                <div
                  key={event.id}
                  className="bg-gray-50 rounded-lg border border-gray-100 p-3 flex items-center justify-between text-sm"
                >
                  <div className="flex items-center gap-2 text-gray-500">
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
                      className="text-gray-400 hover:text-red-500 text-xs"
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
