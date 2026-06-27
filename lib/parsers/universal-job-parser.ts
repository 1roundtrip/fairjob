import * as cheerio from "cheerio";
import { type EducationLevel, ALL_EDUCATION_OPTIONS } from "@/lib/constants";
import { extractEducation, type EducationExtractResult } from "./education-extractor";
import { extractPrimaryLocation, parseDate } from "./location-date-extractor";

/**
 * 通用职位解析器 - UniversalJobParser
 *
 * 不依赖固定 CSS 选择器，通过以下策略自动适配各种招聘页面:
 * 1. 文本密度分析 - 找到信息密集的区块
 * 2. 链接重复模式 - 职位列表通常有大量结构相似的链接
 * 3. 关键词定位 - "岗位"、"招聘"、"校招"、"实习"、"申请"等
 * 4. 结构启发式 - 查找 <ul>/<ol>/<table> 等列表容器
 *
 * 输出: 标准化的职位数据 + 置信度评分
 */

export interface ParsedJob {
  title: string;
  company: string;
  location: string | null;
  salary: string | null;
  description: string | null;
  requirements: string | null;
  education: EducationLevel;
  educationConfidence: number;
  sourceUrl: string;
  publishedAt: Date | null;
  jobType: string | null; // 校招/实习/社招
  confidence: number; // 0-1 总体置信度
  rawHtml?: string; // 原始 HTML 片段（供审核用）
}

export interface ParseOptions {
  sourceName?: string;
  sourceType?: string;
  baseUrl?: string; // 用于补全相对链接
  llmApiKey?: string; // OpenAI API Key (可选, 用于低置信度增强)
  llmModel?: string;
}

export interface ParseResult {
  jobs: ParsedJob[];
  totalCandidates: number;
  highConfidenceCount: number;
  lowConfidenceCount: number;
}

// 职位相关关键词（用于识别职位区块）
const JOB_KEYWORDS = [
  "招聘", "岗位", "职位", "校招", "春招", "秋招", "实习", "社招",
  "招聘信息", "招聘公告", "招聘简章", "人才招聘", "校园招聘",
  "就业信息", "招聘岗位", "招聘职位", "应届毕业生",
  "Job", "Jobs", "Career", "Recruitment", "Hiring",
];

// 职位条目中常出现的关键词
const JOB_ITEM_KEYWORDS = [
  "工程师", "开发", "设计师", "产品经理", "运营", "市场", "销售",
  "专员", "主管", "经理", "总监", "助理", "分析师",
  "实习", "校招", "应届", "毕业生",
];

export class UniversalJobParser {
  private options: ParseOptions;

  constructor(options: ParseOptions = {}) {
    this.options = options;
  }

  /**
   * 解析 HTML 页面，提取职位列表
   */
  parse(html: string, pageUrl: string): ParseResult {
    const $ = cheerio.load(html);
    const baseUrl = this.options.baseUrl || this.getBaseUrl(pageUrl);

    // 第一步: 寻找候选职位列表容器
    const candidates = this.findJobListCandidates($, pageUrl);

    const jobs: ParsedJob[] = [];

    for (const candidate of candidates) {
      const $candidate = $(candidate);

      // 从每个候选容器中提取职位条目
      const items = this.extractJobItems($, $candidate, baseUrl, pageUrl);
      jobs.push(...items);
    }

    // 按 sourceUrl 去重
    const uniqueJobs = this.deduplicateByUrl(jobs);

    // 计算置信度并分类
    let highConfidenceCount = 0;
    let lowConfidenceCount = 0;

    for (const job of uniqueJobs) {
      job.confidence = this.calculateConfidence(job);
      if (job.confidence >= 0.5) {
        highConfidenceCount++;
      } else {
        lowConfidenceCount++;
      }
    }

    return {
      jobs: uniqueJobs,
      totalCandidates: candidates.length,
      highConfidenceCount,
      lowConfidenceCount,
    };
  }

  /**
   * 寻找职位列表候选容器
   * 策略:
   * 1. 找包含职位关键词的 <ul>/<ol>/<table>/<div>
   * 2. 找有大量 <a> 标签的容器（链接密度）
   * 3. 找结构重复的块
   */
  private findJobListCandidates($: cheerio.CheerioAPI, pageUrl: string): any[] {
    const candidates: { el: any; score: number }[] = [];

    // 候选容器选择器
    const containerSelectors = [
      "ul", "ol", "table", "div", "section", "article", "main",
    ];

    $("body").find(containerSelectors.join(", ")).each((_: number, el: any) => {
      const $el = $(el);
      const text = $el.text();
      const html = $el.html() || "";

      // 跳过太小或太大的元素
      const textLen = text.length;
      if (textLen < 50 || textLen > 50000) return;

      let score = 0;

      // 关键词命中
      const keywordCount = JOB_KEYWORDS.filter((kw) => text.includes(kw)).length;
      score += keywordCount * 2;

      // 链接数量（职位列表通常有很多链接）
      const linkCount = $el.find("a").length;
      if (linkCount >= 3 && linkCount <= 200) {
        score += Math.min(linkCount / 5, 10);
      }

      // 列表项数量
      const liCount = $el.find("li").length;
      if (liCount >= 3) {
        score += Math.min(liCount / 3, 10);
      }

      // 日期格式出现次数 (暗示是列表)
      const dateMatches = text.match(/\d{4}[-年]\d{1,2}[-月]\d{1,2}/g) || [];
      if (dateMatches.length >= 2) {
        score += dateMatches.length;
      }

      // 职位条目关键词
      const jobItemKeywordCount = JOB_ITEM_KEYWORDS.filter((kw) => text.includes(kw)).length;
      score += jobItemKeywordCount;

      // 结构性: 有多个相同标签的直接子元素
      const children = $el.children();
      const tagCounts: Record<string, number> = {};
      children.each((_: number, child: any) => {
        const tag = child.tagName?.toLowerCase() || "";
        tagCounts[tag] = (tagCounts[tag] || 0) + 1;
      });
      const repeatedTags = Object.values(tagCounts).filter((c) => c >= 3).length;
      score += repeatedTags * 2;

      // 优先选择非最外层容器
      const depth = this.getElementDepth($, el);
      if (depth >= 2 && depth <= 8) {
        score += 3;
      }

      if (score >= 5) {
        candidates.push({ el, score });
      }
    });

    // 按分数降序排序，取前 10 个
    candidates.sort((a, b) => b.score - a.score);

    // 移除嵌套的候选（如果一个候选是另一个的子元素，只保留父元素中分数高的）
    const filtered: any[] = [];
    for (const { el } of candidates.slice(0, 15)) {
      let isNested = false;
      for (const existing of filtered) {
        if ($.contains(existing, el)) {
          isNested = true;
          break;
        }
      }
      if (!isNested) {
        filtered.push(el);
        if (filtered.length >= 8) break;
      }
    }

    return filtered;
  }

  /**
   * 从候选容器中提取职位条目
   */
  private extractJobItems(
    $: cheerio.CheerioAPI,
    $container: any,
    baseUrl: string,
    pageUrl: string
  ): ParsedJob[] {
    const jobs: ParsedJob[] = [];

    // 策略1: 查找 <li> 子元素
    const $listItems = $container.find("> li, li");
    if ($listItems.length >= 2) {
      $listItems.each((_: number, li: any) => {
        const $li = $(li);
        const $a = $li.find("a").first();
        if ($a.length === 0) return;
        const href = $a.attr("href");
        if (!href) return;
        const fullUrl = this.resolveUrl(href, baseUrl);
        const text = $a.text().trim();
        if (text.length < 2 || text.length > 200) return;
        if (this.isNonJobLink(text, href)) return;
        const job = this.buildJobFromContext($, $li, text, fullUrl, pageUrl);
        if (job) jobs.push(job);
      });
      if (jobs.length >= 2) return jobs;
    }

    // 策略2: 查找 <a> 标签作为职位入口
    const $links = $container.find("a");
    const processed = new Set<string>();

    $links.each((_: number, a: any) => {
      const $a = $(a);
      const href = $a.attr("href");
      if (!href) return;

      const fullUrl = this.resolveUrl(href, baseUrl);
      if (processed.has(fullUrl)) return;
      processed.add(fullUrl);

      const text = $a.text().trim();
      if (text.length < 2 || text.length > 200) return;

      // 过滤非职位链接
      if (this.isNonJobLink(text, href)) return;

      // 向上找最近的列表项或行
      let $context = $a.closest("li, tr, div, p");
      if ($context.length === 0) $context = $a.parent();

      const contextText = $context.text();
      const job = this.buildJobFromContext($, $context, text, fullUrl, pageUrl);
      if (job) jobs.push(job);
    });

    return jobs;
  }

  /**
   * 从上下文中构建职位对象
   */
  private buildJobFromContext(
    $: cheerio.CheerioAPI,
    $context: any,
    titleText: string,
    url: string,
    pageUrl: string
  ): ParsedJob | null {
    const fullText = $context.text();

    // 提取标题（取最长的 a/h 标签文本或给定的标题）
    const title = this.extractTitle($, $context) || titleText;
    if (!title || title.length < 2) return null;

    // 提取公司名
    const company = this.extractCompany($, $context, title, fullText, pageUrl);

    // 提取地点
    const location = extractPrimaryLocation(fullText);

    // 提取日期
    const publishedDateResult = this.extractDateFromContext(fullText);
    const publishedAt = publishedDateResult.date;
    const isDateEstimate = publishedDateResult.isEstimate;

    // 提取薪资
    const salary = this.extractSalary(fullText);

    // 提取学历
    const eduResult = extractEducation(title, fullText);
    const education = eduResult.education;

    // 判断职位类型
    const jobType = this.detectJobType(title, fullText);

    // 描述（取上下文，截断）
    const description = fullText.length > 500 ? fullText.slice(0, 500) + "..." : fullText;

    // 保存原始 HTML 片段（供审核）
    const rawHtml = $context.clone().wrap("<div></div>").parent().html() || undefined;

    // 构建临时 job 对象用于计算置信度
    const tempJob: ParsedJob = {
      title: title.trim(),
      company: company || "未知公司",
      location,
      salary,
      description,
      requirements: null,
      education,
      educationConfidence: eduResult.hasConflict ? 0.3 : eduResult.fromDescription ? 0.9 : 0.6,
      sourceUrl: url,
      publishedAt,
      jobType,
      confidence: 0,
      rawHtml,
    };
    
    // 计算置信度：如果日期是估算的，置信度降低
    let confidence = this.calculateConfidence(tempJob);
    if (isDateEstimate) {
      confidence = Math.max(0.1, confidence - 0.1);
    }

    return {
      title: title.trim(),
      company: company || "未知公司",
      location,
      salary,
      description,
      requirements: null,
      education,
      educationConfidence: eduResult.hasConflict ? 0.3 : eduResult.fromDescription ? 0.9 : 0.6,
      sourceUrl: url,
      publishedAt,
      jobType,
      confidence,
      rawHtml,
    };
  }

  /**
   * 提取职位标题
   */
  private extractTitle($: cheerio.CheerioAPI, $context: any): string | null {
    // 优先找 h 标签
    const $headings = $context.find("h1, h2, h3, h4, h5, h6");
    if ($headings.length > 0) {
      const text = $headings.first().text().trim();
      if (text && text.length >= 2) return text;
    }

    // 找 <a> 标签中最长的文本
    let longestLinkText = "";
    $context.find("a").each((_: number, a: any) => {
      const t = $(a).text().trim();
      if (t.length > longestLinkText.length) {
        longestLinkText = t;
      }
    });
    if (longestLinkText.length >= 2) return longestLinkText;

    return null;
  }

  /**
   * 提取公司名
   */
  private extractCompany(
    $: cheerio.CheerioAPI,
    $context: any,
    title: string,
    fullText: string,
    pageUrl: string
  ): string | null {
    // 从页面 URL 中提取域名作为备选
    try {
      const urlObj = new URL(pageUrl);
      const hostname = urlObj.hostname.replace(/^www\./, "");
      // 如果是高校就业网，学校名就是公司名的一种
      if (hostname.endsWith(".edu.cn")) {
        const parts = hostname.split(".");
        if (parts.length >= 2) {
          // 简单取二级域名部分
          return parts[parts.length - 3] || hostname;
        }
      }
    } catch {
      // ignore
    }

    // 从上下文中找公司名模式: 公司/有限公司/集团/科技
    const companyPatterns = [
      /([\u4e00-\u9fa5A-Za-z0-9]{2,30}(?:公司|集团|科技|有限公司|股份有限公司|大学|学院|研究院|研究所|中心|企业))/g,
    ];

    for (const pattern of companyPatterns) {
      const matches = fullText.match(pattern);
      if (matches && matches.length > 0) {
        // 取第一个匹配，且不等于标题
        for (const match of matches) {
          if (match !== title && match.length >= 2) {
            return match;
          }
        }
      }
    }

    // 从 logo alt 属性中找
    const $logo = $context.find("img[alt]");
    if ($logo.length > 0) {
      const alt = $logo.first().attr("alt");
      if (alt && alt.length >= 2 && alt.length <= 50) {
        return alt;
      }
    }

    return null;
  }

  /**
   * 从文本中提取薪资
   */
  private extractSalary(text: string): string | null {
    const patterns = [
      /(\d+(?:\.\d+)?)\s*[-~至]\s*(\d+(?:\.\d+)?)\s*(?:K|k|千|万|w|W)/g,
      /(\d+)\s*(?:K|k|千|万)\s*[-~]\s*(\d+)\s*(?:K|k|千|万)/g,
      /薪资[：:]\s*([^\s，,。；;\n]{2,30})/g,
      /待遇[：:]\s*([^\s，,。；;\n]{2,30})/g,
    ];

    for (const pattern of patterns) {
      const matches = text.match(pattern);
      if (matches && matches.length > 0) {
        return matches[0];
      }
    }

    return null;
  }

  /**
   * 从上下文中提取日期
   * @returns {date: Date | null, isEstimate: boolean}
   */
  private extractDateFromContext(text: string): { date: Date | null; isEstimate: boolean } {
    // 找日期格式的文本
    const datePatterns = [
      /\d{4}[-\/.]\d{1,2}[-\/.]\d{1,2}/,
      /\d{4}年\d{1,2}月\d{1,2}日/,
      /\d{1,2}月\d{1,2}日/,
      /发布[于时间]*[:：]?\s*([^\s，,。；]{2,20})/,
      /更新[于时间]*[:：]?\s*([^\s，,。；]{2,20})/,
    ];

    for (const pattern of datePatterns) {
      const match = text.match(pattern);
      if (match) {
        const dateStr = match[1] || match[0];
        const result = parseDate(dateStr);
        if (result.date) return result;
      }
    }

    return { date: null, isEstimate: false };
  }

  /**
   * 检测职位类型
   */
  private detectJobType(title: string, description: string): string | null {
    const text = title + description;
    if (text.includes("校招") || text.includes("校园招聘") || text.includes("应届") || text.includes("秋招") || text.includes("春招")) {
      return "校招";
    }
    if (text.includes("实习") || text.includes("Intern") || text.includes("intern")) {
      return "实习";
    }
    if (text.includes("社招") || text.includes("社会招聘")) {
      return "社招";
    }
    return null;
  }

  /**
   * 判断是否为非职位链接
   */
  private isNonJobLink(text: string, href: string): boolean {
    const nonJobPatterns = [
      "首页", "主页", "关于我们", "联系方式", "登录", "注册",
      "下载", "更多", "查看更多", "下一页", "上一页", "第",
      "javascript:", "mailto:", "tel:",
    ];

    for (const pattern of nonJobPatterns) {
      if (text.includes(pattern) || href.includes(pattern)) {
        return true;
      }
    }

    if (href === "#") return true;

    return false;
  }

  /**
   * 计算职位置信度评分 (0-1)
   * 规则:
   * - 有标题+公司+链接: +0.3
   * - 有地点: +0.1
   * - 有日期: +0.1
   * - 学历明确: +0.2 (UNKNOWN 则 -0.1)
   * - 有薪资: +0.1
   * - 有描述: +0.1
   * - 学历来自描述（更可信）: +0.1
   */
  private calculateConfidence(job: ParsedJob): number {
    let score = 0;

    // 基础分: 标题+公司+链接
    if (job.title && job.company && job.sourceUrl) {
      score += 0.3;
    }

    // 地点
    if (job.location) score += 0.1;

    // 日期
    if (job.publishedAt) score += 0.1;

    // 学历
    if (job.education !== "UNKNOWN") {
      score += 0.2;
      if (job.educationConfidence >= 0.8) {
        score += 0.1;
      }
    }

    // 薪资
    if (job.salary) score += 0.1;

    // 描述
    if (job.description && job.description.length > 50) score += 0.1;

    // 限制在 0-1 范围内
    return Math.max(0, Math.min(1, score));
  }

  /**
   * 按 URL 去重
   */
  private deduplicateByUrl(jobs: ParsedJob[]): ParsedJob[] {
    const seen = new Set<string>();
    const result: ParsedJob[] = [];

    for (const job of jobs) {
      if (!seen.has(job.sourceUrl)) {
        seen.add(job.sourceUrl);
        result.push(job);
      }
    }

    return result;
  }

  /**
   * 获取基础 URL — 取页面所在目录，用于解析相对链接
   */
  private getBaseUrl(pageUrl: string): string {
    try {
      const url = new URL(pageUrl);
      const path = url.pathname.replace(/\/[^/]*$/, '/');
      return `${url.protocol}//${url.host}${path}`;
    } catch {
      return pageUrl;
    }
  }

  /**
   * 补全相对 URL — 使用标准 URL 解析，正确处理所有相对路径
   */
  private resolveUrl(href: string, baseUrl: string): string {
    if (href.startsWith("http://") || href.startsWith("https://")) {
      return href;
    }
    if (href.startsWith("javascript:") || href.startsWith("mailto:") || href.startsWith("#")) {
      return "";
    }
    try {
      return new URL(href, baseUrl).toString();
    } catch {
      return "";
    }
  }

  /**
   * 获取元素在 DOM 中的深度
   */
  private getElementDepth($: cheerio.CheerioAPI, el: any): number {
    let depth = 0;
    let $el = $(el);
    while ($el.parent().length > 0 && depth < 20) {
      depth++;
      $el = $el.parent();
      if ($el.is("body")) break;
    }
    return depth;
  }

  /**
   * 解析单个职位详情页
   */
  parseDetailPage(html: string, pageUrl: string): Partial<ParsedJob> {
    const $ = cheerio.load(html);

    // 找页面主标题
    const title = $("h1").first().text().trim() || $("title").text().trim();

    // 找页面主体内容
    const $main = $("article, .content, .main, main, .detail, #content").first();
    const content = $main.length > 0 ? $main.text() : $("body").text();

    // 提取学历
    const eduResult = extractEducation(title, content);
    
    // 提取日期
    const dateResult = this.extractDateFromContext(content);

    return {
      title,
      description: content.slice(0, 2000),
      education: eduResult.education,
      educationConfidence: eduResult.fromDescription ? 0.9 : 0.6,
      location: extractPrimaryLocation(content),
      publishedAt: dateResult.date,
      salary: this.extractSalary(content),
      sourceUrl: pageUrl,
    };
  }

  /**
   * (可选) LLM 增强解析低置信度条目
   * 调用 OpenAI API 提取结构化职位信息
   */
  async enhanceWithLLM(
    job: ParsedJob,
    apiKey: string,
    model = "gpt-3.5-turbo"
  ): Promise<ParsedJob> {
    if (!apiKey || !job.rawHtml) return job;

    const prompt = `
你是一个招聘信息提取助手。请从以下 HTML 片段中提取职位信息，返回 JSON 格式。

要求:
- education 字段必须从以下枚举中选择一个:
  BACHELOR_AND_ABOVE (本科及以上)
  BACHELOR_ONLY (仅本科)
  ASSOCIATE_AND_ABOVE (专科及以上)
  ASSOCIATE_ONLY (仅专科)
  NO_REQUIREMENT (不限)
  UNKNOWN (无法判断)

HTML 片段:
\`\`\`html
${job.rawHtml.slice(0, 3000)}
\`\`\`

请返回严格的 JSON:
{
  "title": "职位名称",
  "company": "公司名",
  "location": "工作城市或null",
  "salary": "薪资描述或null",
  "education": "BACHELOR_AND_ABOVE",
  "published_at": "YYYY-MM-DD或null"
}
`;

    try {
      const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model,
          messages: [{ role: "user", content: prompt }],
          temperature: 0,
        }),
      });

      if (!response.ok) {
        console.warn(`LLM 请求失败: ${response.status}`);
        return job;
      }

      const data = await response.json();
      const content = data.choices?.[0]?.message?.content;
      if (!content) return job;

      // 解析 JSON
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (!jsonMatch) return job;

      const parsed = JSON.parse(jsonMatch[0]);

      // 更新字段
      if (parsed.title) job.title = parsed.title;
      if (parsed.company && parsed.company !== "未知公司") job.company = parsed.company;
      if (parsed.location) job.location = parsed.location;
      if (parsed.salary) job.salary = parsed.salary;
      if (parsed.education && ALL_EDUCATION_OPTIONS.includes(parsed.education as EducationLevel)) {
        job.education = parsed.education as EducationLevel;
        job.educationConfidence = 0.95;
      }
      if (parsed.published_at) {
        const dateResult = parseDate(parsed.published_at);
        if (dateResult.date) {
          job.publishedAt = dateResult.date;
          if (dateResult.isEstimate) job.confidence = Math.max(0.1, job.confidence - 0.1);
        }
      }

      // 重新计算置信度
      job.confidence = this.calculateConfidence(job);

      return job;
    } catch (error) {
      console.warn("LLM 增强解析失败:", error);
      return job;
    }
  }
}
