"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { CHINA_CITIES } from "@/lib/cities";
import {
  BACHELOR_FILTER,
  ASSOCIATE_FILTER,
  EDUCATION_LABELS,
  DATE_RANGE_OPTIONS,
  RECENT_DAYS,
} from "@/lib/constants";

interface FilterBarProps {
  initialKeyword?: string;
  initialLocation?: string;
  initialEducation?: string;
  initialDays?: number;
}

export default function FilterBar({
  initialKeyword = "",
  initialLocation = "",
  initialEducation = "",
  initialDays = RECENT_DAYS,
}: FilterBarProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [keyword, setKeyword] = useState(initialKeyword);
  const [location, setLocation] = useState(initialLocation);
  const [education, setEducation] = useState(initialEducation);
  const [days, setDays] = useState(initialDays);
  const [showCityPicker, setShowCityPicker] = useState(false);

  useEffect(() => {
    setKeyword(searchParams.get("keyword") || "");
    setLocation(searchParams.get("location") || "");
    setEducation(searchParams.get("education") || "");
    setDays(parseInt(searchParams.get("days") || RECENT_DAYS.toString(), 10));
  }, [searchParams]);

  const handleSearch = () => {
    const params = new URLSearchParams();
    if (keyword) params.set("keyword", keyword);
    if (location) params.set("location", location);
    if (education) params.set("education", education);
    if (days !== RECENT_DAYS) params.set("days", days.toString());
    router.push(`/?${params.toString()}`);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") handleSearch();
  };

  const toggleEducation = (edu: string) => {
    if (education === edu) {
      setEducation("");
    } else {
      setEducation(edu);
    }
  };

  const getCurrentProvince = () => {
    if (!location) return null;
    return CHINA_CITIES.find((p) =>
      p.cities.some((c) => c === location)
    );
  };

  const selectCity = (cityName: string) => {
    setLocation(cityName);
    setShowCityPicker(false);
    const params = new URLSearchParams(searchParams);
    params.set("location", cityName);
    router.push(`/?${params.toString()}`);
  };

  return (
    <div className="card p-4 space-y-4">
      {/* 搜索框 */}
      <div className="flex gap-3">
        <div className="flex-1 relative">
          <svg
            className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--text-muted)]"
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
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="搜索职位、公司..."
            className="input pl-12"
          />
        </div>
        <button onClick={handleSearch} className="btn-primary px-6">
          搜索
        </button>
      </div>

      {/* 时间筛选 */}
      <div className="flex flex-wrap gap-2">
        <span className="text-xs text-[var(--text-muted)] self-center w-16">发布时间</span>
        <div className="flex flex-wrap gap-2">
          {DATE_RANGE_OPTIONS.map((option) => (
            <button
              key={option.days}
              onClick={() => {
                setDays(option.days);
                const params = new URLSearchParams(searchParams);
                if (option.days === 0) {
                  params.delete("days");
                } else {
                  params.set("days", option.days.toString());
                }
                router.push(`/?${params.toString()}`);
              }}
              className={`
                px-3 py-1.5 text-xs font-medium rounded-lg transition-all duration-300
                ${days === option.days
                  ? "bg-gradient-to-r from-[var(--violet)] to-[var(--sky)] text-white shadow-lg"
                  : "bg-[var(--bg-tertiary)] text-[var(--text-secondary)] hover:text-white border border-[var(--border-subtle)]"
                }
              `}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      {/* 城市选择 */}
      <div className="flex flex-wrap gap-2">
        <span className="text-xs text-[var(--text-muted)] self-center w-16">城市</span>
        <div className="relative">
          <button
            onClick={() => setShowCityPicker(!showCityPicker)}
            className={`
              px-3 py-1.5 text-xs font-medium rounded-lg transition-all duration-300 flex items-center gap-1
              ${location
                ? "bg-[var(--emerald)]/20 text-[var(--emerald)] border border-[var(--emerald)]/30"
                : "bg-[var(--bg-tertiary)] text-[var(--text-secondary)] border border-[var(--border-subtle)] hover:border-[var(--emerald)]/30"
              }
            `}
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            </svg>
            {location || "选择城市"}
            {location && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setLocation("");
                  const params = new URLSearchParams(searchParams);
                  params.delete("location");
                  router.push(`/?${params.toString()}`);
                }}
                className="ml-1 hover:text-white"
              >
                ×
              </button>
            )}
          </button>

          {showCityPicker && (
            <div className="absolute top-full left-0 mt-2 card p-4 w-80 max-h-80 overflow-y-auto z-50">
              <div className="grid grid-cols-2 gap-2">
                {CHINA_CITIES.map((province) => (
                  <div key={province.province}>
                    <p className="text-xs font-semibold text-[var(--text-muted)] mb-1">
                      {province.province}
                    </p>
                    <div className="flex flex-wrap gap-1">
                      {province.cities.slice(0, 6).map((city) => (
                        <button
                          key={city}
                          onClick={() => selectCity(city)}
                          className={`
                            px-2 py-0.5 text-xs rounded transition-all
                            ${location === city
                              ? "bg-[var(--emerald)] text-white"
                              : "bg-[var(--bg-tertiary)] text-[var(--text-secondary)] hover:bg-[var(--emerald)]/20 hover:text-[var(--emerald)]"
                            }
                          `}
                        >
                          {city}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 学历筛选 */}
      <div className="flex flex-wrap gap-2">
        <span className="text-xs text-[var(--text-muted)] self-center w-16">学历</span>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => toggleEducation("bachelor")}
            className={`
              px-3 py-1.5 text-xs font-medium rounded-lg transition-all duration-300
              ${education === "bachelor"
                ? "bg-gradient-to-r from-[var(--violet)] to-[var(--rose)] text-white shadow-lg"
                : "bg-[var(--bg-tertiary)] text-[var(--text-secondary)] border border-[var(--border-subtle)] hover:border-[var(--violet)]/30"
              }
            `}
          >
            本科及以上
          </button>
          <button
            onClick={() => toggleEducation("associate")}
            className={`
              px-3 py-1.5 text-xs font-medium rounded-lg transition-all duration-300
              ${education === "associate"
                ? "bg-gradient-to-r from-[var(--emerald)] to-[var(--sky)] text-white shadow-lg"
                : "bg-[var(--bg-tertiary)] text-[var(--text-secondary)] border border-[var(--border-subtle)] hover:border-[var(--emerald)]/30"
              }
            `}
          >
            专科及以上
          </button>
          <button
            onClick={() => toggleEducation("all")}
            className={`
              px-3 py-1.5 text-xs font-medium rounded-lg transition-all duration-300
              ${education === "all"
                ? "bg-gradient-to-r from-[var(--amber)] to-[var(--coral)] text-white shadow-lg"
                : "bg-[var(--bg-tertiary)] text-[var(--text-secondary)] border border-[var(--border-subtle)] hover:border-[var(--amber)]/30"
              }
            `}
          >
            不限学历
          </button>
        </div>
      </div>
    </div>
  );
}
