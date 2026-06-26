import { type EducationLevel } from "@/lib/constants";

/**
 * 学历提取器 - 重写版
 * 
 * 严格区分"仅专科"和"专科及以上"
 * 增加对高职院校语境的特殊处理
 * 
 * 矛盾关键词优先级规则:
 * 1. 完整句子优先于碎片 (描述 > 标题)
 * 2. 更具体的限定优先 (如"仅限本科" > "本科及以上")
 * 3. 当出现矛盾时，优先相信描述中的明确限定词
 */

// ==================== 关键词定义 ====================

/**
 * 本科及以上 - 明确要求硕士/博士优先
 */
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
  "本科或以上",
  "大学本科及以上",
  "本科起点",
  "本科（学士）",
];

/**
 * 仅本科 - 明确排除硕士
 */
const BACHELOR_ONLY_KEYWORDS = [
  "仅限本科",
  "只招本科",
  "只招收本科",
  "仅限本科生",
  "只招本科生",
  "仅本科",
  "限本科",
  "本科优先",
  "本科毕业",
  "仅招收本科",
];

/**
 * 专科及以上 - 明确可以上升到本科
 */
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
  "大专或以上",
  "专科或以上",
  "职高/中专/大专",
  "中专及以上",
  "技校及以上",
  "高中/中专/大专",
  "中职及以上",
];

/**
 * 仅专科 - 明确限定在专科层次
 * 这是最难区分的类别，需要特殊处理
 */
const ASSOCIATE_ONLY_KEYWORDS = [
  "仅限专科",
  "只招大专",
  "只招专科",
  "仅限大专",
  "限大专",
  "限专科",
  "仅大专",
  "仅专科",
  "只招收大专",
  "只招收专科",
  "大专（高职）",
  "高职（大专）",
  "高等职业教育",
];

/**
 * 高职院校语境关键词
 * 当出现在职位描述中时，更可能是 ASSOCIATE_AND_ABOVE
 * 但需要结合其他关键词判断
 */
const VOCATIONAL_CONTEXT_KEYWORDS = [
  "职业技术学院",
  "职业学院",
  "高职院校",
  "高职学院",
  "高等职业",
  "应用技术大学",
  "专科学校",
  "大专院校",
  "2年制",
  "3年制大专",
];

/**
 * 不限学历
 */
const NO_REQUIREMENT_KEYWORDS = [
  "学历不限",
  "无学历要求",
  "学历不限专业不限",
  "不限学历",
  "学历要求不限",
  "学历无要求",
  "专业学历不限",
  "经验学历不限",
];

// ==================== 优先级定义 ====================

/**
 * 矛盾时的优先级
 * 优先级数字越小，优先级越高
 */
const PRIORITY_MAP: Record<string, number> = {
  "BACHELOR_ONLY": 1,           // 仅本科 - 最高优先级
  "BACHELOR_AND_ABOVE": 2,    // 本科及以上
  "ASSOCIATE_AND_ABOVE": 3,    // 专科及以上
  "ASSOCIATE_ONLY": 4,         // 仅专科
  "NO_REQUIREMENT": 5,          // 不限
  "UNKNOWN": 6,                // 未知
};

/**
 * 判断是否为"强限定词"（出现即确定）
 */
const STRONG_LIMITERS = [
  "仅", "只", "限",
];

/**
 * 判断关键词是否包含强限定
 */
function hasStrongLimiter(keyword: string): boolean {
  return STRONG_LIMITERS.some(limiter => keyword.includes(limiter));
}

// ==================== 提取结果类型 ====================

export interface EducationExtractResult {
  education: EducationLevel;
  matchedKeywords: string[];
  hasConflict: boolean;
  fromDescription: boolean;
  confidence: number; // 0-1，置信度
}

/**
 * 高级学历提取
 * @param title 职位标题
 * @param description 职位描述/要求
 * @param sourceType 数据源类型（VOCATIONAL 数据源倾向于 ASSOCIATE_AND_ABOVE）
 */
export function extractEducation(
  title: string,
  description?: string | null,
  sourceType?: string
): EducationExtractResult {
  // 标准化文本
  const titleNorm = normalizeText(title);
  const descNorm = normalizeText(description || "");
  const fullNorm = (titleNorm + " " + descNorm).trim();

  // 1. 首先检查是否有明确冲突
  const conflictCheck = checkForConflict(titleNorm, descNorm);
  if (conflictCheck.hasConflict) {
    return {
      ...conflictCheck,
      confidence: 0.3,
    };
  }

  // 2. 优先在描述中搜索
  const descResults = searchKeywords(descNorm, true);
  if (descResults.categories.length > 0) {
    const resolved = resolveConflict(descResults, true, sourceType);
    return {
      ...resolved,
      confidence: 0.9,
    };
  }

  // 3. 在标题中搜索
  const titleResults = searchKeywords(titleNorm, false);
  if (titleResults.categories.length > 0) {
    const resolved = resolveConflict(titleResults, false, sourceType);
    return {
      ...resolved,
      confidence: 0.7,
    };
  }

  // 4. 检查高职院校语境（辅助判断）
  const vocationalContext = checkVocationalContext(fullNorm);
  if (vocationalContext.hasContext && sourceType === "VOCATIONAL") {
    // 高职数据源默认给 ASSOCIATE_AND_ABOVE
    return {
      education: "ASSOCIATE_AND_ABOVE",
      matchedKeywords: [],
      hasConflict: false,
      fromDescription: false,
      confidence: 0.6,
    };
  }

  // 5. 无法判断
  return {
    education: "UNKNOWN",
    matchedKeywords: [],
    hasConflict: false,
    fromDescription: false,
    confidence: 0,
  };
}

/**
 * 标准化文本（统一大小写、去除多余空格）
 */
function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * 搜索关键词
 */
function searchKeywords(
  text: string,
  fromDescription: boolean
): {
  BACHELOR_AND_ABOVE: string[];
  BACHELOR_ONLY: string[];
  ASSOCIATE_AND_ABOVE: string[];
  ASSOCIATE_ONLY: string[];
  NO_REQUIREMENT: string[];
  categories: string[];
  allMatched: string[];
} {
  const results = {
    BACHELOR_AND_ABOVE: [] as string[],
    BACHELOR_ONLY: [] as string[],
    ASSOCIATE_AND_ABOVE: [] as string[],
    ASSOCIATE_ONLY: [] as string[],
    NO_REQUIREMENT: [] as string[],
  };

  // 搜索各类型关键词
  for (const kw of BACHELOR_AND_ABOVE_KEYWORDS) {
    if (text.includes(kw.toLowerCase())) {
      results.BACHELOR_AND_ABOVE.push(kw);
    }
  }
  for (const kw of BACHELOR_ONLY_KEYWORDS) {
    if (text.includes(kw.toLowerCase())) {
      results.BACHELOR_ONLY.push(kw);
    }
  }
  for (const kw of ASSOCIATE_AND_ABOVE_KEYWORDS) {
    if (text.includes(kw.toLowerCase())) {
      results.ASSOCIATE_AND_ABOVE.push(kw);
    }
  }
  for (const kw of ASSOCIATE_ONLY_KEYWORDS) {
    if (text.includes(kw.toLowerCase())) {
      results.ASSOCIATE_ONLY.push(kw);
    }
  }
  for (const kw of NO_REQUIREMENT_KEYWORDS) {
    if (text.includes(kw.toLowerCase())) {
      results.NO_REQUIREMENT.push(kw);
    }
  }

  const categories = (Object.keys(results) as Array<keyof typeof results>)
    .filter((k) => results[k].length > 0);
  const allMatched = Object.values(results).flat();

  return { ...results, categories, allMatched };
}

/**
 * 检查矛盾关键词
 */
function checkForConflict(
  titleNorm: string,
  descNorm: string
): EducationExtractResult {
  const titleResults = searchKeywords(titleNorm, false);
  const descResults = searchKeywords(descNorm, true);

  const bachelorCategories = ["BACHELOR_AND_ABOVE", "BACHELOR_ONLY"];
  const associateCategories = ["ASSOCIATE_AND_ABOVE", "ASSOCIATE_ONLY"];

  const hasBachelor = [...titleResults.categories, ...descResults.categories].some(
    (c) => bachelorCategories.includes(c)
  );
  const hasAssociate = [...titleResults.categories, ...descResults.categories].some(
    (c) => associateCategories.includes(c)
  );

  if (hasBachelor && hasAssociate) {
    return {
      education: "UNKNOWN",
      matchedKeywords: [...titleResults.allMatched, ...descResults.allMatched],
      hasConflict: true,
      fromDescription: descResults.categories.length > 0,
      confidence: 0,
    };
  }

  return {
    education: "UNKNOWN",
    matchedKeywords: [],
    hasConflict: false,
    fromDescription: false,
    confidence: 0,
  };
}

/**
 * 解析矛盾，返回最佳结果
 */
function resolveConflict(
  results: ReturnType<typeof searchKeywords>,
  fromDescription: boolean,
  sourceType?: string
): EducationExtractResult {
  const { categories } = results;

  // 如果只有一个类别，直接返回
  if (categories.length === 1) {
    const category = categories[0];
    return {
      education: category as EducationLevel,
      matchedKeywords: results[category as keyof typeof results],
      hasConflict: false,
      fromDescription,
      confidence: 1,
    };
  }

  // 多个类别时，按优先级选择
  // 找出优先级最高的类别
  let bestCategory = categories[0];
  let bestPriority = PRIORITY_MAP[bestCategory] || 99;

  for (const cat of categories) {
    const priority = PRIORITY_MAP[cat] || 99;
    if (priority < bestPriority) {
      bestPriority = priority;
      bestCategory = cat;
    }
  }

  // 检查是否有强限定词
  const allKeywords = categories.flatMap((c) => results[c as keyof typeof results]);
  const hasStrongLimit = allKeywords.some(hasStrongLimiter);

  // 如果有强限定词且不是最高优先级，升级到强限定词的优先级
  if (hasStrongLimit) {
    const strongKeywordCategories = allKeywords
      .filter(hasStrongLimiter)
      .map((kw): string | null => {
        if (BACHELOR_ONLY_KEYWORDS.includes(kw)) return "BACHELOR_ONLY";
        if (ASSOCIATE_ONLY_KEYWORDS.includes(kw)) return "ASSOCIATE_ONLY";
        if (BACHELOR_AND_ABOVE_KEYWORDS.includes(kw)) return "BACHELOR_AND_ABOVE";
        if (ASSOCIATE_AND_ABOVE_KEYWORDS.includes(kw)) return "ASSOCIATE_AND_ABOVE";
        return null;
      })
      .filter((cat): cat is string => cat !== null);

    if (strongKeywordCategories.length > 0) {
      bestCategory = strongKeywordCategories[0];
    }
  }

  return {
    education: bestCategory as EducationLevel,
    matchedKeywords: results[bestCategory as keyof typeof results],
    hasConflict: categories.length > 1,
    fromDescription,
    confidence: hasStrongLimit ? 0.95 : 0.85,
  };
}

/**
 * 检查高职院校语境
 */
function checkVocationalContext(
  text: string
): { hasContext: boolean; matchedKeywords: string[] } {
  const matched: string[] = [];
  for (const kw of VOCATIONAL_CONTEXT_KEYWORDS) {
    if (text.includes(kw.toLowerCase())) {
      matched.push(kw);
    }
  }
  return {
    hasContext: matched.length > 0,
    matchedKeywords: matched,
  };
}

/**
 * 兼容旧 API
 * @deprecated 使用 extractEducation 代替
 */
export function extractEducationLegacy(
  title: string,
  description?: string | null
): EducationExtractResult {
  return extractEducation(title, description);
}
