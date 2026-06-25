import Navbar from "@/components/Navbar";
import { prisma } from "@/lib/prisma";
import EducationBadge from "@/components/EducationBadge";
import { EDUCATION_LABELS, ALL_EDUCATION_OPTIONS } from "@/lib/constants";
import Link from "next/link";

export default async function ReviewPage() {
  const pendingJobs = await prisma.reviewJob.findMany({
    where: { status: "PENDING" },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  const eduOptions = ALL_EDUCATION_OPTIONS;

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-gray-900">学历待审核</h1>
          <Link
            href="/admin"
            className="text-sm text-gray-500 hover:text-gray-700"
          >
            ← 返回后台
          </Link>
        </div>

        {pendingJobs.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
            <svg
              className="w-16 h-16 text-green-300 mx-auto mb-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <p className="text-gray-600">没有待审核的职位</p>
            <p className="text-sm text-gray-400 mt-1">
              所有职位学历均已确认
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {pendingJobs.map((job) => (
              <div
                key={job.id}
                className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm"
              >
                <div className="flex justify-between items-start gap-4 mb-4">
                  <div>
                    <h3 className="font-semibold text-gray-900">
                      {job.title}
                    </h3>
                    <p className="text-sm text-gray-600 mt-0.5">
                      {job.company}
                      {job.location && ` · ${job.location}`}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-xs text-gray-400">当前判定:</span>
                    <EducationBadge education={job.education} />
                  </div>
                </div>

                {job.description && (
                  <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded-lg mb-4 line-clamp-3">
                    {job.description}
                  </p>
                )}

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs text-gray-400">
                    <span>置信度: {(job.confidence * 100).toFixed(0)}%</span>
                    <span>·</span>
                    <a
                      href={job.sourceUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-500 hover:text-blue-600"
                    >
                      查看原文
                    </a>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-500">批准为:</span>
                    {eduOptions.map((edu) => (
                      <form
                        key={edu}
                        action={`/api/admin/review/${job.id}/approve`}
                        method="POST"
                      >
                        <input
                          type="hidden"
                          name="education"
                          value={edu}
                        />
                        <button
                          type="submit"
                          className="px-2 py-1 text-xs rounded border border-gray-200 hover:bg-gray-50 text-gray-600"
                        >
                          {EDUCATION_LABELS[edu]}
                        </button>
                      </form>
                    ))}
                    <form
                      action={`/api/admin/review/${job.id}/reject`}
                      method="POST"
                    >
                      <button
                        type="submit"
                        className="px-2 py-1 text-xs rounded border border-red-200 text-red-600 hover:bg-red-50"
                      >
                        拒绝
                      </button>
                    </form>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
