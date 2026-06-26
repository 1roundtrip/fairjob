# FairJob 求职聚合平台 - 项目交接文档

> 文档版本: v2.0
> 更新日期: 2026-06-26
> 部署平台: Netlify + Turso (libSQL)

---

## 快速启动（5 分钟内跑起来）

```bash
# 1. 安装依赖
npm install

# 2. 初始化本地数据库
npm run db:push && npm run db:seed

# 3. 启动开发服务器
npm run dev

# 4. 打开浏览器
# http://localhost:3000
```

---

## 一、项目概述

### 1.1 项目简介
FairJob 是一个校招/社招岗位聚合平台，通过爬虫从多个来源（高校就业网、企业官网、招聘平台）抓取职位信息，统一展示和筛选。

**平台核心价值**: 打破算法推荐陷阱，让用户发现更多可能被算法隐藏的优质职位。

### 1.2 技术栈

| 层级 | 技术 |
|------|------|
| 前端框架 | Next.js 14.2.15 (App Router) + React 18 |
| UI 样式 | Tailwind CSS + 玻璃拟态极光主题 |
| 语言 | TypeScript 5.x |
| 数据库 | SQLite (本地开发，文件 `prisma/dev.db`) / Turso (生产环境，libSQL 协议) |
| ORM | Prisma 5.x (带 driverAdapters 预览功能) |
| 爬虫 | cheerio + axios + 自定义解析引擎 |
| 认证 | JWT (jose) + bcryptjs |
| 部署 | **Netlify** (主) / Vercel (备用，未使用) |
| 定时任务 | **GitHub Actions** (主) / Netlify Scheduled Functions (备用) |

> **数据库说明**: 本地通过 `@prisma/client` + `@prisma/adapter-libsql` 的 HTTP 连接方式访问远程 Turso 数据库，而非本地文件模式。关键依赖版本已锁定:
> ```json
> "@libsql/client": "0.8.0",
> "@prisma/adapter-libsql": "5.22.0"
> ```

### 1.3 核心功能
- ✅ 职位列表展示与筛选（城市、学历、薪资、来源等）
- ✅ 多源爬虫系统
  - 通用网页爬虫
  - RSS 爬虫
  - Bing 搜索发现
  - 招聘平台搜索发现
- ✅ 链接有效性自动验证
- ✅ 职位去重与合并（Dice 相似度算法）
- ✅ **收藏功能（本地存储，保护隐私）** - 收藏数据仅保存在用户本地设备
- ✅ 管理后台（需登录）
  - 职位审核
  - 数据源管理
  - 抓取日志统计
  - 网申事件管理
- ✅ 网申截止日历
- ✅ 随机发现职位（打破算法推荐）

---

## 二、项目结构

```
boos/
├── app/                          # Next.js App Router
│   ├── page.tsx                  # 首页（职位列表）
│   ├── layout.tsx                # 根布局
│   ├── globals.css               # 全局样式（极光+玻璃拟态）
│   ├── middleware.ts             # 路由中间件（管理员认证）
│   │
│   ├── admin/                    # 管理后台（无公开入口，需手动输入URL）
│   │   ├── login/page.tsx        # 登录页
│   │   ├── page.tsx              # 后台首页
│   │   ├── stats/page.tsx        # 数据统计
│   │   ├── review/page.tsx       # 职位审核
│   │   ├── sources/page.tsx      # 数据源管理
│   │   └── events/page.tsx       # 网申事件
│   │
│   ├── favorites/page.tsx        # 收藏页
│   ├── calendar/page.tsx         # 截止日历
│   ├── random/page.tsx           # 随机发现职位
│   │
│   └── api/                      # API 路由
│       ├── jobs/                 # 职位接口
│       ├── favorites/            # 收藏接口（已废弃，改用本地存储）
│       ├── stats/                # 统计接口
│       ├── health/               # 健康检查
│       ├── deadlines/today/      # 今日截止
│       ├── admin/                # 管理员接口
│       │   ├── login/
│       │   ├── logout/
│       │   ├── review/
│       │   ├── sources/
│       │   └── events/
│       └── cron/                 # 定时任务接口
│           ├── route.ts
│           ├── incremental-crawl/route.ts
│           ├── refresh/route.ts
│           ├── cleanup/route.ts
│           ├── education-backfill/route.ts
│           └── deadline-reminder/route.ts
│
├── components/                   # React 组件
│   ├── JobCard.tsx               # 职位卡片（含失效链接提示）
│   ├── FilterBar.tsx             # 筛选栏
│   ├── Navbar.tsx                # 导航栏
│   ├── FavoriteButton.tsx         # 收藏按钮
│   ├── EducationBadge.tsx         # 学历标签
│   ├── DeadlineWidget.tsx         # 截止日期小部件
│   └── NewCompaniesWidget.tsx     # 新公司小部件
│
├── lib/
│   ├── crawlers/                 # 爬虫模块
│   │   ├── base-crawler.ts       # 爬虫基类
│   │   ├── universal-web-crawler.ts  # 通用网页爬虫
│   │   ├── rss-crawler.ts        # RSS 爬虫
│   │   ├── crawl-scheduler.ts    # 抓取调度器
│   │   ├── bing-search-discovery.ts  # Bing 搜索发现
│   │   └── platform-discovery.ts # 招聘平台搜索发现
│   ├── parsers/                  # 解析模块
│   │   ├── universal-job-parser.ts   # 通用职位解析器
│   │   ├── education-extractor.ts    # 学历提取
│   │   └── location-date-extractor.ts # 地点日期提取
│   ├── services/                 # 服务层
│   │   ├── job-service.ts        # 职位服务
│   │   ├── event-service.ts      # 事件服务
│   │   └── monitoring.ts         # 监控服务
│   ├── prisma.ts                 # Prisma 客户端（Turso 适配）
│   ├── auth.ts                   # 认证工具
│   ├── constants.ts              # 常量定义
│   ├── cities.ts                 # 城市数据
│   ├── dice-similarity.ts        # Dice 相似度算法
│   └── utils.ts                  # 工具函数
│
├── prisma/
│   ├── schema.prisma             # 数据模型
│   └── seed.ts                   # 种子数据
│
├── scripts/
│   ├── init-full-scrape.ts       # 初始化全量抓取
│   ├── migrate-turso.ts          # Turso 迁移脚本
│   ├── verify-turso.ts           # Turso 验证
│   └── test-libsql.ts            # libSQL 测试
│
├── data/
│   └── enterprise_sites.yaml     # 企业网站配置
│
├── .github/workflows/cron.yml    # GitHub Actions 定时任务（主）
├── netlify.toml                  # Netlify 配置（主部署平台）
├── vercel.json                   # Vercel 配置（备用，未使用）
├── next.config.js                # Next.js 配置
├── tailwind.config.ts            # Tailwind 配置
├── tsconfig.json                 # TypeScript 配置
├── package.json                  # 依赖配置
└── .env.example                  # 环境变量示例
```

---

## 三、数据库设计

### 3.1 数据表

| 表名 | 说明 | 关键字段 |
|------|------|---------|
| `Job` | 正式职位 | id, title, company, location, salary, education, sourceUrl, confidence, failCount |
| `ReviewJob` | 待审核职位 | status (PENDING/APPROVED/REJECTED) |
| `Source` | 数据源 | name, url, type, parserType, isActive, crawlInterval |
| `CrawlLog` | 抓取日志 | jobsFound, jobsAdded, errorMessage, durationMs |
| `CompanyStat` | 公司统计 | companyName, jobCount, dayCount, avgJobsPerDay |
| `Event` | 网申事件 | company, title, deadlineDate, targetEducation, sourceUrl |
| `Favorite` | 收藏（已废弃） | 改用 localStorage |

> **Event 表说明**: `targetEducation` 字段区分本科/专科岗位，枚举值同职位学历，可为空表示不限学历。

### 3.2 枚举类型（TypeScript 层定义，DB 存 String）

**EducationLevel（学历要求）**:
- `BACHELOR_AND_ABOVE` - 本科及以上
- `BACHELOR_ONLY` - 仅本科
- `ASSOCIATE_AND_ABOVE` - 专科及以上
- `ASSOCIATE_ONLY` - 仅专科
- `NO_REQUIREMENT` - 不限
- `UNKNOWN` - 未知

**SourceType（数据源类型）**:
- `OFFICIAL_PLATFORM` - 官方平台
- `UNIVERSITY` - 高校就业网
- `ENTERPRISE` - 企业官网
- `RSS` - RSS 源
- `SEARCH` - 搜索发现
- `OTHER` - 其他

**ParserType（解析器类型）**:
- `RSS`
- `UNIVERSAL`
- `API`
- `MANUAL`

### 3.3 索引
- `Job.sourceUrl` (唯一索引，去重用)
- `Job.education`
- `Job.publishedAt`
- `Job.company + Job.title`
- `Job.confidence`
- `Job.createdAt`

---

## 四、环境变量

复制 `.env.example` 为 `.env.local` 并修改：

```bash
# 复制模板
cp .env.example .env.local
```

### 必需变量

| 变量名 | 说明 | 示例 |
|--------|------|------|
| `DATABASE_URL` | 数据库地址 | `file:./dev.db` (本地) / `libsql://...turso.io` (生产) |
| `TURSO_AUTH_TOKEN` | Turso 认证 Token | 生产环境必需 |
| `JWT_SECRET` | JWT 签名密钥 | 生产环境务必修改 |
| `ADMIN_USERNAME` | 管理员用户名 | `round` |
| `ADMIN_PASSWORD_HASH` | 管理员密码哈希 | bcrypt 哈希值 |

### 可选变量

| 变量名 | 说明 |
|--------|------|
| `BING_SEARCH_API_KEY` | Bing 搜索 API Key（发现新职位用） |
| `OPENAI_API_KEY` | OpenAI API Key（LLM 增强解析） |
| `BARK_WEBHOOK_URL` | Bark 推送告警 |
| `SERVERCHAN_SENDKEY` | Server酱推送告警 |
| `DINGTALK_WEBHOOK_URL` | 钉钉机器人告警 |
| `NEXT_PUBLIC_SITE_NAME` | 站点名称 |
| `NEXT_PUBLIC_SITE_URL` | 站点 URL |

### 生成密码哈希

```bash
node -e "const bcrypt = require('bcryptjs'); console.log(bcrypt.hashSync('your-password', 10))"
```

---

## 五、本地开发

### 5.1 环境要求
- Node.js >= 18
- npm 或 pnpm

### 5.2 安装依赖

```bash
# 进入项目目录
cd boos

# 安装依赖（会自动执行 prisma generate）
npm install
```

> 注意：`.npmrc` 已配置 `legacy-peer-deps=true` 解决依赖冲突

### 5.3 初始化数据库

```bash
# 推送 schema 到本地 SQLite
npm run db:push

# （可选）种子数据
npm run db:seed
```

### 5.4 启动开发服务器

```bash
npm run dev
```

访问: http://localhost:3000

### 5.5 数据库可视化

```bash
npm run db:studio
```

### 5.6 全量初始化抓取

```bash
# 本地数据库
npm run db:init

# 连接生产数据库
DATABASE_URL="libsql://..." TURSO_AUTH_TOKEN="..." npx tsx scripts/init-full-scrape.ts
```

---

## 六、爬虫系统

### 6.1 爬虫架构

```
CrawlScheduler (调度)
    │
    ├── UniversalWebCrawler (通用网页爬虫)
    │       └── UniversalJobParser (通用解析器)
    │
    ├── RssCrawler (RSS 爬虫)
    │
    ├── BingSearchDiscovery (Bing 搜索发现)
    │
    └── RecruitmentPlatformDiscovery (招聘平台发现)
```

### 6.2 通用职位解析器策略

不依赖固定 CSS 选择器，通过启发式算法适配：
1. **文本密度分析** - 找到信息密集区块
2. **链接重复模式** - 职位列表有大量结构相似的链接
3. **关键词定位** - "岗位"、"招聘"、"校招"等
4. **结构启发式** - 查找 `<ul>/<ol>/<table>` 等列表容器

### 6.3 支持的招聘平台（搜索发现）

| 平台 | 域名 | 方式 |
|------|------|------|
| BOSS直聘 | zhipin.com | Bing 搜索索引 |
| 猎聘 | liepin.com | Bing 搜索索引 |
| 前程无忧 | 51job.com | Bing 搜索索引 |
| 智联招聘 | zhaopin.com | Bing 搜索索引 |
| 拉勾网 | lagou.com | Bing 搜索索引 |
| 看准网 | kanzhun.com | Bing 搜索索引 |
| 牛客网 | nowcoder.com | Bing 搜索索引 |

### 6.4 内置数据源（20个）

**官方平台**: 国家24365、应届生求职网、智联招聘校招、牛客网校招  
**企业官网**: 华为、阿里、腾讯、字节跳动、百度、京东、美团、网易、小米  
**高校就业网**: 清华、北大、浙大、上海交大、复旦、人大

### 6.5 爬虫合规策略

- **默认请求间隔**: 8 秒
- **被动合规策略**:
  - 默认只抓取允许爬虫的高校就业网和官方平台
  - 对企业官网启用 robots.txt 检查（若可获取）
  - 对搜索引擎发现的结果仅缓存其公开索引页面
- **绝对禁止**:
  - 不绕过 IP 封锁、验证码
  - 不尝试绕过任何反爬机制
  - 不抓取需要登录的页面

---

## 七、定时任务

> **当前生产环境使用 GitHub Actions 触发定时任务，Netlify Scheduled Functions 作为备用方案。**

### 7.1 定时任务列表

| 任务 | 路径 | 说明 |
|------|------|------|
| 增量抓取 | `/api/cron/incremental-crawl` | 抓取活跃数据源的新职位 |
| 链接验证 | `/api/cron/refresh` | 验证已有职位链接有效性，清理失效链接 |
| 学历回填 | `/api/cron/education-backfill` | 补全未知学历的职位 |
| 数据清理 | `/api/cron/cleanup` | 清理过期/低置信度数据 |
| 截止提醒 | `/api/cron/deadline-reminder` | 网申截止日期提醒 |

### 7.2 链接验证机制

- 验证范围: 7 天内的职位
- 验证方式: GET 请求（比 HEAD 更准确）
- 优先验证: 已有失败记录的职位（可疑链接）
- 每轮验证: 100 个职位（30 可疑 + 70 新）
- 删除阈值: 连续失败 2 次 或 置信度 <= 0.2
- 超时时间: 10 秒

### 7.3 触发方式

**方式 1: GitHub Actions** (`.github/workflows/cron.yml`) - **当前使用**  
**方式 2: Netlify Scheduled Functions** - 备用  
**方式 3: 手动调用 API**

```bash
# 手动触发刷新
curl -X POST https://your-domain/api/cron/refresh
```

---

## 八、管理后台

> **重要**: `/admin` 路径无公开入口，需手动输入 URL 访问，以减少被扫描风险。

### 8.1 访问路径
- 登录页: `/admin/login`
- 后台首页: `/admin`
- 数据统计: `/admin/stats`
- 职位审核: `/admin/review`
- 数据源: `/admin/sources`
- 网申事件: `/admin/events`

### 8.2 默认账号

> ⚠️ **严重安全警告**: 此密码仅用于本地测试。**部署到公网前，必须通过 `ADMIN_PASSWORD_HASH` 环境变量设置强密码**，否则管理后台将完全暴露。

- 用户名: `round`
- 密码: `round`

### 8.3 认证机制
- 登录成功后签发 JWT Token
- Token 存储在 HTTP-only Cookie 中
- 通过 Next.js Middleware 保护 `/admin` 路由
- 使用 `jose` 库进行 JWT 验证

---

## 九、前端功能

### 9.1 页面列表

| 页面 | 路径 | 说明 |
|------|------|------|
| 首页 | `/` | 职位列表 + 筛选 |
| 收藏 | `/favorites` | 我的收藏（本地存储） |
| 日历 | `/calendar` | 网申截止日历 |
| 随机发现 | `/random` | 随机发现职位（打破算法推荐） |
| 管理后台 | `/admin` | 管理员功能（需登录） |

> **前端免责声明**: 本网站所有职位信息均源于网络公开页面，仅作聚合展示，不对信息真实性负责。请以各企业官网发布为准。

### 9.2 筛选功能
- 城市/省份筛选（两级联动）
- 学历筛选
- 薪资排序
- 来源筛选
- 关键词搜索

### 9.3 收藏功能
- **纯本地存储** (localStorage)，保护隐私
- 存储 Key: `fairjob_favs_full`
- 跨标签页同步 (storage event)
- 数据仅保存在当前设备

### 9.4 失效链接提示
- 有失败记录的职位显示 **⚠ 待验证** 徽章
- 卡片边框变琥珀色
- 点击时弹出确认弹窗，提示可能 404
- 用户可选择"仍要访问"或"取消"

### 9.5 UI 设计
- **主题**: 极光背景 + 玻璃拟态 (Glassmorphism)
- **配色**: 深色背景 + 紫色/粉色渐变点缀
- **字体**: 系统默认无衬线字体

---

## 十、生产部署

### 10.1 当前部署
- **平台**: Netlify
- **数据库**: Turso (libSQL)
- **域名**: https://adorable-fox-7f0ffb.netlify.app

### 10.2 部署步骤

#### 1. 准备 Turso 数据库

```bash
# 安装 Turso CLI
curl -sSfL https://get.tur.so/install.sh | bash

# 登录
turso auth login

# 创建数据库
turso db create fairjob

# 获取数据库 URL 和 Token
turso db show fairjob
turso db tokens create fairjob
```

#### 2. 推送数据库 Schema

```bash
DATABASE_URL="libsql://your-db.turso.io" \
TURSO_AUTH_TOKEN="your-token" \
npx prisma db push
```

#### 3. 部署到 Netlify

```bash
# 安装 Netlify CLI
npm install -g netlify-cli

# 登录
netlify login

# 初始化项目
netlify init

# 配置环境变量
netlify env:set DATABASE_URL "libsql://..."
netlify env:set TURSO_AUTH_TOKEN "..."
netlify env:set JWT_SECRET "your-secret"
netlify env:set ADMIN_USERNAME "round"
netlify env:set ADMIN_PASSWORD_HASH "..."

# 部署
netlify deploy --prod
```

#### 4. 配置定时任务

当前使用 GitHub Actions (`.github/workflows/cron.yml`)，无需额外配置。

### 10.3 部署验证

```bash
# 健康检查
curl https://your-domain/api/health

# 查看统计
curl https://your-domain/api/stats
```

---

## 十一、常见问题

### 11.1 构建失败

**问题**: `@prisma/client` 类型错误  
**解决**: 重新生成 Prisma Client
```bash
npx prisma generate
```

**问题**: 依赖冲突 (peer deps)  
**解决**: `.npmrc` 已配置 `legacy-peer-deps=true`，如仍有问题尝试：
```bash
rm -rf node_modules package-lock.json
npm install
```

### 11.2 数据库连接失败

**问题**: 本地开发连不上 Turso  
**解决**: 检查网络/代理，或改用本地 SQLite
```bash
# .env.local 中设置
DATABASE_URL="file:./dev.db"
```

### 11.3 职位数据太少

**解决方式**:
1. 运行全量初始化脚本 `npm run db:init`
2. 配置 Bing Search API Key 启用搜索发现
3. 在管理后台添加更多数据源
4. 手动触发增量抓取 `/api/cron/incremental-crawl`

### 11.4 链接经常 404

**说明**: 已有自动验证机制，每半小时清理一次失效链接
- 验证范围: 7 天内
- 删除阈值: 连续失败 2 次
- 前端有失效提示，用户可提前感知

### 11.5 管理后台登录失败

**检查**:
1. 账号密码是否正确（默认 round / round）
2. `ADMIN_PASSWORD_HASH` 是否为正确的 bcrypt 哈希
3. `JWT_SECRET` 是否已设置

**重置密码**:
```bash
# 生成新哈希
node -e "const bcrypt = require('bcryptjs'); console.log(bcrypt.hashSync('new-password', 10))"

# 更新环境变量
netlify env:set ADMIN_PASSWORD_HASH "新哈希值"
```

---

## 十二、关键文件速查

| 功能 | 文件路径 |
|------|----------|
| 数据模型 | [prisma/schema.prisma](file:///c:/Users/s1258/Documents/boos/prisma/schema.prisma) |
| 职位服务 | [lib/services/job-service.ts](file:///c:/Users/s1258/Documents/boos/lib/services/job-service.ts) |
| 通用解析器 | [lib/parsers/universal-job-parser.ts](file:///c:/Users/s1258/Documents/boos/lib/parsers/universal-job-parser.ts) |
| 抓取调度器 | [lib/crawlers/crawl-scheduler.ts](file:///c:/Users/s1258/Documents/boos/lib/crawlers/crawl-scheduler.ts) |
| 链接验证 | [app/api/cron/refresh/route.ts](file:///c:/Users/s1258/Documents/boos/app/api/cron/refresh/route.ts) |
| 招聘平台发现 | [lib/crawlers/platform-discovery.ts](file:///c:/Users/s1258/Documents/boos/lib/crawlers/platform-discovery.ts) |
| 职位卡片 | [components/JobCard.tsx](file:///c:/Users/s1258/Documents/boos/components/JobCard.tsx) |
| 收藏按钮 | [components/FavoriteButton.tsx](file:///c:/Users/s1258/Documents/boos/components/FavoriteButton.tsx) |
| 认证中间件 | [middleware.ts](file:///c:/Users/s1258/Documents/boos/middleware.ts) |
| 全局样式 | [app/globals.css](file:///c:/Users/s1258/Documents/boos/app/globals.css) |
| 环境变量示例 | [.env.example](file:///c:/Users/s1258/Documents/boos/.env.example) |

---

## 十三、运维清单

### 日常检查
- [ ] 职位数量是否正常增长
- [ ] 抓取成功率（后台统计页）
- [ ] 失效链接比例
- [ ] 数据库空间使用

### 每月维护
- [ ] 清理过期职位（30天以上）
- [ ] 检查数据源有效性
- [ ] 更新密码和密钥（安全）
- [ ] **备份数据库**:
  ```bash
  # Turso 数据库备份（生成快照）
  turso db create fairjob-backup-$(date +%Y%m%d) --from fairjob
  ```

### 部署确认
- [ ] 确认 `vercel.json` 未干扰 Netlify 构建
- [ ] 确认定时任务在 GitHub Actions 正常运行

### 性能优化建议
- 增加 Redis 缓存热门查询
- 使用 CDN 加速静态资源
- 数据库索引优化
- 爬虫并发控制

---

## 十四、联系方式

如有技术问题，可参考：
- Next.js 文档: https://nextjs.org/docs
- Prisma 文档: https://www.prisma.io/docs
- Turso 文档: https://docs.turso.tech
- Netlify 文档: https://docs.netlify.com

---

*文档结束*
