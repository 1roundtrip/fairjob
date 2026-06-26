"use client";

import { useState } from "react";
import { formatDate } from "@/lib/utils";
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

export default function JobCard({ job, className = "" }: JobCardProps) {
  const displayDate = job.publishedAt || job.createdAt;
  const isSuspect = (job.failCount || 0) > 0;
  const [showWarning, setShowWarning] = useState(false);

  // 根据学历选择标签颜色
  const getEducationTagClass = () => {
    if (job.education.includes("BACHELOR")) return "tag-violet";
    if (job.education.includes("ASSOCIATE")) return "tag-emerald";
    if (job.education === "NO_REQUIREMENT") return "tag-amber";
    return "tag";
  };

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
    <div className={`card p-5 ${className}`}>
      <a
        href={job.sourceUrl}
        target="_blank"
        rel="noopener noreferrer"
        onClick={handleClick}
        className="block"
      >
        {/* 头部：标题 + 薪资 */}
        <div className="flex justify-between items-start gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-base font-semibold text-white truncate">
                {job.title}
              </h3>
              {isSuspect && (
                <span className="tag tag-amber shrink-0">⚠ 待验证</span>
              )}
            </div>
            <p className="mt-1 text-sm text-[var(--text-secondary)] truncate">
              {job.company}
            </p>
          </div>
          {job.salary && (
            <span className="shrink-0 px-3 py-1.5 bg-gradient-to-r from-[var(--amber)] to-[var(--coral)] text-white text-sm font-bold rounded-lg whitespace-nowrap">
              {job.salary}
            </span>
          )}
        </div>

        {/* 标签行 */}
        <div className="mt-3 flex flex-wrap items-center gap-2">
          {job.location && (
            <span className="tag">
              <svg className="w-3.5 h-3.5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              </svg>
              {job.location}
            </span>
          )}

          {job.jobType && (
            <span className="tag">{job.jobType}</span>
          )}

          <span className={getEducationTagClass()}>
            {job.education.replace(/_/g, "").replace("ANDABOVE", "及以上")}
          </span>

          {job.isMerged && job.mergeCount > 1 && (
            <span className="tag tag-sky">多来源</span>
          )}
        </div>

        {/* 底部 */}
        <div className="mt-4 flex items-center justify-between pt-3 border-t border-[var(--border-subtle)]">
          <div className="flex items-center gap-3 text-xs text-[var(--text-muted)]">
            <span className="flex items-center gap-1">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {job.sourceName || "未知"}
            </span>
            <span className="flex items-center gap-1">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {formatDate(displayDate)}
            </span>
          </div>
          
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
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            onClick={() => setShowWarning(false)}
          />
          <div className="relative card p-6 max-w-sm w-full !rounded-2xl">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[var(--amber)] to-[var(--coral)] flex items-center justify-center shrink-0">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white">链接可能已失效</h3>
                <p className="text-sm text-[var(--text-secondary)] mt-1">
                  该职位链接可能已过期，点击确认仍要访问原页面。
                </p>
              </div>
            </div>
            <div className="flex gap-3 mt-5">
              <button
                onClick={() => setShowWarning(false)}
                className="btn-secondary flex-1"
              >
                取消
              </button>
              <button
                onClick={proceedAnyway}
                className="btn-primary btn-amber flex-1"
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
