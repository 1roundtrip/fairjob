"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import {
  type EducationView,
  BACHELOR_VIEW_LABEL,
  ASSOCIATE_VIEW_LABEL,
} from "@/lib/constants";

const STORAGE_KEY = "fairjob_education_view";

interface EducationContextType {
  view: EducationView;
  setView: (view: EducationView) => void;
  viewLabel: string;
}

const EducationContext = createContext<EducationContextType | undefined>(undefined);

export function EducationProvider({ children }: { children: ReactNode }) {
  const [view, setViewState] = useState<EducationView>("ALL");
  const [mounted, setMounted] = useState(false);

  // 从 localStorage 读取保存的视角
  useEffect(() => {
    setMounted(true);
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved && ["BACHELOR", "ASSOCIATE", "ALL"].includes(saved)) {
        setViewState(saved as EducationView);
      }
    } catch {
      // ignore
    }
  }, []);

  const setView = (newView: EducationView) => {
    setViewState(newView);
    try {
      localStorage.setItem(STORAGE_KEY, newView);
    } catch {
      // ignore
    }
  };

  const viewLabel =
    view === "BACHELOR"
      ? BACHELOR_VIEW_LABEL
      : view === "ASSOCIATE"
      ? ASSOCIATE_VIEW_LABEL
      : "全部";

  // 避免水合不匹配
  if (!mounted) {
    return <>{children}</>;
  }

  return (
    <EducationContext.Provider value={{ view, setView, viewLabel }}>
      {children}
    </EducationContext.Provider>
  );
}

export function useEducationView() {
  const context = useContext(EducationContext);
  if (context === undefined) {
    throw new Error("useEducationView must be used within an EducationProvider");
  }
  return context;
}
