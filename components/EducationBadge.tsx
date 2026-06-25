import { EDUCATION_LABELS, EDUCATION_COLORS, type EducationLevel } from "@/lib/constants";
import { cn } from "@/lib/utils";

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
  const color = EDUCATION_COLORS[edu] || "bg-gray-100 text-gray-800";

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full font-medium",
        size === "sm" ? "px-2 py-0.5 text-xs" : "px-2.5 py-1 text-sm",
        color,
        className
      )}
    >
      {label}
    </span>
  );
}
