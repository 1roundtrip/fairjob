"use client";

import { useState, useEffect } from "react";
import Navbar from "@/components/Navbar";
import EducationBadge from "@/components/EducationBadge";
import { EDUCATION_LABELS } from "@/lib/constants";

interface Favorite {
  id: number;
  title: string;
  company: string;
  location: string | null;
  education: string;
  jobType: string | null;
  sourceUrl: string;
  sourceName: string | null;
  createdAt: string;
}

export default function FavoritesPage() {
  const [favorites, setFavorites] = useState<Favorite[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [filterEdu, setFilterEdu] = useState<string>("all");
  const [filterType, setFilterType] = useState<string>("all");

  useEffect(() => {
    fetchFavorites();
  }, []);

  const fetchFavorites = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/favorites");
      if (res.ok) {
        const data = await res.json();
        setFavorites(data);
      }
    } finally {
      setLoading(false);
    }
  };

  const filtered = favorites.filter((f) => {
    if (filterEdu !== "all" && f.education !== filterEdu) return false;
    if (filterType !== "all" && f.jobType !== filterType) return false;
    return true;
  });

  const eduOptions = Array.from(new Set(favorites.map((f) => f.education)));
  const typeOptions = Array.from(
    new Set(favorites.filter((f) => f.jobType).map((f) => f.jobType!))
  );

  const toggleSelect = (url: string) => {
    const next = new Set(selected);
    if (next.has(url)) {
      next.delete(url);
    } else {
      next.add(url);
    }
    setSelected(next);
  };

  const selectAll = () => {
    if (selected.size === filtered.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(filtered.map((f) => f.sourceUrl)));
    }
  };

  const removeSelected = async () => {
    if (selected.size === 0) return;
    if (!confirm(`确定删除选中的 ${selected.size} 条收藏？`)) return;

    for (const url of selected) {
      await fetch("/api/favorites/remove", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sourceUrl: url }),
      });
    }
    setSelected(new Set());
    fetchFavorites();
  };

  const exportToCSV = () => {
    const toExport =
      selected.size > 0
        ? favorites.filter((f) => selected.has(f.sourceUrl))
        : filtered;

    if (toExport.length === 0) {
      alert("没有可导出的数据");
      return;
    }

    const headers = [
      "公司",
      "岗位",
      "学历要求",
      "地点",
      "类型",
      "来源",
      "链接",
      "收藏时间",
    ];

    const rows = toExport.map((f) => [
      f.company,
      f.title,
      EDUCATION_LABELS[f.education as keyof typeof EDUCATION_LABELS] ||
        f.education,
      f.location || "",
      f.jobType || "",
      f.sourceName || "",
      f.sourceUrl,
      new Date(f.createdAt).toLocaleString("zh-CN"),
    ]);

    const csvContent =
      "\uFEFF" +
      [
        headers.join(","),
        ...rows.map((row) =>
          row
            .map((cell) => `"${String(cell).replace(/"/g, '""')}"`)
            .join(",")
        ),
      ].join("\n");

    const blob = new Blob([csvContent], {
      type: "text/csv;charset=utf-8;",
    });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute(
      "download",
      `fairjob收藏_${new Date().toLocaleDateString("zh-CN")}.csv`
    );
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">我的收藏</h1>
            <p className="text-sm text-gray-500 mt-1">
              共 {favorites.length} 条，可筛选后一键导出
            </p>
          </div>
          <div className="flex gap-2 flex-wrap">
            <button
              onClick={exportToCSV}
              className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 transition-colors"
            >
              📊 导出 Excel
              {selected.size > 0 && ` (${selected.size})`}
            </button>
            {selected.size > 0 && (
              <button
                onClick={removeSelected}
                className="px-4 py-2 bg-red-50 text-red-600 border border-red-200 rounded-lg text-sm font-medium hover:bg-red-100 transition-colors"
              >
                删除选中
              </button>
            )}
          </div>
        </div>

        {/* 筛选栏 */}
        <div className="bg-white rounded-xl border border-gray-200 p-4 mb-6 shadow-sm">
          <div className="flex flex-wrap gap-4 items-center">
            <div className="flex items-center gap-2">
              <label className="text-sm text-gray-600">学历：</label>
              <select
                value={filterEdu}
                onChange={(e) => setFilterEdu(e.target.value)}
                className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm"
              >
                <option value="all">全部</option>
                {eduOptions.map((edu) => (
                  <option key={edu} value={edu}>
                    {EDUCATION_LABELS[edu as keyof typeof EDUCATION_LABELS] ||
                      edu}
                  </option>
                ))}
              </select>
            </div>
            {typeOptions.length > 0 && (
              <div className="flex items-center gap-2">
                <label className="text-sm text-gray-600">类型：</label>
                <select
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value)}
                  className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm"
                >
                  <option value="all">全部</option>
                  {typeOptions.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </div>
            )}
            <div className="flex items-center gap-2 ml-auto">
              <input
                type="checkbox"
                checked={selected.size === filtered.length && filtered.length > 0}
                onChange={selectAll}
                className="rounded"
              />
              <span className="text-sm text-gray-600">
                全选 ({filtered.length})
              </span>
            </div>
          </div>
        </div>

        {/* 列表 */}
        {loading ? (
          <div className="py-16 text-center">
            <p className="text-gray-400">加载中...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-200 p-16 text-center">
            <p className="text-gray-400 mb-2">
              {favorites.length === 0 ? "还没有收藏任何职位" : "没有符合条件的收藏"}
            </p>
            {favorites.length === 0 && (
              <p className="text-sm text-gray-300">
                去首页逛逛，看到喜欢的职位点 ☆ 收藏吧
              </p>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((fav) => (
              <div
                key={fav.id}
                className="bg-white rounded-xl border border-gray-200 p-4 hover:border-gray-300 transition-colors"
              >
                <div className="flex items-start gap-3">
                  <input
                    type="checkbox"
                    checked={selected.has(fav.sourceUrl)}
                    onChange={() => toggleSelect(fav.sourceUrl)}
                    className="mt-1.5 rounded"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <a
                          href={fav.sourceUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-base font-medium text-gray-900 hover:text-blue-600"
                        >
                          {fav.title}
                        </a>
                        <p className="text-sm text-gray-600 mt-0.5">
                          {fav.company}
                        </p>
                      </div>
                      <button
                        onClick={async () => {
                          await fetch("/api/favorites/remove", {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({ sourceUrl: fav.sourceUrl }),
                          });
                          fetchFavorites();
                        }}
                        className="text-gray-300 hover:text-red-500 text-sm shrink-0"
                      >
                        ✕
                      </button>
                    </div>
                    <div className="flex items-center gap-2 mt-2 flex-wrap text-xs text-gray-500">
                      <EducationBadge
                        education={fav.education as any}
                        size="sm"
                      />
                      {fav.location && (
                        <>
                          <span>·</span>
                          <span>{fav.location}</span>
                        </>
                      )}
                      {fav.jobType && (
                        <>
                          <span>·</span>
                          <span>{fav.jobType}</span>
                        </>
                      )}
                      {fav.sourceName && (
                        <>
                          <span>·</span>
                          <span>来自 {fav.sourceName}</span>
                        </>
                      )}
                      <span>·</span>
                      <span>
                        {new Date(fav.createdAt).toLocaleDateString("zh-CN")} 收藏
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
