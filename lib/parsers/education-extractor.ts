import { type EducationLevel } from "@/lib/constants";

/**
 * 学历提取规则 - 关键词映射
 *
 * 优先级说明:
 * 1. 优先相信描述/要求中的完整句子（而非标题碎片）
 * 2. 若同时出现矛盾关键词，标记为 UNKNOWN
 * 3. 更具体的匹配优先 (如"仅限本科" > "本科及以上")
 */

// 本科及以上关键词组
const BACHELOR_AND_ABOVE_KEYWORDS = [
  "本科及以上",
  "本科以上",
  "全日制本科",
  "大学本科",
  "统招本科",
  "本科及以上学历",
  "本科以上学历",
  "本科学历及以上",
  "本科及",
  "学士学位",
  "学士及以上",
];

// 仅本科关键词组
const BACHELOR_ONLY_KEYWORDS = [
  "仅限本科",
  "只招本科",
  "只招收本科",
  "仅限本科生",
  "只招本科生",
  "仅本科",
  "限本科",
];

// 专科及以上关键词组
const ASSOCIATE_AND_ABOVE_KEYWORDS = [
  "专科及以上",
  "大专及以上",
  "大专以上",
  "专科以上",
  "高职高专及以上",
  "大专学历",
  "专科学历",
  "大专及以上学历",
  "专科及以上学历",
];

// 仅专科关键词组
const ASSOCIATE_ONLY_KEYWORDS = [
  "仅限专科",
  "只招大专",
  "只招专科",
  "高职高专",
  "仅限大专",
  "限大专",
  "限专科",
  "仅大专",
  "仅专科",
];

// 不限关键词组
const NO_REQUIREMENT_KEYWORDS = [
  "学历不限",
  "无学历要求",
  "学历不限专业不限",
  "不限学历",
  "学历要求不限",
  "学历无要求",
];

export interface EducationExtractResult {
  education: EducationLevel;
  matchedKeywords: string[];
  hasConflict: boolean;
  fromDescription: boolean; // 是否来自描述（比标题更可信）
}

/**
 * 从文本中提取学历要求
 * @param title 职位标题
 * @param description 职位描述/要求（可信度更高）
 * @returns 学历提取结果
 */
export function extractEducation(
  title: string,
  description?: string | null
): EducationExtractResult {
  const allText = [title, description || ""]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  const descText = (description || "").toLowerCase();
  const titleText = title.toLowerCase();

  const found = {
    BACHELOR_AND_ABOVE: [] as string[],
    BACHELOR_ONLY: [] as string[],
    ASSOCIATE_AND_ABOVE: [] as string[],
    ASSOCIATE_ONLY: [] as string[],
    NO_REQUIREMENT: [] as string[],
  };

  // 在描述中搜索（高优先级）
  for (const kw of BACHELOR_AND_ABOVE_KEYWORDS) {
    if (descText.includes(kw.toLowerCase())) found.BACHELOR_AND_ABOVE.push(kw);
  }
  for (const kw of BACHELOR_ONLY_KEYWORDS) {
    if (descText.includes(kw.toLowerCase())) found.BACHELOR_ONLY.push(kw);
  }
  for (const kw of ASSOCIATE_AND_ABOVE_KEYWORDS) {
    if (descText.includes(kw.toLowerCase())) found.ASSOCIATE_AND_ABOVE.push(kw);
  }
  for (const kw of ASSOCIATE_ONLY_KEYWORDS) {
    if (descText.includes(kw.toLowerCase())) found.ASSOCIATE_ONLY.push(kw);
  }
  for (const kw of NO_REQUIREMENT_KEYWORDS) {
    if (descText.includes(kw.toLowerCase())) found.NO_REQUIREMENT.push(kw);
  }

  // 如果描述中有匹配，优先使用描述结果
  const descMatchedCategories = (
    Object.keys(found) as (keyof typeof found)[]
  ).filter((k) => found[k].length > 0);

  if (descMatchedCategories.length > 0) {
    // 判断是否有冲突
    if (
      (found.BACHELOR_AND_ABOVE.length > 0 || found.BACHELOR_ONLY.length > 0) &&
      (found.ASSOCIATE_AND_ABOVE.length > 0 || found.ASSOCIATE_ONLY.length > 0)
    ) {
      // 本科和专科同时出现 -> 冲突
      return {
        education: "UNKNOWN" as EducationLevel,
        matchedKeywords: [
          ...found.BACHELOR_AND_ABOVE,
          ...found.BACHELOR_ONLY,
          ...found.ASSOCIATE_AND_ABOVE,
          ...found.ASSOCIATE_ONLY,
        ],
        hasConflict: true,
        fromDescription: true,
      };
    }

    // 仅本科优先于本科及以上
    if (found.BACHELOR_ONLY.length > 0) {
      return {
        education: "BACHELOR_ONLY" as EducationLevel,
        matchedKeywords: found.BACHELOR_ONLY,
        hasConflict: false,
        fromDescription: true,
      };
    }
    if (found.BACHELOR_AND_ABOVE.length > 0) {
      return {
        education: "BACHELOR_AND_ABOVE" as EducationLevel,
        matchedKeywords: found.BACHELOR_AND_ABOVE,
        hasConflict: false,
        fromDescription: true,
      };
    }

    // 仅专科优先于专科及以上
    if (found.ASSOCIATE_ONLY.length > 0) {
      return {
        education: "ASSOCIATE_ONLY" as EducationLevel,
        matchedKeywords: found.ASSOCIATE_ONLY,
        hasConflict: false,
        fromDescription: true,
      };
    }
    if (found.ASSOCIATE_AND_ABOVE.length > 0) {
      return {
        education: "ASSOCIATE_AND_ABOVE" as EducationLevel,
        matchedKeywords: found.ASSOCIATE_AND_ABOVE,
        hasConflict: false,
        fromDescription: true,
      };
    }

    if (found.NO_REQUIREMENT.length > 0) {
      return {
        education: "NO_REQUIREMENT" as EducationLevel,
        matchedKeywords: found.NO_REQUIREMENT,
        hasConflict: false,
        fromDescription: true,
      };
    }
  }

  // 描述中没找到，在标题中搜索
  const titleFound = {
    BACHELOR_AND_ABOVE: [] as string[],
    BACHELOR_ONLY: [] as string[],
    ASSOCIATE_AND_ABOVE: [] as string[],
    ASSOCIATE_ONLY: [] as string[],
    NO_REQUIREMENT: [] as string[],
  };

  for (const kw of BACHELOR_AND_ABOVE_KEYWORDS) {
    if (titleText.includes(kw.toLowerCase())) titleFound.BACHELOR_AND_ABOVE.push(kw);
  }
  for (const kw of BACHELOR_ONLY_KEYWORDS) {
    if (titleText.includes(kw.toLowerCase())) titleFound.BACHELOR_ONLY.push(kw);
  }
  for (const kw of ASSOCIATE_AND_ABOVE_KEYWORDS) {
    if (titleText.includes(kw.toLowerCase())) titleFound.ASSOCIATE_AND_ABOVE.push(kw);
  }
  for (const kw of ASSOCIATE_ONLY_KEYWORDS) {
    if (titleText.includes(kw.toLowerCase())) titleFound.ASSOCIATE_ONLY.push(kw);
  }
  for (const kw of NO_REQUIREMENT_KEYWORDS) {
    if (titleText.includes(kw.toLowerCase())) titleFound.NO_REQUIREMENT.push(kw);
  }

  const titleMatchedCategories = (
    Object.keys(titleFound) as (keyof typeof titleFound)[]
  ).filter((k) => titleFound[k].length > 0);

  if (titleMatchedCategories.length === 0) {
    return {
      education: "UNKNOWN" as EducationLevel,
      matchedKeywords: [],
      hasConflict: false,
      fromDescription: false,
    };
  }

  // 标题中冲突检测
  if (
    (titleFound.BACHELOR_AND_ABOVE.length > 0 || titleFound.BACHELOR_ONLY.length > 0) &&
    (titleFound.ASSOCIATE_AND_ABOVE.length > 0 || titleFound.ASSOCIATE_ONLY.length > 0)
  ) {
    return {
      education: "UNKNOWN" as EducationLevel,
      matchedKeywords: [
        ...titleFound.BACHELOR_AND_ABOVE,
        ...titleFound.BACHELOR_ONLY,
        ...titleFound.ASSOCIATE_AND_ABOVE,
        ...titleFound.ASSOCIATE_ONLY,
      ],
      hasConflict: true,
      fromDescription: false,
    };
  }

  if (titleFound.BACHELOR_ONLY.length > 0) {
    return {
      education: "BACHELOR_ONLY" as EducationLevel,
      matchedKeywords: titleFound.BACHELOR_ONLY,
      hasConflict: false,
      fromDescription: false,
    };
  }
  if (titleFound.BACHELOR_AND_ABOVE.length > 0) {
    return {
      education: "BACHELOR_AND_ABOVE" as EducationLevel,
      matchedKeywords: titleFound.BACHELOR_AND_ABOVE,
      hasConflict: false,
      fromDescription: false,
    };
  }
  if (titleFound.ASSOCIATE_ONLY.length > 0) {
    return {
      education: "ASSOCIATE_ONLY" as EducationLevel,
      matchedKeywords: titleFound.ASSOCIATE_ONLY,
      hasConflict: false,
      fromDescription: false,
    };
  }
  if (titleFound.ASSOCIATE_AND_ABOVE.length > 0) {
    return {
      education: "ASSOCIATE_AND_ABOVE" as EducationLevel,
      matchedKeywords: titleFound.ASSOCIATE_AND_ABOVE,
      hasConflict: false,
      fromDescription: false,
    };
  }
  if (titleFound.NO_REQUIREMENT.length > 0) {
    return {
      education: "NO_REQUIREMENT" as EducationLevel,
      matchedKeywords: titleFound.NO_REQUIREMENT,
      hasConflict: false,
      fromDescription: false,
    };
  }

  return {
    education: "UNKNOWN" as EducationLevel,
    matchedKeywords: [],
    hasConflict: false,
    fromDescription: false,
  };
}
