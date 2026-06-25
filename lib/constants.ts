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
 * 学历等级颜色映射
 */
export const EDUCATION_COLORS: Record<string, string> = {
  BACHELOR_AND_ABOVE: "bg-blue-100 text-blue-800",
  BACHELOR_ONLY: "bg-indigo-100 text-indigo-800",
  ASSOCIATE_AND_ABOVE: "bg-green-100 text-green-800",
  ASSOCIATE_ONLY: "bg-emerald-100 text-emerald-800",
  NO_REQUIREMENT: "bg-gray-100 text-gray-800",
  UNKNOWN: "bg-yellow-100 text-yellow-800",
};

/**
 * 来源类型
 */
export type SourceType =
  | "OFFICIAL_PLATFORM"
  | "UNIVERSITY"
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
  UNIVERSITY: "高校就业网",
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
