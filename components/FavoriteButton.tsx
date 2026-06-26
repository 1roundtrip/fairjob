"use client";

import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";

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
  className?: string;
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
  className,
}: FavoriteButtonProps) {
  const [isFavorited, setIsFavorited] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem("fairjob_favs");
      if (stored) {
        const favs: string[] = JSON.parse(stored);
        setIsFavorited(favs.includes(sourceUrl));
      }
    } catch {}
  }, [sourceUrl]);

  const updateLocalFavs = (add: boolean) => {
    try {
      const stored = localStorage.getItem("fairjob_favs");
      let favs: string[] = stored ? JSON.parse(stored) : [];
      if (add && !favs.includes(sourceUrl)) favs.push(sourceUrl);
      if (!add) favs = favs.filter((u) => u !== sourceUrl);
      localStorage.setItem("fairjob_favs", JSON.stringify(favs));
    } catch {}
  };

  const toggleFavorite = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (loading) return;

    setLoading(true);
    try {
      const endpoint = isFavorited ? "/api/favorites/remove" : "/api/favorites/add";
      const body = isFavorited
        ? { sourceUrl }
        : { jobId, title, company, location, education, jobType, sourceUrl, sourceName };

      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (res.ok) {
        setIsFavorited(!isFavorited);
        updateLocalFavs(!isFavorited);
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
        className={cn(
          "p-1.5 rounded-full transition-colors",
          isFavorited
            ? "text-amber-400 hover:bg-amber-500/10"
            : "text-gray-500 hover:text-amber-400 hover:bg-amber-500/10",
          className
        )}
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
      className={cn(
        "px-3 py-1.5 rounded-lg text-sm font-medium transition-colors",
        isFavorited
          ? "bg-amber-500/20 text-amber-300 hover:bg-amber-500/30 border border-amber-400/20"
          : "bg-white/[0.06] text-gray-300 hover:bg-white/[0.1] border border-white/[0.08]",
        className
      )}
    >
      {isFavorited ? "★ 已收藏" : "☆ 收藏"}
    </button>
  );
}
