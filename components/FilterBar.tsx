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
    <div className={cn("glass-card p-4", className)}>
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1 relative">
          <svg
            className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40"
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
            className="w-full pl-10 pr-4 py-2.5 bg-white/[0.05] border border-white/[0.1] rounded-xl text-sm text-white placeholder-white/40 focus:outline-none focus:border-indigo-400/50 focus:ring-2 focus:ring-indigo-500/20 transition-all"
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
              className="w-full px-4 py-2.5 bg-white/[0.05] border border-white/[0.1] rounded-xl text-sm text-white placeholder-white/40 focus:outline-none focus:border-indigo-400/50 focus:ring-2 focus:ring-indigo-500/20 transition-all pr-10"
            />
            <button
              type="button"
              onClick={() => setShowCityDropdown(!showCityDropdown)}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-white/40 hover:text-white/70 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
          </div>

          {showCityDropdown && (
            <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-start sm:justify-start sm:relative">
              <div
                className="fixed inset-0 bg-black/40 sm:hidden"
                onClick={() => setShowCityDropdown(false)}
              />
              <div className="relative w-full sm:w-80 glass-card backdrop-blur-xl rounded-t-2xl sm:rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.4)] overflow-hidden mb-safe sm:mt-2" ref={cityDropdownRef}>
                <div className="p-3 border-b border-white/[0.08] flex justify-between items-center">
                  <span className="text-sm font-medium text-white">选择城市</span>
                  <button
                    onClick={() => setShowCityDropdown(false)}
                    className="p-1 text-white/40 hover:text-white/70 sm:hidden transition-colors"
                  >
                    ✕
                  </button>
                </div>

                <div className="p-3 border-b border-white/[0.08]">
                  <p className="text-xs text-white/50 mb-2">热门城市</p>
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => selectCity("")}
                      className={cn(
                        "px-3 py-1 rounded-full text-xs border transition-all",
                        !location
                          ? "bg-indigo-500/30 text-indigo-200 border-indigo-400/40"
                          : "bg-white/[0.03] text-white/70 border-white/[0.1] hover:border-indigo-400/40 hover:text-white"
                      )}
                    >
                      全部
                    </button>
                    {POPULAR_CITIES.map((city) => (
                      <button
                        key={city}
                        onClick={() => selectCity(city)}
                        className={cn(
                          "px-3 py-1 rounded-full text-xs border transition-all",
                          location === city
                            ? "bg-indigo-500/30 text-indigo-200 border-indigo-400/40"
                            : "bg-white/[0.03] text-white/70 border-white/[0.1] hover:border-indigo-400/40 hover:text-white"
                        )}
                      >
                        {city}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex">
                  <div className="w-24 border-r border-white/[0.08] max-h-64 overflow-y-auto bg-white/[0.02]">
                    {CHINA_CITIES.map((item) => (
                      <button
                        key={item.province}
                        onClick={() => selectProvince(item.province)}
                        className={cn(
                          "w-full px-3 py-2 text-left text-xs transition-colors",
                          selectedProvince === item.province
                            ? "bg-white/[0.08] text-indigo-300 font-medium"
                            : "text-white/60 hover:bg-white/[0.05] hover:text-white"
                        )}
                      >
                        {item.province}
                      </button>
                    ))}
                  </div>
                  <div className="flex-1 max-h-64 overflow-y-auto p-2">
                    {selectedProvince ? (
                      <div className="space-y-1">
                        <p className="text-xs text-white/40 px-2 py-1">
                          {selectedProvince} · 按省份筛选
                        </p>
                        <button
                          onClick={() => selectCity(selectedProvince)}
                          className={cn(
                            "w-full px-3 py-2 text-left text-sm rounded-md transition-colors",
                            location === selectedProvince
                              ? "bg-indigo-500/20 text-indigo-200"
                              : "text-white/70 hover:bg-white/[0.05] hover:text-white"
                          )}
                        >
                          <span className="text-indigo-400 mr-1">●</span>
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
                                  ? "bg-indigo-500/20 text-indigo-200"
                                  : "text-white/70 hover:bg-white/[0.05] hover:text-white"
                              )}
                            >
                              {city}
                            </button>
                          )
                        )}
                      </div>
                    ) : (
                      <p className="text-xs text-white/40 text-center py-8">
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
            className="w-full sm:w-auto px-4 py-2.5 bg-white/[0.05] border border-white/[0.1] rounded-xl text-sm font-medium text-white/80 hover:bg-white/[0.08] hover:border-white/[0.15] flex items-center justify-between gap-2 transition-all"
          >
            <span>学历要求</span>
            <span
              className={cn(
                "px-1.5 py-0.5 rounded text-xs",
                allSelected
                  ? "bg-white/[0.1] text-white/60"
                  : "bg-indigo-500/30 text-indigo-200"
              )}
            >
              {allSelected ? "全部" : `${selectedCount}项`}
            </span>
          </button>

          {showEduDropdown && (
            <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:justify-start sm:relative">
              <div
                className="fixed inset-0 bg-black/40 sm:hidden"
                onClick={() => setShowEduDropdown(false)}
              />
              <div className="relative w-full sm:w-56 glass-card backdrop-blur-xl rounded-t-2xl sm:rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.4)] overflow-hidden mb-safe">
                <div className="p-3 border-b border-white/[0.08] flex justify-between items-center">
                  <span className="text-sm font-medium text-white">选择学历要求</span>
                  <button
                    onClick={() => setShowEduDropdown(false)}
                    className="p-1 text-white/40 hover:text-white/70 sm:hidden transition-colors"
                  >
                    ✕
                  </button>
                </div>
                <div className="p-2 max-h-64 overflow-y-auto">
                  {ALL_EDUCATION_OPTIONS.map((edu) => (
                    <label
                      key={edu}
                      className="flex items-center gap-2 px-3 py-2 rounded-md hover:bg-white/[0.05] cursor-pointer text-sm text-white/80 transition-colors"
                    >
                      <input
                        type="checkbox"
                        checked={selectedEdu.includes(edu)}
                        onChange={() => toggleEdu(edu)}
                        className="rounded border-white/20 bg-white/[0.05] text-indigo-500 focus:ring-indigo-500/30 focus:ring-offset-0"
                      />
                      <span>{EDUCATION_LABELS[edu]}</span>
                    </label>
                  ))}
                </div>
                <div className="p-3 border-t border-white/[0.08] flex justify-end gap-2">
                  <button
                    onClick={() => setShowEduDropdown(false)}
                    className="px-4 py-2 text-sm text-white/60 hover:bg-white/[0.08] hover:text-white/80 rounded-xl transition-all"
                  >
                    取消
                  </button>
                  <button
                    onClick={handleSearch}
                    className="btn-primary"
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
          className="btn-primary"
        >
          搜索
        </button>
      </div>
    </div>
  );
}
