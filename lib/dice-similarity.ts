/**
 * Dice Coefficient 字符串相似度算法
 * 用于职位去重，比较 (公司 + 职位 + 地点) 的相似度
 *
 * Dice 系数 = 2 * |A ∩ B| / (|A| + |B|)
 * 其中 A、B 分别为两个字符串的 bigram 集合
 *
 * 阈值建议: 0.9 以上可认为是同一职位
 */

/**
 * 提取字符串的所有二元组 (bigram)
 */
function getBigrams(s: string): Set<string> {
  const bigrams = new Set<string>();
  const clean = s.toLowerCase().replace(/\s+/g, "");
  for (let i = 0; i < clean.length - 1; i++) {
    bigrams.add(clean.slice(i, i + 2));
  }
  return bigrams;
}

/**
 * 计算两个字符串的 Dice 相似度系数
 * @returns 0 ~ 1 之间的数值，1 表示完全相同
 */
export function diceCoefficient(s1: string, s2: string): number {
  if (!s1 || !s2) return 0;
  if (s1 === s2) return 1;

  const bigrams1 = getBigrams(s1);
  const bigrams2 = getBigrams(s2);

  if (bigrams1.size === 0 && bigrams2.size === 0) return 1;
  if (bigrams1.size === 0 || bigrams2.size === 0) return 0;

  let intersection = 0;
  for (const bg of bigrams1) {
    if (bigrams2.has(bg)) {
      intersection++;
    }
  }

  return (2 * intersection) / (bigrams1.size + bigrams2.size);
}

/**
 * 计算职位去重用的组合相似度
 * 综合考虑 公司名、职位名、地点
 * 权重: 公司 0.4 + 职位 0.4 + 地点 0.2
 */
export function jobSimilarity(
  company1: string,
  title1: string,
  location1: string | null,
  company2: string,
  title2: string,
  location2: string | null
): number {
  const companySim = diceCoefficient(company1 || "", company2 || "");
  const titleSim = diceCoefficient(title1 || "", title2 || "");
  const locationSim = diceCoefficient(location1 || "", location2 || "");

  return companySim * 0.4 + titleSim * 0.4 + locationSim * 0.2;
}

/**
 * 判断两个职位是否为同一职位 (去重)
 * 默认阈值 0.9
 */
export function isSameJob(
  company1: string,
  title1: string,
  location1: string | null,
  company2: string,
  title2: string,
  location2: string | null,
  threshold = 0.9
): boolean {
  return jobSimilarity(company1, title1, location1, company2, title2, location2) >= threshold;
}
