import { EDUCATION_LABELS, type EducationLevel } from "@/lib/constants";
import { cn } from "@/lib/utils";

const GLASS_COLORS: Record<string, string> = {
  BACHELOR_AND_ABOVE:
    "bg-blue-500/10 border-blue-400/30 text-blue-200/90 backdrop-blur-md shadow-blue-500/20",
  BACHELOR_ONLY:
    "bg-purple-500/10 border-purple-400/30 text-purple-200/90 backdrop-blur-md shadow-purple-500/20",
  ASSOCIATE_AND_ABOVE:
    "bg-cyan-500/10 border-cyan-400/30 text-cyan-200/90 backdrop-blur-md shadow-cyan-500/20",
  ASSOCIATE_ONLY:
    "bg-emerald-500/10 border-emerald-400/30 text-emerald-200/90 backdrop-blur-md shadow-emerald-500/20",
  NO_REQUIREMENT:
    "bg-gray-500/10 border-gray-400/30 text-gray-200/90 backdrop-blur-md shadow-gray-500/20",
  UNKNOWN:
    "bg-amber-500/10 border-amber-400/30 text-amber-200/90 backdrop-blur-md shadow-amber-500/20",
};

interface EducationBadgeProps {
  education: EducationLevel | string;
  size?: "sm" | "md";
  className?: string;
}

export default function EducationBadge({
  education,
  size = "sm",
  className,
}: EducationBadgeProps) {
  const edu = education as EducationLevel;
  const label = EDUCATION_LABELS[edu] || education;
  const color =
    GLASS_COLORS[edu] ||
    "bg-gray-500/10 border-gray-400/30 text-gray-200/90 backdrop-blur-md shadow-gray-500/20";

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full font-medium border shadow-sm",
        size === "sm" ? "px-2 py-0.5 text-xs" : "px-2.5 py-1 text-sm",
        color,
        className
      )}
    >
      {label}
    </span>
  );
}
