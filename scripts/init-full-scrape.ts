/**
 * 初始化全量抓取脚本
 *
 * 用途：初次部署后一次性运行，快速获取大量历史岗位数据
 *
 * 运行方式：
 *   # 本地开发
 *   npx tsx scripts/init-full-scrape.ts
 *
 *   # 连接线上数据库
 *   DATABASE_URL="libsql://..." TURSO_AUTH_TOKEN="..." npx tsx scripts/init-full-scrape.ts
 *
 * 特点：
 *   - 不限制时间范围，尽可能抓取更多数据
 *   - 遵守频率限制，每个源间隔 >= 10 秒
 *   - 分批处理，不会一次耗尽 Vercel Functions 的内存限制
 */

import { PrismaClient, EducationLevel, SourceType, ParserType } from "@prisma/client";
import * as cheerio from "cheerio";
import * as fs from "fs";
import * as path from "path";
import * as yaml from "js-yaml";
import {
  getUniversitySources,
  getVocationalSources,
  SOURCE_STATS,
} from "@/lib/data/universities";

const prisma = new PrismaClient();

// ==================== 配置 ====================

const CRAWL_DELAY_MS = 10000; // 每个源间隔 10 秒（严格遵守）
const MAX_PAGES_PER_SOURCE = 10; // 每个源最多抓取页数
const MAX_JOBS_PER_SOURCE = 500; // 每个源最多职位数

// 学历关键词（复用 education-extractor 的逻辑）
const EDUCATION_KEYWORDS: Record<string, EducationLevel> = {
  // 本科及以上
  "本科及以上": EducationLevel.BACHELOR_AND_ABOVE,
  "本科以上": EducationLevel.BACHELOR_AND_ABOVE,
  "全日制本科": EducationLevel.BACHELOR_AND_ABOVE,
  "统招本科": EducationLevel.BACHELOR_AND_ABOVE,
  "大学本科": EducationLevel.BACHELOR_AND_ABOVE,
  "本科，学士": EducationLevel.BACHELOR_AND_ABOVE,
  "学士学位": EducationLevel.BACHELOR_AND_ABOVE,
  "硕士": EducationLevel.BACHELOR_AND_ABOVE,
  "研究生": EducationLevel.BACHELOR_AND_ABOVE,
  // 仅本科
  "仅限本科": EducationLevel.BACHELOR_ONLY,
  "只招本科": EducationLevel.BACHELOR_ONLY,
  // 专科及以上
  "专科及以上": EducationLevel.ASSOCIATE_AND_ABOVE,
  "大专及以上": EducationLevel.ASSOCIATE_AND_ABOVE,
  "大专以上": EducationLevel.ASSOCIATE_AND_ABOVE,
  // 仅专科
  "仅限专科": EducationLevel.ASSOCIATE_ONLY,
  "只招大专": EducationLevel.ASSOCIATE_ONLY,
  "高职高专": EducationLevel.ASSOCIATE_ONLY,
  // 不限
  "学历不限": EducationLevel.NO_REQUIREMENT,
  "无学历要求": EducationLevel.NO_REQUIREMENT,
};

// 默认数据源（确保至少有数据可抓）
const DEFAULT_SOURCES = [
  {
    name: "国家24365大学生就业服务平台",
    url: "https://job.ncss.cn/",
    type: SourceType.OFFICIAL_PLATFORM,
    parserType: ParserType.UNIVERSAL,
    crawlInterval: 60,
  },
  {
    name: "应届生求职网",
    url: "https://www.yingjiesheng.com/",
    type: SourceType.OFFICIAL_PLATFORM,
    parserType: ParserType.UNIVERSAL,
    crawlInterval: 60,
  },
  {
    name: "智联招聘校招",
    url: "https://xiaozhao.zhaopin.com/",
    type: SourceType.OFFICIAL_PLATFORM,
    parserType: ParserType.UNIVERSAL,
    crawlInterval: 60,
  },
  {
    name: "牛客网校招",
    url: "https://nowpick.nowcoder.com/",
    type: SourceType.OFFICIAL_PLATFORM,
    parserType: ParserType.UNIVERSAL,
    crawlInterval: 120,
  },
  {
    name: "华为校园招聘",
    url: "https://career.huawei.com/reccampportal/portal5/campus-recruitment.html",
    type: SourceType.ENTERPRISE,
    parserType: ParserType.UNIVERSAL,
    crawlInterval: 720,
  },
  {
    name: "阿里巴巴校园招聘",
    url: "https://campus.alibaba.com/index.htm",
    type: SourceType.ENTERPRISE,
    parserType: ParserType.UNIVERSAL,
    crawlInterval: 720,
  },
  {
    name: "腾讯校园招聘",
    url: "https://join.qq.com/",
    type: SourceType.ENTERPRISE,
    parserType: ParserType.UNIVERSAL,
    crawlInterval: 720,
  },
  {
    name: "字节跳动校园招聘",
    url: "https://jobs.bytedance.com/zh-CN/campus",
    type: SourceType.ENTERPRISE,
    parserType: ParserType.UNIVERSAL,
    crawlInterval: 720,
  },
  {
    name: "百度校园招聘",
    url: "https://talent.baidu.com/external/baidu/campus.html",
    type: SourceType.ENTERPRISE,
    parserType: ParserType.UNIVERSAL,
    crawlInterval: 720,
  },
  {
    name: "京东校园招聘",
    url: "https://campus.jd.com/",
    type: SourceType.ENTERPRISE,
    parserType: ParserType.UNIVERSAL,
    crawlInterval: 720,
  },
  {
    name: "美团校园招聘",
    url: "https://campus.meituan.com/",
    type: SourceType.ENTERPRISE,
    parserType: ParserType.UNIVERSAL,
    crawlInterval: 720,
  },
  {
    name: "网易校园招聘",
    url: "https://campus.163.com/",
    type: SourceType.ENTERPRISE,
    parserType: ParserType.UNIVERSAL,
    crawlInterval: 720,
  },
  {
    name: "小米校园招聘",
    url: "https://hr.xiaomi.com/campus",
    type: SourceType.ENTERPRISE,
    parserType: ParserType.UNIVERSAL,
    crawlInterval: 720,
  },
  {
    name: "清华大学就业信息网",
    url: "https://career.tsinghua.edu.cn/",
    type: SourceType.UNIVERSITY,
    parserType: ParserType.UNIVERSAL,
    crawlInterval: 360,
  },
  {
    name: "北京大学学生就业指导服务中心",
    url: "https://scc.pku.edu.cn/",
    type: SourceType.UNIVERSITY,
    parserType: ParserType.UNIVERSAL,
    crawlInterval: 360,
  },
  {
    name: "浙江大学就业指导中心",
    url: "https://www.career.zju.edu.cn/",
    type: SourceType.UNIVERSITY,
    parserType: ParserType.UNIVERSAL,
    crawlInterval: 360,
  },
  {
    name: "上海交通大学就业服务中心",
    url: "https://career.sjtu.edu.cn/",
    type: SourceType.UNIVERSITY,
    parserType: ParserType.UNIVERSAL,
    crawlInterval: 360,
  },
  {
    name: "复旦大学学生职业发展教育服务中心",
    url: "https://career.fudan.edu.cn/",
    type: SourceType.UNIVERSITY,
    parserType: ParserType.UNIVERSAL,
    crawlInterval: 360,
  },
];

// ==================== 核心函数 ====================

/**
 * 提取学历要求
 */
function extractEducation(text: string): EducationLevel {
  const upper = text.toUpperCase();

  for (const [keyword, level] of Object.entries(EDUCATION_KEYWORDS)) {
    if (upper.includes(keyword.toUpperCase())) {
      return level;
    }
  }

  return EducationLevel.UNKNOWN;
}

/**
 * 计算置信度
 */
function calculateConfidence(
  hasTitle: boolean,
  hasCompany: boolean,
  hasLocation: boolean,
  hasDate: boolean,
  hasEducation: boolean
): number {
  let score = 0;
  if (hasTitle) score += 0.3;
  if (hasCompany) score += 0.3;
  if (hasLocation) score += 0.1;
  if (hasDate) score += 0.1;
  if (hasEducation) score += 0.2;
  return score;
}

/**
 * 检查 robots.txt
 */
async function checkRobotsTxt(baseUrl: string): Promise<boolean> {
  try {
    const url = new URL(baseUrl);
    const robotsUrl = `${url.protocol}//${url.host}/robots.txt`;
    const res = await fetch(robotsUrl, {
      headers: { "User-Agent": "FairJob/1.0" },
      signal: AbortSignal.timeout(5000),
    });

    if (!res.ok) return true; // 无法获取则假设允许

    const text = await res.text();
    const lines = text.split("\n");
    let allows = true;

    for (const line of lines) {
      const lower = line.toLowerCase().trim();
      if (lower.startsWith("disallow:")) {
        const path = lower.substring(9).trim();
        if (path === "/" || url.pathname.startsWith(path)) {
          allows = false;
        }
      }
      if (lower.startsWith("allow:")) {
        allows = true;
      }
    }

    return allows;
  } catch {
    return true; // 出错则假设允许
  }
}

/**
 * 通用 HTML 解析器（简化版，不依赖固定选择器）
 */
function parseJobsFromHtml(html: string, baseUrl: string): any[] {
  const $ = cheerio.load(html);
  const jobs: any[] = [];

  // 寻找职位列表容器
  // 策略1: 寻找包含"岗位"关键词的元素
  const listContainers = $(
    "*:contains('岗位'), *:contains('招聘'), *:contains('校招'), *:contains('职位')"
  );

  listContainers.each((_, el) => {
    const $el = $(el);
    const text = $el.text();

    // 跳过导航、页脚等
    if (text.length < 50 || text.length > 5000) return;

    // 寻找其中的链接
    const links = $el.find("a[href]");
    if (links.length < 2) return;

    links.each((_, link) => {
      const $link = $(link);
      const href = $link.attr("href") || "";
      const title = $link.text().trim();

      // 跳过外部链接、图片链接等
      if (
        !href ||
        href.startsWith("#") ||
        href.startsWith("javascript") ||
        href.includes(".jpg") ||
        href.includes(".png")
      )
        return;

      // 跳过太短或太长的标题
      if (title.length < 4 || title.length > 100) return;

      // 补全相对链接
      let fullUrl = href;
      if (!href.startsWith("http://") && !href.startsWith("https://")) {
        try {
          fullUrl = new URL(href, baseUrl).toString();
        } catch {
          fullUrl = "";
        }
      }

      // 尝试从周围文本提取信息
      const parentText = $link.parent().text();
      const grandparentText = $link.parent().parent().text();

      // 提取学历
      const eduText = title + " " + parentText + " " + grandparentText;
      const education = extractEducation(eduText);

      // 提取公司名（尝试在链接附近找）
      let company = "";
      const companyPatterns = [
        /[\u4e00-\u9fa5]{2,15}(?:公司|集团|企业|有限)/,
        /【([^】]+)】/,
      ];
      for (const p of companyPatterns) {
        const m = parentText.match(p);
        if (m) {
          company = m[1] || m[0];
          break;
        }
      }

      // 提取地点
      const cities = [
        "北京", "上海", "深圳", "广州", "杭州", "成都", "南京", "武汉",
        "西安", "重庆", "苏州", "厦门", "青岛", "大连", "长沙", "郑州",
        "济南", "合肥", "天津", "沈阳", "哈尔滨", "长春", "福州", "南昌",
        "昆明", "贵阳", "南宁", "西安", "兰州", "乌鲁木齐", "拉萨",
      ];
      let location = "";
      for (const city of cities) {
        if (parentText.includes(city) || grandparentText.includes(city)) {
          location = city;
          break;
        }
      }

      // 计算置信度
      const confidence = calculateConfidence(
        title.length > 4,
        company.length > 0,
        location.length > 0,
        false, // 自动抓取通常没有日期
        education !== EducationLevel.UNKNOWN
      );

      if (confidence >= 0.3) {
        jobs.push({
          title: title.replace(/\s+/g, " ").trim(),
          company: company || "未知公司",
          location: location || null,
          education,
          sourceUrl: fullUrl,
          publishedAt: new Date(),
          confidence,
        });
      }
    });
  });

  // 去重
  const seen = new Set<string>();
  return jobs.filter((j) => {
    const key = j.company + "|" + j.title;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

/**
 * 抓取单个数据源
 */
async function crawlSource(source: any): Promise<{
  found: number;
  added: number;
  review: number;
  error?: string;
}> {
  console.log(`\n  抓取: ${source.name} (${source.url})`);

  // 检查 robots.txt
  const allowed = await checkRobotsTxt(source.url);
  if (!allowed) {
    console.log(`    ⛔ robots.txt 禁止抓取，跳过`);
    return { found: 0, added: 0, review: 0, error: "robots.txt blocked" };
  }

  try {
    const res = await fetch(source.url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (compatible; FairJob/1.0; +https://github.com/fairjob)",
        Accept:
          "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "zh-CN,zh;q=0.9",
      },
      signal: AbortSignal.timeout(30000),
    });

    if (!res.ok) {
      throw new Error(`HTTP ${res.status}`);
    }

    const html = await res.text();
    const jobs = parseJobsFromHtml(html, source.url);

    console.log(`    发现 ${jobs.length} 个候选职位`);

    let added = 0;
    let review = 0;

    for (const job of jobs.slice(0, MAX_JOBS_PER_SOURCE)) {
      // 检查是否已存在
      const exists = await prisma.job.findUnique({
        where: { sourceUrl: job.sourceUrl },
      });

      if (exists) continue;

      if (job.confidence < 0.5 || job.education === EducationLevel.UNKNOWN) {
        // 低置信度进入待审核
        await prisma.reviewJob.create({
          data: {
            title: job.title,
            company: job.company,
            location: job.location,
            education: job.education,
            sourceUrl: job.sourceUrl,
            sourceId: source.id,
            confidence: job.confidence,
            status: "PENDING",
          },
        });
        review++;
      } else {
        await prisma.job.create({
          data: {
            title: job.title,
            company: job.company,
            location: job.location,
            education: job.education,
            sourceUrl: job.sourceUrl,
            sourceId: source.id,
            sourceName: source.name,
            publishedAt: job.publishedAt,
            confidence: job.confidence,
          },
        });
        added++;
      }
    }

    console.log(`    新增 ${added}，待审核 ${review}`);

    return { found: jobs.length, added, review };
  } catch (error: any) {
    console.log(`    ❌ 失败: ${error.message}`);
    return { found: 0, added: 0, review: 0, error: error.message };
  }
}

// ==================== 主流程 ====================

async function main() {
  console.log("=".repeat(60));
  console.log("FairJob 初始化全量抓取");
  console.log("=".repeat(60));
  console.log(`数据库: ${process.env.DATABASE_URL || "file:./dev.db"}`);
  console.log("");

  const startTime = Date.now();

  // 1. 初始化数据源
  console.log("📡 初始化数据源...");
  let sourceCreated = 0;
  let sourceSkipped = 0;

  for (const src of DEFAULT_SOURCES) {
    const existing = await prisma.source.findFirst({
      where: { url: src.url },
    });

    if (!existing) {
      await prisma.source.create({ data: src });
      sourceCreated++;
      console.log(`  + ${src.name}`);
    } else {
      sourceSkipped++;
      console.log(`  = ${src.name} (已存在)`);
    }
  }

  // 添加双一流高校数据源
  console.log("\n🏛️ 添加双一流高校就业网...");
  const universitySources = getUniversitySources();
  for (const src of universitySources.slice(0, 30)) {
    // 先添加30所知名高校
    const existing = await prisma.source.findFirst({ where: { url: src.url } });
    if (!existing) {
      await prisma.source.create({ data: src });
      sourceCreated++;
      console.log(`  + ${src.name}`);
    }
  }

  // 添加高职院校数据源
  console.log("\n🏭 添加高职院校就业网...");
  const vocationalSources = getVocationalSources();
  for (const src of vocationalSources.slice(0, 30)) {
    // 先添加30所高职院校
    const existing = await prisma.source.findFirst({ where: { url: src.url } });
    if (!existing) {
      await prisma.source.create({ data: src });
      sourceCreated++;
      console.log(`  + ${src.name}`);
    }
  }

  console.log(`\n📊 数据源统计: 新增 ${sourceCreated}, 跳过 ${sourceSkipped}`);
  console.log(
    `   共有 ${universitySources.length} 所双一流高校, ${vocationalSources.length} 所高职院校可添加`
  );

  // 读取配置文件中的额外源
  try {
    const univPath = path.join(process.cwd(), "data", "universities.txt");
    if (fs.existsSync(univPath)) {
      const lines = fs
        .readFileSync(univPath, "utf-8")
        .split("\n")
        .filter((l) => l.trim() && !l.startsWith("#"));

      for (const line of lines.slice(0, 20)) {
        // 最多加 20 个高校
        const url = line.trim();
        const existing = await prisma.source.findFirst({ where: { url } });
        if (!existing) {
          const name = url
            .replace("https://", "")
            .replace("http://", "")
            .split(".")[1]
            ?.replace("www.", "")
            .toUpperCase() + " 就业网";

          await prisma.source.create({
            data: {
              name: name || url,
              url,
              type: SourceType.UNIVERSITY,
              parserType: ParserType.UNIVERSAL,
              crawlInterval: 360,
            },
          });
          sourceCreated++;
          console.log(`  + ${name}`);
        }
      }
    }
  } catch {}

  try {
    const entPath = path.join(process.cwd(), "data", "enterprise_sites.yaml");
    if (fs.existsSync(entPath)) {
      const config = yaml.load(fs.readFileSync(entPath, "utf-8")) as any;
      const enterprises = Array.isArray(config) ? config : config?.enterprises || [];
      for (const ent of enterprises.slice(0, 10)) {
          const existing = await prisma.source.findFirst({
            where: { url: ent.url },
          });
          if (!existing) {
            await prisma.source.create({
              data: {
                name: ent.name,
                url: ent.url,
                type: SourceType.ENTERPRISE,
                parserType: ParserType.UNIVERSAL,
                crawlInterval: 720,
              },
            });
            sourceCreated++;
            console.log(`  + ${ent.name}`);
          }
        }
    }
  } catch {}

  console.log(
    `\n  数据源: 新建 ${sourceCreated}，已有 ${sourceSkipped}`
  );

  // 2. 全量抓取
  const sources = await prisma.source.findMany({
    where: { isActive: true },
    orderBy: { type: "asc" },
  });

  console.log(`\n🌐 开始抓取 (共 ${sources.length} 个数据源)...`);
  console.log(`   每个源间隔 ${CRAWL_DELAY_MS / 1000} 秒，预计耗时 ${Math.ceil(sources.length * CRAWL_DELAY_MS / 60000)} 分钟`);
  console.log("");

  let totalFound = 0;
  let totalAdded = 0;
  let totalReview = 0;
  const failed: string[] = [];

  for (let i = 0; i < sources.length; i++) {
    const src = sources[i];
    console.log(`[${i + 1}/${sources.length}]`);

    const result = await crawlSource(src);

    totalFound += result.found;
    totalAdded += result.added;
    totalReview += result.review;
    if (result.error) failed.push(`${src.name}: ${result.error}`);

    // 更新抓取时间
    await prisma.source.update({
      where: { id: src.id },
      data: {
        lastCrawledAt: new Date(),
        successCount: result.error ? src.successCount : src.successCount + 1,
        failCount: result.error ? src.failCount + 1 : 0,
      },
    });

    // 间隔
    if (i < sources.length - 1) {
      await new Promise((r) => setTimeout(r, CRAWL_DELAY_MS));
    }
  }

  // 3. 学历回填
  console.log("\n📚 执行学历回填...");

  const unknownJobs = await prisma.reviewJob.findMany({
    where: {
      status: "PENDING",
      education: EducationLevel.UNKNOWN,
    },
    take: 100,
  });

  let backfilled = 0;
  for (const job of unknownJobs) {
    const text = [job.title, job.description, job.requirements]
      .filter(Boolean)
      .join("\n");
    const edu = extractEducation(text);

    if (edu !== EducationLevel.UNKNOWN) {
      await prisma.reviewJob.update({
        where: { id: job.id },
        data: { education: edu, suggestedEdu: edu },
      });
      backfilled++;
    }
  }

  console.log(`   回填完成: ${backfilled} 条`);

  // 4. 生成报告
  const duration = Date.now() - startTime;

  const stats = await prisma.job.groupBy({
    by: ["education"],
    _count: { education: true },
  });

  const sourceStats = await prisma.job.groupBy({
    by: ["sourceName"],
    _count: { sourceName: true },
    orderBy: { _count: { sourceName: "desc" } },
    take: 10,
  });

  console.log("\n" + "=".repeat(60));
  console.log("📊 初始化抓取报告");
  console.log("=".repeat(60));
  console.log(`总耗时: ${Math.round(duration / 1000)} 秒`);
  console.log(`数据源: ${sources.length} 个`);
  console.log(`失败: ${failed.length} 个`);
  console.log(`新增职位: ${totalAdded} 条`);
  console.log(`待审核: ${totalReview} 条`);
  console.log(`学历回填: ${backfilled} 条`);

  const totalJobs = await prisma.job.count();
  const totalReviewPending = await prisma.reviewJob.count({
    where: { status: "PENDING" },
  });

  console.log(`\n当前总数:`);
  console.log(`  正式职位: ${totalJobs} 条`);
  console.log(`  待审核: ${totalReviewPending} 条`);

  console.log(`\n学历分布:`);
  const eduLabels: Record<string, string> = {
    BACHELOR_AND_ABOVE: "本科及以上",
    BACHELOR_ONLY: "仅本科",
    ASSOCIATE_AND_ABOVE: "专科及以上",
    ASSOCIATE_ONLY: "仅专科",
    NO_REQUIREMENT: "不限",
    UNKNOWN: "未知",
  };
  for (const s of stats) {
    console.log(
      `  ${eduLabels[s.education] || s.education}: ${s._count.education}`
    );
  }

  console.log(`\n来源分布 (Top 10):`);
  for (const s of sourceStats) {
    if (s.sourceName) {
      console.log(`  ${s.sourceName}: ${s._count.sourceName}`);
    }
  }

  if (failed.length > 0) {
    console.log(`\n失败详情:`);
    for (const f of failed) {
      console.log(`  - ${f}`);
    }
  }

  console.log("\n" + "=".repeat(60));
  console.log("✅ 初始化完成！");
  console.log("");
  console.log("下一步:");
  console.log("  1. 访问 /admin/review 审核待定职位");
  console.log("  2. 部署到 Vercel: vercel --prod");
  console.log("  3. 配置定时任务: Vercel → Project → Cron Jobs");
  console.log("=");
}

main()
  .catch((e) => {
    console.error("\n❌ 初始化失败:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
