"use client";

import Link from "next/link";

type ViewMode = "ALL" | "BACHELOR" | "ASSOCIATE";

interface EducationSwitchProps {
  currentView?: ViewMode;
}

const views = [
  { key: "ALL" as ViewMode, label: "全部", color: "from-[var(--violet)] to-[var(--sky)]" },
  { key: "BACHELOR" as ViewMode, label: "本科生专属", color: "from-[var(--violet)] to-[var(--rose)]" },
  { key: "ASSOCIATE" as ViewMode, label: "专科生专属", color: "from-[var(--emerald)] to-[var(--sky)]" },
];

export default function EducationSwitch({ currentView = "ALL" }: EducationSwitchProps) {
  return (
    <div className="inline-flex items-center gap-1 bg-[var(--bg-tertiary)] border border-[var(--border-default)] rounded-xl p-1">
      {views.map((view) => (
        <button
          key={view.key}
          onClick={() => {
            const params = new URLSearchParams(window.location.search);
            if (view.key === "ALL") {
              params.delete("mode");
            } else {
              params.set("mode", view.key.toLowerCase());
            }
            window.location.href = `/?${params.toString()}`;
          }}
          className={`
            relative px-4 py-2 rounded-lg text-xs font-semibold transition-all duration-300
            ${currentView === view.key
              ? `bg-gradient-to-r ${view.color} text-white shadow-lg`
              : "text-[var(--text-secondary)] hover:text-white hover:bg-[var(--bg-card)]"
            }
          `}
        >
          {currentView === view.key && (
            <span className="absolute inset-0 rounded-lg animate-pulse opacity-30 bg-white" />
          )}
          <span className="relative">{view.label}</span>
        </button>
      ))}
    </div>
  );
}
