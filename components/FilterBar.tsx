"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { EDUCATION_LABELS, ALL_EDUCATION_OPTIONS, type EducationLevel } from "@/lib/constants";
import { CHINA_CITIES, POPULAR_CITIES } from "@/lib/cities";
import { cn } from "@/lib/utils";

export default function FilterBar({ className }: { className?: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [keyword, setKeyword] = useState(searchParams.get("q") || "");
  const [location, setLocation] = useState(searchParams.get("loc") || "");
  const [showEduDropdown, setShowEduDropdown] = useState(false);
  const [showCityDropdown, setShowCityDropdown] = useState(false);
  const [selectedProvince, setSelectedProvince] = useState<string>("");
  const cityDropdownRef = useRef<HTMLDivElement>(null);

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

  const selectCity = (city: string) => {
    setLocation(city);
    setShowCityDropdown(false);
    const params = new URLSearchParams(searchParams.toString());
    if (city) {
      params.set("loc", city);
    } else {
      params.delete("loc");
    }
    params.set("page", "1");
    router.push(`/?${params.toString()}`);
  };

  const selectProvince = (province: string) => {
    setSelectedProvince(province);
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

        <div className="relative w-full sm:w-44">
          <div className="flex">
            <input
              type="text"
              placeholder="城市"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent pr-10"
            />
            <button
              type="button"
              onClick={() => setShowCityDropdown(!showCityDropdown)}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
          </div>

          {showCityDropdown && (
            <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-start sm:justify-start sm:relative">
              <div
                className="fixed inset-0 bg-black/20 sm:hidden"
                onClick={() => setShowCityDropdown(false)}
              />
              <div className="relative w-full sm:w-80 bg-white rounded-t-xl sm:rounded-lg border border-gray-200 shadow-lg overflow-hidden mb-safe sm:mt-2" ref={cityDropdownRef}>
                <div className="p-3 border-b border-gray-100 flex justify-between items-center">
                  <span className="text-sm font-medium text-gray-700">选择城市</span>
                  <button
                    onClick={() => setShowCityDropdown(false)}
                    className="p-1 text-gray-400 hover:text-gray-600 sm:hidden"
                  >
                    ✕
                  </button>
                </div>

                <div className="p-3 border-b border-gray-100">
                  <p className="text-xs text-gray-500 mb-2">热门城市</p>
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => selectCity("")}
                      className={cn(
                        "px-3 py-1 rounded-full text-xs border transition-colors",
                        !location
                          ? "bg-blue-100 text-blue-700 border-blue-200"
                          : "bg-white text-gray-600 border-gray-200 hover:border-blue-300"
                      )}
                    >
                      全部
                    </button>
                    {POPULAR_CITIES.map((city) => (
                      <button
                        key={city}
                        onClick={() => selectCity(city)}
                        className={cn(
                          "px-3 py-1 rounded-full text-xs border transition-colors",
                          location === city
                            ? "bg-blue-100 text-blue-700 border-blue-200"
                            : "bg-white text-gray-600 border-gray-200 hover:border-blue-300"
                        )}
                      >
                        {city}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex">
                  <div className="w-24 border-r border-gray-100 max-h-64 overflow-y-auto bg-gray-50">
                    {CHINA_CITIES.map((item) => (
                      <button
                        key={item.province}
                        onClick={() => selectProvince(item.province)}
                        className={cn(
                          "w-full px-3 py-2 text-left text-xs transition-colors",
                          selectedProvince === item.province
                            ? "bg-white text-blue-600 font-medium"
                            : "text-gray-600 hover:bg-gray-100"
                        )}
                      >
                        {item.province}
                      </button>
                    ))}
                  </div>
                  <div className="flex-1 max-h-64 overflow-y-auto p-2">
                    {selectedProvince ? (
                      <div className="space-y-1">
                        <p className="text-xs text-gray-400 px-2 py-1">
                          {selectedProvince} · 按省份筛选
                        </p>
                        <button
                          onClick={() => selectCity(selectedProvince)}
                          className={cn(
                            "w-full px-3 py-2 text-left text-sm rounded-md transition-colors",
                            location === selectedProvince
                              ? "bg-blue-50 text-blue-700"
                              : "text-gray-700 hover:bg-gray-50"
                          )}
                        >
                          <span className="text-blue-500 mr-1">●</span>
                          全省 ({selectedProvince})
                        </button>
                        {CHINA_CITIES.find((p) => p.province === selectedProvince)?.cities.map(
                          (city) => (
                            <button
                              key={city}
                              onClick={() => selectCity(city)}
                              className={cn(
                                "w-full px-3 py-2 text-left text-sm rounded-md transition-colors",
                                location === city
                                  ? "bg-blue-50 text-blue-700"
                                  : "text-gray-700 hover:bg-gray-50"
                              )}
                            >
                              {city}
                            </button>
                          )
                        )}
                      </div>
                    ) : (
                      <p className="text-xs text-gray-400 text-center py-8">
                        请选择省份
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
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
