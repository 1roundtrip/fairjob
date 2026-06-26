"use client";

import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";

interface FavoriteData {
  sourceUrl: string;
  title: string;
  company: string;
  location?: string | null;
  education: string;
  jobType?: string | null;
  sourceName?: string | null;
  jobId?: number;
  createdAt: string;
}

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

const STORAGE_KEY = "fairjob_favs_full";

function getFavorites(): FavoriteData[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

function saveFavorites(favs: FavoriteData[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(favs));
    window.dispatchEvent(new Event("favorites-updated"));
  } catch {}
}

export function useFavorites() {
  const [favorites, setFavorites] = useState<FavoriteData[]>([]);

  useEffect(() => {
    setFavorites(getFavorites());
    const handler = () => setFavorites(getFavorites());
    window.addEventListener("favorites-updated", handler);
    window.addEventListener("storage", handler);
    return () => {
      window.removeEventListener("favorites-updated", handler);
      window.removeEventListener("storage", handler);
    };
  }, []);

  const isFavorited = (url: string) => favorites.some((f) => f.sourceUrl === url);

  const toggleFavorite = (data: Omit<FavoriteData, "createdAt">) => {
    const favs = getFavorites();
    const idx = favs.findIndex((f) => f.sourceUrl === data.sourceUrl);
    if (idx >= 0) {
      favs.splice(idx, 1);
    } else {
      favs.unshift({ ...data, createdAt: new Date().toISOString() });
    }
    saveFavorites(favs);
  };

  const removeFavorites = (urls: string[]) => {
    const favs = getFavorites().filter((f) => !urls.includes(f.sourceUrl));
    saveFavorites(favs);
  };

  return { favorites, isFavorited, toggleFavorite, removeFavorites };
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
  const [favorited, setFavorited] = useState(false);

  useEffect(() => {
    const update = () => setFavorited(getFavorites().some((f) => f.sourceUrl === sourceUrl));
    update();
    window.addEventListener("favorites-updated", update);
    window.addEventListener("storage", update);
    return () => {
      window.removeEventListener("favorites-updated", update);
      window.removeEventListener("storage", update);
    };
  }, [sourceUrl]);

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const favs = getFavorites();
    const exists = favs.some((f) => f.sourceUrl === sourceUrl);
    if (exists) {
      saveFavorites(favs.filter((f) => f.sourceUrl !== sourceUrl));
    } else {
      favs.unshift({
        sourceUrl,
        title,
        company,
        location,
        education,
        jobType,
        sourceName,
        jobId,
        createdAt: new Date().toISOString(),
      });
      saveFavorites(favs);
    }
  };

  if (compact) {
    return (
      <button
        onClick={handleClick}
        className={cn(
          "p-1.5 rounded-full transition-colors",
          favorited
            ? "text-amber-400 hover:bg-amber-500/10"
            : "text-gray-500 hover:text-amber-400 hover:bg-amber-500/10",
          className
        )}
        title={favorited ? "取消收藏" : "收藏"}
      >
        <svg
          className="w-5 h-5"
          fill={favorited ? "currentColor" : "none"}
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
      onClick={handleClick}
      className={cn(
        "px-3 py-1.5 rounded-lg text-sm font-medium transition-colors",
        favorited
          ? "bg-amber-500/20 text-amber-300 hover:bg-amber-500/30 border border-amber-400/20"
          : "bg-white/[0.06] text-gray-300 hover:bg-white/[0.1] border border-white/[0.08]",
        className
      )}
    >
      {favorited ? "★ 已收藏" : "☆ 收藏"}
    </button>
  );
}
