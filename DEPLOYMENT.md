# FairJob 公平求职平台 - 部署指南

## 技术栈

- **前端**: Next.js 14 (App Router) + TypeScript + Tailwind CSS
- **后端**: Next.js API Routes + Server Components
- **数据库**: SQLite（开发） / Turso (libSQL)（生产）
- **ORM**: Prisma
- **抓取**: cheerio + rss-parser + APScheduler (Node.js 实现)

---

## 本地开发

### 1. 安装依赖

```bash
npm install
```

### 2. 配置环境变量

复制 `.env.example` 为 `.env`：

```bash
cp .env.example .env
```

### 3. 初始化数据库

```bash
# 推送 schema 到数据库
npm run db:push

# 生成 Prisma Client
npx prisma generate

# 填充种子数据（50+ 条示例）
npm run db:seed
```

### 4. 启动开发服务器

```bash
npm run dev
```

访问 http://localhost:3000

---

## 部署到 Vercel

### 方式一：一键部署

1. 将代码推送到 GitHub 仓库
2. 在 Vercel 控制台点击 "New Project"
3. 导入你的仓库
4. 配置环境变量（见下方列表）
5. 点击 "Deploy"

### 方式二：Vercel CLI

```bash
npm install -g vercel
vercel
vercel env add DATABASE_URL
vercel env add ...
vercel --prod
```

### 环境变量列表

| 变量名 | 必填 | 说明 | 示例值 |
|--------|------|------|--------|
| `DATABASE_URL` | ✅ | 数据库连接串 | `file:./dev.db` (SQLite) 或 `libsql://your-db.turso.io` (Turso) |
| `BING_SEARCH_API_KEY` | ❌ | Bing 搜索 API Key，用于发现新职位 | `xxxxxxxxxxxx` |
| `BING_SEARCH_ENDPOINT` | ❌ | Bing 搜索 API 端点 | `https://api.bing.microsoft.com/v7.0/search` |
| `OPENAI_API_KEY` | ❌ | OpenAI API Key，用于 LLM 增强解析 | `sk-xxxxxxxxxx` |
| `OPENAI_MODEL` | ❌ | 使用的 OpenAI 模型 | `gpt-3.5-turbo` |
| `NEXT_PUBLIC_SITE_NAME` | ❌ | 站点名称 | `FairJob 公平求职` |
| `NEXT_PUBLIC_SITE_URL` | ❌ | 站点 URL | `https://your-domain.com` |

### 数据库选择

#### SQLite（开发/小型部署）

```
DATABASE_URL="file:./dev.db"
```

- 优点：简单，无需额外服务
- 缺点：Vercel Serverless 环境下文件系统不可持久化
- 注意：Vercel 部署 SQLite 数据会在每次部署后重置，仅适合演示

#### Turso（推荐生产）

使用 Turso 分布式 SQLite（免费层足够）：

```
DATABASE_URL="libsql://your-db-name.turso.io"
TURSO_AUTH_TOKEN="your-auth-token"
```

### 定时抓取配置

Vercel 支持 Cron Jobs（在 `vercel.json` 中已配置）：

- 默认每 2 小时触发一次 `/api/cron`
- 免费层有调用次数限制，请根据需要调整

**手动触发**：
```bash
curl -X POST https://your-domain.com/api/cron
```

---

## 项目结构

```
.
├── app/                    # Next.js App Router
│   ├── admin/              # 管理后台
│   │   ├── sources/        # 数据源管理
│   │   ├── review/         # 学历待审核
│   │   └── stats/          # 数据统计
│   ├── api/                # API 路由
│   ├── calendar/           # 校招日历
│   ├── random/             # 随机探索
│   ├── globals.css
│   ├── layout.tsx
│   └── page.tsx            # 首页
├── components/             # React 组件
├── lib/                    # 工具库
│   ├── crawlers/           # 抓取器
│   ├── parsers/            # 解析器
│   ├── services/           # 业务服务
│   ├── prisma.ts
│   └── utils.ts
├── prisma/                 # Prisma
│   ├── schema.prisma
│   └── seed.ts
├── data/                   # 数据配置
│   ├── universities.txt    # 高校列表
│   └── enterprise_sites.yaml # 企业列表
├── package.json
├── prisma/
├── tailwind.config.ts
├── tsconfig.json
└── vercel.json
```

---

## 功能模块说明

### 1. 通用职位解析器 (UniversalJobParser)

- 文件: `lib/parsers/universal-job-parser.ts`
- 特性:
  - 不依赖固定 CSS 选择器，自动适配各种招聘页面
  - 文本密度分析 + 关键词定位 + 结构启发式
  - 6 级学历自动分类（含冲突检测）
  - 置信度评分机制
  - 可选 LLM 增强（低置信度条目）

### 2. 多渠道数据源

- **国家24365平台**: 通用解析器抓取（`SourceType.OFFICIAL_PLATFORM`）
- **高校就业网**: 配置在 `data/universities.txt`
- **企业官网**: 配置在 `data/enterprise_sites.yaml`
- **Bing 搜索发现**: `BingSearchDiscovery` 类
- **RSS 源**: `RssCrawler` 类

### 3. 反算法设计

- 默认按发布时间倒序，永不根据用户行为调整
- 不记录用户偏好，筛选条件仅通过 URL 参数传递
- 随机探索功能打破信息茧房
- 低调公司推荐挖掘曝光少的优质机会

### 4. 去重与合并

- 基于 Dice Coefficient 的 (公司+职位+地点) 相似度算法
- 阈值 0.9 以上视为同一职位
- 合并后保留所有来源信息，展示"多来源"标签

### 5. 管理后台

- 数据源管理：添加/启用/禁用/抓取测试
- 学历待审核：人工确认低置信度职位的学历
- 数据统计：各维度统计 + 抓取日志

---

## 法律与合规

⚠️ **重要提示**：使用本软件请遵守以下原则：

1. **仅抓取公开页面**：不抓取需要登录或付费的内容
2. **遵守 robots.txt**：抓取器会自动检查并遵守 robots.txt
3. **请求间隔**：每个域名请求间隔 ≥ 8 秒
4. **保留原始链接**：所有职位都标注来源并可跳转至原始页面
5. **非商业用途**：仅用于个人求职用途
6. **禁止破解**：不绕过 IP 封锁、验证码等保护措施

---

## 从 SQLite 切换到 Turso

1. 注册 Turso 并创建数据库：https://turso.tech

2. 获取数据库 URL 和 Token：
   ```bash
   turso db show your-db-name --url
   turso db tokens create your-db-name
   ```

3. 更新环境变量：
   ```
   DATABASE_URL="libsql://your-db-name.turso.io"
   TURSO_AUTH_TOKEN="your-token"
   ```

4. 推送 schema：
   ```bash
   npx prisma db push
   ```

---

## 阶段三更新说明

### 新增功能

#### 1. 网申截止倒计时
- **模型**: `Event` - 公司、岗位、截止日期、目标学历、链接
- **页面**:
  - 首页侧边栏「即将截止」小组件（未来14天）
  - `/admin/events` - 管理后台快速添加表单
- **手动录入**: 因为自动抓取截止日期极易出错，所以采用手动录入，30秒即可添加

#### 2. 收藏夹 + 一键导出
- **模型**: `Favorite` - 收藏的职位信息（冗余存储，职位删除不影响）
- **页面**: `/favorites` - 我的收藏页面
- **功能**:
  - 职位卡片右下角 ☆ 按钮一键收藏
  - 按学历、类型筛选
  - 全选 / 批量删除
  - **导出 Excel**：导出为带 BOM 的 UTF-8 CSV，Excel/WPS/Numbers 完美兼容，包含列：
    - 公司、岗位、学历要求、地点、类型、来源、链接、收藏时间
- **本地缓存**: 用 localStorage 缓存收藏状态，刷新页面也能看到是否已收藏

#### 3. 每周新公司
- **算法**: 对比本周 vs 上周首次出现的公司
- **展示**: 首页筛选栏下方横向滚动标签组
- **交互**: 点击公司名自动搜索该公司全部岗位
- **位置**: 筛选栏与职位列表之间，绿色主题

### 升级步骤

从阶段二升级到阶段三：

```bash
# 1. 拉取新代码后，推送数据库变更
npm run db:push

# 2. 重新运行种子（可选，会清空旧数据）
npm run db:seed

# 3. 启动
npm run dev
```

### 新增文件清单

```
app/
├── favorites/page.tsx              # 收藏夹页面
├── admin/events/page.tsx           # 网申截止管理
└── api/
    ├── favorites/
    │   ├── route.ts                # 获取收藏列表
    │   ├── add/route.ts            # 添加收藏
    │   └── remove/route.ts         # 取消收藏
    └── admin/events/
        ├── route.ts                # 事件 CRUD
        └── [id]/delete/route.ts    # 删除事件

components/
├── DeadlineWidget.tsx              # 即将截止侧边栏
├── FavoriteButton.tsx              # 收藏按钮
└── NewCompaniesWidget.tsx          # 本周新公司标签组

lib/
└── services/
    └── event-service.ts            # 网申事件服务
```

---

## 阶段四：部署上线与自动化运营

### 目标
让平台从 demo 变成每天打开就能用的求职雷达，无需人工干预。

---

### 一、部署方案

#### 推荐的数据库选择

| 方案 | 免费额度 | 优点 | 缺点 |
|------|----------|------|------|
| **Turso**（推荐） | 9GB 存储，5000 次读/天 | 分布式 SQLite，兼容 Prisma，免费 | 写入次数有限制 |
| **Vercel Postgres** | 1GB 存储，无限次读写 | 与 Vercel 深度集成，稳定 | 超出免费额度需付费 |
| **Neon** | 3GB 存储，按需计算 | PostgreSQL，Serverless | 冷启动有延迟 |

#### Turso 部署步骤（推荐）

1. **注册 Turso**：https://turso.tech
2. **创建数据库**：
   ```bash
   # 安装 Turso CLI
   curl -sSfL https://get.tur.so/install.sh | bash

   # 创建数据库
   turso db create fairjob

   # 获取连接 URL
   turso db show fairjob --url
   ```

3. **配置环境变量**：
   ```
   DATABASE_URL="libsql://fairjob-your-username.turso.io"
   TURSO_AUTH_TOKEN="your-auth-token"
   ```

4. **修改 prisma/schema.prisma**：
   ```prisma
   datasource db {
     provider = "sqlite"
     url      = env("DATABASE_URL")
     directUrl = env("TURSO_AUTH_TOKEN")
   }
   ```

5. **部署**：
   ```bash
   vercel env add DATABASE_URL
   vercel env add TURSO_AUTH_TOKEN
   vercel --prod
   ```

#### SQLite 快速上线（临时演示）

如果只是快速演示，不在意数据持久化：

```
DATABASE_URL="file:./dev.db"
```

注意：Vercel Serverless 环境下文件系统不可持久化，每次部署后数据会重置。

---

### 二、定时任务配置

#### Vercel Cron Jobs（已配置）

在 `vercel.json` 中配置了以下任务：

| 任务 | 路径 | 时间 | 说明 |
|------|------|------|------|
| 增量抓取 | `/api/cron/incremental-crawl` | 每小时 | 遍历所有活跃数据源 |
| 学历回填 | `/api/cron/education-backfill` | 每天 03:00 | 处理 UNKNOWN 学历 |
| 去重清理 | `/api/cron/cleanup` | 每天 04:00 | 合并重复、清理过期 |
| 截止提醒 | `/api/cron/deadline-reminder` | 每天 09:00 | 发送推送通知 |

#### GitHub Actions 备份

如果 Vercel Cron 不可用，`.github/workflows/cron.yml` 会自动运行相同任务。

**设置 Secrets**（在 GitHub 仓库 Settings → Secrets 中）：

| Secret 名称 | 说明 |
|-------------|------|
| `DATABASE_URL` | 数据库连接串 |
| `VERCEL_URL` | 你的 Vercel 部署地址 |
| `CRON_SECRET` | 定时任务认证密钥 |
| `BARK_WEBHOOK_URL` | Bark 推送 URL（可选） |
| `SERVERCHAN_SENDKEY` | Server酱 SendKey（可选） |

---

### 三、监控与告警

#### 健康检查端点

```
GET /api/health
```

返回示例：
```json
{
  "ok": true,
  "timestamp": "2026-06-25T12:00:00Z",
  "database": "connected",
  "stats": {
    "totalJobs": 1234,
    "totalSources": 25,
    "pendingReview": 56,
    "totalEvents": 7
  },
  "sources": [...],
  "alerts": {
    "critical": [],
    "urgentEvents": 3
  }
}
```

#### Webhook 通知

支持三种推送渠道（可同时配置）：

1. **Bark**（iOS 推送）：
   - 前往 https://day.app 注册获取 Key
   - 设置 `BARK_WEBHOOK_URL=https://api.day.app/你的KEY`

2. **Server酱**（微信推送）：
   - 前往 https://sct.ftqq.com 注册
   - 设置 `SERVERCHAN_SENDKEY=你的SendKey`

3. **钉钉机器人**：
   - 在钉钉群中添加自定义机器人
   - 复制 Webhook URL 设置 `DINGTALK_WEBHOOK_URL`

#### 告警规则
- 某个数据源连续失败 3 次 → 发送告警
- 抓取任务完成后自动发送每日报告

---

### 四、初始化全量抓取

**重要**：部署后运行一次，快速获取大量历史岗位。

```bash
# 1. 先在本地测试（使用线上数据库）
DATABASE_URL="你的线上数据库URL" TURSO_AUTH_TOKEN="..." npm run db:init

# 2. 如果本地内存不足，可以分段执行
# 每次修改 scripts/init-full-scrape.ts 中的 MAX_PAGES_PER_SOURCE
```

脚本会自动：
- 初始化默认数据源（24365、应届生求职网等）
- 读取 `data/universities.txt` 中的高校就业网
- 读取 `data/enterprise_sites.yaml` 中的企业官网
- 每个源间隔 10 秒，遵守 robots.txt
- 生成详细报告（学历分布、来源分布）

---

### 五、部署后检查清单

#### 功能验证

- [ ] 首页能正常加载职位列表
- [ ] 筛选功能正常（学历、城市、关键词）
- [ ] 本/专科专属筛选按钮工作正常
- [ ] 随机探索按钮每次返回不同结果
- [ ] 低调公司推荐正常显示
- [ ] 收藏功能正常（点击 ☆ 后显示已收藏）
- [ ] 收藏夹页面能导出 CSV
- [ ] 截止倒计时侧边栏显示正确
- [ ] 管理后台能正常访问

#### 定时任务验证

- [ ] `/api/health` 返回 200 且数据库连接正常
- [ ] 手动访问 `/api/cron/incremental-crawl` 能触发抓取
- [ ] 抓取完成后查看 `/admin/sources` 状态更新

#### 移动端验证

- [ ] 手机访问 https://your-domain.vercel.app
- [ ] 筛选栏下拉菜单能正常弹出
- [ ] 职位卡片触控区域足够大
- [ ] 页面在 375px、414px 等常见手机分辨率下正常

#### 告警验证

- [ ] 配置 Bark/Server酱 后能收到推送
- [ ] 数据源连续失败时能收到告警

---

### 六、完整环境变量清单

```bash
# ==================== 数据库 ====================
DATABASE_URL="libsql://your-db.turso.io"          # 数据库连接
TURSO_AUTH_TOKEN="your-auth-token"               # Turso 认证 Token

# ==================== 抓取配置 ====================
CRAWL_DELAY_SECONDS=10                           # 请求间隔（秒）
MAX_CONCURRENT_REQUESTS=3                        # 最大并发
MAX_JOBS_PER_SOURCE=200                          # 单源最大职位数

# ==================== API Keys ====================
BING_SEARCH_API_KEY=""                           # Bing 搜索（可选）
OPENAI_API_KEY=""                                # LLM 增强（可选）

# ==================== 监控告警 ====================
BARK_WEBHOOK_URL=""                              # Bark iOS 推送
SERVERCHAN_SENDKEY=""                            # Server酱微信推送
DINGTALK_WEBHOOK_URL=""                          # 钉钉机器人
ALERT_FAILURE_THRESHOLD=3                        # 连续失败告警阈值

# ==================== 定时任务 ====================
CRON_SECRET="your-random-secret"                 # 定时任务认证密钥

# ==================== 站点配置 ====================
NEXT_PUBLIC_SITE_NAME="FairJob"
NEXT_PUBLIC_SITE_URL="https://your-domain.vercel.app"
```

---

### 七、Vercel 环境变量配置步骤

1. 进入 Vercel Dashboard → 你的 Project → Settings → Environment Variables
2. 逐个添加以下变量（全部添加，不要只加生产）：
   - `DATABASE_URL`
   - `TURSO_AUTH_TOKEN`（如果用 Turso）
   - `BARK_WEBHOOK_URL`（可选）
   - `SERVERCHAN_SENDKEY`（可选）
   - `CRON_SECRET`（手动生成一个随机字符串）

3. 添加后重新部署：
   ```bash
   vercel --prod
   ```

4. 验证 Cron Jobs：
   - Vercel Dashboard → Project → Cron Jobs
   - 应该看到 4 个任务

---

### 八、新增文件清单

```
vercel.json                        ← 更新：4 个 Cron Jobs
.env.example                       ← 更新：完整环境变量说明
.github/workflows/cron.yml         ← 新增：GitHub Actions 备份

app/api/
├── health/route.ts               ← 新增：健康检查端点
├── cron/
│   ├── incremental-crawl/route.ts  ← 新增：增量抓取
│   ├── education-backfill/route.ts ← 新增：学历回填
│   ├── cleanup/route.ts            ← 新增：去重清理
│   └── deadline-reminder/route.ts  ← 新增：截止提醒
└── deadlines/today/route.ts       ← 新增：公开截止列表

lib/services/
├── monitoring.ts                   ← 新增：Webhook 告警服务

scripts/
└── init-full-scrape.ts            ← 新增：初始化全量抓取

app/globals.css                     ← 更新：移动端优化样式
```
