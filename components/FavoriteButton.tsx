"use client";

import { useState, useEffect } from "react";

interface FavoriteButtonProps {
  sourceUrl: string;
  title: string;
  company: string;
  location?: string | null;
  education: string;
  jobType?: string | null;
  sourceName?: string | null;
  jobId?: number;
  compact?: boolean;
}

export default function FavoriteButton({
  sourceUrl,
  title,
  company,
  location,
  education,
  jobType,
  sourceName,
  jobId,
  compact = false,
}: FavoriteButtonProps) {
  const [isFavorited, setIsFavorited] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem("fairjob_favs");
    if (stored) {
      try {
        const favs: string[] = JSON.parse(stored);
        setIsFavorited(favs.includes(sourceUrl));
      } catch {}
    }
  }, [sourceUrl]);

  const toggleFavorite = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (loading) return;

    setLoading(true);
    try {
      if (isFavorited) {
        const res = await fetch("/api/favorites/remove", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ sourceUrl }),
        });
        if (res.ok) {
          setIsFavorited(false);
          const stored = localStorage.getItem("fairjob_favs");
          if (stored) {
            const favs: string[] = JSON.parse(stored);
            localStorage.setItem(
              "fairjob_favs",
              JSON.stringify(favs.filter((u) => u !== sourceUrl))
            );
          }
        }
      } else {
        const res = await fetch("/api/favorites/add", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            jobId,
            title,
            company,
            location,
            education,
            jobType,
            sourceUrl,
            sourceName,
          }),
        });
        if (res.ok) {
          setIsFavorited(true);
          const stored = localStorage.getItem("fairjob_favs");
          let favs: string[] = [];
          if (stored) {
            try {
              favs = JSON.parse(stored);
            } catch {}
          }
          if (!favs.includes(sourceUrl)) {
            favs.push(sourceUrl);
            localStorage.setItem("fairjob_favs", JSON.stringify(favs));
          }
        }
      }
    } finally {
      setLoading(false);
    }
  };

  if (compact) {
    return (
      <button
        onClick={toggleFavorite}
        disabled={loading}
        className={`p-1.5 rounded-full transition-colors ${
          isFavorited
            ? "text-amber-500 hover:bg-amber-50"
            : "text-gray-300 hover:text-amber-500 hover:bg-amber-50"
        }`}
        title={isFavorited ? "取消收藏" : "收藏"}
      >
        <svg
          className="w-5 h-5"
          fill={isFavorited ? "currentColor" : "none"}
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"
          />
        </svg>
      </button>
    );
  }

  return (
    <button
      onClick={toggleFavorite}
      disabled={loading}
      className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
        isFavorited
          ? "bg-amber-100 text-amber-700 hover:bg-amber-200"
          : "bg-gray-100 text-gray-600 hover:bg-gray-200"
      }`}
    >
      {isFavorited ? "★ 已收藏" : "☆ 收藏"}
    </button>
  );
}
