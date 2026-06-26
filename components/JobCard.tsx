import { formatDate, cn } from "@/lib/utils";
import type { EducationLevel } from "@/lib/constants";
import EducationBadge from "./EducationBadge";
import FavoriteButton from "./FavoriteButton";

const DARK_EDUCATION_COLORS: Record<string, string> = {
  BACHELOR_AND_ABOVE: "!bg-blue-500/15 !text-blue-300 !border !border-blue-400/20",
  BACHELOR_ONLY: "!bg-indigo-500/15 !text-indigo-300 !border !border-indigo-400/20",
  ASSOCIATE_AND_ABOVE: "!bg-green-500/15 !text-green-300 !border !border-green-400/20",
  ASSOCIATE_ONLY: "!bg-emerald-500/15 !text-emerald-300 !border !border-emerald-400/20",
  NO_REQUIREMENT: "!bg-gray-500/15 !text-gray-300 !border !border-gray-400/20",
  UNKNOWN: "!bg-yellow-500/15 !text-yellow-300 !border !border-yellow-400/20",
};

interface JobCardProps {
  job: {
    id: number;
    title: string;
    company: string;
    location: string | null;
    salary: string | null;
    education: any;
    jobType: string | null;
    publishedAt: Date | string | null;
    sourceName: string | null;
    sourceUrl: string;
    isMerged: boolean;
    mergeCount: number;
    createdAt: Date | string;
  };
  className?: string;
}

export default function JobCard({ job, className }: JobCardProps) {
  const displayDate = job.publishedAt || job.createdAt;

  return (
    <a
      href={job.sourceUrl}
      target="_blank"
      rel="noopener noreferrer"
      className={cn(
        "block p-5 bg-white/[0.03] backdrop-blur-xl border border-white/[0.08] rounded-2xl hover:border-white/[0.2] hover:shadow-[0_0_30px_rgba(139,92,246,0.15)] hover:-translate-y-0.5 transition-all duration-300 group",
        className
      )}
    >
      <div className="flex justify-between items-start gap-4">
        <div className="flex-1 min-w-0">
          <h3 className="text-base font-semibold text-white group-hover:text-purple-300 transition-colors truncate">
          {job.title}
        </h3>
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

        <EducationBadge
          education={job.education}
          className={DARK_EDUCATION_COLORS[job.education as EducationLevel] || DARK_EDUCATION_COLORS.UNKNOWN}
        />

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
        <span>
          来自 {job.sourceName || "未知来源"}
        </span>
        <span>{formatDate(displayDate)}</span>
      </div>

      <div className="mt-3 flex items-center justify-between border-t border-white/[0.06] pt-3">
        <span className="text-xs text-gray-500 group-hover:text-gray-400 transition-colors">
          点击跳转至原始页面 →
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
          variant="dark"
        />
      </div>
    </a>
  );
}
