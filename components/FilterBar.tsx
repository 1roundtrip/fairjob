"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { EDUCATION_LABELS, ALL_EDUCATION_OPTIONS, type EducationLevel } from "@/lib/constants";
import { cn } from "@/lib/utils";

export default function FilterBar({ className }: { className?: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [keyword, setKeyword] = useState(searchParams.get("q") || "");
  const [location, setLocation] = useState(searchParams.get("loc") || "");
  const [showEduDropdown, setShowEduDropdown] = useState(false);

  // 从 URL 解析初始学历筛选
  const getInitialEducation = (): EducationLevel[] => {
    const mode = searchParams.get("mode");
    const eduParam = searchParams.get("edu");

    if (mode === "bachelor") {
      return ["BACHELOR_AND_ABOVE", "BACHELOR_ONLY"] as EducationLevel[];
    }
    if (mode === "associate") {
      return ["ASSOCIATE_AND_ABOVE", "ASSOCIATE_ONLY"] as EducationLevel[];
    }
    if (eduParam) {
      return eduParam
        .split(",")
        .filter((e) => ALL_EDUCATION_OPTIONS.includes(e as any)) as EducationLevel[];
    }
    return [...ALL_EDUCATION_OPTIONS];
  };

  const [selectedEdu, setSelectedEdu] = useState<EducationLevel[]>(getInitialEducation);

  // 同步 URL 变化
  useEffect(() => {
    setKeyword(searchParams.get("q") || "");
    setLocation(searchParams.get("loc") || "");
    setSelectedEdu(getInitialEducation());
  }, [searchParams]);

  const toggleEdu = (edu: EducationLevel) => {
    setSelectedEdu((prev) =>
      prev.includes(edu) ? prev.filter((e) => e !== edu) : [...prev, edu]
    );
  };

  const handleSearch = () => {
    const params = new URLSearchParams();
    if (keyword) params.set("q", keyword);
    if (location) params.set("loc", location);
    if (
      selectedEdu.length > 0 &&
      selectedEdu.length < ALL_EDUCATION_OPTIONS.length
    ) {
      params.set("edu", selectedEdu.join(","));
    }
    params.set("page", "1");
    router.push(`/?${params.toString()}`);
    setShowEduDropdown(false);
  };

  const selectedCount = selectedEdu.length;
  const allSelected = selectedCount === ALL_EDUCATION_OPTIONS.length;

  return (
    <div className={cn("bg-white rounded-xl border border-gray-200 p-4 shadow-sm", className)}>
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1 relative">
          <svg
            className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
          <input
            type="text"
            placeholder="搜索职位或公司..."
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        <div className="w-full sm:w-40">
          <input
            type="text"
            placeholder="城市"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        <div className="relative">
          <button
            onClick={() => setShowEduDropdown(!showEduDropdown)}
            className="w-full sm:w-auto px-4 py-2.5 border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 flex items-center justify-between gap-2"
          >
            <span>学历要求</span>
            <span
              className={cn(
                "px-1.5 py-0.5 rounded text-xs",
                allSelected
                  ? "bg-gray-100 text-gray-600"
                  : "bg-blue-100 text-blue-700"
              )}
            >
              {allSelected ? "全部" : `${selectedCount}项`}
            </span>
          </button>

          {showEduDropdown && (
            <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:justify-start sm:relative">
              {/* 遮罩层 */}
              <div
                className="fixed inset-0 bg-black/20 sm:hidden"
                onClick={() => setShowEduDropdown(false)}
              />
              {/* 下拉框 */}
              <div className="relative w-full sm:w-56 bg-white rounded-t-xl sm:rounded-lg border border-gray-200 shadow-lg overflow-hidden mb-safe">
                <div className="p-3 border-b border-gray-100 flex justify-between items-center">
                  <span className="text-sm font-medium text-gray-700">选择学历要求</span>
                  <button
                    onClick={() => setShowEduDropdown(false)}
                    className="p-1 text-gray-400 hover:text-gray-600 sm:hidden"
                  >
                    ✕
                  </button>
                </div>
                <div className="p-2 max-h-64 overflow-y-auto">
                  {ALL_EDUCATION_OPTIONS.map((edu) => (
                    <label
                      key={edu}
                      className="flex items-center gap-2 px-3 py-2 rounded-md hover:bg-gray-50 cursor-pointer text-sm"
                    >
                      <input
                        type="checkbox"
                        checked={selectedEdu.includes(edu)}
                        onChange={() => toggleEdu(edu)}
                        className="rounded text-blue-600 focus:ring-blue-500"
                      />
                      <span>{EDUCATION_LABELS[edu]}</span>
                    </label>
                  ))}
                </div>
                <div className="p-3 border-t border-gray-100 flex justify-end gap-2">
                  <button
                    onClick={() => setShowEduDropdown(false)}
                    className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg"
                  >
                    取消
                  </button>
                  <button
                    onClick={handleSearch}
                    className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    确定
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        <button
          onClick={handleSearch}
          className="px-5 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
        >
          搜索
        </button>
      </div>
    </div>
  );
}
