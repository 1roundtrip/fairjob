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
    <div className="min-h-screen relative z-10">
      <Navbar />

      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-white">学历待审核</h1>
          <Link
            href="/admin"
            className="text-sm text-white/50 hover:text-white/70"
          >
            ← 返回后台
          </Link>
        </div>

        {pendingJobs.length === 0 ? (
          <div className="glass-card p-12 text-center">
            <svg
              className="w-16 h-16 text-emerald-300/50 mx-auto mb-4"
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
            <p className="text-white/70">没有待审核的职位</p>
            <p className="text-sm text-white/40 mt-1">
              所有职位学历均已确认
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {pendingJobs.map((job) => (
              <div
                key={job.id}
                className="glass-card p-5"
              >
                <div className="flex justify-between items-start gap-4 mb-4">
                  <div>
                    <h3 className="font-semibold text-white">
                      {job.title}
                    </h3>
                    <p className="text-sm text-white/60 mt-0.5">
                      {job.company}
                      {job.location && ` · ${job.location}`}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-xs text-white/40">当前判定:</span>
                    <EducationBadge education={job.education} />
                  </div>
                </div>

                {job.description && (
                  <p className="text-sm text-white/60 bg-white/[0.03] p-3 rounded-lg mb-4 line-clamp-3 border border-white/[0.05]">
                    {job.description}
                  </p>
                )}

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs text-white/40">
                    <span>置信度: {(job.confidence * 100).toFixed(0)}%</span>
                    <span>·</span>
                    <a
                      href={job.sourceUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-indigo-300 hover:text-indigo-200"
                    >
                      查看原文
                    </a>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-xs text-white/50">批准为:</span>
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
                          className="px-2 py-1 text-xs rounded border border-white/10 bg-white/[0.03] text-white/70 hover:bg-white/[0.08] hover:border-white/20 transition-all"
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
                        className="px-2 py-1 text-xs rounded bg-red-500/15 text-red-300 border border-red-400/30 hover:bg-red-500/25 transition-all"
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
