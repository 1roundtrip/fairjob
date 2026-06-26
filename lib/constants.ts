/**
 * 学历等级类型（对应数据库中存储为 String）
 */
export type EducationLevel =
  | "BACHELOR_AND_ABOVE"
  | "BACHELOR_ONLY"
  | "ASSOCIATE_AND_ABOVE"
  | "ASSOCIATE_ONLY"
  | "NO_REQUIREMENT"
  | "UNKNOWN";

/**
 * 学历视角类型（用于前端切换）
 */
export type EducationView = "BACHELOR" | "ASSOCIATE" | "ALL";

/**
 * 学历等级显示映射
 */
export const EDUCATION_LABELS: Record<string, string> = {
  BACHELOR_AND_ABOVE: "本科及以上",
  BACHELOR_ONLY: "仅本科",
  ASSOCIATE_AND_ABOVE: "专科及以上",
  ASSOCIATE_ONLY: "仅专科",
  NO_REQUIREMENT: "不限",
  UNKNOWN: "待确认",
};

/**
 * 学历视角显示映射
 */
export const EDUCATION_VIEW_LABELS: Record<string, string> = {
  BACHELOR: "本科生视角",
  ASSOCIATE: "专科生视角",
  ALL: "全部",
};

/**
 * 本科生视角标签
 */
export const BACHELOR_VIEW_LABEL = "本科生专属";
export const ASSOCIATE_VIEW_LABEL = "专科生专属";

// ==================== 时间相关常量 ====================

/**
 * 默认展示最近多少天的职位
 */
export const RECENT_DAYS = 30;

/**
 * 最大允许展示的天数
 */
export const MAX_RECENT_DAYS = 365;

/**
 * 时间范围快捷选项
 */
export const DATE_RANGE_OPTIONS = [
  { label: "最近3天", days: 3 },
  { label: "最近7天", days: 7 },
  { label: "最近30天", days: 30 },
  { label: "最近90天", days: 90 },
  { label: "全部", days: 0 },
] as const;

/**
 * 获取日期范围
 */
export function getDateRange(days: number): Date | null {
  if (days === 0) return null; // 全部
  const date = new Date();
  date.setDate(date.getDate() - days);
  date.setHours(0, 0, 0, 0);
  return date;
}

/**
 * 来源类型
 */
export type SourceType =
  | "OFFICIAL_PLATFORM"
  | "UNIVERSITY"
  | "VOCATIONAL"
  | "ENTERPRISE"
  | "RSS"
  | "SEARCH"
  | "OTHER";

/**
 * 所有来源类型选项
 */
export const ALL_SOURCE_TYPES: SourceType[] = [
  "OFFICIAL_PLATFORM",
  "UNIVERSITY",
  "VOCATIONAL",
  "ENTERPRISE",
  "RSS",
  "SEARCH",
  "OTHER",
];

/**
 * 来源类型显示映射
 */
export const SOURCE_TYPE_LABELS: Record<string, string> = {
  OFFICIAL_PLATFORM: "官方平台",
  UNIVERSITY: "普通高校就业网",
  VOCATIONAL: "高职院校就业网",
  ENTERPRISE: "企业官网",
  RSS: "RSS 源",
  SEARCH: "搜索发现",
  OTHER: "其他",
};

/**
 * 解析器类型
 */
export type ParserType = "RSS" | "UNIVERSAL" | "API" | "MANUAL";

/**
 * 所有解析器类型选项
 */
export const ALL_PARSER_TYPES: ParserType[] = [
  "RSS",
  "UNIVERSAL",
  "API",
  "MANUAL",
];

/**
 * 本科生专属筛选条件 (本科及以上 + 仅本科)
 */
export const BACHELOR_FILTER: EducationLevel[] = [
  "BACHELOR_AND_ABOVE",
  "BACHELOR_ONLY",
];

/**
 * 专科生专属筛选条件 (专科及以上 + 仅专科)
 */
export const ASSOCIATE_FILTER: EducationLevel[] = [
  "ASSOCIATE_AND_ABOVE",
  "ASSOCIATE_ONLY",
];

/**
 * 所有学历选项
 */
export const ALL_EDUCATION_OPTIONS: EducationLevel[] = [
  "BACHELOR_AND_ABOVE",
  "BACHELOR_ONLY",
  "ASSOCIATE_AND_ABOVE",
  "ASSOCIATE_ONLY",
  "NO_REQUIREMENT",
  "UNKNOWN",
];

/**
 * 获取学历视角对应的筛选条件
 */
export function getEducationFilter(view: EducationView): EducationLevel[] | null {
  switch (view) {
    case "BACHELOR":
      return BACHELOR_FILTER;
    case "ASSOCIATE":
      return ASSOCIATE_FILTER;
    case "ALL":
    default:
      return null;
  }
}
