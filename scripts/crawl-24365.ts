/**
 * 国家24365平台职位抓取脚本
 * 
 * 利用 24365 公开搜索 API，组合"专业 + 城市"进行遍历搜索
 * 全量入数据库并自动去重
 * 
 * 运行方式:
 *   # 本地
 *   npx tsx scripts/crawl-24365.ts
 *   
 *   # 连接生产数据库
 *   DATABASE_URL="libsql://..." TURSO_AUTH_TOKEN="..." npx tsx scripts/crawl-24365.ts
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// ==================== 配置 ====================

const BASE_URL = "https://job.ncss.cn";
const REQUEST_DELAY_MS = 1200; // 1.2秒间隔，留有余量
const MAX_PAGES_PER_SEARCH = 5; // 每个搜索组合最多抓取页数

// ==================== 专业列表 (100个) ====================

const MAJORS = [
  // 计算机类
  "计算机科学与技术", "软件工程", "网络工程", "信息安全", "物联网工程",
  "数字媒体技术", "智能科学与技术", "数据科学与大数据技术", "人工智能",
  "计算机应用技术", "计算机网络技术", "软件技术", "信息安全与管理",
  
  // 电子信息类
  "电子信息工程", "通信工程", "微电子科学与工程", "光电信息科学与工程",
  "电子信息工程技术", "移动通信技术", "通信技术", "光通信技术",
  
  // 自动化类
  "自动化", "电气工程及其自动化", "智能电网信息工程", "电气自动化技术",
  "工业过程自动化技术", "电气工程技术",
  
  // 机械类
  "机械设计制造及其自动化", "机械工程", "材料成型及控制工程", "机械电子工程",
  "工业设计", "过程装备与控制工程", "机械制造与自动化", "数控技术",
  "模具设计与制造", "机电一体化技术", "机电设备维修与管理",
  
  // 经济管理类
  "工商管理", "市场营销", "会计学", "财务管理", "人力资源管理",
  "审计学", "统计学", "经济学", "金融学", "国际经济与贸易",
  "电子商务", "物流管理", "供应链管理", "行政管理", "公共事业管理",
  
  // 语言类
  "英语", "商务英语", "日语", "法语", "德语", "西班牙语", "翻译",
  "汉语国际教育", "汉语言文学",
  
  // 法学类
  "法学", "知识产权", "社会学", "社会工作", "政治学与行政学",
  
  // 建筑类
  "建筑学", "城乡规划", "风景园林", "土木工程", "建筑环境与能源应用工程",
  "给排水科学与工程", "建筑电气与智能化", "建设工程管理", "工程造价",
  "建筑工程技术", "建筑钢结构工程技术",
  
  // 化学化工类
  "化学工程与工艺", "应用化学", "化学", "材料化学", "化工生物技术",
  "应用化工技术", "石油化工技术", "精细化工技术",
  
  // 生物医药类
  "生物技术", "生物工程", "制药工程", "药学", "中药学", "药物制剂",
  "生物制药技术", "药品生产技术", "药品质量与安全",
  
  // 艺术设计类
  "视觉传达设计", "环境设计", "产品设计", "服装与服饰设计",
  "数字媒体艺术", "艺术设计", "广告设计与制作", "室内艺术设计",
  "动漫制作技术", "影视动画",
  
  // 教育类
  "教育学", "学前教育", "小学教育", "体育教育", "教育技术学",
  
  // 新闻传媒类
  "新闻学", "广播电视学", "广告学", "传播学", "网络与新媒体",
  
  // 数学物理类
  "数学与应用数学", "信息与计算科学", "物理学", "应用物理学",
  
  // 材料类
  "材料科学与工程", "材料物理", "冶金工程", "金属材料工程",
  "高分子材料与工程", "复合材料工程技术",
  
  // 能源类
  "能源与动力工程", "新能源科学与工程", "储能科学与工程",
  "热能与动力工程技术", "太阳能光热技术与应用",
  
  // 交通运输类
  "交通运输", "交通工程", "轨道交通信号与控制", "航海技术", "轮机工程",
  "道路桥梁工程技术", "铁道工程技术", "城市轨道交通运营管理",
  
  // 航空航天类
  "航空航天工程", "飞行器设计与工程", "飞行器制造工程", "飞行器动力工程",
];

// ==================== 城市列表 (20个) ====================

const CITIES = [
  { name: "北京", code: "110000" },
  { name: "上海", code: "310000" },
  { name: "广州", code: "440100" },
  { name: "深圳", code: "440300" },
  { name: "成都", code: "510100" },
  { name: "杭州", code: "330100" },
  { name: "南京", code: "320100" },
  { name: "武汉", code: "420100" },
  { name: "西安", code: "610100" },
  { name: "重庆", code: "500000" },
  { name: "苏州", code: "320500" },
  { name: "天津", code: "120000" },
  { name: "长沙", code: "430100" },
  { name: "郑州", code: "410100" },
  { name: "东莞", code: "441900" },
  { name: "青岛", code: "370200" },
  { name: "宁波", code: "330200" },
  { name: "厦门", code: "350200" },
  { name: "福州", code: "350100" },
  { name: "济南", code: "370100" },
];

// ==================== 类型定义 ====================

interface Job24365 {
  id: number;
  jobName: string;
  companyName: string;
  cityName: string;
  salaryScope: string;
  publishDate: string;
  education: string;
  jobType: string;
  natureName: string;
  jobTag: string;
  companyTag: string;
  recruitJobsCount: number;
  detailUrl: string;
}

// ==================== 学历映射 ====================

function mapEducation(edu: string): string {
  const mapping: Record<string, string> = {
    "初中及以下": "NO_REQUIREMENT",
    "中专/中技": "ASSOCIATE_ONLY",
    "高中": "ASSOCIATE_ONLY",
    "大专": "ASSOCIATE_AND_ABOVE",
    "本科": "BACHELOR_AND_ABOVE",
    "硕士": "BACHELOR_AND_ABOVE",
    "博士": "BACHELOR_AND_ABOVE",
    "不限": "NO_REQUIREMENT",
  };
  return mapping[edu] || "UNKNOWN";
}

// ==================== 请求函数 ====================

async function fetchJobs(
  major: string,
  cityCode: string,
  page: number = 1
): Promise<{ jobs: Job24365[]; total: number }> {
  try {
    const url = `${BASE_URL}/job/searchJob`;
    const params = new URLSearchParams({
      major,
      cityCode,
      page: page.toString(),
      pageSize: "20",
      verifyType: "1", // 认证单位
    });

    const response = await fetch(`${url}?${params}`, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        "Accept": "application/json, text/plain, */*",
        "Referer": BASE_URL,
        "Origin": BASE_URL,
      },
    });

    if (!response.ok) {
      console.warn(`  请求失败: ${response.status}`);
      return { jobs: [], total: 0 };
    }

    const data = await response.json();
    
    if (data.code === 200 && data.result) {
      return {
        jobs: data.result.jobs || [],
        total: data.result.total || 0,
      };
    }

    return { jobs: [], total: 0 };
  } catch (error) {
    console.warn(`  请求异常: ${error}`);
    return { jobs: [], total: 0 };
  }
}

// ==================== 相似度去重 ====================

function isSimilarJob(
  existing: { company: string; title: string; location: string | null },
  newJob: { companyName: string; jobName: string; cityName: string }
): boolean {
  const normalize = (s: string) => s.toLowerCase().replace(/\s+/g, "").slice(0, 10);
  
  const companyMatch = normalize(existing.company).includes(normalize(newJob.companyName).slice(0, 6));
  const titleMatch = normalize(existing.title).includes(normalize(newJob.jobName).slice(0, 8));
  const locationMatch = existing.location?.includes(newJob.cityName) || 
                        newJob.cityName.includes(existing.location || "");
  
  return companyMatch && titleMatch && locationMatch;
}

// ==================== 入库函数 ====================

async function saveJob(job: Job24365): Promise<boolean> {
  // 检查是否已存在
  const existing = await prisma.job.findUnique({
    where: { sourceUrl: job.detailUrl },
  });
  
  if (existing) {
    return false; // 已存在，跳过
  }

  // 相似度检查
  const similarJobs = await prisma.job.findMany({
    where: {
      company: { contains: job.companyName.slice(0, 4) },
      title: { contains: job.jobName.slice(0, 6) },
    },
    take: 5,
  });

  for (const similar of similarJobs) {
    if (isSimilarJob(similar, job)) {
      // 更新合并计数
      await prisma.job.update({
        where: { id: similar.id },
        data: {
          mergeCount: { increment: 1 },
          isMerged: true,
        },
      });
      return false;
    }
  }

  // 新增职位
  await prisma.job.create({
    data: {
      title: job.jobName,
      company: job.companyName,
      location: job.cityName,
      salary: job.salaryScope || null,
      description: job.jobTag || null,
      education: mapEducation(job.education),
      jobType: job.natureName || null,
      publishedAt: job.publishDate ? new Date(job.publishDate) : null,
      sourceName: "国家24365平台",
      sourceUrl: job.detailUrl,
      confidence: 0.9, // 24365是官方平台，可信度高
    },
  });

  return true;
}

// ==================== 主流程 ====================

async function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function crawl24365() {
  console.log("=".repeat(60));
  console.log("📡 国家24365平台职位抓取");
  console.log("=".repeat(60));
  console.log(`专业数: ${MAJORS.length}`);
  console.log(`城市数: ${CITIES.length}`);
  console.log(`预计搜索次数: ${MAJORS.length * CITIES.length}`);
  console.log(`预计总时长: ${Math.round(MAJORS.length * CITIES.length * REQUEST_DELAY_MS / 60000)} 分钟`);
  console.log("=".repeat(60));

  // 确保数据源已添加
  const source = await prisma.source.findFirst({
    where: { url: BASE_URL },
  });

  if (!source) {
    await prisma.source.create({
      data: {
        name: "国家24365大学生就业服务平台",
        url: BASE_URL,
        type: "OFFICIAL_PLATFORM",
        parserType: "API",
        crawlInterval: 60,
      },
    });
    console.log("✓ 已添加数据源\n");
  }

  let totalJobsFound = 0;
  let totalJobsAdded = 0;
  let totalSkipped = 0;
  let errors = 0;
  const startTime = Date.now();

  for (let i = 0; i < MAJORS.length; i++) {
    const major = MAJORS[i];
    console.log(`\n[${i + 1}/${MAJORS.length}] 专业: ${major}`);

    for (let j = 0; j < CITIES.length; j++) {
      const city = CITIES[j];
      process.stdout.write(`  城市: ${city.name}... `);

      let addedInCity = 0;
      let hasMorePages = true;
      let page = 1;

      while (hasMorePages && page <= MAX_PAGES_PER_SEARCH) {
        await delay(REQUEST_DELAY_MS);

        const result = await fetchJobs(major, city.code, page);

        if (result.jobs.length === 0) {
          hasMorePages = false;
          break;
        }

        for (const job of result.jobs) {
          const saved = await saveJob(job);
          if (saved) {
            addedInCity++;
            totalJobsAdded++;
          } else {
            totalSkipped++;
          }
          totalJobsFound++;
        }

        process.stdout.write(`(${result.jobs.length}条)`);
        page++;

        if (result.total > page * 20) {
          hasMorePages = true;
        } else {
          hasMorePages = false;
        }
      }

      console.log(` +${addedInCity} 新增`);
    }

    // 每完成一个专业，保存一次日志
    await prisma.crawlLog.create({
      data: {
        sourceId: source?.id,
        sourceName: "国家24365平台",
        jobsFound: totalJobsFound,
        jobsAdded: totalJobsAdded,
        jobsMerged: totalSkipped,
        durationMs: Date.now() - startTime,
      },
    });
  }

  const duration = Math.round((Date.now() - startTime) / 1000);
  
  console.log("\n" + "=".repeat(60));
  console.log("📊 抓取完成报告");
  console.log("=".repeat(60));
  console.log(`总耗时: ${Math.floor(duration / 60)}分${duration % 60}秒`);
  console.log(`发现职位: ${totalJobsFound}`);
  console.log(`新增职位: ${totalJobsAdded}`);
  console.log(`跳过(重复): ${totalSkipped}`);
  console.log(`错误数: ${errors}`);
  console.log("=".repeat(60));
}

// ==================== 单独抓取某个专业 ====================

async function crawlSingleMajor(major: string) {
  console.log(`\n🔍 抓取专业: ${major}\n`);

  let totalAdded = 0;

  for (const city of CITIES) {
    process.stdout.write(`  ${city.name}... `);
    
    const result = await fetchJobs(major, city.code, 1);
    let added = 0;

    for (const job of result.jobs) {
      const saved = await saveJob(job);
      if (saved) {
        added++;
        totalAdded++;
      }
    }

    console.log(`+${added}`);
    await delay(REQUEST_DELAY_MS);
  }

  console.log(`\n✓ 专业 ${major} 抓取完成，新增 ${totalAdded} 个职位\n`);
}

// ==================== CLI 入口 ====================

const args = process.argv.slice(2);

if (args.length > 0 && args[0] === "--help") {
  console.log(`
用法:
  npx tsx scripts/crawl-24365.ts           抓取所有专业+城市组合
  npx tsx scripts/crawl-24365.ts <专业名>  抓取单个专业
  npx tsx scripts/crawl-24365.ts --help    显示帮助

示例:
  npx tsx scripts/crawl-24365.ts 计算机科学与技术
  npx tsx scripts/crawl-24365.ts
  
环境变量:
  DATABASE_URL      数据库地址
  TURSO_AUTH_TOKEN Turso 认证 Token
  `);
  process.exit(0);
}

if (args.length > 0 && args[0] !== "--help") {
  // 单专业抓取
  crawlSingleMajor(args[0]).catch(console.error);
} else {
  // 全量抓取
  crawl24365()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
}
