"use client";

import { useState } from "react";
import { formatDate, cn } from "@/lib/utils";
import EducationBadge from "./EducationBadge";
import FavoriteButton from "./FavoriteButton";

interface JobCardProps {
  job: {
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
  };
  className?: string;
}

export default function JobCard({ job, className }: JobCardProps) {
  const displayDate = job.publishedAt || job.createdAt;
  const isSuspect = (job.failCount || 0) > 0;
  const [showWarning, setShowWarning] = useState(false);

  const handleClick = (e: React.MouseEvent) => {
    if (isSuspect) {
      e.preventDefault();
      setShowWarning(true);
    }
  };

  const proceedAnyway = () => {
    setShowWarning(false);
    window.open(job.sourceUrl, "_blank", "noopener,noreferrer");
  };

  return (
    <div className={cn("relative", className)}>
      <a
        href={job.sourceUrl}
        target="_blank"
        rel="noopener noreferrer"
        onClick={handleClick}
        className={cn(
          "block p-5 bg-white/[0.03] backdrop-blur-xl border rounded-2xl hover:-translate-y-0.5 transition-all duration-300 group",
          isSuspect
            ? "border-amber-500/30 hover:border-amber-500/50 hover:shadow-[0_0_30px_rgba(245,158,11,0.1)]"
            : "border-white/[0.08] hover:border-white/[0.2] hover:shadow-[0_0_30px_rgba(139,92,246,0.15)]"
        )}
      >
        <div className="flex justify-between items-start gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="text-base font-semibold text-white group-hover:text-purple-300 transition-colors truncate">
                {job.title}
              </h3>
              {isSuspect && (
                <span
                  className="shrink-0 px-1.5 py-0.5 bg-amber-500/20 border border-amber-400/30 text-amber-300 rounded text-[10px] font-medium"
                  title="链接可能已失效"
                >
                  ⚠ 待验证
                </span>
              )}
            </div>
            <p className="mt-1 text-sm text-gray-400 truncate">{job.company}</p>
          </div>
          {job.salary && (
            <span className="shrink-0 px-2.5 py-1 bg-gradient-to-r from-purple-500/20 to-pink-500/20 border border-purple-400/30 text-purple-200 rounded-lg font-medium text-sm whitespace-nowrap">
              {job.salary}
            </span>
          )}
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-2 text-sm text-gray-400">
          {job.location && (
            <span className="flex items-center space-x-1">
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                />
              </svg>
              <span>{job.location}</span>
            </span>
          )}

          {job.jobType && (
            <span className="px-2 py-0.5 bg-white/[0.06] text-gray-300 border border-white/[0.08] rounded text-xs">
              {job.jobType}
            </span>
          )}

          <EducationBadge education={job.education} />

          {job.isMerged && job.mergeCount > 1 && (
            <span
              className="px-2 py-0.5 bg-purple-500/15 text-purple-300 border border-purple-400/20 rounded text-xs"
              title={`信息来自 ${job.mergeCount} 个来源`}
            >
              多来源
            </span>
          )}
        </div>

        <div className="mt-3 flex items-center justify-between text-xs text-gray-500">
          <span>来自 {job.sourceName || "未知来源"}</span>
          <span>{formatDate(displayDate)}</span>
        </div>

        <div className="mt-3 flex items-center justify-between border-t border-white/[0.06] pt-3">
          <span className={cn(
            "text-xs transition-colors",
            isSuspect
              ? "text-amber-400/70 group-hover:text-amber-300"
              : "text-gray-500 group-hover:text-gray-400"
          )}>
            {isSuspect ? "⚠ 链接可能已失效，点击确认 →" : "点击跳转至原始页面 →"}
          </span>
          <FavoriteButton
            jobId={job.id}
            title={job.title}
            company={job.company}
            location={job.location}
            education={job.education}
            jobType={job.jobType}
            sourceUrl={job.sourceUrl}
            sourceName={job.sourceName}
            compact
          />
        </div>
      </a>

      {/* 失效确认弹窗 */}
      {showWarning && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setShowWarning(false)}
          />
          <div className="relative glass-card p-6 max-w-sm w-full shadow-2xl border-amber-500/30">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-full bg-amber-500/20 flex items-center justify-center shrink-0">
                <svg
                  className="w-5 h-5 text-amber-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                  />
                </svg>
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-white">链接可能已失效</h3>
                <p className="text-sm text-white/60 mt-1">
                  系统检测到该职位链接可能已过期或失效（404）。
                  是否仍要尝试访问？
                </p>
              </div>
            </div>
            <div className="flex gap-2 mt-5">
              <button
                onClick={() => setShowWarning(false)}
                className="flex-1 px-4 py-2 bg-white/[0.06] text-white/70 border border-white/[0.1] rounded-xl text-sm hover:bg-white/[0.1] transition-colors"
              >
                取消
              </button>
              <button
                onClick={proceedAnyway}
                className="flex-1 px-4 py-2 bg-amber-500/20 text-amber-200 border border-amber-400/30 rounded-xl text-sm hover:bg-amber-500/30 transition-colors"
              >
                仍要访问
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
