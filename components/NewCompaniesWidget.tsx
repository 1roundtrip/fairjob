"use client";

import { useRouter } from "next/navigation";

interface NewCompaniesWidgetProps {
  companies: { companyName: string; jobCount: number }[];
}

export default function NewCompaniesWidget({
  companies,
}: NewCompaniesWidgetProps) {
  const router = useRouter();

  if (companies.length === 0) return null;

  const searchCompany = (company: string) => {
    router.push(`/?keyword=${encodeURIComponent(company)}`);
  };

  return (
    <div className="bg-white/[0.03] backdrop-blur-xl border border-white/[0.08] rounded-2xl p-4">
      <div className="flex items-center gap-2 mb-3">
        <svg
          className="w-5 h-5 text-emerald-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M13 10V3L4 14h7v7l9-11h-7z"
          />
        </svg>
        <h3 className="font-semibold text-emerald-400 text-sm">
          本周新开校招的公司
        </h3>
        <span className="text-xs text-white/50 ml-auto">
          点击搜索该公司全部岗位
        </span>
      </div>
      <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
        {companies.map((company) => (
          <button
            key={company.companyName}
            onClick={() => searchCompany(company.companyName)}
            className="shrink-0 px-3 py-1.5 bg-white/[0.05] border border-white/[0.1] rounded-full text-sm text-white/80 hover:bg-white/[0.1] hover:border-emerald-400/30 hover:text-emerald-400 hover:shadow-[0_0_12px_rgba(52,211,153,0.15)] transition-all whitespace-nowrap"
          >
            {company.companyName}
            <span className="ml-1 text-xs text-white/50">
              · {company.jobCount}岗
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
