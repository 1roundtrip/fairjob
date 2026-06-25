/**
 * FairJob 种子数据脚本
 *
 * 生成 50+ 条示例职位数据，覆盖:
 * - 6 种学历类型
 * - 5 种来源类型
 * - 多个城市
 * - 不同职位类型（校招/实习/社招）
 * - 7 条网申截止事件
 *
 * 运行方式: npx tsx prisma/seed.ts
 * 或: npm run db:seed
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// 学历常量（与 EducationLevel 枚举对应，存储为 String）
const EDU = {
  BACHELOR_AND_ABOVE: "BACHELOR_AND_ABOVE",
  BACHELOR_ONLY: "BACHELOR_ONLY",
  ASSOCIATE_AND_ABOVE: "ASSOCIATE_AND_ABOVE",
  ASSOCIATE_ONLY: "ASSOCIATE_ONLY",
  NO_REQUIREMENT: "NO_REQUIREMENT",
  UNKNOWN: "UNKNOWN",
};

// 来源类型常量
const SOURCE_TYPE = {
  OFFICIAL_PLATFORM: "OFFICIAL_PLATFORM",
  UNIVERSITY: "UNIVERSITY",
  ENTERPRISE: "ENTERPRISE",
  RSS: "RSS",
  SEARCH: "SEARCH",
  OTHER: "OTHER",
};

// 解析器类型常量
const PARSER_TYPE = {
  RSS: "RSS",
  UNIVERSAL: "UNIVERSAL",
  API: "API",
  MANUAL: "MANUAL",
};

// 审核状态常量
const REVIEW_STATUS = {
  PENDING: "PENDING",
  APPROVED: "APPROVED",
  REJECTED: "REJECTED",
};

// 数据源配置
const sources = [
  {
    name: "国家24365平台",
    url: "https://job.ncss.cn/",
    type: SOURCE_TYPE.OFFICIAL_PLATFORM,
    parserType: PARSER_TYPE.UNIVERSAL,
    isActive: true,
    crawlInterval: 120,
    successCount: 15,
    failCount: 0,
    totalJobs: 120,
  },
  {
    name: "清华大学就业信息网",
    url: "https://career.tsinghua.edu.cn/",
    type: SOURCE_TYPE.UNIVERSITY,
    parserType: PARSER_TYPE.UNIVERSAL,
    isActive: true,
    crawlInterval: 360,
    successCount: 23,
    failCount: 1,
    totalJobs: 89,
  },
  {
    name: "北京大学就业指导中心",
    url: "https://scc.pku.edu.cn/",
    type: SOURCE_TYPE.UNIVERSITY,
    parserType: PARSER_TYPE.UNIVERSAL,
    isActive: true,
    crawlInterval: 360,
    successCount: 18,
    failCount: 2,
    totalJobs: 76,
  },
  {
    name: "华为校园招聘",
    url: "https://career.huawei.com/",
    type: SOURCE_TYPE.ENTERPRISE,
    parserType: PARSER_TYPE.UNIVERSAL,
    isActive: true,
    crawlInterval: 720,
    successCount: 31,
    failCount: 0,
    totalJobs: 210,
  },
  {
    name: "字节跳动招聘",
    url: "https://jobs.bytedance.com/",
    type: SOURCE_TYPE.ENTERPRISE,
    parserType: PARSER_TYPE.UNIVERSAL,
    isActive: true,
    crawlInterval: 720,
    successCount: 28,
    failCount: 0,
    totalJobs: 195,
  },
  {
    name: "应届生求职网 RSS",
    url: "https://www.yingjiesheng.com/",
    type: SOURCE_TYPE.RSS,
    parserType: PARSER_TYPE.RSS,
    isActive: true,
    crawlInterval: 180,
    successCount: 42,
    failCount: 3,
    totalJobs: 310,
  },
  {
    name: "Bing 搜索发现",
    url: "https://www.bing.com/",
    type: SOURCE_TYPE.SEARCH,
    parserType: PARSER_TYPE.API,
    isActive: false,
    crawlInterval: 1440,
    successCount: 5,
    failCount: 2,
    totalJobs: 28,
  },
];

// 职位数据模板
const jobTemplates = [
  // 本科及以上 - 大厂技术岗
  { company: "华为技术有限公司", title: "算法工程师（2026届校招）", education: EDU.BACHELOR_AND_ABOVE, location: "深圳", jobType: "校招", salary: "25-35K", source: "华为校园招聘", sourceUrl: "https://career.huawei.com/reccampportal/portal5/campus-recruitment.html" },
  { company: "华为技术有限公司", title: "软件研发工程师", education: EDU.BACHELOR_AND_ABOVE, location: "上海", jobType: "校招", salary: "20-30K", source: "华为校园招聘", sourceUrl: "https://career.huawei.com/reccampportal/job1" },
  { company: "华为技术有限公司", title: "硬件开发工程师", education: EDU.BACHELOR_AND_ABOVE, location: "东莞", jobType: "校招", salary: "22-28K", source: "华为校园招聘", sourceUrl: "https://career.huawei.com/reccampportal/job2" },
  { company: "字节跳动", title: "后端开发工程师（2026春招）", education: EDU.BACHELOR_AND_ABOVE, location: "北京", jobType: "校招", salary: "30-45K", source: "字节跳动招聘", sourceUrl: "https://jobs.bytedance.com/campus/position/1" },
  { company: "字节跳动", title: "前端开发工程师", education: EDU.BACHELOR_AND_ABOVE, location: "杭州", jobType: "校招", salary: "25-40K", source: "字节跳动招聘", sourceUrl: "https://jobs.bytedance.com/campus/position/2" },
  { company: "字节跳动", title: "产品经理", education: EDU.BACHELOR_AND_ABOVE, location: "北京", jobType: "校招", salary: "25-35K", source: "字节跳动招聘", sourceUrl: "https://jobs.bytedance.com/campus/position/3" },
  { company: "腾讯科技", title: "后台开发工程师（校招）", education: EDU.BACHELOR_AND_ABOVE, location: "深圳", jobType: "校招", salary: "28-42K", source: "Bing 搜索发现", sourceUrl: "https://join.qq.com/post/1" },
  { company: "阿里巴巴", title: "Java 开发工程师", education: EDU.BACHELOR_AND_ABOVE, location: "杭州", jobType: "校招", salary: "25-40K", source: "Bing 搜索发现", sourceUrl: "https://talent.alibaba.com/post/1" },
  { company: "美团", title: "后端开发工程师", education: EDU.BACHELOR_AND_ABOVE, location: "北京", jobType: "校招", salary: "25-35K", source: "应届生求职网 RSS", sourceUrl: "https://zhaopin.meituan.com/1" },
  { company: "京东", title: "算法工程师（NLP方向）", education: EDU.BACHELOR_AND_ABOVE, location: "北京", jobType: "校招", salary: "30-45K", source: "应届生求职网 RSS", sourceUrl: "https://zhaopin.jd.com/1" },
  { company: "小米科技", title: "嵌入式开发工程师", education: EDU.BACHELOR_AND_ABOVE, location: "北京", jobType: "校招", salary: "20-30K", source: "Bing 搜索发现", sourceUrl: "https://www.xiaomi.com/about/join/1" },

  // 仅本科 - 一些中型企业
  { company: "用友网络", title: "实施顾问", education: EDU.BACHELOR_ONLY, location: "北京", jobType: "校招", salary: "10-15K", source: "国家24365平台", sourceUrl: "https://job.ncss.cn/job/1" },
  { company: "金山办公", title: "产品运营", education: EDU.BACHELOR_ONLY, location: "珠海", jobType: "校招", salary: "12-18K", source: "国家24365平台", sourceUrl: "https://job.ncss.cn/job/2" },
  { company: "科大讯飞", title: "测试开发工程师", education: EDU.BACHELOR_ONLY, location: "合肥", jobType: "校招", salary: "15-22K", source: "清华大学就业信息网", sourceUrl: "https://career.tsinghua.edu.cn/job/1" },
  { company: "用友网络", title: "前端开发工程师", education: EDU.BACHELOR_ONLY, location: "上海", jobType: "校招", salary: "12-20K", source: "国家24365平台", sourceUrl: "https://job.ncss.cn/job/3" },
  { company: "广联达", title: "BIM工程师", education: EDU.BACHELOR_ONLY, location: "北京", jobType: "校招", salary: "12-18K", source: "清华大学就业信息网", sourceUrl: "https://career.tsinghua.edu.cn/job/2" },

  // 专科及以上 - 技术支持/运维/销售
  { company: "中国移动", title: "网络运维工程师", education: EDU.ASSOCIATE_AND_ABOVE, location: "北京", jobType: "校招", salary: "8-12K", source: "国家24365平台", sourceUrl: "https://job.ncss.cn/job/4" },
  { company: "中国联通", title: "客户经理", education: EDU.ASSOCIATE_AND_ABOVE, location: "上海", jobType: "校招", salary: "7-10K", source: "国家24365平台", sourceUrl: "https://job.ncss.cn/job/5" },
  { company: "中国电信", title: "客户服务代表", education: EDU.ASSOCIATE_AND_ABOVE, location: "广州", jobType: "校招", salary: "6-9K", source: "国家24365平台", sourceUrl: "https://job.ncss.cn/job/6" },
  { company: "顺丰速运", title: "运营管培生", education: EDU.ASSOCIATE_AND_ABOVE, location: "深圳", jobType: "校招", salary: "8-12K", source: "应届生求职网 RSS", sourceUrl: "https://www.sf-express.com/job/1" },
  { company: "京东物流", title: "仓储管理专员", education: EDU.ASSOCIATE_AND_ABOVE, location: "北京", jobType: "校招", salary: "7-10K", source: "应届生求职网 RSS", sourceUrl: "https://zhaopin.jd.com/logistics/1" },
  { company: "比亚迪", title: "生产管理培训生", education: EDU.ASSOCIATE_AND_ABOVE, location: "深圳", jobType: "校招", salary: "7-11K", source: "Bing 搜索发现", sourceUrl: "https://job.byd.com/1" },
  { company: "富士康", title: "品质管理工程师", education: EDU.ASSOCIATE_AND_ABOVE, location: "郑州", jobType: "校招", salary: "6-9K", source: "Bing 搜索发现", sourceUrl: "https://www.foxconn.com/job/1" },
  { company: "海尔集团", title: "售后服务工程师", education: EDU.ASSOCIATE_AND_ABOVE, location: "青岛", jobType: "校招", salary: "7-10K", source: "北京大学就业指导中心", sourceUrl: "https://scc.pku.edu.cn/job/1" },
  { company: "美的集团", title: "供应链管理", education: EDU.ASSOCIATE_AND_ABOVE, location: "佛山", jobType: "校招", salary: "8-12K", source: "北京大学就业指导中心", sourceUrl: "https://scc.pku.edu.cn/job/2" },

  // 仅专科 - 一线岗位
  { company: "海底捞", title: "储备店长", education: EDU.ASSOCIATE_ONLY, location: "北京", jobType: "校招", salary: "6-8K", source: "应届生求职网 RSS", sourceUrl: "https://www.haidilao.com/job/1" },
  { company: "星巴克", title: "店经理培训生", education: EDU.ASSOCIATE_ONLY, location: "上海", jobType: "校招", salary: "6-9K", source: "应届生求职网 RSS", sourceUrl: "https://www.starbucks.com.cn/careers/1" },
  { company: "优衣库", title: "店铺储备干部", education: EDU.ASSOCIATE_ONLY, location: "广州", jobType: "校招", salary: "7-10K", source: "国家24365平台", sourceUrl: "https://job.ncss.cn/job/7" },
  { company: "名创优品", title: "店长助理", education: EDU.ASSOCIATE_ONLY, location: "深圳", jobType: "校招", salary: "6-9K", source: "Bing 搜索发现", sourceUrl: "https://www.miniso.com/job/1" },
  { company: "德邦快递", title: "物流管培生", education: EDU.ASSOCIATE_ONLY, location: "上海", jobType: "校招", salary: "7-10K", source: "Bing 搜索发现", sourceUrl: "https://www.deppon.com/job/1" },

  // 不限学历 - 销售/客服/餐饮
  { company: "链家地产", title: "房产经纪人", education: EDU.NO_REQUIREMENT, location: "北京", jobType: "社招", salary: "底薪5K+提成", source: "应届生求职网 RSS", sourceUrl: "https://www.lianjia.com/zhaopin/1" },
  { company: "平安保险", title: "保险销售顾问", education: EDU.NO_REQUIREMENT, location: "上海", jobType: "社招", salary: "底薪4K+提成", source: "应届生求职网 RSS", sourceUrl: "https://www.pingan.com/job/1" },
  { company: "字节跳动", title: "内容审核专员", education: EDU.NO_REQUIREMENT, location: "济南", jobType: "社招", salary: "6-9K", source: "字节跳动招聘", sourceUrl: "https://jobs.bytedance.com/position/4" },
  { company: "美团", title: "外卖运营专员", education: EDU.NO_REQUIREMENT, location: "成都", jobType: "社招", salary: "5-8K", source: "应届生求职网 RSS", sourceUrl: "https://zhaopin.meituan.com/2" },
  { company: "小米科技", title: "客服专员", education: EDU.NO_REQUIREMENT, location: "武汉", jobType: "社招", salary: "5-7K", source: "Bing 搜索发现", sourceUrl: "https://www.xiaomi.com/about/join/2" },

  // 未知学历 - 待审核
  { company: "某科技公司", title: "软件开发工程师（急招）", education: EDU.UNKNOWN, location: "北京", jobType: "社招", salary: "20-35K", source: "Bing 搜索发现", sourceUrl: "https://example.com/job/1" },
  { company: "某互联网公司", title: "产品经理助理", education: EDU.UNKNOWN, location: "上海", jobType: "实习", salary: "150-200/天", source: "Bing 搜索发现", sourceUrl: "https://example.com/job/2" },
  { company: "某创业公司", title: "全栈开发工程师", education: EDU.UNKNOWN, location: "深圳", jobType: "社招", salary: "18-30K", source: "应届生求职网 RSS", sourceUrl: "https://example.com/job/3" },

  // 实习岗
  { company: "腾讯科技", title: "后端开发实习生", education: EDU.BACHELOR_AND_ABOVE, location: "深圳", jobType: "实习", salary: "300-400/天", source: "清华大学就业信息网", sourceUrl: "https://join.qq.com/intern/1" },
  { company: "阿里巴巴", title: "算法实习生", education: EDU.BACHELOR_AND_ABOVE, location: "杭州", jobType: "实习", salary: "350-500/天", source: "清华大学就业信息网", sourceUrl: "https://talent.alibaba.com/intern/1" },
  { company: "字节跳动", title: "产品实习生", education: EDU.BACHELOR_AND_ABOVE, location: "北京", jobType: "实习", salary: "250-350/天", source: "北京大学就业指导中心", sourceUrl: "https://jobs.bytedance.com/intern/1" },
  { company: "美团", title: "运营实习生", education: EDU.ASSOCIATE_AND_ABOVE, location: "北京", jobType: "实习", salary: "150-200/天", source: "北京大学就业指导中心", sourceUrl: "https://zhaopin.meituan.com/intern/1" },
  { company: "小米科技", title: "市场实习生", education: EDU.NO_REQUIREMENT, location: "北京", jobType: "实习", salary: "120-180/天", source: "Bing 搜索发现", sourceUrl: "https://www.xiaomi.com/about/join/3" },

  // 更多本科以上岗位，保证数量
  { company: "网易", title: "游戏策划（校招）", education: EDU.BACHELOR_AND_ABOVE, location: "杭州", jobType: "校招", salary: "20-30K", source: "应届生求职网 RSS", sourceUrl: "https://campus.163.com/job/1" },
  { company: "网易", title: "Java 开发工程师", education: EDU.BACHELOR_AND_ABOVE, location: "广州", jobType: "校招", salary: "22-32K", source: "应届生求职网 RSS", sourceUrl: "https://campus.163.com/job/2" },
  { company: "百度", title: "搜索算法工程师", education: EDU.BACHELOR_AND_ABOVE, location: "北京", jobType: "校招", salary: "28-42K", source: "清华大学就业信息网", sourceUrl: "https://talent.baidu.com/job/1" },
  { company: "百度", title: "前端开发工程师", education: EDU.BACHELOR_AND_ABOVE, location: "北京", jobType: "校招", salary: "25-35K", source: "清华大学就业信息网", sourceUrl: "https://talent.baidu.com/job/2" },
  { company: "拼多多", title: "后端开发工程师", education: EDU.BACHELOR_AND_ABOVE, location: "上海", jobType: "校招", salary: "30-45K", source: "Bing 搜索发现", sourceUrl: "https://www.pinduoduo.com/careers/1" },
  { company: "快手", title: "算法工程师", education: EDU.BACHELOR_AND_ABOVE, location: "北京", jobType: "校招", salary: "28-42K", source: "Bing 搜索发现", sourceUrl: "https://zhaopin.kuaishou.cn/1" },
  { company: "滴滴出行", title: "数据分析师", education: EDU.BACHELOR_AND_ABOVE, location: "北京", jobType: "校招", salary: "22-32K", source: "北京大学就业指导中心", sourceUrl: "https://zhaopin.didiglobal.com/1" },
  { company: "小红书", title: "社区运营", education: EDU.BACHELOR_ONLY, location: "上海", jobType: "校招", salary: "15-22K", source: "Bing 搜索发现", sourceUrl: "https://www.xiaohongshu.com/careers/1" },
];

// 网申截止事件
const eventTemplates = [
  { company: "华为技术有限公司", title: "2026届春招-研发类", deadlineDays: 3, targetEducation: EDU.BACHELOR_AND_ABOVE, sourceUrl: "https://career.huawei.com/reccampportal/portal5/campus-recruitment.html" },
  { company: "字节跳动", title: "2026春季校园招聘", deadlineDays: 7, targetEducation: EDU.BACHELOR_AND_ABOVE, sourceUrl: "https://jobs.bytedance.com/campus" },
  { company: "腾讯科技", title: "2026实习生招聘", deadlineDays: 5, targetEducation: EDU.BACHELOR_AND_ABOVE, sourceUrl: "https://join.qq.com/" },
  { company: "阿里巴巴", title: "2026届校招-技术类", deadlineDays: 10, targetEducation: EDU.BACHELOR_AND_ABOVE, sourceUrl: "https://talent.alibaba.com/campus" },
  { company: "中国移动", title: "2026春季校园招聘", deadlineDays: 12, targetEducation: EDU.ASSOCIATE_AND_ABOVE, sourceUrl: "https://job.10086.cn/" },
  { company: "中国邮政储蓄银行", title: "2026年度春季校招", deadlineDays: 14, targetEducation: EDU.BACHELOR_AND_ABOVE, sourceUrl: "https://www.psbc.com/cn/rczp/" },
  { company: "比亚迪", title: "2026届校招-生产管理", deadlineDays: 8, targetEducation: EDU.ASSOCIATE_AND_ABOVE, sourceUrl: "https://job.byd.com/" },
];

async function main() {
  console.log("🌱 开始填充种子数据...");

  // 1. 清空旧数据
  console.log("清理旧数据...");
  await prisma.favorite.deleteMany();
  await prisma.event.deleteMany();
  await prisma.crawlLog.deleteMany();
  await prisma.reviewJob.deleteMany();
  await prisma.job.deleteMany();
  await prisma.source.deleteMany();
  await prisma.companyStat.deleteMany();

  // 2. 创建数据源
  console.log("创建数据源...");
  const createdSources = await Promise.all(
    sources.map((s) => prisma.source.create({ data: s }))
  );
  console.log(`  ✓ ${createdSources.length} 个数据源已创建`);

  // 3. 创建职位
  console.log("创建职位...");
  const sourceMap = new Map(createdSources.map((s) => [s.name, s]));

  let jobCount = 0;
  const now = Date.now();

  for (let i = 0; i < jobTemplates.length; i++) {
    const template = jobTemplates[i];
    const source = sourceMap.get(template.source);

    // 随机生成发布时间（最近 7 天内）
    const daysAgo = Math.floor(Math.random() * 7);
    const hoursAgo = Math.floor(Math.random() * 24);
    const publishedAt = new Date(now - daysAgo * 86400000 - hoursAgo * 3600000);

    // 计算置信度
    let confidence = 0.3; // 标题+公司+链接
    if (template.location) confidence += 0.1;
    if (template.education !== EDU.UNKNOWN) confidence += 0.2;
    confidence += Math.random() * 0.2; // 加一点随机
    confidence = Math.min(confidence, 1);

    await prisma.job.create({
      data: {
        title: template.title,
        company: template.company,
        location: template.location,
        salary: template.salary,
        education: template.education,
        jobType: template.jobType,
        publishedAt,
        sourceId: source?.id,
        sourceName: template.source,
        sourceUrl: template.sourceUrl,
        confidence: Math.round(confidence * 100) / 100,
        description: `${template.company} ${template.title} 职位详情。\n工作职责：\n1. 负责相关模块开发\n2. 参与需求讨论\n3. 编写技术文档\n\n任职要求：\n${template.education === EDU.UNKNOWN ? "学历要求见官网" : getEduDescription(template.education)}`,
        requirements: template.education === EDU.UNKNOWN ? "详见官网" : getEduDescription(template.education),
      },
    });
    jobCount++;
  }
  console.log(`  ✓ ${jobCount} 个职位已创建`);

  // 4. 统计公司数据
  console.log("计算公司统计...");
  const companyJobs: Record<string, { count: number; firstSeen: Date; lastSeen: Date }> = {};
  for (const job of jobTemplates) {
    if (!companyJobs[job.company]) {
      companyJobs[job.company] = { count: 0, firstSeen: new Date(now - 7 * 86400000), lastSeen: new Date() };
    }
    companyJobs[job.company].count++;
  }
  for (const [company, data] of Object.entries(companyJobs)) {
    const dayCount = Math.max(1, Math.ceil((data.lastSeen.getTime() - data.firstSeen.getTime()) / 86400000));
    await prisma.companyStat.create({
      data: {
        companyName: company,
        jobCount: data.count,
        dayCount,
        avgJobsPerDay: Math.round((data.count / dayCount) * 100) / 100,
        lastSeen: data.lastSeen,
      },
    });
  }
  console.log(`  ✓ ${Object.keys(companyJobs).length} 家公司统计已生成`);

  // 5. 创建网申截止事件
  console.log("创建网申截止事件...");
  const eventCount = await Promise.all(
    eventTemplates.map((e) => {
      const deadlineDate = new Date(now + e.deadlineDays * 86400000);
      return prisma.event.create({
        data: {
          company: e.company,
          title: e.title,
          deadlineDate,
          targetEducation: e.targetEducation,
          sourceUrl: e.sourceUrl,
          note: `点击链接查看详情并投递`,
        },
      });
    })
  );
  console.log(`  ✓ ${eventCount.length} 个网申截止事件已创建`);

  // 6. 创建几条待审核职位
  console.log("创建待审核职位...");
  const reviewJobs = [
    {
      title: "高级前端工程师",
      company: "某独角兽公司",
      location: "北京",
      education: EDU.UNKNOWN,
      sourceUrl: "https://example.com/review/1",
      confidence: 0.4,
      description: "岗位职责：负责前端架构设计与开发。要求：3年以上经验，熟悉React/Vue。",
      requirements: "学历要求未明确",
    },
    {
      title: "Java后端开发",
      company: "某金融科技公司",
      location: "上海",
      education: EDU.UNKNOWN,
      sourceUrl: "https://example.com/review/2",
      confidence: 0.45,
      description: "要求：熟悉Spring Boot，有微服务经验优先。",
      requirements: "本科或以上学历优先",
    },
  ];
  for (const rj of reviewJobs) {
    await prisma.reviewJob.create({ data: rj });
  }
  console.log(`  ✓ ${reviewJobs.length} 个待审核职位已创建`);

  // 7. 创建几条抓取日志
  console.log("创建抓取日志...");
  const logSources = createdSources.slice(0, 4);
  for (const src of logSources) {
    await prisma.crawlLog.create({
      data: {
        sourceId: src.id,
        sourceName: src.name,
        jobsFound: Math.floor(Math.random() * 50) + 10,
        jobsAdded: Math.floor(Math.random() * 30) + 5,
        jobsMerged: Math.floor(Math.random() * 10),
        jobsReview: Math.floor(Math.random() * 5),
        durationMs: Math.floor(Math.random() * 30000) + 5000,
        createdAt: new Date(now - Math.floor(Math.random() * 86400000)),
      },
    });
  }
  console.log(`  ✓ ${logSources.length} 条抓取日志已创建`);

  // 8. 输出统计
  console.log("\n📊 种子数据统计：");
  const eduStats = await Promise.all(
    Object.values(EDU).map(async (edu) => ({
      edu,
      count: await prisma.job.count({ where: { education: edu } }),
    }))
  );
  console.log("\n  学历分布：");
  for (const s of eduStats) {
    console.log(`    ${getEduLabel(s.edu)}: ${s.count} 条`);
  }

  const sourceStats = await prisma.source.findMany({
    select: { name: true, type: true, totalJobs: true },
    orderBy: { totalJobs: "desc" },
  });
  console.log("\n  来源岗位数：");
  for (const s of sourceStats) {
    console.log(`    ${s.name}: ${s.totalJobs} 条`);
  }

  console.log("\n✅ 种子数据填充完成！");
}

function getEduDescription(edu: string): string {
  switch (edu) {
    case EDU.BACHELOR_AND_ABOVE:
      return "本科及以上学历，985/211优先";
    case EDU.BACHELOR_ONLY:
      return "仅限本科学历";
    case EDU.ASSOCIATE_AND_ABOVE:
      return "大专及以上学历";
    case EDU.ASSOCIATE_ONLY:
      return "仅限大专学历";
    case EDU.NO_REQUIREMENT:
      return "学历不限，经验优先";
    default:
      return "学历要求见官网";
  }
}

function getEduLabel(edu: string): string {
  const map: Record<string, string> = {
    BACHELOR_AND_ABOVE: "本科及以上",
    BACHELOR_ONLY: "仅本科",
    ASSOCIATE_AND_ABOVE: "专科及以上",
    ASSOCIATE_ONLY: "仅专科",
    NO_REQUIREMENT: "不限",
    UNKNOWN: "未知/待审核",
  };
  return map[edu] || edu;
}

main()
  .catch((e) => {
    console.error("❌ 种子数据填充失败:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
