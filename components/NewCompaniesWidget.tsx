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
    <div className="bg-gradient-to-r from-emerald-50 to-teal-50 rounded-xl border border-emerald-200 p-4 shadow-sm">
      <div className="flex items-center gap-2 mb-3">
        <svg
          className="w-5 h-5 text-emerald-600"
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
        <h3 className="font-semibold text-emerald-900 text-sm">
          本周新开校招的公司
        </h3>
        <span className="text-xs text-emerald-600 ml-auto">
          点击搜索该公司全部岗位
        </span>
      </div>
      <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
        {companies.map((company) => (
          <button
            key={company.companyName}
            onClick={() => searchCompany(company.companyName)}
            className="shrink-0 px-3 py-1.5 bg-white border border-emerald-200 rounded-full text-sm text-emerald-700 hover:bg-emerald-100 hover:border-emerald-300 transition-colors whitespace-nowrap"
          >
            {company.companyName}
            <span className="ml-1 text-xs text-emerald-500">
              · {company.jobCount}岗
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
