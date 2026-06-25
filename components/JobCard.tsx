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
        "block p-5 bg-white rounded-xl border border-gray-200 hover:border-blue-300 hover:shadow-md transition-all duration-200 group",
        className
      )}
    >
      <div className="flex justify-between items-start gap-4">
        <div className="flex-1 min-w-0">
          <h3 className="text-base font-semibold text-gray-900 group-hover:text-blue-600 transition-colors truncate">
          {job.title}
        </h3>
          <p className="mt-1 text-sm text-gray-600 truncate">{job.company}</p>
        </div>
        {job.salary && (
          <span className="shrink-0 px-2.5 py-1 bg-blue-50 text-blue-700 rounded-lg font-medium text-sm whitespace-nowrap">
            {job.salary}
          </span>
        )}
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2 text-sm text-gray-500">
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
          <span className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-xs">
            {job.jobType}
          </span>
        )}

        <EducationBadge education={job.education} />

        {job.isMerged && job.mergeCount > 1 && (
          <span
            className="px-2 py-0.5 bg-purple-50 text-purple-700 rounded text-xs"
            title={`信息来自 ${job.mergeCount} 个来源`}
          >
            多来源
          </span>
        )}
      </div>

      <div className="mt-3 flex items-center justify-between text-xs text-gray-400">
        <span>
          来自 {job.sourceName || "未知来源"}
        </span>
        <span>{formatDate(displayDate)}</span>
      </div>

      <div className="mt-3 flex items-center justify-between border-t border-gray-100 pt-3">
        <span className="text-xs text-gray-400">
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
        />
      </div>
    </a>
  );
}
