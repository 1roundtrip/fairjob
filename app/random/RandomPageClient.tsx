"use client";

import { useState, useEffect } from "react";
import JobCard from "@/components/JobCard";
import { BACHELOR_FILTER, ASSOCIATE_FILTER } from "@/lib/constants";

interface Job {
  id: number;
  title: string;
  company: string;
  location: string | null;
  salary: string | null;
  education: string;
  jobType: string | null;
  publishedAt: Date | string | null;
  sourceName: string | null;
  sourceUrl: string;
  isMerged: boolean;
  mergeCount: number;
  failCount?: number | null;
  confidence?: number | null;
  createdAt: Date | string;
}

type ViewMode = "all" | "bachelor" | "associate";

const STORAGE_KEY = "fairjob_education_view";

export default function RandomPageClient({
  initialJobs,
}: {
  initialJobs: Job[];
}) {
  const [jobs, setJobs] = useState(initialJobs);
  const [filterMode, setFilterMode] = useState<ViewMode>("all");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved && ["BACHELOR", "ASSOCIATE", "ALL"].includes(saved)) {
        setFilterMode(saved.toLowerCase() as ViewMode);
      }
    } catch {
      // ignore
    }
  }, []);

  const handleFilterChange = (mode: ViewMode) => {
    setFilterMode(mode);
    try {
      localStorage.setItem(STORAGE_KEY, mode.toUpperCase());
    } catch {
      // ignore
    }
  };

  const handleRefresh = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/jobs/random?count=20");
      const data = await res.json();
      setJobs(data.jobs || []);
    } catch {
      // keep current jobs
    }
    setLoading(false);
  };

  const filteredJobs = jobs.filter((job) => {
    if (filterMode === "all") return true;
    if (filterMode === "bachelor") {
      return BACHELOR_FILTER.includes(job.education as any);
    }
    if (filterMode === "associate") {
      return ASSOCIATE_FILTER.includes(job.education as any);
    }
    return true;
  });

  const viewLabel = filterMode === "bachelor" 
    ? "本科生视角" 
    : filterMode === "associate" 
    ? "专科生视角" 
    : "全部";

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-400 via-pink-400 to-purple-400 bg-clip-text text-transparent">
          随机探索
        </h1>
        <p className="mt-3 text-white/60 max-w-xl mx-auto">
          打破算法茧房，随机发现好工作。每次刷新都会展示 20 个不同公司的随机职位。
        </p>
        
        {/* 学历视角切换 */}
        <div className="mt-4 flex justify-center">
          <div className="inline-flex items-center gap-1 bg-white/[0.05] border border-white/[0.1] rounded-xl p-1">
            <FilterButton
              active={filterMode === "all"}
              onClick={() => handleFilterChange("all")}
              label="全部"
            />
            <FilterButton
              active={filterMode === "bachelor"}
              onClick={() => handleFilterChange("bachelor")}
              label="本科生专属"
              activeColor="from-indigo-500/20 to-purple-500/20"
            />
            <FilterButton
              active={filterMode === "associate"}
              onClick={() => handleFilterChange("associate")}
              label="专科生专属"
              activeColor="from-emerald-500/20 to-teal-500/20"
            />
          </div>
        </div>
        
        <p className="mt-2 text-sm text-white/40">
          当前: {viewLabel} · 显示 {filteredJobs.length} 个职位
        </p>
        
        <div className="mt-4">
          <button
            onClick={handleRefresh}
            disabled={loading}
            className="inline-flex items-center gap-2 px-6 py-3 text-sm font-medium text-white bg-gradient-to-r from-purple-500/20 to-pink-500/20 border border-purple-400/30 rounded-xl hover:from-purple-500/30 hover:to-pink-500/30 transition-all disabled:opacity-50"
          >
            <svg
              className={`w-5 h-5 ${loading ? "animate-spin" : ""}`}
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
            {loading ? "加载中..." : "换一批"}
          </button>
        </div>
      </div>

      {filteredJobs.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredJobs.map((job) => (
            <JobCard key={job.id} job={job} />
          ))}
        </div>
      ) : (
        <div className="glass-card p-12 text-center">
          <p className="text-white/50">
            {filterMode === "all" 
              ? "暂无数据，先去添加一些职位吧" 
              : `当前${viewLabel}暂无数据，试试切换视角`}
          </p>
          {filterMode !== "all" && (
            <button
              onClick={() => handleFilterChange("all")}
              className="text-purple-400 text-sm mt-2 inline-block hover:text-purple-300 transition-colors"
            >
              查看全部 →
            </button>
          )}
        </div>
      )}
    </main>
  );
}

function FilterButton({
  active,
  onClick,
  label,
  activeColor = "from-purple-500/20 to-pink-500/20",
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  activeColor?: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`
        relative px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-300
        ${active
          ? `bg-gradient-to-r ${activeColor} text-white border border-white/[0.15] shadow-[0_0_15px_rgba(139,92,246,0.2)]`
          : "text-white/50 hover:text-white/70 hover:bg-white/[0.05]"
        }
      `}
    >
      {label}
    </button>
  );
}
