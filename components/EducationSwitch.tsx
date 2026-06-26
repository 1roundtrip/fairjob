"use client";

import { useEducationView } from "@/components/EducationContext";
import { cn } from "@/lib/utils";

export default function EducationSwitch() {
  const { view, setView, viewLabel } = useEducationView();

  return (
    <div className="flex items-center gap-1 bg-white/[0.05] border border-white/[0.1] rounded-xl p-1">
      <ViewButton
        active={view === "ALL"}
        onClick={() => setView("ALL")}
        label="全部"
      />
      <ViewButton
        active={view === "BACHELOR"}
        onClick={() => setView("BACHELOR")}
        label="本科生专属"
        activeColor="from-indigo-500/20 to-purple-500/20"
      />
      <ViewButton
        active={view === "ASSOCIATE"}
        onClick={() => setView("ASSOCIATE")}
        label="专科生专属"
        activeColor="from-emerald-500/20 to-teal-500/20"
      />
    </div>
  );
}

function ViewButton({
  active,
  onClick,
  label,
  activeColor = "from-purple-500/20 to-pink-500/20",
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  activeColor?: string;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "relative px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-300",
        active
          ? `bg-gradient-to-r ${activeColor} text-white border border-white/[0.15] shadow-[0_0_15px_rgba(139,92,246,0.2)]`
          : "text-white/50 hover:text-white/70 hover:bg-white/[0.05]"
      )}
    >
      {active && (
        <span className="absolute inset-0 rounded-lg bg-gradient-to-r from-indigo-500/10 via-purple-500/10 to-pink-500/10 animate-pulse" />
      )}
      <span className="relative">{label}</span>
    </button>
  );
}
