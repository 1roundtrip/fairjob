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
    <div className="min-h-screen relative">
      <div className="relative z-10">
        <Navbar />

        <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div>
              <h1 className="text-2xl font-bold text-white">我的收藏</h1>
              <p className="text-sm text-white/60 mt-1">
                共 {favorites.length} 条，可筛选后一键导出
              </p>
            </div>
            <div className="flex gap-2 flex-wrap">
              <button
                onClick={exportToCSV}
                className="btn-primary"
              >
                📊 导出 Excel
                {selected.size > 0 && ` (${selected.size})`}
              </button>
              {selected.size > 0 && (
                <button
                  onClick={removeSelected}
                  className="px-5 py-2.5 bg-red-500/15 text-red-300 border border-red-400/30 rounded-xl text-sm font-medium hover:bg-red-500/25 transition-all duration-300"
                >
                  删除选中
                </button>
              )}
            </div>
          </div>

          {/* 筛选栏 */}
          <div className="glass-card p-4 mb-6">
            <div className="flex flex-wrap gap-4 items-center">
              <div className="flex items-center gap-2">
                <label className="text-sm text-white/60">学历：</label>
                <select
                  value={filterEdu}
                  onChange={(e) => setFilterEdu(e.target.value)}
                  className="px-3 py-1.5 bg-white/[0.05] border border-white/[0.1] rounded-lg text-sm text-white focus:outline-none focus:border-white/20 transition-colors"
                >
                  <option value="all" className="bg-slate-900">全部</option>
                  {eduOptions.map((edu) => (
                    <option key={edu} value={edu} className="bg-slate-900">
                      {EDUCATION_LABELS[edu as keyof typeof EDUCATION_LABELS] ||
                        edu}
                    </option>
                  ))}
                </select>
              </div>
              {typeOptions.length > 0 && (
                <div className="flex items-center gap-2">
                  <label className="text-sm text-white/60">类型：</label>
                  <select
                    value={filterType}
                    onChange={(e) => setFilterType(e.target.value)}
                    className="px-3 py-1.5 bg-white/[0.05] border border-white/[0.1] rounded-lg text-sm text-white focus:outline-none focus:border-white/20 transition-colors"
                  >
                    <option value="all" className="bg-slate-900">全部</option>
                    {typeOptions.map((t) => (
                      <option key={t} value={t} className="bg-slate-900">
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
                  className="w-4 h-4 rounded border-white/20 bg-white/[0.05] text-indigo-500 focus:ring-indigo-500/50 focus:ring-offset-0 cursor-pointer"
                />
                <span className="text-sm text-white/60">
                  全选 ({filtered.length})
                </span>
              </div>
            </div>
          </div>

          {/* 列表 */}
          {loading ? (
            <div className="py-16 text-center">
              <p className="text-white/40">加载中...</p>
            </div>
          ) : filtered.length === 0 ? (
            <div className="glass-card p-16 text-center">
              <p className="text-white/60 mb-2">
                {favorites.length === 0 ? "还没有收藏任何职位" : "没有符合条件的收藏"}
              </p>
              {favorites.length === 0 && (
                <p className="text-sm text-white/40">
                  去首页逛逛，看到喜欢的职位点 ☆ 收藏吧
                </p>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              {filtered.map((fav) => (
                <div
                  key={fav.id}
                  className="glass-card glass-card-hover p-4"
                >
                  <div className="flex items-start gap-3">
                    <input
                      type="checkbox"
                      checked={selected.has(fav.sourceUrl)}
                      onChange={() => toggleSelect(fav.sourceUrl)}
                      className="mt-1.5 w-4 h-4 rounded border-white/20 bg-white/[0.05] text-indigo-500 focus:ring-indigo-500/50 focus:ring-offset-0 cursor-pointer"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <a
                            href={fav.sourceUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-base font-medium text-white hover:text-indigo-300 transition-colors"
                          >
                            {fav.title}
                          </a>
                          <p className="text-sm text-white/60 mt-0.5">
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
                          className="text-white/30 hover:text-red-400 text-sm shrink-0 transition-colors"
                        >
                          ✕
                        </button>
                      </div>
                      <div className="flex items-center gap-2 mt-2 flex-wrap text-xs text-white/50">
                        <EducationBadge
                          education={fav.education as any}
                          size="sm"
                        />
                        {fav.location && (
                          <>
                            <span className="text-white/30">·</span>
                            <span>{fav.location}</span>
                          </>
                        )}
                        {fav.jobType && (
                          <>
                            <span className="text-white/30">·</span>
                            <span>{fav.jobType}</span>
                          </>
                        )}
                        {fav.sourceName && (
                          <>
                            <span className="text-white/30">·</span>
                            <span>来自 {fav.sourceName}</span>
                          </>
                        )}
                        <span className="text-white/30">·</span>
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
    </div>
  );
}
