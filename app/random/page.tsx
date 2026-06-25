import Navbar from "@/components/Navbar";
import JobCard from "@/components/JobCard";
import { getRandomJobs } from "@/lib/services/job-service";
import Link from "next/link";

export default async function RandomPage() {
  const jobs = await getRandomJobs(20);

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
            🎲 随机探索
          </h1>
          <p className="mt-3 text-gray-600 max-w-xl mx-auto">
            打破算法茧房，随机发现好工作。每次刷新都会展示 20 个不同公司的随机职位。
          </p>
          <div className="mt-4">
            <a
              href="/random"
              className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-medium rounded-xl shadow-lg shadow-purple-500/25 hover:shadow-xl hover:shadow-purple-500/30 transform hover:-translate-y-0.5 transition-all"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                />
              </svg>
              换一批
            </a>
          </div>
        </div>

        {jobs.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {jobs.map((job) => (
              <JobCard key={job.id} job={job} />
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
            <p className="text-gray-500">暂无数据，先去添加一些职位吧</p>
            <Link href="/admin" className="text-blue-600 text-sm mt-2 inline-block">
              去管理后台 →
            </Link>
          </div>
        )}
      </main>
    </div>
  );
}
